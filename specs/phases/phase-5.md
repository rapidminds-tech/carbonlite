# Phase 5: Scope Cut & Store Readiness

## Status: APPROVED

## Objective

Remove dead code for cut features, prepare all Chrome Web Store submission requirements, and ensure the extension is lean and publishable.

## Modules Involved

- `side-panel.md` — remove cut feature UI (badge, share image, compare, PDF export)
- `background.md` — remove compare logic
- `options.md` — fix placeholder links
- New: `privacy-policy.html`
- New: store listing assets

---

## Acceptance Criteria

### AC-P5-001
The following cut features are fully removed — no UI buttons, no handlers, no dead code: Carbon Badge generator, Share as PNG image, PDF report export, Site comparison feature. Action row in side panel shows only relevant actions.

### AC-P5-002
The onboarding page (`onboarding/onboarding.html`) is either removed or simplified to a minimal first-run welcome — no multi-step wizard.

### AC-P5-003
A privacy policy page exists at `privacy/privacy.html` (or linked URL) that discloses: what data is collected (Performance API resource sizes, hostnames sent to Green Web Foundation API), what is stored locally, and that no personal browsing content is read.

### AC-P5-004
The "About" section in options page links to actual URLs (GitHub repo, privacy policy) — no placeholder `https://github.com` links.

### AC-P5-005
`manifest.json` has a `description` field ≤132 characters that clearly states the extension's single purpose (required for store review).

### AC-P5-006
Extension icons exist at all required sizes (16, 48, 128 px) and are not placeholder/generic icons.

### AC-P5-007
The `report/` directory and all report-related code is removed since PDF export is cut from v1 scope.

### AC-P5-008
`content_scripts` matches in manifest.json use `http://*/*` and `https://*/*` (not `<all_urls>`) to match the scoped `host_permissions`.

### AC-P5-009
The extension loads cleanly as an unpacked extension in Chrome with zero console errors on `chrome://extensions`.

### AC-P5-010
No unused permissions remain in manifest.json. Each permission (`sidePanel`, `storage`, `tabs`, `webNavigation`, `notifications`) has a justified use in the codebase.

---

## Deliverables

- [ ] All 10 ACs have corresponding tests
- [ ] All tests pass
- [ ] Cut features fully removed (badge, share image, PDF, compare)
- [ ] Privacy policy page created
- [ ] Store listing description ≤132 chars
- [ ] No dead code from cut features

## Phase Exit Criteria

1. All 10 ACs tested and passing
2. Extension loads unpacked with zero errors
3. Privacy policy page renders correctly
4. No references to cut features in any source file
