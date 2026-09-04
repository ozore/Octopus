# Spec M7 — Expiry reminders to the vendor's contact

> **NAME PENDING — `IDENTITY.md` §2.3.** Every customer- and agent-facing string below renders
> `{PRODUCT_NAME}` from one constant; the code slug stays `certly` (REVIEW.md MJ-13). The sending
> domain, the inbound domain and the app origin are **env values** — `{APP_ORIGIN}`,
> `{INBOUND_DOMAIN}`, `{SENDING_DOMAIN}` — and no literal domain appears in this spec (B-11).

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

This ladder is canonical (REVIEW.md §2.8) and is quoted identically in `KNOWLEDGE_BASE.md` §B.5,
`UX.md` §4.2 and `LANDING_SPEC.md` §4 V2. The earlier "−30/−14/−3/+1" in `IDENTITY.md` §12.10 and
`UX.md` §4.2 is stale and corrected there.

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

Subject: `Insurance certificate for {vendor} expires {date}` (T−n) / `Insurance certificate for {vendor} has expired` (T+n). Non-deceptive: it names the vendor and the real date and nothing else.

Body, in this order — the order is the spec:
1. who is asking (the **customer's** org name, "sent by {PRODUCT_NAME} on behalf of {Customer Org}")
2. which policy expires and when
3. **what is required**, as a short plain-language list generated from the requirement set — not a
   dump of form numbers, but "General liability, at least $1,000,000 each occurrence / $2,000,000
   aggregate; {Org} named as additional insured for ongoing and completed operations
   (CG 20 10 and CG 20 37 or equivalent); waiver of subrogation"
4. **one button**: *Upload the renewal certificate* → the M8 tokenised link at `{APP_ORIGIN}/u/<token>`
5. **the schedule, stated in words**: *"This is message {n} of {total} about this certificate. They
   stop as soon as a current certificate arrives."* — `{total}` is computed from the remaining rungs
   for this expiry (§9), so the promise on the landing page is one the queue enforces (REVIEW.md §2.8)
6. reply-to = the customer's own mailbox, so an agent's reply reaches a human
7. the footer in §6.1

**Plain, short, no marketing.** This email lands in an insurance agency's shared inbox alongside forty
others; it competes on clarity, not design. {PRODUCT_NAME}'s brand is a one-line footer.

### 6.1 The CAN-SPAM footer, written out — five elements, all required (REVIEW.md MJ-16)

These messages are sent by TheVillage on a customer's behalf to a business that has no relationship
with us. A document request under an existing business relationship is arguably transactional, but we
treat every V-email as **commercial** and carry the full footer anyway: it costs four lines and it
removes the argument entirely.

| # | element | implementation |
|---|---|---|
| 1 | **Clear identification of who is asking** | `From` display name *"{Customer Org} via {PRODUCT_NAME}"*, on `{SENDING_DOMAIN}`; body line 1 *"Sent by {PRODUCT_NAME} on behalf of {Customer Org}"*. Never a `From` that implies the customer's own domain |
| 2 | **A valid physical postal address** | TheVillage's, from `PREREQUISITES.md` P10 — TheVillage is the sender of record. Rendered in the footer of every V-email, not linked |
| 3 | **A conspicuous opt-out, with two scopes** | `{APP_ORIGIN}/unsubscribe/<token>`: **"Stop requests from {Customer Org}"** *and* **"Stop all {PRODUCT_NAME} requests, from every customer"**. The second is the one that satisfies the statute. No fee, no login, no information required beyond the address, functioning for **at least 30 days** after send, honoured within **10 business days** (we honour immediately) |
| 4 | **Non-deceptive subject and headers** | the subject above; no forged `From`, `Reply-To` or routing |
| 5 | **No marketing, at all** | see §6.2 |

### 6.2 No marketing in a vendor-facing email — absolute

A V-email may contain: the upload link, the requirement summary, the customer's org name, the
schedule sentence, the reply-to, the footer. It may **not** contain a {PRODUCT_NAME} call to action, a
pricing link, a signup link, a referral offer, a feature announcement, a logo linking to the marketing
site, or any link other than the upload link, the unsubscribe link and the legal pages. Added to
`BACKLOG.md` §4 NEVER as **N13**. A marketing line in one of these messages removes any argument that
it is transactional and burns the customer's relationship with their own vendor, which is worth more
to them than we are.

## 7. Data model (Drizzle-ready)

```ts
reminders {
  id, orgId, vendorId, certificateId,
  totalForExpiry: integer,  // how many messages this expiry's ladder will send in total — printed
                            // in the body (§6 item 5) and enforced by the cap in §9
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

suppressions { id, orgId, email (citext), scope: 'org'|'global',
               reason: 'bounce'|'complaint'|'unsubscribe'|'manual', createdAt }
// unique (orgId, email) where scope='org'; unique (email) where scope='global' and orgId IS NULL.
// A 'global' row suppresses that address across EVERY org — the statutory opt-out (§6.1 item 3).
recipientSends { email (citext) pk, lastSentAt }   // the 72-hour per-recipient interval, §9
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
| `unsubscribe` (public) | `(token, scope) → void` — no login. `scope='org'` suppresses for that customer; `scope='global'` suppresses across every org. Both offered on the same page; the page also works with the token alone if the recipient just types their address |

## 9. Validation

- **A per-recipient minimum interval of 72 hours, enforced in the claim query, across every org,
  every vendor, every property and every requirement.** `UX.md` §3.3 and `LANDING_SPEC.md` §5 promise
  it and nothing implemented it (REVIEW.md §2.8). A rung whose recipient was emailed inside 72 hours
  is **deferred**, not dropped, and is re-attempted on the next drain; it is skipped only once the
  next rung supersedes it
- **A per-expiry total-message cap.** The ladder has 10 rungs and up to 2 recipients, so an
  unthrottled expiry could produce twenty messages about one certificate — which contradicts
  `IDENTITY.md` P7, `LANDING_SPEC.md` §5 ("One ask per vendor") and `OFFER.md` §2.4. The cap is
  **6 messages per recipient per expiry** and **10 per expiry in total**; once reached, remaining
  rungs are `skipped` with `skippedReason: 'expiry_cap'` and the vendor is flagged in the dashboard
  as "we have stopped asking — chase this one yourself"
- **Global send rate cap** and a per-org daily cap (default 200) — a runaway loop must hit a wall
- never send to a suppressed address — **org-scoped or global** — and never to a vendor with
  `remindersPaused`
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
**A5** Given a recipient clicks unsubscribe and chooses "stop requests from {Customer Org}", Then that
address is suppressed **for that org only** and other orgs are unaffected; given they choose "stop all
{PRODUCT_NAME} requests", Then it is suppressed globally.
**A6** Given the cron route runs twice concurrently, Then each reminder is sent exactly once.
**A7** Given a vendor with no contact mailbox and no producer email, Then no ladder is scheduled and the
vendor appears under "cannot chase — no contact".
**A8** Given `remindersPaused`, Then rungs are `skipped`, not `cancelled` — resuming restores the
remaining ladder.
**A9** Given any reminder email, Then it contains the customer's org name, the requirement summary,
one upload button, the "message {n} of {total}" sentence, a working reply-to, and the full §6.1
footer with a physical address and **both** opt-out scopes — and contains **no** {PRODUCT_NAME}
marketing, CTA or link other than the upload, unsubscribe and legal links (§6.2). An explicit test
asserts the link allowlist.
**A11** Given a recipient who received any {PRODUCT_NAME} email 12 hours ago, When another rung for
any org or vendor comes due, Then it is deferred and not sent (§9, 72-hour interval).
**A12** Given one expiry and two recipients, Then at most 6 messages reach each recipient and at most
10 are sent in total, after which the vendor is flagged "we have stopped asking".
**A13** Given a recipient chooses "stop all {PRODUCT_NAME} requests", Then a `scope='global'`
suppression is written and **no** org can email that address again.
**A14** Given any V-email, Then every URL in it resolves under `{APP_ORIGIN}` or `{INBOUND_DOMAIN}`
read from env — no literal domain is compiled into a template (REVIEW.md B-11).
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
precedence (global beats org beats none); idempotency key; the 72-hour interval and both message caps;
the footer's link allowlist; `{total}` matches the number of messages actually sent for a fixture
expiry.
Integration (PGlite): concurrent cron drain sends exactly once; webhook updates status; unsubscribe is
org-scoped.
Contract: the mock Resend adapter reproduces delivered/bounced/complained webhook shapes **and their
signatures**, so the verification path is exercised offline.
e2e: certificate uploaded → ladder visible on the vendor page → "send now" → email appears in the log →
clicking the link opens the M8 upload page.
