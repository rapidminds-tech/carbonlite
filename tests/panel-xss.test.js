/**
 * Tests for XSS prevention in side panel — Phase 1 Sub-Phase 1D
 */
import { describe, test, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const root = new URL("..", import.meta.url).pathname;

describe("Side Panel XSS Prevention", () => {
  // AC-P1-011: Zero innerHTML assignments in side panel JS files
  test("test_ac_p1_011_no_innerhtml_with_external_data", () => {
    // AC-P1-011: Zero innerHTML assignments exist in panel JS files that insert
    // external data. All such assignments use textContent + createElement instead.
    const panelDir = path.join(root, "sidepanel");
    const panelFiles = fs.readdirSync(panelDir).filter((f) => f.endsWith(".js"));

    const allViolations = [];
    for (const file of panelFiles) {
      const source = fs.readFileSync(path.join(panelDir, file), "utf-8");
      const lines = source.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;
        if (line.includes(".innerHTML")) {
          allViolations.push({ file, line: i + 1, content: line.trim() });
        }
      }
    }

    expect(allViolations).toEqual([]);
  });
});
