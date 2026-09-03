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
| **Enterprise** | over 15 states, or unlimited | **Contact us — no Stripe price at launch** | – (see "Above the cap" below) |
| State Entry Pack (the expansion playbook, M8) | per state × trade | **$1,500** list, **$750** first state, **$1,000** each additional state in a bundle | `STRIPE_PRICE_ENTRY_PACK_*` |
| ~~First State Audit~~ | – | **DEFERRED to iteration 2** (D1) — not created in Stripe at launch | – |

Two consequences for this spec's data model, both already accommodated: the **primary** limit checked
by `getEntitlements()` is `stateLimit`, and `technicianLimit` is a secondary guardrail whose message
is softer ("you are over the fair-use band — let us move you up") rather than a hard block on the
26th technician.

### D1 — decided: a 14-day free trial, no card, for the first 100 signups

This is no longer an open question. The wave-1b review (`REVIEW.md` §1) resolved the contradiction
between this spec, `PERSONA.md` §9, `OFFER.md` §8 and `THRESHOLDS.md` §3, and the decision is applied
here as **D1**:

> **Launch on a 14-day free trial, no credit card, for the first 100 signups. The $149 First State
> Audit and the "we build your roster from the public registers" promise are DEFERRED to iteration 2,
> gated on a register-ingestion feasibility spike (`BACKLOG.md` S10). The State Entry Packs
> ($750 / $1,500 / $3,750 / +$1,000) ship unchanged from day one. `THRESHOLDS.md` H2 stands as
> written; H2b stays registered and out of force.**

Three reasons, in the order that decided it:

1. **The no-human-loop constraint is dispositive.** The tripwire's deliverable is a built, verified
   roster in 5–10 days. Nothing in the fleet's output shows that can be automated: no spec, no Must,
   no register-ingestion research. Taking $149 against an obligation only a human can currently
   discharge is the exact failure `PLAN.md`'s Goal sentence and `UX.md` C2 exist to prevent.
2. **The measurement collapses under the tripwire.** Payment would precede activation, so T2 → 1 by
   construction, and H2b's replacement band has no comparator behind it. The trial keeps T1 and T2
   meaning what `specs/13` computes, at n = 100, with no re-derivation — which is the entire point of
   pre-committing.
3. **The fast revenue is untouched.** The Entry Pack is independent of this decision and ships on day
   one. $750 for a document assembled from the knowledge base is positive revenue immediately; $149
   against an unautomated deliverable and a "30 days or you don't pay" promise is negative revenue.

**Reversal condition, written down now so it is not re-litigated by feel:** if the register-ingestion
spike (`BACKLOG.md` S10) comes back positive for a majority of the 15 launch states, the $149 audit
becomes a good offer and D1 should be reversed at the next review. The decision is against the
*unevidenced* version of the tripwire, not against the idea.

**What this costs in code: one config flag and one CTA.** `subscriptions.plan = "trial"` is
app-managed, not Stripe-managed — a no-card trial never touches Stripe — so no `trial_period_days` is
set on any price, and `one_off_purchases.kind` keeps its `first_state_audit` enum value **dormant**:
the value stays in the schema so iteration 2 needs no migration, and no code path can create one at
launch (asserted by a test).

**"First 100 signups" is enforced, not aspirational.** A counter on `organisation_created` (excluding
`is_internal`) gates the trial: signups 1–100 get 14 days no card. Signup 101 meets whatever the
founder has decided by then, and the default if nobody has decided is **the same trial** — the cap
exists so the cohort `THRESHOLDS.md` evaluates is clean, not to close the door on customer 101.

## Flow

```
signup → trial (14 days, no card, full product, alerts live)
  ├─ day 7  in-app banner + lifecycle email: "your trial ends in a week"      (UX.md E16, row 1)
  ├─ day 12 email with the plan the usage implies                             (UX.md E16, row 2)
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
8. All prices come from env; a missing env var fails the build, not a runtime checkout. The boot check
   reads exactly the eleven keys in the Stripe table and no others; a stale
   `STRIPE_PRICE_MULTI_MONTHLY` or `STRIPE_PRICE_FIRST_STATE_AUDIT` in the environment is ignored, and
   a **missing** `STRIPE_PRICE_MULTISTATE_MONTHLY` fails the build.
9. **No code path can create a `first_state_audit` one-off.** The enum value exists; a test asserts
   that no server action, route or webhook handler can write it, so iteration 2 needs a feature flag
   rather than a migration.
10. **The 16th state produces an enterprise enquiry, not a dead end**: the write is refused, the
    enquiry row is written, both emails send, and `enterprise_enquiry_created` is emitted.
11. Signups 1–100 (excluding `is_internal`) start a 14-day no-card trial; the counter is asserted at
    the boundary (100 → trial, 101 → the configured default, which is also the trial).

## Edge cases

- **Stripe webhook arrives before Checkout redirects.** The success page polls the subscription for
  up to 10 s and shows "confirming your payment…", never a wrong plan.
- **Two Checkout sessions completed for one organisation.** Second is detected and refunded
  automatically; admin flagged.
- **Test mode → live mode.** Price ids differ per mode; the env set is per Vercel environment and the
  boot check asserts the mode matches `STRIPE_SECRET_KEY`'s prefix.
- **Vercel Hobby.** P1: commercial use is forbidden on Hobby. Going live before the Pro upgrade is a
  terms breach; the go-live checklist blocks on it.
- **A customer on Platform operating in 16 states.** Blocked at the 16th with a **"talk to us" route
  that is a real route, not a dead end** — see "Above the cap" below.
- **Refunding a playbook** does not touch the subscription.
- **Trial extension** is an admin action with a reason, logged, capped at one 14-day extension.

## Above the 15-state cap: the Enterprise row (wave-1b **M8**, **D4**, Q9)

Twelve of the twenty highest-fit accounts in `phase-3-acquisition/prospects/stateready/` operate in
more than 15 states on day one (Apex 46, Pye-Barker 47, BluSky 40+, Tecta 37, Authority Brands 31,
ARS ~28, TurnPoint 28, ATI 25, Vertex 22, Legacy 19, PremiStar 17, Service Logic 140+ locations). They
exceed the Platform cap immediately and land in a tier that, at wave 1, had **no price and no path** —
so the outbound fleet had nothing to route them to and the product had nothing to show them.

**No price is invented** (there is no basis for one, and a rate card with a made-up number on it rots
the moment the first deal contradicts it). Instead the tier becomes an explicit, routable row:

| | Enterprise |
|---|---|
| **Price shown** | **"Contact us"** — a published row on `/pricing` and in `OFFER.md` §7, not a hidden fourth card |
| **Promise attached to it** | *"A quote within two business days, or we say we cannot help."* That is the only number on the row and it is one we control. |
| **Self-serve path** | none, and the page says so. Three of this buyer's alternatives are quote-gated with no published price at all; being the one that says *"here are three prices, and above them you have to ask"* is still the most transparent card in the category. |
| **What the app does at the 16th state** | Blocks the write server-side, shows the limit message, and offers one button: **"Ask for an Enterprise quote"**. |

**`POST /enterprise-enquiry`** — the route that makes it real. It writes an `enterprise_enquiries` row
(organisation, state count, technician count, trades, the states themselves), emails the founder's
mailbox with all of it pre-filled, emails the customer a confirmation naming the two-business-day
promise, and emits `enterprise_enquiry_created`. **No human is in the product's loop** — the enquiry
is a hand-off at the edge, exactly like support (`PLAN.md` A6).

**For the outbound fleet (wave 3), inherited from D4:** `outbound/stateready/workbook.csv` carries a
`state_count` column and is sortable on it. Accounts **inside 15 states** (Sila 13, Heartland 9,
Any Hour 10, Wrench ~15) are the self-serve subscription motion and lead the first batches. Accounts
**above 15** are routed to the `enterprise_quote` stage — an Entry-Pack-first conversation, not a
subscription pitch, because the subscription they would be sold does not exist yet. A batch that
pitches a $599 Platform plan to a 46-state roll-up wastes the only first impression we get.

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
`downgrade_blocked`, `playbook_purchased`, `enterprise_enquiry_created` (state count, technician
count — **the measure of how much of the target list the published ladder cannot serve**, and the
input that decides whether an Enterprise price ever gets written).

## Test plan

- **Unit:** entitlement calculation across all four plans and both limits.
- **Integration (PGlite + Stripe fixtures):** each webhook type, including out-of-order delivery and
  replay; the trial→read-only transition; `past_due` grace.
- **Integration:** server-side limit enforcement bypassing the UI.
- **Env test:** boot fails when any `STRIPE_PRICE_*` is missing, and when key mode and price mode
  disagree.
- **E2E:** Stripe test-mode card through Checkout to an `active` subscription, in the recorded journey.

## Stripe product list for the founder (P5) — **the canonical list**

**This table is the one hand-over list.** `OFFER.md` §12 references it and does not restate it; where
the two disagreed at wave 1 (env names, a missing add-on, the credit mechanism) this table wins
(wave-1b **M6**). Prices are the Offer agent's proposal and are **not live** until the founder
validates them (`PLAN.md` A5). Currency USD. Annual = 10 × monthly. **`trial_period_days` is 0 on
every price**: the 14-day trial is app-managed and no-card (D1), so Stripe never sees it.

| # | Product | Amount | Interval | Env var for the price id | Metadata |
|---|---|---|---|---|---|
| 1 | StateReady — Single State, monthly | $149.00 | month | `STRIPE_PRICE_SINGLE_MONTHLY` | `app=stateready` · `plan=single_state` · `state_limit=1` · `tech_guardrail=25` |
| 2 | StateReady — Single State, annual | $1,490.00 | year | `STRIPE_PRICE_SINGLE_ANNUAL` | as above + `interval=annual` · `months_free=2` |
| 3 | StateReady — Multi-State, monthly | $349.00 | month | `STRIPE_PRICE_MULTISTATE_MONTHLY` | `app=stateready` · `plan=multistate` · `state_limit=5` · `tech_guardrail=75` |
| 4 | StateReady — Multi-State, annual | $3,490.00 | year | `STRIPE_PRICE_MULTISTATE_ANNUAL` | as above + `interval=annual` · `months_free=2` · `entry_packs_included=1` |
| 5 | StateReady — Platform, monthly | $599.00 | month | `STRIPE_PRICE_PLATFORM_MONTHLY` | `app=stateready` · `plan=platform` · `state_limit=15` · `tech_guardrail=250` |
| 6 | StateReady — Platform, annual | $5,990.00 | year | `STRIPE_PRICE_PLATFORM_ANNUAL` | as above + `interval=annual` · `months_free=2` · `entry_packs_included=2` |
| 7 | State Entry Pack — first state | $750.00 | one_time | `STRIPE_PRICE_ENTRY_PACK_FIRST` | `kind=playbook` · `first_state=true` · `credits_against=annual` · `credit_window_days=90` · `once_per_customer=true` |
| 8 | State Entry Pack — additional state × trade | $1,500.00 | one_time | `STRIPE_PRICE_ENTRY_PACK` | `kind=playbook` · `states=1` · `includes_tracking_months=12` |
| 9 | State Entry Pack — 3-state acquisition bundle | $3,750.00 | one_time | `STRIPE_PRICE_ACQ_PACK_3` | `kind=playbook` · `states=3` · `includes_tracking_months=12` |
| 10 | **Additional State — Entry Pack add-on** | $1,000.00 | one_time | `STRIPE_PRICE_ENTRY_PACK_ADDL` | `kind=playbook` · `sku=entry_pack_additional` · `states=1` · `quantity_allowed=true` |
| 11 | StateReady — Enterprise | **no price object at launch** | – | – | Quote-only; the app routes to `POST /enterprise-enquiry` (see "Above the cap") |
| — | ~~First State Audit ($149)~~ | **not created** | – | ~~`STRIPE_PRICE_FIRST_STATE_AUDIT`~~ | **Deferred to iteration 2 by D1.** Do not create it in Stripe; the app has no code path that can charge it. |

**Three divergences from wave 1, closed:**

1. **Env names.** `STRIPE_PRICE_MULTISTATE_MONTHLY` / `_ANNUAL` — not `STRIPE_PRICE_MULTI_*`, which is
   what `OFFER.md` §12 carried. One name, and it is this one; the boot check reads exactly these keys.
2. **Line 10, the $1,000 add-on**, was in `OFFER.md` §12 and missing from this spec. It is the price of
   the fourth and later state in an acquisition bundle and it is real revenue on the Marcus purchase.
3. **The credit mechanism is a founder question, not a settled fact.** Wave 1 asserted "Stripe coupon
   at Checkout" here and in `specs/08`, and "customer balance credit … needs a decision from the
   founder" in `OFFER.md`. Both were stated as settled in one place and open in the other. It is
   **Q8 in `REVIEW.md` §6** and it is open. The default, if nobody answers before launch, is a
   **Stripe customer balance credit applied by the app** (clearest audit trail), and **one credit per
   customer, whichever is larger** — never two, which is the $899-off-a-$3,490-plan hole wave-1b
   **M7** found. `once_per_customer=true` on line 7 is enforced in the app, not in Stripe.

**Notes for whoever wires this up.**

- `state_limit` and `tech_guardrail` are metadata for the app's benefit; enforcement is in
  `getEntitlements()` and at every write path, never in Stripe.
- No tier has a trial. If D1 is ever reversed in favour of a card-required trial, `trial_period_days`
  goes on the **annual** prices only, and the reversal is recorded in `THRESHOLDS.md` §7 first.
- Prices are USD, US market (`PLAN.md` A2). Stripe Tax is a founder decision.
