import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const modules = new Map();

function loadTypeScriptModule(path) {
  if (modules.has(path)) {
    return modules.get(path).exports;
  }

  const module = { exports: {} };
  modules.set(path, module);
  const source = fs.readFileSync(path, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;

  vm.runInNewContext(output, {
    module,
    exports: module.exports,
    require(specifier) {
      if (specifier === "./exchange-map-data") {
        return loadTypeScriptModule("src/lib/exchange-map-data.ts");
      }
      return require(specifier);
    }
  });

  return module.exports;
}

const imageSearch = loadTypeScriptModule("src/lib/university-image-search.ts");

test("requires the selected institution, not a similarly named university", () => {
  const oxford = { name: "University of Oxford", identityTitle: "University of Oxford" };

  assert.equal(
    imageSearch.imageMatchesUniversityIdentity(
      oxford,
      "File:Oxford Brookes University Headington campus.jpg",
      { thumburl: "https://example.test/Oxford_Brookes_University_campus.jpg" }
    ),
    false
  );
  assert.equal(
    imageSearch.imageMatchesUniversityIdentity(
      oxford,
      "File:University of Oxford Radcliffe Camera.jpg",
      { thumburl: "https://example.test/University_of_Oxford_Radcliffe_Camera.jpg" }
    ),
    true
  );
});

test("rejects unrelated institutions returned by a broad campus search", () => {
  const kyoto = { name: "Kyoto University", identityTitle: "Kyoto University" };

  assert.equal(
    imageSearch.imageMatchesUniversityIdentity(
      kyoto,
      "File:Ritsumeikan University Osaka Ibaraki Campus.jpg",
      { thumburl: "https://example.test/Ritsumeikan_University_campus.jpg" }
    ),
    false
  );
});

test("requires a physical-campus cue and rejects brand assets", () => {
  assert.equal(
    imageSearch.isCampusPhotoCandidate("File:EPFL campus building.jpg", {
      thumburl: "https://example.test/EPFL_campus_building.jpg",
      mime: "image/jpeg"
    }),
    true
  );
  assert.equal(
    imageSearch.isCampusPhotoCandidate("File:EPFL logo.svg", {
      thumburl: "https://example.test/EPFL_logo.svg",
      mime: "image/svg+xml"
    }),
    false
  );
  assert.equal(
    imageSearch.isCampusPhotoCandidate("File:University of Zurich fossil.jpg", {
      thumburl: "https://example.test/University_of_Zurich_fossil.jpg",
      mime: "image/jpeg"
    }),
    false
  );
});
