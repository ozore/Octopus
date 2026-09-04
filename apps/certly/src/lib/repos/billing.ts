/**
 * M10's repository — everything money-shaped that touches the database.
 *
 * The platform owns `subscriptions`, `customers` and `stripe_events`; this
 * module READS them and owns the two Certly-side tables: `trial_consents` (what
 * the customer was shown before they gave us a card) and `billing_addons` (the
 * Vendor Pack, which the platform's one-row mirror cannot hold — see
 * `schema.ts`).
 *
 * Every read is org-scoped, like every other repository here.
 */

import { and, count, desc, eq, isNull } from 'drizzle-orm';

import { writeAuditEvent, type AuditActor } from '@/lib/audit';
import type { Db } from '@/lib/db';
import { newId } from '@/lib/ids';
import { billingAddons, documents, trialConsents, vendors } from '@/lib/schema';
import { customers, memberships, subscriptions, type Subscription } from '@octopus/platform/db';

export type { Subscription };

// ---------------------------------------------------------------------------
// Usage — the meter, and the two other things a plan bounds
// ---------------------------------------------------------------------------

/**
 * THE METER (`specs/10` §2.1): one non-archived vendor in the account. It is
 * duplicated from `repos.ts#countTrackedVendors` deliberately? No — it is
 * re-exported, so there is exactly one definition of the meter in the codebase.
 */
export { countTrackedVendors } from '@/lib/repos';

/** The free-onboarding allowance bounds documents; a paid tier does not. */
export async function countDocuments(db: Db, orgId: string): Promise<number> {
  const [row] = await db.select({ value: count() }).from(documents).where(eq(documents.orgId, orgId));
  return Number(row?.value ?? 0);
}

/** Seats used = members of the org. Sold on the cards, so it is enforced (MJ-03). */
export async function countSeats(db: Db, orgId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(memberships)
    .where(eq(memberships.orgId, orgId));
  return Number(row?.value ?? 0);
}

/** Vendors that have never sent anything — the most valuable finding, and paid for. */
export async function countVendorsWithoutCertificate(db: Db, orgId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(vendors)
    .where(
      and(eq(vendors.orgId, orgId), isNull(vendors.archivedAt), eq(vendors.status, 'no_certificate')),
    );
  return Number(row?.value ?? 0);
}

// ---------------------------------------------------------------------------
// Subscriptions and the Vendor Pack
// ---------------------------------------------------------------------------

export async function subscriptionRows(db: Db, orgId: string): Promise<Subscription[]> {
  return db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.orgId, orgId))
    .orderBy(desc(subscriptions.createdAt));
}

export async function stripeCustomerIdFor(db: Db, orgId: string): Promise<string | null> {
  const [row] = await db.select().from(customers).where(eq(customers.orgId, orgId)).limit(1);
  return row?.stripeCustomerId ?? null;
}

export type Addon = { packQuantity: number; packPriceId: string | null; status: string | null };

export async function getAddon(db: Db, orgId: string): Promise<Addon> {
  const [row] = await db.select().from(billingAddons).where(eq(billingAddons.orgId, orgId)).limit(1);
  return {
    packQuantity: row?.packQuantity ?? 0,
    packPriceId: row?.packPriceId ?? null,
    status: row?.status ?? null,
  };
}

/**
 * `specs/10` A12 — the Portal sets the quantity, the WEBHOOK writes it here,
 * and `vendorLimit` follows. Quantity is clamped to 0–10 (§9) rather than
 * trusted: an amount is never taken from a client, and a Stripe object we
 * misread should cap out rather than grant an unbounded limit.
 */
export async function setPackQuantity(
  db: Db,
  input: {
    orgId: string;
    quantity: number;
    priceId?: string | null;
    subscriptionId?: string | null;
    status?: string | null;
  },
): Promise<number> {
  const quantity = Math.max(0, Math.min(10, Math.trunc(input.quantity)));
  await db
    .insert(billingAddons)
    .values({
      orgId: input.orgId,
      packQuantity: quantity,
      packPriceId: input.priceId ?? null,
      stripeSubscriptionId: input.subscriptionId ?? null,
      status: input.status ?? null,
    })
    .onConflictDoUpdate({
      target: billingAddons.orgId,
      set: {
        packQuantity: quantity,
        packPriceId: input.priceId ?? null,
        stripeSubscriptionId: input.subscriptionId ?? null,
        status: input.status ?? null,
        updatedAt: new Date(),
      },
    });
  return quantity;
}

// ---------------------------------------------------------------------------
// Trial consent — `specs/10` §3.1.2 and A15
// ---------------------------------------------------------------------------

export type TrialConsentInput = {
  orgId: string;
  userId?: string | null;
  stripeCheckoutSessionId?: string | null;
  /** THE EXACT STRING rendered next to the CTA. Stored verbatim, never rebuilt. */
  disclosureText: string;
  priceId?: string | null;
  firstChargeAt?: Date | null;
  amountCents?: number | null;
  shownAt?: Date | null;
  userAgent?: string | null;
};

/**
 * A15: the consent row and the M9 audit event are written IN ONE TRANSACTION
 * with the caller's other work. If a charge is ever disputed, the record of
 * what the customer was shown exists, dated — and it is the string that was
 * rendered, not a string re-derived at dispute time from today's copy.
 */
export async function recordTrialConsent(
  db: Db,
  input: TrialConsentInput & { actor: AuditActor },
): Promise<string> {
  const id = newId('trialConsent');
  await db.insert(trialConsents).values({
    id,
    orgId: input.orgId,
    userId: input.userId ?? null,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? null,
    disclosureText: input.disclosureText,
    priceId: input.priceId ?? null,
    firstChargeAt: input.firstChargeAt ?? null,
    amountCents: input.amountCents ?? null,
    shownAt: input.shownAt ?? null,
    userAgent: input.userAgent ?? null,
  });

  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'billing.trial_started',
    subjectType: 'org',
    subjectId: input.orgId,
    payload: {
      priceId: input.priceId ?? null,
      firstChargeAt: input.firstChargeAt?.toISOString() ?? null,
      amountCents: input.amountCents ?? null,
      disclosureText: input.disclosureText,
    },
  });

  return id;
}

export async function latestTrialConsent(db: Db, orgId: string) {
  const [row] = await db
    .select()
    .from(trialConsents)
    .where(eq(trialConsents.orgId, orgId))
    .orderBy(desc(trialConsents.acceptedAt))
    .limit(1);
  return row ?? null;
}

/** Idempotency for the webhook: one consent row per Checkout session. */
export async function consentExistsForSession(db: Db, sessionId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: trialConsents.id })
    .from(trialConsents)
    .where(eq(trialConsents.stripeCheckoutSessionId, sessionId))
    .limit(1);
  return Boolean(row);
}
