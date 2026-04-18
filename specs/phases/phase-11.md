# Phase 11: Final Polish & Resilience

## Status: APPROVED

## Objective

Fix all remaining audit optimizations (O-1 through O-4) and add edge-case resilience tests. Ship a bug-free, Chrome Web Store-ready extension.

## Modules Involved

- `options/options.js` — replace `confirm()` with custom modal, replace `setTimeout` with CSS animation
- `options/options.html` — add confirmation modal markup
- `options/options.css` — modal styles, toast animation
- `content.js` — strip query params from resource URLs (data minimization)
- `background.js` — handle edge cases (rapid tab switching, SW eviction)
- New: `tests/edge-cases-resilience.test.js`

---

## Sub-Phase 11A: Options Page Polish

### AC-P11-001
`options/options.js` replaces `confirm()` with a custom inline confirmation modal. The modal has "Cancel" and "Confirm" buttons, is keyboard-accessible (Escape to dismiss), and uses `textContent` (no innerHTML).

### AC-P11-002
`options/options.js` replaces `setTimeout` toast dismissal with a CSS `animationend` event listener. The toast auto-hides after the animation completes.

---

## Sub-Phase 11B: Data Minimization

### AC-P11-003
`content.js` strips query parameters and fragments from resource URLs before sending to background. `entry.name` is cleaned via `entry.name.split("?")[0].split("#")[0]` to prevent leaking session tokens, API keys, or tracking parameters in resource URLs.

---

## Sub-Phase 11C: Edge-Case Resilience

### AC-P11-004
`background.js` handles rapid tab creation/removal without errors. If `chrome.tabs.get()` fails in `onBeforeNavigate` (tab already closed), the error is caught and the tab is silently skipped.

### AC-P11-005
When `performance.getEntriesByType("resource")` throws or returns unusual data on CSP-restricted pages, `content.js` catches the error and sends an empty resource list without crashing.

### AC-P11-006
`background.js` `calculateForTab` handles the case where `tabData.get(tabId)` returns a stale entry (URL changed between schedule and execution). If `data.url` doesn't match the current tab URL, the calculation is skipped.

---

## Sub-Phase 11D: Resilience Test Suite

### AC-P11-007
Test: circuit breaker resets after 5 failures and a success — `apiFailCount` goes from 5 to 0 on next successful call.

### AC-P11-008
Test: resource URLs with query params are stripped in content.js — `https://cdn.example.com/app.js?token=abc123` becomes `https://cdn.example.com/app.js`.

### AC-P11-009
Test: rapid `initTab` + `removeTab` calls (100 cycles) don't cause Map growth or unhandled errors.

### AC-P11-010
Test: `calculateForTab` on a removed tab (tabData missing) returns gracefully without errors or side effects.

---

## Deliverables

- [ ] All 10 ACs have corresponding tests or verifiable artifacts
- [ ] All tests pass (`npm test` exits 0)
- [ ] Zero `confirm()` calls in source
- [ ] Zero `setTimeout` in options page
- [ ] Resource URLs stripped of query params
- [ ] `npm run lint` exits 0

## Phase Exit Criteria

1. All 10 ACs tested and passing
2. `npm test` exits 0
3. `npm run lint` exits 0
4. Manual: options "Clear All Data" uses custom modal, not browser `confirm()`
