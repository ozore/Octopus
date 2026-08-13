/**
 * THE PRICE LADDER, AS THE BILLING ENGINE COMPUTES IT.
 *
 * AUTHORITY: D4's four price points, `ARCHITECTURE.md` §16 Challenge 1 (the pricing
 * FUNCTION is "included-filing allowances plus a $2.50 capped overage with
 * auto-upgrade" and "the entitlement engine reads the row; it does not encode a
 * ladder"), `USER_JOURNEY.md` §11.4 ("the upgrade must be defensible as *cheaper for
 * her*, or it is a trap"), §11.7 (no seats, no setup fee, no quote, no call).
 *
 * ===========================================================================
 * WHY THE PRICING PAGE QUERIES THE DATABASE
 *
 * Because the alternative is a marketing page that can be wrong about what we
 * charge. The `plans` table is what `checkout.ts`, `meter.ts` and `entitlement.ts`
 * read; if this page read a constant instead, a catalogue change would move the
 * bill and leave the price list behind, and the customer would find out at the
 * invoice. So every figure below arrives from `loadPlans` and from `assessUsage` —
 * the same function that computes the real charge.
 *
 * THE CAP IS COMPUTED, NOT STATED. "Capped at the next tier's price" has exactly one
 * reading that survives §11.4, and `pricing.ts` implements it: the overage stops at
 * `price(next) − price(current)`, which is the point where staying put stops being
 * cheaper than moving up, and the upgrade fires there. Read the other way — a cap
 * equal to the WHOLE of the next tier's price — a Crew month could reach $848 for
 * something we sell at $599. This module asks the engine rather than restating the
 * phrase, and `tests/web/marketing.test.ts` asserts that the published maximum for
 * a tier equals the next tier's price exactly.
 *
 * ANNUAL. Billed at ten months of the monthly price, so the discount is a
 * multiplication a reader can check rather than a percentage they have to trust.
 */

import { loadPlans } from '@/platform/billing/catalog';
import { RATE_CARD_PRICE_CENTS, RATE_CARD_REFUND_WINDOW_DAYS } from '@/platform/billing/catalog';
import { assessUsage, type PlanRow } from '@/platform/billing/pricing';
import { Cents } from '@/lib/money';
import type { Db } from '@/db';

/** Ten months, per D4. The annual price is a product, not a percentage. */
export const ANNUAL_MONTHS_BILLED = 10;

/**
 * Far enough past the allowance that the engine reports the cap rather than a
 * partial overage. It is an argument to `assessUsage`, never a number we print.
 */
const CAP_PROBE_FILINGS = 100_000;

export interface TierView {
  readonly id: string;
  readonly name: string;
  readonly monthly: string;
  readonly annual: string;
  readonly annualMonthsBilled: number;
  /** `null` means unlimited — the top of the ladder, which has no overage. */
  readonly includedFilings: number | null;
  readonly overagePrice: string | null;
  /** The most overage this tier can accrue before the upgrade fires. */
  readonly overageCap: string | null;
  /** How many filings past the allowance that cap is. */
  readonly overageFilingsToCap: number | null;
  /** The largest possible bill for a month on this tier — equal, by construction,
   *  to the next tier's monthly price. */
  readonly maximumMonthly: string;
  readonly autoUpgradeTo: string | null;
  readonly features: Readonly<Record<string, unknown>>;
}

export interface LadderView {
  readonly tiers: readonly TierView[];
  readonly rateCard: {
    readonly price: string;
    readonly refundWindowDays: number;
  };
}

export function presentTier(plan: PlanRow, next: PlanRow | null): TierView {
  const assessment = assessUsage({
    plan,
    nextPlan: next,
    billableFilings: (plan.includedFilings ?? 0) + CAP_PROBE_FILINGS,
  });

  return {
    id: plan.id,
    name: plan.name,
    monthly: Cents.toDollarString(plan.priceCents),
    annual: Cents.toDollarString(Cents.of(plan.priceCents * ANNUAL_MONTHS_BILLED)),
    annualMonthsBilled: ANNUAL_MONTHS_BILLED,
    includedFilings: plan.includedFilings,
    overagePrice:
      plan.overagePriceCents === null ? null : Cents.toDollarString(plan.overagePriceCents),
    overageCap: assessment.capCents === null ? null : Cents.toDollarString(assessment.capCents),
    overageFilingsToCap: assessment.overageFilingsToCap,
    maximumMonthly: Cents.toDollarString(assessment.periodTotalCents),
    autoUpgradeTo: next?.name ?? null,
    features: plan.features,
  };
}

export function presentLadder(plans: readonly PlanRow[]): LadderView {
  const ordered = [...plans].sort((a, b) => a.priceCents - b.priceCents);
  return {
    tiers: ordered.map((plan, index) => presentTier(plan, ordered[index + 1] ?? null)),
    rateCard: {
      price: Cents.toDollarString(Cents.of(RATE_CARD_PRICE_CENTS)),
      refundWindowDays: RATE_CARD_REFUND_WINDOW_DAYS,
    },
  };
}

export async function readLadder(db: Db): Promise<LadderView> {
  return presentLadder(await loadPlans(db));
}
