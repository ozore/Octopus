# WL-08 · Determination-change alerts

**Effort: M · Must (MVP) · Depends on: WL-13, WL-02**

## Story

As Rosa, when DOL publishes modification 2 to the determination my Fort Cavazos project is
pinned to, I get an email that tells me **what changed**, **which of my workers it affects** and
**by how much** — and I decide whether to move the project onto it.

## Why it is in the MVP, and the flag on it

**In**, because: it is nearly free once WL-13 is versioned (one query per pinned pair per day);
it is the only feature that earns money in a month with no payrolls, which is what carries a
seasonal subscription to month 2; and it is the concrete difference between WageLens and the
$49 form-fillers, who have no corpus and therefore cannot do it at all.

**Flagged**, because the data is not as dramatic as the pitch: **3,377 of 4,235** active
determinations sit at modification 1 and only **110** are above modification 2. Mid-project
changes may be rarer than the ideation documents assumed. So
`alerts_sent per active project per year` is on the [`../THRESHOLDS.md`](../THRESHOLDS.md) watch
list, and **if it comes in under 0.2 the marketing claim moves before the feature does.**

## Flow

```
WL-13 ingest detects (TX20260253, mod 2)
   └─ new immutable row · mod 1 marked superseded
        └─ for each project pinned to (TX20260253, 1):
              enqueue  wd.modification_detected  { project_id, from_mod: 1, to_mod: 2 }
                   │
                   ▼
        ┌───────────────────────────────────────────────────────────┐
        │ DIFF, scoped to what this project actually uses           │
        │   for each open worker_classifications row on the project:│
        │     find the same classification_label in mod 2           │
        │       rate or fringe changed  → changed[]                 │
        │       label absent from mod 2 → removed[]   ← the serious one
        │       otherwise               → unchanged                 │
        │   plus: classifications added in mod 2 (informational)    │
        └───────────────────────┬───────────────────────────────────┘
                                ▼
          nothing this project uses changed  →  in-app notice only, no email
          something changed                  →  ONE email, per project, per modification
                                ▼
   /projects/:id/determination/changes
       side-by-side mod 1 vs mod 2, only the rows this project uses
       [ move this project to modification 2 ]   [ stay on modification 1 ]
                                ▼
       accepted → projects re-pinned · project_wd_pin_history closed and reopened
                  · worker_classifications rates updated FOR FUTURE PAYROLLS ONLY
                  · every certified payroll untouched, forever
```

## Screens

| screen | contents | states |
|---|---|---|
| email | subject `Wage determination TX20260253 changed — Fort Cavazos`; the changed rows as a table with old → new and the delta; the affected worker names; two links (view the change, view the official determination) | — |
| `/projects/:id/determination/changes` | the diff table, an "affects N of your M workers" summary, both actions, and the plain statement that certified payrolls are never altered | pending · accepted · dismissed |
| project card badge | "modification 2 available" | shown while pending |
| payroll header banner | "This project is on modification 1. Modification 2 was published 12 Mar." — shown on every draft payroll while pending | — |

## Data model

```ts
wd_change_alerts
  id                       uuid         primaryKey defaultRandom
  project_id               uuid         notNull references projects(id) on delete cascade
  wd_number                text         notNull
  from_modification        integer      notNull
  to_modification          integer      notNull
  diff                     jsonb        notNull   // { changed:[{label, old_rate, new_rate, old_fringe, new_fringe, workers:[…]}],
                                                  //   removed:[{label, workers:[…]}], added:[{label, rate, fringe}] }
  affected_worker_count    integer      notNull
  status                   text         notNull default 'pending'   // pending | accepted | dismissed | superseded
  email_sent_at            timestamptz
  email_opened_at          timestamptz
  resolved_at              timestamptz
  resolved_by_user_id      uuid         references users(id)
  created_at               timestamptz  notNull default now()
  unique (project_id, wd_number, to_modification)   // exactly one alert per project per modification
  index (project_id) where status = 'pending'
```

`unique (project_id, wd_number, to_modification)` is the anti-spam guarantee at the database
level: a re-run of the ingest job cannot send a second email.

## Server actions

| name | effect |
|---|---|
| job `wd.modification_detected` | computes the diff, writes `wd_change_alerts`, enqueues `email.send` **only when `changed` or `removed` is non-empty** |
| `listPendingAlerts({ organisationId })` | badges and banners |
| `acceptModification({ alertId })` | re-pins the project (WL-02 `repinDetermination`, `reason = 'accepted_modification'`), updates open `worker_classifications` rates, marks the alert accepted. **Touches no payroll.** |
| `dismissAlert({ alertId })` | marks dismissed; the banner persists on draft payrolls, because dismissing is not the same as being right |
| `GET /api/email/open/:token` | 1×1 pixel, sets `email_opened_at` |

## Validation rules

| # | rule |
|---|---|
| V1 | **One email per project per modification.** Enforced by the unique index, not by application logic. |
| V2 | No email when nothing the project actually uses changed — an in-app notice only. A tool that emails about irrelevant changes is unsubscribed from before it ever emails about a relevant one. |
| V3 | Accepting a modification **never** alters a `certified` payroll, a `payroll_line`, or a generated `document`. *(gate G9)* Silently re-rating a signed federal statement would be a false certification under 18 U.S.C. § 1001. |
| V4 | Accepting updates `worker_classifications.base_rate` / `fringe_rate` for **future** payrolls, and leaves a `project_wd_pin_history` trail. |
| V5 | A classification **removed** in the new modification is rendered as a blocking question, not a rate change: "TILE FINISHER is not listed in modification 2. Two of your workers are mapped to it." The user must re-map or stay. |
| V6 | Emails carry an unsubscribe link that turns off **change alerts only**, never transactional email, with a CAN-SPAM footer and the sending organisation's postal address (PLAN D4). |
| V7 | Alerts are only generated for projects with `status = 'active'`. |
| V8 | When modification 3 lands while the alert for 2 is still pending, the pending alert is marked `superseded` and one new alert for `1 → 3` is created — never two emails in a day. |

## Acceptance criteria

- **Given** a project pinned to (TX20260253, 1) with a worker mapped to `ELECTRICIAN
  (EXCLUDES…)` at $38.50, **when** modification 2 lands with that classification at $39.75,
  **then** one `wd_change_alerts` row exists, `affected_worker_count = 1`, and one email is sent
  showing $38.50 → $39.75.
- **Given** modification 2 changes only classifications the project does not use, **when** the
  job runs, **then** an in-app notice is created and **no email is sent**. *(V2)*
- **Given** the ingest job runs twice for the same modification, **when** it completes, **then**
  exactly one alert row and exactly one email exist. *(V1)*
- **Given** a pending alert, **when** the modification is accepted, **then** `projects` is
  re-pinned, a new `project_wd_pin_history` row opens, open `worker_classifications` carry the
  new rates, and **every certified payroll's `payroll_lines` and `documents` are byte-identical
  to before**. *(V3 — asserted by hashing the documents before and after)*
- **Given** a classification removed in modification 2 with workers mapped to it, **when** the
  change screen opens, **then** it is presented as a re-mapping decision and acceptance is
  blocked until those workers are re-mapped. *(V5)*
- **Given** a pending alert for `1 → 2` and modification 3 lands, **when** the job runs, **then**
  the `1 → 2` alert is `superseded` and a single `1 → 3` alert is created.
- **Given** a project on modification 1 with a pending alert, **when** a draft payroll is opened,
  **then** the banner names both modifications and their publication dates.
- **Given** the unsubscribe link, **when** it is used, **then** change-alert emails stop and
  magic-link and billing emails do not.

## Edge cases

| case | behaviour |
|---|---|
| The project deliberately sits on an older modification because the contract locked it at award | Correct and common. The alert is informational; "stay on modification 1" is a first-class choice and the banner then reads "as required by your contract" once dismissed. |
| The determination is withdrawn (absent from the index) | `is_active = false`, and the alert says the determination is no longer published, with a link to the archived revision. Do not auto-migrate to anything. |
| A worker's classification label changed only in wording (whitespace, a comma) | The diff matches on `search_label` first, then on the verbatim label, so a cosmetic edit does not read as a removal. Genuine ambiguity is presented as a removal — the safe direction. |
| An org has 30 projects on one determination | 30 alerts, 30 emails, one per project. Digesting them is Should (WL-17's neighbour), because a per-project decision is what the user has to make. |
| The alert email bounces | Recorded; the in-app badge and banner remain, and they are the durable channel. |
| Modification lands between certification and generation | Impossible: the payroll froze the pin at creation (WL-05). |

## Errors

| condition | user sees | logged |
|---|---|---|
| Diff computation fails | The alert is still created with an empty diff and the email says "modification 2 was published — review it"; degraded, never silent | `wd_diff_failed` |
| Email send fails | Retried by the queue ×3; the in-app banner is unaffected | `wd_alert_email_failed` |
| Accept fails mid-transaction | Rolled back; the project stays on its old pin | `wd_accept_failed` |

## Analytics events

`wd_modification_detected {wd_number, from_mod, to_mod, pinned_projects}` (server) ·
`wd_alert_created {affected_worker_count, changed, removed, added}` ·
`wd_alert_email_sent` · `wd_alert_email_opened {hours_to_open}` ·
`wd_alert_viewed` · `wd_modification_accepted {affected_worker_count, hours_to_decide}` ·
`wd_modification_dismissed` · `wd_alert_unsubscribed` ·
`wd_classification_removed_blocking {workers}`

**The metric that decides this feature's future:** `wd_alert_email_sent` per active project per
year. Reported on WL-12. Under 0.2 → the claim moves to "we watch it for you" and the feature
stops being a headline.

## Test plan

**Unit** — the diff against two committed determination fixtures: a rate change, a fringe
change, a removal, an addition, and a whitespace-only label edit (must not read as a removal).
**Integration (PGlite)** — ingest mod 2 over a project pinned to mod 1: one alert, one email
job, correct `affected_worker_count`; a second ingest is a no-op; accepting re-pins and updates
mappings.
**Invariant test (G9)** — hash every `documents.sha256` and every `payroll_lines` row before
accepting a modification, accept it, and assert **not one byte changed**. This is the test that
stands between us and a false certification.
**E2E** — pending alert badge → change screen → accept → the next payroll seeds at the new rate
while the previous certified payroll still shows the old one.
