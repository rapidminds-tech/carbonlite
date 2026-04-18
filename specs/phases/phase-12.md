# Phase 12 — Pre-Submission Hardening Audit Fixes

> Priority: **P0** (blocks Chrome Web Store submission)
> Dependencies: Phases 1-11 complete

## Scope

Fixes all findings from the Lead Browser Security Engineer audit:
- 6 Critical issues (CRIT-1 through CRIT-6)
- 8 Optimizations (OPT-1 through OPT-8)

## Related Specs

- `security.md` — sender validation, CSP
- `background.md` — service worker lifecycle, debounce
- `content-script.md` — injection model, SPA detection
- `side-panel.md` — message handling
- `options.md` — settings, privacy disclosure

---

## Acceptance Criteria

### CRIT-1 / CRIT-2: Least-Privilege Permissions

**AC-P12-001**: `manifest.json` does NOT contain a `content_scripts` block. Content script injection is done programmatically via `chrome.scripting.executeScript` in `background.js`.

**AC-P12-002**: `manifest.json` permissions include `activeTab` and `scripting` but do NOT include `tabs`.

**AC-P12-003**: `background.js` calls `chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] })` inside `webNavigation.onCompleted` listener, wrapped in try/catch for chrome:// pages.

### CRIT-3: Green Web Foundation API Opt-In

**AC-P12-004**: Default settings include `greenHostingCheck: false`. The Green Web Foundation API is NOT called unless the user explicitly enables it in settings.

**AC-P12-005**: `options.html` has a checkbox for "Check green hosting status" with disclosure text: "Sends website hostnames to thegreenwebfoundation.org".

**AC-P12-006**: `background.js` `calculateForTab` checks `settings.greenHostingCheck` before calling `checkGreenHosting()`. When disabled, `data.greenHosting` remains `null`.

### CRIT-4: Privacy Policy

**AC-P12-007**: `privacy.html` exists at project root, covering: local-only data storage, optional hostname sharing with Green Web Foundation, incognito behavior, no PII collection, data retention (30 days).

### CRIT-5 / CRIT-6: Sender Validation

**AC-P12-008**: `content.js` `onMessage` listener checks `sender.id !== chrome.runtime.id` and returns early if foreign.

**AC-P12-009**: `sidepanel/panel-actions.js` `onMessage` listener checks `sender.id !== chrome.runtime.id` and returns early if foreign. Also validates `message.data` has a `co2` number property before rendering.

### OPT-1 / OPT-2: Remove Alarms, Fix Debounce

**AC-P12-010**: `manifest.json` does NOT include `alarms` permission. `background.js` uses `setTimeout`-based debounce for calculation scheduling (matching `background-core.js` pattern).

**AC-P12-011**: Notifications are gated behind a `showNotifications` setting (default: `true`). The `notifications` permission remains but usage is conditional.

### OPT-3 / OPT-8: Lightweight SPA Detection

**AC-P12-012**: `content.js` does NOT use `MutationObserver` for SPA navigation detection. Instead uses `popstate` event + `history.pushState`/`replaceState` interception.

**AC-P12-013**: `content.js` guards against `document.body` being null before any DOM observation.

### OPT-4: Storage Pruning Efficiency

**AC-P12-014**: `pruneOldestHistory` in `background.js` does NOT call `getBytesInUse` inside a loop. Instead estimates size from the fetched data or checks at most once.

### OPT-5: Restore Race Guard

**AC-P12-015**: `restoreTabData()` result is stored in a promise. `webNavigation.onBeforeNavigate` awaits this promise before calling `initTab`, preventing data races.

### OPT-6: Budget Validation

**AC-P12-016**: `carbonBudget` parsing uses `Number()` with `Number.isFinite()` guard. Non-numeric or negative values are treated as 0 (disabled).

### OPT-7: No Silent Catch Blocks

**AC-P12-017**: All `catch {}` blocks in `background.js` log to `console.warn("Carbonlite: ...")` instead of silently swallowing errors. Exception: `chrome.runtime.lastError` suppression callbacks remain silent (intentional).

---

## Test Plan

| AC | Test |
|----|------|
| AC-P12-001 | `manifest.json` has no `content_scripts` key |
| AC-P12-002 | Permissions include `activeTab`, `scripting`; exclude `tabs` |
| AC-P12-003 | `background.js` contains `chrome.scripting.executeScript` call |
| AC-P12-004 | Default settings have `greenHostingCheck: false` |
| AC-P12-005 | `options.html` contains green hosting checkbox with disclosure |
| AC-P12-006 | `background.js` checks `greenHostingCheck` before API call |
| AC-P12-007 | `privacy.html` exists and contains required sections |
| AC-P12-008 | `content.js` has `sender.id` check in onMessage |
| AC-P12-009 | `panel-actions.js` has `sender.id` check + data type guard |
| AC-P12-010 | No `alarms` in manifest; `setTimeout` used for debounce |
| AC-P12-011 | Notification calls gated by `showNotifications` setting |
| AC-P12-012 | No `MutationObserver` in content.js for URL change detection |
| AC-P12-013 | `document.body` null guard present |
| AC-P12-014 | No `getBytesInUse` inside loop in `pruneOldestHistory` |
| AC-P12-015 | `restoreTabData` promise awaited before `initTab` |
| AC-P12-016 | Budget parsing uses `Number.isFinite` guard |
| AC-P12-017 | No empty `catch {}` blocks (all have console.warn) |
