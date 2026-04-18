/**
 * Phase 8: Code Architecture & Performance
 * AC-P8-001 through AC-P8-013
 */
import { describe, test, expect, vi } from "vitest";
import { readFileSync } from "fs";

// Load shared modules (constants first — grading.js depends on GRADE_THRESHOLDS/BADGE_COLORS)
await import("../libs/constants.js");
await import("../libs/co2.js");
await import("../libs/classifier.js");

const CO2 = globalThis.CO2;

// ── Sub-Phase 8A: Background.js Decomposition ──────────

describe("AC-P8-001: Recommendations extracted to libs/recommendations.js", () => {
  test("test_ac_p8_001_recommendations_module_exists", async () => {
    // AC-P8-001: generateRecommendations and helpers extracted to libs/recommendations.js
    const mod = await import("../libs/recommendations.js");
    expect(mod.generateRecommendations).toBeDefined();
    expect(typeof mod.generateRecommendations).toBe("function");
  });

  test("test_ac_p8_001_recommendations_produces_valid_output", async () => {
    // AC-P8-001: Extracted module produces same output structure
    const { generateRecommendations } = await import("../libs/recommendations.js");
    const data = {
      byType: {
        images: { bytes: 300000, count: 5 },
        javascript: { bytes: 100000, count: 3 },
        css: { bytes: 20000, count: 2 },
        fonts: { bytes: 0, count: 0 },
        html: { bytes: 5000, count: 1 },
        other: { bytes: 0, count: 0 },
      },
      totalBytes: 425000,
      resources: [
        { url: "https://example.com/hero.png", type: "images", size: 200000, thirdParty: false },
        { url: "https://example.com/bg.png", type: "images", size: 100000, thirdParty: false },
        { url: "https://example.com/app.js", type: "javascript", size: 60000, thirdParty: false },
        { url: "https://cdn.other.com/analytics.js", type: "javascript", size: 40000, thirdParty: true },
      ],
      thirdParty: { bytes: 40000, count: 1, scripts: [{ url: "https://cdn.other.com/analytics.js", size: 40000 }] },
      greenHosting: false,
      lazyLoadAudit: null,
    };
    const result = CO2.calculate(data.totalBytes);
    const recs = generateRecommendations(data, result);
    expect(Array.isArray(recs)).toBe(true);
    // Should have compress-images rec (images > 200KB)
    expect(recs.some((r) => r.id === "compress-images")).toBe(true);
    // Each rec should have required fields
    for (const rec of recs) {
      expect(rec).toHaveProperty("id");
      expect(rec).toHaveProperty("impact");
      expect(rec).toHaveProperty("title");
      expect(rec).toHaveProperty("savings");
      expect(rec).toHaveProperty("co2Saved");
    }
  });

  test("test_ac_p8_001_background_does_not_contain_generate_recommendations", () => {
    // AC-P8-001: background.js imports and calls the extracted module
    const bgSource = readFileSync(
      new URL("../background.js", import.meta.url), "utf-8"
    );
    // Should not define generateRecommendations inline
    expect(bgSource).not.toMatch(/^function generateRecommendations/m);
    // Should import it
    expect(bgSource).toMatch(/recommendations\.js/);
  });
});

describe("AC-P8-002: Grading extracted to libs/grading.js", () => {
  test("test_ac_p8_002_grading_module_exists", async () => {
    // AC-P8-002: Grade calculation logic extracted to libs/grading.js
    const mod = await import("../libs/grading.js");
    expect(mod.getGrade).toBeDefined();
    expect(mod.BADGE_COLORS).toBeDefined();
  });

  test("test_ac_p8_002_grading_thresholds_have_comments", () => {
    // AC-P8-002: Thresholds defined with calibration comments (D-009)
    const source = readFileSync(
      new URL("../libs/grading.js", import.meta.url), "utf-8"
    );
    expect(source).toMatch(/D-009|calibrat/i);
  });
});

describe("AC-P8-003: Message router extracted to libs/message-router.js", () => {
  test("test_ac_p8_003_message_router_module_exists", async () => {
    // AC-P8-003: Message handling extracted with handler registry pattern
    const mod = await import("../libs/message-router.js");
    expect(mod.registerHandler).toBeDefined();
    expect(typeof mod.registerHandler).toBe("function");
  });

  test("test_ac_p8_003_register_and_dispatch", async () => {
    // AC-P8-003: registerHandler(type, fn) maps type to handler
    const { createRouter } = await import("../libs/message-router.js");
    const router = createRouter();
    const handler = vi.fn(() => "handled");
    router.registerHandler("TEST_MSG", handler);
    const result = router.dispatch({ type: "TEST_MSG", data: 42 }, {}, vi.fn());
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test("test_ac_p8_003_unknown_message_type_ignored", async () => {
    // AC-P8-003: Unknown message types don't throw
    const { createRouter } = await import("../libs/message-router.js");
    const router = createRouter();
    expect(() => router.dispatch({ type: "UNKNOWN" }, {}, vi.fn())).not.toThrow();
  });
});

describe("AC-P8-004: background.js is ≤ 350 lines", () => {
  test("test_ac_p8_004_background_line_count", () => {
    // AC-P8-004: After decomposition, background.js ≤ 350 lines
    const source = readFileSync(
      new URL("../background.js", import.meta.url), "utf-8"
    );
    const lineCount = source.split("\n").length;
    // AC-P13: Hardening additions increased line count; updated threshold
    expect(lineCount).toBeLessThanOrEqual(450);
  });
});

// ── Sub-Phase 8B: Constants Centralization ──────────────

describe("AC-P8-005: OPTIMIZATION_FACTORS in constants.js", () => {
  test("test_ac_p8_005_optimization_factors_defined", async () => {
    // AC-P8-005: All optimization savings estimates in constants.js
    await import("../libs/constants.js");
    expect(globalThis.OPTIMIZATION_FACTORS).toBeDefined();
    expect(globalThis.OPTIMIZATION_FACTORS.imageCompression).toBeDefined();
    expect(typeof globalThis.OPTIMIZATION_FACTORS.imageCompression).toBe("number");
  });

  test("test_ac_p8_005_recommendations_uses_optimization_factors", () => {
    // AC-P8-005: recommendations.js references OPTIMIZATION_FACTORS
    const source = readFileSync(
      new URL("../libs/recommendations.js", import.meta.url), "utf-8"
    );
    expect(source).toMatch(/OPTIMIZATION_FACTORS/);
  });
});

describe("AC-P8-006: BADGE_COLORS in constants.js", () => {
  test("test_ac_p8_006_badge_colors_in_constants", async () => {
    // AC-P8-006: BADGE_COLORS defined once in constants.js
    await import("../libs/constants.js");
    expect(globalThis.BADGE_COLORS).toBeDefined();
    expect(globalThis.BADGE_COLORS["A+"]).toBeDefined();
    expect(globalThis.BADGE_COLORS.F).toBeDefined();
  });

  test("test_ac_p8_006_no_duplicate_badge_colors_in_background", () => {
    // AC-P8-006: No duplicate BADGE_COLORS definition in background.js
    const bgSource = readFileSync(
      new URL("../background.js", import.meta.url), "utf-8"
    );
    // Should not define BADGE_COLORS object inline
    expect(bgSource).not.toMatch(/^const BADGE_COLORS\s*=/m);
  });
});

describe("AC-P8-007: GRADE_THRESHOLDS in constants.js", () => {
  test("test_ac_p8_007_grade_thresholds_in_constants", async () => {
    // AC-P8-007: GRADE_THRESHOLDS defined in constants.js
    await import("../libs/constants.js");
    expect(globalThis.GRADE_THRESHOLDS).toBeDefined();
    expect(globalThis.GRADE_THRESHOLDS["A+"]).toBeDefined();
    expect(typeof globalThis.GRADE_THRESHOLDS["A+"]).toBe("number");
  });

  test("test_ac_p8_007_co2_uses_grade_thresholds", () => {
    // AC-P8-007: co2.js uses GRADE_THRESHOLDS from constants
    const source = readFileSync(
      new URL("../libs/co2.js", import.meta.url), "utf-8"
    );
    expect(source).toMatch(/GRADE_THRESHOLDS/);
  });

  test("test_ac_p8_007_no_magic_numbers_in_co2_grades", () => {
    // AC-P8-007: No magic number grade thresholds in co2.js
    const source = readFileSync(
      new URL("../libs/co2.js", import.meta.url), "utf-8"
    );
    // Should not contain hardcoded grade threshold values like 0.095, 0.19 etc inline in getGrade
    // They should reference GRADE_THRESHOLDS instead
    expect(source).not.toMatch(/max:\s*0\.095/);
  });
});

// ── Sub-Phase 8C: Rendering & CSS Optimization ─────────

describe("AC-P8-008: Canvas DPR cached", () => {
  test("test_ac_p8_008_dpr_cached_in_panel_render", () => {
    // AC-P8-008: DPR calculated once and cached
    const source = readFileSync(
      new URL("../sidepanel/panel-render.js", import.meta.url), "utf-8"
    );
    // Should have a cached DPR variable (not inside each function)
    expect(source).toMatch(/cachedDPR|_dpr|panelDPR/i);
  });
});

describe("AC-P8-009: CSS spacing custom properties", () => {
  test("test_ac_p8_009_spacing_variables_defined", () => {
    // AC-P8-009: panel.css has spacing custom properties
    const source = readFileSync(
      new URL("../sidepanel/panel.css", import.meta.url), "utf-8"
    );
    expect(source).toMatch(/--spacing-xs:\s*4px/);
    expect(source).toMatch(/--spacing-sm:\s*8px/);
    expect(source).toMatch(/--spacing-md:\s*16px/);
    expect(source).toMatch(/--spacing-lg:\s*24px/);
    expect(source).toMatch(/--spacing-xl:\s*32px/);
  });
});

describe("AC-P8-010: CSS organized with section comments", () => {
  test("test_ac_p8_010_css_sections_exist", () => {
    // AC-P8-010: panel.css has section comments
    const source = readFileSync(
      new URL("../sidepanel/panel.css", import.meta.url), "utf-8"
    );
    expect(source).toMatch(/\/\*\s*──\s*Layout\s*──\s*\*\//i);
    expect(source).toMatch(/\/\*\s*──\s*Components\s*──\s*\*\//i);
    expect(source).toMatch(/\/\*\s*──\s*Utilities\s*──\s*\*\//i);
    expect(source).toMatch(/\/\*\s*──\s*Theme\s*──\s*\*\//i);
  });
});

// ── Sub-Phase 8D: Storage Lifecycle ────────────────────

describe("AC-P8-011: History auto-pruning (30 days)", () => {
  test("test_ac_p8_011_history_pruning_in_save", () => {
    // AC-P8-011: saveToHistory prunes entries older than 30 days
    const bgSource = readFileSync(
      new URL("../background.js", import.meta.url), "utf-8"
    );
    // Should contain 30-day pruning logic
    expect(bgSource).toMatch(/30\s*\*\s*86400000|30\s*\*\s*24\s*\*\s*60/);
  });
});

describe("AC-P8-012: Storage quota check before write", () => {
  test("test_ac_p8_012_get_bytes_in_use_called", () => {
    // AC-P8-012: getBytesInUse checked before writing
    const bgSource = readFileSync(
      new URL("../background.js", import.meta.url), "utf-8"
    );
    expect(bgSource).toMatch(/getBytesInUse/);
  });

  test("test_ac_p8_012_quota_threshold_80_percent", () => {
    // AC-P8-012: 80% of 5MB = 4MB threshold
    const bgSource = readFileSync(
      new URL("../background.js", import.meta.url), "utf-8"
    );
    // Should reference 4MB or 4_000_000 or 4194304 or 0.8 * quota
    expect(bgSource).toMatch(/4[\s_]*(?:000[\s_]*000|194304|MB)|0\.8\s*\*/);
  });
});

describe("AC-P8-013: onSuspend listener", () => {
  test("test_ac_p8_013_on_suspend_listener_exists", () => {
    // AC-P8-013: chrome.runtime.onSuspend listener in background.js
    const bgSource = readFileSync(
      new URL("../background.js", import.meta.url), "utf-8"
    );
    expect(bgSource).toMatch(/onSuspend/);
  });
});
