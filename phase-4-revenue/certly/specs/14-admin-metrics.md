# Spec M14 — Admin metrics

**Backlog item:** M14 (Must). **Effort:** S. **Depends on:** M1 and the platform `events` table
(PLAN §A14). Emits no events of its own.

## 1. Story

> As the founder I open one internal page and see whether Certly is working: how many signed up, how
> many reached their first compared certificate, how many paid, how many are still here in month two,
> how accurate the extraction is on real documents, and what a document costs to read.

`THRESHOLDS.md` pre-commits numbers. **A threshold nobody can read is a wish.** This page is the
instrument that makes those numbers falsifiable, and it exists on day one, not after the first cohort.

## 2. Access

`/admin`, gated on an allowlist of user ids in env (`ADMIN_USER_IDS`) — not a role, not a flag in the
database, because a database role is one bad migration away from being granted to a customer.
Every admin page view writes an audit event.

## 3. Panels

### 3.1 Funnel (the `THRESHOLDS.md` panel)

Cohorted by signup week, with **n** shown next to every rate, always:

| metric | definition | threshold |
|---|---|---|
| Signups | `org_created` | — |
| **Activation** | orgs with `activated` ÷ signups | §1 |
| Time to activate | median `activated.minutes_from_signup` | §1 |
| **Activation → paid** | `checkout_completed` ÷ `activated` | §3 |
| **Month-2 retention** | orgs whose dashboard was opened in ≥ 2 distinct weeks of month 2 ÷ orgs that paid in month 1 | §2 |
| MRR / ARPA / logo churn / revenue churn | from `subscriptions` | §3 |

Plus the **onboarding step funnel** (`onboarding_step_completed` / `_abandoned` by step) — the
diagnostic that turns a failed activation threshold into a specific fix.

### 3.2 Extraction quality — the panel that is actually ours

| metric | source | why |
|---|---|---|
| **Field correction rate**, per field | `field_corrections` ÷ extracted documents | live accuracy on **real** documents, not the golden set |
| **Confident-wrong rate** | corrections on fields that were ≥ τ **and** gate-passed ÷ documents promoted without review | the number τ is tuned against (`H-EX-2`); target **≤ 2%** |
| Review rate | `needs_review` ÷ extracted | the cost of τ |
| Review latency | median `extraction_succeeded` → `review_completed` | a queue nobody clears is a broken product |
| Gate-failure rate | `extraction_succeeded.gate_failures > 0` ÷ documents | provenance health |
| Rejection rate, by reason | `document_rejected` | |
| **Accuracy by PDF producer string** | corrections grouped by `documents.pdfProducer` | the AMS-variant experiment, `H-KB-1` (KB §A.4) |

**Field correction rate per field, never averaged into one number.** A 3% average that is 20% on
`policy_exp` is a broken product wearing a good number.

### 3.3 Unit economics

Model cost per document (from real `usage`, not a model of it), cost per activated org, cost per
paying org per month, gross margin at each plan, and the **Vercel/Neon/Resend fixed floor**. Feeds
`THRESHOLDS.md` §5.

### 3.4 Operations

Queue depth and oldest job age; extraction p50/p95; failure counts by reason; email delivery, bounce
and complaint rates; suppression list size; jobs stuck > 1 hour.

### 3.5 Cohort table

One row per signup week: n, activation, activation→paid, month-2 retention, MRR. The whole point of a
pre-committed threshold is comparing **cohorts**, not a lifetime blur.

## 4. Data model

No new tables. Reads `events`, `organisations`, `subscriptions`, `extractions`, `field_corrections`,
`documents`, `comparisons`, `reminders`, `jobs`.

Two materialised views refreshed hourly (the funnel query is a full scan otherwise):
`mv_org_funnel` (one row per org: signup week, activated_at, first_paid_at, last_dashboard_week,
plan, mrr) and `mv_extraction_quality` (one row per field per week: extracted, corrected,
confident_wrong).

## 5. Server actions

`getFunnel(range, cohortBy)`, `getExtractionQuality(range, groupBy)`, `getUnitEconomics(range)`,
`getOperations()`, `exportMetrics(range) → CSV`.

## 6. Validation

- **every rate is rendered with its denominator**, and a rate whose denominator is **< 30 is shown
  greyed with "n too small"** rather than as a number. This is the same discipline as
  `BACKLOG.md` N10 applied inwards: we do not lie to ourselves either
- all figures are org-aggregate; **no customer document content, no vendor names, no certificate values
  appear on any admin screen**. Diagnosing a bad extraction is done through the customer's own screens
  with their knowledge, not through an admin backdoor into their documents
- date ranges in UTC, labelled

## 7. Acceptance criteria

**A1** Given 40 signups and 22 activated, Then activation shows "55% (22/40)".
**A2** Given a cohort of 12, Then its rates are greyed with "n too small".
**A3** Given 100 extracted documents and 4 with a correction to `policy_exp`, Then the extraction panel
shows `policy_exp: 4% (4/100)` on its own row.
**A4** Given a document promoted without review whose `each_occurrence` is later corrected, Then it
counts in **confident-wrong**.
**A5** Given a non-allowlisted user hits `/admin`, Then 404 (not 403).
**A6** Given any admin page, Then no vendor name, insured name or certificate value is present in the
DOM or in any response.
**A7** Given `exportMetrics`, Then the CSV carries every rate **with its numerator and denominator as
separate columns**.
**A8** Given the materialised views are stale, Then each panel shows its refresh timestamp.

## 8. Edge cases

| case | behaviour |
|---|---|
| Zero signups | panels render "no data yet", never `NaN` or `0%` |
| An org that activated then deleted | counted in its cohort; `deleted` shown separately |
| A test/founder org | excluded by an `is_internal` flag; the flag is visible in the UI so the exclusion is never invisible |
| Refunded payment | excluded from MRR, counted in a `refunds` line |
| Month 2 not yet elapsed for a cohort | retention cell is empty, never zero — an empty cell reads as unknown, a zero reads as failure |

## 9. Errors

A panel that fails renders an error card and the rest of the page still loads. Metrics are never
cached across a failed refresh — a stale number presented as current is worse than a missing one.

## 10. Analytics

None emitted (`admin_viewed` goes to the audit trail, not the analytics table — admin activity must not
pollute the product funnel it measures).

## 11. Test plan

Unit: every metric definition against a synthetic event fixture with known answers, including the
n < 30 suppression and the empty-vs-zero distinction.
Integration (PGlite): materialised-view refresh; a cohort spanning a month boundary; the confident-wrong
join.
Security: a non-allowlisted session gets 404; a snapshot test asserts no customer-content field name
appears in any admin serialised prop.
