# Spec M2 — Requirement templates and the requirement editor

**Backlog item:** M2 (Must). **Effort:** L. **Depends on:** M1; `KNOWLEDGE_BASE.md` §B (the library),
§C (endorsement glossary), §F.2 (the disclaimer).

## 1. Story

> As a general contractor I choose "commercial GC — subcontractors", get a starting set of limits and
> endorsements that shows me **where each number came from and when it was checked**, and I edit it to
> match my own subcontract in ten minutes instead of an afternoon.

This is differentiator **D3** (`BACKLOG.md` §0). Per-vendor-type templates are table stakes; templates
that cite a dated, fetchable source are not.

## 2. Flow

```
onboarding / settings
  → pick audience: property manager | HOA | general contractor | commercial landlord
  → library shows the templates for that audience (KB §B)
  → preview: every row with its limit, its source link and its "last checked" date
  → apply → creates a requirement_set (a COPY, versioned; never a live reference to the library)
  → editor: add / edit / remove rows, rename, duplicate for another vendor type
  → assign: default for the org, and per vendor_type
```

**A template is copied, not referenced.** When we update the library next quarter, no customer's
requirements change under them. They see "a newer version of this template is available — see what
changed", and choose.

## 3. Screens

| screen | route | notes |
|---|---|---|
| Template library | `/requirements/library` | grouped by audience; each card shows coverage summary and a "sourced from N documents" badge |
| Template preview | `/requirements/library/[templateId]` | full row list; every row's source is a link that opens the actual URL, plus `last_verified` |
| Requirement set editor | `/requirements/[setId]` | rows grouped: **Coverages → Limits → Endorsements → Policy conditions → Carrier**. Live "what this will check" preview panel. |
| Assignment | `/requirements` | table of vendor types → requirement set; org default at the top |
| Diff | `/requirements/[setId]/changes` | when a library update exists: what would change, row by row |

**Every one of these screens carries the §F.2 disclaimer**, not in a footer but adjacent to the limits.

## 4. Data model (Drizzle-ready)

```ts
// The library ships as JSON in the repo (src/lib/kb/templates/*.json) — content, not rows.
// Customer data is these tables:

requirementSets {
  id, orgId, name, audience,                       // 'pm'|'hoa'|'gc'|'tenant'
  sourceTemplateId,                                // 'gc.trade.high_hazard' | null if hand-built
  sourceTemplateVersion,                           // the library version copied from
  version: integer,                                // bumped on every save; comparisons record which they used
  isOrgDefault: boolean,
  createdAt, updatedAt, createdBy
}

requirements {
  id, requirementSetId, orgId,
  kind,          // 'limit' | 'coverage_present' | 'endorsement' | 'policy_condition' | 'carrier'
  coverage,      // 'general_liability'|'automobile_liability'|'umbrella_liability'|
                 // 'excess_liability'|'workers_compensation'|'other'  (null for carrier)
  limitLabel,    // closed set, KB §A.3 (kind='limit')
  minAmount:     bigint,
  combinable:    boolean,        // may be met by this coverage + umbrella/excess together (KB §B.0)
  endorsementKey,// 'additional_insured_ongoing'|'additional_insured_completed'|
                 // 'primary_non_contributory'|'waiver_of_subrogation_gl'|'waiver_of_subrogation_wc'|
                 // 'auto_additional_insured'|'auto_waiver_of_subrogation'
  acceptsForms:  jsonb,          // string[] — ALWAYS a list (KB §B.0)
  condition:     jsonb,          // {formBasis:'occurrence'} | {aggregateAppliesPer:'project'} |
                                 // {maxSir: 25000} | {wcStopGapStates:['WA','OH','WY','ND']} |
                                 // {amBestMin:'A-', financialSizeMin:'VIII'}
  otherLabel:    text,           // matches coverages.type_label_raw when coverage='other'
  severity,      // 'blocking' | 'advisory'   — advisory rows appear in reports but never mark a vendor red
  note:          text,
  sortOrder:     integer
}

vendorTypes { id, orgId, key, label, requirementSetId, createdAt }
```

**`severity` earns its place** because customers routinely want a requirement tracked but not
enforced — a $5M umbrella they ask for and rarely get. Without it they delete the row and stop
tracking it entirely.

## 5. Server actions

| action | signature | notes |
|---|---|---|
| `listTemplates` | `(audience) → TemplateSummary[]` | reads the repo JSON, not the DB |
| `applyTemplate` | `(templateId, name?) → requirementSetId` | deep copy incl. `sources`; stamps `sourceTemplateVersion` |
| `createRequirementSet` | `(name, audience) → id` | empty set |
| `upsertRequirement` | `(setId, requirement) → RequirementSetView` | bumps `requirementSets.version` |
| `deleteRequirement` | `(setId, requirementId) → RequirementSetView` | bump version |
| `assignRequirementSet` | `(vendorTypeId \| 'org_default', setId) → void` | enqueues bulk re-evaluation (SH-8; at MVP, re-evaluates on next certificate) |
| `previewTemplateUpdate` | `(setId) → Diff` | library version vs. the copy |

## 6. Validation

- `minAmount` ∈ [1, 1,000,000,000]; entered as digits, rendered with separators; **`0` is rejected** —
  a zero minimum means "do not check", which is what deleting the row is for
- a set must have ≥ 1 requirement before it can be assigned
- `acceptsForms` entries are of two kinds and **both are valid**:
  - an **ISO/NCCI-shaped** number, normalised to `^[A-Z]{2}\s?\d{2}\s?\d{2}(\s?\d{2}\s?\d{2})?$`
    (`CG2001` ≡ `CG 20 01`; `CG 24 04 05 09` keeps its edition);
  - a **carrier proprietary form**, free text, `^[A-Z0-9][A-Z0-9 .\-]{2,29}$`, stored as typed and
    displayed with a visible **"unrecognised form"** marker plus the tooltip "we will match this
    string exactly; we cannot tell you what it covers".
  Rejecting free text outright would reject `RSCG0303`, a real carrier additional-insured form that
  `KNOWLEDGE_BASE.md` §C.5 and `specs/05` §4 explicitly require the engine to handle (REVIEW.md MN-09)
- exactly one `isOrgDefault` per org (partial unique index)
- endorsement rows for `waiver_of_subrogation_wc` are only valid alongside a `workers_compensation`
  coverage row — the editor adds it automatically and says so
- `combinable` is only meaningful on `general_liability` and `automobile_liability` limit rows

## 7. Acceptance criteria

**A1** Given I am a new GC org, When I open the library, Then I see `gc.baseline`,
`gc.trade.high_hazard`, `gc.mechanical`, `gc.hazmat_hauling`, `gc.pollution` and `gc.design_build`,
each with a coverage summary and a source count.
**A2** Given I preview `gc.trade.high_hazard`, Then every limit row shows $5,000,000, and its source
link resolves to `kb-samples/requirements/wl-butler-subcontractor-insurance-requirements.pdf` with
`last_verified: 2026-09-03`.
**A3** Given I apply a template, Then a `requirementSets` row exists with `version = 1`, the rows are a
**copy**, and later library changes do not alter it.
**A4** Given a row whose source `last_verified` is more than 180 days old, Then the editor shows the
date next to the row (a date, not a warning banner — KB §E).
**A5** Given I set a GL each-occurrence minimum of $1,000,000 with `combinable: true`, Then the preview
panel states "may be met by general liability and umbrella/excess combined".
**A6** Given I add `waiver_of_subrogation_wc`, Then a `workers_compensation` coverage-present row is
added automatically with an explanation.
**A7** Given `pm.snow` (marked `UNVERIFIED` in KB §B.1), When I preview it, Then the row is labelled
"our suggestion — not from a published source. Check your contract."
**A8** Given any template or editor screen, Then the §F.2 disclaimer is rendered **verbatim** and
adjacent to the limits (one of the eleven surfaces in KB §F).
**A10** Given I type `RSCG0303` into `acceptsForms`, Then it is accepted, stored as typed, and shown
with the "unrecognised form" marker rather than rejected (MN-09).
**A9** Given I edit a requirement, Then `version` increments and existing comparisons keep the version
they were run against (M5 stores it).

## 8. Edge cases

| case | behaviour |
|---|---|
| Customer requires a coverage ACORD 25 has no row for (e.g. cyber) | `coverage: 'other'` + `otherLabel`, matched against `type_label_raw`. Documented as weaker matching. |
| Two templates assigned to one vendor via type and org default | the **vendor type wins**; org default is the fallback |
| Vendor with no type | org default |
| Requirement set deleted while assigned | blocked; must reassign first |
| Library template retired in a later quarter | customer copies are untouched; the diff view says "this template is no longer published and why" |
| A limit of $0 pasted from a spreadsheet | rejected with the explanation above |

## 9. Errors

Inline, field-level, never a toast: "Enter an amount, e.g. 1,000,000"; "That doesn't look like an ISO
form number. Try CG 20 10, or pick from the list."; "This set is assigned to 3 vendor types — reassign
them before deleting."

## 10. Analytics

`template_library_opened{audience}`, `template_previewed{templateId}`, `template_source_opened{url}`,
`template_applied{templateId,rows}`, `requirement_set_created{origin:'template'|'blank'}`,
`requirement_added{kind,coverage}`, `requirement_edited{field}`, `requirement_deleted`,
`requirement_set_assigned{scope}`, `template_update_previewed`, `vendor_type_created`.

`template_source_opened` is the honest test of D3: if nobody ever clicks a source, sourcing is
marketing rather than product, and the Should list gets re-ranked.

## 11. Test plan

Unit: form-number normalisation (`CG2001` ≡ `CG 20 01`; `CG 24 04 05 09` keeps its edition);
`combinable` semantics; the auto-added WC coverage row; exactly-one-default index.
Fixture: every template JSON in `src/lib/kb/templates/` validates against the template schema and every
`source_url` is a syntactically valid URL with a `last_verified` date — `kb:check` in CI.
Integration (PGlite): apply → edit → version increments; delete-while-assigned is blocked.
e2e: library → preview → apply → edit a limit → the dashboard's "what we check" panel reflects it.
