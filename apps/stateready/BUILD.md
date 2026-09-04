# StateReady — the build, and the map for sub-wave B

**Sub-wave A (this document's author):** the foundation every other StateReady
agent builds on. Delivered 2026-09-03.
**Reviewer status carried in:** wave-1b **signed for wave 2 and for launch**,
round 2, with **one minor open (N6)** — carried into §6 below.

---

## 0. What exists now

A runnable Next.js 15 app on `@octopus/platform`, with the arbitrated identity
applied, the knowledge base loaded from the versioned records, the rules engine
built first as a pure function with a 69-case golden set, accounts working, and
the data model for every Must spec migrated.

| | |
|---|---|
| **Package** | `@octopus/stateready`, `APP_SLUG=stateready`, product name from `APP_NAME` |
| **Tests** | 290, on PGlite, no network, no keys |
| **Golden set** | 69 cases · 9 records · **all 23 licence types** · 3 issue dates |
| **Knowledge base** | 9 records, 0 failures, 3 G7 warnings — the same numbers `validate.py` reports |
| **Build** | `next build` clean; 21 routes |
| **E2E** | 7 Playwright specs, all passing |

### Routes

| route | what | owner after this wave |
|---|---|---|
| `/` | landing **placeholder** — the real hero object (tile grid on the board), one CTA, coverage boundary, disclaimer | **M15** |
| `/coverage` | **public.** The nine records, state × trade, verified/unknown counts, last-checked date, Entry-Pack readiness | M12 (extend), M14 (data) |
| `/pricing`, `/help`, `/legal/[doc]` | platform template, StateReady-skinned | M9, M11, M12 |
| `/login`, `/login/callback` | magic link (platform) | done |
| `/dashboard` | the board: status line · tile grid + runway · licence cards · coverage honesty panel | **M7** |
| `/roster`, `/roster/import` | roster table; paste import with the date-format radio | **M3** (wizard), M4 |
| `/settings`, `/settings/billing` | platform template | M9, M10 |
| `/settings/company` | M2: legal name, technicians band, the state × trade cross product on the tile grid | done |
| `/admin` | platform metrics table | **M13** |
| `/api/stripe/webhook`, `/api/cron/drain`, `/api/auth/*` | platform handlers | M6 (drain payloads) |

### Modules

```
src/lib/kb/          M14 — the knowledge-base runtime
  records.ts           the committed records, as typed JSON modules
  types.ts             SourcedValue, StateTradeRecord, ExpiryOverride
  schema-validate.ts   the JSON Schema subset, ported from validate.py
  gates.ts             the thirteen gates, ported from validate.py
  validate.ts          schema + gates; the boot assertion
  walk.ts              walk_sourced_values
  accessors.ts         getKbRecord · coverage · entryPackReadiness · 180-day staleness
  normalise.ts         lib_kb's normalisation + SHA-256, byte-identical to the Python
  snapshot.ts          loadSnapshot, atomic isCurrent flip, source baseline
  drift.ts             the daily check (injected fetcher), resolveDriftItem, closeAcceptedItems
  fetcher.ts           the ONLY outbound HTTP in the app

src/lib/rules/       M5 — the rules engine. PURE. No clock, no I/O.
  dates.ts   tokens.ts   assess.ts   ce.ts   derive.ts

src/lib/repos/       the database side
  company.ts  technicians.ts  licences.ts  deadlines.ts  dashboard.ts  alerts.ts  audit.ts

src/lib/             cron.ts (schedule + offsets) · trial.ts (first-100) ·
                     documents.ts (DocumentStore) · plans.ts · schema.ts · actions.ts

src/components/      status.tsx (StatusChip, StatusDot, TileGrid, Runway)
                     provenance.tsx (Provenance, NotYetVerified, Disclaimer)
                     paper.tsx (PaperSurface — the theme every forwardable
                                artefact renders in, whatever the viewer prefers)
```

---

## 1. Shared pieces — do not edit without saying so here

These are load-bearing for more than one module. If your module needs one
changed, change it **and add a row to this table** so the next agent knows.

| file | why it is shared | the rule |
|---|---|---|
| `src/lib/rules/**` | M4, M6, M7, M8 and the nightly cron all derive through it | **Stays pure.** No database, no clock, no `Date.now()`. Adding a rule token means adding it to `EXPIRY_RULE_PREFIXES` *and* to `kb-scripts/validate.py` G8 in the same change |
| `src/lib/rules/assess.ts` | the honesty rule; every date on every surface | Changing it re-baselines ~69 golden cases. See §4 D1 for the one-line reversal |
| `src/lib/kb/accessors.ts` | the ONLY read path into the knowledge base | Add accessors; never bypass `getKbRecord` — it is where `publishable` and the 180-day rule are enforced |
| `src/lib/kb/normalise.ts` | the drift hash must equal the Python's | Re-run the 59-capture parity comparison after any edit (`CLAUDE.md` §What tripped me up) |
| `src/lib/cron.ts` | `ALERT_OFFSETS` and `AT_RISK_DAYS` are ONE constant, shared by M6 and M7 | `AT_RISK_DAYS === ALERT_OFFSETS[0]` is asserted. Do not copy either number anywhere |
| `src/lib/repos/dashboard.ts` | `STATUSES`, `STATUS_TOKEN`, `STATUS_GLYPH` | The only place a status word exists. A test greps for "amber"/"red"/"green"/"ok" used as statuses |
| `src/components/provenance.tsx` | the disclaimer text and the refusal state | The disclaimer is `specs/12` verbatim and is grep-tested for cadence claims. Do not paraphrase it anywhere |
| `src/components/paper.tsx` | the theme contract for forwardable artefacts | **M6 (email), M8 (the pack, `/share/:token`), M17 (`/r/:token`) and M4's technician card MUST wrap their root in `PaperSurface`.** A test forbids `data-theme="light"`/`"dark"` in any component |
| `src/styles/design-system.css` | the identity fleet's signed file | **Byte-identical copy.** Style in `app.css` from `--sr-*` tokens only |
| `apps/stateready/kb/**` | the versioned records | **A copy.** Never hand-edit. Change `phase-4-revenue/stateready/`, re-copy, re-run `validate.py` |
| `src/lib/schema.ts` + `drizzle/` | one migration journal | Add tables; run `npm run db:generate`; commit `drizzle/` and `drizzle/meta/`. Every product table needs `org_id` (a test walks the schema) |
| `.github/workflows/ci.yml` | three apps share the `workspaces` job | Re-read before editing; add only your steps |

---

## 2. The module map for sub-wave B

Each row: what you own, what you must not touch, what "done" means. Every module
inherits §1 and §3.

### M4 — licence records and documents UI (`specs/04`)

- **Own:** `src/app/(app)/licences/**` (list, `/new`, `/[id]`, the document
  viewer), `src/app/(app)/technicians/[id]/**`, and any new server actions in
  `src/lib/actions.ts` under a `// --- M4` banner.
- **Already built for you:** `repos/licences.ts` (create/update/archive with
  derivation, validation, duplicate warning, CE records), `documents.ts`
  (`DocumentStore`, content sniffing, 20 MB cap, org-scoped keys),
  `repos/deadlines.ts` (`explainDeadline` returns the trace the "why this date?"
  panel needs).
- **Do not touch:** the rules engine, `assess.ts`, the status vocabulary.
- **Done when:** AC1–AC7 of `specs/04` pass as UI tests; `expirySource` is
  visible on every licence ("you entered this" vs "we worked this out from
  Texas's rule"); the conflict panel shows both dates and overwrites neither; a
  document URL from organisation A returns 404 for a session in organisation B;
  an unpublished field renders as a **row** reading "the board does not publish
  this", never a blank and never hidden (`specs/04` AC8, re-review N4).

### M6 — alerts and per-recipient digests (`specs/06`)

- **Own:** `src/lib/jobs/alerts-drain.ts`, the Resend templates, the
  `POST /api/webhooks/resend` handler, `src/app/(app)/alerts/**`,
  `src/app/(app)/settings/notifications/**`.
- **Already built for you, and it is the part with the two bugs in it:**
  `repos/alerts.ts` — `nextSendAt` (IANA zones, both DST transitions),
  `claimDueRecipients` (`<= now + DRAIN_INTERVAL`, **the Pacific deferral loop
  fix**), `selectDueOffsets` (**inequalities, largest unsent offset — the
  skipped-drain fix**), `createDigest` (per recipient), `suppressAlert` (the five
  machine-readable carve-outs). `cron.ts` derives `DRAIN_INTERVAL` from the cron
  expression and **fails the build** on a sub-daily schedule with
  `VERCEL_PLAN=hobby`.
- **Read first:** `tests/alerts.test.ts` — AC9 and AC10 are already written and
  green. Build the drain so they stay green.
- **Do not touch:** `ALERT_OFFSETS`, `AT_RISK_DAYS`.
- **Done when:** AC1–AC11 pass; the digest is ≤ 102 KB with no remote images;
  a `confidence = medium` line carries the KB value's note and a
  `needsHumanCheck` line says "we could not fully verify this rule"; the email
  renders in the **paper** theme, never the board; `/admin/health` shows the
  drain watchdog (26 h daily, 3 h hourly — `drainWatchdogHours`).

### M7 — the dashboard (`specs/07`)

- **Own:** `src/app/(app)/dashboard/**` beyond the placeholder,
  `/dashboard/calendar`, the PDF export, `markRenewed`.
- **Already built for you:** `repos/dashboard.ts` (`buildDashboard`,
  `refreshDashboardSummary`, `statusForDeadline`, `worseOf`), the `TileGrid` and
  `Runway` components with their accessible equivalents,
  `dashboard_summaries`.
- **Done when:** AC1–AC7 pass; tile click filters and the URL is shareable;
  `markRenewed` re-derives, supersedes and cancels pending alerts in one
  transaction; AC3b's single fixture asserts **both** the 89-day AT RISK tile and
  the 90-day alert in the same test file; the PDF carries every citation and
  `last_verified`; axe passes; first paint under 800 ms for 300 licences.

### M8 — the State Entry Pack generator (`specs/08`)

- **Own:** `src/lib/packs/**`, `src/app/(app)/expansion/**`,
  `src/app/share/[token]/**`, the PDF renderer, the generation job.
- **Already built for you:** `entryPackReadiness()` in `kb/accessors.ts` —
  CORE_SET, DISCLOSED_SET and the gap list; `playbooks` and `oneOffPurchases`
  tables with `needsCheckCount` and `disclosedGaps`.
- **Read §4 D3 first — it changes your scope.** Six of nine records are
  purchasable, not nine.
- **Done when:** AC1–AC8 pass; the gap disclosure renders **before the Checkout
  session is created** and its count equals the delivered pack's
  `needsCheckCount`; a rendered numeric token with no `SourcedValue` behind it
  throws `PlaybookIntegrityError` and nothing is delivered; the guarantee text is
  byte-identical to `OFFER.md` §5.1.

### M9 — billing (`specs/09`)

- **Own:** `/pricing`, `/settings/billing` beyond the template, the trial
  lifecycle job, `POST /enterprise-enquiry`.
- **Already built for you:** `plans.ts` (the canonical six prices, the four
  one-offs, `ENTERPRISE_STATE_THRESHOLD`), `trial.ts` (the enforced first-100
  counter, read-only at day 14), the server-side state-limit refusal in
  `setOperatingStatesAction`, `enterprise_enquiries`.
- **Done when:** AC1–AC11 pass; **no code path can write
  `one_off_purchases.kind = 'first_state_audit'`** (a test asserts it); the boot
  check reads exactly the eleven `STRIPE_PRICE_*` keys and a missing
  `STRIPE_PRICE_MULTISTATE_MONTHLY` fails the build; the 16th state writes an
  enquiry, emails both parties and emits `enterprise_enquiry_created`.

### M10 — settings, export, deletion (`specs/10`)

- **Own:** `/settings/data`, `/settings/profile`, `/settings/notifications`
  (with M6), the export job, the deletion job.
- **Already built for you:** `organisationSettings`, `dataExports`,
  `deletionRequests`, the `DocumentStore` the export zip needs.
- **Done when:** AC1–AC6 pass; the export opens in Excel and carries the
  citation columns; **post-deletion, a schema walk finds zero rows for the
  organisation id**; a `member` cannot reach billing, team management or
  deletion by UI *or* by direct action call.

### M11 — help and support (`specs/11`)

- **Own:** `src/content/help/**` (MDX), `/help/**`, `/support`, the
  auto-responder, `/help/methodology`.
- **Already built for you:** `supportTickets` (with `isDataQualityReport`, which
  routes into the drift queue rather than the inbox), `helpArticleFeedback`.
- **Done when:** the 15 articles exist; **a content test asserts every
  regulatory claim in the MDX links to a URL present in `kb/kb-data/`**; the
  auto-responder answers within 60 s with three matched articles;
  `/help/methodology` carries the cadence as a **target beside the live
  figures** — it is the only page allowed to state one.

### M12 — legal (`specs/12`)

- **Own:** `/legal/*` content, `/legal/refunds`, the acceptance flow.
- **Already built for you:** `DISCLAIMER_SHORT` and `DISCLAIMER_SECTIONS`
  (`specs/12` verbatim, cadence-free, grep-tested), `legalAcceptances`,
  `/coverage`.
- **Done when:** AC1–AC8 pass; **the build fails without `COMPANY_ADDRESS`**
  (P10 is a blocker, not a TODO — `.env.example` ships it blank on purpose); the
  two in-force guarantee wordings are byte-identical everywhere and the Alert
  Guarantee text appears nowhere (a test already greps for it).

### M13 — admin metrics (`specs/13`)

- **Own:** `/admin/**` beyond the platform table, the generated
  `thresholds.json`, `/admin/health`, `/admin/kb**`.
- **Already built for you:** `ACTIVATION_EVENT = 'licence_deadline_derived'`,
  emitted from the derivation service so every route counts; the drift queue
  tables; `resolveDriftItem` with the `no_change — awaiting acceptance` state and
  the exact command; `closeAcceptedItems`.
- **Done when:** every band is read from the generated `thresholds.json` and
  AC3b greps the codebase for the literal band values; the event-name parity test
  passes against `specs/01`–`specs/14`; `/admin/kb` orders by
  `affectedOrganisations`; `/admin/health` shows "last drain: N hours ago" and
  "KB drift last run".

### M15 / M16 / M17 — landing + demo, qualifier watch, shared readiness link

- **M15** (`LANDING_SPEC.md`, no spec file yet — writing it is the first job):
  `src/app/(marketing)/page.tsx` and `src/app/(marketing)/rulebook/**`. The demo
  is the **single free entry point** (D2), server-rendered, reading the KB
  through `getKbRecord`, deep-linkable. Copy deck ≤ 450 words with a CI counter.
  **The default view must contain no unverified value row** — Texas HVAC's bond
  and timeline are unknown, so the "What Texas does not publish" panel replaces
  the bond row (M19).
- **M16** qualifier watch: `/app/qualifiers`. The engine already emits the
  `qualifier_replacement` deadline from `business_entity.change_notification_deadline`
  when `licences.qualifierDisassociatedOn` is set — the column exists and the
  30-business-day arithmetic is tested. The 75/45/15/5 alert cadence is a
  **design judgment, not a sourced convention**, and must be labelled as one.
- **M17** shared readiness link: `/r/[token]`, read-only, revocable, **paper
  theme**, degrading to a grouped status list on a phone.

### The next knowledge-base states — GA, OH, AZ, MI

Owned by the knowledge-base fleet, in `phase-4-revenue/stateready/`, not here.
**What this app needs from you when they land:** re-copy into
`apps/stateready/kb/`, run `npm test --workspace apps/stateready`, and read the
golden diff. New records change nothing in the app **provided** every
`expiry_rule` is a token the engine implements — gate G8 enforces that on both
sides. Twelve records, ~14 agent-hours, one board each; Georgia first, because
Texas's and North Carolina's own reciprocity pages already point at it.

---

## 3. Commands

```bash
npm run typecheck                                   # all workspaces
npm test --workspace apps/stateready                # 290 tests
npm run build --workspace apps/stateready
npm run kb:check --workspace apps/stateready        # the copy equality check
npm run db:generate --workspace apps/stateready     # after editing src/lib/schema.ts
npm run stripe:setup --workspace apps/stateready    # the founder's Stripe checklist

cd apps/stateready && PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test
# NEVER `playwright install`. Browsers are preinstalled.

# Ops only — the authoritative Python, never on a request path:
python3 phase-4-revenue/stateready/kb-scripts/validate.py
python3 phase-4-revenue/stateready/kb-scripts/refresh_sources.py       # live network
python3 phase-4-revenue/stateready/kb-scripts/accept_drift.py --source-id <id>
```

---

## 4. Spec deviations, with reasons and reversals

### D1 — fail-closed is evaluated over the governing SET, not per value

- **Spec:** `specs/05` invariant 2 — *"a value with `confidence != high` and no
  `note` sets `needsHumanCheck = true`"*, per value.
- **Shipped:** the derived date is flagged unless **any** of the non-high values
  that produced it carries a note (`judgeGoverning`, `src/lib/rules/assess.ts`).
- **Why:** applied per value the spec contradicts its own AC7. A renewal under
  `anniversary` is governed by the token **and** the cycle; in `tx-plumbing` both
  are `verified`/`medium` and only `renewal.cycle` carries the note that explains
  the inference, so `needsHumanCheck = false` for licence type [0] could never
  hold. Over the set, AC7 and AC7b both hold and the meaning is the spec's own:
  *"a medium reading we cannot explain is not a medium reading"*.
- **Reverse it:** in `judgeGoverning`, change the `unexplained_inference` clause
  from `nonHigh.length > 0 && notes.length === 0` to `nonHigh.some((a) => !a.note)`.
  ~6 golden cases re-baseline. Do it **before** M6 builds on the flag, not after.

### D2 — the CE window and the classroom fraction are tokens, not prose

- **Spec:** `specs/05` AC2 wants NC electrical's CE window as 1 July – 30 June.
- **Shipped:** the engine implements `calendar_window:MM-DD`; the committed
  record carries the window only in a prose `note`, so today the CE deadline is
  the licence term and the note renders beside it. Same for NC's "at least half
  the hours in a classroom": the sentence renders verbatim and a classroom
  shortfall is computed only from a `min_classroom_fraction:` token.
- **Why:** reading a date out of prose is the one inference this product refuses,
  and the output here is a date the customer acts on.
- **Knowledge-base request (below).** The test already asserts the token path
  produces 2027-06-30, so AC2 passes the day the token lands, with no engine
  change.

### D3 — six of nine records pass `entryPackReady`, not nine

- **Spec:** `specs/08` — *"All nine committed records pass"* the CORE_SET.
- **Measured:** six do. **`fl.hvac`, `fl.plumbing` and `fl.electrical` fail on
  `reciprocity`** — neither entries nor a `reciprocity_statement` value, which is
  exactly what gate G7 already warns about on those three records — and
  `fl.electrical` additionally fails on
  `registered_electrical_contractor.renewal.expiry_rule` (null) and its CE hours
  (null), so a pack could not say when that licence renews.
- **Shipped:** the gate as specified. Florida shows **"in preparation"** on
  `/coverage` and is not purchasable, which is the same treatment `specs/08` AC5
  gives an uncovered state.
- **Two ways out, for M8 and the KB fleet to choose between, in writing:**
  (a) verify Florida's reciprocity position and the registered class's expiry
  rule — the honest fix, and it unblocks a third of the launch data; or
  (b) move `reciprocity` from CORE_SET to DISCLOSED_SET in
  `kb/accessors.ts:entryPackReadiness` — one line, and it makes "does my existing
  licence help?" a disclosed gap rather than a blocker. **Do not take (b)
  silently**: it is the promise the pack is sold on.

### D4 — a date the customer typed becomes a deadline row

- **Spec:** implied by `specs/04` and `UX.md`, stated nowhere.
- **Shipped:** `derive()` emits an `entered` renewal deadline for a licence in an
  uncovered state (or of an unknown type) when the customer supplied an expiry.
- **Why:** without it, "we will still track the dates you enter" was false — no
  deadline row means no alert, and the dashboard rendered NOT TRACKED beside the
  expiry the customer had just typed. It carries no citation, which the database
  check constraint permits for `source = 'entered'` and forbids for `derived`.
- **Consequence for `THRESHOLDS.md` T1:** entered rows emit
  `licence_deadline_recorded`, **not** `licence_deadline_derived`. Counting a
  date the customer typed as activation would make T1 measure data entry.

### D5 — the drift job is a TypeScript port; the Python stays the authority

- **Brief:** port to TypeScript or shell out to Python only in a documented ops
  command, never in a request path.
- **Shipped:** ported (`src/lib/kb/normalise.ts`, `drift.ts`) — there is no
  Python on Vercel. Parity with the Python was **verified over the 59 captured
  board pages** in `phase-4-revenue/stateready/research/raw/`: 59 of 59
  byte-identical normalised text and identical SHA-256, after fixing one real bug
  (see `CLAUDE.md`). Thirteen construct-level fixtures generated by the Python
  keep it that way in CI. `npm run kb:drift` and `accept_drift.py` remain the ops
  commands and are the authority.

### D6 — scope not built, deliberately

Per the brief: no UI beyond the shell, login, settings, company profile, roster
import and a placeholder dashboard. So **`/onboarding/*` (`specs/02` S04–S08) is
not built** — its data model, coverage logic and tile-grid picker all exist and
are used by `/settings/company`; the four-step wizard is M2's remaining UI and
belongs with M4's "add your first licence" step. `/licences` is M4's.

### D7 — the demo is `/rulebook`, and `/demo` redirects to it *(M15, 2026-09-04)*

- **Conflict:** §2 of this document assigns M15 `src/app/(marketing)/rulebook/**`;
  `LANDING_SPEC.md` §12.2 publishes the deep link as `/demo?state=tx&trade=hvac`
  and tells the outbound fleet to send prospects to it.
- **Shipped:** the page is `/rulebook`, and `/demo` is a redirect that preserves
  `state` and `trade`. Both spellings answer; neither document is wrong.

### D8 — V1 and V2 are inline SVG; V3, V4 and V5 are static HTML *(M15, 2026-09-04)*

- **Spec:** `LANDING_SPEC.md` §4 V1 says the grid is `<rect>`s (a size budget
  argument) **and** that its markup is "a `<ul>` of `<button>`s".
- **Shipped:** the grid is an `aria-hidden` SVG of 51 `<rect>`s **mirrored by a
  visually-hidden `<ul>` in DOM reading order**, one item per jurisdiction,
  carrying the status word — the same pattern `Runway` already uses in
  `components/status.tsx`. On the marketing page the grid is a *sample
  footprint* with nothing to click, and 51 buttons that do nothing are 51
  promises to a screen-reader user that the page does not keep.
- **V3, V4 and V5 stay HTML** because the spec describes them typographically —
  tabular numerals, hairline rules, step cards, an inline chip after a value —
  and SVG text would lose wrapping, selection and the type scale.

### D9 — below 40rem the runway is a list, not a sideways scroll *(M15, 2026-09-04)*

- **Spec:** §8 asks for the runway to scroll horizontally with the 30 April
  stack **pre-scrolled into view**, and in the same list requires **no
  horizontal page scroll at any width**.
- **Shipped:** the SVG below 40rem is replaced by the lane list (the same lanes,
  the same dates, the same source chips) and above 40rem the list becomes the
  accessible equivalent. Pre-scrolling a container needs JavaScript this page
  does not load, and a twelve-month axis is not legible at 390px whatever you
  scroll it to. The reader does not have to discover the point: on a phone it is
  the first line.

### D10 — the demo's rate limit is invisible, and fails open *(M15, 2026-09-04)*

- **Conflict:** the build brief requires the demo route to be rate limited;
  `LANDING_SPEC.md` §12.2 says *"no email, no account, no card, no rate-limit
  prompt"*.
- **Shipped:** sixty lookups per connection per ten minutes (`track.ts`), keyed
  on a truncated SHA-256 of the client address with the day mixed in — **no IP is
  stored**. Nothing is ever asked of the visitor: when the limit trips the page
  says one plain sentence and keeps working, and when the counter's own table is
  unreachable the limiter **allows** the lookup. It exists to stop a script
  walking 153 combinations in a loop, not to gate a human.

### D11 — the demo panel's closing line and in-panel CTA are not rendered *(M15, 2026-09-04)*

- **Spec:** the §12.1 wireframe ends the demo with *"This is one state and one
  trade. You work in more than one."* and a fourth CTA button.
- **Shipped:** neither. They are not in the §13 copy deck, which is the page
  verbatim and says *"anything not on this list is UI chrome, a source chip, or
  demo output"*. They are prose, not chrome, so CI would count them: **+21 words,
  460 of 450**. Marking an argument "chrome" to get under the ceiling is exactly
  the evasion §1's mechanical rule exists to prevent. The same reasoning keeps
  the **mobile sticky CTA** (§8) off the page: a fourth placement is 9 more
  words, and §13 counts three.

### D12 — the uncovered state links the support address; it captures no email *(M15, 2026-09-04)*

- **Spec:** §12.2 offers *"a one-field email capture that is optional and
  clearly labelled as a waitlist"* on an uncovered state × trade.
- **Shipped:** the refusal, the promise that it goes to the front of the queue,
  a link to `/coverage` and a `mailto:` with the state and trade prefilled.
  `PIPELINE.md`'s standing rule is no private individuals' data anywhere, and a
  form that stores a stranger's address before an account exists has no consent
  record, no deletion path and no owner. `lp_demo_query` with
  `was_covered=false` still captures the demand signal, which is what the
  waitlist was for.

### D13 — prices are grouped on the marketing page *(M15, 2026-09-04)*

- `formatAmount` (platform) renders `$1490`; `LANDING_SPEC.md` §5 publishes the
  ladder as `$1,490/yr`. The landing page groups thousands locally and takes
  every amount from `plans.ts`; a test asserts both the rendered strings and the
  underlying cents.

---

## 5. Requests to other fleets

### Platform (`packages/platform`) — not modified by this wave

| # | request | why | workaround shipped |
|---|---|---|---|
| P-1 | **Let an app register extra cron routes.** `vercel.json` can declare several, but `createCronHandler` is drain-only | M14 wants `/api/cron/kb-drift` daily and `/api/cron/kb-reverify` monthly, on their own schedules and their own failure semantics | Both are registered as **job kinds** (`stateready.kb_drift`, `stateready.kb_snapshot`) and enqueued from the single daily drain. Correct, but the drift crawl's 1.5 s spacing over 35 sources shares the drain's function budget |
| P-2 | **A deploy hook.** There is no "run this once after a deploy" seam, so the snapshot load has to be enqueued or run by hand | `specs/14`'s build step: records → snapshot → `isCurrent` flip | `stateready.kb_snapshot` job, plus `loadSnapshot` is idempotent per version so a repeat is free |
| P-3 | **`getEntitlement` has no notion of a read-only account.** `Entitlement` carries `active`/`inGrace`, and the app-managed trial adds a third state | `specs/09` AC2: at day 14 writes stop, reads and exports do not | `trialState()` in `src/lib/trial.ts` returns `readOnly`; every write path must call it. A platform-level `readOnly` on `Entitlement` would make that structural instead of remembered |
| P-4 | **A `documents` port, like `adapters/billing` and `adapters/email`.** All three apps need bytes with a key | `DocumentStore` here is nearly identical to Certly's | `src/lib/documents.ts`, in-memory in tests, Vercel Blob live |
| P-5 | **Per-recipient email suppression readback.** `email/suppression.ts` suppresses, but the app needs to know *why* a recipient is suppressed to adjudicate an alert carve-out | `specs/06` carve-out (d) | `alertRecipients.suppressionReason`, written by the app |

### Knowledge base (`phase-4-revenue/stateready/`) — not modified by this wave

| # | request | what it unblocks |
|---|---|---|
| K-1 | **A machine-readable CE window token**, `continuing_education.period.value = "calendar_window:MM-DD"`, where the window is a calendar window rather than the licence term. `nc.electrical` is the live case (1 July – 30 June, currently prose in the value's `note`) | `specs/05` AC2 in full. The engine and its test are already written |
| K-2 | **A machine-readable delivery constraint**, `min_classroom_fraction:0.5` alongside the prose | NC electrical's classroom shortfall, and `UX.md` S13's constrained-hours meter |
| K-3 | **Florida reciprocity** — entries, or a `reciprocity_statement` that says the board publishes none | Three of nine records become purchasable Entry Packs (D3) |
| K-4 | **`fl.electrical.registered_electrical_contractor`** — the expiry rule and the CE hour count are `unknown` | The same record; and the licence type currently derives nothing at all |
| K-5 | **The Florida 2 September 2027 override.** The ontology now carries `expiry_overrides` and G8 gates it; nothing uses it yet | The worked example for M13 and for the rule-change alert (J8) |
| K-6 | **Notes on `tx-plumbing` licence types [1] and [2]** (`renewal.cycle`, medium, `note: null`) | Two of three Texas plumbing types stop flagging. `tests/rules.acceptance.test.ts` AC7b reads the committed record, so it starts passing on its own |

### Founder gates that block a deploy, not this build

**P10** postal address and support email (`specs/12` fails the build without
`COMPANY_ADDRESS` — deliberately). **P1** Vercel Pro before the cron goes hourly
and before charging. **P5** the eleven Stripe prices. **P11** the name and the
USPTO knock-out. **Q15** counsel on the terms.

---

## 6. What the re-review left open, carried in

The wave-1b reviewer **signed for wave 2 and for launch** (round 2, 2026-09-03):
0 blocking, 0 major, **1 minor open**.

| id | what | how this build handles it |
|---|---|---|
| **N6** | `specs/05` §"Schema and gate work this requires" — the heading says the schema work landed, but the **body still reads** *"Until both land, an override is unrepresentable and this rule is dormant"* and *"This is the first schema change wave 2 should make"*. A developer who reads past the parenthetical concludes `expiry_overrides` cannot be used | **It can.** The ontology carries the field and G8 grew to nine assertion sites. This app implements the override rule, mirrors the extended G8 in `src/lib/kb/gates.ts`, types the field in `kb/types.ts` with the correction written into the doc comment, and tests it end to end (`rules.acceptance.test.ts` §M13). `phase-4-revenue/` is outside this wave's edit scope, so the stale paragraph is recorded here rather than fixed |

Two reviewer decisions this build inherits and implements rather than re-opens,
because the reviewer accepted both and called them better than his own:
**B6** (medium confidence carried by note-everywhere and fail-closed, not a
blanket flag — and see D1 above for how it is evaluated) and **B9** (a cron
designed to be correct on one invocation a day, `cron.ts`).

Also inherited and enforced in code: **D1** the 14-day no-card trial for the
first 100 (`trial.ts`), **D2** the demo as the single free entry point (M15),
**D4** the launch ICP, **D5** states before trades, **D6** M5 first as a pure
function, **D7** the tile grid at 90 days, **D9** the arbitrated identity.

---

## 7. Definition of done — what was checked, and how

| item | result |
|---|---|
| `npm run typecheck` (all workspaces) | pass |
| `npm test --workspace apps/stateready` | **290 passed**, 12 files |
| `npm run build --workspace apps/stateready` | pass, 21 routes, no warnings |
| Playwright, `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` | **7 passed**, including a cold-`.next` run |
| Root suites (`npm test`) and `cd app && npm test` | pass, untouched |
| `/coverage` renders from the nine records | yes — 9 rows, verified/unknown counts, `entryPackReady` per row |
| `BUILD.md` | this file |
| No secret in the repo | grep-tested (`tests/app.test.ts`); `.env.example` is names only |
| The disclaimer on every surface showing a rule or a date | in the `(app)` layout and on every marketing page; cadence-free by test |
