/**
 * Carbonlite — Side Panel Render Functions
 * renderScore, renderSparkline, renderResourceBars, renderHosting,
 * renderBenchmark, renderQuickRecs, renderTrend, drawTrendChart.
 * AC-P8-008: Canvas DPR cached once on init — not recalculated per render call.
 */
const cachedDPR = window.devicePixelRatio || 1; // AC-P8-008: cached DPR
let lastSparklineHostname = null; // AC-P13-012: skip redundant sparkline redraws

function renderScore(data) {
  const gaugeFill = $("gaugeFill");
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (circumference * data.percentile / 100);
  gaugeFill.style.strokeDasharray = circumference;
  gaugeFill.style.strokeDashoffset = circumference;
  gaugeFill.style.stroke = data.grade.color;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { gaugeFill.style.strokeDashoffset = offset; });
  });
  $("gradeLabel").textContent = data.grade.grade;
  $("co2Label").textContent = `${CO2.formatCO2(data.co2)} CO2 / visit`;
  const fill = $("percentileFill");
  fill.style.width = `${data.percentile}%`;
  fill.style.backgroundColor = data.grade.color;
  $("percentileLabel").textContent = `Cleaner than ${data.percentile}% of sites`;
  const warning = $("budgetWarning");
  if (data.budgetExceeded) {
    warning.textContent = `Exceeds your ${data.carbonBudget}g carbon budget`;
    warning.classList.remove("hidden");
  } else {
    warning.classList.add("hidden");
  }
}

function renderSparkline(data) {
  const canvas = $("sparkline");
  if (!canvas) return;
  try {
    const hostname = new URL(data.url).hostname;
    // AC-P13-012: Skip redraw if hostname unchanged
    if (hostname === lastSparklineHostname) return;
    lastSparklineHostname = hostname;
    chrome.runtime.sendMessage({ type: "GET_HISTORY", hostname }, (history) => {
      if (!history || history.length < 2) {
        canvas.style.display = "none";
        const srText = $("sparklineSrText"); // AC-P9-008: show message when not enough data
        if (srText) srText.textContent = "Visit this site again to see trends";
        return;
      }
      canvas.style.display = "inline-block";
      const ctx = canvas.getContext("2d");
      canvas.width = 60 * cachedDPR;
      canvas.height = 20 * cachedDPR;
      ctx.scale(cachedDPR, cachedDPR);
      ctx.clearRect(0, 0, 60, 20);
      const values = history.slice(-7).map((h) => h.co2);
      const max = Math.max(...values) * 1.2 || 1;
      const min = Math.min(...values) * 0.8;
      const trending = values[values.length - 1] < values[0];
      ctx.strokeStyle = trending ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i < values.length; i++) {
        const x = (60 / (values.length - 1)) * i;
        const y = 18 - ((values[i] - min) / (max - min)) * 16;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  } catch { canvas.style.display = "none"; }
}

function renderResourceBars(data) {
  const container = $("resourceBars");
  clearChildren(container);
  const types = [
    { key: "images", label: "Images" }, { key: "javascript", label: "JavaScript" },
    { key: "css", label: "CSS" }, { key: "fonts", label: "Fonts" },
    { key: "html", label: "HTML" }, { key: "other", label: "Other" },
  ];
  const maxBytes = Math.max(...types.map((t) => data.byType[t.key]?.bytes || 0), 1);
  for (const type of types) {
    const bytes = data.byType[type.key]?.bytes || 0;
    if (bytes === 0) continue;
    const row = el("div", { className: "resource-bar-row" }, [
      el("span", { className: "resource-bar-label", textContent: type.label }),
      el("div", { className: "resource-bar-track" }, [
        el("div", {
          className: `resource-bar-fill ${type.key}`,
          style: { width: `${(bytes / maxBytes) * 100}%` },
        }),
      ]),
      el("span", { className: "resource-bar-size", textContent: CO2.formatBytes(bytes) }),
    ]);
    container.appendChild(row);
  }
  $("totalSize").textContent = CO2.formatBytes(data.totalBytes);
  $("totalRequests").textContent = `${data.requestCount} requests`;
}

function renderHosting(data) {
  const status = $("hostingStatus");
  const detail = $("hostingDetail");
  clearChildren(status);
  clearChildren(detail);

  const greenTip = "Verified by the Green Web Foundation \u2014 this host runs on renewable energy.";
  const notGreenTip = "This host is not in the Green Web Foundation\u2019s renewable energy database. Switching to a green host reduces data center carbon intensity.";
  const unknownTip = "Could not check hosting status. The Green Web Foundation API may be unavailable.";

  if (data.greenHosting === true) {
    status.appendChild(el("span", { className: "icon", textContent: "\u2705" }));
    status.appendChild(document.createTextNode(" Green hosted"));
    detail.appendChild(el("div", { className: "hosting-tip", textContent: greenTip }));
  } else if (data.greenHosting === false) {
    status.appendChild(el("span", { className: "icon", textContent: "\u26A0\uFE0F" }));
    status.appendChild(document.createTextNode(" Not green hosted"));
    detail.appendChild(el("div", { className: "hosting-tip", textContent: notGreenTip }));
  } else {
    status.appendChild(el("span", { className: "icon", textContent: "\u2753" }));
    status.appendChild(document.createTextNode(" Hosting status unknown"));
    detail.appendChild(el("div", { className: "hosting-tip", textContent: unknownTip }));
  }

  if (data.hostingProvider) {
    detail.appendChild(el("div", { className: "hosting-provider", textContent: `Provider: ${data.hostingProvider}` }));
  }
}

function renderBenchmark(data) {
  const container = $("benchmarkComparison");
  const select = $("benchmarkSelect");
  const industry = select.value;
  const benchmark = BENCHMARKS[industry];
  if (!benchmark) return;
  clearChildren(container);
  const maxCO2 = Math.max(data.co2, benchmark.co2) * 1.2;
  const yourPct = (data.co2 / maxCO2) * 100;
  const benchPct = (benchmark.co2 / maxCO2) * 100;
  const delta = Math.round(((benchmark.co2 - data.co2) / benchmark.co2) * 100);
  const wrapper = el("div", { className: "benchmark-bar-wrapper" }, [
    el("div", { className: "benchmark-bar-row" }, [
      el("span", { className: "benchmark-bar-label", textContent: "Your site" }),
      el("div", { className: "benchmark-bar-track" }, [
        el("div", {
          className: "benchmark-bar-fill",
          style: { width: `${yourPct}%`, background: data.grade.color },
        }),
      ]),
      el("span", { className: "benchmark-bar-value", textContent: CO2.formatCO2(data.co2) }),
    ]),
    el("div", { className: "benchmark-bar-row" }, [
      el("span", { className: "benchmark-bar-label", textContent: benchmark.label }),
      el("div", { className: "benchmark-bar-track" }, [
        el("div", {
          className: "benchmark-bar-fill",
          style: { width: `${benchPct}%`, background: "#94a3b8" },
        }),
      ]),
      el("span", { className: "benchmark-bar-value", textContent: CO2.formatCO2(benchmark.co2) }),
    ]),
  ]);
  const deltaText = delta > 0
    ? `${delta}% cleaner than ${benchmark.label}`
    : `${Math.abs(delta)}% heavier than ${benchmark.label}`;
  container.appendChild(wrapper);
  container.appendChild(el("div", {
    className: `benchmark-delta ${delta > 0 ? "better" : "worse"}`,
    textContent: deltaText,
  }));
}

// AC-P4-010: Quick-rec click scrolls to matching fix card in fixes tab
function renderQuickRecs(data) {
  const container = $("quickRecs");
  clearChildren(container);
  $("recsCount").textContent = data.recommendations.length;
  if (data.recommendations.length === 0) {
    container.appendChild(el("div", {
      style: { textAlign: "center", padding: "8px", color: "var(--accent)", fontSize: "12px" },
      textContent: "No issues found \u2014 great job!",
    }));
    return;
  }
  for (const rec of data.recommendations.slice(0, 4)) {
    const item = el("div", { className: "quick-rec" }, [
      el("div", { className: `rec-dot ${rec.impact}` }),
      el("span", { className: "rec-title", textContent: rec.title }),
      el("span", {
        className: "rec-savings",
        textContent: rec.savingsPercent > 0 ? `-${rec.savingsPercent}%` : "",
      }),
    ]);
    item.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
      const fixesTab = document.querySelector('[data-tab="fixes"]');
      fixesTab.classList.add("active");
      fixesTab.setAttribute("aria-selected", "true");
      $("tab-fixes").classList.add("active");
      // Scroll to matching fix card (AC-P4-010)
      if (rec.id) {
        const fixCards = $("fixesList").querySelectorAll(".fix-card");
        for (const card of fixCards) {
          const titleEl = card.querySelector(".fix-title");
          if (titleEl && titleEl.textContent === rec.title) {
            card.scrollIntoView({ behavior: "smooth", block: "center" });
            card.classList.add("expanded");
            break;
          }
        }
      }
    });
    container.appendChild(item);
  }
}

function renderTrend(data) {
  const canvas = $("trendChart");
  const trendEmpty = $("trendEmpty");
  try {
    const hostname = new URL(data.url).hostname;
    chrome.runtime.sendMessage({ type: "GET_HISTORY", hostname }, (history) => {
      if (!history || history.length < 2) {
        canvas.classList.add("hidden");
        trendEmpty.classList.remove("hidden");
        return;
      }
      canvas.classList.remove("hidden");
      trendEmpty.classList.add("hidden");
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recent = history.filter((h) => h.timestamp > sevenDaysAgo);
      if (recent.length < 2) {
        canvas.classList.add("hidden");
        trendEmpty.classList.remove("hidden");
        return;
      }
      drawTrendChart(canvas, recent);
    });
  } catch {
    canvas.classList.add("hidden");
    trendEmpty.classList.remove("hidden");
  }
}

function drawTrendChart(canvas, data) {
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * cachedDPR;
  canvas.height = rect.height * cachedDPR;
  ctx.scale(cachedDPR, cachedDPR);
  const w = rect.width, h = rect.height;
  const pad = { top: 10, right: 10, bottom: 20, left: 30 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  ctx.clearRect(0, 0, w, h);
  const values = data.map((d) => d.co2);
  const maxVal = Math.max(...values) * 1.2;
  const gridColor = getCSSVar("--border-subtle") || "#f5f5f4";
  const labelColor = getCSSVar("--text-muted") || "#a8a29e";
  const lineColor = getCSSVar("--accent-light") || "#22c55e";
  // Grid lines and labels
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = pad.top + (chartH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = labelColor;
    ctx.font = "9px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${(maxVal - (maxVal / 3) * i).toFixed(1)}g`, pad.left - 4, y + 3);
  }
  // Data line
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const x = pad.left + (chartW / (data.length - 1)) * i;
    const y = pad.top + chartH - (data[i].co2 / maxVal) * chartH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Data points
  for (let i = 0; i < data.length; i++) {
    const x = pad.left + (chartW / (data.length - 1)) * i;
    const y = pad.top + chartH - (data[i].co2 / maxVal) * chartH;
    ctx.fillStyle = getCSSVar("--bg-card") || "white";
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = lineColor;
    ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
  }
}
