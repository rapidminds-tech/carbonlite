# Phase 9: Accessibility, UX & Hardening

## Status: APPROVED

## Objective

Close accessibility gaps to meet WCAG 2.1 AA, improve error state UX so users always know what's happening, harden CSP and URL validation, and add data model versioning for future-proofing.

## Modules Involved

- `side-panel.md` — accessibility, error states, canvas alternatives
- `security.md` — CSP, URL validation hardening
- `background.md` — error state messaging, data versioning
- `options/options.html` — ARIA landmarks, external CSS
- `onboarding/onboarding.html` — ARIA landmarks, external CSS

---

## Sub-Phase 9A: Accessibility (WCAG 2.1 AA)

### AC-P9-001
Canvas elements (`sparkline`, `trendChart`) have a visually-hidden `<table>` fallback that presents the same data as text. Screen readers read the table; sighted users see the canvas. The table updates when chart data changes.

### AC-P9-002
All interactive elements (buttons, links, tabs) in the side panel have visible keyboard focus styles (`:focus-visible` with a 2px outline). Tab order follows visual order.

### AC-P9-003
Tooltips on resource bars and grade badges are accessible via keyboard: appearing on `focus` (not just `hover`) and dismissable with `Escape`.

### AC-P9-004
`options.html` and `onboarding.html` have ARIA landmarks: `<main>`, `<nav>` (if applicable), and a skip-to-content link as the first focusable element.

### AC-P9-005
Grade badges use both color AND a text label (e.g., "A+" text is always visible). Colorblind users can distinguish grades without relying on color alone.

---

## Sub-Phase 9B: Error State UX

### AC-P9-006
When Green Web Foundation API is unreachable, the hosting section shows "Unable to verify green hosting" with a retry link, instead of silently assuming non-green.

### AC-P9-007
When Performance API is blocked or returns empty results, the panel shows an explanatory message: "This page blocks performance measurement" with a brief reason (e.g., cross-origin restriction).

### AC-P9-008
History sparkline with < 2 data points shows a message: "Visit this site again to see trends" instead of rendering nothing.

### AC-P9-009
If `chrome.storage.local` write fails (quota exceeded), a toast notification informs the user: "Storage full — oldest history entries cleared" and auto-prunes.

---

## Sub-Phase 9C: CSP & Validation Hardening

### AC-P9-010
Inline `<style>` blocks in `options.html` are extracted to `options/options.css` (linked via `<link>`). Inline `<style>` blocks in `onboarding.html` are extracted to `onboarding/onboarding.css`.

### AC-P9-011
`manifest.json` declares an explicit Content Security Policy: `"content_security_policy": { "extension_pages": "script-src 'self'; object-src 'none'; style-src 'self'" }`.

### AC-P9-012
`checkGreenHosting()` wraps URL parsing in try/catch. Invalid URLs (malformed, `javascript:`, `data:`, `blob:`) return `null` without making an API call.

---

## Sub-Phase 9D: Data Model Versioning

### AC-P9-013
All data written to `chrome.storage.local` includes a `_version` field (starting at `1`). On read, if `_version` is missing or older than current, a migration function transforms the data to the current schema.

### AC-P9-014
A `libs/migrations.js` module exports a `migrate(data, fromVersion, toVersion)` function. For v1, this is a no-op passthrough. The pattern is established for future schema changes.

---

## Deliverables

- [ ] All 14 ACs have corresponding tests or verifiable artifacts
- [ ] All tests pass (`npm test` exits 0)
- [ ] WCAG 2.1 AA compliance for side panel, options, and onboarding
- [ ] No inline styles in HTML files
- [ ] Explicit CSP in manifest.json
- [ ] Data versioning pattern established

## Phase Exit Criteria

1. All 14 ACs tested and passing
2. Manual screen reader test confirms canvas alternatives are read correctly
3. Keyboard-only navigation completes all panel flows without mouse
4. `npm run lint` exits 0
5. No inline `<style>` blocks in any HTML file
