/**
 * Tests for content script — Phase 1 AC-P1-014
 */
import { describe, test, expect } from "vitest";
import * as fs from "fs";

describe("Content Script Privacy", () => {
  // AC-P1-014: content.js does NOT read document.body.innerText
  test("test_ac_p1_014_no_inner_text_access", () => {
    // AC-P1-014: content.js does NOT read document.body.innerText —
    // only Performance API data and DOM element counts are collected
    const source = fs.readFileSync(
      new URL("../content.js", import.meta.url),
      "utf-8"
    );

    // Remove comments
    const lines = source.split("\n");
    const codeLines = lines.filter(
      (l) => !l.trim().startsWith("//") && !l.trim().startsWith("*")
    );
    const code = codeLines.join("\n");

    // Must NOT access innerText (reads page content = privacy violation)
    expect(code).not.toMatch(/\.innerText\b/);
    // Must NOT access textContent of body (same concern)
    expect(code).not.toMatch(/document\.body\.textContent/);
  });
});
