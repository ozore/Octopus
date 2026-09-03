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
