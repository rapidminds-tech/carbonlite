# Side Panel Specification

## Status: APPROVED

## Source Files
- `sidepanel/panel.js` — Side panel logic (to be decomposed)
- `sidepanel/panel.html` — Markup
- `sidepanel/panel.css` — Styles

## Test Files
- `tests/test_side_panel.js` — AC-P1-011, AC-P2-001, AC-P4-001 through AC-P4-006, AC-P4-008 through AC-P4-011

## Phase: 1, 2, 4

---

## 1. Purpose

Render the extension's UI in a Chrome side panel with three tabs (Score, Breakdown, Fixes), history sparkline, and theme support.

## 2. Dependencies

- Chrome APIs: `runtime` (messaging), `storage` (settings)
- Background service worker (receives analysis results)

## 3. Interfaces

### 3.1 Incoming Messages

```javascript
// From background.js
{
  type: 'ANALYSIS_RESULT',
  data: {
    url: string,
    co2: number,
    grade: string,
    breakdown: { image, script, style, font, media, other },
    greenHosting: boolean,
    recommendations: Array<Recommendation>,
    history: Array<{ date, co2, grade }>
  }
}
```

### 3.2 DOM Construction Rules

**CRITICAL**: All dynamic content MUST use safe DOM APIs:
- `element.textContent = value` for text
- `document.createElement()` + `element.appendChild()` for structure
- `element.setAttribute()` for attributes
- **NEVER** `element.innerHTML = dynamicValue`
- Static HTML templates (no dynamic data) may use innerHTML

## 4. Behaviors

### 4.1 File Decomposition (Phase 4)
panel.js split into:
- `panel-main.js` — initialization, messaging, routing
- `panel-score.js` — Score tab rendering
- `panel-breakdown.js` — Breakdown tab rendering + charts
- `panel-fixes.js` — Recommendations tab rendering
- `panel-utils.js` — shared helpers (safe DOM, formatting)

### 4.2 Accessibility
- Tabs: `role="tab"`, `aria-selected`, `role="tabpanel"`
- Toasts: `aria-live="polite"`
- Modals: focus trap (Tab cycles, Escape closes)
- Charts: `aria-label` with text summary

### 4.3 Theming
- CSS custom properties on `:root` / `[data-theme="dark"]`
- No duplicated rule blocks for dark theme

## 5. Acceptance Criteria

See Phase 1 (AC-P1-011), Phase 2 (AC-P2-001), Phase 4 (AC-P4-001 through AC-P4-011).

## 6. Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-16 | Initial spec | XSS fix + decomposition plan |
