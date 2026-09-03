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

## 2. The three states — the product's core claim

| state | means | trigger |
|---|---|---|
| `met` | the certificate evidences the requirement | limit ≥ min; coverage present and in force; endorsement **form page attached** naming an accepted form |
| `gap` | the certificate contradicts it | limit < min; coverage absent; policy expired at evaluation date; `ADDL INSD = N`; name/holder mismatch |
| **`asserted_only`** | the certificate *claims* it but does not prove it | `ADDL INSD`/`SUBR WVD` = `Y`, or blanket wording in Description of Operations, **with no endorsement page attached** |

ACORD 25 prints, on its face, that *"a statement on this certificate does not confer rights to the
certificate holder in lieu of such endorsement(s)"* (KB §A.1). Rendering `Y` as a green tick is the
category's standard lie; rendering it as a red gap would flag most compliant vendors and make the
product uninstallable. The third state is the product (`BACKLOG.md` §0, D1).

A fourth, non-judgment state exists for honesty: **`not_checked`**, used when Certly structurally
cannot evaluate a requirement (A.M. Best rating, `OQ-4`). It appears in every report as
"not checked by Certly", never silently omitted.

## 3. Algorithm

```
compare(extraction, requirementSet, evaluationDate) → ComparisonResult
```

1. **Resolve** the coverage rows: group `extraction.coverages` by `type`; join `insr_letter` to insurers.
2. **Per requirement**, in `sortOrder`:
   - `coverage_present` → is there a row of that `type` (or `type_label_raw === otherLabel`)?
   - `limit` → find the row and label. `amount === null` (raw was `Excluded`, `STATUTORY`, an SIR) →
     `needs_review`, never a numeric comparison. If `combinable`, sum the primary limit with any
     `umbrella_liability`/`excess_liability` row's matching limit before comparing.
   - `endorsement` → §4.
   - `policy_condition` → `formBasis`, `aggregateAppliesPer`, `maxSir`, `wcStopGapStates`.
   - `carrier` → `not_checked` at MVP.
3. **Cross-cutting checks** (always run, not template rows):
   - **Name match**: `insured.name` vs. `vendors.legalName ?? vendors.name`.
   - **Holder match**: `certificate_holder` vs. `organisations.entityBlock`.
   - **Dates**: every required coverage in force on `evaluationDate`; `policy_exp` ≥ `evaluationDate`.
4. **Roll up** to a vendor status: `expired` > `gap` > `expiring` (earliest required expiry within 30
   days) > `asserted_only` > `covered`. Highest severity wins; `advisory` requirements never
   contribute to `gap`.
5. **Explain**: every result carries `explanation` — a templated sentence with the requirement, the
   found value and the `raw` text — and `evidence` (JSON pointers into the extraction payload).

**Name and holder matching** — normalise: uppercase, strip punctuation and `&`→`AND`, collapse
whitespace, strip a trailing entity suffix from {`INC`,`LLC`,`L.L.C.`,`CORP`,`CORPORATION`,`CO`,`LTD`,
`LP`,`LLP`,`PC`,`PLLC`,`DBA`}. Exact match after normalisation → `met`. Anything else → **`needs_review`,
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
  status,               // 'covered'|'asserted_only'|'expiring'|'gap'|'expired'|'needs_review'
  metCount, gapCount, assertedOnlyCount, notCheckedCount, needsReviewCount,
  earliestRequiredExpiry: date
}

comparisonResults {
  id, comparisonId, requirementId,
  state,                // 'met'|'gap'|'asserted_only'|'not_checked'|'needs_review'
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
- a comparison requires a `ready` extraction; `needs_review` extractions are not compared
- `advisory` requirements never raise `status` above `covered`

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
**A7** Given a GL limit box whose `raw` is `Excluded` and `amount` is null, Then `needs_review`, never
`gap` and never `met`.
**A8** Given `insured.name` "ACME ROOFING, INC." and vendor "Acme Roofing Inc", Then the name check is
`met`. Given "Acme Roofing of Texas LLC", Then `needs_review`.
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
| Certificate holder is a managing agent, not the owner entity | holder match → `needs_review`; the org can add alternate accepted holder strings in settings |
| WC in a monopolistic state (WA/OH/WY/ND) showing only "statutory" | `gap` on employers' liability with the stop-gap explanation (KB §B.2) |
| Certificate dated in the future | evaluate normally; note it |
| Requirement set changed after the comparison | old comparison retained with its version; a "requirements changed — re-evaluate" banner appears |
| Coverage row present with zero limits | `gap` on any limit requirement for that coverage, `met` on `coverage_present` |

## 10. Errors

The engine does not throw on data it cannot interpret; it emits `needs_review` with an explanation.
The only exception is a structurally impossible input (missing extraction payload), which fails the job
and alerts admin.

## 11. Analytics

`comparison_run{requirements,met,gaps,asserted_only,not_checked,needs_review,ms,engine_version}`,
`gap_detected{requirement_kind,coverage}`, `asserted_only_detected{endorsement_key}`,
`explanation_opened{state}`, `reevaluation_triggered{cause}`.

`asserted_only_detected` is the metric that proves or kills D1: if it fires on a large share of real
certificates and customers act on it, the differentiator is real.

## 12. Test plan

**Property tests** — the engine is pure, so it can be tested hard:
- determinism: 1,000 random (extraction, requirement set) pairs, run twice, byte-identical
- monotonicity: raising a `minAmount` never turns a `gap` into a `met`
- state totality: every requirement produces exactly one of the five states, never zero, never two

**Table tests** — one per rule in §3 and §4, including every "three rules from real documents".

**Golden comparisons** — the 16 real fixtures from `specs/03-coi-extraction.md` §15 crossed with
`gc.baseline`, `pm.commercial.baseline` and `hoa.baseline`; expected results committed. This is the
regression net for the rules, and it runs on **recorded extractions**, so it is free and offline.

**Integration (PGlite):** requirement-set version pinning; timezone boundary at 23:59 / 00:01.
