import type { AccommodationOption, PartnerUniversity, SourceRef } from "./schema";

type SearchInput = {
  monthlyBudgetSgd: number;
  housingPreference: string;
  partnerUniversity: PartnerUniversity;
};

const fetchedAt = new Date("2026-07-09T00:00:00.000Z").toISOString();

function searchUrl(base: string, query: string) {
  return `${base}${encodeURIComponent(query)}`;
}

export function searchLondonAccommodation(input: SearchInput): {
  options: AccommodationOption[];
  sources: SourceRef[];
  warnings: string[];
} {
  const campusQuery = `${input.partnerUniversity.campusArea} London student accommodation`;
  const monthlyQuery = `${input.partnerUniversity.campusArea} London monthly stay student room`;
  const sources: SourceRef[] = [
    {
      id: `src-${input.partnerUniversity.id}-halls`,
      title: `${input.partnerUniversity.name} accommodation portal`,
      url: input.partnerUniversity.accommodationUrl,
      provider: "school",
      fetchedAt,
      snippet: `University-run accommodation entry point for ${input.partnerUniversity.name} students.`,
      confidence: "high"
    },
    {
      id: "src-unite-london",
      title: "Unite Students London search",
      url: "https://www.unitestudents.com/london",
      provider: "web",
      fetchedAt,
      snippet: `Purpose-built student accommodation listings near ${input.partnerUniversity.campusArea} and wider London.`,
      confidence: "medium"
    },
    {
      id: `src-airbnb-${input.partnerUniversity.id}`,
      title: "Airbnb London monthly stay search",
      url: searchUrl("https://www.airbnb.com/s/", monthlyQuery),
      provider: "airbnb",
      fetchedAt,
      snippet: `Marketplace search link for homes and rooms around ${input.partnerUniversity.campusArea}.`,
      confidence: "medium"
    },
    {
      id: "src-agoda-london",
      title: "Agoda London monthly stays",
      url: searchUrl("https://www.agoda.com/search?city=233&textToSearch=", campusQuery),
      provider: "agoda",
      fetchedAt,
      snippet: `Short stay and apartment-style listing search near ${input.partnerUniversity.campusArea}.`,
      confidence: "medium"
    }
  ];

  const budgetFit = input.monthlyBudgetSgd >= 2500 ? 92 : 88;
  const preferenceBoost = input.housingPreference === "school" ? 6 : 0;

  const options: AccommodationOption[] = [
    {
      id: "ucl-halls",
      title: `Apply for ${input.partnerUniversity.name} housing first`,
      provider: "school",
      url: sources[0].url,
      estimatedMonthlyCostSgd: 1850,
      commuteMinutes: 12,
      fitScore: Math.min(96, budgetFit + preferenceBoost),
      rankingReasons: [
        "Lowest uncertainty because the housing path is university-run.",
        "Short commute to Bloomsbury reduces transport and late-night safety risk.",
        "Best fit if application deadlines are still open."
      ],
      tradeoffs: [
        "Availability can close quickly.",
        "Room type choice may be limited for exchange students."
      ],
      sourceRefIds: [sources[0].id],
      status: "live-link"
    },
    {
      id: `unite-${input.partnerUniversity.id}`,
      title: `Purpose-built student room near ${input.partnerUniversity.campusArea}`,
      provider: "web",
      url: sources[1].url,
      estimatedMonthlyCostSgd: 2250,
      commuteMinutes: 20,
      fitScore: 84,
      rankingReasons: [
        "Student-specific accommodation usually has clearer utilities and contract terms.",
        "Commute remains realistic for UCL, King's, and LSE.",
        "Good fallback if university halls are full."
      ],
      tradeoffs: [
        "Often more expensive than a shared private flat.",
        "Contract dates may not match exchange dates perfectly."
      ],
      sourceRefIds: ["src-unite-london"],
      status: "live-link"
    },
    {
      id: "airbnb-shared",
      title: `Shared private room search near ${input.partnerUniversity.campusArea}`,
      provider: "airbnb",
      url: sources[2].url,
      estimatedMonthlyCostSgd: 2600,
      commuteMinutes: 28,
      fitScore: 73,
      rankingReasons: [
        "Flexible dates help if the exchange term does not match academic housing.",
        "Useful for short buffer stays before permanent housing begins."
      ],
      tradeoffs: [
        "Listings change quickly and need manual verification.",
        "Service fees can move the real monthly cost above budget."
      ],
      sourceRefIds: [sources[2].id],
      status: "live-link"
    },
    {
      id: "agoda-buffer",
      title: "Two-week arrival buffer near campus",
      provider: "agoda",
      url: sources[3].url,
      estimatedMonthlyCostSgd: 3600,
      commuteMinutes: 18,
      fitScore: 61,
      rankingReasons: [
        "Strong emergency option if permanent housing is not confirmed before departure.",
        "Good for the first arrival window while viewing flats."
      ],
      tradeoffs: [
        "Too expensive as a full-semester plan.",
        "Should be treated as a buffer, not the primary housing path."
      ],
      sourceRefIds: ["src-agoda-london"],
      status: "live-link"
    }
  ];

  return {
    options,
    sources,
    warnings: [
      "Search provider is currently live-link mode. It returns source URLs and ranked planning guidance, not scraped listing internals."
    ]
  };
}
