/**
 * The plan map: the single place where "what the customer bought" is defined.
 *
 * PRICES ARE NOT IN THE CODE. Each plan names the ENV VARIABLE that holds its
 * Stripe price id (`STRIPE_PRICE_PRO_MONTHLY`), because the founder creates the
 * products in one Stripe account (PLAN.md D2) and the ids differ between test
 * and live mode. The amount in cents IS here, but only so that `/pricing` and
 * the MRR metric can render without a Stripe call — Stripe remains the
 * authority on what was actually charged.
 *
 * `limits` is deliberately untyped-ish (`PlanLimits`): WageLens counts wage
 * determinations, Certly counts certificates, StateReady counts states. The
 * platform only has to compare and expose them.
 */

export type PlanLimitValue = number | boolean | string;
export type PlanLimits = Record<string, PlanLimitValue>;

export type PlanDefinition = {
  /** Stable key: used in metadata, entitlements and URLs. Never renamed. */
  key: string;
  name: string;
  tagline?: string;
  /** The env var that holds this plan's Stripe price id. */
  priceEnvVar: string;
  amountCents: number;
  currency: string;
  interval: 'month' | 'year';
  trialDays?: number;
  features?: string[];
  limits: PlanLimits;
  popular?: boolean;
};

export type PlanMap = {
  appName: string;
  /** What an organisation without a subscription may do. */
  freeLimits: PlanLimits;
  plans: PlanDefinition[];
};

export function definePlans(map: PlanMap): PlanMap {
  const seen = new Set<string>();
  for (const plan of map.plans) {
    if (seen.has(plan.key)) throw new Error(`definePlans: duplicate plan key ${plan.key}`);
    seen.add(plan.key);
    if (!plan.priceEnvVar.startsWith('STRIPE_PRICE_')) {
      throw new Error(
        `definePlans: ${plan.key}.priceEnvVar must be named STRIPE_PRICE_* (got ${plan.priceEnvVar})`,
      );
    }
  }
  return map;
}

export type EnvSource = Record<string, unknown>;

export function findPlan(map: PlanMap, key: string): PlanDefinition | undefined {
  return map.plans.find((p) => p.key === key);
}

/** The configured price id for a plan, or undefined when the founder has not
 *  created it yet — the caller renders "coming soon" rather than crashing. */
export function priceIdFor(plan: PlanDefinition, env: EnvSource): string | undefined {
  const value = env[plan.priceEnvVar];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** The reverse direction, which is the one the webhook needs: a mirrored
 *  subscription carries a price id and must resolve to a plan. */
export function planForPriceId(
  map: PlanMap,
  priceId: string,
  env: EnvSource,
): PlanDefinition | undefined {
  return map.plans.find((plan) => priceIdFor(plan, env) === priceId);
}

/** Normalised to a month so MRR is one sum over mixed intervals. */
export function monthlyAmountCents(plan: PlanDefinition): number {
  return plan.interval === 'year' ? Math.round(plan.amountCents / 12) : plan.amountCents;
}

export function formatAmount(amountCents: number, currency = 'usd'): string {
  const value = amountCents / 100;
  const symbol = currency.toLowerCase() === 'usd' ? '$' : `${currency.toUpperCase()} `;
  return `${symbol}${value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)}`;
}

