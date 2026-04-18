# Architecture & Design Specification

## Status: APPROVED

---

## 1. System Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    CHROME BROWSER                          │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Toolbar  [🌿 B+]  ← Badge (grade + color)          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────┐  ┌──────────────────────────────┐  │
│  │                   │  │       SIDE PANEL              │  │
│  │                   │  │                               │  │
│  │   WEB PAGE        │  │  Tab 1: Score + Grade         │  │
│  │                   │  │  Tab 2: Resource Breakdown     │  │
│  │                   │  │  Tab 3: Recommendations        │  │
│  │                   │  │  + History Sparkline           │  │
│  │                   │  │                               │  │
│  └───────────────────┘  └──────────────────────────────┘  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Options Page (full tab, settings)                   │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### Extension Components

| Component | File(s) | Role |
|-----------|---------|------|
| Service Worker | `background.js` | Resource tracking, CO2 calculation, state management, messaging |
| Content Script | `content.js` | Performance API data collection, DOM metrics |
| Side Panel | `sidepanel/panel.js`, `.html`, `.css` | UI rendering, user interaction |
| Options Page | `options/options.js`, `.html` | User settings (region, theme, budget) |
| CO2 Engine | `libs/co2.js` | SWDM v4 calculation |
| Benchmarks | `libs/benchmarks.js` | Industry comparison data |

---

## 2. Data Flow

### 2.1 Page Analysis Flow

```
1. NAVIGATION
   webNavigation.onCompleted fires → background.js creates tab entry

2. COLLECT (content.js)
   a. Wait for page load (document_idle)
   b. Query Performance API → PerformanceResourceTiming entries
   c. Collect DOM metrics (image count, script count, etc.)
   d. Send PERFORMANCE_DATA message to background.js

3. CALCULATE (background.js)
   a. Classify each resource by type (image, script, style, font, media, other)
   b. Sum transfer sizes per type
   c. Calculate CO2 using SWDM v4:
      - Operational energy = totalBytes × energyPerByte × gridIntensity
      - Embodied energy = operational × 0.16 (16% hardware manufacturing)
      - Green hosting adjustment (50 gCO2/kWh vs grid average)
      - Returning visitor adjustment (75% first / 25% return)
   d. Assign grade (A+ to F) based on CO2 thresholds
   e. Check green hosting via Green Web Foundation API (cached 24h)

4. PERSIST
   Save to chrome.storage.session (tab state)
   Save to chrome.storage.local (domain history)

5. RENDER
   Send results to side panel via chrome.runtime.sendMessage
   Update toolbar badge (grade text + color)
```

### 2.2 State Management

```
chrome.storage.session (volatile, per-session):
  tabData:{tabId} → { url, resources[], totalBytes, co2, grade, breakdown, greenHosting }

chrome.storage.local (persistent):
  history:{domain} → [{ date, co2, grade, totalBytes }]  (last 7 days)
  greenHostingCache:{hostname} → { isGreen, checkedAt }  (24h TTL)
  settings → { region, theme, carbonBudget, autoAnalyze, showBadge }
```

---

## 3. Carbon Calculation Model (SWDM v4)

### 3.1 Energy Intensities (kWh/GB)

| Segment | Value |
|---------|-------|
| Data center | 0.055 |
| Network | 0.059 |
| Device | 0.080 |
| **Total** | **0.194** |

### 3.2 Carbon Intensity

| Scenario | gCO2e/kWh | Source |
|----------|-----------|--------|
| Global average | 480 | Ember 2023 Global Electricity Review |
| Green hosting | 50 | Renewable energy estimate |
| Regional overrides | Varies | Per-country averages |

### 3.3 Full Calculation

```
totalEnergy_kWh = totalBytes_GB × 0.194
operationalCO2_g = totalEnergy_kWh × gridIntensity_gCO2/kWh
embodiedCO2_g = operationalCO2_g × 0.16
totalCO2_g = operationalCO2_g + embodiedCO2_g

// Returning visitor adjustment
adjustedCO2_g = totalCO2_g × (0.75 × 1.0 + 0.25 × 0.02)
// = totalCO2_g × 0.755
```

### 3.4 Grade Thresholds

| Grade | CO2 (g) | Meaning |
|-------|---------|---------|
| A+ | < 0.15 | Exceptional |
| A | < 0.30 | Excellent |
| B | < 0.50 | Good |
| C | < 0.80 | Average |
| D | < 1.20 | Below average |
| F | ≥ 1.20 | Poor |

*Thresholds calibrated against HTTP Archive median page weight (2.5MB ≈ 0.5g = grade C).*

---

## 4. Resource Classification

| Type | Detection Method |
|------|-----------------|
| Image | MIME `image/*` or extension `.jpg,.png,.gif,.svg,.webp,.avif,.ico` |
| Script | MIME `application/javascript`, `text/javascript` or extension `.js,.mjs` |
| Style | MIME `text/css` or extension `.css` |
| Font | MIME `font/*`, `application/font-*` or extension `.woff,.woff2,.ttf,.otf,.eot` |
| Media | MIME `video/*`, `audio/*` or extension `.mp4,.webm,.mp3,.ogg` |
| Other | Everything else (HTML, JSON, XML, etc.) |

**Priority**: MIME type > file extension > `initiatorType` fallback

---

## 5. Messaging Protocol

| Message | From → To | Payload |
|---------|-----------|---------|
| `PERFORMANCE_DATA` | content → background | `{ resources[], domMetrics }` |
| `ANALYSIS_RESULT` | background → panel | `{ url, co2, grade, breakdown, greenHosting, recommendations }` |
| `GET_TAB_DATA` | panel → background | `{ tabId }` |
| `SETTINGS_CHANGED` | options → background | `{ settings }` |

---

## 6. Error Handling Strategy

### Graceful Degradation

```
Full System (all working)
  │
  ├── Green Web Foundation API unavailable → Skip green hosting (assume non-green)
  ├── Performance API blocked (rare pages) → Show "unable to measure" state
  ├── Service worker restarts → Recover from chrome.storage.session
  ├── Content script can't inject → Show "restricted page" state
  └── chrome:// or extension pages → Show "not applicable" state
```

### Per-Tab Error Isolation

If analysis fails for one tab, it must not affect other tabs.

---

## 7. Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-16 | Initial architecture spec | SDD adoption |
| 2026-04-16 | Added SWDM v4 with embodied energy | Fix methodology undercount |
| 2026-04-16 | Recalibrated grade thresholds | Align with HTTP Archive median |
