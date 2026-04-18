/**
 * Carbonlite — Background Service Worker
 * Tracks resource loading per tab, calculates carbon, updates badge.
 * Security: Phase 10 (sender validation, incognito, circuit breaker) + Phase 12
 * (activeTab/scripting, opt-in API, setTimeout debounce, no silent catches).
 */
importScripts("libs/co2.js", "libs/constants.js", "libs/classifier.js", "libs/recommendations.js", "libs/grading.js");

// ── State ──────────────────────────────────────────────
const tabData = new Map();
const incognitoTabs = new Set();
const GREEN_HOSTING_TTL = 24 * 60 * 60 * 1000;
const STORAGE_QUOTA = 5_000_000;
const STORAGE_HIGH_WATERMARK = 0.8 * STORAGE_QUOTA; // 4_000_000
const STORAGE_LOW_WATERMARK = 0.6 * STORAGE_QUOTA;
const THIRTY_DAYS_MS = 30 * 86400000;
const DEBOUNCE_MS = 500;
const calcTimers = new Map(); // AC-P12-010: setTimeout-based debounce
const HOSTNAME_RE = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i; // AC-P10-002
const activatedTabs = new Set(); // AC-P13-003: only process user-activated tabs
const perfDataTimestamps = new Map(); // AC-P13-007: rate limit PERFORMANCE_DATA
const PERF_DATA_MIN_INTERVAL = 2000; // AC-P13-007: 2s minimum between messages per tab

let apiFailCount = 0; // AC-P10-010: circuit breaker
const API_BACKOFF_MAX = 5;
const restorePromise = restoreTabData().catch((e) => { console.warn("Carbonlite: initial restore failed:", e.message); }); // AC-P12-015: race guard

// ── Tab Data Management ────────────────────────────────
function initTab(tabId, url) {
  tabData.set(tabId, {
    url, resources: [], totalBytes: 0,
    byType: { images: { bytes: 0, count: 0 }, javascript: { bytes: 0, count: 0 }, css: { bytes: 0, count: 0 }, fonts: { bytes: 0, count: 0 }, html: { bytes: 0, count: 0 }, other: { bytes: 0, count: 0 } },
    thirdParty: { bytes: 0, count: 0, scripts: [] },
    greenHosting: null, hostingProvider: null, calculatedAt: null, result: null,
    lazyLoadAudit: null, fontInfo: null, coverage: null,
  });
  persistTab(tabId);
}

function persistTab(tabId) {
  const data = tabData.get(tabId);
  if (!data) return;
  chrome.storage.session.set({ [`tab_${tabId}`]: {
    url: data.url, totalBytes: data.totalBytes, byType: data.byType,
    thirdParty: { bytes: data.thirdParty.bytes, count: data.thirdParty.count, scripts: [] },
    greenHosting: data.greenHosting, hostingProvider: data.hostingProvider,
    calculatedAt: data.calculatedAt, result: data.result, resources: [],
  } }).catch((e) => { console.warn("Carbonlite: session write failed:", e.message); });
}

async function restoreTabData() {
  try {
    const all = await chrome.storage.session.get(null);
    for (const [key, v] of Object.entries(all)) {
      if (!key.startsWith("tab_") || !v?.url) continue;
      const tabId = parseInt(key.replace("tab_", ""), 10);
      if (isNaN(tabId)) continue;
      tabData.set(tabId, {
        url: v.url, resources: v.resources || [], totalBytes: v.totalBytes || 0,
        byType: v.byType || { images: { bytes: 0, count: 0 }, javascript: { bytes: 0, count: 0 }, css: { bytes: 0, count: 0 }, fonts: { bytes: 0, count: 0 }, html: { bytes: 0, count: 0 }, other: { bytes: 0, count: 0 } },
        thirdParty: v.thirdParty || { bytes: 0, count: 0, scripts: [] },
        greenHosting: v.greenHosting ?? null, hostingProvider: v.hostingProvider ?? null,
        calculatedAt: v.calculatedAt ?? null, result: v.result ?? null,
        lazyLoadAudit: null, fontInfo: null, coverage: null,
      });
    }
    // AC-P13-003: Restore activated tabs from session storage
    try {
      const sess = await chrome.storage.session.get("activatedTabs");
      if (Array.isArray(sess.activatedTabs)) {
        for (const id of sess.activatedTabs) activatedTabs.add(id);
      }
    } catch (e) { console.warn("Carbonlite: activated tabs restore failed:", e.message); }
  } catch (e) { console.warn("Carbonlite: restore failed:", e.message); }
  // AC-P13-006: Re-schedule calculations for tabs with data but no result
  for (const [tabId, data] of tabData) {
    if (data.totalBytes > 0 && !data.result) {
      scheduleCalculation(tabId);
    }
  }
}

// ── Badge ──────────────────────────────────────────────
function updateBadge(tabId, text, color) {
  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({ tabId, color });
}
function showLoadingBadge(tabId) { updateBadge(tabId, "···", BADGE_COLORS.loading); }
function showGradeBadge(tabId, grade) {
  if (!grade || typeof grade !== "object") return;
  updateBadge(tabId, grade.grade, grade.color);
}
function showErrorBadge(tabId) { updateBadge(tabId, "—", BADGE_COLORS.error); }

// ── Green Hosting (cached, AC-P1-013, AC-P10-010: circuit breaker, AC-P12-004: opt-in) ──
async function checkGreenHosting(url) {
  // AC-P10-010: Skip API call if circuit breaker is open
  if (apiFailCount >= API_BACKOFF_MAX) return { green: null, provider: null };
  try {
    const hostname = new URL(url).hostname;
    const cacheKey = `greenHosting_${hostname}`;
    const cached = await chrome.storage.local.get(cacheKey);
    const entry = cached[cacheKey];
    if (entry && (Date.now() - entry.ts) < GREEN_HOSTING_TTL) return { green: entry.green, provider: entry.provider };
    const response = await fetch(`https://api.thegreenwebfoundation.org/greencheck/${hostname}`);
    if (!response.ok) { apiFailCount++; return { green: null, provider: null }; }
    const data = await response.json();
    const result = { green: data.green || false, provider: data.hosted_by || null };
    await chrome.storage.local.set({ [cacheKey]: { ...result, ts: Date.now() } });
    apiFailCount = 0; // Reset on success
    return result;
  } catch (e) { apiFailCount++; console.warn("Carbonlite: green hosting check failed:", e.message); return { green: null, provider: null }; }
}

// ── Debounced Calculate (AC-P1-003, AC-P12-010: setTimeout) ──
function scheduleCalculation(tabId) {
  if (calcTimers.has(tabId)) {
    clearTimeout(calcTimers.get(tabId));
  }
  calcTimers.set(tabId, setTimeout(() => {
    calcTimers.delete(tabId);
    calculateForTab(tabId);
  }, DEBOUNCE_MS));
}

// AC-P13-002: Replaced chrome.notifications with in-panel toast forwarding
function notifyPanel(id, title, message) {
  try {
    chrome.runtime.sendMessage({ type: "SHOW_TOAST", toastType: id.startsWith("budget") ? "budget" : "regression", title, message }, () => { chrome.runtime.lastError; });
  } catch (e) { console.warn("Carbonlite: panel toast failed:", e.message); }
}

// ── Calculate & Broadcast (AC-P13-009: single settings read) ──
async function calculateForTab(tabId) {
  const data = tabData.get(tabId);
  if (!data?.url) return;
  const isIncognito = incognitoTabs.has(tabId);
  // AC-P2-009: Handle unsupported URL schemes gracefully
  if (/^(chrome|chrome-extension|about|file):/.test(data.url)) { showErrorBadge(tabId); return; }

  // AC-P13-009: Single settings read for the entire function
  let settings = {};
  try { const s = await chrome.storage.local.get("settings"); settings = s.settings || {}; }
  catch (e) { console.warn("Carbonlite: settings read failed:", e.message); }

  // AC-P12-004/006: Only check green hosting if user opted in AND not incognito
  if (data.greenHosting === null && !isIncognito && settings.greenHostingCheck === true) {
    const h = await checkGreenHosting(data.url);
    data.greenHosting = h.green; data.hostingProvider = h.provider;
  }

  const gridIntensity = settings.gridIntensity || null;
  const calcOptions = { greenHosting: data.greenHosting === true, firstVisit: true };
  if (gridIntensity) calcOptions.gridIntensity = gridIntensity;
  const result = CO2.calculate(data.totalBytes, calcOptions);
  const grade = CO2.getGrade(result.co2);
  const percentile = CO2.getPercentile(result.co2);
  data.result = {
    co2: result.co2, firstVisitCO2: result.firstVisitCO2, returnVisitCO2: result.returnVisitCO2,
    grade, percentile, totalBytes: data.totalBytes, byType: data.byType,
    thirdParty: data.thirdParty, greenHosting: data.greenHosting, hostingProvider: data.hostingProvider,
    requestCount: data.resources.length, recommendations: generateRecommendations(data, result),
    url: data.url, calculatedAt: Date.now(),
  };
  data.calculatedAt = Date.now();

  if (settings.showBadge !== false) showGradeBadge(tabId, grade);
  chrome.action.setTitle({ tabId, title: `${CO2.formatCO2(result.co2)} CO2 per visit · Grade ${grade.grade}` });

  // AC-P12-016: Budget check with Number.isFinite guard
  try {
    const budget = Number(settings.carbonBudget);
    if (Number.isFinite(budget) && budget > 0 && result.co2 > budget) {
      data.result.budgetExceeded = true; data.result.carbonBudget = budget;
      // AC-P13-002: In-panel toast instead of chrome.notifications
      notifyPanel(`budget-${tabId}`, "Carbon Budget Exceeded", `${new URL(data.url).hostname} emits ${CO2.formatCO2(result.co2)} CO2 — exceeds your ${budget}g budget`);
    }
  } catch (e) { console.warn("Carbonlite: budget check failed:", e.message); }

  // AC-P10-005: Skip history persistence for incognito tabs
  if (!isIncognito) { saveToHistory(data.url, data.result); }

  // Regression check
  try {
    const regression = await checkRegression(data.url, result.co2);
    if (regression) {
      data.result.regression = regression;
      notifyPanel(`regression-${tabId}`, "Carbon Regression Detected", `${new URL(data.url).hostname} is ${regression.increasePercent}% heavier than last week`);
    }
  } catch (e) { console.warn("Carbonlite: regression check failed:", e.message); }

  persistTab(tabId);
  try { chrome.runtime.sendMessage({ type: "ANALYSIS_COMPLETE", tabId, data: data.result }, () => { chrome.runtime.lastError; }); } catch (e) { console.warn("Carbonlite: broadcast failed:", e.message); }
}

// ── Regression Detection ───────────────────────────────
async function checkRegression(url, currentCO2) {
  try {
    const { hostname, pathname } = new URL(url);
    const stored = await chrome.storage.local.get(`history_${hostname}`);
    const history = stored[`history_${hostname}`] || [];
    const oneWeekAgo = Date.now() - 7 * 86400000;
    const old = history.filter((h) => h.path === pathname && h.timestamp < oneWeekAgo);
    if (old.length < 2) return null;
    const avg = old.reduce((s, h) => s + h.co2, 0) / old.length;
    const pct = ((currentCO2 - avg) / avg) * 100;
    if (pct > 20) return { oldAvg: avg, current: currentCO2, increasePercent: Math.round(pct) };
  } catch (e) { console.warn("Carbonlite: regression detection failed:", e.message); }
  return null;
}

// ── History (AC-P8-011: 30-day prune, AC-P8-012: quota check) ──
async function saveToHistory(url, result) {
  try {
    const { hostname, pathname } = new URL(url);
    const key = `history_${hostname}`;
    const stored = await chrome.storage.local.get(key);
    let history = stored[key] || [];
    history.push({ co2: result.co2, grade: result.grade.grade, totalBytes: result.totalBytes, timestamp: Date.now(), path: pathname, _version: 1 });
    history = history.filter((h) => h.timestamp >= Date.now() - THIRTY_DAYS_MS);
    if (history.length > 100) history.splice(0, history.length - 100);
    try {
      const bytesInUse = await chrome.storage.local.getBytesInUse(null);
      if (bytesInUse > STORAGE_HIGH_WATERMARK) {
        console.warn(`Carbonlite: Storage at ${Math.round(bytesInUse / 1_000_000)}MB — pruning old history`);
        await pruneOldestHistory();
      }
    } catch (e) { console.warn("Carbonlite: quota check failed:", e.message); }
    await chrome.storage.local.set({ [key]: history });
  } catch (e) { console.warn("Carbonlite: history save failed:", e.message); }
}

// AC-P12-014: Efficient pruning — no getBytesInUse inside the loop
async function pruneOldestHistory() {
  try {
    const all = await chrome.storage.local.get(null);
    const entries = [];
    for (const k of Object.keys(all).filter((k) => k.startsWith("history_"))) {
      for (const h of all[k] || []) entries.push({ key: k, timestamp: h.timestamp });
    }
    entries.sort((a, b) => a.timestamp - b.timestamp);
    // Remove the oldest 200 entries in one pass (no per-iteration getBytesInUse)
    const keysToUpdate = new Set();
    const toRemove = Math.min(entries.length, 200);
    for (let i = 0; i < toRemove; i++) {
      all[entries[i].key] = (all[entries[i].key] || []).filter((h) => h.timestamp !== entries[i].timestamp);
      keysToUpdate.add(entries[i].key);
    }
    // AC-P13-010: Batch all updates into a single write
    const batch = {};
    for (const key of keysToUpdate) batch[key] = all[key];
    await chrome.storage.local.set(batch);
  } catch (e) { console.warn("Carbonlite: history pruning failed:", e.message); }
}

// ── Activated Tab Tracking (AC-P13-003) ──────────────
function activateTab(tabId) {
  activatedTabs.add(tabId);
  chrome.storage.session.set({ activatedTabs: [...activatedTabs] }).catch((e) => {
    console.warn("Carbonlite: activated tabs persist failed:", e.message);
  });
}

// ── Event Listeners ────────────────────────────────────
// AC-P12-015: Await restore before processing navigation
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  await restorePromise;
  // AC-P13-004: Full incognito skip
  try {
    const tab = await chrome.tabs.get(details.tabId);
    if (tab.incognito) { incognitoTabs.add(details.tabId); return; }
    incognitoTabs.delete(details.tabId);
  } catch { return; /* tab may have closed */ }
  initTab(details.tabId, details.url);
  showLoadingBadge(details.tabId);
});

// AC-P12-003/AC-P13-003: Content script injection only for activated, non-incognito tabs
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  // AC-P13-004: Skip incognito tabs
  if (incognitoTabs.has(details.tabId)) return;
  const stored = await chrome.storage.local.get("settings").catch(() => ({}));
  if (stored.settings?.autoAnalyze === false) return;
  // Content script is injected automatically via manifest.json content_scripts
  scheduleCalculation(details.tabId);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabData.delete(tabId); incognitoTabs.delete(tabId);
  activatedTabs.delete(tabId); // AC-P13-003
  perfDataTimestamps.delete(tabId); // AC-P13-007
  if (calcTimers.has(tabId)) { clearTimeout(calcTimers.get(tabId)); calcTimers.delete(tabId); }
  chrome.storage.session.remove(`tab_${tabId}`).catch((e) => { console.warn("Carbonlite: tab cleanup failed:", e.message); });
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  // Close side panel on non-http pages (new tab, chrome://, etc.)
  try {
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url || tab.pendingUrl || "";
    const isHttp = url.startsWith("http://") || url.startsWith("https://");
    if (!isHttp) {
      chrome.sidePanel.close({ windowId: tab.windowId }).catch(() => {});
    }
  } catch { /* tab may have closed */ }

  const data = tabData.get(tabId);
  if (data?.result) {
    showGradeBadge(tabId, data.result.grade);
    try { chrome.runtime.sendMessage({ type: "ANALYSIS_COMPLETE", tabId, data: data.result }, () => { chrome.runtime.lastError; }); } catch (e) { /* panel may not be open */ }
    return;
  }
  try {
    const s = await chrome.storage.session.get(`tab_${tabId}`);
    const stored = s[`tab_${tabId}`];
    if (stored?.result) {
      if (stored.result.grade) showGradeBadge(tabId, stored.result.grade);
      try { chrome.runtime.sendMessage({ type: "ANALYSIS_COMPLETE", tabId, data: stored.result }, () => { chrome.runtime.lastError; }); } catch (e) { /* panel may not be open */ }
    }
  } catch (e) { console.warn("Carbonlite: badge restore failed:", e.message); }
});

// ── Message Handling (hardened, AC-P10-001/002/003, AC-P13-005/007) ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // AC-P10-001: Reject messages from foreign extensions
  if (sender.id !== chrome.runtime.id) return;
  if (!message || typeof message.type !== "string") return;

  // AC-P10-003: Validate sender.tab for PERFORMANCE_DATA
  if (message.type === "PERFORMANCE_DATA" && sender.tab && typeof sender.tab.id === "number") {
    const senderUrl = sender.url || "";
    if (senderUrl.startsWith("http://") || senderUrl.startsWith("https://")) {
      // AC-P13-007: Rate limit per tab
      const now = Date.now();
      const last = perfDataTimestamps.get(sender.tab.id) || 0;
      if (now - last < PERF_DATA_MIN_INTERVAL) return;
      perfDataTimestamps.set(sender.tab.id, now);
      handlePerformanceData(message, sender);
    }
    return;
  }

  // AC-P13-005: Extension-page messages must originate from our own extension pages
  const extensionOrigin = `chrome-extension://${chrome.runtime.id}/`;
  if (!sender.url?.startsWith(extensionOrigin)) return;

  if (message.type === "GET_TAB_DATA") {
    handleGetTabData(sendResponse);
    return true;
  }

  if (message.type === "GET_HISTORY") {
    // AC-P10-002: Validate hostname before using as storage key
    const h = message.hostname;
    if (typeof h !== "string" || !HOSTNAME_RE.test(h) || h.length > 253) {
      sendResponse([]);
      return true;
    }
    chrome.storage.local.get(`history_${h}`, (s) => sendResponse(s[`history_${h}`] || []));
    return true;
  }
});

function handlePerformanceData(msg, sender) {
  const tabId = sender.tab.id;
  const data = tabData.get(tabId);
  if (!data) return;
  if (data.resources.length > 1000) data.resources.splice(0, data.resources.length - 1000);
  if (!Array.isArray(msg.resources)) return;
  for (const e of msg.resources) {
    const size = e.transferSize || e.encodedBodySize || e.decodedBodySize || 0;
    const type = classifyResource(e.name, e.initiatorType);
    const tp = isThirdParty(e.name, data.url);
    const res = { url: e.name, size, type, thirdParty: tp, cached: e.transferSize === 0 && e.decodedBodySize > 0 };
    data.resources.push(res); data.totalBytes += size;
    if (data.byType[type]) { data.byType[type].bytes += size; data.byType[type].count++; }
    if (tp) { data.thirdParty.bytes += size; data.thirdParty.count++; if (type === "javascript") data.thirdParty.scripts.push(res); }
  }
  if (msg.lazyLoadAudit) data.lazyLoadAudit = msg.lazyLoadAudit;
  if (msg.fontInfo) data.fontInfo = msg.fontInfo;
  if (msg.coverage) data.coverage = msg.coverage;
  persistTab(tabId); scheduleCalculation(tabId);
}

function handleGetTabData(sendResponse) {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (!tabs[0]) { sendResponse(null); return; }
    const tabId = tabs[0].id;
    // AC-P13-003: Activate tab on first side panel data request
    ensureTabActivated(tabId);
    const data = tabData.get(tabId);
    if (data?.result) { sendResponse(data.result); return; }
    try { const s = await chrome.storage.session.get(`tab_${tabId}`); sendResponse(s[`tab_${tabId}`] || null); } catch (e) { console.warn("Carbonlite: tab data read failed:", e.message); sendResponse(null); }
  });
}

// ── Side Panel & Onboarding ────────────────────────────
// AC-P13-003: Activate tab when side panel opens (on-demand)
// Note: openPanelOnActionClick=true means onClicked does NOT fire.
// Use tabs.onActivated + sidePanel behavior to detect panel usage.
// We also use webNavigation.onCompleted as a trigger — if a tab is already activated,
// it will auto-inject. For first activation, we rely on the side panel's
// requestCurrentData() → GET_TAB_DATA flow to trigger injection.

// When side panel requests data for a tab, activate it and inject if needed
function ensureTabActivated(tabId) {
  if (activatedTabs.has(tabId)) return;
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    if (tab.incognito) return; // AC-P13-004
    activateTab(tabId);
    if (tab.url?.startsWith("http")) {
      // Content script is injected automatically via manifest.json content_scripts
      if (!tabData.has(tabId)) initTab(tabId, tab.url);
      scheduleCalculation(tabId);
    }
  });
}
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== "install") return;
  // AC-P12-004: greenHostingCheck defaults to false (opt-in)
  chrome.storage.local.set({ settings: {
    showBadge: true, autoAnalyze: true, autoOpenSidePanel: false,
    myDomains: ["localhost"], region: "auto", gridIntensity: null,
    carbonBudget: 0, theme: "auto", onboardingComplete: false,
    greenHostingCheck: false, showNotifications: true,
  } });
  chrome.tabs.create({ url: "onboarding/onboarding.html" });
});
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((e) => { console.warn("Carbonlite: sidePanel API unavailable:", e.message); });
// AC-P8-013: Flush pending tabData writes before SW termination
chrome.runtime.onSuspend.addListener(() => {
  for (const [tabId] of tabData) persistTab(tabId);
  // AC-P13-003: Persist activated tabs
  chrome.storage.session.set({ activatedTabs: [...activatedTabs] }).catch(() => {});
});
