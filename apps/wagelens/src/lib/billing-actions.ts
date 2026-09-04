'use server';

/**
 * WL-09's server actions.
 *
 * `startTrialAction` is one POST that does two things IN ORDER: it writes the
 * consent record, then it asks for a Checkout session. The order is the
 * requirement (V15 — "called by the checkbox, before Checkout, never after"),
 * and `startTrialCheckout` re-checks for the row rather than trusting this
 * function, so the consent record gates the money path even if a future caller
 * forgets. An unticked box writes nothing and creates nothing.
 *
 * The redirect back from Stripe grants no access. `/billing/return` polls our
 * own mirror until the webhook has written it; the webhook is the only writer
 * of entitlement.
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getEnv } from '@/env';
import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import { plans } from '@/lib/plans';
import { getAdapters } from '@octopus/platform/adapters';
import { openBillingPortal } from '@octopus/platform/billing';
import { requireOwner } from '@octopus/platform/next';

import {
  joinWaitlist,
  recordTermsAcceptance,
  startTrialCheckout,
} from '@/lib/billing/checkout';
import { gcConsentVersion } from '@/lib/billing/waitlist';
import { planForLookupKey } from '@/lib/billing/sellable';
import { trialTerms } from '@/lib/billing/terms';
import { clientIp, ipHash } from '@/lib/public-request';

async function ctx() {
  const db = await getDb();
  return { db, adapters: getAdapters(), env: getEnv() as never, plans };
}

/**
 * The trial-terms screen's only submit. Consent → acceptance row → Checkout.
 */
export async function startTrialAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOwner();
  const { db, adapters, env } = await ctx();
  const lookupKey = String(formData.get('lookupKey') ?? '');
  const accepted = formData.get('terms') === 'on' || formData.get('terms') === 'true';

  const plan = planForLookupKey(plans, lookupKey);
  if (!plan) redirect('/billing/start?error=unknown_plan');

  // V15 — the box is unticked by default and required. Nothing is written and
  // no Stripe object is created without it, and the reason is shown.
  if (!accepted) {
    redirect(`/billing/start?plan=${encodeURIComponent(lookupKey)}&error=terms_not_accepted`);
  }

  // The amount and the date are recomputed here rather than trusted from the
  // form: a hidden field is the client's word for what we disclosed.
  const terms = trialTerms({ plan, lookupKey, now: new Date() });
  const requestHeaders = await headers();

  await recordTermsAcceptance(db, {
    orgId: org.id,
    userId: user.id,
    terms,
    acceptedIpHash: ipHash(clientIp(requestHeaders)),
  });
  await emitEvent(db, 'trial_terms_accepted', {
    orgId: org.id,
    userId: user.id,
    props: { plan: plan.key, terms_version: terms.version },
  });

  const result = await startTrialCheckout(
    { db, adapters, plans, env },
    {
      orgId: org.id,
      userId: user.id,
      email: user.email,
      lookupKey,
      termsVersion: terms.version,
    },
  );

  if (result.status !== 'ok') {
    if (result.status === 'already_subscribed') redirect('/settings/billing?error=already_subscribed');
    redirect(`/billing/start?plan=${encodeURIComponent(lookupKey)}&error=${result.status}`);
  }

  await emitEvent(db, 'checkout_started', {
    orgId: org.id,
    userId: user.id,
    props: { plan: plan.key },
  });
  redirect(result.url);
}

/** `/pricing`'s CTA. Records the tier mix BEFORE checkout, which is what tells
 *  us whether Crew is a decoy or a leak, then sends the buyer to the terms. */
export async function pricingCtaAction(formData: FormData): Promise<void> {
  const db = await getDb();
  const lookupKey = String(formData.get('lookupKey') ?? '');
  const plan = planForLookupKey(plans, lookupKey);
  await emitEvent(db, 'pricing_cta_clicked', {
    props: {
      tier: plan?.key ?? 'unknown',
      interval: plan?.interval ?? 'month',
    },
  });
  redirect(`/login?next=${encodeURIComponent(`/billing/start?plan=${lookupKey}`)}`);
}

export async function openPortalAction(): Promise<void> {
  const { org } = await requireOwner();
  const { db, adapters, env } = await ctx();
  const result = await openBillingPortal(
    { db, adapters },
    { orgId: org.id, returnUrl: `${(env as { APP_BASE_URL: string }).APP_BASE_URL}/settings/billing` },
  );
  if (result.status !== 'ok') redirect('/settings/billing?error=no_customer');
  await emitEvent(db, 'portal_opened', { orgId: org.id });
  redirect(result.url);
}

/**
 * The ONLY thing the GC Roll-up card can do (V17–V19).
 *
 * It writes a waitlist row under WL-14's consent shape — an unticked box whose
 * wording is hashed onto the record, and a hashed IP — and emits the demand
 * signal `BACKLOG.md`'s own trigger for WL-24 needs. It creates no customer, no
 * subscription and no Checkout session, and there is no code path from here to
 * one.
 */
export async function joinGcWaitlistAction(formData: FormData): Promise<void> {
  const db = await getDb();
  const email = String(formData.get('email') ?? '').trim();
  const consent = formData.get('consent') === 'on' || formData.get('consent') === 'true';
  const surface = String(formData.get('surface') ?? 'pricing');
  const requestHeaders = await headers();

  if (!consent || !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email)) {
    redirect(`/pricing?gc=refused#gc`);
  }

  await joinWaitlist(db, {
    email,
    tier: 'gc',
    surface,
    consentTextVersion: gcConsentVersion(),
    createdIpHash: ipHash(clientIp(requestHeaders)),
  });
  await emitEvent(db, 'gc_tier_interest', { props: { plan: 'gc', surface } });
  redirect('/pricing?gc=joined#gc');
}

/** The pricing page's view event, called from the page itself. */
export async function trackPricingViewed(source: string): Promise<void> {
  const db = await getDb();
  await emitEvent(db, 'pricing_viewed', { props: { source } });
}
