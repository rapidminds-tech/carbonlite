/**
 * Recommendations engine for Carbonlite
 * Extracted from background.js (AC-P8-001)
 *
 * Uses OPTIMIZATION_FACTORS from libs/constants.js for savings estimates (AC-P8-005).
 */

function getSuggestionForImage(resource) {
  const ext = resource.url.split("?")[0].split(".").pop().toLowerCase();
  if (ext === "png") return "Convert to WebP (lossless) or AVIF";
  if (["jpg", "jpeg"].includes(ext)) return resource.size > 100 * 1024 ? "Resize + compress (JPEG→WebP saves ~25-35%)" : "Compress further";
  if (ext === "gif") return "Convert to WebM video or animated WebP";
  if (ext === "svg") return "Optimize with SVGO";
  return "Compress and optimize";
}

function generateRecommendations(data, result) {
  const CO2 = globalThis.CO2;
  const F = globalThis.OPTIMIZATION_FACTORS || {
    imageCompression: 0.6,
    modernImageFormat: 0.5,
    fontOptimization: 0.5,
    thirdPartyReduction: 0.2,
  };
  const recs = [];

  // 1. Image optimization (compress large images)
  if (data.byType.images.bytes > 200 * 1024) {
    const savingsEstimate = Math.round(data.byType.images.bytes * F.imageCompression);
    const co2Saved = CO2.calculate(savingsEstimate).co2;
    const imageResources = data.resources
      .filter((r) => r.type === "images" && r.size > 10 * 1024)
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);

    if (imageResources.length > 0) {
      recs.push({
        id: "compress-images",
        impact: "high",
        title: `Compress ${imageResources.length} image${imageResources.length > 1 ? "s" : ""}`,
        savings: savingsEstimate,
        savingsPercent: Math.round((savingsEstimate / data.totalBytes) * 100),
        co2Saved,
        details: imageResources.map((r) => ({
          url: r.url,
          filename: r.url.split("/").pop().split("?")[0] || "image",
          size: r.size,
          suggestion: getSuggestionForImage(r),
        })),
        copyText: imageResources
          .map((r) => `- [ ] ${r.url.split("/").pop().split("?")[0] || "image"} (${CO2.formatBytes(r.size)}) → Compress`)
          .join("\n"),
      });
    }
  }

  // 2. Large render-blocking scripts (no false CO2 savings — defer only changes timing)
  const largeScripts = data.resources
    .filter((r) => r.type === "javascript" && r.size > 20 * 1024)
    .sort((a, b) => b.size - a.size);

  if (largeScripts.length > 0) {
    const deferrable = largeScripts.slice(0, 3);
    recs.push({
      id: "defer-scripts",
      impact: "medium",
      title: `Defer ${deferrable.length} large script${deferrable.length > 1 ? "s" : ""} for faster load`,
      savings: 0,
      savingsPercent: 0,
      co2Saved: 0,
      details: deferrable.map((r) => ({
        url: r.url,
        filename: r.url.split("/").pop().split("?")[0] || "script",
        size: r.size,
        suggestion: r.thirdParty
          ? "Lazy load on user interaction"
          : "Add defer/async — improves perceived load, not transfer size",
      })),
      copyText: deferrable
        .map((r) => `- [ ] ${r.url.split("/").pop().split("?")[0] || "script"} (${CO2.formatBytes(r.size)}) → Add defer`)
        .join("\n"),
    });
  }

  // 3. Third-party script bloat
  if (data.thirdParty.bytes > data.totalBytes * 0.3 && data.thirdParty.count > 2) {
    const co2Saved = CO2.calculate(Math.round(data.thirdParty.bytes * F.thirdPartyReduction)).co2;
    recs.push({
      id: "reduce-third-party",
      impact: data.thirdParty.bytes > data.totalBytes * 0.5 ? "high" : "medium",
      title: `Audit ${data.thirdParty.count} third-party scripts`,
      savings: Math.round(data.thirdParty.bytes * F.thirdPartyReduction),
      savingsPercent: Math.round(((data.thirdParty.bytes * F.thirdPartyReduction) / data.totalBytes) * 100),
      co2Saved,
      details: data.thirdParty.scripts
        .sort((a, b) => b.size - a.size)
        .slice(0, 5)
        .map((r) => {
          let hostname;
          try { hostname = new URL(r.url).hostname; } catch { hostname = "unknown"; }
          return {
            url: r.url,
            filename: hostname,
            size: r.size,
            suggestion: "Consider self-hosting or lazy loading",
          };
        }),
      copyText: `Third-party scripts: ${Math.round((data.thirdParty.bytes / data.totalBytes) * 100)}% of page weight`,
    });
  }

  // 4. Font optimization
  if (data.byType.fonts.bytes > 100 * 1024) {
    const co2Saved = CO2.calculate(Math.round(data.byType.fonts.bytes * F.fontOptimization)).co2;
    recs.push({
      id: "optimize-fonts",
      impact: "medium",
      title: "Optimize web fonts",
      savings: Math.round(data.byType.fonts.bytes * F.fontOptimization),
      savingsPercent: Math.round(((data.byType.fonts.bytes * F.fontOptimization) / data.totalBytes) * 100),
      co2Saved,
      details: data.resources
        .filter((r) => r.type === "fonts")
        .map((r) => ({
          url: r.url,
          filename: r.url.split("/").pop().split("?")[0] || "font",
          size: r.size,
          suggestion: "Use WOFF2, subset fonts, or system font stack",
        })),
      copyText: "- [ ] Convert to WOFF2\n- [ ] Subset to used characters\n- [ ] Consider system font stack\n- [ ] Add font-display: swap",
    });
  }

  // 5. Suboptimal image formats (PNG/JPG → WebP/AVIF)
  const suboptimalImages = data.resources.filter((r) => {
    const ext = r.url.split("?")[0].split(".").pop().toLowerCase();
    return ["png", "bmp"].includes(ext) && r.size > 20 * 1024;
  });
  if (suboptimalImages.length > 0) {
    const totalSuboptimal = suboptimalImages.reduce((s, r) => s + r.size, 0);
    const savingsEstimate = Math.round(totalSuboptimal * F.modernImageFormat);
    recs.push({
      id: "modern-image-formats",
      impact: suboptimalImages.length > 3 ? "high" : "medium",
      title: `Convert ${suboptimalImages.length} PNG(s) to WebP/AVIF`,
      savings: savingsEstimate,
      savingsPercent: Math.round((savingsEstimate / data.totalBytes) * 100),
      co2Saved: CO2.calculate(savingsEstimate).co2,
      details: suboptimalImages.slice(0, 5).map((r) => ({
        url: r.url,
        filename: r.url.split("/").pop().split("?")[0] || "image",
        size: r.size,
        suggestion: "Convert to WebP/AVIF (lossless PNG → WebP saves ~50%)",
      })),
      copyText: suboptimalImages.slice(0, 5)
        .map((r) => `- [ ] ${r.url.split("/").pop().split("?")[0] || "image"} (${CO2.formatBytes(r.size)}) → WebP`)
        .join("\n"),
    });
  }

  // 6. Lazy loading audit
  if (data.lazyLoadAudit && data.lazyLoadAudit.belowFoldWithoutLazy.length > 0) {
    const count = data.lazyLoadAudit.belowFoldWithoutLazy.length;
    recs.push({
      id: "lazy-load-images",
      impact: count > 5 ? "high" : "medium",
      title: `Add lazy loading to ${count} below-fold image(s)`,
      savings: 0,
      savingsPercent: 0,
      co2Saved: 0,
      details: data.lazyLoadAudit.belowFoldWithoutLazy.slice(0, 5).map((img) => ({
        url: img.src,
        filename: img.src.split("/").pop().split("?")[0] || "image",
        size: 0,
        suggestion: 'Add loading="lazy" attribute',
      })),
      copyText: `Add loading="lazy" to ${count} below-fold images`,
    });
  }

  // 7. Green hosting recommendation
  if (data.greenHosting === false) {
    recs.push({
      id: "green-hosting",
      impact: "medium",
      title: "Switch to green hosting",
      savings: 0,
      savingsPercent: 0,
      co2Saved: 0,
      details: [{
        url: "",
        filename: "Hosting provider",
        size: 0,
        suggestion: "Use a provider powered by renewable energy (Vercel, Cloudflare, GreenGeeks)",
      }],
      copyText: "Green hosting providers:\n- Vercel\n- Cloudflare Pages\n- GreenGeeks\n\nCheck: https://www.thegreenwebfoundation.org/green-web-check/",
    });
  }

  return recs.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return (impactOrder[a.impact] || 3) - (impactOrder[b.impact] || 3);
  });
}

if (typeof globalThis !== "undefined") {
  globalThis.generateRecommendations = generateRecommendations;
}

// AC-P13-001: Conditional CJS export (importScripts in SW is classic script context)
if (typeof module !== "undefined") {
  module.exports = { generateRecommendations, getSuggestionForImage };
}
