# Phase 8: Code Architecture & Performance

## Status: APPROVED

## Objective

Decompose the monolithic `background.js`, centralize scattered constants, optimize rendering performance, and add storage lifecycle management. Improve maintainability without changing external behavior.

## Modules Involved

- `background.md` — decompose into focused modules
- `co2-engine.md` — constants extraction
- `side-panel.md` — rendering optimization, CSS organization
- New: `libs/recommendations.js`
- New: `libs/grading.js`
- New: `libs/message-router.js`

---

## Sub-Phase 8A: Background.js Decomposition

### AC-P8-001
`generateRecommendations()` and all recommendation-related helpers are extracted from `background.js` into `libs/recommendations.js`. `background.js` imports and calls the extracted module. All existing tests still pass.

### AC-P8-002
Grade calculation logic (`getGrade()`, grade thresholds, `BADGE_COLORS`) is extracted from `background.js` into `libs/grading.js`. Thresholds are defined as named constants with comments explaining calibration (D-009).

### AC-P8-003
Message handling in `background.js` is extracted into `libs/message-router.js` with a handler registry pattern: `registerHandler(type, fn)`. Each message type maps to a single handler function. `background.js` registers handlers at init.

### AC-P8-004
After decomposition, `background.js` is ≤ 350 lines (down from ~715). It contains only: init/lifecycle, tab event listeners, resource tracking, and imports.

---

## Sub-Phase 8B: Constants Centralization

### AC-P8-005
All optimization savings estimates (e.g., "image optimization saves 50%", "script deferral saves 20%") are defined in a single `OPTIMIZATION_FACTORS` object in `libs/constants.js` and referenced from `libs/recommendations.js`.

### AC-P8-006
`BADGE_COLORS` is defined once in `libs/constants.js` and consumed by both `libs/grading.js` (for badge API) and CSS (via matching custom properties `--grade-a`, `--grade-b`, etc.). No duplicate color definitions.

### AC-P8-007
Grade thresholds are defined in `libs/constants.js` as a `GRADE_THRESHOLDS` object (e.g., `{ 'A+': 0.15, 'A': 0.30, ... }`), imported by `libs/grading.js` and `libs/co2.js`. Magic numbers removed.

---

## Sub-Phase 8C: Rendering & CSS Optimization

### AC-P8-008
Canvas DPR (device pixel ratio) is calculated once on panel init and cached. `renderSparkline()` and `drawTrendChart()` read the cached value instead of recalculating per call.

### AC-P8-009
`panel.css` uses CSS custom properties for spacing: `--spacing-xs: 4px`, `--spacing-sm: 8px`, `--spacing-md: 16px`, `--spacing-lg: 24px`, `--spacing-xl: 32px`. Hardcoded spacing values are replaced throughout.

### AC-P8-010
`panel.css` is organized with section comments: `/* ── Layout ── */`, `/* ── Components ── */`, `/* ── Utilities ── */`, `/* ── Theme ── */`. Each section is self-contained.

---

## Sub-Phase 8D: Storage Lifecycle

### AC-P8-011
History entries older than 30 days are automatically pruned on every `saveToHistory()` call. Pruning removes entries where `timestamp < Date.now() - 30 * 86400000`.

### AC-P8-012
Before writing to `chrome.storage.local`, `getBytesInUse()` is checked. If usage exceeds 80% of quota (4MB of 5MB), oldest history entries are pruned until under 60%. A console warning is logged.

### AC-P8-013
`chrome.runtime.onSuspend` listener is added to `background.js` to flush any pending `tabData` writes to `chrome.storage.session` before service worker terminates.

---

## Deliverables

- [ ] All 13 ACs have corresponding tests or verifiable artifacts
- [ ] All existing tests still pass (no regressions)
- [ ] `background.js` ≤ 350 lines
- [ ] 3 new `libs/` modules created
- [ ] No duplicate constants across files
- [ ] `npm run lint` exits 0

## Phase Exit Criteria

1. All 13 ACs tested and passing
2. `background.js` line count verified ≤ 350
3. `grep -r` confirms zero duplicate constant definitions
4. All existing 160+ tests still pass
