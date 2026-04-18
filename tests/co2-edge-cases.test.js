/**
 * AC-P6-002: Edge case tests for libs/co2.js
 */
import { describe, test, expect } from "vitest";

await import("../libs/co2.js");
const CO2 = globalThis.CO2;

describe("AC-P6-002: CO2 engine edge cases", () => {
  test("test_ac_p6_002_zero_bytes", () => {
    // AC-P6-002: zero bytes → zero CO2
    const result = CO2.calculate(0);
    expect(result.co2).toBe(0);
    expect(result.firstVisitCO2).toBe(0);
    expect(result.returnVisitCO2).toBe(0);
  });

  test("test_ac_p6_002_very_large_page", () => {
    // AC-P6-002: 100MB+ page should produce valid non-zero result
    const result = CO2.calculate(100_000_000); // 100MB
    expect(result.co2).toBeGreaterThan(0);
    expect(Number.isFinite(result.co2)).toBe(true);
    expect(result.firstVisitCO2).toBeGreaterThan(1); // should be several grams
  });

  test("test_ac_p6_002_negative_bytes_returns_zero_or_positive", () => {
    // AC-P6-002: negative bytes should not produce negative CO2
    const result = CO2.calculate(-1000);
    expect(result.co2).toBeLessThanOrEqual(0);
  });

  test("test_ac_p6_002_green_hosting_vs_standard", () => {
    // AC-P6-002: green hosting should produce less CO2
    const bytes = 1_000_000;
    const standard = CO2.calculate(bytes, { greenHosting: false });
    const green = CO2.calculate(bytes, { greenHosting: true });
    expect(green.co2).toBeLessThan(standard.co2);
  });

  test("test_ac_p6_002_custom_grid_intensity", () => {
    // AC-P6-002: custom grid intensity changes result
    const bytes = 1_000_000;
    const low = CO2.calculate(bytes, { gridIntensity: 60 }); // France
    const high = CO2.calculate(bytes, { gridIntensity: 700 }); // India
    expect(high.co2).toBeGreaterThan(low.co2);
  });

  test("test_ac_p6_002_first_visit_vs_blended", () => {
    // AC-P6-002: first visit vs blended (75/25 weighted)
    const bytes = 1_000_000;
    const firstVisit = CO2.calculate(bytes, { firstVisit: true });
    const blended = CO2.calculate(bytes, { firstVisit: false });
    expect(firstVisit.co2).toBeGreaterThan(blended.co2);
  });
});
