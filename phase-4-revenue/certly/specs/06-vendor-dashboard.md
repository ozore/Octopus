# Spec M6 — Vendor status dashboard

**Backlog item:** M6 (Must). **Effort:** M. **Depends on:** M5.

## 1. Story

> As a manager I open one screen each Monday and know, in five seconds, who has lapsed, who lapses this
> month, who has a real gap, and who is fine — and I can act on all of them from that screen.

This is the retention surface. The audit high wears off in week two; the Monday habit is what renews.

## 2. Flow

```
/dashboard
  ├─ five counters:  Expired · Gaps · Expiring 30d · Asserted only · Covered
  │     (each is a filter, not decoration)
  ├─ table, default sort: worst first, then soonest expiry
  ├─ row → vendor detail (M5 results, certificate, history)
  └─ bulk select → { send reminder now · assign type · export selection (M12) }
```

## 3. Screens

| screen | route | states |
|---|---|---|
| Dashboard | `/dashboard` | empty (no vendors) · onboarding-incomplete · loaded · filtered · empty-filter |
| Vendor row expansion | inline | top 3 problems in plain language, "why" link to `explainResult` |
| Needs-review queue | `/review` | documents in `needs_review` (M4), oldest first, with a count badge in the header |

**Empty state is a first-class screen.** A new org sees the M11 checklist, not an empty table with
"No vendors found."

**Counter definitions**, and they must match the report (M12) exactly:
- **Expired** — the earliest required policy expiry is before today (org timezone)
- **Gaps** — ≥ 1 `blocking` requirement in state `gap`, and not expired
- **Expiring 30d** — earliest required expiry within 30 days, no gaps
- **Asserted only** — ≥ 1 requirement in `asserted_only`, no gaps, not expiring
- **Covered** — everything else with an active certificate
- Vendors with **no certificate at all** are counted separately and shown above the table
  ("12 vendors have never sent a certificate"), because they are the most valuable finding for a new
  customer and would otherwise hide inside "gaps".

## 4. Data model

No new tables. Reads `vendors.status` and `vendors.earliestRequiredExpiry` (the M3 caches), joined to
the latest `comparisons` row for detail.

```sql
CREATE INDEX vendors_dashboard ON vendors (org_id, archived_at, status, earliest_required_expiry);
```

## 5. Server actions

| action | signature |
|---|---|
| `getDashboard` | `(orgId, filter, sort, page) → { counters, rows, total }` — one query plus one counter query |
| `getVendorDetail` | `(vendorId) → VendorDetailView` |
| `bulkRemind` | `(vendorIds[]) → { queued, skipped }` — skips vendors with no contact mailbox or paused reminders, and says how many |
| `getReviewQueue` | `(orgId) → ExtractionSummary[]` |

## 6. Validation

- every query is org-scoped at the repository layer, not in the caller
- page size 50; sort keys restricted to a closed set (no client-supplied SQL fragments)
- counters and the table are computed from the same predicates, in one module, so they cannot drift

## 7. Acceptance criteria

**A1** Given 80 vendors — 3 expired, 7 gaps, 12 expiring within 30 days, 20 asserted-only, 38 covered —
Then the counters read exactly 3 / 7 / 12 / 20 / 38 and sum to 80.
**A2** Given I click "Expired", Then the table shows exactly those 3 and the filter is reflected in the
URL (shareable, reloadable).
**A3** Given default sort, Then expired vendors are first, then gaps, then soonest expiry.
**A4** Given a vendor with an `asserted_only` additional-insured result, Then the row reads
"Additional insured — claimed, not evidenced" and not "compliant".
**A5** Given 12 vendors with no certificate at all, Then a line above the table says so and links to a
filtered view.
**A6** Given I bulk-select 10 vendors and send reminders, and 2 have no contact mailbox, Then 8 are
queued and the result names the 2 that were skipped and why.
**A7** Given an org with zero vendors, Then the M11 onboarding checklist is shown instead of an empty
table.
**A8** Given 5 documents in `needs_review`, Then the header badge shows 5 and `/review` lists them
oldest first.
**A9** Given any dashboard state, Then the §F.1 disclaimer is present.

## 8. Edge cases

| case | behaviour |
|---|---|
| Vendor with a certificate that is `needs_review` | status `no_certificate` **until** review completes — an unreviewed extraction must never colour a vendor green |
| Vendor archived mid-session | excluded on next load; no error |
| 5,000 vendors | server-side pagination; counters are a single aggregate query, not a page scan |
| Requirement set changed since the last comparison | row shows a "requirements changed" chip linking to re-evaluate |
| Two certificates uploaded the same day | the newest `active` one drives status; the other is `superseded` and visible in history |
| Timezone: a policy expiring today | not expired until the org's local midnight (M5 §7) |

## 9. Errors

A failed counter query degrades to the table without counters and logs; it never blanks the page. A
failed row query shows a retry affordance.

## 10. Analytics

`dashboard_viewed{covered,gaps,expiring,expired,asserted_only,no_certificate}`,
`dashboard_filtered{filter}`, `dashboard_sorted{key}`, `vendor_opened_from_dashboard{status}`,
`bulk_remind_clicked{selected,queued,skipped}`, `review_queue_opened{depth}`.

`dashboard_viewed` per user per week is the **retention proxy** measured in `THRESHOLDS.md` §2 —
month-2 retention is defined as an org whose dashboard was opened in ≥ 2 distinct weeks of month 2.

## 11. Test plan

Unit: the status roll-up precedence (`expired > gap > expiring > asserted_only > covered`); counters
and table share one predicate module (a test asserts both call it).
Integration (PGlite): 1,000-vendor fixture; counters sum to the total; pagination stability under a
concurrent status change.
e2e: load → counters → click a counter → filtered URL → open a vendor → see the three-state results.
Performance: dashboard query under 200 ms at 5,000 vendors on the CI database.
