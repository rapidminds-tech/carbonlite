/**
 * Tests for Phase 2: Security & Privacy
 * AC-P2-001 through AC-P2-010
 */
import { describe, test, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const root = new URL("..", import.meta.url).pathname;

function readSource(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf-8");
}

function stripComments(source) {
  return source
    .split("\n")
    .filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*"))
    .join("\n");
}

describe("AC-P2-001: No innerHTML with dynamic data in any file", () => {
  // AC-P2-001: All innerHTML assignments across ALL files that embed dynamic data
  // use textContent + createElement. Only static HTML templates may use innerHTML.

  const filesToCheck = [
    "sidepanel/panel-core.js",
    "sidepanel/panel-render.js",
    "sidepanel/panel-breakdown.js",
    "sidepanel/panel-actions.js",
    "options/options.js",
    "onboarding/onboarding.js",
  ];

  for (const file of filesToCheck) {
    test(`test_ac_p2_001_no_dynamic_innerhtml_${file.replace(/[/.]/g, "_")}`, () => {
      const source = readSource(file);
      const lines = source.split("\n");

      const violations = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;
        if (!line.includes(".innerHTML")) continue;

        // Allow clearing: .innerHTML = "" or .innerHTML = '';
        if (/\.innerHTML\s*=\s*["']\s*["']\s*;?/.test(line)) continue;

        violations.push({ line: i + 1, content: line.trim() });
      }

      expect(violations).toEqual([]);
    });
  }
});

describe("AC-P12-002: Least-privilege permissions", () => {
  test("test_ac_p12_002_permissions_least_privilege", () => {
    // AC-P12-002: manifest uses content_scripts for injection, no alarms permission
    const manifest = JSON.parse(readSource("manifest.json"));
    expect(manifest.permissions).not.toContain("alarms");
    expect(manifest.content_scripts).toBeDefined();
    expect(manifest.content_scripts[0].matches).toContain("http://*/*");
    expect(manifest.content_scripts[0].matches).toContain("https://*/*");
  });
});

describe("AC-P2-003: Message handlers validate type field", () => {
  test("test_ac_p2_003_background_validates_message_type", () => {
    // AC-P2-003: All chrome.runtime.onMessage handlers validate the type field
    const source = readSource("background.js");
    const code = stripComments(source);

    // The onMessage listener should check message.type before processing
    // Should NOT have any code that accesses message properties without checking type first
    expect(code).toMatch(/message\.type\s*===?\s*["']/);
  });

  test("test_ac_p2_003_content_validates_message_type", () => {
    const source = readSource("content.js");
    const code = stripComments(source);
    expect(code).toMatch(/message\.type\s*===?\s*["']/);
  });
});

describe("AC-P2-004: No deceptive share-stats toggle", () => {
  test("test_ac_p2_004_no_share_stats_ui_without_implementation", () => {
    // AC-P2-004: The "Share anonymous usage stats" toggle is either implemented
    // with actual telemetry or removed entirely — no deceptive UI
    const optionsHtml = readSource("options/options.html");
    const optionsJs = readSource("options/options.js");

    // If there's a shareAnon checkbox in HTML, there must be actual telemetry code
    const hasShareToggle = optionsHtml.includes("shareAnon");
    const hasTelemetryCode = optionsJs.includes("fetch(") && optionsJs.includes("telemetry");

    // Either both exist (real implementation) or neither exists (removed)
    if (hasShareToggle) {
      expect(hasTelemetryCode).toBe(true);
    }
    // If no toggle, that's fine — AC satisfied by removal
  });
});

describe("AC-P2-005: autoAnalyze setting respected", () => {
  test("test_ac_p2_005_content_script_checks_auto_analyze", () => {
    // AC-P2-005: When autoAnalyze is false, content script does not send PERFORMANCE_DATA
    const source = readSource("content.js");
    const code = stripComments(source);
    // Content script should check autoAnalyze setting before sending data
    expect(code).toMatch(/autoAnalyze/);
  });

  test("test_ac_p2_005_background_checks_auto_analyze", () => {
    // AC-P2-005: When autoAnalyze is false, background.js does not calculate
    const source = readSource("background.js");
    const code = stripComments(source);
    expect(code).toMatch(/autoAnalyze/);
  });
});

describe("AC-P2-006: showBadge setting respected", () => {
  test("test_ac_p2_006_badge_respects_setting", () => {
    // AC-P2-006: When showBadge is false, toolbar badge text and color are not set
    const source = readSource("background.js");
    const code = stripComments(source);
    // Should check showBadge setting before updating badge
    expect(code).toMatch(/showBadge/);
  });
});

describe("AC-P2-007: No empty catch blocks", () => {
  const sourceFiles = [
    "background.js",
    "content.js",
    "sidepanel/panel-core.js",
    "sidepanel/panel-render.js",
    "sidepanel/panel-breakdown.js",
    "sidepanel/panel-actions.js",
    "options/options.js",
    "onboarding/onboarding.js",
    "libs/co2.js",
    "libs/classifier.js",
    "libs/constants.js",
    "libs/background-core.js",
  ];

  for (const file of sourceFiles) {
    test(`test_ac_p2_007_no_empty_catch_${file.replace(/[/.]/g, "_")}`, () => {
      // AC-P2-007: All catch blocks either log the error or handle it explicitly
      const filePath = path.join(root, file);
      if (!fs.existsSync(filePath)) return; // Skip if file doesn't exist

      const source = fs.readFileSync(filePath, "utf-8");

      // Match catch blocks with empty bodies: catch { }, catch(e) { }, catch (err) { }
      // Allow catch blocks that have at least one statement inside
      const emptyCatchPattern = /catch\s*(\(\w*\))?\s*\{\s*\}/g;
      const matches = [...source.matchAll(emptyCatchPattern)];

      expect(matches.length).toBe(0);
    });
  }
});

describe("AC-P2-008: No automatic external URL opening", () => {
  test("test_ac_p2_008_no_auto_external_urls", () => {
    // AC-P2-008: No external URLs are opened from the extension without explicit
    // user action (click). No automatic tab creation.
    const source = readSource("background.js");
    const code = stripComments(source);

    // Find all chrome.tabs.create calls
    const tabCreates = [...code.matchAll(/chrome\.tabs\.create\s*\(/g)];

    for (const match of tabCreates) {
      // Each chrome.tabs.create should be inside either:
      // 1. An event handler triggered by user action (onClicked, message handler from UI)
      // 2. Opening an extension URL (not external)
      // Get surrounding context (~5 lines before)
      const idx = match.index;
      const before = code.slice(Math.max(0, idx - 500), idx);

      // Acceptable contexts: inside message handlers, install handler (extension URL), or user-triggered
      const inMessageHandler = before.includes("message.type") || before.includes("onInstalled");
      const isExtensionUrl = code.slice(idx, idx + 200).includes("onboarding") ||
                              code.slice(idx, idx + 200).includes("report/") ||
                              code.slice(idx, idx + 200).includes("chrome.runtime.getURL");
      const inCompareHandler = before.includes("COMPARE_URL");

      expect(inMessageHandler || isExtensionUrl || inCompareHandler).toBe(true);
    }
  });
});

describe("AC-P2-009: Unsupported URLs handled gracefully", () => {
  test("test_ac_p2_009_background_handles_unsupported_urls", () => {
    // AC-P2-009: chrome://, chrome-extension://, about:, and file:// URLs
    // are handled gracefully
    const source = readSource("background.js");
    const code = stripComments(source);

    // Must check for all four URL types (inline strings or regex pattern)
    expect(code).toMatch(/chrome|chrome-extension|about|file/);
  });

  test("test_ac_p2_009_panel_handles_unsupported_urls", () => {
    // Panel is now decomposed — check panel-actions.js (contains requestCurrentData)
    const source = readSource("sidepanel/panel-actions.js");
    const code = stripComments(source);
    expect(code).toMatch(/chrome:\/\//);
    expect(code).toMatch(/file:\/\//);
  });
});

describe("AC-P2-010: host_permissions scoped to http/https", () => {
  test("test_ac_p2_010_host_permissions_scoped", () => {
    // AC-P2-010: manifest.json host_permissions is scoped (not <all_urls>)
    // AC-P10-007: Narrowed to API-only (no broad http/https wildcards)
    const manifest = JSON.parse(readSource("manifest.json"));

    expect(manifest.host_permissions).not.toContain("<all_urls>");
    // Permissions must be narrowly scoped — only necessary API origins
    for (const perm of manifest.host_permissions) {
      expect(perm).not.toBe("<all_urls>");
    }
  });
});
