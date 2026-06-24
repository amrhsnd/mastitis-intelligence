(function initKpiEngine(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MastitisKpiEngine = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function kpiFactory() {
  "use strict";

  const DEFAULT_CONFIG = Object.freeze({
    sccCutoff: 200000,
    herdSize: 200,
    coverageThreshold: 80,
    milkPrice: 50000,
    currency: "IRR",
    btsccTarget: 200000,
    btsccWarning: 400000,
    prevalenceTarget: 16,
    prevalenceWarning: 20,
    nirTarget: 5,
    nirWarning: 8,
    chronicTarget: 10,
    scsTarget: 3,
    scsWarning: 4,
    clinicalTarget: 3,
    clinicalWarning: 5,
    cureTarget: 70,
    cureWarning: 60,
    dryNewImiTarget: 10,
    dryNewImiWarning: 15,
    spcTarget: 10000,
    spcWarning: 50000,
    lpcWarning: 200,
    coliformWarning: 50,
    picSpcRatioWarning: 2
  });

  const NMC_POINTS = Object.freeze([
    { id: 1, en: "Goals, records, and data monitoring", fa: "هدف گذاری، رکورد و پایش داده محور" },
    { id: 2, en: "Cow environment", fa: "مدیریت محیط گاو" },
    { id: 3, en: "Milking procedures", fa: "روش های صحیح شیردوشی" },
    { id: 4, en: "Milking equipment maintenance", fa: "نگهداری و ارزیابی تجهیزات شیردوشی" },
    { id: 5, en: "Clinical mastitis management", fa: "مدیریت موارد بالینی در شیردهی" },
    { id: 6, en: "Dry cow management", fa: "مدیریت دوره خشکی" },
    { id: 7, en: "Biosecurity, segregation, and culling", fa: "امنیت زیستی، جداسازی و حذف" }
  ]);

  const PATHOGEN_CLASSIFICATION = Object.freeze({
    "Staphylococcus aureus": {
      className: "contagious",
      severity: "critical",
      nmcPoints: [3, 7],
      action: "Culture high-SCC cows, segregate or milk last, review post-dip coverage, and evaluate chronic culling."
    },
    "Streptococcus agalactiae": {
      className: "contagious",
      severity: "critical",
      nmcPoints: [3, 5, 7],
      action: "Treat as a zero-tolerance contagious pathogen and run cow-level culture confirmation."
    },
    "Mycoplasma spp.": {
      className: "contagious",
      severity: "critical",
      nmcPoints: [1, 3, 7],
      action: "Segregate affected cows, stop commingling risk, and confirm with laboratory testing."
    },
    "Corynebacterium bovis": {
      className: "contagious hygiene indicator",
      severity: "warning",
      nmcPoints: [3],
      action: "Audit post-milking teat disinfection and teat coverage."
    },
    "Streptococcus uberis": {
      className: "environmental",
      severity: "warning",
      nmcPoints: [2, 5],
      action: "Review bedding moisture, alley hygiene, and clinical culture-guided therapy."
    },
    "Streptococcus dysgalactiae": {
      className: "environmental/contagious",
      severity: "warning",
      nmcPoints: [2, 3],
      action: "Check both teat-end hygiene and bedding exposure."
    },
    "Escherichia coli": {
      className: "environmental coliform",
      severity: "warning",
      nmcPoints: [2, 5, 6],
      action: "Reduce manure exposure, heat stress, and wet bedding; culture severe cases before therapy."
    },
    "Klebsiella pneumoniae": {
      className: "environmental coliform",
      severity: "warning",
      nmcPoints: [2, 6],
      action: "Inspect organic bedding, moisture control, ventilation, and dry-cow pens."
    },
    "Pseudomonas aeruginosa": {
      className: "water/equipment",
      severity: "critical",
      nmcPoints: [3, 4],
      action: "Test water, wash routines, and milking equipment sanitation."
    },
    "Serratia spp.": {
      className: "equipment/environmental",
      severity: "warning",
      nmcPoints: [2, 4],
      action: "Audit cleaning chemicals, water quality, and equipment residues."
    },
    "Prototheca spp.": {
      className: "environmental refractory",
      severity: "critical",
      nmcPoints: [2, 7],
      action: "Segregate or cull confirmed cows and reduce wet organic exposure."
    },
    "Coagulase-negative Staphylococci": {
      className: "opportunistic",
      severity: "watch",
      nmcPoints: [3],
      action: "Improve teat preparation and monitor chronic minor-pathogen cases."
    },
    "Candida spp.": {
      className: "yeast/opportunistic",
      severity: "warning",
      nmcPoints: [5],
      action: "Review antimicrobial overuse, infusion hygiene, and treatment protocols."
    }
  });

  const REFERENCE_NOTES = Object.freeze([
    {
      label: "NMC Recommended Mastitis Control Program",
      url: "https://www.nmconline.org/wp-content/uploads/2025/08/SEVEN-point-NMC-Recommended-Mastitis-Control-08.18.25.pdf",
      note: "Seven-point program, published August 18, 2025; emphasizes data-driven monitoring, milking hygiene, equipment maintenance, dry cow management, and biosecurity."
    },
    {
      label: "NMC Guidelines on Normal and Abnormal Raw Milk",
      url: "https://www.nmconline.org/wp-content/uploads/2023/06/Guidelines-on-Normal-and-Abnormal-Raw-Milk-Formatted-002.pdf",
      note: "Defines SCC interpretation, including the 200,000 cells/ml subclinical mastitis decision point and BTSCC relationship to infected cows."
    },
    {
      label: "NMC DHI SCC fact sheet",
      url: "https://www.nmconline.org/wp-content/uploads/2023/06/IN-PROGRESS-Fact-Sheet-The-Value-and-Use-of-Dairy-Herd-Improvement-Somatic-Cell-Count-Formatted.pdf",
      note: "Explains DHI SCC monitoring, production loss, and why subclinical mastitis requires cow-level SCC records."
    },
    {
      label: "Journal of Dairy Science and veterinary epidemiology literature",
      url: "https://www.journalofdairyscience.org/",
      note: "Metric definitions should be validated by the farm veterinarian before commercial deployment in a regulated setting."
    }
  ]);

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
  }

  function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function parseDate(value) {
    if (value instanceof Date) return value;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function monthKey(value) {
    const date = parseDate(value);
    if (!date) return null;
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  function monthLabel(key) {
    if (!key) return "Unknown";
    const [year, month] = key.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, 1));
    return new Intl.DateTimeFormat("en", { month: "short", year: "2-digit", timeZone: "UTC" }).format(date);
  }

  function sortMonthKeys(keys) {
    return [...keys].sort((a, b) => a.localeCompare(b));
  }

  function groupBy(items, keyFn) {
    return items.reduce((map, item) => {
      const key = keyFn(item);
      if (!key) return map;
      if (!map[key]) map[key] = [];
      map[key].push(item);
      return map;
    }, {});
  }

  function average(values) {
    const clean = values.map(toNumber).filter((value) => Number.isFinite(value));
    if (!clean.length) return null;
    return clean.reduce((sum, value) => sum + value, 0) / clean.length;
  }

  function sum(values) {
    return values.map(toNumber).filter((value) => Number.isFinite(value)).reduce((acc, value) => acc + value, 0);
  }

  function geometricMean(values) {
    const clean = values.map(toNumber).filter((value) => Number.isFinite(value) && value > 0);
    if (!clean.length) return null;
    const meanLog = average(clean.map((value) => Math.log10(value)));
    return Math.pow(10, meanLog);
  }

  function somaticCellScore(scc) {
    const value = toNumber(scc);
    if (!value || value <= 0) return null;
    return Math.log2(value / 100000) + 3;
  }

  function pearsonCorrelation(points) {
    const clean = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (clean.length < 3) return null;
    const meanX = average(clean.map((point) => point.x));
    const meanY = average(clean.map((point) => point.y));
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    clean.forEach((point) => {
      const dx = point.x - meanX;
      const dy = point.y - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    });
    const denom = Math.sqrt(denomX * denomY);
    return denom ? numerator / denom : null;
  }

  function logGamma(z) {
    const coefficients = [
      676.5203681218851,
      -1259.1392167224028,
      771.3234287776531,
      -176.6150291621406,
      12.507343278686905,
      -0.13857109526572012,
      9.984369578019572e-6,
      1.5056327351493116e-7
    ];
    if (z < 0.5) {
      return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    }
    let x = 0.9999999999998099;
    const shifted = z - 1;
    for (let i = 0; i < coefficients.length; i += 1) {
      x += coefficients[i] / (shifted + i + 1);
    }
    const t = shifted + coefficients.length - 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x);
  }

  function betaContinuedFraction(a, b, x) {
    const maxIterations = 100;
    const epsilon = 3e-7;
    const fpmin = 1e-30;
    let qab = a + b;
    let qap = a + 1;
    let qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;
    if (Math.abs(d) < fpmin) d = fpmin;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= maxIterations; m += 1) {
      const m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < fpmin) d = fpmin;
      c = 1 + aa / c;
      if (Math.abs(c) < fpmin) c = fpmin;
      d = 1 / d;
      h *= d * c;
      aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < fpmin) d = fpmin;
      c = 1 + aa / c;
      if (Math.abs(c) < fpmin) c = fpmin;
      d = 1 / d;
      const delta = d * c;
      h *= delta;
      if (Math.abs(delta - 1) < epsilon) break;
    }
    return h;
  }

  function regularizedIncompleteBeta(x, a, b) {
    if (x < 0 || x > 1) return null;
    if (x === 0 || x === 1) return x;
    const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) {
      return (bt * betaContinuedFraction(a, b, x)) / a;
    }
    return 1 - (bt * betaContinuedFraction(b, a, 1 - x)) / b;
  }

  function studentTCdf(t, df) {
    if (!Number.isFinite(t) || df <= 0) return null;
    const x = df / (df + t * t);
    const ib = regularizedIncompleteBeta(x, df / 2, 0.5);
    if (ib === null) return null;
    return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
  }

  function simpleLinearRegression(values) {
    const clean = values
      .map((point, index) => ({
        x: Number.isFinite(point.x) ? point.x : index,
        y: toNumber(point.y)
      }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    const n = clean.length;
    if (n < 2) {
      return { n, slope: null, intercept: null, r2: null, pValue: null };
    }
    const meanX = average(clean.map((point) => point.x));
    const meanY = average(clean.map((point) => point.y));
    let sxx = 0;
    let sxy = 0;
    let syy = 0;
    clean.forEach((point) => {
      const dx = point.x - meanX;
      const dy = point.y - meanY;
      sxx += dx * dx;
      sxy += dx * dy;
      syy += dy * dy;
    });
    const slope = sxx ? sxy / sxx : 0;
    const intercept = meanY - slope * meanX;
    const ssRegression = sxy * slope;
    const ssError = Math.max(0, syy - ssRegression);
    const r2 = syy ? clamp(ssRegression / syy, 0, 1) : null;
    let pValue = null;
    if (n > 2 && sxx > 0) {
      const mse = ssError / (n - 2);
      const seSlope = Math.sqrt(mse / sxx);
      if (seSlope > 0) {
        const t = slope / seSlope;
        const cdf = studentTCdf(Math.abs(t), n - 2);
        pValue = cdf === null ? null : clamp(2 * (1 - cdf), 0, 1);
      } else {
        pValue = 0;
      }
    }
    return { n, slope, intercept, r2, pValue };
  }

  function statusLower(value, target, warning) {
    if (!Number.isFinite(value)) return "unknown";
    if (value <= target) return "good";
    if (value <= warning) return "watch";
    return "critical";
  }

  function statusHigher(value, target, warning) {
    if (!Number.isFinite(value)) return "unknown";
    if (value >= target) return "good";
    if (value >= warning) return "watch";
    return "critical";
  }

  function scoreLower(value, target, critical) {
    if (!Number.isFinite(value)) return 50;
    if (value <= target) return 100;
    if (value >= critical) return 0;
    return Math.round(100 * (1 - (value - target) / (critical - target)));
  }

  function scoreHigher(value, target, criticalLow) {
    if (!Number.isFinite(value)) return 50;
    if (value >= target) return 100;
    if (value <= criticalLow) return 0;
    return Math.round(100 * ((value - criticalLow) / (target - criticalLow)));
  }

  function latest(items, dateField) {
    const clean = items.filter((item) => parseDate(item[dateField]));
    if (!clean.length) return null;
    return [...clean].sort((a, b) => parseDate(b[dateField]) - parseDate(a[dateField]))[0];
  }

  function lastValue(series, field) {
    const clean = series.filter((item) => Number.isFinite(item[field]));
    return clean.length ? clean[clean.length - 1][field] : null;
  }

  function normalizeData(data) {
    return {
      herd: data.herd || {},
      bulkTankSamples: Array.isArray(data.bulkTankSamples) ? data.bulkTankSamples : [],
      cowTests: Array.isArray(data.cowTests) ? data.cowTests : [],
      clinicalCases: Array.isArray(data.clinicalCases) ? data.clinicalCases : [],
      dryPeriodRecords: Array.isArray(data.dryPeriodRecords) ? data.dryPeriodRecords : [],
      bulkCultures: Array.isArray(data.bulkCultures) ? data.bulkCultures : [],
      nmcScores: Array.isArray(data.nmcScores) ? data.nmcScores : []
    };
  }

  function mergeConfig(config, data) {
    const merged = { ...DEFAULT_CONFIG, ...(config || {}) };
    if (data && data.herd && data.herd.lactatingCows && !config?.herdSize) {
      merged.herdSize = data.herd.lactatingCows;
    }
    return merged;
  }

  function buildMonthlyBulk(data) {
    const grouped = groupBy(data.bulkTankSamples, (sample) => monthKey(sample.date));
    return sortMonthKeys(Object.keys(grouped)).map((month, index) => {
      const samples = grouped[month];
      return {
        month,
        index,
        sampleCount: samples.length,
        btscc: geometricMean(samples.map((sample) => sample.scc)),
        spc: geometricMean(samples.map((sample) => sample.spc)),
        pic: geometricMean(samples.map((sample) => sample.pic)),
        lpc: geometricMean(samples.map((sample) => sample.lpc)),
        coliform: geometricMean(samples.map((sample) => sample.coliform)),
        fat: average(samples.map((sample) => sample.fat)),
        protein: average(samples.map((sample) => sample.protein)),
        lactose: average(samples.map((sample) => sample.lactose)),
        snf: average(samples.map((sample) => sample.snf)),
        freezingPoint: average(samples.map((sample) => sample.freezingPoint))
      };
    });
  }

  function cowHistoryById(cowTests) {
    const byCow = groupBy(cowTests, (test) => test.cowId);
    Object.keys(byCow).forEach((cowId) => {
      byCow[cowId] = byCow[cowId].filter((test) => parseDate(test.testDate)).sort((a, b) => parseDate(a.testDate) - parseDate(b.testDate));
    });
    return byCow;
  }

  function buildMonthlyCowMetrics(data, config) {
    const grouped = groupBy(data.cowTests, (test) => monthKey(test.testDate));
    const histories = cowHistoryById(data.cowTests);
    return sortMonthKeys(Object.keys(grouped)).map((month, index) => {
      const tests = grouped[month];
      const denominator = tests.length;
      const high = tests.filter((test) => toNumber(test.scc) >= config.sccCutoff).length;
      let nirDenominator = 0;
      let newInfections = 0;
      let chronic = 0;
      tests.forEach((test) => {
        const history = histories[test.cowId] || [];
        const currentIndex = history.findIndex((item) => item.testDate === test.testDate);
        if (currentIndex > 0) {
          const previous = history[currentIndex - 1];
          if (toNumber(previous.scc) < config.sccCutoff) {
            nirDenominator += 1;
            if (toNumber(test.scc) >= config.sccCutoff) newInfections += 1;
          }
        }
        if (currentIndex >= 2) {
          const recent = history.slice(currentIndex - 2, currentIndex + 1);
          if (recent.every((item) => toNumber(item.scc) >= config.sccCutoff)) chronic += 1;
        }
      });
      const productionLossDailyKg = sum(
        tests.map((test) => {
          const actual = toNumber(test.milkKg);
          const expected = toNumber(test.expectedMilkKg);
          if (!Number.isFinite(actual) || !Number.isFinite(expected)) return 0;
          return Math.max(0, expected - actual);
        })
      );
      return {
        month,
        index,
        tested: denominator,
        herdSize: config.herdSize,
        coverage: config.herdSize ? (denominator / config.herdSize) * 100 : null,
        prevalence: denominator ? (high / denominator) * 100 : null,
        highSccCows: high,
        nirDenominator,
        newInfections,
        nir: nirDenominator ? (newInfections / nirDenominator) * 100 : null,
        chronicCows: chronic,
        chronicRate: denominator ? (chronic / denominator) * 100 : null,
        meanScs: average(tests.map((test) => somaticCellScore(test.scc))),
        productionLossDailyKg
      };
    });
  }

  function buildMonthlyClinical(data, config) {
    const grouped = groupBy(data.clinicalCases, (item) => monthKey(item.date));
    return sortMonthKeys(Object.keys(grouped)).map((month, index) => {
      const cases = grouped[month];
      const denominator = config.herdSize || 1;
      const evaluableClinical = cases.filter((item) => typeof item.clinicalCure30 === "boolean");
      const evaluableBacterial = cases.filter((item) => typeof item.bacteriologicalCure === "boolean");
      const recurring = cases.filter((item) => item.recurrence60 === true);
      const severe = cases.filter((item) => item.severity === "severe");
      return {
        month,
        index,
        cases: cases.length,
        incidence: (cases.length / denominator) * 100,
        mild: cases.filter((item) => item.severity === "mild").length,
        moderate: cases.filter((item) => item.severity === "moderate").length,
        severe: severe.length,
        severePct: cases.length ? (severe.length / cases.length) * 100 : 0,
        clinicalCure: evaluableClinical.length ? (evaluableClinical.filter((item) => item.clinicalCure30).length / evaluableClinical.length) * 100 : null,
        bacteriologicalCure: evaluableBacterial.length ? (evaluableBacterial.filter((item) => item.bacteriologicalCure).length / evaluableBacterial.length) * 100 : null,
        recurrence: cases.length ? (recurring.length / cases.length) * 100 : null,
        discardedMilkKg: sum(cases.map((item) => item.discardedMilkKg)),
        treatmentCost: sum(cases.map((item) => item.treatmentCost)),
        cullingLoss: sum(cases.map((item) => item.cullingLoss))
      };
    });
  }

  function buildMonthlyDryPeriod(data, config) {
    const grouped = groupBy(data.dryPeriodRecords, (item) => monthKey(item.calvingDate || item.postFreshDate));
    return sortMonthKeys(Object.keys(grouped)).map((month, index) => {
      const records = grouped[month];
      const atRisk = records.filter((item) => toNumber(item.sccBeforeDry) < config.sccCutoff);
      const newImi = atRisk.filter((item) => toNumber(item.sccPostFresh) >= config.sccCutoff);
      const infectedBefore = records.filter((item) => toNumber(item.sccBeforeDry) >= config.sccCutoff);
      const cured = infectedBefore.filter((item) => toNumber(item.sccPostFresh) < config.sccCutoff);
      return {
        month,
        index,
        records: records.length,
        newImiDry: atRisk.length ? (newImi.length / atRisk.length) * 100 : null,
        dryCure: infectedBefore.length ? (cured.length / infectedBefore.length) * 100 : null,
        atRiskCount: atRisk.length,
        curedCount: cured.length
      };
    });
  }

  function classifyCulture(culture) {
    const exact = PATHOGEN_CLASSIFICATION[culture.pathogen];
    if (exact) return exact;
    if (/staph/i.test(culture.pathogen)) return PATHOGEN_CLASSIFICATION["Coagulase-negative Staphylococci"];
    if (/yeast|candida/i.test(culture.pathogen)) return PATHOGEN_CLASSIFICATION["Candida spp."];
    if (/coli|klebsiella|enterobacter/i.test(culture.pathogen)) return PATHOGEN_CLASSIFICATION["Escherichia coli"];
    return {
      className: "unclassified",
      severity: "watch",
      nmcPoints: [1],
      action: "Confirm identification with the laboratory and interpret with cow-level SCC and clinical records."
    };
  }

  function buildPathogenSummary(data) {
    const cultures = [...data.bulkCultures].filter((culture) => parseDate(culture.date));
    if (!cultures.length) return { rows: [], byClass: [], alerts: [] };
    cultures.sort((a, b) => parseDate(a.date) - parseDate(b.date));
    const lastDate = parseDate(cultures[cultures.length - 1].date);
    const cutoff = new Date(lastDate);
    cutoff.setUTCMonth(cutoff.getUTCMonth() - 6);
    const recent = cultures.filter((culture) => parseDate(culture.date) >= cutoff);
    const rows = recent.map((culture) => {
      const classification = classifyCulture(culture);
      return {
        ...culture,
        className: classification.className,
        severity: classification.severity,
        nmcPoints: classification.nmcPoints,
        action: classification.action
      };
    });
    const classMap = groupBy(rows, (row) => row.className);
    const byClass = Object.keys(classMap).map((className) => ({
      className,
      positives: classMap[className].length,
      totalCfu: sum(classMap[className].map((row) => row.cfu || 1))
    })).sort((a, b) => b.positives - a.positives);
    const alerts = rows
      .filter((row) => row.severity === "critical" || row.cfu > 0)
      .map((row) => ({
        id: `pathogen-${row.pathogen}`,
        severity: row.severity,
        title: `${row.pathogen} detected`,
        detail: `${row.className}. ${row.action}`,
        nmcPoints: row.nmcPoints,
        metric: "bulk culture"
      }));
    return { rows, byClass, alerts };
  }

  function latestNmcScores(data) {
    if (!data.nmcScores.length) {
      return {
        month: null,
        points: NMC_POINTS.map((point) => ({ ...point, score: null })),
        average: null
      };
    }
    const latestRecord = latest(data.nmcScores, "date");
    const month = monthKey(latestRecord.date);
    const monthScores = data.nmcScores.filter((score) => monthKey(score.date) === month);
    const byPoint = groupBy(monthScores, (score) => String(score.point));
    const points = NMC_POINTS.map((point) => ({
      ...point,
      score: average((byPoint[String(point.id)] || []).map((score) => score.score))
    }));
    return {
      month,
      points,
      average: average(points.map((point) => point.score))
    };
  }

  function qualityMetrics(monthlyBulk) {
    const latestMonth = monthlyBulk[monthlyBulk.length - 1] || {};
    const baselineMonths = monthlyBulk.slice(0, -1).filter((month) => Number.isFinite(month.btscc) && month.btscc <= DEFAULT_CONFIG.btsccTarget);
    const fallbackMonths = monthlyBulk.slice(Math.max(0, monthlyBulk.length - 4), -1);
    const baseline = baselineMonths.length ? baselineMonths : fallbackMonths;
    const baselineLactose = average(baseline.map((month) => month.lactose));
    const btsccLactoseCorrelation = pearsonCorrelation(monthlyBulk.map((month) => ({ x: month.btscc, y: month.lactose })));
    return {
      lactose: latestMonth.lactose ?? null,
      fat: latestMonth.fat ?? null,
      protein: latestMonth.protein ?? null,
      snf: latestMonth.snf ?? null,
      lactoseDelta: Number.isFinite(latestMonth.lactose) && Number.isFinite(baselineLactose) ? latestMonth.lactose - baselineLactose : null,
      btsccLactoseCorrelation
    };
  }

  function buildEconomic(monthlyCow, monthlyClinical, config) {
    const months = new Set([...monthlyCow.map((item) => item.month), ...monthlyClinical.map((item) => item.month)]);
    const byCow = groupBy(monthlyCow, (item) => item.month);
    const byClinical = groupBy(monthlyClinical, (item) => item.month);
    return sortMonthKeys([...months]).map((month, index) => {
      const cow = (byCow[month] || [])[0] || {};
      const clinical = (byClinical[month] || [])[0] || {};
      const productionLossKg = (cow.productionLossDailyKg || 0) * 30;
      const discardedMilkKg = clinical.discardedMilkKg || 0;
      const milkLossCost = (productionLossKg + discardedMilkKg) * config.milkPrice;
      const treatmentCost = clinical.treatmentCost || 0;
      const cullingLoss = clinical.cullingLoss || 0;
      return {
        month,
        index,
        productionLossKg,
        discardedMilkKg,
        milkLossCost,
        treatmentCost,
        cullingLoss,
        totalCost: milkLossCost + treatmentCost + cullingLoss
      };
    });
  }

  function buildWatchlist(data, config) {
    const histories = cowHistoryById(data.cowTests);
    return Object.keys(histories).map((cowId) => {
      const history = histories[cowId];
      const current = history[history.length - 1];
      const recent = history.slice(-3);
      const scc = toNumber(current.scc);
      const scs = somaticCellScore(scc);
      const chronic = recent.length >= 3 && recent.every((test) => toNumber(test.scc) >= config.sccCutoff);
      const actual = toNumber(current.milkKg);
      const expected = toNumber(current.expectedMilkKg);
      const milkDeviation = Number.isFinite(actual) && Number.isFinite(expected) ? actual - expected : null;
      let status = "Monitor";
      let action = "Retest next DHI cycle and compare with clinical record.";
      let risk = 0;
      if (chronic) {
        status = "Chronic high SCC";
        action = "Culture, milk last or segregate, and review culling economics.";
        risk += 60;
      } else if (scc >= config.sccCutoff) {
        status = "High SCC";
        action = "Run CMT/culture and check previous infection history.";
        risk += 35;
      }
      if (Number.isFinite(scs)) risk += clamp((scs - 3) * 8, 0, 35);
      if (Number.isFinite(milkDeviation) && milkDeviation < 0) risk += clamp(Math.abs(milkDeviation) * 2, 0, 25);
      return {
        cowId,
        date: current.testDate,
        scc,
        scs,
        chronic,
        status,
        action,
        milkDeviation,
        risk: Math.round(risk)
      };
    }).filter((row) => row.risk > 0).sort((a, b) => b.risk - a.risk).slice(0, 25);
  }

  function nmcPointLabels(points) {
    return points.map((point) => `NMC ${point}`).join(", ");
  }

  function addAlert(alerts, alert) {
    if (!alert || !alert.title) return;
    alerts.push({
      severity: alert.severity || "watch",
      nmcPoints: alert.nmcPoints || [1],
      metric: alert.metric || "general",
      ...alert
    });
  }

  function buildAlerts(current, trends, pathogenSummary, config) {
    const alerts = [];
    if (Number.isFinite(current.coverage) && current.coverage < config.coverageThreshold) {
      addAlert(alerts, {
        id: "coverage-low",
        severity: "warning",
        title: "Data incomplete - limited validity",
        detail: `Cow-level coverage is ${current.coverage.toFixed(1)}%, below the ${config.coverageThreshold}% validity threshold.`,
        nmcPoints: [1],
        metric: "coverage"
      });
    }
    if (Number.isFinite(current.btscc) && current.btscc > config.btsccTarget && trends.btscc.slope > 0) {
      addAlert(alerts, {
        id: "btscc-rising",
        severity: current.btscc > config.btsccWarning ? "critical" : "warning",
        title: "Rising BTSCC with elevated subclinical burden",
        detail: `BTSCC is ${Math.round(current.btscc).toLocaleString()} cells/ml and the 6-12 month slope is positive.`,
        nmcPoints: [1, 3, 7],
        metric: "BTSCC"
      });
    }
    if (Number.isFinite(current.nir) && current.nir > config.nirTarget) {
      addAlert(alerts, {
        id: "nir-high",
        severity: current.nir > config.nirWarning ? "critical" : "warning",
        title: "Active new infection transmission",
        detail: `NIR is ${current.nir.toFixed(1)}%. Audit milking hygiene, milking order, pre/post-dip, and liner slips.`,
        nmcPoints: [3, 4],
        metric: "NIR"
      });
    }
    if (Number.isFinite(current.prevalence) && current.prevalence > config.prevalenceWarning) {
      addAlert(alerts, {
        id: "prevalence-high",
        severity: "warning",
        title: "High subclinical mastitis prevalence",
        detail: `Prevalence is ${current.prevalence.toFixed(1)}%. Use cow-level culture to separate contagious, environmental, and chronic sources.`,
        nmcPoints: [1, 2, 3, 7],
        metric: "prevalence"
      });
    }
    if (Number.isFinite(current.chronicRate) && current.chronicRate > config.chronicTarget) {
      addAlert(alerts, {
        id: "chronic-high",
        severity: "critical",
        title: "Chronic infection reservoir",
        detail: `Chronic rate is ${current.chronicRate.toFixed(1)}%. Persistent high SCC cows can maintain contagious pressure.`,
        nmcPoints: [5, 7],
        metric: "chronic"
      });
    }
    if (Number.isFinite(current.clinicalIncidence) && current.clinicalIncidence > config.clinicalWarning) {
      addAlert(alerts, {
        id: "clinical-high",
        severity: "critical",
        title: "Clinical mastitis incidence above target",
        detail: `Clinical incidence is ${current.clinicalIncidence.toFixed(1)} cases per 100 cow-months.`,
        nmcPoints: [2, 5],
        metric: "clinical incidence"
      });
    }
    if (Number.isFinite(current.bacteriologicalCure) && current.bacteriologicalCure < config.cureWarning) {
      addAlert(alerts, {
        id: "cure-low",
        severity: "critical",
        title: "Low treatment success",
        detail: `Bacteriological cure is ${current.bacteriologicalCure.toFixed(1)}%. Recheck pathogen mix, treatment eligibility, and antimicrobial sensitivity.`,
        nmcPoints: [5],
        metric: "cure"
      });
    }
    if (Number.isFinite(current.dryNewImi) && current.dryNewImi > config.dryNewImiWarning) {
      addAlert(alerts, {
        id: "dry-imi-high",
        severity: "critical",
        title: "Dry-period new IMI risk",
        detail: `New IMI across the dry period is ${current.dryNewImi.toFixed(1)}%. Audit dry-off hygiene, sealant use, and close-up cow environment.`,
        nmcPoints: [6, 2],
        metric: "dry period"
      });
    }
    if (Number.isFinite(current.picSpcRatio) && current.picSpcRatio > config.picSpcRatioWarning) {
      addAlert(alerts, {
        id: "pic-spc-high",
        severity: "warning",
        title: "PIC/SPC ratio suggests hygiene or cooling risk",
        detail: `PIC/SPC ratio is ${current.picSpcRatio.toFixed(1)}. Check pre-milking hygiene, cooling, and equipment sanitation.`,
        nmcPoints: [3, 4],
        metric: "PIC/SPC"
      });
    }
    if (Number.isFinite(current.lpc) && current.lpc > config.lpcWarning) {
      addAlert(alerts, {
        id: "lpc-high",
        severity: "warning",
        title: "High LPC indicates cleaning failure risk",
        detail: `LPC is ${Math.round(current.lpc).toLocaleString()} CFU/ml. Review wash temperature, detergent concentration, and contact time.`,
        nmcPoints: [4],
        metric: "LPC"
      });
    }
    if (Number.isFinite(current.coliform) && current.coliform > config.coliformWarning) {
      addAlert(alerts, {
        id: "coliform-high",
        severity: "warning",
        title: "Coliform count suggests manure or water contamination",
        detail: `Coliform count is ${Math.round(current.coliform).toLocaleString()} CFU/ml. Inspect bedding, udder preparation, and water quality.`,
        nmcPoints: [2, 3],
        metric: "coliform"
      });
    }
    pathogenSummary.alerts.forEach((alert) => addAlert(alerts, alert));
    const priority = { critical: 0, warning: 1, watch: 2, good: 3 };
    return alerts
      .sort((a, b) => (priority[a.severity] ?? 9) - (priority[b.severity] ?? 9))
      .map((alert) => ({
        ...alert,
        nmcLabel: nmcPointLabels(alert.nmcPoints)
      }));
  }

  function buildKpis(current, config) {
    return [
      {
        id: "btscc",
        label: "Bulk tank SCC",
        faLabel: "SCC بالک تانک",
        value: current.btscc,
        unit: "cells/ml",
        precision: 0,
        status: statusLower(current.btscc, config.btsccTarget, config.btsccWarning),
        target: `< ${config.btsccTarget.toLocaleString()}`,
        formula: "10^(mean(log10 bulk SCC samples in month))",
        interpretation: "Herd-level proxy for infected quarters and saleable milk quality.",
        nmcPoints: [1]
      },
      {
        id: "prevalence",
        label: "Subclinical prevalence",
        faLabel: "شیوع زیربالینی",
        value: current.prevalence,
        unit: "%",
        precision: 1,
        status: statusLower(current.prevalence, config.prevalenceTarget, config.prevalenceWarning),
        target: `< ${config.prevalenceTarget}%`,
        formula: "cows with SCC >= cutoff / tested cows * 100",
        interpretation: "Current burden of likely subclinical intramammary infection.",
        nmcPoints: [1]
      },
      {
        id: "nir",
        label: "New infection rate",
        faLabel: "نرخ عفونت جدید",
        value: current.nir,
        unit: "%",
        precision: 1,
        status: statusLower(current.nir, config.nirTarget, config.nirWarning),
        target: `< ${config.nirTarget}%`,
        formula: "previous low-SCC cows now high-SCC / previous low-SCC cows * 100",
        interpretation: "Most direct signal of active new transmission.",
        nmcPoints: [3, 4]
      },
      {
        id: "chronicRate",
        label: "Chronic infection rate",
        faLabel: "نرخ عفونت مزمن",
        value: current.chronicRate,
        unit: "%",
        precision: 1,
        status: statusLower(current.chronicRate, config.chronicTarget, config.prevalenceWarning),
        target: `< ${config.chronicTarget}%`,
        formula: "SCC >= cutoff in 3 consecutive tests / tested cows * 100",
        interpretation: "Persistent reservoir for contagious spread and culling decisions.",
        nmcPoints: [5, 7]
      },
      {
        id: "meanScs",
        label: "Mean SCS",
        faLabel: "میانگین SCS",
        value: current.meanScs,
        unit: "",
        precision: 1,
        status: statusLower(current.meanScs, config.scsTarget, config.scsWarning),
        target: `< ${config.scsTarget}`,
        formula: "log2(SCC / 100,000) + 3",
        interpretation: "Log-scale SCC score for statistical analysis and milk-loss estimation.",
        nmcPoints: [1]
      },
      {
        id: "clinicalIncidence",
        label: "Clinical incidence",
        faLabel: "بروز ماستیت بالینی",
        value: current.clinicalIncidence,
        unit: "/100 cow-mo",
        precision: 1,
        status: statusLower(current.clinicalIncidence, config.clinicalTarget, config.clinicalWarning),
        target: `< ${config.clinicalTarget}`,
        formula: "new clinical cases / lactating cow-months * 100",
        interpretation: "Clinical burden and severity signal.",
        nmcPoints: [5]
      },
      {
        id: "bacteriologicalCure",
        label: "Bacteriological cure",
        faLabel: "بهبودی باکتریولوژیک",
        value: current.bacteriologicalCure,
        unit: "%",
        precision: 1,
        status: statusHigher(current.bacteriologicalCure, config.cureTarget, config.cureWarning),
        target: `> ${config.cureTarget}%`,
        formula: "culture-negative after treatment / treated cows * 100",
        interpretation: "Treatment protocol performance; pathogen-specific interpretation required.",
        nmcPoints: [5]
      },
      {
        id: "dryNewImi",
        label: "Dry-period new IMI",
        faLabel: "IMI جدید دوره خشکی",
        value: current.dryNewImi,
        unit: "%",
        precision: 1,
        status: statusLower(current.dryNewImi, config.dryNewImiTarget, config.dryNewImiWarning),
        target: `< ${config.dryNewImiTarget}%`,
        formula: "low SCC before dry-off, high SCC after calving / low SCC before dry-off * 100",
        interpretation: "Dry cow therapy, sealant, hygiene, and close-up pen risk.",
        nmcPoints: [6]
      },
      {
        id: "spc",
        label: "Standard plate count",
        faLabel: "SPC بالک",
        value: current.spc,
        unit: "CFU/ml",
        precision: 0,
        status: statusLower(current.spc, config.spcTarget, config.spcWarning),
        target: `< ${config.spcTarget.toLocaleString()}`,
        formula: "monthly geometric mean of bulk SPC samples",
        interpretation: "General milk hygiene and equipment sanitation indicator.",
        nmcPoints: [3, 4]
      },
      {
        id: "economicLoss",
        label: "Estimated monthly loss",
        faLabel: "برآورد زیان ماهانه",
        value: current.economicLoss,
        unit: config.currency,
        precision: 0,
        status: statusLower(current.economicLoss, current.economicLossTarget || 50000000, current.economicLossWarning || 120000000),
        target: "farm-defined",
        formula: "(milk loss kg + discarded milk kg) * milk price + treatment + culling",
        interpretation: "Commercial prioritization estimate; adjust to local accounting.",
        nmcPoints: [1]
      }
    ];
  }

  function buildCurrent(monthlyBulk, monthlyCow, monthlyClinical, monthlyDry, monthlyEconomics, pathogenSummary, quality, config) {
    const latestBulk = monthlyBulk[monthlyBulk.length - 1] || {};
    const latestCow = monthlyCow[monthlyCow.length - 1] || {};
    const latestClinical = monthlyClinical[monthlyClinical.length - 1] || {};
    const latestDry = monthlyDry[monthlyDry.length - 1] || {};
    const latestEconomics = monthlyEconomics[monthlyEconomics.length - 1] || {};
    const picSpcRatio = latestBulk.spc ? latestBulk.pic / latestBulk.spc : null;
    return {
      month: latestBulk.month || latestCow.month || latestClinical.month || latestDry.month || null,
      btscc: latestBulk.btscc ?? null,
      spc: latestBulk.spc ?? null,
      pic: latestBulk.pic ?? null,
      lpc: latestBulk.lpc ?? null,
      coliform: latestBulk.coliform ?? null,
      picSpcRatio,
      prevalence: latestCow.prevalence ?? null,
      coverage: latestCow.coverage ?? null,
      tested: latestCow.tested ?? null,
      highSccCows: latestCow.highSccCows ?? null,
      nir: latestCow.nir ?? null,
      newInfections: latestCow.newInfections ?? null,
      chronicRate: latestCow.chronicRate ?? null,
      chronicCows: latestCow.chronicCows ?? null,
      meanScs: latestCow.meanScs ?? null,
      clinicalIncidence: latestClinical.incidence ?? null,
      clinicalCases: latestClinical.cases ?? null,
      severePct: latestClinical.severePct ?? null,
      clinicalCure: latestClinical.clinicalCure ?? null,
      bacteriologicalCure: latestClinical.bacteriologicalCure ?? null,
      recurrence: latestClinical.recurrence ?? null,
      dryNewImi: latestDry.newImiDry ?? null,
      dryCure: latestDry.dryCure ?? null,
      economicLoss: latestEconomics.totalCost ?? null,
      quality,
      pathogenClasses: pathogenSummary.byClass
    };
  }

  function calculateOverallScore(current, nmc, config) {
    const kpiScores = [
      scoreLower(current.btscc, config.btsccTarget, config.btsccWarning * 1.6),
      scoreLower(current.prevalence, config.prevalenceTarget, config.prevalenceWarning * 2),
      scoreLower(current.nir, config.nirTarget, config.nirWarning * 2),
      scoreLower(current.chronicRate, config.chronicTarget, config.chronicTarget * 2.5),
      scoreLower(current.clinicalIncidence, config.clinicalTarget, config.clinicalWarning * 2),
      scoreHigher(current.bacteriologicalCure, config.cureTarget, config.cureWarning - 25),
      scoreLower(current.dryNewImi, config.dryNewImiTarget, config.dryNewImiWarning * 2),
      scoreLower(current.spc, config.spcTarget, config.spcWarning * 2)
    ];
    const kpiAverage = average(kpiScores);
    const manualScore = Number.isFinite(nmc.average) ? nmc.average * 10 : null;
    const overall = Number.isFinite(manualScore) ? (kpiAverage * 0.7 + manualScore * 0.3) : kpiAverage;
    return Math.round(clamp(overall, 0, 100));
  }

  function calculateAnalysis(rawData, userConfig) {
    const data = normalizeData(rawData || {});
    const config = mergeConfig(userConfig, data);
    const monthlyBulk = buildMonthlyBulk(data);
    const monthlyCow = buildMonthlyCowMetrics(data, config);
    const monthlyClinical = buildMonthlyClinical(data, config);
    const monthlyDry = buildMonthlyDryPeriod(data, config);
    const pathogenSummary = buildPathogenSummary(data);
    const quality = qualityMetrics(monthlyBulk);
    const monthlyEconomics = buildEconomic(monthlyCow, monthlyClinical, config);
    const nmc = latestNmcScores(data);
    const trends = {
      btscc: simpleLinearRegression(monthlyBulk.slice(-12).map((item, index) => ({ x: index, y: item.btscc }))),
      nir: simpleLinearRegression(monthlyCow.slice(-12).map((item, index) => ({ x: index, y: item.nir }))),
      prevalence: simpleLinearRegression(monthlyCow.slice(-12).map((item, index) => ({ x: index, y: item.prevalence }))),
      clinicalIncidence: simpleLinearRegression(monthlyClinical.slice(-12).map((item, index) => ({ x: index, y: item.incidence })))
    };
    const current = buildCurrent(monthlyBulk, monthlyCow, monthlyClinical, monthlyDry, monthlyEconomics, pathogenSummary, quality, config);
    const alerts = buildAlerts(current, trends, pathogenSummary, config);
    const kpis = buildKpis(current, config);
    const overallScore = calculateOverallScore(current, nmc, config);
    return {
      config,
      herd: data.herd,
      current,
      kpis,
      trends,
      alerts,
      nmc,
      overallScore,
      watchlist: buildWatchlist(data, config),
      monthly: {
        bulk: monthlyBulk,
        cow: monthlyCow,
        clinical: monthlyClinical,
        dry: monthlyDry,
        economics: monthlyEconomics
      },
      pathogenSummary,
      references: REFERENCE_NOTES,
      nmcPoints: NMC_POINTS,
      generatedAt: new Date().toISOString()
    };
  }

  return {
    DEFAULT_CONFIG,
    NMC_POINTS,
    PATHOGEN_CLASSIFICATION,
    REFERENCE_NOTES,
    average,
    calculateAnalysis,
    classifyCulture,
    geometricMean,
    monthKey,
    monthLabel,
    simpleLinearRegression,
    somaticCellScore,
    statusLower,
    statusHigher
  };
});
