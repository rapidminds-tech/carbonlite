/**
 * Resource type classification for Carbonlite
 *
 * Priority: MIME content-type > file extension > initiatorType fallback
 * Handles both MIME strings ("image/png") and initiatorType strings ("img").
 */

// MIME type prefix → resource category
const MIME_MAP = {
  "image/": "images",
  "text/javascript": "javascript",
  "application/javascript": "javascript",
  "application/x-javascript": "javascript",
  "text/css": "css",
  "text/html": "html",
  "application/xhtml": "html",
  "font/": "fonts",
  "application/font": "fonts",
  "application/x-font": "fonts",
};

// File extension → resource category
const EXT_MAP = {
  png: "images", jpg: "images", jpeg: "images", gif: "images",
  webp: "images", avif: "images", svg: "images", ico: "images",
  js: "javascript", mjs: "javascript",
  css: "css",
  woff: "fonts", woff2: "fonts", ttf: "fonts", otf: "fonts", eot: "fonts",
  html: "html", htm: "html",
};

// initiatorType → resource category (lowest priority fallback)
const INITIATOR_MAP = {
  img: "images",
  image: "images",
  script: "javascript",
  css: "css",
  link: "css",
};

/**
 * Detect if a typeHint looks like a MIME content-type (contains "/")
 */
function isMimeType(typeHint) {
  return typeof typeHint === "string" && typeHint.includes("/");
}

/**
 * Classify a resource by MIME type
 * @returns {string|null} category or null if no match
 */
function classifyByMime(mimeType) {
  const lower = mimeType.toLowerCase().split(";")[0].trim();
  for (const [prefix, category] of Object.entries(MIME_MAP)) {
    if (lower === prefix || lower.startsWith(prefix)) {
      return category;
    }
  }
  return null;
}

/**
 * Classify a resource by file extension
 * @returns {string|null} category or null if no match
 */
function classifyByExtension(url) {
  try {
    const pathname = url.split("?")[0].split("#")[0];
    const lastSegment = pathname.split("/").pop();
    if (!lastSegment || !lastSegment.includes(".")) return null;
    const ext = lastSegment.split(".").pop().toLowerCase();
    return EXT_MAP[ext] || null;
  } catch {
    return null;
  }
}

/**
 * Classify a resource by initiatorType
 * @returns {string|null} category or null if no match
 */
function classifyByInitiatorType(initiatorType) {
  const lower = (initiatorType || "").toLowerCase();
  return INITIATOR_MAP[lower] || null;
}

/**
 * Classify a resource URL + type hint into a category.
 * Priority: MIME content-type > file extension > initiatorType fallback > "other"
 *
 * @param {string} url - The resource URL
 * @param {string} [typeHint=""] - Either a MIME content-type or initiatorType
 * @returns {string} One of: "images", "javascript", "css", "fonts", "html", "other"
 */
function classifyResource(url, typeHint = "") {
  // 1. If typeHint looks like a MIME type, try MIME classification first
  if (isMimeType(typeHint)) {
    const byMime = classifyByMime(typeHint);
    if (byMime) return byMime;
  }

  // 2. Try file extension
  const byExt = classifyByExtension(url);
  if (byExt) return byExt;

  // 3. Fall back to initiatorType (only if typeHint is NOT a MIME — it's an initiatorType)
  if (!isMimeType(typeHint)) {
    const byInitiator = classifyByInitiatorType(typeHint);
    if (byInitiator) return byInitiator;
  }

  // 4. Nothing matched
  return "other";
}

// AC-P13-011: Known multi-part TLDs for accurate third-party detection
const MULTI_PART_TLDS = new Set([
  "co.uk", "co.nz", "co.jp", "co.kr", "co.in", "co.za", "co.id",
  "com.au", "com.br", "com.cn", "com.mx", "com.sg", "com.tw", "com.ar",
  "org.uk", "net.au", "ac.uk", "gov.uk", "ne.jp", "or.jp",
]);

function getRootDomain(h) {
  const parts = h.replace(/^www\./, "").split(".");
  if (parts.length > 2) {
    const lastTwo = parts.slice(-2).join(".");
    if (MULTI_PART_TLDS.has(lastTwo)) {
      return parts.slice(-3).join(".");
    }
    return parts.slice(-2).join(".");
  }
  return h.replace(/^www\./, "");
}

function isThirdParty(resourceUrl, pageUrl) {
  try {
    const resourceHost = new URL(resourceUrl).hostname;
    const pageHost = new URL(pageUrl).hostname;
    return getRootDomain(resourceHost) !== getRootDomain(pageHost);
  } catch {
    return false;
  }
}

// Export for Chrome extension and Node/test (both use globalThis)
if (typeof globalThis !== "undefined") {
  globalThis.classifyResource = classifyResource;
  globalThis.isThirdParty = isThirdParty;
  globalThis.getRootDomain = getRootDomain;
}
