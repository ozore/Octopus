/**
 * The founder's Stripe product list — OFFER.md §10, as data.
 *
 * `STRIPE_SETUP.md` is generated from the platform's `renderStripeSetup()` plus
 * this table (`npm run stripe:setup`). The platform's generator renders what it
 * knows — the plans this deployment can actually sell, their env variables, the
 * Portal settings and the webhook events. It does not know about **lookup keys,
 * price metadata, annual prices the plan map does not yet carry, or a tier that
 * is published and not for sale**, all four of which the founder has to create
 * by hand, so those live here and are appended to its output.
 *
 * Two things this table exists to make impossible:
 *
 *  1. **Creating the GC prices in live mode.** Both GC rows are marked TEST
 *     MODE ONLY, and `assertGcNotLive()` refuses to boot a live deployment that
 *     carries one (V18). The document and the code say the same thing.
 *  2. **Metadata that flags a feature nothing implements.** Finding M2 removed
 *     `history_import=true` from the annual rows for exactly that reason: a
 *     metadata flag with no code behind it is a customer being billed for
 *     something that does not exist. Every key below maps to a limit this
 *     product enforces or to a fact about the tier.
 *
 * Nothing here is a secret. It is a list of things to create and the NAMES of
 * the variables their ids go into.
 */

export type StripeCatalogueRow = {
  productName: string;
  priceNickname: string;
  amountCents: number;
  currency: string;
  interval: 'month' | 'year';
  trialDays: number;
  lookupKey: string;
  metadata: Record<string, string>;
  envVar: string;
  liveAtLaunch: boolean;
  note?: string;
};

const CREW_METADATA = {
  app: 'wagelens',
  tier: 'crew',
  projects_max: '3',
  workers_max: '15',
  sub_seats: '0',
  alerts: 'unlimited',
  audit_binder: 'false',
  prime_link: 'false',
};

const SHOP_METADATA = {
  app: 'wagelens',
  tier: 'shop',
  projects_max: 'unlimited',
  workers_max: '100',
  sub_seats: '0',
  alerts: 'unlimited',
  audit_binder: 'true',
  prime_link: 'true',
  recommended: 'true',
};

const GC_METADATA = {
  app: 'wagelens',
  tier: 'gc',
  projects_max: 'unlimited',
  workers_max: 'unlimited',
  sub_seats: 'unlimited',
  alerts: 'unlimited',
  audit_binder: 'true',
  prime_link: 'true',
  sub_rollup: 'true',
};

/** `{app}` is substituted with `APP_NAME` at render time (WL-11 V8, M12). */
export const STRIPE_CATALOGUE: StripeCatalogueRow[] = [
  {
    productName: '{app} Crew',
    priceNickname: 'Crew Monthly',
    amountCents: 7900,
    currency: 'usd',
    interval: 'month',
    trialDays: 14,
    lookupKey: 'wagelens_crew_monthly',
    metadata: CREW_METADATA,
    envVar: 'STRIPE_PRICE_CREW',
    liveAtLaunch: true,
  },
  {
    productName: '{app} Crew',
    priceNickname: 'Crew Annual',
    amountCents: 79000,
    currency: 'usd',
    interval: 'year',
    trialDays: 14,
    lookupKey: 'wagelens_crew_annual',
    metadata: CREW_METADATA,
    envVar: 'STRIPE_PRICE_CREW_ANNUAL',
    liveAtLaunch: true,
    note: 'Annual = 10× monthly (two months free). Add the plan to `src/lib/plans.ts` in the same change that sets this variable.',
  },
  {
    productName: '{app} Shop',
    priceNickname: 'Shop Monthly',
    amountCents: 9900,
    currency: 'usd',
    interval: 'month',
    trialDays: 14,
    lookupKey: 'wagelens_shop_monthly',
    metadata: SHOP_METADATA,
    envVar: 'STRIPE_PRICE_SHOP',
    liveAtLaunch: true,
  },
  {
    productName: '{app} Shop',
    priceNickname: 'Shop Annual',
    amountCents: 99000,
    currency: 'usd',
    interval: 'year',
    trialDays: 14,
    lookupKey: 'wagelens_shop_annual',
    metadata: SHOP_METADATA,
    envVar: 'STRIPE_PRICE_SHOP_ANNUAL',
    liveAtLaunch: true,
    note: 'Annual = 10× monthly (two months free). Add the plan to `src/lib/plans.ts` in the same change that sets this variable.',
  },
  {
    productName: '{app} GC Roll-up',
    priceNickname: 'GC Monthly',
    amountCents: 29900,
    currency: 'usd',
    interval: 'month',
    trialDays: 14,
    lookupKey: 'wagelens_gc_monthly',
    metadata: GC_METADATA,
    envVar: 'WAGELENS_PRICE_GC_MONTHLY',
    liveAtLaunch: false,
    note: 'TEST MODE ONLY until WL-24 ships. Leave the live-mode variable UNSET: the app refuses to boot in live mode if it is set.',
  },
  {
    productName: '{app} GC Roll-up',
    priceNickname: 'GC Annual',
    amountCents: 299000,
    currency: 'usd',
    interval: 'year',
    trialDays: 14,
    lookupKey: 'wagelens_gc_annual',
    metadata: GC_METADATA,
    envVar: 'WAGELENS_PRICE_GC_ANNUAL',
    liveAtLaunch: false,
    note: 'TEST MODE ONLY until WL-24 ships. Leave the live-mode variable UNSET: the app refuses to boot in live mode if it is set.',
  },
];

function money(amountCents: number, currency: string): string {
  const symbol = currency.toLowerCase() === 'usd' ? '$' : `${currency.toUpperCase()} `;
  return `${symbol}${(amountCents / 100).toFixed(2)}`;
}

function metadataString(metadata: Record<string, string>): string {
  return Object.entries(metadata)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

/**
 * The section appended to the platform generator's output: every product and
 * price the founder must create, with its interval, trial days, lookup key,
 * metadata and env variable — and which two are test mode only.
 */
export function renderCatalogue(appName: string): string {
  const row = (r: StripeCatalogueRow) =>
    `| ${r.productName.replace('{app}', appName)} | ${r.priceNickname} | ${money(r.amountCents, r.currency)} | ${r.currency.toUpperCase()} | ${r.interval} | ${r.trialDays} | \`${r.lookupKey}\` | \`${metadataString(r.metadata)}\` | \`${r.envVar}\` | ${r.liveAtLaunch ? '**yes**' : '**NO — TEST MODE ONLY**'} |`;

  const notes = STRIPE_CATALOGUE.filter((r) => r.note)
    .map((r) => `- **${r.priceNickname}** — ${r.note}`)
    .join('\n');

  return `## 6. The full product and price list (OFFER.md §10)

Six prices, **four of them live at launch**. Create all six in **test mode**
first so the ladder can be exercised end to end; create only the four Crew and
Shop prices in **live mode**.

| Product name | Price nickname | Amount | Currency | Interval | Trial days | Lookup key | Metadata | Env var for the price id | live at launch? |
|---|---|---:|---|---|---:|---|---|---|---|
${STRIPE_CATALOGUE.map(row).join('\n')}

${notes}

**Set the lookup key on the price** (Stripe calls it \`lookup_key\`). It is what
survives a price change: a new price with the same lookup key is a price rise
for new signups and leaves existing subscriptions where they are.

**Set the metadata on the PRICE, not on the product.** Tier limits are read from
price metadata and mirrored onto the subscription; a limit hard-coded in
application logic would drift from what the customer bought (WL-09 V11).

**\`trial_period_days\` is set by the app at Checkout, not on the price.** Both
would double it.

## 7. The GC Roll-up tier is published and NOT sellable

The $299 tier is on the pricing ladder as **"Coming"**, with a waitlist and no
purchase control, until \`WL-24\` ships (finding B2). Three things enforce it and
each is tested:

1. there is no \`gc\` plan key and no \`STRIPE_PRICE_GC*\` variable in the plan map,
   so Checkout has nothing to sell;
2. \`wagelens_gc_monthly\` and \`wagelens_gc_annual\` are absent from the sellable
   set, and Checkout refuses them with \`tier_not_sellable\`;
3. **a live-mode GC price id fails the boot assertion** — the app will not start.

Do not offer the GC prices in the Customer Portal's plan switcher either. The
Portal should list the four Crew and Shop prices only.

## 8. Trial, disclosure and cancellation — the settings that are part of the offer

| Setting | Value |
|---|---|
| Card at Checkout during the trial | **Required** |
| \`trial_period_days\` | **14**, set by the app at Checkout |
| Stripe's own trial-ending email | **On** — it is the courtesy; ours on day 10 is the notice |
| Customer Portal → cancel | **Enabled, immediate, no retention flow** |
| Customer Portal → switch plan | **Enabled between the four sellable prices**, proration on |
| Customer Portal → update payment method | **On** |
| Stripe Tax | **On** (US only at launch) |
| Trial terms disclosure + recorded consent | **Required before Checkout** — the app refuses to create a session without the acceptance row |
| Pre-charge reminder | **Day 10, ours**, naming the amount, the date and the cancel link |
| Annual renewal notice | **≥ 7 days before every renewal**, amount + date + cancel link |
| CTA label on every paid plan | **\`Start 14-day trial\`** |
| Free tier | **No Stripe object** — the public rate lookup is free and takes no card |
`;
}
