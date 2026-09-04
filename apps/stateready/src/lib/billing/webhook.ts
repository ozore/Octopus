/**
 * StateReady's webhook handling — the two things that are this app's rather
 * than the platform's, wrapped AROUND the shared handler instead of forking it.
 *
 *  1. **One-off purchases.** A State Entry Pack is a `mode=payment` Checkout, so
 *     the platform's handler answers `unmatched` — correctly, since there is no
 *     subscription on it. The one-off branch claims the event id itself
 *     (Stripe's id is the idempotency key) and marks the purchase paid.
 *  2. **The Entry Pack credit.** `$750 credits against an annual plan taken
 *     within 90 days` (`OFFER.md` §6.3) is applied when the ANNUAL subscription
 *     lands, and only then — a monthly plan leaves the credit pending rather
 *     than burning it.
 *
 * It lives in `lib` rather than in the route so the mock Checkout page can run
 * the SAME code with the SAME signed payload. A journey that exercises a second
 * implementation is evidence about the second implementation.
 */

import { eq } from 'drizzle-orm';
import type { Adapters } from '@octopus/platform/adapters';
import type { Db } from '@octopus/platform/db';
import { stripeEvents, subscriptions } from '@octopus/platform/db';
import {
  handleBillingWebhook,
  monthlyAmountCents,
  planForPriceId,
  type WebhookResult,
} from '@octopus/platform/billing';
import { track } from '@octopus/platform/events';

import { plans } from '../plans';
import { applyCreditToSubscription, recordOneOffPaid } from './one-off';

export type StateReadyWebhookContext = {
  db: Db;
  adapters: Adapters;
  env: Record<string, unknown>;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

function objectOf(event: { data: Record<string, unknown> }): Record<string, unknown> {
  const nested = asRecord(event.data['object']);
  return Object.keys(nested).length > 0 ? nested : event.data;
}

const idOf = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : (asRecord(value)['id'] as string | undefined);

export async function handleStateReadyWebhook(
  ctx: StateReadyWebhookContext,
  raw: string,
  signature: string,
): Promise<WebhookResult> {
  const { db, adapters, env } = ctx;
  const event = adapters.billing.verifyWebhook(raw, signature);
  const object = objectOf(event);
  const metadata = asRecord(object['metadata']);
  const isOneOff =
    metadata['kind'] === 'one_off' ||
    (event.type === 'checkout.session.completed' && object['mode'] === 'payment');

  if (isOneOff && (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded')) {
    const claimed = await db
      .insert(stripeEvents)
      .values({ id: event.id, type: event.type, payload: event.data })
      .onConflictDoNothing({ target: stripeEvents.id })
      .returning();
    if (claimed.length === 0) return { status: 'duplicate', eventId: event.id };

    const orgId =
      (object['client_reference_id'] as string | undefined) ?? (metadata['org_id'] as string | undefined);
    if (!orgId) return { status: 'unmatched', type: event.type, reason: 'no org id on session' };

    await recordOneOffPaid(db, {
      orgId,
      purchaseId: (metadata['purchase_id'] as string | undefined) ?? null,
      sku: (metadata['sku'] as string | undefined) ?? null,
      paymentIntentId:
        idOf(object['payment_intent']) ??
        (event.type === 'payment_intent.succeeded' ? String(object['id'] ?? '') : null),
      amountCents: typeof object['amount_total'] === 'number' ? (object['amount_total'] as number) : null,
      playbookId: (metadata['playbook_id'] as string | undefined) ?? null,
    });
    return { status: 'handled', type: event.type, orgId };
  }

  const result = await handleBillingWebhook({ db, adapters, plans, env }, raw, signature);

  if (result.status === 'handled' && result.orgId && event.type === 'checkout.session.completed') {
    const subscriptionId = idOf(object['subscription']);
    const [mirrored] = subscriptionId
      ? await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1)
      : [];
    const plan = mirrored ? planForPriceId(plans, mirrored.priceId, env) : undefined;

    await track(db, {
      name: 'checkout_completed',
      orgId: result.orgId,
      props: { plan_key: plan?.key ?? 'unknown', mrr_cents: plan ? monthlyAmountCents(plan) : 0 },
    });

    if (plan && subscriptionId) {
      await applyCreditToSubscription(db, {
        orgId: result.orgId,
        planKey: plan.key,
        interval: plan.interval,
        subscriptionId,
      });
    }
  }

  if (result.status === 'handled' && result.orgId && event.type === 'customer.subscription.deleted') {
    // `specs/09` spells it the American way and the metric reads that name.
    await track(db, {
      name: 'subscription_canceled',
      orgId: result.orgId,
      props: { subscription_id: String(object['id'] ?? '') },
    });
  }

  return result;
}
