import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const rootDir = process.cwd();
const docsDir = path.join(rootDir, "docs");
const jsonPath = path.join(docsDir, "university-image-audit.json");
const markdownPath = path.join(docsDir, "UNIVERSITY_IMAGE_AUDIT.md");

function loadTsModule(relativePath, requireMap = {}) {
  const filePath = path.join(rootDir, relativePath);
  const source = fs.readFileSync(filePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true
    },
    fileName: filePath
  }).outputText;
  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require: (specifier) => {
      if (requireMap[specifier]) {
        return requireMap[specifier];
      }
      throw new Error(`Unsupported require in audit loader: ${specifier}`);
    },
    console
  };
  vm.runInNewContext(output, sandbox, { filename: filePath });
  return module.exports;
}

const exchangeMap = loadTsModule("src/lib/exchange-map-data.ts");
const imageSearch = loadTsModule("src/lib/university-image-search.ts", {
  "./exchange-map-data": exchangeMap
});

const universities = dedupeUniversities(
  exchangeMap.exchangeCountries.flatMap((country) =>
    country.universities.map((university, index) => ({
      country,
      university,
      index
    }))
  )
);

const generatedAt = new Date().toISOString();
const results = [];

for (const item of universities) {
  const result = await auditUniversity(item);
  results.push(result);
  process.stdout.write(result.imageUrl ? "." : "x");
}

process.stdout.write("\n");

const summary = {
  generatedAt,
  total: results.length,
  resolved: results.filter((result) => result.imageUrl).length,
  missing: results.filter((result) => !result.imageUrl && !result.error).length,
  errors: results.filter((result) => result.error).length
};

fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(jsonPath, JSON.stringify({ summary, results }, null, 2));
fs.writeFileSync(markdownPath, buildMarkdown(summary, results));

console.log(`IMAGE_AUDIT_TOTAL=${summary.total}`);
console.log(`IMAGE_AUDIT_RESOLVED=${summary.resolved}`);
console.log(`IMAGE_AUDIT_MISSING=${summary.missing}`);
console.log(`IMAGE_AUDIT_ERRORS=${summary.errors}`);
console.log(`IMAGE_AUDIT_MARKDOWN=${markdownPath}`);

const missing = results.filter((result) => result.status === "missing");
if (missing.length > 0) {
  console.log("MISSING_SCHOOLS:");
  missing.forEach((result) => {
    console.log(`${result.country} | ${result.city} | ${result.university}`);
  });
}

const errors = results.filter((result) => result.status === "error");
if (errors.length > 0) {
  console.log("ERROR_SCHOOLS:");
  errors.forEach((result) => {
    console.log(`${result.country} | ${result.city} | ${result.university} | ${result.error}`);
  });
}

function dedupeUniversities(items) {
  const seen = new Set();
  return items.filter(({ country, university }) => {
    const key = `${country.id}::${university.name.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function auditUniversity({ country, university }) {
  const identityTitle = exchangeMap.getUniversityIdentityTitle(university);
  const queries = imageSearch.buildUniversityImageQueries(university);

  try {
    for (const title of imageSearch.buildUniversitySummaryTitles(university)) {
      const image = await searchWikipediaSummary(university, title);
      if (image) {
        return {
          country: country.name,
          city: university.city,
          university: university.name,
          partnership: university.partnership,
          identityTitle,
          status: "resolved",
          method: "wikipedia-summary",
          query: title,
          title: image.title,
          imageUrl: image.source,
          sourceUrl: image.source,
          pinterestSearchUrl: buildPinterestUrl(university),
          commonsSearchUrl: buildCommonsUrl(queries[0])
        };
      }
    }

    for (const query of queries) {
      const image = await searchCommons(university, query);
      if (image) {
        return {
          country: country.name,
          city: university.city,
          university: university.name,
          partnership: university.partnership,
          identityTitle,
          status: "resolved",
          method: "commons-search",
          query,
          title: image.title,
          imageUrl: image.image.thumburl,
          sourceUrl: image.image.url ?? image.image.thumburl,
          pinterestSearchUrl: buildPinterestUrl(university),
          commonsSearchUrl: buildCommonsUrl(query)
        };
      }
    }

    return {
      country: country.name,
      city: university.city,
      university: university.name,
      partnership: university.partnership,
      identityTitle,
      status: "missing",
      query: queries[0],
      imageUrl: null,
      sourceUrl: null,
      pinterestSearchUrl: buildPinterestUrl(university),
      commonsSearchUrl: buildCommonsUrl(queries[0])
    };
  } catch (error) {
    return {
      country: country.name,
      city: university.city,
      university: university.name,
      partnership: university.partnership,
      identityTitle,
      status: "error",
      query: queries[0],
      imageUrl: null,
      sourceUrl: null,
      error: error instanceof Error ? error.message : String(error),
      pinterestSearchUrl: buildPinterestUrl(university),
      commonsSearchUrl: buildCommonsUrl(queries[0])
    };
  }
}

async function searchWikipediaSummary(university, title) {
  const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const payload = await fetchJsonWithRetry(endpoint, { allowNotFound: true });
  const source = payload?.thumbnail?.source ?? payload?.originalimage?.source;

  if (
    !source ||
    !imageSearch.isInstitutionPhotoUrl(source) ||
    !imageSearch.imageMatchesUniversityIdentity(university, payload?.title ?? title, {
      thumburl: source
    })
  ) {
    return null;
  }

  return {
    title: payload?.title ?? title,
    source
  };
}

async function searchCommons(university, query) {
  const endpoint = new URL("https://commons.wikimedia.org/w/api.php");
  endpoint.search = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: "14",
    gsrsearch: query,
    prop: "imageinfo",
    iiprop: "url|mime",
    iiurlwidth: "960"
  }).toString();

  const payload = await fetchJsonWithRetry(endpoint.toString());
  const pages = Object.values(payload?.query?.pages ?? {});
  return pages
    .map((page) => ({
      title: page.title,
      image: page.imageinfo?.[0]
    }))
    .find(
      ({ title, image }) =>
        image?.thumburl &&
        imageSearch.isCampusPhotoCandidate(title, image) &&
        imageSearch.imageMatchesUniversityIdentity(university, title, image)
    );
}

async function fetchJsonWithRetry(url, options = {}) {
  const attempts = 4;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await sleep(attempt === 0 ? 220 : 900 * attempt);
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "AtlasExchangeHackathon/0.1 (campus image audit; contact local developer)"
      }
    });

    if (response.status === 404 && options.allowNotFound) {
      return null;
    }

    if (response.status === 429 || response.status >= 500) {
      if (attempt < attempts - 1) {
        continue;
      }
    }

    if (!response.ok) {
      throw new Error(`Image source returned ${response.status}`);
    }

    return response.json();
  }

  throw new Error("Image source retry budget exhausted");
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildPinterestUrl(university) {
  return `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(`${university.name} campus`)}`;
}

function buildCommonsUrl(query) {
  return `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(query)}&title=Special:MediaSearch&type=image`;
}

function buildMarkdown(summary, rows) {
  const missing = rows.filter((row) => row.status === "missing");
  const errors = rows.filter((row) => row.status === "error");
  const resolved = rows.filter((row) => row.imageUrl);
  const lines = [
    "# University Image Audit",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    "This is the pre-OpenAI image coverage audit for the universities currently shown in Atlas Exchange. It uses the same public Wikimedia Commons campus-photo filters now used by the UI, then gives Pinterest search links for schools that still need manual image sourcing.",
    "",
    "Direct Pinterest scraping/OCR was not executed because the requested Rube MCP tools are not available in this Codex session. Use the Pinterest links below as source-hunting starting points, then prefer official campus photos, Wikimedia Commons, or another source we can legally attribute.",
    "",
    "## Summary",
    "",
    `- Total unique website universities audited: ${summary.total}`,
    `- Resolved with a real campus-photo candidate: ${summary.resolved}`,
    `- Still missing a usable campus image candidate: ${summary.missing}`,
    `- Lookup errors: ${summary.errors}`,
    "",
    "## Schools Still Missing Images",
    "",
    missing.length
      ? "| Country | City | University | Partnership | Pinterest search | Commons search |\n|---|---|---|---|---|---|"
      : "No missing schools found by the current audit.",
    ...missing.map(
      (row) =>
        `| ${escapeCell(row.country)} | ${escapeCell(row.city)} | ${escapeCell(row.university)} | ${escapeCell(row.partnership)} | [Pinterest](${row.pinterestSearchUrl}) | [Commons](${row.commonsSearchUrl}) |`
    ),
    "",
    "## Lookup Errors",
    "",
    errors.length
      ? "| Country | City | University | Error |\n|---|---|---|---|"
      : "No lookup errors after retry/backoff.",
    ...errors.map(
      (row) =>
        `| ${escapeCell(row.country)} | ${escapeCell(row.city)} | ${escapeCell(row.university)} | ${escapeCell(row.error)} |`
    ),
    "",
    "## Resolved Campus Image Candidates",
    "",
    "| Country | City | University | Method | Matched query | Candidate |",
    "|---|---|---|---|---|---|",
    ...resolved.map(
      (row) =>
        `| ${escapeCell(row.country)} | ${escapeCell(row.city)} | ${escapeCell(row.university)} | ${escapeCell(row.method)} | ${escapeCell(row.query)} | [${escapeCell(row.title)}](${row.sourceUrl}) |`
    ),
    ""
  ];

  return `${lines.join("\n")}\n`;
}

function escapeCell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
}
