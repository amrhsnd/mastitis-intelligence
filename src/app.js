(function initApp() {
  "use strict";

  const Engine = window.MastitisKpiEngine;
  const Samples = window.DairySampleData;
  const storageKey = "mastitis-intelligence-state-v1";

  const translations = {
    en: {
      brandTagline: "Udder health command center",
      tabOverview: "Overview",
      tabCows: "Cow Risk",
      tabReport: "Report",
      tabMethodology: "Methodology",
      settings: "Settings",
      language: "Language",
      herdSize: "Lactating cows",
      sccCutoff: "SCC cutoff",
      coverageThreshold: "Coverage threshold",
      milkPrice: "Milk price",
      data: "Data",
      loadSample: "Sample",
      export: "Export",
      import: "Import",
      printPdf: "PDF",
      localOnly: "Data stays in this browser unless you export it.",
      pageTitle: "Mastitis control analytics",
      pageLede: "A rule-based scientific dashboard for SCC, clinical mastitis, dry period risk, milk quality, pathogen signals, and NMC seven-point execution.",
      overallScore: "Overall score",
      summaryTitle: "Current herd signal",
      trendTitle: "BTSCC and new infection trend",
      alertTitle: "Priority alerts",
      alertCaption: "Rules map KPI patterns to NMC action points.",
      pathogenTitle: "Pathogen signal",
      pathogenCaption: "Bulk culture patterns grouped by epidemiologic class.",
      nmcTitle: "NMC seven-point execution",
      nmcCaption: "Manual implementation score combined with KPI performance.",
      watchlistTitle: "Cow risk watchlist",
      watchlistCaption: "Persistent high SCC, high SCS, and production deviation are ranked for action.",
      cowId: "Cow",
      status: "Status",
      milkLoss: "Milk deviation",
      recommendedAction: "Action",
      reportTitle: "Monthly veterinary report",
      methodTitle: "Scientific method and schema",
      methodCaption: "Thresholds are configurable because local regulations, climate, herd size, breed, and lab practices matter.",
      good: "On target",
      watch: "Watch",
      critical: "Intervention",
      unknown: "Missing",
      coverageGood: "Coverage valid",
      coverageLow: "Data incomplete - limited validity",
      noAlerts: "No high-priority rule alerts in the current month.",
      noWatchlist: "No cow-level risk records above the current threshold.",
      sourceNote: "Decision support only. Final diagnosis and treatment decisions require a licensed veterinarian and validated laboratory workflow."
    },
    fa: {
      brandTagline: "مرکز فرماندهی سلامت پستان",
      tabOverview: "نمای کلی",
      tabCows: "ریسک گاوها",
      tabReport: "گزارش",
      tabMethodology: "روش علمی",
      settings: "تنظیمات",
      language: "زبان",
      herdSize: "گاو شیری",
      sccCutoff: "آستانه SCC",
      coverageThreshold: "حد پوشش داده",
      milkPrice: "قیمت شیر",
      data: "داده",
      loadSample: "نمونه",
      export: "خروجی",
      import: "ورودی",
      printPdf: "PDF",
      localOnly: "داده ها تا زمان خروجی گرفتن در همین مرورگر می ماند.",
      pageTitle: "تحلیل کنترل ورم پستان",
      pageLede: "داشبورد علمی rule-based برای SCC، ماستیت بالینی، ریسک دوره خشکی، کیفیت شیر، پاتوژن ها و اجرای برنامه هفت نقطه ای NMC.",
      overallScore: "امتیاز کلی",
      summaryTitle: "سیگنال فعلی گله",
      trendTitle: "روند BTSCC و عفونت جدید",
      alertTitle: "هشدارهای اولویت دار",
      alertCaption: "قواعد تحلیلی هر الگو را به نقاط اقدام NMC وصل می کنند.",
      pathogenTitle: "سیگنال پاتوژن",
      pathogenCaption: "الگوی کشت بالک بر اساس کلاس اپیدمیولوژیک.",
      nmcTitle: "اجرای برنامه هفت نقطه ای NMC",
      nmcCaption: "امتیاز دستی اجرا با عملکرد KPI ترکیب می شود.",
      watchlistTitle: "فهرست گاوهای پرریسک",
      watchlistCaption: "SCC مزمن، SCS بالا و افت تولید برای اقدام رتبه بندی می شوند.",
      cowId: "گاو",
      status: "وضعیت",
      milkLoss: "اختلاف تولید",
      recommendedAction: "اقدام",
      reportTitle: "گزارش ماهانه دامپزشکی",
      methodTitle: "روش علمی و ساختار داده",
      methodCaption: "آستانه ها قابل تنظیم هستند چون قوانین محلی، اقلیم، اندازه گله، نژاد و روش آزمایشگاه مهم اند.",
      good: "در هدف",
      watch: "نیازمند پایش",
      critical: "نیازمند مداخله",
      unknown: "داده ناکافی",
      coverageGood: "پوشش معتبر",
      coverageLow: "داده ناقص - اعتبار محدود",
      noAlerts: "در ماه جاری هشدار اولویت بالا وجود ندارد.",
      noWatchlist: "رکورد پرریسک بالاتر از آستانه فعلی وجود ندارد.",
      sourceNote: "این ابزار فقط پشتیبان تصمیم است. تشخیص نهایی و درمان باید با دامپزشک مجاز و آزمایشگاه معتبر انجام شود."
    }
  };

  const icons = {
    refresh: "M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0 0 12 3.5M19 9A7 7 0 0 0 7 5.5",
    download: "M12 3v12m0 0 5-5m-5 5-5-5M5 21h14",
    upload: "M12 21V9m0 0 5 5m-5-5-5 5M5 3h14",
    printer: "M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z",
    alert: "M12 9v4m0 4h.01M10.3 3.9 2 3.5 9.7 16.6A2 2 0 0 1 20 23H4a2 2 0 0 1-1.7-3.1z"
  };

  let state = loadState();
  let analysis = null;

  function t(key) {
    const lang = state.language || "en";
    return translations[lang][key] || translations.en[key] || key;
  }

  function icon(name) {
    const path = icons[name];
    if (!path) return "";
    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"></path></svg>`;
  }

  function loadState() {
    const fallback = {
      language: "en",
      data: Samples.createDemoData(),
      config: { ...Engine.DEFAULT_CONFIG }
    };
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (!stored || !stored.data || !stored.config) return fallback;
      return {
        language: stored.language || "en",
        data: stored.data,
        config: { ...Engine.DEFAULT_CONFIG, ...stored.config }
      };
    } catch (error) {
      return fallback;
    }
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function formatNumber(value, options = {}) {
    if (!Number.isFinite(value)) return "--";
    const locale = state.language === "fa" ? "fa-IR" : "en-US";
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: options.maximumFractionDigits ?? 0,
      minimumFractionDigits: options.minimumFractionDigits ?? 0
    }).format(value);
  }

  function formatMetric(kpi) {
    const value = formatNumber(kpi.value, {
      maximumFractionDigits: kpi.precision,
      minimumFractionDigits: kpi.precision
    });
    if (!kpi.unit) return value;
    return `${value} ${kpi.unit}`;
  }

  function statusLabel(status) {
    return t(status || "unknown");
  }

  function setLanguage() {
    document.documentElement.lang = state.language === "fa" ? "fa" : "en";
    document.documentElement.dir = state.language === "fa" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
  }

  function wireButtons() {
    document.querySelectorAll("[data-icon]").forEach((button) => {
      if (button.dataset.iconReady) return;
      button.insertAdjacentHTML("afterbegin", icon(button.dataset.icon));
      button.dataset.iconReady = "true";
    });
  }

  function syncControls() {
    document.getElementById("languageSelect").value = state.language;
    document.getElementById("herdSizeInput").value = state.config.herdSize;
    document.getElementById("sccCutoffInput").value = state.config.sccCutoff;
    document.getElementById("coverageInput").value = state.config.coverageThreshold;
    document.getElementById("coverageOutput").value = `${state.config.coverageThreshold}%`;
    document.getElementById("milkPriceInput").value = state.config.milkPrice;
  }

  function updateFromControls() {
    state.language = document.getElementById("languageSelect").value;
    state.config.herdSize = Number(document.getElementById("herdSizeInput").value) || Engine.DEFAULT_CONFIG.herdSize;
    state.config.sccCutoff = Number(document.getElementById("sccCutoffInput").value) || Engine.DEFAULT_CONFIG.sccCutoff;
    state.config.coverageThreshold = Number(document.getElementById("coverageInput").value) || Engine.DEFAULT_CONFIG.coverageThreshold;
    state.config.milkPrice = Number(document.getElementById("milkPriceInput").value) || Engine.DEFAULT_CONFIG.milkPrice;
    saveState();
    render();
  }

  function bindEvents() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".tab-button").forEach((item) => item.classList.remove("is-active"));
        document.querySelectorAll(".tab-panel").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        document.getElementById(button.dataset.tab).classList.add("is-active");
      });
    });
    ["languageSelect", "herdSizeInput", "sccCutoffInput", "coverageInput", "milkPriceInput"].forEach((id) => {
      document.getElementById(id).addEventListener("input", updateFromControls);
    });
    document.getElementById("sampleButton").addEventListener("click", () => {
      state.data = Samples.createDemoData();
      state.config = { ...Engine.DEFAULT_CONFIG, herdSize: state.data.herd.lactatingCows };
      saveState();
      render();
    });
    document.getElementById("exportButton").addEventListener("click", exportData);
    document.getElementById("importInput").addEventListener("change", importData);
    document.getElementById("printButton").addEventListener("click", () => window.print());
    document.getElementById("printReportButton").addEventListener("click", () => window.print());
  }

  function render() {
    analysis = Engine.calculateAnalysis(state.data, state.config);
    setLanguage();
    wireButtons();
    syncControls();
    renderTopbar();
    renderKpis();
    renderCharts();
    renderAlerts();
    renderNmcScores();
    renderWatchlist();
    renderReport();
    renderMethodology();
  }

  function scoreStatus(score) {
    if (score >= 80) return "good";
    if (score >= 60) return "watch";
    return "critical";
  }

  function renderTopbar() {
    const current = analysis.current;
    const month = current.month ? Engine.monthLabel(current.month) : "--";
    document.getElementById("freshnessLabel").textContent = `${state.data.herd.name || "Herd"} · ${month}`;
    document.getElementById("overallScore").textContent = analysis.overallScore;
    const status = scoreStatus(analysis.overallScore);
    document.getElementById("scoreStatus").textContent = statusLabel(status);
    document.getElementById("scoreStatus").className = `status-text ${status}`;
    document.getElementById("scoreRing").style.setProperty("--score", `${analysis.overallScore}%`);
    const coverageOk = !Number.isFinite(current.coverage) || current.coverage >= state.config.coverageThreshold;
    const coverageBadge = document.getElementById("coverageBadge");
    coverageBadge.textContent = coverageOk
      ? `${t("coverageGood")} · ${formatNumber(current.coverage, { maximumFractionDigits: 1 })}%`
      : `${t("coverageLow")} · ${formatNumber(current.coverage, { maximumFractionDigits: 1 })}%`;
    coverageBadge.className = `status-badge ${coverageOk ? "good" : "warning"}`;
    const btscc = formatNumber(current.btscc);
    const nir = formatNumber(current.nir, { maximumFractionDigits: 1 });
    const prevalence = formatNumber(current.prevalence, { maximumFractionDigits: 1 });
    document.getElementById("summaryText").textContent = state.language === "fa"
      ? `در ${month}، BTSCC برابر ${btscc} سلول/ml، شیوع زیربالینی ${prevalence}% و NIR برابر ${nir}% است.`
      : `For ${month}, BTSCC is ${btscc} cells/ml, subclinical prevalence is ${prevalence}%, and NIR is ${nir}%.`;
  }

  function renderKpis() {
    const grid = document.getElementById("kpiGrid");
    grid.innerHTML = analysis.kpis.map((kpi) => {
      const label = state.language === "fa" ? kpi.faLabel : kpi.label;
      return `
        <article class="kpi-card ${kpi.status}">
          <div class="kpi-topline">
            <h3>${label}</h3>
            <span class="pill ${kpi.status}">${statusLabel(kpi.status)}</span>
          </div>
          <strong>${formatMetric(kpi)}</strong>
          <p>${kpi.interpretation}</p>
          <div class="kpi-foot">
            <span>Target ${kpi.target}</span>
            <span>${kpi.nmcPoints.map((point) => `NMC ${point}`).join(" · ")}</span>
          </div>
        </article>
      `;
    }).join("");
  }

  function linePath(points, xScale, yScale) {
    return points.map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${xScale(point.x).toFixed(1)},${yScale(point.y).toFixed(1)}`;
    }).join(" ");
  }

  function renderLineChart(container, series) {
    const width = 760;
    const height = 320;
    const margin = { top: 26, right: 28, bottom: 46, left: 64 };
    const allPoints = series.flatMap((item) => item.points).filter((point) => Number.isFinite(point.y));
    if (!allPoints.length) {
      container.innerHTML = "<div class=\"empty-state\">No trend data</div>";
      return;
    }
    const minX = Math.min(...allPoints.map((point) => point.x));
    const maxX = Math.max(...allPoints.map((point) => point.x));
    const minY = 0;
    const maxY = Math.max(...allPoints.map((point) => point.y)) * 1.15;
    const xScale = (x) => margin.left + ((x - minX) / Math.max(1, maxX - minX)) * (width - margin.left - margin.right);
    const yScale = (y) => height - margin.bottom - ((y - minY) / Math.max(1, maxY - minY)) * (height - margin.top - margin.bottom);
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => minY + (maxY - minY) * fraction);
    const labels = analysis.monthly.bulk.map((item, index) => ({ x: index, label: Engine.monthLabel(item.month) }));
    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
        ${ticks.map((tick) => `
          <g>
            <line x1="${margin.left}" x2="${width - margin.right}" y1="${yScale(tick)}" y2="${yScale(tick)}" class="gridline"></line>
            <text x="${margin.left - 12}" y="${yScale(tick) + 4}" class="axis-label" text-anchor="end">${formatNumber(tick)}</text>
          </g>
        `).join("")}
        ${labels.filter((_, index) => index % 2 === 0 || labels.length <= 7).map((label) => `
          <text x="${xScale(label.x)}" y="${height - 16}" class="axis-label" text-anchor="middle">${label.label}</text>
        `).join("")}
        ${series.map((item) => `
          <path d="${linePath(item.points, xScale, yScale)}" class="line-series" style="--series-color:${item.color}"></path>
          ${item.points.map((point) => `<circle cx="${xScale(point.x)}" cy="${yScale(point.y)}" r="4" class="line-dot" style="--series-color:${item.color}"><title>${item.label}: ${formatNumber(point.y, { maximumFractionDigits: item.precision || 0 })}</title></circle>`).join("")}
        `).join("")}
      </svg>
      <div class="chart-legend">
        ${series.map((item) => `<span><i style="background:${item.color}"></i>${item.label}</span>`).join("")}
      </div>
    `;
  }

  function renderBarChart(container, rows) {
    if (!rows.length) {
      container.innerHTML = "<div class=\"empty-state\">No culture data</div>";
      return;
    }
    const max = Math.max(...rows.map((row) => row.positives));
    container.innerHTML = rows.map((row) => `
      <div class="bar-row">
        <span>${row.className}</span>
        <div class="bar-track"><i style="width:${(row.positives / max) * 100}%"></i></div>
        <strong>${row.positives}</strong>
      </div>
    `).join("");
  }

  function renderCharts() {
    const bulkPoints = analysis.monthly.bulk.map((item, index) => ({ x: index, y: item.btscc }));
    const nirByMonth = new Map(analysis.monthly.cow.map((item) => [item.month, item.nir]));
    const nirScaled = analysis.monthly.bulk.map((item, index) => ({ x: index, y: (nirByMonth.get(item.month) || 0) * 45000 }));
    renderLineChart(document.getElementById("trendChart"), [
      { label: "BTSCC", color: "#2563eb", points: bulkPoints, precision: 0 },
      { label: "NIR scaled", color: "#dc2626", points: nirScaled, precision: 0 }
    ]);
    const slope = analysis.trends.btscc.slope;
    const pValue = analysis.trends.btscc.pValue;
    document.getElementById("trendCaption").textContent = `BTSCC slope: ${formatNumber(slope, { maximumFractionDigits: 0 })} cells/ml/month · p=${Number.isFinite(pValue) ? pValue.toFixed(3) : "--"}. NIR is scaled for visual comparison.`;
    renderBarChart(document.getElementById("pathogenChart"), analysis.pathogenSummary.byClass);
  }

  function renderAlerts() {
    const list = document.getElementById("alertsList");
    if (!analysis.alerts.length) {
      list.innerHTML = `<div class="empty-state">${t("noAlerts")}</div>`;
      return;
    }
    list.innerHTML = analysis.alerts.slice(0, 8).map((alert) => `
      <article class="alert-item ${alert.severity}">
        <div>
          <span class="pill ${alert.severity}">${statusLabel(alert.severity === "warning" ? "watch" : alert.severity)}</span>
          <h3>${alert.title}</h3>
          <p>${alert.detail}</p>
        </div>
        <strong>${alert.nmcLabel}</strong>
      </article>
    `).join("");
  }

  function renderNmcScores() {
    const list = document.getElementById("nmcScores");
    list.innerHTML = analysis.nmc.points.map((point) => {
      const label = state.language === "fa" ? point.fa : point.en;
      const score = Number.isFinite(point.score) ? point.score : 0;
      return `
        <div class="nmc-row">
          <span>${point.id}. ${label}</span>
          <meter min="0" max="10" low="5" high="7" optimum="9" value="${score}"></meter>
          <strong>${Number.isFinite(point.score) ? point.score.toFixed(1) : "--"}</strong>
        </div>
      `;
    }).join("");
  }

  function renderWatchlist() {
    const tbody = document.getElementById("watchlistTable");
    if (!analysis.watchlist.length) {
      tbody.innerHTML = `<tr><td colspan="6">${t("noWatchlist")}</td></tr>`;
      return;
    }
    tbody.innerHTML = analysis.watchlist.map((row) => `
      <tr>
        <td><strong>${row.cowId}</strong></td>
        <td>${formatNumber(row.scc)}</td>
        <td>${formatNumber(row.scs, { maximumFractionDigits: 1 })}</td>
        <td><span class="pill ${row.chronic ? "critical" : "watch"}">${row.status}</span></td>
        <td>${Number.isFinite(row.milkDeviation) ? `${formatNumber(row.milkDeviation, { maximumFractionDigits: 1 })} kg/day` : "--"}</td>
        <td>${row.action}</td>
      </tr>
    `).join("");
  }

  function renderReport() {
    const current = analysis.current;
    const month = current.month ? Engine.monthLabel(current.month) : "--";
    document.getElementById("reportSubtitle").textContent = `${state.data.herd.name || "Herd"} · ${month} · ${new Date(analysis.generatedAt).toLocaleDateString()}`;
    const majorAlerts = analysis.alerts.slice(0, 5);
    document.getElementById("reportBody").innerHTML = `
      <div class="report-grid">
        <section>
          <h3>Executive summary</h3>
          <p>BTSCC ${formatNumber(current.btscc)} cells/ml, prevalence ${formatNumber(current.prevalence, { maximumFractionDigits: 1 })}%, NIR ${formatNumber(current.nir, { maximumFractionDigits: 1 })}%, clinical incidence ${formatNumber(current.clinicalIncidence, { maximumFractionDigits: 1 })}/100 cow-months.</p>
          <p>Estimated monthly economic loss: ${formatNumber(current.economicLoss)} ${analysis.config.currency}. Overall score: ${analysis.overallScore}/100.</p>
        </section>
        <section>
          <h3>Priority actions</h3>
          <ol>
            ${majorAlerts.map((alert) => `<li><strong>${alert.title}</strong> - ${alert.detail} (${alert.nmcLabel})</li>`).join("")}
          </ol>
        </section>
      </div>
      <section>
        <h3>KPI formulas</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>KPI</th><th>Value</th><th>Target</th><th>Formula</th></tr></thead>
            <tbody>
              ${analysis.kpis.map((kpi) => `<tr><td>${kpi.label}</td><td>${formatMetric(kpi)}</td><td>${kpi.target}</td><td>${kpi.formula}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>
      </section>
      <p class="disclaimer">${t("sourceNote")}</p>
    `;
  }

  function renderMethodology() {
    const body = document.getElementById("methodologyBody");
    body.innerHTML = `
      <section>
        <h3>Metric model</h3>
        <p>SCC-based averages use geometric means where appropriate. Cow-level status uses the configurable SCC cutoff, defaulting to 200,000 cells/ml. Trend slopes use simple linear regression over the latest available 6-12 monthly points with a two-sided slope p-value.</p>
        <p>Coverage below ${analysis.config.coverageThreshold}% is flagged as limited validity. Economic loss is a management estimate, not an accounting ledger.</p>
      </section>
      <section>
        <h3>Required production data schema</h3>
        <pre><code>{
  "bulkTankSamples": [{"date":"YYYY-MM-DD","scc":250000,"spc":10000,"pic":15000,"lpc":180,"coliform":40}],
  "cowTests": [{"testDate":"YYYY-MM-DD","cowId":"IR-0001","scc":180000,"milkKg":31,"expectedMilkKg":33}],
  "clinicalCases": [{"date":"YYYY-MM-DD","cowId":"IR-0001","quarter":"LF","severity":"mild","bacteriologicalCure":true}],
  "dryPeriodRecords": [{"cowId":"IR-0001","sccBeforeDry":150000,"sccPostFresh":260000}],
  "bulkCultures": [{"date":"YYYY-MM-DD","pathogen":"Staphylococcus aureus","cfu":40}],
  "nmcScores": [{"date":"YYYY-MM-DD","point":3,"score":6.5}]
}</code></pre>
      </section>
      <section>
        <h3>References</h3>
        <ul class="reference-list">
          ${analysis.references.map((reference) => `<li><a href="${reference.url}" target="_blank" rel="noreferrer">${reference.label}</a><span>${reference.note}</span></li>`).join("")}
        </ul>
      </section>
      <p class="disclaimer">${t("sourceNote")}</p>
    `;
  }

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: "Mastitis Intelligence",
      data: state.data,
      config: state.config
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `mastitis-intelligence-${analysis.current.month || "export"}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        state.data = payload.data || payload;
        state.config = { ...Engine.DEFAULT_CONFIG, ...(payload.config || state.config) };
        saveState();
        render();
      } catch (error) {
        window.alert("Could not import JSON. Please check the file schema.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireButtons();
    bindEvents();
    render();
  });
})();
