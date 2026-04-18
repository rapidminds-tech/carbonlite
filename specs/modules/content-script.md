# Content Script Specification

## Status: APPROVED

## Source Files
- `content.js` — Content script

## Test Files
- `tests/test_content_script.js` — AC-P1-014, AC-P2-009

## Phase: 1, 2

---

## 1. Purpose

Collect Performance API resource timing data and DOM element counts from the current page. Send data to background service worker for CO2 calculation.

## 2. Dependencies

- Chrome APIs: `runtime` (messaging)
- Web APIs: `performance.getEntriesByType('resource')`, DOM queries

## 3. Interfaces

### 3.1 Data Sent to Background

```javascript
// Message type: PERFORMANCE_DATA
{
  type: 'PERFORMANCE_DATA',
  data: {
    resources: Array<{
      name: string,          // URL
      transferSize: number,  // bytes (0 if CORS-blocked)
      encodedBodySize: number,
      decodedBodySize: number,
      initiatorType: string,
      duration: number
    }>,
    domMetrics: {
      imageCount: number,    // document.images.length
      scriptCount: number,   // document.scripts.length
      stylesheetCount: number // document.styleSheets.length
    }
  }
}
```

## 4. Behaviors

### 4.1 What IS Collected
- `performance.getEntriesByType('resource')` entries (URL, sizes, timing)
- DOM element counts (images, scripts, stylesheets)

### 4.2 What is NOT Collected
- Page text content (`document.body.innerText`) — NEVER
- Form data, input values — NEVER
- Cookies, localStorage — NEVER
- User interaction data — NEVER

### 4.3 Page Filtering
- Do NOT run on `chrome://`, `chrome-extension://`, `about:`, `file://` URLs
- Only run when `autoAnalyze` setting is true

## 5. Acceptance Criteria

See Phase 1 (AC-P1-014), Phase 2 (AC-P2-009).

## 6. Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-16 | Initial spec | Privacy fix — remove body text reading |
