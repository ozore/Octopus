'use server';

/**
 * Starting a trial — Certly's own Checkout call, and why it is not the
 * platform's `startCheckout`.
 *
 * `specs/10` §3.1.2 requires the EXACT DISCLOSURE STRING THAT WAS RENDERED to
 * be recorded against the Checkout session, and §12.3 requires the same
 * sentences in the session's own line-item description. The platform's
 * `startCheckout` builds its metadata itself and takes none from the caller, so
 * this action calls the billing port directly — with `ensureStripeCustomer`
 * from the platform, so the org↔customer mapping stays in one place.
 *
 * NOTHING HERE GRANTS ENTITLEMENT. The redirect back from Stripe grants
 * nothing; the webhook is the only writer (`packages/platform` README §3).
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { trackEvent } from '@/lib/events';
import {
  TIERS,
  TRIAL_DAYS,
  amountCentsFor,
  packPriceEnvVar,
  planKeyFor,
  type Interval,
  type Tier,
} from '@/lib/plans';
import { firstChargeAt, trialDisclosure } from '@/lib/billing/trial';
import { getAdapters } from '@octopus/platform/adapters';
import { ensureStripeCustomer, findPlan, priceIdFor } from '@octopus/platform/billing';
import { requireOrg } from '@octopus/platform/next';

import { plans } from '@/lib/plans';

const isTier = (value: string): value is Tier => (TIERS as readonly string[]).includes(value);
const isInterval = (value: string): value is Interval => value === 'month' || value === 'year';

/**
 * A11: Checkout is refused SERVER-SIDE for anyone but an owner. Hiding the
 * button is not a check.
 */
export async function startTrialCheckoutAction(formData: FormData): Promise<void> {
  const { org, user, membership } = await requireOrg();
  if (membership.role !== 'owner') redirect('/settings/billing?error=owner_only');

  const tier = String(formData.get('tier') ?? '');
  const interval = String(formData.get('interval') ?? 'month');
  const returnTo = String(formData.get('returnTo') ?? '/settings/billing');
  if (!isTier(tier) || !isInterval(interval)) redirect('/settings/billing?error=unknown_plan');

  const env = getEnv();
  const db = await getDb();
  const adapters = getAdapters();
  const planKey = planKeyFor(tier, interval);
  const plan = findPlan(plans, planKey);
  if (!plan) redirect('/settings/billing?error=unknown_plan');

  const priceId = priceIdFor(plan, env as unknown as Record<string, unknown>);
  if (!priceId) redirect(`/settings/billing?error=price_not_configured&plan=${planKey}`);

  const charge = firstChargeAt();
  // The string the customer was shown, computed ONCE and carried through, so
  // the consent record cannot drift from the page (A15).
  const disclosure = trialDisclosure(charge);
  const amountCents = amountCentsFor(tier, interval);
  const requestHeaders = await headers();

  const customerId = await ensureStripeCustomer(
    { db, adapters },
    { orgId: org.id, email: user.email, name: org.name },
  );

  const session = await adapters.billing.createCheckoutSession({
    orgId: org.id,
    planKey,
    priceId,
    quantity: 1,
    customerId,
    customerEmail: user.email,
    trialDays: TRIAL_DAYS,
    successUrl: `${env.APP_BASE_URL}${returnTo}${returnTo.includes('?') ? '&' : '?'}checkout=success`,
    cancelUrl: `${env.APP_BASE_URL}${returnTo}${returnTo.includes('?') ? '&' : '?'}checkout=cancelled`,
    metadata: {
      org_id: org.id,
      plan_key: planKey,
      user_id: user.id,
      tier,
      interval,
      amount_cents: String(amountCents),
      first_charge_at: charge.toISOString(),
      // §12.3: the same sentences go into the Checkout session's line-item
      // description, so the disclosure is on the payment page too.
      trial_disclosure: disclosure,
      shown_at: new Date().toISOString(),
      user_agent: (requestHeaders.get('user-agent') ?? '').slice(0, 120),
    },
  });

  await trackEvent(db, {
    name: 'checkout_started',
    orgId: org.id,
    userId: user.id,
    props: { plan: tier, interval, pack_qty: 0, mrr_cents: amountCents },
  });

  redirect(session.url);
}

/** The Portal: plan switch, Vendor Pack quantity, invoices, cancel in one click. */
export async function openBillingPortalAction(): Promise<void> {
  const { org, membership } = await requireOrg();
  if (membership.role !== 'owner') redirect('/settings/billing?error=owner_only');

  const env = getEnv();
  const db = await getDb();
  const adapters = getAdapters();
  const { openBillingPortal } = await import('@octopus/platform/billing');
  const result = await openBillingPortal(
    { db, adapters },
    { orgId: org.id, returnUrl: `${env.APP_BASE_URL}/settings/billing` },
  );
  if (result.status !== 'ok') redirect('/settings/billing?error=no_customer');
  redirect(result.url);
}

/**
 * The Vendor Pack. `specs/10` §9 keeps quantity changes in the Portal — this
 * action starts the FIRST pack subscription; adjusting the quantity afterwards
 * is a Portal job, so there is no proration arithmetic in this codebase.
 */
export async function addVendorPackAction(formData: FormData): Promise<void> {
  const { org, user, membership } = await requireOrg();
  if (membership.role !== 'owner') redirect('/settings/billing?error=owner_only');

  const interval = String(formData.get('interval') ?? 'month');
  const quantity = Math.max(1, Math.min(10, Number(formData.get('quantity') ?? 1)));
  if (!isInterval(interval)) redirect('/settings/billing?error=unknown_plan');

  const env = getEnv() as unknown as Record<string, unknown>;
  const priceId = env[packPriceEnvVar(interval)];
  if (typeof priceId !== 'string' || priceId.length === 0) {
    redirect('/settings/billing?error=pack_not_configured');
  }

  const db = await getDb();
  const adapters = getAdapters();
  const base = getEnv().APP_BASE_URL;
  const customerId = await ensureStripeCustomer(
    { db, adapters },
    { orgId: org.id, email: user.email, name: org.name },
  );

  const session = await adapters.billing.createCheckoutSession({
    orgId: org.id,
    planKey: 'vendor_pack',
    priceId: priceId as string,
    quantity,
    customerId,
    customerEmail: user.email,
    successUrl: `${base}/settings/billing?pack=added`,
    cancelUrl: `${base}/settings/billing?pack=cancelled`,
    metadata: { org_id: org.id, plan_key: 'vendor_pack', pack_qty: String(quantity) },
  });

  await trackEvent(db, {
    name: 'pack_added',
    orgId: org.id,
    userId: user.id,
    props: { qty: quantity, vendors_added: quantity * 50 },
  });

  redirect(session.url);
}
