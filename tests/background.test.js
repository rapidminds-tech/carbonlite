/**
 * Tests for background service worker — Phase 1 Sub-Phase 1A, 1C, security
 */
import { describe, test, expect, vi, beforeEach } from "vitest";
import { resetStorage } from "./setup.js";

// Load co2.js first (background.js depends on it)
await import("../libs/co2.js");

// We'll test the background module's exported functions
let bg;

beforeAll(async () => {
  bg = await import("../libs/background-core.js");
});

describe("Sub-Phase 1A: State Persistence & Reliability", () => {
  // AC-P1-001: tabData is persisted to chrome.storage.session on every update
  test("test_ac_p1_001_tab_data_persisted_on_update", async () => {
    // AC-P1-001: tabData is persisted to chrome.storage.session on every update,
    // so service worker restarts do not lose in-progress analysis
    const tabId = 1;
    bg.initTab(tabId, "https://example.com");

    // Add a resource (which is an "update")
    bg.addResource(tabId, {
      name: "https://example.com/image.png",
      initiatorType: "img",
      transferSize: 5000,
      encodedBodySize: 5000,
      decodedBodySize: 5000,
    });

    // Verify storage.session.set was called with tab data
    expect(chrome.storage.session.set).toHaveBeenCalled();
    const lastCall = chrome.storage.session.set.mock.calls.at(-1);
    const savedData = lastCall[0][`tab_${tabId}`];
    expect(savedData).toBeDefined();
    expect(savedData.url).toBe("https://example.com");
    expect(savedData.totalBytes).toBe(5000);
  });

  // AC-P1-002: On service worker startup, tabData is restored from chrome.storage.session
  test("test_ac_p1_002_tab_data_restored_on_startup", async () => {
    // AC-P1-002: On service worker startup, tabData is restored from
    // chrome.storage.session for all active tabs
    const tabId = 42;
    const savedTabData = {
      url: "https://example.com",
      totalBytes: 12000,
      resources: [],
      byType: { images: { bytes: 5000, count: 1 }, javascript: { bytes: 7000, count: 2 }, css: { bytes: 0, count: 0 }, fonts: { bytes: 0, count: 0 }, html: { bytes: 0, count: 0 }, other: { bytes: 0, count: 0 } },
      thirdParty: { bytes: 0, count: 0, scripts: [] },
      greenHosting: null,
      hostingProvider: null,
      calculatedAt: null,
      result: null,
    };

    // Pre-populate session storage
    chrome.storage.session.set({ [`tab_${tabId}`]: savedTabData });

    // Call restore function
    await bg.restoreTabData();

    // Verify tabData map has the restored data
    const restored = bg.getTabData(tabId);
    expect(restored).toBeDefined();
    expect(restored.url).toBe("https://example.com");
    expect(restored.totalBytes).toBe(12000);
  });

  // AC-P1-003: calculateForTab is debounced — multiple triggers within 500ms
  // result in only one calculation
  test("test_ac_p1_003_calculate_debounced", async () => {
    // AC-P1-003: calculateForTab is debounced — multiple triggers within 500ms
    // result in only one calculation. Green hosting API is not hit twice per navigation.
    const tabId = 10;
    bg.initTab(tabId, "https://example.com");

    let calcCount = 0;
    const originalCalc = bg.calculateForTab;
    // We spy on calculation by tracking calls through scheduleCalculation
    const spy = vi.fn();
    bg._setCalculateCallback(spy);

    // Trigger multiple schedule calls rapidly
    bg.scheduleCalculation(tabId);
    bg.scheduleCalculation(tabId);
    bg.scheduleCalculation(tabId);

    // Before debounce period, no calculation should have run
    expect(spy).not.toHaveBeenCalled();

    // Wait for debounce to fire (500ms + buffer)
    await new Promise((r) => setTimeout(r, 600));

    // Should have called calculate exactly once
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(tabId);

    bg._setCalculateCallback(null);
  });

  // AC-P1-004 (updated Phase 12): Debounce uses setTimeout (alarms have 30s min in production).
  // setInterval is still forbidden.
  test("test_ac_p1_004_no_setinterval_in_background", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("../background.js", import.meta.url),
      "utf-8"
    );
    const lines = source.split("\n");
    const codeLines = lines.filter(
      (l) => !l.trim().startsWith("//") && !l.trim().startsWith("*")
    );
    const code = codeLines.join("\n");
    // setTimeout is allowed for debounce (AC-P12-010), setInterval is not
    expect(code).not.toMatch(/\bsetInterval\b/);
    // Verify debounce pattern exists
    expect(code).toMatch(/setTimeout/);
    expect(code).toMatch(/clearTimeout/);
  });
});

describe("Sub-Phase 1C: Grid Intensity in calculateForTab", () => {
  // AC-P1-008: calculateForTab passes gridIntensity from settings to CO2.calculate()
  test("test_ac_p1_008_calculate_for_tab_passes_grid_intensity", async () => {
    // AC-P1-008: When a user selects a region in options, calculateForTab passes
    // the corresponding gridIntensity value to CO2.calculate()
    const tabId = 20;
    bg.initTab(tabId, "https://example.com");
    bg.addResource(tabId, {
      name: "https://example.com/app.js",
      initiatorType: "script",
      transferSize: 50000,
      encodedBodySize: 50000,
      decodedBodySize: 100000,
    });

    // Set grid intensity in settings (India = 700)
    chrome.storage.local.set({
      settings: { region: "in", gridIntensity: 700 },
    });

    // Mock fetch for green hosting
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ green: false }),
      })
    );

    await bg.calculateForTab(tabId);

    const data = bg.getTabData(tabId);
    expect(data.result).toBeDefined();
    // CO2 with India intensity (700) should be higher than global average (480)
    const defaultResult = globalThis.CO2.calculate(50000, { greenHosting: false });
    expect(data.result.co2).toBeGreaterThan(defaultResult.co2);
  });

  // AC-P1-009: auto region uses 480
  test("test_ac_p1_009_auto_region_uses_global_average", async () => {
    // AC-P1-009: When region is "auto", the global average (480 gCO2e/kWh) is used
    const tabId = 21;
    bg.initTab(tabId, "https://example.com");
    bg.addResource(tabId, {
      name: "https://example.com/app.js",
      initiatorType: "script",
      transferSize: 50000,
      encodedBodySize: 50000,
      decodedBodySize: 100000,
    });

    // Settings with auto region (gridIntensity = null)
    chrome.storage.local.set({
      settings: { region: "auto", gridIntensity: null },
    });

    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ green: false }),
      })
    );

    await bg.calculateForTab(tabId);

    const data = bg.getTabData(tabId);
    // Should equal what CO2.calculate produces with default (480)
    const expected = globalThis.CO2.calculate(50000, { greenHosting: false, firstVisit: true });
    expect(data.result.co2).toBeCloseTo(expected.co2, 6);
  });
});

describe("Sub-Phase 1D: Security", () => {
  // AC-P1-012: COMPARE_URL validates https only
  test("test_ac_p1_012_compare_url_validates_https", () => {
    // AC-P1-012: COMPARE_URL message handler validates that the URL starts with
    // https:// before opening. Non-https URLs are rejected with an error message.
    expect(bg.isValidCompareUrl("https://example.com")).toBe(true);
    expect(bg.isValidCompareUrl("http://example.com")).toBe(false);
    expect(bg.isValidCompareUrl("javascript:alert(1)")).toBe(false);
    expect(bg.isValidCompareUrl("file:///etc/passwd")).toBe(false);
    expect(bg.isValidCompareUrl("data:text/html,<h1>hi</h1>")).toBe(false);
    expect(bg.isValidCompareUrl("ftp://example.com")).toBe(false);
    expect(bg.isValidCompareUrl("")).toBe(false);
    expect(bg.isValidCompareUrl("not-a-url")).toBe(false);
  });

  // AC-P1-013: Green hosting API responses cached in chrome.storage.local with 24h TTL
  test("test_ac_p1_013_green_hosting_cached_in_storage", async () => {
    // AC-P1-013: Green hosting API responses are cached in chrome.storage.local
    // with a 24-hour TTL per hostname
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ green: true, hosted_by: "Cloudflare" }),
      })
    );

    const result1 = await bg.checkGreenHosting("https://example.com");
    expect(result1.green).toBe(true);
    expect(result1.provider).toBe("Cloudflare");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    // Second call should use cache — no additional fetch
    globalThis.fetch.mockClear();
    const result2 = await bg.checkGreenHosting("https://example.com");
    expect(result2.green).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();

    // Verify cached in chrome.storage.local (not just in-memory Map)
    const stored = await chrome.storage.local.get("greenHosting_example.com");
    expect(stored["greenHosting_example.com"]).toBeDefined();
    expect(stored["greenHosting_example.com"].green).toBe(true);
  });

  test("test_ac_p1_013_cache_expires_after_24h", async () => {
    // AC-P1-013: Cache has 24-hour TTL
    const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago

    // Pre-populate with expired cache
    chrome.storage.local.set({
      "greenHosting_stale.com": {
        green: false,
        provider: null,
        ts: oldTimestamp,
      },
    });

    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ green: true, hosted_by: "GreenHost" }),
      })
    );

    const result = await bg.checkGreenHosting("https://stale.com");
    // Should have fetched fresh data since cache expired
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(result.green).toBe(true);
  });
});
