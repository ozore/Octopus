# Ratepin

A certified-payroll **rate-of-record engine** for open-shop specialty subcontractors on
Davis-Bacon (federally funded) construction.

Payroll CSV in. **WH-347 PDF plus the statement of compliance** out, and **California DIR
eCPR XML** where the project is Californian. Every rate on every filing is pinned to a named
wage-determination number, revision and publication date, mirrored from SAM.gov and printed on
the artifact itself.

The product runs with **zero human minutes on the seller side** — `../PLAN.md` A1–A6. There is
no support address, no contact form, no chat, no escalation path and no queue anywhere in the
compliance flow. When the system is unsure it says so **inside the product**: it blocks the
line and offers a closed choice, marks the document `DRAFT — NOT CERTIFIABLE` and withholds the
signature block, narrows the claim with a date and credits automatically, or declines the
conclusion and states the rule instead. Those four moves are P-A, P-B, P-C and P-D in
`../phase-2-build/architecture/USER_JOURNEY.md` §8, and they are the whole of what happens when
something goes wrong.

---

## The architecture in brief

One deployable, two process types (`web`, `worker`), one Postgres. ADR-005: Postgres is the
database, the queue, the scheduler and the tenant boundary — there is no Redis, no SQS and no
cron daemon.

| Layer | Path | What it owns |
|---|---|---|
| **Corpus** | `src/corpus/` | The SAM.gov mirror. Fetch, canonicalise, parse, reconcile across three independent paths, probe, snapshot, promote. Content-addressed blobs with a digest CHECK in the database, so content-addressing is a property of Postgres rather than of the ingest code. |
| **Engine** | `src/engine/` | The arithmetic. A pure function of two values — a payroll week and a pinned rate table — with no clock, no locale and no randomness. CWHSSA, fringe, deductions, narrowing, and `deriveStatus`, which is the **only** function that may set an artifact's status. |
| **Classify** | `src/classify/` | The L-A…L-F ladder that maps a payroll job title onto a row of the pinned determination. L-A auto-applies; every other rung **blocks the line** and offers candidates with the determination's own verbatim scope text. The model ranks; it never decides. |
| **Artifacts** | `src/artifacts/` | The WH-347 renderer (a real PDF writer, no external library), the eCPR XML renderer against the hash-pinned DIR XSD, and the provenance block. |
| **Platform** | `src/platform/` | Auth, billing, metering, dunning, credits, deletion, export, the ops gates and `/status`. |
| **Worker** | `src/worker/` | Sixteen jobs on **slots, not timers** — the slot name *is* the idempotency key, so N workers and a restart produce one job. |
| **Web** | `src/app/` | Four route groups: `(marketing)`, `(free)` — the free WH-347 generator and the county × craft rate pages, `(app)` — the authenticated product, and `/status`. |

Two invariants worth naming because most of the code depends on them:

- **All money through the money type.** `MilliRate` and `Cents` are integers. No float reaches
  a form.
- **Never render a number the engine did not compute.** Every figure on every surface —
  including the landing page's specimen artifact — is derived, not typed.

---

## Running it

Node ≥ 22.

```bash
npm install

# One command, no container, no network, no credentials.
cp .env.example .env.local          # or export the four vars below
npm run seed                        # migrate, ingest, sign in, upload, resolve, generate
npm run dev                         # http://localhost:3000
```

`npm run seed` needs exactly this much environment:

```bash
DATABASE_DRIVER=pglite
PGLITE_DATA_DIR=.pglite             # a directory, so seed and dev share one database
ADAPTER_MODE=mock                   # bind the recorded fixtures; no live SAM, Anthropic or Stripe
NODE_ENV=development
```

### What the seed actually does

It walks the whole product in one process, calling the same functions the running application
calls at every step — nothing is inserted behind the app's back except the one
`billing_account_index` row a Stripe webhook would have written, and it is seeded in the state a
brand-new account is genuinely in (`none`).

1. **Migrate** — `applyMigrations`, plus the platform DDL.
2. **Ingest the mirror** — `runIngest` over the bytes SAM.gov actually sent on 2026-08-13,
   recorded in `tests/corpus/fixtures/`. Three determinations promote: `VA20260195` rev 2,
   `LA20260005` rev 2, `DC20260001` rev 5.
3. **Sign in** — a real magic link is minted and redeemed once; the account, user, membership
   and session all come out of `redeemMagicLink`.
4. **Create a project** — Route 17 shoulder widening, Gloucester County VA, Highway, FHWA
   funded, over $100,000 — pinned to `VA20260195` rev 2, published 2026-08-06.
5. **Upload payroll** — `fixtures/seed/payroll-2026-08-14.csv`, six workers, parsed and mapped
   by component **M**'s own `parseCsv` / `suggestMapping` / `mapRows`.
6. **Resolve** — five payroll titles, each blocked by the ladder and each answered by naming
   the classification meant. The seed names it and fails if the pinned revision did not offer
   it; taking whatever ranked first would teach the wrong lesson, since the bare title
   `Laborer` ranks `LABORER: PIPELAYER` above `LABORER: COMMON OR GENERAL`.
7. **Generate** — `CERTIFIABLE`, signature block rendered, and a two-page WH-347 PDF plus the
   exception report written to `.seed-out/`, each verified against the digest its `artifacts`
   row carries.

The seed is **idempotent on the mirror and the account** and deliberately **not on payroll**:
re-importing a week silently is the behaviour §5.4 refuses, so a second run adds a new project
and a new week rather than overwriting one.

### Other commands

| Command | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit`, strict, no `any` in an exported signature |
| `npm test` | The full offline suite |
| `npm run build` | `next build` — 33 routes |
| `npm run db:migrate` | The admin process (factor XII): the SQL migrations plus the platform DDL, through a `schema_migrations` ledger with checksums |
| `npm run worker` | The 16-job worker |
| `npm run corpus:ingest` | The nightly SAM.gov crawl (live; needs network) |
| `npm run canary` | Scores the golden payroll suite. **Exits non-zero today** — see below |
| `npm run seed` | The walk above |

---

## The test story

**807 tests across 41 files. Every one offline and deterministic.**

`vitest.setup.ts` replaces `globalThis.fetch` with a function that **rejects**, so the offline
guarantee is a mechanism and not a rule. Every upstream is exercised through recorded bytes: an
unrecorded URL throws rather than 404s, because a test that reaches an unrecorded endpoint has
changed what it exercises and silently returning "not found" would let it keep passing.

The database in tests is **PGlite** — a real Postgres engine compiled to WASM — running the
*same* migration SQL that ships. Not a trimmed schema: the append-only triggers, the digest
CHECK, the generated columns and above all the row-level-security policies are where most of
the interesting behaviour lives. The suite switches the session role to `ratepin_app`
(`NOBYPASSRLS`) for application queries, because PGlite connects as a superuser and a superuser
ignores every policy silently — a tenant boundary that passes its tests and leaks in production
is exactly the shape of failure ADR-011 exists to prevent.

Four layers of test, roughly:

- **Unit and property** — the money kernel, the arithmetic, the parser, the ladder, `fast-check`
  properties over the engine's invariants.
- **Golden fixtures** — the eleven regulatory cases of `ENGINE.md` §12.3, each run twice to
  catch nondeterminism, plus byte-level PDF structure and XSD parity.
- **Integration** (`tests/integration/e2e.test.ts`) — runs `seedRatepin`, the *same function*
  `npm run seed` runs, and asserts the whole walk. A seed that only executes when someone
  remembers it is broken most of the time; this one runs on every commit.
- **Lint as test** (`tests/lint/claims.test.ts`) — the corrections register and A3, below.

### `claims-lint`

`../phase-2-build/CORRECTIONS.md` §3.3 is explicit: *"`claims-lint` reads only that file, so
the register cannot drift from what CI enforces."* The test extracts the `[STRUCK:ALL]` JSON
block from the register at its authoritative path and runs it. Amend the register, and CI
changes behaviour on the next run with nobody remembering to update anything.

It honours §3.2's two severities rather than improving on them. The **`probes`** set — the
struck strings themselves, measured red rate 0/209 after the negation guard — **blocks**. The
**`hygiene`** set — the broader category bans, measured 100% false-positive rate — is
**recorded and never blocks**. A lint that red-flags correct work is a lint somebody disables,
and the disabling happens quietly, and then nothing is enforced.

The same file asserts **A3 over every rendered surface at once** — no contact affordance, no
mail address, no `mailto:`, no telephone number, no promise that a person will act, no
escalation path, and no third-party widget that could inject one. It strips comments before
matching, because this codebase documents its refusals in the code that performs them and the
first run failed on the module headers explaining why the lint exists. A companion test feeds
each probe a sentence it must catch, so "green" cannot mean "matching nothing".

---

## Environment variables

Validated by Zod at boot, in `src/lib/config.ts`. **Boot fails on a missing or malformed
value** rather than on the first customer request. `.env.example` documents all of them; the
ones that matter:

| Variable | Notes |
|---|---|
| `DATABASE_DRIVER` | `postgres` \| `pglite`. `pglite` is **refused outright** under `NODE_ENV=production` |
| `DATABASE_URL` | Required when the driver is `postgres` |
| `DATABASE_APP_ROLE` | Must not be a superuser — a superuser bypasses every RLS policy silently |
| `PGLITE_DATA_DIR` | Makes the dev fallback persistent, so `seed` and `dev` share one database |
| `ADAPTER_MODE` | `live` \| `mock`. `mock` binds the recorded fixtures and is **refused in production** |
| `DIR_XSD_SHA256` | ADR-009 pins the CA schema by **content hash** — the XSD advertises `version="1.0"` while DIR publishes it as V1.3. Version attributes lie; hashes do not. Boot fails without it |
| `FRESHNESS_DATED_HOURS` / `FRESHNESS_SLA_HOURS` | The L1/L2 ladder. The SLA threshold must be later than the DATED one |
| `CLAIM_G1…G5` | The gate flags. All **false**. See below |
| `ANTHROPIC_API_KEY` | Optional. Absent, the classification ladder degrades L-D → L-E, the lexical picker the free generator uses every day. **It never blocks a filing** |
| `STRIPE_*`, `R2_*`, `RESEND_API_KEY`, `KMS_KEY_URI` | Required in production, unused offline |

---

## What is NOT built

Stated plainly, because a README that reads as a feature list is the first place a product
starts lying about itself.

**The four claim gates have not passed, and every one of them is locked in config.**
`CLAIM_G1_RATE_CORRECTNESS`, `CLAIM_G2_FORM_ACCEPTANCE`, `CLAIM_G3_CORPUS_COMPLETENESS`,
`CLAIM_G4_TIME_SAVED` and `CLAIM_G5_AUTONOMY` are all `false`. While a gate is locked the
renderer emits the *mechanism* sentence and declines the *outcome* sentence — P-D. None of them
may be flipped by hand to make copy read better.

- **G1 — the golden payroll suite is a skeleton.** The eleven regulatory fixtures are
  implemented and they pass. The ≥500-line suite over ≥25 pinned determinations across ≥8
  states does not exist: `npm run canary` measures 18 payroll lines, 1 determination and 2
  states, and exits non-zero. `npm run corpus:ingest` therefore **HELDs** every night on
  `COVERAGE_SHORTFALL`, which is §22 working rather than a bug to route around. Nothing in this
  repository may claim the arithmetic is correct — a suite that has not failed is evidence, not
  proof.
- **The mirror holds three determinations, not 4,236.** It is seeded from recorded fixtures.
  A real corpus needs `npm run corpus:ingest` against live SAM.gov, and that path is written but
  has only ever run against fixtures here.
- **No California determination is in the recorded corpus**, so the seeded end-to-end path
  produces no eCPR XML — the chip blocks it with its non-CA reason, correctly. The eCPR
  renderer, its XSD pin and its parity tests are complete and are exercised by
  `tests/artifacts/`; what is missing is a recorded CA document to run them end to end against.
  Fabricating one would put rates nobody fetched into the mirror.
- **`/rates/watch` (S05) is not built.** It needs email infrastructure.
- **§1.1's third WD option — "skip and type the rates" — is not shipped.** It would require
  inventing a `WdNumber` to reach `PinnedRateTable`, and then printing it in the form's WD field
  and footer. The screen states the two real paths and why there is no third.
- **Live Stripe, R2, Resend and KMS are configured and never called offline.** `ADAPTER_MODE=mock`
  binds fixtures for all of them, and production boot refuses to start without the real keys.
- **The Playwright e2e suite (`e2e/`) is scaffolded and not part of `npm test`.** The
  integration coverage that exists is `tests/integration/e2e.test.ts`, which drives the server
  functions directly rather than a browser.
- **One spec conflict is unresolved in the documents and resolved in the code.**
  `USER_JOURNEY.md` §12.2 says account deletion deletes filings and artifacts;
  `ARCHITECTURE.md` §5.5 retains them three years as the evidence layer behind a signed federal
  certification. The code executes §5.5 and records the divergence in
  `src/platform/account/deletion.ts`.
- **`ARCHITECTURE.md` §10.5 permits exactly one contact address** — on the billing page, for
  card disputes, counted against G5. **It is not rendered anywhere today.** The address list in
  `src/platform/ops/inbound.ts` is the registry G5 counts against, not an affordance.

---

## Specification

The documents are binding and they were reviewed adversarially. Where this code and a document
disagree, the disagreement is recorded in the module header rather than silently resolved.

- `../PLAN.md` — the A1–A6 autonomy gate
- `../phase-2-build/architecture/USER_JOURNEY.md` — screens S00–S24, journeys J1–J12, the four
  refusal primitives and every copy specimen
- `../phase-2-build/architecture/ARCHITECTURE.md` — routes §3.1, statuses §6.3, the ladder §8
- `../phase-2-build/architecture/ENGINE.md` — the arithmetic and the L-A…L-F ladder
- `../phase-2-build/architecture/CORPUS_DESIGN.md` — the self-refreshing mirror
- `../phase-2-build/identity/DESIGN_SYSTEM.md` — `rp-` prefix, paper not glass, a 15px
  interface floor, status as word + glyph + border-style + hue, a motion allow-list, no
  `backdrop-filter`, no spinner, no skeleton, no support widget, no success alert
- `../phase-2-build/CORRECTIONS.md` — the struck-claims register, executed by
  `tests/lint/claims.test.ts`

**Ratepin computes and formats. You certify and file.** This is not legal advice.
