/**
 * Tests for Phase 3: Carbon Methodology Fixes
 * AC-P3-001 through AC-P3-010
 */
import { describe, test, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const root = new URL("..", import.meta.url).pathname;
function readSource(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf-8");
}

// Load CO2 engine
await import("../libs/co2.js");
const CO2 = globalThis.CO2;

describe("AC-P3-001: Embodied energy included", () => {
  test("test_ac_p3_001_embodied_energy_in_calculation", () => {
    // AC-P3-001: CO2 calculation includes embodied energy:
    // totalCO2 = operationalCO2 × 1.16 (16% hardware manufacturing overhead)
    const bytes = 1_000_000;
    const result = CO2.calculate(bytes);

    // Calculate expected operational CO2 manually
    const gb = bytes / 1_000_000_000;
    const energy = gb * (0.055 + 0.059 + 0.080); // 0.194 kWh/GB
    const operationalCO2 = energy * 480; // global average

    // First visit CO2 should be operational × 1.16
    const expectedFirstVisit = operationalCO2 * 1.16;
    expect(result.firstVisitCO2).toBeCloseTo(expectedFirstVisit, 6);

    // Embodied should add ~16% on top
    expect(result.firstVisitCO2).toBeGreaterThan(operationalCO2);
    expect(result.firstVisitCO2 / operationalCO2).toBeCloseTo(1.16, 2);
  });
});

describe("AC-P3-002: Global grid intensity is 480", () => {
  test("test_ac_p3_002_global_grid_intensity_480", () => {
    // AC-P3-002: Global grid intensity constant is 480 gCO2e/kWh (Ember 2023)
    expect(CO2.GLOBAL_GRID_INTENSITY).toBe(480);
  });
});

describe("AC-P3-003: Script deferral no false CO2 claims", () => {
  test("test_ac_p3_003_defer_scripts_no_co2_savings", () => {
    // AC-P3-003: Script deferral recommendation does NOT claim carbon savings
    // Recommendations extracted to libs/recommendations.js (AC-P8-001)
    const source = readSource("libs/recommendations.js");

    // Find the defer-scripts recommendation block
    const deferMatch = source.match(/id:\s*["']defer-scripts["'][\s\S]*?(?=\n\s*\/\/|\n\s*if\s*\()/);
    expect(deferMatch).not.toBeNull();

    const deferBlock = deferMatch[0];
    // co2Saved and savings should be 0
    expect(deferBlock).toMatch(/co2Saved:\s*0/);
    expect(deferBlock).toMatch(/savings:\s*0/);
    expect(deferBlock).toMatch(/savingsPercent:\s*0/);
  });
});

describe("AC-P3-004: CORS transferSize estimation", () => {
  test("test_ac_p3_004_cors_fallback_to_decoded_body_size", () => {
    // AC-P3-004: For CORS resources where transferSize === 0, estimate from
    // encodedBodySize or fall back to decodedBodySize
    const source = readSource("background.js");

    // The size calculation should include decodedBodySize as a fallback
    // Pattern: transferSize || encodedBodySize || decodedBodySize || 0
    expect(source).toMatch(/transferSize\s*\|\|\s*\w*\.?encodedBodySize\s*\|\|\s*\w*\.?decodedBodySize/);
  });
});

describe("AC-P3-005: No double-counting cache savings", () => {
  test("test_ac_p3_005_no_caching_co2_double_count", () => {
    // AC-P3-005: Caching recommendation does NOT claim additional CO2 savings
    // on top of SWDM's built-in returning visitor ratio
    const source = readSource("background.js");

    // Search for any "caching" or "cache" recommendation
    // If one exists, it should NOT claim co2Saved > 0 (already in SWDM model)
    const cachingRec = source.match(/id:\s*["'].*cache.*["'][\s\S]*?co2Saved:\s*(\d+)/i);
    if (cachingRec) {
      // co2Saved must be 0 — savings already factored into SWDM returning visitor ratio
      expect(parseInt(cachingRec[1])).toBe(0);
    }
    // If no caching rec exists, that's also fine
  });
});

describe("AC-P3-006: Grade thresholds calibrated for median", () => {
  test("test_ac_p3_006_median_page_gets_grade_c_or_d", () => {
    // AC-P3-006: HTTP Archive median page (~2.5MB) receives grade C or D
    const medianBytes = 2_500_000; // 2.5MB
    const result = CO2.calculate(medianBytes, { greenHosting: false, firstVisit: true });
    const grade = CO2.getGrade(result.co2);

    expect(["C", "D"]).toContain(grade.grade);
  });

  test("test_ac_p3_006_small_page_gets_a_or_b", () => {
    // A 200KB page should get A+ or A
    const smallBytes = 200_000;
    const result = CO2.calculate(smallBytes, { greenHosting: false, firstVisit: true });
    const grade = CO2.getGrade(result.co2);
    expect(["A+", "A"]).toContain(grade.grade);
  });

  test("test_ac_p3_006_large_page_gets_d_or_f", () => {
    // A 10MB page should get D or F
    const largeBytes = 10_000_000;
    const result = CO2.calculate(largeBytes, { greenHosting: false, firstVisit: true });
    const grade = CO2.getGrade(result.co2);
    expect(["D", "F"]).toContain(grade.grade);
  });
});

describe("AC-P3-007: Benchmark source citations", () => {
  test("test_ac_p3_007_benchmarks_have_source", async () => {
    // AC-P3-007: Benchmark data includes source citations
    const source = readSource("libs/benchmarks.js");
    // Each benchmark entry should have a "source" field
    // OR there should be a top-level source comment/field
    await import("../libs/benchmarks.js");
    const BENCHMARKS = globalThis.BENCHMARKS;

    for (const [key, benchmark] of Object.entries(BENCHMARKS)) {
      expect(benchmark.source).toBeDefined();
      expect(benchmark.source.length).toBeGreaterThan(0);
    }
  });
});

describe("AC-P3-008: Image savings differentiated by format", () => {
  test("test_ac_p3_008_image_savings_per_format", () => {
    // AC-P3-008: Image optimization savings differentiate between source formats
    // Recommendations extracted to libs/recommendations.js (AC-P8-001)
    const source = readSource("libs/recommendations.js");

    // Should NOT use a blanket 65% for all images
    // The getSuggestionForImage function should have format-specific percentages
    // And the savings estimate should vary by format (not one blanket multiplier)
    const fn = source.match(/function getSuggestionForImage[\s\S]*?^}/m);
    expect(fn).not.toBeNull();

    const fnText = fn[0];
    // Should mention specific formats with different percentages
    expect(fnText).toMatch(/png/i);
    expect(fnText).toMatch(/jpg|jpeg/i);
    expect(fnText).toMatch(/gif/i);

    // The compress-images recommendation should NOT use a single blanket multiplier
    // like 0.6 (60%) for all images — should differentiate
    // Look for format-specific savings in the image recommendation
    const compressBlock = source.match(/id:\s*["']compress-images["'][\s\S]*?(?=\n\s*\/\/\s*\d|\nfunction)/);
    if (compressBlock) {
      // Either the main savings uses format-specific logic, or the detail suggestions do
      // At minimum, getSuggestionForImage differentiates
      expect(fnText).toMatch(/25|35|50|65/);
    }
  });
});

describe("AC-P3-009: Regional grid intensity from Ember 2023", () => {
  test("test_ac_p3_009_region_intensity_values", async () => {
    // AC-P3-009: Regional grid intensity values sourced from Ember 2023
    await import("../libs/constants.js");
    const REGION_INTENSITY = globalThis.REGION_INTENSITY;

    // Verify key values match Ember 2023 data
    expect(REGION_INTENSITY.us).toBe(390);
    expect(REGION_INTENSITY.eu).toBe(270);
    expect(REGION_INTENSITY.uk).toBe(230);
    expect(REGION_INTENSITY.in).toBe(700);
    expect(REGION_INTENSITY.fr).toBe(60);
    expect(REGION_INTENSITY.br).toBe(80);
    expect(REGION_INTENSITY.cn).toBe(530);
    expect(REGION_INTENSITY.auto).toBe(null);
  });

  test("test_ac_p3_009_source_cited_in_constants", () => {
    // The constants file should cite Ember 2023 as source
    const source = readSource("libs/constants.js");
    expect(source).toMatch(/Ember\s*2023/i);
  });
});

describe("AC-P3-010: Methodology explanation in UI", () => {
  test("test_ac_p3_010_methodology_section_in_panel", () => {
    // AC-P3-010: The extension displays a "methodology" or "how we calculate"
    // link/section that briefly explains SWDM v4, energy model, and grid intensity source
    const html = readSource("sidepanel/panel.html");

    // Should have a methodology section or link
    expect(html).toMatch(/methodology|how we calculate/i);
    expect(html).toMatch(/SWDM|Sustainable Web Design/i);
  });
});
