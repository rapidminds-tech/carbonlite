# Green Engineering — Claude Code Project Instructions

## Project Overview

Chrome extension (Manifest V3) that measures real-time carbon footprint of websites for developers.
Vanilla JavaScript, no build system, no frameworks. Side panel UI with score/breakdown/fixes tabs.
Uses SWDM v4 (Sustainable Web Design Model) + Green Web Foundation API for CO2 calculations.
Feature-complete but has P0 bugs, XSS vulnerabilities, broken settings, and methodology errors per VALIDATION_REPORT.md.

## Development Methodology: SDD (Spec-Driven Development)

This project follows Spec-Driven Development. Every module has a specification in `specs/`.
Code exists to satisfy specs. Tests validate spec compliance. No code without a spec.

### On Every Session Start

1. Read `specs/STATUS.md` — single source of truth for project state
2. Read memory files for user preferences and design decisions
3. Know where we left off and what to do next

### Auto-Save Rule

After completing any `/sdd-implement`, `/sdd-test`, or `/sdd-next` command, ALWAYS update:
- `specs/STATUS.md` — with new test results and phase progress
- Memory file `sdd_status.md` — with what was done and what's next

If the user says "bye", "done", "closing", or similar — run `/sdd-save` automatically before ending.

---

## SDD Skills (Slash Commands)

These are real skills defined in `.claude/skills/`. Type them directly:

| Command | Purpose |
|---------|---------|
| `/sdd-resume` | Load full context, show current phase, next action, ask to continue |
| `/sdd-status` | Quick dashboard — phases, specs, ACs, test pass/fail |
| `/sdd-implement <module\|phase>` | Full TDD workflow: spec → write tests → implement → validate |
| `/sdd-test <phase-number>` | Write and run tests for a phase's acceptance criteria |
| `/sdd-validate <module>` | Check code matches its module spec exactly |
| `/sdd-next` | Find and work on next incomplete acceptance criterion |
| `/sdd-spec <module>` | Display a module's specification |
| `/sdd-amend <module>` | Amend a spec when requirements change |
| `/sdd-save` | Save progress to STATUS.md + memory before closing session |

### Module names for commands:
`co2-engine`, `resource-classifier`, `background`, `content-script`, `side-panel`, `security`, `methodology`, `options`, `onboarding`, `report`

---

## Enforcement Hooks (Automatic)

These hooks fire automatically — no user action needed:

| Hook | When | What it does |
|------|------|-------------|
| **Secrets Check** | Before any Edit/Write | Blocks if plaintext secrets detected in content |

### What gets blocked:
- Writing `api_key = "mykey123"` in any JS file → **BLOCKED**
- `rm -rf`, `sudo`, `git push --force` → **DENIED by permissions**

---

## Spec Directory Structure

```
specs/
├── sdd-workflow.md              # SDD process reference
├── overview.md                  # System goals, scope, constraints
├── architecture.md              # Component design, carbon model, data flow
├── STATUS.md                    # LIVE TRACKER — always read first
├── phases/
│   ├── phase-1.md               # P0 Bug Fixes (ship-blockers)
│   ├── phase-2.md               # Security & Privacy
│   ├── phase-3.md               # Carbon Methodology Fixes
│   ├── phase-4.md               # Code Quality & Architecture
│   ├── phase-5.md               # Scope Cut & Store Readiness
│   └── phase-6.md               # Testing & CI
└── modules/
    ├── co2-engine.md            # → libs/co2.js, libs/benchmarks.js
    ├── resource-classifier.md   # → background.js (classifyResource)
    ├── background.md            # → background.js (service worker)
    ├── content-script.md        # → content.js
    ├── side-panel.md            # → sidepanel/panel.js, panel.html, panel.css
    ├── security.md              # → XSS fixes, URL validation, permissions
    ├── methodology.md           # → SWDM v4, embodied energy, grid intensity
    ├── options.md               # → options/options.js, options.html
    ├── onboarding.md            # → onboarding/onboarding.js, onboarding.html
    └── report.md                # → report/report.js, report.html
```

---

## Source File Map

| File | Lines | Role |
|------|-------|------|
| `background.js` | ~700 | Service worker: resource tracking, CO2 calculation, messaging |
| `content.js` | ~100 | Content script: Performance API data collection, DOM metrics |
| `sidepanel/panel.js` | ~874 | Side panel: rendering, events, canvas, exports, modals |
| `sidepanel/panel.html` | | Side panel markup |
| `sidepanel/panel.css` | | Side panel styles (light + dark) |
| `libs/co2.js` | | CO2 calculation engine (SWDM v4) |
| `libs/benchmarks.js` | | Industry benchmark data |
| `options/options.js` | | Settings page logic |
| `onboarding/onboarding.js` | | First-run wizard |
| `report/report.js` | | PDF/HTML report generation |
| `manifest.json` | | MV3 configuration |

## Code Conventions

- Vanilla JavaScript (no TypeScript, no frameworks, no bundler)
- Chrome Extension Manifest V3 APIs
- Tests via Jest or Vitest (to be set up)
- Test naming: `test_ac_pN_XXX_description` for spec compliance tests
- All `innerHTML` assignments must use `textContent` + `createElement` instead (XSS prevention)
- No empty `catch {}` blocks — always log or handle errors
- Dark/light theme via CSS custom properties (not duplicated blocks)
- Constants defined in ONE place (e.g., REGION_INTENSITY)

## Key Design Decisions

Do NOT re-debate without explicit user request (see memory: `sdd_decisions.md`):
- D-001: SWDM v4 as carbon calculation model (not OneByte)
- D-002: Side panel UI (not popup) for persistent display
- D-003: Vanilla JS, no build system for v1 simplicity
- D-004: Green Web Foundation API for hosting checks (with caching)
- D-005: Developer-focused (not consumer browsing tracker)
- D-006: Freemium model — free extension, paid CI/monitoring later
- D-007: SDD adopted to fix P0 bugs systematically before store submission

## Known Issues (from VALIDATION_REPORT.md)

### P0 — Ship Blockers
1. `tabData` Map volatile — lost on SW restart
2. `gridIntensity` setting ignored in calculation
3. `classifyResource` receives `initiatorType` not content-type
4. Double calculation (no debounce)
5. XSS via 12+ `innerHTML` assignments
6. Browsing history leaked to Green Web Foundation API
7. `COMPARE_URL` opens arbitrary URLs
8. No privacy policy, no screenshots

### P1 — Methodology & Security
9. Missing embodied energy (~15-20% undercount)
10. Script deferral CO2 savings claim is wrong
11. CORS `transferSize=0` undercounts cross-origin resources
12. Caching recommendation double-counts SWDM returning visitor ratio
13. Grade thresholds too lenient

## Environment

```bash
# No build system — load unpacked in Chrome
# chrome://extensions → Developer mode → Load unpacked → select project root

# Tests (to be set up)
npx vitest run                           # All tests
npx vitest run tests/test_co2.js         # Specific module
npx vitest run --reporter=verbose        # Verbose output

# Lint (to be set up)
npx eslint . --fix                       # Fix lint issues
```
