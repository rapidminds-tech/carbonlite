# Phase 4: Code Quality & Architecture

## Status: APPROVED

## Objective

Improve code maintainability, accessibility, and eliminate code smells identified in the validation report.

## Modules Involved

- `side-panel.md` — panel.js decomposition, ARIA, dark theme
- `background.md` — resource array bounds, error handling
- `options.md` — dark mode, shared constants

---

## Acceptance Criteria

### AC-P4-001
`panel.js` is decomposed into logical modules: rendering, events, canvas/charts, exports, messaging. No single file exceeds 300 lines.

### AC-P4-002
Dark theme CSS uses CSS custom properties (variables) — not duplicated rule blocks. Theme switching changes variable values on `:root` or `[data-theme="dark"]`.

### AC-P4-003
`REGION_INTENSITY` map is defined in exactly ONE file (e.g., `libs/constants.js`) and imported/referenced by all consumers.

### AC-P4-004
Side panel tabs have `role="tab"`, `aria-selected`, and `role="tabpanel"` attributes. Tab switching updates `aria-selected` and focus.

### AC-P4-005
Toast notifications have `aria-live="polite"` region. Screen readers announce toast messages.

### AC-P4-006
Modal dialogs have focus trap — Tab key cycles within the modal, Escape closes it.

### AC-P4-007
`resources` array in background.js has a cap (e.g., 1000 entries per tab). Oldest entries are dropped when cap is exceeded.

### AC-P4-008
Canvas-based charts have an accessible text alternative (e.g., `aria-label` with summary or adjacent text table).

### AC-P4-009
Options page and any remaining pages support dark mode via the same theme system as the side panel.

### AC-P4-010
Quick-rec click in Score tab switches to Fixes tab AND scrolls the relevant recommendation card into view.

### AC-P4-011
Report page data is NOT deleted after first render. Page can be refreshed without losing data.

### AC-P4-012
All `console.error` and `console.warn` calls include meaningful context (which function, what failed, what input).

---

## Deliverables

- [ ] All 12 ACs have corresponding tests
- [ ] All tests pass
- [ ] panel.js decomposed into ≤300-line modules
- [ ] ARIA attributes on interactive elements
- [ ] Dark theme via CSS custom properties

## Phase Exit Criteria

1. All 12 ACs tested and passing
2. Lighthouse accessibility audit score ≥ 90 on side panel
3. No file exceeds 300 lines (excluding generated/library code)
