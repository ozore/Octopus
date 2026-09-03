# WL-09 · Billing: trial, subscription, portal

**Effort: M · Must (MVP) · Depends on: WL-01**
Pattern reused: Clausewright ADR-007 — **the webhook, not the redirect, is the source of truth
for payment.**

## Story

As Rosa I start a 14-day trial with a card on file, generate my first WH-347 the same
afternoon, and if I do nothing I am charged $99 on day 15. I can cancel myself, from a link in
settings, without emailing anyone.

## The pricing decision, and the evidence behind it

**Pricing is owned by [`../OFFER.md`](../OFFER.md) §6 and §10. This spec implements it.**
Reconciled 2026-09-03; where the two disagree, OFFER.md wins and this table is updated.

| tier | monthly | annual | limits (Stripe price metadata) | lookup keys | at launch |
|---|---|---|---|---|---|
| **Crew** | $79 | $790 | `projects_max=3`, `workers_max=15`, `sub_seats=0`, `audit_binder=false`, `prime_link=false` | `wagelens_crew_monthly` / `_annual` | sellable |
| **Shop** ⭐ the ICP | **$99** | **$990** | `projects_max=unlimited`, `workers_max=100`, `sub_seats=0`, `audit_binder=true`, `prime_link=true`, `recommended=true` | `wagelens_shop_monthly` / `_annual` | sellable |
| **GC Roll-up** | $299 | $2,990 | `sub_seats=unlimited`, `sub_rollup=true` | `wagelens_gc_monthly` / `_annual` | **created and priced publicly; sellable only when WL-24 ships** |

Annual is 10× monthly (two months free). **No metered price, no setup fee, no per-report
usage record, no "contact us" tier.** The incumbents' $5–12 per report (LCPcertified $12/report;
Points North $175/mo + $7.50/report + $995–4,995 setup; CertifiedPayrollPro $49–249/mo +
$1–5/report, all verified first-party 2026-09-03) is the thing the buyer complains about, and
metering the exact action we want her to take every Friday is the wrong incentive on both sides.

**The free thing is [WL-00](WL-00-public-rate-lookup.md), and it has no Stripe object.** The
rate lookup is free forever with no card and no login. **The trial gates the form, never the
rate.** That is not a marketing choice this spec may quietly reverse — it is the trust argument
the whole funnel rests on (OFFER §7).

**14-day trial, card required.** Poyar / ProductLed / ChartMogul (n≈200 B2B products, Jan 2026)
put card-required trials at **25–35% "good"** free-to-paid against **4–6%** without; Poyar /
Rachitsky / Pendo (n>1,000, six-month cohorts) put free trials generally at **8–12% good,
15–25% great**. Fourteen days covers **two payroll cycles**, which is the real reason: one cycle
proves the form comes out, two prove that week 2 is faster than week 1.

**No free tier.** Argued in [`../BACKLOG.md`](../BACKLOG.md) §4.

## Flow

```
/pricing  (marketing; Offer & Landing agent owns the copy, this spec owns the mechanics)
  └─ "Start 14-day trial" ─▶ signup (WL-01) ─▶ /billing/start
        └─ Stripe Checkout (subscription mode, trial_period_days=14, card required)
              ├─ cancel  ─▶ /billing/start with an explanation, account still usable read-only
              └─ success ─▶ /billing/return?session_id=…   ← shows "confirming…" and POLLS
                              │
   Stripe ──▶ POST /api/stripe/webhook  ← THE ONLY THING THAT ACTIVATES A SUBSCRIPTION
                 checkout.session.completed          → subscription row, status=trialing
                 customer.subscription.updated       → status, period end, cancel_at_period_end
                 customer.subscription.deleted       → status=canceled
                 invoice.paid                        → status=active, paid_through
                 invoice.payment_failed              → status=past_due, dunning email
                              │
                              ▼
                    /projects  (full access)

/settings/billing  ─▶ Stripe Billing Portal (update card · change plan · cancel · invoices)
```

**`/billing/return` never grants access.** It polls our own subscription row until the webhook
has written it, with a 30-second fallback that reconciles by calling Stripe directly. A redirect
is a claim by the browser; the webhook is a statement by Stripe.

## Screens

| screen | contents | states |
|---|---|---|
| `/pricing` | the three plans, the GC tier marked "coming soon — join the list", the incumbent comparison, no "call us" | — |
| `/billing/start` | plan choice, "14 days free, then $99/mo, cancel anytime" | idle · redirecting |
| `/billing/return` | "confirming your subscription…" then redirect | polling · confirmed · timeout-reconciling |
| `/settings/billing` | plan, status, trial ends / next charge, card last-4, [manage in portal], invoices | trialing · active · past_due · canceled |
| trial banner | "Trial ends in 6 days" from day 8; daily from day 12 | — |
| paywall | shown when `status ∈ {canceled, past_due beyond grace}`: history and exports stay readable; **creating and certifying payrolls is blocked** | — |
| cancellation notice | "You'll keep read-only access to your payrolls and exports for 30 days" | — |

## Data model

```ts
subscriptions                                    // our mirror of Stripe; Stripe remains the truth
  id                        uuid         primaryKey defaultRandom
  organisation_id           uuid         notNull unique references organisations(id)
  stripe_customer_id        text         notNull unique
  stripe_subscription_id    text         unique
  price_lookup_key          text                         // wagelens_{crew|shop|gc}_{monthly|annual}
  tier                      text                         // 'crew' | 'shop' | 'gc' — mirrored from price metadata
  projects_max              integer                      // null = unlimited
  workers_max               integer                      // null = unlimited
  status                    text         notNull         // trialing | active | past_due | canceled | incomplete
  trial_ends_at             timestamptz
  current_period_end        timestamptz
  cancel_at_period_end      boolean      notNull default false
  canceled_at               timestamptz
  read_only_until           timestamptz                  // canceled_at + 30 days
  mrr_cents                 integer
  created_at                timestamptz  notNull default now()
  updated_at                timestamptz  notNull default now()

stripe_events                                    // idempotency, and the audit trail
  id                        text         primaryKey      // Stripe's event id
  type                      text         notNull
  payload                   jsonb        notNull
  processed_at              timestamptz
  processing_error          text
  received_at               timestamptz  notNull default now()
```

`stripe_events.id` being Stripe's own event id makes webhook processing idempotent at the
database level. Stripe retries; we insert-or-ignore.

## Server actions / API

| name | effect |
|---|---|
| `createCheckoutSession({ organisationId, lookupKey })` | Stripe Checkout, `mode=subscription`, `trial_period_days=14`, `payment_method_collection=always`, metadata `{organisation_id}`. Refuses when a live subscription already exists. |
| `POST /api/stripe/webhook` | verifies the signature, inserts `stripe_events` (ignore on conflict), applies the transition, marks processed. **Unsigned or badly signed requests are rejected before parsing.** |
| `createPortalSession()` | Stripe Billing Portal, return URL `/settings/billing` |
| `getEntitlement({ organisationId })` | `{ can_create_payroll, can_certify, can_read, reason }` — **the single function every gated action calls** |
| `reconcileSubscription({ organisationId })` | direct Stripe read; the `/billing/return` timeout fallback and a manual repair path |

## Validation rules

| # | rule |
|---|---|
| V1 | Access is granted **only** by a `subscriptions` row written by a verified webhook. No code path grants access from a redirect, a query parameter, or a Checkout session id. |
| V2 | Webhook signature verified with `STRIPE_WEBHOOK_SECRET` before the body is parsed. |
| V3 | Every webhook is idempotent on `stripe_events.id`. |
| V4 | `getEntitlement` is the only source of gating. No screen re-implements the rule. |
| V5 | `past_due` gets a **7-day grace period** with full access and dunning emails on days 1, 3 and 6 — a card expiring must not stop a federal filing deadline. |
| V6 | On cancellation: creating and certifying payrolls is blocked; **reading and exporting history stays available for 30 days** (`read_only_until`). Taking away an audit trail the day a card fails is the most damaging thing this product could do. |
| V7 | Price ids come from env (`WAGELENS_PRICE_CREW_MONTHLY`, `…_CREW_ANNUAL`, `…_SHOP_MONTHLY`, `…_SHOP_ANNUAL`, `…_GC_MONTHLY`, `…_GC_ANNUAL`) resolved by lookup key at boot. **No price id is hard-coded.** (PLAN D2, OFFER §10) |
| V11 | Tier limits (`projects_max`, `workers_max`) are read from Stripe price **metadata** and mirrored onto `subscriptions`, never hard-coded in application logic. Exceeding a limit prompts an in-product upgrade through the Portal; **it never blocks certifying a payroll that is already in progress.** A limit that stops a federal filing deadline would cost more trust than the upsell is worth. |
| V12 | The Customer Portal has **cancel enabled, immediate, with no retention flow**, and plan switching enabled between all six prices with proration on (OFFER §10). A retention wall would contradict the guarantee printed on the page. |
| V13 | **WL-00's public rate lookup is never gated by `getEntitlement`.** A CI test asserts no public route calls it. |
| V8 | Test mode until the founder flips live (PLAN D2/A5). `STRIPE_MODE` is asserted at boot against `NODE_ENV`. |
| V9 | No card data ever touches our servers — hosted Checkout and hosted Portal only. No adapter method accepts a PAN. |
| V10 | An organisation has at most one subscription. |

## Acceptance criteria

- **Given** a new organisation, **when** Checkout completes, **then**
  `checkout.session.completed` creates a `subscriptions` row with `status = 'trialing'` and
  `trial_ends_at` 14 days out, and full access is granted.
- **Given** a completed Checkout whose webhook has not yet arrived, **when**
  `/billing/return` loads, **then** it polls and does **not** grant access; after 30 seconds it
  reconciles directly with Stripe.
- **Given** the same webhook delivered three times, **when** all three are processed, **then**
  one `stripe_events` row exists and the subscription is written once. *(V3)*
- **Given** a request to `/api/stripe/webhook` with an invalid signature, **when** it arrives,
  **then** it is rejected with 400 and the body is never parsed. *(V2)*
- **Given** a trial ending, **when** `invoice.paid` arrives, **then** `status = 'active'`,
  `mrr_cents = 9900`, and `subscription_activated {plan, mrr_cents}` is emitted.
- **Given** `invoice.payment_failed`, **when** it arrives, **then** `status = 'past_due'`, access
  continues for 7 days, and dunning emails fire on days 1, 3 and 6.
- **Given** a canceled subscription, **when** a payroll certification is attempted, **then** it
  is blocked by `getEntitlement`, while the payroll list and every export still work for 30 days.
- **Given** an organisation with a live subscription, **when** a second Checkout is attempted,
  **then** it is refused and the Portal is offered.
- **Given** any gated action, **when** its code is inspected, **then** it calls `getEntitlement`
  and does not read `subscriptions.status` directly. *(V4 — a lint rule and a test)*

## Edge cases

| case | behaviour |
|---|---|
| Trial ends with no payroll ever generated | Charged as agreed. A day-11 email ("you haven't made a WH-347 yet — here's the 4-minute path") is WL-23/wave 3, and it is the highest-value lifecycle email in the product. |
| Card declines on the very Friday a payroll is due | The 7-day grace exists exactly for this. She files, then fixes the card. |
| Subscription canceled with a certified payroll mid-week and a draft open | The draft is preserved and readable; certification is blocked with the reason and a resubscribe link. |
| Chargeback / `charge.dispute.created` | Recorded on `stripe_events`; access is not changed automatically. A human decision (PLAN A6). |
| Founder changes prices later | Lookup keys are stable; existing subscriptions keep their price. New signups get the new one. |
| Crew hits its 3-project or 15-worker limit mid-week | The upgrade prompt appears, and the payroll still certifies. *(V11)* Upgrading is self-serve in the Portal with proration. |
| A GC asks for the $299 tier before WL-24 ships | `/pricing` shows it as "coming soon — join the list" and captures the interest as a `gc_tier_interest` event. **This is the WL-24 demand signal**, and it is why the price is published before the tier exists. |
| Annual plan mid-term upgrade to GC | Stripe Portal proration. Not our code. |
| Webhook secret rotated | Boot-time assertion that the secret is present; a signature failure alerts rather than silently 400-ing forever. |

## Errors

| condition | user sees | logged |
|---|---|---|
| Checkout creation fails | "We couldn't start checkout." + retry | `checkout_create_failed` |
| Webhook processing throws | 500 so Stripe retries; `stripe_events.processing_error` recorded | `stripe_webhook_failed {type}` |
| `/billing/return` times out | "Still confirming — we'll email you when it's live", reconcile job enqueued | `billing_return_timeout` |
| Portal session fails | fallback to a support mailto | `portal_create_failed` |

## Analytics events

`pricing_viewed {source}` · `lookup_cta_clicked` (from WL-00 — the true top of this funnel) · `gc_tier_interest {plan}` · `tier_limit_reached {tier, limit}` · `tier_upgraded {from, to}` ·
`checkout_started {plan}` · `checkout_abandoned` · `checkout_completed {plan}` ·
`trial_started {plan, trial_ends_at}` · `trial_ending_banner_shown {days_left}` ·
`subscription_activated {plan, mrr_cents, days_from_signup}` ·
`subscription_payment_failed {attempt}` · `subscription_recovered` ·
`subscription_cancelled {reason, days_active, payrolls_generated, projects}` ← the churn
post-mortem in one event ·
`portal_opened` · `paywall_shown {blocked_action}`

## Test plan

**Unit** — signature verification against a known-good and a tampered payload; every webhook
transition; `getEntitlement` across all five statuses plus the grace boundary and the 30-day
read-only boundary.
**Integration (PGlite + mock Stripe adapter)** — Checkout → synthesised
`checkout.session.completed` driven through the **production** webhook handler (the Clausewright
mock-Stripe pattern: same signature check, same idempotency); triple delivery writes once;
`past_due` → grace → block; cancel → read-only.
**Invariant test** — grep the codebase: **no route or server action reads
`subscriptions.status` outside `getEntitlement`**, and no price id string literal appears
outside `env.ts`.
**E2E (Stripe test mode, nightly lane)** — real test-mode Checkout with card `4242…`, webhook
via the Stripe CLI listener, subscription activates, portal opens, cancel takes effect.
