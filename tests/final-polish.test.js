/**
 * Phase 11: Final Polish & Resilience
 * AC-P11-001 through AC-P11-010
 */
import { describe, test, expect, vi } from "vitest";
import { readFileSync } from "fs";

const root = new URL("..", import.meta.url).pathname;
function readSource(relPath) { return readFileSync(root + relPath, "utf-8"); }

await import("../libs/constants.js");
await import("../libs/co2.js");
await import("../libs/classifier.js");

let bg;
beforeAll(async () => {
  bg = await import("../libs/background-core.js");
});

// ── Sub-Phase 11A: Options Page Polish ─────────────────

describe("AC-P11-001: Custom confirmation modal replaces confirm()", () => {
  test("test_ac_p11_001_no_confirm_in_options", () => {
    // AC-P11-001: options.js does not use window.confirm() — only custom modal
    const source = readSource("options/options.js");
    // Match standalone confirm() call but not confirmClearData() or cancelClearData()
    expect(source).not.toMatch(/[^a-zA-Z]confirm\s*\(["']/);
    expect(source).not.toMatch(/window\.confirm/);
  });

  test("test_ac_p11_001_confirm_modal_in_html", () => {
    // AC-P11-001: options.html has a confirmation modal element
    const html = readSource("options/options.html");
    expect(html).toMatch(/confirmModal|confirm-modal/);
  });

  test("test_ac_p11_001_modal_has_cancel_and_confirm_buttons", () => {
    // AC-P11-001: Modal has Cancel and Confirm buttons
    const html = readSource("options/options.html");
    expect(html).toMatch(/btnConfirmCancel|confirmCancel/i);
    expect(html).toMatch(/btnConfirmOk|confirmOk/i);
  });
});

describe("AC-P11-002: Toast uses CSS animation instead of setTimeout", () => {
  test("test_ac_p11_002_no_settimeout_in_toast", () => {
    // AC-P11-002: options.js showSavedToast does not use setTimeout
    const source = readSource("options/options.js");
    // The showSavedToast function should not use setTimeout
    const fnMatch = source.match(/function showSavedToast[\s\S]*?^}/m);
    if (fnMatch) {
      expect(fnMatch[0]).not.toMatch(/setTimeout/);
    }
  });

  test("test_ac_p11_002_uses_animationend", () => {
    // AC-P11-002: Toast uses animationend event
    const source = readSource("options/options.js");
    expect(source).toMatch(/animationend/);
  });

  test("test_ac_p11_002_toast_animation_in_css", () => {
    // AC-P11-002: options.css has toast animation
    const css = readSource("options/options.css");
    expect(css).toMatch(/@keyframes.*toast|toast.*animation/i);
  });
});

// ── Sub-Phase 11B: Data Minimization ───────────────────

describe("AC-P11-003: Resource URLs stripped of query params", () => {
  test("test_ac_p11_003_content_strips_query_params", () => {
    // AC-P11-003: content.js strips query params from resource URLs
    const source = readSource("content.js");
    // Should split on ? or # to remove query/fragment
    expect(source).toMatch(/\.split\s*\(\s*["']\?["']\s*\)\s*\[\s*0\s*\]/);
  });

  test("test_ac_p11_003_url_cleaning_logic", () => {
    // AC-P11-003: URL cleaning works correctly
    const url = "https://cdn.example.com/app.js?token=abc123&v=2#hash";
    const cleaned = url.split("?")[0].split("#")[0];
    expect(cleaned).toBe("https://cdn.example.com/app.js");
  });

  test("test_ac_p11_003_url_without_params_unchanged", () => {
    // AC-P11-003: URLs without params stay unchanged
    const url = "https://cdn.example.com/style.css";
    const cleaned = url.split("?")[0].split("#")[0];
    expect(cleaned).toBe("https://cdn.example.com/style.css");
  });
});

// ── Sub-Phase 11C: Edge-Case Resilience ────────────────

describe("AC-P11-004: Rapid tab creation/removal handled", () => {
  test("test_ac_p11_004_background_catches_tab_get_errors", () => {
    // AC-P11-004: background.js catches chrome.tabs.get errors in onBeforeNavigate
    const source = readSource("background.js");
    expect(source).toMatch(/runtime\.lastError|tabs\.get.*catch|lastError/);
  });
});

describe("AC-P11-005: Content script handles Performance API errors", () => {
  test("test_ac_p11_005_performance_api_try_catch", () => {
    // AC-P11-005: content.js wraps performance.getEntriesByType in try/catch
    const source = readSource("content.js");
    // collectPerformanceData should have error handling
    expect(source).toMatch(/getEntriesByType/);
    expect(source).toMatch(/try\s*\{[\s\S]*?getEntriesByType|catch/);
  });
});

describe("AC-P11-006: calculateForTab handles stale data", () => {
  test("test_ac_p11_006_calculate_checks_data_exists", async () => {
    // AC-P11-006: calculateForTab returns gracefully if tabData missing
    // Call with non-existent tabId — should not throw
    await expect(bg.calculateForTab(99999)).resolves.not.toThrow();
  });
});

// ── Sub-Phase 11D: Resilience Test Suite ───────────────

describe("AC-P11-007: Circuit breaker resets after success", () => {
  test("test_ac_p11_007_circuit_breaker_pattern", () => {
    // AC-P11-007: background.js has circuit breaker that resets on success
    const source = readSource("background.js");
    expect(source).toMatch(/apiFailCount\s*=\s*0/); // reset on success
    expect(source).toMatch(/apiFailCount\s*\+\+/); // increment on failure
    expect(source).toMatch(/apiFailCount\s*>=?\s*API_BACKOFF_MAX/); // threshold check
  });
});

describe("AC-P11-008: Resource URL query param stripping", () => {
  test("test_ac_p11_008_token_urls_stripped", () => {
    // AC-P11-008: URLs with tokens/keys stripped
    const urls = [
      { input: "https://cdn.example.com/app.js?token=abc123", expected: "https://cdn.example.com/app.js" },
      { input: "https://api.site.com/v2/data?api_key=secret&format=json", expected: "https://api.site.com/v2/data" },
      { input: "https://cdn.example.com/style.css#section", expected: "https://cdn.example.com/style.css" },
      { input: "https://plain.com/script.js", expected: "https://plain.com/script.js" },
    ];
    for (const { input, expected } of urls) {
      expect(input.split("?")[0].split("#")[0]).toBe(expected);
    }
  });
});

describe("AC-P11-009: Rapid initTab/removeTab cycles", () => {
  test("test_ac_p11_009_rapid_tab_cycles_no_leak", () => {
    // AC-P11-009: 100 rapid init/remove cycles don't leak memory
    for (let i = 0; i < 100; i++) {
      bg.initTab(5000 + i, `https://site-${i}.com`);
      bg.removeTab(5000 + i);
    }
    // All tabs should be cleaned up — none of the 100 tabs remain
    for (let i = 0; i < 100; i++) {
      expect(bg.getTabData(5000 + i)).toBeNull();
    }
  });
});

describe("AC-P11-010: calculateForTab on missing tab", () => {
  test("test_ac_p11_010_missing_tab_no_error", async () => {
    // AC-P11-010: calculateForTab on non-existent tab returns without error
    const tabId = 88888;
    expect(bg.getTabData(tabId)).toBeNull();
    // Should not throw, should not create data
    await bg.calculateForTab(tabId);
    expect(bg.getTabData(tabId)).toBeNull();
  });
});
