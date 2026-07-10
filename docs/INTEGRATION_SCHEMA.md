# Atlas Exchange Integration Schema

This schema is the contract between the London demo UI, the agent layer, and teammate modules.

```ts
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

export type ExchangeProfile = {
  studentId?: string;
  homeUniversity: "NUS";
  destinationRegion: DestinationRegion;
  destinationCountry: string;
  destinationCity: string;
  partnerUniversityId: string;
  partnerUniversityName: string;
  startDate: string;
  endDate: string;
  stayLengthMonths: number;
  monthlyBudgetSgd: number;
  housingPreference: "school" | "private" | "shared" | "solo" | "hotel";
  travelStyle: "budget" | "balanced" | "comfort";
  dietaryNeeds: string[];
  plannedActivities: string[];
};

export type AccommodationOption = {
  id: string;
  title: string;
  provider: "school" | "airbnb" | "agoda" | "trip" | "booking" | "web";
  url: string;
  estimatedMonthlyCostSgd?: number;
  commuteMinutes?: number;
  fitScore: number;
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
};

export type ExchangePlan = {
  profile: ExchangeProfile;
  partnerUniversity: PartnerUniversity;
  budget: BudgetPlan;
  accommodation: AccommodationPlan;
  packing: PackingPlan;
  deadlines: DeadlineItem[];
  localLife: LocalLifePlan;
  sources: SourceRef[];
  generatedAt: string;
};
```

## API Routes

### `POST /api/plan`

Input: `ExchangeProfile`

Output:

```ts
{
  plan: ExchangePlan;
  mode: "mock" | "openai" | "hybrid";
  warnings: string[];
}
```

Behavior:

- If `OPENAI_API_KEY` is missing, return deterministic mock output.
- If search credentials are missing, return live-link templates and seeded fallbacks.
- Never fail the whole dashboard because one provider fails.

### `GET /api/search/accommodation`

Query:

```ts
{
  city: string;
  university: string;
  partnerUniversityId: string;
  budgetSgd: string;
  housingPreference: string;
}
```

Output:

```ts
{
  results: AccommodationOption[];
  sources: SourceRef[];
  warnings: string[];
}
```

## Provider Contract

```ts
export type SearchProvider = {
  name: string;
  searchAccommodation(profile: ExchangeProfile): Promise<{
    options: AccommodationOption[];
    sources: SourceRef[];
    warnings: string[];
  }>;
};
```

Initial providers:

- `MockSearchProvider` for deterministic demo fallback.
- `LiveLinkSearchProvider` for platform search URLs and source cards.
- Future: SerpAPI, Tavily, Exa, Firecrawl, or Webscraping AI provider.

## Agent Architecture Notes

- Agent prompts do not own truth. Schema validation owns truth.
- Tool/search outputs are preserved as `SourceRef`.
- LLM synthesis can rank and explain, but cannot invent provider URLs.
- Any fallback result must be labeled `seeded-fallback`.
- Deadlines from teammate modules merge by category and urgency.
