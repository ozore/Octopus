# `apps/wagelens`

Federal Davis-Bacon wage determinations, by state, county and construction type — with the
determination number, the modification number, the publication date and a link to the official
document on every rate. Built on `@octopus/platform`.

```bash
npm ci                                                  # from the repo root
npm run dev --workspace apps/wagelens                   # http://localhost:3000
npm test --workspace apps/wagelens                      # 132 tests, PGlite, offline
npm run build --workspace apps/wagelens                 # design-system drift check + next build
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test   # from apps/wagelens
```

Everything runs with **no credentials at all**: `ADAPTER_MODE=mock` binds the in-repo Stripe, Resend
and SAM.gov fakes, `DATABASE_DRIVER=pglite` boots a real Postgres in-process, and
`KB_SEED_FIXTURES=true` fills the corpus from the committed SAM.gov fixtures through the real
ingestion path. There is no inbox in mock mode, so the sign-in link is shown on the login page.

**The product's name is `APP_NAME`.** Every user-visible string, help article, legal page and email
resolves it from the environment, and no slug carries it, so renaming the product is one variable
and a redeploy (`tests/naming.test.ts` fails the build on a literal).

---

## What is here

| path | what |
|---|---|
| `src/lib/kb/` | the corpus: SAM.gov client (live + mock), parser, gates, ingest, lookup, jobs |
| `src/app/(marketing)/` | the public surface: the landing placeholder, the rate lookup, the determination pages, pricing, help, legal, the sitemap |
| `src/app/(app)/` | the signed-in product behind `requireOrg()`: projects, payroll, workers, alerts, settings |
| `src/app/api/cron/` | the queue drain and the three knowledge-base jobs |
| `src/components/` | provenance, disclaimers, the shell, the identity primitives |
| `src/lib/schema/` | `kb.ts` (the corpus) and `product.ts` (WL-02 … WL-08, WL-14) |
| `src/lib/repositories/` | the writes, with the property each one guarantees |
| `tests/fixtures/` | SAM.gov responses captured live and committed; every test replays them |
| `BUILD.md` | **the module map for sub-wave B** |
| `CLAUDE.md` | what tripped me up |

---

## The knowledge base

There is **no API key and no bulk download** for federal wage determinations
(`phase-4-revenue/wagelens/KNOWLEDGE_BASE.md` KB-5). The corpus exists because we build it from
SAM.gov's index and detail endpoints, one request at a time — which is also why it is worth having.

```bash
# development: bounded to 25 determinations
npm run kb:pull --workspace apps/wagelens -- --state TX

# the real thing for one state
npm run kb:pull --workspace apps/wagelens -- --state TX --full

# offline, on the committed fixtures
npm run kb:pull --workspace apps/wagelens -- --mock

# persist between runs, or write to Postgres
npm run kb:pull --workspace apps/wagelens -- --state TX --data-dir .pglite
DATABASE_URL=postgres://… npm run kb:pull --workspace apps/wagelens -- --state TX --full
```

Measured live on 2026-09-03: **290 active Texas determinations, 1,446 rate groups, 7,802
classification rows, 581 revisions of history, 254 counties, 0 failures, 183 s** at the ≤4 req/s
courtesy budget.

In production the same pipeline runs from cron: `/api/cron/kb-refresh` (daily, pre-flight → index →
diff → enqueue), `/api/cron/drain` (the queue), `/api/cron/kb-full` (weekly re-check),
`/api/cron/kb-backfill-history` (one-off at launch). `/api/health/corpus` is the ops surface and
reports `degraded` when the oldest active determination has not been re-verified in 35 days.

### The two properties that matter

**Every rate carries its source.** `<Rate>` stamps `data-wd-number`, `data-modification` and
`data-published` onto the element that carries the number, and a rate whose provenance is missing is
**not rendered at all** — the row says "source unavailable" and links out. Gate G8 is a test.

**A superseded modification is a first-class row.** 29 CFR 1.6 fixes the applicable determination at
solicitation or award, so the modification a contract incorporated governs the job even after DOL
publishes a newer one. `/wd/TX20260253/0` renders mod 0 in full, at mod 0's rates, with a permanent
line naming mod 1 — and never redirects to it. There is no "lite" ingest: a superseded revision goes
through the same parser, the same gates and the same transaction as an active one.

---

## Deploying

See `phase-4-revenue/DEPLOY_VERCEL.md`. Two things that are easy to miss:

- **migrations are not run by the build** — `npm run db:migrate` is a separate admin step;
- **the crons in `vercel.json` are daily**, because Vercel Hobby rejects anything more frequent. On
  Pro (required before charging), change the drain to `*/5 * * * *` or the corpus takes ~14 hours of
  ticks to reach steady state from cold.

`STRIPE_SETUP.md` is generated from `src/lib/plans.ts` (`npm run stripe:setup`) and is the founder's
checklist. There is deliberately **no GC Roll-up price**: that tier is published as "coming" and is
not for sale until WL-24 ships.
