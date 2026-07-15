# Features 4-6 Product Audit

Date: 2026-07-12

Status: NOT READY for emailed or downloadable plans

## 2026-07-14 Remediation Addendum

The confirmed destination-integrity failures below have been fixed: Stanford no longer receives London language, Oxford no longer falls back to UCL, the intake heading follows the selected destination, and unsupported deadlines no longer pretend to have exact dates. PDF and allowlisted demo email now regenerate the selected plan server-side.

The audit is still correct about the remaining provider gaps. Global accommodation results are discovery links rather than verified listings; market rent, commute, availability, weather, and place facts must not be presented as sourced until licensed providers are connected. Public report delivery also remains blocked on recipient ownership verification and shared rate limiting. The current verdict is therefore: READY FOR A CONTROLLED SINGLE-INSTANCE HACKATHON DEMO, NOT READY FOR PUBLIC PRODUCTION.

## Verdict

The current app is a strong interactive prototype, but features 4-6 are still presentation-first rather than decision-ready. The same `ExchangePlan` shape connects accommodation, budget, packing, local life, and Q&A, which is the right foundation. However, several generated values are fixed, derived from the user's own budget, or backed only by generic search links.

The export and email layer must wait until destination integrity, evidence coverage, and plan versioning are fixed. A polished PDF containing the wrong city or invented price would damage trust more than having no PDF.

## Confirmed P0 Failures

1. Stanford produces the budget note: "Rent dominates London planning."
2. Selecting the University of Oxford produces a University College London plan located in London.
3. The intake heading remains "London exchange requirements" after another university is selected.
4. Start and end dates are fixed instead of being supplied by the student or partner term.
5. Deadline dates are fixed and are not tied to official source references.

## Feature 4: Daily Logistics

Score: 3/10

What works:

- Arrival, week-one, ongoing, and parent-assurance sections exist.
- Accommodation, budget, packing, deadlines, and local life share one plan object.
- The campus map and Google Maps search links create a useful discovery surface.

What is missing:

- The plan does not contain a real daily or weekly schedule.
- Grocery, food, transport, and study recommendations are generic labels, not named places.
- Local-life items have no opening hours, rating count, price level, walking duration, route, or source reference.
- The budget is allocated as percentages of the user's budget, so it cannot independently determine whether the destination is affordable.
- Most daily-logistics items show zero source references.

Required acceptance criteria:

- Every named place has a Maps link, source reference, fetched time, and location.
- Every commute claim has a route mode, duration, distance, and checked time.
- Monthly cost is calculated from sourced estimates, then compared with the student's budget.
- The planner returns `under-budget`, `tight`, or `over-budget` with a visible explanation.
- The first-week plan includes arrival, SIM/payment, groceries, transport, campus registration, and emergency setup.

## Feature 5: Smart Packing

Score: 4/10

What works:

- Packing is grouped into essentials, weather, accommodation, and documents.
- Every item has a reason and priority.

What is missing:

- No live or historical weather source is connected.
- Dates and season are fixed, so climate recommendations can be wrong.
- Housing amenities are not checked before recommending bedding, laundry, or kitchen items.
- Dietary needs and planned activities exist in the API shape but cannot be entered in the UI.
- Module equipment, medication, airline baggage limits, and restricted items are not represented.
- Packing items do not carry source references.

Required acceptance criteria:

- Weather recommendations use destination, stay dates, and a named weather source.
- Housing-based items use the selected accommodation's included amenities.
- Activities and module requirements alter the list.
- The student can check items, mark them not applicable, and regenerate without losing progress.
- Document items link to visa, insurance, university, or module evidence.

## Feature 6: Accommodation

Score: 2/10

What works:

- Options have links, ranking reasons, tradeoffs, fit score, cost, commute, and status.
- Official university housing is positioned above short-stay platforms.

What is missing:

- Global options are search links, not verified listings.
- Global rent is derived from the user's budget, not from the market.
- Commute values are fixed constants.
- Fit scores are fixed or lightly adjusted, so they imply precision without evidence.
- Availability, deposit, utilities, lease dates, cancellation, and eligibility are not verified.
- UK universities outside the four London partners fall back to UCL.

Required acceptance criteria:

- A result is clearly one of `verified-listing`, `official-housing`, `live-search-link`, or `needs-review`.
- Estimated cost identifies currency, billing period, utilities, deposit, and fetched time.
- Ranking is reproducible from visible dimensions, not a hardcoded score.
- Commute uses the selected listing location and campus coordinates.
- No university can fall back to another institution silently.

## Source Strategy

The current three or four source cards are not enough. Source count alone is also the wrong target. The target should be coverage of every decision-relevant claim.

Tier 1, official and required:

- NUS partner university reference
- Partner university exchange and accommodation pages
- Government immigration or embassy guidance
- Official university academic calendar and housing deadlines
- Official transit operator where available

Tier 2, live operational data:

- Google Places for named groceries, restaurants, pharmacies, cafes, attractions, and Maps links
- Google Routes for walking and transit duration
- Weather provider for dated packing recommendations
- Accommodation provider or official housing listing data when terms permit it

Tier 3, discovery only:

- Google Search, Airbnb search pages, Agoda search pages, travel editorial pages, and community recommendations
- These can create leads but cannot support a verified price, availability, deadline, or safety claim

Google Places requires field masks and bills according to requested fields. Places content also has attribution and storage restrictions, so store durable Place IDs and plan snapshots carefully rather than building a permanent copied database of reviews or photos.

## Top 20 Local-Life Design

Do not place 20 undifferentiated cards in the main dashboard. The dashboard should show the best five for the student's current need, with a dedicated Local Life view containing the full 20.

Suggested result shape:

```ts
type LocalPlace = {
  placeId: string;
  name: string;
  category: "groceries" | "food" | "study" | "health" | "culture" | "nature" | "nightlife" | "weekend";
  mapsUrl: string;
  rating?: number;
  ratingCount?: number;
  priceLevel?: string;
  walkingMinutes?: number;
  transitMinutes?: number;
  openNow?: boolean;
  whyRecommended: string;
  sourceRefIds: string[];
  fetchedAt: string;
};
```

Ranking should consider distance, rating volume, price fit, opening status, category diversity, student preferences, and source freshness. Rating alone is not enough.

## Document, PDF, and Email

Recommended flow:

```text
ExchangePlan snapshot
  -> validate destination and evidence coverage
  -> generate printable plan document
  -> render PDF on the server
  -> show preview and recipient confirmation
  -> send email with an idempotency key
  -> record delivery result without storing more personal data than needed
```

Recommended implementation:

- Keep `ExchangePlan` as the source of truth.
- Add `planId`, `version`, `generatedAt`, `dataFreshness`, and `evidenceCoverage`.
- Generate the PDF in a Next.js Route Handler with `@react-pdf/renderer`.
- Generate the email body with React Email.
- Use Resend for hackathon delivery after a sender domain is verified.
- Include both a PDF attachment and a secure plan link if plan persistence is added.
- Require explicit confirmation immediately before sending.
- Use an idempotency key so repeated clicks cannot send duplicate emails.

Resend supports file attachments up to 40 MB after Base64 encoding and supports idempotency keys. A verified sender domain is required for sending beyond the account's own test address.

## Implementation Order

1. Fix destination integrity and remove London hardcodes from global planning.
2. Add student dates, diet, activities, accessibility needs, email, and optional parent recipient inputs.
3. Replace budget-derived costs and fixed commute values with explicit unknown or sourced data.
4. Add evidence requirements and source coverage checks to every plan module.
5. Add named local places and top-20 discovery with Maps links.
6. Add document preview and PDF download.
7. Add confirmed email delivery after recipient and consent behavior is decided.

## Open Decisions

1. Who may receive the plan: student only, student plus optional parent, or any entered address?
2. Should top 20 mean city-wide attractions, places within a campus travel radius, or a mixture?
3. Should generated plans be stored behind an account, stored temporarily, or generated without persistence?
4. Which sender domain can be verified for email delivery?
5. Is Google Maps Platform billing acceptable for the hackathon, or should the demo keep live Maps links with a small curated dataset?
