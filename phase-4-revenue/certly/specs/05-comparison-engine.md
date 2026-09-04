# Spec M5 — Comparison engine

**Backlog item:** M5 (Must). **Effort:** M. **Depends on:** M2 (requirements), M4 (extraction);
`KNOWLEDGE_BASE.md` §B.4, §C.
**Invariant: this module makes no model call.** It is pure, deterministic TypeScript over two inputs
(an extraction payload, a requirement set version) and it must produce byte-identical output for the
same pair, forever. A comparison a customer forwards to their owner has to be reproducible.

## 1. Story

> As a manager I see, per vendor, exactly which requirements the certificate meets, which it fails, and
> which it only **claims** — and for each one, the sentence explaining why, quoting what the document
> actually said.

## 2. The five requirement states — the product's core claim

**This table is the canonical requirement-state list.** `specs/06`, `specs/12`, `specs/15`, `UX.md`,
`OFFER.md` and `LANDING_SPEC.md` copy these five names verbatim and invent none of their own
(REVIEW.md §2.2). The status vocabulary is settled in REVIEW.md §2.1: the green word is
**"Meets requirements"**, the engine value is `meets` at vendor level and `met` at requirement level,
and **"Covered" is not a status word anywhere in the product**.

| state | status state it renders as | pill / word shown | means | trigger |
|---|---|---|---|---|
| `met` | `meets` | **Meets requirements** (pill `MEETS`) | the certificate evidences the requirement | limit ≥ min; coverage present and in force; endorsement **form page attached** naming an accepted form |
| `gap` | `gap` | **Gap** | the certificate contradicts it | limit < min; coverage absent; policy expired at evaluation date; `ADDL INSD = N`; name/holder mismatch |
| **`asserted_only`** | `asserted_only` | **Claimed, not evidenced** | the certificate *claims* it but does not prove it | `ADDL INSD`/`SUBR WVD` = `Y`, or blanket wording in Description of Operations, **with no endorsement page attached** |
| `not_checked` | `not_checked` | **Not checked** | Certly structurally cannot evaluate it | carrier rating (`OQ-7`); anything outside launch scope |
| **`undetermined`** | `needs_review` | **Needs review** | the document was read but this requirement cannot be decided from it | a limit box whose `raw` is `Excluded` / `STATUTORY` / an SIR (`amount === null`); a name or holder that does not normalise-match |

**The engine value is `undetermined`; the status state it paints is `needs_review`** (REVIEW.md MN-04
plus the identity arbitration). The two are deliberately different words at different layers: at
**data** level `needs_review` already means something else — an *extraction* status in `specs/03` §8 —
and one word with two scopes is how a counter and a report drift apart; at **display** level both
mean the same thing to the reader ("a human should look at this"), so they share the identity's
`needs_review` state, its word, its question-mark-in-a-square glyph and its dot-grid pattern.

### 2.1 The three state machines and the seven status states

The **data** layer has three state machines. The **visual** layer has the seven status states
arbitrated in `IDENTITY.md` §6.4 (`meets` · `expiring` · `asserted_only` · `gap` · `needs_review` ·
`not_checked` · `no_certificate`), each with a word, a glyph, a fill pattern and a hue, certified by
`identity/contrast.py`. Every data state maps onto exactly one status state:

| level | data states | → status state |
|---|---|---|
| requirement (`specs/05` §2) | `met` · `gap` · `asserted_only` · `not_checked` · `undetermined` | `meets` · `gap` · `asserted_only` · `not_checked` · `needs_review` |
| vendor (`specs/06` §3) | `expired` · `gap` · `expiring` · `asserted_only` · `meets` · `no_certificate` | `gap` (with the word **"Expired"**) · `gap` · `expiring` · `asserted_only` · `meets` · `no_certificate` |
| document (`specs/03` §8) | `pending` · `running` · `needs_review` · `ready` · `rejected` · `failed` | chrome, `needs_review`, chrome, `meets`-neutral, `gap`, `gap` |

**One open item for the Brand Director (recorded in `REVIEW_RESPONSE.md` under B-03).** The seven
status states have no row for **`expired`**, which is a distinct and frequent vendor state. Until they
add one, `expired` renders in the **`gap`** ramp with its **own word, "Expired"** — safe, because
`contrast.py` hard-fails a duplicated *word*, and "Expired" and "Gap" are different words carrying
different facts (lapsed vs short). If the Brand Director prefers an eighth row with its own glyph,
nothing in this spec changes but the mapping cell above.

ACORD 25 prints, on its face, that *"a statement on this certificate does not confer rights to the
certificate holder in lieu of such endorsement(s)"* (KB §A.1). Rendering `Y` as a green tick is the
category's standard lie; rendering it as a red gap would flag most compliant vendors and make the
product uninstallable. The third state is the product (`BACKLOG.md` §0, D1).

`not_checked` is a non-judgment state and exists for honesty: it appears in every report as
"not checked by Certly", never silently omitted, and never folded into a green count.

## 3. Algorithm

```
compare(extraction, requirementSet, evaluationDate) → ComparisonResult
```

1. **Resolve** the coverage rows: group `extraction.coverages` by `type`; join `insr_letter` to insurers.
2. **Per requirement**, in `sortOrder`:
   - `coverage_present` → is there a row of that `type` (or `type_label_raw === otherLabel`)?
   - `limit` → find the row and label. `amount === null` (raw was `Excluded`, `STATUTORY`, an SIR) →
     `undetermined`, never a numeric comparison. If `combinable`, sum the primary limit with any
     `umbrella_liability`/`excess_liability` row's matching limit before comparing.
   - `endorsement` → §4.
   - `policy_condition` → `formBasis`, `aggregateAppliesPer`, `maxSir`, `wcStopGapStates`.
   - `carrier` → `not_checked` at MVP.
3. **Cross-cutting checks** (always run, not template rows):
   - **Name match**: `insured.name` vs. `vendors.legalName ?? vendors.name`.
   - **Holder match**: `certificate_holder` vs. `organisations.entityBlock`.
   - **Dates**: every required coverage in force on `evaluationDate`; `policy_exp` ≥ `evaluationDate`.
4. **Roll up** to a vendor status: `expired` > `gap` > `expiring` (earliest required expiry within 30
   days) `expiring` > `asserted_only` > `meets`; a vendor with no active certificate at all is
   `no_certificate` and is outside this precedence chain. Highest severity wins; `advisory`
   requirements never contribute to `gap`.
5. **Explain**: every result carries `explanation` — a templated sentence with the requirement, the
   found value and the `raw` text — and `evidence` (JSON pointers into the extraction payload).

**Name and holder matching** — normalise: uppercase, strip punctuation and `&`→`AND`, collapse
whitespace, strip a trailing entity suffix from {`INC`,`LLC`,`L.L.C.`,`CORP`,`CORPORATION`,`CO`,`LTD`,
`LP`,`LLP`,`PC`,`PLLC`,`DBA`}. Exact match after normalisation → `met`. Anything else → **`undetermined`,
never an automatic pass and never an automatic gap.** Fuzzy matching here is how "Acme Roofing LLC" gets
credited for "Acme Roofing of Texas LLC"'s policy, and that error is a denied claim.

## 4. Endorsement evaluation

For each endorsement requirement with `acceptsForms: string[]`:

```
normalise a form number → base three-part number + optional edition
                          (KB §C.5: 'CG2001' ≡ 'CG 20 01'; 'CG 24 04 05 09' → base 'CG 24 04', ed '05 09')

attached   = endorsement_forms_mentioned where context = 'attached_endorsement_page'
            and base ∈ acceptsForms                                       → met
mentioned  = endorsement_forms_mentioned where context = 'description_of_operations'
            and base ∈ acceptsForms                                       → asserted_only
column     = the coverage row's addl_insd / subr_wvd = 'Y'                → asserted_only
unknown    = a form number present but not in acceptsForms                → asserted_only,
                                                                             with the number shown
none of the above, and the column is 'N' or null                          → gap
```

Three rules taken directly from real documents:
- **An unrecognised form number is never a gap.** Corpus C2 carries `RSCG0303`, a carrier proprietary
  additional-insured form. Treating unknown as absent would fail a compliant vendor.
- **`conditional: true`** ("where required by written contract") is recorded and displayed. It is
  weaker than a scheduled endorsement naming the holder. Certly shows the distinction and does not
  adjudicate it.
- **GL waiver ≠ WC waiver.** Two requirements, two policies. `SUBR WVD = Y` on the GL row says nothing
  about workers' compensation (KB §C.3).

## 5. Data model (Drizzle-ready)

```ts
comparisons {
  id, orgId, vendorId, certificateId,
  requirementSetId, requirementSetVersion,     // WHICH version was evaluated — reports must be reproducible
  engineVersion: text,                          // bumped on any rule change; a report names it
  evaluatedAt: timestamp,
  status,               // vendor level: 'meets'|'asserted_only'|'expiring'|'gap'|'expired'|'no_certificate'
                        //   ('covered' was the first draft's name for 'meets' — retired, REVIEW.md B-02)
  metCount, gapCount, assertedOnlyCount, notCheckedCount, undeterminedCount,
  earliestRequiredExpiry: date
}

comparisonResults {
  id, comparisonId, requirementId,
  state,                // 'met'|'gap'|'asserted_only'|'not_checked'|'undetermined'
  foundAmount: bigint,  foundRaw: text,  foundForm: text,  conditional: boolean,
  explanation: text,
  evidence: jsonb       // JSON pointers into extractions.payload
}
```

`engineVersion` + `requirementSetVersion` + `extractionId` is the full provenance of any statement
Certly ever makes about a vendor. An exported report (M12) prints all three.

## 6. Server actions

| action | signature |
|---|---|
| `runComparison` (job) | `({ certificateId }) → comparisonId` |
| `getComparison` | `(vendorId) → ComparisonView` (latest active) |
| `explainResult` | `(comparisonResultId) → { explanation, evidence, documentPage }` |
| `reevaluateVendor` | `(vendorId) → comparisonId` (manual re-run; also on requirement-set change) |

## 7. Validation

- `evaluationDate` is always the org's local "today" at 00:00 in `organisations.timezone`.
  A certificate expiring "today" in Los Angeles must not read as expired to a UTC server at 09:00.
- a comparison requires a `ready` extraction; `needs_review` **extractions** are not compared.
  In the product a human clears that queue (`specs/06` §3); on the anonymous Free Gap Report there is
  no human, so `specs/15` §4 must **name** those documents in the report rather than drop them
  (REVIEW.md B-09)
- `advisory` requirements never raise `status` above `meets`

## 8. Acceptance criteria

**A1** Given a requirement of GL each occurrence ≥ $1,000,000 and a certificate showing $1,000,000,
Then the result is `met` and the explanation reads "General liability each occurrence is $1,000,000;
you require $1,000,000."
**A2** Given the same requirement and a certificate showing $500,000, Then `gap`, with both numbers in
the explanation.
**A3** Given a requirement for additional insured (ongoing) accepting `CG 20 10`, and a certificate with
`ADDL INSD = Y` and no attached endorsement page, Then **`asserted_only`**, and the explanation reads
"The certificate says additional insured, but no endorsement page was provided. A statement on a
certificate does not confer additional-insured status."
**A4** Given the same requirement and an upload that includes a `CG 20 10 04 13` endorsement page,
Then `met`.
**A5** Given corpus `story-county-ia-coi.pdf` and requirements for additional insured, primary and
non-contributory, and GL waiver of subrogation, Then all three are `asserted_only`, the explanation
names `RSCG0303`, `CG2001` and `CG2404` respectively, and each is flagged conditional.
**A6** Given a requirement of GL $5,000,000 with `combinable: true`, a GL row of $1,000,000 and an
umbrella row of $4,000,000, Then `met`, and the explanation names both policies.
**A7** Given a GL limit box whose `raw` is `Excluded` and `amount` is null, Then `undetermined`, never
`gap` and never `met`.
**A8** Given `insured.name` "ACME ROOFING, INC." and vendor "Acme Roofing Inc", Then the name check is
`met`. Given "Acme Roofing of Texas LLC", Then `undetermined`.
**A9** Given a required coverage whose `policy_exp` is yesterday in the org's timezone, Then the vendor
status is `expired`.
**A10** Given a carrier-rating requirement, Then `not_checked`, and it appears as "not checked by
Certly" in the dashboard and in every export.
**A11** Given the same `(extractionId, requirementSetVersion, engineVersion, evaluationDate)`,
When the comparison is run twice, Then the two `comparisonResults` sets are byte-identical.

## 9. Edge cases

| case | behaviour |
|---|---|
| Two GL rows on one certificate (primary + a second insurer) | evaluate against the **best** matching row and name it; do not sum unless `combinable` |
| Umbrella present but the template has no umbrella requirement | ignored for `met`/`gap`; still shown on the vendor page |
| Certificate holder is a managing agent, not the owner entity | holder match → `undetermined`; the org can add alternate accepted holder strings in settings |
| WC in a monopolistic state (WA/OH/WY/ND) showing only "statutory" | `gap` on employers' liability with the stop-gap explanation (KB §B.2) |
| Certificate dated in the future | evaluate normally; note it |
| Requirement set changed after the comparison | old comparison retained with its version; a "requirements changed — re-evaluate" banner appears |
| Coverage row present with zero limits | `gap` on any limit requirement for that coverage, `met` on `coverage_present` |
| An `OTHER:` coverage row (Professional, Cyber) | matched on `type_label_raw`, and the limit matched on **`label_raw`** (`specs/03` §4, REVIEW.md MJ-18) when the template names it; `not_checked` when it does not |

## 10. Errors

The engine does not throw on data it cannot interpret; it emits `undetermined` with an explanation.
The only exception is a structurally impossible input (missing extraction payload), which fails the job
and alerts admin.

## 11. Analytics

`comparison_run{requirements,met,gaps,asserted_only,not_checked,undetermined,ms,engine_version}`,
`gap_detected{requirement_kind,coverage}`, `asserted_only_detected{endorsement_key}`,
`explanation_opened{state}`, `reevaluation_triggered{cause}`.

`asserted_only_detected` is the metric that proves or kills D1: if it fires on a large share of real
certificates and customers act on it, the differentiator is real.

## 12. Test plan

**Property tests** — the engine is pure, so it can be tested hard:
- determinism: 1,000 random (extraction, requirement set) pairs, run twice, byte-identical
- monotonicity: raising a `minAmount` never turns a `gap` into a `met`
- state totality: every requirement produces exactly one of the five states in §2, never zero,
  never two; and no code path can emit the string `covered` (an explicit test — REVIEW.md B-02)

**Table tests** — one per rule in §3 and §4, including every "three rules from real documents".

**Golden comparisons** — the 17 real fixtures from `specs/03-coi-extraction.md` §15 (G1–G17) crossed with
`gc.baseline`, `pm.commercial.baseline` and `hoa.baseline`; expected results committed. This is the
regression net for the rules, and it runs on **recorded extractions**, so it is free and offline.

**Integration (PGlite):** requirement-set version pinning; timezone boundary at 23:59 / 00:01.
