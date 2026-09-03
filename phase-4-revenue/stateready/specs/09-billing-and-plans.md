# M9 — Billing: plans, trial, Stripe

**Status:** spec, wave 1. **Effort:** M (~2–3 dev-days). **Depends on:** M1, M2.
**Platform:** `packages/platform/billing` (Checkout, Portal, webhook → subscription state).
**Founder prerequisite:** P5 in `../PREREQUISITES.md` — products and prices are created by the
founder from the list at the end of this spec; the app only reads price ids from env.

## Story

> As the office manager, I want to try it with my real roster before I ask my owner for a card, and
> when I do ask, I want a price I can justify in one sentence: "it is less than one lapsed licence".

## The plans

**Aligned with `OFFER.md` (Offer & Landing agent, wave 1) on 2026-09-03.** That document argues the
tier metric better than this spec originally did, and the argument is adopted: **tier on states, with
technicians as a fair-use guardrail** — because a state × trade is a rulebook we maintain (it is our
actual cost driver) and "we're in seven states" is the buyer's own sentence, whereas a 60-technician
single-state shop is one rulebook and should not pay like a multi-state one. Never per seat.

| plan | limits | price | env var |
|---|---|---|---|
| **Single State** | 1 state, up to 25 technicians | **$149/mo** · $1,490/yr | `STRIPE_PRICE_SINGLE_MONTHLY` / `_ANNUAL` |
| **Multi-State** | up to 5 states, up to 75 technicians | **$349/mo** · $3,490/yr | `STRIPE_PRICE_MULTISTATE_MONTHLY` / `_ANNUAL` |
| **Platform** | up to 15 states, up to 250 technicians | **$599/mo** · $5,990/yr | `STRIPE_PRICE_PLATFORM_MONTHLY` / `_ANNUAL` |
| Enterprise | unlimited | quote — **no Stripe price at launch** | – |
| First State Audit | 1 state, one-off, credits against an annual plan within 90 days | **$149** | `STRIPE_PRICE_FIRST_STATE_AUDIT` |
| State Entry Pack (the expansion playbook, M8) | per state × trade | **$1,500** list, **$750** first state | `STRIPE_PRICE_ENTRY_PACK_*` |

Two consequences for this spec's data model, both already accommodated: the **primary** limit checked
by `getEntitlements()` is `stateLimit`, and `technicianLimit` is a secondary guardrail whose message
is softer ("you are over the fair-use band — let us move you up") rather than a hard block on the
26th technician.

### The open disagreement: free trial or paid tripwire

This spec originally proposed a **14-day no-card free trial**. `OFFER.md` §8 proposes replacing it
with a **$149 First State Audit** — a paid tripwire that captures a card and delivers a built,
verified calendar for one state, crediting in full against an annual plan.

**This is a real, unresolved disagreement between two wave-1 agents and it is left visible rather than
silently decided.** Both are implementable from the same code; the difference is one config plus which
CTA the landing page carries. What each implies:

| | 14-day no-card trial | $149 First State Audit |
|---|---|---|
| Signups | more, lower intent | far fewer, much higher intent |
| `THRESHOLDS.md` T2 | measures product persuasion | **breaks as defined** — payment precedes activation, so activation → paid approaches 1 and the meaningful metric becomes audit → subscription |
| Delivery | zero marginal cost | a roster build per audit. `OFFER.md` calls it "effort ≈ zero for the buyer"; it is not zero for us, and PLAN.md's no-human-loop rule means it must be automated from the public registers or it does not scale |
| Risk | trial ends with an empty account | we owe a deliverable to every buyer from day one |

**Recommendation to the founder (this agent's view):** ship the free trial for the first 100 signups,
because `THRESHOLDS.md` is calibrated for it and because the audit's roster build is the one part of
`OFFER.md` that quietly reintroduces a human loop. Then run the $149 audit as the explicit next
iteration if T2 lands in the iterate band. Whichever is chosen, **the bands in `THRESHOLDS.md` §3 must
be re-derived before the data is read, not after.**

## Flow

```
signup → trial (14 days, full product, alerts live)
  ├─ day 7  in-app banner + lifecycle email: "your trial ends in a week"
  ├─ day 12 email with the plan the usage implies
  ├─ day 14 read-only: data intact, alerts PAUSED with a clear notice, upgrade CTA
  └─ Upgrade → Stripe Checkout → webhook → active
Portal (Stripe) handles card change, invoice history, cancellation.
Downgrade below current usage → blocked with the number that has to change.
```

Alerts pause rather than stop at trial end, and the customer is told in words that they are paused.
Silently continuing to send would be generous and would also mean the product's value is free;
silently stopping would let a licence lapse on our watch.

## Screens

| screen | contents |
|---|---|
| `/pricing` (marketing) | Three columns, the limits in plain words, annual toggle, "what happens after the trial". |
| `/settings/billing` | Current plan, usage against both limits with a bar each, next invoice date, "manage in Stripe" button, invoice list. |
| Trial banner | Persistent from day 7; shows days left and the recommended plan. |
| Limit-reached modal | When adding a second state on Single State: "Single State covers one state. Multi-State covers five — $349/mo." One click to Checkout. |

## Data model

```ts
export const subscriptions = pgTable("subscriptions", {
  organisationId:  uuid("organisation_id").primaryKey().references(() => organisations.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripePriceId:   text("stripe_price_id"),
  plan:            text("plan", { enum: ["trial","single_state","multistate","platform","none"] }).notNull().default("trial"),
  status:          text("status", { enum: ["trialing","active","past_due","canceled","incomplete"] }).notNull().default("trialing"),
  trialEndsAt:     timestamp("trial_ends_at", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  stateLimit:      integer("state_limit").notNull().default(1),      // the primary limit
  technicianLimit: integer("technician_limit").notNull().default(25),     // fair-use guardrail
  updatedAt:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stripeEvents = pgTable("stripe_events", {
  id:          text("id").primaryKey(),          // Stripe's event id — the idempotency key
  type:        text("type").notNull(),
  payload:     jsonb("payload").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  error:       text("error"),
});

export const oneOffPurchases = pgTable("one_off_purchases", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  kind:           text("kind", { enum: ["playbook","first_state_audit"] }).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  amountCents:    integer("amount_cents").notNull(),
  status:         text("status", { enum: ["pending","paid","refunded","failed"] }).notNull(),
  refundReason:   text("refund_reason"),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**Stripe is the source of truth for money; the database is a mirror.** `stripeEvents.id` as the
primary key makes webhook replay a no-op, which is the single most common billing bug.

## Server actions / API

| action | notes |
|---|---|
| `createCheckoutSession({ priceId })` | Server-side price id lookup from env — never trusts a price id from the client. |
| `createPortalSession()` | Returns the Stripe Portal URL. |
| `POST /api/webhooks/stripe` | Signature-verified. Handles `checkout.session.completed`, `customer.subscription.{created,updated,deleted}`, `invoice.payment_failed`, `payment_intent.succeeded`. Idempotent on event id. |
| `getEntitlements()` | `{ technicianLimit, stateLimit, canAddTechnician, canAddState, readOnly }`. Every write path calls it. |
| `GET /api/cron/trials` | Daily: day-7 and day-12 emails, day-14 transition to read-only. |

## Validation and enforcement

- Enforcement is at the **server action**, not in the UI. `addOperatingState` refuses over `stateLimit`
  regardless of what the client sends; `createTechnician` warns over `technicianLimit` and blocks only
  at 2x it, so a customer is never stopped from recording a licence they legally hold.
- Read-only mode blocks writes and **never blocks reads or exports**. Holding a customer's compliance
  data hostage is both wrong and, for this buyer, unforgivable.
- A downgrade whose limits are below current usage is refused with the exact number: "Multi-State
  covers 5 states; you operate in 7."

## Acceptance criteria

1. A new organisation is `trialing` with the Single State limits and `trialEndsAt` = signup + 14 days.
2. On day 14 the organisation flips to read-only; licences, deadlines, documents and exports remain
   readable; alert digests carry a final "your trial has ended, alerts are paused" notice.
3. Checkout completion moves it to `active` with the right limits within 5 s of the webhook.
4. Replaying any webhook event changes nothing (assert row-level equality before and after).
5. `invoice.payment_failed` sets `past_due`; the product keeps working for 7 days with a banner, then
   goes read-only. A card that expires must not cost a customer a licence.
6. Adding a **second state** on Single State is refused server-side with the upgrade path; exceeding the technician guardrail warns rather than blocks.
7. Cancelling in the Portal sets `cancelAtPeriodEnd`; access continues to period end.
8. All prices come from env; a missing env var fails the build, not a runtime checkout.

## Edge cases

- **Stripe webhook arrives before Checkout redirects.** The success page polls the subscription for
  up to 10 s and shows "confirming your payment…", never a wrong plan.
- **Two Checkout sessions completed for one organisation.** Second is detected and refunded
  automatically; admin flagged.
- **Test mode → live mode.** Price ids differ per mode; the env set is per Vercel environment and the
  boot check asserts the mode matches `STRIPE_SECRET_KEY`'s prefix.
- **Vercel Hobby.** P1: commercial use is forbidden on Hobby. Going live before the Pro upgrade is a
  terms breach; the go-live checklist blocks on it.
- **A customer on Platform operating in 16 states.** Blocked at the 16th with a "talk to us" route.
  `OFFER.md` names Enterprise as quote-only with no Stripe price at launch, which is right — inventing a
  price on the phone is how a published rate card rots.
- **Refunding a playbook** does not touch the subscription.
- **Trial extension** is an admin action with a reason, logged, capped at one 14-day extension.

## Errors

| condition | user sees |
|---|---|
| Stripe API down at Checkout | "Payments are having a moment. Your trial is extended by a day." + automatic one-day extension |
| Webhook signature invalid | 400, nothing written, admin alert (this is either a bug or an attack) |
| Webhook processing throws | Event stored with `error`, retried by Stripe, admin alert after 3 failures |

## Analytics events

`trial_started`, `trial_day7_notified`, `trial_ended`, `pricing_viewed`, `checkout_started` (plan),
`checkout_completed` (plan, mrr_cents), `subscription_canceled` (reason from the Portal if given),
`payment_failed`, `plan_limit_hit` (which limit — **the best expansion-revenue signal we have**),
`downgrade_blocked`, `playbook_purchased`.

## Test plan

- **Unit:** entitlement calculation across all four plans and both limits.
- **Integration (PGlite + Stripe fixtures):** each webhook type, including out-of-order delivery and
  replay; the trial→read-only transition; `past_due` grace.
- **Integration:** server-side limit enforcement bypassing the UI.
- **Env test:** boot fails when any `STRIPE_PRICE_*` is missing, and when key mode and price mode
  disagree.
- **E2E:** Stripe test-mode card through Checkout to an `active` subscription, in the recorded journey.

## Stripe product list for the founder (P5)

Aligned with `OFFER.md` §7. Prices are the Offer agent's proposal and are **not live** until the
founder validates them (PLAN.md A5).

| product | price | interval | metadata |
|---|---|---|---|
| StateReady Single State | $149 | month | `plan=single_state, state_limit=1, tech_guardrail=25` |
| StateReady Single State (annual) | $1,490 | year | `plan=single_state, interval=annual` |
| StateReady Multi-State | $349 | month | `plan=multistate, state_limit=5, tech_guardrail=75` |
| StateReady Multi-State (annual) | $3,490 | year | `plan=multistate, interval=annual` |
| StateReady Platform | $599 | month | `plan=platform, state_limit=15, tech_guardrail=250` |
| StateReady Platform (annual) | $5,990 | year | `plan=platform, interval=annual` |
| First State Audit | $149 | one-time | `kind=first_state_audit, credits_against=annual, credit_window_days=90` |
| State Entry Pack — first state | $750 | one-time | `kind=playbook, first_state=true, credits_against=annual` |
| State Entry Pack — additional state × trade | $1,500 | one-time | `kind=playbook` |
| State Entry Pack — 3-state acquisition bundle | $3,750 | one-time | `kind=playbook, states=3` |

No Enterprise price is created. The credit mechanics (audit and first Entry Pack crediting against an
annual plan) are implemented as a Stripe **coupon applied at Checkout**, not as a manual refund, so
the ledger stays clean and the credit window is enforced by code rather than by memory.
