/**
 * The one-off purchases — State Entry Packs — and the credit that makes the
 * godfather offer honest. `specs/09` rows 7–10, `specs/08`, `OFFER.md` §6.3.
 *
 * THREE RULES, EACH OF WHICH IS A HOLE SOMEONE HAS FALLEN THROUGH:
 *
 *  1. **The gap disclosure happens BEFORE the Checkout session is created**
 *     (`specs/08` AC5b). `createOneOffCheckout` refuses unless the caller has
 *     passed back the gap count it was shown, so "we told them on page one"
 *     cannot become "we meant to". A pack whose state is not `entryPackReady`
 *     is not purchasable at all — Florida shows "in preparation" and takes no
 *     money (`BUILD.md` D3).
 *  2. **`once_per_customer=true` on the $750 first-state price is enforced HERE,
 *     not in Stripe.** Stripe has no such constraint; the app is the only place
 *     that can hold it.
 *  3. **One credit per customer, whichever is LARGER — never two.** Wave-1b
 *     **M7** found the $899-off-a-$3,490-plan hole in the stacked version. The
 *     partial unique index on `plan_credits(org_id) where status='pending'`
 *     makes it structural: a second pending credit cannot be written, and a
 *     larger one replaces the smaller rather than joining it.
 *
 * The credit MECHANISM is `REVIEW.md` Q8 and it is open. The default this app
 * implements is the documented one — a **Stripe customer balance credit applied
 * by the app** — and because the platform's billing port has no balance-credit
 * method yet (`REQUESTS.md` P-6), what the app does today is record the credit,
 * show it to the customer, and hand the founder an exact instruction. Nothing
 * is invented in Stripe and nothing is silently forgotten.
 */

import { and, desc, eq, isNull, or } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';
import type { Adapters } from '@octopus/platform/adapters';
import { newId } from '@octopus/platform';
import { track } from '@octopus/platform/events';

import { recordAudit } from '../repos/audit';

import { entryPackReadiness, getKbRecord } from '../kb/accessors';
import type { Trade } from '../kb/types';
import { oneOffPurchases, planCredits, playbooks } from '../schema';
import { ONE_OFF_SKUS, priceIdForSku, type OneOffSku } from './prices';

/** `credit_window_days=90` on line 7 of the canonical table. */
export const CREDIT_WINDOW_DAYS = 90;
/** The godfather price is the only SKU that earns a credit. */
export const CREDIT_EARNING_SKUS: readonly OneOffSku[] = ['entry_pack_first'];
/** …and it credits against an ANNUAL plan only (`credits_against=annual`). */
export const CREDIT_APPLIES_TO_INTERVAL = 'year' as const;

export type PackReadiness = {
  purchasable: boolean;
  reason: string | null;
  /** What the board does not publish — named on page one, before the card. */
  disclosedGaps: string[];
  needsCheckCount: number;
};

/**
 * The gate. `specs/08` AC5 gives an uncovered state and a not-ready state the
 * same treatment, so this answers one shape for both.
 */
export function entryPackGate(state: string, trade: Trade, today: string): PackReadiness {
  const record = getKbRecord(state, trade);
  if (!record) {
    return {
      purchasable: false,
      reason: `We do not hold ${state} ${trade} yet. We will not sell a document we would have to guess at.`,
      disclosedGaps: [],
      needsCheckCount: 0,
    };
  }
  const readiness = entryPackReadiness(record, today);
  return {
    purchasable: readiness.ready,
    reason: readiness.ready
      ? null
      : `${state} ${trade} is in preparation: ${readiness.missingCore.length} requirement${readiness.missingCore.length === 1 ? '' : 's'} the board has not published, or we have not verified, would have to be left blank.`,
    disclosedGaps: readiness.disclosedGaps,
    needsCheckCount: readiness.disclosedGaps.length,
  };
}

export class EntryPackNotPurchasableError extends Error {
  readonly code = 'not_purchasable';
  constructor(message: string) {
    super(message);
    this.name = 'EntryPackNotPurchasableError';
  }
}

export class GapDisclosureError extends Error {
  readonly code = 'gaps_not_disclosed';
  constructor(message: string) {
    super(message);
    this.name = 'GapDisclosureError';
  }
}

export type OneOffCheckoutInput = {
  orgId: string;
  userId?: string | null;
  email?: string | undefined;
  sku: OneOffSku;
  /** The state × trade the pack is for; absent for the 3-state bundle. */
  state?: string;
  trade?: Trade;
  /** The gap count the purchase screen SHOWED. It must match what we compute. */
  acknowledgedGapCount?: number;
  playbookId?: string | null;
  quantity?: number;
  today: string;
  successPath?: string;
  cancelPath?: string;
};

export type OneOffCheckoutResult =
  | { status: 'ok'; url: string; sessionId: string; purchaseId: string }
  | { status: 'price_not_configured'; envVar: string }
  | { status: 'not_purchasable'; reason: string }
  | { status: 'already_purchased'; reason: string };

async function firstStateAlreadyBought(db: Db, orgId: string): Promise<boolean> {
  const rows = await db
    .select({ id: oneOffPurchases.id })
    .from(oneOffPurchases)
    .where(
      and(
        eq(oneOffPurchases.orgId, orgId),
        eq(oneOffPurchases.sku, 'entry_pack_first'),
        or(eq(oneOffPurchases.status, 'paid'), eq(oneOffPurchases.status, 'pending')),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function createOneOffCheckout(
  ctx: { db: Db; adapters: Adapters; env: Record<string, unknown> & { APP_BASE_URL: string } },
  input: OneOffCheckoutInput,
): Promise<OneOffCheckoutResult> {
  const { db } = ctx;
  const sku = ONE_OFF_SKUS[input.sku];

  // (1) The readiness gate and the gap disclosure, BEFORE anything is created.
  if (input.state && input.trade) {
    const gate = entryPackGate(input.state, input.trade, input.today);
    if (!gate.purchasable) return { status: 'not_purchasable', reason: gate.reason ?? 'not purchasable' };
    if (input.acknowledgedGapCount !== gate.needsCheckCount) {
      throw new GapDisclosureError(
        `The purchase screen showed ${input.acknowledgedGapCount ?? 0} disclosed gaps and this pack has ${gate.needsCheckCount}. The gaps are disclosed before the card, or not at all.`,
      );
    }
  }

  // (2) once_per_customer, enforced in the app because Stripe cannot.
  if (input.sku === 'entry_pack_first' && (await firstStateAlreadyBought(db, input.orgId))) {
    return {
      status: 'already_purchased',
      reason: 'The $750 first-state price is once per customer. Your next state is the list price.',
    };
  }

  const priceId = priceIdForSku(input.sku, ctx.env);
  if (!priceId) return { status: 'price_not_configured', envVar: sku.envVar };

  const purchaseId = newId('oop');
  const quantity = input.quantity ?? 1;
  const customer = await ctx.adapters.billing.ensureCustomer({
    orgId: input.orgId,
    ...(input.email ? { email: input.email } : {}),
  });

  const session = await ctx.adapters.billing.createCheckoutSession({
    orgId: input.orgId,
    // The port's `planKey` is a label on a Checkout line; a one-off carries its
    // SKU there so the mock page and the webhook both read one field.
    planKey: input.sku,
    priceId,
    quantity,
    customerId: customer.id,
    ...(input.email ? { customerEmail: input.email } : {}),
    successUrl: `${ctx.env.APP_BASE_URL}${input.successPath ?? '/expansion?purchase=success'}`,
    cancelUrl: `${ctx.env.APP_BASE_URL}${input.cancelPath ?? '/expansion?purchase=cancelled'}`,
    metadata: {
      org_id: input.orgId,
      kind: 'one_off',
      sku: input.sku,
      purchase_id: purchaseId,
      ...(input.playbookId ? { playbook_id: input.playbookId } : {}),
    },
  });

  await db.insert(oneOffPurchases).values({
    id: purchaseId,
    orgId: input.orgId,
    // `playbook` is the only kind a code path can write. `first_state_audit`
    // stays dormant (D1, `specs/09` AC9).
    kind: 'playbook',
    sku: input.sku,
    playbookId: input.playbookId ?? null,
    amountCents: sku.amountCents * quantity,
    status: 'pending',
  });

  await track(db, {
    name: 'checkout_started',
    orgId: input.orgId,
    userId: input.userId ?? null,
    props: { sku: input.sku, one_off: true, session_id: session.id },
  });

  return { status: 'ok', url: session.url, sessionId: session.id, purchaseId };
}

/**
 * The webhook side: a one-off that Stripe says is paid. Idempotent on the
 * purchase id, because Stripe retries.
 */
export async function recordOneOffPaid(
  db: Db,
  input: {
    orgId: string;
    purchaseId?: string | null;
    sku?: string | null;
    paymentIntentId?: string | null;
    amountCents?: number | null;
    playbookId?: string | null;
    now?: Date;
  },
): Promise<{ purchaseId: string | null; creditCents: number }> {
  const now = input.now ?? new Date();
  let purchaseId = input.purchaseId ?? null;

  if (purchaseId) {
    await db
      .update(oneOffPurchases)
      .set({
        status: 'paid',
        stripePaymentIntentId: input.paymentIntentId ?? null,
        ...(input.amountCents ? { amountCents: input.amountCents } : {}),
      })
      .where(and(eq(oneOffPurchases.id, purchaseId), eq(oneOffPurchases.orgId, input.orgId)));
  } else if (input.paymentIntentId) {
    const [row] = await db
      .select({ id: oneOffPurchases.id })
      .from(oneOffPurchases)
      .where(eq(oneOffPurchases.stripePaymentIntentId, input.paymentIntentId))
      .limit(1);
    purchaseId = row?.id ?? null;
  }

  const [purchase] = purchaseId
    ? await db.select().from(oneOffPurchases).where(eq(oneOffPurchases.id, purchaseId)).limit(1)
    : [];

  if (purchase?.playbookId) {
    await db
      .update(playbooks)
      .set({ status: 'paid', stripePaymentIntentId: input.paymentIntentId ?? null })
      .where(eq(playbooks.id, purchase.playbookId));
  }

  await track(db, {
    name: 'playbook_purchased',
    orgId: input.orgId,
    props: { sku: purchase?.sku ?? input.sku ?? 'entry_pack', amount_cents: purchase?.amountCents ?? 0 },
  });

  const sku = (purchase?.sku ?? input.sku ?? '') as OneOffSku;
  if (!CREDIT_EARNING_SKUS.includes(sku)) return { purchaseId, creditCents: 0 };

  const amount = purchase?.amountCents ?? ONE_OFF_SKUS[sku].amountCents;
  await grantCredit(db, {
    orgId: input.orgId,
    sku,
    amountCents: amount,
    sourcePurchaseId: purchaseId,
    now,
  });
  return { purchaseId, creditCents: amount };
}

/**
 * ONE pending credit per customer, and it is the larger of the two. Never two —
 * the shipped version of wave-1b **M7**.
 */
export async function grantCredit(
  db: Db,
  input: { orgId: string; sku: string; amountCents: number; sourcePurchaseId?: string | null; now?: Date },
): Promise<void> {
  const now = input.now ?? new Date();
  const expiresAt = new Date(now.getTime() + CREDIT_WINDOW_DAYS * 86_400_000);

  const [existing] = await db
    .select()
    .from(planCredits)
    .where(and(eq(planCredits.orgId, input.orgId), eq(planCredits.status, 'pending')))
    .limit(1);

  if (existing) {
    if (input.amountCents > existing.amountCents) {
      await db
        .update(planCredits)
        .set({
          sku: input.sku,
          amountCents: input.amountCents,
          expiresAt,
          sourcePurchaseId: input.sourcePurchaseId ?? existing.sourcePurchaseId,
        })
        .where(eq(planCredits.id, existing.id));
    }
    return;
  }

  await db
    .insert(planCredits)
    .values({
      id: newId('crd'),
      orgId: input.orgId,
      sku: input.sku,
      amountCents: input.amountCents,
      sourcePurchaseId: input.sourcePurchaseId ?? null,
      expiresAt,
      status: 'pending',
    })
    .onConflictDoNothing();
}

/** What the customer would get off their first annual invoice, today. */
export async function pendingCredit(db: Db, orgId: string, now = new Date()) {
  const rows = await db
    .select()
    .from(planCredits)
    .where(and(eq(planCredits.orgId, orgId), eq(planCredits.status, 'pending')))
    .orderBy(desc(planCredits.amountCents))
    .limit(1);
  const credit = rows[0];
  if (!credit) return null;
  if (credit.expiresAt.getTime() < now.getTime()) return { ...credit, expired: true };
  return { ...credit, expired: false };
}

/**
 * Applied against an annual plan taken inside the window. The credit is a fact
 * with a target: what it was applied to, and when, is the audit trail the
 * founder needs when Stripe's balance and our mirror are compared.
 */
export async function applyCreditToSubscription(
  db: Db,
  input: { orgId: string; planKey: string; interval: string; subscriptionId: string; now?: Date },
): Promise<{ applied: boolean; amountCents: number; reason?: string }> {
  const now = input.now ?? new Date();
  const credit = await pendingCredit(db, input.orgId, now);
  if (!credit) return { applied: false, amountCents: 0, reason: 'no_credit' };

  if (credit.expired) {
    await db.update(planCredits).set({ status: 'expired' }).where(eq(planCredits.id, credit.id));
    return { applied: false, amountCents: 0, reason: 'expired' };
  }
  if (input.interval !== CREDIT_APPLIES_TO_INTERVAL) {
    // Not an error: the credit is still there, waiting for an annual plan.
    return { applied: false, amountCents: 0, reason: 'monthly_plan' };
  }

  await db
    .update(planCredits)
    .set({
      status: 'applied',
      appliedAt: now,
      appliedToSubscriptionId: input.subscriptionId,
      appliedPlanKey: input.planKey,
    })
    .where(and(eq(planCredits.id, credit.id), isNull(planCredits.appliedAt)));

  // Audit, not events: `specs/13` AC1 asserts the emitted event set equals the
  // documented one, and a credit against an invoice is an audit fact anyway —
  // it is what the founder reconciles against Stripe's customer balance.
  await recordAudit(db, {
    orgId: input.orgId,
    action: 'entry_pack_credit_applied',
    entityTable: 'plan_credits',
    entityId: credit.id,
    after: { amountCents: credit.amountCents, planKey: input.planKey, sku: credit.sku, subscriptionId: input.subscriptionId },
  });

  return { applied: true, amountCents: credit.amountCents };
}

export async function listOneOffPurchases(db: Db, orgId: string) {
  return db
    .select()
    .from(oneOffPurchases)
    .where(eq(oneOffPurchases.orgId, orgId))
    .orderBy(desc(oneOffPurchases.createdAt));
}
