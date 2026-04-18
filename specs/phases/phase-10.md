# Phase 10: Pre-Submission Security Hardening

## Status: APPROVED

## Objective

Fix all critical and high security issues identified in the pre-submission hardening audit. Ensure the extension passes Chrome Web Store review and protects user privacy.

## Modules Involved

- `background.md` — message handler auth, incognito, circuit breaker, hostname validation
- `security.md` — sender validation, storage key injection, CSP
- `content-script.md` — sender hint validation
- `options.md` — domain input validation, innerHTML removal
- `manifest.json` — permissions scoping, incognito mode

---

## Sub-Phase 10A: Message Handler Authentication (Critical)

### AC-P10-001
All `chrome.runtime.onMessage` listeners in `background.js` reject messages where `sender.id !== chrome.runtime.id`. Messages from other extensions or injected scripts are silently dropped.

### AC-P10-002
The `GET_HISTORY` handler validates `message.hostname` against a strict hostname regex (`/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i`) and rejects hostnames longer than 253 characters. Invalid hostnames receive an empty array response.

### AC-P10-003
The `PERFORMANCE_DATA` handler validates that `sender.tab.id` is a number and that `sender.url` starts with `http://` or `https://` (not `chrome-extension://` or other schemes).

---

## Sub-Phase 10B: Incognito & Privacy (Critical)

### AC-P10-004
`manifest.json` declares `"incognito": "split"` so the extension runs in a separate context in private windows.

### AC-P10-005
`background.js` checks `tab.incognito` before calling `saveToHistory()`. History is NEVER written for incognito tabs. `calculateForTab()` still runs (badge shows grade) but no persistent storage occurs.

### AC-P10-006
`background.js` checks `tab.incognito` before calling `checkGreenHosting()`. No API calls are made for incognito tabs to prevent hostname leakage. Green hosting shows as "unknown" for incognito.

---

## Sub-Phase 10C: Permissions Scoping (High)

### AC-P10-007
`manifest.json` `host_permissions` is reduced from `["http://*/*", "https://*/*"]` to only `["https://api.thegreenwebfoundation.org/*"]`. Content script injection uses `content_scripts.matches` (which doesn't require host_permissions).

---

## Sub-Phase 10D: Input Validation & Hardening (High)

### AC-P10-008
Domain input in `options/options.js` is validated against a strict domain regex. Inputs containing `javascript:`, `data:`, `blob:`, path traversal (`..`), or whitespace are rejected.

### AC-P10-009
`options/options.js` replaces `container.innerHTML = ""` with a safe DOM clearing loop (`while (container.firstChild) container.removeChild(container.firstChild)`).

### AC-P10-010
`checkGreenHosting()` in `background.js` includes a circuit breaker: after 5 consecutive API failures, no further API calls are made until a successful call resets the counter. Prevents hammering a downed API.

---

## Sub-Phase 10E: Content Script Hardening (Medium)

### AC-P10-011
Content script (`content.js`) validates that incoming `GET_PERFORMANCE_DATA` messages have the expected shape (object with `type` string field) before executing. Unexpected message shapes are ignored.

---

## Deliverables

- [ ] All 11 ACs have corresponding tests
- [ ] All tests pass (`npm test` exits 0)
- [ ] No messages accepted from foreign extensions
- [ ] No incognito data persisted
- [ ] host_permissions narrowed to API only
- [ ] `npm run lint` exits 0

## Phase Exit Criteria

1. All 11 ACs tested and passing
2. Manual test: install second extension, try `chrome.runtime.sendMessage` → rejected
3. Manual test: incognito window browsing → zero new `history_*` keys in storage
4. `npm run lint` exits 0
