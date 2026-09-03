# WL-02 · Project setup with wage-determination lookup

**Effort: L · Must (MVP) · Depends on: WL-01, WL-13**
This is the spec that KNOWLEDGE_BASE **F3** is about. Read F3 before reading this.

## Story

As Rosa I add the Fort Cavazos job: Texas, Bell County, Building. WageLens shows me the
determinations that cover it, I pick the one my contract names, and every payroll for that
project from then on carries that WD number and that modification number.

## The problem this screen actually has

**12.17% of (state, county, construction type) combinations map to more than one active
determination** (1,483 of 12,185, measured over the whole active index on 2026-09-03). Harris
County "Heavy" maps to three: TX20260031, TX20260033, TX20260034.

So the screen may not promise one answer. Worse, promising one answer would be *wrong in a way
the user cannot detect* — every rate downstream would look authoritative and be from the wrong
determination. The design consequence:

1. Geography **narrows**; it does not decide.
2. **"I have the WD number from my contract" is a first-class entry path**, offered first, not
   buried. The authority is 29 CFR 5.5(a)(1)(i): the determination that governs is the one
   *incorporated into the contract*, which the contracting officer chose — not the one we would
   have chosen from a map.
3. When several candidates match, they are shown side by side with what distinguishes them, and
   the user picks. Nothing is auto-selected, ever, when `count > 1`.

## Flow

```
/projects  ─ "New project" ─▶  /projects/new

  Step 1 · The job
    project name · project no. or contract no. · project location (free text, prints on the form)
    our role: ○ Prime contractor  ○ Subcontractor      ← WH-347 hdr.role_prime / hdr.role_sub
    prime contractor name (shown only when role = Subcontractor)

  Step 2 · The wage determination                      ← the whole point
    ┌──────────────────────────────────────────────────────────────┐
    │ (A) "My contract names a wage determination number"          │
    │      [ TX20260253 ]  ─▶ resolve ─▶ confirm card ─▶ pin       │
    │                                                              │
    │ (B) "Help me find it"                                        │
    │      state ▾   county ▾   construction type ▾                │
    │      ─▶ 0 results   → guidance panel                         │
    │      ─▶ 1 result    → confirm card ("check this against      │
    │                        your contract") ─▶ pin                │
    │      ─▶ n results   → candidate list, no default selected    │
    └──────────────────────────────────────────────────────────────┘

  Step 3 · Confirm
    the pinned card: WD number · modification · published · counties · type
    · classification count · [view the official determination on SAM.gov ↗]
    "Your contract should name this number. If it names a different one, go back."
    ─▶ project created ─▶ /projects/:id  (empty state points at WL-04: add your crew)
```

## Screens

| screen | contents | states |
|---|---|---|
| `/projects` | project cards: name, WD number + mod, next payroll number, last week filed, a badge when a newer modification exists | empty · list · loading |
| `/projects/new` step 1 | job identity fields | idle · invalid · saving |
| `/projects/new` step 2 | the two entry paths above | idle · resolving · zero · one · many · error |
| candidate list row | WD number, construction type, modification number, published date, **county list** (the discriminator), classification count, "view on SAM.gov ↗" | selectable, none preselected |
| zero-results panel | "No determination lists {county} for {type}." → three ordered actions: (1) check the construction type — Building vs Heavy is the most common mistake; (2) ask your contracting officer for the WD number; (3) enter it directly. Links to the SAM.gov search. | — |
| confirm card | the pinned determination, plus the standing disclaimer (WL-11) | — |
| `/projects/:id/determination` | the pinned card, the full verbatim determination text, the modification history, "check for a newer modification" | — |

**Construction type is a picker with definitions, not a bare dropdown.** Building / Residential
/ Highway / Heavy, each with the DOL description in one line, because choosing "Building" for a
water-line job is the most common way to end up on the wrong determination — and it is a
mistake that produces a plausible-looking, entirely wrong payroll.

## Data model

```ts
projects
  id                       uuid         primaryKey defaultRandom
  organisation_id          uuid         notNull references organisations(id)
  name                     text         notNull
  project_or_contract_no   text         notNull            // WH-347 hdr.project_or_contract_no
  location_description     text         notNull            // WH-347 hdr.project_location
  our_role                 text         notNull            // 'prime' | 'sub'  → hdr.role_prime / role_sub
  prime_contractor_name    text                            // required when our_role = 'sub'
  awarding_agency          text
  // the pin — the single most important pair of columns in the product
  wd_id                    uuid         notNull references kb_wage_determinations(id)
  wd_number                text         notNull            // denormalised on purpose: survives a corpus rebuild
  wd_modification_number   integer      notNull
  wd_pinned_at             timestamptz  notNull
  wd_pinned_by_user_id     uuid         references users(id)
  wd_pin_method            text         notNull            // 'entered_number' | 'selected_from_1' | 'selected_from_n'
  // geography as entered (kept even when the pin came from a typed number)
  state_code               char(2)      notNull
  sam_county_code          integer
  county_name              text
  construction_type        text                            // Building | Residential | Highway | Heavy
  status                   text         notNull default 'active'   // active | archived
  contract_award_date      date
  created_at               timestamptz  notNull default now()
  updated_at               timestamptz  notNull default now()
  index (organisation_id, status)
  index (wd_number, wd_modification_number)                 // WL-08 reads this

project_wd_pin_history                                      // never lose why a rate was what it was
  id                       uuid         primaryKey defaultRandom
  project_id               uuid         notNull references projects(id) on delete cascade
  wd_number                text         notNull
  wd_modification_number   integer      notNull
  pinned_at                timestamptz  notNull
  unpinned_at              timestamptz
  changed_by_user_id       uuid         references users(id)
  reason                   text                             // 'initial' | 'accepted_modification' | 'corrected'
```

`project_wd_pin_history` exists because a payroll certified in March under modification 1 must
remain explainable in December after the project moved to modification 2. Same principle as
`kb_wage_determinations` being append-only.

## Server actions

| name | input | returns |
|---|---|---|
| `searchDeterminations` | `{ stateCode, samCountyCode, constructionType? }` | `{ candidates: [{wd_number, modification_number, publication_date, construction_types, county_names, classification_count, public_url}], ambiguous: boolean }` — reads `kb_wd_counties` join `kb_wage_determinations`, **never the network** |
| `resolveDeterminationByNumber` | `{ wdNumber, modificationNumber? }` | the active modification for that WD number, or `not_found`, or `found_but_superseded` with the active one offered |
| `listCounties` | `{ stateCode }` | `kb_counties` rows for the state, alphabetical |
| `createProject` | step 1 + step 2 payload | writes `projects` + `project_wd_pin_history(reason='initial')` |
| `repinDetermination` | `{ projectId, wdNumber, modificationNumber, reason }` | closes the open history row, opens a new one, **only when the project has no certified payroll at that modification** (see V7) |

## Validation rules

| # | rule | on failure |
|---|---|---|
| V1 | `name`, `project_or_contract_no`, `location_description`, `our_role` required | field errors |
| V2 | `prime_contractor_name` required when `our_role = 'sub'` | field error |
| V3 | The pinned determination must exist in `kb_wage_determinations` and be `is_active = true` at pin time | blocked with the active alternative offered |
| V4 | `construction_type ∈ {Building, Residential, Highway, Heavy}` | select only |
| V5 | `sam_county_code` must exist in `kb_counties` for `state_code` | select only, never free text — a name string silently returns zero (KNOWLEDGE_BASE KB-1) |
| V6 | **When `candidates.length > 1`, no candidate is preselected and the form cannot be submitted until one is chosen.** No "most likely" heuristic exists in the codebase. | submit disabled |
| V7 | Re-pinning is blocked once any payroll on the project is `certified`, unless the user confirms a "correction" — which is recorded in `project_wd_pin_history.reason` and warned about, because it makes already-signed payrolls inconsistent with the project | confirm dialog |
| V8 | A WD number typed by hand is normalised (upper-case, whitespace stripped) and matched against `wd_number` **and** `allReferenceNumbers` short forms — SAM lists `TX260253`, `TX26253`, `TX2026253`, `TX0253` as aliases of `TX20260253`, and a contract may print any of them | resolved, or `not_found` |

**V8 is not a nicety.** The contract in Rosa's hand may say `TX 253` or `TX260253`. If she types
what her contract says and we say "not found", she abandons.

## Acceptance criteria

- **Given** Texas / Harris / Heavy, **when** the lookup runs, **then** **three** candidates are
  returned (TX20260031, TX20260033, TX20260034), the form is marked ambiguous, none is
  preselected, and submit is disabled.
- **Given** Texas / Harris / Building, **when** the lookup runs, **then** exactly one candidate
  (TX20260253 mod 1) is returned and a confirm card renders that still says "check this against
  your contract".
- **Given** the user types `TX20260253`, **when** it resolves, **then** the active modification
  is offered and `wd_pin_method = 'entered_number'`.
- **Given** the user types the alias `TX260253`, **when** it resolves, **then** it resolves to
  `TX20260253`. *(V8)*
- **Given** the user types a WD number that exists only at a superseded modification, **when** it
  resolves, **then** the app says so and offers the active modification, and does not pin the
  superseded one.
- **Given** a county/type combination with no determination, **when** the lookup runs, **then**
  the zero-results panel renders with the three ordered actions and `wd_search_zero_results`
  fires with the county and type as props.
- **Given** a created project, **when** it is opened, **then** `projects.wd_number` and
  `wd_modification_number` are set, one open `project_wd_pin_history` row exists with
  `reason = 'initial'`, and the determination card links to `sam.gov/wage-determination/{wd}/{mod}`.
- **Given** the corpus is rebuilt and `kb_wage_determinations.id` values change, **when** a
  project is opened, **then** it still resolves — because `wd_number` + `wd_modification_number`
  are denormalised onto `projects`.

## Edge cases

| case | behaviour |
|---|---|
| A job spans **two counties** | The MVP pins one determination per project. Copy on the confirm card: "Work in more than one county? Create one project per county — the determination differs." **This is honest, and it is also correct**: county boundaries are how DBA rates are defined. |
| A job needs **two construction types** (e.g. a building with a highway approach) | Same answer, same reason — the two types genuinely carry different determinations, and DOL expects both to be applied. |
| The contract incorporates a **project wage determination** (agency-issued, not on SAM.gov) | Not supported. The zero-results panel says so plainly and points at the contracting officer. Do not let the user pin an unrelated general determination "to get going" — that produces a wrong, confident payroll. |
| The determination is **modified between search and submit** | The pin stores the modification the user saw. The next daily refresh raises WL-08's alert. No silent substitution. |
| The user's contract names a modification **older** than the active one | Allowed, and it is a real and correct case — the determination locked into a contract at award is the governing one. `resolveDeterminationByNumber` accepts an explicit modification number and pins it; the card shows "a newer modification exists" without demanding action. |
| Fewer counties in the app than the user expects (Connecticut's planning regions, Alaska boroughs) | `kb_counties` is refreshed monthly (KNOWLEDGE_BASE §6) and the county picker is searchable. |
| Two projects in one org pinned to the same determination | Fine and common. WL-08 alerts once per project. |

## Errors

| condition | user sees | logged |
|---|---|---|
| Corpus empty (first deploy, ingestion not run) | "Wage determinations are still loading. Try again in a few minutes." — **never** an empty result set presented as an answer | `wd_search_corpus_empty` |
| Corpus stale (>35 days, gate G6) | A banner on the confirm card: "Determinations last verified {date}. Check SAM.gov before you file." | `wd_search_corpus_stale` |
| Lookup query fails | inline retry, form state preserved | `wd_search_failed` |

## Analytics events

`project_create_started` · `wd_search_performed {state_code, county_name, construction_type, result_count}` ·
`wd_search_ambiguous {candidate_count}` · `wd_search_zero_results {state_code, county_name, construction_type}` ·
`wd_entered_by_number {matched_alias}` · `wd_resolve_failed {reason}` ·
`wd_pinned {wd_number, modification_number, pin_method, chosen_from_n}` ·
`project_created {our_role, construction_type}` · `determination_card_viewed` ·
`official_determination_link_clicked {wd_number}` · `project_repinned {reason}`

`wd_search_ambiguous` and `wd_search_zero_results` are the two events that tell us whether F3
is a design problem we solved or a design problem we shipped. Both are on the WL-12 dashboard.

## Test plan

**Unit** — WD-number normalisation and alias matching across all four SAM alias forms;
`ambiguous` is true iff `candidates.length > 1`; construction-type filtering happens in SQL over
`construction_types` (the API's own `constructionType` parameter is ignored — KNOWLEDGE_BASE KB-1).
**Integration (PGlite, corpus seeded from `kb-samples/`)** — Harris/Heavy → 3 candidates;
Harris/Building → 1; a fabricated county with no determination → 0; superseded number →
`found_but_superseded`; pin history written on create and on repin; repin blocked after a
certified payroll without confirmation.
**E2E** — create a project by typing a WD number; create one by geography through an ambiguous
result, asserting that submit is disabled until a candidate is chosen.
**Regression** — a golden test that asserts the ambiguity rate over the seeded corpus is
reported and non-zero, so nobody "fixes" the multi-candidate UI by picking the newest.
