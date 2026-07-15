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
  if (modules.has(resolvedPath)) return modules.get(resolvedPath).exports;

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
    AbortController,
    fetch,
    setTimeout,
    clearTimeout,
    require(specifier) {
      if (specifier === "server-only") return {};
      if (specifier.startsWith(".")) {
        const candidate = path.resolve(path.dirname(resolvedPath), specifier);
        return loadTypeScriptModule(path.extname(candidate) ? candidate : `${candidate}.ts`);
      }
      return nativeRequire(specifier);
    }
  });

  return module.exports;
}

const academic = loadTypeScriptModule("src/lib/academic-modules.ts");
const visa = loadTypeScriptModule("src/lib/visa-guidance.ts");
const culture = loadTypeScriptModule("src/lib/cultural-guidance.ts");
const qna = loadTypeScriptModule("src/lib/qna-engine.ts");

test("NUSMods lookup stays on the fixed host and emits candidate-only data", async () => {
  const calls = [];
  const client = academic.createNusModsClient({
    fetchImpl: async (url) => {
      calls.push(String(url));
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            moduleCode: "CS1010S",
            title: "Programming Methodology",
            moduleCredit: "4",
            semesterData: [{ semester: 1 }, { semester: 2 }]
          };
        }
      };
    }
  });

  const result = await client.lookup({ academicYear: "2026-2027", moduleCode: "cs1010s" });
  assert.equal(calls[0], "https://api.nusmods.com/v2/2026-2027/modules/CS1010S.json");
  assert.equal(result.candidate.mappingStatus, "candidate-only");
  assert.equal(result.candidate.approvalRequired, true);
  assert.equal("score" in result.candidate, false);
  assert.equal("approved" in result.candidate, false);
});

test("NUSMods validation rejects path injection and non-consecutive years", async () => {
  const client = academic.createNusModsClient({
    fetchImpl: async () => {
      throw new Error("fetch must not run");
    }
  });

  await assert.rejects(
    client.lookup({ academicYear: "2026-2028", moduleCode: "CS1010S" }),
    /consecutive years/
  );
  await assert.rejects(
    client.lookup({ academicYear: "2026-2027", moduleCode: "../status" }),
    /module-code shape/
  );
  await assert.rejects(
    client.lookup({ academicYear: "1999-2000", moduleCode: "CS1010S" }),
    /between 2000 and 2101/
  );
});

test("NUSMods serves stale data only inside the bounded stale window", async () => {
  let now = 1_000;
  let calls = 0;
  const client = academic.createNusModsClient({
    now: () => now,
    freshTtlMs: 100,
    staleTtlMs: 1_000,
    fetchImpl: async () => {
      calls += 1;
      if (calls > 1) throw new Error("provider unavailable");
      return {
        ok: true,
        status: 200,
        async json() {
          return { moduleCode: "CS2030S", title: "Programming Methodology II" };
        }
      };
    }
  });

  assert.equal(
    (await client.lookup({ academicYear: "2026-2027", moduleCode: "CS2030S" })).cacheStatus,
    "miss"
  );
  now = 1_050;
  assert.equal(
    (await client.lookup({ academicYear: "2026-2027", moduleCode: "CS2030S" })).cacheStatus,
    "fresh"
  );
  now = 1_200;
  assert.equal(
    (await client.lookup({ academicYear: "2026-2027", moduleCode: "CS2030S" })).cacheStatus,
    "stale"
  );
  now = 2_100;
  await assert.rejects(
    client.lookup({ academicYear: "2026-2027", moduleCode: "CS2030S" }),
    /request failed/
  );
});

test("NUSMods keeps a one-entry cache hot and coalesces concurrent misses", async () => {
  let calls = 0;
  const client = academic.createNusModsClient({
    maxCacheEntries: 1,
    fetchImpl: async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return {
        ok: true,
        status: 200,
        async json() {
          return { moduleCode: "CS1010S", title: "Programming Methodology" };
        }
      };
    }
  });
  const input = { academicYear: "2026-2027", moduleCode: "CS1010S" };
  const concurrent = await Promise.all(Array.from({ length: 8 }, () => client.lookup(input)));
  assert.equal(calls, 1);
  assert.equal(concurrent.every((result) => result.candidate.moduleCode === "CS1010S"), true);
  assert.equal((await client.lookup(input)).cacheStatus, "fresh");
  assert.equal(calls, 1);
});

test("NUSMods bounds distinct concurrent fetches and its outbound-call window", async () => {
  let releaseFirst;
  const firstPending = new Promise((resolve) => { releaseFirst = resolve; });
  const concurrentClient = academic.createNusModsClient({
    maxConcurrentFetches: 1,
    fetchImpl: async () => {
      await firstPending;
      return {
        ok: true,
        status: 200,
        async json() { return { moduleCode: "CS1010S", title: "Programming Methodology" }; }
      };
    }
  });
  const first = concurrentClient.lookup({ academicYear: "2026-2027", moduleCode: "CS1010S" });
  await assert.rejects(
    concurrentClient.lookup({ academicYear: "2026-2027", moduleCode: "CS2030S" }),
    /capacity is temporarily exhausted/
  );
  releaseFirst();
  await first;

  const budgetClient = academic.createNusModsClient({
    maxFetchesPerWindow: 1,
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      async json() { return { moduleCode: "CS1010S", title: "Programming Methodology" }; }
    })
  });
  await budgetClient.lookup({ academicYear: "2026-2027", moduleCode: "CS1010S" });
  await assert.rejects(
    budgetClient.lookup({ academicYear: "2026-2027", moduleCode: "CS2030S" }),
    /capacity is temporarily exhausted/
  );
});

test("visa guidance never claims a live decision", () => {
  const guidance = visa.getVisaGuidance("UK");
  assert.equal(guidance.checks.passport, "needs-passport");
  assert.equal(guidance.checks.immigration, "official-check-required");
  assert.equal(guidance.decisionProvider, "none");
  assert.equal(guidance.visaDecision, "not-evaluated");
  assert.equal(guidance.source.url.startsWith("https://www.gov.uk/"), true);
});

test("unreviewed cultural destinations never inherit London guidance", () => {
  const guidance = culture.getCulturalGuidance({ city: "Delft", country: "Netherlands" });
  assert.equal(guidance.reviewStatus, "needs-review");
  assert.equal(guidance.destinationCity, "Delft");
  assert.equal(guidance.etiquetteTips.length, 0);
  assert.equal(JSON.stringify(guidance).includes("London"), false);
});

test("Q&A answers only from evidence in the inferred topic", () => {
  const engine = qna.createQnaEngine();
  const request = {
    question: "What module credits are listed?",
    context: {
      classification: "non-pii",
      evidence: [
        { id: "module-1", topic: "modules", text: "CS1010S carries 4 module credits.", sourceRefIds: ["nusmods-1"] },
        { id: "visa-1", topic: "visa", text: "A passport check is required.", sourceRefIds: ["gov-1"] }
      ]
    }
  };

  const first = engine.answer(request);
  const second = engine.answer(request);
  assert.equal(first.topic, "modules");
  assert.equal(first.answer.includes("CS1010S"), true);
  assert.equal(first.answer.includes("passport"), false);
  assert.equal(first.support, "supplied-context");
  assert.equal(first.cacheStatus, "miss");
  assert.equal(second.cacheStatus, "hit");
});

test("Q&A uses an explicit unsupported fallback and rejects PII", () => {
  const engine = qna.createQnaEngine();
  const unsupported = engine.answer({
    question: "What visa do I need?",
    context: { classification: "non-pii", evidence: [] }
  });
  assert.equal(unsupported.topic, "visa");
  assert.equal(unsupported.support, "unsupported");
  assert.equal(unsupported.answer.includes("does not contain supported evidence"), true);

  assert.throws(
    () => engine.answer({
      question: "What visa do I need?",
      context: {
        classification: "non-pii",
        evidence: [{ id: "private", topic: "visa", text: "Email me at student@example.com" }]
      }
    }),
    /non-PII context only/
  );
  assert.throws(
    () => engine.answer({ question: "What visa do I need?", context: { evidence: [] } }),
    /Invalid input/
  );
  assert.throws(
    () => engine.answer({
      question: "x".repeat(241),
      context: { classification: "non-pii", evidence: [] }
    }),
    /Too big/
  );
});

test("Q&A matches whole keywords instead of visa substrings", () => {
  const engine = qna.createQnaEngine({ maxCacheEntries: 1 });
  const request = {
    question: "Can you give me details about housing?",
    context: {
      classification: "non-pii",
      evidence: [
        { id: "housing-1", topic: "accommodation", text: "University housing is the first route.", sourceRefIds: [] },
        { id: "visa-1", topic: "visa", text: "Use the official entry checker.", sourceRefIds: [] }
      ]
    }
  };
  assert.equal(engine.answer(request).topic, "accommodation");
  assert.equal(engine.answer(request).cacheStatus, "hit");
});
