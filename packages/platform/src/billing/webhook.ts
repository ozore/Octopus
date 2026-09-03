/**
 * The Stripe webhook: the ONLY writer of entitlement.
 *
 * Three properties, each of which was a production incident somewhere before it
 * was a comment here:
 *
 *  1. SIGNATURE FIRST. An unverified payload is a stranger claiming a customer
 *     paid. `verifyWebhook` throws, and the caller answers 400 without touching
 *     the database.
 *  2. THE IDEMPOTENCY CLAIM IS INSIDE THE TRANSACTION IT GUARDS. Recording the
 *     event id first, in its own transaction, and only then doing the work,
 *     means a mid-flight failure leaves the claim committed and the work rolled
 *     back: every Stripe retry then reads "already processed" and does nothing,
 *     the card is charged and the customer is never upgraded. Claim and effects
 *     commit together or not at all.
 *  3. VENDOR READS HAPPEN BEFORE THE TRANSACTION. A Stripe API round trip
 *     inside a Postgres transaction holds a connection open across the network;
 *     on a serverless database that is how a pool dies. Gather first, write
 *     fast.
 */

import { and, eq } from 'drizzle-orm';

import type { Adapters } from '../adapters';
import { normaliseSubscription, type BillingWebhookEvent } from '../adapters/billing';
import type { Db } from '../db';
import { withTx } from '../db';
import { customers, stripeEvents, subscriptions } from '../db/schema';
import { PLATFORM_EVENTS, track } from '../events/track';
import { enqueue } from '../jobs/queue';
import type { PlanMap } from './plans';
import { planForPriceId } from './plans';

export type WebhookContext = {
  db: Db;
  adapters: Adapters;
  plans: PlanMap;
  env: Record<string, unknown>;
};

export type WebhookResult =
  | { status: 'duplicate'; eventId: string }
  | { status: 'ignored'; type: string }
  | { status: 'handled'; type: string; orgId?: string }
  | { status: 'unmatched'; type: string; reason: string };

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

/** Both live and mock put the object under `event.data.object` (Stripe's real
 *  shape); a flatter fixture is still read rather than crashing. */
export function eventObject(event: BillingWebhookEvent): Record<string, unknown> {
  const data = asRecord(event.data);
  const nested = asRecord(data['object']);
  // `asRecord` answers `{}` rather than undefined, so the emptiness test — not
  // a `??` — is what makes the flat shape fall through instead of being read as
  // an empty object and losing every field.
  return Object.keys(nested).length > 0 ? nested : data;
}

const idOf = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : (asRecord(value)['id'] as string | undefined);

async function orgIdForCustomer(db: Db, stripeCustomerId: string): Promise<string | undefined> {
  const [row] = await db
    .select()
    .from(customers)
    .where(eq(customers.stripeCustomerId, stripeCustomerId))
    .limit(1);
  return row?.orgId;
}

/** Insert-or-nothing on the event id. Returns false when Stripe is retrying. */
async function claimEvent(db: Db, event: BillingWebhookEvent): Promise<boolean> {
  const rows = await db
    .insert(stripeEvents)
    .values({ id: event.id, type: event.type, payload: event.data })
    .onConflictDoNothing({ target: stripeEvents.id })
    .returning();
  return rows.length > 0;
}

async function mirrorSubscription(
  db: Db,
  input: {
    orgId: string;
    snapshot: ReturnType<typeof normaliseSubscription>;
  },
): Promise<void> {
  const { snapshot, orgId } = input;
  await db
    .insert(subscriptions)
    .values({
      id: snapshot.id,
      orgId,
      stripeCustomerId: snapshot.customerId,
      status: snapshot.status,
      priceId: snapshot.priceId,
      quantity: snapshot.quantity,
      currentPeriodEnd: snapshot.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
      trialEndsAt: snapshot.trialEndsAt ?? null,
      canceledAt: snapshot.canceledAt ?? null,
    })
    .onConflictDoUpdate({
      target: subscriptions.id,
      set: {
        status: snapshot.status,
        priceId: snapshot.priceId,
        quantity: snapshot.quantity,
        currentPeriodEnd: snapshot.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
        trialEndsAt: snapshot.trialEndsAt ?? null,
        canceledAt: snapshot.canceledAt ?? null,
        updatedAt: new Date(),
      },
    });

  await db
    .insert(customers)
    .values({ orgId, stripeCustomerId: snapshot.customerId })
    .onConflictDoUpdate({
      target: customers.orgId,
      set: { stripeCustomerId: snapshot.customerId, updatedAt: new Date() },
    });
}

export async function handleBillingWebhook(
  ctx: WebhookContext,
  rawPayload: string,
  signature: string,
): Promise<WebhookResult> {
  const event = ctx.adapters.billing.verifyWebhook(rawPayload, signature);

  // Cheap pre-check: most retries are answered here without opening a
  // transaction. The authoritative claim is still taken below.
  const [seen] = await ctx.db
    .select({ id: stripeEvents.id })
    .from(stripeEvents)
    .where(eq(stripeEvents.id, event.id))
    .limit(1);
  if (seen) return { status: 'duplicate', eventId: event.id };

  const object = eventObject(event);

  switch (event.type) {
    case 'checkout.session.completed': {
      const orgId =
        (object['client_reference_id'] as string | undefined) ??
        (asRecord(object['metadata'])['org_id'] as string | undefined);
      const subscriptionId = idOf(object['subscription']);
      const customerId = idOf(object['customer']);
      if (!orgId) return { status: 'unmatched', type: event.type, reason: 'no org id on session' };
      if (!subscriptionId) {
        return { status: 'unmatched', type: event.type, reason: 'session has no subscription' };
      }

      // Vendor read BEFORE the transaction (property 3 above).
      const snapshot = await ctx.adapters.billing.retrieveSubscription(subscriptionId);
      const planKey =
        (asRecord(object['metadata'])['plan_key'] as string | undefined) ??
        planForPriceId(ctx.plans, snapshot.priceId, ctx.env)?.key;

      const claimed = await withTx(ctx.db, async (tx) => {
        if (!(await claimEvent(tx, event))) return false;
        await mirrorSubscription(tx, {
          orgId,
          snapshot: { ...snapshot, customerId: snapshot.customerId || (customerId ?? '') },
        });
        await enqueue(tx, {
          kind: 'platform.subscription_active_email',
          payload: { orgId, planKey: planKey ?? 'subscription' },
          dedupeKey: `platform.subscription_active_email:${subscriptionId}`,
        });
        return true;
      });
      if (!claimed) return { status: 'duplicate', eventId: event.id };

      await track(ctx.db, {
        name: PLATFORM_EVENTS.subscriptionActivated,
        orgId,
        props: { plan_key: planKey ?? 'unknown', subscription_id: subscriptionId },
      });
      return { status: 'handled', type: event.type, orgId };
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const snapshot = normaliseSubscription(object);
      const orgId = snapshot.orgId ?? (await orgIdForCustomer(ctx.db, snapshot.customerId));
      if (!orgId) {
        return { status: 'unmatched', type: event.type, reason: 'no organisation for customer' };
      }

      const claimed = await withTx(ctx.db, async (tx) => {
        if (!(await claimEvent(tx, event))) return false;
        await mirrorSubscription(tx, {
          orgId,
          snapshot:
            event.type === 'customer.subscription.deleted'
              ? { ...snapshot, status: 'canceled', canceledAt: snapshot.canceledAt ?? new Date() }
              : snapshot,
        });
        return true;
      });
      if (!claimed) return { status: 'duplicate', eventId: event.id };

      if (event.type === 'customer.subscription.deleted') {
        await track(ctx.db, {
          name: PLATFORM_EVENTS.subscriptionCancelled,
          orgId,
          props: { subscription_id: snapshot.id },
        });
      }
      return { status: 'handled', type: event.type, orgId };
    }

    case 'invoice.payment_failed': {
      const customerId = idOf(object['customer']);
      const orgId = customerId ? await orgIdForCustomer(ctx.db, customerId) : undefined;
      const claimed = await withTx(ctx.db, async (tx) => {
        if (!(await claimEvent(tx, event))) return false;
        if (orgId) {
          await enqueue(tx, {
            kind: 'platform.payment_failed_email',
            payload: { orgId, invoiceId: object['id'] ?? null },
            dedupeKey: `platform.payment_failed_email:${String(object['id'] ?? event.id)}`,
          });
        }
        return true;
      });
      if (!claimed) return { status: 'duplicate', eventId: event.id };

      if (orgId) {
        await track(ctx.db, {
          name: PLATFORM_EVENTS.paymentFailed,
          orgId,
          props: { invoice_id: String(object['id'] ?? '') },
        });
      }
      return { status: 'handled', type: event.type, ...(orgId ? { orgId } : {}) };
    }

    case 'invoice.paid': {
      // Stripe emails the receipt (PLAN.md: receipts handled by Stripe). We
      // record the event for metrics and for the "we saw it" audit trail only.
      const customerId = idOf(object['customer']);
      const orgId = customerId ? await orgIdForCustomer(ctx.db, customerId) : undefined;
      const claimed = await withTx(ctx.db, (tx) => claimEvent(tx, event));
      if (!claimed) return { status: 'duplicate', eventId: event.id };
      return { status: 'handled', type: event.type, ...(orgId ? { orgId } : {}) };
    }

    default: {
      // Unknown types are acknowledged, not retried: answering 500 to a type we
      // do not handle makes Stripe retry it for days.
      await ctx.db
        .insert(stripeEvents)
        .values({ id: event.id, type: event.type, payload: event.data })
        .onConflictDoNothing({ target: stripeEvents.id });
      return { status: 'ignored', type: event.type };
    }
  }
}

/** Reconciliation for the drain job: re-read Stripe for a subscription whose
 *  mirror looks stale. Used by the daily housekeeping job, never by a render. */
export async function reconcileSubscription(
  ctx: WebhookContext,
  subscriptionId: string,
): Promise<void> {
  const snapshot = await ctx.adapters.billing.retrieveSubscription(subscriptionId);
  const orgId = snapshot.orgId ?? (await orgIdForCustomer(ctx.db, snapshot.customerId));
  if (!orgId) return;
  await mirrorSubscription(ctx.db, { orgId, snapshot });
}

export async function subscriptionsForOrg(db: Db, orgId: string) {
  return db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.orgId, orgId)));
}
