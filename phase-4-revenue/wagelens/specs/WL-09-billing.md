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
| **GC Roll-up** | $299 | $2,990 | `sub_seats=unlimited`, `sub_rollup=true` | `wagelens_gc_monthly` / `_annual` | **NOT SELLABLE AT LAUNCH. Listed on the ladder as "coming", waitlist only. Stripe prices exist in TEST MODE ONLY and are never created live until WL-24 ships.** |

> **Changed 2026-09-03 (wave-1b iteration, finding B2).** The GC tier's price was published *and*
> `LANDING_SPEC.md` §8 gave it a live `Start free` CTA, while `WL-24` is a **Should** with a
> demand trigger attached. Taking $299/month for sub seats, weekly collection and a per-sub status
> board that do not exist is misrepresentation with a refund and a chargeback attached.
> **Decision taken: keep the tier visible on the ladder as "coming", with no purchasable CTA and
> no live Stripe price.** The demand signal (`gc_tier_interest`) is what BACKLOG's own trigger for
> WL-24 needs anyway, so the waitlist is worth more than the sale would have been. Moving WL-24
> into Must was considered and rejected: it is the MVP's largest **L**, its value is other
> people's payrolls (a cold start on day one), and buying it would cost the date a stranger can
> first pay us. V17–V19 below make "not sellable" a property of the code, not a copy decision.

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
        │
        │   /billing/start renders THE DISCLOSURE BLOCK, adjacent to and ABOVE the button:
        │   ┌────────────────────────────────────────────────────────────────────┐
        │   │  14 days free, then $99 a month until you cancel.                  │
        │   │  Your card is charged $99.00 on 17 September 2026 and every        │
        │   │  month after that. Cancel any time in two clicks from Settings →   │
        │   │  Billing; cancel before 17 September and you pay nothing.          │
        │   │  We'll email you 4 days before the first charge.                   │
        │   │  [ ] I've read the trial terms above.        ← REQUIRED, UNTICKED  │
        │   │  [  Start 14-day trial  ]     ← never "Start free"                 │
        │   └────────────────────────────────────────────────────────────────────┘
        │        writes subscription_terms_acceptances  ·  trial_terms_accepted
        ▼
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
| `/pricing` | Rate Lookup (free) + Crew + Shop as purchasable cards; **the GC tier as a fourth card marked "Coming" with a waitlist field and no purchase CTA**; the incumbent comparison; no "call us" | — |
| **GC waitlist card** | the tier's features in the **future tense**, one email field, `Join the list`; on submit, `gc_tier_interest {plan:'gc', surface}` and a plain "we'll email you when it ships". **No Checkout path exists to reach it.** | idle · joined |
| `/billing/start` | plan choice, **the full disclosure block above the button** (V14), the required terms checkbox (V15), button labelled `Start 14-day trial` | idle · terms-unaccepted · redirecting |
| `/billing/return` | "confirming your subscription…" then redirect | polling · confirmed · timeout-reconciling |
| `/settings/billing` | plan, status, **"your next charge is $99.00 on 17 Sep 2026"** stated as a date and an amount (never "renews monthly"), card last-4, [manage in portal], invoices, **the terms version accepted and when** | trialing · active · past_due · canceled |
| trial banner | "Trial ends in 6 days — $99 will be charged on 17 Sep. Cancel →" from day 8; daily from day 12. **Always carries the amount, the date and the cancel link.** | — |
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

subscription_terms_acceptances                   // B9: the negative-option consent record.
                                                 // Same mechanism as WL-11's disclaimer_acknowledgements.
  id                        uuid         primaryKey defaultRandom
  organisation_id           uuid         notNull references organisations(id)
  user_id                   uuid         notNull references users(id)
  terms_version             text         notNull        // content hash of the disclosure block as rendered
  price_lookup_key          text         notNull        // which plan's terms — the amount is in the text
  disclosed_amount_cents    integer      notNull        // what we told them they would be charged
  disclosed_charge_date     date         notNull        // the date we told them
  disclosed_interval        text         notNull        // 'month' | 'year'
  accepted_at               timestamptz  notNull default now()
  accepted_ip_hash          char(64)     notNull
  unique (organisation_id, terms_version, price_lookup_key)

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
| `createCheckoutSession({ organisationId, lookupKey, termsVersion })` | Stripe Checkout, `mode=subscription`, `trial_period_days=14`, `payment_method_collection=always`, metadata `{organisation_id, terms_version}`. **Refuses unless a `subscription_terms_acceptances` row exists for this organisation and this `terms_version` (V15), and unless `lookupKey` is in the sellable set (V17).** Refuses when a live subscription already exists. |
| `recordTermsAcceptance({ organisationId, lookupKey })` | writes `subscription_terms_acceptances` with the rendered disclosure's content hash, the amount and the date shown. **Called by the checkbox, before Checkout, never after.** |
| `joinGcWaitlist({ email, surface })` | the only thing the GC card can do. Writes to the WL-14 consent table pattern (unticked-by-default checkbox, double opt-in, unsubscribe) and emits `gc_tier_interest`. **It creates no subscription, no customer and no Stripe object.** |
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

### Auto-renewal disclosure and consent (added 2026-09-03, finding B9)

A free trial that converts into a recurring charge is a **negative-option offer**. The terms must
be clearly and conspicuously disclosed **before** the payment method is collected, consent must be
express and recorded, and cancellation must be at least as easy as signing up. That is ROSCA
(15 U.S.C. 8403) and the FTC's negative-option posture; several states add their own automatic
renewal law — California's ARL is the strictest and also requires a renewal reminder on longer
terms. None of this was in any document before this iteration, and the landing CTA on the paid
cards read `Start free`. **This is the cheapest fix in the review and the one with the sharpest
downside if skipped.**

| # | rule |
|---|---|
| **V14** | **The disclosure block renders adjacent to and above the button that begins Checkout**, in the same type size as the surrounding copy, never in a footnote, a tooltip, a collapsed `<details>` or a linked page. It states, in this order: **(a)** the trial length; **(b)** the **exact amount** and the **exact calendar date** of the first charge; **(c)** the renewal interval and that it continues until cancelled; **(d)** how to cancel, in one sentence, with the link; **(e)** that a reminder email arrives before the first charge. The amount and date are computed, never hard-coded, and re-rendered if the plan choice changes. |
| **V15** | **Consent is express and recorded.** An **unticked** checkbox — "I've read the trial terms above" — is required before `createCheckoutSession` is callable. Acceptance writes `subscription_terms_acceptances` with the **content hash of the block as rendered**, the disclosed amount, the disclosed date and a hashed IP. No pre-ticked box, no "by continuing you agree", no bundling with the privacy policy. `createCheckoutSession` **refuses** without a matching row. |
| **V16** | **Notices before money moves.** (a) A **pre-charge reminder email at day 10** — four days before the first charge — naming the amount, the date and the cancel link, *and* showing what has already been produced (`OFFER.md` §7: this is a spec requirement, not a marketing intention); Stripe's own trial-ending email is on as well and is the courtesy, not the notice. (b) An **annual plan sends a renewal notice ≥ 7 days before every renewal**, with the amount, the date and the cancel link. (c) Both are transactional and are **never** suppressed by a marketing unsubscribe (WL-14 V7). |
| **V16a** | **No CTA that begins a paid trial may read "Start free", "Try free", "Get started free" or any variant that omits the charge.** The label is **`Start 14-day trial`** everywhere — `/pricing`, `/billing/start`, the landing page's pricing cards and its lookup escalation (`LANDING_SPEC.md` §5.4, §8). A CI grep over user-facing source and content fails the build on `Start free`. The **free rate lookup** keeps its own honest microcopy ("Free. No card, no login, no demo call.") because it genuinely is free and takes no card — the rule is about CTAs that lead to a card. |
| **V16b** | **Cancellation is at least as easy as subscribing**: two clicks, in-product, no call, no email, no retention flow (V12, G3). The cancel link appears in the disclosure block, in the trial banner, in every trial and renewal email, and in `/settings/billing`. |

### The GC tier is not purchasable (added 2026-09-03, finding B2)

| # | rule |
|---|---|
| **V17** | The **sellable set** is a constant: `{wagelens_crew_monthly, wagelens_crew_annual, wagelens_shop_monthly, wagelens_shop_annual}`. `createCheckoutSession` refuses any other lookup key with `tier_not_sellable`, and `getEntitlement` never returns a `gc` entitlement. **The GC lookup keys are absent from the sellable set until WL-24 ships**, and moving them is a one-line, reviewable diff. |
| **V18** | `WAGELENS_PRICE_GC_MONTHLY` / `_ANNUAL` resolve **only in test mode**. A boot-time assertion fails the deploy if a **live-mode** GC price id is present in the environment before WL-24 ships. The founder is handed the GC rows in `STRIPE_SETUP.md` marked *test mode only* (OFFER §10). |
| **V19** | Every surface that shows the GC tier — `/pricing`, the landing page's pricing block, the plan switcher in the Portal — renders it as **"Coming"** with its features in the **future tense** and **no purchase control**. The only interactive element is the waitlist field. A CI test asserts no `Start 14-day trial`, `Start free`, `Buy` or `Subscribe` control exists inside the GC card. |

## Acceptance criteria

- **Given** a new organisation, **when** Checkout completes, **then**
  `checkout.session.completed` creates a `subscriptions` row with `status = 'trialing'` and
  `trial_ends_at` 14 days out, and full access is granted.

**The B9 criteria:**

- **Given** `/billing/start` with Shop monthly chosen on 3 September 2026, **when** it renders,
  **then** the block above the button reads the trial length, **`$99.00`**, **`17 September
  2026`**, "every month until you cancel", the cancel route in one sentence and the reminder
  promise — all in the surrounding type size, none of it collapsed or linked away — and the
  button reads **`Start 14-day trial`**. *(V14, V16a)*
- **Given** that page with the checkbox **unticked**, **when** the button is pressed, **then** no
  Checkout session is created and the reason is shown. *(V15)*
- **Given** the checkbox ticked, **when** it is submitted, **then** one
  `subscription_terms_acceptances` row exists carrying the block's content hash, `9900`,
  `2026-09-17`, `month` and a hashed IP — **and no raw IP is stored** — and
  `trial_terms_accepted {plan, terms_version}` fires.
- **Given** a `createCheckoutSession` call whose `termsVersion` has no acceptance row, **when** it
  runs, **then** it is refused. *(V15 — the consent record gates the money path, not the UI)*
- **Given** the plan choice is switched from Shop to Crew, **when** the block re-renders, **then**
  the amount becomes `$79.00`, the content hash changes, and the previous acceptance no longer
  satisfies V15.
- **Given** a trial started on 3 September, **when** day 10 arrives, **then** the pre-charge
  reminder is sent naming `$99.00`, `17 September 2026`, the cancel link and the WH-347s already
  produced, and `trial_reminder_email_sent {plan, days_before_charge: 4}` fires. *(V16a)*
- **Given** an **annual** subscription renewing on 3 September 2027, **when** 27 August 2027
  arrives, **then** the renewal notice is sent with the amount, the date and the cancel link, and
  `renewal_notice_sent {plan, days_before_renewal: 7}` fires. *(V16b)*
- **Given** a user who has unsubscribed from every marketing list, **when** the trial reminder and
  the renewal notice are due, **then** both still send. *(V16c — transactional is not
  suppressible)*
- **Given** the user-facing source tree and content, **when** CI greps it, **then** `Start free`
  appears in **no** CTA label. *(V16a)*

**The B2 criteria:**

- **Given** `createCheckoutSession({ lookupKey: 'wagelens_gc_monthly' })`, **when** it runs,
  **then** it is refused with `tier_not_sellable` and no Stripe object is created. *(V17)*
- **Given** a live-mode `WAGELENS_PRICE_GC_MONTHLY` in the environment, **when** the app boots,
  **then** the boot assertion fails. *(V18)*
- **Given** `/pricing` and the landing page's pricing block, **when** the GC card renders,
  **then** it is labelled "Coming", its bullets are in the future tense, it contains **no**
  purchase control, and its only control submits the waitlist. *(V19)*
- **Given** the GC waitlist field, **when** an address is submitted, **then**
  `gc_tier_interest {plan:'gc', surface}` fires, the address is captured under WL-14's consent
  rules, and no customer, subscription or Checkout session is created.
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
| A GC asks for the $299 tier before WL-24 ships | `/pricing` and the landing page show it as **"Coming"** with a waitlist and no purchase control, and capture the interest as `gc_tier_interest`. **This is the WL-24 demand signal**, and it is why the price is published while the tier is not sellable. If a GC insists on paying, the honest answer is Shop today and the waitlist for the roll-up — never a $299 charge for features that do not exist. *(V17–V19)* |
| A GC on the waitlist emails asking to be invoiced manually | Same answer. There is no code path, and creating one by hand would be the same misrepresentation with a human in the loop. |
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

**Names are canonical and defined once**, in [`WL-EVENTS.md`](WL-EVENTS.md) §6. This spec owns
them; the landing page reuses them verbatim and coins none of its own (finding B6). Note
`pricing_cta_clicked` — it is the event `LANDING_SPEC.md` §13 previously called
`plan_cta_clicked`, and it now has an owner.

`pricing_viewed {source}` · **`pricing_cta_clicked {tier, interval}`** ← tier mix before checkout ·
`lookup_cta_clicked` (from WL-00 — the true top of this funnel) ·
`gc_tier_interest {plan, surface}` · `tier_limit_reached {tier, limit}` · `tier_upgraded {from, to}` ·
`checkout_started {plan}` · **`trial_terms_viewed {plan, terms_version}`** ·
**`trial_terms_accepted {plan, terms_version}`** ← the B9 consent record, measured ·
`checkout_abandoned {tier, step}` · `checkout_completed {plan}` ·
`trial_started {plan, trial_ends_at}` · `trial_ending_banner_shown {days_left}` ·
**`trial_reminder_email_sent {plan, days_before_charge}`** ·
**`renewal_notice_sent {plan, days_before_renewal}`** ·
`subscription_activated {plan, mrr_cents, days_from_signup}` ·
`subscription_payment_failed {attempt}` · `subscription_recovered` ·
`subscription_cancelled {reason, days_active, payrolls_generated, projects}` ← the churn
post-mortem in one event ·
`portal_opened` · `paywall_shown {blocked_action}`

**`trial_terms_accepted` ÷ `trial_terms_viewed` is a compliance metric, not a funnel metric.** If
it is near 100% the checkbox is doing nothing and someone has pre-ticked it; if the gap is large
the disclosure is doing its job and telling us the price is the objection. Both readings are
useful; neither is a reason to weaken the disclosure.

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
**Disclosure tests (B9)** — render `/billing/start` for each sellable price on a frozen clock and
snapshot the block; assert it contains the amount, the ISO date, the interval, the cancel link and
the reminder sentence, that it is a sibling of the button rather than inside a `<details>`, and
that the checkbox's `checked` attribute is absent; assert `createCheckoutSession` throws without a
matching acceptance row; assert the day-10 and annual-renewal notices fire on the frozen clock and
survive a marketing unsubscribe; **CI grep: `Start free` in no user-facing CTA.**
**Not-sellable tests (B2)** — `createCheckoutSession` on both GC lookup keys throws
`tier_not_sellable`; the boot assertion fails on a live-mode GC price id; a render test asserts
the GC card has no purchase control on `/pricing` and on the landing page.
**E2E (Stripe test mode, nightly lane)** — real test-mode Checkout with card `4242…`, webhook
via the Stripe CLI listener, subscription activates, portal opens, cancel takes effect.
