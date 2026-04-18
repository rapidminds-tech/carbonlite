# Phase 7: Test Coverage & Error Resilience

## Status: APPROVED

## Objective

Expand test coverage to catch regressions in under-tested modules, cover error paths, and add integration tests for end-to-end flows. Current: 112 tests. Target: 160+ tests with coverage for all critical paths.

## Modules Involved

- `co2-engine.md` — grade boundary tests, extreme values, embodied ratio
- `resource-classifier.md` — malformed URLs, null inputs
- `side-panel.md` — canvas rendering with invalid data, empty history
- `background.md` — full flow integration, storage failures, API failures
- New: `tests/benchmarks.test.js`
- New: `tests/panel-render.test.js`
- New: `tests/error-paths.test.js`
- New: `tests/full-flow.test.js`

---

## Sub-Phase 7A: CO2 Engine & Benchmarks Coverage

### AC-P7-001
Grade threshold boundary tests exist for every transition: A+ → A (0.15g), A → B (0.30g), B → C (0.75g), C → D (1.50g), D → F (3.00g). Each boundary is tested at exactly the threshold and ±0.001g.

### AC-P7-002
`CO2.calculate()` is tested with extreme inputs: zero bytes (returns 0), negative bytes (returns 0), very large pages (100MB+), and `NaN`/`undefined` bytes (returns 0 or throws).

### AC-P7-003
`CO2.calculate()` embodied energy ratio is validated: result with embodied energy enabled is 15–20% higher than without, matching SWDM v4 specification.

### AC-P7-004
`libs/benchmarks.js` has tests validating: all benchmark categories return correct structure `{ median, p75, p90, source }`, no duplicate category keys, all source strings are non-empty.

---

## Sub-Phase 7B: Panel Rendering Unit Tests

### AC-P7-005
`renderSparkline()` is tested with: empty history array (renders nothing or placeholder), single data point (renders dot), 7+ data points (renders full line), and `null`/`undefined` values in array (skipped gracefully).

### AC-P7-006
`renderTreemap()` is tested with: empty breakdown object, single-category breakdown, breakdown with zero-byte categories, and extremely large byte values (no overflow).

### AC-P7-007
Canvas rendering functions handle missing CSS variables gracefully — if `getCSSVar()` returns empty string or `undefined`, a fallback color is used.

---

## Sub-Phase 7C: Error Path Coverage

### AC-P7-008
`checkGreenHosting()` is tested for: API unreachable (returns `null`, does not throw), API returns malformed JSON (returns `null`), API rate-limited / 429 response (returns `null`, uses cache if available).

### AC-P7-009
`classifyResource()` is tested with: `null` URL, empty string URL, `javascript:` URL, `data:` URL, `blob:` URL, URL exceeding 2048 characters. All return `"other"` without throwing.

### AC-P7-010
Chrome storage operations are tested for quota exceeded scenario: `chrome.storage.local.set()` rejection is caught and logged, does not crash the extension.

### AC-P7-011
`content.js` is tested for pages where Performance API is unavailable or returns empty `getEntriesByType()` — sends empty resource list to background without error.

---

## Sub-Phase 7D: Integration Tests

### AC-P7-012
Full flow integration test: `initTab()` → `addResource()` (5+ resources of mixed types) → `calculateForTab()` → verify result has correct `co2` (number > 0), `grade` (valid letter), `breakdown` (object with category keys), and `recommendations` (array).

### AC-P7-013
Integration test: `saveToHistory()` → `getHistory()` for the same domain returns the saved entry with matching `co2`, `grade`, and `timestamp`.

### AC-P7-014
Integration test: settings with `autoAnalyze: false` → trigger PERFORMANCE_DATA message → verify no calculation occurs AND no Green Web Foundation API call is made.

---

## Deliverables

- [ ] All 14 ACs have corresponding tests
- [ ] All tests pass (`npm test` exits 0)
- [ ] Total test count ≥ 160
- [ ] Zero untested public functions in `co2.js` and `classifier.js`
- [ ] Error paths return gracefully, never throw unhandled exceptions

## Phase Exit Criteria

1. All 14 ACs tested and passing
2. `npm test` exits 0 with ≥ 160 tests
3. No new lint errors introduced
