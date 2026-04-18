/**
 * Background core logic — extracted for testability
 * Used by background.js service worker
 */

// ── State ──────────────────────────────────────────────
const tabData = new Map();
const GREEN_HOSTING_TTL = 24 * 60 * 60 * 1000; // 24 hours
const DEBOUNCE_MS = 500;

// Debounce timers per tabId
const calcTimers = new Map();

// Optional callback for testing — intercepts calculateForTab calls from debounce
let _calculateCallback = null;

function _setCalculateCallback(cb) {
  _calculateCallback = cb;
}

// ── Tab Data Management ────────────────────────────────

function initTab(tabId, url) {
  tabData.set(tabId, {
    url,
    resources: [],
    totalBytes: 0,
    byType: {
      images: { bytes: 0, count: 0 },
      javascript: { bytes: 0, count: 0 },
      css: { bytes: 0, count: 0 },
      fonts: { bytes: 0, count: 0 },
      html: { bytes: 0, count: 0 },
      other: { bytes: 0, count: 0 },
    },
    thirdParty: { bytes: 0, count: 0, scripts: [] },
    greenHosting: null,
    hostingProvider: null,
    calculatedAt: null,
    result: null,
    lazyLoadAudit: null,
    fontInfo: null,
    coverage: null,
  });
  persistTab(tabId);
}

function getTabData(tabId) {
  return tabData.get(tabId) || null;
}

function removeTab(tabId) {
  tabData.delete(tabId);
  if (calcTimers.has(tabId)) {
    clearTimeout(calcTimers.get(tabId));
    calcTimers.delete(tabId);
  }
  chrome.storage.session.remove(`tab_${tabId}`).catch(() => {});
}

// ── Persist tab data to chrome.storage.session (AC-P1-001) ──

function persistTab(tabId) {
  const data = tabData.get(tabId);
  if (!data) return;
  // Persist a serializable snapshot (exclude non-serializable fields)
  const snapshot = {
    url: data.url,
    totalBytes: data.totalBytes,
    byType: data.byType,
    thirdParty: { bytes: data.thirdParty.bytes, count: data.thirdParty.count, scripts: [] },
    greenHosting: data.greenHosting,
    hostingProvider: data.hostingProvider,
    calculatedAt: data.calculatedAt,
    result: data.result,
    resources: [], // Don't persist full resource list (too large)
  };
  chrome.storage.session.set({ [`tab_${tabId}`]: snapshot });
}

// ── Restore tab data from chrome.storage.session (AC-P1-002) ──

async function restoreTabData() {
  try {
    const all = await chrome.storage.session.get(null);
    for (const [key, value] of Object.entries(all)) {
      if (key.startsWith("tab_") && value && value.url) {
        const tabId = parseInt(key.replace("tab_", ""), 10);
        if (!isNaN(tabId)) {
          tabData.set(tabId, {
            url: value.url,
            resources: value.resources || [],
            totalBytes: value.totalBytes || 0,
            byType: value.byType || {
              images: { bytes: 0, count: 0 },
              javascript: { bytes: 0, count: 0 },
              css: { bytes: 0, count: 0 },
              fonts: { bytes: 0, count: 0 },
              html: { bytes: 0, count: 0 },
              other: { bytes: 0, count: 0 },
            },
            thirdParty: value.thirdParty || { bytes: 0, count: 0, scripts: [] },
            greenHosting: value.greenHosting ?? null,
            hostingProvider: value.hostingProvider ?? null,
            calculatedAt: value.calculatedAt ?? null,
            result: value.result ?? null,
            lazyLoadAudit: null,
            fontInfo: null,
            coverage: null,
          });
        }
      }
    }
  } catch {
    // Storage unavailable — start fresh
  }
}

// ── Add resource to tab (AC-P1-001: persist on every update) ──

function addResource(tabId, entry) {
  const data = tabData.get(tabId);
  if (!data) return;

  // Cap resources at 500 per tab
  if (data.resources.length > 500) return;

  const size = entry.transferSize || entry.encodedBodySize || 0;
  const type = globalThis.classifyResource
    ? globalThis.classifyResource(entry.name, entry.initiatorType)
    : "other";
  const thirdParty = globalThis.isThirdParty
    ? globalThis.isThirdParty(entry.name, data.url)
    : false;

  const resource = {
    url: entry.name,
    size,
    type,
    thirdParty,
    cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
  };

  data.resources.push(resource);
  data.totalBytes += size;

  if (data.byType[type]) {
    data.byType[type].bytes += size;
    data.byType[type].count += 1;
  }

  if (thirdParty) {
    data.thirdParty.bytes += size;
    data.thirdParty.count += 1;
    if (type === "javascript") {
      data.thirdParty.scripts.push(resource);
    }
  }

  // AC-P1-001: persist on every update
  persistTab(tabId);
}

// ── Debounced calculation (AC-P1-003) ──────────────────

function scheduleCalculation(tabId) {
  if (calcTimers.has(tabId)) {
    clearTimeout(calcTimers.get(tabId));
  }
  calcTimers.set(tabId, setTimeout(() => {
    calcTimers.delete(tabId);
    if (_calculateCallback) {
      _calculateCallback(tabId);
    } else {
      calculateForTab(tabId);
    }
  }, DEBOUNCE_MS));
}

// ── Green hosting check (cached in chrome.storage.local, AC-P1-013) ──

async function checkGreenHosting(url) {
  try {
    const hostname = new URL(url).hostname;
    const cacheKey = `greenHosting_${hostname}`;

    // Check chrome.storage.local cache first
    const cached = await chrome.storage.local.get(cacheKey);
    const entry = cached[cacheKey];
    if (entry && (Date.now() - entry.ts) < GREEN_HOSTING_TTL) {
      return { green: entry.green, provider: entry.provider };
    }

    // Fetch from API (uses hostname, not full URL — no path leakage)
    const response = await fetch(
      `https://api.thegreenwebfoundation.org/greencheck/${hostname}`
    );
    if (!response.ok) return { green: null, provider: null };
    const data = await response.json();
    const result = {
      green: data.green || false,
      provider: data.hosted_by || null,
    };

    // Cache in chrome.storage.local with timestamp
    await chrome.storage.local.set({
      [cacheKey]: { ...result, ts: Date.now() },
    });

    return result;
  } catch {
    return { green: null, provider: null };
  }
}

// ── URL validation for COMPARE_URL (AC-P1-012) ────────

function isValidCompareUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ── Calculate CO2 for a tab (AC-P1-008, AC-P1-009) ────

async function calculateForTab(tabId) {
  const data = tabData.get(tabId);
  if (!data || !data.url) return;

  if (
    data.url.startsWith("chrome://") ||
    data.url.startsWith("chrome-extension://") ||
    data.url.startsWith("about:")
  ) {
    return;
  }

  // Check green hosting (cached in storage)
  if (data.greenHosting === null) {
    const hosting = await checkGreenHosting(data.url);
    data.greenHosting = hosting.green;
    data.hostingProvider = hosting.provider;
  }

  // Read user settings for gridIntensity (AC-P1-008, AC-P1-009)
  let gridIntensity = null;
  try {
    const stored = await chrome.storage.local.get("settings");
    gridIntensity = stored.settings?.gridIntensity || null;
  } catch (e) { /* settings read failed — use defaults */ }

  const CO2 = globalThis.CO2;
  if (!CO2) return;

  // Build calculation options
  const calcOptions = {
    greenHosting: data.greenHosting === true,
    firstVisit: true,
  };
  // AC-P1-008: pass gridIntensity if user set a region
  // AC-P1-009: if null (auto), CO2.calculate uses its default (480)
  if (gridIntensity) {
    calcOptions.gridIntensity = gridIntensity;
  }

  const result = CO2.calculate(data.totalBytes, calcOptions);
  const grade = CO2.getGrade(result.co2);
  const percentile = CO2.getPercentile(result.co2);

  data.result = {
    co2: result.co2,
    firstVisitCO2: result.firstVisitCO2,
    returnVisitCO2: result.returnVisitCO2,
    grade,
    percentile,
    totalBytes: data.totalBytes,
    byType: data.byType,
    thirdParty: data.thirdParty,
    greenHosting: data.greenHosting,
    hostingProvider: data.hostingProvider,
    requestCount: data.resources.length,
    recommendations: [],
    url: data.url,
    calculatedAt: Date.now(),
  };

  data.calculatedAt = Date.now();
  persistTab(tabId);
}

// ── Exports ──────────────────────────────────────────

export {
  initTab,
  getTabData,
  removeTab,
  addResource,
  persistTab,
  restoreTabData,
  scheduleCalculation,
  calculateForTab,
  checkGreenHosting,
  isValidCompareUrl,
  _setCalculateCallback,
  DEBOUNCE_MS,
  GREEN_HOSTING_TTL,
};
