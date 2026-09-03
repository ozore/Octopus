# WL-04 · Worker roster and classification mapping (+ the conformance path)

**Effort: L · Must (MVP) · Depends on: WL-02, WL-03**

## Story

As Rosa I add my crew once — first name, last name, middle initial, last four of the SSN — and
map each of them to a classification on this project's determination. When someone's actual
duties match nothing on the determination, WageLens tells me plainly what that means and helps
me prepare a conformance request for my contracting officer.

## Two rules that are law, not preference

**1. Last four digits of the SSN. Nothing more.** 29 CFR 5.5(a)(3)(ii)(B) (verified verbatim at
eCFR): the weekly transmittal carries the worker's identifying number as the **last four digits
of the SSN**, and full SSNs and home addresses **must not** appear. There is therefore no column
in this schema that can hold a full SSN or a home address, and gate **G7** is a CI test that
walks the Drizzle schema and asserts it. Holding data we are forbidden to transmit is pure
liability with no product upside.

**2. The conformance path never proposes a classification and never proposes a rate.**
29 CFR 5.5(a)(1)(iii)(B): *"The conformance process may not be used to split, subdivide, or
otherwise avoid application of classifications listed in the wage determination."* Nine times in
ten "nothing matches" means the user has not found the row yet. So the flow searches harder
first, shows the determination's own words second, and explains conformance third — and even
then it prepares a worksheet for the contracting officer rather than deciding anything.

## Flow

```
/projects/:id/crew
  ┌─ empty state: "Add the workers who'll be on this job." ─▶ add worker
  │
  ├─ add worker  (drawer, keyboard-first)
  │    first name · last name · middle initial · last 4 of SSN
  │    status: ○ (J) Journeyworker   ○ (RA) Registered apprentice
  │    ↳ RA selected ─▶ apprenticeship program (from settings, or add one inline)
  │                    + registered classification name  (WH-347 page 2 block)
  │
  └─ map to classification
       search the determination (the WL-03 picker, inline)
       ─▶ chosen ─▶ row shows: worker · classification · $rate · $fringe · provenance line
       ─▶ "none of these match what they actually do"
              │
              ▼
         ┌───────────────────────────────────────────────────────────────┐
         │ CONFORMANCE GUIDE  — three screens, in this order              │
         │                                                                │
         │ 1 · "Look again first."                                        │
         │     Classification follows the WORK ACTUALLY PERFORMED, not    │
         │     the job title and not what you call them on private jobs.  │
         │     [broader search]  [read the determination in full]         │
         │                                                                │
         │ 2 · "What a conformance is."                                   │
         │     The three criteria (all three must be true) · who files it │
         │     (your CONTRACTING AGENCY, not you and not us) · where      │
         │     (DBAConformance@dol.gov) · 30 days for WHD to respond ·    │
         │     29 CFR 5.5(a)(1)(iii)(B): it may NOT be used to split or   │
         │     subdivide a classification that is already listed.         │
         │                                                                │
         │ 3 · "Prepare the request."  → worksheet                        │
         │     duties performed (free text, required, min 120 chars)      │
         │     proposed classification title                              │
         │     proposed base rate + fringe  (YOU propose; we don't)       │
         │     the listed classifications you compared it against         │
         │     ─▶ download PDF worksheet ─▶ hand to your contracting officer
         │                                                                │
         │ Meanwhile: "Until it's approved, pay at least the rate of the  │
         │ closest listed classification and file on time. An approved    │
         │ conformance applies from the first day that work was performed."│
         └───────────────────────────────────────────────────────────────┘
```

## Screens

| screen | contents | states |
|---|---|---|
| `/projects/:id/crew` | table: worker, status (J/RA), classification, rate, fringe, mapped-on date, actions | empty · list |
| add/edit worker drawer | 4 name/id fields, status radio, apprenticeship block when RA | idle · saving · duplicate-warning |
| classification picker | the WL-03 search inline, with "none of these match" as a persistent secondary action | searching · chosen · none-match |
| conformance guide 1–3 | as above | — |
| conformance worksheet | form + live preview of the PDF | draft · complete · downloaded |
| unmapped banner | "3 workers have no classification. You can't certify a payroll until they do." | shown when `unmapped > 0` |

## Data model

```ts
workers
  id                     uuid        primaryKey defaultRandom
  organisation_id        uuid        notNull references organisations(id)
  first_name             text        notNull        // WH-347 (1C)
  last_name              text        notNull        // WH-347 (1B)
  middle_initial         char(1)                    // WH-347 (1D)
  identifying_no_last4   char(4)     notNull        // WH-347 (1E) — LAST FOUR DIGITS ONLY
  default_status         text        notNull default 'J'   // 'J' | 'RA'   → WH-347 (2)
  apprenticeship_program_id uuid     references apprenticeship_programs(id)
  registered_classification text                    // WH-347 page 2 apprenticeship block
  archived_at            timestamptz
  created_at             timestamptz notNull default now()
  index (organisation_id) where archived_at is null
  // THERE IS NO ssn COLUMN. THERE IS NO address COLUMN. THERE IS NO date_of_birth COLUMN.
  // Gate G7 asserts this by walking the schema in CI.

worker_classifications                              // one row per worker per project
  id                     uuid        primaryKey defaultRandom
  project_id             uuid        notNull references projects(id) on delete cascade
  worker_id              uuid        notNull references workers(id)
  source                 text        notNull        // 'wage_determination' | 'conformance_pending' | 'conformance_approved'
  kb_classification_id   uuid        references kb_classifications(id)     // null when source != wage_determination
  classification_label   text        notNull        // DENORMALISED verbatim — prints in column (3) forever
  base_rate              numeric(8,2) notNull       // DENORMALISED — the rate at mapping time
  fringe_rate            numeric(8,2) notNull
  wd_number              text        notNull        // provenance travels with the mapping
  wd_modification_number integer     notNull
  conformance_id         uuid        references conformance_worksheets(id)
  mapped_at              timestamptz notNull default now()
  mapped_by_user_id      uuid        references users(id)
  unmapped_at            timestamptz                 // history, not deletion
  unique (project_id, worker_id) where unmapped_at is null
  index (project_id) where unmapped_at is null

apprenticeship_programs                             // org-level, reused across projects
  id                     uuid        primaryKey defaultRandom
  organisation_id        uuid        notNull references organisations(id)
  program_name           text        notNull        // WH-347 p2 "APPRENTICESHIP PROGRAM NAME"
  registrar              text        notNull        // 'OA' | 'SAA'
  created_at             timestamptz notNull default now()

conformance_worksheets
  id                     uuid        primaryKey defaultRandom
  project_id             uuid        notNull references projects(id) on delete cascade
  worker_id              uuid        references workers(id)
  duties_description     text        notNull        // min 120 chars — the substance of the request
  proposed_classification text       notNull
  proposed_base_rate     numeric(8,2) notNull
  proposed_fringe_rate   numeric(8,2) notNull
  compared_classifications jsonb     notNull        // [{kb_classification_id, label, base_rate, fringe_rate}]
  wd_number              text        notNull
  wd_modification_number integer     notNull
  status                 text        notNull default 'draft'  // draft | handed_off | approved | denied | withdrawn
  handed_off_at          timestamptz
  outcome_recorded_at    timestamptz
  outcome_note           text
  created_at             timestamptz notNull default now()
```

**Why `classification_label`, `base_rate` and `fringe_rate` are denormalised onto
`worker_classifications`:** the payroll Rosa certifies in March must still print the same string
and the same numbers in December, even if the project later moves to a new modification. The
`kb_classification_id` is the link back to the source; the copy is the record. This is the same
reasoning that makes `kb_wage_determinations` append-only.

## Server actions

| name | input | effect |
|---|---|---|
| `addWorker` | name fields, last4, status, apprenticeship | insert; warns on a near-duplicate (same last name + last4) but does not block |
| `updateWorker` / `archiveWorker` | — | archive is soft; a worker on a certified payroll can never be hard-deleted |
| `mapClassification` | `{ projectId, workerId, kbClassificationId }` | closes any open mapping, inserts a new one with the label and rates copied |
| `unmapClassification` | `{ projectId, workerId }` | sets `unmapped_at` |
| `startConformance` | `{ projectId, workerId }` | creates a draft worksheet, records which searches preceded it |
| `saveConformance` / `completeConformance` | worksheet fields | validation V6–V8 |
| `downloadConformanceWorksheet` | `{ id }` | renders the PDF worksheet |
| `recordConformanceOutcome` | `{ id, status, note }` | approved/denied; on approval the mapping's `source` becomes `conformance_approved` |

## Validation rules

| # | rule | on failure |
|---|---|---|
| V1 | `first_name`, `last_name`, `identifying_no_last4` required; last4 is **exactly 4 digits** | field error |
| V2 | Any input matching a full SSN pattern (`\d{3}-?\d{2}-?\d{4}`) in the last4 field is **rejected with an explanation**, not silently truncated | blocking error: "Enter only the last four digits — federal rules forbid the full number on a certified payroll." |
| V3 | `middle_initial` is at most 1 character | truncate with a visible note |
| V4 | `default_status = 'RA'` requires an apprenticeship program and a registered classification | field errors; page 2 needs both |
| V5 | A payroll cannot be certified while any worker with hours on it is unmapped | blocked in WL-05 |
| V6 | `duties_description` ≥ 120 characters — a conformance request that says "does electrical work" wastes 30 days | field error with the reason |
| V7 | `proposed_base_rate > 0`; `proposed_fringe_rate ≥ 0` | field error |
| V8 | `compared_classifications` must contain **at least 2** entries — the request must show what it was compared against, because criterion 3 is "reasonable relationship to the rates on the determination" | field error |
| V9 | The worksheet PDF carries a prominent notice: **"This is a worksheet, not Standard Form SF-1444. Your contracting agency submits the conformance request to DBAConformance@dol.gov."** | always rendered |

**V9 exists because of KNOWLEDGE_BASE KB-10:** gsa.gov returned 403 to this environment on both
attempts, so the real SF-1444's field list is `UNVERIFIED`. We do not ship a form we have not
opened. Generating an actual SF-1444 is WL-31, Later, and gated on someone opening the PDF.

## Acceptance criteria

- **Given** a project with a pinned determination, **when** a worker is added and mapped to
  `ELECTRICIAN (EXCLUDES LOW VOLTAGE WIRING AND INSTALLATION OF ALARMS)`, **then**
  `worker_classifications` holds `base_rate = 38.50`, `fringe_rate = 10.71`,
  `classification_label` verbatim, and `wd_number`/`wd_modification_number` copied from the project.
- **Given** the last-4 field, **when** `123-45-6789` is entered, **then** it is **rejected**
  with the federal-rule explanation and nothing is stored.
- **Given** the generated Drizzle schema, **when** gate G7 runs in CI, **then** no column named
  or typed to hold an SSN, a home address or a date of birth exists in any table.
- **Given** a worker marked `RA`, **when** they are saved without an apprenticeship program,
  **then** the save is blocked with the page-2 reason stated.
- **Given** a mapped worker, **when** the project is re-pinned to a new modification, **then**
  the existing mapping keeps its original rates and is flagged "rate changed under modification
  2" rather than silently updated. *(the WL-08 handoff)*
- **Given** "none of these match", **when** the guide opens, **then** screen 1 is the
  look-again screen and the worksheet is unreachable until screen 2 has been seen.
- **Given** a conformance worksheet with a 60-character duties description, **when** completion
  is attempted, **then** it is blocked with the 120-character reason.
- **Given** a completed worksheet, **when** the PDF is downloaded, **then** it contains the
  duties, the proposal, the compared classifications with their rates, the WD number and
  modification, the three criteria, DBAConformance@dol.gov, and the V9 "not SF-1444" notice.
- **Given** three unmapped workers, **when** the crew page opens, **then** the banner names the
  count and links to the first one.

## Edge cases

| case | behaviour |
|---|---|
| Two workers with the same last name and the same last four | Allowed — it happens, and the form has no other identifier. The add drawer warns once and lets it through. |
| A worker whose duties genuinely span two classifications in one week (conduit Monday, low-voltage Tuesday) | **Both mappings are needed and the form expects two lines for that worker.** The MVP supports one mapping per worker per project; the hours grid (WL-05) supports adding a **second line for the same worker with a different classification**, which is exactly how the WH-347 handles it. Documented in help. |
| Worker leaves mid-project | Archive. Their certified payrolls keep them, because `worker_classifications` and `payroll_lines` denormalise the label and rates. |
| Worker is on two projects with different determinations | One `worker_classifications` row per project, different rates. Correct and required. |
| An approved conformance arrives 6 weeks later | `recordConformanceOutcome('approved')` flips the mapping's source. **The already-filed payrolls are not retroactively rewritten** — an approved conformance applies from the first day of that work, so the correction is a back-wage payment shown on a later payroll, which the help page explains. We do not silently alter a signed federal statement. |
| A conformance is denied | Status recorded; the guide points back to the listed classifications and to the appeals path printed in the determination itself (`BCWD-Office@dol.gov`, then reconsideration, then the ARB). |
| The user maps everyone to `LABORER: COMMON OR GENERAL` because it is cheapest | Not blocked — it is their legal call and we are not the enforcer. But the classification picker shows the rate spread and the guide's screen 1 says classification follows the work performed. Recorded via `classification_mapped`; a pattern of it is a support conversation, not a product block. |

## Errors

| condition | user sees | logged |
|---|---|---|
| Mapping references a classification not on the pinned determination | blocked: "That classification isn't on this project's determination." | `classification_mapping_invalid` |
| Worksheet PDF render fails | retry, draft preserved | `conformance_pdf_failed` |
| Apprenticeship program deleted while referenced | soft-delete only; referenced programs cannot be removed | `apprenticeship_program_in_use` |

## Analytics events

`worker_added {status}` · `worker_archived` · `worker_duplicate_warned` ·
`ssn_full_entry_blocked` ← **watch this: it means someone tried, and the help copy needs work** ·
`classification_mapped {kb_classification_id, base_rate, fringe_rate}` ·
`classification_unmapped` ·
`classification_none_match_clicked {searches_before}` ·
`conformance_guide_step_viewed {step}` ·
`conformance_worksheet_started` · `conformance_worksheet_completed {compared_count}` ·
`conformance_worksheet_downloaded` · `conformance_outcome_recorded {status, days_elapsed}` ·
`crew_unmapped_banner_shown {count}`

`classification_none_match_clicked` with `searches_before` tells us whether people are giving up
after one search (a picker problem) or after eight (a genuine conformance). That distinction is
the difference between fixing search and building WL-32.

## Test plan

**Unit** — last-4 validation, including the SSN-pattern rejection; RA requires a program;
duties minimum length; `compared_classifications` minimum of 2; mapping copies label and both
rates verbatim from `kb_classifications`.
**Integration (PGlite)** — map, unmap, re-map: exactly one open mapping per (project, worker);
a re-pin leaves existing mappings' rates untouched; archiving a worker with a certified payroll
succeeds and the payroll still renders their name.
**Gate test (G7)** — walk the generated schema; fail the build on any column matching
`/ssn|social_security|home_address|street_address|date_of_birth|dob/i` in a table holding worker
data. This test is the enforcement of 29 CFR 5.5(a)(3)(ii)(B).
**E2E** — add a worker, map them, add a second, hit "none of these match", walk all three guide
screens, complete the worksheet, download it, assert the PDF contains "DBAConformance@dol.gov"
and the "not SF-1444" notice.
