/**
 * CO2 Calculation Engine for Carbonlite
 * Based on the Sustainable Web Design Model (SWDM v4)
 * Reference: https://sustainablewebdesign.org/estimating-digital-emissions/
 */

const CO2 = (() => {
  // SWDM v4 system segment energy intensities (kWh/GB)
  const ENERGY_PER_GB = {
    dataCenter: 0.055,
    network: 0.059,
    device: 0.080,
  };

  // Total energy per GB (sum of all segments)
  const TOTAL_ENERGY_PER_GB =
    ENERGY_PER_GB.dataCenter + ENERGY_PER_GB.network + ENERGY_PER_GB.device; // ~0.194 kWh/GB

  // Global average grid carbon intensity (gCO2e/kWh) — Ember 2023 data
  const GLOBAL_GRID_INTENSITY = 480;

  // Green hosting carbon intensity (renewable energy, gCO2e/kWh)
  const GREEN_GRID_INTENSITY = 50;

  // Embodied carbon ratio — SWDM v4 accounts for hardware manufacturing
  // Adds ~15-20% on top of operational emissions
  const EMBODIED_RATIO = 0.16;

  // Returning visitor data transfer reduction (browser caching)
  const RETURNING_VISITOR_RATIO = 0.02; // 2% of data re-transferred
  const FIRST_VISIT_WEIGHT = 0.75;
  const RETURN_VISIT_WEIGHT = 0.25;

  /**
   * Calculate CO2 emissions for a given number of bytes
   * @param {number} bytes - Total bytes transferred
   * @param {object} options
   * @param {boolean} options.greenHosting - Whether the site uses green hosting
   * @param {number} options.gridIntensity - Custom grid intensity (gCO2e/kWh)
   * @param {boolean} options.firstVisit - Calculate for first visit only (no caching factor)
   * @returns {object} - { co2: grams, details: {...} }
   */
  function calculate(bytes, options = {}) {
    const {
      greenHosting = false,
      gridIntensity = GLOBAL_GRID_INTENSITY,
      firstVisit = true,
    } = options;

    const gigabytes = bytes / 1_000_000_000;

    // Energy per segment
    const dataCenterEnergy = gigabytes * ENERGY_PER_GB.dataCenter;
    const networkEnergy = gigabytes * ENERGY_PER_GB.network;
    const deviceEnergy = gigabytes * ENERGY_PER_GB.device;

    // Carbon intensity for data center (green vs standard)
    const dcIntensity = greenHosting ? GREEN_GRID_INTENSITY : gridIntensity;

    // CO2 per segment
    const dataCenterCO2 = dataCenterEnergy * dcIntensity;
    const networkCO2 = networkEnergy * gridIntensity;
    const deviceCO2 = deviceEnergy * gridIntensity;

    // Operational emissions for first visit
    const operationalCO2 = dataCenterCO2 + networkCO2 + deviceCO2;

    // Add embodied carbon (hardware manufacturing) per SWDM v4
    const firstVisitCO2 = operationalCO2 * (1 + EMBODIED_RATIO);

    // Return visit (only transfers ~2% of data)
    const returnVisitCO2 = firstVisitCO2 * RETURNING_VISITOR_RATIO;

    // Weighted average (75% first, 25% return)
    const weightedCO2 = firstVisit
      ? firstVisitCO2
      : firstVisitCO2 * FIRST_VISIT_WEIGHT +
        returnVisitCO2 * RETURN_VISIT_WEIGHT;

    return {
      co2: weightedCO2, // grams of CO2
      firstVisitCO2,
      returnVisitCO2,
      details: {
        bytes,
        gigabytes,
        dataCenterCO2,
        networkCO2,
        deviceCO2,
        greenHosting,
        gridIntensity: dcIntensity,
      },
    };
  }

  /**
   * Get letter grade from CO2 grams
   * Uses GRADE_THRESHOLDS and BADGE_COLORS from libs/constants.js (AC-P8-007)
   * Calibrated so HTTP Archive median page (~2.5MB ≈ 0.27g) = grade C (D-009)
   * @param {number} co2Grams
   * @returns {object} - { grade, label, color }
   */
  function getGrade(co2Grams) {
    const T = globalThis.GRADE_THRESHOLDS || { "A+": 0.095, A: 0.19, B: 0.25, C: 0.50, D: 0.80 };
    const C = globalThis.BADGE_COLORS || { "A+": "#16a34a", A: "#22c55e", B: "#86efac", C: "#fbbf24", D: "#fb923c", F: "#ef4444" };

    const grades = [
      { max: T["A+"], grade: "A+", label: "Exceptional", color: C["A+"] },
      { max: T["A"],  grade: "A",  label: "Excellent",   color: C["A"] },
      { max: T["B"],  grade: "B",  label: "Good",        color: C["B"] },
      { max: T["C"],  grade: "C",  label: "Average",     color: C["C"] },
      { max: T["D"],  grade: "D",  label: "Below Avg",   color: C["D"] },
      { max: Infinity, grade: "F", label: "Poor",        color: C["F"] },
    ];

    for (const g of grades) {
      if (co2Grams < g.max) return g;
    }
    return grades[grades.length - 1];
  }

  /**
   * Calculate percentile (what % of sites are worse)
   * Based on HTTP Archive median page size data
   * @param {number} co2Grams
   * @returns {number} percentile (0-100)
   */
  function getPercentile(co2Grams) {
    // Approximate distribution based on HTTP Archive data
    // Median page ~2.5MB → ~0.5g CO2
    const thresholds = [
      { co2: 0.05, percentile: 98 },
      { co2: 0.10, percentile: 95 },
      { co2: 0.20, percentile: 85 },
      { co2: 0.35, percentile: 70 },
      { co2: 0.50, percentile: 50 },
      { co2: 0.75, percentile: 35 },
      { co2: 1.00, percentile: 25 },
      { co2: 1.50, percentile: 10 },
      { co2: 3.00, percentile: 2 },
    ];

    for (let i = 0; i < thresholds.length; i++) {
      if (co2Grams <= thresholds[i].co2) {
        if (i === 0) return thresholds[i].percentile;
        const prev = thresholds[i - 1];
        const curr = thresholds[i];
        const ratio =
          (co2Grams - prev.co2) / (curr.co2 - prev.co2);
        return Math.round(
          prev.percentile - ratio * (prev.percentile - curr.percentile)
        );
      }
    }
    return 1;
  }

  /**
   * Format CO2 value for display
   * @param {number} co2Grams
   * @returns {string}
   */
  function formatCO2(co2Grams) {
    if (co2Grams < 0.01) return `${(co2Grams * 1000).toFixed(1)}mg`;
    if (co2Grams < 10) return `${co2Grams.toFixed(2)}g`;
    return `${co2Grams.toFixed(1)}g`;
  }

  /**
   * Format bytes for display
   * @param {number} bytes
   * @returns {string}
   */
  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return {
    calculate,
    getGrade,
    getPercentile,
    formatCO2,
    formatBytes,
    GLOBAL_GRID_INTENSITY,
    GREEN_GRID_INTENSITY,
  };
})();

// Export for service worker and side panel
if (typeof globalThis !== "undefined") {
  globalThis.CO2 = CO2;
}
