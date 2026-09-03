# Spec M10 — Billing: tiers by certificates tracked, with a trial

**Backlog item:** M10 (Must). **Effort:** M. **Depends on:** M1; `packages/platform` billing
(Stripe Checkout + Portal + webhook-as-truth, PLAN §D2).

> **Pricing is owned by `OFFER.md`, not by this spec.** The Offer & Landing agent researched and
> committed the ladder, the trial mechanics and the Stripe product list in `OFFER.md` §8, §9 and §12.
> This spec implements those numbers and **must not diverge from them**. Where they change, `OFFER.md`
> changes first and this spec follows. An earlier draft of this spec assumed a no-card trial and a
> 500-certificate top tier; both were superseded by `OFFER.md` and are corrected here.

## 1. Story

> As a stranger who found Certly at 11pm, I run a free gap report on my own certificates, see what it
> finds, start a trial on the tier I chose, and keep going. I never book a demo, never get a quote,
> never speak to anyone.

Self-serve is not a feature here, it is the market thesis (`BACKLOG.md` §0).

## 2. The ladder (from `OFFER.md` §8.2)

| plan | price | active certificates | seats | card |
|---|---|---:|---|---|
| **Free Gap Report** | $0, one-off | 25, report only, no account | — | no |
| **Starter** | **$99/mo** · **$990/yr** | **50** | 3 | yes |
| **Standard** *(default)* | **$199/mo** · **$1,990/yr** | **150** | 10 | yes |
| **Portfolio** | **$299/mo** · **$2,990/yr** | **400** | 25 | yes |
| **Certificate Pack** | **+$39/mo** · **+$390/yr** per 50 | stackable add-on, quantity 1–10 | — | yes |
| above ~700 | published rate **$0.55/certificate/month**, invoiced — **never a demo** | — | — | — |

Annual = ten months for twelve (17%). All USD; Stripe Tax on, US only at launch.

The **Free Gap Report** is a separate surface with no Stripe object at all — spec M15. It is the offer's
front end, and it is explicitly *not* a free tier: there is no account, nothing stored beyond the
report, and nothing to cancel (`BACKLOG.md` N12).

**What "active certificate" means, stated plainly because a fuzzy meter is a support-ticket factory:
one non-archived vendor = one active certificate.** A vendor with three certificates on file counts
once; an archived vendor counts zero. This is the meter the customer can see and predict on the
dashboard. Counting certificate *documents* would punish uploading renewals — the behaviour we want —
so it is rejected on purpose. The **Certificate Pack** is the published growth path so nobody has to
contact us to add fifty vendors.

Price ids come from env (`STRIPE_PRICE_CERTLY_STARTER_MONTHLY`, … per `OFFER.md` §12.2). **No price is
hardcoded**; the founder creates the products (PLAN §D2).

## 3. The trial (from `OFFER.md` §9)

**14 days, card required**, via Stripe Checkout with `trial_period_days = 14` on the six subscription
prices. The trial runs on the tier the customer picked, with every feature on and that tier's
certificate limit — not a special trial plan with special limits. Cancel in one click in the Billing
Portal.

Two emails, both driven by Stripe's `customer.subscription.trial_will_end`: **T−3 and T−1**, each
containing the org's own numbers ("you're tracking 34 vendors and we've found 6 gaps"). **No charge
without a warning** — that promise is implemented here, not just written on the pricing page.

Stacked on top: **30 days, money back, no questions** (`OFFER.md` §6), executed as a manual refund by
the founder. There is no automated-refund code path, and there deliberately is not one at launch.

## 4. Flow

```
Free Gap Report (M15) ──▶ "keep these 25 vendors" ──▶ signup (M1)
                                                        │
signup ─────────────────────────────────────────────────┤
                                                        ▼
   choose a tier → Stripe Checkout (card, trial_period_days=14)
                → webhook checkout.session.completed → subscriptions row, status='trialing'
   T−3, T−1  ← customer.subscription.trial_will_end → our email
   T−0       → invoice.paid → status='active'      (or payment_failed → past_due)
Portal → card, invoices, plan switch, Pack quantity, cancel
```

## 5. Read-only, not lock-out

When a trial ends unpaid or a subscription lapses, the org becomes **read-only**: the dashboard, every
vendor, every certificate, every report and every export stay visible and downloadable. What stops is
**writing** — new uploads, new vendors — and **outbound reminders**.

A deliberate commercial choice: the customer's compliance record is their data; holding it hostage
generates chargebacks and one-star reviews rather than revenue; and a visible dashboard full of red is
a better upgrade prompt than a paywall. Reminders stop because sending email on a lapsed account costs
us money and sends mail on a customer's behalf that they are not paying for.

## 6. Screens

| screen | route | notes |
|---|---|---|
| Pricing | `/pricing` (marketing) | four cards, every price visible, no "contact us" for the three tiers; the $0.55 rate published for the tail |
| Plan & billing | `/settings/billing` | plan, usage meter (34/50), Pack quantity, next invoice, "manage billing" → Portal |
| Paywall | modal | names the cap, the current count, and the **two** ways out: next tier, or a Certificate Pack |
| Trial banner | app shell | days remaining, from day 7; "no charge until {date}" |

## 7. Data model (Drizzle-ready)

```ts
// organisations gains: plan, stripeCustomerId
subscriptions {
  id, orgId unique,
  stripeSubscriptionId unique, stripeCustomerId, stripePriceId,
  plan,             // 'starter'|'standard'|'portfolio'
  interval,         // 'month'|'year'
  status,           // Stripe's: 'trialing'|'active'|'past_due'|'canceled'|'unpaid'|'incomplete'
  packQuantity: integer default 0,          // Certificate Packs
  baseCertLimit: integer,                   // from the price metadata: 50 | 150 | 400
  certLimit: integer,                       // baseCertLimit + packQuantity * 50  (stored, not derived
                                            // at read time, so a limit is auditable after a price change)
  seatLimit: integer,
  trialEndsAt, currentPeriodEnd, cancelAtPeriodEnd, createdAt, updatedAt
}
stripeEvents { id, stripeEventId unique, type, payload jsonb, processedAt }   // idempotency
```

`certLimit` and `seatLimit` are read from the **price metadata** (`cert_limit`, `seats`,
`cert_increment` — `OFFER.md` §12.1/12.2) on every subscription webhook, never hardcoded in the app.
Changing a plan's capacity is then a Stripe metadata edit plus a webhook replay, not a deploy.

## 8. Server actions / routes

| surface | signature | notes |
|---|---|---|
| `createCheckoutSession` | `(plan, interval, packQty?) → { url }` | owner only; `client_reference_id = orgId`, `metadata.orgId`; `trial_period_days` comes from the price, not the request |
| `createPortalSession` | `() → { url }` | plan switch, Pack quantity, cancel, invoices |
| `POST /api/stripe/webhook` | signature-verified, idempotent on `stripeEventId` | handles `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `customer.subscription.trial_will_end`, `invoice.paid`, `invoice.payment_failed` |
| `getEntitlements` | `(orgId) → { plan, status, certUsed, certLimit, seatsUsed, seatLimit, readOnly, trialEndsAt }` | one cached read; every write path checks it |

## 9. Validation

- **every** write path (create vendor, CSV import, upload, send reminder) checks entitlements
  server-side. A UI-only cap is not a cap
- CSV import at the cap imports **up to** the limit and reports the remainder — a 200-row import that
  fails at row 51 is a lost customer
- downgrade below current usage is allowed: the org goes over-limit and is blocked from adding **new**
  vendors only. **Nothing is ever deleted for being over-limit**
- Pack quantity 0–10, adjusted in the Portal, prorated
- webhook: verify signature; ignore unknown types; never trust amounts from the client
- no PAN, CVV or card data touches Certly — hosted Checkout and Portal only

## 10. Acceptance criteria

**A1** Given a new signup, When they choose Standard, Then Checkout is created with the Standard
monthly price, the card is collected, the subscription is `trialing`, `certLimit` is 150 from the price
metadata, and the banner reads "no charge until {date}".
**A2** Given a trialing org at 150 certificates, When they add a 151st, Then the paywall offers both
Portfolio at $299 and a Certificate Pack at +$39/50, with the current count named.
**A3** Given `customer.subscription.trial_will_end`, Then our T−3 email is sent, and a second at T−1,
each carrying the org's vendor count and gap count.
**A4** Given the customer does nothing, Then at T−0 the card is charged, `invoice.paid` sets `active`,
and no further trial messaging appears.
**A5** Given Checkout completes, Then the plan changes **on the webhook**, not on the redirect — a
customer who closes the tab is still provisioned within seconds.
**A6** Given the same webhook is delivered twice, Then the subscription is updated once.
**A7** Given `invoice.payment_failed`, Then status is `past_due`, the org stays fully writable for a
7-day grace period with a dunning email, and after grace it becomes read-only.
**A8** Given a cancelled subscription, Then access continues to `currentPeriodEnd`, and after it the
org is read-only with every export still working.
**A9** Given a Portfolio org with 380 vendors that downgrades to Standard, Then no vendor is deleted,
the org is over-limit, and only new vendors are blocked.
**A10** Given a CSV import of 200 rows with 30 slots left, Then 30 import, 170 are reported as
over-limit with one-click upgrade **and** one-click add-a-Pack, and nothing silently disappears.
**A11** Given a viewer-role user, Then Checkout and Portal actions are refused server-side.
**A12** Given a customer adds 2 Certificate Packs in the Portal, Then the webhook sets
`packQuantity = 2` and `certLimit = baseCertLimit + 100`.

## 11. Edge cases

| case | behaviour |
|---|---|
| Checkout completed for an org deleted meanwhile | webhook logs and raises a refund-by-hand alert; never auto-refund from code |
| Two Checkouts started, both completed | the second webhook detects an existing subscription, cancels the duplicate at Stripe, alerts admin |
| Card fails at the end of the trial | §A7 — grace, not immediate lockout |
| Customer above ~700 certificates | the published $0.55/certificate/month rate, invoiced manually. **Still not a demo** (`OFFER.md` §8.2) — this is the promise we never break |
| Refund requested inside 30 days | manual, no questions, recorded in the audit trail (M9 `billing.subscription_changed`) |
| Trial extended by support | `trialEndsAt` editable in admin, audited |
| Currency other than USD | out of scope at launch |
| Test-mode vs live | env-driven; PLAN §D2 requires founder QA in test mode before live |

## 12. Errors

Checkout unreachable → "We couldn't reach our payment provider. Nothing was charged." + retry.
Webhook signature failure → 400, logged, alerted, **never** processed.
Entitlement check failure → fail **closed** for writes, **open** for reads.

## 13. Analytics

`pricing_viewed{source}`, `checkout_started{plan,interval,pack_qty}`,
`checkout_completed{plan,interval,mrr_cents}` *(this is the trial start — the card is on file)*,
`checkout_abandoned`, `trial_will_end_email_sent{days_left}`,
`trial_converted{plan,mrr_cents}` *(the first `invoice.paid`)*, `trial_cancelled{day,reason}`,
`paywall_viewed{trigger,cert_used,cert_limit}`, `pack_added{qty}`, `plan_changed{from,to}`,
`subscription_past_due`, `subscription_cancelled{reason,tenure_days}`, `refund_issued{days_in}`,
`read_only_view`.

**The two numbers `THRESHOLDS.md` §3 reads are `checkout_completed` (a card on file) and
`trial_converted` (money).** With a card-required trial these are different events and the threshold is
measured on the second, not the first — a card-required trial that nobody lets convert is not a
conversion.

## 14. Test plan

Unit: entitlement computation across every plan × status, including `past_due` inside and outside
grace, `trialing` at the cap, and Pack arithmetic; the active-certificate meter (archived excluded,
multiple certificates per vendor counted once).
Integration (PGlite + mock Stripe): webhook idempotency; redirect-without-webhook does **not**
provision; webhook-without-redirect does; trial→active on `invoice.paid`; downgrade below usage blocks
only new writes; the partial CSV import path.
Contract: the mock Stripe adapter reproduces real webhook payloads **with valid HMAC signatures**, so
verification runs offline (the `app/` discipline).
e2e: pricing → Checkout (test mode) → trialing → hit the cap → paywall offers tier and Pack → Portal
opens and cancel works in one click.
