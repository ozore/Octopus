/**
 * The 14-day, no-card trial for the first 100 signups — D1, `specs/09`.
 *
 * **"First 100" is enforced, not aspirational.** A cohort number is assigned to
 * each organisation from a count taken inside the same transaction as the
 * insert, so the cohort `THRESHOLDS.md` evaluates at n = 100 contains exactly
 * one trial design. Signup 101 meets whatever the founder has decided by then,
 * and the default if nobody has decided is **the same trial** — the cap exists
 * to keep the measurement clean, not to close the door on customer 101.
 *
 * The trial never touches Stripe. `trialDays` is 0 on every price
 * (`plans.ts`), because a no-card trial is app-managed; letting Stripe start a
 * second trial at Checkout is the bug this comment exists to prevent.
 *
 * READ-ONLY IS NOT LOCK-OUT. At day 14 writes stop and reads and exports do
 * not. Holding a customer's compliance data hostage is both wrong and, for this
 * buyer, unforgivable (`specs/09` §Validation, AC2).
 */

import { count, eq } from 'drizzle-orm';
import { withTx, type Db } from '@octopus/platform/db';

import { trialGrants } from './schema';
import { TRIAL_COHORT_CAP, TRIAL_DAYS } from './plans';

export type TrialState = {
  onTrial: boolean;
  cohortNumber: number | null;
  withinFirst100: boolean;
  daysLeft: number | null;
  endsAt: Date | null;
  /** Writes refused, reads and exports allowed. */
  readOnly: boolean;
};

export async function grantTrial(
  db: Db,
  input: { orgId: string; now?: Date; isInternal?: boolean },
): Promise<{ cohortNumber: number; trialEndsAt: Date }> {
  const now = input.now ?? new Date();
  return withTx(db, async (tx) => {
    const existing = await tx.select().from(trialGrants).where(eq(trialGrants.orgId, input.orgId)).limit(1);
    const found = existing[0];
    if (found) return { cohortNumber: found.cohortNumber, trialEndsAt: found.trialEndsAt };

    // Internal organisations are excluded from the counter (`specs/09` AC11).
    const [used] = await tx
      .select({ value: count() })
      .from(trialGrants)
      .where(eq(trialGrants.isInternal, false));
    const cohortNumber = Number(used?.value ?? 0) + 1;
    const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 86_400_000);

    await tx.insert(trialGrants).values({
      orgId: input.orgId,
      cohortNumber: input.isInternal ? -cohortNumber : cohortNumber,
      isInternal: input.isInternal ?? false,
      trialDays: TRIAL_DAYS,
      trialEndsAt,
    });
    return { cohortNumber, trialEndsAt };
  });
}

export async function trialState(
  db: Db,
  orgId: string,
  options: { now?: Date; hasPaidSubscription: boolean },
): Promise<TrialState> {
  const now = options.now ?? new Date();
  const rows = await db.select().from(trialGrants).where(eq(trialGrants.orgId, orgId)).limit(1);
  const grant = rows[0];

  if (!grant) {
    return {
      onTrial: false,
      cohortNumber: null,
      withinFirst100: false,
      daysLeft: null,
      endsAt: null,
      readOnly: !options.hasPaidSubscription,
    };
  }

  const msLeft = grant.trialEndsAt.getTime() - now.getTime();
  const expired = msLeft <= 0;
  return {
    onTrial: !expired && !options.hasPaidSubscription,
    cohortNumber: grant.cohortNumber,
    withinFirst100: grant.cohortNumber > 0 && grant.cohortNumber <= TRIAL_COHORT_CAP,
    daysLeft: expired ? 0 : Math.ceil(msLeft / 86_400_000),
    endsAt: grant.trialEndsAt,
    readOnly: expired && !options.hasPaidSubscription,
  };
}

/** How many non-internal trials have been granted — the counter `specs/09` AC11 asserts. */
export async function trialCohortSize(db: Db): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(trialGrants)
    .where(eq(trialGrants.isInternal, false));
  return Number(row?.value ?? 0);
}
