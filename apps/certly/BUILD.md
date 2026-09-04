# `apps/certly` — the build map for sub-wave B

**Written by:** the sub-wave A Lead Builder, 2026-09-03.
**Read this before you write a line.** It says what exists, what each remaining
spec's agent owns, what nobody may edit, and what was decided differently from
the specs and why.

---

## 0. What sub-wave A left you

| Area | State | Where |
|---|---|---|
| **Scaffold** | Runnable Next.js 15 app on `@octopus/platform`; magic-link accounts, Stripe, email, events, jobs, legal, admin all inherited | `src/app/`, `src/lib/platform.ts` |
| **Identity** | `design-system.css` copied verbatim with a build-time equality check; two self-hosted fonts; the shell; the seven-state pill; the coverage bar; the portfolio strip; the disclaimer component | `src/styles/`, `src/components/`, `public/fonts/` |
| **M5 comparison engine** | **Complete and pure.** Five requirement states, six vendor states, every rule in `specs/05` §3/§4/§9, 94 tests | `src/lib/engine/` |
| **M2 data** | 15 templates as JSON + schema + loader + `applyTemplate`; the §C endorsement glossary as data | `src/lib/templates/` |
| **DocumentStore** | Interface, in-memory adapter, `VercelBlobStore`, browser-direct upload tokens | `src/lib/storage/` |
| **M1 accounts** | Wired and themed; `/login` carries the trial disclosure | `src/app/(auth)/` |
| **M3 data** | Vendors table, CSV parser (12 encoding fixtures), import repository | `src/lib/vendors/csv.ts`, `src/lib/repos.ts` |
| **M9 audit trail** | Table, append-only trigger, `writeAuditEvent`, the sentence renderer for all 36 kinds | `src/lib/audit.ts`, `drizzle/0001_…` |
| **Data model** | 25 tables covering every Must spec, with the CHECK constraints the specs asked for | `src/lib/schema.ts`, `drizzle/0000_certly_init.sql` |
| **Golden set** | 16 of 17 real fixtures copied with their licence rules; the expected-value format written for the labeller | `tests/fixtures/coi/` |

```bash
npm test        --workspace apps/certly   # 227 unit + integration, PGlite, offline
npm run build   --workspace apps/certly
npm run typecheck --workspace apps/certly
npm run kb:check --workspace apps/certly
cd apps/certly && PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test
```

---

## 1. THE SHARED PIECES. Do not edit these without saying so.

Every one of these is depended on by two or more agents. If you need a change,
**post it in your own `CLAUDE.md` and tell the other agents**, or add a new file
beside it rather than editing in place.

| File | Owner | Why it is shared |
|---|---|---|
| `src/lib/engine/**` | **nobody in sub-wave B** | The comparison engine is finished and its output is a contract. It is pure and its purity is enforced by `tests/engine/purity.test.ts` — an import of the database, an adapter, `next/*` or the Anthropic SDK fails the suite. A rule change means bumping `ENGINE_VERSION` and re-running the golden tests. |
| `src/lib/status.ts` | shared | The state vocabulary. `specs/05` §2.1's mapping table as code. A rename here is a rename in eleven places. |
| `src/lib/kb/disclaimers.ts` | shared | The ONLY place a disclaimer text exists. `tests/vocabulary.test.ts` greps the repo and fails on a near-duplicate anywhere else. |
| `src/lib/schema.ts` + `drizzle/**` | shared | One migration chain. **Never edit `0000_certly_init.sql`** — add `000N_your_change.sql`, or edit `schema.ts` and run `npm run db:generate`, then commit the SQL *and* `drizzle/meta/`. |
| `src/styles/design-system.css` | **frozen** | Byte-identical to `phase-4-revenue/certly/design-system.css`. `npm run identity:check` runs in `prebuild` and in the suite. A change belongs to the Brand Director, upstream. |
| `src/components/StatusPill.tsx`, `CoverageBar.tsx`, `Disclaimer.tsx` | shared | Every status-bearing surface uses them. Add a prop; do not fork. |
| `src/lib/plans.ts` | M10 | `METER_SENTENCE` and `TRIAL_DISCLOSURE` are quoted verbatim on four surfaces. |
| `src/lib/repos.ts` | shared | Add a new file (`src/lib/repos/<module>.ts`) rather than growing this one past readability. |
| `src/env.ts` | shared | Extend it; never rename an existing variable — `.env.example` and `DEPLOY_VERCEL.md` name them. |
| `src/app/(app)/layout.tsx` | shared | The shell. Adding a nav item is a one-line change to `PRIMARY`/`SECONDARY`. |
| `.github/workflows/ci.yml` | **shared with `apps/wagelens`** | Re-read it before editing and add only your steps. |
| `tests/fixtures/coi/**` | M4 + the labeller | Adding a fixture means a manifest row, the file, and an expected-value file — all three or none. |

---

## 2. The module map

Each row: the directories and files that agent OWNS, what they must not touch
beyond §1, the acceptance criteria that decide "done", and the commands.

### M2 — Requirement templates and the editor (`specs/02`)

| | |
|---|---|
| **Owns** | `src/app/(app)/requirements/**` (replace the read-only page), `src/lib/repos/requirements.ts` (new), `src/lib/templates/diff.ts` (new) |
| **Already done** | The 15 templates, the schema, `listTemplates`, `getTemplate`, `toRequirementSet`, `applyTemplate`, `loadRequirementSet`, `resolveRequirementSetId`, the one-default partial index, the min>0 CHECK, `kb:check` |
| **To build** | `/requirements/library`, `/requirements/library/[templateId]` (preview with every row's **source link and `last_verified` date**), `/requirements/[setId]` (editor), `/requirements` (assignment table), `/requirements/[setId]/changes` (diff). Server actions: `createRequirementSet`, `upsertRequirement`, `deleteRequirement`, `assignRequirementSet`, `previewTemplateUpdate` |
| **Acceptance** | `specs/02` A1–A10. A2 is the one to build first: a source link that resolves is differentiator D3, and if nobody ever clicks one (`template_source_opened`) the Should list gets re-ranked |
| **Watch out** | `acceptsForms` accepts BOTH an ISO-shaped number and free text (`RSCG0303`) — rejecting free text rejects a real carrier form the engine already handles. A `minAmount` of 0 is refused by the database; the form must refuse it with a sentence first |
| **Commands** | `npm run kb:check`, `npm test -- tests/templates.test.ts` |

### M4 — COI upload and extraction (`specs/03`) · **the long pole**

| | |
|---|---|
| **Owns** | `src/lib/extract/**` (new: the prompt, the Anthropic adapter, the quote gate, the confidence model, `evals/`), `src/app/(app)/review/**`, `src/app/api/upload/**`, `src/lib/repos/documents.ts` |
| **Already done** | `documents`/`extractions`/`field_corrections`/`certificates`/`coverages`/`coverage_limits` tables with the one-owner CHECK; the DocumentStore and its upload token; `parseMoney` (the `Excluded`/`STATUTORY`/SIR rules); the fixtures |
| **Day one, before anything else** | **Fetch C16** (`tests/fixtures/coi/MANIFEST.md` has the command) and **start hand-labelling the golden set** (`tests/fixtures/coi/expected/README.md`). Nothing in M4 can be measured until the expected files exist — not the ship gate, not `THRESHOLDS.md` §4.1, not a prompt change. It is the only multi-day serial dependency in wave 2 |
| **To build** | One model call, structured output, **no tools and no agent loop**; recorded responses committed so per-commit evals are free and offline; the quote gate; `doc_confidence` and the τ threshold; the review screen (`UX.md` S12) — **no bounding boxes**: scroll to `page`, render `source_text` as a quotation in `--c-font-num`, state the quote-gate result in words |
| **Acceptance** | `specs/03` A1–A15; the five deploy gates in §15.3 |
| **Watch out** | Uploads are **browser-direct**: `POST /api/upload/token` → PUT to Blob → `POST /api/upload/complete`. The server re-reads size and content type from the stored object and never trusts the client. Also: **re-measure the Vercel request-body limit** and record the number with its date (`VERCEL_REQUEST_BODY_LIMIT_BYTES` in `document-store.ts` carries the spec's figure, not a measurement) |
| **Never** | Average accuracy. Per field, with denominators. A 3% average that is 20% on `policy_exp` is a broken product wearing a good number |

### M6 — Vendor status dashboard (`specs/06`)

| | |
|---|---|
| **Owns** | `src/app/(app)/dashboard/**`, `src/app/(app)/review/page.tsx` (the queue), `src/app/(app)/timeline/**`, the global search |
| **Already done** | The portfolio strip, the six counters (`vendorStatusCounts`), the empty state, the soonest-problem-first table, the cached `vendors.status` |
| **To build** | Filters, sort, search (`/` focuses it; **the pill and next expiry are in the result row**), row expansion with the top three problems in plain language, the needs-review queue, the expiry timeline (`.c-timeline` is already in the CSS), the at-scale path (sticky header, virtualised body, server-side sort at 500 rows) |
| **Acceptance** | `specs/06` A1–A9. **A9 is four of the eleven disclaimer surfaces** — dashboard, timeline, search results, mobile cards |
| **Watch out** | The six counters are mutually exclusive and exhaustive and **must sum to the roster**. `no_certificate` is a counter like the others *and* a line above the table |

### M7 — Expiry reminders (`specs/07`)

| | |
|---|---|
| **Owns** | `src/lib/reminders/**`, `src/app/(app)/settings/reminders/**`, `src/app/api/cron/reminders/route.ts`, `src/app/api/webhooks/resend/route.ts` |
| **Already done** | `reminders`, `suppressions`, `recipient_sends`, `email_events` tables; the idempotency unique index; the org/global suppression constraints |
| **To build** | The ladder (T−60/−30/−14/−7/−1/T+1/weekly to T+28), the composer, the CAN-SPAM footer with the **global** opt-out, the email log |
| **The three that will bite** | (1) the **72-hour per-recipient interval** enforced IN THE CLAIM QUERY, across every org — `recipient_sends` is keyed on the address alone for exactly this reason; (2) the per-expiry cap: **6 per recipient, 10 per expiry**, then `skippedReason: 'expiry_cap'` and the vendor flagged "we have stopped asking"; (3) `SEND_ENABLED` is false outside production — render to the log, send nothing |
| **Blocked on** | `PREREQUISITES.md` P6 (verified sending domain), P10 (postal address), and the inbound domain — all env values, never literals |

### M8 — Vendor upload link (`specs/08`)

| | |
|---|---|
| **Owns** | `src/app/u/[token]/**` (outside the `(app)` group — **no account, ever**), `src/lib/repos/upload-links.ts` |
| **Already done** | `upload_links` with a hashed token; the browser-direct upload path |
| **To build** | The token page: who is asking, for which property, exactly what is required, one upload control that PUTs straight to storage. Then the result page: "Received. Here is what we read and what is still missing" |
| **Watch out** | **Multi-use by design.** A single-use link breaks the moment an agent forwards it to a colleague, which is how this actually gets done. Security is the 32-byte token, the expiry, revocability and the fact that the page exposes nothing else. The link is built from `APP_ORIGIN`, never a literal domain |

### M10 — Billing and the trial (`specs/10`)

| | |
|---|---|
| **Owns** | `src/app/(app)/settings/billing/**`, `src/lib/repos/billing.ts`, `STRIPE_SETUP.md` (generated) |
| **Already done** | The plan map with the three tiers; `METER_SENTENCE`; `TRIAL_DISCLOSURE`; `trial_consents` |
| **To build** | The Vendor Pack add-on, the entitlement matrix in `specs/10` §8.1 including `no_subscription`, the T−3/T−1 warnings (transactional, **exempt from every notification preference**), dunning, the read-only state after grace |
| **Acceptance** | `specs/10` A1–A16. A14 and A15 are the ones that matter: the disclosure adjacent to every trial CTA, and the consent row storing the exact string |
| **Before the founder creates anything in Stripe** | The metadata key is `vendor_limit`, the add-on is the **Vendor Pack**, and the product names carry `{PRODUCT_NAME}` — which is **pending** (`IDENTITY.md` §2.3 recommends *Coverfile*). Renaming now is a find-and-replace; renaming after is a migration |

### M11 — Onboarding (`specs/11`)

| | |
|---|---|
| **Owns** | `src/app/(app)/onboarding/**` |
| **To build** | The five-minute path: pick an audience → apply a template → add one vendor → upload one certificate → see the gaps. Resumable, skippable, measured |
| **Acceptance** | `specs/11` A1–A9. **`activated` is the ONLY activation event** and it fires at the first comparison — not at signup, not at upload |
| **Watch out** | Onboarding is free and un-gated **up to and including the first comparison** (`specs/10` §8.1). Fail closed there and every new signup is blocked |

### M12 — Gap report export (`specs/12`)

| | |
|---|---|
| **Owns** | `src/lib/reports/**`, `src/app/(app)/reports/**`, `src/app/r/[token]/**` |
| **Already done** | The `reports` table with the share-token columns; `.c-report` in the CSS; the engine output is already report-shaped (`explanation` + `evidence` per row) |
| **To build** | The PDF and CSV renderers, the share link (30 days, revocable, logged, max 90), the `not_checked` section |
| **Watch out** | **Reports are immutable snapshots.** Regenerating creates a new row. A report forwarded in March must still say in June what it said in March, which is why the engine stamps `engineVersion` and `requirementSetVersion` |

### M13 — Settings, help, legal (`specs/13`)

| | |
|---|---|
| **Owns** | `src/app/(app)/settings/**` (except billing), `src/app/(marketing)/help/**`, `src/app/(marketing)/legal/**`, `src/lib/help/**` |
| **Already done** | `org_settings` (entity block, alternate holders, timezone, audience) and `updateOrgSettings` with its own audit kind |
| **To build** | The entity-block editor (**a functional dependency of M5's holder match**, and changing it re-evaluates every vendor), the role matrix enforced server-side, invitations, data export, deletion, 12 help articles, the legal pages |
| **Must add to the terms** | *"We never charge your vendors"* as a standing commitment (REVIEW.md §2.9, OQ-9). It is promised in the hero, in an FAQ and in every vendor email; a promise that is not a term is a marketing line |
| **Owns the guard** | `tests/vocabulary.test.ts` already implements §12's disclaimer greps. Extend it with the eleven-surface render assertions as each surface lands |

### M14 — Admin metrics (`specs/14`)

| | |
|---|---|
| **Owns** | `src/app/admin/**` |
| **To build** | Signups, activation, **activation→paid measured on `trial_converted ÷ activated`** (not on the card), MRR, churn, live extraction accuracy from `field_corrections`, review-queue depth, model cost per document |
| **Watch out** | Every rate is reported with its denominator. `specs/00` is the only place an event name is born; generate the union from it so a typo is a compile error |

### M15 — The Free Gap Report (`specs/15`)

| | |
|---|---|
| **Owns** | `src/app/gap-report/**`, `src/lib/gap-report/**` |
| **Already done** | `gap_report_sessions` and `gap_report_documents`; the one-owner CHECK that makes the shared extraction table legal; the `gap/<sessionId>/` storage prefix, outside every org |
| **To build** | The anonymous flow, the strip step (`strip.ts` — producer contact name, phone, fax and e-mail are **never stored on this path**), the render job that deletes source files **inside the job**, the 7-day purge, the daily spend cap, the "read but not confident enough to compare (n)" section |
| **Launch gate** | The founder's legal read (B-07, OQ-4). Until it lands the landing page runs the samples-only demo and the report sits behind a waitlist line |
| **Watch out** | The daily spend cap is a **launch requirement**. Anonymous traffic spending real inference money is the easiest way to lose money on this product, and a 25-document report costs $2.50–5.00, not $0.50 |

### Landing page (`LANDING_SPEC.md`)

| | |
|---|---|
| **Owns** | `src/app/(marketing)/page.tsx`, `src/app/(marketing)/pricing/page.tsx` |
| **Already done** | The chrome, the fonts (self-hosted, 50.5 KB, inside the 60 KB budget), zero third-party requests on first view — **asserted by `e2e/identity.spec.ts`** |
| **Watch out** | **ONE hero CTA**, whose label is gated on the M15 legal read. **No document from `kb-samples/`** and **no traced ACORD form** — every sample on a public surface is Certly-authored. The word budget is 450 and the counting script is published in §14.1 |

---

## 3. Spec deviations, with reasons

Each of these is a place where what is built differs from what a spec says.
None was taken to save effort.

| # | Deviation | Why |
|---|---|---|
| **D-1** | Template JSON rows carry an explicit `kind` discriminator; `KNOWLEDGE_BASE.md` §B.0 infers the kind from which keys are present | §B.0's shape validates weakly and mis-parses silently when a key is misspelled — `{coverage, limt, min}` reads as a `coverage_present` row and the limit vanishes. The FIELD NAMES are §B.0's; only the discriminator is added |
| **D-2** | Ids are `text` holding a prefixed ULID, not `uuid` as the specs write | A foreign key must match its target's type, and `packages/platform`'s `organisations.id` and `users.id` are `text`. Prefixed ULIDs are also time-ordered and self-describing in a log line |
| **D-3** | In `specs/05` §4's endorsement ladder, the **unknown-form** branch is checked BEFORE the **column** branch | Both produce `asserted_only`, so no state changes. A5 requires the additional-insured row on corpus C2 — which carries `Y` in the column AND `RSCG0303` in the free-text box — to NAME `RSCG0303`. A form number is strictly more information than a tick |
| **D-3b** | "Unknown form" means a form no requirement **in the set** accepts, not merely one this requirement does not | Without it, C2's additional-insured row would name `CG2001` (which belongs to the primary-and-non-contributory row) and A5 would fail. A form another requirement claims is not unrecognised to this one |
| **D-4** | `DocumentStore` has five methods; `REVIEW.md` §3 names four | The daily orphan-blob sweep (`specs/03` §9) and the M15 purge (`specs/15` §6) cannot be written without enumeration. `list(prefix)` is the fifth |
| **D-5** | `VercelBlobStore.signedUrl()` returns the blob's own URL and **does not expire** | Vercel Blob 2.x serves from an unguessable public URL; per-request signed URLs with a TTL are not in its public API. Keys are content-addressed under an org prefix, so a URL is unguessable — but entropy is weaker than an expiry. **M4 must close this**: either proxy reads through a route handler that checks `requireOrg()`, or move to `S3Store` with a presigned GET. `ttlSeconds` stays in the signature so neither choice changes a call site. See PR-3 |
| **D-6** | The sign-in page is `/login`, not `/signin` as `specs/01` §3 names it; `/signin` redirects | `packages/platform` builds the magic link as `${APP_BASE_URL}/login/callback`, a hardcoded path. A sign-in page that does not live beside its own callback breaks quietly when one of the two moves. See PR-4 |
| **D-7** | `undetermined` does not appear in the vendor-state roll-up chain | `specs/05` §4's precedence is `expired > gap > expiring > asserted_only > meets`, and `specs/06` §3's six vendor states have no bucket for "a person should look". It surfaces as `undeterminedCount` and in the review queue instead — which is where a human clears it |
| **D-8** | `specs/05` §3's cross-cutting checks are emitted as **rows** (`check:name`, `check:holder`, `check:dates`) alongside the template rows, and counted in the five counters | The report has to print them, the dashboard has to explain them, and a check with no row is a check the customer cannot see. `origin: 'cross_check'` distinguishes them |
| **D-9** | `CG 20 39` was removed from the additional-insured-completed `accepts` lists | It is a real ISO form, but `KNOWLEDGE_BASE.md` §C.1 does not source it and no fetched URL for it exists. PLAN.md §A10: a claim without a fetched URL and a date does not ship |
| **D-10** | The Playwright journey does not drive the free plan to its limit | The un-gated allowance is 25 vendors, so proving it in a browser means creating 25 vendors to demonstrate arithmetic that `tests/repos.test.ts` already proves against the database. The journey asserts the cap is DISPLAYED and goes to Checkout |
| **D-11** | `org_settings` is a Certly table; `specs/01` §4 puts `entityBlock` and `timezone` on `organisations` | `organisations` belongs to `packages/platform`, which this fleet may not modify. See PR-1 |
| **D-12** | An `audit_events` DELETE is refused unless the transaction sets `certly.audit_retention_delete = 'on'` | `specs/09` §4 says no delete; §7 says audit rows are the last thing deleted after a retention request. A blanket refusal would also block deleting an organisation through the cascade. The flag makes "we deleted audit history" something somebody had to write down |
| **D-13** | The fixtures manifest records `specs/03` §15's header as **wrong**: the table is 17 real + 4 synthetic, the header says 16 + 5 | REVIEW.md's own regression **R-1**, unfixed upstream. `phase-4-revenue/` is not ours to edit; `tests/fixtures/coi/MANIFEST.md` records the correct count and where it came from |

---

## 4. Platform requests

`packages/platform` is out of scope for this fleet. These are the changes worth
making there, in the order they will hurt.

| # | Request | Why | Workaround in place |
|---|---|---|---|
| **PR-1** | An app-extensible `organisations` row, or a documented `org_settings` pattern | Three apps will each need per-org product settings (`entityBlock`, `timezone`). Each inventing its own table is fine; three different shapes is not | `src/lib/schema.ts` → `orgSettings`, keyed 1:1 on `organisations.id` |
| **PR-2** | A measured, published Vercel request-body limit, re-verified per release | Every app's upload path is bounded by it and all three specs quote a number nobody measured | `VERCEL_REQUEST_BODY_LIMIT_BYTES` in `document-store.ts` carries the spec's figure with its date and says it is not a measurement |
| **PR-3** | `DocumentStore` in the platform, with an `S3Store` **or** Blob private access | `REVIEW.md` §3 specified the interface as a platform concern; it is implemented in the app because the platform ships no storage module. Certly's copy is the reference, and D-5's expiry hole needs solving once, not three times | `src/lib/storage/document-store.ts` |
| **PR-4** | Make the magic-link callback path configurable | `service.ts` hardcodes `${APP_BASE_URL}/login/callback`, which forces every app's sign-in route name | `/signin` redirects to `/login` (D-6) |
| **PR-5** | Align the `SESSION_COOKIE_NAME` default between the platform and any app middleware, or export the resolved name | The platform defaults to `octopus_session`; an app middleware that defaults to anything else produces `ERR_TOO_MANY_REDIRECTS` with nothing in any log to explain it. **This cost an hour here** | `src/middleware.ts` now defaults to the platform's value, with the reason written above the line |
| **PR-6** | Either theme the platform's own emitted class names (`.button`, `.notice`, `.card`) or make them configurable | Certly maps them onto `--c-*` tokens in `app.css` §4; WageLens and StateReady will each write the same block | `src/styles/app.css` §4 |
| **PR-7** | A `withTx` example for an app repository | `specs/09` A7 needs the audit write and its parent change in one transaction; the platform exports `withTx` but no app pattern | `tests/repos.test.ts` demonstrates it with `db.transaction` |

---

## 5. Conventions worth keeping

- **Comments say WHY.** Every non-obvious decision in this app carries the
  reason and the spec reference. If you delete a comment, delete the code it
  explains too, or you have just removed the only record of an argument.
- **A gate is a test, not a habit.** The disclaimer, the vocabulary, the
  identity file, the engine's purity, the golden set's completeness — each is a
  test that fails, not a convention somebody remembers.
- **`raw` survives.** Wherever a number is stored, the printed characters are
  stored beside it. That single rule is what stops `Excluded` becoming `$0`.
- **Every read is org-scoped**, and a cross-org read returns 404, not 403.
- **No literal domain, no literal colour, no second disclaimer.** All three are
  enforced by `tests/vocabulary.test.ts` and `tests/identity.test.ts`.

## 6. What could not be finished, and who owns it

| Item | Owner | Note |
|---|---|---|
| **The golden set is unlabelled** | the M4 agent, day one | 16 fixtures are here; `expected/` is empty by design and `kb:check` reports the backlog. `D`, `N_ship` and `N_block` do not exist until it is done, so neither does any accuracy claim |
| **C16 / G17 is a URL, not a file** | the M4 agent, day one | The command is in `tests/fixtures/coi/MANIFEST.md`. `kb:check` reports it PENDING |
| **The `signedUrl` expiry hole (D-5)** | the M4 agent | The interface promises a TTL that the Blob adapter cannot honour |
| **C2, C11 and C12's personal-data status** | the labeller, at the moment of labelling | `UNVERIFIED` in the fixtures manifest; the pages are open anyway |
| **`specs/00`'s `events:check` and the generated `EventName` union** | the M14 agent | The registry exists in `specs/00`; the app emits no product events yet, so there is nothing to check against and generating the union now would be a file nobody imports |
