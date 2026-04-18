# Phase 3: Carbon Methodology Fixes

## Status: APPROVED

## Objective

Fix carbon calculation methodology errors that undermine measurement accuracy and credibility with developer audiences.

## Modules Involved

- `co2-engine.md` — SWDM v4 calculation, embodied energy, grid intensity
- `methodology.md` — methodology accuracy, claims, benchmarks

---

## Acceptance Criteria

### AC-P3-001
CO2 calculation includes embodied energy: `totalCO2 = operationalCO2 × 1.16` (16% hardware manufacturing overhead per SWDM v4).

### AC-P3-002
Global grid intensity constant is 480 gCO2e/kWh (Ember 2023), not 494.

### AC-P3-003
Script deferral recommendation does NOT claim carbon savings from deferring scripts. It may recommend deferring for performance, but without false CO2 reduction claims.

### AC-P3-004
For cross-origin resources where `transferSize === 0` (CORS-blocked), the extension estimates transfer size from `encodedBodySize` or falls back to `decodedBodySize`, with a note that the measurement is estimated.

### AC-P3-005
Caching recommendation does NOT claim additional CO2 savings on top of SWDM's built-in returning visitor ratio. The recommendation focuses on performance benefits only, or clearly states the savings are already factored into the model.

### AC-P3-006
Grade thresholds are calibrated so the HTTP Archive median page (~2.5MB) receives grade C or D (not B). See architecture.md for threshold table.

### AC-P3-007
Benchmark data includes source citations (e.g., "HTTP Archive, April 2025" or "Estimated from industry data").

### AC-P3-008
Image optimization savings estimate differentiates between source formats: PNG→WebP (25-35%), PNG→AVIF (50-65%), JPEG→WebP (15-25%), not a blanket 65%.

### AC-P3-009
Regional grid intensity values are sourced from Ember 2023 data and match the values in architecture.md.

### AC-P3-010
The extension displays a "methodology" or "how we calculate" link/section that briefly explains SWDM v4, energy model, and grid intensity source.

---

## Deliverables

- [ ] All 10 ACs have corresponding tests
- [ ] All tests pass
- [ ] CO2 calculations include embodied energy
- [ ] Grade thresholds recalibrated
- [ ] False methodology claims removed

## Phase Exit Criteria

1. All 10 ACs tested and passing
2. CO2 output for 5 test sites cross-referenced with websitecarbon.com (within 15%)
3. No false carbon savings claims in recommendations
