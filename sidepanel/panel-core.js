/**
 * Carbonlite — Side Panel Core
 * DOM helpers, state variables, theme management, tab switching,
 * settings button, modal focus trap, CSS variable reader.
 */

// ── DOM Helpers (XSS-safe) ────────────────────────
const $ = (id) => document.getElementById(id);

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === "className") node.className = val;
    else if (key === "textContent") node.textContent = val;
    else if (key === "style" && typeof val === "object") Object.assign(node.style, val);
    else if (key.startsWith("on")) node.addEventListener(key.slice(2).toLowerCase(), val);
    else node.setAttribute(key, val);
  }
  for (const child of Array.isArray(children) ? children : [children]) {
    if (typeof child === "string") node.appendChild(document.createTextNode(child));
    else if (child) node.appendChild(child);
  }
  return node;
}

function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

// ── DOM References ─────────────────────────────────
const emptyState = $("emptyState");
const unsupportedState = $("unsupportedState");
const loadingState = $("loadingState");
const mainContent = $("mainContent");

// ── State Variables ────────────────────────────────
let previousResult = null;
let currentData = null;

// ── CSS Variable Reader (for canvas theming) ───────
function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// ── State Management ───────────────────────────────
function showState(state) {
  emptyState.classList.add("hidden");
  unsupportedState.classList.add("hidden");
  loadingState.classList.add("hidden");
  mainContent.classList.add("hidden");

  switch (state) {
    case "empty": emptyState.classList.remove("hidden"); break;
    case "unsupported": unsupportedState.classList.remove("hidden"); break;
    case "loading": loadingState.classList.remove("hidden"); break;
    case "results": mainContent.classList.remove("hidden"); break;
  }
}

// ── Theme Management ───────────────────────────────
function initTheme() {
  chrome.storage.local.get("settings", (data) => {
    const theme = data.settings?.theme || "auto";
    applyTheme(theme);
  });
}

function applyTheme(theme) {
  if (theme === "auto") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  chrome.storage.local.get("settings", (data) => {
    if ((data.settings?.theme || "auto") === "auto") {
      applyTheme("auto");
    }
  });
});

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  let next;
  if (!current) next = "dark";
  else if (current === "dark") next = "light";
  else next = "auto";
  applyTheme(next);
  chrome.storage.local.get("settings", (data) => {
    const settings = data.settings || {};
    settings.theme = next;
    chrome.storage.local.set({ settings });
  });
}

$("themeToggle").addEventListener("click", toggleTheme);
initTheme();

// ── Tab Switching (AC-P4-004: aria-selected) ──────
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
  });
});

// ── Settings Button ────────────────────────────────
$("settingsBtn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// ── Modal Focus Trap (AC-P4-006) ───────────────────
function trapFocus(modal) {
  const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      modal.classList.add("hidden");
      modal.removeEventListener("keydown", handleKeyDown);
      return;
    }
    if (e.key !== "Tab") return;

    const focusable = Array.from(modal.querySelectorAll(FOCUSABLE));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  modal.addEventListener("keydown", handleKeyDown);

  // Focus first focusable element
  const focusable = modal.querySelectorAll(FOCUSABLE);
  if (focusable.length > 0) focusable[0].focus();
}
