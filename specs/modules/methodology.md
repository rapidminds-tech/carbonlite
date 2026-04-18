# Carbon Methodology Specification

## Status: APPROVED

## Source Files
- `libs/co2.js` — calculation engine
- `libs/benchmarks.js` — benchmark data
- `sidepanel/panel.js` (or decomposed module) — recommendation text

## Test Files
- `tests/test_methodology.js` — AC-P3-001 through AC-P3-010

## Phase: 3

---

## 1. Purpose

Ensure the carbon measurement methodology is accurate, well-sourced, and makes no false claims. This is the extension's core credibility with developer audiences.

## 2. Methodology Requirements

### 2.1 SWDM v4 Compliance
- Energy model: data center (0.055) + network (0.059) + device (0.080) = 0.194 kWh/GB
- Embodied energy: +16% on operational emissions
- Returning visitor: 75% first visit (full data) + 25% return (2% data)
- Grid intensity: 480 gCO2e/kWh global average (Ember 2023)

### 2.2 Claims That Must NOT Be Made
- Script deferral reduces CO2 (it changes timing, not transfer size)
- Caching saves X grams beyond what SWDM already models
- Any specific savings number without clear assumptions stated

### 2.3 Claims That CAN Be Made
- Image format optimization reduces transfer size by X% (with format-specific ranges)
- Lazy loading prevents unnecessary transfers below the fold
- Green hosting reduces grid intensity impact
- Reducing total page weight reduces CO2 proportionally

### 2.4 Benchmark Sources
- All benchmark values must cite a source
- Grade thresholds calibrated to HTTP Archive median

## 3. Acceptance Criteria

See Phase 3: AC-P3-001 through AC-P3-010.

## 4. Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-16 | Initial spec | Fix methodology errors from expert review |
