/**
 * Starting a subscription: hosted Checkout only.
 *
 * The redirect back from Stripe grants NOTHING — `startCheckout` writes no
 * entitlement, and the success page reads the mirror like every other page.
 * What unlocks the product is the webhook (./webhook.ts). This is the same
 * ordering Clausewright's ADR-007 fixed the hard way, and it is why a customer
 * who closes the tab mid-redirect still gets what they paid for.
 */

import { eq } from 'drizzle-orm';

import type { Adapters } from '../adapters';
import type { Db } from '../db';
import { customers, organisations, type Organisation } from '../db/schema';
import { PLATFORM_EVENTS, track } from '../events/track';
import { findPlan, priceIdFor, type PlanMap } from './plans';

export type CheckoutContext = {
  db: Db;
  adapters: Adapters;
  plans: PlanMap;
  env: Record<string, unknown> & { APP_BASE_URL: string };
};

export type StartCheckoutInput = {
  orgId: string;
  planKey: string;
  userId?: string;
  email?: string;
  quantity?: number;
  successPath?: string;
  cancelPath?: string;
};

export type StartCheckoutResult =
  | { status: 'ok'; url: string; sessionId: string }
  | { status: 'unknown_plan'; planKey: string }
  | { status: 'price_not_configured'; planKey: string; envVar: string };

/** Create (once) and remember the Stripe customer for an organisation. */
export async function ensureStripeCustomer(
  ctx: Pick<CheckoutContext, 'db' | 'adapters'>,
  input: { orgId: string; email?: string; name?: string },
): Promise<string> {
  const [existing] = await ctx.db
    .select()
    .from(customers)
    .where(eq(customers.orgId, input.orgId))
    .limit(1);
  if (existing) return existing.stripeCustomerId;

  const created = await ctx.adapters.billing.ensureCustomer({
    orgId: input.orgId,
    ...(input.email ? { email: input.email } : {}),
    ...(input.name ? { name: input.name } : {}),
  });

  await ctx.db
    .insert(customers)
    .values({
      orgId: input.orgId,
      stripeCustomerId: created.id,
      email: input.email ?? null,
    })
    // Two tabs, one org: the second insert loses and reuses the first's id.
    .onConflictDoNothing({ target: customers.orgId });

  const [row] = await ctx.db
    .select()
    .from(customers)
    .where(eq(customers.orgId, input.orgId))
    .limit(1);
  return row?.stripeCustomerId ?? created.id;
}

export async function startCheckout(
  ctx: CheckoutContext,
  input: StartCheckoutInput,
): Promise<StartCheckoutResult> {
  const plan = findPlan(ctx.plans, input.planKey);
  if (!plan) return { status: 'unknown_plan', planKey: input.planKey };

  const priceId = priceIdFor(plan, ctx.env);
  if (!priceId) {
    // The founder has not created this price yet. Say so plainly instead of
    // sending the customer to a Stripe error page.
    return { status: 'price_not_configured', planKey: plan.key, envVar: plan.priceEnvVar };
  }

  const [org] = await ctx.db
    .select()
    .from(organisations)
    .where(eq(organisations.id, input.orgId))
    .limit(1);

  const customerId = await ensureStripeCustomer(ctx, {
    orgId: input.orgId,
    ...(input.email ? { email: input.email } : {}),
    ...(org ? { name: (org as Organisation).name } : {}),
  });

  const base = ctx.env.APP_BASE_URL;
  const session = await ctx.adapters.billing.createCheckoutSession({
    orgId: input.orgId,
    planKey: plan.key,
    priceId,
    quantity: input.quantity ?? 1,
    customerId,
    ...(input.email ? { customerEmail: input.email } : {}),
    ...(plan.trialDays ? { trialDays: plan.trialDays } : {}),
    successUrl: `${base}${input.successPath ?? '/settings/billing?checkout=success'}`,
    cancelUrl: `${base}${input.cancelPath ?? '/pricing?checkout=cancelled'}`,
    metadata: { org_id: input.orgId, plan_key: plan.key },
  });

  await track(ctx.db, {
    name: PLATFORM_EVENTS.checkoutStarted,
    orgId: input.orgId,
    userId: input.userId ?? null,
    props: { plan_key: plan.key, session_id: session.id },
  });

  return { status: 'ok', url: session.url, sessionId: session.id };
}
