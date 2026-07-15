import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const assetDirectory = "public/images/universities";
const manifestPath = path.join(assetDirectory, "sources-and-permissions.json");
const csvManifestPath = path.join(assetDirectory, "sources-and-permissions.csv");
const modules = new Map();

function loadTypeScriptModule(modulePath) {
  if (modules.has(modulePath)) {
    return modules.get(modulePath).exports;
  }

  const module = { exports: {} };
  modules.set(modulePath, module);
  const source = fs.readFileSync(modulePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;

  vm.runInNewContext(output, {
    module,
    exports: module.exports,
    require(specifier) {
      if (specifier.endsWith("sources-and-permissions.json")) {
        return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      }
      return require(specifier);
    }
  });

  return module.exports;
}

function readWebpDimensions(filePath) {
  const image = fs.readFileSync(filePath);
  assert.equal(image.toString("ascii", 0, 4), "RIFF");
  assert.equal(image.toString("ascii", 8, 12), "WEBP");

  for (let offset = 12; offset + 8 <= image.length; ) {
    const chunkType = image.toString("ascii", offset, offset + 4);
    const chunkSize = image.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;

    if (chunkType === "VP8X" && chunkSize >= 10) {
      return {
        width: 1 + image.readUIntLE(dataOffset + 4, 3),
        height: 1 + image.readUIntLE(dataOffset + 7, 3)
      };
    }

    if (chunkType === "VP8 " && chunkSize >= 10) {
      assert.deepEqual(
        [...image.subarray(dataOffset + 3, dataOffset + 6)],
        [0x9d, 0x01, 0x2a]
      );
      return {
        width: image.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: image.readUInt16LE(dataOffset + 8) & 0x3fff
      };
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  throw new Error(`Unsupported WebP encoding: ${filePath}`);
}

const assets = loadTypeScriptModule("src/lib/university-assets.ts");
const exchangeMap = loadTypeScriptModule("src/lib/exchange-map-data.ts");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

test("canonical slugs remove apostrophes before punctuation", () => {
  assert.equal(
    assets.toUniversityAssetSlug("King's College London"),
    "kings-college-london"
  );
  assert.equal(
    assets.toUniversityAssetSlug("Queen\u2019s University, Kingston"),
    "queens-university-kingston"
  );
  assert.equal(
    assets.getUniversityImagePath("King's College London"),
    "/images/universities/kings-college-london.webp"
  );
  assert.equal(
    assets.getUniversityImagePath("Queen's University, Kingston"),
    "/images/universities/queens-university-kingston.webp"
  );
});

test("all exchange universities resolve to the 92 local assets", () => {
  const universityNames = [
    ...new Set(exchangeMap.getAllUniversities().map((university) => university.name))
  ];
  const imageFiles = fs
    .readdirSync(assetDirectory)
    .filter((filename) => filename.endsWith(".webp"));

  assert.equal(universityNames.length, 92);
  assert.equal(manifest.length, 92);
  assert.equal(imageFiles.length, 92);
  assert.equal(new Set(manifest.map((entry) => entry.filename)).size, 92);
  assert.match(
    fs.readFileSync(csvManifestPath, "utf8").split(/\r?\n/, 1)[0],
    /^\uFEFF?region,filename,university,status,/
  );

  for (const universityName of universityNames) {
    const asset = assets.getUniversityAsset(universityName);
    assert.ok(asset, `Missing asset lookup for ${universityName}`);
    assert.ok(
      fs.existsSync(path.join("public", asset.imagePath)),
      `Missing image file for ${universityName}`
    );
  }

  assert.equal(
    fs.readdirSync(assetDirectory).some((filename) => filename.includes("contact-sheet")),
    false
  );
});

test("all imported WebPs are 1600 by 1000", () => {
  for (const entry of manifest) {
    assert.equal(entry.delivered_dimensions, "1600 x 1000");
    assert.deepEqual(
      readWebpDimensions(path.join(assetDirectory, entry.filename)),
      { width: 1600, height: 1000 },
      entry.filename
    );
  }
});

test("incomplete attribution remains explicit", () => {
  const ncku = assets.getUniversityAttribution("National Cheng Kung University");
  assert.ok(ncku);
  assert.equal(ncku.license, "Attribution");
  assert.equal(ncku.license_url, "");
  assert.equal(ncku.usage_terms, "");

  const washington = assets.getUniversityAttribution(
    "University of Washington, Seattle"
  );
  assert.ok(washington);
  assert.equal(washington.author, "");
  assert.equal(washington.license, "CC BY-SA 4.0");
});
