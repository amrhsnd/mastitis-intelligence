const test = require("node:test");
const assert = require("node:assert/strict");

const Engine = require("../src/kpi-engine.js");
const Samples = require("../src/sample-data.js");

test("geometric mean handles SCC values on the log scale", () => {
  const result = Engine.geometricMean([100000, 400000]);
  assert.equal(Math.round(result), 200000);
});

test("somatic cell score follows log2 SCC formula", () => {
  assert.equal(Engine.somaticCellScore(800000), 6);
});

test("new infection rate uses previous low-SCC denominator", () => {
  const data = {
    herd: { lactatingCows: 2 },
    cowTests: [
      { testDate: "2026-01-15", cowId: "A", scc: 100000 },
      { testDate: "2026-01-15", cowId: "B", scc: 150000 },
      { testDate: "2026-02-15", cowId: "A", scc: 300000 },
      { testDate: "2026-02-15", cowId: "B", scc: 120000 }
    ]
  };
  const analysis = Engine.calculateAnalysis(data, { herdSize: 2 });
  assert.equal(analysis.current.nir, 50);
  assert.equal(analysis.current.prevalence, 50);
});

test("chronic infection rate requires three consecutive high SCC tests", () => {
  const data = {
    herd: { lactatingCows: 1 },
    cowTests: [
      { testDate: "2026-01-15", cowId: "A", scc: 250000 },
      { testDate: "2026-02-15", cowId: "A", scc: 270000 },
      { testDate: "2026-03-15", cowId: "A", scc: 290000 }
    ]
  };
  const analysis = Engine.calculateAnalysis(data, { herdSize: 1 });
  assert.equal(analysis.current.chronicRate, 100);
});

test("regression returns positive slope and significant p-value for monotonic series", () => {
  const regression = Engine.simpleLinearRegression([
    { x: 0, y: 1 },
    { x: 1, y: 2 },
    { x: 2, y: 3 },
    { x: 3, y: 4 },
    { x: 4, y: 5 }
  ]);
  assert.equal(regression.slope, 1);
  assert.equal(regression.pValue, 0);
});

test("demo dataset produces a complete commercial dashboard analysis", () => {
  const data = Samples.createDemoData();
  const analysis = Engine.calculateAnalysis(data, { herdSize: data.herd.lactatingCows });
  assert.ok(analysis.kpis.length >= 10);
  assert.ok(analysis.alerts.some((alert) => alert.id === "nir-high"));
  assert.ok(analysis.watchlist.length > 0);
  assert.ok(analysis.overallScore >= 0 && analysis.overallScore <= 100);
});
