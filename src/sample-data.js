(function initSampleData(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.DairySampleData = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function sampleFactory() {
  "use strict";

  const months = [
    "2025-09",
    "2025-10",
    "2025-11",
    "2025-12",
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
    "2026-05",
    "2026-06"
  ];

  const bulkScc = [188000, 205000, 224000, 242000, 261000, 278000, 305000, 335000, 362000, 386000];
  const cowCount = 200;

  function dateFor(month, day) {
    return `${month}-${String(day).padStart(2, "0")}`;
  }

  function createBulkTankSamples() {
    return months.flatMap((month, monthIndex) => {
      return [4, 11, 18, 25].map((day, sampleIndex) => {
        const pulse = (sampleIndex - 1.5) * 9000;
        const seasonal = monthIndex >= 7 ? 18000 : 0;
        return {
          date: dateFor(month, day),
          scc: Math.round(bulkScc[monthIndex] + pulse + seasonal),
          spc: Math.round(7200 + monthIndex * 720 + sampleIndex * 420),
          pic: Math.round(9000 + monthIndex * 1180 + sampleIndex * 930 + (monthIndex >= 7 ? 12000 : 0)),
          lpc: Math.round(95 + monthIndex * 16 + sampleIndex * 7),
          coliform: Math.round(20 + monthIndex * 4 + sampleIndex * 2 + (monthIndex >= 8 ? 26 : 0)),
          fat: Number((3.64 - monthIndex * 0.012 + sampleIndex * 0.01).toFixed(2)),
          protein: Number((3.18 - monthIndex * 0.006).toFixed(2)),
          lactose: Number((4.77 - monthIndex * 0.022 - (monthIndex >= 7 ? 0.05 : 0)).toFixed(2)),
          snf: Number((8.78 - monthIndex * 0.018).toFixed(2)),
          freezingPoint: -0.535 + sampleIndex * 0.001
        };
      });
    });
  }

  function cowBaseScc(cowId, monthIndex) {
    const chronicCows = new Set([7, 14, 22, 29, 37, 48, 53, 61, 72, 88, 101, 117, 133, 149, 166, 181]);
    const emergingCows = new Set([5, 19, 31, 44, 57, 69, 84, 96, 109, 123, 137, 152, 169, 187, 194]);
    const finalMonthTransmission = new Set([11, 26, 43, 66, 78, 91, 112, 126, 144, 158, 173, 189, 197]);
    const freshRisk = cowId % 17 === 0 && monthIndex >= 6;
    let scc = 92000 + (cowId % 23) * 2800 + monthIndex * 2900;
    if (chronicCows.has(cowId)) scc = 315000 + monthIndex * 15500 + (cowId % 9) * 9000;
    if (emergingCows.has(cowId) && monthIndex >= 5) scc = 225000 + (monthIndex - 5) * 43000 + (cowId % 5) * 12000;
    if (finalMonthTransmission.has(cowId) && monthIndex === months.length - 1) scc = 255000 + (cowId % 7) * 21000;
    if (freshRisk) scc += 145000 + monthIndex * 11000;
    if (cowId % 41 === 0 && monthIndex >= 8) scc += 390000;
    return Math.round(scc);
  }

  function createCowTests() {
    const records = [];
    months.forEach((month, monthIndex) => {
      for (let cow = 1; cow <= cowCount; cow += 1) {
        if ((cow + monthIndex) % 29 === 0) continue;
        const scc = cowBaseScc(cow, monthIndex);
        const parity = (cow % 4) + 1;
        const dim = 35 + ((cow * 7 + monthIndex * 31) % 280);
        const expectedMilkKg = 31 - parity * 0.7 - Math.abs(dim - 110) * 0.025;
        const sccPenalty = Math.max(0, Math.log2(scc / 200000)) * 1.15;
        const heatPenalty = monthIndex >= 8 ? 1.2 : monthIndex >= 6 ? 0.5 : 0;
        const milkKg = Math.max(12, expectedMilkKg - sccPenalty - heatPenalty - (cow % 6) * 0.12);
        records.push({
          testDate: dateFor(month, 15),
          cowId: `IR-${String(cow).padStart(4, "0")}`,
          parity,
          dim,
          scc,
          milkKg: Number(milkKg.toFixed(1)),
          expectedMilkKg: Number(expectedMilkKg.toFixed(1))
        });
      }
    });
    return records;
  }

  function createClinicalCases() {
    const casesByMonth = [3, 4, 5, 6, 6, 7, 8, 10, 12, 13];
    const pathogens = [
      "Staphylococcus aureus",
      "Streptococcus uberis",
      "Escherichia coli",
      "Klebsiella pneumoniae",
      "Coagulase-negative Staphylococci",
      "Candida spp."
    ];
    const quarters = ["LF", "LR", "RF", "RR"];
    const cases = [];
    casesByMonth.forEach((count, monthIndex) => {
      for (let i = 0; i < count; i += 1) {
        const severe = monthIndex >= 7 && i % 5 === 0;
        const moderate = i % 3 === 0;
        const pathogen = pathogens[(i + monthIndex) % pathogens.length];
        const curePenalty = pathogen === "Staphylococcus aureus" || pathogen === "Candida spp." || severe;
        cases.push({
          date: dateFor(months[monthIndex], 3 + ((i * 4) % 23)),
          cowId: `IR-${String(((i * 13 + monthIndex * 17) % cowCount) + 1).padStart(4, "0")}`,
          quarter: quarters[(i + monthIndex) % quarters.length],
          severity: severe ? "severe" : moderate ? "moderate" : "mild",
          pathogen,
          treatment: pathogen === "Escherichia coli" ? "supportive + culture guided" : "intramammary therapy",
          clinicalCure30: !severe && !(monthIndex >= 8 && i % 4 === 0),
          bacteriologicalCure: !curePenalty && !(monthIndex >= 7 && i % 4 === 0),
          recurrence60: monthIndex >= 6 && i % 4 === 0,
          discardedMilkKg: severe ? 190 : moderate ? 130 : 85,
          treatmentCost: severe ? 2900000 : moderate ? 1500000 : 820000,
          cullingLoss: severe && i % 10 === 0 ? 65000000 : 0
        });
      }
    });
    return cases;
  }

  function createDryPeriodRecords() {
    const records = [];
    months.slice(1).forEach((month, monthIndex) => {
      for (let i = 0; i < 18; i += 1) {
        const cowNumber = ((i * 11 + monthIndex * 19) % cowCount) + 1;
        const highBefore = (cowNumber + monthIndex) % 7 === 0;
        const newRisk = monthIndex >= 5 && (cowNumber + i) % 6 === 0;
        const cured = highBefore && (i + monthIndex) % 3 !== 0;
        records.push({
          cowId: `IR-${String(cowNumber).padStart(4, "0")}`,
          dryOffDate: dateFor(months[Math.max(0, monthIndex)], 20),
          calvingDate: dateFor(month, 9),
          sccBeforeDry: highBefore ? 410000 + i * 9000 : 118000 + i * 3200,
          sccPostFresh: highBefore ? (cured ? 145000 + i * 2200 : 390000 + i * 13000) : (newRisk ? 260000 + i * 18000 : 104000 + i * 2700),
          therapy: highBefore ? "selective antimicrobial + internal sealant" : "internal sealant"
        });
      }
    });
    return records;
  }

  function createBulkCultures() {
    return [
      { date: "2026-01-08", pathogen: "Coagulase-negative Staphylococci", cfu: 120 },
      { date: "2026-02-12", pathogen: "Corynebacterium bovis", cfu: 80 },
      { date: "2026-03-10", pathogen: "Streptococcus uberis", cfu: 60 },
      { date: "2026-04-14", pathogen: "Staphylococcus aureus", cfu: 35 },
      { date: "2026-05-09", pathogen: "Klebsiella pneumoniae", cfu: 45 },
      { date: "2026-05-23", pathogen: "Candida spp.", cfu: 20 },
      { date: "2026-06-11", pathogen: "Staphylococcus aureus", cfu: 50 },
      { date: "2026-06-18", pathogen: "Escherichia coli", cfu: 70 },
      { date: "2026-06-20", pathogen: "Pseudomonas aeruginosa", cfu: 18 }
    ];
  }

  function createNmcScores() {
    const points = [1, 2, 3, 4, 5, 6, 7];
    return months.slice(4).flatMap((month, monthIndex) => {
      return points.map((point) => {
        const base = [7.8, 6.4, 5.9, 6.8, 6.1, 5.7, 5.4][point - 1];
        const drift = point === 3 || point === 6 || point === 7 ? -monthIndex * 0.12 : monthIndex * 0.03;
        return {
          date: dateFor(month, 26),
          point,
          score: Number(Math.max(3, Math.min(9, base + drift)).toFixed(1))
        };
      });
    });
  }

  function createDemoData() {
    return {
      herd: {
        id: "demo-iran-holstein-001",
        name: "Demo Holstein Herd - Iran",
        location: "Iran",
        lactatingCows: cowCount,
        veterinarian: "Farm advisory team",
        dataStatus: "Demo dataset for product validation"
      },
      bulkTankSamples: createBulkTankSamples(),
      cowTests: createCowTests(),
      clinicalCases: createClinicalCases(),
      dryPeriodRecords: createDryPeriodRecords(),
      bulkCultures: createBulkCultures(),
      nmcScores: createNmcScores()
    };
  }

  return {
    createDemoData
  };
});
