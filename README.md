# Atlas Exchange

Atlas Exchange is a London-first student exchange planning web app built for a hackathon. It helps students turn scattered exchange preparation work into one clear departure plan: accommodation, budget, daily logistics, packing, deadlines, local life, and visible sources.

The current product focuses on a polished London golden path for NUS exchange students, with global expansion paths for Korea, Europe, US elite schools, and South America.

## Why This Exists

Exchange planning is stressful because students need to connect decisions across many disconnected areas:

- Which partner university should I choose?
- Where can I stay?
- Can I afford the monthly cost?
- What do I need to pack?
- What deadlines matter?
- What should I know about daily life in the destination?

Atlas Exchange turns those pieces into one source-backed planning dashboard.

## Hackathon Thesis

The strongest version is not a generic chatbot. It is a cinematic planning interface where students choose a destination, fill practical constraints, and receive a ranked, explainable plan.

For the hackathon demo, London is the full-depth path. Other regions are intentionally positioned as expansion paths.

## Current Features

- Premium Next.js web app with cinematic destination discovery.
- London partner university cards for UCL, King's College London, Imperial, and LSE.
- Student intake form for budget, stay length, housing preference, and travel style.
- Ranked accommodation cards with official and platform links.
- Monthly budget breakdown in SGD.
- Smart packing checklist.
- Deadline plan for housing, documents, packing, and travel.
- Local life guidance for groceries, food areas, transport, weekend ideas, and communities.
- Source visibility layer using `SourceRef`.
- Provider status endpoint showing mock, hybrid, or OpenAI-ready modes.
- Remotion demo video starter.

## Owned Feature Layer

The current build emphasizes features 4-6 from the original concept:

4. Daily Logistics
5. Smart Packing List
6. Accommodations

These form the student life readiness layer: once a student knows where they are going, Atlas Exchange helps them understand how to actually live there.

This layer integrates with the other modules:

- Cultural Immersion feeds etiquette, food, safety, and payment notes.
- Visa Applications feed document and deadline requirements.
- Academic Module Mapping feeds campus area, workload, special equipment, and module deadlines.
- Deadlines consumes accommodation and packing tasks.
- Comparing Universities feeds partner metadata, cost of living, and campus details.
- Extra Curriculars feeds planned activities, communities, and weekend plans.

See [docs/FEATURE_4_6_INTEGRATION_PLAN.md](docs/FEATURE_4_6_INTEGRATION_PLAN.md) for the full integration plan.

## Tech Stack

- Next.js 15
- React 18
- TypeScript
- Zod
- Phosphor Icons
- CSS-based animated globe scene
- Remotion for demo video rendering

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev -- -p 3001
```

Open:

```text
http://localhost:3001
```

If `localhost` behaves oddly in a browser, try:

```text
http://127.0.0.1:3001
```

## Useful Commands

Typecheck:

```bash
npm run typecheck
```

Production build:

```bash
npm run build
```

Open Remotion Studio:

```bash
npm run video:studio
```

Render the demo video:

```bash
npm run video:render
```

## API Routes

### `GET /api/status`

Returns the current provider mode and cost guardrails.

Modes:

- `mock`: deterministic planner, no OpenAI calls.
- `hybrid`: OpenAI key available but full live search provider may be missing.
- `openai`: future mode for live LLM synthesis with search integration.

### `POST /api/plan`

Generates an `ExchangePlan` from a student profile.

Example body:

```json
{
  "partnerUniversityId": "ucl",
  "monthlyBudgetSgd": 2300,
  "stayLengthMonths": 4,
  "housingPreference": "shared",
  "travelStyle": "balanced",
  "dietaryNeeds": [],
  "plannedActivities": ["museums", "weekend rail trips"]
}
```

### `GET /api/search/accommodation`

Returns ranked accommodation options and source references.

Current implementation uses official university housing links and live platform search links. It does not scrape full Airbnb, Agoda, or Trip listing internals yet.

## Architecture

```text
Browser
  |
  | student chooses partner university and submits intake
  v
Next.js App Router
  |
  | /api/status
  | /api/plan
  | /api/search/accommodation
  v
Plan Engine
  |
  | validates profile
  | loads partner university
  | calls accommodation search provider
  | generates ExchangePlan
  v
Shared ExchangePlan Contract
  |
  | budget
  | accommodation
  | packing
  | deadlines
  | local life
  | sources
  v
Dashboard + Remotion Demo
```

The shared schema lives in [src/lib/schema.ts](src/lib/schema.ts). All teammate modules should read from and write to `ExchangePlan` instead of creating isolated data shapes.

## Provider Strategy

Atlas Exchange is designed to be demo-safe before API credits arrive:

- Deterministic planner by default.
- One future LLM synthesis call after form submit.
- No model calls while typing.
- Source URLs preserved as structured `SourceRef` objects.
- Fallbacks clearly labeled as `live-link`, `seeded-fallback`, or `needs-review`.
- API keys never exposed to browser code.

## Documentation

- [docs/HACKATHON_PLAN.md](docs/HACKATHON_PLAN.md): overall product and three-week plan.
- [docs/INTEGRATION_SCHEMA.md](docs/INTEGRATION_SCHEMA.md): shared TypeScript contract.
- [docs/FEATURE_4_6_INTEGRATION_PLAN.md](docs/FEATURE_4_6_INTEGRATION_PLAN.md): daily logistics, packing, and accommodation integration plan.
- [docs/OPENAI_IMPLEMENTATION_PLAN.md](docs/OPENAI_IMPLEMENTATION_PLAN.md): safe path for adding live LLM synthesis.
- [docs/API_COSTS.md](docs/API_COSTS.md): cost-control notes.
- [docs/DEMO_VIDEO_SCRIPT.md](docs/DEMO_VIDEO_SCRIPT.md): video demo narrative.
- [docs/TEAM_HANDOFF.md](docs/TEAM_HANDOFF.md): teammate handoff notes.
- [docs/NOTION_PROJECT_HUB.md](docs/NOTION_PROJECT_HUB.md): local copy of the Notion project hub.

Notion project hub:

- [Atlas Exchange - Hackathon Project Hub](https://app.notion.com/p/398b29e7045e813783a0fd6af57df38e)
- [Features 4-6 Integration Plan](https://app.notion.com/p/399b29e7045e81a78ca3ea003b9af4d4)

## Current Limitations

- London is the only full-depth demo path.
- Accommodation search is live-link based, not full listing extraction.
- LLM synthesis is planned but not active by default.
- No user accounts, persistence, production auth, or payment.
- Visa and module mapping are integration contracts, not complete production workflows.

## Demo Path

Recommended live demo:

```text
NUS student -> London -> University College London -> 4 months -> SGD 2,300/month -> shared housing -> balanced lifestyle
```

The demo should show that one intake profile can generate housing options, budget estimates, packing tasks, deadlines, local life guidance, and visible sources.
