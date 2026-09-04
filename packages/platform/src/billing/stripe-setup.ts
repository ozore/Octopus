/**
 * STRIPE_SETUP.md generator.
 *
 * The founder creates the products and prices by hand in one Stripe account
 * (PLAN.md D2) — no agent touches a Stripe dashboard. What an agent CAN do is
 * remove every judgement call from that job: this renders the plan map into the
 * exact list of products, prices and env variables, in the order they must be
 * created, with the test-mode-first sequence and the webhook events the app
 * subscribes to.
 *
 * The output contains NO secret and no price id — only names.
 */

import { formatAmount, type PlanMap } from './plans';

export type StripeSetupOptions = {
  /** Vercel project name, so the founder pastes ids into the right place. */
  vercelProject: string;
  /** e.g. https://octopus-wagelens.vercel.app */
  appBaseUrl: string;
  /** Events the webhook handler acts on (billing/webhook.ts). */
  webhookEvents?: string[];
};

export const DEFAULT_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
  'invoice.paid',
];

export function renderStripeSetup(map: PlanMap, options: StripeSetupOptions): string {
  const events = options.webhookEvents ?? DEFAULT_WEBHOOK_EVENTS;

  const productRows = map.plans
    .map(
      (plan, i) =>
        `### ${i + 1}. ${map.appName} — ${plan.name}\n\n` +
        `| field | value |\n|---|---|\n` +
        `| Product name | \`${map.appName} ${plan.name}\` |\n` +
        `| Description | ${plan.tagline ?? plan.name} |\n` +
        `| Price | ${formatAmount(plan.amountCents, plan.currency)} / ${plan.interval} |\n` +
        `| Billing | Recurring, ${plan.interval}ly |\n` +
        `| Currency | ${plan.currency.toUpperCase()} |\n` +
        `| Free trial | ${plan.trialDays ? `${plan.trialDays} days (set by the app at Checkout, NOT on the price)` : 'none'} |\n` +
        `| Copy the price id into | \`${plan.priceEnvVar}\` |\n`,
    )
    .join('\n');

  const envRows = map.plans
    .map((plan) => `| \`${plan.priceEnvVar}\` | price id of ${map.appName} ${plan.name} |`)
    .join('\n');

  return `# Stripe setup — ${map.appName}

Generated from the app's plan map. Nothing in this file is a secret: it is the
list of things to create and the names of the variables their ids go into.

**Order matters.** Do all of it in **test mode** first, run one end-to-end
purchase, then repeat in live mode. One Stripe account serves all three apps
(PLAN.md D2), so prefix every product name with the app name.

## 1. Products and prices

${productRows}
## 2. Customer Portal

Settings → Billing → Customer portal:

- Allow customers to **update payment methods**: on
- Allow customers to **cancel subscriptions**: on, *at end of billing period*
- Allow customers to **switch plans**: on, listing the products above
- Invoice history: on
- Business information: link to \`${options.appBaseUrl}/legal/terms\` and \`${options.appBaseUrl}/legal/privacy\`

If you save a specific configuration id, put it in \`STRIPE_PORTAL_CONFIGURATION_ID\`.

## 3. Webhook endpoint

Developers → Webhooks → Add endpoint:

- URL: \`${options.appBaseUrl}/api/stripe/webhook\`
- Events:
${events.map((e) => `  - \`${e}\``).join('\n')}
- Copy the signing secret into \`STRIPE_WEBHOOK_SECRET\`.

The webhook is the source of truth for entitlement: the redirect back from
Checkout grants nothing on its own, and every event is de-duplicated on
\`stripe_events.id\`.

## 4. Environment variables (Vercel project \`${options.vercelProject}\`)

| variable | value |
|---|---|
| \`STRIPE_SECRET_KEY\` | secret key (test first, then live) |
| \`STRIPE_WEBHOOK_SECRET\` | signing secret of the endpoint above |
| \`STRIPE_PORTAL_CONFIGURATION_ID\` | optional portal configuration id |
${envRows}

## 5. Before charging a real card

- Vercel **Pro** plan: the Hobby plan forbids commercial use (PLAN.md D3, risk list).
- Business details, statement descriptor and support email set on the Stripe account.
- One live-mode purchase by the founder, refunded, with the receipt checked.
`;
}
