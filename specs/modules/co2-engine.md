# CO2 Engine Specification

## Status: APPROVED

## Source Files
- `libs/co2.js` — SWDM v4 calculation engine
- `libs/benchmarks.js` — Industry benchmark data

## Test Files
- `tests/test_co2_engine.js` — AC-P1-008, AC-P1-009, AC-P3-001 through AC-P3-009

## Phase: 1, 3

---

## 1. Purpose

Calculate the carbon footprint (grams CO2e) of a web page based on total transferred bytes using the Sustainable Web Design Model v4 (SWDM v4). Assign a letter grade based on calibrated thresholds.

## 2. Dependencies

None — pure calculation module with no external dependencies.

## 3. Interfaces

### 3.1 Public API

```javascript
// Main calculation function
CO2.calculate(totalBytes, options) → { co2_g, grade, breakdown }

// Options:
// {
//   gridIntensity: number,    // gCO2e/kWh (default: 480)
//   greenHosting: boolean,    // true = use 50 gCO2e/kWh for data center
//   includeEmbodied: boolean  // true = add 16% embodied (default: true)
// }

// Returns:
// {
//   co2_g: number,           // total grams CO2e
//   grade: string,           // "A+" to "F"
//   breakdown: {
//     dataCenter_g: number,
//     network_g: number,
//     device_g: number,
//     embodied_g: number
//   }
// }

// Grade assignment
CO2.getGrade(co2_g) → string  // "A+" to "F"
```

### 3.2 Constants

```javascript
ENERGY_PER_GB = {
  dataCenter: 0.055,  // kWh/GB
  network: 0.059,     // kWh/GB
  device: 0.080       // kWh/GB
}

GRID_INTENSITY = {
  global: 480,        // gCO2e/kWh (Ember 2023)
  green: 50           // gCO2e/kWh (renewable estimate)
}

EMBODIED_FACTOR = 0.16  // 16% of operational

RETURNING_VISITOR = {
  firstVisitRatio: 0.75,
  returnVisitRatio: 0.25,
  returnDataRatio: 0.02   // 2% data re-transfer for cached visit
}

GRADE_THRESHOLDS = {
  'A+': 0.15,
  'A': 0.30,
  'B': 0.50,
  'C': 0.80,
  'D': 1.20,
  'F': Infinity
}
```

## 4. Behaviors

### 4.1 Happy Path
1. Receive totalBytes and options
2. Convert bytes to GB
3. Calculate energy per segment (data center, network, device)
4. Apply grid intensity (regional or global default)
5. Add embodied energy (16%)
6. Apply returning visitor weighting
7. Return CO2 in grams + grade + per-segment breakdown

### 4.2 Edge Cases
- `totalBytes = 0` → co2_g = 0, grade = "A+"
- `totalBytes < 0` → treat as 0
- `gridIntensity` not provided → use 480 (global average)
- `greenHosting = true` → data center segment uses 50 gCO2e/kWh

### 4.3 Error Handling
- Invalid inputs (NaN, undefined) → return 0 with grade "A+"
- Calculation must never throw

## 5. Performance Constraints

- Calculation completes in < 1ms for any input
- No async operations, no external calls

## 6. Acceptance Criteria

See Phase 1 (AC-P1-008, AC-P1-009) and Phase 3 (AC-P3-001 through AC-P3-009).

## 7. Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-16 | Initial spec | SDD adoption |
