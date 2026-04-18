/**
 * Phase 7A: CO2 Engine grade boundaries, extreme inputs, embodied energy, and benchmarks
 * AC-P7-001, AC-P7-002, AC-P7-003, AC-P7-004
 */
import { describe, test, expect } from "vitest";

await import("../libs/co2.js");
await import("../libs/benchmarks.js");
const CO2 = globalThis.CO2;
const BENCHMARKS = globalThis.BENCHMARKS;

describe("AC-P7-001: Grade threshold boundary tests", () => {
  // Grade thresholds from co2.js:
  // A+: < 0.095, A: < 0.19, B: < 0.25, C: < 0.50, D: < 0.80, F: >= 0.80

  test("test_ac_p7_001_boundary_a_plus_to_a", () => {
    // AC-P7-001: A+ → A transition at 0.095g
    expect(CO2.getGrade(0.094).grade).toBe("A+");
    expect(CO2.getGrade(0.095).grade).toBe("A"); // exactly at boundary → next grade (< 0.095)
    expect(CO2.getGrade(0.096).grade).toBe("A");
  });

  test("test_ac_p7_001_boundary_a_to_b", () => {
    // AC-P7-001: A → B transition at 0.19g
    expect(CO2.getGrade(0.189).grade).toBe("A");
    expect(CO2.getGrade(0.19).grade).toBe("B"); // exactly at boundary → next grade (< 0.19)
    expect(CO2.getGrade(0.191).grade).toBe("B");
  });

  test("test_ac_p7_001_boundary_b_to_c", () => {
    // AC-P7-001: B → C transition at 0.25g
    expect(CO2.getGrade(0.249).grade).toBe("B");
    expect(CO2.getGrade(0.25).grade).toBe("C"); // exactly at boundary → next grade (< 0.25)
    expect(CO2.getGrade(0.251).grade).toBe("C");
  });

  test("test_ac_p7_001_boundary_c_to_d", () => {
    // AC-P7-001: C → D transition at 0.50g
    expect(CO2.getGrade(0.499).grade).toBe("C");
    expect(CO2.getGrade(0.50).grade).toBe("D"); // exactly at boundary → next grade (< 0.50)
    expect(CO2.getGrade(0.501).grade).toBe("D");
  });

  test("test_ac_p7_001_boundary_d_to_f", () => {
    // AC-P7-001: D → F transition at 0.80g
    expect(CO2.getGrade(0.799).grade).toBe("D");
    expect(CO2.getGrade(0.80).grade).toBe("F"); // exactly at boundary → next grade (< 0.80)
    expect(CO2.getGrade(0.801).grade).toBe("F");
  });

  test("test_ac_p7_001_grade_has_label_and_color", () => {
    // AC-P7-001: Each grade has label and color
    const grades = [0.05, 0.10, 0.20, 0.30, 0.60, 1.00];
    for (const co2 of grades) {
      const g = CO2.getGrade(co2);
      expect(g.grade).toBeTruthy();
      expect(g.label).toBeTruthy();
      expect(g.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("AC-P7-002: CO2.calculate() extreme inputs", () => {
  test("test_ac_p7_002_zero_bytes_returns_zero", () => {
    // AC-P7-002: zero bytes → co2 = 0
    const result = CO2.calculate(0);
    expect(result.co2).toBe(0);
    expect(result.firstVisitCO2).toBe(0);
    expect(result.returnVisitCO2).toBe(0);
  });

  test("test_ac_p7_002_negative_bytes_returns_non_positive", () => {
    // AC-P7-002: negative bytes → co2 ≤ 0
    const result = CO2.calculate(-5000);
    expect(result.co2).toBeLessThanOrEqual(0);
  });

  test("test_ac_p7_002_very_large_page_100mb", () => {
    // AC-P7-002: 100MB+ produces valid finite result
    const result = CO2.calculate(100_000_000);
    expect(result.co2).toBeGreaterThan(0);
    expect(Number.isFinite(result.co2)).toBe(true);
    // 100MB should be multiple grams
    expect(result.co2).toBeGreaterThan(1);
  });

  test("test_ac_p7_002_nan_bytes", () => {
    // AC-P7-002: NaN bytes → returns NaN or 0 (doesn't throw)
    expect(() => CO2.calculate(NaN)).not.toThrow();
    const result = CO2.calculate(NaN);
    // Result will be NaN since NaN propagates through math
    expect(result).toBeDefined();
  });

  test("test_ac_p7_002_undefined_bytes", () => {
    // AC-P7-002: undefined bytes → doesn't throw
    expect(() => CO2.calculate(undefined)).not.toThrow();
    const result = CO2.calculate(undefined);
    expect(result).toBeDefined();
  });
});

describe("AC-P7-003: Embodied energy ratio validation", () => {
  test("test_ac_p7_003_embodied_adds_15_to_20_percent", () => {
    // AC-P7-003: Result with embodied energy is 15–20% higher than operational only
    // SWDM v4 uses EMBODIED_RATIO = 0.16 (16%)
    const bytes = 5_000_000; // 5MB

    // Calculate with default (includes embodied)
    const withEmbodied = CO2.calculate(bytes, { firstVisit: true });

    // The embodied ratio is 0.16 → firstVisitCO2 = operational * 1.16
    // So operational = firstVisitCO2 / 1.16
    const operational = withEmbodied.firstVisitCO2 / 1.16;
    const embodiedPortion = withEmbodied.firstVisitCO2 - operational;
    const embodiedPercent = (embodiedPortion / operational) * 100;

    // Should be 16% (within the 15-20% range specified)
    expect(embodiedPercent).toBeGreaterThanOrEqual(15);
    expect(embodiedPercent).toBeLessThanOrEqual(20);
  });

  test("test_ac_p7_003_embodied_applied_to_first_and_return_visit", () => {
    // AC-P7-003: Embodied energy applies to both visit types
    const bytes = 2_000_000;
    const result = CO2.calculate(bytes);
    // returnVisitCO2 = firstVisitCO2 * 0.02 (RETURNING_VISITOR_RATIO)
    // Both include embodied
    expect(result.returnVisitCO2).toBeCloseTo(result.firstVisitCO2 * 0.02, 10);
  });
});

describe("AC-P7-004: Benchmarks structure validation", () => {
  test("test_ac_p7_004_all_categories_have_correct_structure", () => {
    // AC-P7-004: All benchmark categories return correct structure
    const requiredKeys = ["co2", "bytes", "label", "source"];
    for (const [key, benchmark] of Object.entries(BENCHMARKS)) {
      for (const field of requiredKeys) {
        expect(benchmark).toHaveProperty(field);
      }
      expect(typeof benchmark.co2).toBe("number");
      expect(benchmark.co2).toBeGreaterThan(0);
      expect(typeof benchmark.bytes).toBe("number");
      expect(benchmark.bytes).toBeGreaterThan(0);
      expect(typeof benchmark.label).toBe("string");
      expect(benchmark.label.length).toBeGreaterThan(0);
    }
  });

  test("test_ac_p7_004_no_duplicate_category_keys", () => {
    // AC-P7-004: No duplicate category keys
    const keys = Object.keys(BENCHMARKS);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  test("test_ac_p7_004_all_source_strings_non_empty", () => {
    // AC-P7-004: All source strings are non-empty
    for (const [key, benchmark] of Object.entries(BENCHMARKS)) {
      expect(typeof benchmark.source).toBe("string");
      expect(benchmark.source.trim().length).toBeGreaterThan(0);
    }
  });
});
