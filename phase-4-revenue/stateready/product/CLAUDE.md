# product/ — memory file (StateReady Product Owner agent, wave 1)

**Started:** 2026-09-03. **Agent:** Product Owner (StateReady), phase-4 fleet. **Status:** in progress.

## Scope
Writes only under `phase-4-revenue/stateready/`: `BACKLOG.md`, `specs/`, `KNOWLEDGE_BASE.md`,
`THRESHOLDS.md`, `ontology/`, `kb-data/`, `kb-scripts/`, `product/`. No code in `apps/`.
No commits, no pushes, no sign-ups, no sending.

## Rules confirmed (PLAN.md / PIPELINE.md)
- Six-stage pipeline: ideation → research → verification → writing → self-review → iterate.
  Stage 5 (adversarial review) is the wave-1b reviewer's, not mine.
- A10: every regulatory value carries `source_url`, `last_verified`, `verified_by` (two agent ids),
  `confidence`. Two independent verifications; drift cron; disclaimers everywhere.
- A11: launch coverage = HVAC, plumbing, electrical × the 15 states with most contractor activity.
- A7 magic link. A2 US/English. A12 Vercel Cron + jobs table. A13 Neon + PGlite. A14 own events table.
- Sources are opened, not remembered. No fetched URL + date ⇒ does not ship.
- Never estimate a fee or an hour count. Unknown stays empty with a note. `UNVERIFIED` where a value
  could not be re-opened at the source.
- Two attempts per source, then log and move on. Never ask a human.
- Blocked: reddit.com, facebook.com. Some state sites 403 curl → try WebFetch once, then log.

## Log
- 2026-09-03: read PLAN, PIPELINE, shortlist StateReady entry, 8 merged raw ideas, prospects README,
  CORPUS_DESIGN.md. Directories created.

### 2026-09-03 — research log

**The 15-state list is now data, not a guess.**
BLS QCEW open-data API works with a **lowercase** quarter letter:
`https://data.bls.gov/cew/data/api/<year>/a/industry/<naics>.csv` (uppercase `A` 404s).
2025 annual averages are published. Filter `agglvl_code=56` (state × NAICS 4-digit), `own_code=5`
(private), `area_fips` ending `000`. NAICS **2382 Building Equipment Contractors** = electrical
(23821) + plumbing/HVAC (23822) — the exact three trades, so it is a sharper proxy than 238.
Reproduced by `kb-scripts/rank_states.py`. Result differs from the brief's guess: **NY and MA are
in, WA (#16) and TN (#17) are out.** Kept the data, logged the deviation.

**Sources that worked (all plain `curl`, desktop UA, HTTP 200)**
- tdlr.texas.gov — restructured: `/aircond/`→`/acr/`, `/electricians/` kept but page names changed
  (`/electricians/apply/individuals/master-electrician.htm` etc). Old `*.htm` deep links 404.
- tsbpe.texas.gov — **Texas plumbing is NOT TDLR.** TSBPE survived the 2019 sunset and is still the
  regulator. Any KB that routes TX plumbing to TDLR is wrong.
- ncbeec.org (NC electrical), nclicensing.org (NC plumbing/heating/fire sprinkler).
- www2.myfloridalicense.com + www.myfloridalicense.com/CheckListDetail.asp (Florida DBPR) — the
  checklist pages are the machine-readable requirement source; fees are not on them.
- flrules.org — rule metadata page has no rule text, but `/gateway/readFile.asp?...&file=<rule>.doc`
  returns the adopted Word file. Strings are extractable from the OLE stream with a regex; that is
  how the Florida insurance minimums (61G4-15.003) were obtained.
- BLS QCEW (see above).

**Gaps left open on purpose (never estimate a fee)**
- Florida CILB *application* fee: not printed on the checklist page; the CILB 5-G/5-H PDF is an
  image/XFA form with no extractable text; rule 61G4-12.011 turned out to be Definitions, not Fees.
  Recorded as `status: unknown` with a note, not guessed.
- Texas bond: no bond requirement appears on any TDLR ACR/electrician page fetched. Recorded as an
  **absence** (`status: unknown`, note says which pages were read), never as "no bond required".

**Facts that would embarrass a competitor's data set (good marketing proof)**
- NC plumbing/heating: mandatory CE was **abolished in 2012**; the board approves no providers.
  NC electrical: 8 h/yr, at least half in a classroom. Two boards, one state, opposite rules.
- NC licences all expire **31 December**, no grace period (G.S. 87-22) → a December pile-up.
- Florida: certified licences expire 8/31 **even** years, registered 8/31 **odd** years. Same trade,
  two calendars, decided by whether the holder is `C…` or `R…`.

### 2026-09-03 — build log

**Verification pass B is real and it worked.** `kb-scripts/verify_pass_b.py` re-fetches every
`source_url` over the network and asserts the recorded `evidence` fragment is still literally
present. First run: **459 values checked, 435 agreed, 24 disagreed — 94.8%.** Every one of the 24
was a genuine authoring defect, not a page change:
- 7 x Texas electrical `waives_exam`: the quoted phrase came from **North Carolina's** reciprocity
  page, not TDLR's. A cross-source transcription error that reads perfectly well in prose.
- 5 x North Carolina renewal: the statute says "All licenses **shall** expire"; the board's page
  says "All licenses expire". I had attributed the board's wording to the statute PDF.
- 5 x NCBEEC `who_must_hold`: the board's page contains the typo "Qual**f**ied Individual"; my
  evidence quoted it corrected. Quoting a source *better than it reads* is still not quoting it.
- 4 x smart-quote and non-breaking-hyphen mismatches (`“registered electrical contractor”`,
  `twenty‑five`). Fixed in the comparison fold, not by loosening the check.
- 3 x over-length or wrongly-attributed fragments.
After correction the re-run is 459/459. **Report the 94.8% as the honest first-pass number**; the
100% is the state of the data, not evidence about the method.

**Gates that earned their keep** (`kb-scripts/validate.py`): G4 (evidence ≤ 25 words) caught 11
over-long quotes; G5 rejected `myfloridalicense.com` until an explicit `ontology/official-hosts.json`
allowlist was written — the lesson being that a TLD test is worthless here, since Florida's own
portal is a `.com` and half the affiliate spam is `.org`.

**Operational finding for the cron.** tdlr.texas.gov resets the connection on roughly one request in
ten when a client walks several of its pages in sequence. Three sources came back UNREACHABLE on the
first drift run and all three were fine on retry. `lib_kb.fetch` now does two attempts with a 4 s
backoff and does **not** retry a 403/404 (that is an answer, not a glitch). Drift run is now
35 unchanged / 0 drifted / 0 unreachable.

**Assumptions taken (best defensible guess, flagged in the data)**
1. Texas plumbing licences renew **annually**. TSBPE never prints the word; the inference is from
   its "yearly CPE requirement" wording plus late-renewal bands measured in days from expiry.
   Recorded at MEDIUM confidence on every TX plumbing licence type. First item in the wave-2 queue:
   open Texas Occupations Code ch. 1301.
2. NCBEEC's per-classification figure ("Unlimited License - $200/year") is both the application fee
   and the renewal fee. Recorded at MEDIUM confidence.
3. Florida's `+$50 per qualified business` implies the qualifying-individual model. MEDIUM.
Nothing was estimated. Fifteen fee, insurance and timeline fields are `null` / `unknown` with a note
saying which pages were read, including the Florida CILB application fee (two attempts: the PDF is
an image form, and 61G4-12.011 turned out to be Definitions, not Fees).

### 2026-09-03 — reconciliation with the sibling wave-1 agents

`OFFER.md` (Offer & Landing) landed after my billing spec was written and proposes a different
commercial model. Reconciled rather than left contradictory:

- **Tier metric: adopted theirs.** States primary, technicians as a fair-use guardrail. Their argument
  is better than mine was: a state × trade is a rulebook we maintain, so states are the actual cost
  driver, and "we're in seven states" is the buyer's own sentence. Prices aligned to
  $149 / $349 / $599 with 1 / 5 / 15 state limits. `specs/09` and `BACKLOG.md` updated.
- **Playbook price: adopted theirs.** $750 first state (credited against an annual plan within 90
  days), $1,500 thereafter, $3,750 for a 3-state acquisition bundle. Credit is a Stripe coupon at
  Checkout, not a manual refund, so the window is code-enforced. `specs/08` updated.
- **Trial: NOT resolved, and deliberately left visible.** They propose a $149 paid First State Audit
  in place of the free trial. Two objections worth the founder's attention: (a) it breaks T2 as
  defined, because payment then precedes activation — so `THRESHOLDS.md` now carries **H2b**, an
  alternative band (≥ 40% audit → subscription) committed *before* the data exists; (b) the audit's
  "we build your roster from the public registers" quietly reintroduces a human loop unless it is
  automated, which PLAN.md forbids. My recommendation is in `specs/09`: free trial for the first 100,
  audit as the named next iteration.

**Advice to the wave-1b reviewer:** the trial question is the one live contradiction in this app's
wave-1 output. Everything else is aligned. Do not let it be settled by whichever document is read last.

### Advice to the next agent (wave 2)

- Run the scripts in the order in `KNOWLEDGE_BASE.md` §13 before touching anything. `validate.py` must
  exit 0 and `verify_pass_b.py` must report 0 disagreements; if either fails, the knowledge base moved
  under you and that is the news, not a nuisance.
- **Do not parallelise the source crawl.** 1.5 s spacing, two attempts. These are small state agencies.
- When you add the next 36 records, expect the dominant error to be *attaching a correct reading to the
  wrong source*, not misreading a page. Pass B is the only thing that catches it. Budget ~1.7 h per
  record, ~3.5–5 h per state; sequencing and difficulty per state are in `KNOWLEDGE_BASE.md` §11.1.
- The critical path in wave 2 is **M14 → M5 → M6**. If it slips, cut the number of states loaded, never
  the derivation logic.

---

## Iteration after review (2026-09-03)

**Agent:** Iteration author (StateReady), phase-4 wave-1b→2 hand-off. **Input:** `REVIEW.md`
(11 blocking, 19 major, 16 minor). **Output:** `REVIEW_RESPONSE.md`, one row per finding, plus the
edits below. **Result: 29 fixed as asked, 6 fixed differently, 3 declined with reasons, 3 delegated,
2 split.** No blocking finding left open.

### What changed, by file

- **`specs/05`** — invariant 2 rewritten as a table (the honesty rule for the whole product); AC7/AC7b
  rewritten; `expiry_overrides` rule added (Florida's board-announced date roll); analytics fixed to
  `licence_deadline_derived`, emitted **from the derivation service**.
- **`specs/06`** — rewritten for **one cron a day**: per-recipient `next_send_at`, claim
  `<= now() + DRAIN_INTERVAL`, offsets as **inequalities with the largest unsent offset**, alerts and
  digests **per recipient**, five machine-readable suppression reasons.
- **`specs/07`** — tile grid, one status vocabulary, **AT RISK ≤ 90** asserted equal to the first alert
  offset by a unit test.
- **`specs/08`** — narrowed promise, `entryPackReady` gate (distinct from `publishable`), pre-purchase
  gap disclosure, one guarantee wording, founder review moved **behind** delivery.
- **`specs/09`** — D1 applied; the canonical Stripe list lives here now; Enterprise "contact us" row
  with `POST /enterprise-enquiry` behind it.
- **`specs/12`** — cadence out of the disclaimer, one refund policy, AC7/AC8 as content tests.
- **`specs/14`** — `no_change` acceptance, G10 scoping, `baselineHead/Tail`, the 180-day staleness rule.
- **`specs/02`/`04`/`11`/`13`** — tile grid, D6 header inversion, event names, no copied bands.
- **`kb-scripts/`** — **new `accept_drift.py`** and **new `test_accept_drift.py`** (17 assertions,
  passing); G10 scoped to citing values; excerpts stored at baseline time.
- **`ontology/`** — `sourced_value` schema tightened (A10 on every non-null value); `id-grammar.md`
  example id fixed and `_history/` given its implementation.
- **`OFFER.md` / `LANDING_SPEC.md` / `THRESHOLDS.md` / `BACKLOG.md` / `UX.md` / `PERSONA.md` /
  `KNOWLEDGE_BASE.md` / `README.md`** — D1–D5, D7, the guarantees, the narrowed promise, the identity
  arbitration, M15–M17, S10, and the corrected counts.

### The decisions I took, and why — the ones worth arguing with

1. **D1 (trial over tripwire) was easy; deferring the roster build was the expensive half.** The
   $149 audit was never the real liability — the *deliverable behind it* was. Removing it cost the
   landing page its most persuasive sentence (*"We build the roster from the public registers. 30 days
   or you don't pay."*) and cost the offer's Effort term two points, 8 → **6**. I wrote the downgrade
   into `OFFER.md` §13 rather than hiding it: **Effort is now the weakest term in the value equation
   by our own arithmetic**, and every iteration-2 candidate should be scored against it first.
2. **B6 went against the reviewer, on the brief's instruction, and I hedged it three ways.** Medium +
   verified now produces an unflagged deadline. That is a real risk — it is how an inference the board
   never prints reaches a customer as a date. The hedges: the value's **note renders wherever the date
   appears**; **anything below `high` still goes in the needs-human-check block of a paid pack**; and
   a medium value with **no note fails closed** to `needsHumanCheck = true` (which catches
   `tx-plumbing` licence types [1] and [2] today — same field, same confidence, different outcome,
   decided by whether we can explain ourselves). **If the founder prefers the stricter reading, take
   it before wave 2 builds M5** — one line now, ~60 golden cases to re-baseline later.
3. **B2: narrow the promise, do not block the sale.** The alternative gate would have made zero of the
   nine records purchasable and could only be lifted by human research. The counted table is now in
   `KNOWLEDGE_BASE.md` §9.1 so nobody has to rediscover it: **23 of 23 bond amounts unknown**, 7 of 9
   timelines, 7 of 23 application fees — against **23 of 23** renewal cycles and `who_must_hold`
   verified. Sell the second list; name the first.
4. **B9: I designed for Hobby rather than waiting for Pro.** Two bugs fell out of taking the daily
   constraint seriously that would have shipped either way: the naive `next_send_at <= now()` claim
   **defers every recipient west of the drain time forever**, and exact-equality offsets **delete** an
   alert whenever a run is missed rather than delaying it. Both now have regression tests. Designing
   for the worse platform found bugs that the better platform would have hidden.
5. **The Enterprise "contact us" row is the smallest honest answer.** No price invented; one promise
   attached that we control ("a quote within two business days"); one route behind it that the app and
   the outbound workbook both use. Twelve of the top-20 prospects land there on day one.

### Advice to the build fleet

**Build the rules engine first, as a pure function, with golden tests.** `specs/05` is explicitly
pure and synchronous — licence + KB record + date in, deadlines out — so it is the one module that can
be built and **proved before any schema exists**. Roughly 60 cases: 9 records × ~2 licence types × 3
issue dates (start, middle, end of year), expected outputs committed. Those tests fail when the KB
changes, which is exactly what should happen. Do **not** start with M4 — wave 1's headers had M4 and M5
blocking each other and it is fixed, but the instinct to start at the database is the thing that
recreates it. The `deadlines` table lands **with** M5, not before it.

Then, in order: **M14** (fold in `accept_drift.py` and the stored excerpts before the `/admin/kb`
screens), **M4**, **M6** (build the two regression tests from AC9 and AC10 first — they are the two
bugs), **M7** (start from the `AT_RISK_DAYS === ALERT_OFFSETS[0]` assertion), **M8**.

**Next KB states: GA, OH, AZ, MI.** All four are one board covering all three trades — Georgia's three
divisions under `sos.ga.gov`, Ohio's OCILB on `com.ohio.gov`, Arizona's ROC with a published
classification table, Michigan's LARA — so twelve records for roughly **14 agent-hours**, the cheapest
tranche in the whole map (`KNOWLEDGE_BASE.md` §11.1). Georgia first: Texas's and North Carolina's own
reciprocity pages already point at it, so it closes a loop for existing customers rather than only
opening a new state. **Budget 80–95 agent-hours for all 36, not 60–70** — the review's revision is
right, and the three `local_only` states (NY, PA, IL) are a **schema and product design problem**, not
an extraction problem. Give them their own work item and their own design review.

Standing rules that have not changed and that cost me time to re-derive: **do not parallelise the
crawl** (1.5 s spacing, two attempts, never two agents on one host — CA's CSLB+DIR and VA's two-layer
DPOR are single-host); expect the dominant error to be **a correct reading attached to the wrong
source**, which only pass B catches; and run `validate.py` and `verify_pass_b.py` **before** your first
commit — if either fails, the knowledge base moved under you and that is the news, not a nuisance.

**One trap specific to this iteration.** `kb-scripts/validate.py` contains a hand-written JSON Schema
subset, and it treats an unknown keyword as an error **inside the `if` probe of an `allOf` branch** —
which silently disables the branch instead of failing loudly. I hit it writing the m4 schema fix with
`not: {type: "null"}` and only caught it because I tested that the new branch actually fires on a
deliberately broken record. **Whenever you touch a schema, prove the new constraint rejects something**;
"validate.py still exits 0" is not evidence that a rule exists.
