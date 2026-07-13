import { londonPartners } from "./demo-data";
import { exchangeCountries, type ExchangeCountry, type ExchangeUniversity } from "./exchange-map-data";
import { buildLogisticsAgentArtifacts } from "./logistics-agent";
import { getProviderStatus } from "./provider-status";
import { searchLondonAccommodation } from "./search-provider";
import type {
  BudgetPlan,
  DeadlineItem,
  ExchangePlan,
  ExchangeProfile,
  ExchangeProfileInput,
  LocalLifePlan,
  PackingPlan
} from "./schema";

const regionLabels = {
  asia: "Asia",
  europe: "Europe",
  uk: "UK",
  us: "North America",
  "south-america": "South America"
} as const;

export function buildLondonPlan(input: ExchangeProfileInput): ExchangePlan {
  const partnerUniversity =
    londonPartners.find((partner) => partner.id === input.partnerUniversityId) ??
    londonPartners[0];
  const accommodationSearch = searchLondonAccommodation({
    ...input,
    partnerUniversity
  });
  const profile: ExchangeProfile = {
    ...input,
    homeUniversity: "NUS",
    destinationRegion: "uk",
    destinationCountry: "United Kingdom",
    destinationCity: "London",
    partnerUniversityId: partnerUniversity.id,
    partnerUniversityName: partnerUniversity.name,
    startDate: input.startDate ?? "",
    endDate: input.endDate ?? ""
  };

  const budget = buildBudget(
    input.monthlyBudgetSgd,
    accommodationSearch.options[0]?.estimatedMonthlyCostSgd,
    partnerUniversity.city
  );
  const packing = buildPacking(input);
  const deadlines = buildDeadlines(partnerUniversity);
  const localLife = buildLocalLife(partnerUniversity);
  const planSources = [
    ...accommodationSearch.sources,
    buildMapsDiscoverySource(partnerUniversity.city, partnerUniversity.name, `src-${partnerUniversity.id}-local-life`)
  ];
  const accommodation = {
    rankedOptions: accommodationSearch.options,
    recommendationSummary:
      `Apply for ${partnerUniversity.name} housing first, keep a purpose-built student room as the backup, and use Airbnb or Agoda only as an arrival buffer.`,
    risks: [
      "London housing changes quickly, so external links need manual verification before booking.",
      "Private rentals can require deposits, guarantors, or longer leases than an exchange semester."
    ],
    generatedBy: "mock" as const
  };
  const logisticsAgent = buildLogisticsAgentArtifacts({
    profile,
    partnerUniversity,
    budget,
    accommodation,
    packing,
    deadlines,
    localLife,
    sources: planSources
  });

  return {
    profile,
    partnerUniversity,
    budget,
    accommodation,
    packing,
    deadlines,
    localLife,
    dailyLogistics: logisticsAgent.dailyLogistics,
    qna: logisticsAgent.qna,
    sources: planSources,
    generatedAt: new Date().toISOString()
  };
}

export function buildLondonPlanResponse(input: ExchangeProfileInput) {
  const providerStatus = getProviderStatus();
  const plan = buildLondonPlan(input);

  return {
    plan,
    providerStatus
  };
}

export function buildAtlasPlanResponse(
  country: ExchangeCountry,
  university: ExchangeUniversity,
  input: ExchangeProfileInput
) {
  const londonPartner = londonPartners.find((partner) => partner.name === university.name);

  if (country.id === "united-kingdom" && londonPartner) {
    return buildLondonPlanResponse({
      ...input,
      partnerUniversityId: londonPartner.id
    });
  }

  const providerStatus = getProviderStatus();
  const partnerUniversity = {
    id: slugify(`${country.id}-${university.name}`),
    name: university.name,
    country: country.name,
    city: university.city,
    region: country.region,
    termLabel: "Semester exchange",
    campusArea: university.city,
    heroImage: "",
    accommodationUrl: buildSearchUrl(`${university.name} ${university.city} student accommodation`)
  };
  const profile: ExchangeProfile = {
    ...input,
    homeUniversity: "NUS",
    destinationRegion: country.region,
    destinationCountry: country.name,
    destinationCity: university.city,
    partnerUniversityId: partnerUniversity.id,
    partnerUniversityName: university.name,
    startDate: input.startDate ?? "",
    endDate: input.endDate ?? ""
  };
  const packing = buildDestinationPacking(input, country);
  const deadlines = buildDestinationDeadlines(university);
  const sources = buildDestinationSources(country, university);
  const localLife = buildDestinationLocalLife(country, university);
  const rankedOptions = buildDestinationAccommodation(country, university);
  const accommodation = {
    rankedOptions,
    recommendationSummary:
      `Start with ${university.name} housing guidance, then compare verified student accommodation near ${university.city} before short-stay buffers.`,
    risks: [
      "This global path uses live-link accommodation discovery until each country connector is wired.",
      "Final booking checks should confirm lease length, deposit, commute, and student eligibility."
    ],
    generatedBy: "mock" as const
  };
  const budget = buildBudget(
    input.monthlyBudgetSgd,
    rankedOptions[0]?.estimatedMonthlyCostSgd,
    university.city
  );
  const fullPartnerUniversity = {
    ...partnerUniversity,
    strengths: [
      `${regionLabels[country.region]} exchange path`,
      country.focusLabel,
      university.partnership === "faculty-level" ? "Faculty-level route" : "University-wide route"
    ]
  };
  const logisticsAgent = buildLogisticsAgentArtifacts({
    profile,
    partnerUniversity: fullPartnerUniversity,
    budget,
    accommodation,
    packing,
    deadlines,
    localLife,
    sources
  });

  return {
    plan: {
      profile,
      partnerUniversity: fullPartnerUniversity,
      budget,
      accommodation,
      packing,
      deadlines,
      localLife,
      dailyLogistics: logisticsAgent.dailyLogistics,
      qna: logisticsAgent.qna,
      sources,
      generatedAt: new Date().toISOString()
    },
    providerStatus
  };
}

export function buildPlanResponseForInput(input: ExchangeProfileInput) {
  const londonPartner = londonPartners.find((partner) => partner.id === input.partnerUniversityId);
  const universityName = input.universityName ?? londonPartner?.name;
  const country = input.countryId
    ? exchangeCountries.find((item) => item.id === input.countryId)
    : exchangeCountries.find((item) =>
        item.universities.some((university) => university.name === universityName)
      );

  if (!country) {
    throw new DestinationResolutionError("The selected destination country is not available.");
  }

  const university = country.universities.find((item) =>
    item.name === universityName &&
    (!input.universityPartnership || item.partnership === input.universityPartnership)
  );

  if (!university) {
    throw new DestinationResolutionError(
      `${universityName ?? "The selected university"} is not a partner university in ${country.name}.`
    );
  }

  return buildAtlasPlanResponse(country, university, input);
}

export class DestinationResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DestinationResolutionError";
  }
}

function buildBudget(
  monthlyBudgetSgd: number,
  rentEstimateSgd: number | undefined,
  destinationCity: string
): BudgetPlan {
  const rent = rentEstimateSgd ?? Math.round(monthlyBudgetSgd * 0.5);
  const food = Math.round(monthlyBudgetSgd * 0.16);
  const groceries = Math.round(monthlyBudgetSgd * 0.13);
  const transport = Math.round(monthlyBudgetSgd * 0.08);
  const mobile = 35;
  const leisure = Math.round(monthlyBudgetSgd * 0.06);
  const emergencyBuffer = Math.max(
    0,
    monthlyBudgetSgd - rent - food - groceries - transport - mobile - leisure
  );

  return {
    monthlyEstimateSgd:
      rent + food + groceries + transport + mobile + leisure + emergencyBuffer,
    categories: {
      rent,
      food,
      groceries,
      transport,
      mobile,
      leisure,
      emergencyBuffer
    },
    basis: rentEstimateSgd ? "seeded-estimate" : "planning-envelope",
    confidence: rentEstimateSgd ? "medium" : "low",
    notes: [
      rentEstimateSgd
        ? `The ${destinationCity} estimate uses a seeded rent value and still needs a live listing check.`
        : `This is a spending envelope for ${destinationCity}, not a market-price estimate. Housing cost is unknown until a source is verified.`,
      emergencyBuffer < 180
        ? "This budget is tight after rent and essentials. Treat deposits and first-month rent as separate pre-departure cash needs."
        : "Emergency buffer is kept visible because deposits and first-month rent can land together."
    ]
  };
}

function buildPacking(input: ExchangeProfileInput): PackingPlan {
  return {
    essentials: [
      {
        label: "Passport and entry documents",
        reason: "Keep physical and digital copies for arrival checks and university registration.",
        priority: "must",
        deadline: "Before visa and flight booking"
      },
      {
        label: "Universal adapter with UK plug support",
        reason: "London uses Type G plugs and student rooms may have limited sockets.",
        priority: "must"
      }
    ],
    weatherBased: [
      {
        label: "Waterproof outer layer",
        reason: "Autumn and winter London planning needs rain protection more than heavy snow gear.",
        priority: "must"
      },
      {
        label: "Layerable knitwear",
        reason: "Works across lecture halls, outdoor commutes, and weekend trips.",
        priority: input.travelStyle === "budget" ? "recommended" : "must"
      }
    ],
    accommodationBased: [
      {
        label: "Compact laundry kit",
        reason: "Shared housing and halls often need paid laundry planning.",
        priority: "recommended"
      },
      {
        label: "Foldable tote and food containers",
        reason: "Supports grocery-led budgeting when eating out gets expensive.",
        priority: "recommended"
      }
    ],
    documents: [
      {
        label: "Accommodation confirmation",
        reason: "Needed for arrival, banking, and some university checks.",
        priority: "must",
        deadline: "Before departure"
      },
      {
        label: "Module approval records",
        reason: "Keeps academic mapping defensible if approvals are questioned.",
        priority: "must"
      }
    ]
  };
}

function buildDeadlines(partnerUniversity: { id: string; name: string }): DeadlineItem[] {
  return [
    {
      title: `Confirm ${partnerUniversity.name} housing eligibility`,
      dueDate: undefined,
      category: "accommodation",
      urgency: "high",
      linkedFeature: "accommodation",
      sourceRefIds: [`src-${partnerUniversity.id}-halls`]
    },
    {
      title: "Prepare visa document folder",
      dueDate: undefined,
      category: "visa",
      urgency: "high",
      linkedFeature: "visa",
      sourceRefIds: []
    },
    {
      title: "Freeze module mapping worksheet",
      dueDate: undefined,
      category: "modules",
      urgency: "medium",
      linkedFeature: "moduleMapping",
      sourceRefIds: []
    },
    {
      title: "Run final packing pass",
      dueDate: undefined,
      category: "packing",
      urgency: "medium",
      linkedFeature: "packing",
      sourceRefIds: []
    }
  ];
}

function buildLocalLife(partnerUniversity: { id: string; name: string; city: string; campusArea: string }): LocalLifePlan {
  return {
    groceries: ["Tesco", "Sainsbury's", "Lidl", "Waitrose for occasional top-ups"],
    foodAreas: ["Bloomsbury", "Soho", "Camden", "Borough Market"],
    transportNotes: [
      "Use contactless payment first, then compare student railcards after arrival.",
      "Prioritize housing near an Underground or Elizabeth line station."
    ],
    weekendIdeas: ["Oxford", "Cambridge", "Brighton", "Edinburgh by train if budget allows"],
    communityIdeas: [
      "Singapore Society events",
      "University international student welcome week",
      "Faculty societies tied to module mapping"
    ],
    places: buildLocalPlaceSearches(
      partnerUniversity.city,
      partnerUniversity.name,
      `src-${partnerUniversity.id}-local-life`
    )
  };
}

function buildDestinationAccommodation(
  country: ExchangeCountry,
  university: ExchangeUniversity
) {
  const cityQuery = encodeURIComponent(`${university.city} student accommodation ${university.name}`);

  return [
    {
      id: `${slugify(university.name)}-school`,
      title: `${university.name} housing and exchange guidance`,
      provider: "school" as const,
      url: university.sourceUrl ?? buildSearchUrl(`${university.name} exchange housing ${university.city}`),
      estimatedMonthlyCostSgd: undefined,
      commuteMinutes: undefined,
      fitScore: undefined,
      rankingReasons: [`Lowest uncertainty because this starts from ${university.name} or NUS partner guidance.`],
      tradeoffs: ["Availability and eligibility still need confirmation."],
      sourceRefIds: [`src-${slugify(university.name)}-partner`],
      status: "live-link" as const
    },
    {
      id: `${slugify(university.name)}-student-housing`,
      title: `Student accommodation search near ${university.city}`,
      provider: "web" as const,
      url: `https://www.google.com/search?q=${cityQuery}`,
      estimatedMonthlyCostSgd: undefined,
      commuteMinutes: undefined,
      fitScore: undefined,
      rankingReasons: ["Good backup path when school housing is unavailable or timing is tight."],
      tradeoffs: ["Needs manual comparison of utilities, deposits, and contract length."],
      sourceRefIds: [`src-${slugify(country.id)}-housing-search`],
      status: "live-link" as const
    },
    {
      id: `${slugify(university.name)}-arrival-buffer`,
      title: `Short-stay arrival buffer in ${university.city}`,
      provider: "airbnb" as const,
      url: `https://www.airbnb.com/s/${encodeURIComponent(university.city)}/homes`,
      estimatedMonthlyCostSgd: undefined,
      commuteMinutes: undefined,
      fitScore: undefined,
      rankingReasons: ["Useful for the first one to two weeks while inspecting long-stay options."],
      tradeoffs: ["Usually too expensive for the whole semester."],
      sourceRefIds: [`src-${slugify(country.id)}-arrival-buffer`],
      status: "live-link" as const
    }
  ];
}

function buildDestinationPacking(
  input: ExchangeProfileInput,
  country: ExchangeCountry
): PackingPlan {
  const climateItem =
    country.template === "mountain"
      ? "Thermal layers and waterproof shoes"
      : country.template === "coastal"
        ? "Rain shell and compact umbrella"
        : country.template === "heritage"
          ? "Comfortable city-walking shoes"
          : "Transit-friendly day bag";

  return {
    essentials: [
      {
        label: "Passport, exchange letter, and insurance",
        reason: `Keeps the ${country.name} arrival and campus registration path defensible.`,
        priority: "must",
        deadline: "Before visa and flight booking"
      },
      {
        label: "Digital copies of NUS partner documents",
        reason: "Useful when housing, banking, or campus offices ask for proof quickly.",
        priority: "must"
      }
    ],
    weatherBased: [
      {
        label: climateItem,
        reason: country.logisticsAngle,
        priority: "must"
      },
      {
        label: "Layerable lecture outfit set",
        reason: "Works across classrooms, commutes, and weekend travel.",
        priority: input.travelStyle === "budget" ? "recommended" : "must"
      }
    ],
    accommodationBased: [
      {
        label: "Compact laundry and bedding checklist",
        reason: "Student housing rules vary by country and room type.",
        priority: "recommended"
      },
      {
        label: "Portable payment and SIM setup notes",
        reason: "Arrival friction usually comes from local payment, mobile data, and transport cards.",
        priority: "recommended"
      }
    ],
    documents: [
      {
        label: "Accommodation confirmation",
        reason: "Needed for arrival checks and some university processes.",
        priority: "must",
        deadline: "Before departure"
      },
      {
        label: "Module mapping records",
        reason: "Keeps academic approvals traceable.",
        priority: "must"
      }
    ]
  };
}

function buildDestinationDeadlines(university: ExchangeUniversity): DeadlineItem[] {
  return [
    {
      title: `Confirm ${university.name} housing route`,
      dueDate: undefined,
      category: "accommodation",
      urgency: "high",
      linkedFeature: "accommodation",
      sourceRefIds: [`src-${slugify(university.name)}-partner`]
    },
    {
      title: "Check visa or entry document requirements",
      dueDate: undefined,
      category: "visa",
      urgency: "high",
      linkedFeature: "visa",
      sourceRefIds: []
    },
    {
      title: "Freeze module mapping worksheet",
      dueDate: undefined,
      category: "modules",
      urgency: "medium",
      linkedFeature: "moduleMapping",
      sourceRefIds: []
    },
    {
      title: "Run final country-specific packing pass",
      dueDate: undefined,
      category: "packing",
      urgency: "medium",
      linkedFeature: "packing",
      sourceRefIds: []
    }
  ];
}

function buildDestinationLocalLife(
  country: ExchangeCountry,
  university: ExchangeUniversity
): LocalLifePlan {
  const city = university.city;
  return {
    groceries: ["Campus stores", "Neighborhood supermarkets", "Budget meal districts"],
    foodAreas: [city, "Campus district", "Main station area"],
    transportNotes: [
      country.logisticsAngle,
      "Choose accommodation by commute reliability first, then optimize rent."
    ],
    weekendIdeas: [
      `${city} orientation weekend`,
      `${country.name} rail or city pass day trip`,
      "Partner university student society events"
    ],
    communityIdeas: [
      "Exchange buddy meetup",
      "NUS or Singapore student networks",
      "Faculty-specific welcome sessions"
    ],
    places: buildLocalPlaceSearches(
      city,
      university.name,
      `src-${slugify(country.id)}-local-life`
    )
  };
}

function buildDestinationSources(country: ExchangeCountry, university: ExchangeUniversity) {
  const fetchedAt = new Date().toISOString();
  return [
    {
      id: `src-${slugify(university.name)}-partner`,
      title: `${university.name} exchange partner reference`,
      url: university.sourceUrl ?? buildSearchUrl(`NUS exchange ${university.name} ${country.name}`),
      provider: "NUS / partner",
      fetchedAt,
      snippet: `${university.partnership} pathway for ${university.city}, ${country.name}.`,
      confidence: university.sourceUrl ? "high" as const : "medium" as const
    },
    {
      id: `src-${slugify(country.id)}-housing-search`,
      title: `${university.city} accommodation discovery`,
      url: buildSearchUrl(`${university.city} student accommodation ${university.name}`),
      provider: "Live-link search",
      fetchedAt,
      snippet: "Search link retained so judges can see the path is ready for live accommodation connectors.",
      confidence: "medium" as const
    },
    {
      id: `src-${slugify(country.id)}-arrival-buffer`,
      title: `${university.city} short-stay arrival buffer`,
      url: `https://www.airbnb.com/s/${encodeURIComponent(university.city)}/homes`,
      provider: "Airbnb live-link search",
      fetchedAt,
      snippet: "Short-stay link kept as a buffer path only; availability, price, and lease suitability need manual verification.",
      confidence: "low" as const
    },
    buildMapsDiscoverySource(
      university.city,
      university.name,
      `src-${slugify(country.id)}-local-life`
    )
  ];
}

function buildMapsDiscoverySource(city: string, universityName: string, id: string) {
  return {
    id,
    title: `${city} local-life discovery around ${universityName}`,
    url: buildMapsSearchUrl(`student essentials and things to do near ${universityName} ${city}`),
    provider: "Google Maps live search",
    fetchedAt: new Date().toISOString(),
    snippet: "Live search links for local essentials and activities. Names, ratings, prices, and opening hours must be checked in Maps.",
    confidence: "low" as const
  };
}

function buildLocalPlaceSearches(city: string, universityName: string, sourceId: string) {
  const searches = [
    ["Budget supermarkets", "groceries", "budget supermarkets"],
    ["Asian groceries", "groceries", "Asian grocery stores"],
    ["Affordable student meals", "food", "affordable student restaurants"],
    ["Vegetarian food", "food", "vegetarian restaurants"],
    ["Halal food", "food", "halal restaurants"],
    ["Study cafes", "study", "quiet study cafes"],
    ["Public libraries", "study", "public libraries"],
    ["Pharmacies", "health", "pharmacies"],
    ["Walk-in clinics", "health", "walk in clinics"],
    ["Museums", "culture", "top museums"],
    ["Art galleries", "culture", "art galleries"],
    ["Historic places", "culture", "historic attractions"],
    ["Local markets", "culture", "local markets"],
    ["Parks", "nature", "parks"],
    ["Walking trails", "nature", "walking trails"],
    ["Live music", "nightlife", "live music venues"],
    ["Student nightlife", "nightlife", "student nightlife"],
    ["Weekend day trips", "weekend", "best day trips"],
    ["Sports and recreation", "weekend", "student sports and recreation"],
    ["Free things to do", "weekend", "free things to do"]
  ] as const;

  return searches.map(([title, category, query], index) => ({
    id: `${slugify(universityName)}-local-${index + 1}`,
    title,
    category,
    mapsUrl: buildMapsSearchUrl(`${query} near ${universityName} ${city}`),
    whyRecommended: `Open live Maps results for ${query} around the selected campus.`,
    status: "live-search" as const,
    sourceRefIds: [sourceId]
  }));
}

function buildMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
}

function buildSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
