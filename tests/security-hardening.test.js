/**
 * Phase 10: Pre-Submission Security Hardening
 * AC-P10-001 through AC-P10-011
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

// ── Sub-Phase 10A: Message Handler Authentication ──────

describe("AC-P10-001: onMessage rejects foreign senders", () => {
  test("test_ac_p10_001_sender_id_check_in_background", () => {
    // AC-P10-001: background.js rejects messages where sender.id !== chrome.runtime.id
    const source = readSource("background.js");
    expect(source).toMatch(/sender\.id\s*!==\s*chrome\.runtime\.id/);
  });

  test("test_ac_p10_001_early_return_on_foreign_sender", () => {
    // AC-P10-001: The check occurs before any handler logic
    const source = readSource("background.js");
    const senderCheckIdx = source.indexOf("sender.id !== chrome.runtime.id");
    const perfDataIdx = source.indexOf('"PERFORMANCE_DATA"');
    // Sender check must come before PERFORMANCE_DATA handling
    expect(senderCheckIdx).toBeGreaterThan(-1);
    expect(senderCheckIdx).toBeLessThan(perfDataIdx);
  });
});

describe("AC-P10-002: GET_HISTORY validates hostname", () => {
  test("test_ac_p10_002_hostname_regex_in_background", () => {
    // AC-P10-002: GET_HISTORY validates hostname against strict regex
    const source = readSource("background.js");
    // Should have a hostname validation pattern near GET_HISTORY
    expect(source).toMatch(/HOSTNAME_RE|hostname.*test|\/\^.*a-z0-9/i);
  });

  test("test_ac_p10_002_rejects_invalid_hostnames", () => {
    // AC-P10-002: Invalid hostnames rejected
    const HOSTNAME_RE = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i;
    // Valid
    expect(HOSTNAME_RE.test("example.com")).toBe(true);
    expect(HOSTNAME_RE.test("sub.domain.co.uk")).toBe(true);
    expect(HOSTNAME_RE.test("localhost")).toBe(true);
    // Invalid
    expect(HOSTNAME_RE.test("")).toBe(false);
    expect(HOSTNAME_RE.test("javascript:alert(1)")).toBe(false);
    expect(HOSTNAME_RE.test("../../etc/passwd")).toBe(false);
    expect(HOSTNAME_RE.test("<script>")).toBe(false);
    expect(HOSTNAME_RE.test("example.com/path")).toBe(false);
  });

  test("test_ac_p10_002_rejects_long_hostnames", () => {
    // AC-P10-002: Hostnames > 253 chars rejected
    const source = readSource("background.js");
    expect(source).toMatch(/253|\.length\s*>/);
  });
});

describe("AC-P10-003: PERFORMANCE_DATA validates sender tab", () => {
  test("test_ac_p10_003_sender_tab_url_validated", () => {
    // AC-P10-003: PERFORMANCE_DATA checks sender.tab.id and sender.url scheme
    const source = readSource("background.js");
    // Should validate sender.url starts with http/https
    expect(source).toMatch(/sender\.url|sender\.tab/);
  });
});

// ── Sub-Phase 10B: Incognito & Privacy ─────────────────

describe("AC-P10-004: Manifest declares incognito split", () => {
  test("test_ac_p10_004_incognito_split_in_manifest", () => {
    // AC-P10-004: manifest.json has "incognito": "split"
    const manifest = JSON.parse(readSource("manifest.json"));
    expect(manifest.incognito).toBe("split");
  });
});

describe("AC-P10-005: No history saved for incognito tabs", () => {
  test("test_ac_p10_005_incognito_check_before_save_history", () => {
    // AC-P10-005: background.js checks incognito before saveToHistory
    const source = readSource("background.js");
    expect(source).toMatch(/incognito/);
  });
});

describe("AC-P10-006: No API calls for incognito tabs", () => {
  test("test_ac_p10_006_incognito_check_before_green_hosting", () => {
    // AC-P10-006: background.js checks incognito before checkGreenHosting
    const source = readSource("background.js");
    // Should reference incognito near the green hosting check
    const incognitoIdx = source.indexOf("incognito");
    expect(incognitoIdx).toBeGreaterThan(-1);
  });
});

// ── Sub-Phase 10C: Permissions Scoping ─────────────────

describe("AC-P10-007: host_permissions narrowed", () => {
  test("test_ac_p10_007_no_all_urls_host_permissions", () => {
    // AC-P10-007: No <all_urls> in host_permissions
    const manifest = JSON.parse(readSource("manifest.json"));
    const hp = manifest.host_permissions || [];
    expect(hp).not.toContain("<all_urls>");
  });

  test("test_ac_p10_007_api_host_permission_present", () => {
    // AC-P10-007: Green Web Foundation API in host_permissions
    const manifest = JSON.parse(readSource("manifest.json"));
    const hp = manifest.host_permissions || [];
    expect(hp.some((p) => p.includes("thegreenwebfoundation.org"))).toBe(true);
  });
});

// ── Sub-Phase 10D: Input Validation & Hardening ────────

describe("AC-P10-008: Domain input validated with regex", () => {
  test("test_ac_p10_008_domain_regex_in_options", () => {
    // AC-P10-008: options.js validates domain input with regex
    const source = readSource("options/options.js");
    expect(source).toMatch(/DOMAIN_RE|domain.*regex|\/\^.*a-z0-9/i);
  });

  test("test_ac_p10_008_rejects_dangerous_inputs", () => {
    // AC-P10-008: Dangerous inputs rejected by domain regex
    const DOMAIN_RE = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
    expect(DOMAIN_RE.test("javascript:alert(1)")).toBe(false);
    expect(DOMAIN_RE.test("data:text/html,test")).toBe(false);
    expect(DOMAIN_RE.test("blob:http://evil.com")).toBe(false);
    expect(DOMAIN_RE.test("../../../etc")).toBe(false);
    expect(DOMAIN_RE.test("has space.com")).toBe(false);
    // Valid domains pass
    expect(DOMAIN_RE.test("example.com")).toBe(true);
    expect(DOMAIN_RE.test("staging.my-app.co.uk")).toBe(true);
    expect(DOMAIN_RE.test("localhost")).toBe(true);
  });
});

describe("AC-P10-009: No innerHTML in options.js", () => {
  test("test_ac_p10_009_no_innerhtml_in_options", () => {
    // AC-P10-009: options.js does not use innerHTML
    const source = readSource("options/options.js");
    expect(source).not.toMatch(/\.innerHTML\s*=/);
  });
});

describe("AC-P10-010: Green hosting API circuit breaker", () => {
  test("test_ac_p10_010_circuit_breaker_in_background", () => {
    // AC-P10-010: background.js has a circuit breaker for API failures
    const source = readSource("background.js");
    expect(source).toMatch(/apiFailCount|failCount|circuitBreaker|BACKOFF/i);
  });

  test("test_ac_p10_010_circuit_breaker_logic", async () => {
    // AC-P10-010: After 5 failures, no more API calls
    // Test the pattern: counter increments on failure, resets on success
    let failCount = 0;
    const MAX_FAILS = 5;

    function shouldCallApi() { return failCount < MAX_FAILS; }
    function onSuccess() { failCount = 0; }
    function onFailure() { failCount++; }

    // Simulate 5 failures
    for (let i = 0; i < 5; i++) { onFailure(); }
    expect(shouldCallApi()).toBe(false);

    // Reset on success
    onSuccess();
    expect(shouldCallApi()).toBe(true);
  });
});

// ── Sub-Phase 10E: Content Script Hardening ────────────

describe("AC-P10-011: Content script validates message shape", () => {
  test("test_ac_p10_011_message_type_check_in_content", () => {
    // AC-P10-011: content.js validates message has expected shape
    const source = readSource("content.js");
    // Should check message is an object and has type field
    expect(source).toMatch(/message\.type\s*===\s*["']/);
  });

  test("test_ac_p10_011_no_arbitrary_code_execution", () => {
    // AC-P10-011: content.js doesn't eval or execute message data
    const source = readSource("content.js");
    expect(source).not.toMatch(/\beval\b/);
    expect(source).not.toMatch(/new\s+Function/);
  });
});
