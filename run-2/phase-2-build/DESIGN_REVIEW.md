# ADVERSARIAL DESIGN REVIEW — Phase 2, run 2

**Under review:** `phase-1-ideation/research/01-04`, `phase-2-build/architecture/{ARCHITECTURE,CORPUS_DESIGN,ENGINE,USER_JOURNEY}.md`, `phase-2-build/identity/{NAMING,BRAND,DESIGN_SYSTEM}.md`, `phase-2-build/identity/landing/index.html`, `phase-1-ideation/site/index.html`
**Reviewer:** adversarial design review
**Date:** 2026-08-13
**Posture:** hostile. The reader I am simulating is a Wage and Hour Division investigator holding a signed WH-347, and a payroll administrator whose $180,000 progress draw is being withheld.

---

## 0. Method, and what I actually verified

I did not take any factual claim in these documents on trust. Everything marked **VERIFIED** below was re-probed in-session on 2026-08-13:

| Probe | Result |
|---|---|
| `sam.gov/api/prod/sgs/v1/search/?index=dbra&size=5000&is_active=true` | HTTP 200, **4,236 results in one request**, 3,638,250 bytes, 1.39 s, 4,236 distinct `_id` |
| `isStandard` across the full active set | **`true` on 4,236 of 4,236.** Zero `false`. |
| `wdol/v1/wd/{ref}/{rev}` on a 14-WD random sample | **`standard: false` on 14 of 14.** See CRIT-1. |
| `wdol/v1/wd/VA20260195/{0,2,9}` | 200 / 200 / **404, zero bytes** — archive retrievable, walk terminates |
| eCFR API, 29 CFR 5.5 (`versioner/v1/full/2026-08-11`) | **CWHSSA clause applies only to contracts "in an amount in excess of $100,000"**; liquidated damages **$33**/worker/day confirmed; (a)(3)(ii)(C) contains **three** certifications |
| eCFR API, 29 CFR 3.5 | **ten** paragraphs (a)–(j), incl. (i) board/lodging and (j) safety equipment. ENGINE §9.2 is right; ARCHITECTURE §3.2 is wrong. |
| `dir.ca.gov/dlse/CPR-Prod-Test/CPR.xsd` | 49,325 bytes, `sha256 2ea52e97…c800d01a` — **matches the pinned hash exactly**; `day` 7/7, `employee` max 500, `ssn [0-9]{9}`, `version="1.0"` all confirmed |
| `dol.gov/agencies/whd/forms/wh347` | OMB 1235-0008, expires 01/31/2028, 55 min/response, six statement-of-compliance boxes, Wage Determination No. field, col 6B/6C are **weekly totals**, col 4 OT is CWHSSA-conditional |
| `platform.claude.com/docs/en/about-claude/pricing` | Sonnet 5 **$2/$10, cache read $0.20**, and the "increase will not occur" note — **ENGINE §17.1 quoted it correctly and is not stale** |

Two documents survive this contact almost unscathed (`CORPUS_DESIGN.md`, `USER_JOURNEY.md`). Two do not.

---

## CRITICAL

### CRIT-1 — The P4 probe quarantines 100% of the corpus on the first ingest run. The product cannot promote a snapshot, cannot pin a project, and cannot emit a single filing.

**File:** `architecture/ARCHITECTURE.md` §8.2 probe **P4**, and **ADR-004**.

**The exact problem.** P4's green condition is that index and document "agree on `revision`, publish date, `active`, **`standard`**"; red → "QUARANTINE **both** paths for that WD; publish neither." ADR-004 restates it: *"On any disagreement over revision, publication date, active or standard, publish neither."* ADR-004 then cites `VA20260195` r2 (`isStandard: true` vs `standard: false`) as proof the probe "earned its place before launch."

It did not earn its place. It is not a per-WD corruption signal. **VERIFIED:** path A returns `isStandard: true` on **4,236 of 4,236** active records — it is a constant, carrying zero information. Path B returns `standard: false` on **14 of a 14-WD random sample** (KS20260138, WA20260081, MN20260016, SD20260015, TX20260147, TX20260045, MD20260070, TN20260162, OH20260104, AZ20260012, PR20260035, TX20260248, MT20260017, MS20260120 — all `A.isStandard=true / B.standard=false`). The two endpoints simply mean different things by the word "standard."

**Why it matters.** Implemented as written, night one produces 4,236 quarantined WDs. Every one is "narrowed to the last agreed snapshot" — of which there is none, because this is the first run. §8.1 L3 then blocks promotion of the affected WDs (all of them). G3's ≤0.5% reconciliation breaches by 100% and HOLDs. `wd_pins` can never be established, so `resolvePin` returns nothing, so `deriveStatus` blocks every line, so every artifact renders `DRAFT — NOT CERTIFIABLE`. The company ships a product that emits nothing, and the failure is *silent and correct-looking* — every probe is doing exactly what the spec says.

**Why nobody caught it.** `CORPUS_DESIGN.md` §2.5 and its `agreement IN ('agreed','advisory_variance')` clause (line 934) **already fix this** with a field-scoped rule that demotes `standard` and county codes to advisory. But CORPUS_DESIGN never says it supersedes ARCHITECTURE §8.2/ADR-004, and ARCHITECTURE is the document that owns the probe table. A builder implementing the probes from the architecture document ships the dead version.

**Fix.** In `ARCHITECTURE.md` §8.2, rewrite P4's blocking set to `{revision, publish_date, active}` only. Move `standard` and structured county codes to a new non-blocking probe P4a whose response is `DEGRADE` (record the variance, never surface it). Amend ADR-004's decision sentence and delete the `VA20260195` sentence claiming the probe earned its place — replace it with the measured fact that `isStandard` is constant-true fleet-wide and therefore useless as an oracle. Add a CI test that asserts the blocking field set does not contain `standard`. Add a fleet-scale precondition to every future disagreement probe: **a probe whose red rate on the current corpus exceeds 1% is a specification bug, not an incident** — measure the red rate against a live sample before the probe is allowed to block.

---

### CRIT-2 — `col7A` double-counts cash in lieu. The engine's own worked example and its own marketing page both contradict its stated formula, by $300.96 on one worker-week.

**File:** `architecture/ENGINE.md` §8 (gross), against §3 (`cashRate` definition), §7.6 (worked example M3), and `identity/landing/index.html` (the sample WH-347).

**The exact problem.** §3 defines `cashRate` as "GROSS straight-time cash rate actually paid" and `cashInLieu` as "customer-asserted **portion of** `cashRate` paid in lieu of fringe" — cash-in-lieu is a *subset* of the cash rate. §5 confirms it: `col6A_st = cashRate − cashInLieu`. Then §8 states:

```
col7A(worker) = Σ_lines ( stOtHours × cashRate + dtHours × dtRate )
              + cwhssaPremium(worker)
              + Σ_lines col6C(line)              // cash in lieu is cash paid
```

`Σ(stOtHours × cashRate)` already contains the cash-in-lieu dollars. Adding `col6C` adds them a second time. §8's own following paragraph says so: *"on the all-cash discharge method the same dollars appear in 6C and **are** in gross."*

§7.6's worked example M3 uses the **correct** formula and is inconsistent with §8: WD $21.93+$6.27, paid $30.00 all cash with $6.27 asserted in lieu, 48 hours → `col6C` $300.96, `col7A` = $1,440.00 + $94.92 = **$1,534.92**. Under §8's formula it would be $1,835.88. A $300.96 divergence on one worker-week.

The landing page's sample WH-347 uses the §7.6 convention, not the §8 formula: Worker 1, 40 h, 6A 22.00, 6C 5.67 → 7A **1,106.80** = 40 × 27.67, with no 6C added. Worker 2, 40 ST + 6 OT → 40×27.67 + 6×33.00 + 6×5.67 = **1,338.82**, exactly as printed.

**Why it matters.** Column 7A is gross earned on a federally certified document. An overstatement flows into the net reconciliation (§9.3 D3 compares `col7B − Σ deductions` against `worker.netPaid`), so on a two-project worker it will produce spurious `NET_RECONCILIATION_FAILED` blocks; on a single-project worker it produces a gross figure that does not match the cheque the contractor wrote, on a form the contractor signs under 18 U.S.C. 1001. **No property test catches it.** P-01 tests `netPaid + Σdeductions == col7B` (7B, not 7A). P-02 (`col7A ≥ Σ stOtHours × baseRate`) passes under both formulas. P-05 (monotonic in hours) passes under both. The G1 canary would catch it only if a class-2 frozen expectation happened to be authored from §7.6 rather than §8 — i.e. by luck.

**Fix.** Correct §8 to `col7A = Σ(stOtHours × cashRate + dtHours × dtRate) + cwhssaPremium`. State explicitly that `col6C` is a **disclosure of a subset of 7A**, never an addend. Add property **P-16**: `col7A == Σ(stOtHours × cashRate) + Σ(dtHours × dtRate) + cwhssaPremium` exactly, and **P-17**: `col6C ≤ Σ(stOtHours × cashRate)` — a cash-in-lieu total that exceeds the cash paid is unrepresentable. Add a class-1 fixture from §7.6 M3 pinning $1,534.92.

---

### CRIT-3 — CWHSSA is applied unconditionally. The $100,000 contract threshold appears in no document in the repository.

**File:** `architecture/ENGINE.md` §7 (entire stage D), §10 (`PREMIUM_BELOW_STATUTORY`); `architecture/ARCHITECTURE.md` §3.2; `identity/landing/index.html`.

**The exact problem.** **VERIFIED** from 29 CFR 5.5(b), fetched via the eCFR API today:

> *"The Agency Head must cause or require the contracting officer to insert the following clauses set forth in paragraphs (b)(1) through (5) of this section in full … in any contract **in an amount in excess of $100,000** and subject to the overtime provisions of the Contract Work Hours and Safety Standards Act."*

WHD's own WH-347 instructions say the same thing operationally: *"**On CWHSSA covered contracts**, enter hours worked on this project in excess of 40 hours total in the week as overtime."* A grep for `100,000` / `100000` across `phase-2-build/**` returns **zero hits**. Project setup (D4, USER_JOURNEY J4) collects county, construction type, funding source, WD number, project name, award date, contract number — **never the contract value**.

**Why it matters, in both directions.**

1. *On a sub-$100k DBA contract* (perfectly common for a specialty sub — DBA attaches at $2,000), the engine computes a CWHSSA premium that is not owed, applies the `max(BHR_WD, cash)` floor that is a CWHSSA rule, prints OT hours in the CWHSSA column, and can raise `PREMIUM_BELOW_STATUTORY` — a flag that names a violation of a statute that does not apply to that contract. The contractor is told they underpaid when they did not.
2. §10 states *"Liquidated damages are a corpus value"* and prints the $33/day rule. On a contract under $100,000 there are no CWHSSA liquidated damages at all. The product would be citing a penalty regime the contract is not subject to.
3. FLSA overtime still applies below the threshold, on a *different* regular-rate basis (no WD floor). §7.7 explicitly refuses to compute FLSA overtime. So on a sub-$100k contract the product computes the wrong overtime and refuses to compute the right one.

**Fix.** Add `contract_value_band` to `projects` as a **required** field at setup with three values: `over_100k`, `at_or_under_100k`, `unknown`. `over_100k` → CWHSSA path as currently specified. `at_or_under_100k` → suppress `cwhssaPremium`, suppress the `max(BHR_WD, cash)` OT floor, suppress `PREMIUM_BELOW_STATUTORY`, and emit an exception-report line stating that CWHSSA does not attach below $100,000 and that FLSA overtime on this project is not computed by the product. `unknown` → block the line with a new `BlockReason` `CWHSSA_COVERAGE_UNDETERMINED`, because guessing is the one thing the product's whole posture forbids. Add the threshold to the eCFR Monday diff watch list at 5.5(b) preamble, alongside the $33. Add a canary axis (§22 permutation matrix) for contract-value band. Add "that CWHSSA applies to this contract" to the DO-NOT-ASSERT list in ARCHITECTURE §11.7 and USER_JOURNEY §16.1.

---

### CRIT-4 — Double-time hours are excluded from the 40-hour CWHSSA threshold with no check that they were paid at ≥1.5×. A mislabelled CSV column silently zeroes the overtime premium.

**File:** `architecture/ENGINE.md` §4 rule A2, §7.3.

**The exact problem.**

```
coveredHours(worker)  = Σ_lines ( st + ot )      // dt excluded (§4, A2)
otHours(worker)       = max(0, coveredHours − 40)
```

CWHSSA is owed on *hours worked* in excess of forty in the workweek. Double-time hours are hours worked. Excluding them from the denominator silently assumes that exactly `dt` of the over-40 hours were already discharged at ≥1.5×. Nothing in the engine tests that assumption: §4 A2 says DT "contributes to gross at the rate the CSV states," and `dtRate` is an arbitrary customer-supplied number. `PREMIUM_BELOW_STATUTORY` (§10) is computed only from `col6A_ot × otHours` and never looks at DT at all.

**The failure case, concretely.** A worker logs 36 ST + 8 DT = 44 hours. `coveredHours = 36`, `otHours = 0`, `cwhssaPremium = $0.00`. If the payroll export codes a shift differential, a per-diem hour bucket, or a mislabelled column as `DT` at, say, $1.00/hr, four hours of statutory overtime vanish from a certified payroll with no flag, no block, and no exception line. The engine's most conservative-looking rule — "DT passes through, we don't compute state daily overtime" — is the exact mechanism that makes the federal obligation disappear.

**Why it matters.** This is a systematic underpayment that looks completely normal on the form — the same failure class §1 uses to justify the whole deterministic core, reproduced inside it. Unlike CRIT-2 it is invisible in the arithmetic, because zero is a legal answer for a 36-hour week.

**Fix.** Compute `hoursWorked = Σ(st + ot + dt)` and `statutoryOtHours = max(0, hoursWorked − 40)`. Compute the premium owed on `statutoryOtHours`, then credit premium already paid on DT hours as `Σ dtHours × max(0, dtRate − regularRate)`, capped at the amount owed. Any residual raises `PREMIUM_BELOW_STATUTORY` with the arithmetic shown. Block the line with a new reason `DT_RATE_BELOW_PREMIUM` when `dtRate < 1.5 × regularRate` and DT hours fall above 40 — the customer has to assert what those hours are. Add property **P-18**: `hoursWorked > 40 ∧ premiumPaidTotal < 0.5 × regularRate × (hoursWorked − 40) ⟹ PREMIUM_BELOW_STATUTORY fires`. Add DT-above-40 to the §22 permutation matrix (currently "Double time | present · absent" — that is not enough).

---

### CRIT-5 — "The single division" is arithmetically false. Every rate × hours product is a rounding site, and the CI rule that pins rounding to two call sites cannot hold.

**File:** `architecture/ENGINE.md` §2 ("The single division"), §11 R1–R4.

**The exact problem.** §2 declares: `MilliRate` = integer ten-thousandths of a dollar; `Hours` = integer hundredths of an hour; *"The only division in the engine is the weighted-average regular rate in §7.3. Everywhere else is multiply-and-add over integers, which is exact."* §11 R4 then adds a `grep` assertion that fails the build if `roundHalfUpToCents` gains a third call site.

`MilliRate × Hours` has units of 10⁻⁶ dollars. Converting to `Cents` requires dividing by 10,000, and that division generally has a remainder. Worked from the document's own live extract (§15.3): `LABORER: ASPHALT` at `$18.62`/hr for 37.25 hours = **$693.595** — not representable in cents. `col6B = plan.hourlyCredit × totalHours` and `col6C = cashInLieu × totalHours` have the same property, as does `col7A`'s `stOtHours × cashRate` and §10's `requiredTotal`.

**Why it matters.** Three ways. (a) The stated justification for G1's exact-match gate — "rounding is confined to one function and two call sites" — is not true, so the gate's defensibility argument is unsound even though the gate itself is fine. (b) R4's grep assertion will either fail on the first real implementation or be satisfied by silently truncating micro-dollars inside the arithmetic module, which is a different rounding rule applied invisibly and inconsistently. (c) Half-up at every product versus truncate-then-round at the end differ by up to a cent per line; on a 30-worker crew across 52 weeks that is a reconciliation mismatch against the customer's payroll register — the exact evidence problem §11 argues is worse than being defensibly wrong.

**Fix.** Replace §2's claim with the truth: *every* `MilliRate × Hours` product is a rounding site. Specify the order explicitly — round each per-line money quantity (`col6B`, `col6C`, straight-time cash, DT cash, `requiredTotal`, `paidTotal`) half-up to cents **at the line**, then sum in cents. Replace R4's two-call-site grep with a typed constructor: `Cents.fromMicroDollars(n: MicroDollars): Cents` as the *only* narrowing function, with `roundHalfUpToCents` as its private implementation, and a CI import-boundary rule that no module outside `engine/arithmetic/money.ts` may construct `Cents` any other way. Keep the grep, but point it at raw division operators (`/`) inside `engine/arithmetic/**`.

---

## HIGH

### HIGH-1 — The deliverable set ships two product names. The architecture renders "Wage Line" into the artifact footer while the landing page sells "Ratepin".

**Files:** `identity/NAMING.md` (declares Ratepin, "supersedes the phase-1 working name Wage Line", "binding for phase 2") vs `architecture/{ARCHITECTURE,CORPUS_DESIGN,ENGINE,USER_JOURNEY}.md`, all of which say Wage Line throughout and none of which records the supersession.

Counted: ARCHITECTURE 11 × "Wage Line" / 0 × "Ratepin"; CORPUS_DESIGN 10/0; ENGINE 12/0; USER_JOURNEY 22/0. Identity: BRAND 0/46; landing 0/57; DESIGN_SYSTEM 2/13 (and DESIGN_SYSTEM is the only document that records the supersession, in a blockquote at line 18).

**Why it matters.** The name is not decoration here — it is rendered into `artifacts.provenance`, into the WH-347 provenance footer that D8 makes the acquisition channel, into the copy bundle the DO-NOT-ASSERT lint runs over, and into the eCPR XML the contractor uploads to a state agency. ARCHITECTURE's own §7 rule is *"Amendments require a named source and a note of what they supersede."* NAMING.md wrote the note; the four architecture documents never received it. A builder working from ARCHITECTURE ships a PDF footer with a different company name than the site that sold it — on a document that goes to a general contractor and into a federal audit file. NAMING.md also silently renames D4's "$49 bid rate card" to "Bid Sheet" without a Challenge entry against D4.

**Fix.** Add a one-paragraph supersession block to the head of each of the four architecture documents, identical in wording to DESIGN_SYSTEM.md line 18, and do a mechanical rename. Add a CI check: exactly one product name string may appear in the copy bundle, artifact templates and provenance struct, and it must equal `PRODUCT_NAME` from config. Add a Challenge entry recording the D4 SKU rename with its reason.

### HIGH-2 — The crosswalk aggregate is an unauthenticated write path from freely-creatable accounts into every other tenant's pre-selected classification default.

**Files:** `architecture/CORPUS_DESIGN.md` §7.2 (`HAVING count(DISTINCT o.account_id) >= 5`), §7.4; `architecture/ARCHITECTURE.md` §11.6; `architecture/ENGINE.md` §18.2 level **L-B**.

**The exact problem.** §7.4 defends k=5 as a *confidentiality* boundary — "five distinct accounts have independently reached it." It never asks whether the five accounts are independent *of each other*, and nothing in the system makes them so. Signup is magic-link, self-serve, no verification described (ARCHITECTURE §13 A1; free tier needs no account at all). The threshold is therefore attacker-controllable.

The attack is not leakage, it is **poisoning**. Five sybil accounts confirm `("PIPE FITTER", TX, Highway) → LABORER: COMMON OR GENERAL`. The cell reaches k=5 and becomes a published prior. ENGINE §18.2 L-B then shows that candidate **pre-selected** in the picker for every other tenant on that WD group. The design's own hypothesis **H-J6b** (`USER_JOURNEY.md` §21) says out loud that nobody knows whether users read the verbatim scope text before clicking. So a $0 attack (or ≤5 × $99 if observations require a paid account — the documents do not say which) produces a wrong classification, hence a wrong rate, pre-selected by default, on a document signed under 18 U.S.C. 1001, across an unbounded number of tenants — and it is indistinguishable from organic agreement in the data.

**Fix.** Three changes. (a) **Weight, don't count.** Require k≥5 *and* that the supporting accounts have ≥N filings each and ≥M distinct project IDs, so a prior can only be minted by accounts that have actually done work. (b) **Never pre-select from the global prior.** Demote L-B from "top candidate pre-selected" to "top candidate ordered first, none pre-selected" — the aggregate is evidence, not authority, which §7.2's own comment says. Pre-selection should require the tenant's own confirmed history (L-A) or a lexical score above τ (L-C). (c) Add a poisoning detector: alert-free automatic `FREEZE` of a prior cell whose supporting accounts were created within a short window or share a signup IP/ASN. Record the residual risk as a named hypothesis.

### HIGH-3 — §7.4's deletion-privacy claim is false as stated, and it is the kind of claim a privacy regulator reads literally.

**File:** `architecture/CORPUS_DESIGN.md` §7.4.

> *"Because the prior requires five accounts, no single deletion can be detected by observing the prior's change."*

A cell supported by exactly five accounts **disappears from the materialized view** when one deletes. An observer who can see the prior — and every tenant can, through the picker's ordering — watches the cell vanish and learns that one of exactly five accounts deleted. With four sybil accounts of your own in the cell (HIGH-2), you learn precisely which single other account deleted, and when. This is the standard differencing attack on a threshold-published aggregate; k-anonymity has never provided the property being claimed here.

**Fix.** Delete the sentence. Replace with the true property: *the prior does not reveal which accounts contributed, but membership changes at the k boundary are observable, and we do not defend against a differencing attack by an observer who controls k−1 accounts.* If the property is wanted rather than disclaimed, add hysteresis (publish at k≥5, unpublish only at k≤2) plus a randomised republication delay, and say so.

### HIGH-4 — The CA eCPR path holds nine-digit SSNs and is protected by a control that does not exist.

**Files:** `architecture/ARCHITECTURE.md` §11.3 ("the download link is short-lived **and single-tenant-scoped**") against §3.1 (`/api/artifacts/[id]` → "Signed, short-lived R2 redirect").

A presigned R2/S3 URL is a **bearer capability**. Once the redirect is followed — or the redirect `Location` header is read from a proxy log, a browser history, a corporate TLS-inspection appliance, or a forwarded email — anyone holding the URL can fetch the object for its full validity window. It cannot be "single-tenant-scoped"; there is nothing in the URL to scope. The object in question is the one artifact in the product that contains **full nine-digit Social Security numbers for every worker on the crew** (the XSD's `ssn [0-9]{9}`, VERIFIED today).

Compounding it: §5.4 says `workers.ssn_ciphertext` is "purged 30 days after export-on-cancel," while the same table retains **filings + artifacts** for "minimum 3 years." The eCPR XML *is* an artifact. So the documented 30-day SSN purge is contradicted by a 3-year retention of the same SSNs in a different store, in the same table, on the same page.

**Fix.** Do not redirect for the PII-class artifact. Stream it through the application with a per-request authorisation check, `Cache-Control: no-store`, and no URL that outlives the response. Give it a distinct retention row: purge the eCPR XML object on the same clock as `ssn_ciphertext`, and retain instead a redacted rendering plus the `sha256` of the original for evidentiary purposes — that preserves the §8 reproduction property without keeping the SSNs. Reconcile §5.4 so one retention number governs every store that can contain a full SSN.

### HIGH-5 — ARCHITECTURE and CORPUS_DESIGN specify contradictory ingest mechanics for the primary job.

**Files:** `architecture/ARCHITECTURE.md` §7.1 and §4.4 diagram ("Pull DBRA index / **43 pages at size=100** over 4,236 active records") vs `architecture/CORPUS_DESIGN.md` §2.1 ("the active crawl is therefore **one request**, not 43").

**VERIFIED:** `page=0&size=5000&is_active=true` returns HTTP 200 with all 4,236 records in 3.6 MB and 1.39 s, `totalPages: 1`. CORPUS_DESIGN is right and ARCHITECTURE is wrong.

**Why it matters.** This is not cosmetic. CORPUS_DESIGN's whole reliability argument for the index stage is that it collapses "43 chances to half-fail" into a single atomic read. Building the 43-page walk reintroduces partial-crawl failure modes that P1's ≤0.5% delta rule is not designed for — a crawl that gets 40 of 43 pages produces a plausible 93% count, well outside the delta, so it HOLDs; a crawl that gets 43 of 43 but with one page served from a stale replica produces a plausible count and promotes. The single-request design has neither failure.

**Fix.** Amend ARCHITECTURE §7.1 and the §4.4 diagram to "one request at `size=5000`," with a documented fallback to paginated reads if `totalElements` ever exceeds `maxAllowedRecords`. Add an assertion that `page.totalPages == 1` on the nightly read, treating >1 as a corpus-growth signal rather than an error.

### HIGH-6 — ARCHITECTURE still specifies eight permissible deduction categories. ENGINE corrects it to ten but the correction lives in the wrong document.

**Files:** `architecture/ARCHITECTURE.md` §3.2 (`deductions(line, map)` — "the **eight** categories permissible without WHD approval under 29 CFR 3.5") vs `architecture/ENGINE.md` §9.2 (ten, (a)–(j), with the supersession stated).

**VERIFIED** from the eCFR API: 29 CFR 3.5 has ten paragraphs, (a) through (j), last amended 88 FR 57730 (Aug. 23, 2023). ENGINE §9.2 is correct and its reasoning is exactly right — boot and glove deductions under (j) are routine on a field crew, and an eight-category enum lands every one of them in `UNMAPPED` and blocks the line, telling the customer a lawful deduction is unlawful.

**Why it matters as a HIGH rather than a documentation nit:** ARCHITECTURE §3.2 is a **binding** module spec ("An unmapped deduction blocks the line"), and it is the document a builder reads first. Shipping eight categories converts a correct product behaviour into a false accusation against the customer, at a rate proportional to how often crews buy their own hard hats.

**Fix.** Correct ARCHITECTURE §3.2 in place to ten with the (i)/(j) substance named, cross-referencing ENGINE §9.2. Add a CI test asserting `DeductionCategory` has exactly the paragraph letters currently present in the `obligation_changelog` entry for 29 CFR 3.5 — so a future paragraph (k) fails the build rather than silently blocking lines.

### HIGH-7 — The winning idea's strongest lens was falsified in Phase 2, and nothing escalates.

**Files:** `phase-1-ideation/IDEA_DOSSIER.md` ("Moat and retention (**1st**)": *"SAM publishes no documented bulk download or public API… You cannot retroactively buy what a WD said last March"*; and *"Contrast Wage Line: SAM overwrites, and a superseded revision is gone"*) vs `architecture/CORPUS_DESIGN.md` Challenge **C1**.

**VERIFIED:** `wdol/v1/wd/VA20260195/0` → HTTP 200, 12,878 bytes, header date 01/02/2026. `/1` → 200. The archive path space is deterministic and enumerable (`WDOL_FILES_PROD/DBA/ARCHIVE/FY{yy}/{short}.r{N}.txt`), and deep dive 02 found the series resold at $19/mo.

CORPUS_DESIGN handles this correctly and honestly at the engineering level — retention is re-justified on D7 and reproducibility grounds, and the doc explicitly bans the false sentence from marketing copy. What no document does is carry the finding back to the *selection*. Wage Line won the Borda vote at 40 to Ship Record's 33, taking **first place on Moat and retention**, and one of the two named reasons Ship Record lost was *"its moat is not time-locked the way the pitch claims… Contrast Wage Line: SAM overwrites."* That contrast is now measured to be false in both directions.

**Why it matters.** This is a governance failure, not an engineering one, and it is the kind that compounds: Phase 3 acquisition will inherit a positioning brief whose lead differentiator has been quietly retired in an architecture appendix. The remaining moat argument — the crosswalk — is exactly the asset HIGH-2 shows is poisonable and whose compounding rate is an unmeasured hypothesis (H2, H-J6).

**Fix.** Write the finding into `IDEA_DOSSIER.md` as a dated erratum against the Moat lens, with the C1 evidence. State plainly that the moat now rests solely on the crosswalk and on assembly/latency, and that both are unmeasured. Do not re-run the vote — the decision is made and the other five lenses stand — but make Phase 3 inherit the corrected claim rather than the original one.

### HIGH-8 — The landing page prints columns 6B and 6C as hourly rates on a form whose instructions require weekly totals, contradicting the engine spec.

**File:** `identity/landing/index.html` (sample WH-347 grid) against `architecture/ENGINE.md` §6.

**VERIFIED** from WHD's own instructions: *"Column 6B: Enter the **total** of the contractor's or subcontractor's contributions to or reasonably anticipated costs of bona fide fringe benefit plans"*; *"Column 6C: Enter the **total amount in cash** provided in lieu of fringe benefits to the worker during the workweek."* ENGINE §6 agrees: `col6B = Σ_p plan.hourlyCredit × totalHours(line)`.

The landing page prints Worker 1 as `6B 6.10 / 6C 5.67` on 40 hours. Those are hourly rates. The weekly totals are $244.00 and $226.80. The reciprocal check confirms it: 7A = 1,106.80 = 40 × (22.00 + 5.67).

**Why it matters.** This is the first artifact a prospect sees, and the product's entire positioning is "we produce the filed artifact correctly." A GC's compliance clerk or a WHD investigator reads column 6 as totals; a form showing $6.10 of fringe for a 40-hour week reads as a wildly under-funded plan. Publishing a specimen WH-347 that is filled in wrong, on the page that sells correctness, is the single most embarrassing failure available here.

**Fix.** Correct the sample grid to weekly totals (6B 244.00 / 6C 226.80 for Worker 1; 6B 280.60 / 6C 260.82 for Worker 2 at 46 h; 6B 0.00 / 6C 143.64 for Worker 3 at 36 h) and re-derive the caption. Add a rendering test to the visual-regression job (ADR-008) that asserts `6B == hourlyCredit × totalHours` and `6C == cashInLieu × totalHours` on the specimen, so the marketing artifact is generated by the same renderer as the product rather than hand-authored. While there: the sample WD `TN20260151` is synthetic but formatted identically to a real determination number — add a visible "specimen" marker beyond the DRAFT watermark.

---

## MEDIUM

### MED-1 — "The six checkboxes of 29 CFR 5.5(a)(3)(ii)(C)" is a miscitation in the one place the product claims verbatim accuracy.
`architecture/ARCHITECTURE.md` §3.5. **VERIFIED:** 5.5(a)(3)(ii)(C) requires **three** certifications, numbered (1)–(3). The six numbered boxes are a feature of the **WH-347 form's own reverse**, per WHD's instructions ("Boxes 1, 2, 3, and 6 must always be checked… Box 4 applies when apprentices are employed… Box 5 applies when claiming fringe benefit credits"). Both facts are true; the citation attaches one to the other. In a document whose credibility rests on "quoted verbatim, not paraphrased from memory," a mis-attached citation on the statement of compliance — the legally operative half of the filing — is the one a lawyer will find. **Fix:** cite the WHD instructions for the six-box layout and 5.5(a)(3)(ii)(C)+(D) for what the boxes must certify, separately.

### MED-2 — G5's human-minutes counter is not falsifiable, because the thing being counted is a judgement call by the party making the claim.
`architecture/ARCHITECTURE.md` §10.5, §14; `USER_JOURNEY.md` Challenge E. `human_minutes` increments on "any inbound message **requiring** a human answer." Who decides "requiring"? The founder, who is also the person the 90-day-under-2-minutes claim benefits. Every other gate (G1 exact match, G3 count delta, G6 chaos test) is mechanically falsifiable; G5 is self-reported. **Fix:** increment on *every* inbound message to the billing address, unconditionally, with the minutes attributed by wall-clock time-to-first-reply. Publish the raw inbound count alongside the minutes figure. If the true number is small, this costs nothing; if it is not, G5 is the gate that was supposed to say so.

### MED-3 — The global credit ceiling silently disables the D7 guarantee at exactly the scale where it will first fire.
`architecture/ARCHITECTURE.md` §9.4. `CREDIT_DAILY_CEILING_PCT` defaults to 25% of MRR. At launch with, say, six Solo accounts, MRR is $594 and the daily ceiling is $148.50 — smaller than a single Crew customer's full-period credit. A fleet-wide staleness incident (the only kind that triggers L2) is by construction one that affects *all* tenants simultaneously, so the ceiling trips on the first credit or two and the remaining customers get nothing, while §10.3's banner has already told them "a credit of $X has been applied to your next invoice." G6 chaos-tests that the credit fires; it does not test that the ceiling does not eat it. **Fix:** make the ceiling an absolute floor plus a percentage (`max($2,000, 25% of MRR)`), evaluate it per-incident rather than per-day, and add a G6 assertion that a fleet-wide L2 credits 100% of affected tenants at ≥50 accounts *and* at 6 accounts. If the ceiling would bind, the banner must not promise the credit.

### MED-4 — The California go-to-market rests on a coverage overlap that no document establishes.
`IDEA_DOSSIER.md` D3 ("California stays the launch **market**"), `architecture/ARCHITECTURE.md` Challenge 4, `USER_JOURNEY.md` J-series. DIR eCPR obligations attach to **California public works** — state or local funded — and require a DIR Project ID created by the awarding body's PWC-100. The Davis-Bacon Act attaches to **federal** funding. D1's buyer is defined as being on "federally funded (DBA/DBRA) construction." The intersection (federally-assisted projects that are also CA public works) is real but is nowhere sized, and a purely federally-funded project has no PWC-100 and therefore no eCPR obligation at all. Challenge 4 treats this as a *sequencing* problem (G2 acceptance testing) when the prior question is *coverage*: what fraction of D1 buyers in California owe an eCPR at all? **Fix:** measure the overlap from public data (CA DIR PWC-100 registry against USASpending federal awards in CA) before Phase 3 writes a word of California copy, and record the number. If the overlap is thin, CA is the launch market for the *federal* artifact and the eCPR is a v2 feature for a different buyer — which is a materially different plan.

### MED-5 — Property P-06 is stated without a rounding tolerance and can fail on a legitimate input.
`architecture/ENGINE.md` §12.2. P-06 asserts `min_c baseRate(c) ≤ regularRate ≤ max_c baseRate(c)`. `regularRate` is rounded half-up to cents (§11 R1); `baseRate` is a `MilliRate` with four decimal places. A single-classification week at `baseRate = $10.0050` yields `regularRate = $10.01 > max baseRate`. Payroll systems do export sub-cent rates. The generators in §12.2 ("rates $10.00–$95.00") may or may not produce them — which is worse, because the property is either vacuous or flaky depending on an unstated generator detail. **Fix:** state P-06 with an explicit ±$0.005 tolerance and force the generator to include sub-cent rates so the tolerance is exercised.

### MED-6 — `roundHalfUpToCents` is declared to have two call sites; §7.3's own pseudocode shows one, and §11 R1 describes two more.
`architecture/ENGINE.md` §7.3, §11 R1/R4. §7.3 shows rounding only on `regularRate`; the premium line has none. §11 R1 says the premium is *also* rounded half-up. R4 says "exactly two sites (§7.3 twice)". Three statements, three counts. Subsumed by CRIT-5's fix but listed separately because it will confuse a builder even after CRIT-5 is resolved.

### MED-7 — `pgcrypto` with a config-supplied key is offered as the SSN encryption fallback, which defends against exactly one threat.
`architecture/ARCHITECTURE.md` §11.3, Q2. Key in `DATABASE_URL`'s neighbour env var, ciphertext in the same Postgres, decryption in the same process. This protects a stolen backup file and nothing else — not an application compromise, not an SQL injection, not a leaked env dump, not an insider with shell. That may be an acceptable launch posture, but the document presents envelope encryption and `pgcrypto` as near-equivalent options. **Fix:** state the threat model each option covers, make the KMS path the requirement and `pgcrypto` a time-boxed exception with a named expiry, and add the `key_version` rotation job to §7.1's schedule rather than leaving it implied.

### MED-8 — `is_union_group` refuses a whole discharge method the WD fully supports, and the narrower rule is recorded but not adopted.
`architecture/ARCHITECTURE.md` §5.2/§15, `architecture/ENGINE.md` Challenge C-2. ENGINE C-2 is right: a contractor paying `$36.85 + $14.13` entirely in cash under 5.31(b)(2) needs no CBA schedule, so refusing at project setup on any union-prefixed group refuses paying customers who have no compliance problem. C-2 flags it and then implements the broad rule "to stay consistent with the architecture." Consistency with a document you have just shown to be over-broad is not a reason. **Fix:** adopt C-2's narrow rule — refuse only when `col6B > 0` against a union-group classification — and amend ARCHITECTURE §15 to match, with the D9 Challenge note attached to D9 rather than buried in ENGINE §29.

### MED-9 — Nothing establishes what happens when a project's pinned WD is superseded *and* the contract's WD is frozen at award.
`architecture/ARCHITECTURE.md` §6.2 step 4/5, `USER_JOURNEY.md` J8. The design is correct in refusing the FAR 22.404-6 conclusion. But the common real case is the opposite of the one modelled: the *contract* incorporates a specific revision at award, and the newer revision is legally irrelevant for the life of that contract. The product's WD-change notice, the diff, and the one-click re-pin all push toward the newer revision; the copy says FAR governs; nothing in the UI makes "the contract locked revision 2 and always will" a first-class, one-time, remembered state. **Fix:** add a per-project `wd_revision_locked_at_award` boolean set at setup. When true, the WD-change notice becomes informational only, the re-pin action is demoted below "keep revision N," and the exception report says the revision is contract-locked by the customer's own assertion. This costs one field and removes the product's single largest opportunity to nudge a customer into a wrong rate.

### MED-10 — The staleness ladder blocks new pins at L2 but nothing blocks the free generator, which makes a rate assertion with no pin at all.
`architecture/ARCHITECTURE.md` §3.8, §8.1 (L2 blocks "new pins only"), `USER_JOURNEY.md` Challenge D. Challenge D already spotted the analogous hole for the $49 bid sheet and closed it. The same argument applies with more force to `/wh347`: it emits a WH-347 with a provenance footer naming a WD and revision, from a mirror that may be 72+ hours unverified, to an anonymous visitor who never sees the in-product banner because they have no account. **Fix:** render the freshness sentence on the free generator's footer with the same three-state algebra as the paid path, and at L2 add an explicit line stating the last successful newer-revision check. The free artifact is the acquisition channel; it must not be the least honest artifact the company produces.

---

## LOW

- **LOW-1** — `ENGINE.md` §15.4 cites tool-use system-prompt overhead as "286–474 tokens depending on `tool_choice`". **VERIFIED:** 286/406 is **Opus 5**; **Sonnet 5** is 354/474. The range splices two models. Immaterial to the argument (no tools are used), but it is a mis-citation in a document that stakes its authority on live verification.
- **LOW-2** — `ENGINE.md` §12.3 lists fixture **F-PWRB-44h** asserting "$2,034.00 total" as a canary expectation. That figure is total DBA compensation due (wage + fringe + premium), not WH-347 column 7A. Naming it in the same table as column-level fixtures invites a builder to assert it against the wrong field. Label the asserted field explicitly.
- **LOW-3** — `ARCHITECTURE.md` §7.1 schedules `ops.digest` as a weekly founder email and says "nothing waits on it." Nothing *should*, but it is the only place the founder learns that (e.g.) the credit ceiling has been tripping for six days. Either give the digest a machine consumer (a `/api/status` field) or accept that it is decorative and say so.
- **LOW-4** — Landing page: `aria-live` appears once and `role=` twice across 131 KB. The tables, headings, skip link, `scope`/`th`/`caption` usage, `focus-visible`, `prefers-reduced-motion` and the light/dark/`data-theme` triple are all correct and better than most. But the DRAFT/CERTIFIABLE status change in the interactive specimen is a state change with no announced region. Add `aria-live="polite"` to the status chip's container.
- **LOW-5** — `DESIGN_SYSTEM.md` §4.5 certifies `--rp-rule-strong` at **3.15:1** against a 3:1 requirement. That is a 5% margin on a value that will move the first time anyone nudges a surface token. Move it to ≥3.5:1 and keep 3.15 as the documented floor.
- **LOW-6** — The HTML comment `<!-- Worker 3 — the laborer at $13.00, below EO 13658's floor -->` asserts, in the source of the marketing page, exactly the thing ARCHITECTURE §11.7 and USER_JOURNEY §16.1 forbid asserting. It is invisible to users and the copy lint will not see it because it is a comment. Extend the lint to HTML comments, or delete the line.

---

## What is genuinely strong, and should not be weakened while fixing the above

A review that finds only faults is as useless as one that finds none. Four things here are better than run 1 and should survive:

1. **The freshness/rate separation (`freshnessOf` vs `rateFor`).** D7's autonomy fix expressed as two function signatures, with `deriveStatus` as the single total constructor and P-13 as its executable form, is the cleanest thing in the set. It is the reason the Friday-16:00 scenario is survivable.
2. **CORPUS_DESIGN's four Challenges.** C1 (the moat claim is false), C2 (the index contains no revisions), C3 (`totalElements: 0` with HTTP 200), C4 (N-version programming does not buy independence, with Knight & Leveson cited correctly) are all reproducible, all uncomfortable, and all recorded rather than buried. C3 in particular — an HTTP 200 that reads as an empty corpus — is a genuine footgun found by probing rather than by reasoning.
3. **The digit ban (E7).** Converting "the model may never emit a number" from an intention into a ten-line total function over the response, with a deterministic fallback so rejection is free, is the correct shape for that constraint and is worth stealing.
4. **The E4 case (FOH 15k11(b), regular rate $10.91 below the electrician's $12.00 BHR).** Correctly derived, correctly pinned by fixture, and the single most likely place a competitor's blog post is wrong. Do not let the CRIT-4 fix disturb it.

---

## Verdict

**Not buildable as specified. Buildable after five blocking corrections, none of which is architectural.**

The architecture is sound. The invariant set (I1–I7), the pinned-mirror read path, the append-only bitemporal store, the promotion gate, and the four-verb response algebra are the right shape for this problem, and the autonomy posture (A1–A6) holds everywhere I attacked it — I could not find a place where a human is quietly required. There is no support escalation in the compliance flow, the one billing address is disclosed and counted, and the refusal primitives are components rather than messages. That is the hard part and it is done.

What is not done is the **arithmetic and the probe thresholds**, and those are the two things this product cannot be wrong about, because both terminate in a signed federal certification.

**Blocking before any code is written:**

| # | Blocker | Consequence if shipped |
|---|---|---|
| **CRIT-1** | P4 blocks on `standard`; measured 100% disagreement | Product promotes nothing, emits nothing, on day one |
| **CRIT-2** | `col7A` double-counts cash in lieu | Overstated gross on a signed federal document |
| **CRIT-3** | CWHSSA applied with no $100,000 threshold | False violation flags and a wrong overtime basis on small contracts |
| **CRIT-4** | DT excluded from the 40-hour threshold, unchecked | Silent, invisible underpayment of statutory overtime |
| **CRIT-5** | Rounding surface misdescribed | The G1 gate's own justification is unsound; cent-level drift against the customer's register |

CRIT-1 is a two-line edit and I would not have found it by reading — it required probing 4,236 records and a 14-WD sample. That is the lesson for the build phase: **every probe that can block promotion must have its red rate measured against the live corpus before it is allowed to block.** A probe that fires on everything and a probe that fires on nothing are the same product, and the documents currently contain one of each.

Two further findings should be resolved before Phase 3 rather than before the build: **HIGH-1** (the product ships under two names) and **HIGH-7** (the moat lens that won the vote is falsified and no one has told the acquisition brief).

The single most alarming property of this document set is that **CORPUS_DESIGN silently fixes CRIT-1 and ARCHITECTURE does not know.** Four documents each declare themselves binding, three of them supersede parts of the others, and the supersessions are recorded inconsistently — ENGINE names its two (§9.2, ADR-101), CORPUS_DESIGN names four Challenges but not the P4 correction, DESIGN_SYSTEM records the rename that the architecture set never received. Before build, one document must own each contract, and a `SUPERSESSIONS.md` must list every override with its source and its target section. Otherwise the build inherits whichever version the implementer happened to read.

---

## References

**Regulation and forms (all fetched 2026-08-13 via the eCFR API or dol.gov)**

- https://www.ecfr.gov/api/versioner/v1/full/2026-08-11/title-29.xml?part=5&section=5.5 — 29 CFR 5.5 machine-readable. Source of the **$100,000 CWHSSA threshold** in (b)'s preamble (CRIT-3), the $33/day liquidated damages in (b)(2), the three certifications in (a)(3)(ii)(C) (MED-1), and the SSN rule in (a)(3)(ii)(B)
- https://www.ecfr.gov/api/versioner/v1/full/2026-08-11/title-29.xml?part=3&section=3.5 — 29 CFR 3.5, **ten** permissible deduction categories (a)–(j), [88 FR 57730, Aug. 23, 2023] (HIGH-6)
- https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-A/section-5.5 — human-readable 29 CFR 5.5
- https://www.ecfr.gov/current/title-29/subtitle-A/part-3/section-3.5 — human-readable 29 CFR 3.5
- https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-A/section-5.12 — three-year debarment
- https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-B/section-5.32 — the overtime base and contractor examples W/X/Y
- https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-B/section-5.31 — the three discharge methods
- https://www.dol.gov/agencies/whd/forms/wh347 — WH-347 and instructions. Source of the **six statement-of-compliance boxes**, the col 6B/6C **weekly total** rule (HIGH-8), and the CWHSSA-conditional col 4 overtime instruction (CRIT-3)
- https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/wh347.pdf — the form PDF
- https://www.dol.gov/agencies/whd/field-operations-handbook/Chapter-15 — FOH Chapter 15 (DBRA/CWHSSA)
- https://www.dol.gov/agencies/whd/government-contracts/prevailing-wage-resource-book/db-compliance-principles — fringe on all hours; the premium exclusion
- https://www.acquisition.gov/far/22.404-6 — wage determination effectiveness (MED-9)

**Upstream data sources (probed live 2026-08-13, results in §0)**

- https://sam.gov/api/prod/sgs/v1/search/?index=dbra&page=0&size=5000&is_active=true — the single-request active crawl; 4,236 records, `isStandard: true` on all of them (CRIT-1, HIGH-5)
- https://sam.gov/api/prod/wdol/v1/wd/VA20260195/2 — per-WD document; `standard: false` against the index's `true`
- https://sam.gov/api/prod/wdol/v1/wd/VA20260195/0 — superseded revision, HTTP 200 (HIGH-7 / C1)
- http://www.dir.ca.gov/dlse/CPR-Prod-Test/CPR.xsd — CA eCPR schema; 49,325 bytes, `sha256 2ea52e977ab4ac74f7bb99aa9fb7634de8b48db7e090864150428b63c800d01a` — pinned hash confirmed
- https://www.dir.ca.gov/Public-Works/Certified-Payroll-Reporting.html — CA eCPR requirement (MED-4)
- https://www.dir.ca.gov/public-works/ecpruserguide.pdf — PWCR and DIR Project ID prerequisites (MED-4)

**Platform facts**

- https://platform.claude.com/docs/en/about-claude/pricing — Sonnet 5 $2/$10, cache read $0.20, cache write 1.25×/2×, Batch 50%, and the introductory-pricing note quoted verbatim in `ENGINE.md` §17.1 — **confirmed current, not stale**. Also the tool-use system-prompt token table behind LOW-1
- https://platform.claude.com/docs/en/build-with-claude/prompt-caching — prefix-match semantics, 4-breakpoint limit, 20-block lookback, per-model minimum cacheable prefix (Sonnet 5 = 1024, Opus 5 = 512 — `ENGINE.md` §15.6/§17.1 correct)
- https://platform.claude.com/docs/en/build-with-claude/structured-outputs — `output_config.format`, `additionalProperties: false`, integer enums

**Method and engineering literature**

- https://www.csc.kth.se/utbildning/kth/kurser/DA2210/vettig13/Seminarier/KnightLeveson.pdf — Knight & Leveson, *An Experimental Evaluation of the Assumption of Independence in Multiversion Programming*, IEEE TSE 1986 — correctly cited in CORPUS_DESIGN C4; the same argument is why CRIT-1's probe cannot be validated by reasoning alone
- https://www.rfc-editor.org/rfc/rfc6962 — Certificate Transparency; the append-only log model behind §3 and §8
- https://web.mit.edu/Saltzer/www/publications/protection/ — Saltzer & Schroeder, fail-safe defaults. CRIT-1 is what fail-safe looks like when the safe state is also the useless state
- https://sre.google/sre-book/monitoring-distributed-systems/ — symptom-based alerting; the basis for measuring a probe's red rate before letting it block
- https://owasp.org/API-Security/editions/2023/en/0x11-t10/ — API1:2023 Broken Object Level Authorization; HIGH-4's presigned-URL objection
- https://en.wikipedia.org/wiki/K-anonymity — k-anonymity and its known failure under composition and differencing; HIGH-2 and HIGH-3
- https://12factor.net/ — config, backing services, disposability
- https://mcfunley.com/choose-boring-technology — McKinley, innovation tokens
- https://martinfowler.com/eaaDev/timeNarrative.html — bitemporal modelling; CORPUS_DESIGN §3.2's three axes
- https://www.hyrumslaw.com/ — observable behaviour as the real contract; the reason `isStandard` cannot be trusted as an oracle
- https://www.w3.org/TR/WCAG22/ — WCAG 2.2 AA, the stated target
- https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html — SC 1.4.11, 3:1 (LOW-5)
- https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html — SC 3.2.6; the "comply by having none" reading is correct
- https://www.nngroup.com/articles/ten-usability-heuristics/ — Nielsen; the §15 audit in USER_JOURNEY is sound

**Product-internal**

- `run-2/PLAN.md` — A1–A6
- `run-2/phase-1-ideation/IDEA_DOSSIER.md` — D1–D10, G1–G6, R1–R3; the Moat lens falsified by HIGH-7
- `run-2/phase-2-build/architecture/{ARCHITECTURE,CORPUS_DESIGN,ENGINE,USER_JOURNEY}.md`
- `run-2/phase-2-build/identity/{NAMING,BRAND,DESIGN_SYSTEM}.md`, `identity/landing/index.html`

---

## Remediation audit

**Date:** 2026-08-13 (same day as the review above)
**Auditor:** verification pass, independent of the six agents that made the edits
**Method:** I read the current text of every document this review criticises and decided each finding against that text. I did not read the agents' reports as evidence. Every regulatory and upstream fact a fix leans on was **re-probed in this session**, not carried from the review's own §0 table:

| Re-probe, 2026-08-13 | Result | Bears on |
|---|---|---|
| `ecfr.gov/api/versioner/v1/full/2026-08-11/…?part=5&section=5.5` | (b) preamble verbatim: *"…in any contract in an amount in excess of **$100,000** and subject to the overtime provisions of the Contract Work Hours and Safety Standards Act."* (a)(3)(ii)(C) numbered items: **(1), (2), (3)** — three | CRIT-3, MED-1 |
| `…?part=3&section=3.5` | **Ten** top-level lettered paragraphs (a)–(j); (i) board/lodging, (j) nominal-value safety equipment; tail `[88 FR 57730, Aug. 23, 2023]` | HIGH-6 |
| `sam.gov/api/prod/sgs/v1/search/?index=dbra&page=0&size=5000&is_active=true` | HTTP 200, **3,638,250 B in 0.89 s**, `totalElements 4236`, **`totalPages 1`**, `isStandard: true` on **4,236 / 4,236** | CRIT-1, HIGH-5 |
| `wdol/v1/wd/{VA20260195/2, TX20260147/0, MN20260016/0}` | `standard: false` on **3 / 3** against the index's constant `true` | CRIT-1 |
| `wdol/v1/wd/WA20200002/0/download` | **HTTP 303** → `iae-wdol-sam-gov.s3.amazonaws.com/WDOL_FILES_PROD/DBA/ARCHIVE/FY2020/wa2.r0.txt` | HIGH-7 |

Every fact the fixes rest on holds. The failures below are internal consistency failures, not factual ones.

### Finding-by-finding

| # | Verdict | Where it is closed, or what is missing |
|---|---|---|
| **CRIT-1** | **CLOSED** | `CORPUS_DESIGN.md` §9.5 tier 1: *"the blocking set. Exactly three fields, and no more"* — `revision_number`, `publish_date`, `active_flag`, each with a measured **0/200** red rate. `standard` demoted to tier 3 at **200/200 (100%)**. `ARCHITECTURE.md` §8.2 P4 and ADR-004 now carry the identical set, and ADR-004 withdraws *"earned its place"*: §2.3 records `isStandard` as *"a fixed offset between two vocabularies … carries zero information."* R-CRIT1's standing rule is in force as CORPUS_DESIGN invariant 7 with a promotion procedure, a `BLOCKING_FIELDS` set-equality CI test, a `'standard' ∉ BLOCKING_FIELDS` test by name, and a quarterly re-audit that auto-disarms any probe crossing 1%. §10.6 is the register and ARCHITECTURE §8.2 defers to it rather than duplicating it. **Strongest single fix in the set**, and it went further than asked: applying the new rule to CORPUS_DESIGN's own `CHECK (mod_table_rows = revision + 1)` found it red on **34/200** — 17% of the corpus was unwritable — recorded as C6 and replaced with the suffix form at 0/200. |
| **CRIT-2** | **CLOSED** | `ENGINE.md` §8 no longer adds `Σ col6C`. §8.1 states the containment as a table: *"`col6C` … **⊆ 7A** — already counted once"*, *"`col6B` … **∉ 7A**"*, with the asymmetry reasoned from 5.31(b)(1) vs (b)(2). **P-16** (exact composition) and **P-17** (containment) added; fixture F-M3-CIL pins $1,534.92. The landing specimen agrees independently: entry 1 prints 7A **1,106.80 = 40 × $27.67**, with 6C 226.80 disclosed and not re-added. The agent also found and corrected a real defect the review missed: **P-02 as written was false on a class-1 DOL oracle** — FOH 15k11(a)(2) gives `col7A` $464.00 against `Σ(44 × baseRate)` $528.00. I re-derived it; the correction is right. |
| **CRIT-3** | **CLOSED** | `ENGINE.md` §7.0 quotes 5.5(b) verbatim — I diffed it against the API response, it is exact — and gates §7.1–§7.7 on `contractValueBand`, with `unknown` → `CWHSSA_COVERAGE_UNDETERMINED` → **P-B**. `ARCHITECTURE.md` §5.1 makes `projects.contract_value_band` a required enum with **no DEFAULT** plus a backfill migration; §3.2 defers to ENGINE §7.0. `USER_JOURNEY.md` §4.4 adds it as required field 6 on S10 with no option pre-selected, verbatim question copy, and the FAR 52.222-4 clause-list recognition route. **P-20** and **P-22** make the gate executable; **P-22** in particular asserts `WD_UNDERPAYMENT` fires *independently* of the band, which stops the new gate silently disabling the one comparison the product exists to make. §4.4.4 records the 29 CFR 5.5(b) $100,000 / FAR 22.305 $200,000 divergence and resolves it by deferring to the customer's contract rather than picking a number — the right answer. Consistent in all four documents and on the landing page. |
| **CRIT-4** | **CLOSED** | `ENGINE.md` §4 A2 withdraws the exclusion by name — *"That was wrong, and it was the most dangerous sentence in this document"* — and §7.3 computes `hoursWorked = Σ(st + ot + dt)`. Premium is credited only where `rate(b) ≥ 1.5 × regularRate` on a `SELF_PRICED` bucket; otherwise **P-A** `PREMIUM_HOURS_UNPROVEN` with a closed choice. The generalisation past the `dt` column name (the rule is stated over *does this bucket price its own hours in gross?*) is better than the fix the review specified. **P-18** added; the §22 matrix now walks `dtRate ∈ {null, $0.00, 1.49×, 1.50×, 2.00×}`. The E4 case is undisturbed, as §12.3 asserts and the DOL oracles confirm (all four have `dt = 0`). Mirrored in `USER_JOURNEY.md` §5.4 and on the landing page. |
| **CRIT-5** | **CLOSED** | `ENGINE.md` §2.1 withdraws "the single division". §11 replaces it with R1–R4 (one narrowing function, narrow at the line then sum in cents, half-up not banker's, never twice), a **ten-row narrowing-site table N1–N10**, and the honest evidential argument for line-level rounding (DOL prints $10.91, not $10.909090…). The unenforceable grep is replaced by a type boundary plus a lint pointed at the `/` operator. **P-19** bounds the residual at one cent per narrowing site; I checked the proof — error per site in (−½,+½], so `< n/2 + ½ ≤ n` for `n ≥ 1` — it holds. |
| **HIGH-1** | **CLOSED** | Zero occurrences of "Wage Line" in all four architecture documents (was 11/10/12/22); all four now head "RATEPIN". `NAMING.md` §7.3 records the `Bid Rate Card → Bid Sheet` rename with its reason. *Residual, minor:* `DESIGN_SYSTEM.md` line 20 still says the four architecture documents *"still say Wage Line; they need a name pass"* — true when written, false now. One sentence, in a file nobody owned this round. |
| **HIGH-2** | **OPEN** | See §A below. `ARCHITECTURE.md` §11.6 and `USER_JOURNEY.md` §6.3.1 close it properly. **`ENGINE.md` does not, and ENGINE is the declared owner of the ladder.** |
| **HIGH-3** | **OPEN** | See §B below. The false sentence is still in `CORPUS_DESIGN.md` §7.4, verbatim. |
| **HIGH-4** | **CLOSED** | `ARCHITECTURE.md` §3.1 replaces the redirect with an authenticated route that walks `artifact → filing → project → tenant` under RLS on **every** request, streams through the application with `Cache-Control: no-store`, and forbids a presigned URL in the module contract table (§3.10) as well as in prose. Cloudflare's own presigned-URL language is quoted as the reason. The retention contradiction is reconciled: §5.4 gives the eCPR XML its own row on **the same clock as `ssn_ciphertext`** (30 days post-export), retaining a redacted rendering plus the original `sha256` so §8's reproduction property survives without the SSNs. §11.3 adds SSE-C per tenant and §5.5 makes key destruction the erasure guarantee. |
| **HIGH-5** | **CLOSED** | `ARCHITECTURE.md` §7.1, the §4.4 diagram, and Challenge 3 all now specify **one request at `size=5000`** with a `totalPages == 1` assertion and pagination demoted to a documented fallback; `CORPUS_DESIGN.md` §2.1 is named as the governing authority. Verified live above: 4,236 records, `totalPages 1`, 0.89 s. |
| **HIGH-6** | **CLOSED** | `ARCHITECTURE.md` §3.2 no longer enumerates a count — it defers to `ENGINE.md` §9.2 by name, states why (*"an earlier revision of this section enumerated eight categories and that number is wrong"*), and names the (i)/(j) substance. The enum is generated against the paragraph letters in the `obligation_changelog` row for 3.5, with a CI test so a future (k) fails the build. `ingest.ecfr` watches the paragraph set. Ten is correct — verified. |
| **HIGH-7** | **PARTIAL** | See §C below. Banned correctly in `ARCHITECTURE.md` §11.7, `USER_JOURNEY.md` §16.3, `CORPUS_DESIGN.md` C1 and `CORRECTIONS.md` X-1, and the erratum stands at the head of `IDEA_DOSSIER.md`. **It is still printed in `identity/BRAND.md` line 76.** |
| **HIGH-8** | **CLOSED** | The specimen grid now prints weekly totals. I re-derived every figure: 40 × $6.10 = **244.00**, 40 × $5.67 = **226.80**, and 244.00 + 226.80 = 470.80 = 40 × $11.77, the WD's own fringe. Entry 2 at 46 h → 280.60 / 260.82; entry 3 at 36 h → 0.00 / 143.64 = 36 × $3.99. 7A ties at 40 × $27.67 = 1,106.80. Column headers now carry `$/hour` and `$/week`. A `SPECIMEN` mark is present in neutral ink alongside the DRAFT watermark. |

### A. HIGH-2 is open, and it is open in the specific shape this review warned about

The review's closing paragraph said the most alarming property of the set was that *"CORPUS_DESIGN silently fixes CRIT-1 and ARCHITECTURE does not know."* That pattern has reproduced, with the polarity reversed.

`ARCHITECTURE.md` §11.6 states the rule correctly and structurally — *"the cross-tenant aggregate may only ORDER a list. It may never pre-select, default, or auto-apply… `crosswalk/aggregate/**`'s return type is `ClassificationId[]`, an ordering, with no field in which a selection could be expressed"* — and `USER_JOURNEY.md` §6.3.1 renders it as a permission table whose bottom row reads *"The cross-tenant k ≥ 5 aggregate | no | no | **yes, and nothing else**."* Both are exactly right, and §6.3.1's sybil reasoning is the clearest statement of the argument anywhere in the set.

`ENGINE.md` was not changed. It still specifies the poisoned behaviour, in three places:

- §15.1 Stage 1: *"A hit here **pre-selects in the picker**; it does not resolve, because another contractor's answer is evidence, not authority."*
- §18.2 ladder, level **L-B**: *"Global aggregate hit: ≥5 tenants, ≥0.90 agreement | shown, top candidate **pre-selected**"*
- §18.2 prose: *"**L-B / L-C — pre-selected picker.** One classification is offered… The customer confirms."*

This is not a stale cross-reference that a builder resolves in favour of the corrected document. The two documents claim authority over the same rule in opposite directions:

- `ARCHITECTURE.md` **S-5** names its target explicitly: *"`CORPUS_DESIGN.md` §7.2, §7.4; **`ENGINE.md` §18.2**."*
- `ENGINE.md` §17 declares itself *"the single owner of… **the confidence ladder (§18)**"*, and its closing line states: *"Where this document conflicts with a later implementation choice, this document wins… **S-1 through S-5**… state precisely what they change in `ARCHITECTURE.md`; **nothing else in that document is altered**."*

So ARCHITECTURE asserts it has superseded ENGINE §18.2, and ENGINE asserts that ARCHITECTURE has altered nothing but the five items ENGINE itself lists. A builder implementing the ranking ladder from its declared owner ships the version in which five free signups pre-select a wrong classification on every other tenant's federally certified payroll — which is the finding, unmitigated.

Two supporting gaps in the same finding:

1. **The S-numbering collides.** ARCHITECTURE mints S-1…S-8 and ENGINE mints S-1…S-5, with the same labels meaning different things: ARCH **S-3** is the one-request crawl while ENGINE **S-3** is the CWHSSA gate; ARCH **S-5** is the crosswalk ordering rule while ENGINE **S-5** is the three-vs-six certification split. The review asked for one `SUPERSESSIONS.md` listing every override with its source and its target. Instead there are now two overlapping namespaces, and "S-5" resolves to whichever document the reader happened to pick up.
2. **The DDL does not implement the defence.** ARCHITECTURE §11.6 protection 2 says *"`eligible_for_aggregate` is a generated column… and the materialized view's `WHERE` clause reads it,"* and protection 3 requires supporting accounts to have **≥4 released filings across ≥2 distinct projects**. `CORPUS_DESIGN.md` §7.2 owns that DDL, and its `crosswalk_observation` table has no `source`, `confirmed_at` or `eligible_for_aggregate` column, while `crosswalk_prior` is still bare `HAVING count(DISTINCT o.account_id) >= 5` with no `WHERE` and no weighting. The fix is stated in the document that describes the schema and absent from the document that defines it.

*Lesser divergence, worth one line while the file is open:* `USER_JOURNEY.md` §6.3.1 grants pre-selection only to *"an **exact** match, after normalization, against this determination's own verbatim classification label"* and explicitly denies it to *"deterministic string similarity below exact."* `ENGINE.md` §15.1 / §18.2 **L-C** pre-selects at `lexicalScore ≥ 0.92` with `margin ≥ 0.15`, which is similarity below exact. One of the two thresholds has to move.

### B. HIGH-3 is open, and the fix made it worse rather than neutral

`CORPUS_DESIGN.md` §7.4 still reads, unedited:

> *"**Deletion.** An account deletion removes its `crosswalk_observation` rows and rebuilds the prior. Because the prior requires five accounts, no single deletion can be detected by observing the prior's change."*

That is the sentence the finding is about, and it is false for the reason the finding gives.

What is new is that `ARCHITECTURE.md` §11.6 now states the true property, correctly and at length — *"an observer who controls k−1 accounts can learn that a specific other account deleted, and when… k-anonymity has never provided the property that the phrase 'no single deletion can be detected' was asserting"* — and then **points at §7.4 as the owner of the corrected text**: *"`CORPUS_DESIGN.md` §7.4 owns the disclosure boundary and states the true property."* It does not. It states the false one. A reader who follows ARCHITECTURE's own citation lands on the claim ARCHITECTURE just refuted, and a reader who arrives at §7.4 directly gets no signal that anything is wrong with it. Before the fix the documents were consistently wrong; they are now inconsistently wrong, with a cross-reference asserting the opposite of what it points to.

### C. HIGH-7 is partial: the banned sentence is still in the brand document

The prohibition is stated well and in the right places, and `CORRECTIONS.md` is a genuinely strong artifact — a lint config that is also the register, with the claim, its origin, its verdict, its dated verification, its replacement wording and its grep probe, and with the register's own category-ban set demoted to advisory after it measured 100% false-positive on correct copy. Applying R-CRIT1's rule to itself is the right instinct.

But `identity/BRAND.md` line 76, in the attribute → benefit ladder that feeds acquisition copy, still reads:

> *"…eighteen months later is answered from stored data instead of reconstruction — and **reconstruction is exactly what is impossible, because SAM overwrites the live document**"*

I verified it false in this session: `wd/WA20200002/0/download` → **303** → the S3 archive object, path space deterministic, series resold at $19/mo. The same file bans the claim twice — line 272 (*"Refuted: archived revisions are fetchable and resold"*) and line 344, which even supplies the correct replacement wording — so BRAND.md now contradicts itself within twelve lines of its own don't-say table. `CORRECTIONS.md` line 651 identified this exact line and queued it for its owner; no owner was assigned, so it did not move. R-HIGH7 says the sentence must never be printed anywhere, **including in acquisition copy**. This is acquisition copy.

Secondary, and cheaper to leave: `IDEA_DOSSIER.md` carries the erratum at the head of the document, which satisfies the substance, but the Moat lens itself (line 48, *"You cannot retroactively buy what a WD said last March"*) and the runner-up rationale (line 63, *"SAM overwrites, and a superseded revision is gone"*) are unstruck at their point of use, unlike the four demand claims the same header says are *"struck at their point of use."* Phase 3 reads the lens, not the header.

### What was fixed that this review did not ask for, and should be kept

Three of the six agents found real defects outside their assignment and recorded them rather than quietly patching them. All three are worth more than the finding that occasioned them:

1. **CORPUS_DESIGN C6.** Applying the new red-rate rule to the document's own constraint found `CHECK (mod_table_rows = revision + 1)` red on **34/200 (17.0%)** — WHD omits modification 0 — meaning 17% of the corpus was unwritable by the shipped schema. This is a second corpus-killer of the same class as CRIT-1, found only because CRIT-1's fix was turned on its author.
2. **ENGINE P-02.** A property this review endorsed as harmless (*"P-02 passes under both formulas"*) turns out to be **false on a DOL-published oracle**. Corrected rather than weakened, which is the right call.
3. **The zero-red-rate argument.** §9.5's *"a probe that has never been observed to fire has never been shown capable of firing… Zero red and 100% red are the same epistemic state"* is a sharper statement of the lesson than the one this review drew, and it is the reason `construction_types` and `state_code` were not quietly promoted into the blocking set on the strength of a clean sample.

### Verdict

**The specification is buildable on everything that terminates in arithmetic or in the corpus. It is not yet buildable on the crosswalk, and one false claim is still in the copy.**

All five CRITICAL findings are closed, and I re-derived rather than accepted each one. The two things the original verdict said were not done — the arithmetic and the probe thresholds — are now done, and done better than specified: the blocking set is measured rather than argued, the rounding surface is enumerated rather than asserted, the CWHSSA gate is a required field with no safe default rather than an assumption, and every correction is named at the point of withdrawal instead of being quietly deleted. The autonomy posture survived the whole remediation: I found no human step, no support address and no escalation introduced by any of the thirteen fixes, and the four refusal primitives absorbed every new failure mode (P-B for the unknown band, P-A for the unproven premium label and the unmapped deduction, P-C for the narrowed pin claim, P-D for the declined FAR and CWHSSA conclusions).

**Three edits stand between this and buildable. None is architectural; two are single-file.**

| # | File | Required change |
|---|---|---|
| **1** | `architecture/ENGINE.md` | §18.2 **L-B** and §15.1 Stage 1: the cross-tenant aggregate **orders only**. Change L-B's picker cell from *"top candidate pre-selected"* to *"ordered, none pre-selected"*, delete *"A hit here pre-selects in the picker"*, and amend the §18.2 prose so **L-B** is not bracketed with L-C as a "pre-selected picker." Add an S-row naming `ARCHITECTURE.md` §11.6 / `USER_JOURNEY.md` §6.3.1 as the source, and amend the closing "nothing else in that document is altered" sentence, which is what currently makes the contradiction load-bearing. Reconcile **L-C** with `USER_JOURNEY.md` §6.3.1's exact-match-only rule — pick one threshold and state it in both. |
| **2** | `architecture/CORPUS_DESIGN.md` | §7.4: delete the sentence *"Because the prior requires five accounts, no single deletion can be detected by observing the prior's change,"* and replace it with the true property already drafted in `ARCHITECTURE.md` §11.6 (membership changes at the k boundary are observable; no defence against a differencing attack by an observer controlling k−1 accounts), so ARCHITECTURE's citation resolves to what it claims. While in the file, §7.2: add `source` / `confirmed_at` / `eligible_for_aggregate` to `crosswalk_observation` and the `WHERE` clause plus the ≥4-filings / ≥2-projects weighting to `crosswalk_prior`, so the HIGH-2 defence exists in the schema that defines it and not only in the prose that describes it. |
| **3** | `identity/BRAND.md` | Line 76: strike *"and reconstruction is exactly what is impossible, because SAM overwrites the live document."* The replacement is already written at line 344 — the stored-copy latency claim, which is true. Verified false again today: 303 → `iae-wdol-sam-gov.s3.amazonaws.com/WDOL_FILES_PROD/DBA/ARCHIVE/FY2020/wa2.r0.txt`. Add BRAND.md to the Scope A path set in `CORRECTIONS.md` §3 so the probe that already exists would have caught it. |

Two housekeeping items, non-blocking, best done in the same pass: fold the two colliding `S-*` namespaces into the single `SUPERSESSIONS.md` this review asked for, with one row per override naming its source document, its target section and its finding — the collision (`S-3` and `S-5` each meaning two different things) is exactly the drift the register was supposed to prevent. And correct `identity/DESIGN_SYSTEM.md` line 20, which still tells the reader the four architecture documents say "Wage Line."

**Fix 1 and fix 2 are blocking for the build.** Fix 3 is blocking for Phase 3 and is one sentence. With those three landed, the answer to the original question is yes.

---

## Remediation audit, second pass — 2026-08-13, orchestrator

The three edits the audit left open are landed. Each was a single-file change; none
touched an architectural decision.

| # | File | What changed | Status |
|---|---|---|---|
| **1** | `architecture/ENGINE.md` | §15.1 Stage 1 now reads *"a hit here may only change the ORDER of the candidate list"* with the sybil reasoning stated at the point of the rule; §18.2 **L-B**'s picker cell is *"ordering only — nothing pre-selected, nothing annotated"*; the old **L-C** is split into **L-C₁** (exact normalized match against the determination's **own verbatim label** — the one input allowed to fill a radio) and **L-C₂** (the 0.92/0.15 band, which now governs only whether the model is called); the *"pre-selected picker"* bullet no longer brackets L-B with it; **E5**, §18.1, the ranker diagram and **Q-E3** follow. The τ_lex divergence against `USER_JOURNEY.md` §6.3.1 is resolved **in favour of the stricter rule** — exact match only — and ENGINE now names USER_JOURNEY as the authority instead of asserting its own. | **CLOSED** |
| **2** | `architecture/CORPUS_DESIGN.md` | §7.4's false differencing sentence is struck *and quoted at the point of withdrawal*, replaced with the four properties that are actually true — counts-not-rows, `k ≥ 5` at rest, fixed-schedule refresh so a departure is smeared into a batch rather than observable as an event, and a bucketed `agreement_band` so a cell's exact *k* is not readable through any API — labelled **mitigation by batching and coarsening, not a proof**. §7.2's DDL gains `crosswalk_eligible_account` (≥4 released filings across ≥2 projects), `provenance = 'user_confirmed'`, `account_id IS NOT NULL` and the banded output, so all four HIGH-2 defences live in the schema rather than in prose an ORM can forget. Deletion scope defers explicitly to `ARCHITECTURE.md` §5.5. | **CLOSED** |
| **3** | `identity/BRAND.md` | Line 76's *"reconstruction is exactly what is impossible"* is struck. U1's value is restated on the true ground: reconstruction is possible, it is her unpaid Saturday, and it still does not tell her which revision was pinned to *this* project on *that* week. | **CLOSED** |

Both housekeeping items are done in the same pass. The colliding `S-*` namespaces are split
rather than merged: **AS-n** is what `ARCHITECTURE.md` overrides, **ES-n** is what `ENGINE.md`
overrides, and each document's closing status paragraph now states that the *other* direction
also binds it — ENGINE's *"nothing else in that document is altered"* was the sentence that
made the contradiction load-bearing, and it is gone. `identity/DESIGN_SYSTEM.md` line 20 no
longer tells the reader the architecture set says "Wage Line"; the name pass landed the same day.

**Verdict: buildable.** The condition the first-pass audit set — *"with those three landed, the
answer is yes"* — is met. Build proceeds against this specification.
