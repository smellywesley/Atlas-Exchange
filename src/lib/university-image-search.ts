import {
  getUniversityIdentityTitle,
  type ExchangeUniversity
} from "./exchange-map-data";

export type CampusImageInfo = {
  thumburl?: string;
  url?: string;
  mime?: string;
};

export function buildUniversitySummaryTitles(
  university: Pick<ExchangeUniversity, "name" | "identityTitle">
) {
  const identityTitle = getUniversityIdentityTitle(university);
  return Array.from(new Set([university.name, identityTitle].map((seed) => seed.trim()).filter(Boolean)));
}

export function buildUniversityImageQueries(
  university: Pick<ExchangeUniversity, "name" | "city" | "identityTitle">
) {
  const identityTitle = getUniversityIdentityTitle(university);
  const seeds = [
    `${identityTitle} campus building`,
    `${university.name} campus`,
    `${identityTitle} main building`,
    `${university.name} university campus`,
    `${identityTitle} library`,
    `${university.name} aerial campus`
  ];

  return Array.from(new Set(seeds.map((seed) => seed.trim()).filter(Boolean)));
}

export function isCampusPhotoCandidate(title: string, image: CampusImageInfo) {
  const haystack = `${title} ${image.thumburl ?? ""} ${image.url ?? ""}`.toLowerCase();
  const blocked = [
    "logo",
    "seal",
    "crest",
    "emblem",
    "badge",
    "icon",
    "coat_of_arms",
    "coat-of-arms",
    ".svg"
  ];
  const positive = [
    "campus",
    "building",
    "hall",
    "library",
    "quad",
    "facade",
    "exterior",
    "courtyard",
    "grounds",
    "tower",
    "centre",
    "center",
    "aerial"
  ];

  return (
    Boolean(image.thumburl) &&
    Boolean(image.mime?.startsWith("image/")) &&
    isInstitutionPhotoUrl(image.thumburl ?? image.url) &&
    !blocked.some((word) => haystack.includes(word)) &&
    positive.some((word) => haystack.includes(word))
  );
}

export function imageMatchesUniversityIdentity(
  university: Pick<ExchangeUniversity, "name" | "identityTitle">,
  title: string,
  image: CampusImageInfo
) {
  const haystack = normalizeImageText(`${title} ${image.thumburl ?? ""} ${image.url ?? ""}`);
  return getUniversityIdentityTerms(university).some((term) =>
    containsNormalizedPhrase(haystack, term)
  );
}

export function isInstitutionPhotoUrl(url?: string) {
  if (!url) {
    return false;
  }

  const lower = url.toLowerCase();
  const blocked = [
    ".svg",
    "logo",
    "seal",
    "crest",
    "emblem",
    "badge",
    "icon",
    "coat_of_arms",
    "coat-of-arms"
  ];

  return !blocked.some((word) => lower.includes(word));
}

function getUniversityIdentityTerms(
  university: Pick<ExchangeUniversity, "name" | "identityTitle">
) {
  const identityTitle = getUniversityIdentityTitle(university);
  const rawTerms = [university.name, identityTitle];

  return Array.from(
    new Set(
      rawTerms
        .map(normalizeImageText)
        .map((term) => term.trim())
        .filter((term) => term.length >= 3)
    )
  );
}

function containsNormalizedPhrase(haystack: string, phrase: string) {
  return ` ${haystack} `.includes(` ${phrase} `);
}

function normalizeImageText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
