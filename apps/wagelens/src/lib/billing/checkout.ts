/**
 * WL-09 · Starting a trial, with the consent record in the money path.
 *
 * The platform owns hosted Checkout; this module owns the three refusals the
 * spec makes properties of the code rather than of the UI:
 *
 *  - **V15 — no acceptance row, no Checkout session.** The unticked checkbox
 *    writes `subscription_terms_acceptances` carrying the content hash of the
 *    block AS RENDERED, the amount and the calendar date we disclosed, and a
 *    hashed IP. `startTrialCheckout` looks that row up by
 *    `(org, termsVersion, lookupKey)` and refuses without it. A UI-only check
 *    is a check somebody removes while restyling a page.
 *  - **V17 — a lookup key outside the sellable set is `tier_not_sellable`.**
 *  - **V10 — one subscription per organisation.** A second Checkout is refused
 *    and the Portal is offered, because two subscriptions on one org is a
 *    double charge and a support conversation.
 *
 * The redirect back from Stripe still grants nothing: the webhook is the only
 * writer of entitlement (platform `billing/webhook.ts`, Clausewright ADR-007).
 */

import { and, eq } from 'drizzle-orm';

import { newId } from '@octopus/platform';
import type { Adapters } from '@octopus/platform/adapters';
import type { Db } from '@octopus/platform/db';
import { subscriptions } from '@octopus/platform/db';
import { priceIdFor, startCheckout, type PlanMap } from '@octopus/platform/billing';

import { subscriptionTermsAcceptances, waitlistSignups } from '../schema';
import { planForLookupKey, isSellable } from './sellable';
import type { TrialTerms } from './terms';

export type CheckoutContext = {
  db: Db;
  adapters: Adapters;
  plans: PlanMap;
  env: Record<string, unknown> & { APP_BASE_URL: string };
};

export type StartTrialResult =
  | { status: 'ok'; url: string; sessionId: string }
  | { status: 'tier_not_sellable'; lookupKey: string }
  | { status: 'terms_not_accepted'; lookupKey: string }
  | { status: 'price_not_configured'; lookupKey: string; envVar?: string }
  | { status: 'unknown_plan'; lookupKey: string }
  | { status: 'already_subscribed' };

/**
 * The checkbox's write. Called BEFORE Checkout, never after — the row is the
 * evidence that the disclosure was on screen when the card was asked for.
 */
export async function recordTermsAcceptance(
  db: Db,
  input: { orgId: string; userId: string; terms: TrialTerms; acceptedIpHash: string },
): Promise<void> {
  await db
    .insert(subscriptionTermsAcceptances)
    .values({
      id: newId('trm'),
      orgId: input.orgId,
      userId: input.userId,
      termsVersion: input.terms.version,
      priceLookupKey: input.terms.lookupKey,
      disclosedAmountCents: input.terms.amountCents,
      disclosedChargeDate: input.terms.chargeDateIso,
      disclosedInterval: input.terms.interval,
      acceptedIpHash: input.acceptedIpHash,
    })
    // Two clicks on one button is one consent, not two.
    .onConflictDoNothing();
}

export async function hasAcceptedTerms(
  db: Db,
  input: { orgId: string; termsVersion: string; lookupKey: string },
): Promise<boolean> {
  const [row] = await db
    .select({ id: subscriptionTermsAcceptances.id })
    .from(subscriptionTermsAcceptances)
    .where(
      and(
        eq(subscriptionTermsAcceptances.orgId, input.orgId),
        eq(subscriptionTermsAcceptances.termsVersion, input.termsVersion),
        eq(subscriptionTermsAcceptances.priceLookupKey, input.lookupKey),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function latestAcceptance(db: Db, orgId: string) {
  const [row] = await db
    .select()
    .from(subscriptionTermsAcceptances)
    .where(eq(subscriptionTermsAcceptances.orgId, orgId))
    .orderBy(subscriptionTermsAcceptances.acceptedAt)
    .limit(1);
  return row;
}

async function hasLiveSubscription(db: Db, orgId: string): Promise<boolean> {
  const rows = await db.select().from(subscriptions).where(eq(subscriptions.orgId, orgId));
  return rows.some((row) => ['trialing', 'active', 'past_due', 'paused'].includes(row.status));
}

export async function startTrialCheckout(
  ctx: CheckoutContext,
  input: { orgId: string; userId: string; email?: string; lookupKey: string; termsVersion: string },
): Promise<StartTrialResult> {
  // V17 first: an unsellable tier is refused before anything is looked up, so
  // no Stripe object can be created on the way to finding out.
  if (!isSellable(input.lookupKey)) {
    return { status: 'tier_not_sellable', lookupKey: input.lookupKey };
  }

  const plan = planForLookupKey(ctx.plans, input.lookupKey);
  if (!plan) return { status: 'unknown_plan', lookupKey: input.lookupKey };
  if (!priceIdFor(plan, ctx.env)) {
    return { status: 'price_not_configured', lookupKey: input.lookupKey, envVar: plan.priceEnvVar };
  }

  // V15: the consent record gates the money path.
  if (
    !(await hasAcceptedTerms(ctx.db, {
      orgId: input.orgId,
      termsVersion: input.termsVersion,
      lookupKey: input.lookupKey,
    }))
  ) {
    return { status: 'terms_not_accepted', lookupKey: input.lookupKey };
  }

  if (await hasLiveSubscription(ctx.db, input.orgId)) return { status: 'already_subscribed' };

  const result = await startCheckout(
    { db: ctx.db, adapters: ctx.adapters, plans: ctx.plans, env: ctx.env },
    {
      orgId: input.orgId,
      planKey: plan.key,
      userId: input.userId,
      ...(input.email ? { email: input.email } : {}),
      successPath: '/billing/return?checkout=success',
      cancelPath: '/billing/start?checkout=cancelled',
    },
  );

  if (result.status === 'ok') return result;
  if (result.status === 'price_not_configured') {
    return { status: 'price_not_configured', lookupKey: input.lookupKey, envVar: result.envVar };
  }
  return { status: 'unknown_plan', lookupKey: input.lookupKey };
}

/**
 * The only thing the GC card can do. It creates no customer, no subscription
 * and no Stripe object — and it is written under WL-14's consent shape: an
 * unticked box whose wording is hashed onto the row, and a hashed IP.
 */
export async function joinWaitlist(
  db: Db,
  input: {
    email: string;
    tier: string;
    surface: string;
    consentTextVersion: string;
    createdIpHash: string;
  },
): Promise<{ created: boolean }> {
  const rows = await db
    .insert(waitlistSignups)
    .values({
      id: newId('wtl'),
      email: input.email.trim().toLowerCase(),
      tier: input.tier,
      surface: input.surface,
      consentTextVersion: input.consentTextVersion,
      createdIpHash: input.createdIpHash,
    })
    .onConflictDoNothing()
    .returning();
  return { created: rows.length > 0 };
}
