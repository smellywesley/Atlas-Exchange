# Atlas Exchange Hackathon Plan

## Decision Summary

- Product name: Atlas Exchange
- Golden path: London first
- Build approach: Modular agent MVP with live links and mockable LLM
- Primary deliverables: Web app, integration schema, Remotion-ready demo narrative
- Deadline: End of July 2026, about three weeks from July 9, 2026

## Product Thesis

Exchange planning is stressful because students must connect scattered decisions: visa dates, course mapping, housing, budget, packing, and local life. Atlas Exchange turns those fragments into one living departure plan.

For the hackathon, the strongest version is not a generic chatbot. It is a cinematic planning interface where students choose a destination, fill practical constraints, and receive ranked plans with visible sources.

## Scope

### In Scope For First Build

- London destination path
- Premium landing and destination discovery UI
- Partner university selection
- Student intake form for duration, budget, housing preference, travel style, and activities
- Accommodation ranking cards with source links
- Budget estimate
- Smart packing plan
- Deadline plan
- Mockable AI route that can switch to OpenAI when `OPENAI_API_KEY` is available
- Integration schema for teammate modules

### In Scope As Expansion Paths

- Korea
- Europe
- US elite schools
- South America

These should appear in the product as selectable or upcoming regions, but London receives the polished demo.

### Out Of Scope For First Build

- Scraping full Airbnb/Agoda listing internals
- User accounts
- Payment
- Production authentication
- Full module-mapping workflow
- Full visa application automation

## Three Week Plan

### Week 1: Foundation

- Create Next.js app and design system.
- Build London landing flow and destination dashboard shell.
- Implement shared TypeScript schema for `ExchangeProfile`, `ExchangePlan`, and module handoff contracts.
- Build mock data providers for accommodation, budget, packing, and deadlines.

### Week 2: Agent And Live Links

- Add API route for plan generation.
- Add search-provider abstraction with mock provider first.
- Add live web search provider when credentials are available.
- Add OpenAI provider behind environment flag.
- Add accommodation ranking logic with reasons and confidence.
- Wire dashboard tabs to one shared plan object.

### Week 3: Demo Polish

- Add 3D region/globe scene.
- Add London cinematic scroll scenes.
- Add Remotion composition for a 60-90 second demo video.
- QA mobile and desktop.
- Add fallback states for missing API key, failed search, and no listings.
- Prepare final pitch script.

## OpenAI Cost Guidance

Use mock output until credits arrive. When live:

- Use a low-cost model for normal plan generation.
- Keep prompts short and structured.
- Cache generated plans by profile hash during demos.
- Avoid calling the model on every keystroke.
- Use one final synthesis call after the user submits the intake form.
- Keep web search as a separate provider so source discovery can work without OpenAI if needed.

## Demo Story

1. A student lands on Atlas Exchange.
2. They select London from a cinematic region view.
3. They choose UCL or King's College London.
4. They enter: four months, SGD 2,300/month, shared housing, balanced lifestyle.
5. Atlas Exchange generates a plan with accommodation links, a monthly budget, weather-aware packing, and deadlines.
6. The app surfaces uncertainty clearly: live source checked, fallback estimate, or API key missing.

## Integration Contracts

All teammate features should read and write to the shared `ExchangePlan`.

- Visa module writes `DeadlineItem[]` with category `visa`.
- Module mapping writes `DeadlineItem[]` with category `modules` and source refs for syllabi.
- University comparison writes partner university metadata into `PartnerUniversity`.
- Local life writes activities into `LocalLifePlan`.
- Your modules write `BudgetPlan`, `AccommodationPlan`, and `PackingPlan`.

## Risk Register

- Live scraping risk: use search links and source cards instead of brittle platform scraping.
- API credit risk: mock provider must be demo-quality.
- Scope risk: make London excellent, keep other regions shallow but beautiful.
- UI risk: cinematic landing cannot bury the useful dashboard.
- Judge trust risk: show source URLs, timestamps, and fallback status.
