# M10 — Settings

**Status:** spec, wave 1. **Effort:** S (~1 dev-day). **Depends on:** M1, M2, M6, M9.

## Story

> As the office manager I want to change who gets the emails, when, and to be able to take my data
> out. As a compliance buyer, "can I export it?" is a question I ask before I enter anything.

Settings is small but two of its items are retention features, not hygiene: **notification
preferences** (the alternative to muting us) and **export** (the alternative to not adopting us).

## Screens

| route | contents |
|---|---|
| `/settings/company` | Legal name, entities, trades, states — the M2 form, reused. |
| `/settings/team` | Members, roles, invite, revoke, pending join requests (M1). |
| `/settings/notifications` | Per-user offsets, muted states, digest time, time zone, pause. Org-level: recipients, CC-the-technician toggle. |
| `/settings/billing` | M9. |
| `/settings/data` | Export everything (CSV bundle + JSON), delete organisation. |
| `/settings/profile` | Name, email (change requires a magic link to the new address). |

## Data model

Adds only:

```ts
export const organisationSettings = pgTable("organisation_settings", {
  organisationId: uuid("organisation_id").primaryKey().references(() => organisations.id, { onDelete: "cascade" }),
  timezone:       text("timezone").notNull().default("America/Chicago"),
  digestHourLocal: integer("digest_hour_local").notNull().default(7),
  ccTechnicians:  boolean("cc_technicians").notNull().default(false),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const exports = pgTable("exports", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  requestedByUserId: uuid("requested_by_user_id").notNull().references(() => users.id),
  status:         text("status", { enum: ["queued","ready","failed","expired"] }).notNull(),
  storageKey:     text("storage_key"),
  expiresAt:      timestamp("expires_at", { withTimezone: true }),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const deletionRequests = pgTable("deletion_requests", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  requestedByUserId: uuid("requested_by_user_id").notNull().references(() => users.id),
  reason:         text("reason"),
  executeAfter:   timestamp("execute_after", { withTimezone: true }).notNull(),   // now + 7 days
  cancelledAt:    timestamp("cancelled_at", { withTimezone: true }),
  executedAt:     timestamp("executed_at", { withTimezone: true }),
});
```

## Server actions

| action | notes |
|---|---|
| `updateOrganisationSettings(patch)` | Admin/owner. Changing the time zone reschedules pending digests. |
| `updateNotificationPreferences(patch)` | Any member, for themselves. |
| `requestExport()` | Queues a job; produces a zip: `technicians.csv`, `licences.csv`, `deadlines.csv`, `ce_records.csv`, `alerts.csv`, `documents/`, `full.json`. Link expires in 7 days. |
| `requestDeletion({ reason })` | Owner only. Sets a **7-day delay**, emails every owner, and is cancellable throughout. |
| `cancelDeletion(id)` | Owner only. |
| `changeEmail({ newEmail })` | Sends a magic link to the new address; the change lands on consumption, never before. |

## Validation

- Time zone must be an IANA name from a fixed list of US zones.
- `digestHourLocal` 5–11 (nobody wants a compliance email at 3 a.m., and after 11 it competes with
  the day's work).
- Export is rate-limited to 3 per organisation per day.
- Deletion requires typing the organisation name, plus the 7-day delay, plus an email to all owners.

## Acceptance criteria

1. Muting Texas stops Texas lines appearing in that user's digest and nobody else's.
2. Changing the time zone from Chicago to New York moves the next digest by an hour, verified in the
   alerts table.
3. Export produces a zip that opens in Excel, contains every licence with its citation columns, and
   contains the uploaded documents.
4. `changeEmail` does not change the email until the new address consumes the link.
5. Deletion is cancellable on day 6 and executed on day 7; after execution, no row anywhere carries
   the organisation id (assert with a schema walk).
6. A `member` cannot reach billing, team management or deletion, by UI or by direct action call.

## Edge cases

- **Owner deletes the organisation while a subscription is active.** Cancel the Stripe subscription
  first, in the same flow, and say so on screen. A billed, deleted account is a chargeback.
- **Export requested by a member.** Allowed — it is their compliance data too — and logged.
- **A 300-licence export with 900 documents.** Runs through the queue; the link is emailed.
- **Time-zone change mid-window.** Digests already queued for today keep their time; the change takes
  effect tomorrow, and the UI says so.
- **Every owner has left the company.** Support escalation path in `11-help-and-support.md`; there is
  no self-serve recovery, deliberately.

## Errors

| condition | user sees |
|---|---|
| Export job fails | "We could not build your export. We have been told." + retry |
| Export link expired | "That link expired. Request a new export." (one click) |
| Deletion executes while an export link is live | Link invalidated; explained in the confirmation email |

## Analytics events

`settings_viewed` (section), `notification_prefs_changed`, `notifications_paused`,
`export_requested`, `export_downloaded`, `deletion_requested` (**with reason — read every one**),
`deletion_cancelled`, `deletion_executed`, `email_change_requested`.

## Test plan

- **Unit:** time-zone conversion for the digest hour, including a DST transition day.
- **Integration:** export contents against a seeded organisation; role enforcement on every action;
  the deletion delay and cancellation.
- **Integration:** post-deletion schema walk finds zero rows for the organisation id.
- **E2E:** change notification preferences, trigger a test alert, assert the muted state is absent.
