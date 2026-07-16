# Features 1-6 Integration Status

Date: 2026-07-14

## Verdict

Atlas Exchange now has one destination-synchronized `ExchangePlan` across features 1-6. It is hackathon-ready as a controlled, single-instance demonstration. It is not yet production-ready: accommodation values are discovery links rather than verified market listings, report email lacks recipient ownership verification, and rate limits are process-local.

## Shared Flow

```text
university selection
  -> validated student intake
  -> destination-resolved profile
  -> academic + visa + culture foundations
  -> accommodation + budget + packing + daily logistics
  -> evidence-only Q&A
  -> PDF download
```

The selected university ID, city, country, image identity, sources, and generated plan travel together. No unsupported destination is allowed to inherit UCL, London, or another university's content.

## Feature Status

| Feature | Current implementation | Integrity boundary |
|---|---|---|
| 1. Academic modules | Live NUSMods lookup, candidate-only output, bounded cache and provider budget | Never claims faculty approval or host equivalence |
| 2. Visa preparation | Official government source and destination-specific checklist status | Never makes a visa decision; passport-specific eligibility remains an official check |
| 3. Cultural preparation | Reviewed guidance for supported cities | Exact-city match only; other cities show `needs-review` |
| 4. Daily logistics | Arrival, week one, routines, local-life searches, deadlines, Q&A | Search links are discovery, not verified place claims |
| 5. Smart packing | Destination, season, activity, housing, and document groups | Weather and baggage claims remain unsourced until providers are connected |
| 6. Accommodation | Official housing first, then provider search links and budget comparison | Global routes do not invent rent, commute, availability, or fit scores |

## Campus Media

- 92 partner-university WebP images imported at 1600x1000.
- Every displayed university resolves to a local image.
- Images appear in university cards, the selected-campus hero, and the globe HUD list.
- The canonical catalog and source metadata are in `public/images/universities/sources-and-permissions.csv` and `.json`.
- National Cheng Kung University needs license/usage metadata.
- University of Washington, Seattle needs author metadata.

## APIs

- `POST /api/plan`: validated synchronized plan.
- `GET /api/nusmods`: one candidate-only NUS module lookup.
- `POST /api/qna`: evidence-only, non-PII plan question.
- `GET /api/search/accommodation`: official and provider discovery links.
- `POST /api/report/pdf`: server-regenerated plan PDF.

## Verification

- Unit/integrity/security/media suite: 40 tests.
- TypeScript strict typecheck.
- ESLint with zero warnings.
- Production Next.js build.
- Direct live checks for the app, campus media, Lyon destination synchronization, and evidence-only Q&A.

## Next Before OpenAI

1. Add authenticated student ownership or a one-time email verification token before public report delivery.
2. Replace process-local limits with a shared edge or Redis-backed limiter for multi-instance deployment.
3. Connect a licensed accommodation/place/route provider and preserve attribution and freshness.
4. Expand reviewed official visa and cultural records destination by destination.
5. Resolve the two incomplete campus-image attribution records.
6. Add browser E2E coverage for marker selection, plan synchronization, Q&A cancellation, PDF, and report delivery.

## OpenAI Boundary

OpenAI may later synthesize, explain, and prioritize the already validated evidence. It must not create source URLs, prices, visa decisions, module approvals, availability, commute times, or deadlines. Deterministic validation and source records remain authoritative.
