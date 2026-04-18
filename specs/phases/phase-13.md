# Phase 13 — Pre-Submission Hardening Audit Fixes

> Priority: Critical → High → Optimization
> Scope: Security, permissions, performance, robustness

## Overview

Addresses findings from the Lead Browser Security Engineer audit conducted post-Phase 12.
16 acceptance criteria covering 5 critical fixes, 4 high-priority fixes, and 5 optimizations.

---

## Critical Fixes

### AC-P13-001: Fix `export` statements that crash service worker
**File:** `libs/recommendations.js`, `libs/grading.js`
**Problem:** Bare `export { ... }` at end of file throws `SyntaxError` when loaded via `importScripts()` in classic script context.
**Fix:** Replace with conditional CJS export guarded by `typeof module !== "undefined"`.
**Test:** Service worker starts without errors; `importScripts` does not throw.

### AC-P13-002: Remove `notifications` permission
**File:** `manifest.json`, `background.js`
**Problem:** `notifications` permission adds install friction and is unnecessary — side panel toasts already exist.
**Fix:** Remove permission from manifest. Replace `notify()` with `chrome.runtime.sendMessage({ type: "SHOW_TOAST", ... })`. Add listener in side panel.
**Test:** `manifest.json` does not contain `"notifications"`. Budget/regression alerts appear as in-panel toasts.

### AC-P13-003: Gate webNavigation to user-activated tabs only
**File:** `background.js`
**Problem:** `onBeforeNavigate` and `onCompleted` fire for ALL tabs, tracking every page the user visits.
**Fix:** Maintain `activatedTabs` Set. Only add tabs when user clicks action or side panel opens. Skip processing for non-activated tabs. Persist activated tabs in `chrome.storage.session`.
**Test:** Navigating a tab the user never activated produces no `tabData` entry. Activated tabs are processed normally.

### AC-P13-004: Full incognito skip
**File:** `background.js`
**Problem:** Incognito tabs skip history but still get content script injection, calculation, and badge updates.
**Fix:** In `onBeforeNavigate`, detect incognito via `chrome.tabs.get` and return before `initTab()`. In `onCompleted`, skip injection for incognito tabs.
**Test:** Incognito tabs have no `tabData` entry, no content script injection, no badge update.

### AC-P13-005: Sender URL validation for extension-page messages
**File:** `background.js`
**Problem:** `GET_TAB_DATA` and `GET_HISTORY` messages are not verified to originate from extension pages. Content scripts (which share `sender.id`) could request user history.
**Fix:** Add `sender.url.startsWith("chrome-extension://" + chrome.runtime.id + "/")` check.
**Test:** Messages from content scripts (sender.url = https://...) for GET_HISTORY/GET_TAB_DATA are rejected.

---

## High-Priority Fixes

### AC-P13-006: Restore pending calculations after SW eviction
**File:** `background.js`
**Problem:** After SW restart, restored tabs with `totalBytes > 0` but `result === null` never get recalculated.
**Fix:** At end of `restoreTabData()`, iterate restored tabs and call `scheduleCalculation()` for any with data but no result.
**Test:** After SW eviction, tabs with incomplete calculations are re-processed.

### AC-P13-007: Rate limit PERFORMANCE_DATA per tab
**File:** `background.js`
**Problem:** No throttle on PERFORMANCE_DATA messages — a buggy page could flood the background.
**Fix:** Add `perfDataTimestamps` Map tracking last accepted timestamp per tab. Reject messages within 2s of the last accepted message for the same tab. Clean up on `tabs.onRemoved`.
**Test:** Rapid-fire PERFORMANCE_DATA messages (< 2s apart) are dropped after the first.

### AC-P13-008: Parse carbonBudget to Number on save
**File:** `options/options.js`
**Problem:** `carbonBudget` stored as string from select value. Inconsistent with Number() parse in background.js.
**Fix:** `carbonBudget: Number(document.getElementById("carbonBudget").value) || 0`.
**Test:** After saving settings, `chrome.storage.local` contains `carbonBudget` as a number, not a string.

---

## Optimizations

### AC-P13-009: Consolidate settings reads in calculateForTab
**File:** `background.js`
**Problem:** `calculateForTab` calls `chrome.storage.local.get("settings")` three times.
**Fix:** Single read at top of function, use result throughout.
**Test:** `calculateForTab` makes exactly 1 `chrome.storage.local.get("settings")` call.

### AC-P13-010: Batch pruneOldestHistory writes
**File:** `background.js`
**Problem:** `pruneOldestHistory` writes keys one-by-one in a loop.
**Fix:** Collect updates into single object, call `chrome.storage.local.set` once.
**Test:** `pruneOldestHistory` calls `chrome.storage.local.set` exactly once.

### AC-P13-011: Fix getRootDomain for multi-part TLDs
**File:** `libs/classifier.js`
**Problem:** `getRootDomain("sub.example.co.uk")` returns `"co.uk"` instead of `"example.co.uk"`.
**Fix:** Add `MULTI_PART_TLDS` Set and handle 3-part domain extraction.
**Test:** `isThirdParty("https://cdn.example.co.uk/a.js", "https://example.co.uk/")` returns `false`.

### AC-P13-012: Cache sparkline hostname to skip redundant redraws
**File:** `sidepanel/panel-render.js`
**Problem:** `renderSparkline` redraws and re-fetches history on every `render()` call even when hostname unchanged.
**Fix:** Cache `lastSparklineHostname`, skip if unchanged.
**Test:** Calling `render()` twice with same hostname sends only 1 GET_HISTORY message for sparkline.

### AC-P13-013: Replace rAF counting loops with setTimeout/CSS animationend
**File:** `sidepanel/panel-breakdown.js`, `sidepanel/panel.css`
**Problem:** Copy button reset and toast dismiss use rAF counting loops (120/240 frames), wasting CPU.
**Fix:** Replace copy button rAF with `setTimeout(fn, 2000)`. Replace toast rAF with CSS animation class + `animationend` event listener.
**Test:** No `requestAnimationFrame` loops in copy button handler or `showToast` function.

---

## Acceptance Criteria Summary

| AC | Fix | Priority | Files |
|----|-----|----------|-------|
| AC-P13-001 | Fix export statements | Critical | recommendations.js, grading.js |
| AC-P13-002 | Remove notifications permission | Critical | manifest.json, background.js, panel-breakdown.js |
| AC-P13-003 | Gate webNavigation | Critical | background.js |
| AC-P13-004 | Full incognito skip | Critical | background.js |
| AC-P13-005 | Sender URL validation | Critical | background.js |
| AC-P13-006 | Restore pending calcs | High | background.js |
| AC-P13-007 | Rate limit PERF_DATA | High | background.js |
| AC-P13-008 | carbonBudget as Number | High | options.js |
| AC-P13-009 | Consolidate settings reads | Optimization | background.js |
| AC-P13-010 | Batch prune writes | Optimization | background.js |
| AC-P13-011 | Multi-part TLD fix | Optimization | classifier.js |
| AC-P13-012 | Cache sparkline | Optimization | panel-render.js |
| AC-P13-013 | Replace rAF loops | Optimization | panel-breakdown.js, panel.css |
