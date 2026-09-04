/**
 * CERTLY'S SIDE OF THE STRIPE WEBHOOK.
 *
 * The platform handler owns the mirror (`subscriptions`, `customers`) and the
 * idempotency claim on `stripe_events.id`. This module owns what is Certly's:
 *
 *  1. **The consent record** (`specs/10` §3.1.2, A15) — the exact disclosure
 *     string that was rendered, the first-charge date and the amount, written
 *     with the M9 `billing.trial_started` event, on `checkout.session.completed`.
 *  2. **The Vendor Pack** — a second subscription line the platform's one-row
 *     mirror cannot hold, so a pack event is handled HERE and deliberately not
 *     handed to the mirror (see `schema.ts#billingAddons`).
 *  3. **The pre-charge reminder** — `customer.subscription.trial_will_end` at
 *     T−3, and the T−1 that follows it. Transactional, and exempt from every
 *     notification preference (§3.1.3): "no charge without a warning" is a
 *     promise the product keeps, not a setting a customer can turn off by
 *     accident.
 *  4. **The funnel events** the registry names — and the one that matters is
 *     `trial_converted` on the FIRST `invoice.paid`, because that is money,
 *     whereas `checkout_completed` is only a card on file (`specs/14` §3.1).
 */

import { and, eq } from 'drizzle-orm';

import type { Db } from '@/lib/db';
import { writeAuditEvent } from '@/lib/audit';
import { trackEvent } from '@/lib/events';
import {
  TIER_SPECS,
  VENDOR_PACK,
  amountCentsFor,
  intervalOf,
  isPackPriceId,
  plans,
  tierOf,
} from '@/lib/plans';
import { certlyEntitlement } from '@/lib/billing/entitlement';
import { chargeDateLabel, daysUntil, trialDisclosure } from '@/lib/billing/trial';
import {
  consentExistsForSession,
  recordTrialConsent,
  setPackQuantity,
} from '@/lib/repos/billing';
import { comparisons } from '@/lib/schema';
import type { Adapters } from '@octopus/platform/adapters';
import { normaliseSubscription, type BillingWebhookEvent } from '@octopus/platform/adapters';
import { planForPriceId } from '@octopus/platform/billing';
import { customers, events as eventsTable, stripeEvents } from '@octopus/platform/db';
import { brandFromEnv, notificationEmail, sendEmail } from '@octopus/platform/email';

export type CertlyWebhookContext = {
  db: Db;
  adapters: Adapters;
  env: Record<string, unknown> & { APP_BASE_URL: string };
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

export function webhookObject(event: BillingWebhookEvent): Record<string, unknown> {
  const data = asRecord(event.data);
  const nested = asRecord(data['object']);
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

/** Has this org ever emitted this event? The idempotency the funnel needs. */
async function alreadyEmitted(db: Db, orgId: string, name: string): Promise<boolean> {
  const [row] = await db
    .select({ id: eventsTable.id })
    .from(eventsTable)
    .where(and(eq(eventsTable.orgId, orgId), eq(eventsTable.name, name)))
    .limit(1);
  return Boolean(row);
}

/** Claim an event id for a path the platform handler never sees (the pack). */
async function claimEventId(db: Db, event: BillingWebhookEvent): Promise<boolean> {
  const rows = await db
    .insert(stripeEvents)
    .values({ id: event.id, type: event.type, payload: event.data })
    .onConflictDoNothing({ target: stripeEvents.id })
    .returning();
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// The Vendor Pack path
// ---------------------------------------------------------------------------

export function isPackEvent(event: BillingWebhookEvent, env: Record<string, unknown>): boolean {
  if (!event.type.startsWith('customer.subscription.')) return false;
  const snapshot = normaliseSubscription(webhookObject(event));
  return isPackPriceId(snapshot.priceId, env);
}

export async function handlePackEvent(
  ctx: CertlyWebhookContext,
  event: BillingWebhookEvent,
): Promise<{ status: 'handled' | 'duplicate' | 'unmatched'; orgId?: string; quantity?: number }> {
  const snapshot = normaliseSubscription(webhookObject(event));
  const orgId = snapshot.orgId ?? (await orgIdForCustomer(ctx.db, snapshot.customerId));
  if (!orgId) return { status: 'unmatched' };
  if (!(await claimEventId(ctx.db, event))) return { status: 'duplicate' };

  // A cancelled pack is zero packs, not the last quantity we saw.
  const cancelled =
    event.type === 'customer.subscription.deleted' ||
    ['canceled', 'unpaid', 'incomplete_expired'].includes(snapshot.status);
  const quantity = cancelled ? 0 : snapshot.quantity;

  const stored = await setPackQuantity(ctx.db, {
    orgId,
    quantity,
    priceId: snapshot.priceId,
    subscriptionId: snapshot.id,
    status: cancelled ? 'canceled' : snapshot.status,
  });

  await writeAuditEvent(ctx.db, {
    orgId,
    actor: { kind: 'system' },
    kind: 'billing.subscription_changed',
    subjectType: 'org',
    subjectId: orgId,
    payload: {
      status: cancelled ? 'canceled' : snapshot.status,
      plan: `${VENDOR_PACK.name} × ${stored}`,
    },
  });

  return { status: 'handled', orgId, quantity: stored };
}

// ---------------------------------------------------------------------------
// Certly's effects on the events the platform mirror already handled
// ---------------------------------------------------------------------------

export type EffectResult = { effects: string[]; orgId?: string };

export async function applyCertlyBillingEffects(
  ctx: CertlyWebhookContext,
  event: BillingWebhookEvent,
): Promise<EffectResult> {
  const object = webhookObject(event);
  const effects: string[] = [];

  switch (event.type) {
    case 'checkout.session.completed': {
      const metadata = asRecord(object['metadata']) as Record<string, string>;
      const orgId =
        (object['client_reference_id'] as string | undefined) ?? metadata['org_id'] ?? undefined;
      const sessionId = String(object['id'] ?? '');
      if (!orgId) return { effects };
      if (metadata['plan_key'] === 'vendor_pack') return { effects, orgId };

      const tier = tierOf(metadata['plan_key'] ?? metadata['tier'] ?? '') ?? null;
      const interval = metadata['interval'] === 'year' ? 'year' : 'month';
      const amountCents = Number(metadata['amount_cents'] ?? 0) ||
        (tier ? amountCentsFor(tier, interval) : 0);
      const firstChargeAt = metadata['first_charge_at']
        ? new Date(metadata['first_charge_at'])
        : null;

      // A15 — one consent row per session, with the string that was RENDERED.
      // The fallback is only for a session started outside our own action; it
      // reconstructs today's sentence and says so by carrying no user agent.
      if (sessionId && !(await consentExistsForSession(ctx.db, sessionId))) {
        await recordTrialConsent(ctx.db, {
          orgId,
          userId: metadata['user_id'] ?? null,
          stripeCheckoutSessionId: sessionId,
          disclosureText:
            metadata['trial_disclosure'] ??
            trialDisclosure(firstChargeAt ?? undefined),
          priceId: idOf(object['price']) ?? metadata['price_id'] ?? null,
          firstChargeAt,
          amountCents,
          shownAt: metadata['shown_at'] ? new Date(metadata['shown_at']) : null,
          userAgent: metadata['user_agent'] ?? null,
          actor: metadata['user_id']
            ? ({ kind: 'user', userId: metadata['user_id'] } as const)
            : ({ kind: 'system' } as const),
        });
        effects.push('trial_consent_recorded');
      }

      // `checkout_completed` IS A CARD ON FILE, NOT MONEY (`specs/00` §2.10).
      await trackEvent(ctx.db, {
        name: 'checkout_completed',
        orgId,
        userId: metadata['user_id'] ?? null,
        props: {
          plan: tier ?? 'unknown',
          interval,
          mrr_cents: interval === 'year' ? Math.round(amountCents / 12) : amountCents,
        },
      });
      effects.push('checkout_completed');
      return { effects, orgId };
    }

    case 'customer.subscription.trial_will_end': {
      const snapshot = normaliseSubscription(object);
      const orgId = snapshot.orgId ?? (await orgIdForCustomer(ctx.db, snapshot.customerId));
      if (!orgId) return { effects };
      await sendTrialWarning(ctx, { orgId, priceId: snapshot.priceId, trialEndsAt: snapshot.trialEndsAt ?? null });
      effects.push('trial_will_end_email_sent');
      return { effects, orgId };
    }

    case 'invoice.paid': {
      const customerId = idOf(object['customer']);
      const orgId = customerId ? await orgIdForCustomer(ctx.db, customerId) : undefined;
      if (!orgId) return { effects };
      // THE THRESHOLD EVENT (`THRESHOLDS.md` §3): the FIRST paid invoice. Once
      // per org, so a renewal never re-counts as a conversion.
      if (!(await alreadyEmitted(ctx.db, orgId, 'trial_converted'))) {
        const entitlement = await certlyEntitlement(ctx.db, orgId, { env: ctx.env });
        const tier = entitlement.tier === 'none' ? null : entitlement.tier;
        const interval = entitlement.interval ?? 'month';
        const amount = tier ? amountCentsFor(tier, interval) : 0;
        await trackEvent(ctx.db, {
          name: 'trial_converted',
          orgId,
          props: {
            plan: tier ?? 'unknown',
            mrr_cents: interval === 'year' ? Math.round(amount / 12) : amount,
          },
        });
        effects.push('trial_converted');
      }
      return { effects, orgId };
    }

    case 'invoice.payment_failed': {
      const customerId = idOf(object['customer']);
      const orgId = customerId ? await orgIdForCustomer(ctx.db, customerId) : undefined;
      if (!orgId) return { effects };
      await trackEvent(ctx.db, { name: 'subscription_past_due', orgId });
      await writeAuditEvent(ctx.db, {
        orgId,
        actor: { kind: 'system' },
        kind: 'billing.subscription_changed',
        subjectType: 'org',
        subjectId: orgId,
        payload: { status: 'past_due', plan: 'current' },
      });
      effects.push('subscription_past_due');
      return { effects, orgId };
    }

    case 'customer.subscription.deleted': {
      const snapshot = normaliseSubscription(object);
      const orgId = snapshot.orgId ?? (await orgIdForCustomer(ctx.db, snapshot.customerId));
      if (!orgId) return { effects };
      const wasTrialing = Boolean(snapshot.trialEndsAt && snapshot.trialEndsAt > new Date());
      if (wasTrialing) {
        const day = snapshot.trialEndsAt ? 14 - daysUntil(snapshot.trialEndsAt) : 0;
        await trackEvent(ctx.db, {
          name: 'trial_cancelled',
          orgId,
          props: { day, reason: 'portal' },
        });
        effects.push('trial_cancelled');
      } else {
        await trackEvent(ctx.db, {
          name: 'subscription_cancelled',
          orgId,
          props: { reason: 'portal', tenure_days: 0 },
        });
        effects.push('subscription_cancelled');
      }
      await writeAuditEvent(ctx.db, {
        orgId,
        actor: { kind: 'system' },
        kind: 'billing.subscription_changed',
        subjectType: 'org',
        subjectId: orgId,
        payload: { status: 'canceled', plan: 'previous' },
      });
      return { effects, orgId };
    }

    case 'customer.subscription.updated': {
      const snapshot = normaliseSubscription(object);
      const orgId = snapshot.orgId ?? (await orgIdForCustomer(ctx.db, snapshot.customerId));
      if (!orgId) return { effects };
      const plan = planForPriceId(plans, snapshot.priceId, ctx.env);
      const tier = plan ? tierOf(plan.key) : null;
      await writeAuditEvent(ctx.db, {
        orgId,
        actor: { kind: 'system' },
        kind: 'billing.subscription_changed',
        subjectType: 'org',
        subjectId: orgId,
        payload: { status: snapshot.status, plan: tier ? TIER_SPECS[tier].name : 'unknown' },
      });
      effects.push('subscription_changed');
      return { effects, orgId };
    }

    default:
      return { effects };
  }
}

// ---------------------------------------------------------------------------
// The pre-charge reminder — §3.1.3
// ---------------------------------------------------------------------------

/** Mock adapters record rather than send; a live send needs SEND_ENABLED. */
function sendingAllowed(env: Record<string, unknown>): boolean {
  return env['ADAPTER_MODE'] === 'mock' || env['SEND_ENABLED'] === true;
}

export type TrialWarningInput = {
  orgId: string;
  priceId?: string;
  trialEndsAt: Date | null;
  daysLeft?: number;
};

/**
 * The T−3 and T−1 warnings, each carrying THE ORG'S OWN NUMBERS — "you're
 * tracking 34 vendors and we've found 6 gaps" — the first-charge date, the
 * amount and a one-click cancel link.
 *
 * A16: it does not read `user_preferences`. There is no switch, deliberately.
 */
export async function sendTrialWarning(
  ctx: CertlyWebhookContext,
  input: TrialWarningInput,
): Promise<{ status: 'sent' | 'skipped'; daysLeft: number }> {
  const trialEndsAt = input.trialEndsAt;
  const daysLeft = input.daysLeft ?? (trialEndsAt ? daysUntil(trialEndsAt) : 3);

  const entitlement = await certlyEntitlement(ctx.db, input.orgId, { env: ctx.env });
  const gaps = await countOpenGaps(ctx.db, input.orgId);
  const tier = entitlement.tier === 'none' ? null : entitlement.tier;
  const amountCents = tier ? amountCentsFor(tier, entitlement.interval ?? 'month') : 0;
  const chargeOn = trialEndsAt ? chargeDateLabel(trialEndsAt) : 'the end of your trial';
  const money = `$${(amountCents / 100).toFixed(0)}`;

  await trackEvent(ctx.db, {
    name: 'trial_will_end_email_sent',
    orgId: input.orgId,
    props: { days_left: daysLeft },
  });

  const [customer] = await ctx.db
    .select()
    .from(customers)
    .where(eq(customers.orgId, input.orgId))
    .limit(1);
  const to = customer?.email;
  if (!to || !sendingAllowed(ctx.env)) return { status: 'skipped', daysLeft };

  const content = notificationEmail(brandFromEnv(), {
    subject: `Your trial ends ${chargeOn} — ${money} on that date unless you cancel`,
    paragraphs: [
      `You are tracking ${entitlement.vendorsUsed} vendor${entitlement.vendorsUsed === 1 ? '' : 's'} and we have found ${gaps} problem${gaps === 1 ? '' : 's'} so far.`,
      `Your card is charged ${money} on ${chargeOn} unless you cancel. Cancelling takes one click and nothing is charged.`,
      'This message is part of the trial and cannot be switched off — no charge without a warning.',
    ],
    actionUrl: `${ctx.env.APP_BASE_URL}/settings/billing`,
    actionLabel: 'Cancel or continue',
  });

  await sendEmail(ctx.db, ctx.adapters, {
    to,
    content,
    tags: { kind: 'trial_will_end', days_left: String(daysLeft) },
  });
  return { status: 'sent', daysLeft };
}

/** Gaps across the org's most recent comparisons — the number the email quotes. */
async function countOpenGaps(db: Db, orgId: string): Promise<number> {
  const rows = await db
    .select({ vendorId: comparisons.vendorId, gaps: comparisons.gapCount })
    .from(comparisons)
    .where(eq(comparisons.orgId, orgId));
  const latest = new Map<string, number>();
  for (const row of rows) latest.set(row.vendorId, row.gaps);
  return [...latest.values()].reduce((sum, n) => sum + n, 0);
}
