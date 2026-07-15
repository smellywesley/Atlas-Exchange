# OpenAI Implementation Plan

## Goal

Make Atlas Exchange work without credits now, then switch to live LLM synthesis safely when credits arrive.

## Current Behavior

- Provider status remains deterministic `mock` with or without credentials.
- If `OPENAI_API_KEY` is present before the provider exists, the key is ignored and the public status response remains unchanged.

This prevents accidental spend and keeps the demo reliable.

## Recommended Provider Shape

```ts
export type PlannerProvider = {
  name: "mock" | "openai";
  generatePlan(input: {
    profile: ExchangeProfile;
    accommodationOptions: AccommodationOption[];
    sources: SourceRef[];
  }): Promise<{
    accommodationSummary: string;
    budgetNotes: string[];
    packingAdjustments: PackingItem[];
    deadlineAdjustments: DeadlineItem[];
    warnings: string[];
  }>;
};
```

## Prompt Rules

- The model may summarize, rank, and explain.
- The model may not invent source URLs.
- The model may not invent accommodation prices.
- The model must label uncertainty.
- The model must return JSON matching schema.
- The route validates JSON before using it.

## Cost Controls

- One LLM call per submitted form.
- No model call while typing.
- Maximum six source snippets in prompt.
- Maximum 1,800 output tokens.
- Cache result by profile hash.
- Use a small model for normal demo generation.

## Environment Variables

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
MAX_SOURCE_SNIPPETS=6
MAX_OUTPUT_TOKENS=1800
```

## Implementation Steps

Implement and evaluate the provider before adding production credentials or changing provider status. A key is configuration, not a capability flag.

1. Add `src/lib/planner-provider.ts`.
2. Add `MockPlannerProvider`.
3. Add `OpenAIPlannerProvider`.
4. Move current deterministic summary logic into `MockPlannerProvider`.
5. In `/api/plan`, select provider by `OPENAI_API_KEY`.
6. Validate model JSON with Zod before returning it.
7. Add a `cached` flag to `ProviderStatus`.
