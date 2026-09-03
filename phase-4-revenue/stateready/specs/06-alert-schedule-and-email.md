# M6 — Alert schedule and email delivery

**Status:** spec, wave 1. **Effort:** M (~2–3 dev-days). **Depends on:** M5. **Blocks:** retention.

## Story

> As the office manager, I want to be told at 90 days, when I can still book the CE course and get a
> replacement qualifier named, and again at 7 days, when it is an emergency. I do not want an email
> every week. The moment this becomes noise I will filter it, and then it will not save me.

The alert is the product's heartbeat and its biggest churn risk. Both facts drive every decision here.

## The schedule

**90 / 60 / 30 / 7 days before the deadline**, plus **day 0** and **day +1 (lapsed)**.

- 90 because a Florida CE requirement of 14 hours in five mandated subjects takes weeks to satisfy,
  and because a Texas electrical contractor who loses their Master Electrician has 30 **business**
  days to name a replacement.
- 7 because that is when it becomes a phone call rather than a task.
- Day +1 exists because a lapsed licence is the event the customer must act on fastest, and staying
  silent on the one day it matters most would be indefensible.

**One digest per *recipient* per day, not one email per deadline.** A platform with 300 licences
would otherwise get 40 emails in a week and would filter us to a folder within a month. The digest
groups by urgency, then by state. Per **recipient**, not per organisation: a compliance team of two
must each be told, each with their own mute list and their own delivery state, which is what AC5
requires and what the wave-1 data model could not express (wave-1b **B10**).

## Flow — one cron a day, a send time per recipient

**Vercel Hobby permits exactly one cron invocation per day** and silently coerces anything
sub-daily. `../PREREQUISITES.md` P1 (Pro) is a *pre-charging* item, not a *pre-build* one, so this
module is specified to be **correct on one invocation a day** and to become more precise, with no code
change, the moment the schedule can be tightened. An alerting product whose schedule is silently
degraded is worse than no alerting product, and the degradation is invisible until a customer's
licence lapses — so the schedule is a config constant with a boot assertion behind it, not a comment.

```
Vercel Cron (A12), ONE invocation a day:  "0 12 * * *"  → /api/cron/drain
  0  DRAIN_INTERVAL = the configured cron period (24h on Hobby, 1h on Pro).
     Boot assertion: if the parsed cron expression is sub-daily while VERCEL_PLAN=hobby, FAIL THE
     BUILD. A schedule the platform will not honour must never reach production.

  1  claim due recipients:
        select from alert_recipients
        where next_send_at <= now() + DRAIN_INTERVAL      ← everything due before we can run again
        for update skip locked                            ← same pattern as Clausewright
  2  for each claimed recipient, select their due deadline-offsets:
        deadlines visible to that recipient (org scope, minus their muted states)
        where due_on - today <= offset  for the largest offset in {90,60,30,7,0,-1}
              that has no alert row yet for (deadline_id, offset, recipient_user_id)
        ── note `<=`, not `=`: see "Why the offsets are inequalities" below
  3  build ONE digest per recipient (never one per organisation), insert the alerts rows
     (status=queued) and the digest row in the same transaction as the claim
  4  send via Resend → status=sent | failed(+reason)
  5  advance next_send_at to the next occurrence of that recipient's local digest hour
  6  webhook from Resend → delivered | bounced | complained
```

### How the local morning survives a daily cron

The local-morning promise is kept **in the data, not in the schedule**. Every recipient row carries
`timezone` and `digestHourLocal` (default 07:00) and a computed **`nextSendAt`** — the next instant at
which that local hour occurs, stored in UTC. The drain sends everything whose `nextSendAt` falls
before the next drain can run, then advances it.

- On **Pro / hourly**, `DRAIN_INTERVAL = 1h` and each recipient is served in the hour their local
  window opens. The promise is exact.
- On **Hobby / daily**, `DRAIN_INTERVAL = 24h` and every recipient due in the next day is served in
  the 12:00 UTC run. Their digest arrives **once a day, on the day their window opens**, at 12:00 UTC
  (07:00 ET / 06:00 CT / 05:00 MT / 04:00 PT) rather than at the hour they chose.
- **`digestHourLocal` is therefore honest but not yet exact**, and it says so in three places: on
  `/settings/notifications` next to the field, in the help article, and in the digest footer. It is
  **not** made display-only — it is the value that drives `nextSendAt` and it starts being exact on the
  day the cron goes hourly, with no migration.
- **There is no deferral loop.** The claim is `next_send_at <= now() + DRAIN_INTERVAL`, so a recipient
  whose local hour falls after today's run is still picked up by today's run rather than being pushed
  past it forever. This is the bug the obvious `next_send_at <= now()` formulation creates on a daily
  cron for every recipient west of the drain time, and it would have silenced the entire Pacific coast.

### Why the offsets are inequalities

The offset test is `due_on - today <= offset`, taking the **largest unsent offset**, not
`due_on - today = offset`. On a schedule that runs once a day, an exact-equality test loses an alert
entirely whenever a run is missed, a deploy lands in the window, or a deadline is created on the wrong
side of midnight — and the alert it loses is as likely to be the 7-day one as the 90-day one. With the
inequality, a missed run delays an alert; it never deletes one. The `unique(deadline_id, offset_days,
recipient_user_id)` constraint is what stops the same offset being re-sent on the following day.

**Watchdog.** `/admin/health` shows "last drain: N hours ago" and goes red past **26 hours** (the
daily budget plus a two-hour grace). `THRESHOLDS.md`'s alert-delivery-rate tripwire is unreadable
without it.

## Screens

| screen | contents |
|---|---|
| The email | Plain, scannable. Subject: `3 licences need attention — 1 in 7 days`. Body: urgency groups, each line `state · holder · licence type · what is due · date`. One button: "Open StateReady". Footer: what this is, how to change frequency, physical address (CAN-SPAM, PLAN.md D4/P10). |
| `/settings/notifications` | Per-user: which offsets, digest vs immediate, quiet weekends, a per-state mute, the time zone and **the local hour the digest is aimed at** — with the honest note beside it: *"we currently send one digest a day; your digest is released in the first run on or after this hour."* Org-level: who receives (each becomes an `alert_recipients` row), and an optional CC to the technician on their own licence only. |
| `/alerts` | History: every alert we sent, when, to whom, delivery status. This is also the customer's evidence that they were told. |

## Data model

```ts
// One alert row per (deadline, offset, RECIPIENT). Two recipients on one organisation produce two
// rows, two digests and two independent delivery states — which is what AC5 requires and what the
// wave-1 model (unique(deadlineId, offsetDays), one digest.recipientUserId) made unrepresentable.
export const alerts = pgTable("alerts", {
  id:              uuid("id").primaryKey().defaultRandom(),
  organisationId:  uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  deadlineId:      uuid("deadline_id").notNull().references(() => deadlines.id, { onDelete: "cascade" }),
  recipientUserId: uuid("recipient_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  offsetDays:      integer("offset_days").notNull(),         // 90,60,30,7,0,-1
  digestId:        uuid("digest_id").references(() => digests.id),
  status:          text("status", { enum: ["queued","sent","delivered","bounced","failed","suppressed"] }).notNull(),
  failureReason:   text("failure_reason"),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt:          timestamp("sent_at", { withTimezone: true }),
}, (t) => ({
  once: unique().on(t.deadlineId, t.offsetDays, t.recipientUserId),   // per recipient, not per org
  byRecipient: index().on(t.recipientUserId, t.createdAt),
}));

// One digest per recipient per send. Never one per organisation.
export const digests = pgTable("digests", {
  id:              uuid("id").primaryKey().defaultRandom(),
  organisationId:  uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  recipientUserId: uuid("recipient_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sendDate:        date("send_date").notNull(),              // the recipient's LOCAL date
  subject:         text("subject").notNull(),
  itemCount:       integer("item_count").notNull(),
  providerMessageId: text("provider_message_id"),
  status:          text("status", { enum: ["queued","sent","delivered","bounced","complained","failed","suppressed"] }).notNull(),
  openedAt:        timestamp("opened_at", { withTimezone: true }),
  clickedAt:       timestamp("clicked_at", { withTimezone: true }),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ oncePerDay: unique().on(t.recipientUserId, t.sendDate) }));

// The scheduling row. One per recipient; it is what the drain claims.
export const alertRecipients = pgTable("alert_recipients", {
  userId:          uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  organisationId:  uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  nextSendAt:      timestamp("next_send_at", { withTimezone: true }).notNull(),
  lastSentAt:      timestamp("last_sent_at", { withTimezone: true }),
  suppressedAt:    timestamp("suppressed_at", { withTimezone: true }),   // bounced / complained
  suppressionReason: text("suppression_reason"),
}, (t) => ({ due: index().on(t.nextSendAt) }));   // the drain's only hot index

export const notificationPreferences = pgTable("notification_preferences", {
  userId:          uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  organisationId:  uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  offsets:         integer("offsets").array().notNull().default(sql`'{90,60,30,7,0,-1}'`),
  mutedStates:     char("muted_states", { length: 2 }).array().notNull().default(sql`'{}'`),
  timezone:        text("timezone").notNull().default("America/Chicago"),
  digestHourLocal: integer("digest_hour_local").notNull().default(7),
  paused:          boolean("paused").notNull().default(false),
});
```

The `unique(deadlineId, offsetDays, recipientUserId)` constraint is the anti-duplicate guarantee and
it is **per recipient**: a cron that runs twice, or a queue that retries, cannot double-send to the
same person, and one recipient's bounce cannot suppress another's mail. It is a constraint rather than
a check in code because the cost of getting it wrong is the customer muting us — and the cost of the
organisation-wide version was that a two-person compliance team could only ever be told once, between
them, which is the failure AC5 describes.

## Server actions / API

| action | notes |
|---|---|
| `GET /api/cron/drain` | Authenticated by a shared secret header. Claims **alert recipients** with `FOR UPDATE SKIP LOCKED` on `next_send_at <= now() + DRAIN_INTERVAL`. Idempotent: re-running inside the same window sends nothing, because the alert rows already exist for (deadline, offset, recipient). |
| `GET /api/cron/drain` — schedule | `vercel.json` `"0 12 * * *"` on Hobby. Changing it to `"0 * * * *"` on Pro requires **no code change**; `DRAIN_INTERVAL` is derived from the same expression at boot. |
| `POST /api/webhooks/resend` | Signature-verified. Updates digest and alert delivery state; a `bounced` or `complained` result suppresses that recipient and raises an admin flag. |
| `updateNotificationPreferences(patch)` | Per user. |
| `sendTestAlert()` | Sends the digest the user *would* receive today. Removes all doubt during onboarding and is a cheap trust builder. |

## Validation

- Offsets must be a subset of `{90,60,30,7,0,-1}`; a user cannot invent 45.
- A suppressed (bounced/complained) address is never retried automatically, and suppression is
  recorded on `alertRecipients`, so it removes **that recipient** from the drain and nobody else.
- Digest sends only when `itemCount > 0`. We never send "nothing to report" — that is how a useful
  email becomes background noise. When a recipient's digest is empty, `nextSendAt` still advances.
- `digestHourLocal` ∈ 0–23; `timezone` must be an IANA zone the runtime knows. An unknown zone falls
  back to `America/Chicago` **and raises an admin flag** rather than silently shifting someone's alerts.
- The boot assertion on the cron expression (see Flow step 0) is a **test**, not a comment: a spec'd
  sub-daily schedule on a Hobby project fails CI.

## Acceptance criteria

1. A deadline 90 days out, on an organisation with one recipient whose `nextSendAt` falls inside the
   drain window, produces exactly one alert row and one digest.
2. Running the cron three times in the same window still produces exactly one of each.
3. Two deadlines at 90 and 30 days on the same day produce **one** digest for that recipient, with two
   items, ordered most-urgent first.
4. A user who mutes Texas receives a digest containing only the non-Texas items; if that leaves zero,
   no email is sent and `nextSendAt` still advances.
5. **Two recipients, one organisation, one deadline: two alert rows and two digests.** A bounce on the
   first marks *that* digest `bounced`, suppresses *that* recipient, and raises an admin flag; the
   second recipient's digest is unaffected and is delivered. Asserted at the row level, not by
   inspecting the mailbox.
6. Every line in the email links to the licence and carries the deadline's citation on hover/expand;
   a `confidence = medium` deadline additionally carries the KB value's note (`specs/05` invariant 2).
7. `needsHumanCheck` deadlines are visually distinct in the email and say so in words: "we could not
   fully verify this rule — check the board before you rely on it".
8. The email renders correctly in Outlook desktop, Gmail web and iOS Mail (litmus-style fixture test
   against captured HTML, no external images, table layout, ≤ 102 KB to avoid Gmail clipping).
9. **A recipient in `America/Los_Angeles` with `digestHourLocal = 7` is served by the 12:00 UTC drain
   on the day their window opens**, not deferred to the following day. This is the regression test for
   the deferral loop named in the Flow section; it fails against `next_send_at <= now()`.
10. **A skipped drain does not lose an alert.** Freeze the clock, skip a day across the 7-day boundary,
    run the next drain: the 7-day alert is sent (late), not silently dropped. This is the regression
    test for exact-equality offsets.
11. Setting the cron expression to `"0 * * * *"` with `VERCEL_PLAN=hobby` fails the build with a
    message naming the platform limit.

## Edge cases

- **Deadline created inside the window.** A licence added 20 days before expiry gets the 7-day and
  day-0 alerts, not a burst of four. The 90/60/30 ones are recorded as `suppressed` with the reason
  `added_after_offset`, so the history is honest. **This is a designed behaviour and it is the first
  carve-out in the Alert Guarantee** (`OFFER.md` §5.3): a guarantee that pays out when a customer adds
  a licence three weeks before it expires is a guarantee that pays out on our own correct behaviour.
  The `suppressed` rows with their reasons are the adjudication record.
- **Deadline moves** (M5 supersedes it). Pending alerts on the superseded row are cancelled; the new
  row schedules fresh. The customer is told once that a date changed, not four times.
- **Organisation with no active recipient** (everyone bounced or paused). A digest row is still
  generated per suppressed recipient, marked `suppressed` with the reason, and raised in admin —
  silence must be visible to us, and it is the evidence for carve-outs (b), (c) and (d) of the Alert
  Guarantee.
- **Trial end / `past_due`.** Alerts are paused, not stopped (`specs/09` AC2/AC5), the recipient is
  told in words, and every deadline that passes an offset while paused is recorded `suppressed` with
  the reason `subscription_paused` — carve-out (e).
- **300-licence platform.** The digest caps at 25 lines with "and 47 more" linking to a filtered
  dashboard. An unbounded email is an unread email.
- **Day 0 falls on a Sunday.** We still send. The lapse does not respect the weekend and neither does
  North Carolina, which has no grace period at all.
- **Trial user.** Alerts run during the trial; that is the whole demonstration. They stop at
  `subscription = cancelled`, with a final email saying so.

## Errors

| condition | behaviour |
|---|---|
| Resend 5xx | Job retried with exponential backoff, max 5 attempts over 6 hours, then `failed` + admin flag |
| Resend 4xx (bad address) | `failed` immediately, address suppressed, no retry |
| Cron does not run | A watchdog on the admin page shows "last drain: N hours ago"; over **26 hours** is red (24h budget + 2h grace; on Pro this tightens to 3 hours with the same constant). A silent alerting system is worse than no alerting system, and this is the check that catches it. |
| Drain exceeds the function time limit | The claim is batched and resumable: recipients already stamped are not re-claimed, so the next run finishes the queue. A partial drain must never mean a lost day. |

## Analytics events

`digest_queued`, `digest_sent`, `digest_delivered`, `digest_bounced`, `digest_opened`,
`digest_clicked`, `alert_suppressed` (with reason), `notification_prefs_changed`,
`notifications_paused` (**the churn leading indicator** — watch this against `THRESHOLDS.md`),
`test_alert_sent`.

## Test plan

- **Unit:** the offset selection function across a year of dates, including the 90-day boundary at a
  DST change and at a leap day, and including a skipped day either side of each offset.
- **Unit:** `nextSendAt` computation across all US zones, across both DST transitions, for
  `digestHourLocal` 0, 7 and 23. The 2 a.m.-does-not-exist spring-forward case is explicit.
- **Integration (PGlite):** triple-run idempotency; supersede-and-reschedule; the mute filter; the
  25-line cap; **two recipients receiving two independent digests from one deadline**; a bounce on one
  recipient leaving the other's delivery untouched.
- **Integration:** the daily-drain regression pair — the Pacific deferral loop (AC9) and the skipped
  drain (AC10).
- **Integration:** the mock email adapter captures the digest; assert grouping order, citation
  presence and the `needsHumanCheck` wording.
- **Email rendering:** HTML snapshot test plus a size assertion (< 102 KB) and a "no remote images"
  assertion.
- **E2E:** a seeded organisation with three deadlines at 90/30/7 produces one digest whose captured
  HTML contains all three, in urgency order.
