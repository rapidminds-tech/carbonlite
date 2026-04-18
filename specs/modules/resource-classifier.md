# Resource Classifier Specification

## Status: APPROVED

## Source Files
- `background.js` — `classifyResource()` function

## Test Files
- `tests/test_resource_classifier.js` — AC-P1-005, AC-P1-006, AC-P1-007

## Phase: 1

---

## 1. Purpose

Classify a web resource into one of 6 types (image, script, style, font, media, other) based on available metadata. Used for the resource breakdown in the side panel.

## 2. Dependencies

None — pure classification function.

## 3. Interfaces

### 3.1 Public API

```javascript
classifyResource(entry) → string
// entry: PerformanceResourceTiming-like object with:
//   - name: string (URL)
//   - initiatorType: string ("img", "script", "link", "css", "font", etc.)
//   - contentType: string | undefined (MIME type if available)
//
// Returns: "image" | "script" | "style" | "font" | "media" | "other"
```

## 4. Behaviors

### 4.1 Classification Priority

1. **MIME content-type** (if available): match against known MIME patterns
2. **File extension** (from URL): match against known extensions
3. **initiatorType** fallback: map known initiator types to resource types
4. **Default**: "other"

### 4.2 MIME Mappings

| MIME Pattern | Type |
|-------------|------|
| `image/*` | image |
| `application/javascript`, `text/javascript` | script |
| `text/css` | style |
| `font/*`, `application/font-*`, `application/x-font-*` | font |
| `video/*`, `audio/*` | media |

### 4.3 Extension Mappings

| Extensions | Type |
|-----------|------|
| `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`, `.webp`, `.avif`, `.ico`, `.bmp` | image |
| `.js`, `.mjs`, `.cjs` | script |
| `.css` | style |
| `.woff`, `.woff2`, `.ttf`, `.otf`, `.eot` | font |
| `.mp4`, `.webm`, `.ogg`, `.mp3`, `.wav`, `.flac` | media |

### 4.4 initiatorType Fallback

| initiatorType | Type |
|--------------|------|
| `img` | image |
| `script` | script |
| `link` (with `.css` or stylesheet context) | style |
| `css` | style |

### 4.5 Edge Cases
- URL with query strings: extract extension before `?`
- URL with no extension (CDN): use content-type or default to "other"
- `data:` URLs: parse MIME from data URL prefix
- Empty/null entry: return "other"

## 5. Acceptance Criteria

See Phase 1: AC-P1-005, AC-P1-006, AC-P1-007.

## 6. Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-16 | Initial spec | Fix P0 classification bug |
