# SDD Workflow — Green Engineering

## What is SDD (Spec-Driven Development)?

Every feature, module, and change is governed by a **specification written before implementation**. Code exists to satisfy specs. Tests validate spec compliance. No code is written without a spec. No spec is closed without passing tests.

---

## Workflow Per Module

```
┌─────────────┐    ┌──────────────┐    ┌───────────────┐    ┌────────────┐    ┌──────────┐
│ WRITE SPEC  │───>│ REVIEW SPEC  │───>│  IMPLEMENT /  │───>│ TEST vs    │───>│  CLOSE   │
│             │    │ (with user)  │    │  REFACTOR     │    │  SPEC      │    │  MODULE  │
└─────────────┘    └──────────────┘    └───────────────┘    └────────────┘    └──────────┘
```

### Step 1: Write Spec
- Define interfaces (inputs, outputs, types)
- Define behaviors (happy path, edge cases, error handling)
- Define acceptance criteria (measurable, testable)
- Define performance constraints
- Define dependencies on other modules

### Step 2: Review Spec
- Present spec to user for approval
- Clarify ambiguities
- Lock spec version (changes require explicit spec amendment)

### Step 3: Implement / Refactor
- Write or refactor code to match spec exactly
- No extra features, no missing features
- Follow the interface contracts precisely

### Step 4: Test vs Spec
- Write tests that map 1:1 to acceptance criteria
- Each acceptance criterion = at least one test
- Tests must pass before module is considered done

### Step 5: Close Module
- Mark spec as IMPLEMENTED in spec status tracker
- Update memory with completion state
- Move to next module/phase

---

## Spec File Format

Every spec file follows this structure:

```markdown
# Module Name Specification

## Status: DRAFT | REVIEW | APPROVED | IMPLEMENTING | IMPLEMENTED | DEPRECATED

## Source Files
- `path/to/file.js` — Description

## Test Files
- `tests/test_module.js` — AC list

## Phase: N

---

## 1. Purpose
What this module does and why it exists.

## 2. Dependencies
What this module requires from other modules.

## 3. Interfaces
### 3.1 Public API
Functions, their signatures, input types, return types.

### 3.2 Data Models
Schemas, message types, storage keys.

## 4. Behaviors
### 4.1 Happy Path
Normal operation flow.

### 4.2 Edge Cases
Boundary conditions, unusual inputs.

### 4.3 Error Handling
What happens when things fail.

## 5. Performance Constraints
Timing, memory, resource limits.

## 6. Acceptance Criteria
Numbered list of testable criteria. Format:
- AC-PX-001: [criterion]
- AC-PX-002: [criterion]

## 7. Test Plan
How to validate each acceptance criterion.

## 8. Open Questions
Unresolved design decisions.

## 9. Changelog
Date | Change | Reason
```

---

## Phase Workflow

Phases group modules into logical implementation stages:

```
Phase N:
  ├── Module A spec → implement → test → close
  ├── Module B spec → implement → test → close
  └── Phase integration test → Phase close
```

A phase is **closed** when:
1. All module specs in the phase are IMPLEMENTED
2. All module tests pass
3. Integration tests for the phase pass
4. User approves the phase

---

## Memory Strategy for Session Continuity

### What Gets Saved to Memory

1. **Spec Status Tracker** — Which specs are in which state
2. **Current Phase & Module** — Where we are in the iteration
3. **Design Decisions** — Key decisions with rationale (so we don't re-debate)
4. **Open Questions** — Unresolved items needing user input
5. **Blockers** — Anything preventing progress

### How to Resume a Session

1. Read `MEMORY.md` index
2. Load `sdd_status.md` memory — shows current phase, module, spec states
3. Load relevant spec file for current module
4. Load relevant source files
5. Continue from where we left off

### Memory Files

| File | Purpose |
|------|---------|
| `sdd_status.md` | Current phase, module states, what to do next |
| `sdd_decisions.md` | Design decisions log with rationale |
| `project_green_engineering.md` | Project context (already exists) |

---

## Commands for SDD Workflow

```bash
# View current SDD status
cat specs/STATUS.md

# Run tests for a specific module
npx vitest run tests/test_<module>.js

# Run all spec compliance tests
npx vitest run --reporter=verbose

# Validate a module against its spec
npx vitest run tests/test_<module>.js --reporter=verbose
```

---

## Spec Naming Convention

| Spec File | Governs |
|-----------|---------|
| `specs/overview.md` | System scope, goals, constraints |
| `specs/architecture.md` | Component design, carbon model, data flow |
| `specs/phases/phase-N.md` | Phase N iteration plan and acceptance |
| `specs/modules/co2-engine.md` | CO2 calculation, SWDM v4, grade thresholds |
| `specs/modules/resource-classifier.md` | Resource type classification logic |
| `specs/modules/background.md` | Service worker lifecycle, messaging, state |
| `specs/modules/content-script.md` | Performance API data collection |
| `specs/modules/side-panel.md` | UI rendering, tabs, events, exports |
| `specs/modules/security.md` | XSS prevention, URL validation, permissions |
| `specs/modules/methodology.md` | Carbon methodology accuracy |
| `specs/STATUS.md` | Live tracker of all spec states |
