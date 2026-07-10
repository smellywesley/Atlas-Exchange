import type {
  AccommodationPlan,
  BudgetPlan,
  DailyLogisticsPlan,
  DeadlineItem,
  ExchangeProfile,
  LocalLifePlan,
  PackingPlan,
  PartnerUniversity,
  PlanQuestionAnswer,
  SourceRef
} from "./schema";

type LogisticsAgentInput = {
  profile: ExchangeProfile;
  partnerUniversity: PartnerUniversity;
  budget: BudgetPlan;
  accommodation: AccommodationPlan;
  packing: PackingPlan;
  deadlines: DeadlineItem[];
  localLife: LocalLifePlan;
  sources: SourceRef[];
};

type LogisticsAgentArtifacts = {
  dailyLogistics: DailyLogisticsPlan;
  qna: PlanQuestionAnswer[];
};

export function buildLogisticsAgentArtifacts(input: LogisticsAgentInput): LogisticsAgentArtifacts {
  const topAccommodation = input.accommodation.rankedOptions[0];
  const topDeadline = getTopDeadline(input.deadlines);
  const sourceIds = topAccommodation?.sourceRefIds ?? [];
  const mustPack = [
    ...input.packing.essentials,
    ...input.packing.weatherBased,
    ...input.packing.documents
  ].filter((item) => item.priority === "must");
  const budgetNote = input.budget.notes[0] ?? "Budget fit depends most on rent, commute, deposits, and first-month setup costs.";
  const city = input.profile.destinationCity;
  const campus = input.partnerUniversity.campusArea;

  const dailyLogistics: DailyLogisticsPlan = {
    arrival: [
      {
        title: `Lock the first confirmed address near ${campus}`,
        detail: topAccommodation
          ? `Start from "${topAccommodation.title}" and verify lease dates, deposit, utilities, and cancellation terms before booking.`
          : "No accommodation option is confirmed yet, so the first task is to create a verified housing shortlist.",
        timing: "arrival",
        linkedFeature: "accommodation",
        sourceRefIds: sourceIds
      },
      {
        title: `Plan the first route into ${city}`,
        detail: `Use the campus map layer to confirm airport or station arrival, late-night transport, and the safest route to ${campus}.`,
        timing: "arrival",
        linkedFeature: "travel",
        sourceRefIds: []
      },
      {
        title: "Prepare the document and payment folder",
        detail: "Keep passport, exchange letter, insurance, housing confirmation, digital payment backup, and emergency contacts available offline.",
        timing: "arrival",
        linkedFeature: "packing",
        sourceRefIds: []
      }
    ],
    weekOne: [
      {
        title: "Build the grocery and meal routine",
        detail: `Compare ${input.localLife.groceries.join(", ")} first so the student has a low-cost fallback before classes intensify.`,
        timing: "week-one",
        linkedFeature: "localLife",
        sourceRefIds: []
      },
      {
        title: "Validate commute against the selected housing option",
        detail: topAccommodation?.commuteMinutes
          ? `The current estimate is ${topAccommodation.commuteMinutes} minutes. Recheck it during peak class hours before committing.`
          : "No commute estimate is confirmed yet, so the next source pass should calculate campus commute time.",
        timing: "week-one",
        linkedFeature: "accommodation",
        sourceRefIds: sourceIds
      },
      {
        title: "Finish the high-urgency exchange tasks",
        detail: topDeadline
          ? `${topDeadline.title} is currently the highest-priority task in this plan.`
          : "No deadline has been imported yet, so teammate visa/module inputs should populate this lane.",
        timing: "week-one",
        linkedFeature: topDeadline?.linkedFeature ?? "travel",
        sourceRefIds: topDeadline?.sourceRefIds ?? []
      }
    ],
    ongoing: [
      {
        title: "Run a weekly budget check",
        detail: `${budgetNote} Current monthly estimate is SGD ${input.budget.monthlyEstimateSgd.toLocaleString()}.`,
        timing: "ongoing",
        linkedFeature: "budget",
        sourceRefIds: []
      },
      {
        title: "Keep packing tied to real conditions",
        detail: mustPack.length > 0
          ? `Priority items: ${mustPack.slice(0, 4).map((item) => item.label).join(", ")}.`
          : "Packing still needs destination-specific weather, accommodation, and document inputs.",
        timing: "ongoing",
        linkedFeature: "packing",
        sourceRefIds: []
      },
      {
        title: "Refresh housing and local-life sources",
        detail: "Accommodation, food, and transport data should be treated as time-sensitive until live provider checks are enabled.",
        timing: "ongoing",
        linkedFeature: "accommodation",
        sourceRefIds: input.sources.map((source) => source.id)
      }
    ],
    parentAssurance: [
      topAccommodation
        ? `Housing is not treated as guaranteed. The top option is ranked with a ${topAccommodation.fitScore}/100 fit score and still requires source verification.`
        : "Housing is not yet ranked, so the plan should not be presented as booking-ready.",
      `Budget is visible, but confidence is ${input.budget.confidence}; deposits and first-month setup costs should remain separate from the monthly budget.`,
      input.sources.length > 0
        ? `${input.sources.length} source cards are attached so parents can inspect where the recommendations came from.`
        : "No source cards are attached yet, so this plan is not parent-ready.",
      "Visa, insurance, emergency contacts, and official university guidance should remain explicit high-priority checks."
    ],
    openQuestions: [
      "Are official accommodation deadlines still open for this student?",
      "Does the student's visa or entry route change required documents?",
      "Does module mapping create special equipment or late-night commute requirements?",
      "Which sources were refreshed live versus carried as seeded fallback?"
    ]
  };

  return {
    dailyLogistics,
    qna: buildPlanQna(input, dailyLogistics)
  };
}

function buildPlanQna(input: LogisticsAgentInput, dailyLogistics: DailyLogisticsPlan): PlanQuestionAnswer[] {
  const topAccommodation = input.accommodation.rankedOptions[0];
  const topDeadline = getTopDeadline(input.deadlines);
  const sourceIds = topAccommodation?.sourceRefIds ?? [];
  const mustPack = [
    ...input.packing.essentials,
    ...input.packing.weatherBased,
    ...input.packing.documents
  ].filter((item) => item.priority === "must");

  return [
    {
      id: "housing-guarantee",
      question: "Is the accommodation guaranteed?",
      answer: topAccommodation
        ? `No. The current top route is "${topAccommodation.title}", but it must still be checked for availability, lease dates, deposit, and student eligibility.`
        : "No. Accommodation has not been ranked yet, so the student should not treat this as booking-ready.",
      confidence: topAccommodation ? "medium" : "low",
      sourceRefIds: sourceIds
    },
    {
      id: "what-this-week",
      question: "What should I do this week?",
      answer: topDeadline
        ? `Start with "${topDeadline.title}", then complete the arrival checklist: confirmed address, route to campus, and document/payment folder.`
        : "Start with the arrival checklist: confirmed address, route to campus, and document/payment folder.",
      confidence: topDeadline?.sourceRefIds.length ? "medium" : "low",
      sourceRefIds: topDeadline?.sourceRefIds ?? []
    },
    {
      id: "budget-fit",
      question: "Can I afford this plan?",
      answer: `The current estimate is SGD ${input.budget.monthlyEstimateSgd.toLocaleString()} per month against a SGD ${input.profile.monthlyBudgetSgd.toLocaleString()} budget. ${input.budget.notes.join(" ")}`,
      confidence: input.budget.confidence,
      sourceRefIds: []
    },
    {
      id: "packing-priority",
      question: "What should I pack first?",
      answer: mustPack.length > 0
        ? `Pack the must-have items first: ${mustPack.slice(0, 5).map((item) => item.label).join(", ")}.`
        : "Packing is not specific enough yet. Add visa, weather, accommodation, and module inputs first.",
      confidence: mustPack.length > 0 ? "medium" : "low",
      sourceRefIds: []
    },
    {
      id: "local-life",
      question: "What is around campus for daily life?",
      answer: `Start with groceries around ${input.localLife.groceries.join(", ")}, food areas around ${input.localLife.foodAreas.join(", ")}, and transport checks before committing to housing.`,
      confidence: "low",
      sourceRefIds: []
    },
    {
      id: "parent-risk",
      question: "What should a parent worry about most?",
      answer: dailyLogistics.parentAssurance.join(" "),
      confidence: "medium",
      sourceRefIds: input.sources.map((source) => source.id)
    }
  ];
}

function getTopDeadline(deadlines: DeadlineItem[]) {
  return [...deadlines].sort((a, b) => {
    const urgencyDelta = urgencyRank(b.urgency) - urgencyRank(a.urgency);
    if (urgencyDelta !== 0) {
      return urgencyDelta;
    }

    return dueTime(a.dueDate) - dueTime(b.dueDate);
  })[0];
}

function dueTime(dueDate?: string) {
  return dueDate ? new Date(dueDate).getTime() : Number.POSITIVE_INFINITY;
}

function urgencyRank(urgency: DeadlineItem["urgency"]) {
  if (urgency === "high") {
    return 3;
  }
  if (urgency === "medium") {
    return 2;
  }
  return 1;
}
