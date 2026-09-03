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
| payroll list | table above, sortable by number and week, **with a submission-status control per certified row** (`not sent` / `sent` / `accepted` / `rejected`, plus recipient and note) | empty · list · exporting |
| gaps banner | the missing weeks between the first payroll and today, in order | hidden · shown |
| certified payroll view | frozen grid, documents, provenance, reopen | ready · generating · superseded |
| export drawer | date range, format, what each format contains | idle · building · ready |
| org-wide history `/payrolls` | every project's payrolls in one list, filterable by project | — |

## Data model

Reads `payrolls`, `payroll_lines`, `documents` (WL-05, WL-06). Two additions to `payrolls`, and
one new table.

### Submission status — the four states, on the honour system

**Added 2026-09-03 (wave-1b iteration, finding M8).** `UX.md` §2 A12 shipped a submission status
column, `UX.md` §9 E5 shipped a rejection email, and `PERSONA.md` §6 promised the buyer the words
*"filed / accepted / rejected / needs revision"* — while the only status any spec defined was
`payrolls.status ∈ {draft, certified, superseded}`. **The lifecycle had no spec.** It has one now,
and it is deliberately the cheapest honest version: **the user sets it; we integrate with nobody.**

```ts
payrolls  (added columns)
  submission_status      text                    // null | 'not_sent' | 'sent' | 'accepted' | 'rejected'
                                                 // null and 'not_sent' render identically; null is the
                                                 // pre-existing rows' state
  submitted_at           timestamptz             // when the user says they sent it
  submission_recipient   text                    // free text: "Northgate compliance" — no directory, no lookup
  submission_status_note text                    // what the prime flagged, in the user's words
  submission_updated_at  timestamptz
```

**Rules, so this stays an S and stays honest.**

1. **Nothing sets these but the user.** There is no portal integration, no webhook, no email
   parsing, no inference from a share-link access. `PLAN.md` A11 scopes launch to producing the
   form; `BACKLOG.md` §4 forbids submitting on the customer's behalf. A status we guessed would be
   worse than no status.
2. **It is metadata, never the record.** `submission_status` may change any number of times and
   changes **nothing** about the certified payroll, its lines, its documents or their hashes. Gate
   G9 covers it: setting a status must not alter a byte.
3. **`rejected` requires a note.** A rejection with no reason is the thing the buyer already gets
   from her GC; reproducing it inside the product would be pointless.
4. **`rejected` offers the reopen path** (`reopenPayroll`, WL-05) and fires **E5**, the one email
   this adds: *"Northgate rejected week 4 — here's what they flagged"*, carrying the note the user
   typed and a link to the payroll. Transactional; not suppressible by a marketing unsubscribe.
5. **The export carries it.** `register_csv` gains `submission_status`, `submitted_at` and
   `submission_recipient`, because an audit pack that shows what was filed and when is worth more
   than one that shows only what was generated.
6. It is on the **honour system** by design (the review's Q11 default, and `UX.md` §13 Q2's own
   recommendation): requiring proof of filing adds friction to the step that completes the habit.

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
| `nextPayrollNumber({ projectId })` | `max(payroll_number) + 1` over **certified and superseded** payrolls — drafts hold no number (WL-05, finding M4). It is the number on the "start" button and the **provisional** label on an open draft |
| `setSubmissionStatus({ payrollId, status, recipient?, note? })` | writes the four columns above; `rejected` requires a note; on `rejected` enqueues **E5**. **Touches no payroll line and no document.** *(M8)* |
| `startExport({ format, projectId?, from, to })` | enqueues `export.build`; returns the row |
| `GET /api/exports/:id` | authenticated stream once `status = 'ready'` |
| `reopenPayroll` | WL-05's action; listed here because this screen is where it is reached |

**Export formats.**

- `register_csv` — one row per payroll: number, week ending, status, **submission status,
  submitted at, submission recipient**, worker count, ST hours, OT hours, gross (7A), gross all
  work (7B), deductions, net, WD number, modification number, publication date, certified at,
  certifying official, WH-347 sha256.
- `lines_csv` — one row per `payroll_line`: everything above plus worker last name, first name,
  middle initial, **last-4 only**, status (J/RA), classification label, the seven ST day cells,
  the seven OT day cells, both rates, 6B, 6C, 7A, 7B, 8a–8d, 9.
- `documents_zip` — **this is the "Audit Binder"**, and that is its one name across `OFFER.md` B4,
  `LANDING_SPEC.md` §9 FAQ 6, this spec and the product's own UI *(m10 / M9, 2026-09-03)*. Every
  PDF, named `{project-slug}/payroll-{nnn}-week-{yyyy-mm-dd}-{wh347|statement-of-compliance}.pdf`,
  plus the determination as it stood for each pinned modification, plus a `manifest.csv` carrying
  each file's sha256, its WD number, its modification number and its publication date.
  **It is an archive, not "a single PDF".** `OFFER.md` B4 used to promise a single merged PDF; the
  copy was corrected to what this spec produces rather than this spec being grown an L-shaped merge
  step it does not need. A merged binder is a good later feature and is not a launch promise.

## Validation rules

| # | rule |
|---|---|
| V1 | Only `certified` and `superseded` payrolls appear in exports. Drafts are never exported — an unsigned payroll must not enter an audit pack. |
| V2 | `lines_csv` carries **`identifying_no_last4` only**. There is no export option that emits more, because no column holds more. |
| V3 | Every export row carries `wd_number`, `modification_number` and `publication_date`. *(gate G8 applies to exports too)* |
| V4 | An export covering more than 200 payrolls or 50 MB is built as a job and delivered by link, not streamed inline. |
| V5 | Export links expire after 7 days and are scoped to the organisation. |
| V6 | Superseded payrolls appear with their superseding payroll's number in a `superseded_by` column — an audit pack that hides a correction is worse than one that shows it. |
| V7 | **`submission_status` is set only by `setSubmissionStatus`, only by the user, and never inferred.** No portal integration, no share-link heuristic, no email parsing. *(M8 rule 1)* |
| V8 | **Setting a submission status changes no `payroll_lines` row and no `documents.sha256`.** Asserted by hashing before and after, the same way gate G9 guards a modification acceptance. *(M8 rule 2)* |
| V9 | `submission_status = 'rejected'` requires a non-empty `submission_status_note`. *(M8 rule 3)* |
| V10 | Payroll numbers appear in exports only for **certified and superseded** payrolls; a draft has none (WL-05, M4), and drafts are not exported anyway (V1). |

## Acceptance criteria

- **Given** payrolls 1–8 on a project, **when** the list opens, **then** they render newest
  first with their numbers unbroken, and the "start" button reads "payroll #9".
- **Given** an open draft on that project, **when** the list opens, **then** the draft shows
  **"#9 (provisional)"** and holds no `payroll_number`; **when** the draft is deleted, **then**
  the next certification still takes **9**. *(M4 — one rule, two specs, no gap)*
- **Given** a certified payroll, **when** the user marks it `sent` to "Northgate compliance",
  **then** `submission_status`, `submitted_at` and `submission_recipient` are written,
  `submission_status_set {status:'sent'}` fires, and the payroll's `documents.sha256` values are
  **unchanged**. *(M8, V8)*
- **Given** that payroll, **when** the user marks it `rejected` with a note, **then** the note is
  required, **E5** is sent carrying the note and a link, `submission_rejected_email_sent` fires,
  and the reopen-and-correct path is offered — which produces a **new** payroll number, never an
  edit to the original. *(M8, V9)*
- **Given** `rejected` with an empty note, **when** it is submitted, **then** it is refused.
- **Given** a `register_csv` export, **when** it is inspected, **then** it carries
  `submission_status`, `submitted_at` and `submission_recipient` for every row. *(M8 rule 5)*
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
| Payroll numbers with a genuine gap (a payroll deleted before certification) | Drafts never consume a number — the number is allocated **at certification**, not at creation ([`WL-05`](WL-05-weekly-hours-entry.md) *Payroll numbering*; the two specs now say the same thing). So gaps in *certified* numbers cannot occur. The gaps banner is about missing **weeks**, not missing numbers. |
| A prime says it never received a payroll the user marked `sent` | The status is the user's own note to herself, not proof of delivery, and the UI says so in one line: *"This is your record, not a receipt."* Delivery records are `WL-18` (Should). |
| A payroll is rejected, corrected and re-sent | The superseding payroll carries its own submission status; the original keeps `rejected` and its note. Both are in the export, which is the point. |
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

**Names are canonical and defined once**, in [`WL-EVENTS.md`](WL-EVENTS.md) §5.

`payroll_history_viewed {project_id, payroll_count}` ·
`payroll_gap_banner_shown {missing_weeks}` · `payroll_gap_filled` ·
`submission_status_set {status}` · `submission_rejected_email_sent` ·
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
