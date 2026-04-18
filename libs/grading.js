/**
 * Grade calculation for Carbonlite
 * Extracted from background.js (AC-P8-002)
 *
 * Grade thresholds calibrated so HTTP Archive median page (~2.5MB ≈ 0.27g) = grade C (D-009)
 * Thresholds defined in libs/constants.js as GRADE_THRESHOLDS.
 */

/**
 * Get letter grade from CO2 grams
 * Uses GRADE_THRESHOLDS from constants.js — no magic numbers.
 * @param {number} co2Grams
 * @returns {object} - { grade, label, color }
 */
function getGrade(co2Grams) {
  const T = globalThis.GRADE_THRESHOLDS;
  const C = globalThis.BADGE_COLORS;

  const grades = [
    { max: T["A+"], grade: "A+", label: "Exceptional", color: C["A+"] },
    { max: T["A"],  grade: "A",  label: "Excellent",   color: C["A"] },
    { max: T["B"],  grade: "B",  label: "Good",        color: C["B"] },
    { max: T["C"],  grade: "C",  label: "Average",     color: C["C"] },
    { max: T["D"],  grade: "D",  label: "Below Avg",   color: C["D"] },
    { max: Infinity, grade: "F", label: "Poor",        color: C["F"] },
  ];

  for (const g of grades) {
    if (co2Grams < g.max) return g;
  }
  return grades[grades.length - 1];
}

if (typeof globalThis !== "undefined") {
  globalThis.getGrade = getGrade;
}

// AC-P13-001: Conditional CJS export (importScripts in SW is classic script context)
// BADGE_COLORS is already declared in constants.js (shared scope via importScripts)
if (typeof module !== "undefined") {
  module.exports = { getGrade, BADGE_COLORS: globalThis.BADGE_COLORS };
}
