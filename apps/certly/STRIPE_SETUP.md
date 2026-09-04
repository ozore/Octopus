# Stripe setup — Certly

Generated from the app's plan map. Nothing in this file is a secret: it is the
list of things to create and the names of the variables their ids go into.

**Order matters.** Do all of it in **test mode** first, run one end-to-end
purchase, then repeat in live mode. One Stripe account serves all three apps
(PLAN.md D2), so prefix every product name with the app name.

## 0. Certly specifics — read this before creating anything

**Settle the product name first.** Every customer-visible product name below
carries `{PRODUCT_NAME}`, which is **pending** (`IDENTITY.md` §2.3 recommends
*Coverfile*; REVIEW.md MJ-13). Renaming before these objects exist is a
find-and-replace; renaming after invoices exist is not. The slug `app=certly`
and the statement descriptor `CERTLY` stay either way — the slug is internal
and the descriptor is capped at 22 characters and set once.

**Four products, eight prices.** §1 below is generated from the plan map and
lists one row per PRICE, so each of the three tiers appears twice (monthly and
annual). In Stripe they are **three products with two prices each**, plus the
Vendor Pack:

| Product name | Statement descriptor | Description | Metadata |
|---|---|---|---|
| `{PRODUCT_NAME} Starter` | `CERTLY` | 50–200 units, or 5–15 associations | `app=certly, tier=starter, vendor_limit=50, seats=3` |
| `{PRODUCT_NAME} Standard` | `CERTLY` | 200–500 units or 15–45 associations | `app=certly, tier=standard, vendor_limit=150, seats=10` |
| `{PRODUCT_NAME} Portfolio` | `CERTLY` | Multi-market managers and small general contractors | `app=certly, tier=portfolio, vendor_limit=400, seats=25` |
| `{PRODUCT_NAME} Vendor Pack` | `CERTLY` | +50 tracked vendors, stackable add-on | `app=certly, tier=addon, vendor_increment=50` |

### 0.1 Prices, with the metadata each one carries

`vendor_limit` and `seats` are **read from the price metadata**, so changing a
plan's capacity is a Stripe edit plus a webhook replay rather than a deploy
(`specs/10` §7). The app also carries the same numbers in `src/lib/plans.ts`
so `/pricing` renders without a Stripe call; **if you change one, change both**.

| Product | Nickname | Price | Currency | Interval | Trial days | Metadata | Env var |
|---|---|---|---|---|---|---|---|
| {PRODUCT_NAME} Starter | `starter-monthly` | **$99** | usd | month | **14** | `app=certly, tier=starter, vendor_limit=50, seats=3` | `STRIPE_PRICE_CERTLY_STARTER_MONTHLY` |
| {PRODUCT_NAME} Starter | `starter-annual` | **$990** | usd | year | **14** | `app=certly, tier=starter, vendor_limit=50, seats=3` | `STRIPE_PRICE_CERTLY_STARTER_ANNUAL` |
| {PRODUCT_NAME} Standard | `standard-monthly` | **$199** | usd | month | **14** | `app=certly, tier=standard, vendor_limit=150, seats=10` | `STRIPE_PRICE_CERTLY_STANDARD_MONTHLY` |
| {PRODUCT_NAME} Standard | `standard-annual` | **$1,990** | usd | year | **14** | `app=certly, tier=standard, vendor_limit=150, seats=10` | `STRIPE_PRICE_CERTLY_STANDARD_ANNUAL` |
| {PRODUCT_NAME} Portfolio | `portfolio-monthly` | **$299** | usd | month | **14** | `app=certly, tier=portfolio, vendor_limit=400, seats=25` | `STRIPE_PRICE_CERTLY_PORTFOLIO_MONTHLY` |
| {PRODUCT_NAME} Portfolio | `portfolio-annual` | **$2,990** | usd | year | **14** | `app=certly, tier=portfolio, vendor_limit=400, seats=25` | `STRIPE_PRICE_CERTLY_PORTFOLIO_ANNUAL` |
| {PRODUCT_NAME} Vendor Pack | `pack50-monthly` | **$39** | usd | month | 0 | `app=certly, tier=addon, vendor_increment=50` | `STRIPE_PRICE_CERTLY_PACK50_MONTHLY` |
| {PRODUCT_NAME} Vendor Pack | `pack50-annual` | **$390** | usd | year | 0 | `app=certly, tier=addon, vendor_increment=50, discount=17pct` | `STRIPE_PRICE_CERTLY_PACK50_ANNUAL` |

Annual is ten months for twelve (17% off). The Vendor Pack's billing scheme is
**licensed with an adjustable quantity, 1–10**.

### 0.2 The trial is a negative-option subscription, so the disclosure is configuration

Every subscription price carries `trial_period_days = 14` and the card is
charged automatically on day 14 unless the customer cancels. Put this sentence
— **verbatim, with the real date substituted by Checkout** — in each
subscription price's **line-item description**, because the app already renders
it next to every button that collects a card (`specs/10` §3.1, REVIEW.md B-06):

> Card required. No charge until {date}. Cancel in one click.

**Never label any of these "Start free".** The only free thing Certly offers is
the Free Gap Report, which has no Stripe object at all.

### 0.3 Settings that go with them

| Setting | Value | Why |
|---|---|---|
| Checkout mode | `subscription`, card required, `trial_period_days=14` on the six tier prices | Card-required trials convert about 5× better, and the disclosure above makes that lawful as well as effective |
| Billing Portal | On: cancel, switch plan, update card, **adjust Vendor Pack quantity**, download invoices | "Cancel any time" must be true in one click, not an email |
| Proration | On, for tier switches and pack quantity | Upgrades must be frictionless; the meter is the growth path |
| Tax | Stripe Tax on, US only at launch | |
| Trial-end reminders | `customer.subscription.trial_will_end` → our T−3 and T−1 emails | "No charge without a warning" is a promise the product keeps |
| Refunds | Manual, 30-day, no questions | The guarantee is executed by hand; there is deliberately no automated refund path |
| Free Gap Report | **No Stripe object at all** | It is not a plan: no card, no account, nothing to cancel |
| Above ~700 tracked vendors | Published rate $0.55 per tracked vendor per month, invoiced | Keeps the "never a demo" promise without building metered billing at launch |

**Not created at launch, deliberately:** any Solo/$49 price, any usage-metered
price, any coupon. Coupons before the first hundred customers destroy the price
anchor and teach the market to wait.

### 0.4 What the app does with each webhook

| Event | What Certly does |
|---|---|
| `checkout.session.completed` | mirrors the subscription, writes the **consent row** with the exact disclosure string that was rendered, and emits `checkout_completed` — *a card on file, not money* |
| `customer.subscription.created/updated/deleted` | re-mirrors; a **Vendor Pack** price is routed to `billing_addons` instead, because the mirror holds one row per organisation |
| `customer.subscription.trial_will_end` | sends the T−3 warning and schedules T−1, each carrying the org's own vendor and gap counts |
| `invoice.paid` | emits `trial_converted` on the **first** one — this is the number `THRESHOLDS.md` §3 measures |
| `invoice.payment_failed` | `past_due`: fully writable for a 7-day grace with a dunning email, read-only after it |

## 1. Products and prices (generated, one row per price)

### 1. Certly — Starter

| field | value |
|---|---|
| Product name | `Certly Starter` |
| Description | 50–200 units, or 5–15 associations |
| Price | $99 / month |
| Billing | Recurring, monthly |
| Currency | USD |
| Free trial | 14 days (set by the app at Checkout, NOT on the price) |
| Copy the price id into | `STRIPE_PRICE_CERTLY_STARTER_MONTHLY` |

### 2. Certly — Standard

| field | value |
|---|---|
| Product name | `Certly Standard` |
| Description | 200–500 units or 15–45 associations |
| Price | $199 / month |
| Billing | Recurring, monthly |
| Currency | USD |
| Free trial | 14 days (set by the app at Checkout, NOT on the price) |
| Copy the price id into | `STRIPE_PRICE_CERTLY_STANDARD_MONTHLY` |

### 3. Certly — Portfolio

| field | value |
|---|---|
| Product name | `Certly Portfolio` |
| Description | Multi-market managers and small general contractors |
| Price | $299 / month |
| Billing | Recurring, monthly |
| Currency | USD |
| Free trial | 14 days (set by the app at Checkout, NOT on the price) |
| Copy the price id into | `STRIPE_PRICE_CERTLY_PORTFOLIO_MONTHLY` |

### 4. Certly — Starter

| field | value |
|---|---|
| Product name | `Certly Starter` |
| Description | 50–200 units, or 5–15 associations |
| Price | $990 / year |
| Billing | Recurring, yearly |
| Currency | USD |
| Free trial | 14 days (set by the app at Checkout, NOT on the price) |
| Copy the price id into | `STRIPE_PRICE_CERTLY_STARTER_ANNUAL` |

### 5. Certly — Standard

| field | value |
|---|---|
| Product name | `Certly Standard` |
| Description | 200–500 units or 15–45 associations |
| Price | $1990 / year |
| Billing | Recurring, yearly |
| Currency | USD |
| Free trial | 14 days (set by the app at Checkout, NOT on the price) |
| Copy the price id into | `STRIPE_PRICE_CERTLY_STANDARD_ANNUAL` |

### 6. Certly — Portfolio

| field | value |
|---|---|
| Product name | `Certly Portfolio` |
| Description | Multi-market managers and small general contractors |
| Price | $2990 / year |
| Billing | Recurring, yearly |
| Currency | USD |
| Free trial | 14 days (set by the app at Checkout, NOT on the price) |
| Copy the price id into | `STRIPE_PRICE_CERTLY_PORTFOLIO_ANNUAL` |

## 2. Customer Portal

Settings → Billing → Customer portal:

- Allow customers to **update payment methods**: on
- Allow customers to **cancel subscriptions**: on, *at end of billing period*
- Allow customers to **switch plans**: on, listing the products above
- Invoice history: on
- Business information: link to `https://octopus-certly.vercel.app/legal/terms` and `https://octopus-certly.vercel.app/legal/privacy`

If you save a specific configuration id, put it in `STRIPE_PORTAL_CONFIGURATION_ID`.

## 3. Webhook endpoint

Developers → Webhooks → Add endpoint:

- URL: `https://octopus-certly.vercel.app/api/stripe/webhook`
- Events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.paid`
- Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

The webhook is the source of truth for entitlement: the redirect back from
Checkout grants nothing on its own, and every event is de-duplicated on
`stripe_events.id`.

## 4. Environment variables (Vercel project `octopus-certly`)

| variable | value |
|---|---|
| `STRIPE_SECRET_KEY` | secret key (test first, then live) |
| `STRIPE_WEBHOOK_SECRET` | signing secret of the endpoint above |
| `STRIPE_PORTAL_CONFIGURATION_ID` | optional portal configuration id |
| `STRIPE_PRICE_CERTLY_PACK50_MONTHLY` | price id of the monthly Vendor Pack |
| `STRIPE_PRICE_CERTLY_PACK50_ANNUAL` | price id of the annual Vendor Pack |
| `STRIPE_PRICE_CERTLY_STARTER_MONTHLY` | price id of Certly Starter |
| `STRIPE_PRICE_CERTLY_STANDARD_MONTHLY` | price id of Certly Standard |
| `STRIPE_PRICE_CERTLY_PORTFOLIO_MONTHLY` | price id of Certly Portfolio |
| `STRIPE_PRICE_CERTLY_STARTER_ANNUAL` | price id of Certly Starter |
| `STRIPE_PRICE_CERTLY_STANDARD_ANNUAL` | price id of Certly Standard |
| `STRIPE_PRICE_CERTLY_PORTFOLIO_ANNUAL` | price id of Certly Portfolio |

## 5. Before charging a real card

- Vercel **Pro** plan: the Hobby plan forbids commercial use (PLAN.md D3, risk list).
- Business details, statement descriptor and support email set on the Stripe account.
- One live-mode purchase by the founder, refunded, with the receipt checked.
