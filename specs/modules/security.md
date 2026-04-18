# Security Specification

## Status: APPROVED

## Source Files
- All `.js` files — XSS prevention applies globally
- `manifest.json` — permissions

## Test Files
- `tests/test_security.js` — AC-P1-012, AC-P1-013, AC-P2-001 through AC-P2-010

## Phase: 1, 2

---

## 1. Purpose

Define and enforce security requirements across the extension: XSS prevention, permission minimization, URL validation, and privacy-respectful data handling.

## 2. Security Requirements

### 2.1 XSS Prevention
- Zero `innerHTML` with dynamic data across all files
- All user-facing text uses `textContent`
- All DOM structure uses `createElement` + `appendChild`

### 2.2 URL Validation
- `COMPARE_URL` (if kept) requires `https://` prefix
- No `javascript:`, `data:`, `file://`, `chrome://` URLs opened from messages

### 2.3 Permission Minimization
- Remove `activeTab` (redundant with host_permissions)
- `host_permissions`: `http://*/*` and `https://*/*` only
- No `<all_urls>`

### 2.4 Privacy
- Green hosting API results cached 24h — minimize hostname leakage
- No page text content collected
- Settings toggles (autoAnalyze, showBadge) actually enforced

## 3. Acceptance Criteria

See Phase 1 (AC-P1-012, AC-P1-013) and Phase 2 (AC-P2-001 through AC-P2-010).

## 4. Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-16 | Initial spec | Security audit findings from VALIDATION_REPORT.md |
