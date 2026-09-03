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

**One digest per organisation per day, not one email per deadline.** A platform with 300 licences
would otherwise get 40 emails in a week and would filter us to a folder within a month. The digest
groups by urgency, then by state.

## Flow

```
Vercel Cron (A12) hourly → /api/cron/drain
  1  select deadlines where due_on - today ∈ {90,60,30,7,0,-1}
        and no alert row exists for (deadline_id, offset)
        and the organisation's local time is between 07:00 and 09:00     ← send in their morning
  2  group by organisation → build one digest
  3  insert alerts rows (status=queued) inside the same transaction as the job claim
        (FOR UPDATE SKIP LOCKED, same pattern as Clausewright)
  4  send via Resend → status=sent | failed(+reason)
  5  webhook from Resend → delivered | bounced | complained
```

## Screens

| screen | contents |
|---|---|
| The email | Plain, scannable. Subject: `3 licences need attention — 1 in 7 days`. Body: urgency groups, each line `state · holder · licence type · what is due · date`. One button: "Open StateReady". Footer: what this is, how to change frequency, physical address (CAN-SPAM, PLAN.md D4/P10). |
| `/settings/notifications` | Per-user: which offsets, digest vs immediate, quiet weekends, and a per-state mute. Org-level: who receives, and an optional CC to the technician on their own licence only. |
| `/alerts` | History: every alert we sent, when, to whom, delivery status. This is also the customer's evidence that they were told. |

## Data model

```ts
export const alerts = pgTable("alerts", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  deadlineId:     uuid("deadline_id").notNull().references(() => deadlines.id, { onDelete: "cascade" }),
  offsetDays:     integer("offset_days").notNull(),         // 90,60,30,7,0,-1
  digestId:       uuid("digest_id").references(() => digests.id),
  status:         text("status", { enum: ["queued","sent","delivered","bounced","failed","suppressed"] }).notNull(),
  failureReason:  text("failure_reason"),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt:         timestamp("sent_at", { withTimezone: true }),
}, (t) => ({ once: unique().on(t.deadlineId, t.offsetDays) }));

export const digests = pgTable("digests", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  recipientUserId: uuid("recipient_user_id").notNull().references(() => users.id),
  subject:        text("subject").notNull(),
  itemCount:      integer("item_count").notNull(),
  providerMessageId: text("provider_message_id"),
  status:         text("status", { enum: ["queued","sent","delivered","bounced","complained","failed"] }).notNull(),
  openedAt:       timestamp("opened_at", { withTimezone: true }),
  clickedAt:      timestamp("clicked_at", { withTimezone: true }),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  userId:         uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  offsets:        integer("offsets").array().notNull().default(sql`'{90,60,30,7,0,-1}'`),
  mutedStates:    char("muted_states", { length: 2 }).array().notNull().default(sql`'{}'`),
  timezone:       text("timezone").notNull().default("America/Chicago"),
  paused:         boolean("paused").notNull().default(false),
});
```

The `unique(deadlineId, offsetDays)` constraint is the anti-duplicate guarantee: a cron that runs
twice, or a queue that retries, cannot double-send. It is a constraint rather than a check in code
because the cost of getting it wrong is the customer muting us.

## Server actions / API

| action | notes |
|---|---|
| `GET /api/cron/drain` | Authenticated by a shared secret header. Claims jobs with `FOR UPDATE SKIP LOCKED`. Idempotent. |
| `POST /api/webhooks/resend` | Signature-verified. Updates digest and alert delivery state; a `bounced` or `complained` result suppresses that recipient and raises an admin flag. |
| `updateNotificationPreferences(patch)` | Per user. |
| `sendTestAlert()` | Sends the digest the user *would* receive today. Removes all doubt during onboarding and is a cheap trust builder. |

## Validation

- Offsets must be a subset of `{90,60,30,7,0,-1}`; a user cannot invent 45.
- A suppressed (bounced/complained) address is never retried automatically.
- Digest sends only when `itemCount > 0`. We never send "nothing to report" — that is how a useful
  email becomes background noise.

## Acceptance criteria

1. A deadline 90 days out on an organisation whose local time hits 07:00 produces exactly one alert
   row and one digest.
2. Running the cron three times in that hour still produces exactly one of each.
3. Two deadlines at 90 and 30 days on the same day produce **one** digest with two items, ordered
   most-urgent first.
4. A user who mutes Texas receives a digest containing only the non-Texas items; if that leaves zero,
   no email is sent.
5. A bounce marks the digest `bounced`, suppresses the address, and shows an admin flag; the
   organisation's other recipients still receive theirs.
6. Every line in the email links to the licence and carries the deadline's citation on hover/expand.
7. `needsHumanCheck` deadlines are visually distinct in the email and say so in words: "we could not
   fully verify this rule — check the board before you rely on it".
8. The email renders correctly in Outlook desktop, Gmail web and iOS Mail (litmus-style fixture test
   against captured HTML, no external images, table layout, ≤ 102 KB to avoid Gmail clipping).

## Edge cases

- **Deadline created inside the window.** A licence added 20 days before expiry gets the 7-day and
  day-0 alerts, not a burst of four. The 90/60/30 ones are recorded as `suppressed` with the reason,
  so the history is honest.
- **Deadline moves** (M5 supersedes it). Pending alerts on the superseded row are cancelled; the new
  row schedules fresh. The customer is told once that a date changed, not four times.
- **Organisation with no active recipient** (everyone bounced or paused). The digest is generated,
  marked `suppressed`, and raised in admin — silence must be visible to us.
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
| Cron does not run | A watchdog check on the admin page shows "last drain: N minutes ago"; over 3 hours is red. A silent alerting system is worse than no alerting system, and this is the check that catches it. |

## Analytics events

`digest_queued`, `digest_sent`, `digest_delivered`, `digest_bounced`, `digest_opened`,
`digest_clicked`, `alert_suppressed` (with reason), `notification_prefs_changed`,
`notifications_paused` (**the churn leading indicator** — watch this against `THRESHOLDS.md`),
`test_alert_sent`.

## Test plan

- **Unit:** the offset selection function across a year of dates, including the 90-day boundary at a
  DST change and at a leap day.
- **Integration (PGlite):** triple-run idempotency; supersede-and-reschedule; the mute filter; the
  25-line cap.
- **Integration:** the mock email adapter captures the digest; assert grouping order, citation
  presence and the `needsHumanCheck` wording.
- **Email rendering:** HTML snapshot test plus a size assertion (< 102 KB) and a "no remote images"
  assertion.
- **E2E:** a seeded organisation with three deadlines at 90/30/7 produces one digest whose captured
  HTML contains all three, in urgency order.
