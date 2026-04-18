# Green Engineering — Full Validator Report

6 expert validators ran across the codebase. Here's the consolidated, unfiltered feedback.

---

## 1. ARCHITECTURE (CTO Review)

### P0 Bugs — Ship-Blockers

- **`tabData` Map is volatile.** `background.js:10` — all in-progress analysis is lost when MV3 service worker restarts (every 30s idle). No persistence, no recovery. The extension is unreliable by design.
- **`gridIntensity` setting is ignored.** The options page lets users set a region, but `calculateForTab` at `background.js:147` never passes `gridIntensity` to `CO2.calculate()`. The feature is broken — global average always used.
- **`classifyResource` receives wrong argument.** `background.js:601` passes `entry.initiatorType` (values like `"script"`, `"link"`) but `classifyResource:28` expects a MIME content-type. Classification falls through to file-extension matching, which fails for extensionless/CDN URLs. Resource breakdown is wrong.
- **Double calculation.** `calculateForTab` fires both from `setTimeout` at line 575 AND from `PERFORMANCE_DATA` at line 641 — no debounce. Green hosting API hit twice, history saved twice, side panel rendered twice per navigation.

### Architecture Risks

- `setTimeout`/`setInterval` in service worker — unreliable, will be killed by Chrome
- Compare feature (`background.js:644-675`) — opens real tab, polls with `setInterval`, visible to user, breaks when worker sleeps
- Report data passed via `_reportData` storage key — race condition with no locking
- `resources` array grows unbounded per tab — no cap, no dedup
- No build system, no types, no tests for a tool whose entire value is measurement accuracy

---

## 2. SECURITY (Security CTO Review)

### HIGH Severity

- **XSS via `innerHTML`** — at least 12 `innerHTML` assignments in `panel.js` embed data from external URLs. `panel.js:513` inserts hostnames from resource URLs directly. `panel.js:837-848` inserts user-provided compare URLs. A crafted hostname like `<img src=x onerror=alert(1)>` executes in the extension context with Chrome API access.
- **`COMPARE_URL` opens arbitrary URLs** — `background.js:645` opens any URL received via message with zero validation. No scheme check, no origin validation.
- **Browsing history leaked to third party** — every navigation sends the hostname to `api.thegreenwebfoundation.org`. No caching, no user consent, no disclosure.
- **Content script reads page text** — `content.js:71` reads `document.body.innerText` on every page including banking, medical, corporate sites. Disproportionate to stated purpose.

### Permission Over-Reach

- `<all_urls>` + content script on all URLs — maximum attack surface
- `tabs` permission redundant with `host_permissions`
- `autoAnalyze` and `showBadge` settings exist but are never checked — content script always runs

---

## 3. CARBON METHODOLOGY (Sustainability Expert Review)

### Critical Errors

- **Missing embodied energy from SWDM v4** — you implement only operational energy, undercounting by ~15-20%
- **Script deferral recommendation claims carbon savings** — deferring changes *when* a script loads, not *how much* it transfers. Zero transfer savings. This is factually wrong and a credibility-killer for developer audiences.
- **CORS-blocked `transferSize = 0`** for cross-origin resources — you systematically undercount third-party resources (ads, CDN scripts, fonts) by 30-60% on heavy pages. Not disclosed to users.
- **Caching recommendation double-counts** — SWDM's returning visitor ratio already models cache savings. Your recommendation is double-dipping.

### Inaccuracies

- `GLOBAL_GRID_INTENSITY = 494` cites Ember 2024 but uses the 2022 figure. Current is ~480.
- Image format savings estimate (65%) is realistic only for BMP/PNG→AVIF, not the common JPEG→WebP path (25-35%)
- Grade thresholds too lenient — median page (2.5MB, ~0.5g) gets a B. Competitors grade this as D. You're telling most of the web "you're fine."
- Benchmark data is unsourced and internally inconsistent (average = 3MB but percentile baseline = 2.5MB)
- CSS coverage sampling (every 5th rule, max 100) is not statistically valid — could be 50%+ off

---

## 4. CODE QUALITY & UX (Senior Frontend Review)

### Code Problems

- **`panel.js` is 874 lines** — god file with rendering, events, canvas, exports, modals, toasts, messaging
- **Dark theme CSS fully duplicated** — `panel.css:31-58` and `panel.css:60-89` are identical blocks
- **`REGION_INTENSITY` defined in 3 places** — `options.js:6`, `onboarding.js:46`, and HTML `<option>` text
- **12+ empty `catch {}` blocks** — swallowing errors in green hosting, history saves, rendering
- **No ARIA attributes anywhere** — no `role="tab"`, no `aria-selected`, no focus traps in modals, no `aria-live` on toasts, canvas charts completely inaccessible
- Options and onboarding pages have no dark mode despite the extension having a theme system

### UX Friction

- Compare feature: user must type full URL, tab flashes open/closed, 30s silent timeout, no cancel
- Badge modal generates hardcoded light-theme HTML — looks wrong on dark websites
- Quick-rec click switches to Fixes tab but doesn't scroll to relevant card
- Report page can't be refreshed (data deleted after first render)

---

## 5. CHROME WEB STORE READINESS

### Hard Blockers (Cannot Submit)

1. **No privacy policy** — mandatory for extensions handling user data
2. **No screenshots** — minimum 1 required
3. **"About" links point to generic `https://github.com`** — placeholder, looks unfinished

### Soft Blockers (Likely Rejection)

4. `<all_urls>` without prepared permission justifications
5. "Share anonymous usage stats" toggle with no implementation — deceptive UI
6. `activeTab` permission redundant with `host_permissions`
7. No single-purpose description prepared

---

## 6. PRODUCT STRATEGY (Product CTO Review)

### Core Problem: 22 Features, Zero Distribution Strategy

The real differentiator — **ambient, zero-friction carbon measurement as you browse** — is buried under PDF exports, PNG sharing, badge generators, and comparison modals that nobody will use.

### Cut for v1 (Remove ~50% scope, lose ~0% value)

- Carbon badge HTML generator
- Share as PNG image
- PDF report export
- Onboarding wizard (if your product needs one, it's too complex)
- CSS coverage approximation (unreliable)
- Font subsetting recommendations (too niche)
- Region-specific grid intensity (academically correct, practically irrelevant to behavior)
- Data export/import

### Missing Features That Actually Matter

1. **CI/CD integration (GitHub Action)** — developers change behavior when PRs get blocked, not when a popup shows a grade
2. **CLI tool** — `npx green-engineering https://mysite.com`
3. **Historical data beyond 7 days** — can't justify optimization work to a manager with a sparkline
4. **Team/org features** — individual awareness doesn't drive organizational change
5. **Performance self-measurement** — prove the extension doesn't slow browsing

### The 10x Product

The extension is the **demo**. The CI integration is the **product**. A GitHub Action that comments carbon impact diffs on PRs, enforces budgets in CI, and feeds a team dashboard — that's where the business is. Free extension → paid CI/monitoring → enterprise ESG reporting.

---

## Priority Action Items

| Priority | Issue | Impact |
|----------|-------|--------|
| **P0** | Persist `tabData` to `chrome.storage.session` | Extension unreliable without this |
| **P0** | Fix XSS — replace `innerHTML` with `textContent` + `createElement` | Security vulnerability |
| **P0** | Fix `gridIntensity` never being passed to `CO2.calculate()` | Shipped broken feature |
| **P0** | Fix `classifyResource` receiving `initiatorType` not content-type | Resource breakdown is wrong |
| **P0** | Write privacy policy, prepare screenshots | Cannot submit to store |
| **P1** | Cache green hosting API results (24h TTL per hostname) | Privacy leak + rate limiting |
| **P1** | Debounce `calculateForTab` | Double calculation on every nav |
| **P1** | Remove script deferral carbon savings claim | Methodology error |
| **P1** | Add embodied energy to SWDM calculation | 15-20% undercount |
| **P1** | Validate COMPARE_URL — https only, no internal schemes | Security flaw |
| **P2** | Remove `activeTab` + `tabs` permission overlap | Store review friction |
| **P2** | Add ARIA attributes, focus traps, aria-live regions | Accessibility gaps |
| **P2** | Extract shared modules (REGION_INTENSITY, URL parsing) | Maintainability |
| **P2** | Add unit tests for CO2 calculation + grading | Measurement accuracy |

---

The foundation is solid — the CO2 engine, recommendation engine, and side panel architecture are genuinely well-built. But the P0 bugs (volatile state, XSS, broken settings, wrong classification) need fixing before this ships to real users. The product strategy needs ruthless focus: cut features, ship the extension lean, then build the CI integration that actually changes developer behavior.
