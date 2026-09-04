/**
 * THE ENTITLEMENT MATRIX — `specs/10` §8.1, as one pure function plus one read.
 *
 * The matrix has six rows and the one that matters most is the first: an
 * organisation with NO SUBSCRIPTION ROW AT ALL. `specs/01` lands a brand-new
 * org on `/onboarding`, `specs/11` never mentions billing, and §9's "every
 * write path checks entitlements" would otherwise fail closed and block every
 * new signup before it reached the thing the product is for (REVIEW.md MJ-10).
 * So `no_subscription` resolves to the FREE-ONBOARDING ALLOWANCE — 25 vendors,
 * 3 documents, unlimited comparisons — and not to a denial.
 *
 * The second thing this file encodes is that LAPSING IS READ-ONLY, NOT
 * LOCK-OUT (`specs/10` §5). The dashboard, every vendor, every certificate,
 * every report and every export stay visible and downloadable. What stops is
 * WRITING and OUTBOUND EMAIL. Holding a customer's compliance record hostage
 * generates chargebacks and one-star reviews rather than revenue, and a visible
 * dashboard full of red is a better upgrade prompt than a paywall.
 *
 * `decide()` is pure so that every row of the matrix is a table test rather
 * than a database fixture (`specs/10` §14).
 */

import {
  countDocuments,
  countSeats,
  countTrackedVendors,
  getAddon,
  stripeCustomerIdFor,
  subscriptionRows,
  type Subscription,
} from '@/lib/repos/billing';
import type { Db } from '@/lib/db';
import {
  DUNNING_GRACE_DAYS,
  TIER_SPECS,
  VENDOR_PACK,
  intervalOf,
  isPackPriceId,
  plans,
  tierOf,
  type Interval,
  type Tier,
} from '@/lib/plans';
import { planForPriceId } from '@octopus/platform/billing';

/** The matrix's own vocabulary — `specs/10` §8.1's left-hand column. */
export type EntitlementRow =
  | 'no_subscription'
  | 'trialing'
  | 'active'
  | 'past_due_grace'
  | 'read_only';

export type CertlyEntitlement = {
  row: EntitlementRow;
  /** `'none'` when there is no subscription; otherwise one of the three tiers. */
  tier: Tier | 'none';
  planName: string;
  interval: Interval | null;
  /** Stripe's own status, or `'none'`. */
  status: string;
  vendorLimit: number;
  baseVendorLimit: number;
  packQuantity: number;
  seatLimit: number;
  /** `-1` is unlimited, by the platform's convention. */
  documentLimit: number;
  vendorsUsed: number;
  seatsUsed: number;
  documentsUsed: number;
  /** Writes: new vendors, new uploads, imports. Reads are NEVER stopped. */
  writesAllowed: boolean;
  readOnly: boolean;
  /** Nothing is sent on a customer's behalf before a card exists (§8.1). */
  remindersEnabled: boolean;
  exportsAllowed: boolean;
  trialing: boolean;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  graceEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
  overLimit: boolean;
  stripeCustomerId: string | null;
  subscriptionId: string | null;
};

export type DecideInput = {
  subscription: {
    status: string;
    priceId: string;
    trialEndsAt: Date | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    /** When the row last changed — the clock the 7-day grace runs on. */
    updatedAt: Date;
    id: string;
  } | null;
  packQuantity: number;
  usage: { vendors: number; seats: number; documents: number };
  now: Date;
  env: Record<string, unknown>;
  stripeCustomerId?: string | null;
};

const FREE = plans.freeLimits;
const freeNumber = (key: string, fallback: number): number => {
  const value = FREE[key];
  return typeof value === 'number' ? value : fallback;
};

function noSubscription(input: DecideInput): CertlyEntitlement {
  return {
    row: 'no_subscription',
    tier: 'none',
    planName: 'Free onboarding',
    interval: null,
    status: input.subscription?.status ?? 'none',
    vendorLimit: freeNumber('vendors', 25),
    baseVendorLimit: freeNumber('vendors', 25),
    packQuantity: 0,
    seatLimit: freeNumber('seats', 1),
    documentLimit: freeNumber('documents', 3),
    vendorsUsed: input.usage.vendors,
    seatsUsed: input.usage.seats,
    documentsUsed: input.usage.documents,
    writesAllowed: true,
    readOnly: false,
    // Nothing goes out on the customer's behalf before a card exists.
    remindersEnabled: false,
    exportsAllowed: FREE['exports'] === true,
    trialing: false,
    trialEndsAt: null,
    currentPeriodEnd: null,
    graceEndsAt: null,
    cancelAtPeriodEnd: false,
    overLimit: input.usage.vendors > freeNumber('vendors', 25),
    stripeCustomerId: input.stripeCustomerId ?? null,
    subscriptionId: input.subscription?.id ?? null,
  };
}

/** The pure half: one row of `specs/10` §8.1 per branch, and no I/O. */
export function decide(input: DecideInput): CertlyEntitlement {
  const sub = input.subscription;
  if (!sub) return noSubscription(input);

  const plan = planForPriceId(plans, sub.priceId, input.env);
  const tier = plan ? tierOf(plan.key) : null;
  // An unrecognised price — a plan the founder created that the code does not
  // know — grants the FREE limits, never unlimited. Fail closed on money.
  if (!tier) return noSubscription(input);

  const spec = TIER_SPECS[tier];
  const base = spec.vendorLimit;
  const packQuantity = Math.max(0, Math.min(VENDOR_PACK.maxQuantity, input.packQuantity));
  const vendorLimit = base + packQuantity * VENDOR_PACK.increment;

  const common = {
    tier,
    planName: spec.name,
    interval: plan ? intervalOf(plan.key) : ('month' as Interval),
    status: sub.status,
    vendorLimit,
    baseVendorLimit: base,
    packQuantity,
    seatLimit: spec.seats,
    documentLimit: -1,
    vendorsUsed: input.usage.vendors,
    seatsUsed: input.usage.seats,
    documentsUsed: input.usage.documents,
    exportsAllowed: true,
    trialEndsAt: sub.trialEndsAt,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    // Downgrading below current usage is allowed and NOTHING IS EVER DELETED
    // for being over-limit (§9); only new vendors are blocked.
    overLimit: input.usage.vendors > vendorLimit,
    stripeCustomerId: input.stripeCustomerId ?? null,
    subscriptionId: sub.id,
  };

  const readOnly: CertlyEntitlement = {
    ...common,
    row: 'read_only',
    writesAllowed: false,
    readOnly: true,
    remindersEnabled: false,
    trialing: false,
    graceEndsAt: null,
  };

  switch (sub.status) {
    case 'trialing':
      return {
        ...common,
        row: 'trialing',
        writesAllowed: true,
        readOnly: false,
        remindersEnabled: true,
        trialing: true,
        graceEndsAt: null,
      };
    case 'active':
      return {
        ...common,
        row: 'active',
        writesAllowed: true,
        readOnly: false,
        remindersEnabled: true,
        trialing: false,
        graceEndsAt: null,
      };
    case 'past_due': {
      // A7: fully writable for a 7-day grace while Stripe retries, then
      // read-only. The clock starts when the row last changed, which is the
      // webhook that told us the payment failed.
      const graceEndsAt = new Date(sub.updatedAt.getTime() + DUNNING_GRACE_DAYS * 86_400_000);
      if (input.now <= graceEndsAt) {
        return {
          ...common,
          row: 'past_due_grace',
          writesAllowed: true,
          readOnly: false,
          remindersEnabled: true,
          trialing: false,
          graceEndsAt,
        };
      }
      return { ...readOnly, graceEndsAt };
    }
    case 'canceled':
      // A8: access continues to the end of the period that was paid for.
      if (sub.currentPeriodEnd && input.now < sub.currentPeriodEnd) {
        return {
          ...common,
          row: 'active',
          writesAllowed: true,
          readOnly: false,
          remindersEnabled: true,
          trialing: false,
          graceEndsAt: null,
        };
      }
      return readOnly;
    case 'unpaid':
      return readOnly;
    case 'paused':
      return readOnly;
    case 'incomplete':
    case 'incomplete_expired':
    default:
      // §8.1's last row: `incomplete` is treated as `no_subscription`.
      return noSubscription({ ...input, subscription: sub });
  }
}

/** Which mirrored row is THE subscription: the newest that resolves to a tier. */
export function tierSubscription(
  rows: Subscription[],
  env: Record<string, unknown>,
): Subscription | null {
  const tiered = rows.filter((row) => {
    if (isPackPriceId(row.priceId, env)) return false;
    const plan = planForPriceId(plans, row.priceId, env);
    return Boolean(plan && tierOf(plan.key));
  });
  const live = tiered.find((row) => ['trialing', 'active', 'past_due'].includes(row.status));
  return live ?? tiered[0] ?? null;
}

export type EntitlementOptions = { now?: Date; env?: Record<string, unknown> };

/** The one read every write path calls. `specs/10` §8's `getEntitlements`. */
export async function certlyEntitlement(
  db: Db,
  orgId: string,
  options: EntitlementOptions = {},
): Promise<CertlyEntitlement> {
  const env = options.env ?? (process.env as unknown as Record<string, unknown>);
  const [rows, addon, vendorsUsed, seatsUsed, documentsUsed, stripeCustomerId] = await Promise.all([
    subscriptionRows(db, orgId),
    getAddon(db, orgId),
    countTrackedVendors(db, orgId),
    countSeats(db, orgId),
    countDocuments(db, orgId),
    stripeCustomerIdFor(db, orgId),
  ]);

  const row = tierSubscription(rows, env);
  return decide({
    subscription: row
      ? {
          id: row.id,
          status: row.status,
          priceId: row.priceId,
          trialEndsAt: row.trialEndsAt,
          currentPeriodEnd: row.currentPeriodEnd,
          cancelAtPeriodEnd: row.cancelAtPeriodEnd,
          updatedAt: row.updatedAt,
        }
      : null,
    packQuantity: addon.packQuantity,
    usage: { vendors: vendorsUsed, seats: seatsUsed, documents: documentsUsed },
    now: options.now ?? new Date(),
    env,
    stripeCustomerId,
  });
}

// ---------------------------------------------------------------------------
// The three questions a write path asks
// ---------------------------------------------------------------------------

export type LimitVerdict =
  | { allowed: true; remaining: number }
  | { allowed: false; reason: 'read_only' | 'vendor_limit' | 'document_limit' | 'seat_limit'; used: number; limit: number };

export function canAddVendors(entitlement: CertlyEntitlement, wanted = 1): LimitVerdict {
  if (!entitlement.writesAllowed) {
    return { allowed: false, reason: 'read_only', used: entitlement.vendorsUsed, limit: entitlement.vendorLimit };
  }
  const remaining = entitlement.vendorLimit - entitlement.vendorsUsed;
  if (remaining < wanted) {
    return { allowed: false, reason: 'vendor_limit', used: entitlement.vendorsUsed, limit: entitlement.vendorLimit };
  }
  return { allowed: true, remaining };
}

export function canAddDocument(entitlement: CertlyEntitlement): LimitVerdict {
  if (!entitlement.writesAllowed) {
    return { allowed: false, reason: 'read_only', used: entitlement.documentsUsed, limit: entitlement.documentLimit };
  }
  if (entitlement.documentLimit < 0) return { allowed: true, remaining: Number.MAX_SAFE_INTEGER };
  const remaining = entitlement.documentLimit - entitlement.documentsUsed;
  if (remaining < 1) {
    return { allowed: false, reason: 'document_limit', used: entitlement.documentsUsed, limit: entitlement.documentLimit };
  }
  return { allowed: true, remaining };
}

export function canAddSeat(entitlement: CertlyEntitlement): LimitVerdict {
  if (!entitlement.writesAllowed) {
    return { allowed: false, reason: 'read_only', used: entitlement.seatsUsed, limit: entitlement.seatLimit };
  }
  const remaining = entitlement.seatLimit - entitlement.seatsUsed;
  if (remaining < 1) {
    return { allowed: false, reason: 'seat_limit', used: entitlement.seatsUsed, limit: entitlement.seatLimit };
  }
  return { allowed: true, remaining };
}

/**
 * A10: an import at the cap fills UP TO the limit and reports the remainder.
 * A 200-row import that fails at row 51 is a lost customer.
 */
export function importAllowance(entitlement: CertlyEntitlement, rows: number): {
  accepted: number;
  overLimit: number;
} {
  if (!entitlement.writesAllowed) return { accepted: 0, overLimit: rows };
  const room = Math.max(0, entitlement.vendorLimit - entitlement.vendorsUsed);
  const accepted = Math.min(rows, room);
  return { accepted, overLimit: rows - accepted };
}
