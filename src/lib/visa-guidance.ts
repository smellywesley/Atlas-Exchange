import { z } from "zod";

export type OfficialVisaSource = {
  destinationCountry: string;
  authority: string;
  title: string;
  url: string;
};

const sources: OfficialVisaSource[] = [
  {
    destinationCountry: "United Kingdom",
    authority: "UK Government",
    title: "Check if you need a UK visa",
    url: "https://www.gov.uk/check-uk-visa"
  },
  {
    destinationCountry: "United States",
    authority: "U.S. Department of State",
    title: "Student Visa",
    url: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html"
  },
  {
    destinationCountry: "Canada",
    authority: "Immigration, Refugees and Citizenship Canada",
    title: "Find out if you need a study permit",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/study-permit-tool.html"
  },
  {
    destinationCountry: "Australia",
    authority: "Australian Department of Home Affairs",
    title: "Subclass 500 Student visa",
    url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500"
  },
  {
    destinationCountry: "France",
    authority: "Government of France",
    title: "France-Visas visa wizard",
    url: "https://france-visas.gouv.fr/en/web/france-visas/visa-wizard"
  },
  {
    destinationCountry: "Japan",
    authority: "Ministry of Foreign Affairs of Japan",
    title: "Visa information",
    url: "https://www.mofa.go.jp/j_info/visit/visa/index.html"
  }
];

export const officialVisaSourceRegistry: Readonly<Record<string, OfficialVisaSource>> =
  Object.freeze(
    Object.fromEntries(sources.map((source) => [normalizeCountry(source.destinationCountry), source]))
  );

const destinationCountrySchema = z.string().trim().min(2).max(120);

export type VisaGuidance = {
  destinationCountry: string;
  checks: {
    passport: "needs-passport";
    immigration: "official-check-required";
  };
  decisionProvider: "none";
  visaDecision: "not-evaluated";
  source?: OfficialVisaSource;
  reviewStatus: "official-source-available" | "needs-review";
  notices: string[];
};

export function getVisaGuidance(destinationCountry: unknown): VisaGuidance {
  const country = destinationCountrySchema.parse(destinationCountry);
  const source = officialVisaSourceRegistry[normalizeCountry(country)];

  return {
    destinationCountry: country,
    checks: {
      passport: "needs-passport",
      immigration: "official-check-required"
    },
    decisionProvider: "none",
    visaDecision: "not-evaluated",
    source,
    reviewStatus: source ? "official-source-available" : "needs-review",
    notices: source
      ? [
          "Use the official government source with nationality, travel purpose, and stay details.",
          "Atlas Exchange does not determine visa eligibility or application outcomes."
        ]
      : [
          "No reviewed government source is registered for this destination yet.",
          "Atlas Exchange does not determine visa eligibility or application outcomes."
        ]
  };
}

function normalizeCountry(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const aliases: Record<string, string> = {
    uk: "united kingdom",
    britain: "united kingdom",
    "great britain": "united kingdom",
    usa: "united states",
    us: "united states",
    "united states of america": "united states"
  };

  return aliases[normalized] ?? normalized;
}
