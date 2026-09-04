# Spec M9 — Audit trail

**Backlog item:** M9 (Must). **Effort:** S. **Depends on:** M4, M5.

## 1. Story

> As a manager whose owner has just asked "how do you know this vendor was covered in March?", I open
> the vendor, scroll to activity, and show exactly what arrived, when, what it said, what was compared
> against what, and every value a person changed — with names and timestamps.

Sold as compliance. Needed for something else too: **it is the only truthful record of how good our own
extraction is.** Every `field_corrections` row is a labelled example and an eval candidate
(`THRESHOLDS.md` §4).

## 2. Flow

Every state-changing action writes one append-only row, in the **same transaction** as the change. If
the audit write fails, the change fails. An audit trail that can be silently skipped is decoration.

## 3. Screens

| screen | route | notes |
|---|---|---|
| Vendor activity | `/vendors/[id]` (tab) | reverse-chronological, plain sentences: "Certificate received from the vendor link · 14 Nov 2026, 09:12" |
| Org activity | `/settings/activity` | all events, filter by kind/actor/date, paginated |
| Export | button | CSV of the filtered range; a PDF appendix is part of the M12 report |

Rendering rule: **sentences, not JSON.** "Ana changed General liability each occurrence from $500,000
to $1,000,000" — not `{"path":"/coverages/0/limits/0/amount"}`.

## 4. Data model (Drizzle-ready)

```ts
auditEvents {
  id: uuid pk,
  orgId: uuid notNull,
  actorKind,          // 'user' | 'vendor_link' | 'system' | 'inbound'
  actorUserId: uuid,  // null unless actorKind='user'
  actorLabel: text,   // 'vendor upload link' | 'Certly (automatic)' — for non-user actors
  kind: text notNull, // closed set, §5
  subjectType: text,  // 'vendor'|'document'|'extraction'|'certificate'|'comparison'|
                      // 'requirement_set'|'reminder'|'org'|'membership'|'subscription'
  subjectId: uuid,
  summary: text notNull,  // the rendered sentence, written at write time
  payload: jsonb,         // before/after, ids, reasons — never the document bytes
  createdAt: timestamp notNull defaultNow()
}
// index (orgId, createdAt desc), (orgId, subjectType, subjectId, createdAt desc)
// NO update, NO delete: enforced by a Postgres rule/trigger, not by convention
```

**`summary` is written at write time, not rendered at read time.** If we later change how we phrase an
event, history must not silently change with it — the record is what was true then.

## 5. Event kinds (closed set)

`vendor.created` `vendor.updated` `vendor.archived` `vendor.type_assigned`
`document.uploaded` `document.rejected` `document.duplicate`
`extraction.succeeded` `extraction.failed` `extraction.field_corrected` `extraction.review_completed`
`certificate.promoted` `certificate.superseded`
`comparison.run` `comparison.reevaluated`
`requirements.set_created` `requirements.set_edited` `requirements.assigned` `requirements.template_applied`
`reminder.scheduled` `reminder.sent` `reminder.bounced` `reminder.paused` `reminder.unsubscribed`
`link.created` `link.revoked` `link.opened` `link.upload_received`
`org.settings_changed` `org.entity_block_changed` `member.invited` `member.role_changed`
`billing.trial_started` `billing.subscription_changed`
`data.exported` `data.deleted`

## 6. Server actions

| action | signature |
|---|---|
| `writeAuditEvent` | internal only, called inside the caller's transaction; **not** a server action |
| `getVendorActivity` | `(vendorId, cursor) → AuditEvent[]` |
| `getOrgActivity` | `(orgId, filter, cursor) → AuditEvent[]` |
| `exportAudit` | `(orgId, range, filter) → csvKey` — writes `data.exported` about itself |

## 7. Validation

- org-scoped on every read
- `summary` ≤ 500 chars, never contains extracted document content beyond a field value
- `payload` never contains: file bytes, session tokens, upload-link raw tokens, Stripe secrets, or an
  email address other than one already visible to the org
- retention: for the life of the org plus 90 days after deletion request (matching the M13 deletion
  policy); audit rows are the **last** thing deleted

## 8. Acceptance criteria

**A1** Given a certificate is uploaded through a vendor link, Then an event exists with
`actorKind='vendor_link'`, `actorLabel='vendor upload link'`, `actorUserId` null.
**A2** Given a reviewer changes `policy_exp`, Then an `extraction.field_corrected` event records the
old value, the old confidence, the old gate state and the new value, and the vendor activity shows a
readable sentence.
**A3** Given a comparison runs, Then the event payload contains `requirementSetVersion`,
`engineVersion` and `extractionId` — the three ids that make the result reproducible (M5 §5).
**A4** Given someone attempts `UPDATE audit_events`, Then the database rejects it.
**A5** Given I export activity for a date range, Then the CSV contains those events **and** a final row
recording the export itself.
**A6** Given an org with 50,000 events, Then vendor activity pages in under 300 ms.
**A7** Given a change whose audit write fails, Then the whole transaction rolls back and the change
does not happen.

## 9. Edge cases

| case | behaviour |
|---|---|
| System actor (cron, job) | `actorKind='system'`, `actorLabel='Certly (automatic)'` |
| User later removed from the org | events keep `actorUserId`; the UI renders the email captured in `payload.actorEmail` at write time |
| Bulk action over 200 vendors | one event per vendor **plus** one `bulk` summary event; the UI collapses them |
| Extraction retried | one event per attempt, with the attempt number |
| Very large `payload` | truncated to 8 KB with `payload_truncated: true` |

## 10. Errors

There is no user-facing error path: audit writes are internal and transactional. A failure surfaces as
the failure of the action that caused it.

## 11. Analytics

`activity_viewed{scope}`, `activity_filtered{kind}`, `audit_exported{events,range_days}`.

Low usage is not a reason to cut this. It is read on the two days a year that decide whether the
customer renews — an owner audit and an insurance claim.

## 12. Test plan

Unit: the sentence renderer for every event kind (a test that enumerates the closed set and asserts a
non-empty, non-JSON summary for each — this catches a new kind added without copy).
Integration (PGlite): the immutability trigger rejects update and delete; a forced audit-write failure
rolls back the parent change; pagination stability with concurrent inserts.
e2e: upload → correct a field → open activity → three readable sentences in order.
