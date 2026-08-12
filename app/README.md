# clausewright — application

**Suspension Defense Copilot for Amazon and Walmart sellers.**
*Every day dark costs you a day's sales. Get back to selling — with the exact policy clause on your side.*

This directory is the deployable artifact: **one image, two process types, one Postgres**. It implements the container diagram in [`../phase-2-build/architecture/ARCHITECTURE.md`](../phase-2-build/architecture/ARCHITECTURE.md) §4.2 and the engine design in [`LLM_ENGINE.md`](../phase-2-build/architecture/LLM_ENGINE.md).

Those two documents plus [`CORPUS_DESIGN.md`](../phase-2-build/architecture/CORPUS_DESIGN.md) are **binding**. Where this README conflicts with them, they win.

---

## Layout

```
app/
├── src/
│   ├── env.ts                     # Twelve-Factor III — config from env, Zod-validated at boot
│   ├── app/                       # Next.js App Router (the `web` process)
│   │   ├── layout.tsx             # loads design-system.css once; renders the B11 disclaimer
│   │   ├── page.tsx               # the Decoder: one textarea, one button (N4 — no signup)
│   │   └── api/health/route.ts    # reports the release's corpus/model attribution stamps
│   ├── lib/
│   │   ├── adapters/              # every vendor SDK import in the codebase lives here
│   │   │   ├── anthropic.ts       #   interface: StructuredRequest | CitedRequest (never both)
│   │   │   ├── anthropic.live.ts  #   @anthropic-ai/sdk
│   │   │   ├── anthropic.mock.ts  #   recorded responses + cache-hit accounting
│   │   │   ├── stripe.{ts,live,mock}.ts
│   │   │   ├── resend.{ts,live,mock}.ts
│   │   │   ├── notice-source.ts   #   ADR-006 seam: SP-API becomes a 4th adapter
│   │   │   ├── notice-source.mock.ts
│   │   │   └── index.ts           #   the single composition root
│   │   ├── db/
│   │   │   ├── schema.ts          # the complete data model (ARCHITECTURE §5)
│   │   │   ├── index.ts           # postgres-js client; PGlite dev/test fallback
│   │   │   └── queue.ts           # FOR UPDATE SKIP LOCKED (ADR-005)
│   │   └── domain/
│   │       ├── reason-codes.ts    # 33 codes + UNCLASSIFIED, triage dispositions
│   │       └── types.ts           # the stage-to-stage contracts (LLM_ENGINE §5)
│   ├── scripts/migrate.ts         # Twelve-Factor XII admin process
│   ├── styles/                    # design-system.css (copied from identity/), app.css
│   └── worker/index.ts            # the `worker` process entrypoint
├── drizzle/                       # generated SQL migrations, committed
├── tests/                         # vitest — offline, no keys
├── e2e/                           # playwright
├── Dockerfile                     # one immutable image, corpus hash baked at build
├── fly.toml                       # two process groups: web ×2, worker ×1
└── .env.example                   # every var that varies between deploys
```

**One app, not a monorepo.** Per ADR-001: one repository, one language, one dependency graph, one CI lane, one on-call surface. The workflow engine is an **in-process library**, not a service — there is no network hop between pipeline stages.

---

## Run

```bash
cp .env.example .env.local          # then fill in the keys you actually need
npm install
npm run dev                         # web process  → http://localhost:3000
npm run worker:dev                  # worker process (separate terminal)
```

**Without any credentials at all:**

```bash
ADAPTER_MODE=mock DATABASE_DRIVER=pglite npm run dev
```

`ADAPTER_MODE=mock` binds the in-repo fakes for Anthropic, Stripe, Resend and `NoticeSource`; `DATABASE_DRIVER=pglite` runs an in-process Postgres. Both are **rejected in production** by `src/env.ts` — dev/prod parity (factor X) is preserved because the same schema, the same migrations and the same Drizzle queries run on both engines.

### Database

```bash
npm run db:generate                 # write a new SQL migration from schema.ts
npm run db:migrate                  # apply committed migrations (also the Fly release_command)
npm run db:push                     # local iteration only — never against production
```

Migrations are plain SQL files in version control. Generating one is a developer action; applying one is a release action, which is why `db:migrate` is a runtime script over the committed files rather than a `drizzle-kit` call (drizzle-kit is a devDependency and is absent from the production image).

---

## Test

```bash
npm run typecheck                   # tsc --noEmit
npm test                            # vitest — unit + integration
npm run test:e2e                    # playwright (starts a local server with mock adapters)
```

**Every test runs with no network access and no real API keys.** This is a hard rule, not a convenience:

- Per-commit evals run against **recorded model responses**, so they are deterministic and free. Live-model evals run **nightly**, not per-commit (ARCHITECTURE §2.2 factor X, §6.4).
- `vitest.config.ts` pins `ADAPTER_MODE=mock` and `DATABASE_DRIVER=pglite` for the whole suite.
- A test that needs a live key belongs in the nightly lane, not here.

The mocks are faithful about the things the pipeline branches on — `stop_reason`, cache-hit token accounting, HMAC webhook signatures, and citations carrying a `document_index` (including one pointing at the seller's notice, so the ADR-102 allowlist can be exercised adversarially).

### The blocking CI order

```
typecheck → unit → citation invariant → golden-set eval → corpus:build → docker build → migrate → deploy
```

Two of those steps block the deploy on purpose: `citations.invariant.test.ts` (ADR-004/ADR-102) and the ~53-notice golden-set eval (B10). Without evals in CI, every prompt change is a coin flip — and a prompt change is the most common change this codebase will ever see.

---

## Deploy

Fly.io, one app, one immutable release, two process groups (ARCHITECTURE §4.4).

```bash
fly secrets set ANTHROPIC_API_KEY=... STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... \
                RESEND_API_KEY=... RESEND_INBOUND_SIGNING_SECRET=... DATABASE_URL=...
fly deploy --build-arg CORPUS_RELEASE=$RELEASE --build-arg PROMPT_BUNDLE_HASH=$HASH
```

- `release_command` runs migrations as a one-off process in an **identical** release image before the new release takes traffic.
- `web` runs ×2 with `min_machines_running = 2` — never scaled to zero, because a cold start in front of a seller losing revenue by the hour is the one latency we control and choose not to spend.
- `worker` runs ×1 with more memory: it owns the job runner, the day-3/10/21 scheduler, the headless-Chromium PDF renderer and the redaction pipeline.
- Staging is a **second Fly app from the same image** with test-mode config — not a separate cluster.
- Rollback is redeploying a previous release. Releases are immutable and numbered.

### Two deploy-time invariants worth stating

1. **`CORPUS_RELEASE` and `PROMPT_BUNDLE_HASH` are build arguments, not runtime fetches.** They are baked into the image and stamped onto every `case` row. That is what makes an outcome attributable to an exact corpus version (ADR-008) and what keeps the prompt prefix byte-stable for caching (ADR-003). `/api/health` reports both, so a release serving an unintended corpus version is visible immediately.

2. **Model IDs are pinned in config and stamped per case.** Changing one is an ADR and a corpus-release bump, never a config tweak (ADR-101). The minimum cacheable prefix is not monotonic across model generations, so a model swap can silently change cache economics as well as output.

---

## The five invariants this scaffold is built to protect

| # | Invariant | Where it lives in this tree |
|---|---|---|
| **I1** | Workflow, not agent — control flow in code, never in the model | `src/lib/domain/types.ts` is a function composition; no `tools` field exists on any request type |
| **I2** | No policy reference reaches the UI unless it arrived inside a citation object | `CitedClause` in `domain/types.ts`; `citations` table; the render gate and `citations.invariant.test.ts` are built on both |
| **I3** | No vector DB, no chunking, no fine-tuning — the corpus rides in a prompt-cached prefix | `ModelDocument.source.type: 'content'`; `systemPrefix` is a separate field so nothing volatile can sit above the cache breakpoint |
| **I4** | No credentials, no automated submission, no SP-API | No adapter method accepts a marketplace credential; `NoticeSource` is the only ingest seam |
| **I5** | A misclassification escalates; it never guesses | `ClassificationOutcome` is a discriminated union — the draft stage is *statically unreachable* for every escalation path |

And the one component that is **not cuttable** under schedule pressure (D10): the consent-gated outcome corpus — `consents`, `outcome_reports`, `l4_records`. Everything else in v1 can be rebuilt in a week; the data from week one cannot be recovered in any week thereafter.

---

## Two gates that govern copy, not code

- **G6 — the delivery-time guarantee.** `TIME_GUARANTEE_ADVERTISED` defaults to `false`. No surface — landing page, pricing card, FAQ, email, forum reply — may state a delivery-time guarantee until the automatic SLO-refund job is running in production and has been exercised on a deliberately-breached test case. The SLO itself (`paid_at → document_ready_at`) is measured from day one; what is withheld is the *promise*.
- **N10 / R11 — success rates.** No code surface publishes a reinstatement rate until B9 produces one **with its denominator**. There is deliberately no field, view or endpoint that would make it easy to.
