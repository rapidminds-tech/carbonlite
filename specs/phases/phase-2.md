# Phase 2: Security & Privacy

## Status: APPROVED

## Objective

Eliminate security vulnerabilities, minimize permission surface, and ensure privacy-respectful behavior.

## Modules Involved

- `security.md` — permissions, URL validation
- `side-panel.md` — remaining innerHTML cleanup
- `background.md` — message validation
- `content-script.md` — data collection scope

---

## Acceptance Criteria

### AC-P2-001
All `innerHTML` assignments across ALL files (panel.js, report.js, options.js, onboarding.js) that embed any dynamic data use `textContent` + `createElement`. Only static HTML templates may use `innerHTML`.

### AC-P2-002
`activeTab` permission is removed from manifest.json (redundant with `host_permissions`).

### AC-P2-003
All `chrome.runtime.onMessage` handlers validate the `type` field before processing. Unknown message types are ignored (not logged, not errored).

### AC-P2-004
The "Share anonymous usage stats" toggle in options is either implemented with actual telemetry or removed entirely — no deceptive UI.

### AC-P2-005
`autoAnalyze` setting is respected: when false, content script does not send `PERFORMANCE_DATA` and background.js does not calculate CO2 for that tab.

### AC-P2-006
`showBadge` setting is respected: when false, toolbar badge text and color are not set.

### AC-P2-007
All `catch {}` blocks either log the error or handle it explicitly. Zero empty catch blocks remain.

### AC-P2-008
No external URLs are opened from the extension without explicit user action (click). No automatic tab creation.

### AC-P2-009
The extension handles `chrome://`, `chrome-extension://`, `about:`, and `file://` URLs gracefully — shows "not applicable" state, does not attempt analysis.

### AC-P2-010
manifest.json `host_permissions` is scoped to `http://*/*` and `https://*/*` only (not `<all_urls>` which includes chrome:// etc).

---

## Deliverables

- [ ] All 10 ACs have corresponding tests
- [ ] All tests pass
- [ ] Security audit shows zero innerHTML with dynamic data
- [ ] Permissions minimized

## Phase Exit Criteria

1. All 10 ACs tested and passing
2. Manual review: no innerHTML with external data in any file
3. Permissions audit: minimal required set
