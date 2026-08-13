'use server';

/**
 * J3 — the $49 bid rate card, bought before an account exists.
 *
 * AUTHORITY: `USER_JOURNEY.md` §3.1 (what the card contains), §3.3 (fulfilment is
 * driven by the WEBHOOK, never by the landing page), §3.4 (**no `tenants` row is
 * written** — the Checkout email is the only identity), §3.5 (the ladder check
 * happens BEFORE any charge, and at L2/L3 **we refuse the money**),
 * `ARCHITECTURE.md` §8.1, D7.
 */

import { redirect } from 'next/navigation';

import { suppressesNewRateAssertions } from '@/corpus';
import { getDb } from '@/db';
import { isEmail, normalizeEmail } from '@/platform/auth/magic-link';
import { startRateCardCheckout } from '@/platform/billing/checkout';

import { appClock, billingDeps } from '../_lib/deps';
import { corpusState } from '../_lib/mirror';

export async function buyRateCardAction(formData: FormData): Promise<void> {
  const wd = String(formData.get('wdNumber') ?? '').trim().toUpperCase();
  const email = normalizeEmail(String(formData.get('email') ?? ''));
  const db = await getDb();
  const corpus = await corpusState(db, appClock().now());

  /**
   * THE LADDER CHECK, BEFORE CHECKOUT OPENS.
   *
   * A bid rate card is the purest rate assertion in the product, and D7 blocks new
   * rate assertions beyond 72 hours. So the Buy button is replaced rather than
   * failing later: we refuse the money, name the exact last-successful check, and
   * point at the thing that still works. Nobody is asked to wait for a person.
   */
  if (suppressesNewRateAssertions(corpus.levels)) {
    redirect(`/rate-card?wd=${encodeURIComponent(wd)}&refused=stale`);
  }

  if (!isEmail(email)) {
    redirect(`/rate-card?wd=${encodeURIComponent(wd)}&refused=email`);
  }

  const checkout = await startRateCardCheckout(
    { email, returnPath: '/rate-card/ready' },
    billingDeps(),
  );
  redirect(checkout.url);
}
