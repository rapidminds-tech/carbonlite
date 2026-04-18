/**
 * Tests for CO2 calculation engine — Phase 1 ACs related to grid intensity
 */
import { describe, test, expect } from "vitest";

// Load co2.js via globalThis
await import("../libs/co2.js");
const CO2 = globalThis.CO2;

describe("CO2 Engine", () => {
  // AC-P1-008: When a user selects a region in options, calculateForTab passes
  // the corresponding gridIntensity value to CO2.calculate()
  test("test_ac_p1_008_grid_intensity_passed_to_calculate", () => {
    // AC-P1-008: When a user selects a region in options, calculateForTab passes
    // the corresponding gridIntensity value to CO2.calculate()
    const bytes = 1_000_000; // 1MB

    // Calculate with custom grid intensity (e.g., France = 60 gCO2e/kWh)
    const resultCustom = CO2.calculate(bytes, { gridIntensity: 60 });
    // Calculate with default
    const resultDefault = CO2.calculate(bytes);

    // Custom intensity should produce less CO2 than default (480)
    expect(resultCustom.co2).toBeLessThan(resultDefault.co2);
    // The details should reflect the custom intensity for non-green hosting
    expect(resultCustom.details.gridIntensity).toBe(60);
  });

  // AC-P1-009: When region is set to "auto" (default), the global average (480 gCO2e/kWh) is used
  test("test_ac_p1_009_default_global_average_480", () => {
    // AC-P1-009: When region is set to "auto" (default), global average 480 gCO2e/kWh is used
    expect(CO2.GLOBAL_GRID_INTENSITY).toBe(480);

    const bytes = 1_000_000;
    const result = CO2.calculate(bytes); // no gridIntensity option
    // Should use 480 by default
    expect(result.details.gridIntensity).toBe(480);
  });

  test("test_ac_p1_008_green_hosting_uses_green_intensity", () => {
    // AC-P1-008 supplemental: green hosting should use GREEN_GRID_INTENSITY for DC
    const bytes = 1_000_000;
    const result = CO2.calculate(bytes, { greenHosting: true, gridIntensity: 700 });
    // Data center should use green intensity (50), not custom
    expect(result.details.gridIntensity).toBe(50);
  });
});
