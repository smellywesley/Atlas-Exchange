# Atlas Exchange Team Handoff

## Current State

The repo now contains a working London-first prototype:

- Next.js app
- London cinematic discovery flow
- Partner university cards
- Intake form
- Dashboard tabs for accommodation, budget, packing, deadlines, local life, and sources
- 3D globe client island
- Mockable planning engine
- Provider status endpoint
- Remotion demo starter

Run locally:

```bash
npm install
npm run dev -- -p 3000
```

Open:

```text
http://localhost:3000
```

## Naming

Use **Atlas Exchange** externally. It feels more premium than Exchange Buddy and gives room for a serious judge-facing story.

Internal modules can still use practical names like `accommodation`, `budget`, `packing`, and `deadline`.

## Golden Demo Path

Build around this story:

```text
NUS student -> London -> University College London -> 4 months -> SGD 2,300/month -> shared housing -> balanced lifestyle
```

Do not spread equal effort across Korea, Europe, US, and South America yet. They should appear as global paths, but London should feel complete.

London partner cards are clickable and regenerate the plan. Supported IDs:

- `ucl`
- `kcl`
- `imperial`
- `lse`

Pass `partnerUniversityId` to `/api/plan` or `/api/search/accommodation` to generate campus-specific accommodation links.

## Teammate Integration

All modules should read and write to `ExchangePlan` in `src/lib/schema.ts`.

### Visa Module

Writes:

- `DeadlineItem[]` with `category: "visa"`
- `SourceRef[]` for official visa pages

Avoid:

- Claiming legal certainty
- Hiding uncertainty around nationality, visa type, or processing time

### Module Mapping

Writes:

- `DeadlineItem[]` with `category: "modules"`
- `SourceRef[]` for syllabi and pre-approved lists
- Future extension: `ModuleMappingPlan`

Avoid:

- Inventing similarity scores without source documents
- Treating the score as final approval

### University Comparison

Writes:

- `PartnerUniversity[]`
- Optional cost, language, campus, and academic tags

Avoid:

- Making every university equally deep
- Mixing city-level cost with campus-specific housing without labels

### Local Life And Extracurriculars

Writes:

- `LocalLifePlan`
- Activity and community ideas
- Weekend trip options

Avoid:

- Making generic tourist recommendations without student constraints

## Provider Modes

Check:

```text
GET /api/status
```

Modes:

- `mock`: no OpenAI key, deterministic planner, live-link search
- `hybrid`: OpenAI key present but search API missing
- `openai`: OpenAI key and live search API available

The UI shows provider mode and cost guardrails directly in the dashboard.

Generate a plan:

```text
POST /api/plan
```

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

## OpenAI Key Approach

Do not block development on credits.

When credits arrive:

1. Add `OPENAI_API_KEY` to `.env.local`.
2. Keep `MAX_SOURCE_SNIPPETS=6`.
3. Keep `MAX_OUTPUT_TOKENS=1800`.
4. Call the LLM only after form submit.
5. Cache generated plans by profile hash before a public demo.

The API key is not expensive by itself. Cost comes from usage.

## Demo Commands

```bash
npm run typecheck
npm run build
npx remotion still video/index.ts AtlasExchangeDemo --frame=30 --scale=0.25 public/renders/atlas-frame.png
```

Optional full video render:

```bash
npm run video:render
```

## Known Gaps

- Accommodation provider is live-link mode, not full scraped listing extraction.
- LLM provider is not implemented yet because API credits are pending.
- `/browse` was unhealthy in this environment, so browser QA used local HTTP checks and production build.
- npm audit reports two moderate findings through Next/PostCSS. The suggested fix path is a bad downgrade, so it is documented rather than forced.
