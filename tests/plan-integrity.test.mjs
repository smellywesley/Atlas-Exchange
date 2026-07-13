import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const modules = new Map();

function loadTypeScriptModule(filePath) {
  const resolvedPath = path.resolve(filePath);
  if (modules.has(resolvedPath)) {
    return modules.get(resolvedPath).exports;
  }

  const module = { exports: {} };
  modules.set(resolvedPath, module);
  const output = ts.transpileModule(fs.readFileSync(resolvedPath, "utf8"), {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;

  vm.runInNewContext(output, {
    module,
    exports: module.exports,
    process,
    console,
    Date,
    URL,
    encodeURIComponent,
    require(specifier) {
      if (specifier.startsWith(".")) {
        const candidate = path.resolve(path.dirname(resolvedPath), specifier);
        return loadTypeScriptModule(path.extname(candidate) ? candidate : `${candidate}.ts`);
      }
      return nativeRequire(specifier);
    }
  });

  return module.exports;
}

const planEngine = loadTypeScriptModule("src/lib/plan-engine.ts");
const exchangeMap = loadTypeScriptModule("src/lib/exchange-map-data.ts");

const baseInput = {
  monthlyBudgetSgd: 2300,
  stayLengthMonths: 4,
  housingPreference: "shared",
  travelStyle: "balanced",
  dietaryNeeds: [],
  plannedActivities: [],
  startDate: "2026-09-01",
  endDate: "2026-12-20"
};

function inputFor(universityName) {
  const country = exchangeMap.exchangeCountries.find((item) =>
    item.universities.some((university) => university.name === universityName)
  );
  assert.ok(country, `Country not found for ${universityName}`);
  return { ...baseInput, countryId: country.id, universityName };
}

test("Lyon selection stays synchronized through the generated plan", () => {
  const { plan } = planEngine.buildPlanResponseForInput(inputFor("INSA Lyon"));

  assert.equal(plan.partnerUniversity.name, "INSA Lyon");
  assert.equal(plan.profile.destinationCity, "Lyon");
  assert.equal(plan.profile.destinationCountry, "France");
  assert.equal(plan.profile.startDate, "2026-09-01");
  assert.equal(plan.profile.endDate, "2026-12-20");
});

test("Oxford never falls back to UCL or London", () => {
  const { plan } = planEngine.buildPlanResponseForInput(inputFor("University of Oxford"));

  assert.equal(plan.partnerUniversity.name, "University of Oxford");
  assert.equal(plan.profile.destinationCity, "Oxford");
  assert.notEqual(plan.partnerUniversity.name, "University College London");
});

test("global plans do not invent market prices, commute times, or fit scores", () => {
  const { plan } = planEngine.buildPlanResponseForInput(inputFor("Stanford University"));

  assert.equal(plan.budget.basis, "planning-envelope");
  assert.equal(plan.budget.notes.some((note) => note.includes("London")), false);
  for (const option of plan.accommodation.rankedOptions) {
    assert.equal(option.estimatedMonthlyCostSgd, undefined);
    assert.equal(option.commuteMinutes, undefined);
    assert.equal(option.fitScore, undefined);
  }
});

test("local life exposes twenty destination-linked searches", () => {
  const { plan } = planEngine.buildPlanResponseForInput(inputFor("INSA Lyon"));

  assert.equal(plan.localLife.places.length, 20);
  assert.equal(plan.localLife.places.every((place) => place.mapsUrl.includes("INSA%20Lyon")), true);
  assert.equal(plan.localLife.places.every((place) => place.sourceRefIds.length > 0), true);
});

test("unverified deadlines do not pretend to have exact dates", () => {
  const { plan } = planEngine.buildPlanResponseForInput(inputFor("Stanford University"));

  assert.equal(plan.deadlines.every((deadline) => deadline.dueDate === undefined), true);
});

test("contradictory country and university selections are rejected", () => {
  assert.throws(
    () => planEngine.buildPlanResponseForInput({
      ...baseInput,
      countryId: "france",
      universityName: "Stanford University"
    }),
    /not a partner university in France/
  );
});

test("unknown destinations never fall back to London", () => {
  assert.throws(
    () => planEngine.buildPlanResponseForInput({
      ...baseInput,
      countryId: "unknown-country",
      universityName: "Unknown University"
    }),
    /destination country is not available/
  );
});

test("the default London partner ID resolves without a country field", () => {
  const { plan } = planEngine.buildPlanResponseForInput({
    ...baseInput,
    partnerUniversityId: "ucl"
  });

  assert.equal(plan.partnerUniversity.name, "University College London");
  assert.equal(plan.profile.destinationCity, "London");
});
