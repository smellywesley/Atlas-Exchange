# Atlas Exchange Hackathon Project Hub

Created on July 9, 2026.

## Executive Summary

Atlas Exchange is a London-first student exchange planning web app for the hackathon. The pitch is not "another chatbot"; it is a cinematic planning dashboard that turns scattered exchange decisions into one source-backed departure plan.

The current build supports a polished London demo path with partner university selection, student intake, accommodation links, budget planning, packing, deadlines, local life, source visibility, provider status, and a Remotion demo starter. It is intentionally mockable while OpenAI credits and live search provider credentials are pending.

## Hackathon Strategy

Primary judge story:

1. A NUS student wants to go on exchange.
2. They choose London from a premium global discovery experience.
3. They select a partner university such as UCL, King's College London, Imperial, or LSE.
4. They enter practical constraints: budget, stay length, housing preference, travel style, diet, and planned activities.
5. Atlas Exchange generates a ranked, source-visible plan for accommodation, budget, packing, deadlines, and local life.
6. The dashboard shows whether data is live, linked, seeded fallback, or pending review.

Focus decision:

- London gets the full demo.
- Korea, Europe, US elite schools, and South America appear as expansion regions.
- Other regions should look intentional, but they should not dilute the London path.

## Current Product Surface

Web app:

- Next.js app shell.
- Cinematic destination interface.
- 3D globe client island.
- Partner university cards.
- Intake form.
- Dashboard tabs for accommodation, budget, packing, deadlines, local life, and sources.
- Provider status panel.

Video:

- Remotion composition exists for the demo narrative.
- Still frame render path exists at `public/renders/atlas-frame.png`.

Documentation:

- `DESIGN.md`
- `docs/HACKATHON_PLAN.md`
- `docs/INTEGRATION_SCHEMA.md`
- `docs/API_COSTS.md`
- `docs/DEMO_VIDEO_SCRIPT.md`
- `docs/TEAM_HANDOFF.md`
- `docs/OPENAI_IMPLEMENTATION_PLAN.md`
- `docs/NOTION_PROJECT_HUB.md`

## Architecture

```text
Browser
  |
  | user selects partner and submits intake
  v
Next.js App Router
  |
  | /api/status
  | /api/plan
  | /api/search/accommodation
  v
Plan Engine
  |
  | validates ExchangeProfile
  | loads PartnerUniversity
  | calls accommodation search provider
  | produces ExchangePlan
  v
Shared ExchangePlan Contract
  |
  | accommodation
  | budget
  | packing
  | deadlines
  | local life
  | source references
  v
Dashboard Tabs + Demo Video
```

Key rule: schema validation owns truth. Agents and LLMs can summarize, rank, and explain, but they cannot invent source URLs, prices, or official requirements.

## Core Files

Frontend:

- `app/page.tsx` mounts the product experience.
- `src/components/AtlasShell.tsx` controls the main page flow.
- `src/components/IntakePanel.tsx` captures student constraints.
- `src/components/PlanDashboard.tsx` renders the generated plan.
- `src/components/RegionGlobe.tsx` renders the 3D visual layer.
- `app/globals.css` defines the premium visual system.

Backend and contracts:

- `src/lib/schema.ts` is the central TypeScript contract.
- `src/lib/demo-data.ts` stores partner universities and seeded data.
- `src/lib/search-provider.ts` creates live accommodation links and source refs.
- `src/lib/plan-engine.ts` generates the exchange plan.
- `src/lib/provider-status.ts` reports only the currently implemented deterministic `mock` mode; future modes remain reserved.
- `app/api/plan/route.ts` generates plans.
- `app/api/search/accommodation/route.ts` returns accommodation options.
- `app/api/status/route.ts` returns provider mode and warnings.

Video:

- `video/index.ts`
- `video/Root.tsx`
- `video/AtlasExchangeDemo.tsx`

## Data Contract

All teammate modules should read and write to `ExchangePlan`.

Important objects:

- `ExchangeProfile`: student inputs and destination constraints.
- `PartnerUniversity`: partner metadata, city, campus area, official accommodation URL, strengths.
- `AccommodationPlan`: ranked options, reasons, tradeoffs, risks, generated mode.
- `BudgetPlan`: monthly estimate and category-level costs.
- `PackingPlan`: essentials, weather-based items, accommodation-based items, documents.
- `DeadlineItem`: visa, accommodation, module, packing, and travel actions.
- `LocalLifePlan`: groceries, food areas, transport notes, weekend ideas, community ideas.
- `SourceRef`: URL, provider, timestamp, snippet, confidence.

Module ownership:

- User role points 4 to 6: accommodation, budget, packing, dashboard integration.
- Visa teammate: writes visa `DeadlineItem[]` and official `SourceRef[]`.
- Module mapping teammate: writes module deadline items and future mapping outputs.
- University comparison teammate: enriches `PartnerUniversity[]`.
- Local life teammate: writes `LocalLifePlan`.

## API Contracts

`GET /api/status`

Returns provider readiness:

```json
{
  "mode": "mock",
  "planner": "deterministic",
  "search": "live-link",
  "costControl": {
    "llmCallsPerSubmit": 0,
    "maxSourceSnippets": 6,
    "maxOutputTokens": 1800,
    "cacheRecommended": true
  },
  "warnings": []
}
```

`POST /api/plan`

Minimum body:

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

Returns:

```json
{
  "plan": "ExchangePlan",
  "mode": "mock | openai | hybrid",
  "warnings": []
}
```

`GET /api/search/accommodation`

Query fields:

- `city`
- `university`
- `partnerUniversityId`
- `budgetSgd`
- `housingPreference`

Returns ranked accommodation options plus `SourceRef[]`.

## Provider Modes

`mock`

- Deterministic planner.
- Live-link accommodation search URLs.
- Only mode reported by the current build, even if unused credentials are present.

`hybrid`

- Reserved for a future verified live-search integration.
- Not activated by credentials alone.

`openai`

- Reserved for a future verified LLM synthesis integration.
- Not activated by credentials alone.

Cost guardrails:

- No LLM calls while typing.
- Zero synthesis calls in the current build.
- Maximum six source snippets.
- Maximum 1,800 output tokens.
- Cache by profile hash before public demo.
- Never expose API keys in browser code.

## Accommodation Strategy

Current approach:

- Show official university accommodation pages.
- Generate platform search links for Airbnb and Agoda using campus-targeted queries.
- Label result status as `live-link`, `seeded-fallback`, or `needs-review`.
- Preserve URLs in `SourceRef`.

Why this is hackathon-safe:

- It demonstrates real-world source linkage.
- It avoids brittle scraping of platforms that may block automated extraction.
- It keeps judge trust by showing status and uncertainty.

Future providers:

- SerpAPI
- Tavily
- Exa
- Firecrawl
- Webscraping AI provider

## Demo Path

Use this as the core live demo:

```text
NUS student -> London -> University College London -> 4 months -> SGD 2,300/month -> shared housing -> balanced lifestyle
```

Supported London partner IDs:

- `ucl`
- `kcl`
- `imperial`
- `lse`

Demo proof points:

- Partner cards regenerate campus-specific plans.
- Accommodation links point to official and platform search pages.
- Budget changes with monthly budget and travel style.
- Packing adapts to London weather and housing preference.
- Deadlines show linked feature ownership.
- Sources tab makes mock versus live-link status transparent.

## Three Week Execution Plan

Week 1: Foundation

- Finalize the London product flow.
- Keep the shared schema stable.
- Make each dashboard tab clear and demo-ready.
- Add first-pass teammate module stubs.

Week 2: Integration

- Connect teammate modules to `ExchangePlan`.
- Add OpenAI provider behind an environment flag if credits arrive.
- Add a cache layer for plan generation.
- Add one live search provider if credentials are available.
- Tighten error and fallback states.

Week 3: Demo Polish

- Refine desktop and mobile responsiveness.
- Record the live product walkthrough.
- Render or edit the Remotion video.
- Prepare pitch script.
- QA the golden path repeatedly.

## Known Gaps

- Accommodation search currently provides live links, not extracted third-party listing internals.
- LLM synthesis is planned but not active yet.
- No user accounts or persistent saved trips yet.
- No production authentication.
- Module mapping and visa automation need teammate integration.
- Browser QA through `/browse` was blocked by environment instability; production build and HTTP checks were used instead.

## Verification

Last verified locally:

- `npm run typecheck` passed.
- `npm run build` passed.
- `/api/plan` returned campus-specific Imperial output.
- `/api/search/accommodation` returned LSE official and platform links.
- Remotion still frame rendered to `public/renders/atlas-frame.png`.

Run commands:

```bash
npm install
npm run dev -- -p 3000
npm run typecheck
npm run build
npx remotion still video/index.ts AtlasExchangeDemo --frame=30 --scale=0.25 public/renders/atlas-frame.png
```

## Immediate Next Steps

1. Decide whether the hackathon demo will stay London-only or show shallow region previews after the London path.
2. Confirm the teammate module boundaries against `ExchangePlan`.
3. Implement `PlannerProvider` with mock and OpenAI branches.
4. Add caching before enabling any live LLM calls.
5. Run visual QA on desktop and mobile.
6. Record a 60 to 90 second video with the golden path.
