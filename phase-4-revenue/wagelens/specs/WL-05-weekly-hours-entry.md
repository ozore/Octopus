# WL-05 · Weekly hours entry grid

**Effort: L · Must (MVP) · Depends on: WL-04**

## Story

As Rosa I open the week ending Saturday 6 December, click **copy last week**, correct the three
people whose hours changed, tab through the grid without touching the mouse, and certify.

## Why this is the largest L in the MVP

This is the 41 hours a year. Twelve workers × seven days × straight time and overtime is **168
numbers a week**, plus rates, fringes, four deduction columns and two gross columns per worker.
Everything before this screen happens once per project. This screen happens **every Friday
forever**, and whether week 2 is faster than week 1 is what decides whether the subscription
reaches month 2.

## Flow

```
/projects/:id/payrolls              list, newest first, with the next number waiting
  └─ "Start payroll #8 · week ending Sat 6 Dec"  ─▶  /payrolls/:id

/payrolls/:id  (draft)
  ┌ header strip: project · WD number + mod (pinned) · payroll #8 · week ending 06 Dec
  │               [ copy week 7 ]   [ no work performed this week ]
  ├ grid
  │   worker            class          M  T  W  T  F  S  S   ST   OT   6A-ST 6A-OT  6B    6C    7A     7B     8a  8b  8c  8d    9
  │   ▸ Reyes, J.  A    Electrician ST  8  8  8  8  8  -  -   40    -  38.50    –   10.71  0.00 1540.00 1540.00 …   …   …   …    …
  │                                 OT  -  -  -  2  -  -  -    -    2      –  57.75
  │   ▸ + add a second line for this worker (different classification)
  ├ running totals row · unmapped-worker banner · validation panel
  └ [ save draft ]    [ review and certify ▸ ]

/payrolls/:id/certify
   preview of the WH-347 and the Statement of Compliance (WL-06)
   certifying official name · title · phone · email · additional remarks
   the three certifications, shown in full, each acknowledged
   [ certify and generate ]   ─▶ status = certified, PDFs written, immutable
```

## Screens

| screen | contents | states |
|---|---|---|
| payroll list | number, week ending, status, worker count, generated-on, download | empty · list |
| grid (draft) | the table above, sticky header and first column, running totals | empty · copied · editing · saving · invalid |
| "no work performed" | one confirm: "Payroll #8, week ending 6 Dec — no covered work performed." | — |
| validation panel | blocking errors and non-blocking warnings, each linking to its cell | clean · warnings · errors |
| certify | preview, certifying official, the three certifications, remarks | idle · certifying · certified |
| certified payroll (read-only) | the grid frozen, the two PDFs, "reopen" (with consequences stated) | — |

### Keyboard model — the part that decides retention

**This table is the only keyboard map in the product.** `UX.md` §7 used to carry a second,
different one (`Ctrl+D` filling to the end of the column rather than copying one cell,
`Ctrl+→` filling a *day row* rather than the rest of the workweek, `Ctrl+Enter` to save). Finding
**M5**: the build reads the spec, so the spec is the map, and `UX.md` §7 now points here instead
of restating it. WL-05's semantics survive because they are the ones with test cases attached;
two of UX's shortcuts — `Esc` to revert and `S` to split a day — were genuinely better and cheap,
so they are adopted here.

| key | behaviour |
|---|---|
| `Tab` / `Shift-Tab` | next / previous cell, **across the row then down**, skipping computed cells |
| `↑ ↓ ← →` | cell-wise movement, wrapping at row ends |
| `Enter` | down one row, same column (spreadsheet muscle memory) |
| `Esc` | **revert the cell to its last saved value** and leave edit mode *(adopted from UX)* |
| `0`–`9`, `.` | start typing straight into a numeric cell, no `Enter` first |
| `.` or `Space` on an **empty** day cell | fills the worker's default daily hours (`organisations.default_daily_hours`, 8 unless changed) |
| `-` or `0` | zero, and moves on |
| `Ctrl/⌘ + D` | **copy the cell above** (one cell, not the column) |
| `Ctrl/⌘ + →` | **fill the rest of the workweek** with the current cell's value |
| `Ctrl/⌘ + S` | save draft |
| `S` on a focused day cell | **split this day** — creates a second line for the same worker under a different classification and moves focus into it *(adopted from UX; it is how the WH-347 handles a worker in two classifications, and the wrong single row must be harder than the right two)* |
| `Ctrl/⌘ + K` | rate-lookup palette |
| `Ctrl/⌘ + /` or `?` | shortcut overlay, itself keyboard-reachable and screen-reader readable |
| `G` then `W` / `P` / `F` | go to week / project / flags |
| paste | a tab- or comma-separated **rectangular** block pastes into the grid from the focused cell, with a preview before it commits |

**`hours_keyboard_shortcut_used {shortcut}` enumerates exactly this set** — `tab`, `arrow`,
`enter`, `esc`, `type_through`, `default_day`, `zero`, `fill_down`, `fill_week`, `save`, `split`,
`palette`, `overlay`, `goto`, `paste` — and nothing else. A shortcut that is not in this table
does not exist, and a value the event does not enumerate fails the union test in
[`WL-EVENTS.md`](WL-EVENTS.md).

Rules that hold regardless of key: focus is never trapped; the focus ring is always visible at
≥3:1; **nothing that changes data is available only by mouse**. Every cell autosaves on blur,
debounced 800 ms, with an optimistic value and a per-row saved indicator. **A dropped connection
must never lose typed hours** — the draft is server-side and the client retries.

## Data model

```ts
payrolls
  id                        uuid         primaryKey defaultRandom
  project_id                uuid         notNull references projects(id) on delete cascade
  filer_organisation_id     uuid         notNull references organisations(id)   // ← the WL-24 seam
  payroll_number            integer                     // WH-347 hdr.certified_payroll_no
                                                        // NULLABLE ON PURPOSE: allocated AT CERTIFICATION,
                                                        // never at creation. A draft shows the provisional
                                                        // number it *would* get. See "Payroll numbering".
  week_ending_date          date         notNull        // WH-347 hdr.week_ending_date
  is_final                  boolean      notNull default false   // hdr.final_payroll_flag
  no_work_performed         boolean      notNull default false
  status                    text         notNull default 'draft'  // draft | certified | superseded
  // the pin, copied at creation and FROZEN — never read live from projects
  wd_number                 text         notNull
  wd_modification_number    integer      notNull
  // certification
  certifying_official_name  text
  certifying_official_title text
  certifying_official_phone text
  certifying_official_email text
  additional_remarks        text
  certified_at              timestamptz
  certified_by_user_id      uuid         references users(id)
  superseded_by_payroll_id  uuid         references payrolls(id)
  created_at                timestamptz  notNull default now()
  updated_at                timestamptz  notNull default now()
  unique (project_id, filer_organisation_id, payroll_number)   // partial: where payroll_number is not null
  unique (project_id, filer_organisation_id, week_ending_date) where status <> 'superseded'
  index (project_id, week_ending_date)

payroll_lines
  id                        uuid         primaryKey defaultRandom
  payroll_id                uuid         notNull references payrolls(id) on delete cascade
  worker_id                 uuid         notNull references workers(id)
  worker_entry_no           integer      notNull        // WH-347 (1A)
  // frozen worker identity — the form must reproduce exactly, forever
  last_name                 text         notNull        // (1B)
  first_name                text         notNull        // (1C)
  middle_initial            char(1)                     // (1D)
  identifying_no_last4      char(4)      notNull        // (1E)
  worker_status             text         notNull        // (2)  'J' | 'RA'
  classification_label      text         notNull        // (3)  verbatim
  kb_classification_id      uuid         references kb_classifications(id)
  // hours — (4) is a 7x2 grid; day 0 = the Sunday that starts the week ending on week_ending_date
  hours_st                  numeric(5,2)[7] notNull default '{0,0,0,0,0,0,0}'
  hours_ot                  numeric(5,2)[7] notNull default '{0,0,0,0,0,0,0}'
  total_hours_st            numeric(6,2) notNull        // (5) ST  — generated: sum(hours_st)
  total_hours_ot            numeric(6,2) notNull        // (5) OT  — generated: sum(hours_ot)
  rate_st                   numeric(8,2) notNull        // (6A) ST
  rate_ot                   numeric(8,2) notNull        // (6A) OT
  fringe_credit_hourly      numeric(8,2) notNull default 0    // (6B)
  payment_in_lieu_hourly    numeric(8,2) notNull default 0    // (6C)
  gross_project             numeric(10,2) notNull       // (7A)
  gross_all_work            numeric(10,2) notNull       // (7B)
  ded_tax_withholdings      numeric(10,2) notNull default 0   // (8a)
  ded_fica                  numeric(10,2) notNull default 0   // (8b)
  ded_other                 numeric(10,2) notNull default 0   // (8c)
  ded_other_note            text                              // (8c) "MUST SPECIFY"
  ded_total                 numeric(10,2) notNull       // (8d) = 8a+8b+8c
  net_pay                   numeric(10,2) notNull       // (9)  = 7B - 8d
  // the determination rate at line creation, for the below-rate check
  wd_base_rate              numeric(8,2)
  wd_fringe_rate            numeric(8,2)
  sort_order                integer      notNull
  unique (payroll_id, worker_entry_no)
  index (payroll_id, sort_order)

payroll_line_fringe_credits                              // WH-347 page 2, per worker per plan
  id                        uuid         primaryKey defaultRandom
  payroll_line_id           uuid         notNull references payroll_lines(id) on delete cascade
  fringe_plan_id            uuid         notNull references fringe_plans(id)
  hourly_credit             numeric(8,2) notNull
  unique (payroll_line_id, fringe_plan_id)

fringe_plans                                             // org-level, set once in settings (WL-10)
  id                        uuid         primaryKey defaultRandom
  organisation_id           uuid         notNull references organisations(id)
  name                      text         notNull        // p2 "FB NAME"
  plan_type                 text         notNull        // p2 "FB TYPE"  — health | pension | vacation | training | other
  plan_no                   text                        // p2 "PLAN NO."
  is_funded                 boolean      notNull        // p2 "Funded / Unfunded"
  archived_at               timestamptz
```

### Payroll numbering — allocated at certification, not at creation

**Changed 2026-09-03 (wave-1b iteration, finding M4).** This spec used to allocate the number in
`createPayroll`; [`WL-07`](WL-07-payroll-history-and-export.md)'s edge cases said it was allocated
at certification. **WL-07 wins**, and it is not a coin toss: it is the only version in which an
abandoned draft cannot leave a gap in a certified-payroll sequence, and **both specs say a
numbered gap is the first thing an auditor looks for.**

| moment | what happens |
|---|---|
| `createPayroll` | `payroll_number` stays **null**. Nothing is reserved. The header shows **`payroll #8 (provisional)`** — `nextPayrollNumber()` + 1, computed on read, clearly labelled. |
| a draft is deleted or abandoned | Nothing to release. No gap is possible, because no number was ever taken. |
| `certifyPayroll` | Inside the certification transaction, **immediately before** flipping `status = 'certified'`: `SELECT coalesce(max(payroll_number), 0) + 1 … FOR UPDATE` scoped to `(project_id, filer_organisation_id)`, written with the certification. |
| two tabs certifying at once | The `FOR UPDATE` and the unique index settle it; the loser retries once and gets the next number, or returns the same certified payroll if it is the same draft (certification is idempotent). |
| reopen-and-supersede | The superseding payroll takes a **new** number and `additional_remarks` says "Corrects payroll #8". The original keeps its own. Both are retained. |

Consequence for the UI, stated so nobody re-invents it: the provisional number is **advisory**,
it may move if another draft on the same project certifies first, and the grid header says so in
four words — *"number assigned when you certify"*.

**Three deliberate choices.**
1. `hours_st` / `hours_ot` are **fixed-length arrays of 7**, not a row per day. The form is a
   7-column grid; the query is always "the whole week"; and a 7-element array is one row read
   instead of fourteen.
2. Everything the form prints is **frozen onto `payroll_lines` at creation** — the worker's
   name, their last four, their classification label, both rates. A certified payroll is a
   signed federal statement; nothing upstream may change what it says.
3. `payrolls.wd_number` / `wd_modification_number` are copied from the project at payroll
   creation and never re-read. A modification landing on Thursday cannot change Wednesday's
   draft under the user's hands.

## Server actions

| name | input | effect |
|---|---|---|
| `createPayroll` | `{ projectId, weekEndingDate }` | **reserves no number** (`payroll_number` stays null), copies the pin, seeds one line per mapped worker. Returns the **provisional** number for display only |
| `nextPayrollNumber` | `{ projectId }` | `max(payroll_number) + 1` over **certified and superseded** payrolls; the provisional label and WL-07's "start" button both read it |
| `copyLastWeek` | `{ payrollId }` | copies lines, rates, deductions and fringe credits from the most recent certified payroll on the project; **hours are copied too** and the panel says so, because week-to-week hours really are usually identical and correcting three cells beats typing 168 |
| `updateCell` | `{ lineId, field, value }` | debounced autosave, recomputes derived columns server-side |
| `addLine` / `removeLine` | `{ payrollId, workerId, kbClassificationId? }` | a second line for the same worker under a different classification |
| `markNoWorkPerformed` | `{ payrollId }` | sets the flag and clears lines. It still has to be **certified** to consume a number — a "no work performed" week is a filed payroll, not a note |
| `validatePayroll` | `{ payrollId }` | returns `{ errors[], warnings[] }` |
| `certifyPayroll` | `{ payrollId, officialName, title, phone, email, remarks }` | runs validation, **allocates `payroll_number` inside the same transaction** (`SELECT max … FOR UPDATE`), flips to `certified`, stamps `certified_at` and `certified_by_user_id`, enqueues WL-06 generation. **Idempotent** — a double-submit returns the same payroll with the same number. |
| `reopenPayroll` | `{ payrollId, reason }` | creates a **new** payroll superseding the old one; the original is retained (see edge cases) |

## Validation rules

**Blocking (certification is refused):**

| # | rule |
|---|---|
| B1 | Every line has a classification and a non-zero `rate_st` |
| B2 | No worker with hours is unmapped (WL-04 V5) |
| B3 | `total_hours_st + total_hours_ot > 0` on every line, **unless** `no_work_performed` |
| B4 | Daily hours ≤ 24 per day per worker per line, and ≤ 24 summed across a worker's lines for a day |
| B5 | `ded_total = ded_tax_withholdings + ded_fica + ded_other` (8d) |
| B6 | `net_pay = gross_all_work - ded_total` (9) |
| B7 | `gross_all_work ≥ gross_project` (7B ≥ 7A) |
| B8 | `ded_other > 0` requires `ded_other_note` — the form says "MUST SPECIFY" |
| B9 | `fringe_credit_hourly > 0` (6B) requires page-2 fringe credit rows summing **exactly** to it |
| B10 | Any line with `worker_status = 'RA'` requires an apprenticeship program on the worker |
| B11 | `week_ending_date` is unique per project per filer among non-superseded payrolls |
| B12 | Certifying official name, title, phone and email all present |

**Warnings (shown, acknowledged, not blocking — because these are the contractor's calls):**

| # | rule |
|---|---|
| W1 | `rate_st + fringe_credit_hourly + payment_in_lieu_hourly < wd_base_rate + wd_fringe_rate` → **"below the determination rate for this classification"**, with both numbers side by side. The highest-value single check in the product. |
| W2 | `rate_ot < rate_st × 1.5` → CWHSSA expects time-and-a-half over 40 (40 U.S.C. 3702) |
| W3 | `total_hours_st > 40` with `total_hours_ot = 0` |
| W4 | A gap in payroll numbers, or a missing week between the last certified payroll and this one |
| W5 | Hours differ from last week by more than 50% for a worker |
| W6 | `payment_in_lieu_hourly > 0` **and** `fringe_credit_hourly > 0` for the same worker |

**W1 is not blocking, and that is deliberate.** A rate can legitimately be below the
determination's headline (an approved conformance, a different modification governing the
contract, an apprentice percentage). Blocking would make us the enforcer of a judgement that is
legally the contractor's — see the disclaimers in KNOWLEDGE_BASE §9. Showing it, loudly, every
time, plus **recording the acknowledgement** (`payroll_warning_acknowledged {rule_id}`), is the
right amount of help.

> **Settled 2026-09-03 (finding M7, decisions D5 and D6).** `UX.md` §3 A9 made
> `rate-below-determination` and `fringe-missing` **blocking**, and escalated
> `determination-moved` to blocking after 7 days. **This spec wins, on liability grounds**, and
> `UX.md` has been amended to match. Blocking a federal filing on our reading of the customer's
> legal position is the single most dangerous thing this product could do; it contradicts
> `OFFER.md` §5.2 G4, the KNOWLEDGE_BASE §9.3 disclaimer and `WL-09` V11's principle that nothing
> we do may stop a filing deadline. **`determination-moved` never blocks, at any age** — a banner
> on every draft payroll is the whole remedy, and `WL-08` already specifies it. Blocking is
> reserved for what makes the **form** invalid: B1–B12 above, which is why `fringe-missing` stays
> blocking (it is B9 — page 2 cannot be completed without it) while a *low rate* does not.

## Acceptance criteria

- **Given** a project with 12 mapped workers and a certified payroll #7, **when** a new payroll is
  created, **then** `payroll_number` is **null**, the header reads **"payroll #8 (provisional)"**,
  12 lines exist seeded with each worker's mapped classification and rates, and the pin is copied
  from the project. *(M4)*
- **Given** that draft, **when** it is deleted without certifying, **then** the next payroll to
  certify on that project takes **8**, not 9 — no gap is possible. *(M4)*
- **Given** two drafts on one project, **when** the second one certifies first, **then** it takes
  **8**, the first draft's provisional label re-reads **9**, and the unique index holds.
- **Given** a draft, **when** it certifies, **then** `payroll_number` is written **in the same
  transaction** as `status = 'certified'` and `certified_at`, and a double-submit returns the same
  payroll with the same number. *(M4, idempotence)*
- **Given** a project pinned to a **superseded** modification (WL-02, finding B3), **when** a
  payroll is created on it, **then** `payrolls.wd_modification_number` is that superseded
  modification, every seeded rate comes from it, and the draft header carries the permanent
  "a newer modification ({m}) was published on {date}" line — **which never blocks certification**.
  *(WL-02 V3b; D5/D6)*
- **Given** payroll #8, **when** "copy week 7" is clicked, **then** hours, rates, deductions and
  fringe credits are copied, `payroll_copied_from_last_week {lines_copied: 12}` fires, and a
  banner names what was copied.
- **Given** a focused day cell, **when** `Tab` is pressed 7 times, **then** focus lands on the
  next editable cell in reading order with no mouse interaction and no computed cell focused.
- **Given** 25 hours entered in one day cell, **when** it blurs, **then** B4 blocks it inline.
- **Given** `ded_other = 45.00` with no note, **when** certification is attempted, **then** B8
  refuses with the form's own words ("MUST SPECIFY").
- **Given** `fringe_credit_hourly = 10.71` and page-2 credits summing to 9.71, **when**
  certification is attempted, **then** B9 refuses and names the $1.00 difference.
- **Given** a rate of $30.00 against a determination rate of $38.50, **when** the grid renders,
  **then** W1 shows both numbers and certification is still possible after acknowledgement.
- **Given** a week with no covered work, **when** "no work performed" is chosen, **then** the
  payroll certifies with zero lines, consumes its number, and generates a WH-347 marked
  accordingly.
- **Given** a certified payroll, **when** any cell is edited, **then** it is refused — certified
  payrolls are immutable; the path is reopen-and-supersede.
- **Given** two browser tabs certifying the same payroll simultaneously, **when** both submit,
  **then** one succeeds and the other returns the same certified payroll, with exactly one set
  of documents. *(idempotence)*
- **Given** an autosave that fails, **when** connectivity returns, **then** the typed value is
  still on screen and is retried; nothing typed is ever lost silently.

## Edge cases

| case | behaviour |
|---|---|
| **A worker in two classifications in one week** | Two lines, two `worker_entry_no` values, one worker. This is how the WH-347 handles it. B4 checks the 24-hour cap **across** the worker's lines. |
| **A missed week** | W4 warns. Creating payroll #9 for a week two weeks after #8 is allowed — but the app offers to create the intervening "no work performed" payroll first, because a numbered gap is what an auditor notices. |
| **A worker on two projects the same week** | Column (7A) is this project, (7B) is all work. Both are entered by hand in the MVP; WL-21 (Should) automates the split. Help explains it. |
| **A certified payroll turns out to be wrong** | Reopen creates payroll `8R` as a **new** row that supersedes #8; both are retained and both are downloadable, because the original was already filed with the agency. `additional_remarks` carries "Corrects payroll #8". A signed federal statement is never edited in place. |
| **Week ending day is not Saturday** | The workweek is configurable per project (settings default Sunday–Saturday). The 7 array slots are always ordered from the workweek's first day. |
| **More than 8 workers** | Page 1 prints 8 rows; WL-06 paginates. The grid has no limit. |
| **A worker with zero hours all week** | Line is dropped from the generated form (B3 blocks a zero line at certification); the grid keeps it so next week's copy still has them. |
| **Fringe paid partly in cash and partly to a plan** | (6B) is the plan credit, (6C) is the cash. W6 warns when both are set, because it is usually a data-entry error and occasionally correct. |
| **DST week** | Days are dates, not durations; the array is positional. No arithmetic on wall-clock time anywhere. |
| **Rates change mid-week because a modification landed** | Cannot happen: the payroll froze the pin at creation. WL-08 raises it for the *next* payroll. |

## Errors

| condition | user sees | logged |
|---|---|---|
| Autosave fails | per-row "not saved" pill + retry; the value stays on screen | `hours_autosave_failed` |
| Payroll number collision (two tabs) | transparent retry, next number allocated | `payroll_number_collision` |
| Certification fails validation | the validation panel, focused on the first blocking error | `payroll_validation_failed {rule_id}` |
| Generation fails after certification | payroll stays certified, documents show "generating…", job retries | `wh347_generation_failed` |

## Analytics events

**Names are canonical and defined once**, in [`WL-EVENTS.md`](WL-EVENTS.md) §5.

`payroll_created {payroll_number_provisional, seeded_lines}` ← *provisional*, because the real one
is allocated at certification (M4) ·
`payroll_copied_from_last_week {lines_copied}` ·
`hours_grid_opened {worker_count}` · `hours_cell_edited` (sampled 1:20) ·
`hours_keyboard_shortcut_used {shortcut}` ← tells us whether the keyboard model landed ·
`hours_paste_used {cells}` ·
`no_work_performed_filed` ·
`payroll_validation_failed {rule_id}` · `payroll_warning_acknowledged {rule_id}` ·
`payroll_below_determination_rate_warned {delta_cents}` ← the compliance value, measured ·
`payroll_certified {payroll_number, worker_count, minutes_in_grid}` ·
`payroll_reopened {reason}`

`minutes_in_grid` on `payroll_certified` is the metric that proves or disproves the whole
product thesis. DOL says 55 minutes per form. If week 4's median is not under 15, the promise
is not being kept and THRESHOLDS says so.

## Test plan

**Unit** — all 12 blocking rules and all 6 warnings, each with a passing and a failing fixture;
derived columns (5, 8d, 9) recomputed on every mutation; the 24-hour cap summed across a
worker's multiple lines; array indexing for a Sunday-start and a Monday-start workweek.
**Integration (PGlite)** — **payroll number allocation under two concurrent `certifyPayroll`
calls** (no duplicates, no gaps, and the loser retries into the next number); a draft created and
deleted leaves no gap; two drafts certify out of order and the provisional label updates;
`copyLastWeek` from a certified payroll; certification is idempotent under a double-submit; a
certified payroll rejects every mutation; reopen creates a superseding row and retains the
original.
**Keyboard test** — every shortcut in the table above, asserted by key event, and a test that
`hours_keyboard_shortcut_used`'s enumerated values equal the table's rows exactly. *(M5 — the
guard against the two maps drifting apart again.)*
**E2E** — create a project, add 3 workers, map them, enter a full week using only the keyboard
(assert zero mouse events), trip W1 deliberately, acknowledge, certify, and assert two PDFs.
**Performance** — a 60-worker grid renders and stays responsive to typing under 16 ms per
keystroke; autosave batches rather than firing per character.
