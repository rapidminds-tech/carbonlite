/**
 * Carbonlite — Side Panel Breakdown & Toasts
 * renderThirdParty, renderVisitComparison, renderFixes,
 * checkForImprovement, showToast, checkRegression.
 * AC-P1-011: Zero innerHTML — all DOM built with createElement + textContent.
 */

// ── Proportional Treemap ───────────────────────────
function renderTreemap(data) {
  const container = $("treemap");
  clearChildren(container);

  const types = [
    { key: "images", label: "Images" },
    { key: "javascript", label: "JS" },
    { key: "css", label: "CSS" },
    { key: "fonts", label: "Fonts" },
    { key: "html", label: "HTML" },
    { key: "other", label: "Other" },
  ];

  const total = data.totalBytes || 1;
  const items = types
    .map((t) => {
      const bytes = data.byType[t.key]?.bytes || 0;
      const co2 = data.co2 * (bytes / total);
      return { ...t, bytes, co2, ratio: bytes / total };
    })
    .filter((t) => t.bytes > 0)
    .sort((a, b) => b.bytes - a.bytes);

  if (items.length === 0) return;

  const containerH = 140;
  const containerW = container.offsetWidth || 260;

  function makeCell(item, x, y, w, h) {
    const cell = el("div", {
      className: `treemap-cell ${item.key}`,
      style: {
        left: `${x}px`, top: `${y}px`,
        width: `${w}px`, height: `${h}px`,
      },
    }, [
      el("span", { className: "treemap-type", textContent: item.label }),
      el("span", { className: "treemap-value", textContent: CO2.formatCO2(item.co2) }),
    ]);
    container.appendChild(cell);
  }

  function layoutRow(rowItems, x, y, w, h, vertical) {
    const totalRatio = rowItems.reduce((s, i) => s + i.ratio, 0) || 1;
    let offset = 0;
    for (const item of rowItems) {
      const fraction = item.ratio / totalRatio;
      if (vertical) {
        const cellH = h * fraction;
        makeCell(item, x, y + offset, w, cellH);
        offset += cellH;
      } else {
        const cellW = w * fraction;
        makeCell(item, x + offset, y, cellW, h);
        offset += cellW;
      }
    }
  }

  if (items.length <= 2) {
    layoutRow(items, 0, 0, containerW, containerH, false);
  } else {
    const mainItem = items[0];
    const rest = items.slice(1);
    const mainW = containerW * Math.max(mainItem.ratio, 0.35);
    makeCell(mainItem, 0, 0, mainW, containerH);
    layoutRow(rest, mainW + 2, 0, containerW - mainW - 2, containerH, true);
  }
}

function renderThirdParty(data) {
  const container = $("thirdPartyInfo");
  clearChildren(container);

  if (data.thirdParty.count === 0) {
    container.appendChild(el("p", {
      style: { fontSize: "12px", color: "var(--accent)" },
      textContent: "No third-party scripts detected.",
    }));
    return;
  }

  const pct = Math.round((data.thirdParty.bytes / (data.totalBytes || 1)) * 100);

  const summary = el("div", { className: "third-party-summary" });
  summary.appendChild(document.createTextNode("Third-party resources = "));
  summary.appendChild(el("strong", { textContent: `${pct}%` }));
  summary.appendChild(document.createTextNode(` of page weight (${CO2.formatBytes(data.thirdParty.bytes)})`));
  container.appendChild(summary);

  const scripts = data.thirdParty.scripts.sort((a, b) => b.size - a.size).slice(0, 6);

  for (const script of scripts) {
    let hostname;
    try { hostname = new URL(script.url).hostname; } catch { hostname = "unknown"; }
    container.appendChild(el("div", { className: "third-party-item" }, [
      el("span", { className: "third-party-host", textContent: hostname }),
      el("span", { className: "third-party-size", textContent: CO2.formatBytes(script.size) }),
    ]));
  }

  if (data.thirdParty.scripts.length > 0) {
    container.appendChild(el("div", {
      className: "third-party-tip",
      textContent: "Consider self-hosting critical scripts and lazy-loading non-essential ones.",
    }));
  }
}

function renderVisitComparison(data) {
  const container = $("visitComparison");
  clearChildren(container);

  const savings = data.firstVisitCO2 > 0
    ? Math.round(((data.firstVisitCO2 - data.returnVisitCO2) / data.firstVisitCO2) * 100)
    : 0;

  container.appendChild(el("div", { className: "visit-row" }, [
    el("span", { className: "visit-label", textContent: "First visit:" }),
    el("span", { className: "visit-value", textContent: `${CO2.formatCO2(data.firstVisitCO2)} CO2` }),
  ]));
  container.appendChild(el("div", { className: "visit-row" }, [
    el("span", { className: "visit-label", textContent: "Return visit:" }),
    el("span", { className: "visit-value", textContent: `${CO2.formatCO2(data.returnVisitCO2)} CO2` }),
  ]));
  container.appendChild(el("div", { className: "visit-savings" }, [
    el("div", { className: "visit-savings-value", textContent: `-${savings}%` }),
    el("div", { className: "visit-savings-label", textContent: "Cache savings for returning visitors" }),
  ]));
}

function renderFixes(data) {
  const header = $("fixesHeader");
  const list = $("fixesList");
  clearChildren(header);
  clearChildren(list);

  const recs = data.recommendations;

  if (recs.length === 0) {
    list.appendChild(el("div", { className: "no-fixes" }, [
      el("div", { className: "no-fixes-icon", textContent: "\uD83C\uDF89" }),
      el("div", { className: "no-fixes-title", textContent: "Looking great!" }),
      el("div", { className: "no-fixes-text", textContent: "No significant optimizations found for this page." }),
    ]));
    return;
  }

  const totalSavingsPercent = recs.reduce((sum, r) => sum + r.savingsPercent, 0);

  header.appendChild(el("div", {
    className: "fixes-summary",
    textContent: `\uD83D\uDD27 ${recs.length} way${recs.length > 1 ? "s" : ""} to reduce carbon`,
  }));
  header.appendChild(el("div", {
    className: "fixes-potential",
    textContent: `Potential savings: up to -${Math.min(totalSavingsPercent, 80)}%`,
  }));

  for (const rec of recs) {
    const card = el("div", { className: "fix-card" });
    if (rec.id) card.dataset.recId = rec.id;

    // Header row
    const cardHeader = el("div", { className: "fix-card-header" }, [
      el("span", { className: `fix-impact ${rec.impact}`, textContent: rec.impact }),
      el("span", { className: "fix-title", textContent: rec.title }),
      el("span", {
        className: "fix-savings-badge",
        textContent: rec.savingsPercent > 0 ? `-${rec.savingsPercent}%` : "",
      }),
      el("span", { className: "fix-chevron", textContent: "\u25B6" }),
    ]);

    // Details section
    const details = el("div", { className: "fix-details" });
    details.appendChild(el("div", {
      className: "fix-co2",
      textContent: `Save ~${CO2.formatCO2(Math.abs(rec.co2Saved))} CO2 per visit`,
    }));

    if (rec.details && rec.details.length > 0) {
      for (const d of rec.details) {
        const item = el("div", { className: "fix-item" }, [
          el("div", { className: "fix-item-name", textContent: d.filename }),
          el("div", { className: "fix-item-meta" }, [
            ...(d.size ? [el("div", { className: "fix-item-size", textContent: CO2.formatBytes(d.size) })] : []),
            el("div", { className: "fix-item-suggestion", textContent: d.suggestion }),
          ]),
        ]);
        details.appendChild(item);
      }
    }

    const copyBtn = el("button", {
      className: "fix-copy-btn",
      textContent: "\uD83D\uDCCB Copy optimization checklist",
    });
    copyBtn.dataset.copy = rec.copyText || "";
    // AC-P13-013: setTimeout instead of rAF counting loop
    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const text = e.currentTarget.dataset.copy;
      const btn = e.currentTarget;
      navigator.clipboard.writeText(text).then(() => {
        btn.classList.add("copied");
        btn.textContent = "Copied!";
        setTimeout(() => {
          btn.classList.remove("copied");
          btn.textContent = "\uD83D\uDCCB Copy optimization checklist";
        }, 2000);
      });
    });
    details.appendChild(copyBtn);

    cardHeader.addEventListener("click", () => {
      card.classList.toggle("expanded");
    });

    card.appendChild(cardHeader);
    card.appendChild(details);
    list.appendChild(card);
  }
}

// ── Toasts ─────────────────────────────────────────
function checkForImprovement(newData) {
  if (!previousResult || !newData) return;
  try {
    if (new URL(previousResult.url).hostname !== new URL(newData.url).hostname) return;
  } catch { return; }

  if (newData.co2 < previousResult.co2) {
    const savedPercent = Math.round(((previousResult.co2 - newData.co2) / previousResult.co2) * 100);
    if (savedPercent >= 3) {
      showToast("improvementToast", `${previousResult.grade.grade} \u2192 ${newData.grade.grade} \u00B7 Saved ${savedPercent}%`);
    }
  }
}

// AC-P13-013: CSS animation + animationend instead of rAF counting loop
function showToast(toastId, detail) {
  const toast = $(toastId);
  const detailEl = toast.querySelector(".toast-detail");
  if (detailEl) detailEl.textContent = detail;
  toast.classList.remove("hidden");
  toast.classList.remove("toast-fade");
  void toast.offsetWidth; // force reflow to restart animation
  toast.classList.add("toast-fade");
  toast.addEventListener("animationend", () => {
    toast.classList.add("hidden");
    toast.classList.remove("toast-fade");
  }, { once: true });
}

function checkRegression(data) {
  if (data.regression) {
    showToast("regressionToast", `${data.regression.increasePercent}% heavier than last week (was ${CO2.formatCO2(data.regression.oldAvg)})`);
  }
}
