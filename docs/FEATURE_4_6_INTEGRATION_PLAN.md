# Features 4-6 Integration Plan

Created on July 10, 2026.

## Your Ownership

You own the student life readiness layer:

4. Daily Logistics
5. Smart Packing List
6. Accommodations

These should not sit as isolated tabs. They should become the practical layer that turns the rest of the exchange plan into daily decisions: where the student lives, what they can afford, what they need to bring, what they can eat, how they move around, and what deadlines they must not miss.

## Product Principle

For the hackathon, your section should answer one judge-friendly question:

```text
Once I know where I am going, can Atlas Exchange tell me how to actually live there?
```

The answer should be visible through:

- Ranked accommodation options with source links.
- Monthly budget breakdown connected to housing and lifestyle.
- Food, grocery, transport, and local area guidance.
- Packing list based on weather, activities, accommodation type, and required documents.
- Deadline items that flow into the shared deadline tracker.

## System Position

```text
Features 1-3 and 8 choose and constrain the exchange
  |
  v
Features 4-6 turn the choice into a realistic living plan
  |
  v
Feature 7 schedules the plan
  |
  v
Feature 9 enriches the student experience
```

Your layer should consume:

- Destination and partner university from Feature 8.
- Visa dates and constraints from Feature 2.
- Module schedule intensity from Feature 3.
- Cultural preferences from Feature 1.
- Activities and community interests from Feature 9.

Your layer should produce:

- `BudgetPlan`
- `AccommodationPlan`
- `PackingPlan`
- Daily logistics content inside `LocalLifePlan`
- Accommodation and packing `DeadlineItem[]`
- `SourceRef[]` for all external links and evidence

## Shared Data Flow

```text
ExchangeProfile
  |
  | selected partner, dates, budget, housing preference, diet, activities
  v
Feature 6: Accommodation
  |
  | ranked options, commute, rent estimate, tradeoffs, source refs
  v
Feature 4: Daily Logistics + Budget
  |
  | rent, food, groceries, transport, mobile, leisure, buffer
  v
Feature 5: Smart Packing
  |
  | weather, activities, accommodation type, documents, deadlines
  v
ExchangePlan
  |
  | rendered by dashboard and consumed by deadlines/demo video
  v
Feature 7: Deadlines
```

## Integration With Feature 1: Cultural Immersion

Feature 1 likely produces a cultural guide for the destination.

How it should feed you:

- Local etiquette can affect packing and daily logistics.
- Food culture can affect grocery and dining recommendations.
- Safety or neighborhood norms can affect accommodation scoring.
- Language or payment norms can affect daily logistics notes.

Contract suggestion:

```ts
export type CulturalGuide = {
  destinationCity: string;
  etiquetteTips: string[];
  foodNotes: string[];
  safetyNotes: string[];
  paymentNotes: string[];
  sourceRefIds: string[];
};
```

Your usage:

- Add foodNotes into `LocalLifePlan.foodAreas` or notes.
- Add paymentNotes into budget notes.
- Add safetyNotes into accommodation tradeoffs.
- Add etiquette/weather/activity-related items into packing recommendations when relevant.

Hackathon demo example:

- Cultural guide says London uses contactless transport heavily.
- Daily logistics adds Oyster/contactless transport note.
- Packing adds a backup bank card and travel wallet.

## Integration With Feature 2: Visa Applications

Feature 2 should retrieve official visa deadlines and requirements.

How it should feed you:

- Visa appointment dates influence travel and packing deadlines.
- Required documents become packing document items.
- Visa uncertainty should appear as warnings, not confident claims.

Contract suggestion:

```ts
export type VisaPlan = {
  visaType?: string;
  requiredDocuments: string[];
  deadlineItems: DeadlineItem[];
  sourceRefIds: string[];
  uncertaintyNotes: string[];
};
```

Your usage:

- Convert required documents into `PackingPlan.documents`.
- Merge visa-related deadline items into Feature 7.
- Show visa uncertainty in dashboard warnings.

Hackathon demo example:

- Visa module outputs passport, CAS/acceptance letter, proof of funds, insurance.
- Packing list adds these as must-bring documents.
- Deadline tracker shows document preparation before departure.

## Integration With Feature 3: Academic Module Mapping

Feature 3 handles modules, credits, syllabi, and course mapping.

How it should feed you:

- Academic workload affects daily logistics and lifestyle budget.
- Campus location affects accommodation ranking.
- Module approval deadlines affect the shared deadline list.
- Lab/studio/field modules can affect packing.

Contract suggestion:

```ts
export type ModuleMappingPlan = {
  partnerUniversityId: string;
  campusArea?: string;
  workloadIntensity: "light" | "normal" | "heavy";
  specialEquipment: string[];
  deadlineItems: DeadlineItem[];
  sourceRefIds: string[];
};
```

Your usage:

- Heavy workload reduces aggressive weekend plan suggestions.
- CampusArea improves accommodation commute scoring.
- SpecialEquipment becomes packing items.
- Module deadlines merge into Feature 7.

Hackathon demo example:

- Student chooses UCL modules near Bloomsbury.
- Accommodation scoring prefers Camden, Bloomsbury, King's Cross, or nearby transit.
- Packing adds laptop charger, adapter, notebooks, and module-specific materials.

## Feature 4: Daily Logistics Implementation Plan

Goal:

Build the practical daily living plan: food, groceries, transport, mobile, maps, and monthly costs.

Inputs:

- `ExchangeProfile`
- `PartnerUniversity`
- `AccommodationPlan`
- Optional `CulturalGuide`
- Optional `ModuleMappingPlan`
- Optional `LocalLifePlan` from Feature 9

Outputs:

- `BudgetPlan`
- Daily logistics fields in `LocalLifePlan`
- `SourceRef[]`

Core calculations:

- Rent from selected accommodation estimate.
- Food and groceries from destination city defaults plus dietary needs.
- Transport from campus area and likely commute.
- Mobile from country defaults.
- Leisure from travel style.
- Emergency buffer as a percentage of total monthly budget.

UI:

- Budget breakdown bar or compact category cards.
- Food/grocery area recommendations.
- Transport notes near campus.
- "Budget fit" signal: under budget, tight, over budget.

Demo-ready London defaults:

- Rent is the largest variable.
- Groceries and food areas should mention student-friendly neighborhoods.
- Transport should mention Tube/bus/contactless as source-labeled guidance.

## Feature 5: Smart Packing Implementation Plan

Goal:

Generate a packing list that feels personal, not generic.

Inputs:

- `ExchangeProfile`
- `PartnerUniversity`
- `AccommodationPlan`
- Optional `VisaPlan`
- Optional `ModuleMappingPlan`
- Optional weather provider output
- Planned activities

Outputs:

- `PackingPlan.essentials`
- `PackingPlan.weatherBased`
- `PackingPlan.accommodationBased`
- `PackingPlan.documents`
- Packing `DeadlineItem[]`

Rules:

- Documents are always highest priority.
- Weather-based items depend on destination and term.
- Accommodation-based items depend on school housing, shared rental, solo rental, or hotel.
- Activity-based items depend on plannedActivities.
- Module-based items depend on specialEquipment.

UI:

- Grouped checklist with priority badges.
- "Why this matters" reason per item.
- Deadline label when something must be prepared before departure.

Demo-ready London examples:

- Universal adapter.
- Waterproof jacket.
- Warm layers.
- Passport and acceptance documents.
- Medication and prescriptions.
- Comfortable shoes for walking/transit.
- Shared housing basics if accommodation preference is shared.

## Feature 6: Accommodation Implementation Plan

Goal:

Give students ranked housing options with links, tradeoffs, and budget impact.

Inputs:

- `ExchangeProfile`
- `PartnerUniversity`
- Budget constraints
- Housing preference
- Optional module campus area
- Optional cultural/safety notes

Outputs:

- `AccommodationPlan`
- Accommodation `DeadlineItem[]`
- `SourceRef[]`
- Rent estimate into `BudgetPlan`

Ranking dimensions:

- Fit to budget.
- Distance or commute to campus.
- Housing preference match.
- Provider reliability.
- Link/source quality.
- Availability confidence.
- Tradeoffs such as cost, privacy, commute, flexibility, or review needed.

Current hackathon-safe provider approach:

- Official university housing page.
- Airbnb campus/city search link.
- Agoda city/campus search link.
- Optional Trip or Booking link later.
- Label everything clearly as `live-link`, `seeded-fallback`, or `needs-review`.

UI:

- Ranked cards.
- Fit score.
- Estimated monthly cost.
- Commute estimate when available.
- Reasons and tradeoffs.
- Direct source buttons.
- Budget impact shown inline.

Demo-ready London examples:

- UCL official accommodation.
- Airbnb search near Bloomsbury.
- Agoda search near central London.
- Shared housing recommendation if the student chooses shared housing.

## Integration With Feature 7: Deadlines

Feature 7 should be the scheduler for every module.

Your features should write:

- Accommodation application deadline.
- Shortlist housing deadline.
- Booking confirmation deadline.
- Packing start deadline.
- Document scan deadline.

Deadline merge rule:

```text
All modules emit DeadlineItem[] -> Feature 7 merges by category, dueDate, urgency, and linkedFeature.
```

Priority rule:

- Visa and school accommodation deadlines outrank nice-to-have lifestyle deadlines.
- Missing exact due dates should still show as "needs review" tasks.

## Integration With Feature 8: Comparing Universities

Feature 8 chooses which university is realistic and attractive.

How it should feed you:

- Partner university metadata.
- Language.
- Cost of living.
- Campus area.
- Housing availability notes.

How you feed it back:

- Budget feasibility.
- Accommodation availability score.
- Daily logistics difficulty.
- Packing complexity.

Contract suggestion:

```ts
export type UniversityComparisonSignal = {
  partnerUniversityId: string;
  estimatedMonthlyCostSgd: number;
  accommodationDifficulty: "low" | "medium" | "high";
  dailyLogisticsDifficulty: "low" | "medium" | "high";
  notes: string[];
};
```

Hackathon demo example:

- Comparing UCL, KCL, Imperial, and LSE should show that all are London, but campus area and housing tradeoffs differ.

## Integration With Feature 9: Extra Curriculars

Feature 9 should enrich life beyond survival planning.

How it should feed you:

- Planned activities.
- Communities.
- Weekend plans.
- Partner university clubs or CCAs.

Your usage:

- Add packing items for activities.
- Add leisure cost estimates.
- Add transit/weekend budget notes.
- Include activity-specific local life recommendations.

Hackathon demo example:

- Student selects museums and weekend rail trips.
- Budget increases leisure/transport slightly.
- Packing adds comfortable walking shoes and day bag.
- Local life suggests student-friendly weekend ideas.

## End-To-End Golden Path

```text
1. Feature 8 selects London and UCL.
2. Feature 3 confirms campus/module context.
3. Feature 2 adds visa/document constraints.
4. Feature 6 ranks accommodation around UCL.
5. Feature 4 calculates budget and daily logistics from the accommodation plan.
6. Feature 5 generates packing from destination, housing, visa docs, modules, and activities.
7. Feature 7 merges all deadlines.
8. Feature 9 adds weekend and community enrichment.
9. Dashboard renders one ExchangePlan with source visibility.
```

## Build Priority

P0 for hackathon:

- Accommodation cards with official and platform links.
- Monthly budget breakdown.
- Packing checklist.
- Deadline items for accommodation and packing.
- Source refs for every external link.

P1:

- Campus-aware commute scoring.
- Activity-aware packing.
- Food/grocery map-style UI.
- Budget fit indicator.

P2:

- Real listing extraction from a search provider.
- Weather API integration.
- Persistent saved student profile.
- Multi-destination comparison scoring.

## Teammate Handoff Rules

- Every feature writes to `ExchangePlan`, not a separate private shape.
- Every external claim gets a `SourceRef`.
- Every uncertain item gets a confidence/status label.
- The dashboard should never crash if one module is missing.
- Missing module output should degrade to a clearly labeled fallback.

## Immediate Actions

1. Keep `src/lib/schema.ts` as the shared contract.
2. Add optional module extension types only when a teammate needs them.
3. Build your features 4-6 first in deterministic mode.
4. Connect them to Features 2, 3, 7, 8, and 9 through `DeadlineItem[]`, `SourceRef[]`, and `ExchangePlan`.
5. Add live providers only after the deterministic demo path is stable.
