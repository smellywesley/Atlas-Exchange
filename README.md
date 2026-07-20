# Atlas Exchange

**Your exchange semester, planned before it begins.**

Atlas Exchange is a student exchange planning web app built around a problem that feels very familiar: choosing an exchange university is exciting, but preparing for it usually means juggling far too many tabs. Students have to compare campuses, maps, accommodation, budgets, deadlines, visas, packing lists, and module information at the same time.

This project brings those pieces together. It starts with the excitement of exploring a future campus, then turns that choice into a practical plan for how a student might actually live there.

**Live demo:** [atlas-exchange.vercel.app](https://atlas-exchange.vercel.app)

The current build supports every partner route in the included dataset without quietly falling back to London when a student chooses somewhere else. London is the most source-complete demo path, while all 92 displayed partner universities have local campus imagery in the globe HUD and university cards.

## Why I Built It

An exchange placement is not just a university name. It is a new city, a new routine, and often a student's first time planning a life abroad for several months. The research is scattered, and that can make an exciting decision feel overwhelming.

Students naturally ask:

- Which partner university should I choose?
- Where can I stay?
- Can I afford the monthly cost?
- What do I need to pack?
- What deadlines matter?
- What should I know about daily life in the destination?

Atlas Exchange is my attempt to make that first step calmer. It gives students one place to explore the destination, understand the practical trade-offs, and leave with a clear next action instead of another open tab.

## What I Wanted to Prove

I did not want to make a generic chatbot that gives confident-sounding travel advice. I wanted to build an experience that feels like a student is stepping into their possible exchange life, then gives them useful, source-aware planning help once they choose a university.

For the hackathon demo, London is the most source-complete path. Other routes remain synchronized to their selected destination and deliberately avoid unverified prices, commute times, scores, and deadlines. If the app cannot verify something, it should point the student to the right source rather than make it up.

## What You Can Try

The demo is designed to be explored, not merely read about. Start by scrolling through the cinematic opening, choose a region or university, then use the planner to see how the selected destination changes the plan.

- Scroll-directed Three.js opening that moves from NASA Blue Marble geography into real partner-campus frames, a 3D campus orbit, and the Atlas Exchange title reveal.
- Next.js web app with cinematic destination discovery.
- Direct Three.js interactive exchange globe with drag rotation, wheel zoom, and clickable country markers.
- Country-specific templates for city campuses, mountain routes, coastal routes, heritage routes, US campus corridors, and Pacific routes.
- Partnership data surfaces for UK, South Korea, Japan, China, Hong Kong, Taiwan, Australia, New Zealand, Switzerland, Netherlands, France, Germany, USA East/West, Canada, Mexico, and Brazil.
- Searchable partner-university cards across every included country and partnership route.
- Ninety-two local 1600x1000 campus images wired into the globe HUD, selected-campus hero, and university cards.
- Student intake for dates, budget, stay length, housing, dietary needs, planned activities, and travel style.
- NUSMods lookup that returns planning candidates and is protected with retries, caching, request coalescing, and an outbound-call budget.
- Destination-specific official visa sources that never claim to issue a visa decision.
- Reviewed cultural preparation for supported cities, with an explicit `needs-review` state elsewhere.
- Source-aware Q&A that answers from the current plan, uses caching, and rejects PII input.
- Ranked accommodation cards with official and platform links.
- Monthly budget breakdown in SGD.
- Smart packing checklist.
- Deadline plan for housing, documents, packing, and travel.
- Local life guidance for groceries, food areas, transport, weekend ideas, and communities.
- Logistics helper that creates arrival tasks, week-one tasks, ongoing routines, parent reassurance, and structured Q&A for each selected partner university.
- Source visibility layer using `SourceRef`.
- Clear provider-status handling that only advertises capabilities the current build actually uses.
- Evidence-linked PDF report generation for offline review and departure preparation.
- Local campus-image override folder with a 92-school filename checklist.
- Remotion demo video starter.

## The Student-Life Layer

This submission focuses especially on the parts of exchange that happen after a university is chosen:

4. Daily Logistics
5. Smart Packing List
6. Accommodations

Together, these form the student-life readiness layer. Once a student knows where they are going, Atlas Exchange helps them understand how they might actually live there.

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
- pdf-lib
- Phosphor Icons
- Three.js
- Motion for scroll and section transitions
- Remotion for demo video rendering

## How I Used Codex and GPT-5.6

I used Codex and GPT-5.6 as engineering collaborators throughout the Atlas Exchange build. They helped me turn an early idea about exchange planning into a working Next.js product, catch problems that would have made the demo misleading, and keep the project moving from concept to deployable app.

In practice, they helped with:

- Designing the destination-aware `ExchangePlan` flow so a selected university, city, country, and partnership route stay connected across the UI, planner, maps, and PDF export.
- Building and refining the Three.js and Motion-powered world-to-campus opening, partner-campus HUD cards, and scroll-driven 3D campus orbit.
- Testing validation, rate limiting, caching, safe Q&A fallbacks, source-aware planning behaviour, and the public API surface.
- Catching prototype mistakes, including destination fallbacks that incorrectly showed London content after a student selected another university.
- Tightening the developer workflow with TypeScript checks, linting, regression tests, production-build verification, documentation, and Vercel deployment checks.

Codex and GPT-5.6 made the build faster and more rigorous, but they do not replace product judgment. I remained responsible for the student-exchange context, visual direction, product decisions, and the final review of every claim shown to students.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev -- --port 3003
```

Open:

```text
http://localhost:3003
```

If `localhost` behaves oddly in a browser, try:

```text
http://127.0.0.1:3003
```

## Deployment

The public hackathon build is deployed on Vercel:

- Production: [https://atlas-exchange.vercel.app](https://atlas-exchange.vercel.app)
- Framework preset: Next.js
- Supported Node.js range: `>=20 <25`
- Deployment boundary: `.vercelignore` excludes local build output, tests, tooling, and rendered video assets.
- Edge control: the production Vercel Firewall limits `/api/*` to 60 requests per 60 seconds, keyed by IP and JA4 fingerprint.

Deploy the current working tree with:

```bash
npx vercel@latest deploy --prod --yes --project atlas-exchange
```

The 17 July 2026 release adds a scroll-directed Earth-to-campus opening, a 3D partner-campus orbit, and a holographic semester-planning scene. The home page, campus images, Three.js scenes, Google Maps embed, plan generation, deterministic Q&A, live NUSMods lookup, and PDF export are verified before deployment. Production sets `TRUST_PROXY_HEADERS=true` because Vercel overwrites forwarding headers.

The Vercel project is currently deployed through the CLI. GitHub remains the source repository, but automatic Git-to-Vercel deployments are not claimed until the repository integration is connected in the Vercel dashboard.

## Useful Commands

Typecheck:

```bash
npm run typecheck
```

Production build:

```bash
npm run build
```

Lint and integrity tests:

```bash
npm run lint
npm test
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

Returns the current provider mode, cost guardrails, and report-delivery readiness. The browser refreshes this no-store status at runtime so deployed capabilities do not rely on a build-time assumption.

The current route reports `mock`: deterministic planning, live platform links, and zero OpenAI calls. The `hybrid` and `openai` schema values are reserved for future provider implementations; adding credentials alone does not activate or advertise them.

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

### `GET /api/nusmods`

Looks up one NUS module by `academicYear` and `moduleCode`. Results are review candidates only; Atlas Exchange never presents them as an approved host-university mapping.

The server must be able to reach `https://api.nusmods.com`. A transient cold-cache transport failure is retried once; a sustained network outage is reported as unavailable rather than replaced with invented module data. For a direct health check:

```text
http://localhost:3003/api/nusmods?academicYear=2026-2027&moduleCode=CS1010S
```

### `POST /api/qna`

Answers a planning question only from the non-PII evidence supplied by the current generated plan. Unsupported questions return an explicit evidence gap instead of a fabricated answer.

### `GET /api/search/accommodation`

Returns ranked accommodation options and source references.

Current implementation uses official university housing links and live platform search links. It does not scrape full Airbnb, Agoda, or Trip listing internals yet.

### `POST /api/report/pdf`

Regenerates a validated plan server-side and returns a multi-page PDF with clickable evidence links.

## Architecture

```text
Browser
  |
  | student spins globe, zooms country, chooses partner university, submits intake
  v
Next.js App Router
  |
  | /api/status
  | /api/plan
  | /api/nusmods
  | /api/qna
  | /api/search/accommodation
  | /api/report/pdf
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
  | academic candidates
  | visa guidance
  | cultural preparation
  | packing
  | deadlines
  | local life
  | sources
  v
Dashboard + Remotion Demo
```

The shared schema lives in [src/lib/schema.ts](src/lib/schema.ts). All teammate modules should read from and write to `ExchangePlan` instead of creating isolated data shapes.

The interactive country/university atlas lives in [src/lib/exchange-map-data.ts](src/lib/exchange-map-data.ts) and [src/components/RegionGlobe.tsx](src/components/RegionGlobe.tsx).

## Provider Strategy

Atlas Exchange is designed to be demo-safe before API credits arrive:

- Deterministic planner by default.
- Provider credentials are ignored until a real provider client and evaluation path are implemented.
- A future release may add one LLM synthesis call after form submit.
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
- [docs/FEATURE_4_6_PRODUCT_AUDIT.md](docs/FEATURE_4_6_PRODUCT_AUDIT.md): rigorous readiness audit and source-integrity findings.
- [docs/FEATURES_1_6_INTEGRATION_STATUS.md](docs/FEATURES_1_6_INTEGRATION_STATUS.md): current cross-feature contract, verification, and remaining blockers.
- [docs/SECURITY_AND_DEPLOYMENT.md](docs/SECURITY_AND_DEPLOYMENT.md): request controls and public-deployment gates.
- [docs/NOTION_PROJECT_HUB.md](docs/NOTION_PROJECT_HUB.md): local copy of the Notion project hub.

University campus images belong in [public/images/universities](public/images/universities). Follow that folder's README exactly so each HUD card resolves the correct file without guessing.

Notion project hub:

- [Atlas Exchange - Hackathon Project Hub](https://app.notion.com/p/398b29e7045e813783a0fd6af57df38e)
- [Features 4-6 Integration Plan](https://app.notion.com/p/399b29e7045e81a78ca3ea003b9af4d4)
- [Features 4-6 Logistics Agent Project](https://app.notion.com/p/399b29e7045e81e7a841dd90a8799235)

## Current Limitations

- London has the deepest seeded demo content. Global paths generate synchronized plans but deliberately leave unverified market prices, commute times, fit scores, and exact deadlines blank.
- Accommodation search is live-link based, not full listing extraction.
- LLM synthesis is planned but not active by default.
- The public Vercel demo runs in deterministic `mock` provider mode. Credentials alone cannot change the reported mode.
- Application rate limits and concurrency gates are process-local. The deployed Vercel Firewall adds a global 60-request-per-minute `/api/*` boundary for the hackathon, but paid providers still require route-specific shared quotas before broader public use.
- `TRUST_PROXY_HEADERS=true` is safe only behind an edge that overwrites untrusted forwarding headers.
- No user accounts, persistence, production auth, or payment.
- Visa guidance links to official sources but does not make a visa decision. Module results are candidate-only and still require faculty approval.
- Two supplied campus-image records still need complete attribution metadata: National Cheng Kung University and University of Washington, Seattle.

## Visual Attribution

The opening Earth texture is NASA Visible Earth Blue Marble imagery by NASA Goddard Space Flight Center, Reto Stockli, and Robert Simmon. Campus-image attribution and usage records live in `public/images/universities/sources-and-permissions.json`.

## Demo Path

Recommended live demo:

```text
NUS student -> London -> University College London -> 4 months -> SGD 2,300/month -> shared housing -> balanced lifestyle
```

The demo should show that one intake profile can generate housing options, budget estimates, packing tasks, deadlines, local life guidance, and visible sources.
