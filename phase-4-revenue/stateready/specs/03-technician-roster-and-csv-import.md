# M3 — Technician roster and CSV import

**Status:** spec, wave 1. **Effort:** M (~2–3 dev-days). **Depends on:** M1, M2. **Blocks:** M4, M13.

## Story

> As the office manager, I have a spreadsheet with 47 technicians, their licence numbers and their
> expiry dates. I want to drag it in and see it in the product, not retype it. If your import makes
> me clean the file first, I will close the tab and go back to the spreadsheet.

Import is the activation event (`THRESHOLDS.md`). It has to succeed on a real, messy spreadsheet:
merged headers, blank rows, dates in four formats, a "Notes" column full of prose.

## Flow

```
/roster  →  "Import from spreadsheet"
  1  drop .csv or .xlsx (converted client-side to CSV rows)
  2  we guess the header mapping and show it        ← the whole trick is here
  3  the user corrects the mapping (dropdowns)
  4  preview: first 10 rows as they will be saved, with per-cell warnings
  5  "Import 47 technicians" → job queued → progress → result summary
  6  result: created / updated / skipped, with a downloadable CSV of the skipped rows and why
```

Import runs through the jobs table and cron-drained queue (PLAN.md A12) when the file is over 200
rows; under that it runs inline so the user sees the result immediately.

## Screens

| screen | contents |
|---|---|
| `/roster` | Table: name, primary state, trade, licences held, next deadline, status chip. Filter by state, trade, status. Empty state is the import CTA, not a "no data" shrug. |
| `/roster/import` | The five-step wizard above, one screen with sections, not five pages. |
| `/roster/:id` | One technician: details, their licences (M4), their deadline timeline. |

## Data model

```ts
export const technicians = pgTable("technicians", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  entityId:       uuid("entity_id").references(() => entities.id),
  firstName:      text("first_name").notNull(),
  lastName:       text("last_name").notNull(),
  employeeRef:    text("employee_ref"),          // the customer's own payroll/ID number
  email:          text("email"),                 // optional; used only to CC them on their own alerts
  primaryState:   char("primary_state", { length: 2 }),
  primaryTrade:   text("primary_trade", { enum: ["hvac","plumbing","electrical"] }),
  status:         text("status", { enum: ["active","inactive","left"] }).notNull().default("active"),
  externalRowHash: text("external_row_hash"),    // dedupe key for re-imports
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOrg: index().on(t.organisationId, t.status),
  uniqueRef: unique().on(t.organisationId, t.employeeRef),   // null-safe in Postgres: many nulls allowed
}));

export const imports = pgTable("imports", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  userId:         uuid("user_id").notNull().references(() => users.id),
  filename:       text("filename").notNull(),
  rowCount:       integer("row_count").notNull(),
  mapping:        jsonb("mapping").notNull(),    // { csvHeader: field }
  created:        integer("created").notNull().default(0),
  updated:        integer("updated").notNull().default(0),
  skipped:        integer("skipped").notNull().default(0),
  errorsCsv:      text("errors_csv"),            // the rejected rows, ready to download
  status:         text("status", { enum: ["mapping","running","done","failed"] }).notNull(),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**No phone number, no home address, no date of birth, no SSN.** The NEVER list in `BACKLOG.md` is
enforced here by the absence of the columns, not by a policy document.

## Server actions / API

| action | notes |
|---|---|
| `parseImportPreview({ fileId })` | Parses, sniffs the delimiter, detects the header row (first row where ≥ 60% of cells are non-numeric and non-empty), returns headers, 10 sample rows and a guessed mapping. |
| `guessMapping(headers)` | Pure function, unit-tested against a fixture set of real-world header names — "Tech Name", "Employee", "Lic #", "License Number", "Exp", "Expiration", "State", "Trade", "CE Due". |
| `runImport({ importId, mapping, dryRun })` | Validates every row, then writes. `dryRun` returns the same summary without writing; the preview step uses it. |
| `downloadImportErrors({ importId })` | Returns the rejected rows plus a `reason` column. |
| `createTechnician` / `updateTechnician` / `archiveTechnician` | Manual paths; archive, never delete. |

A single CSV row may create a technician **and** a licence (M4), because that is how the customer's
spreadsheet is shaped. The import writes both in one transaction per row.

## Validation

- File ≤ 5 MB, ≤ 5,000 rows. Larger: "split the file" with the exact row count seen.
- Required per row after mapping: last name, and either (state + trade) or a licence with a state.
- Dates accepted: `MM/DD/YYYY`, `M/D/YY`, `YYYY-MM-DD`, `DD-MMM-YYYY`, Excel serial numbers.
  **Ambiguous `01/02/2026` is resolved US-style (2 January)** and the choice is stated on the preview
  screen with a toggle, because getting it silently wrong moves a deadline by ten months.
- Licence number: free text, trimmed, ≤ 64 chars, stored as given (formats vary wildly by board).
- Unknown state or trade in a cell → row is skipped with a reason, never guessed.

## Acceptance criteria

1. A 47-row CSV with headers `Tech Name, State, Trade, License #, Expires` imports with zero manual
   mapping corrections.
2. A file whose first two rows are a title and a blank line still finds the header row.
3. Re-importing the same file updates rather than duplicates (match on `employeeRef` if present,
   else on normalised name + state).
4. A row with an unparseable date is skipped, not defaulted, and appears in the error CSV with
   `reason = "could not read expiry date '31/13/2026'"`.
5. Import of 5,000 rows completes through the queue without an HTTP timeout and the user can leave
   the page and come back to the result.
6. The preview shows the exact number of technicians and licences that will be created before
   anything is written.

## Edge cases

- **One person, several licences, several states.** The customer's sheet has one row per licence.
  Dedupe must collapse them to one technician with several licences, and must not collapse two
  genuinely different people with the same common surname in the same state (which is why
  `employeeRef` is the preferred key and the name key requires first name too).
- **Names with commas, quotes, accents, suffixes ("Jr.").** Parser must be a real CSV parser, not a
  split on comma. Fixture file includes all four.
- **A "Notes" column of prose.** Mapped to nothing; must not block the import.
- **Expiry dates in the past.** Imported as-is and immediately shown as `expired`. Silently dropping
  them would hide exactly the problem the customer came to solve.
- **The same file imported twice by two users at once.** Row-level upsert plus a unique constraint;
  the second import reports "updated", not "created".
- **A technician who has left.** Status `left` keeps the history and stops the alerts. Deleting them
  would break the audit trail we sell.

## Errors

| condition | user sees |
|---|---|
| Not a CSV/XLSX | "We can read .csv and .xlsx. This looked like a PDF." |
| No header row found | Mapping step with all columns unmapped and a "my file has no headers" toggle |
| All rows invalid | "We could not read any rows. Here is why for the first ten." + error CSV |
| Job fails mid-run | Import marked `failed`; rows already written are kept (they are valid) and the summary says exactly how many; a retry only processes the remainder |

## Analytics events

`import_started`, `import_mapping_confirmed` (with `corrections_made`), `import_previewed`,
`import_completed` (with `created`, `updated`, `skipped`, `duration_ms`), `import_failed`,
`technician_created_manually`, `roster_viewed`. `import_completed` with `created > 0` is one of the
two routes to activation.

## Test plan

- **Unit:** `guessMapping` against ≥ 20 real-world header spellings; date parser against every
  accepted format plus the ambiguous case; CSV parser against the awkward-names fixture.
- **Integration (PGlite):** import → re-import idempotency; one row creating both a technician and a
  licence in one transaction; partial failure leaving valid rows written.
- **Property test:** for any generated roster of ≤ 200 rows, `created + updated + skipped == rowCount`.
- **Performance:** 5,000 rows through the queue in under 60 s in CI.
- **E2E:** drop the sample file, accept the mapping, import, land on a roster of 47 with a deadline
  visible on at least one — this is the activation moment and it is the middle of the recorded journey.
