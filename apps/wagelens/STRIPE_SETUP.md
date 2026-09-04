# Stripe setup — WageLens

Generated from the app's plan map. Nothing in this file is a secret: it is the
list of things to create and the names of the variables their ids go into.

**Order matters.** Do all of it in **test mode** first, run one end-to-end
purchase, then repeat in live mode. One Stripe account serves all three apps
(PLAN.md D2), so prefix every product name with the app name.

## 1. Products and prices

### 1. WageLens — Crew

| field | value |
|---|---|
| Product name | `WageLens Crew` |
| Description | The one- to three-job sub |
| Price | $79 / month |
| Billing | Recurring, monthly |
| Currency | USD |
| Free trial | 14 days (set by the app at Checkout, NOT on the price) |
| Copy the price id into | `STRIPE_PRICE_CREW` |

### 2. WageLens — Shop

| field | value |
|---|---|
| Product name | `WageLens Shop` |
| Description | Many small covered jobs |
| Price | $99 / month |
| Billing | Recurring, monthly |
| Currency | USD |
| Free trial | 14 days (set by the app at Checkout, NOT on the price) |
| Copy the price id into | `STRIPE_PRICE_SHOP` |

## 2. Customer Portal

Settings → Billing → Customer portal:

- Allow customers to **update payment methods**: on
- Allow customers to **cancel subscriptions**: on, *at end of billing period*
- Allow customers to **switch plans**: on, listing the products above
- Invoice history: on
- Business information: link to `https://octopus-wagelens.vercel.app/legal/terms` and `https://octopus-wagelens.vercel.app/legal/privacy`

If you save a specific configuration id, put it in `STRIPE_PORTAL_CONFIGURATION_ID`.

## 3. Webhook endpoint

Developers → Webhooks → Add endpoint:

- URL: `https://octopus-wagelens.vercel.app/api/stripe/webhook`
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

## 4. Environment variables (Vercel project `octopus-wagelens`)

| variable | value |
|---|---|
| `STRIPE_SECRET_KEY` | secret key (test first, then live) |
| `STRIPE_WEBHOOK_SECRET` | signing secret of the endpoint above |
| `STRIPE_PORTAL_CONFIGURATION_ID` | optional portal configuration id |
| `STRIPE_PRICE_CREW` | price id of WageLens Crew |
| `STRIPE_PRICE_SHOP` | price id of WageLens Shop |

## 5. Before charging a real card

- Vercel **Pro** plan: the Hobby plan forbids commercial use (PLAN.md D3, risk list).
- Business details, statement descriptor and support email set on the Stripe account.
- One live-mode purchase by the founder, refunded, with the receipt checked.
