# BUILD REVIEW — ARITHMETIC AND ARTIFACT CORRECTNESS

**Lens:** the money path and the thing a contractor signs.
**Method:** re-derived §4–§11 against code, not comments; ran the engine, the exception builder, the
projection and the PDF writer on adversarial weeks; extracted text from the emitted PDF bytes; fetched
29 CFR 3.5, 5.5 and 5.32 from the eCFR versioner API on 2026-08-13 (title-29 issue 2026-08-11) and
diffed them against the shipped quotes.
**Baseline:** `npx vitest run` — 41 files, 807 tests, green, before and independent of every finding below.

Primary sources confirmed as the code states them: 29 CFR 3.5 carries exactly ten lettered paragraphs
(a)–(j); 5.5(b)'s preamble reads *"in any contract in an amount in excess of $100,000"*; 5.5(b)(1) is
denominated in *"hours worked in excess of forty"* and carries DOL's own `conract` typo; 5.5(b)(2) reads
$33/calendar day; 5.32(a)'s floor and 5.32(c)(1)–(3)'s three contractors are transcribed exactly. The
`max(BHR_WD, cash − cashInLieu)` per-classification floor, the un-floored weighted average (E4/$10.91),
the `Σ(st+ot+dt)` CWHSSA hours base, the half-up narrowing at ten enumerated sites, and the ten-member
`DeductionCategory` enum all re-derive correctly. **The defects are not in those formulas. They are in
what the engine compares, what it renders, and what it lets through.**

---

## CRITICAL

### C-1 — The underpayment check prices double-time hours at a rate that was never paid, so a real Davis-Bacon shortfall renders CERTIFIABLE with no flag

`src/engine/arithmetic/compliance.ts:106`

```ts
const cashTerm = ledger.narrow('N10', scope, MicroDollars.fromRateHours(line.cashRate, allHours));
const paidTotal = Cents.add(cashTerm, col6B);
```

`allHours = st + ot + dt` (`week.ts:288`, `hours.ts:67`). So `paidTotal` asserts that every double-time
hour was paid at `cashRate`. But §8, implemented one file over at `week.ts:279-283`, prices the very same
hours at `dtRate`:

```ts
const doubleTimeCash =
  line.dtHours > 0 && line.input.dtRate !== null
    ? recorder.narrow('N4', scope, MicroDollars.fromRateHours(line.input.dtRate, line.dtHours))
    : Cents.of(0);
```

Two columns of the same artifact describe the same hours with two different rates, and the discrepancy
runs in the direction that suppresses the flag.

**Failing scenario, executed.** WD `$30.00 + $10.00`. One worker, one classification, `over_100k`,
20 ST + 8 DT, `cashRate = $45.00`, `dtRate = $0.00` (a mis-mapped per-diem or shift-differential column —
the exact export defect §4 A2 was rewritten to catch):

| Quantity | Engine output |
|---|---|
| `col7A` (gross earned, printed on the form) | **$900.00** |
| `requiredTotal` (`(30.00+10.00) × 28 h`) | $1,120.00 |
| `paidTotal` (`45.00 × 28 h`) | **$1,260.00** |
| `WD_UNDERPAYMENT` | **not raised** |
| `allBlockReasons` | `[]` |
| status | **CERTIFIABLE**, signature block rendered |

The same week with `dtRate = $1.00` gives `col7A = $908.00` against the same $1,120.00 requirement, and
again no flag. The worker is short **$212–$220 for one week**, the arithmetic to see it is already in the
struct (`straightTimeCash` + `doubleTimeCash` = what was actually paid), and the check looks at a
different number.

**Why nothing else catches it.** P-A (`cwhssa.ts:368`) requires `statutoryOtHours > 0`, and 28 hours is
under forty, so `PREMIUM_HOURS_UNPROVEN` cannot fire. `MISSING_REQUIRED_FIELD` (`week.ts:174`) fires only
on `dtRate === null`, not on `$0.00`. `FRINGE_BELOW_WD` does fire here, but it is (a) the wrong finding —
it says the fringe is short, not that the wage is — and (b) invisible for the reason in C-2. §12.2's
P-14 asserts `WD_UNDERPAYMENT ⟺ paidTotal < requiredTotal`, which is true of the *implemented* predicate
and therefore green; no property compares `paidTotal` against `col7A`'s own composition.

**Why it matters.** §10 is the product: *"the engine performs one comparison that no incumbent form-filler
performs."* `DESIGN_REVIEW.md` CRIT-3's closure argues P-22 exists so the CWHSSA gate cannot "silently
disable the one comparison the product exists to make." The gate does not disable it — this does, on any
week where a premium bucket carries a rate different from the straight-time rate.

**Fix.** Compose `paidTotal` from the same terms §8 composes gross from, so the two columns cannot
describe the same hours differently:

```ts
const paidTotal = Cents.sum([straightTimeCash, doubleTimeCash, col6B]);   // N3 + N4 + 6B
```

`straightTimeCash` and `doubleTimeCash` are already narrowed at N3/N4 in `week.ts`, so this deletes
narrowing site N10 entirely and takes §11.2's table to nine rows (`money.ts:384`), which is the correct
outcome: N10 was a site that recomputed a printed quantity a second way. `ENGINE.md` §10's published
formula carries the identical defect and must be corrected with the code, in the same revision that
corrected §8.1 — this is CRIT-2's double-count error in its mirror image.

Add the property that would have caught it: **`paidTotal(line) ≤ col7A`-composition terms for that line**,
i.e. `paidTotal − col6B == straightTimeCash + doubleTimeCash`, exactly, for every line.

---

### C-2 — No violation finding reaches any surface a customer can see: the PDF, the exception report and every screen omit all three flags

`src/engine/exceptions.ts:484-558` (`buildExceptionReport`), `src/app/(app)/_lib/filings.ts:801`
(`violationArray`), `src/app/(app)/api/artifacts/[id]/route.ts:47`

`buildExceptionReport` is the sole producer of exception sentences for both the paid and the free path
(`filings.ts:512`, `generate.ts:443`). Grepping its body: it handles the band, blocked lines, liquidated
damages, annualization, cash-in-lieu, 3.5(i)/(j) conditions, apprentices and the FLSA gap. It contains no
reference to `WD_UNDERPAYMENT`, `FRINGE_BELOW_WD` or `PREMIUM_BELOW_STATUTORY`. `computation.findings` —
which carries `shortfall`, `required`, `paid` and `citation` per finding — is never read by it.

The only other consumer is `violationArray`, which flattens the findings to a bare flag-name array written
into `filings.violation_flags`. `grep -rn "violation_flags" src/` returns exactly two hits: that INSERT and
the Drizzle column definition. **Nothing reads the column.**

**Failing scenario, executed end to end through `renderWh347` and text-extracted from the PDF bytes.**
FOH 15k11(b)'s own painter/electrician week, but with the WD fringes intact ($3.00 painter, $2.50
electrician) and only cash paid:

```
FINDINGS: WD_UNDERPAYMENT short=$72.00 | WD_UNDERPAYMENT short=$50.00 | PREMIUM_BELOW_STATUTORY short=$21.82
EXCEPTION SENTENCES ON THE ARTIFACT: 1 — the liquidated-damages P-D rule statement, and nothing else.
PDF text contains "72.00": false
PDF text contains /underpa/i: false
PDF text contains /shortfall/i: false
status: CERTIFIABLE   signatureBlockWithheld: false
```

A $122.00 wage shortfall against the pinned determination, computed correctly, with the arithmetic in
hand, is discarded before ink.

**Why it matters.** `ENGINE.md` §10: *"It renders as a prominent exception with the arithmetic shown, and
the artifact status stays CERTIFIABLE unless something else blocks it."* Half of that sentence is
implemented — the half that keeps the artifact certifiable. The paid boundary (D3) is "rates you can
defend"; a contractor who bought Ratepin specifically so this comparison would be made receives a clean
form. This is worse than not computing it: the product's own promise makes the silence read as a pass.

**Fix.** Add a fourth refusal builder to `exceptions.ts` and call it from `buildExceptionReport`. It is a
**P-D declined conclusion**, not a P-A and not a P-B — §10 is explicit that the check never blocks and
never characterises a shortfall as a violation of law:

```ts
export function wdUnderpaymentObserved(f: ViolationFinding): Refusal {
  return declinedConclusion({
    headline: `Line ${f.lineId}: total straight-time compensation is below the determination's rate.`,
    rule: QUOTE.multipleClassifications,           // or dischargeMethods for the fringe case
    citation: f.citation,
    observableFacts: [
      { label: 'Required (basic + fringe × hours)', value: Cents.toDollarString(f.required) },
      { label: 'Paid (cash + contributions)',       value: Cents.toDollarString(f.paid) },
      { label: 'Difference',                        value: Cents.toDollarString(f.shortfall) },
    ],
    declined:
      'Ratepin states the arithmetic and names the rule. Ratepin does not determine whether this is ' +
      'a violation of the Davis-Bacon Act, and computes no back wages and no liquidated damages.',
  });
}
```

Then add the test that closes the class, alongside the existing `explainedBlockReasons` test: **every
`ViolationFlag` present in `computation.findings` must appear in `exceptionSentences(refusals)`.** That
is the finding-side twin of "no block reaches an artifact without a sentence explaining it", and its
absence is precisely why this shipped.

---

### C-3 — The filing screen offers a CA eCPR download for an artifact that is never generated, and the route 409s every time

`src/app/(app)/app/filings/[id]/page.tsx:230-245`, `src/app/(app)/api/artifacts/[id]/route.ts:60-69`

The screen renders the chip and the link unconditionally on `xml.kind !== 'blocked'`:

```tsx
<ArtifactChip blocked={xml.kind === 'blocked'}
  label={xml.kind === 'blocked' ? 'Blocked' : 'Generated, not acceptance-tested'} />
...
<Link href={`/api/artifacts/${id}?kind=ecpr_xml`}>Download</Link>
```

The route it points at:

```ts
if (kind !== 'wh347_pdf') {
  return NextResponse.json({ error: 'This artifact is not available for this filing. …' }, { status: 409 });
}
```

`grep -rn "renderEcprXml" src/` returns three hits, all inside `src/artifacts/**` and its barrel. **No
route, action, worker job or compose path calls it.** `recordArtifact` is invoked with `'wh347_pdf'` and
`'exception_report'` only (`filings.ts:677`, `filings.ts:687`); `'ecpr_xml'` appears in the kind union and
in the `pii_class` ternary and nowhere else. So for a California project with a DIR Project ID, a PWCR,
SSNs on file and a matching XSD hash — every condition `ecprChip` gates on cleared — the chip says
**"Generated"** for a file that does not exist and the download returns a JSON error whose text says the
filing screen will state which condition is unmet. It states the opposite.

`JOURNEY_VERIFIED.md:287` records that the eCPR was not exercised because no CA determination is in the
corpus. That is a narrower claim than the defect: the emitter is unreachable for *any* corpus.

**Why it matters.** The eCPR is a named deliverable in the product definition and a paid-tier boundary.
"Generated, not acceptance-tested" is a rendered claim about an artifact's existence, and it is false —
which is a `CORRECTIONS.md` unmeasured-claim failure in addition to a broken feature.

**Fix.** Two changes, both required. (1) Call `renderEcprXml` in `composeFiling` when `ecprChip` returns
`ready`, `recordArtifact` the result with `kind: 'ecpr_xml'`, and serve it from the route on the same
rebuild-and-compare-digest path the PDF uses. (2) Until (1) lands, make `ecprChip` return `blocked` with
the honest reason rather than rendering a link to a 409.

**And gate the emitter on status while you are in it.** `renderEcprXml` (`ecpr/render.ts:333`) never reads
`ArtifactStatus`. A filing that is `DRAFT — NOT CERTIFIABLE` — `contractValueBand: 'unknown'`, an
unresolved classification, an unproven premium bucket — will produce a complete, well-formed, submittable
eCPR document whose only DRAFT marker is an XML **comment** (`render.ts:412-420`), which DIR's parser
discards. The signature block is structurally withheld on the PDF (verified below) and structurally
unrepresentable in the XML, so the P-B refusal that governs the federal artifact simply does not exist on
the state one. `renderEcprXml` should refuse with P-B when
`verdict.status === 'DRAFT_NOT_CERTIFIABLE'`, for the same reason `checkXsdPin` refuses first: emitting a
document a portal will accept when we know its central certification is unsupported is worse than emitting
nothing.

---

## HIGH

### H-1 — Column 7A can exceed column 7B, and can exceed the cheque, with no block and no check

`src/engine/arithmetic/week.ts:379-383`

`col7A = Σ straightTimeCash + Σ doubleTimeCash + cwhssaPremium`, where `straightTimeCash` prices overtime
hours at `cashRate` and the premium is a separate computed addend. When the row shows an overtime rate
that is *not* `1.5 × regularRate`, the computed premium is not the premium that was paid, and 7A stops
being gross earned and becomes gross owed.

**Executed.** 36 ST + 8 OT, `cashRate = $20.00`, `otRate = $22.00`, `allWorkGross = $896.00`:

```
col7A (printed) = 920.00     actual cash = 36×20 + 8×22 = 896.00
col7B           = 896.00     col7A > col7B ?  true
blocks: []                   status: CERTIFIABLE
```

WHD defines 7A as *"gross amount earned … for hours worked on this Federal or federally assisted
project"* and 7B as *"the total gross amount earned during the week for all work performed."* 7A is a
subset of 7B by construction; a form where 7A exceeds 7B is internally impossible, and column 9's net
(`7B − Σ deductions`) will not reconcile against it. Nothing in the engine asserts `col7A ≤ col7B`.

`PREMIUM_BELOW_STATUTORY` does fire here with the $24.00 shortfall — which is the correct observation —
but it renders nowhere (C-2), so the only visible symptom is a contradictory pair of numbers.

**Fix.** Add the invariant as a check, not just a property: when `col7A > col7B` and `col7B > 0`, block
the line (`MISSING_REQUIRED_FIELD` is the closest existing member; the union wants a
`GROSS_EXCEEDS_ALL_WORK_GROSS`) and put the two figures side by side on the exception report. Separately,
decide explicitly in `ENGINE.md` §8 whether 7A is *earned* or *paid*, and say which on the artifact —
today it is silently the former while the statement of compliance certifies the latter.

### H-2 — Worker-scoped blocks vanish when the worker has no payroll lines, and the signature block renders

`src/engine/arithmetic/week.ts:319-336`, `src/engine/status.ts:70-100`

`workerBlocks` (`UNMAPPED_DEDUCTION`, `NET_RECONCILIATION_FAILED`, the missing-apprentice-level case) are
propagated to the artifact only by being spliced into each line's `blockReasons` (`week.ts:341-348`).
`deriveStatus` reads exactly two inputs: line `resolutionState`, and `filingBlockReasons`. There is no
worker channel. With `worker.lines === []` the splice iterates zero times and both blocks are lost.

**Executed.** One worker, no lines, `allWorkGross = $1,000.00`, one `UNMAPPED` deduction of $200.00,
`netPaid = $100.00` (a $700.00 reconciliation failure):

```
worker.blockReasons:      ["UNMAPPED_DEDUCTION","NET_RECONCILIATION_FAILED"]
filing.allBlockReasons:   ["UNMAPPED_DEDUCTION","NET_RECONCILIATION_FAILED"]
filing.filingBlockReasons: []
deriveStatusForFiling  →  CERTIFIABLE, signature block rendered
```

The artifact struct carries both block reasons *and* a signature block. 29 CFR 5.5(a)(3)(ii)(C)(2)
certifies *"that no deductions have been made … other than permissible deductions as set forth in 29 CFR
part 3"*; §9.3 D1 is explicit that guessing a category is forging that certification. Here the
certification is signed with an unmapped deduction on the payroll and a net that does not match the
cheque. P-13 ("any line with `resolutionState != resolved` ⟹ DRAFT") is satisfied vacuously by the empty
line list, which is why the property suite is green.

**Fix.** Give `deriveStatus` the third channel it is missing:

```ts
readonly workerBlockReasons?: readonly BlockReason[];
```

populated in `deriveStatusForFiling` from `computation.workers.flatMap(w => w.blockReasons)`, and treated
identically to `filingBlockReasons`. Then stop splicing worker blocks into lines, which is a lossy
work-around for the missing channel. Add the boundary case to `tests/engine/boundaries.test.ts`: a worker
with zero lines and each worker-scoped block in turn must produce `DRAFT_NOT_CERTIFIABLE`.

### H-3 — An unfunded fringe plan cannot be represented, so its credit is silently accepted into column 6B and into `paidTotal`

`src/lib/types.ts:273-276`, `src/lib/types.ts:406-421`, `src/engine/arithmetic/fringe.ts:78`

```ts
export interface FringePlanCredit {
  readonly planName: string;
  readonly hourlyCredit: MilliRate;
}
```

`ENGINE.md` §6.1 and §13 both require: *"A `FringePlanCredit` flagged `unfunded: true` blocks the line with
`UNFUNDED_PLAN_CREDIT` and the exception report describes the 5.28(c) approval path."* There is no
`unfunded` field, `UNFUNDED_PLAN_CREDIT` is not a member of `BlockReason`, and `grep -rn "unfunded" src/`
finds it only in marketing copy (`page.tsx:942`, `legal/page.tsx:94`) and in a citation constant
(`citations.ts:44`) that nothing calls.

**Consequence.** 29 CFR 5.28(b)(5) conditions a bona fide unfunded plan on the contractor having
*"request[ed] and receive[d] approval of the plan or program from the Secretary."* Absent that, the credit
is not creditable. Ratepin narrows it at N1 into `col6B`, prints it in column 6B, checks box 5 of the
statement of compliance from it (`week.ts:461-473`), and — the part that matters — adds it to `paidTotal`
(`compliance.ts:107`), where it can carry a line over `requiredTotal` and suppress `WD_UNDERPAYMENT`
outright. The landing page tells the customer we refuse unfunded plans; the engine credits them.

**Fix.** Add `readonly unfunded: boolean` to `FringePlanCredit` (required, no default — the same
discipline `contractValueBand` gets, and for the same reason), add `UNFUNDED_PLAN_CREDIT` to
`BlockReason`, block in `validateLine`, and add the P-A refusal quoting 5.28(b)(5) with the 5.28(c) path.
Until the field exists, either delete the marketing claim or block every `col6B > 0` line — the current
state asserts a refusal that does not happen.

### H-4 — `PREMIUM_BELOW_STATUTORY` accuses the contractor on DOL's own compliant worked example, and the accusation is pinned as expected

`src/engine/arithmetic/compliance.ts:185-201`; `src/engine/canary/fixtures.ts:339, 379, 529`

The flag fires whenever `premiumOwed > premiumPaidTotal`, and `premiumPaidTotal` (`cwhssa.ts:316-329`)
counts only buckets with a **stated rate**. A payroll export with no overtime-rate column therefore
produces `premiumPaidTotal = 0` and a shortfall equal to the entire statutory premium — on every week with
over-forty hours.

Three class-1 fixtures pin exactly that: `F-FOH-15k11a/case-1` and `/case-2` both expect
`PREMIUM_BELOW_STATUTORY:-:$24.00`, and `F-PWRB-44h` expects `:$54.00`. These are the DOL examples the
document holds up as **correct** computations — FOH 15k11(a) publishes $662.00 total with the $24.00
premium *included as owed and paid*. On the same artifact, `col7A` already carries that $24.00 as gross
earned. So the page would say, of the same dollars, both "earned" and "not paid."

`ENGINE.md` §10 asserts the two never disagree on a rendered artifact because "unproven hours in a week
with statutory overtime have already blocked the line at P-A." That reasoning holds only for `SELF_PRICED`
buckets (`dt`). `ot` is not self-priced, so `unprovenPremiumHours` is zero, nothing blocks, and the
artifact renders certifiable with the contradiction on it. The stated invariant is false.

It is currently invisible only because of C-2. Fixing C-2 without fixing this ships the contradiction.

**Fix.** Make the flag an observation about evidence rather than about absence of evidence: fire only when
at least one premium bucket in the week carries a stated rate and the stated rates fall short. When no
bucket carries a rate, the honest artifact line is a **P-D**: *"This payroll export reports no overtime
rate. Ratepin computed the CWHSSA premium of $X and included it in column 7A; Ratepin does not determine
whether it was paid."* Then re-derive the three fixture expectations — they are class-1 on the money
figures, but `filing.findings` is our own field and the current expectation encodes our bug, not DOL's
answer.

---

## MEDIUM

### M-1 — The production text of 29 CFR 3.5(j) is truncated mid-condition and is presented as verbatim

`src/app/(free)/_lib/obligations.ts:59-65`

The shipped runtime text ends: *"… and if the cost on which the deduction is based does not exceed the
actual cost to the contractor."* The eCFR text (fetched 2026-08-11) continues: *"… to the contractor
**where the equipment is purchased from the contractor and does not include any direct or indirect
monetary return to the contractor where the equipment is purchased from a third person, and if the
deduction is either: (1) Voluntarily consented to by the laborer or mechanic in writing and in advance …
or (2) Provided for in a bona fide collective bargaining agreement …**"*

Three of the paragraph's five conditions are missing, including both consent alternatives. The module
docblock states *"(i) and (j) are verbatim"*; `src/lib/types.ts` documents `Refusal.rule` as verbatim
regulatory text; `deductionConditionsDeclined` (`exceptions.ts:222`) passes this string straight into that
field. The truncation also changes the meaning — it removes the conditions a reader would need in order to
check the deduction themselves, which is the entire purpose of the P-D.

The canary fixture (`canary/fixtures.ts:329-344`) carries the **complete** text, so every test reads the
correct string and no test reads the one production serves. That asymmetry is why this survived.

**Fix.** Replace `PARAGRAPH_TEXT.j` (and audit `.i`) with the eCFR text byte-for-byte, and add a test that
`obligations.ts`'s transcription equals the canary fixture's, character for character. Better: have one
constant and import it in both places.

### M-2 — `rateCell` is a second rounding function outside `money.ts`, and column 6A prints a rate the arithmetic did not use

`src/artifacts/wh347/project.ts:104-111`

```ts
const cents = Math.round(magnitude / 100);
```

`ENGINE.md` §11.3's replacement for the withdrawn grep is a **type boundary**: `Cents` is obtainable from a
wider quantity only through `Cents.fromMicroDollars` / `Cents.fromRatio`, and `roundHalfUpToCents` is
module-private. `rateCell` sidesteps it by rounding a `MilliRate` to cents and emitting a string, so it is
outside the boundary by type while being inside it by function.

**Executed**, with a sub-cent rate — the class G-SUBCENT exists to force into the generators because
payroll systems export them:

```
cashRate = $20.0050 (200050), 40.00 h
col6A straight time prints:  20.01
col5 prints:                 40.00
col7A / straightTimeCash:    800.20        6A × col5 = 800.40      divergence $0.20
```

An auditor or a general contractor multiplying the two printed cells gets a number the form does not
carry, on a week where nothing is wrong. `MilliRate.fromDecimalString` refuses to truncate a customer's
rate on the way in — *"silently truncating a customer's rate is a decision about their money that we are
not entitled to make without telling them"* — and then the renderer does exactly that on the way out.

**Fix.** Print 6A at the precision the rate carries (trailing zeros stripped past two decimals, which is
what `MilliRate.toDecimalString` already does), or keep two decimals and add a per-line exception line
naming the exact rate used. Either way, move the function into `money.ts` beside the narrowing so §11.3's
boundary check covers it.

---

## LOW

### L-1 — The eCPR footer hardcodes the unresolved-line count, so the XML's DRAFT sentence disagrees with the PDF's

`src/artifacts/ecpr/render.ts:451-461` passes `unresolvedLineCount: 0` unconditionally.
`draftSentence` (`provenance.ts:180-190`) branches on it: at zero the subject becomes *"This filing is
unresolved"*, where the PDF for the same filing says *"3 payroll lines are unresolved."* One artifact, two
descriptions of the same fact. `ecprFooter` already receives `computation`; count from it.

### L-2 — `AMBIGUOUS_RATE_BASIS` is doing duty for a block reason the union does not have

`src/engine/arithmetic/week.ts:153`. §8.1's P-17 names `CASH_IN_LIEU_EXCEEDS_CASH_RATE`; the code maps it
onto `AMBIGUOUS_RATE_BASIS` and says so in a comment. Verified: a line with `cashInLieu = $25.00` against
`cashRate = $20.00` blocks with `AMBIGUOUS_RATE_BASIS`. The block is correct and the artifact is DRAFT, so
nothing unsafe ships — but the customer reads a reason that does not describe their input, and the exception
sentence cannot tell them which of the two rate columns to fix. Add the member to `BlockReason` and its
refusal.

### L-3 — The Method-2 (FLSA §7(g)(2)) path specified in §7.5 does not exist

`PayrollWeek` carries no `section7g2Agreement` field (`src/lib/types.ts:394-400`), so condition (i) can
never hold and Method 1 is always computed. `canary/fixtures.ts:443-459` records this honestly and the
fallback is the conservative direction (Method 1 pays $21.82 where Method 2 pays $24.00 — falling back to
the method that pays *less* here, note, which is the opposite of §7.5's stated safety argument on this
particular example). Worth checking that the exception report *says* Method 1 was used and why; §7.5
requires it and I found no sentence that does.

---

## What I re-derived and found correct

Recorded so the next reviewer does not redo it. `baseRate = max(BHR_WD, cashRate − cashInLieu)` against all
four 5.32(c)/FOH oracles; the floor applied per-classification to straight time and **not** re-applied to
the weighted average (E4 — `regularRate` is a bare `Cents.fromRatio`, and the painter/electrician week
returns exactly $10.91 / $21.82); `hoursWorked = Σ(st+ot+dt)` with no column label removing an hour;
`statutoryOtHours = max(0, hours − 4000)` with the 40.00/40.01 boundary correct; `SELF_PRICED = {dt}` and
the 1.5× proof test exact in integer arithmetic (`onePointFiveTimes`, `halfOf` — both provably integral at
every call site); `premiumCredit` capped at `premiumOwed` and `cwhssaPremium` never negative; `col6B`/`col6C`
as weekly totals over **all** hours including overtime; `col6C` counted once inside 7A and never added
(F-M3-CIL's $1,534.92 holds); `col6B` outside 7A; deductions against 7B not 7A; net reconciled not computed;
the ten 3.5 paragraphs matching the eCFR exactly, with (i) and (j) mapping and never blocking; the band gate
zeroing the premium at `at_or_under_100k` and producing P-B at `unknown`; `WD_UNDERPAYMENT` genuinely
ungated by the band; half-up narrowing at the enumerated sites with `-0` deliberately suppressed;
`Cents.fromRatio` throwing rather than dividing by zero hours; no `parseFloat` anywhere in the money path;
`money()`, `hoursCell()` and `hoursTotal()` doing integer digit-splitting with no locale.

**On the artifact.** The provenance footer's five lines are present in the extracted PDF text (claim,
freshness, band, build, boundary) and carry what they claim — the WD number, revision and publish date in
the header field match the provenance struct, and `shortHash` never presents a truncated digest as the
digest. The DRAFT signature block is **structurally absent**, not hidden: `drawWithheldBlock`
(`render.ts:1074`) emits a double-ruled box with no `page.line` call and no signatory name, and
`drawSignatureBlock` is not invoked at all — a photocopy of the withheld block is still not signable. The
PDF writer reads no clock, no RNG (`/ID` is a digest of the body) and no locale, and emits uncompressed
streams, so the byte-level golden gate is meaningful. `projectWh347` performs no arithmetic beyond digit
splitting; the projection's column-8 sub-columns provably add to the category total; the FICA/withholding
split is never guessed from a free-text label.

**On the eCPR validator.** It is honest about its scope in the code (`validate.ts` docblock, `rulesApplied`)
and does not claim full XSD processing, and the three hashes — pinned, observed, shipped — are kept
distinct with the shipped transcription never presented as DIR's digest. That is the right shape. It is
just unreachable (C-3).
