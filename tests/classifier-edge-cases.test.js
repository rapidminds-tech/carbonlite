/**
 * AC-P6-003: Edge case tests for libs/classifier.js
 */
import { describe, test, expect } from "vitest";

await import("../libs/classifier.js");
const classifyResource = globalThis.classifyResource;

describe("AC-P6-003: Classifier edge cases", () => {
  test("test_ac_p6_003_empty_string_url", () => {
    // AC-P6-003: empty string URL → "other"
    expect(classifyResource("", "")).toBe("other");
    expect(classifyResource("")).toBe("other");
  });

  test("test_ac_p6_003_url_with_query_params_and_fragments", () => {
    // AC-P6-003: query params and fragments should not affect classification
    expect(classifyResource("https://example.com/app.js?v=123#hash")).toBe("javascript");
    expect(classifyResource("https://example.com/style.css?cache=bust")).toBe("css");
    expect(classifyResource("https://example.com/image.png?w=100&h=100#crop")).toBe("images");
  });

  test("test_ac_p6_003_data_urls", () => {
    // AC-P6-003: data: URLs → "other" (no network transfer)
    expect(classifyResource("data:image/png;base64,abc123")).toBe("other");
    expect(classifyResource("data:text/javascript,alert(1)")).toBe("other");
  });

  test("test_ac_p6_003_blob_urls", () => {
    // AC-P6-003: blob: URLs → "other"
    expect(classifyResource("blob:https://example.com/abc-123")).toBe("other");
  });

  test("test_ac_p6_003_urls_with_no_protocol", () => {
    // AC-P6-003: URLs with no protocol
    expect(classifyResource("example.com/script.js")).toBe("javascript");
    expect(classifyResource("cdn.example.com/image.webp")).toBe("images");
    expect(classifyResource("noprotocol")).toBe("other");
  });
});
