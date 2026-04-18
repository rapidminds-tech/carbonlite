# System Overview Specification

## Status: APPROVED

---

## 1. Purpose

Build a Chrome extension that measures real-time carbon footprint of websites as developers browse, providing actionable recommendations to reduce site emissions. Targets developers and sustainability teams — not general consumers.

---

## 2. Goals

| ID | Goal | Measurable Criteria |
|----|------|-------------------|
| G-001 | Measure page carbon footprint | Display CO2g per page load using SWDM v4 |
| G-002 | Grade websites | Assign A+ to F grade based on emissions vs benchmarks |
| G-003 | Provide actionable fixes | Each recommendation shows estimated CO2 savings |
| G-004 | Ambient, zero-friction UX | Score visible in toolbar badge; details in side panel on demand |
| G-005 | Track trends | 7-day history with sparkline per domain |
| G-006 | Developer-focused | Resource breakdown by type, optimization recommendations developers can act on |

---

## 3. Scope

### In Scope (v1 — Chrome Web Store MVP)
- Per-page CO2 measurement using Performance API resource data
- SWDM v4 calculation model (operational + embodied energy)
- Green hosting detection via Green Web Foundation API (cached 24h)
- Resource breakdown by type (images, JS, CSS, fonts, media, other)
- A+ to F grading with benchmarks
- 15+ optimization recommendations with estimated savings
- Side panel UI (Score, Breakdown, Fixes tabs)
- Toolbar badge with grade + color coding
- 7-day domain history with sparkline
- Light/dark theme
- Regional grid intensity settings
- Privacy policy
- Chrome Web Store listing assets

### Out of Scope (v1)
- CI/CD GitHub Action (v2)
- CLI tool (v2)
- Team/org dashboard (v2)
- Carbon badge HTML generator (cut per product review)
- Share as PNG image (cut)
- PDF report export (cut)
- Onboarding wizard (cut — product should be self-explanatory)
- CSS coverage approximation (unreliable, cut)
- Font subsetting recommendations (too niche, cut)
- Data export/import (cut)
- Site comparison feature (cut — UX too friction-heavy)

---

## 4. System Constraints

| Constraint | Value | Rationale |
|-----------|-------|-----------|
| Platform | Chrome Manifest V3 | Target distribution channel |
| Language | Vanilla JavaScript | No build system for v1 simplicity |
| Service Worker | MV3 lifecycle — can terminate any time | Must persist state to chrome.storage |
| External APIs | Green Web Foundation only | Minimize privacy surface |
| Permissions | Minimize — no `<all_urls>` if possible | Store review friction |
| Performance | Extension must not slow browsing | Self-measurement needed |
| Privacy | No browsing data sent without consent + caching | Green hosting API leaks hostnames |

---

## 5. Users

Developers and sustainability teams evaluating website carbon footprint.
Single-user Chrome extension. No authentication. No multi-tenancy.

---

## 6. Success Criteria

| ID | Criterion | How to Measure |
|----|-----------|---------------|
| SC-001 | Extension loads and runs without errors | Load unpacked, browse 10 sites, no console errors |
| SC-002 | CO2 measurement within 10% of websitecarbon.com | Cross-reference 5 popular sites |
| SC-003 | Side panel renders score within 3s of page load | Timed observation |
| SC-004 | Green hosting detection works | Test known green + non-green hosts |
| SC-005 | All P0 bugs from VALIDATION_REPORT.md fixed | Regression test checklist |
| SC-006 | Passes Chrome Web Store review | Successful submission |
| SC-007 | No XSS vulnerabilities | Security audit of all DOM writes |

---

## 7. Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Service worker restarts lose state | Analysis lost mid-page | Persist tabData to chrome.storage.session |
| Green Web Foundation API changes | Green hosting detection fails | Cache aggressively (24h), degrade gracefully |
| CORS blocks transferSize | Undercount cross-origin resources | Estimate from content-length or typical sizes |
| Chrome Web Store rejects permissions | Can't publish | Minimize permissions, prepare justifications |
| Methodology disputed by experts | Credibility loss | Use established SWDM v4, cite sources, show methodology |

---

## 8. Technology Stack

| Layer | Technology |
|-------|-----------|
| Platform | Chrome Extension (Manifest V3) |
| Language | Vanilla JavaScript (ES2022) |
| UI | HTML5 + CSS3 (custom properties for theming) |
| Carbon Model | SWDM v4 (Sustainable Web Design Model) |
| CO2 Library | Embedded CO2.js (Green Web Foundation) |
| Data Collection | Performance API (PerformanceResourceTiming) |
| Storage | chrome.storage.local + chrome.storage.session |
| External API | Green Web Foundation (green hosting check) |
| Testing | Vitest (to be set up) |
| Linting | ESLint (to be set up) |

---

## 9. Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-16 | Initial spec created | SDD adoption for systematic bug fixing |
| 2026-04-16 | Scope cuts per product review | Focus on core value, cut ~50% features |
