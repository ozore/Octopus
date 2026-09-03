# Spec M6 — Vendor status dashboard

**Backlog item:** M6 (Must). **Effort:** M. **Depends on:** M5.

## 1. Story

> As a manager I open one screen each Monday and know, in five seconds, who has lapsed, who lapses this
> month, who has a real gap, who has never sent anything, and who is fine — and I can act on all of
> them from that screen.

This is the retention surface. The audit high wears off in week two; the Monday habit is what renews.

## 2. Flow

```
/dashboard
  ├─ six counters:  Expired · Gaps · Expiring 30d · Claimed, not evidenced ·
  │                 Meets requirements · No certificate
  │                 (the seven status states are IDENTITY.md §6.4; the mapping is specs/05 §2.1)
  │     (each is a filter, not decoration; they are mutually exclusive and sum to the roster)
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

**The six vendor states.** Canonical list, copied verbatim from `specs/05` §2 and shared with M12,
M15, `UX.md`, `OFFER.md` and `LANDING_SPEC.md` (REVIEW.md §2.2). **"Covered" is not a status word
here or anywhere else** (REVIEW.md B-02, §2.1); the green state is `meets`, shown as
**"Meets requirements"**.

| value | counter label | definition |
|---|---|---|
| `expired` | **Expired** *(renders in the `gap` ramp with its own word — `specs/05` §2.1)* | an active certificate exists and the earliest required policy expiry is before today (org timezone) |
| `gap` | **Gaps** | ≥ 1 `blocking` requirement in state `gap`, and not expired |
| `expiring` | **Expiring 30d** *(status state `expiring`, word "Expiring in N days" on a row — `IDENTITY.md` §6.4)* | earliest required expiry within 30 days, no gaps |
| `asserted_only` | **Claimed, not evidenced** | ≥ 1 requirement in `asserted_only`, no gaps, not expiring |
| `meets` | **Meets requirements** *(pill `MEETS`)* | an active certificate, and everything else resolved |
| `no_certificate` | **No certificate** | no active certificate at all — including a vendor whose only certificate is still in `needs_review` |

**The sum rule, stated so it cannot drift (REVIEW.md MN-12).** The six buckets are **mutually
exclusive and exhaustive over the non-archived vendor roster**: every non-archived vendor is in
exactly one, and the six counters sum to the roster. `no_certificate` is a counter like the others —
it is *also* surfaced as a line above the table ("12 vendors have never sent a certificate") because
it is the most valuable finding for a new customer, but it is no longer counted "separately" outside
the arithmetic, which is what previously left a vendor in neither the counters nor the sum.

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

**A1** Given 80 non-archived vendors — 3 expired, 7 gaps, 12 expiring within 30 days, 20
claimed-not-evidenced, 26 meeting requirements and 12 with no certificate — Then the six counters read
exactly 3 / 7 / 12 / 20 / 26 / 12 and **sum to 80**.
**A2** Given I click "Expired", Then the table shows exactly those 3 and the filter is reflected in the
URL (shareable, reloadable).
**A3** Given default sort, Then expired vendors are first, then gaps, then soonest expiry.
**A4** Given a vendor with an `asserted_only` additional-insured result, Then the row reads
"Additional insured — claimed, not evidenced" and not "compliant".
**A4b** Given any dashboard state, Then the string "Covered" appears nowhere in the rendered page;
the green pill reads "Meets requirements" (REVIEW.md B-02). An explicit test asserts it.
**A5** Given 12 vendors with no certificate at all, Then a line above the table says so and links to a
filtered view.
**A6** Given I bulk-select 10 vendors and send reminders, and 2 have no contact mailbox, Then 8 are
queued and the result names the 2 that were skipped and why.
**A7** Given an org with zero vendors, Then the M11 onboarding checklist is shown instead of an empty
table.
**A8** Given 5 documents in `needs_review`, Then the header badge shows 5 and `/review` lists them
oldest first.
**A9** Given any dashboard state, Then the §F.1 disclaimer is present **verbatim** from
`src/lib/kb/disclaimers.ts`. The dashboard, the **vendor/party detail** screen, the **expiry
timeline**, the **global search result row** and the **mobile card list** are five of the eleven
disclaimer surfaces enumerated in KB §F (REVIEW.md MJ-06).

## 8. Edge cases

| case | behaviour |
|---|---|
| Vendor with a certificate that is `needs_review` | status `no_certificate` **until** review completes — an unreviewed extraction must never colour a vendor green. The row says "certificate received, not yet reviewed" so the count is explicable |
| Vendor archived mid-session | excluded on next load; no error |
| 5,000 vendors | server-side pagination; counters are a single aggregate query, not a page scan |
| Requirement set changed since the last comparison | row shows a "requirements changed" chip linking to re-evaluate |
| Two certificates uploaded the same day | the newest `active` one drives status; the other is `superseded` and visible in history |
| Timezone: a policy expiring today | not expired until the org's local midnight (M5 §7) |

## 9. Errors

A failed counter query degrades to the table without counters and logs; it never blanks the page. A
failed row query shows a retry affordance.

## 10. Analytics

`dashboard_viewed{meets,gaps,expiring,expired,asserted_only,no_certificate}`,
`dashboard_filtered{filter}`, `dashboard_sorted{key}`, `vendor_opened_from_dashboard{status}`,
`bulk_remind_clicked{selected,queued,skipped}`, `review_queue_opened{depth}`.

`dashboard_viewed` per user per week is the **retention proxy** measured in `THRESHOLDS.md` §2 —
month-2 retention is defined as an org whose dashboard was opened in ≥ 2 distinct weeks of month 2.

## 11. Test plan

Unit: the status roll-up precedence (`expired > gap > expiring > asserted_only > meets`, with
`no_certificate` outside the chain); counters and table share one predicate module (a test asserts
both call it); a property test asserts the six counters sum to the non-archived roster for 1,000
random fixtures (MN-12).
Integration (PGlite): 1,000-vendor fixture; counters sum to the total; pagination stability under a
concurrent status change.
e2e: load → counters → click a counter → filtered URL → open a vendor → see the three-state results.
Performance: dashboard query under 200 ms at 5,000 vendors on the CI database.
