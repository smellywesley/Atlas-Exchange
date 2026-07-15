import sourceAttributions from "../../public/images/universities/sources-and-permissions.json";

export type UniversityAttribution = {
  region: string;
  slug: string;
  university: string;
  status: string;
  title: string;
  url: string;
  source_page_url: string;
  width: number;
  height: number;
  mime: string;
  author: string;
  license: string;
  license_url: string;
  usage_terms: string;
  date: string;
  replacement_reason?: string;
  filename: string;
  delivered_dimensions: string;
};

export type UniversityAsset = {
  slug: string;
  imagePath: string;
  attribution: UniversityAttribution;
};

const attributions = sourceAttributions as readonly UniversityAttribution[];

export function toUniversityAssetSlug(universityName: string) {
  return universityName
    .normalize("NFKD")
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const universityAssets: readonly UniversityAsset[] = Object.freeze(
  attributions.map((attribution) => ({
    slug: attribution.slug,
    imagePath: `/images/universities/${attribution.filename}`,
    attribution
  }))
);

export const universityAttributionByName: Readonly<Record<string, UniversityAttribution>> =
  Object.freeze(
    Object.fromEntries(
      attributions.map((attribution) => [attribution.university, attribution])
    )
  );

const universityAssetBySlug = new Map(
  universityAssets.map((asset) => [asset.slug, asset] as const)
);

export function getUniversityAsset(universityName: string) {
  return universityAssetBySlug.get(toUniversityAssetSlug(universityName));
}

export function getUniversityImagePath(universityName: string) {
  return getUniversityAsset(universityName)?.imagePath;
}

export function getUniversityAttribution(universityName: string) {
  return getUniversityAsset(universityName)?.attribution;
}
