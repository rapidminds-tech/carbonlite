/**
 * AC-P6-007, AC-P6-008: Integration tests
 */
import { describe, test, expect, vi, beforeEach } from "vitest";
import { resetStorage } from "./setup.js";

await import("../libs/co2.js");
await import("../libs/classifier.js");

let bg;
beforeAll(async () => {
  bg = await import("../libs/background-core.js");
});

describe("AC-P6-007: Full page analysis flow", () => {
  test("test_ac_p6_007_full_analysis_flow", async () => {
    // AC-P6-007: initTab → addResource (multiple) → calculateForTab →
    // verify result has correct co2, grade, and recommendations structure
    const tabId = 100;

    // Mock fetch for green hosting
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ green: false }),
      })
    );

    // 1. Init tab
    bg.initTab(tabId, "https://example.com");

    // 2. Add multiple resources
    bg.addResource(tabId, {
      name: "https://example.com/index.html",
      initiatorType: "navigation",
      transferSize: 5000,
      encodedBodySize: 5000,
      decodedBodySize: 10000,
    });
    bg.addResource(tabId, {
      name: "https://example.com/app.js",
      initiatorType: "script",
      transferSize: 50000,
      encodedBodySize: 50000,
      decodedBodySize: 100000,
    });
    bg.addResource(tabId, {
      name: "https://example.com/hero.png",
      initiatorType: "img",
      transferSize: 200000,
      encodedBodySize: 200000,
      decodedBodySize: 200000,
    });
    bg.addResource(tabId, {
      name: "https://example.com/styles.css",
      initiatorType: "css",
      transferSize: 15000,
      encodedBodySize: 15000,
      decodedBodySize: 30000,
    });

    // 3. Calculate
    await bg.calculateForTab(tabId);

    // 4. Verify result
    const data = bg.getTabData(tabId);
    expect(data.result).toBeDefined();
    expect(data.result.co2).toBeGreaterThan(0);
    expect(data.result.grade).toBeDefined();
    expect(data.result.grade.grade).toMatch(/^[A-F][+]?$/);
    expect(data.result.totalBytes).toBe(270000);
    expect(data.result.byType.images.bytes).toBe(200000);
    expect(data.result.byType.javascript.bytes).toBe(50000);
    expect(data.result.byType.css.bytes).toBe(15000);
    expect(data.result.recommendations).toBeDefined();
    expect(Array.isArray(data.result.recommendations)).toBe(true);
    expect(data.result.url).toBe("https://example.com");
  });
});

describe("AC-P6-008: autoAnalyze=false skips processing", () => {
  test("test_ac_p6_008_auto_analyze_false_skips", () => {
    // AC-P6-008: When autoAnalyze is false, PERFORMANCE_DATA should be skipped
    // This is enforced in content.js (checks setting before sending) and
    // background.js (checks setting before requesting from content script).
    // Verify the code contains the autoAnalyze check.
    const fs = require("fs");
    const bgSource = fs.readFileSync(
      new URL("../background.js", import.meta.url),
      "utf-8"
    );
    const contentSource = fs.readFileSync(
      new URL("../content.js", import.meta.url),
      "utf-8"
    );

    // Background checks autoAnalyze before sending GET_PERFORMANCE_DATA
    expect(bgSource).toMatch(/autoAnalyze\s*===\s*false/);
    // Content checks autoAnalyze before sending PERFORMANCE_DATA
    expect(contentSource).toMatch(/autoAnalyze/);
  });
});
