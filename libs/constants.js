/**
 * Shared constants for Carbonlite
 * Single source of truth for all configurable values.
 * Source: Ember 2023 Global Electricity Review (gCO2e/kWh by country)
 */

// ── Regional Grid Intensity (gCO2e/kWh) ────────────
// REGION_INTENSITY defined here ONLY — all other files reference this.
const REGION_INTENSITY = {
  auto: null, us: 390, eu: 270, uk: 230, in: 700,
  cn: 530, au: 510, br: 80, jp: 460, de: 340, fr: 60,
};

// ── Grade Thresholds (gCO2e) ────────────────────────
// Calibrated so HTTP Archive median page (~2.5MB ≈ 0.27g) = grade C (D-009)
// Each value is the upper bound (exclusive) for that grade.
const GRADE_THRESHOLDS = {
  "A+": 0.095,
  "A":  0.19,
  "B":  0.25,
  "C":  0.50,
  "D":  0.80,
  // F: anything >= 0.80 (no upper bound)
};

// ── Badge Colors ────────────────────────────────────
// Used by grading.js for badge API and matched in CSS custom properties.
const BADGE_COLORS = {
  loading:  "#9ca3af",
  "A+":     "#16a34a",
  A:        "#22c55e",
  B:        "#86efac",
  C:        "#fbbf24",
  D:        "#fb923c",
  F:        "#ef4444",
  error:    "#9ca3af",
  disabled: "#d1d5db",
};

// ── Optimization Factors ────────────────────────────
// Savings estimates referenced by libs/recommendations.js.
// Each factor represents the fraction of bytes that can be saved.
const OPTIMIZATION_FACTORS = {
  imageCompression:   0.6,  // 60% savings from compressing images
  modernImageFormat:  0.5,  // 50% savings from PNG → WebP/AVIF
  fontOptimization:   0.5,  // 50% savings from WOFF2 + subsetting
  thirdPartyReduction: 0.2, // 20% of third-party bytes removable
};

// Export for both Chrome extension (globalThis) and Node/test (module)
if (typeof globalThis !== "undefined") {
  globalThis.REGION_INTENSITY = REGION_INTENSITY;
  globalThis.GRADE_THRESHOLDS = GRADE_THRESHOLDS;
  globalThis.BADGE_COLORS = BADGE_COLORS;
  globalThis.OPTIMIZATION_FACTORS = OPTIMIZATION_FACTORS;
}
