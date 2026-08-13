/**
 * Metering — the one place a filing becomes money.
 *
 * Spec: ARCHITECTURE.md §9.5 — "A `meter_event` is posted when a filing reaches
 * CERTIFIABLE or CERTIFIABLE_DATED. **`DRAFT — NOT CERTIFIABLE` is never billed**:
 * we do not charge for the artifact we told you not to sign." §3.6 — "the meter
 * event is posted by the worker AFTER the filing transaction commits, keyed on
 * `filing_id`, so a retry cannot double-bill." §5.1 consequence 2 — a filing blocked
 * by our own missing input "is not billable, so a customer is never charged for a
 * filing our own missing input blocked."
 *
 * THE GUARD IS THE DATABASE, NOT THE CALLER. `meter_events` carries a unique index
 * on `filing_id` and a unique `idempotency_key`, so the insert either wins or
 * conflicts; only the winner calls Stripe, and the Stripe call carries the same key.
 * A crash between the two leaves a row with no `stripe_event_id`, which the next run
 * picks up — a missing meter event is a lost dollar, a duplicated one is a customer
 * charged twice for a document they filed once, and only one of those is recoverable
 * without a conversation this company cannot have.
 *
 * The engine is not allowed to reach this module (§3.6): "the engine must not be
 * able to decide whether a filing is billable, only whether it is certifiable."
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db, type Tx } from '../../db';
import { withTenant } from '../../db/tenant';
import { accountId as brandAccountId } from '../../db/tenant';
import type { ArtifactStatus } from '../../lib/types';
import { systemClock, type Clock } from '../clock';
import { readBillingAccount, recordPlanChange, type BillingAccount } from './account';
import { loadPlan, loadPlans, nextPlan } from './catalog';
import type { StripeGateway } from './gateway';
import { assessUsage, autoUpgradeNotice, type UsageAssessment } from './pricing';

export const METER_EVENT_NAME = 'ratepin_certified_filing';

/** The two statuses that bill. Written once, exported, and asserted in the suite —
 *  so "is a dated filing billable?" is answered by a constant rather than by a
 *  condition someone retypes at each call site. */
export const BILLABLE_STATUSES: readonly ArtifactStatus[] = ['CERTIFIABLE', 'CERTIFIABLE_DATED'];

export type MeterOutcome =
  | { readonly billed: true; readonly meterEventId: number; readonly duplicate: boolean }
  | {
      readonly billed: false;
      readonly reason: 'not_found' | 'not_released' | 'not_certifiable' | 'no_customer';
    };

interface FilingRow {
  readonly id: string;
  readonly artifact_status: ArtifactStatus;
  readonly state: string;
  readonly released_at: string | Date | null;
}

/**
 * Post one filing's meter event. Idempotent on `filing_id` in three independent
 * places: the unique index, the `idempotency_key`, and Stripe's own meter-event
 * `identifier`.
 */
export async function meterFiling(
  db: Db,
  input: { readonly accountId: string; readonly filingId: string },
  deps: { readonly stripe: StripeGateway; readonly clock?: Clock },
): Promise<MeterOutcome> {
  const clock = deps.clock ?? systemClock;
  const account = brandAccountId(input.accountId);

  const filing = await withTenant(db, { accountId: account }, async (tx) => {
    const result = await tx.execute(sql`
      SELECT id, artifact_status, state, released_at
        FROM filings WHERE id = ${input.filingId}::uuid
    `);
    return rowsOf<FilingRow>(result)[0] ?? null;
  });

  if (!filing) return { billed: false, reason: 'not_found' };

  // A DRAFT never bills. This is the check, and it is a `.includes` over an exported
  // constant precisely so the test can enumerate the status union and assert that
  // exactly one member is excluded.
  if (!BILLABLE_STATUSES.includes(filing.artifact_status)) {
    return { billed: false, reason: 'not_certifiable' };
  }
  if (filing.state !== 'RELEASED' || filing.released_at === null) {
    return { billed: false, reason: 'not_released' };
  }

  const billing = await readBillingAccount(db, input.accountId);
  const idempotencyKey = meterIdempotencyKey(input.filingId);

  const inserted = await withTenant(db, { accountId: account }, async (tx) => {
    const result = await tx.execute(sql`
      INSERT INTO meter_events (account_id, filing_id, at, quantity, idempotency_key)
      VALUES (${input.accountId}::uuid, ${input.filingId}::uuid,
              ${clock.now().toISOString()}::timestamptz, 1, ${idempotencyKey})
      ON CONFLICT (filing_id) DO NOTHING
      RETURNING id
    `);
    return rowsOf<{ id: number | string }>(result)[0] ?? null;
  });

  if (!inserted) {
    const existing = await withTenant(db, { accountId: account }, async (tx) => {
      const result = await tx.execute(sql`
        SELECT id FROM meter_events WHERE filing_id = ${input.filingId}::uuid
      `);
      return rowsOf<{ id: number | string }>(result)[0] ?? null;
    });
    return { billed: true, meterEventId: Number(existing?.id ?? 0), duplicate: true };
  }

  // The free tier has no Stripe customer. The row is still written — the count is
  // how the product knows what it produced — and nothing is posted.
  if (!billing?.stripeCustomerId) {
    return { billed: true, meterEventId: Number(inserted.id), duplicate: false };
  }

  const posted = await deps.stripe.postMeterEvent({
    eventName: METER_EVENT_NAME,
    customerId: billing.stripeCustomerId,
    quantity: 1,
    identifier: input.filingId,
  });

  await withTenant(db, { accountId: account }, async (tx) => {
    await tx.execute(sql`
      UPDATE meter_events SET stripe_event_id = ${posted.id}
       WHERE filing_id = ${input.filingId}::uuid
    `);
  });

  return { billed: true, meterEventId: Number(inserted.id), duplicate: false };
}

export function meterIdempotencyKey(filingId: string): string {
  return `meter:${filingId}`;
}

/** Filings billed in the current period. Counted from `meter_events`, which is what
 *  was actually posted, rather than from `filings`, which is what was produced. */
export async function billableFilingsInPeriod(
  db: Db,
  account: string,
  period: { readonly from: Date; readonly to: Date },
): Promise<number> {
  return withTenant(db, { accountId: brandAccountId(account) }, async (tx) => {
    const result = await tx.execute(sql`
      SELECT COUNT(*)::int AS n FROM meter_events
       WHERE account_id = ${account}::uuid
         AND at >= ${period.from.toISOString()}::timestamptz
         AND at <  ${period.to.toISOString()}::timestamptz
    `);
    return Number(rowsOf<{ n: number }>(result)[0]?.n ?? 0);
  });
}

export interface CapOutcome {
  readonly assessment: UsageAssessment | null;
  readonly upgraded: boolean;
  readonly notice: string | null;
  /** Why no upgrade happened, when the cap was reached and one did not. `null` when
   *  the question does not arise. Recorded in the job ledger, so "the cap job ran and
   *  the customer had already chosen her plan" and "the cap job did nothing" are
   *  different rows. */
  readonly skipped?: 'already_upgraded_this_period' | 'customer_reverted_this_period';
}

/**
 * What this account has already decided this period.
 *
 * `enforceOverageCap` runs hourly and `account.planId` only moves when Stripe's
 * `customer.subscription.updated` webhook lands, so an unguarded job re-read the old
 * plan, re-computed `atCap` and called Stripe again — a second and third proration on
 * one subscription for one crossing. Worse, it also re-fired after the customer used
 * the one-click revert §11.4 calls the difference between a service and a fait
 * accompli: within the hour she was back on the larger plan, with a fourth proration,
 * and there was no state she could reach in which she stayed on the plan she chose.
 *
 * So the job asks the ledger rather than the plan column. Both answers are read in
 * one query and both are period-scoped, because the cap is a per-period quantity.
 */
async function planDecisionsThisPeriod(
  db: Db,
  account: string,
  period: { readonly from: Date; readonly to: Date },
): Promise<{ readonly autoUpgraded: boolean; readonly reverted: boolean }> {
  return withTenant(db, { accountId: brandAccountId(account) }, async (tx) => {
    const row = rowsOf<{ auto_upgrades: number | string; reverts: number | string }>(
      await tx.execute(sql`
        SELECT COUNT(*) FILTER (WHERE kind = 'auto_upgrade')::int AS auto_upgrades,
               COUNT(*) FILTER (WHERE kind = 'revert')::int       AS reverts
          FROM plan_changes
         WHERE account_id = ${account}::uuid
           AND at >= ${period.from.toISOString()}::timestamptz
           AND at <  ${period.to.toISOString()}::timestamptz
      `),
    )[0];
    return {
      autoUpgraded: Number(row?.auto_upgrades ?? 0) > 0,
      reverted: Number(row?.reverts ?? 0) > 0,
    };
  });
}

/** The key the upgrade is claimed under. One crossing, one proration, whatever the
 *  scheduler does — the same shape `credits.ts` and `refunds.ts` already use. */
export function overageUpgradeKey(input: {
  readonly accountId: string;
  readonly periodStart: Date;
  readonly fromPlanId: string;
}): string {
  return `overage:${input.accountId}:${input.periodStart.toISOString()}:${input.fromPlanId}`;
}

/**
 * The overage cap and the automatic upgrade (§9.5, USER_JOURNEY §11.4).
 *
 * Two announcements and one action, in the order the customer meets them: a warning
 * at 80% of the cap, the upgrade at the cap, and a `plan_changes` row that the
 * one-click revert reads. The upgrade is performed against Stripe with proration,
 * because the customer is moving mid-period and the alternative is charging her a
 * full second month for the days she has already paid for.
 */
export async function enforceOverageCap(
  db: Db,
  account: BillingAccount,
  deps: { readonly stripe: StripeGateway; readonly clock?: Clock; readonly priceIdFor: (planId: string) => string | null },
): Promise<CapOutcome> {
  const clock = deps.clock ?? systemClock;
  if (!account.planId || !account.currentPeriodStart || !account.currentPeriodEnd) {
    return { assessment: null, upgraded: false, notice: null };
  }

  const plans = await loadPlans(db);
  const plan = plans.find((p) => p.id === account.planId);
  if (!plan) return { assessment: null, upgraded: false, notice: null };
  const next = nextPlan(plans, plan);

  const billableFilings = await billableFilingsInPeriod(db, account.accountId, {
    from: account.currentPeriodStart,
    to: account.currentPeriodEnd,
  });

  const assessment = assessUsage({ plan, nextPlan: next, billableFilings });
  if (!assessment.atCap || !next) return { assessment, upgraded: false, notice: null };

  // THE TWO GUARDS, BEFORE STRIPE IS TOUCHED.
  //
  // Idempotency: one crossing produces one proration, however many times the hourly
  // job runs before the subscription webhook lands.
  //
  // Consent: an account that used the revert button this period keeps the plan she
  // chose for the rest of it. Re-upgrading her within the hour is not a service; it
  // is the automatic change §11.4 exists to make undoable, undone.
  const decided = await planDecisionsThisPeriod(db, account.accountId, {
    from: account.currentPeriodStart,
    to: account.currentPeriodEnd,
  });
  if (decided.reverted) {
    return { assessment, upgraded: false, notice: null, skipped: 'customer_reverted_this_period' };
  }
  if (decided.autoUpgraded) {
    return { assessment, upgraded: false, notice: null, skipped: 'already_upgraded_this_period' };
  }

  const priceId = deps.priceIdFor(next.id);
  if (!priceId || !account.stripeCustomerId) return { assessment, upgraded: false, notice: null };

  const subscription = await currentSubscriptionId(db, account.accountId);
  if (!subscription) return { assessment, upgraded: false, notice: null };

  // The ledger row is written BEFORE the Stripe call, under the period key, exactly
  // as `credits.ts:170` and `refunds.ts:139` claim before they move money: a crash
  // between the two leaves a recorded intent and no charge, which the next run
  // declines to repeat. The reverse order leaves a charge nothing recorded.
  await recordPlanChange(
    db,
    {
      accountId: account.accountId,
      fromPlanId: plan.id,
      toPlanId: next.id,
      kind: 'auto_upgrade',
      effectiveAt: clock.now(),
      detail: {
        billable_filings: assessment.billableFilings,
        overage_filings: assessment.overageFilings,
        cap_cents: assessment.capCents,
        idempotency_key: overageUpgradeKey({
          accountId: account.accountId,
          periodStart: account.currentPeriodStart,
          fromPlanId: plan.id,
        }),
      },
    },
    clock,
  );

  await deps.stripe.updateSubscriptionPrice({ subscriptionId: subscription, priceId, prorate: true });

  return {
    assessment,
    upgraded: true,
    notice: autoUpgradeNotice({ assessment, plan, nextPlan: next }),
  };
}

export async function currentSubscriptionId(db: Db, account: string): Promise<string | null> {
  return withTenant(db, { accountId: brandAccountId(account) }, async (tx) => {
    const result = await tx.execute(sql`
      SELECT stripe_subscription_id FROM subscriptions WHERE account_id = ${account}::uuid
    `);
    return rowsOf<{ stripe_subscription_id: string | null }>(result)[0]?.stripe_subscription_id ?? null;
  });
}

/** Used by the plan screen to show what this period costs before the invoice lands. */
export async function currentPeriodAssessment(
  db: Db,
  account: BillingAccount,
): Promise<UsageAssessment | null> {
  if (!account.planId || !account.currentPeriodStart || !account.currentPeriodEnd) return null;
  const plans = await loadPlans(db);
  const plan = await loadPlan(db, account.planId);
  if (!plan) return null;
  const billableFilings = await billableFilingsInPeriod(db, account.accountId, {
    from: account.currentPeriodStart,
    to: account.currentPeriodEnd,
  });
  return assessUsage({ plan, nextPlan: nextPlan(plans, plan), billableFilings });
}

export type { Tx };
