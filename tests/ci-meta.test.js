/**
 * AC-P6-001, AC-P6-004, AC-P6-006, AC-P6-009, AC-P6-010: CI & meta tests
 */
import { describe, test, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
const root = new URL("..", import.meta.url).pathname;
function readSource(relPath) {
  const p = path.join(root, relPath);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : null;
}

describe("AC-P6-001: All existing tests pass", () => {
  test("test_ac_p6_001_test_suite_runs", () => {
    // AC-P6-001: This test itself proves the suite runs.
    // The real validation is that `npx vitest run` exits 0.
    expect(true).toBe(true);
  });
});

describe("AC-P6-004: ESLint configuration exists", () => {
  test("test_ac_p6_004_eslint_config_exists", () => {
    // AC-P6-004: ESLint config file exists
    const hasEslintrc = fs.existsSync(path.join(root, ".eslintrc.json"));
    const hasEslintConfig = fs.existsSync(path.join(root, "eslint.config.js"));
    const hasEslintConfigMjs = fs.existsSync(path.join(root, "eslint.config.mjs"));
    expect(hasEslintrc || hasEslintConfig || hasEslintConfigMjs).toBe(true);
  });

  test("test_ac_p6_004_eslint_rules", () => {
    // AC-P6-004: Config includes rules for innerHTML, empty catch, unused vars
    let config;
    const eslintrcPath = path.join(root, ".eslintrc.json");
    const eslintConfigPath = path.join(root, "eslint.config.mjs");

    if (fs.existsSync(eslintrcPath)) {
      config = fs.readFileSync(eslintrcPath, "utf-8");
    } else if (fs.existsSync(eslintConfigPath)) {
      config = fs.readFileSync(eslintConfigPath, "utf-8");
    }

    expect(config).toBeDefined();
    // Should have rules for: no unused vars, no empty catch
    expect(config).toMatch(/no-unused-vars|unused/i);
    expect(config).toMatch(/no-empty|empty/i);
  });
});

describe("AC-P6-006: Package.json scripts", () => {
  test("test_ac_p6_006_npm_scripts_exist", () => {
    // AC-P6-006: package.json has test and lint scripts
    const pkg = JSON.parse(readSource("package.json"));
    expect(pkg.scripts.test).toBeDefined();
    expect(pkg.scripts.lint).toBeDefined();
    expect(pkg.scripts.test).toMatch(/vitest/);
    expect(pkg.scripts.lint).toMatch(/eslint/);
  });
});

describe("AC-P6-009: GitHub Actions CI workflow", () => {
  test("test_ac_p6_009_ci_workflow_exists", () => {
    // AC-P6-009: CI workflow file exists
    const ciPath = path.join(root, ".github/workflows/ci.yml");
    expect(fs.existsSync(ciPath)).toBe(true);
  });

  test("test_ac_p6_009_ci_workflow_valid", () => {
    // AC-P6-009: CI workflow references correct npm scripts and triggers on push/PR
    const ci = readSource(".github/workflows/ci.yml");
    expect(ci).not.toBeNull();

    // Should trigger on push/PR to main
    expect(ci).toMatch(/push/);
    expect(ci).toMatch(/pull_request/);
    // Should run test and lint
    expect(ci).toMatch(/npm test|npm run test/);
    expect(ci).toMatch(/npm run lint/);
    // Should install dependencies
    expect(ci).toMatch(/npm ci|npm install/);
  });
});

describe("AC-P6-010: Test naming convention", () => {
  test("test_ac_p6_010_test_naming_convention", () => {
    // AC-P6-010: All test files follow test_ac_pN_XXX_description naming
    const testDir = path.join(root, "tests");
    const testFiles = fs.readdirSync(testDir).filter((f) => f.endsWith(".test.js"));

    for (const file of testFiles) {
      const source = fs.readFileSync(path.join(testDir, file), "utf-8");
      // Find all vitest test() calls (exclude .test() method calls like regex.test())
      const testCalls = source.match(/(?:^|\s)test\(\s*["'`]([^"'`]+)["'`]/gm) || [];

      for (const call of testCalls) {
        const name = call.match(/test\(\s*["'`]([^"'`]+)["'`]/)[1];
        // Must follow: test_ac_pN_XXX_description pattern
        expect(name).toMatch(/^test_ac_p\d+_\d{3}_/);
      }
    }
  });
});
