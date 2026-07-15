# API Cost Approach

Checked on July 9, 2026 against the official OpenAI API pricing page.

## Practical Recommendation

For the hackathon, do not wait for API credits to start. Build the app so it works in three modes:

1. `mock` - no key, deterministic demo-quality output.
2. `hybrid` - reserved for a future verified live-search integration.
3. `openai` - reserved for a future verified LLM synthesis integration.

The current build always reports `mock`. Credentials do not activate a provider until its client, failure behavior, and evaluation path exist.

## Why This Is Safe

OpenAI API pricing is usage-based, not a fixed monthly subscription for a key. The key itself is not the expensive part. Cost comes from tokens, tools, images, video, and search calls.

For this app, the normal request shape is small:

- Intake profile: around 500-1,500 input tokens.
- Source snippets: around 1,000-4,000 input tokens if controlled.
- Plan output: around 800-2,000 output tokens.

If we use a smaller text model for normal plan generation, a judge demo should cost cents or less in typical use. The risky cost is not one plan. The risky cost is unbounded repeated calls, live web search calls on every interaction, or video/image generation.

## Controls To Implement

- Call the LLM only after form submit.
- Cache the generated plan by a profile hash.
- Add `MAX_SOURCE_SNIPPETS`.
- Add `MAX_OUTPUT_TOKENS`.
- Prefer cheaper models for normal planning.
- Disable OpenAI calls unless `OPENAI_API_KEY` is present.
- Never expose the API key to the browser.

## Source Snapshot

The official OpenAI pricing page states prices are per 1M tokens and lists current flagship model prices. It also lists web search tool pricing separately at per-call rates, so search should be used intentionally and cached during demos.
