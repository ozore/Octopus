# M4 — Licence records and document upload

**Status:** spec, wave 1. **Effort:** M (~2–3 dev-days). **Depends on:** M2, M3, M14. **Blocks:** M5, M6, M7.

## Story

> As the office manager, I want each licence we hold — the company's Texas ACR contractor licence,
> Dave's Master Electrician, the Florida CF — to be one row I can open, with the number, the dates,
> and a photo of the card, so that when a GC asks me for proof I send it in ten seconds instead of
> going to the filing cabinet.

## Flow

```
/licences  →  "Add licence"
  1  who holds it?      company entity  |  technician
  2  where?             state (from the company's states, but any state allowed)
  3  what?              licence type — a picker fed by the knowledge base for covered states,
                        free text for uncovered ones
  4  the numbers        licence number, issue date, expiry date (optional: we can derive it)
  5  proof              drag the card / PDF (optional)
  → saved → the deadline panel appears immediately, showing what M5 derived and why
```

Step 5 is optional and step 4's expiry is optional **because M5 can derive it** from the issue date
and the KB's `expiry_rule`. Showing the customer a date they did not type, correctly, in the first
minute, is the product's first proof that it is not a spreadsheet.

## Screens

| screen | contents |
|---|---|
| `/licences` | Grouped by state, then entity/technician. Columns: type, number, holder, expiry, CE status, source chip. Filters: state, trade, status, expiring within N days. |
| `/licences/new` | The five-step form above, as one page. |
| `/licences/:id` | Header (type, number, holder, status). Three panels: **Dates** (issue, expiry, derived-vs-entered, CE due), **Requirements** (CE hours, bond, insurance, all with citations from the KB), **Documents**. |
| Document viewer | Inline for images and PDFs; download for anything else. |

## Data model

```ts
export const licences = pgTable("licences", {
  id:              uuid("id").primaryKey().defaultRandom(),
  organisationId:  uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  holderKind:      text("holder_kind", { enum: ["entity","technician"] }).notNull(),
  entityId:        uuid("entity_id").references(() => entities.id),
  technicianId:    uuid("technician_id").references(() => technicians.id),
  state:           char("state", { length: 2 }).notNull(),
  trade:           text("trade", { enum: ["hvac","plumbing","electrical"] }).notNull(),
  kbLicenceTypeId: text("kb_licence_type_id"),      // e.g. "tx.hvac.acr_contractor_class_a"; null when uncovered
  customTypeName:  text("custom_type_name"),        // used only when kbLicenceTypeId is null
  licenceNumber:   text("licence_number"),
  issuedOn:        date("issued_on"),
  expiresOn:       date("expires_on"),              // may be user-entered or derived; see expirySource
  expirySource:    text("expiry_source", { enum: ["entered","derived","board_verified"] }).notNull().default("entered"),
  ceDueOn:         date("ce_due_on"),
  ceHoursRequired: integer("ce_hours_required"),
  ceHoursRecorded: integer("ce_hours_recorded").notNull().default(0),
  status:          text("status", { enum: ["active","expiring","expired","archived"] }).notNull().default("active"),
  notes:           text("notes"),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byOrgExpiry: index().on(t.organisationId, t.expiresOn),
  holderCheck: check("holder_xor", sql`(holder_kind='entity') = (entity_id IS NOT NULL)`),
}));

export const licenceDocuments = pgTable("licence_documents", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  licenceId:      uuid("licence_id").notNull().references(() => licences.id, { onDelete: "cascade" }),
  filename:       text("filename").notNull(),
  contentType:    text("content_type").notNull(),
  byteSize:       integer("byte_size").notNull(),
  storageKey:     text("storage_key").notNull(),
  sha256:         text("sha256").notNull(),
  uploadedByUserId: uuid("uploaded_by_user_id").notNull().references(() => users.id),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ceRecords = pgTable("ce_records", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  licenceId:      uuid("licence_id").notNull().references(() => licences.id, { onDelete: "cascade" }),
  hours:          numeric("hours", { precision: 5, scale: 2 }).notNull(),
  subject:        text("subject"),          // matched against kb subject_breakdown where present
  provider:       text("provider"),
  completedOn:    date("completed_on").notNull(),
  documentId:     uuid("document_id").references(() => licenceDocuments.id),
});
```

`expirySource` is deliberately visible in the UI. "You entered this" and "we worked this out from
Texas's rule" are different levels of trust and the customer is entitled to know which they are
looking at.

## Server actions / API

| action | notes |
|---|---|
| `createLicence(input)` | Validates, calls the rules engine (M5) for `expiresOn` when not supplied and always for `ceDueOn`/`ceHoursRequired`, writes, schedules alerts (M6). |
| `updateLicence(id, patch)` | Any date change re-runs derivation and reschedules alerts in the same transaction. |
| `archiveLicence(id)` | Cancels pending alerts. Never deletes. |
| `listLicenceTypes({ state, trade })` | From the KB; returns `[]` with a `covered:false` flag for uncovered states, which switches the UI to free text. |
| `uploadDocument({ licenceId, file })` | Presigned upload; server records metadata after a HEAD confirms the object. |
| `addCeRecord({ licenceId, hours, subject, completedOn })` | Recomputes `ceHoursRecorded` and the per-subject shortfall. |

## Validation

- `issuedOn` not in the future; `expiresOn` after `issuedOn`; both within 1970–2100.
- `licenceNumber` ≤ 64 chars; stored verbatim (Texas `TACL/A/000000/C`, Florida `CAC1812345`, NC
  numeric — no normalisation, it would corrupt them).
- Exactly one of `entityId` / `technicianId`, enforced by the DB check constraint above.
- `kbLicenceTypeId` must resolve to a **publishable** KB licence type or be null.
- Documents: ≤ 20 MB; `image/jpeg`, `image/png`, `image/heic`, `application/pdf` only. Content
  sniffed, not trusted from the extension.
- CE hours: 0 < hours ≤ 100 per record; `completedOn` not in the future.

## Acceptance criteria

1. Creating a Texas ACR Class A licence with only an issue date fills in an expiry exactly 12 months
   later, marks it `derived`, and shows the TDLR sentence and URL it came from.
2. Creating a North Carolina electrical Unlimited licence with an issue date of 14 March 2026 derives
   an expiry of 14 March 2027 (anniversary), while a North Carolina plumbing licence derives
   31 December 2026 (fixed date) — the same state, two different rules, both correct.
3. Creating a Florida certified plumbing licence derives 31 August of the next even year.
4. A licence in an uncovered state saves with a free-text type, no derived date, and a visible
   "we cannot derive deadlines for Ohio yet" banner.
5. Uploading a 3 MB photo of a wallet card attaches it, renders a thumbnail, and downloads intact
   (sha256 match).
6. Changing the issue date re-derives the expiry and reschedules the alert set, verified by the
   alerts table.
7. Adding 8 CE hours to a Texas ACR licence marks CE satisfied; adding 8 hours to a Florida licence
   does **not**, because Florida's 14 hours are subject-specific.

## Edge cases

- **Customer enters an expiry that contradicts the derived one.** We keep the customer's value
  (`expirySource = entered`), show both, and say "Texas's rule would put this at 4 June 2027 —
  check your card". We never silently overwrite. This disagreement is a feature: it is usually a
  typo, and finding it is worth the subscription.
- **Licence type not in the KB for a covered state** (e.g. a Texas technician registration, which is
  a documented coverage gap). Free text, no derivation, banner naming the gap.
- **A licence held by a technician who leaves.** Licence goes `archived` with the technician;
  alerts cancel; the record and its documents stay.
- **The same licence entered twice** (once by import, once manually). Soft duplicate warning on
  `state + licenceNumber`, not a hard block — some boards reuse numbers across classes.
- **Expiry inside the alert window at creation.** All still-future alerts fire; past ones do not
  backfill, and the UI says "this expires in 12 days" on the confirmation screen.
- **HEIC uploads from an iPhone.** Accepted; converted to JPEG for the thumbnail, original retained.
- **A KB record becomes unpublishable** (drift, M14). Licences keep working from the last good
  snapshot and are flagged; deadlines are never silently recomputed from unverified data.

## Errors

| condition | user sees |
|---|---|
| Upload too large | "That file is 34 MB. The limit is 20 MB — a phone photo is usually under 5." |
| Wrong file type | "We can take a photo or a PDF." |
| Storage unavailable | Licence still saves; document upload retryable from the licence page |
| Derivation impossible (KB gap) | Inline: "We do not have Ohio HVAC rules yet, so you will need to enter the expiry date." Never a blank field with no reason. |

## Analytics events

`licence_created` (with `state`, `trade`, `expiry_source`, `covered`), `licence_updated`,
`licence_archived`, `licence_deadline_derived` (**the activation event** in `THRESHOLDS.md`),
`document_uploaded`, `ce_record_added`, `licence_expiry_conflict_shown`,
`uncovered_state_licence_created`.

## Test plan

- **Unit:** the holder XOR constraint; licence-number preservation for the three real formats;
  content sniffing for a `.pdf` that is actually a `.exe`.
- **Integration:** the three derivation cases in acceptance criteria 1–3 against the real
  `kb-data/` records — these double as regression tests on the knowledge base itself.
- **Integration:** changing a date reschedules exactly the right alert rows and cancels the old ones.
- **Security:** a document URL from organisation A returns 404 for a session in organisation B.
- **E2E:** add one licence with only an issue date and see a derived deadline — the last step of the
  recorded activation journey.
