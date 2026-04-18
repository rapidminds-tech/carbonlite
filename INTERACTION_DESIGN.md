# Green Engineering — Interaction Design & UI Specification

**Version:** 1.0
**Date:** April 15, 2026
**Target:** Chrome Extension (Manifest V3) — MVP

---

## 1. Design Principles

| Principle | Description |
|-----------|-------------|
| **Glanceable** | Score visible in 1 second; details available on demand |
| **Non-intrusive** | Never block the developer's workflow; side panel stays out of the way |
| **Actionable** | Every metric has a "what to do about it" attached |
| **Honest** | Show confidence levels; don't pretend false precision |
| **Lightweight** | The extension itself must be low-carbon (minimal resources, local-first) |

---

## 2. Extension Components Overview

```
┌─────────────────────────────────────────────────────┐
│                   CHROME BROWSER                     │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Toolbar  [🌿 A+]  ← Badge (always visible)  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────┐  ┌─────────────────────┐  │
│  │                      │  │   SIDE PANEL         │  │
│  │                      │  │                      │  │
│  │   WEB PAGE           │  │  Score + Grade       │  │
│  │   (developer's site) │  │  Resource Breakdown  │  │
│  │                      │  │  Recommendations     │  │
│  │                      │  │  History Trend       │  │
│  │                      │  │                      │  │
│  └──────────────────────┘  └─────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ First-Run Onboarding (overlay, one-time)     │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Options Page (full tab, settings)            │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 3. User Journeys

### 3.1 First-Time User Journey

```
Install from Chrome Web Store
        │
        ▼
┌─────────────────────┐
│  ONBOARDING STEP 1  │
│  "Welcome"          │
│                     │
│  [🌿] Green         │
│  Engineering        │
│                     │
│  Measure the carbon │
│  footprint of any   │
│  website in real    │
│  time.              │
│                     │
│  [Get Started →]    │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  ONBOARDING STEP 2  │
│  "How It Works"     │
│                     │
│  ┌───┐ We measure   │
│  │ 📊│ page weight,  │
│  └───┘ requests, &   │
│        hosting to    │
│        calculate     │
│        carbon.       │
│                     │
│  ┌───┐ You get a    │
│  │ 🎯│ grade (A+ to │
│  └───┘ F) and tips  │
│        to improve.  │
│                     │
│  [Next →]           │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  ONBOARDING STEP 3  │
│  "Quick Setup"      │
│                     │
│  Your region:       │
│  [Auto-detect ▼]    │
│  (for grid carbon   │
│   intensity)        │
│                     │
│  ☑ Show badge on    │
│    toolbar          │
│  ☑ Auto-open side   │
│    panel on my      │
│    domains          │
│                     │
│  My domains:        │
│  [localhost:3000  ]  │
│  [+ Add domain   ]  │
│                     │
│  [Start Scanning →] │
└─────────────────────┘
        │
        ▼
  Badge appears on toolbar
  Side panel opens on first page
  with live analysis results
```

### 3.2 Daily Developer Flow

```
Developer opens localhost:3000
        │
        ▼
Badge updates: [🌿 B+]  (color-coded)
        │
        ├──── Glance at badge → "B+, decent" → keeps coding
        │
        └──── Clicks badge → Side Panel opens
                    │
                    ▼
              ┌─────────────┐
              │ Score: B+    │
              │ 0.42g CO2   │
              │              │
              │ ▼ Breakdown  │
              │ ▼ Fixes (3)  │
              │ ▼ Trend      │
              └─────────────┘
                    │
                    ├── Expands "Fixes" → sees actionable items
                    │       │
                    │       └── Clicks "Compress images"
                    │           → sees specific images + savings
                    │
                    ├── Makes changes → refreshes page
                    │       │
                    │       └── Badge updates: [🌿 A-]
                    │           Side panel shows improvement
                    │
                    └── Clicks "Trend" → sees score over time
                        for this domain
```

### 3.3 Casual Browsing Flow

```
Developer browses any website
        │
        ▼
Badge shows grade passively
        │
        ├── Most of the time: developer ignores it
        │
        └── Occasionally curious → clicks badge
            → Side panel shows analysis
            → "Huh, this news site loads 4.2MB
               and emits 2.1g CO2 per visit"
            → Learns patterns of good/bad sites
```

---

## 4. Screen Designs

### 4.1 Toolbar Badge States

```
┌─────────────────────────────────────────────────────────┐
│  BADGE STATES                                           │
│                                                         │
│  Loading:    [🌿 ···]   Gray bg, animated dots          │
│                                                         │
│  Grade A+:   [🌿 A+]    Deep green bg (#16a34a)         │
│  Grade A:    [🌿 A ]    Green bg (#22c55e)              │
│  Grade B:    [🌿 B ]    Light green bg (#86efac)        │
│  Grade C:    [🌿 C ]    Yellow bg (#facc15)             │
│  Grade D:    [🌿 D ]    Orange bg (#fb923c)             │
│  Grade F:    [🌿 F ]    Red bg (#ef4444)                │
│                                                         │
│  Error:      [🌿 — ]    Gray bg (can't measure)         │
│  Disabled:   [🌿 off]   Gray bg (user paused)           │
│                                                         │
│  Tooltip on hover:                                      │
│  "0.42g CO2 per visit · Grade B+ · Click to open"      │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Side Panel — Main View (Score Tab)

```
┌──────────────────────────────┐
│  🌿 Green Engineering   [⚙]  │  ← Header + settings gear
├──────────────────────────────┤
│                              │
│         ┌────────┐           │
│         │        │           │
│         │   B+   │           │
│         │        │           │
│         └────────┘           │
│      0.42g CO2 / visit       │
│                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Cleaner than 68% of sites   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                              │
├──────────────────────────────┤
│  📊 BREAKDOWN                │
│                              │
│  Images        ████████░ 312KB│
│  JavaScript    █████░░░ 198KB│
│  CSS           ██░░░░░░  64KB│
│  Fonts         ██░░░░░░  58KB│
│  HTML          █░░░░░░░  12KB│
│  Other         █░░░░░░░   8KB│
│                ─────────────│
│  Total              652 KB   │
│  Requests              24    │
│                              │
├──────────────────────────────┤
│  🏢 HOSTING                  │
│                              │
│  ✅ Green hosted             │
│  Provider: Vercel            │
│  Region: US-East (Virginia)  │
│  Grid intensity: 384 gCO2/kWh│
│                              │
├──────────────────────────────┤
│  🔧 RECOMMENDATIONS (3)  →   │
│                              │
│  🔴 Compress 4 images  -38%  │
│  🟡 Defer 2 scripts    -12%  │
│  🟢 Add cache headers  -8%   │
│                              │
├──────────────────────────────┤
│  📈 TREND (7 days)           │
│                              │
│  0.6│    ·                   │
│  0.5│  ·   ·                 │
│  0.4│        · · ·  ·       │
│  0.3│                        │
│     └─────────────────       │
│      M  T  W  T  F  S  S    │
│                              │
├──────────────────────────────┤
│  [Score] [Breakdown] [Fixes] │  ← Tab bar
└──────────────────────────────┘
```

### 4.3 Side Panel — Fixes Tab (Expanded)

```
┌──────────────────────────────┐
│  🌿 Green Engineering   [⚙]  │
├──────────────────────────────┤
│                              │
│  🔧 3 ways to reduce carbon  │
│  Potential savings: -58%     │
│                              │
├──────────────────────────────┤
│                              │
│  ┌────────────────────────┐  │
│  │ 🔴 HIGH IMPACT         │  │
│  │                        │  │
│  │ Compress 4 images      │  │
│  │ Save ~198KB (-38%)     │  │
│  │ = 0.16g CO2 saved      │  │
│  │                        │  │
│  │ hero-bg.png    142KB   │  │
│  │ → WebP/AVIF:    28KB  │  │
│  │                        │  │
│  │ team-photo.jpg  89KB   │  │
│  │ → Resize + WebP: 22KB │  │
│  │                        │  │
│  │ logo@2x.png     38KB   │  │
│  │ → SVG:           3KB  │  │
│  │                        │  │
│  │ banner.jpg       41KB  │  │
│  │ → WebP:          12KB │  │
│  │                        │  │
│  │ 📋 Copy optimization   │  │
│  │    checklist            │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 🟡 MEDIUM IMPACT       │  │
│  │                        │  │
│  │ Defer 2 render-        │  │
│  │ blocking scripts       │  │
│  │ Save ~78KB (-12%)      │  │
│  │ = 0.05g CO2 saved      │  │
│  │                        │  │
│  │ analytics.js    45KB   │  │
│  │ → Add defer attribute  │  │
│  │                        │  │
│  │ chat-widget.js  33KB   │  │
│  │ → Lazy load on scroll  │  │
│  │                        │  │
│  │ 📋 Copy fix snippet    │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 🟢 LOW IMPACT          │  │
│  │                        │  │
│  │ Add cache headers      │  │
│  │ Save ~52KB (-8%) for   │  │
│  │ returning visitors     │  │
│  │ = 0.03g CO2 saved      │  │
│  │                        │  │
│  │ 12 static assets lack  │  │
│  │ Cache-Control headers  │  │
│  │                        │  │
│  │ 📋 Copy config snippet │  │
│  └────────────────────────┘  │
│                              │
├──────────────────────────────┤
│  [Score] [Breakdown] [Fixes] │
└──────────────────────────────┘
```

### 4.4 Side Panel — Breakdown Tab (Deep Dive)

```
┌──────────────────────────────┐
│  🌿 Green Engineering   [⚙]  │
├──────────────────────────────┤
│                              │
│  📊 Resource Carbon Map      │
│                              │
│  Total: 0.42g CO2 / visit    │
│                              │
│  ┌────────────────────────┐  │
│  │  CARBON TREEMAP         │  │
│  │ ┌──────────┬─────────┐ │  │
│  │ │          │         │ │  │
│  │ │  Images  │   JS    │ │  │
│  │ │  0.21g   │  0.12g  │ │  │
│  │ │          │         │ │  │
│  │ ├─────┬────┼────┬────┤ │  │
│  │ │ CSS │Font│HTML│Othr│ │  │
│  │ │.04g │.03g│.01g│.01g│ │  │
│  │ └─────┴────┴────┴────┘ │  │
│  └────────────────────────┘  │
│                              │
├──────────────────────────────┤
│  🏷️ THIRD-PARTY SCRIPTS      │
│                              │
│  ⚠️ 3rd party = 42% of       │
│    page weight               │
│                              │
│  google-analytics.js   28KB  │
│  intercom-widget.js    89KB  │
│  stripe.js             34KB  │
│  fonts.googleapis.com  58KB  │
│                              │
│  💡 Consider: self-hosted    │
│     fonts save 58KB + a DNS  │
│     lookup                   │
│                              │
├──────────────────────────────┤
│  🔄 NEW vs RETURNING VISIT   │
│                              │
│  First visit:    0.42g CO2   │
│  Return visit:   0.18g CO2   │
│  Cache savings:  -57%        │
│                              │
│  ⚠️ 12 assets not cacheable  │
│    (missing Cache-Control)   │
│                              │
├──────────────────────────────┤
│  [Score] [Breakdown] [Fixes] │
└──────────────────────────────┘
```

### 4.5 Settings Page

```
┌──────────────────────────────────────────────────────┐
│  🌿 Green Engineering — Settings                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  MEASUREMENT                                         │
│  ─────────────────────────────────────               │
│                                                      │
│  Carbon model:     [Sustainable Web Design v4 ▼]     │
│  Your region:      [Auto-detect ▼]  (US-East)        │
│  Grid intensity:   384 gCO2/kWh  [Use custom ▼]     │
│                                                      │
│  BEHAVIOR                                            │
│  ─────────────────────────────────────               │
│                                                      │
│  ☑ Show toolbar badge                                │
│  ☑ Auto-analyze pages                                │
│  ☐ Auto-open side panel on my domains                │
│  ☑ Remember scores (local history)                   │
│                                                      │
│  MY DOMAINS (auto-open + track trends)               │
│  ─────────────────────────────────────               │
│                                                      │
│  localhost:3000          [✕]                          │
│  staging.myapp.com       [✕]                          │
│  myapp.com               [✕]                          │
│  [+ Add domain                              ]        │
│                                                      │
│  PRIVACY                                             │
│  ─────────────────────────────────────               │
│                                                      │
│  ☑ All data stored locally (never sent to servers)   │
│  ☐ Share anonymous usage stats to help improve       │
│                                                      │
│  DATA                                                │
│  ─────────────────────────────────────               │
│                                                      │
│  History: 142 pages analyzed (12.4 KB stored)        │
│  [Export History (JSON)]  [Clear All Data]            │
│                                                      │
│  ABOUT                                               │
│  ─────────────────────────────────────               │
│                                                      │
│  Version: 1.0.0                                      │
│  Methodology: sustainablewebdesign.org               │
│  Powered by: CO2.js · Green Web Foundation           │
│                                                      │
│  [Report Bug]  [Feature Request]  [GitHub ★]         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 5. Interaction Micro-Details

### 5.1 Badge Update Behavior

| Event | Badge Response |
|-------|---------------|
| Page starts loading | Show `···` (loading state) |
| DOM content loaded | Calculate initial score from resources loaded so far |
| Page fully loaded | Final score + grade with color |
| Page navigates (SPA) | Re-analyze after URL change (debounced 1s) |
| User switches tabs | Badge updates to show that tab's score |
| Extension disabled | Show `off` in gray |

### 5.2 Side Panel Behavior

| Trigger | Action |
|---------|--------|
| Click toolbar badge | Toggle side panel open/closed |
| Navigate to new page | Side panel updates automatically (no manual refresh) |
| Page is loading | Show skeleton UI with shimmer animation |
| SPA route change | Re-analyze, show subtle "updating..." indicator |
| User on "My Domain" | Auto-open side panel (if setting enabled) |
| Resize side panel | Responsive layout adapts (narrower = stacked bars) |

### 5.3 Score Animation

```
Page loads → Badge shows "···"
           → Score calculates
           → Badge animates: grade letter fades in
           → Side panel: score circle fills up like a gauge
           → Breakdown bars animate left-to-right
           → Recommendations slide in with stagger
```

### 5.4 Recommendation Interactions

| Action | Result |
|--------|--------|
| Click recommendation card | Expand to show specific files + fix details |
| Click "Copy checklist" | Copy markdown checklist to clipboard |
| Click "Copy fix snippet" | Copy code snippet (nginx config, HTML tag, etc.) |
| Hover over a file | Show file size, type, and estimated savings |
| After user fixes + refreshes | Recommendation disappears, score updates, show "Improvement: A- → A" toast |

### 5.5 Improvement Celebration

```
When score improves after a page refresh:

┌──────────────────────────────┐
│                              │
│    ↑ Score improved!         │
│                              │
│    B+ → A-                   │
│    0.42g → 0.31g CO2         │
│    Saved 26%                 │
│                              │
│    [Nice! Keep going]        │
│                              │
└──────────────────────────────┘

Shows as a toast overlay for 4 seconds,
then slides away. Non-blocking.
```

---

## 6. Color System

| Element | Color | Hex |
|---------|-------|-----|
| Grade A+ / A | Deep green | `#16a34a` |
| Grade B+ / B | Green | `#22c55e` |
| Grade C+ / C | Yellow | `#eab308` |
| Grade D+ / D | Orange | `#f97316` |
| Grade F | Red | `#ef4444` |
| Primary brand | Forest green | `#166534` |
| Background | Near white | `#fafaf9` |
| Text primary | Charcoal | `#1c1917` |
| Text secondary | Warm gray | `#78716c` |
| Card background | White | `#ffffff` |
| Card border | Light warm gray | `#e7e5e4` |
| High impact fix | Red dot | `#ef4444` |
| Medium impact fix | Yellow dot | `#eab308` |
| Low impact fix | Green dot | `#22c55e` |

---

## 7. Grading Scale

| Grade | CO2 per visit | Percentile | Label |
|-------|--------------|------------|-------|
| A+ | < 0.10g | Top 5% | Exceptional |
| A  | 0.10 – 0.20g | Top 15% | Excellent |
| B+ | 0.20 – 0.35g | Top 30% | Very Good |
| B  | 0.35 – 0.50g | Top 50% | Good |
| C+ | 0.50 – 0.75g | Top 65% | Average |
| C  | 0.75 – 1.00g | Top 75% | Below Average |
| D  | 1.00 – 1.50g | Top 90% | Poor |
| F  | > 1.50g | Bottom 10% | Very Poor |

**Reference:** Average web page emits ~0.5g CO2 per visit (Website Carbon Calculator, 2024 data).

---

## 8. Accessibility

- All color grades have text labels (not color-only)
- Side panel supports keyboard navigation
- ARIA labels on all interactive elements
- Respects `prefers-color-scheme` (dark mode support)
- Minimum contrast ratio: 4.5:1 (WCAG AA)
- Focus indicators visible on all interactive elements
- Screen reader announcements for score updates

---

## 9. Empty & Error States

### No Data Yet
```
┌──────────────────────────────┐
│                              │
│    🌿                        │
│                              │
│    Navigate to a website     │
│    to see its carbon         │
│    footprint.                │
│                              │
│    [Try websitecarbon.com →] │
│                              │
└──────────────────────────────┘
```

### Cannot Measure (chrome://, extensions, etc.)
```
┌──────────────────────────────┐
│                              │
│    ⚪                        │
│                              │
│    Can't measure this page   │
│                              │
│    Chrome internal pages     │
│    and extensions can't be   │
│    analyzed.                 │
│                              │
└──────────────────────────────┘
```

### Network Error
```
┌──────────────────────────────┐
│                              │
│    ⚠️                        │
│                              │
│    Hosting check failed      │
│                              │
│    Carbon score calculated   │
│    without hosting data.     │
│    Green Web Foundation API  │
│    may be unavailable.       │
│                              │
│    [Retry]                   │
│                              │
└──────────────────────────────┘
```

---

## 10. User Flow Summary

```
                    ┌─────────────┐
                    │   INSTALL    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  ONBOARDING  │
                    │  (3 steps)   │
                    └──────┬──────┘
                           │
              ┌────────────▼────────────┐
              │    PASSIVE MONITORING    │
              │  (badge on every page)   │
              └────────────┬────────────┘
                           │
                    Click badge
                           │
              ┌────────────▼────────────┐
              │      SIDE PANEL         │
              │                         │
              │  ┌─────┬───────┬─────┐  │
              │  │Score│Breakdn│Fixes│  │
              │  └──┬──┴───┬───┴──┬──┘  │
              │     │      │      │     │
              │  Grade  Treemap  Action │
              │  CO2g   Resources Cards │
              │  Trend  3rd Party Copy  │
              │  Host   Cache    Fix    │
              │                         │
              └────────────┬────────────┘
                           │
                  Developer makes fixes
                           │
              ┌────────────▼────────────┐
              │   REFRESH → IMPROVED    │
              │   Score celebration     │
              │   toast notification    │
              └────────────┬────────────┘
                           │
                    ┌──────▼──────┐
                    │   REPEAT    │
                    │  (daily     │
                    │   habit)    │
                    └─────────────┘
```
