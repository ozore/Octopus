/**
 * Generates `apps/certly/STRIPE_SETUP.md` from this app's plan map:
 *
 *   npm run stripe:setup --workspace apps/certly > STRIPE_SETUP.md
 *
 * The founder creates the products by hand (PLAN.md D2); this removes every
 * judgement call from that job and cannot drift from the code, because it IS
 * the code.
 *
 * TWO THINGS THE PLATFORM GENERATOR CANNOT KNOW, so they are added here:
 *
 *  1. **Price metadata.** `OFFER.md` §12.1/12.2 puts `vendor_limit`, `seats`
 *     and `vendor_increment` on every price, so a capacity change is a Stripe
 *     metadata edit rather than a deploy. The platform's plan map has `limits`
 *     but no notion of what Stripe should be told.
 *  2. **The Vendor Pack.** It is an add-on with an adjustable quantity, not a
 *     tier, so it is not a row in the plan map — Certly mirrors it into
 *     `billing_addons` (see `schema.ts`).
 *
 * The generated §1 lists one row per PRICE (six of them); rows 1–3 and 4–6 are
 * the same three PRODUCTS at two intervals. The Certly section says so.
 *
 * The output contains NO secret and no price id — only names.
 */
import { renderStripeSetup } from '@octopus/platform/billing';

import {
  TIER_LIST,
  TIER_SPECS,
  TRIAL_DAYS,
  VENDOR_PACK,
  TAIL_RATE_CENTS_PER_VENDOR_MONTH,
  TAIL_THRESHOLD_VENDORS,
  plans,
  planKeyFor,
} from '../lib/plans';
import { TRIAL_DISCLOSURE } from '../lib/plans';

const project = process.env['VERCEL_PROJECT'] ?? `octopus-${process.env['APP_SLUG'] ?? 'certly'}`;
const baseUrl = process.env['APP_BASE_URL'] ?? `https://${project}.vercel.app`;

const money = (cents: number): string => `$${(cents / 100).toLocaleString('en-US')}`;

const productRows = TIER_LIST.map(
  (spec) =>
    `| \`{PRODUCT_NAME} ${spec.name}\` | \`CERTLY\` | ${spec.tagline} | \`app=certly, tier=${spec.tier}, vendor_limit=${spec.vendorLimit}, seats=${spec.seats}\` |`,
).join('\n');

const priceRows = TIER_LIST.flatMap((spec) =>
  (['month', 'year'] as const).map((interval) => {
    const key = planKeyFor(spec.tier, interval);
    const plan = plans.plans.find((p) => p.key === key);
    const amount = interval === 'year' ? spec.annualCents : spec.monthlyCents;
    return `| {PRODUCT_NAME} ${spec.name} | \`${spec.tier}-${interval === 'year' ? 'annual' : 'monthly'}\` | **${money(amount)}** | usd | ${interval} | **${TRIAL_DAYS}** | \`app=certly, tier=${spec.tier}, vendor_limit=${spec.vendorLimit}, seats=${spec.seats}\` | \`${plan?.priceEnvVar ?? ''}\` |`;
  }),
).join('\n');

const certlySection = `## 0. Certly specifics — read this before creating anything

**Settle the product name first.** Every customer-visible product name below
carries \`{PRODUCT_NAME}\`, which is **pending** (\`IDENTITY.md\` §2.3 recommends
*Coverfile*; REVIEW.md MJ-13). Renaming before these objects exist is a
find-and-replace; renaming after invoices exist is not. The slug \`app=certly\`
and the statement descriptor \`CERTLY\` stay either way — the slug is internal
and the descriptor is capped at 22 characters and set once.

**Four products, eight prices.** §1 below is generated from the plan map and
lists one row per PRICE, so each of the three tiers appears twice (monthly and
annual). In Stripe they are **three products with two prices each**, plus the
Vendor Pack:

| Product name | Statement descriptor | Description | Metadata |
|---|---|---|---|
${productRows}
| \`{PRODUCT_NAME} ${VENDOR_PACK.name}\` | \`CERTLY\` | +${VENDOR_PACK.increment} tracked vendors, stackable add-on | \`app=certly, tier=addon, vendor_increment=${VENDOR_PACK.increment}\` |

### 0.1 Prices, with the metadata each one carries

\`vendor_limit\` and \`seats\` are **read from the price metadata**, so changing a
plan's capacity is a Stripe edit plus a webhook replay rather than a deploy
(\`specs/10\` §7). The app also carries the same numbers in \`src/lib/plans.ts\`
so \`/pricing\` renders without a Stripe call; **if you change one, change both**.

| Product | Nickname | Price | Currency | Interval | Trial days | Metadata | Env var |
|---|---|---|---|---|---|---|---|
${priceRows}
| {PRODUCT_NAME} ${VENDOR_PACK.name} | \`pack50-monthly\` | **${money(VENDOR_PACK.monthlyCents)}** | usd | month | 0 | \`app=certly, tier=addon, vendor_increment=${VENDOR_PACK.increment}\` | \`${VENDOR_PACK.monthlyPriceEnvVar}\` |
| {PRODUCT_NAME} ${VENDOR_PACK.name} | \`pack50-annual\` | **${money(VENDOR_PACK.annualCents)}** | usd | year | 0 | \`app=certly, tier=addon, vendor_increment=${VENDOR_PACK.increment}, discount=17pct\` | \`${VENDOR_PACK.annualPriceEnvVar}\` |

Annual is ten months for twelve (17% off). The Vendor Pack's billing scheme is
**licensed with an adjustable quantity, 1–10**.

### 0.2 The trial is a negative-option subscription, so the disclosure is configuration

Every subscription price carries \`trial_period_days = ${TRIAL_DAYS}\` and the card is
charged automatically on day ${TRIAL_DAYS} unless the customer cancels. Put this sentence
— **verbatim, with the real date substituted by Checkout** — in each
subscription price's **line-item description**, because the app already renders
it next to every button that collects a card (\`specs/10\` §3.1, REVIEW.md B-06):

> ${TRIAL_DISCLOSURE('{date}')}

**No product, price or button here is ever labelled as starting free**, which is
why the banned wording is not spelled out even in this note: the vocabulary test
fails the build on it anywhere in the app. The only free thing Certly offers is
the Free Gap Report, which has no Stripe object at all.

### 0.3 Settings that go with them

| Setting | Value | Why |
|---|---|---|
| Checkout mode | \`subscription\`, card required, \`trial_period_days=${TRIAL_DAYS}\` on the six tier prices | Card-required trials convert about 5× better, and the disclosure above makes that lawful as well as effective |
| Billing Portal | On: cancel, switch plan, update card, **adjust Vendor Pack quantity**, download invoices | "Cancel any time" must be true in one click, not an email |
| Proration | On, for tier switches and pack quantity | Upgrades must be frictionless; the meter is the growth path |
| Tax | Stripe Tax on, US only at launch | |
| Trial-end reminders | \`customer.subscription.trial_will_end\` → our T−3 and T−1 emails | "No charge without a warning" is a promise the product keeps |
| Refunds | Manual, 30-day, no questions | The guarantee is executed by hand; there is deliberately no automated refund path |
| Free Gap Report | **No Stripe object at all** | It is not a plan: no card, no account, nothing to cancel |
| Above ~${TAIL_THRESHOLD_VENDORS} tracked vendors | Published rate $${(TAIL_RATE_CENTS_PER_VENDOR_MONTH / 100).toFixed(2)} per tracked vendor per month, invoiced | Keeps the "never a demo" promise without building metered billing at launch |

**Not created at launch, deliberately:** any Solo/$49 price, any usage-metered
price, any coupon. Coupons before the first hundred customers destroy the price
anchor and teach the market to wait.

### 0.4 What the app does with each webhook

| Event | What Certly does |
|---|---|
| \`checkout.session.completed\` | mirrors the subscription, writes the **consent row** with the exact disclosure string that was rendered, and emits \`checkout_completed\` — *a card on file, not money* |
| \`customer.subscription.created/updated/deleted\` | re-mirrors; a **Vendor Pack** price is routed to \`billing_addons\` instead, because the mirror holds one row per organisation |
| \`customer.subscription.trial_will_end\` | sends the T−3 warning and schedules T−1, each carrying the org's own vendor and gap counts |
| \`invoice.paid\` | emits \`trial_converted\` on the **first** one — this is the number \`THRESHOLDS.md\` §3 measures |
| \`invoice.payment_failed\` | \`past_due\`: fully writable for a 7-day grace with a dunning email, read-only after it |

`;

const base = renderStripeSetup(plans, { vercelProject: project, appBaseUrl: baseUrl });

// The Certly section goes ABOVE the generated product list, because §0.0's
// first line ("settle the product name") is a decision that cannot be undone
// cheaply once the objects exist.
const doc = base.replace('## 1. Products and prices', `${certlySection}## 1. Products and prices (generated, one row per price)`);

process.stdout.write(
  doc.replace(
    '| `STRIPE_PORTAL_CONFIGURATION_ID` | optional portal configuration id |',
    `| \`STRIPE_PORTAL_CONFIGURATION_ID\` | optional portal configuration id |\n| \`${VENDOR_PACK.monthlyPriceEnvVar}\` | price id of the monthly ${VENDOR_PACK.name} |\n| \`${VENDOR_PACK.annualPriceEnvVar}\` | price id of the annual ${VENDOR_PACK.name} |`,
  ),
);
