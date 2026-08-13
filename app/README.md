# clausewright — application

**Suspension Defense Copilot for Amazon and Walmart sellers.**
*Every day dark costs you a day's sales. Get back to selling — with the exact policy clause on your side.*

This directory is the deployable artifact: **one image, two process types, one Postgres**. It implements the container diagram in [`../phase-2-build/architecture/ARCHITECTURE.md`](../phase-2-build/architecture/ARCHITECTURE.md) §4.2 and the engine design in [`LLM_ENGINE.md`](../phase-2-build/architecture/LLM_ENGINE.md).

Those two documents plus [`CORPUS_DESIGN.md`](../phase-2-build/architecture/CORPUS_DESIGN.md) are **binding**. Where this README conflicts with them, they win.

---

## Layout

```
app/
├── corpus/                        # the knowledge base as CONTENT (CORPUS_DESIGN.md)
│   ├── taxonomy.json              #   L1 — 33 reason codes
│   ├── L2-policy-clauses/*.md     #   L2 — our summaries of real policy, never bulk source
│   ├── L3-appeal-patterns/        #   L3 — one appeal pattern per code
│   ├── L4-outcomes/               #   L4 — 0 records at launch, by design
│   └── ontology/*.json            #   the JSON Schemas gate G1 validates every record against
├── src/
│   ├── env.ts                     # Twelve-Factor III — config from env, Zod-validated at boot
│   ├── app/                       # Next.js App Router (the `web` process)
│   │   ├── (app)/                 #   appeal, case, plan, ops, monitoring screens
│   │   ├── _lib/
│   │   │   ├── case-store.ts      #   the read model over lib/db — assembles one CaseRecord
│   │   │   ├── actions.ts         #   server actions; the only mutations the UI can perform
│   │   │   ├── engine-runtime.ts  #   the web tier's single call into the engine
│   │   │   ├── appeal-run.ts      #   one narrated pipeline run per case
│   │   │   └── run-registry.ts    #   replayable SSE runs (a reload must not re-bill)
│   │   └── api/                   #   the web process's HTTP surface
│   │       ├── health/            #     release attribution (corpus release, model ids)
│   │       ├── appeal/[caseId]/stream/  # SSE preview
│   │       ├── stripe/webhook/    #     ADR-007 — the source of truth for payment
│   │       └── inbound/email/     #     ADR-006 — Shield's ingest endpoint
│   ├── lib/
│   │   ├── adapters/              # every vendor SDK import in the codebase lives here
│   │   │   ├── anthropic.{ts,live,mock}.ts   # StructuredRequest | CitedRequest, never both
│   │   │   ├── stripe.{ts,live,mock}.ts      # hosted Checkout only — no method takes a PAN
│   │   │   ├── resend.{ts,live,mock}.ts
│   │   │   ├── notice-source.ts   #   ADR-006 seam: SP-API would become a 4th adapter
│   │   │   └── index.ts           #   the vendor composition root
│   │   ├── corpus/                # the knowledge base as CODE — loader, retrieval, gates
│   │   │   ├── load.ts            #   the ONLY module here that touches the filesystem
│   │   │   ├── retrieval.ts       #   code-keyed lookup; no vectors, no chunking (ADR-003)
│   │   │   ├── ontology.ts        #   gate G1 — records vs. their JSON Schemas
│   │   │   └── gates.ts           #   the rest of CORPUS_DESIGN §7, as pure functions
│   │   ├── engine/                # classify → retrieve → draft → critique (LLM_ENGINE.md)
│   │   │   ├── pipeline.ts        #   owns the ordering and both escalation exits
│   │   │   ├── citation-gate.ts   #   I2 — the ONLY construction path for a CitedClause
│   │   │   └── evals/             #   golden set + recorded responses (offline, free)
│   │   ├── db/
│   │   │   ├── schema.ts          #   the complete data model (ARCHITECTURE §5)
│   │   │   ├── case-state-machine.ts  # every cases.status write goes through here
│   │   │   ├── repositories/      #   one module per table
│   │   │   ├── migrations.ts      #   reads the committed SQL as data (journal order)
│   │   │   ├── index.ts           #   postgres-js client; PGlite dev/test fallback
│   │   │   └── queue.ts           #   FOR UPDATE SKIP LOCKED (ADR-005)
│   │   ├── billing/               # Checkout, webhook-as-truth, refunds, Shield (ADR-007)
│   │   ├── email/                 # outbound templates, the D3/D10/D21 sequence, inbound
│   │   ├── outcome-capture/       # consent → redaction → promotion into L4 (ADR-008)
│   │   ├── queue/                 # job payloads + handler registration
│   │   └── domain/                # reason-codes.ts, types.ts — the stage-to-stage contracts
│   ├── scripts/
│   │   ├── migrate.ts             # Twelve-Factor XII admin process
│   │   └── corpus-check.ts        # the corpus build gate (all of CORPUS_DESIGN §7)
│   ├── styles/                    # design-system.css (copied from identity/), app.css
│   └── worker/
│       ├── index.ts               # the `worker` process entrypoint — the claim loop
│       └── composition.ts         # its composition root: engine-backed job seams
├── drizzle/                       # generated SQL migrations, committed
├── tests/                         # vitest — offline, no keys
├── e2e/                           # playwright
├── Dockerfile                     # one immutable image; corpus content ships in it
├── fly.toml                       # two process groups: web ×2, worker ×1
└── .env.example                   # every var that varies between deploys
```

**One app, not a monorepo.** Per ADR-001: one repository, one language, one dependency graph, one CI lane, one on-call surface. The workflow engine is an **in-process library**, not a service — there is no network hop between pipeline stages.

### How the pieces are wired

There are exactly three composition roots, and everything else is dependency-injected:

| Root | Binds |
|---|---|
| `src/lib/adapters/index.ts` | the vendor surfaces, by `ADAPTER_MODE` |
| `src/worker/composition.ts` | the engine into the worker's job handlers — notably ADR-006's requirement that inbound Shield mail run through the **same** classifier as a pasted notice |
| `src/app/_lib/engine-runtime.ts` | the engine into the web tier, with a witness on the corpus port so the SSE stream can name the reason code the moment stage 1 decides it |

The web tier's path is **frontend → server action → `case-store` → `lib/db`**, and **never** to a vendor SDK. Checkout in particular goes through `lib/billing/createCheckoutForCase`, which validates the case's origin status and writes the `payments` row the webhook later looks up by session id — the webhook, not the redirect, is what unlocks a case (ADR-007).

---

## Run

```bash
cp .env.example .env.local          # then fill in the keys you actually need
npm install
npm run dev                         # web process  → http://localhost:3000
npm run worker:dev                  # worker process (separate terminal)
```

**Without any credentials at all — a fresh checkout, nothing installed but `npm ci`:**

```bash
ADAPTER_MODE=mock DATABASE_DRIVER=pglite npm run dev
```

**On a Claude subscription — real drafts, no API key (dev-only):**

```bash
# Prerequisite: Claude Code installed and logged in (`npm i -g @anthropic-ai/claude-code`,
# then `claude` once to sign in with your Claude subscription).
ADAPTER_MODE=claude-cli DATABASE_DRIVER=pglite npm run dev
```

`claude-cli` is the mock formation with one substitution: the model adapter
shells out to the local Claude Code binary (`CLAUDE_CLI_PATH` to override), so
classify/draft/critique run on YOUR subscription while Stripe/Resend stay
mocked. Structured outputs are emulated by schema-in-prompt + downstream Zod;
the Citations API is emulated with a STRICTER check — the model must return a
verbatim quote per citation and the adapter drops any quote that is not a
character-for-character substring of the named corpus block, so the citation
gate still fails closed. Personal-machine use only: `src/env.ts` rejects this
mode in production, and a consumer subscription must never back a server.

> **This mode is dev-only, and the boundary is enforced in code, not by convention.**
> `src/env.ts` fails the boot when `NODE_ENV=production` is combined with either
> `DATABASE_DRIVER=pglite` or `ADAPTER_MODE=mock`. **Production is PostgreSQL 16 with
> live adapters, per ADR-005 and ADR-007** — PGlite is a dev/test fallback, never a
> deployment target, and it has no durability, no second connection and no `fly
> postgres` behind it.
>
> One consequence worth knowing before you rely on it: under PGlite the database
> **is the process's memory**, so restarting `next dev` discards every case. That is
> also why `getDb()` and `getAdapters()` pin their handles to `globalThis` — Next
> compiles the RSC graph and the route-handler graph separately, and a per-module
> singleton would hand the two layers *different* empty databases (the symptom was a
> just-created case 404-ing from its own page).

`ADAPTER_MODE=mock` binds the in-repo fakes for Anthropic, Stripe, Resend and `NoticeSource`; `DATABASE_DRIVER=pglite` runs an in-process Postgres **with the committed migrations applied at first connection**, so the screens work end to end with no container and no keys. Both are **rejected in production** by `src/env.ts` — dev/prod parity (factor X) is preserved because the same schema, the same migrations and the same Drizzle queries run on both engines.

What that mode actually exercises, so its limits are known rather than discovered: the real pipeline, the real corpus, the real state machine, the real billing module and the real webhook handler. What it does not have is a live model (responses are replayed from the golden set) and a live Stripe (the return from Checkout synthesises the `checkout.session.completed` event **that Stripe would send, metadata included**, and drives it through the production `handleStripeWebhook` — the same signature check and the same idempotency).

### The corpus

```bash
npm run corpus:check                        # all of CORPUS_DESIGN §7, non-zero exit on violation
npm run corpus:check -- --manifest build/manifest.json
```

The corpus is **content on disk** (`corpus/`) read once at boot and memoised, not a fetched resource. `corpus:check` is the CI gate over it and prints the `prompt_bundle_hash` to stamp on the release; the hash is derived from content only, so a deploy that changes no policy text keeps the warm prompt cache. It also prints `codes_not_draftable` — the honest half. Today that is `AMZ.OPS.DROPSHIP`, whose only governing source is jurisdiction-caveated and therefore excluded from US drafting by gate G7.

`corpus/` ships in the image: Next traces it into the standalone output (`outputFileTracingIncludes`) and the Dockerfile copies it for the worker, which runs from source. A process that cannot read it refuses to serve rather than quietly substituting the synthetic fixture corpus.

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
npm test                            # vitest — 347 tests across 27 files, ~65s
npm test -- tests/integration.test.ts   # just the cross-module seams
npm run test:e2e                    # playwright — builds, starts a server, drives the journey
```

### The browser lane

`npm run test:e2e` builds the app and runs it as a production build, which is what CI should gate on. Two environment variables change that when you are iterating rather than gating:

```bash
E2E_DEV=1 npm run test:e2e          # drive `next dev` instead — no five-minute build per run
PLAYWRIGHT_CHROMIUM_PATH=/path/to/chromium npm run test:e2e
```

`PLAYWRIGHT_CHROMIUM_PATH` (or a binary at `$PLAYWRIGHT_BROWSERS_PATH/chromium`) makes the suite use a Chromium the image already has, because `npx playwright install` needs network access and a writable cache that a sandboxed runner may not have. The revision can then differ from the one Playwright shipped with; these specs assert copy, roles and navigation rather than rendering minutiae, so that is a knowing trade rather than an accident.

Either way the server runs with `ADAPTER_MODE=mock` and `DATABASE_DRIVER=pglite` — **no network, no keys, no container.**

`e2e/journey.spec.ts` walks the whole core journey (landing → paste → narrated progress → cited preview → checkout handoff → Plan of Action and checklist → case timeline) and writes a screenshot of each step, in both themes for the landing page, to [`../phase-2-build/screenshots/`](../phase-2-build/screenshots/).

What the suite covers, by layer:

| File(s) | What breaks if it fails |
|---|---|
| `tests/corpus.test.ts` | the parser, and every CORPUS_DESIGN §7 gate against the committed corpus |
| `src/lib/engine/citations.invariant.test.ts` | I2 — a policy reference reaching the UI without a citation object |
| `src/lib/engine/evals/golden-set.test.ts` | classification and drafting against recorded responses |
| `tests/case-state-machine.test.ts` | an illegal `cases.status` edge becoming a silent UPDATE |
| `tests/billing.test.ts`, `email.test.ts`, `outcome-capture.test.ts`, `queue.test.ts` | the data/billing modules against real Postgres constraints (PGlite) |
| `src/app/_lib/appeal-run.test.ts`, `api/.../stream/route.test.ts` | the narrated run and the SSE rejoin path |
| **`tests/integration.test.ts`** | **the seams between modules** — the corpus actually loading in the running process, inbound Shield mail reaching the classifier, the web tier's checkout producing a row the webhook can find, and every migration being applied |

**Every test runs with no network access and no real API keys.** This is a hard rule, not a convenience:

- Per-commit evals run against **recorded model responses**, so they are deterministic and free. Live-model evals run **nightly**, not per-commit (ARCHITECTURE §2.2 factor X, §6.4).
- `vitest.config.ts` pins `ADAPTER_MODE=mock` and `DATABASE_DRIVER=pglite` for the whole suite.
- A test that needs a live key belongs in the nightly lane, not here.

The mocks are faithful about the things the pipeline branches on — `stop_reason`, cache-hit token accounting, HMAC webhook signatures, and citations carrying a `document_index` (including one pointing at the seller's notice, so the ADR-102 allowlist can be exercised adversarially).

### The blocking CI order

Committed as [`../.github/workflows/ci.yml`](../.github/workflows/ci.yml) — the workflow, not just the intention.

```
typecheck → unit → citation invariant → golden-set eval → corpus:check → next build → docker build → migrate → deploy
```

The first six steps are the committed workflow; image build, migrate and deploy are the release job. The invariant steps run as their own named steps even though `npm test` already includes them: a green aggregate is not evidence that a *specific* gate ran, and an `include` glob edit can drop a file from the suite while every light stays green.

Three of those steps block the deploy on purpose: `citations.invariant.test.ts` (ADR-004/ADR-102), the golden-set eval (B10), and `corpus:check`. Without evals in CI, every prompt change is a coin flip — and a prompt change is the most common change this codebase will ever see. Without `corpus:check`, a corpus edit that breaks a citation chain reaches a paying seller.

`next build` is in the blocking order for a reason learned the hard way: the web bundle can differ from what `tsc` and `vitest` see. A dynamic `import(specifier)` typechecks, passes every test under `tsx`, and compiles under webpack into a module that throws — which is exactly how the corpus came to be unreachable from the web tier while all three green lights stayed on. `tests/integration.test.ts` now asserts the real corpus loads, and the build runs in CI rather than only at deploy.

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
