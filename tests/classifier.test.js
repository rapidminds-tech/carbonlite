/**
 * Tests for resource classification — Phase 1 Sub-Phase 1B
 */
import { describe, test, expect } from "vitest";

// Load classifier — sets globalThis.classifyResource
await import("../libs/classifier.js");
const classifyResource = globalThis.classifyResource;

describe("Resource Classification", () => {
  // AC-P1-005: classifyResource correctly handles both MIME content-type strings
  // AND initiatorType strings by detecting which format was passed
  test("test_ac_p1_005_handles_mime_content_type", () => {
    // AC-P1-005: classifyResource correctly handles both MIME content-type strings
    // AND initiatorType strings by detecting which format was passed
    expect(classifyResource("https://example.com/file", "image/png")).toBe("images");
    expect(classifyResource("https://example.com/file", "image/jpeg")).toBe("images");
    expect(classifyResource("https://example.com/file", "image/webp")).toBe("images");
    expect(classifyResource("https://example.com/file", "text/javascript")).toBe("javascript");
    expect(classifyResource("https://example.com/file", "application/javascript")).toBe("javascript");
    expect(classifyResource("https://example.com/file", "text/css")).toBe("css");
    expect(classifyResource("https://example.com/file", "font/woff2")).toBe("fonts");
    expect(classifyResource("https://example.com/file", "text/html")).toBe("html");
  });

  test("test_ac_p1_005_handles_initiator_type", () => {
    // AC-P1-005: classifyResource also handles initiatorType strings
    expect(classifyResource("https://example.com/file", "img")).toBe("images");
    expect(classifyResource("https://example.com/file", "script")).toBe("javascript");
    expect(classifyResource("https://example.com/file", "css")).toBe("css");
    expect(classifyResource("https://example.com/file", "link")).toBe("css");
  });

  // AC-P1-006: Resource classification priority is: MIME type > file extension > initiatorType fallback
  test("test_ac_p1_006_priority_mime_over_extension", () => {
    // AC-P1-006: MIME type takes priority over file extension
    // A .js file served as image/png should classify as images
    expect(classifyResource("https://example.com/tracker.js", "image/png")).toBe("images");
    // A .png file served as text/javascript should classify as javascript
    expect(classifyResource("https://example.com/image.png", "text/javascript")).toBe("javascript");
  });

  test("test_ac_p1_006_priority_extension_over_initiator", () => {
    // AC-P1-006: File extension takes priority over initiatorType fallback
    // A .css file with initiatorType "script" should classify by extension as css
    expect(classifyResource("https://example.com/styles.css", "xmlhttprequest")).toBe("css");
    // A .woff2 file with initiatorType "link"
    expect(classifyResource("https://example.com/font.woff2", "link")).toBe("fonts");
  });

  test("test_ac_p1_006_fallback_to_initiator_type", () => {
    // AC-P1-006: When no MIME and no recognizable extension, fall back to initiatorType
    expect(classifyResource("https://example.com/abc123", "img")).toBe("images");
    expect(classifyResource("https://example.com/abc123", "script")).toBe("javascript");
  });

  test("test_ac_p1_006_fallback_to_other", () => {
    // AC-P1-006: Resources with no MIME, no extension, and unknown initiatorType → "other"
    expect(classifyResource("https://example.com/abc123", "")).toBe("other");
    expect(classifyResource("https://example.com/abc123", "xmlhttprequest")).toBe("other");
    expect(classifyResource("https://example.com/abc123")).toBe("other");
  });

  // AC-P1-007: CDN URLs with no file extension are classified by content-type if available,
  // otherwise "other" — never misclassified as a known type
  test("test_ac_p1_007_cdn_no_extension_with_content_type", () => {
    // AC-P1-007: CDN URLs with no extension classified by content-type
    expect(classifyResource("https://cdn.example.com/abc123", "image/webp")).toBe("images");
    expect(classifyResource("https://cdn.example.com/abc123", "application/javascript")).toBe("javascript");
    expect(classifyResource("https://cdn.example.com/abc123", "font/woff2")).toBe("fonts");
  });

  test("test_ac_p1_007_cdn_no_extension_no_content_type_is_other", () => {
    // AC-P1-007: CDN URLs with no extension and no content-type → "other"
    expect(classifyResource("https://cdn.example.com/abc123", "")).toBe("other");
    expect(classifyResource("https://cdn.example.com/abc123")).toBe("other");
  });

  test("test_ac_p1_007_cdn_no_extension_never_misclassified", () => {
    // AC-P1-007: CDN URLs should never be misclassified as a known type without evidence
    // "fetch" initiatorType should NOT classify as a known content type
    const result = classifyResource("https://cdn.example.com/abc123", "fetch");
    expect(result).toBe("other");
  });
});
