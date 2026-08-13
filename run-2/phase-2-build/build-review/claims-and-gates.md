# Build review — Claims, gates and honesty

**Lens.** Every G1..G6 gate is unpassed, so every performance claim must render as a mechanism
sentence. This review verifies that the gate machinery is an *instrument* rather than a
*display*, runs the `CORRECTIONS.md` probes over rendered HTML rather than over source, reads
the four public pages as a skeptical buyer and as a DOL investigator, checks the comparison
table against the competitors' own live pages, and closes the two documented divergences.

**How it was verified.** The app was booted (`DATABASE_DRIVER=pglite PGLITE_DATA_DIR=… ADAPTER_MODE=mock
npx next dev -p 3111`) against a database produced by `npm run seed`, and thirteen public routes
were fetched and de-tagged to plain text before probing. Gate behaviour was verified by driving
`readGate` / `refreshClaimGates` against PGlite with synthetic counter rows. Competitor prices
were fetched from `lcptracker.com/solutions/lcpcertified` and `certifiedpayrollpro.com/pricing`
on 2026-08-13. The specimen determination was fetched from `sam.gov/api/prod/wdol/v1/wd/TN20260151/1`.
Baseline re-confirmed after the review: `npm run typecheck` clean, `npx vitest run` 807/807 across
41 files. No test was weakened; the probe file used during the review was deleted.

**What held up.** Six things were attacked and did not break, and they are recorded here because a
review that only lists defects misrepresents the build:

- The `CORRECTIONS.md` `[STRUCK:ALL]` register, the five gate-locked claim families and the A3
  affordance probes were re-run over the **rendered HTML** of `/`, `/pricing`, `/legal`, `/status`,
  `/wh347`, `/wh347/map`, `/rates`, `/rates/va`, `/rates/va/gloucester`, a craft page, `/signin`
  and `/rate-card`. **Zero hits**, including hits the source-level lint would have missed because
  JSX tags no longer split sentences. The lint is not lying about what it checks.
- The specimen's factual core verifies against the primary source byte-for-value: SAM returns
  `TN20260151`, `revisionNumber: 1`, `General Decision Number: TN20260151 05/18/2026`, Bedford and
  Coffee Counties, Building, and under ` SUTN2017-004 04/16/2021` the lines
  `ELECTRICIAN.........................................$ 22.00                  11.77` and
  `LABORER:  COMMON OR GENERAL.........................$ 13.00                  3.99`. Every rate,
  group, county, modification and publication date on the landing page is real.
- The `$13.65` EO 13658 figure and its unusual "11 May to 31 December 2026" window are correct
  (DOL annual update; rate effective 11 May 2026).
- Competitor quotations are accurate. LCPcertified Plus publishes "$12 Per Report" and "Up to 25
  Active Projects: $2,500/Year", and exports CA / WA / MD XML. CertifiedPayrollPro publishes
  $49 (5 projects, $5/report), $99 (25 projects, $3/report), $249 (unlimited, $1/report), $0 setup,
  14-day trial. The page even quotes the competitor's *cheaper* plan where two would fit.
- `roundAgainstUs` only ceilings, is the sole rounding function in the status read model, and is
  applied to corpus age, reconciliation delta and the G5 ratio — the three places where the larger
  number is the less flattering one. Nothing on `/status` rounds in our favour.
- `USER_JOURNEY §12.2` vs `ARCHITECTURE §5.5` on deleting filings is **resolved and recorded**
  (see D-1 below for the one place it leaked).

---

## CRITICAL

### C-1 · Four of the six gates have no write path at all, so they can never move off zero — while both public pages describe them as live counters

**Where.** `src/platform/ops/gates.ts:158` (`recordAcceptanceConfirmation`, G2),
`src/platform/ops/gates.ts:127` (`recordFilingDuration`, G4), `src/platform/ops/gates.ts:19`
(names a `recordChaosCreditRun` for G6 that does not exist), `src/platform/ops/gates.ts:565`
(G6 reads `staleness_windows.chaos_test`), `src/platform/ops/gates.ts:520-534` (G5 streak).
Rendered at `src/app/(marketing)/page.tsx:713-717` and `src/app/status/page.tsx:357-361`.

**The defect.** Exhaustive grep over `src/`, `tests/` and `e2e/`:

```
$ grep -rn recordFilingDuration       --include=*.ts --include=*.tsx src tests e2e | grep -v ops/gates.ts
$ grep -rn recordAcceptanceConfirmation --include=*.ts --include=*.tsx src tests e2e | grep -v ops/gates.ts
$ grep -rn "chaos_test\|chaosTest"    --include=*.ts --include=*.sql src drizzle | grep -v ops/gates.ts
src/db/schema.ts:1407:  chaosTest: boolean('chaos_test').notNull().default(false),
drizzle/0000_init.sql:1670:  chaos_test   boolean NOT NULL DEFAULT false,
$ grep -rn recordChaosCreditRun -r src
src/platform/ops/gates.ts:19: *           `recordAcceptanceConfirmation`, `recordChaosCreditRun`. Each is called
```

- **G2** — `recordAcceptanceConfirmation` has **zero call sites**. There is no in-product
  acceptance-confirmation UI, no server action, not even a unit test that inserts a row.
  `ARCHITECTURE §14` says G2 is instrumented at "`filing_events` of kind `acceptance_confirmed`,
  recorded by in-product confirmation"; no such `filing_events` kind is ever written either.
- **G4** — `recordFilingDuration` has **zero call sites**. Nothing in the upload → artifact path
  calls it, so `filing_durations` is permanently empty and `readG4` returns `measured: null, actual: 0`.
- **G6** — no code anywhere sets `chaos_test = true`. The module header names a writer
  (`recordChaosCreditRun`) that was never written. `readG6`'s join can therefore never return a row.
- **G5** — has a writer (`recordInboundMessage`) but is arithmetically unclearable; see C-2.

**Failing scenario.** Run the company perfectly for three years. Ship 10,000 filings. Have 200 GCs
confirm acceptance by email. Run the chaos drill monthly. Every one of G2, G4, G5 and G6 still
reads `0 / 50`, `0 / 100`, `0 / 90` and `0 / 2` on `/status`, forever, because no code path exists
that could write the evidence. Meanwhile `/status:357` and `/` :713 tell the reader "Each gate is a
counter… a measured claim that regresses narrows itself on the next refresh," and each locked card
reads "the sentence is absent because the counter is" — implying an instrument that is waiting for
data, not an instrument that was never wired.

**Why it matters.** `PLAN.md`'s operating rule is "No claim of a measured outcome ships before it is
actually measured," and `ARCHITECTURE §14` closes with "**All six are counters in the database, not
statements in a document.**" Four of the six are, today, statements in a document with a `0` beside
them. The failure is not that a false claim ships — none does — it is that the *honesty mechanism
itself* is the unmeasured claim. A skeptical buyer who is told "these counters govern what we may
say" is being told something about this build that is not true, and the FTC substantiation standard
the page invokes at `page.tsx:740` applies to that sentence as much as to any other.

**Fix.** Either wire the four writers or stop describing them as counters.
(a) Call `recordFilingDuration` from the artifact-ready path in `src/app/(app)/_lib/filings.ts`,
passing the import's `created_at` as `uploadAt` and `realFiling: true`.
(b) Add the in-product G2 confirmation control on the filing page (a single "the receiving party
accepted this" / "it was rejected, here is why" pair) calling `recordAcceptanceConfirmation`, and
emit the matching `filing_events` row §14 names.
(c) Add a `chaos.staleness-credit` worker job, runnable only under `ADAPTER_MODE=mock`, that writes
`staleness_windows.chaos_test = true` at both scales §14 requires, and export the
`recordChaosCreditRun` the header already promises.
(d) Until (a)–(c) land, `readGate` must distinguish `locked` from **`uninstrumented`**, and the two
gate cards must render "this counter has no writer in this build" rather than `0 / 100`.

### C-2 · G5 is structurally unclearable: perfect autonomy produces a zero-day streak

**Where.** `src/platform/ops/gates.ts:520-534`.

**The defect.** The streak is computed over rows returned by a query grouped on
`inbound_messages.received_at`. A day on which **no message arrived produces no row**, so it does
not count as "a day under the ceiling". The better the product performs, the shorter the streak.

**Failing scenario, executed.** 60 paying accounts seeded into `billing_account_index`, zero inbound
messages for 90 days:

```
G5 {"state":"locked","measured":0,"consecutiveDays":0,
    "thresholds":[{"name":"days under the ceiling","required":90,"actual":0,"met":false},
                  {"name":"paying accounts","required":50,"actual":60,"met":true}]}
gateSentence → outcome: null
```

The gate whose threshold is "90 days below 2 human minutes per customer per month at 50 paying
accounts" is *not met* by 90 days at **zero** minutes and 60 accounts. To clear G5 the company must
receive at least one inbound message on each of 90 consecutive days.

**Why it matters.** G5 is `PLAN.md` A6's only instrument. Inverting its incentive means the one
gate that exists to prove the zero-human-minutes thesis can only be cleared by generating human
contact — and, because it cannot clear, the company can never state the A6 claim even when A6 holds.

**Fix.** Compute the streak over the **calendar** window, not over rows: generate the day series
with `generate_series(now() - interval '400 days', now(), '1 day')`, `LEFT JOIN` the daily minutes,
and treat a null day as zero minutes (a day under the ceiling). Add a regression test asserting
that 90 days of zero inbound at 50 paying accounts unlocks G5.

### C-3 · `/legal` states a deletion promise the product does not perform, and contradicts the in-app deletion screen

**Where.** `src/app/(marketing)/legal/page.tsx:176-184` ("What deletion erases") versus
`src/platform/account/deletion.ts:132-169` (`DELETION_SCOPE`) and `ARCHITECTURE §5.5:756-757`.

**The defect.** The public privacy page says, as hardcoded copy:

> **What deletion erases** — Every project, pin, payroll line, **filing and artifact**. Every worker
> record, including encrypted Social Security numbers. …

`DELETION_SCOPE` marks exactly those three things `retained`:

| entry | disposition | retention |
|---|---|---|
| `filings_and_artifacts` (`deletion.ts:133-146`) | **retained** | 3 years from closure |
| `last4_and_names_in_artifacts` (`deletion.ts:148-157`) | **retained** | the same 3 years |
| `projects_and_pins` (`deletion.ts:159-169`) | **retained** | the same 3 years |

The facing card, "What deletion does not erase" (`legal/page.tsx:186-196`), lists only the crosswalk
aggregate, the mirror and Stripe — omitting filings, artifacts, the printed last-4 and names, the
project and pin rows, the backups, and the de-identified gate counters, all of which `DELETION_SCOPE`
retains. The page is not rendered from `DELETION_SCOPE`; it is a fourth, unwired copy of a list
`deletion.ts:17-27` claims has exactly two renderers ("There is no second list").

**Failing scenario.** A California customer reads `/legal` before signing up, deletes their account
under CCPA's right to delete, then discovers on the in-app confirmation screen — which *does* render
`DELETION_SCOPE` — that their filings, their workers' names and last-4 SSNs, and their project names
are held for three more years. They have been given two contradictory statements by the same
company, and the more favourable one is the public marketing page.

**Why it matters.** `ARCHITECTURE §5.5:740` states the rule this violates in terms: *"a deletion
promise the customer only discovers to be partial is worse than a narrower promise made up front"*,
and §5.5:763 says *"the one thing we will not do: claim that deletion is total."* `/legal` claims it
is total for the categories that matter most to a privacy regulator. This is the single sentence on
the site a regulator can falsify in one query, and unlike every gated claim it is not protected by
any lint — the claims lint has no probe for it.

**Fix.** Delete the hardcoded prose in `legal/page.tsx:176-196` and render both cards from
`DELETION_SCOPE`, partitioned on `disposition`, exactly as
`src/app/(app)/app/settings/data/page.tsx:111-129` already does — one enumeration, now three
renderers. Add a test asserting that the set of labels rendered on `/legal` equals the set rendered
on `/app/settings/data`, so the two can never drift again.

---

## HIGH

### H-1 · A human with commit access *can* promote a claim by editing copy — the sentence denying it is on two pages

**Where.** `src/app/(marketing)/page.tsx:715` and `src/app/status/page.tsx:359`, both rendering
"**Nobody here can promote a claim by editing copy.**" Enforcement lives in
`tests/lint/claims.test.ts:296-323` (the five `GATED` regexes) plus the `[STRUCK:ALL]` register.

**The defect.** The gate-locked-claim check is a **string blacklist**, applied per sentence. It
catches the copy-paste and nothing else. `CORRECTIONS.md §3.5:660-665` says this out loud —
*"A string ban catches the copy-paste. Only a positive requirement — every number resolves to a
dated source — catches the rewrite"* — and names **CL-2 as the load-bearing check**. CL-2 is not
implemented. `grep -rn "CL-2" src tests` returns three code *comments* citing it and no assertion.

**Failing scenario, executed.** Ten unmeasured outcome claims fed through the register's own probes,
the five gate regexes and the negation guard, using the same matcher path the lint uses. **All ten
pass the lint:**

```
PASSES LINT  Ratepin gets Friday's certified payroll out the door in under four minutes.      [G4]
PASSES LINT  Every rate we have ever printed matched its wage determination.                  [G1]
PASSES LINT  Contractors stop failing GC compliance review after they switch.                 [G2]
PASSES LINT  We hold a copy of every determination SAM publishes.                             [G3]
PASSES LINT  Nine out of ten filings clear on the first submission.                           [G2]
PASSES LINT  Cuts the Friday scramble down to a coffee break.                                 [G4]
PASSES LINT  The form is right, every time.                                                   [G1]
PASSES LINT  [negation] The arithmetic has never produced a wrong rate.                       [G1]
PASSES LINT  [negation] Not one person is involved in producing your filing.                  [G5]
```

Two of them are *actively whitelisted*: the negation guard
`\b(no|not|never|nor|isn't|is not|…)\b` (`CORRECTIONS.md:568`) fires on "**never** produced a wrong
rate" and "**Not** one person is involved", so the guard designed to protect corrections exempts
superlative claims phrased in the negative.

**A second promotion path.** `src/lib/config.ts:152-156` declares
`CLAIM_G1_RATE_CORRECTNESS` … `CLAIM_G5_AUTONOMY` as plain `boolFromEnv(false)` environment
booleans, and `claimUnlocked()` (`config.ts:264-276`) returns them with **no reference to
`claim_gates` or to any counter** — despite the module header at `config.ts:30-32` asserting "None
of them may be flipped by hand to make copy read better." They can be, by one env var, with no
measurement. They are currently harmless only because no renderer consults them:
`claimUnlocked` is called from `src/scripts/canary.ts:37` and nowhere else.
`CREDIT_GUARANTEE_ADVERTISED` (`config.ts:149`), G6's advertising flag, is read by **nothing at all**
except a test asserting its default.

**Why it matters.** The sentence "Nobody here can promote a claim by editing copy" is itself an
unmeasured claim about a mechanism, rendered on the two pages whose subject is not making unmeasured
claims. A buyer or a regulator who tests it — which is precisely the reader the page invites — finds
a paraphrase-shaped hole and a pair of ungated env booleans.

**Fix.** Three changes, in order of value:
1. **Implement CL-2**, the positive check: extract every numeral from the rendered text of every
   Scope A route and require each to resolve to `BRAND.md §5.5`'s allow-list (corpus figures with
   their as-of date, WH-347 form identity, verbatim-quoted competitor prices with a fetch date, our
   own `plans`-table prices, statutory citations) or to a gate reading. Run it over **rendered HTML**,
   not source, using the harness in this review.
2. Narrow the sentence to what is enforced: *"Every gate outcome on this site is rendered from
   `gateSentence`, which returns null while the counter is locked and has no override."* That is
   true and testable. Drop "Nobody here can promote a claim."
3. Delete `CLAIM_G1..G5` and `CREDIT_GUARANTEE_ADVERTISED` from config, or make `claimUnlocked` read
   `claim_gates.state = 'unlocked'` and ignore the env var entirely. A second, editable gate ladder
   beside the counter ladder is the exact hazard §0.2 exists to remove.

### H-2 · G6's "mechanism" sentence is the guarantee D10 forbids advertising before the chaos test passes

**Where.** `src/platform/ops/gates.ts:234-236`, rendered on `/` (`page.tsx:727`) and `/status`
(`status/page.tsx:369`).

**The defect.** Five of the six `GATE_MECHANISM` strings describe what the code does ("is re-scored",
"is validated", "is reconciled", "is measured", "is counted"). G6's does not:

> "When newer-revision checks stop completing, the claim on the artifact narrows, a dated banner
> appears, and **a service credit accrues automatically**."

That is a promise about a money outcome, in the present indicative, on a public page.
`CORRECTIONS.md §4` F-4 names the forbidden string as *"we credit you automatically if we're
stale"* and gates it on G6; `IDEA_DOSSIER.md` D10 G6 says the auto-credit must fire correctly in a
chaos test *"**before** the guarantee is advertised anywhere."* Per C-1, no chaos test writes
`chaos_test = true`, so G6 has never been exercised — and `CREDIT_GUARANTEE_ADVERTISED`, the flag
built to gate exactly this sentence, is read by nothing.

**Failing scenario.** SAM goes dark for four days. The ladder reaches L2 and the credit job runs, but
`ceilingCents = max(CREDIT_FLOOR_CENTS, CREDIT_CEILING_PCT × MRR)` binds at early-stage MRR (on the
seeded system the published ceiling is `100`, i.e. **$1.00**, visible on `/status` today). Most
affected accounts get nothing. Every one of them was told on the landing page, while G6 read
`LOCKED`, that a service credit accrues automatically. `DESIGN_REVIEW.md:224` flagged this exact
ceiling-eats-the-credit failure and required the banner not to promise the credit when the ceiling
would bind; the landing page promises it unconditionally.

**Why it matters.** This is the one gate-locked outcome that currently ships, and it ships disguised
as a mechanism sentence. It is also the claim with the most direct consumer-protection exposure,
because it is a promise of money.

**Fix.** Rewrite `GATE_MECHANISM.G6` to a mechanism: *"Staleness beyond the published window is
recorded as an incident with a dated window, and the credit path is exercised against it."* Move
"a service credit accrues automatically" into the G6 **outcome** branch of `gateSentence`, where it
is `null` until the counter clears. Then wire `CREDIT_GUARANTEE_ADVERTISED` — or delete it — so the
flag and the sentence stop disagreeing about who is in charge.

### H-3 · "Consecutive green days" is not consecutive and is not anchored to today, in both G1 and G3

**Where.** `src/platform/ops/gates.ts:352-361` (G1) and `:463-468` (G3).

**The defect.** Both streaks iterate the day-grouped rows of the evidence table and break only on a
*bad* day. The code comment at `:352-354` states the design: *"A day with no run does not extend the
streak and does not break it either."* But `assemble()` then compares that count against a threshold
whose name and rendered description are **calendar** days ("30 consecutive green days", "60 days of
zero unexplained delta"), and `gateSentence` prints "as of today" regardless of when the last row was
written.

**Failing scenario, executed.** 30 green canary runs, one every 30th day, the last of them dated
2025-05-16 — roughly 15 months before "today":

```
G1 {"state":"unlocked","measured":30,"consecutiveDays":30,
    "thresholds":[{"name":"consecutive green days","required":30,"actual":30,"met":true}, …]}
gateSentence → outcome: "30 consecutive days green as of today."
```

G3 behaves identically: 60 reconciliation rows on 60 arbitrary days unlock it.

**Why it matters.** G1 is the gate standing between this company and a correctness claim on a signed
federal certification. As written, a corpus that stopped being canaried a year ago, or a canary that
runs monthly instead of nightly, satisfies "30 consecutive green days" and releases the F-1 claim
family — while the sentence adds "as of today", which is false. `IDEA_DOSSIER.md` D10 G1 specifies
"re-scored on **every** corpus refresh and **every** deploy… 30 consecutive green days".

**Fix.** Anchor and densify. Build the day series with `generate_series` over the last N days,
`LEFT JOIN` the evidence, and break the streak on a day with **no** evidence as well as on a red day.
Add a freshness threshold to both gates — `hours since last run <= 48` for G1, `<= 48` for G3 — so a
stale instrument cannot hold a gate open. Add regression tests for the sparse-and-stale case above.

### H-4 · The two customer-facing evidence tables are UPDATE- and DELETE-able by the application role, contradicting the rule stated one file away

**Where.** `drizzle/0000_init.sql:1717` (inside `ratepin_enable_tenant_rls`) applied to
`filing_durations` (`:1741`) and `form_acceptance_confirmations` (`:1742`), versus
`src/platform/schema.ts:230-239`.

**The defect.** `schema.ts:230-233` states the principle and enforces it for two tables:

> INSERT ONLY on the two evidence tables. There is deliberately no UPDATE and no DELETE: a canary run
> and a nightly reconciliation are facts about a moment, and **a product that can edit its own
> evidence has none.**

`GRANT INSERT ON canary_runs, corpus_reconciliation TO ratepin_app;` — correct. But G2's and G4's
evidence tables go through `ratepin_enable_tenant_rls`, whose last statement is
`GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO ratepin_app`. The two gates whose evidence is
customer-supplied are the two the application can rewrite.

**Failing scenario.** G4 nears its threshold with an unflattering median. A single
`DELETE FROM filing_durations WHERE seconds > 900` executed by the web role — which passes RLS for
its own tenant and needs no migration, no admin session and no code review of a SQL file — moves the
published "median N minutes over N filings" downward, and `refreshClaimGates` faithfully recomputes
from the doctored counter. Equivalently, `UPDATE form_acceptance_confirmations SET accepted = true`
converts recorded rejections into G2 evidence. Neither leaves a trace: both tables are plain rows
with no append-only trigger.

**Why it matters.** It is the precise failure `schema.ts` names, on the two gates where the evidence
is least independently verifiable, and it silently undoes the protection the neighbouring grant was
written to provide.

**Fix.** Give `ratepin_enable_tenant_rls` an `p_append_only boolean DEFAULT false` parameter that
grants only `SELECT, INSERT` and installs the append-only trigger already used elsewhere in
`0000_init.sql`, and pass it for `filing_durations` and `form_acceptance_confirmations`. Add the
assertion to `tests/schema-parity.test.ts`: for every table named in `GATE_THRESHOLDS`' evidence set,
`has_table_privilege('ratepin_app', t, 'UPDATE')` and `'DELETE'` must both be false.

### H-5 · The `project_cap` / `worker_cap` divergence is unresolved, and a marketing claim now rests on the gap

**Where.** `drizzle/0000_init.sql:1850-1853`; `src/app/(marketing)/_lib/plans.ts:65-66, 98-99`;
`src/platform/billing/catalog.ts:61-62, 75-76, 84`; `src/platform/billing/pricing.ts:39-40`;
claim at `src/app/(marketing)/pricing/page.tsx:54` and `src/app/(marketing)/page.tsx:598`.

**The defect.** `ACQUISITION_REVIEW.md` N-4 and `GTM_PLAYBOOK.md:111` both rule: *"They are to be
dropped from the seed and from `(marketing)/_lib/plans.ts`… Recorded as a build item for the
post-build review pass."* Neither drop happened. The seed still writes

```sql
('solo',  'Solo',   9900, …,  1, 15, …),
('crew',  'Crew',  24900, …,  5, 75, …),
('multi', 'Multi', 59900, …, NULL, NULL, …);
```

and `presentTier` still carries `projectCap` / `workerCap` into the pricing view model.
`tests/web/marketing.test.ts:281-282` asserts on them, so the vestige is now test-anchored.

The divergence is also *unrecorded*: `ARCHITECTURE.md:1294` states the opposite of N-4 —
*"the `plans` table carries nullable `project_cap` and `worker_cap` columns… so reverting to literal
D4 packaging is a data change with no code change"* — and nothing in the build reconciles the two.

**Failing scenario.** The public claim is "**No project caps. No worker caps.**" Because
`ARCHITECTURE §16` deliberately keeps the ladder data-driven, an operator running one `UPDATE plans`
makes that claim false with **no code change, no deploy, no test failure and no lint hit** — the
claims lint has no probe for it and CL-2 does not exist (H-1). A Solo customer capped at 1 project
by a row edit is reading a landing page that promises the opposite.

**Why it matters.** It is a live product claim whose truth depends on two database columns that the
phase-3 audit ruled must not exist, and the architecture document explicitly advertises flipping them
as a supported, code-free operation.

**Fix.** Execute N-4: drop `project_cap` and `worker_cap` from `0000_init.sql`'s `plans` insert and
from the `plans` table itself in a follow-up migration; remove `projectCap` / `workerCap` from
`plans.ts:65-66, 98-99`, `catalog.ts:61-62, 75-76, 84` and `pricing.ts:39-40`; delete the two
assertions at `marketing.test.ts:281-282`. Add a line to `ARCHITECTURE §16 Challenge 1` recording
that N-4 supersedes the "one row-set away" sentence. If instead the columns are to stay, the
"No project caps. No worker caps." copy must be rendered from `readLadder` (`every tier's
projectCap === null`) rather than typed, so the claim and the data cannot diverge.

---

## MEDIUM

### M-1 · "verbatim, byte for byte" is not verbatim

**Where.** `src/app/(marketing)/page.tsx:190` (the caption) and `:196-202` (the `<pre>` block).

**The defect.** The page labels the determination excerpt "**In the determination** · verbatim, byte
for byte" and renders:

```
 SUTN2017-004 04/16/2021
                              Rates      Fringes
ELECTRICIAN..................$ 22.00     11.77
```

SAM's document, fetched live, contains:

```
 SUTN2017-004 04/16/2021
                                                     Rates                  Fringes
ELECTRICIAN.........................................$ 22.00                  11.77
```

The dot leader has been shortened from 49 dots to 18 and both column gaps have been reflowed.

**Failing scenario.** The page's entire rhetorical strategy is "check us". A buyer who opens the
source URL printed two paragraphs below — which the page invites, and which takes thirty seconds —
finds the one element explicitly claimed to be byte-identical is not. Every softer claim on the page
is then read with that in mind.

**Why it matters.** Small, self-inflicted, and on the single most-inspected element of the most-read
page. `CORRECTIONS.md §3.2`'s own lesson is that a claim which red-flags on inspection destroys the
credibility of the ones that do not.

**Fix.** Either reproduce the source line at its true width inside the existing
`overflow-x: auto` container, or change the caption to "quoted from the determination, reflowed to
fit" — and, better, render the excerpt from the mirrored blob so it cannot drift from the bytes at all.

### M-2 · "stays available for 30 days" is an unattributed number that contradicts the product in both directions

**Where.** `src/app/(marketing)/page.tsx:612`.

**The defect.** The landing states "The full artifact archive exports on cancellation and **stays
available for 30 days**." Nothing implements a 30-day archive window. The in-product copy says the
opposite and says it twice: `src/platform/billing/entitlement.ts:185-189` (`cancelled`) — "Your
archive and export stay available", with no window — and `:180-183` (`archived`) — "Every filing you
generated is still here and still downloadable." `DELETION_SCOPE` retains filings for **three years**.
`USER_JOURNEY.md:1197,1203`'s "30 days" is the *dunning* transition to `archived`, an unrelated clock.

**Failing scenario.** A customer cancels in month two, reads "30 days", and either (a) believes their
three-year federal recordkeeping evidence is about to disappear and churns to a competitor over a
number that is not true, or (b) relies on it, is later asked by a WHD investigator for a filing from
14 months ago, and finds we still had it — meaning the page understated in one direction and the
product overstated in the other. Neither reader was told the truth.

**Why it matters.** It is exactly the CL-2 shape: a plausible, fluently written number nobody sourced.
It is also the only number on the site that contradicts in-product copy.

**Fix.** Delete the "for 30 days" clause and render the sentence from the same
`entitlementNotice`/`DELETION_SCOPE` source the app uses: "the archive stays open, and your filings
are held for three years from closure."

### M-3 · G2's "the label is rendered off the counter" is not implemented; the label is a default nobody reads

**Where.** `src/artifacts/ecpr/model.ts:124-130` (`g2Cleared?: boolean`),
`src/artifacts/ecpr/render.ts:421`, versus `ARCHITECTURE.md:1262`.

**The defect.** §14 promises "A feature flag reads the counter; the *generated, not
acceptance-tested* label is rendered by the eCPR renderer while the counter is below threshold, **so
removing it requires the data, not a decision**." `g2Cleared` is set by exactly one caller in the
repository — `tests/artifacts/ecpr.test.ts:224`. No production path passes it, and nothing anywhere
calls `readGate(db, 'G2')` to compute it. The label survives today only because the optional
parameter defaults to `false`.

**Failing scenario.** Removing the label from every California eCPR file that ships is a one-token
edit (`g2Cleared: true` at the render call site) that consults no counter, trips no lint, and fails
no test — the opposite of what §14 says. Given C-1, the counter it should consult can never be
non-zero anyway.

**Why it matters.** The eCPR label is the F-2 acceptance claim's only in-artifact guard, on the
artifact that goes to a state agency.

**Fix.** Compute `g2Cleared` in the filing pipeline as
`(await readGate(db, 'G2')).state === 'unlocked'` and pass it at the single render call site; assert
in a test that a locked G2 reading produces a file carrying the label and that no call site passes a
literal.

### M-4 · G5's mechanism sentence implies a published address that the product does not have

**Where.** `src/platform/ops/gates.ts:229-232`, rendered at `/` `page.tsx:727` and
`/status` `status/page.tsx:309-313, 323`.

**The defect.** "Every inbound message at **every address this company publishes** is counted…" and
the status row label "Inbound messages, **all published addresses**: 0". The A3 lint
(`tests/lint/claims.test.ts:255-264`) asserts that **no mail address is rendered anywhere**, and the
rendered-HTML probe in this review confirms zero addresses across thirteen routes.
`ARCHITECTURE §10.5` permits one billing address for card disputes; it is not rendered.

**Failing scenario.** A buyer reads "every address this company publishes" and infers there is at
least one, then cannot find it, and reads the `0` as the count of messages we chose to acknowledge
rather than as the count of messages that could physically arrive. The sentence intended to prove
honesty reads as evasion.

**Why it matters.** Low harm, but it is on the accountability surface, where ambiguity costs the most.

**Fix.** Render the address registry's actual contents: "Ratepin publishes no contact address; the
counter is wired to `published_addresses`, which is empty, and every message at any address added to
it is counted with a one-minute floor." That is a mechanism sentence and it is true today.

---

## LOW

### L-1 · `refreshClaimGates` treats a missing `claim_gates` row as "previously cleared"

**Where.** `src/platform/ops/gates.ts:607`.

`const hadCleared = previous?.state === 'unlocked' || previous?.unlocked_at !== null;` — when
`previous` is `undefined` (no seeded row), `previous?.unlocked_at` is `undefined` and
`undefined !== null` evaluates **true**, so `state` is computed as `'regressed'`. This is inert today
only because the following `UPDATE … WHERE gate_key = …` matches nothing. Verified against PGlite:
all six seeded rows return `unlocked_at: null` correctly and stay `locked` across two refreshes.

**Failing scenario.** A seventh gate is added to `GATE_KEYS` without a seed row: the refresh silently
no-ops, the gate never appears on `/status`, and nothing errors.

**Fix.** `const hadCleared = previous !== undefined && (previous.state === 'unlocked' || previous.unlocked_at !== null);`
and make the loop throw when `UPDATE` affects zero rows, so a missing gate row is a boot failure
rather than a silent absence.

### L-2 · `/status` prints the liability cap as bare integer cents

**Where.** `src/app/status/page.tsx:399-409`.

"Credits posted this incident: 0 · Credits withheld by the ceiling: 0 · **Ceiling: 100**", with the
unit disclosed only in the legal note below. On the seeded system the published cap is $1.00
(`max(CREDIT_FLOOR_CENTS=100, 100% × MRR=0)`). A reader scanning the block reads "100" as dollars or
as a percentage; both are wrong by two orders of magnitude in our favour.

**Fix.** Format with `Cents.toDollarString` on this page as everywhere else, and keep the "as the
ledger stores them" note for the raw JSON at `/api/status`.

### L-3 · The resolved deletion divergence is recorded only in a source-file header

**Where.** `src/platform/account/deletion.ts:5-14`.

The divergence between `USER_JOURNEY §12.2` and `ARCHITECTURE §5.5` **is** resolved correctly and
**is** recorded — §5.5 governs, and the module says so at length. But the record lives only in a
TypeScript comment. `USER_JOURNEY §12.2:1330` still reads "What is deleted: every project, pin,
payroll line, filing and artifact", `§12.3:1351`'s flow diagram still shows `filings` inside the hard
purge, and neither carries a superseded marker — which is how C-3 got copied into `/legal` in the
first place.

**Fix.** Add the two-line supersession note to `USER_JOURNEY §12.2` and `§12.3` in the style of
`IDEA_DOSSIER.md`'s errata header, pointing at `ARCHITECTURE §5.5`, and add the divergence to
`ARCHITECTURE`'s AS-list.

---

## Summary

| ID | Sev | One line |
|---|---|---|
| C-1 | CRITICAL | G2, G4 and G6 have zero write paths; the header names a writer that does not exist |
| C-2 | CRITICAL | G5 cannot clear: a day with no inbound message does not count as a day under the ceiling |
| C-3 | CRITICAL | `/legal` promises deletion of filings and artifacts that `DELETION_SCOPE` retains for 3 years |
| H-1 | HIGH | "Nobody can promote a claim by editing copy" is false: 10/10 paraphrases pass the lint; CL-2 unimplemented; `CLAIM_G*` env booleans bypass the counters |
| H-2 | HIGH | G6's mechanism sentence advertises the staleness credit D10 forbids advertising pre-chaos-test |
| H-3 | HIGH | G1/G3 streaks count sparse days as consecutive and print "as of today" over arbitrarily stale evidence |
| H-4 | HIGH | `filing_durations` and `form_acceptance_confirmations` are UPDATE/DELETE-able by the app role |
| H-5 | HIGH | `project_cap`/`worker_cap` not dropped per N-4; "No project caps" is a claim over unenforced data |
| M-1 | MEDIUM | "verbatim, byte for byte" excerpt is reflowed |
| M-2 | MEDIUM | "stays available for 30 days" contradicts the product in both directions |
| M-3 | MEDIUM | `g2Cleared` never computed from the counter; §14's "requires the data, not a decision" is untrue |
| M-4 | MEDIUM | G5's mechanism sentence implies a published address that does not exist |
| L-1 | LOW | `refreshClaimGates` reads a missing row as previously-cleared |
| L-2 | LOW | `/status` prints the liability cap as bare cents |
| L-3 | LOW | The resolved deletion divergence is recorded only in a code comment |

**The through-line.** This build is unusually honest at the sentence level — every probe, every
competitor price, every rate on the specimen and every rounding direction survived attack. What does
not survive is the layer above: the machinery the product *points at* to prove its honesty. Four of
six gates cannot be written to, a fifth cannot clear, the two that can are gap-blind, the
load-bearing lint (CL-2) was specified and never built, and two of the three pages that describe this
machinery make a claim about it — "nobody here can promote a claim by editing copy" — that a
committer can falsify in one commit. The remedy is not more copy. It is wiring the four writers,
anchoring the two streaks to the calendar, implementing CL-2 over rendered HTML, and narrowing three
sentences to what the code actually enforces.

---

## References

- `run-2/PLAN.md` — A1–A6; the operating rule that no measured-outcome claim ships before measurement
- `run-2/phase-1-ideation/IDEA_DOSSIER.md` — D3, D4, D7, D10 (G1–G6 and their thresholds)
- `run-2/phase-2-build/architecture/ARCHITECTURE.md` — §5.5 (deletion), §14 (gate instrumentation), §16 Challenge 1 (the plan ladder)
- `run-2/phase-2-build/architecture/USER_JOURNEY.md` — §11.8 (G5), §12.2–§12.3 (deletion screen)
- `run-2/phase-2-build/CORRECTIONS.md` — §3.2–§3.5 (the register, the two severities, CL-1/CL-2), §4 (F-1…F-4)
- `run-2/phase-2-build/DESIGN_REVIEW.md` — the G5 self-report finding, the credit-ceiling MED-3 correction
- `run-2/phase-2-build/identity/BRAND.md` — §5.4 (struck claims), §5.5 (numbers we may print today)
- `run-2/phase-3-acquisition/ACQUISITION_REVIEW.md` N-4 and `GTM_PLAYBOOK.md` §111 — the project_cap/worker_cap ruling
- `https://sam.gov/api/prod/wdol/v1/wd/TN20260151/1` — fetched 2026-08-13, HTTP 200; specimen determination verified
- `https://lcptracker.com/solutions/lcpcertified/` — fetched 2026-08-13; $12/report, $2,500/yr for 25 projects, CA/WA/MD XML
- `https://www.certifiedpayrollpro.com/pricing` — fetched 2026-08-13; $49/$99/$249, $0 setup, 14-day trial, $5/$3/$1 per report
- U.S. DOL, Executive Order 13658 annual update — $13.65 effective 11 May 2026
- FTC, Policy Statement Regarding Advertising Substantiation — the standard the landing page invokes
