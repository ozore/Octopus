# `apps/wagelens` — the module map for sub-wave B

**Written by:** Lead Builder, wave 2 sub-wave A. **Date:** 2026-09-03.
**Read first:** [`README.md`](README.md) (how to run it), [`CLAUDE.md`](CLAUDE.md) (what tripped me
up), and your own spec in `phase-4-revenue/wagelens/specs/`.

Sub-wave A built the foundation: the app on `@octopus/platform`, the identity, the corpus and its
refresh pipeline, the public rate lookup, accounts, and the data model for every MVP spec. This
file is how five or six agents build the rest **in parallel without touching each other's files**.

---

## 0. The five rules that make parallel work possible

1. **You own the directories in your row of §2 and nothing else.** If you need a change in a file
   another agent owns, write it in your report and let the orchestrator sequence it. Do not edit it.
2. **The shared pieces in §3 are frozen.** They are frozen because a change to any of them changes
   every screen at once, and because the gates in §4 are asserted against them.
3. **Add a migration, never edit one.** `npm run db:generate --workspace apps/wagelens` writes
   `drizzle/000N_*.sql` and appends to `drizzle/meta/_journal.json`. That journal is the ONE shared
   file two agents can collide in — see §5.
4. **Every rate goes through `<Rate>`. Every screen that shows one shows a disclaimer.** Gate G8 is
   a test (`tests/gates.test.tsx`) and it will fail your build, which is the point.
5. **Nothing in `src/` may contain the product's name as a literal, or the phrases in
   `tests/naming.test.ts`.** `productName()` reads `APP_NAME`. The founder's rename must be an
   environment variable and a redeploy.

---

## 1. What exists now

| area | where | state |
|---|---|---|
| Scaffold on the platform | `src/env.ts`, `src/lib/db.ts`, `src/lib/platform.ts`, `src/lib/plans.ts` | done |
| Identity | `src/styles/design-system.css` (a byte-identical copy of the fleet's file, drift-checked at build), `src/styles/app.css`, `src/components/` | done |
| App shell, 216px rail | `src/components/shell.tsx` | done |
| Provenance, disclaimer, pill, ledger row | `src/components/provenance.tsx`, `disclaimer.tsx`, `primitives.tsx` | done |
| **WL-13** corpus + refresh | `src/lib/kb/**`, `src/app/api/cron/kb-*`, `src/app/api/health/corpus` | done |
| **WL-00** public rate lookup | `src/app/(marketing)/lookup/**`, `wd/[...ref]`, `sitemap.xml`, `api/public/counties` | done |
| **WL-01** accounts | platform magic link, themed: `src/app/(auth)/login/**` | done, with deviations (§6) |
| Data model WL-02 … WL-08, WL-14 | `src/lib/schema/product.ts`, `drizzle/0000_wagelens_init.sql` | done |
| Repositories | `src/lib/repositories/**` | done, unit-tested |
| Analytics vocabulary | `src/lib/analytics/events.ts` | done |
| Help, legal | `src/content/help/articles.ts`, `src/app/(marketing)/help/**`, `legal/[doc]` | partial (§2, WL-11) |
| Landing page | `src/app/(marketing)/page.tsx` | **placeholder** (§2, LANDING) |
| Billing surface | `src/app/(app)/settings/billing`, `(marketing)/pricing` | platform's, themed (§2, WL-09) |
| Everything else | — | not built |

**Routes that exist today**

```
public   /                        landing placeholder with the live lookup
         /lookup                  the widget, full page, + how to read a determination
         /lookup/:state/:county/:type   server-rendered result: 1 / n / 0
         /wd/:wdNumber            the determination at its active modification
         /wd/:wdNumber/:mod       …at an explicit modification, superseded included
         /pricing  /help  /help/:slug  /legal/:doc  /sitemap.xml
         /api/public/counties     the county select's data (the only public JSON)
         /api/health/corpus       the ops surface and gate G6's source
auth     /login  /login/callback
app      /projects  /projects/new  /projects/:id
         /payroll  /workers  /alerts        (placeholders, owned below)
         /settings  /settings/billing
         /dashboard → /projects             (the platform's name, redirected)
api      /api/stripe/webhook  /api/cron/drain
         /api/cron/kb-refresh  /api/cron/kb-full  /api/cron/kb-backfill-history
         /api/auth/request  /api/auth/signout
admin    /admin                   OPS_SHARED_SECRET
mock     /mock/checkout/:id       ADAPTER_MODE=mock only; the e2e purchase
```

---

## 2. The module map — one row per agent

Each row gives: what you own, what you must not touch beyond §3, what to prove, and the commands.
**Every row's acceptance criteria are the ones in its spec** — this table names the ones a reviewer
will check first, not a replacement for the spec.

### WL-02 · Project setup with wage-determination lookup

| | |
|---|---|
| **You own** | `src/app/(app)/projects/**` (replace all three files), `src/lib/repositories/projects.ts`, a new `src/components/wd-picker.tsx` |
| **Reuse, do not rebuild** | `getDetermination`, `findDeterminations`, `getModificationHistory`, `listCounties`, `aliasCandidates` from `@/lib/kb`; `createProject` / `repinDetermination` from the repository; `<ProvenanceCard>`; `CONSTRUCTION_TYPE_DESCRIPTIONS` |
| **Already true, keep it true** | the three pin cases (no mod → active; explicit active → that one; explicit superseded → THAT ONE, `wdPinnedSuperseded = true`, never blocked); a pair absent from the corpus is refused; a pin is never written without its history row |
| **Prove** | V6 — with `candidates.length > 1` nothing is preselected and the form cannot submit; V3a — a superseded modification is only pinnable when the user NAMED it; V3b — the permanent notice renders on the card, the determination page and every draft payroll header; V7 — re-pinning after a certified payroll needs a confirmation and writes `reason='corrected'`; V8 — all four alias forms resolve |
| **Events** | `project_create_started`, `wd_search_performed`, `wd_search_ambiguous`, `wd_search_zero_results`, `wd_entered_by_number`, `wd_resolve_failed`, `wd_pinned`, `project_created`, `determination_card_viewed`, `project_repinned` |
| **Run** | `npm test --workspace apps/wagelens && npm run build --workspace apps/wagelens` |

### WL-03 · Classification catalogue

| | |
|---|---|
| **You own** | `src/app/(app)/projects/[id]/classifications/**`, `src/components/classification-picker.tsx` |
| **Reuse** | `searchClassifications`, `getDeterminationText`, `<ClassificationTable>` in `src/components/determination.tsx` (extend it by props, do not fork it) |
| **Prove** | V1 — the catalogue is scoped to the project's PINNED modification, never the active one; the determination's verbatim text is readable; a determination with 300 classifications paginates server-side; `classification_zero_results` fires with the query |
| **Careful** | `kb_classifications` is keyed on `(wd_id, line_no)` because labels repeat. Never key a UI list on the label. |

### WL-04 · Workers and classification mapping

| | |
|---|---|
| **You own** | `src/app/(app)/workers/**`, `src/app/(app)/projects/[id]/crew/**`, `src/lib/repositories/workers.ts`, conformance under `src/app/(app)/projects/[id]/conformance/**` |
| **Add to the schema** | `apprenticeship_programs`, `conformance_worksheets` (WL-04's data model) — new tables in a NEW file `src/lib/schema/workers-extra.ts`, exported from `src/lib/schema.ts`, then `db:generate` |
| **Prove** | gate G7 — the paste path refuses a full identifying number and fires `ssn_full_entry_blocked`; a mapping copies the label and BOTH rates onto the row; unmapping is `unmapped_at`, never a delete; the conformance article's four strings are linked from the "nothing matches" path |
| **Careful** | `addWorker` already refuses more than four digits. Keep that refusal in the repository, not only in the form: a CSV paste does not go through the form. |

### WL-05 · Weekly hours entry

| | |
|---|---|
| **You own** | `src/app/(app)/projects/[id]/weeks/**`, `src/lib/repositories/payrolls.ts`, `src/lib/domain/payroll-math.ts` (new) |
| **Add to the schema** | `fringe_plans`, `payroll_line_fringe_credits` in a new `src/lib/schema/fringe.ts` |
| **Already true, keep it true** | the payroll number is allocated AT CERTIFICATION under an advisory lock, so an abandoned draft leaves no gap; `payrolls.wd_number` / `wd_modification_number` are frozen at creation and never re-read |
| **Prove** | the 7×2 grid round-trips; `payroll_copied_from_last_week`; the below-determination-rate warning; `payroll_certified.minutes_in_grid` (THRESHOLDS reads it); certification is idempotent |

### WL-06 · WH-347 and Statement of Compliance

| | |
|---|---|
| **You own** | `src/lib/documents/**`, `src/app/(app)/projects/[id]/weeks/[wk]/wh347/**`, `src/app/api/share/[token]/route.ts`, `src/lib/repositories/documents.ts` |
| **Reuse** | `documentFooterText()` in `src/components/disclaimer.tsx` — the §9.2 footer, verbatim, in ONE place; `createShareLink` / `consumeShareLink` / `revokeShareLink` |
| **Prove** | gate G5 — the Statement of Compliance string is byte-identical to `tests/fixtures/wh347-page2-statement-of-compliance.txt` and the form's sha256 matches; V2 — the extracted PDF text contains the WD number, the modification, the date and "not an official DOL document"; the share link expires at 7 days, is revocable individually and in bulk, and counts every access; `wh347_generated` is the ACTIVATION EVENT and fires once per payroll |
| **Careful** | the WH-347 PDF has **zero form fields** (KB F2). You are drawing a document, not filling one. |

### WL-07 · Payroll history and export

| | |
|---|---|
| **You own** | `src/app/(app)/projects/[id]/submissions/**`, `src/app/(app)/payroll/**`, `src/lib/export/**` |
| **Already in the schema** | `payrolls.submission_status`, `submitted_at`, `submission_recipient`, `submission_status_note` |
| **Prove** | the gap banner counts missing weeks correctly across a year boundary; marking `rejected` fires E5 and changes no payroll line and no document hash; the export contains every rate with its source and date |

### WL-08 · Determination-change alerts

| | |
|---|---|
| **You own** | `src/app/(app)/alerts/**`, `src/lib/domain/wd-diff.ts` (new), and the `wd.modification_detected` handler |
| **Take over** | `registry.override(KB_JOB_KINDS.modificationDetected, …)` in `src/lib/kb/jobs.ts` — it is a REGISTERED NO-OP today, with a comment naming you. Move the body into your own module and register it from `src/lib/platform.ts`; leave `jobs.ts` otherwise alone |
| **Reuse** | `recordAlert` (idempotent by unique index), `projectsPinnedTo` |
| **Prove** | one alert per (project, wd, to_modification) — a re-run sends no second email; the diff names changed / removed / added classifications and the affected workers; a project pinned to modification *n* still reads *n* after the alert is dismissed (gate G9) |
| **Note** | the corpus side already works: ingesting a newer modification fans out one `wd.modification_detected` job per pinned project. `tests/jobs.test.ts` proves it. |

### WL-09 · Billing

| | |
|---|---|
| **You own** | `src/app/(marketing)/pricing/page.tsx`, `src/app/(app)/settings/billing/**`, a new `src/app/(app)/billing/start/**` (the trial-terms screen), `src/lib/schema/billing-extra.ts` for `subscription_terms_acceptances` |
| **Already true, keep it true** | the GC Roll-up tier has **no plan key and no price variable**, so nothing can sell it; no control anywhere calls the trial free; `tests/naming.test.ts` fails the build on either |
| **Prove** | V14/V15 (finding B9) — the trial-terms disclosure renders BEFORE the card field and the consent record is written with its version; V17 — Checkout refuses a plan outside the sellable set; V18 — the boot assertion fails the deploy if a live-mode GC price id is present; V19 — the GC card contains no purchase control |
| **Careful** | the webhook is the ONLY writer of entitlement. The redirect grants nothing. |

### WL-10 · Settings

| | |
|---|---|
| **You own** | `src/app/(app)/settings/**` except `billing/` |
| **Prove** | the certifying official, the fringe plans and the notification preferences persist; the export and delete paths exist and say what they do |

### WL-11 · Help, disclaimers and legal — **partially done**

| | |
|---|---|
| **Done** | the six articles (`src/content/help/articles.ts`), `/help`, `/help/:slug`, `/legal/:doc` with the share-link and watch paragraphs (V9, V10), `<Rate>` / `<ProvenanceLine>` / `<ProvenanceCard>` / the disclaimers, and the CI greps (`tests/naming.test.ts`) |
| **You own** | `src/components/certify-disclaimer.tsx` (`<CertifyDisclaimer>` with the 18 U.S.C. § 1001 / 31 U.S.C. § 3729 line), the onboarding acknowledgement writing `disclaimer_acknowledgements` with the content hash, and `/help` search |
| **Do not** | edit `src/components/provenance.tsx` or `disclaimer.tsx` without telling the orchestrator: gate G8 and four suites assert their output |

### WL-12 · Admin metrics

| | |
|---|---|
| **You own** | `src/app/admin/**` |
| **Reuse** | the platform's `computeMetrics` and `renderAdminTable`; `ACTIVATION_EVENT` is `wh347_generated` and is defined once, in `src/lib/plans.ts` |
| **Prove** | V4 — one activation definition in one module; V5 — no admin surface renders an email, a worker name or an IP address |

### WL-14 · Public determination watch

| | |
|---|---|
| **You own** | `src/app/(marketing)/watch/**`, the watch form component, the `wd.watch_notify` handler, `src/lib/email/watch-templates.ts` |
| **Take over** | `registry.override(KB_JOB_KINDS.watchNotify, …)` — a registered no-op today |
| **Reuse** | `requestWatch` / `confirmWatch` / `unsubscribeWatch` / `confirmedWatchers` in `src/lib/repositories/alerts.ts`, all unit-tested; `ipHash()` in `src/lib/public-request.ts` |
| **Prove** | the consent box is UNTICKED and names the determination; double opt-in; ≤3 per address; one-click unsubscribe in the body AND in `List-Unsubscribe`; the postal address in every message; the form renders BELOW the last classification row (WL-00 V11) |
| **Platform request** | `email_suppressions` exists in the platform but has no `scope` column (§7). Until it does, encode the scope in `reason` — `unsubscribed_watch` / `unsubscribed_outbound` — and never suppress a transactional send. |

### LANDING · the landing page

| | |
|---|---|
| **You own** | `src/app/(marketing)/page.tsx` and everything it imports under `src/components/landing/**` |
| **Reuse** | `<LookupForm>` — the live lookup is element #2 and it already works; the corpus counts from `corpusHealth()` |
| **Prove** | LANDING V2 — the determination timeline renders from REAL `kb_wd_modifications` rows (run `/api/cron/kb-backfill-history` first, or the table is empty for your demo determination); the 450-word ceiling above the pricing block; the GC card is a waitlist with `gc_tier_interest` and no purchase path; every event name comes from `src/lib/analytics/events.ts` and none is coined |
| **Careful** | `tests/naming.test.ts` bans the banned phrases in `src/`. Write the copy against it, not around it. |

---

## 3. Shared pieces — do not edit without telling the orchestrator

| file | why it is frozen |
|---|---|
| `src/styles/design-system.css` | a byte-identical copy of `phase-4-revenue/wagelens/design-system.css`. `scripts/check-design-system.mjs` fails the build on any drift, and the identity author owns the source. Style from the `--wl-*` tokens; never edit the system. |
| `src/components/provenance.tsx` | gate G8 lives here. Every rate in the product renders through it. |
| `src/components/disclaimer.tsx` | the three disclaimer texts and the PDF footer, verbatim from KNOWLEDGE_BASE §9. One copy of the words. |
| `src/components/shell.tsx` | the rail, its width and its order. |
| `src/lib/kb/**` | the corpus. `lookup.ts` is the only module WL-00/02/03/04 touch; the adapters, the parser and the ingest transaction are implementation. Adding a query is fine — tell the orchestrator; changing the parser needs a re-run of the fixtures and a bump of `PARSER_VERSION`. |
| `src/lib/analytics/events.ts` | the canonical vocabulary. Adding a name means editing `WL-EVENTS.md` **and** this file in the same change. |
| `src/lib/schema/kb.ts` | the corpus schema. Product tables go in `product.ts` or a new file. |
| `src/env.ts`, `src/lib/platform.ts`, `src/lib/plans.ts` | the composition root and the offer. Coordinate. |
| `drizzle/0000_wagelens_init.sql` and `drizzle/meta/` | applied migrations are immutable. See §5. |

---

## 4. The gates your build must pass

Run `npm test --workspace apps/wagelens` — these are already in it and they will fail your work
before a reviewer does.

| gate | test | what it refuses |
|---|---|---|
| **G3** | `tests/kb-ingest.test.ts` | a determination that parses below 99.5% coverage is rolled back, not partially stored |
| **G4** | schema CHECK + `tests/kb-ingest.test.ts` | a base rate of zero or a negative fringe |
| **G7** | `tests/gates.test.tsx` | any column that could hold a full identifying number, a home address or a date of birth |
| **G8** | `tests/gates.test.tsx` | a currency figure without `data-wd-number` and `data-modification` on an ancestor |
| **G9** | `tests/kb-lookup.test.ts` | a project reading a rate from a modification it is not pinned to |
| **G10** | `tests/kb-ingest.test.ts` | an index that shrank past ±20% being treated as data loss instead of an outage |
| naming | `tests/naming.test.ts` | a hard-coded product name, a product name in a slug, `13,508`, a compliance guarantee, a claimed success rate, "audit-proof", "100% accurate", "we file for you", "seamless", "effortless", or a call to action that calls the trial free |
| tokens | `tests/naming.test.ts` | a hex, `rgb()` or `hsl()` in any component or in `app.css` |
| identity | `scripts/check-design-system.mjs` (run by `npm run build`) | a drifted copy of the identity stylesheet |
| vocabulary | `tests/events-and-content.test.ts` | an `emitEvent` literal that is not in `WL-EVENTS.md` |
| privacy | `tests/events-and-content.test.ts` | an email, a worker name or an IP address in `events.props` |

---

## 5. Migrations, and the one file two agents can collide in

```bash
# 1. add your tables to your OWN schema file, export them from src/lib/schema.ts
# 2. generate
npm run db:generate --workspace apps/wagelens
# 3. commit drizzle/000N_*.sql AND drizzle/meta/
```

`drizzle/meta/_journal.json` is append-only and shared. If two agents generate at the same time you
get two `0001_*` files and a conflicting journal. **The fix is not to hand-merge**: delete your own
generated pair, pull the other agent's, and re-run `db:generate` — drizzle will produce a `0002`
against the updated snapshot. Never edit an applied migration; add another.

Migrations are **not** run by the build (`npm run db:migrate` is a separate admin step). A build
that half-migrates a database while the previous deployment is serving it is the worst kind of
outage.

---

## 6. Spec deviations made in sub-wave A, and why

Each one is a decision I would defend; each is cheap to reverse if the reviewer disagrees.

| # | spec | what the spec says | what was built | why |
|---|---|---|---|---|
| **D1** | WL-01 flow | `/signup`, `/check-email`, a two-step `GET → POST /auth/verify`, a six-digit cross-device code, a 20-minute token | the platform's `/login` + `/login/callback`, one step, no code; `LOGIN_TOKEN_TTL_MINUTES=20` in `.env.example` | the brief says "the platform's magic-link login and organisation flow **wired and themed**". Rebuilding auth inside the app would fork the seam the platform exists to own and would duplicate its six tested security properties. **The two-step verify and the six-digit code are real requirements and are unbuilt** — they need `packages/platform` changes, listed in §7. Everything else WL-01 asks for is already true: identical responses for known and unknown addresses, per-email and per-IP rate limits, hashed single-use tokens, no password column anywhere. |
| **D2** | WL-01 / WL-14 | `citext` for `users.email` and `wd_watches.email` | `text`, normalised (trimmed, lower-cased) on write | PGlite has no `citext` extension, and dev/test parity on a real Postgres is worth more than a collation. The platform already normalises in one function; `requestWatch` does the same. |
| **D3** | KNOWLEDGE_BASE §3.1 | `uuid PK` on every table | `text` primary keys carrying prefixed ULIDs (`wd_…`, `cls_…`, `prj_…`) | every platform table is `text` + `newId()`. One id convention across the app means a foreign key never crosses a type and an id in a log line says what it is. No behaviour depends on the difference. |
| **D4** | WL-11 | help articles as MDX under `content/help/` | a typed array in `src/content/help/articles.ts` | MDX needs a compiler plugin in `next.config.mjs`, which every app in the monorepo would then carry. The typed array gives the same properties — in the repository, diffable, reviewable in a PR — plus a **compile-time** guarantee that every article has `lastReviewed` and its sources, which is what V6 actually asks for. |
| **D5** | WL-13 reference parser | the parser is a port of `kb-samples/parse-wd-document.py` | ported exactly, then **one regex extended**: a fringe may carry a footnote marker (`38.435+a+b`) | the reference regex misses that line, and the line is in `sam-wd-detail-TX20260253-rev0.json` — the rev-0 fixture **the reviewer's build-order condition 1 required**. With the reference regex, mod 0 parses at 0.9815 and gate G3 rolls back the very determination B3/B4 are proved on. `tests/kb-parser.test.ts` asserts byte-parity with the reference output on mod 1 *and* full coverage on mod 0. |
| **D6** | WL-13 parser | counties from the document text | counties from the **index record**, with the document's list kept as an informational field; the parser's county block now takes only its first paragraph | SAM prints two county-header shapes; mod 0 of TX20260253 uses `"County: Harris County in Texas."` followed by a scope paragraph, which the reference parser returned as three "counties". `kb_wd_counties` needs SAM's numeric codes anyway — a county NAME queries SAM for nothing (KB-1). |
| **D7** | WL-13 | on-demand fetch of a superseded revision has no index record, so no county set | inherits the county set of the newest revision held; if none, stores none | a superseded revision is reached by number, never by geography. Inventing a county list for it would be inventing data. |
| **D8** | WL-05 | `SELECT max(payroll_number) … FOR UPDATE` | `pg_advisory_xact_lock` on `(project, filer)`, then the max | Postgres refuses `FOR UPDATE` with an aggregate, and — the reason that matters — the FIRST certification on a project has no row to lock, so a row lock cannot serialise it at all. |
| **D9** | WL-00 / UX.md | UX.md calls the public pages `/rates` and `/rates/[wd]`; WL-00 calls them `/lookup` and `/wd/:wdNumber` | WL-00's routes | the spec carries the acceptance criteria and the canonical URL rules (`sitemap.xml`, the modification's canonical address). If the founder prefers `/rates`, it is a redirect, not a rewrite. |
| **D10** | brief ("no UI for WL-02 … WL-08") | no project UI in sub-wave A | `/projects`, `/projects/new` and `/projects/:id` exist as a **scaffold seam**, marked in their own file headers and owned by WL-02 in §2 | the inherited end-to-end journey needs an activation step, and a pin against a real determination is the only honest one. It also de-risks WL-02: the three pin cases, the history row and the entitlement gate are already correct and tested. Replace the files wholesale. |
| **D11** | OFFER §6.1 | four tiers on the ladder | two plans in the plan map (Crew, Shop); the GC tier is a card with no plan key and no price variable | finding B2 says "published, not for sale". Absence is the strongest form of that: there is no key to pass to Checkout and no variable to configure by mistake. |
| **D12** | BACKLOG "no free tier" | — | `freeLimits: { projects: 1, workers: 5, exports: false }` | this is the allowance BEFORE the card, not a free tier: one project may be set up so the buyer sees her own determination, and `exports: false` means **nothing can be filed**. The free thing is the public lookup, which needs no account. |
| **D13** | WL-13 | `kb.reparse` re-derives rows from stored `document_text` | registered, and throws "not implemented in sub-wave A" | nothing has changed the parser yet, so a re-parse has nothing to do. The stored text and `parser_version` are there; whoever next changes the parser writes the job. |

---

### 6.B4 — deviations made by the LANDING + WL-11 agent (sub-wave B, 2026-09-04)

Each one is a decision I would defend, and each is cheap to reverse. Requests that needed another
agent's file are in [`REQUESTS.md`](REQUESTS.md) and were not applied there.

| # | spec | what the spec says | what was built | why |
|---|---|---|---|---|
| **B4-1** | LANDING_SPEC §5.1, §5.4 | the lookup result carries a consented watch capture — one unticked box, "Email me when DOL modifies this determination", `Watch it` — counted as 9 of §2's 83 words | **not on the page.** No email address is collected anywhere on `/` | the consent record, the double opt-in, the ≤3-per-address limit and the one-click unsubscribe are `specs/WL-14`'s, and that agent owns `src/app/(marketing)/watch/**`. Building a second capture beside it is how two consent records come to disagree about what somebody ticked. The slot and the words are reserved (REQUESTS B4-6); the page counts 430 of 450, so there is room for all nine. |
| **B4-2** | LANDING_SPEC §8 (B2) | the GC card carries "an email field and `Join the list`", emitting `gc_tier_interest` | `Join the list` is a **mailto to support**, emitting `gc_tier_interest {plan:'gc', surface:'landing'}` | same reason as B4-1, and the demand signal — the event and a reply-able message — is intact. What finding B2 actually requires is that **no purchase control exists inside the card**, and none does: there is no plan key, no price variable and no Checkout path (`tests/landing.test.tsx` asserts it). |
| **B4-3** | LANDING_SPEC §6 | the five visuals, "inline SVG or DOM" | **V2 and V3 are inline SVG** (each in two variants — horizontal / 52×1 on a desktop, vertical / 13×4 on a phone, per §11). **V1, V4 and V5 are DOM** | each brief asks for it: V1 is "deliberately typographic, not designed — it must look like the document"; V4 is an interactive figure with three real inputs; and V5 is a form whose accessibility is load-bearing — `IDENTITY.md` §10.5 requires real tables for tabular data and §10.9 requires the rendered WH-347 to be "accessible HTML first, PDF second". A picture of a payroll grid is a dead end for assistive technology. |
| **B4-4** | LANDING_SPEC §6 V5 | the artefact displays the rate as `$12.25/.40` and the gross as `$163.00/$420.00` | the **form's own notation** with the **real rate from the determination the page just looked up** (`$38.50/10.71`), and a gross computed from the example hours | those two literals are the DOL instructions' *examples of the notation*, and the notation is what the brief is protecting. Rendering them literally would put two invented figures on the page's proof block; rendering the real rate keeps the notation, keeps the caption "Example data. The form is real." honest, and lets the artefact carry `data-wd-number` / `data-modification` — so **gate G8 is satisfied rather than side-stepped**. |
| **B4-5** | LANDING_SPEC §5 / §6 V2 | V2 renders inside the proof block (§5), and also "beneath" the modification control (§5.1) | **once**, in §2, directly beneath the modification picker | §5.1 is the load-bearing one: "choosing a modification re-renders the whole table at that modification and draws V2 beneath it — this is the single interaction the page exists to produce". Drawing it twice would show the same diagram twice and spend its caption twice against the word budget. It is also the above-the-fold arm of §13's A/B test 2, which the spec anticipates. |
| **B4-6** | LANDING_SPEC §2, §11 | V3, the Friday Wall, has no section in the budget table and no place in the mobile order | renders at the end of §4, after the three steps and the Friday line | it illustrates a year of Fridays, and "Step 03 — Take Friday's form" is where that lands. Its caption ("An example year. Your wall starts empty.") is counted as copy. |
| **B4-7** | IDENTITY.md §9.4 vs LANDING_SPEC §6 | IDENTITY: "no scroll-triggered reveals, no number count-ups"; LANDING_SPEC: V2 and V3 animate on scroll into view and V4's figures tick over 250 ms | the landing spec's motion, **confined to `/`** | the two documents contradict each other and only one of them is about this page. The product's rule survives where it was aimed — nothing in the payroll grid moves, no rate animates upward anywhere in the app. Every duration on the landing page is derived from `--wl-dur-1..3` through `calc()` (LANDING_SPEC's own instruction: "motion durations in §6 are intents; bind them to `--wl-dur-*`"), and `prefers-reduced-motion: reduce` renders all five figures in their final state in one frame. |
| **B4-8** | LANDING_SPEC §2 | the counting convention, and §5.4's table | the CI script implements **the convention**, which disagrees with §5.4's arithmetic: the rule says "field labels on the widget and the ledger are controls and are **not** counted" while §5.4's 83 includes twelve of them. It adds two exclusions the rule implies but does not name: a **verbatim quotation of an external authority shown with its source** (the DOL's 55-minute burden statement) and a **repeated call to action** (counted once, exactly as the spec's own arithmetic treats it) | a script that counted the labels would read 83 against a rule saying 71 and fail a green build — which is the precise failure §2 was written to prevent. Every exclusion is declared **in the DOM** as `data-wordcount="exclude"`, so it is visible in the source rather than hidden in a test. **The page counts 430 words against the 450 ceiling**, and the test counts the ambiguous, empty and earlier-modification states too, because those are copy the visitor actually meets. |
| **B4-9** | BUILD.md §2 ("reuse, do not rebuild") | reuse `<CandidateList>` and `<ModificationControl>` from `src/components/determination.tsx` | the landing renders **V1b** and the modification picker itself; `<LookupForm>` **is** reused, with an additive `action` prop | both components carry their own explanatory copy — 40 and 25 words — written for the full result page, where there is no budget. On the landing they would spend a fifth of §2's allowance restating the sentence the standing notice already carries. The **data** they render is identical, and the rule they encode (nothing preselected, options exactly the rows in `kb_wd_modifications`) is enforced here too. |
| **B4-10** | WL-11 / LANDING_SPEC §10 | the footer links to Pricing · Guarantee · Privacy · Terms · Security · Accessibility · Data sources · Support | `/legal/[doc]` gained **four documents of this product's own** — guarantee, security, accessibility, data sources — beside the platform's three | the links have to resolve, and none of those four can come from the platform: the guarantee is `OFFER.md`'s (G1, G3 and G4 verbatim; **G2 does not ship**), the security page describes this codebase's decisions, the accessibility page names the script that runs in CI, and the data-sources page names SAM.gov and the parser. `tests/wl11.test.tsx` asserts that nothing in them is claimed that the code does not do. |
| **B4-11** | WL-11 | `/help` is "index, six articles, searchable" | search added; **the six articles are unchanged** | `tests/naming.test.ts` and `tests/events-and-content.test.ts` both assert exactly six, and the six are the six the spec names. What was missing was the search, `help_searched`, `help_article_viewed` and `legal_page_viewed`. |
| **B4-12** | LANDING_SPEC §11 | "a sticky CTA appears after the visitor passes V1 and disappears in the pricing block" | `position: sticky` inside a containing block that begins after the lookup result and ends at the pricing block | no scroll listener, no JavaScript, and it behaves correctly with JavaScript off — which the same section requires of everything else on the page. |

## 7. Platform requests

Changes I would make in `packages/platform` and did not, because the brief forbids touching it.
Each has a local work-around in place today.

| # | request | why | work-around now in place |
|---|---|---|---|
| **P1** | `email_suppressions` needs a `scope` column (`watch` / `outbound` / `all`) and a `note`-independent reason vocabulary | WL-14 and the outbound engine (PLAN D4) share one list and one sending reputation. Without `scope`, unsubscribing from marketing cannot be distinguished from a hard bounce, and a transactional send could be suppressed by a marketing opt-out | WL-14 encodes the scope in `reason` (`unsubscribed_watch`, `unsubscribed_outbound`, `hard_bounce`) and never checks suppression on a magic-link or billing send |
| **P2** | the magic-link callback should be a two-step `GET` (render) → `POST` (consume) | WL-01 V2 and its edge-case table: Outlook Safe Links and corporate scanners pre-fetch the link and burn the token, which is the single most common magic-link support ticket. This is a platform-wide problem, not a WageLens one | none. The one-step callback ships; the failure mode is a user seeing "that link was already used" and asking for another |
| **P3** | a six-digit cross-device code alongside the link | WL-01 V2a, adopted as a named MVP requirement: this buyer reads email on a phone and works at a desktop (PERSONA §10). It is one column (`code_hash`), one input and an attempt counter | none |
| **P4** | `requestMagicLink` should accept an organisation name for the signup path | WL-01's `/signup` collects the company name with the email so onboarding is two questions | the organisation is created with a default name and renamed in `/settings` |
| **P5** | the platform's `projects` table in `apps/_template/src/lib/schema.ts` shares a NAME with this app's | not a bug — separate databases — but the template's placeholder and this app's real table having the same name makes a copied test confusing | none needed; noted so nobody "fixes" one by looking at the other |

---

## 8. Commands

```bash
npm ci                                                    # root, once
npm run typecheck                                         # every workspace
npm test --workspace apps/wagelens                        # 132 tests, PGlite, offline
npm run build --workspace apps/wagelens                    # design-system drift check + next build
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test   # from apps/wagelens
npm run dev --workspace apps/wagelens                     # http://localhost:3000

# the corpus, from the command line
npm run kb:pull --workspace apps/wagelens -- --state TX            # bounded: 25
npm run kb:pull --workspace apps/wagelens -- --state TX --full     # all 290
npm run kb:pull --workspace apps/wagelens -- --mock                # offline, on the fixtures
```

Never run `playwright install`; the browsers are preinstalled.
