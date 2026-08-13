/**
 * The plan catalogue — data, not a ladder in code.
 *
 * Spec: D4's price points ($49 one-time / $99 Solo / $249 Crew / $599 Multi) and
 * ARCHITECTURE.md §16 Challenge 1, which keeps them and changes only the pricing
 * FUNCTION to "included-filing allowances plus a $2.50 capped overage with
 * auto-upgrade", then adds the constraint that makes reverting free: "the
 * entitlement engine reads the row; it does not encode a ladder."
 *
 * `drizzle/0000_init.sql` seeds the four rows with D4's literal caps and leaves
 * `included_filings` and `overage_price_cents` NULL. NULL there means *unlimited,
 * no overage* — the generous reading, deliberately, because an under-specified
 * catalogue must never invent a charge. `ensurePlanCatalog` fills in the allowance
 * columns as an admin process (Twelve-Factor XII), which is exactly the "data change
 * with no code change" §16 promises; the numbers below are the only place they exist
 * and every consumer reads the row.
 *
 * WHERE THE ALLOWANCES COME FROM. A filing is one project-week (D2: "one weekly
 * filing per project per crew"), and a month spans at most five payroll weeks. Solo
 * is one project (5 filings) and Crew is five (25), each with a 1.5× headroom for
 * amendments — an amendment is a NEW filing under ADR-013, so a correction consumes
 * allowance and the headroom is what stops a corrected week from being a surcharge.
 * That gives 8 and 40. Multi is unlimited, which is what makes it the top of the
 * ladder: no next tier, so no overage and no auto-upgrade.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db, type Tx } from '../../db';
import { Cents } from '../../lib/money';
import type { PlanRow } from './pricing';

export const OVERAGE_PRICE_CENTS = 250;

export interface PlanAllowance {
  readonly planId: string;
  readonly includedFilings: number | null;
  readonly overagePriceCents: number | null;
}

/** §16's "one row-set away". Changing this is a data change; nothing branches on a
 *  plan id anywhere in `src/platform`. */
export const PLAN_ALLOWANCES: readonly PlanAllowance[] = [
  { planId: 'solo', includedFilings: 8, overagePriceCents: OVERAGE_PRICE_CENTS },
  { planId: 'crew', includedFilings: 40, overagePriceCents: OVERAGE_PRICE_CENTS },
  { planId: 'multi', includedFilings: null, overagePriceCents: null },
];

/** D4 / J3. One-time, purchasable before an account exists, refundable in full for
 *  14 days with no reason required (§9.3). */
export const RATE_CARD_PRICE_CENTS = 4900;
export const RATE_CARD_REFUND_WINDOW_DAYS = 14;

interface PlanDbRow {
  readonly id: string;
  readonly name: string;
  readonly price_cents: number | string;
  readonly included_filings: number | string | null;
  readonly overage_price_cents: number | string | null;
  readonly auto_upgrade_to: string | null;
  readonly project_cap: number | string | null;
  readonly worker_cap: number | string | null;
  readonly features: Record<string, unknown> | null;
}

function toPlan(row: PlanDbRow): PlanRow {
  return {
    id: row.id,
    name: row.name,
    priceCents: Cents.of(Number(row.price_cents)),
    includedFilings: row.included_filings === null ? null : Number(row.included_filings),
    overagePriceCents:
      row.overage_price_cents === null ? null : Cents.of(Number(row.overage_price_cents)),
    autoUpgradeTo: row.auto_upgrade_to,
    projectCap: row.project_cap === null ? null : Number(row.project_cap),
    workerCap: row.worker_cap === null ? null : Number(row.worker_cap),
    features: row.features ?? {},
  };
}

export async function loadPlans(db: Db | Tx): Promise<readonly PlanRow[]> {
  const result = await db.execute(sql`
    SELECT id, name, price_cents, included_filings, overage_price_cents,
           auto_upgrade_to, project_cap, worker_cap, features
      FROM plans ORDER BY price_cents ASC
  `);
  return rowsOf<PlanDbRow>(result).map(toPlan);
}

export async function loadPlan(db: Db | Tx, planId: string | null): Promise<PlanRow | null> {
  if (!planId) return null;
  const plans = await loadPlans(db);
  return plans.find((p) => p.id === planId) ?? null;
}

/** The tier a plan auto-upgrades into, or `null` at the top. */
export function nextPlan(plans: readonly PlanRow[], plan: PlanRow): PlanRow | null {
  if (!plan.autoUpgradeTo) return null;
  return plans.find((p) => p.id === plan.autoUpgradeTo) ?? null;
}

/**
 * Apply `PLAN_ALLOWANCES`. Idempotent, and it never overwrites a value already set
 * — an operator who changed an allowance in the database meant it, and a boot that
 * silently reverted it would be the product arguing with its own catalogue.
 */
export async function ensurePlanCatalog(db: Db | Tx): Promise<void> {
  for (const allowance of PLAN_ALLOWANCES) {
    await db.execute(sql`
      UPDATE plans
         SET included_filings = COALESCE(included_filings, ${allowance.includedFilings}),
             overage_price_cents = COALESCE(overage_price_cents, ${allowance.overagePriceCents})
       WHERE id = ${allowance.planId}
    `);
  }
}

/**
 * The price id for a plan, from config. Kept here so `checkout.ts` never has a
 * literal price id and a staging environment differs by env var alone
 * (Twelve-Factor III).
 */
export function stripePriceFor(
  planId: string,
  config: {
    readonly STRIPE_PRICE_SOLO: string;
    readonly STRIPE_PRICE_CREW: string;
    readonly STRIPE_PRICE_MULTI: string;
  },
): string | null {
  switch (planId) {
    case 'solo':
      return config.STRIPE_PRICE_SOLO;
    case 'crew':
      return config.STRIPE_PRICE_CREW;
    case 'multi':
      return config.STRIPE_PRICE_MULTI;
    default:
      return null;
  }
}

export function planIdForPrice(
  priceId: string | null,
  config: {
    readonly STRIPE_PRICE_SOLO: string;
    readonly STRIPE_PRICE_CREW: string;
    readonly STRIPE_PRICE_MULTI: string;
  },
): string | null {
  if (!priceId) return null;
  if (priceId === config.STRIPE_PRICE_SOLO) return 'solo';
  if (priceId === config.STRIPE_PRICE_CREW) return 'crew';
  if (priceId === config.STRIPE_PRICE_MULTI) return 'multi';
  return null;
}
