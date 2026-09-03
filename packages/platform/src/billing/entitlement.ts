/**
 * What this organisation is allowed to do, answered from OUR database.
 *
 * No page, action or job may ask Stripe at render time: the webhook mirrors
 * every change into `subscriptions` (billing/webhook.ts) and this function
 * reads the mirror. That is what keeps a Stripe outage from logging every
 * customer out of the paid product, and what keeps the paywall check cheap
 * enough to run on every request.
 *
 * `past_due` KEEPS ACCESS. Stripe retries a failed payment for days; cutting a
 * paying customer off on the first failure — while the dunning emails are still
 * going out — loses more revenue than it protects.
 */

import { desc, eq } from 'drizzle-orm';

import type { Db } from '../db';
import { customers, subscriptions, type Subscription, type SubscriptionStatus } from '../db/schema';
import type { PlanDefinition, PlanLimits, PlanLimitValue, PlanMap } from './plans';
import { planForPriceId } from './plans';

export type Entitlement = {
  orgId: string;
  /** `'free'` when there is no live subscription. */
  planKey: string;
  planName: string;
  status: SubscriptionStatus | 'none';
  /** Whether the paid product should be served. */
  active: boolean;
  /** Live but failing payment: serve the product, show the banner. */
  inGrace: boolean;
  trialing: boolean;
  limits: PlanLimits;
  quantity: number;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd?: Date | undefined;
  trialEndsAt?: Date | undefined;
  subscriptionId?: string | undefined;
  stripeCustomerId?: string | undefined;
};

const LIVE_STATUSES: SubscriptionStatus[] = ['trialing', 'active', 'past_due', 'paused'];
const ACCESS_STATUSES: SubscriptionStatus[] = ['trialing', 'active', 'past_due'];

export function freeEntitlement(orgId: string, map: PlanMap): Entitlement {
  return {
    orgId,
    planKey: 'free',
    planName: 'Free',
    status: 'none',
    active: false,
    inGrace: false,
    trialing: false,
    limits: map.freeLimits,
    quantity: 0,
    cancelAtPeriodEnd: false,
  };
}

export type EntitlementOptions = {
  plans: PlanMap;
  env: Record<string, unknown>;
};

export async function getEntitlement(
  db: Db,
  orgId: string,
  options: EntitlementOptions,
): Promise<Entitlement> {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.orgId, orgId))
    .orderBy(desc(subscriptions.createdAt));

  const live = rows.find((row) => LIVE_STATUSES.includes(row.status));
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.orgId, orgId))
    .limit(1);

  if (!live) {
    const base = freeEntitlement(orgId, options.plans);
    const last = rows[0];
    return {
      ...base,
      ...(last ? { status: last.status, subscriptionId: last.id } : {}),
      ...(customer ? { stripeCustomerId: customer.stripeCustomerId } : {}),
    };
  }

  const plan: PlanDefinition | undefined = planForPriceId(options.plans, live.priceId, options.env);

  return {
    orgId,
    planKey: plan?.key ?? 'unknown',
    planName: plan?.name ?? 'Subscription',
    status: live.status,
    active: ACCESS_STATUSES.includes(live.status),
    inGrace: live.status === 'past_due',
    trialing: live.status === 'trialing',
    // An unrecognised price id (a plan the founder created but the code does not
    // know) grants the free limits, never unlimited: fail closed on money.
    limits: plan?.limits ?? options.plans.freeLimits,
    quantity: live.quantity,
    cancelAtPeriodEnd: live.cancelAtPeriodEnd,
    currentPeriodEnd: live.currentPeriodEnd ?? undefined,
    trialEndsAt: live.trialEndsAt ?? undefined,
    subscriptionId: live.id,
    stripeCustomerId: live.stripeCustomerId,
  };
}

export function limitOf(
  entitlement: Entitlement,
  key: string,
  fallback: PlanLimitValue = 0,
): PlanLimitValue {
  return entitlement.limits[key] ?? fallback;
}

/** `-1` (or `Infinity`) means unlimited, by convention, so a plan map can
 *  express "no cap" without a special type. */
export function withinLimit(entitlement: Entitlement, key: string, used: number): boolean {
  const limit = limitOf(entitlement, key, 0);
  if (typeof limit !== 'number') return Boolean(limit);
  if (limit < 0) return true;
  return used < limit;
}

export type { Subscription };
