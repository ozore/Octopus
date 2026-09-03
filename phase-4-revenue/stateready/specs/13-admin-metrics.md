# M13 — Admin metrics

**Status:** spec, wave 1. **Effort:** M (~2–3 dev-days). **Depends on:** M1, M9, and the events table.
**Purpose:** `THRESHOLDS.md` is unevaluable without this. A pre-committed threshold we cannot measure
is a wish, and the whole point of pre-committing was to avoid deciding by feel later.

## Story

> As the founder, at n = 100 signups, I want to open one page and read the four numbers in
> `THRESHOLDS.md` off it, with their confidence intervals and their cohort breakdown, and decide
> persevere / iterate / stop without argument.

## The events table (A14)

```ts
export const events = pgTable("events", {
  id:             bigserial("id", { mode: "number" }).primaryKey(),
  organisationId: uuid("organisation_id").references(() => organisations.id, { onDelete: "set null" }),
  userId:         uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name:           text("name").notNull(),
  properties:     jsonb("properties").notNull().default(sql`'{}'`),
  occurredAt:     timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byName: index().on(t.name, t.occurredAt),
  byOrg:  index().on(t.organisationId, t.occurredAt),
}));
```

Ours, not a third party's (A14). An optional PostHog key mirrors the same calls; if the key is
absent, nothing breaks. Every event named in specs 01–12 is emitted through one `track()` helper, and
a test asserts that the set of names emitted in the codebase equals the set documented in the specs —
so an event silently disappearing cannot silently break a threshold.

## The metrics

| metric | definition (exact, so it cannot drift) |
|---|---|
| **Signups** | distinct `organisation_created` events |
| **Activation** | organisations with ≥ 1 `licence_deadline_derived` within 7 days of `organisation_created`. This is the definition in `THRESHOLDS.md`; it is deliberately about a **derived** deadline, not a created licence, because deriving is what makes us different from a spreadsheet. |
| **Activation → paid** | activated organisations with a `checkout_completed` within 30 days of activation |
| **Month-2 retention** | organisations with an `active` subscription 60 days after `checkout_completed`, over those who reached day 60 |
| **Playbook attach rate** | organisations with ≥ 1 `playbook_purchased` over paying organisations |
| **MRR** | sum of active subscription prices, from the subscriptions mirror, not from events |
| **Churn** | `subscription_canceled` in the month over active at month start |
| Supporting | time-to-activation (median), import success rate, alert delivery rate, `notifications_paused` rate, `plan_limit_hit` count, `deletion_requested` reasons |

Each metric is one SQL query, committed in `src/lib/metrics/*.sql`, so the number on the page and the
number in a threshold review are produced by the same text.

## Screens

| route | contents |
|---|---|
| `/admin` | The four threshold metrics as big numbers with n, the band from `THRESHOLDS.md` drawn as a coloured range, and a plain-English verdict: "activation 47% — inside the persevere band (≥ 40%)". |
| `/admin/funnel` | signup → onboarding complete → roster imported → licence created → deadline derived → checkout, with drop-off between each. |
| `/admin/cohorts` | Weekly signup cohorts × week number, activation and retention. |
| `/admin/revenue` | MRR, new/expansion/churned MRR, one-off playbook revenue, ARPA. |
| `/admin/health` | Cron last-run times, alert delivery rate, bounce rate, failed jobs, **KB drift queue depth**, unpublishable record count. The operational page that catches a silent failure. |
| `/admin/organisations` | List with plan, licences, states, last seen; drill into one for support. |

Access: a hard-coded allowlist of founder emails in env, checked server-side on every admin route.
No role in the database can grant it — an escalation bug must not be able to reach these pages.

## Server actions / API

| action | notes |
|---|---|
| `getMetrics({ from, to })` | Runs the committed SQL; cached 5 minutes. |
| `getThresholdVerdicts()` | Joins the metrics to the bands in a committed `thresholds.json` (generated from `THRESHOLDS.md`) and returns persevere/iterate/stop per metric plus whether n is sufficient. |
| `exportMetricsCsv()` | For the weekly review file. |

## Validation

- **Never show a verdict below the minimum n.** The card says "n = 43 of 100 — not yet decidable".
  Showing a green verdict on 12 signups is how a startup talks itself into keeping a dead product.
- Wilson score intervals on every rate, displayed. A 50% activation on n = 20 is 27–73%; the interval
  is the honest number and the page shows it.

## Acceptance criteria

1. Every event name in specs 01–12 appears in the emitted set (test-enforced).
2. With a seeded fixture of 120 organisations, the four threshold metrics compute to known values.
3. Below n = 100, verdicts render as "not yet decidable", never as a band.
4. `/admin/health` shows a red state when the cron has not run for 3 hours.
5. Admin routes return 404 (not 403 — do not confirm they exist) for a non-allowlisted session.
6. MRR from the subscriptions mirror equals the Stripe dashboard for the test-mode fixture.

## Edge cases

- **Test organisations.** Founder and seed accounts carry `is_internal` and are excluded from every
  metric by default, with a toggle. Failing to do this is the most common way a founder's dashboard
  lies to them.
- **An organisation that activates, churns and returns.** Counted once in the signup cohort, and the
  return is a separate `reactivated` event.
- **Time zones in cohorting.** All cohorts computed in UTC, stated on the page.
- **A deleted organisation (M10).** Events keep `organisation_id` null after deletion; historical
  counts stay correct without retaining the customer's data.
- **Events written twice** (retry). `track()` is not idempotent by design — counts use
  `count(distinct organisation_id)` where the metric is about organisations, precisely so a duplicate
  event cannot move a threshold.

## Errors

| condition | behaviour |
|---|---|
| A metric query fails | That card shows "unavailable", the others render. One broken query must not blank the page. |
| Clock skew / future events | Filtered out and counted in a `data_quality` card |

## Analytics events

Admin itself emits `admin_viewed` (page) only. The admin pages must not pollute the metrics they show.

## Test plan

- **Event-name parity test:** the documented set (parsed from `specs/*.md`) equals the set emitted in
  the code. This is the guard that keeps the specs honest as the code changes.
- **Integration:** seeded 120-organisation fixture with known activation, conversion, retention and
  attach rates; assert every metric to the exact value.
- **Unit:** Wilson interval maths; cohort bucketing across a month boundary.
- **Security:** non-allowlisted session gets 404 on every admin route, including API routes.
