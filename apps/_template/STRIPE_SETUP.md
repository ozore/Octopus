# Stripe setup — App Template

Generated from the app's plan map. Nothing in this file is a secret: it is the
list of things to create and the names of the variables their ids go into.

**Order matters.** Do all of it in **test mode** first, run one end-to-end
purchase, then repeat in live mode. One Stripe account serves all three apps
(PLAN.md D2), so prefix every product name with the app name.

## 1. Products and prices

### 1. App Template — Starter

| field | value |
|---|---|
| Product name | `App Template Starter` |
| Description | One crew, everything that matters |
| Price | $49 / month |
| Billing | Recurring, monthly |
| Currency | USD |
| Free trial | 14 days (set by the app at Checkout, NOT on the price) |
| Copy the price id into | `STRIPE_PRICE_STARTER` |

### 2. App Template — Pro

| field | value |
|---|---|
| Product name | `App Template Pro` |
| Description | Several crews and the paperwork to match |
| Price | $149 / month |
| Billing | Recurring, monthly |
| Currency | USD |
| Free trial | 14 days (set by the app at Checkout, NOT on the price) |
| Copy the price id into | `STRIPE_PRICE_PRO` |

## 2. Customer Portal

Settings → Billing → Customer portal:

- Allow customers to **update payment methods**: on
- Allow customers to **cancel subscriptions**: on, *at end of billing period*
- Allow customers to **switch plans**: on, listing the products above
- Invoice history: on
- Business information: link to `https://octopus-template.vercel.app/legal/terms` and `https://octopus-template.vercel.app/legal/privacy`

If you save a specific configuration id, put it in `STRIPE_PORTAL_CONFIGURATION_ID`.

## 3. Webhook endpoint

Developers → Webhooks → Add endpoint:

- URL: `https://octopus-template.vercel.app/api/stripe/webhook`
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

## 4. Environment variables (Vercel project `octopus-template`)

| variable | value |
|---|---|
| `STRIPE_SECRET_KEY` | secret key (test first, then live) |
| `STRIPE_WEBHOOK_SECRET` | signing secret of the endpoint above |
| `STRIPE_PORTAL_CONFIGURATION_ID` | optional portal configuration id |
| `STRIPE_PRICE_STARTER` | price id of App Template Starter |
| `STRIPE_PRICE_PRO` | price id of App Template Pro |

## 5. Before charging a real card

- Vercel **Pro** plan: the Hobby plan forbids commercial use (PLAN.md D3, risk list).
- Business details, statement descriptor and support email set on the Stripe account.
- One live-mode purchase by the founder, refunded, with the receipt checked.
