/**
 * Phase 9: Accessibility, UX & Hardening
 * AC-P9-001 through AC-P9-014
 */
import { describe, test, expect, vi } from "vitest";
import { readFileSync } from "fs";

const root = new URL("..", import.meta.url).pathname;
function readSource(relPath) { return readFileSync(root + relPath, "utf-8"); }

// Load modules
await import("../libs/constants.js");
await import("../libs/co2.js");
await import("../libs/classifier.js");

// ── Sub-Phase 9A: Accessibility ────────────────────────

describe("AC-P9-001: Canvas elements have table fallback", () => {
  test("test_ac_p9_001_sparkline_has_sr_table", () => {
    // AC-P9-001: Canvas sparkline has a visually-hidden table fallback
    const html = readSource("sidepanel/panel.html");
    // Should have a visually-hidden element near the sparkline canvas
    expect(html).toMatch(/sparkline/);
    expect(html).toMatch(/sr-only|visually-hidden/);
  });

  test("test_ac_p9_001_trend_chart_has_sr_table", () => {
    // AC-P9-001: Canvas trendChart has a visually-hidden table fallback
    const html = readSource("sidepanel/panel.html");
    expect(html).toMatch(/trendChart/);
    // Should have a sr-only/visually-hidden table near the trend chart
    expect(html).toMatch(/trendChartTable|trendSrTable/);
  });
});

describe("AC-P9-002: Keyboard focus styles", () => {
  test("test_ac_p9_002_focus_visible_in_css", () => {
    // AC-P9-002: panel.css has :focus-visible styles with 2px outline
    const css = readSource("sidepanel/panel.css");
    expect(css).toMatch(/:focus-visible/);
    expect(css).toMatch(/outline.*2px|2px.*outline/);
  });
});

describe("AC-P9-003: Keyboard-accessible tooltips", () => {
  test("test_ac_p9_003_focus_tooltips_in_css", () => {
    // AC-P9-003: Tooltips appear on focus, not just hover
    const css = readSource("sidepanel/panel.css");
    // Should have :focus or :focus-within for tooltip visibility
    expect(css).toMatch(/:focus.*tooltip|tooltip.*:focus/i);
  });
});

describe("AC-P9-004: ARIA landmarks in options and onboarding", () => {
  test("test_ac_p9_004_options_has_main_landmark", () => {
    // AC-P9-004: options.html has <main> ARIA landmark
    const html = readSource("options/options.html");
    expect(html).toMatch(/<main[\s>]/);
  });

  test("test_ac_p9_004_options_has_skip_link", () => {
    // AC-P9-004: options.html has a skip-to-content link
    const html = readSource("options/options.html");
    expect(html).toMatch(/skip.*content|skipToContent|skip-link/i);
  });

  test("test_ac_p9_004_onboarding_has_main_landmark", () => {
    // AC-P9-004: onboarding.html has <main> ARIA landmark
    const html = readSource("onboarding/onboarding.html");
    expect(html).toMatch(/<main[\s>]/);
  });
});

describe("AC-P9-005: Grade badges use color AND text", () => {
  test("test_ac_p9_005_grade_always_has_text_label", () => {
    // AC-P9-005: Grade badge always shows text (A+, A, B, etc.)
    // The gradeLabel in panel.html always renders text, not just color
    const html = readSource("sidepanel/panel.html");
    expect(html).toMatch(/gradeLabel/);
    // panel-render.js sets textContent on gradeLabel
    const js = readSource("sidepanel/panel-render.js");
    expect(js).toMatch(/gradeLabel.*textContent|textContent.*grade\.grade/);
  });
});

// ── Sub-Phase 9B: Error State UX ───────────────────────

describe("AC-P9-006: Green hosting API failure shows message", () => {
  test("test_ac_p9_006_hosting_unknown_shows_message", () => {
    // AC-P9-006: When hosting is null (API unreachable), shows "Unable to verify"
    const js = readSource("sidepanel/panel-render.js");
    expect(js).toMatch(/Unable to verify|hosting status unknown|unavailable/i);
  });
});

describe("AC-P9-007: Performance API blocked shows message", () => {
  test("test_ac_p9_007_perf_blocked_message_in_panel", () => {
    // AC-P9-007: Panel shows message when Performance API is blocked
    const html = readSource("sidepanel/panel.html");
    // unsupportedState or a similar element should explain why
    expect(html).toMatch(/unsupportedState|perfBlocked|can.*measure/i);
  });
});

describe("AC-P9-008: Sparkline < 2 points shows message", () => {
  test("test_ac_p9_008_sparkline_empty_shows_message", () => {
    // AC-P9-008: Sparkline with < 2 data points shows "Visit again to see trends"
    const js = readSource("sidepanel/panel-render.js");
    expect(js).toMatch(/Visit.*again|see trends|not enough data/i);
  });
});

describe("AC-P9-009: Storage quota toast notification", () => {
  test("test_ac_p9_009_quota_exceeded_toast_in_background", () => {
    // AC-P9-009: Storage write failure triggers toast/console warning
    const js = readSource("background.js");
    expect(js).toMatch(/Storage.*prun|quota|oldest.*history/i);
  });
});

// ── Sub-Phase 9C: CSP & Validation ─────────────────────

describe("AC-P9-010: Inline styles extracted to CSS files", () => {
  test("test_ac_p9_010_options_no_inline_style", () => {
    // AC-P9-010: options.html has no <style> block
    const html = readSource("options/options.html");
    expect(html).not.toMatch(/<style[\s>]/);
  });

  test("test_ac_p9_010_options_has_link_css", () => {
    // AC-P9-010: options.html links to options.css
    const html = readSource("options/options.html");
    expect(html).toMatch(/options\.css/);
  });

  test("test_ac_p9_010_onboarding_no_inline_style", () => {
    // AC-P9-010: onboarding.html has no <style> block
    const html = readSource("onboarding/onboarding.html");
    expect(html).not.toMatch(/<style[\s>]/);
  });

  test("test_ac_p9_010_onboarding_has_link_css", () => {
    // AC-P9-010: onboarding.html links to onboarding.css
    const html = readSource("onboarding/onboarding.html");
    expect(html).toMatch(/onboarding\.css/);
  });

  test("test_ac_p9_010_options_css_file_exists", () => {
    // AC-P9-010: options/options.css file exists
    expect(() => readSource("options/options.css")).not.toThrow();
    const css = readSource("options/options.css");
    expect(css.length).toBeGreaterThan(100);
  });

  test("test_ac_p9_010_onboarding_css_file_exists", () => {
    // AC-P9-010: onboarding/onboarding.css file exists
    expect(() => readSource("onboarding/onboarding.css")).not.toThrow();
    const css = readSource("onboarding/onboarding.css");
    expect(css.length).toBeGreaterThan(50);
  });
});

describe("AC-P9-011: Explicit CSP in manifest.json", () => {
  test("test_ac_p9_011_manifest_has_csp", () => {
    // AC-P9-011: manifest.json declares content_security_policy
    const manifest = JSON.parse(readSource("manifest.json"));
    expect(manifest.content_security_policy).toBeDefined();
    expect(manifest.content_security_policy.extension_pages).toBeDefined();
    expect(manifest.content_security_policy.extension_pages).toMatch(/script-src.*'self'/);
    expect(manifest.content_security_policy.extension_pages).toMatch(/object-src.*'none'/);
  });
});

describe("AC-P9-012: checkGreenHosting URL validation", () => {
  test("test_ac_p9_012_invalid_url_returns_null", async () => {
    // AC-P9-012: checkGreenHosting wraps URL parsing in try/catch
    const bg = await import("../libs/background-core.js");
    const result = await bg.checkGreenHosting("javascript:alert(1)");
    expect(result.green).toBeNull();
  });

  test("test_ac_p9_012_data_url_returns_null", async () => {
    // AC-P9-012: data: URL returns null
    const bg = await import("../libs/background-core.js");
    const result = await bg.checkGreenHosting("data:text/html,test");
    expect(result.green).toBeNull();
  });

  test("test_ac_p9_012_blob_url_returns_null", async () => {
    // AC-P9-012: blob: URL returns null
    const bg = await import("../libs/background-core.js");
    const result = await bg.checkGreenHosting("blob:https://example.com/123");
    expect(result.green).toBeNull();
  });
});

// ── Sub-Phase 9D: Data Model Versioning ────────────────

describe("AC-P9-013: Data includes _version field", () => {
  test("test_ac_p9_013_history_includes_version", () => {
    // AC-P9-013: saveToHistory adds _version field
    const source = readSource("background.js");
    expect(source).toMatch(/_version/);
  });
});

describe("AC-P9-014: migrations.js module exists", () => {
  test("test_ac_p9_014_migrations_module_exists", async () => {
    // AC-P9-014: libs/migrations.js exports migrate function
    const mod = await import("../libs/migrations.js");
    expect(mod.migrate).toBeDefined();
    expect(typeof mod.migrate).toBe("function");
  });

  test("test_ac_p9_014_migrate_v1_passthrough", async () => {
    // AC-P9-014: For v1, migrate is a no-op passthrough
    const { migrate } = await import("../libs/migrations.js");
    const data = { co2: 0.5, grade: "C", _version: 1 };
    const result = migrate(data, 1, 1);
    expect(result).toEqual(data);
  });

  test("test_ac_p9_014_migrate_missing_version", async () => {
    // AC-P9-014: Data without _version gets migrated (treated as v0)
    const { migrate } = await import("../libs/migrations.js");
    const data = { co2: 0.5, grade: "C" };
    const result = migrate(data, 0, 1);
    expect(result._version).toBe(1);
  });
});
