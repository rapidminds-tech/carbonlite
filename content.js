/**
 * Carbonlite — Content Script
 * Collects Performance API data, DOM metrics, and deep analysis from pages.
 * Injected into every page at document_idle.
 */

(() => {
  // ── Performance API Resources ────────────────────
  function collectPerformanceData() {
    try {
      const entries = performance.getEntriesByType("resource");
      return entries.map((entry) => ({
        // AC-P11-003: Strip query params and fragments to prevent leaking tokens/keys
        name: entry.name.split("?")[0].split("#")[0],
        initiatorType: entry.initiatorType,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
        duration: entry.duration,
        startTime: entry.startTime,
        responseEnd: entry.responseEnd,
      }));
    } catch {
      // AC-P11-005: Performance API may be blocked on some pages
      return [];
    }
  }

  // ── DOM Metrics ──────────────────────────────────
  function collectDOMMetrics() {
    return {
      totalElements: document.querySelectorAll("*").length,
      images: document.querySelectorAll("img").length,
      scripts: document.querySelectorAll("script").length,
      stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
      iframes: document.querySelectorAll("iframe").length,
      videos: document.querySelectorAll("video").length,
    };
  }

  // ── Lazy Loading Audit ───────────────────────────
  function collectLazyLoadAudit() {
    try {
      const viewportHeight = window.innerHeight;
      const images = document.querySelectorAll("img");
      const belowFoldWithoutLazy = [];

      images.forEach((img) => {
        const rect = img.getBoundingClientRect();
        // Below fold and no lazy loading
        if (
          rect.top > viewportHeight &&
          img.src &&
          !img.src.startsWith("data:") &&
          (!img.loading || img.loading !== "lazy")
        ) {
          belowFoldWithoutLazy.push({
            src: img.src,
            top: Math.round(rect.top),
          });
        }
      });

      return {
        belowFoldWithoutLazy: belowFoldWithoutLazy.slice(0, 10),
        total: images.length,
      };
    } catch {
      return { belowFoldWithoutLazy: [], total: 0 };
    }
  }

  // ── Font Detection ─────────────────────────────────
  function collectFontInfo() {
    try {
      // Collect loaded font families via document.fonts API only
      // AC-P1-014: Do NOT read document.body.innerText (privacy)
      const fontFamilies = [];
      try {
        for (const font of document.fonts.values()) {
          if (font.status === "loaded") {
            fontFamilies.push(font.family);
          }
        }
      } catch (e) { /* font enumeration not supported */ }

      // Detect script range from <html lang> attribute instead of reading page text
      const lang = (document.documentElement.lang || "").toLowerCase();
      const latinLangs = ["en", "es", "fr", "de", "it", "pt", "nl", "sv", "da", "no", "fi", "pl", "cs", "ro", "hu"];
      const textIsLatinOnly = latinLangs.some((l) => lang.startsWith(l)) || lang === "";

      return {
        textIsLatinOnly,
        fontFamilies: [...new Set(fontFamilies)],
      };
    } catch {
      return { textIsLatinOnly: false, fontFamilies: [] };
    }
  }

  // ── CSS Coverage Approximation ───────────────────
  function collectCoverageInsights() {
    try {
      const sheets = [];
      let totalRules = 0;
      let matchedRules = 0;

      for (const sheet of document.styleSheets) {
        try {
          const rules = sheet.cssRules;
          if (!rules) continue;

          let sheetTotal = 0;
          let sheetMatched = 0;

          // Sample selectors (every 5th rule, max 100 per sheet)
          for (let i = 0; i < rules.length && sheetTotal < 100; i += 5) {
            const rule = rules[i];
            if (rule.selectorText) {
              sheetTotal++;
              try {
                if (document.querySelector(rule.selectorText)) {
                  sheetMatched++;
                }
              } catch {
                // Invalid selector
              }
            }
          }

          if (sheetTotal > 0) {
            const unusedPercent = Math.round(((sheetTotal - sheetMatched) / sheetTotal) * 100);
            sheets.push({
              href: sheet.href || null,
              totalRules: sheetTotal,
              matchedRules: sheetMatched,
              unusedPercent,
            });
            totalRules += sheetTotal;
            matchedRules += sheetMatched;
          }
        } catch {
          // Cross-origin stylesheet — skip
        }
      }

      const unusedPercent = totalRules > 0
        ? Math.round(((totalRules - matchedRules) / totalRules) * 100)
        : 0;

      return {
        css: {
          totalRules,
          matchedRules,
          unusedPercent,
          sheets,
        },
      };
    } catch {
      return null;
    }
  }

  // ── Send all data to background ──────────────────
  function sendPerformanceData() {
    // AC-P2-005: Respect autoAnalyze setting — skip if disabled
    chrome.storage.local.get("settings", (stored) => {
      if (chrome.runtime.lastError) { /* storage unavailable */ return; }
      const autoAnalyze = stored.settings?.autoAnalyze;
      if (autoAnalyze === false) return;

      const resources = collectPerformanceData();
      const dom = collectDOMMetrics();
      const lazyLoadAudit = collectLazyLoadAudit();
      const fontInfo = collectFontInfo();
      const coverage = collectCoverageInsights();

      chrome.runtime.sendMessage({
        type: "PERFORMANCE_DATA",
        resources,
        dom,
        lazyLoadAudit,
        fontInfo,
        coverage,
        url: window.location.origin + window.location.pathname,
      }).catch(() => { /* side panel may not be open */ });
    });
  }

  // Listen for requests from background (AC-P12-008: sender validation)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id) return;
    if (message.type === "GET_PERFORMANCE_DATA") {
      sendPerformanceData();
      sendResponse({ ok: true });
    }
  });

  // Send data once page is ready
  if (document.readyState === "complete") {
    setTimeout(sendPerformanceData, 500);
  } else {
    window.addEventListener("load", () => {
      setTimeout(sendPerformanceData, 500);
    });
  }

  // AC-P12-012: Lightweight SPA navigation detection (replaces MutationObserver)
  // Detect back/forward navigation
  window.addEventListener("popstate", () => setTimeout(sendPerformanceData, 1000));

  // Intercept history.pushState/replaceState for SPA route changes
  const origPushState = history.pushState;
  history.pushState = function (...args) {
    origPushState.apply(this, args);
    setTimeout(sendPerformanceData, 1000);
  };
  const origReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    origReplaceState.apply(this, args);
    setTimeout(sendPerformanceData, 1000);
  };
})();
