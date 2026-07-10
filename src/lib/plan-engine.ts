import { londonPartners } from "./demo-data";
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
    startDate: "2026-09-15",
    endDate: "2027-01-15"
  };

  const budget = buildBudget(input.monthlyBudgetSgd);
  const packing = buildPacking(input);
  const deadlines = buildDeadlines(partnerUniversity);
  const localLife = buildLocalLife();

  return {
    profile,
    partnerUniversity,
    budget,
    accommodation: {
      rankedOptions: accommodationSearch.options,
      recommendationSummary:
        `Apply for ${partnerUniversity.name} housing first, keep a purpose-built student room as the backup, and use Airbnb or Agoda only as an arrival buffer.`,
      risks: [
        "London housing changes quickly, so external links need manual verification before booking.",
        "Private rentals can require deposits, guarantors, or longer leases than an exchange semester."
      ],
      generatedBy: "mock"
    },
    packing,
    deadlines,
    localLife,
    sources: accommodationSearch.sources,
    generatedAt: new Date("2026-07-09T00:00:00.000Z").toISOString()
  };
}

export function buildLondonPlanResponse(input: ExchangeProfileInput) {
  const providerStatus = getProviderStatus();
  const plan = buildLondonPlan(input);

  plan.accommodation.generatedBy =
    providerStatus.mode === "openai" ? "hybrid" : providerStatus.mode;

  return {
    plan,
    providerStatus
  };
}

function buildBudget(monthlyBudgetSgd: number): BudgetPlan {
  const rent = Math.round(monthlyBudgetSgd * 0.5);
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
    confidence: "medium",
    notes: [
      "Rent dominates London planning. Lock housing before optimizing food or weekend budgets.",
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
      dueDate: "2026-07-22",
      category: "accommodation",
      urgency: "high",
      linkedFeature: "accommodation",
      sourceRefIds: [`src-${partnerUniversity.id}-halls`]
    },
    {
      title: "Prepare visa document folder",
      dueDate: "2026-08-01",
      category: "visa",
      urgency: "high",
      linkedFeature: "visa",
      sourceRefIds: []
    },
    {
      title: "Freeze module mapping worksheet",
      dueDate: "2026-08-12",
      category: "modules",
      urgency: "medium",
      linkedFeature: "moduleMapping",
      sourceRefIds: []
    },
    {
      title: "Run final packing pass",
      dueDate: "2026-09-08",
      category: "packing",
      urgency: "medium",
      linkedFeature: "packing",
      sourceRefIds: []
    }
  ];
}

function buildLocalLife(): LocalLifePlan {
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
    ]
  };
}
