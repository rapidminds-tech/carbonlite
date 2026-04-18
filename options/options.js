/**
 * Carbonlite — Options Page Logic
 * No inline event handlers (Chrome MV3 CSP compliance)
 */

// REGION_INTENSITY is loaded from libs/constants.js via script tag in options.html

let domains = [];

// ── Load Settings ──────────────────────────────────
function loadSettings() {
  chrome.storage.local.get("settings", (data) => {
    const s = data.settings || {};
    document.getElementById("region").value = s.region || "auto";
    document.getElementById("theme").value = s.theme || "auto";
    document.getElementById("carbonBudget").value = String(s.carbonBudget || "0");
    document.getElementById("showBadge").checked = s.showBadge !== false;
    document.getElementById("autoAnalyze").checked = s.autoAnalyze !== false;
    document.getElementById("autoOpen").checked = s.autoOpenSidePanel || false;
    document.getElementById("greenHostingCheck").checked = s.greenHostingCheck || false;
    document.getElementById("showNotifications").checked = s.showNotifications !== false;
    domains = s.myDomains || ["localhost"];
    renderDomains();
  });

  // Load storage usage info
  chrome.storage.local.getBytesInUse(null, (bytes) => {
    const kb = (bytes / 1024).toFixed(1);
    chrome.storage.local.get(null, (all) => {
      const historyKeys = Object.keys(all).filter((k) => k.startsWith("history_"));
      document.getElementById("dataInfo").textContent =
        `${historyKeys.length} domains tracked · ${kb} KB stored`;
    });
  });
}

// ── Save Settings ──────────────────────────────────
function saveSettings() {
  const region = document.getElementById("region").value;
  const settings = {
    showBadge: document.getElementById("showBadge").checked,
    autoAnalyze: document.getElementById("autoAnalyze").checked,
    autoOpenSidePanel: document.getElementById("autoOpen").checked,
    greenHostingCheck: document.getElementById("greenHostingCheck").checked,
    showNotifications: document.getElementById("showNotifications").checked,
    theme: document.getElementById("theme").value,
    carbonBudget: Number(document.getElementById("carbonBudget").value) || 0, // AC-P13-008
    myDomains: [...domains],
    region,
    gridIntensity: REGION_INTENSITY[region] || null,
    onboardingComplete: true,
  };

  chrome.storage.local.set({ settings }, () => {
    showSavedToast();
  });
}

// AC-P11-002: Toast uses CSS animation instead of setTimeout
function showSavedToast() {
  const toast = document.getElementById("savedToast");
  toast.classList.remove("show");
  // Force reflow so re-adding class restarts animation
  void toast.offsetWidth;
  toast.classList.add("show");
  toast.addEventListener("animationend", () => {
    toast.classList.remove("show");
  }, { once: true });
}

// ── Domain Management ──────────────────────────────
function renderDomains() {
  const container = document.getElementById("domainTags");
  while (container.firstChild) container.removeChild(container.firstChild);
  domains.forEach((d) => {
    const tag = document.createElement("div");
    tag.className = "domain-tag";
    tag.textContent = d + " ";
    const remove = document.createElement("span");
    remove.className = "remove";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      domains = domains.filter((dm) => dm !== d);
      renderDomains();
      saveSettings();
    });
    tag.appendChild(remove);
    container.appendChild(tag);
  });
}

// AC-P10-008: Strict domain validation regex
const DOMAIN_RE = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;

function addDomain() {
  const input = document.getElementById("domainInput");
  const value = input.value.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!value || !DOMAIN_RE.test(value) || domains.includes(value)) return;
  domains.push(value);
  renderDomains();
  input.value = "";
  saveSettings();
}

// ── Data Export ────────────────────────────────────
function exportData() {
  chrome.storage.local.get(null, (all) => {
    const historyData = {};
    for (const [key, value] of Object.entries(all)) {
      if (key.startsWith("history_")) {
        historyData[key.replace("history_", "")] = value;
      }
    }

    const blob = new Blob([JSON.stringify(historyData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carbonlite-history-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// AC-P11-001: Custom confirmation modal (replaces browser confirm dialog)
function clearData() {
  const modal = document.getElementById("confirmModal");
  modal.classList.remove("hidden");
  // Focus the cancel button for keyboard accessibility
  document.getElementById("btnConfirmCancel").focus();
}

function confirmClearData() {
  document.getElementById("confirmModal").classList.add("hidden");
  chrome.storage.local.get(null, (all) => {
    const historyKeys = Object.keys(all).filter((k) => k.startsWith("history_"));
    chrome.storage.local.remove(historyKeys, () => {
      document.getElementById("dataInfo").textContent = "0 domains tracked · 0 KB stored";
      showSavedToast();
    });
  });
}

function cancelClearData() {
  document.getElementById("confirmModal").classList.add("hidden");
}

// ── Wire up buttons ──────────────────────────────
document.getElementById("btnAddDomain").addEventListener("click", addDomain);
document.getElementById("btnExport").addEventListener("click", exportData);
document.getElementById("btnClear").addEventListener("click", clearData);
document.getElementById("btnConfirmOk").addEventListener("click", confirmClearData);
document.getElementById("btnConfirmCancel").addEventListener("click", cancelClearData);
// Dismiss modal on Escape key
document.getElementById("confirmModal").addEventListener("keydown", (e) => {
  if (e.key === "Escape") cancelClearData();
});

// ── Auto-save on change ───────────────────────────
document.querySelectorAll("select:not([disabled]), input[type='checkbox']:not([disabled])").forEach((el) => {
  el.addEventListener("change", saveSettings);
});

document.getElementById("domainInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addDomain();
});

// ── Theme (AC-P4-009) ─────────────────────────────
function initTheme() {
  chrome.storage.local.get("settings", (data) => {
    const theme = data.settings?.theme || "auto";
    if (theme === "auto") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  });
}

// ── Init ──────────────────────────────────────────
initTheme();
loadSettings();
