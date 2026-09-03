# WL-07 · Payroll history and export

**Effort: S · Must (MVP) · Depends on: WL-06**

## Story

As Rosa I can see every payroll I have filed on this project, in order, with its number, its
week, its status and its two PDFs — and when the auditor asks for "everything from March",
I download it in one click.

## Why an S is a Must

Three mechanical reasons, none of them glamorous:

1. **`Certified Payroll No.` is a sequential integer with no gaps.** The app cannot create
   payroll #8 without knowing #7 exists. History is not a view over the data; it *is* the data
   WL-05 depends on.
2. **29 CFR 5.5(a)(3)(i)(A) and (a)(3)(ii)(G) require three years of retention** after the
   prime contract completes. A tool that loses last month's payroll is worse than the
   spreadsheet it replaced.
3. **An audit request is the moment the subscription proves itself**, and it arrives without
   warning. "I pulled it up in thirty seconds" is the story that renews.

## Flow

```
/projects/:id/payrolls
  ┌ next: "Start payroll #9 · week ending Sat 13 Dec"          [ start ]
  ├ gaps banner (when a week is missing): "No payroll for week ending 29 Nov."
  │                                        [ file a 'no work performed' payroll ]
  ├ table: #  week ending  status  workers  ST/OT hrs  gross  certified on  documents
  │        8  06 Dec 2026  certified  12   472/18   $28,4…   06 Dec 17:42   [WH-347] [SoC]
  │        7  29 Nov 2026  certified  12   …
  │        6  22 Nov 2026  no work performed
  └ [ export ▾ ]  CSV (payroll register) · CSV (line detail) · ZIP (all PDFs)

/payrolls/:id  (certified, read-only)
   the frozen grid · both documents with sha256 · the pinned WD number + modification
   [ reopen and correct ]  ─▶ confirm: creates payroll 8R superseding 8; both are kept
```

## Screens

| screen | contents | states |
|---|---|---|
| payroll list | table above, sortable by number and week | empty · list · exporting |
| gaps banner | the missing weeks between the first payroll and today, in order | hidden · shown |
| certified payroll view | frozen grid, documents, provenance, reopen | ready · generating · superseded |
| export drawer | date range, format, what each format contains | idle · building · ready |
| org-wide history `/payrolls` | every project's payrolls in one list, filterable by project | — |

## Data model

No new tables. Reads `payrolls`, `payroll_lines`, `documents` (WL-05, WL-06). Two additions:

```ts
payroll_exports                                  // so a large export is a job, not a request
  id                 uuid         primaryKey defaultRandom
  organisation_id    uuid         notNull references organisations(id)
  project_id         uuid         references projects(id)
  format             text         notNull        // 'register_csv' | 'lines_csv' | 'documents_zip'
  from_date          date
  to_date            date
  payroll_count      integer
  storage_key        text
  byte_size          integer
  status             text         notNull default 'building'   // building | ready | failed
  expires_at         timestamptz  notNull        // 7 days
  created_by_user_id uuid         references users(id)
  created_at         timestamptz  notNull default now()
```

## Server actions

| name | effect |
|---|---|
| `listPayrolls({ projectId?, from?, to? })` | the table, with derived totals |
| `detectPayrollGaps({ projectId })` | the set of workweek-ending dates between the earliest payroll and today with no non-superseded payroll |
| `nextPayrollNumber({ projectId })` | `max(payroll_number) + 1`, the number shown on the "start" button |
| `startExport({ format, projectId?, from, to })` | enqueues `export.build`; returns the row |
| `GET /api/exports/:id` | authenticated stream once `status = 'ready'` |
| `reopenPayroll` | WL-05's action; listed here because this screen is where it is reached |

**Export formats.**

- `register_csv` — one row per payroll: number, week ending, status, worker count, ST hours,
  OT hours, gross (7A), gross all work (7B), deductions, net, WD number, modification number,
  publication date, certified at, certifying official, WH-347 sha256.
- `lines_csv` — one row per `payroll_line`: everything above plus worker last name, first name,
  middle initial, **last-4 only**, status (J/RA), classification label, the seven ST day cells,
  the seven OT day cells, both rates, 6B, 6C, 7A, 7B, 8a–8d, 9.
- `documents_zip` — every PDF, named
  `{project-slug}/payroll-{nnn}-week-{yyyy-mm-dd}-{wh347|statement-of-compliance}.pdf`, plus a
  `manifest.csv` carrying each file's sha256 and its WD number and modification.

## Validation rules

| # | rule |
|---|---|
| V1 | Only `certified` and `superseded` payrolls appear in exports. Drafts are never exported — an unsigned payroll must not enter an audit pack. |
| V2 | `lines_csv` carries **`identifying_no_last4` only**. There is no export option that emits more, because no column holds more. |
| V3 | Every export row carries `wd_number`, `modification_number` and `publication_date`. *(gate G8 applies to exports too)* |
| V4 | An export covering more than 200 payrolls or 50 MB is built as a job and delivered by link, not streamed inline. |
| V5 | Export links expire after 7 days and are scoped to the organisation. |
| V6 | Superseded payrolls appear with their superseding payroll's number in a `superseded_by` column — an audit pack that hides a correction is worse than one that shows it. |

## Acceptance criteria

- **Given** payrolls 1–8 on a project, **when** the list opens, **then** they render newest
  first with their numbers unbroken, and the "start" button reads "payroll #9".
- **Given** payrolls for weeks ending 22 Nov and 6 Dec but none for 29 Nov, **when** the list
  opens, **then** the gaps banner names 29 Nov and offers a "no work performed" payroll.
- **Given** a certified payroll, **when** it is opened, **then** the grid is read-only, both
  documents are downloadable with their sha256 shown, and the pinned WD number and modification
  are displayed.
- **Given** a `register_csv` export of 8 payrolls, **when** it is downloaded, **then** it has 8
  data rows, each carrying the WD number, modification number and publication date.
- **Given** a `lines_csv` export, **when** it is inspected, **then** **no 9-digit sequence and no
  `\d{3}-\d{2}-\d{4}` pattern appears anywhere in the file**.
- **Given** payroll #8 superseded by #8R, **when** either export runs, **then** both appear and
  #8 carries `superseded_by = 8R`.
- **Given** a `documents_zip`, **when** it is opened, **then** it contains 2 PDFs per certified
  payroll plus `manifest.csv`, and every sha256 in the manifest matches the file.
- **Given** an export of 300 payrolls, **when** it is started, **then** a job builds it and the
  user is given a link rather than a hanging request.
- **Given** an export link 8 days old, **when** it is opened, **then** it 404s.

## Edge cases

| case | behaviour |
|---|---|
| A project with no payrolls yet | Empty state pointing at WL-04 ("map your crew first") or WL-05, whichever is outstanding. |
| Payroll numbers with a genuine gap (a payroll deleted before certification) | Drafts never consume a number — the number is allocated **at certification**, not at creation. So gaps in *certified* numbers cannot occur. The gaps banner is about missing **weeks**, not missing numbers. |
| A project archived mid-year | History remains readable and exportable. Archiving hides it from the project switcher, nothing more. |
| Retention: a project finished 4 years ago | Nothing is auto-deleted in the MVP. The three-year clock runs from prime contract completion, which we do not know. Deletion is a user action, and the settings copy explains the retention rule. |
| An org cancels its subscription | Read-only access to history and exports is retained for 30 days after cancellation, stated in the cancellation flow (WL-09). Taking away an audit trail the day the card fails is the single most damaging thing this product could do. |
| Two projects with the same week ending | Independent numbering; `payroll_number` is unique per `(project, filer_organisation)`. |

## Errors

| condition | user sees | logged |
|---|---|---|
| Export job fails | "That export failed. Try a narrower date range." + retry | `payroll_export_failed {format, payroll_count}` |
| A document blob is missing | The row shows "regenerating"; the export waits or omits it and says so in the manifest | `document_blob_missing` |
| Export requested with no certified payrolls in range | Blocked with a message, no empty file produced | `payroll_export_empty` |

## Analytics events

`payroll_history_viewed {project_id, payroll_count}` ·
`payroll_gap_banner_shown {missing_weeks}` · `payroll_gap_filled` ·
`payroll_reopened {reason, days_since_certified}` ·
`payroll_export_started {format, payroll_count, span_days}` ·
`payroll_export_downloaded {format}` · `payroll_export_failed {format}` ·
`document_redownloaded {kind, days_since_generated}` ← re-downloading an old payroll is the
audit-moment signal, and it is a strong retention predictor worth watching

## Test plan

**Unit** — gap detection across a project spanning a year change and a DST boundary; next
payroll number after a supersede; CSV column ordering is stable (it is an audit artifact).
**Integration (PGlite)** — export a project with 8 payrolls including one superseded and one
"no work performed"; assert row counts, the `superseded_by` column, and the provenance columns.
**Privacy test** — regex the produced CSV and ZIP manifest for 9-digit sequences and SSN
patterns; fail the build on a hit. Same test as WL-06's, applied to exports.
**E2E** — certify two payrolls, export the register, export the ZIP, open the ZIP and verify
the manifest hashes against the files.
