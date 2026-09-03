# WL-12 · Admin metrics

**Effort: S · Must (MVP) · Depends on: all of them**

## Story

As the founder, one page tells me signups, activations, trial conversions, MRR, churn and corpus
health — from our own `events` table, with no third party in the path.

## Why an S is a Must

[`../THRESHOLDS.md`](../THRESHOLDS.md) pre-commits to numbers evaluated at **n ≥ 100 signups**,
with persevere / iterate / stop actions attached to each band. **A pre-committed decision that
cannot be evaluated is not a commitment, it is a wish.** This page is what makes the commitment
real, and it must exist before the first cold email goes out, not after.

PLAN A14 also forbids depending on a third party for it: the `events` table is ours; a PostHog
key is optional and additive.

It stays an **S** by being deliberately plain: one page, server-rendered, SQL over `events`, no
charting library, no date-range builder, no saved views. Four fixed windows (7 / 30 / 90 days /
all time) and a CSV download of the underlying rows.

## The funnel, defined once so it is never argued about again

| step | event | definition |
|---|---|---|
| 1 · Signup | `signup_completed` | an organisation exists and a user has verified a magic link |
| 2 · Set up | `wd_pinned` | a project exists with a determination pinned — the moment the product's hard part is done |
| 3 · Crew | `classification_mapped` (first) | at least one worker mapped to a classification |
| 4 · **Activation** | **`wh347_generated` (first per organisation)** | **a WH-347 exists. This is the activation event and nothing else is.** |
| 5 · Paid | `subscription_activated` | first successful invoice, trial converted |
| 6 · Retained | `wh347_generated` in month 2 | the only retention definition that means anything for a weekly product |

**Activation is `wh347_generated`, not signup, not project creation, not "logged in twice".**
The product's promise is a certified payroll; until one exists nothing has happened.

## Flow / screens

```
/admin  (gated: user email in ADMIN_EMAILS)
  ┌ window: [ 7d | 30d | 90d | all ]
  ├ FUNNEL          signups → pinned → mapped → ACTIVATED → paid, counts and step conversions
  ├ TIME            median hours signup → activation · median minutes in the hours grid
  │                 (from payroll_certified.minutes_in_grid) · median days activation → paid
  ├ REVENUE         MRR · ARR · paying orgs · trials open · trials ending in 7d · ARPU
  ├ RETENTION       month-2 payroll-generating orgs · logo churn (monthly) · cancellations
  │                 with their subscription_cancelled reasons and payrolls_generated
  ├ USAGE           active projects · payrolls certified this week · payrolls per active org
  │                 · workers per org (p50/p90) · below-determination-rate warnings shown
  ├ CORPUS HEALTH   active determinations · oldest last_verified · last ingest run + status
  │                 · parse coverage · determinations added/modified in window
  │                 · alerts sent per active project per year  ← the WL-08 verdict number
  └ VOICE OF THE USER
        classification_zero_results, most recent 100, with the query and the WD number
        wd_search_zero_results, by state and construction type
        ssn_full_entry_blocked count
        gc_tier_interest count           ← the WL-24 trigger
        share_link_accessed count        ← the other WL-24 trigger
```

## Data model

```ts
events                                    // written by every module; PLAN A14
  id                uuid         primaryKey defaultRandom
  organisation_id   uuid         references organisations(id)
  user_id           uuid         references users(id)
  name              text         notNull
  props             jsonb        notNull default '{}'
  occurred_at       timestamptz  notNull default now()
  index (name, occurred_at)
  index (organisation_id, name, occurred_at)
```

One table, append-only, never updated, never deleted. Two indexes are enough at this scale.
**No PII in `props`** — organisation and user are foreign keys, and there is a CI test asserting
that no event payload carries an email address, a worker name or a last-4 (gate G7's neighbour).

Rollups are computed on read for the MVP. A materialised daily rollup is a Later problem that
arrives at roughly 10 million events, which at this scale is years away.

## Server actions

| name | effect |
|---|---|
| `getFunnel({ window })` | six steps, counts and step-to-step conversion, cohorted by signup week |
| `getRevenue({ window })` | MRR from `subscriptions.mrr_cents` where status ∈ {active, trialing-with-card}, ARPU, trials ending |
| `getRetention({ window })` | month-2 activity, monthly logo churn, cancellation reasons |
| `getCorpusHealth()` | reads `/api/health/corpus` (WL-13) plus `kb_ingest_runs` |
| `getVoiceOfUser({ window })` | the four event lists above |
| `exportEvents({ window })` | CSV of raw rows, for analysis outside the product |

## Validation rules

| # | rule |
|---|---|
| V1 | `/admin` is gated on `ADMIN_EMAILS` (env) **and** a valid session. Not on a role column, which could be set by a bug. |
| V2 | Every metric names its **denominator** on screen. A conversion rate without an n is not a number, it is a mood. |
| V3 | Rates over n < 20 render as `3/14` rather than `21.4%`. |
| V4 | Activation is `wh347_generated`, defined in exactly one place (`lib/analytics/funnel.ts`) and imported everywhere. |
| V5 | No event payload contains an email, a worker name, or an identifying number. *(CI test)* |
| V6 | The page reads only from `events`, `subscriptions` and `kb_ingest_runs` — never from a vendor API, so it works with no third-party key. |
| V7 | The page states, at the top, whether n has reached the THRESHOLDS evaluation point (100 signups) and which decisions are therefore live. |

**V7 is the whole point of the page.** It should be impossible to look at `/admin` and not know
whether the pre-committed decision is due.

## Acceptance criteria

- **Given** 100 signups of which 42 generated a WH-347, **when** `/admin` renders, **then**
  activation shows **42%** with `n = 100` visible, and the header states that the THRESHOLDS
  evaluation point has been reached.
- **Given** 14 signups of which 3 activated, **when** it renders, **then** it shows `3/14`, not
  `21.4%`. *(V3)*
- **Given** a non-admin session, **when** `/admin` is requested, **then** it 404s (not 403 — no
  oracle that the page exists).
- **Given** the corpus panel, **when** it renders, **then** it shows the count of active
  determinations, the oldest `last_verified`, the last ingest run's status and its parse
  coverage, and turns amber past the 35-day gate G6 boundary.
- **Given** cancellations in the window, **when** retention renders, **then** each shows
  `days_active` and `payrolls_generated`, because a churn at 0 payrolls and a churn at 14 are
  different products failing.
- **Given** the events table, **when** the CI privacy test runs, **then** no `props` value
  matches an email pattern, a 4-digit identifying number, or a known worker name. *(V5)*
- **Given** `wd_alert_email_sent` counts and active project-years, **when** the corpus panel
  renders, **then** it shows alerts per active project per year — **the number that decides
  WL-08's future**.
- **Given** the funnel, **when** the definition of activation is grepped, **then** it appears in
  exactly one module. *(V4)*

## Edge cases

| case | behaviour |
|---|---|
| Zero data (pre-launch) | Every panel renders with `n = 0` and the THRESHOLDS banner reads "not yet evaluable". Never a blank page or a spinner that never resolves. |
| An organisation signs up, activates, and churns inside one window | Counted in each metric it qualifies for; the funnel is cohorted by **signup week** so this does not inflate the current window's conversion. |
| Events written before an organisation exists (`signup_started`) | `organisation_id` is nullable; the funnel's step 1 is `signup_completed`, which always has one. |
| An admin wants a number the page does not show | `exportEvents` CSV. Resist adding a query builder; that is how an S becomes an L. |
| A backfill or a duplicated event | `events` is append-only and de-duplication is by `(name, organisation_id, occurred_at)` at read time for the "first per organisation" metrics, which is how activation is defined. |

## Errors

| condition | user sees |
|---|---|
| A metric query times out | That panel shows "unavailable" and the rest of the page renders. One slow query must not blank the dashboard. |
| Corpus health endpoint down | The panel shows the last `kb_ingest_runs` row instead, with its age. |

## Analytics events

`admin_metrics_viewed {window}` · `admin_events_exported {window, rows}`

## Test plan

**Unit** — funnel step definitions against a synthetic event stream; the `n < 20` fraction
rendering; cohorting by signup week across a month boundary.
**Integration (PGlite)** — seed 100 organisations with known outcomes and assert every headline
number to the unit; assert the THRESHOLDS banner flips at exactly n = 100.
**Privacy test (CI)** — walk every `events.props` fixture and every `emitEvent` call site in the
codebase; fail on an email, a name field, or `identifying_no_last4`.
**Invariant test** — `wh347_generated` is the activation event in exactly one module; grep for
any second definition.
**E2E** — sign in as an admin, load `/admin`, assert the six funnel steps and the corpus panel
render; sign in as a normal user and assert a 404.
