# Background Service Worker Specification

## Status: APPROVED

## Source Files
- `background.js` — Service worker

## Test Files
- `tests/test_background.js` — AC-P1-001 through AC-P1-004, AC-P2-003, AC-P2-005, AC-P2-006, AC-P4-007

## Phase: 1, 2, 4

---

## 1. Purpose

Chrome MV3 service worker that orchestrates resource tracking, CO2 calculation, state management, and messaging between content script and side panel.

## 2. Dependencies

- `libs/co2.js` — CO2 calculation
- `libs/benchmarks.js` — Benchmark data
- Chrome APIs: `storage`, `webNavigation`, `sidePanel`, `runtime`

## 3. Interfaces

### 3.1 State Management

```javascript
// Tab data structure (persisted to chrome.storage.session)
tabData = {
  [tabId]: {
    url: string,
    resources: Array<ResourceEntry>,  // capped at 1000
    totalBytes: number,
    co2: number,
    grade: string,
    breakdown: Object,
    greenHosting: boolean | null,
    calculatedAt: number  // timestamp
  }
}

// Persist on every update
async function persistTabData(tabId)
async function restoreTabData()
```

### 3.2 Core Functions

```javascript
// Debounced — max 1 call per 500ms per tab
async function calculateForTab(tabId, options)

// Resource classification (see resource-classifier.md)
function classifyResource(entry) → string

// Green hosting check (cached 24h)
async function checkGreenHosting(hostname) → boolean
```

## 4. Behaviors

### 4.1 Service Worker Lifecycle
- On install/startup: restore tabData from `chrome.storage.session`
- On tab close: remove tabData for that tab
- All timers use `chrome.alarms` API (not setTimeout/setInterval)

### 4.2 Debounce
- `calculateForTab` is debounced per tabId
- If called multiple times within 500ms, only the last call executes
- Prevents double calculation from setTimeout + PERFORMANCE_DATA race

### 4.3 Resource Array Cap
- Maximum 1000 resource entries per tab
- When cap exceeded, oldest entries dropped (FIFO)

## 5. Acceptance Criteria

See Phase 1 (AC-P1-001 through AC-P1-004), Phase 2 (AC-P2-003, AC-P2-005, AC-P2-006), Phase 4 (AC-P4-007).

## 6. Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-16 | Initial spec | SDD adoption |
