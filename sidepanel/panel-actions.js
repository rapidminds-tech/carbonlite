/**
 * Carbonlite — Side Panel Actions
 * Render, requestCurrentData, message handling, benchmark select, init.
 */

// Benchmark select change
$("benchmarkSelect").addEventListener("change", () => {
  if (currentData) renderBenchmark(currentData);
});

// ── Main Render ────────────────────────────────────
function render(data) {
  if (!data) {
    showState("empty");
    return;
  }

  checkForImprovement(data);
  checkRegression(data);
  previousResult = currentData;
  currentData = data;

  showState("results");

  renderScore(data);
  renderSparkline(data);
  renderResourceBars(data);
  renderHosting(data);
  renderBenchmark(data);
  renderQuickRecs(data);
  renderTrend(data);
  renderTreemap(data);
  renderThirdParty(data);
  renderVisitComparison(data);
  renderFixes(data);
}

// ── Message Handling (AC-P12-009: sender validation + type guard) ──
chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.id !== chrome.runtime.id) return;
  if (message.type === "ANALYSIS_COMPLETE" && message.data && typeof message.data.co2 === "number") {
    render(message.data);
  }
  // Tab changed — re-request data for the new active tab
  if (message.type === "TAB_CHANGED") {
    requestCurrentData();
  }
  // AC-P13-002: In-panel toast for budget/regression alerts (replaces chrome.notifications)
  if (message.type === "SHOW_TOAST" && message.title && message.message) {
    const toastId = message.toastType === "budget" ? "budgetToast" : "regressionToast";
    showToast(toastId, message.message);
  }
});

function requestCurrentData() {
  showState("loading");
  chrome.runtime.sendMessage({ type: "GET_TAB_DATA" }, (data) => {
    if (data) {
      render(data);
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          const url = tabs[0].url || "";
          if (url.startsWith("chrome://") || url.startsWith("chrome-extension://") || url.startsWith("about:") || url.startsWith("file://")) {
            showState("unsupported");
          } else {
            showState("empty");
          }
        } else {
          showState("empty");
        }
      });
    }
  });
}

// ── Auto-refresh on tab switch ────────────────────
chrome.tabs.onActivated.addListener(({ tabId }) => {
  requestCurrentData();
});

// ── Init ───────────────────────────────────────────
requestCurrentData();
