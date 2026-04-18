/**
 * Tests for Phase 5: Scope Cut & Store Readiness
 * AC-P5-001 through AC-P5-010
 */
import { describe, test, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const root = new URL("..", import.meta.url).pathname;
function readSource(relPath) {
  const p = path.join(root, relPath);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf-8");
}
function fileExists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

describe("AC-P5-001: Cut features fully removed", () => {
  test("test_ac_p5_001_no_cut_feature_code", () => {
    // AC-P5-001: Badge generator, Share as PNG, PDF export, Compare feature removed
    const panelDir = path.join(root, "sidepanel");
    const panelFiles = fs.readdirSync(panelDir).filter((f) => f.endsWith(".js"));
    const allJs = panelFiles.map((f) => fs.readFileSync(path.join(panelDir, f), "utf-8")).join("\n");

    // No badge modal references
    expect(allJs).not.toMatch(/shareBadge|badgeModal|badgeCode|copyBadge|badgePreview/);
    // No share image references
    expect(allJs).not.toMatch(/shareImage|generateShareImage/);
    // No PDF export references
    expect(allJs).not.toMatch(/exportPdf|_reportData/);
    // No compare feature references
    expect(allJs).not.toMatch(/compareBtn|compareModal|compareGo|compareUrl|COMPARE_URL|renderCompareResults/);
  });

  test("test_ac_p5_001_no_cut_feature_html", () => {
    const html = readSource("sidepanel/panel.html");
    // No badge modal
    expect(html).not.toMatch(/id="badgeModal"/);
    // No compare modal
    expect(html).not.toMatch(/id="compareModal"/);
    // No cut action buttons
    expect(html).not.toMatch(/id="exportPdf"/);
    expect(html).not.toMatch(/id="shareBadge"/);
    expect(html).not.toMatch(/id="shareImage"/);
    expect(html).not.toMatch(/id="compareBtn"/);
  });

  test("test_ac_p5_001_no_compare_in_background", () => {
    const bg = readSource("background.js");
    expect(bg).not.toMatch(/COMPARE_URL/);
    expect(bg).not.toMatch(/compareState/);
    expect(bg).not.toMatch(/handleCompareCheck/);
  });
});

describe("AC-P5-002: Onboarding simplified", () => {
  test("test_ac_p5_002_no_multi_step_wizard", () => {
    // AC-P5-002: Onboarding is removed or simplified — no multi-step wizard
    if (fileExists("onboarding/onboarding.html")) {
      const html = readSource("onboarding/onboarding.html");
      // Should NOT have multiple steps
      const stepCount = (html.match(/id="step\d+"/g) || []).length;
      expect(stepCount).toBeLessThanOrEqual(1);
    }
    // If directory is removed, that also satisfies the AC
  });
});

describe("AC-P5-003: Privacy policy exists", () => {
  test("test_ac_p5_003_privacy_policy_page", () => {
    // AC-P5-003: Privacy policy page exists and discloses key items
    const privacyPath = fileExists("privacy/privacy.html") ? "privacy/privacy.html" : "privacy.html";
    expect(fileExists(privacyPath)).toBe(true);

    const html = readSource(privacyPath);
    // Must mention key disclosures
    expect(html).toMatch(/Performance API|resource.*size/i);
    expect(html).toMatch(/Green Web Foundation/i);
    expect(html).toMatch(/stored locally|local.*storage/i);
    expect(html).toMatch(/no personal|no browsing content|does not read|do not read/i);
  });
});

describe("AC-P5-004: Options About links not placeholder", () => {
  test("test_ac_p5_004_no_placeholder_links", () => {
    // AC-P5-004: No placeholder https://github.com links
    const html = readSource("options/options.html");
    // Should not have bare github.com links (must be specific repo or privacy page)
    const links = html.match(/href="([^"]+)"/g) || [];
    for (const link of links) {
      const url = link.match(/href="([^"]+)"/)[1];
      if (url.includes("github.com")) {
        // Must be a specific repo URL, not just https://github.com
        expect(url.length).toBeGreaterThan("https://github.com".length + 1);
      }
    }
  });
});

describe("AC-P5-005: Manifest description ≤132 chars", () => {
  test("test_ac_p5_005_description_length", () => {
    // AC-P5-005: manifest.json description ≤132 characters, states single purpose
    const manifest = JSON.parse(readSource("manifest.json"));
    expect(manifest.description).toBeDefined();
    expect(manifest.description.length).toBeLessThanOrEqual(132);
    expect(manifest.description.length).toBeGreaterThan(10);
  });
});

describe("AC-P5-006: Icons at required sizes", () => {
  test("test_ac_p5_006_icons_exist", () => {
    // AC-P5-006: Icons at 16, 48, 128 px exist
    expect(fileExists("icons/icon-16.png")).toBe(true);
    expect(fileExists("icons/icon-48.png")).toBe(true);
    expect(fileExists("icons/icon-128.png")).toBe(true);
  });
});

describe("AC-P5-007: Report directory removed", () => {
  test("test_ac_p5_007_no_report_directory", () => {
    // AC-P5-007: report/ directory and all report code removed
    expect(fs.existsSync(path.join(root, "report"))).toBe(false);
  });

  test("test_ac_p5_007_no_report_references", () => {
    // No references to report in manifest or background
    const manifest = JSON.parse(readSource("manifest.json"));
    expect(JSON.stringify(manifest)).not.toMatch(/report\//);

    const bg = readSource("background.js");
    expect(bg).not.toMatch(/report\//);
  });
});

describe("AC-P5-008: Content scripts scoped to http/https", () => {
  test("test_ac_p5_008_content_scripts_scoped", () => {
    // AC-P5-008: content_scripts matches use http/https, not <all_urls>
    const manifest = JSON.parse(readSource("manifest.json"));
    for (const cs of manifest.content_scripts || []) {
      expect(cs.matches).not.toContain("<all_urls>");
      expect(cs.matches).toContain("http://*/*");
      expect(cs.matches).toContain("https://*/*");
    }
  });
});

describe("AC-P5-009: Extension loads without errors", () => {
  test("test_ac_p5_009_manifest_valid_json", () => {
    // AC-P5-009: manifest.json is valid and all referenced files exist
    const manifest = JSON.parse(readSource("manifest.json"));

    // Background script exists
    expect(fileExists(manifest.background.service_worker)).toBe(true);

    // Content scripts exist
    for (const cs of manifest.content_scripts || []) {
      for (const js of cs.js || []) {
        expect(fileExists(js)).toBe(true);
      }
    }

    // Side panel exists
    expect(fileExists(manifest.side_panel.default_path)).toBe(true);

    // Options page exists
    if (manifest.options_page) {
      expect(fileExists(manifest.options_page)).toBe(true);
    }

    // Icons exist
    for (const size of Object.values(manifest.icons || {})) {
      expect(fileExists(size)).toBe(true);
    }
  });
});

describe("AC-P5-010: No unused permissions", () => {
  test("test_ac_p5_010_all_permissions_used", () => {
    // AC-P5-010: Each permission has a justified use in the codebase
    const manifest = JSON.parse(readSource("manifest.json"));
    const bg = readSource("background.js");
    const allSource = bg + (readSource("content.js") || "");

    for (const perm of manifest.permissions || []) {
      if (perm === "sidePanel") {
        expect(bg).toMatch(/chrome\.sidePanel/);
      } else if (perm === "storage") {
        expect(allSource).toMatch(/chrome\.storage/);
      } else if (perm === "tabs") {
        expect(bg).toMatch(/chrome\.tabs/);
      } else if (perm === "webNavigation") {
        expect(bg).toMatch(/chrome\.webNavigation/);
      } else if (perm === "notifications") {
        expect(bg).toMatch(/chrome\.notifications/);
      } else if (perm === "alarms") {
        expect(bg).toMatch(/chrome\.alarms/);
      }
    }
  });
});
