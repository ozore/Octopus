# Spec M3 — Vendor directory and CSV import

**Backlog item:** M3 (Must). **Effort:** M. **Depends on:** M1, M2.

## 1. Story

> As a manager with 80 vendors in a spreadsheet, I upload that spreadsheet, map three columns, and my
> whole vendor list is in Certly in two minutes — with each vendor's type set so the right requirements
> apply.

Time-to-first-value is the whole point. A tool you must hand-type 80 vendors into gets abandoned before
the first certificate is ever uploaded, which means activation (`THRESHOLDS.md` §1) never happens.

## 2. Flow

```
/vendors → "Add vendors" → { add one | import CSV }

import: upload .csv/.tsv (or paste)
   → parse & sniff delimiter, encoding, header row
   → column mapper (we guess; the user confirms)     ← the screen that decides whether import works
   → preview first 10 rows + row-level problems
   → import → per-row result: created | updated | skipped(reason)
   → "N vendors imported. 3 rows need attention." → downloadable error CSV of just those rows
```

## 3. Screens

| screen | route | notes |
|---|---|---|
| Vendor list | `/vendors` | table: name · type · status · earliest expiry · last certificate. Search, filter by type/status, bulk-select |
| Vendor detail | `/vendors/[id]` | header (name, type, contact mailbox), current certificate + comparison (M5), certificate history, reminder schedule (M7), activity (M9) |
| Add vendor | modal | name, legal name (optional), type, business contact email, optional external reference |
| CSV import | `/vendors/import` | upload → map → preview → result |

**The column mapper is the make-or-break screen.** Guess from headers (`vendor`, `company`, `name`,
`contractor`, `sub`, `trade`, `email`, `contact email`, `type`, `category`), show the guess, let it be
changed, and never fail the whole file because one column was unexpected.

## 4. Data model (Drizzle-ready)

```ts
vendors {
  id, orgId,
  name: text notNull,                 // display name
  legalName: text,                    // used by M5's name match when present
  vendorTypeId: uuid references vendorTypes,   // null → org default requirement set
  contactEmail: citext,               // A BUSINESS MAILBOX THE CUSTOMER ENTERED. See §6.
  contactLabel: text,                 // e.g. "office", "accounts" — never a person's name
  externalRef: text,                  // their own vendor id, carried through exports
  status: text,                       // derived cache: 'covered'|'asserted_only'|'expiring'|'gap'|'expired'|'no_certificate'
  earliestRequiredExpiry: date,       // derived cache from the active comparison
  remindersPaused: boolean default false,
  archivedAt: timestamp,
  createdAt, updatedAt
}
// unique index on (orgId, lower(name)) — advisory: a soft warning, not a hard constraint (§9)

csvImports {
  id, orgId, userId, filename, bytes, rowCount,
  mapping: jsonb, createdCount, updatedCount, skippedCount,
  status: 'parsing'|'mapping'|'importing'|'done'|'failed',
  errorsCsvKey: text, createdAt
}
```

`status` and `earliestRequiredExpiry` are **caches of M5's output**, recomputed on every comparison.
They exist so the dashboard is one indexed query rather than a join across four tables; they are never
written by hand.

## 5. Server actions

| action | signature | notes |
|---|---|---|
| `createVendor` | `(input) → vendorId` | |
| `updateVendor` | `(vendorId, patch) → VendorView` | changing `vendorTypeId` enqueues re-evaluation |
| `archiveVendor` | `(vendorId) → void` | archive, never delete — certificates and audit rows are evidence |
| `parseCsv` | `(fileOrText) → { headers, sample, guessedMapping, delimiter, encoding }` | no writes |
| `importCsv` | `(importId, mapping) → ImportResult` | idempotent per `(orgId, importId)`; runs in a job above 200 rows |
| `bulkAssignType` | `(vendorIds[], vendorTypeId) → void` | |

## 6. Validation

| field | rule |
|---|---|
| `name` | required, 1–200 chars, trimmed |
| `contactEmail` | optional but **strongly prompted**: without it M7 cannot chase, which is half the product. Valid shape, ≤ 254 chars |
| `vendorTypeId` | must belong to the org |
| `externalRef` | ≤ 100 chars |
| CSV file | ≤ 5 MB, ≤ 5,000 rows, UTF-8/UTF-16/Latin-1 sniffed, BOM stripped, `,`/`;`/tab sniffed |
| CSV row | a row missing `name` is **skipped with a reason**, never silently dropped and never allowed to abort the import |

**Personal-data rule, binding.** `contactEmail` is a mailbox the customer types in. Certly never
scrapes, purchases, guesses or infers a contact address, and stores no personal name for a vendor
contact (`contactLabel` is a role, not a person). The only other address Certly may email is the
**producer email printed on a certificate the customer was given** (M7). This is PLAN §D5 and the phase-3
standing rule, expressed as a schema.

## 7. Acceptance criteria

**A1** Given a CSV with headers `Company,Trade,Email`, When I upload it, Then the mapper pre-selects
`Company→name`, `Trade→vendorType`, `Email→contactEmail`, and I can change any of them.
**A2** Given a 500-row CSV where 3 rows have no company name, Then 497 are imported, 3 are skipped, the
result says so, and I can download a 3-row CSV containing exactly those rows plus a `reason` column.
**A3** Given a CSV whose `Trade` values include types that do not yet exist, Then I am offered
"create 4 new vendor types" with the list, and declining maps those vendors to the org default.
**A4** Given a CSV containing a vendor name already present in the org, Then the row **updates** the
existing vendor (never duplicates), and the result counts it under `updated`.
**A5** Given a semicolon-delimited, Latin-1, BOM-prefixed export from Excel, Then it parses correctly.
**A6** Given I archive a vendor, Then it disappears from the dashboard, its certificates and audit
history remain, and its scheduled reminders are cancelled.
**A7** Given a vendor with no `contactEmail`, When I view it, Then a persistent prompt explains that
Certly cannot chase renewals for this vendor until a mailbox is added.
**A8** Given 5,001 rows, Then the import is refused before parsing with a clear message.

## 8. Edge cases

| case | behaviour |
|---|---|
| Excel "CSV" that is really tab-separated | sniffed |
| A single column with `Name <email@x.com>` | split on the angle brackets in the mapper preview and offer both mappings |
| Duplicate rows inside one file | last one wins; counted once in `updated` |
| Trailing blank rows / a totals row | rows with no `name` are skipped with a reason |
| 4,000 rows | runs as a job; the screen shows progress and survives a reload |
| Same file uploaded twice | a second `csvImports` row; vendors update rather than duplicate |
| Vendor renamed at the source system | matched on `externalRef` when mapped, else on name |

## 9. Errors

- Import never fails as a whole because of bad rows. It fails only on: unreadable file, no header row,
  no column mapped to `name`, or over the size/row cap.
- Duplicate name on manual create → a **warning with a link to the existing vendor** and a "create
  anyway" button. Two legitimately different vendors can share a name; a hard constraint would block
  real work.

## 10. Analytics

`vendor_created{source:'manual'|'csv'}`, `vendor_updated{field}`, `vendor_archived`,
`csv_import_started{bytes,rows}`, `csv_columns_mapped{auto_accepted:boolean}`,
`csv_import_completed{rows,created,updated,skipped,ms}`, `csv_import_failed{reason}`,
`vendor_type_created{source:'csv'}`, `vendor_missing_contact_prompt_shown`.

`csv_columns_mapped.auto_accepted` measures whether our header guessing works. If it is below ~70%,
the mapper is the activation bottleneck, not the uploader.

## 11. Test plan

Unit: delimiter/encoding sniffing across 12 fixture files (Excel Windows, Excel Mac, Google Sheets,
AppFolio-style export, Buildium-style export, semicolon European, UTF-16LE, BOM, quoted commas,
embedded newlines, CRLF, ragged rows); header-guessing accuracy on those headers.
Integration (PGlite): 500-row import, upsert-on-name, type creation, job path above 200 rows,
idempotency on retry.
e2e: upload → map → preview → import → vendor list shows the count; download the error CSV.
