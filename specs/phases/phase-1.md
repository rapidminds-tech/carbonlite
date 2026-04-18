# Phase 1: P0 Bug Fixes (Ship-Blockers)

## Status: APPROVED

## Objective

Fix all P0 bugs identified in VALIDATION_REPORT.md that prevent Chrome Web Store submission and basic reliability.

## Modules Involved

- `background.md` — tabData persistence, debounce, calculateForTab
- `resource-classifier.md` — classifyResource argument fix
- `co2-engine.md` — gridIntensity pass-through
- `side-panel.md` — XSS innerHTML fixes
- `security.md` — COMPARE_URL validation, green hosting caching

---

## Sub-Phase 1A: State Persistence & Reliability

### AC-P1-001
`tabData` is persisted to `chrome.storage.session` on every update, so service worker restarts do not lose in-progress analysis.

### AC-P1-002
On service worker startup, `tabData` is restored from `chrome.storage.session` for all active tabs.

### AC-P1-003
`calculateForTab` is debounced — multiple triggers within 500ms result in only one calculation. Green hosting API is not hit twice per navigation.

### AC-P1-004
`setTimeout` and `setInterval` calls in background.js are replaced with alarm-based or event-driven alternatives that survive service worker restarts.

---

## Sub-Phase 1B: Resource Classification Fix

### AC-P1-005
`classifyResource` correctly handles both MIME content-type strings AND `initiatorType` strings by detecting which format was passed.

### AC-P1-006
Resource classification priority is: MIME type > file extension > initiatorType fallback. Resources with no MIME and no recognizable extension fall to "other".

### AC-P1-007
CDN URLs with no file extension (e.g., `cdn.example.com/abc123`) are classified by content-type header if available, otherwise "other" — never misclassified as a known type.

---

## Sub-Phase 1C: Grid Intensity Fix

### AC-P1-008
When a user selects a region in options, `calculateForTab` passes the corresponding `gridIntensity` value to `CO2.calculate()`.

### AC-P1-009
When region is set to "auto" (default), the global average (480 gCO2e/kWh) is used.

### AC-P1-010
`REGION_INTENSITY` values are defined in exactly ONE location and imported/referenced everywhere else (options.js, background.js, onboarding.js).

---

## Sub-Phase 1D: XSS & Security Fixes

### AC-P1-011
Zero `innerHTML` assignments exist in `panel.js` that insert external data (URLs, hostnames, user input). All such assignments use `textContent` + `createElement` instead.

### AC-P1-012
`COMPARE_URL` message handler validates that the URL starts with `https://` before opening. Non-https URLs are rejected with an error message.

### AC-P1-013
Green hosting API responses are cached in `chrome.storage.local` with a 24-hour TTL per hostname. Cached results are used when available, preventing browsing history leakage on repeat visits.

### AC-P1-014
`content.js` does NOT read `document.body.innerText` — only Performance API data and DOM element counts are collected.

---

## Deliverables

- [ ] All 14 ACs have corresponding tests
- [ ] All tests pass
- [ ] No `innerHTML` with external data in panel.js
- [ ] Green hosting API cached
- [ ] tabData survives SW restart
- [ ] classifyResource handles both MIME and initiatorType

## Phase Exit Criteria

1. All 14 ACs tested and passing
2. Manual smoke test: browse 5 sites, restart SW, verify state recovery
3. Zero console errors during normal browsing

## Estimated Effort

Medium — mostly refactoring existing code, no new features
