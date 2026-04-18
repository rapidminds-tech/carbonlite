/**
 * Tests for shared constants — Phase 1 AC-P1-010
 */
import { describe, test, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Constants: REGION_INTENSITY", () => {
  // AC-P1-010: REGION_INTENSITY values are defined in exactly ONE location
  // and imported/referenced everywhere else
  test("test_ac_p1_010_region_intensity_defined_once", () => {
    // AC-P1-010: REGION_INTENSITY values are defined in exactly ONE location
    // and imported/referenced everywhere else (options.js, background.js, onboarding.js)
    const root = new URL("..", import.meta.url).pathname;
    const files = [
      "options/options.js",
      "onboarding/onboarding.js",
      "background.js",
      "libs/constants.js",
      "libs/co2.js",
    ];

    let definitionCount = 0;
    let definitionFile = null;

    for (const file of files) {
      const filePath = path.join(root, file);
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, "utf-8");

      // Count files that DEFINE the full REGION_INTENSITY map (with values)
      // Look for the object literal with region keys
      if (content.match(/REGION_INTENSITY\s*=\s*\{[\s\S]*?us:\s*\d+/)) {
        definitionCount++;
        definitionFile = file;
      }
    }

    expect(definitionCount).toBe(1);
    // The single definition should be in libs/constants.js (shared location)
    expect(definitionFile).toBe("libs/constants.js");
  });

  test("test_ac_p1_010_region_intensity_importable", async () => {
    // AC-P1-010: The shared REGION_INTENSITY can be loaded via globalThis
    await import("../libs/constants.js");
    const RI = globalThis.REGION_INTENSITY;
    expect(RI).toBeDefined();
    expect(RI.auto).toBe(null);
    expect(RI.us).toBe(390);
    expect(RI.eu).toBe(270);
    expect(RI.uk).toBe(230);
    expect(RI.fr).toBe(60);
    expect(RI.in).toBe(700);
  });
});
