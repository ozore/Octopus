/**
 * WL-09 V4 · **The single function every gated action calls.**
 *
 * The platform answers "what plan is this organisation on" from our mirror of
 * Stripe (never from Stripe at render time). This module answers the product's
 * question on top of it — *may this organisation create a payroll, certify one,
 * read its history, export it* — so that no screen re-implements the rule and
 * no screen reads `subscriptions.status` for itself. `tests/billing.test.ts`
 * greps for that.
 *
 * Three rules that are not obvious and are each here because getting them wrong
 * is expensive:
 *
 *  - **`past_due` keeps full access for seven days** (V5). A card expiring must
 *    not stop a federal filing deadline; Stripe is still retrying and the
 *    dunning mail is still going out.
 *  - **Cancelling leaves 30 days of read-only access** (V6). Taking away an
 *    audit trail the day a card fails is the most damaging thing this product
 *    could do — the contractor's three-year retention obligation does not end
 *    because their subscription did.
 *  - **A limit never blocks a certification that is already in progress** (V11).
 *    Exceeding a tier's project or worker cap prompts an upgrade; it does not
 *    stand between a contractor and Friday.
 */

import { desc, eq } from 'drizzle-orm';

import type { Db } from '@octopus/platform/db';
import { subscriptions } from '@octopus/platform/db';
import {
  getEntitlement as getPlatformEntitlement,
  limitOf,
  withinLimit,
  type Entitlement,
  type PlanMap,
} from '@octopus/platform/billing';

/** V5 — Stripe retries for days; so do we. */
export const PAST_DUE_GRACE_DAYS = 7;
/** V6 — history and exports stay readable after cancellation. */
export const READ_ONLY_DAYS_AFTER_CANCEL = 30;

export type ProductEntitlement = {
  entitlement: Entitlement;
  canCreatePayroll: boolean;
  canCertify: boolean;
  canRead: boolean;
  canExport: boolean;
  /** Machine-readable, for `paywall_shown {blocked_action}` and for copy. */
  reason:
    | 'active'
    | 'trialing'
    | 'grace'
    | 'grace_expired'
    | 'read_only'
    | 'read_only_expired'
    | 'no_subscription';
  readOnlyUntil?: Date;
  trialEndsAt?: Date;
  /** V16b's trigger, and the trial banner's. */
  daysUntilTrialEnds?: number;
};

/**
 * The ONE place `subscriptions` is read for a gating decision. Everything else
 * asks this function.
 */
export async function productEntitlement(
  db: Db,
  orgId: string,
  options: { plans: PlanMap; env: Record<string, unknown>; now?: Date },
): Promise<ProductEntitlement> {
  const now = options.now ?? new Date();
  const entitlement = await getPlatformEntitlement(db, orgId, {
    plans: options.plans,
    env: options.env,
  });

  const [latest] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.orgId, orgId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const trialEndsAt = entitlement.trialEndsAt ?? undefined;
  const daysUntilTrialEnds = trialEndsAt
    ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 3600 * 1000))
    : undefined;

  // --- live subscription -------------------------------------------------
  if (entitlement.active) {
    if (entitlement.inGrace) {
      const since = latest?.updatedAt ?? latest?.createdAt ?? now;
      const graceEnds = new Date(since.getTime() + PAST_DUE_GRACE_DAYS * 24 * 3600 * 1000);
      const inGrace = now <= graceEnds;
      return {
        entitlement,
        canCreatePayroll: inGrace,
        canCertify: inGrace,
        canRead: true,
        canExport: inGrace && Boolean(limitOf(entitlement, 'exports', false)),
        reason: inGrace ? 'grace' : 'grace_expired',
        ...(trialEndsAt ? { trialEndsAt } : {}),
        ...(daysUntilTrialEnds !== undefined ? { daysUntilTrialEnds } : {}),
      };
    }
    return {
      entitlement,
      canCreatePayroll: true,
      canCertify: true,
      canRead: true,
      canExport: Boolean(limitOf(entitlement, 'exports', false)),
      reason: entitlement.trialing ? 'trialing' : 'active',
      ...(trialEndsAt ? { trialEndsAt } : {}),
      ...(daysUntilTrialEnds !== undefined ? { daysUntilTrialEnds } : {}),
    };
  }

  // --- cancelled: 30 days of read-only ------------------------------------
  if (latest?.canceledAt) {
    const readOnlyUntil = new Date(
      latest.canceledAt.getTime() + READ_ONLY_DAYS_AFTER_CANCEL * 24 * 3600 * 1000,
    );
    const stillReadable = now <= readOnlyUntil;
    return {
      entitlement,
      canCreatePayroll: false,
      canCertify: false,
      canRead: stillReadable,
      // Reading and EXPORTING both stay available: an export is how a
      // contractor meets a retention obligation that outlives us.
      canExport: stillReadable,
      reason: stillReadable ? 'read_only' : 'read_only_expired',
      readOnlyUntil,
    };
  }

  // --- before the card ----------------------------------------------------
  // `freeLimits` is the pre-card ALLOWANCE, not a free tier: one project may be
  // set up so the buyer sees her own determination, and `exports: false` means
  // nothing can be filed.
  return {
    entitlement,
    canCreatePayroll: true,
    canCertify: false,
    canRead: true,
    canExport: false,
    reason: 'no_subscription',
  };
}

/** The copy each refusal shows. One sentence, and it always says what to do. */
export function paywallMessage(entitlement: ProductEntitlement): string {
  switch (entitlement.reason) {
    case 'grace_expired':
      return 'Your last payment did not go through and the 7-day grace period has passed. Update the card in billing and this unblocks immediately.';
    case 'read_only':
      return `Your subscription is cancelled. Your payrolls and exports stay readable until ${entitlement.readOnlyUntil?.toISOString().slice(0, 10)}; certifying a new one needs an active subscription.`;
    case 'read_only_expired':
      return 'Your subscription is cancelled and the 30-day read-only window has passed. Resubscribe to open your archive again.';
    case 'no_subscription':
      return 'Certifying a payroll needs a card on file. The rate lookup stays free.';
    default:
      return '';
  }
}

export { limitOf, withinLimit };
export type { Entitlement };
