# Security and Deployment Gates

Date: 2026-07-14

## Current Controls

- Exact JSON content type and bounded request bodies.
- Zod validation before expensive per-identity quotas.
- Global circuit breakers plus trusted-client limits where a verified proxy identity exists.
- Fixed-capacity limiter stores with bounded pruning.
- PDF concurrency gate.
- NUSMods single-flight coalescing, bounded cache, global concurrency ceiling, and outbound-call budget.
- Exact configured-origin checks for report delivery.
- Recipient allowlist and recipient-hashed report quota for the controlled demo.
- CSP, frame denial, MIME protection, permissions policy, referrer policy, and production HSTS.
- API keys remain server-only.

## Non-Negotiable Public Deployment Gates

The current build is for one controlled hackathon instance. Before a public or multi-instance deployment:

1. Add a shared Redis, edge, or platform rate limiter. Process-local counters do not coordinate between instances.
2. Add authentication or a one-time email ownership token. An `Origin` header plus allowlist is CSRF mitigation, not authorization.
3. Put the app behind a proxy that overwrites forwarding headers before enabling `TRUST_PROXY_HEADERS=true`.
4. Add handler-level integration tests for 400, 403, 413, 429, concurrency release, and provider failure.
5. Define log redaction, retention, incident response, and student-data deletion.
6. Run the security scan again against the deployment configuration and dependencies.

## Controlled Email Demo

Report email remains disabled unless all values are present:

```text
RESEND_API_KEY
EMAIL_FROM
REPORT_EMAIL_ALLOWLIST
APP_ORIGIN
```

`APP_ORIGIN` must be canonical, for example `http://localhost:3003`, without a trailing slash. The allowlist must contain only the student demo recipients. Do not expose this endpoint to the public internet as a general mailer.

## Provider Failure Behavior

- NUSMods unavailable or at capacity: retain the plan and show module lookup as unavailable for review.
- Accommodation provider unavailable: show official/search links without invented listing facts.
- Q&A has no matching evidence: return an explicit unsupported answer.
- Email unavailable: keep PDF download available.
