# Phase 6: Testing & CI

## Status: APPROVED

## Objective

Establish comprehensive test coverage, automated linting, and a CI pipeline so that future changes don't regress the fixes from Phases 1–5.

## Modules Involved

- All modules — integration tests
- New: CI configuration
- New: ESLint configuration

---

## Acceptance Criteria

### AC-P6-001
All existing tests (Phases 1–5) pass in a single `npx vitest run` invocation with zero failures.

### AC-P6-002
Test coverage for `libs/co2.js` includes edge cases: zero bytes, very large pages (100MB+), negative bytes (returns 0), green hosting vs standard, custom grid intensity, first visit vs blended.

### AC-P6-003
Test coverage for `libs/classifier.js` includes edge cases: empty string URL, URL with query params and fragments, data: URLs, blob: URLs, URLs with no protocol.

### AC-P6-004
An ESLint configuration (`.eslintrc.json` or `eslint.config.js`) is set up with rules that enforce: no `innerHTML` assignments (`no-unsanitized/property`), no empty catch blocks, no unused variables.

### AC-P6-005
`npx eslint .` runs with zero errors (warnings acceptable) on all source files (excluding node_modules and test files).

### AC-P6-006
A `package.json` script `test` runs `vitest run` and a script `lint` runs `eslint .` — both exit 0.

### AC-P6-007
Integration test: mock a full page analysis flow — initTab → addResource (multiple) → calculateForTab → verify result has correct co2, grade, and recommendations structure.

### AC-P6-008
Integration test: mock settings with `autoAnalyze: false` — verify that PERFORMANCE_DATA message processing is skipped.

### AC-P6-009
A GitHub Actions workflow file (`.github/workflows/ci.yml`) exists that runs tests and lint on push/PR to main. The workflow must be valid YAML and reference the correct npm scripts.

### AC-P6-010
All test files follow the naming convention `test_ac_pN_XXX_description` for spec compliance tests. No anonymous or poorly-named test cases.

---

## Deliverables

- [ ] All 10 ACs have corresponding tests or verifiable artifacts
- [ ] All tests pass
- [ ] ESLint configured and clean
- [ ] CI workflow file created
- [ ] Edge case tests for CO2 engine and classifier

## Phase Exit Criteria

1. All 10 ACs tested and passing
2. `npm test` exits 0
3. `npm run lint` exits 0
4. CI workflow is valid YAML (can be validated offline)
5. Total test count ≥ 90 across all phases
