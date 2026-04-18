/**
 * Industry benchmark data for carbon comparison
 * AC-P3-007: Each benchmark includes source citation.
 */
const BENCHMARKS = {
  average:    { co2: 0.60, bytes: 3000000, label: "Global Average",       source: "HTTP Archive, 2024 annual report" },
  ecommerce:  { co2: 0.85, bytes: 4200000, label: "E-commerce",           source: "HTTP Archive, 2024 e-commerce crawl" },
  blog:       { co2: 0.42, bytes: 2100000, label: "Blog / Content",       source: "HTTP Archive, 2024 content sites" },
  saas:       { co2: 0.55, bytes: 2800000, label: "SaaS Dashboard",       source: "Estimated from industry data, 2024" },
  news:       { co2: 1.20, bytes: 6000000, label: "News / Media",         source: "HTTP Archive, 2024 news crawl" },
  portfolio:  { co2: 0.35, bytes: 1800000, label: "Portfolio / Landing",   source: "Estimated from industry data, 2024" },
  government: { co2: 0.65, bytes: 3200000, label: "Government",           source: "HTTP Archive, 2024 government sites" },
};

if (typeof globalThis !== "undefined") {
  globalThis.BENCHMARKS = BENCHMARKS;
}
