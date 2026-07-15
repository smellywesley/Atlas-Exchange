import { z } from "zod";

import { academicYearSchema } from "./academic-year";

export type DestinationRegion =
  | "asia"
  | "europe"
  | "uk"
  | "us"
  | "south-america";

export type SourceRef = {
  id: string;
  title: string;
  url: string;
  provider: string;
  fetchedAt: string;
  snippet?: string;
  confidence: "low" | "medium" | "high";
};

export type PartnerUniversity = {
  id: string;
  name: string;
  country: string;
  city: string;
  region: DestinationRegion;
  termLabel: string;
  campusArea: string;
  heroImage: string;
  accommodationUrl: string;
  strengths: string[];
};

export const exchangeProfileInputSchema = z.object({
  partnerUniversityId: z.string().max(120).optional(),
  countryId: z.string().max(120).optional(),
  universityName: z.string().max(240).optional(),
  universityPartnership: z.enum(["university-wide", "faculty-level"]).optional(),
  monthlyBudgetSgd: z.number().min(800).max(12000),
  stayLengthMonths: z.number().min(1).max(12),
  housingPreference: z.enum(["school", "private", "shared", "solo", "hotel"]),
  travelStyle: z.enum(["budget", "balanced", "comfort"]),
  dietaryNeeds: z.array(z.string().max(120)).max(12).default([]),
  plannedActivities: z.array(z.string().max(120)).max(12).default([]),
  academicYear: z.union([
    z.literal(""),
    academicYearSchema
  ]).optional(),
  nusModuleCodes: z
    .array(
      z.string().trim().transform((value) => value.toUpperCase()).pipe(
        z.string().min(3).max(16).regex(/^[A-Z]{1,8}\d{1,6}[A-Z0-9]{0,6}$/)
      )
    )
    .max(6)
    .refine((codes) => new Set(codes).size === codes.length, "Module codes must be unique.")
    .default([]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  studentEmail: z.string().email().max(254).optional().or(z.literal(""))
}).superRefine((profile, context) => {
  if (profile.nusModuleCodes.length > 0 && !profile.academicYear) {
    context.addIssue({
      code: "custom",
      path: ["academicYear"],
      message: "Academic year is required when module codes are supplied."
    });
  }
});

export type ExchangeProfileInput = z.infer<typeof exchangeProfileInputSchema>;

export type ExchangeProfile = ExchangeProfileInput & {
  studentId?: string;
  homeUniversity: "NUS";
  destinationRegion: DestinationRegion;
  destinationCountry: string;
  destinationCity: string;
  partnerUniversityId: string;
  partnerUniversityName: string;
  startDate: string;
  endDate: string;
};

export type AccommodationOption = {
  id: string;
  title: string;
  provider: "school" | "airbnb" | "agoda" | "trip" | "booking" | "web";
  url: string;
  estimatedMonthlyCostSgd?: number;
  commuteMinutes?: number;
  fitScore?: number;
  rankingReasons: string[];
  tradeoffs: string[];
  sourceRefIds: string[];
  status: "live-link" | "seeded-fallback" | "needs-review";
};

export type AccommodationPlan = {
  rankedOptions: AccommodationOption[];
  recommendationSummary: string;
  risks: string[];
  generatedBy: "mock" | "openai" | "hybrid";
};

export type BudgetPlan = {
  monthlyEstimateSgd: number;
  basis: "planning-envelope" | "seeded-estimate" | "live-estimate";
  categories: {
    rent: number;
    food: number;
    groceries: number;
    transport: number;
    mobile: number;
    leisure: number;
    emergencyBuffer: number;
  };
  confidence: "low" | "medium" | "high";
  notes: string[];
};

export type PackingItem = {
  label: string;
  reason: string;
  priority: "must" | "recommended" | "optional";
  deadline?: string;
};

export type PackingPlan = {
  essentials: PackingItem[];
  weatherBased: PackingItem[];
  accommodationBased: PackingItem[];
  documents: PackingItem[];
};

export type DeadlineItem = {
  title: string;
  dueDate?: string;
  category: "visa" | "accommodation" | "modules" | "packing" | "travel";
  urgency: "low" | "medium" | "high";
  linkedFeature:
    | "visa"
    | "accommodation"
    | "moduleMapping"
    | "packing"
    | "travel";
  sourceRefIds: string[];
};

export type LocalLifePlan = {
  groceries: string[];
  foodAreas: string[];
  transportNotes: string[];
  weekendIdeas: string[];
  communityIdeas: string[];
  places: LocalPlaceRecommendation[];
};

export type LocalPlaceRecommendation = {
  id: string;
  title: string;
  category:
    | "groceries"
    | "food"
    | "study"
    | "health"
    | "culture"
    | "nature"
    | "nightlife"
    | "weekend";
  mapsUrl: string;
  whyRecommended: string;
  status: "live-search" | "verified-place";
  sourceRefIds: string[];
};

export type DailyLogisticsItem = {
  title: string;
  detail: string;
  timing: "arrival" | "week-one" | "ongoing";
  linkedFeature: "visa" | "accommodation" | "moduleMapping" | "budget" | "packing" | "travel" | "localLife";
  sourceRefIds: string[];
};

export type DailyLogisticsPlan = {
  arrival: DailyLogisticsItem[];
  weekOne: DailyLogisticsItem[];
  ongoing: DailyLogisticsItem[];
  parentAssurance: string[];
  openQuestions: string[];
};

export type PlanQuestionAnswer = {
  id: string;
  question: string;
  answer: string;
  confidence: "low" | "medium" | "high";
  sourceRefIds: string[];
};

export type VisaPlan = {
  destinationCountry: string;
  decision: "not-evaluated";
  reviewStatus: "official-source-available" | "needs-review";
  notices: string[];
  source?: { authority: string; title: string; url: string };
};

export type CulturePlan = {
  destinationCity: string;
  destinationCountry: string;
  reviewStatus: "reviewed" | "needs-review";
  etiquetteTips: string[];
  foodNotes: string[];
  transportNotes: string[];
  paymentNotes: string[];
  notices: string[];
  source?: { title: string; url: string };
};

export type AcademicModulePlanItem = {
  moduleCode: string;
  academicYear: string;
  title?: string;
  moduleCredit?: string;
  semesters?: number[];
  mappingStatus: "candidate-only";
  approvalRequired: true;
  lookupStatus: "not-requested" | "live" | "stale" | "unavailable";
  sourceUrl?: string;
  warning?: string;
};

export type AcademicPlan = {
  academicYear?: string;
  modules: AcademicModulePlanItem[];
  notice: string;
};

export type ExchangePlan = {
  profile: ExchangeProfile;
  partnerUniversity: PartnerUniversity;
  budget: BudgetPlan;
  accommodation: AccommodationPlan;
  packing: PackingPlan;
  deadlines: DeadlineItem[];
  localLife: LocalLifePlan;
  visa: VisaPlan;
  culture: CulturePlan;
  academics: AcademicPlan;
  dailyLogistics: DailyLogisticsPlan;
  qna: PlanQuestionAnswer[];
  sources: SourceRef[];
  generatedAt: string;
};

export type ProviderMode = "mock" | "hybrid" | "openai";

export type ProviderStatus = {
  mode: ProviderMode;
  planner: "deterministic" | "openai-ready" | "openai";
  search: "live-link" | "live-api" | "seeded-fallback";
  costControl: {
    llmCallsPerSubmit: number;
    maxSourceSnippets: number;
    maxOutputTokens: number;
    cacheRecommended: boolean;
  };
  warnings: string[];
};

export type PlanResponse = {
  plan: ExchangePlan;
  providerStatus: ProviderStatus;
};
