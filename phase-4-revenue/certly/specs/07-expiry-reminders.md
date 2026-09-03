# Spec M7 — Expiry reminders to the vendor's contact

**Backlog item:** M7 (Must). **Effort:** L. **Depends on:** M5, M8 (the upload link), platform email
(Resend) + jobs (Vercel Cron → queue drain, PLAN §A12).

## 1. Story

> As a manager I stop chasing. Sixty days before a policy lapses, Certly emails the vendor's office
> mailbox and the agent whose email is printed on the certificate, tells them exactly what is required,
> and gives them a one-click link to upload the renewal. If nobody responds it keeps asking, politely,
> until they do or I tell it to stop.

**This is the only Must item that removes labour rather than surfacing risk**, which is why it is the
one that keeps the subscription alive after the first audit.

## 2. The ladder

**T−60, T−30, T−14, T−7, T−1, T+1 (lapsed), then weekly to T+28, then stop and flag.**

T−30/T−14/T−7 are the industry-conventional rungs. **T−60 and T+1 are ours**, and both have a reason:
a real GC subcontract exhibit in our corpus requires the replacement certificate **10 days before**
expiry and 30 days' notice of any reduction (`kb-samples/requirements/flintco-exhibit-b-sample-insurance.pdf`),
and an agent needs weeks, not days, to issue one. T+1 exists because the lapse itself is the single most
valuable message Certly ever sends.

Ladder is editable per org; rungs can be removed, not invented (a fixed set keeps the copy honest and
the tests finite).

## 3. Recipients

| recipient | source | rule |
|---|---|---|
| vendor business mailbox | `vendors.contactEmail` — **typed by the customer** | always, when present |
| producer email | `extraction.payload.producer.email` — **printed on the certificate the customer was given** | when present and not suppressed; CC on T−60/T−30, TO from T−14 |
| the customer | org notification settings | a weekly digest, never per-vendor spam |

**Never** an address Certly guessed, scraped, purchased or inferred (PLAN §D5). No `info@` constructed
from a domain. No LinkedIn. If both addresses are missing, the vendor surfaces in the dashboard as
"cannot chase — no contact" and the ladder never runs.

## 4. Flow

```
comparison completes (M5) → schedule/refresh ladder for earliestRequiredExpiry
                              ├─ cancel rungs already past
                              └─ upsert future rungs (idempotent on (vendorId, rung, expiryDate))

Vercel Cron (hourly) → /api/cron/drain → claim due reminders (FOR UPDATE SKIP LOCKED)
   → suppression + bounce + pause checks
   → render template → Resend → record messageId
   → webhook: delivered | bounced | complained  → update, suppress on hard bounce/complaint

new certificate uploaded → comparison → if expiry moved, the whole ladder reschedules
                                        and the open ladder for the old expiry is cancelled
```

## 5. Screens

| screen | route | notes |
|---|---|---|
| Reminder settings | `/settings/reminders` | ladder toggles, sending name, reply-to, weekly-digest day, preview of each email |
| Vendor reminder panel | `/vendors/[id]` | schedule, what was sent and when, delivery state, "send now", "pause for this vendor" |
| Email log | `/settings/reminders/log` | last 200 sends with status; a hard bounce is shown as an action item, not a log line |

## 6. Email content

Subject: `Insurance certificate for {vendor} expires {date}` (T−n) / `Insurance certificate for {vendor} has expired` (T+n).

Body, in this order — the order is the spec:
1. who is asking (the **customer's** org name, "sent by Certly on behalf of…")
2. which policy expires and when
3. **what is required**, as a short plain-language list generated from the requirement set — not a
   dump of form numbers, but "General liability, at least $1,000,000 each occurrence / $2,000,000
   aggregate; {Org} named as additional insured for ongoing and completed operations
   (CG 20 10 and CG 20 37 or equivalent); waiver of subrogation"
4. **one button**: *Upload the renewal certificate* → the M8 tokenised link
5. reply-to = the customer's own mailbox, so an agent's reply reaches a human
6. CAN-SPAM footer: physical address, and an unsubscribe that suppresses **that recipient for that
   org**, not globally

**Plain, short, no marketing.** This email lands in an insurance agency's shared inbox alongside forty
others; it competes on clarity, not design. Certly's brand is a one-line footer.

## 7. Data model (Drizzle-ready)

```ts
reminders {
  id, orgId, vendorId, certificateId,
  rung,                    // 'T-60'|'T-30'|'T-14'|'T-7'|'T-1'|'T+1'|'T+7'|'T+14'|'T+21'|'T+28'
  expiryDate: date,        // the expiry this rung was scheduled against
  scheduledFor: timestamp,
  status,                  // 'scheduled'|'sending'|'sent'|'delivered'|'bounced'|'complained'|
                           // 'cancelled'|'skipped'
  recipientKind,           // 'vendor'|'producer'
  recipientEmail: citext,
  messageId: text, sentAt, deliveredAt, skippedReason,
  uploadLinkId: uuid references uploadLinks
}
// unique (vendorId, rung, expiryDate, recipientEmail)  ← idempotency, and no double-send on retry

suppressions { id, orgId, email (citext), reason: 'bounce'|'complaint'|'unsubscribe'|'manual',
               createdAt }   // unique (orgId, email)
emailEvents  { id, orgId, messageId, type, payload jsonb, receivedAt }
```

## 8. Server actions / routes

| surface | signature |
|---|---|
| `scheduleLadder` (job) | `({ vendorId }) → void` — idempotent; cancels superseded rungs |
| `GET /api/cron/reminders` | claims due rows, sends, records. Auth: Vercel Cron secret |
| `POST /api/webhooks/resend` | signature-verified; updates status; suppresses on hard bounce/complaint |
| `sendReminderNow` | `(vendorId) → { queued }` — manual, rate-limited to 1/vendor/hour |
| `pauseReminders` | `(vendorId, paused) → void` |
| `unsubscribe` (public) | `(token) → void` — org-scoped suppression, no login |

## 9. Validation

- **Global send rate cap** and a per-org daily cap (default 200) — a runaway loop must hit a wall
- never send to a suppressed address; never to a vendor with `remindersPaused`
- never send for an archived vendor
- never send twice for the same `(vendorId, rung, expiryDate, recipientEmail)`
- if the certificate was replaced since scheduling, the rung is `cancelled`, not sent
- the producer email is used **only** if it came from a certificate belonging to **this org's** vendor
- all times computed in the org's timezone; rungs fire at 09:00 local
- **`SEND_ENABLED` defaults to false in non-production**; the dev/preview formation writes the rendered
  email to the log and the email log screen, and sends nothing (PLAN §A4's drafts-first discipline
  applied to product email too)

## 10. Acceptance criteria

**A1** Given a certificate whose earliest required expiry is 2026-12-01, Then reminders are scheduled
for 2026-10-02, 11-01, 11-17, 11-24, 11-30, 12-02, and weekly to 12-29.
**A2** Given the vendor uploads a renewal on 2026-11-20, Then the 11-24, 11-30, 12-02 and weekly rungs
for that expiry are `cancelled`, and a new ladder is scheduled from the new expiry.
**A3** Given a vendor with a contact mailbox and a producer email on the certificate, Then the T−60
email goes TO the vendor mailbox and CC the producer; the T−14 email goes TO both.
**A4** Given a hard bounce webhook for the producer address, Then that address is suppressed for the
org, remaining rungs skip it with `skippedReason: 'suppressed'`, and the vendor page shows
"the agent's address is bouncing" as an action item.
**A5** Given a recipient clicks unsubscribe, Then that address is suppressed **for that org only**, and
other orgs are unaffected.
**A6** Given the cron route runs twice concurrently, Then each reminder is sent exactly once.
**A7** Given a vendor with no contact mailbox and no producer email, Then no ladder is scheduled and the
vendor appears under "cannot chase — no contact".
**A8** Given `remindersPaused`, Then rungs are `skipped`, not `cancelled` — resuming restores the
remaining ladder.
**A9** Given any reminder email, Then it contains the customer's org name, the requirement summary, one
upload button, a working reply-to, and a CAN-SPAM footer with a physical address.
**A10** Given a non-production environment, Then no email leaves the system and every rendered email is
visible in the email log.

## 11. Edge cases

| case | behaviour |
|---|---|
| Certificate with several coverages expiring on different dates | the ladder tracks **the earliest required** expiry; a note lists the others |
| Expiry more than 60 days away when the certificate is first uploaded | schedule the whole ladder; the first rung simply sits in the future |
| Certificate uploaded already expired | skip T−n entirely; start at T+1 immediately |
| Vendor and producer share an address | de-duplicate; send once |
| Org changes the ladder mid-flight | future rungs reschedule; sent rungs are history |
| Expiry in the past by more than 28 days | ladder exhausted; vendor flagged "chasing stopped after 28 days" |
| Bounce on the customer's own reply-to | admin alert; sending continues |
| Vendor replies to the email | goes to the customer's mailbox. Certly does **not** read replies (that is `SH-1` and an explicit non-goal here) |

## 12. Errors

Provider 5xx → exponential retry, max 5 attempts over 24 h, then `skipped` with a reason and a
dashboard action item. Rate limit (429) → respect `retry-after`. Template render failure → do not send,
alert admin; a broken email is worse than a late one.

## 13. Analytics

`reminder_scheduled{rung,days_out}`, `reminder_sent{rung,recipient_kind}`,
`reminder_delivered{rung}`, `reminder_bounced{kind}`, `reminder_complained`,
`reminder_suppressed{reason}`, `reminder_skipped{reason}`, `reminder_cancelled{cause}`,
`reminder_clicked{rung}` (via the M8 link token), `reminder_paused`, `unsubscribed`,
`renewal_received_after_reminder{rung,hours}`.

**`renewal_received_after_reminder` is the ROI metric.** It is what lets a renewal email say "Certly
collected 14 renewals for you last month" — a retention argument made of facts.

## 14. Test plan

Unit: ladder computation across timezones and DST boundaries; cancellation on renewal; suppression
precedence; idempotency key.
Integration (PGlite): concurrent cron drain sends exactly once; webhook updates status; unsubscribe is
org-scoped.
Contract: the mock Resend adapter reproduces delivered/bounced/complained webhook shapes **and their
signatures**, so the verification path is exercised offline.
e2e: certificate uploaded → ladder visible on the vendor page → "send now" → email appears in the log →
clicking the link opens the M8 upload page.
