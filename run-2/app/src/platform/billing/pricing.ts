/**
 * The pricing function — pure, integer cents, no I/O.
 *
 * Spec: ARCHITECTURE.md §9.5 and §16 Challenge 1. D4's four price points stand
 * ($49 / $99 / $249 / $599); the PRICING FUNCTION is included-filing allowances
 * plus "$2.50/filing beyond the included allowance, capped at the next tier's price
 * with AUTOMATIC UPGRADE at the cap." §16 also fixes where the ladder lives: "the
 * `plans` table carries nullable `project_cap` and `worker_cap` columns and a
 * data-driven `features` blob… The entitlement engine READS THE ROW; it does not
 * encode a ladder." So every number below arrives as an argument.
 *
 * WHAT "CAPPED AT THE NEXT TIER'S PRICE" HAS TO MEAN, and why it is a subtraction.
 * USER_JOURNEY §11.4 sets the test the cap must pass: "The upgrade must be
 * defensible as *cheaper for her*, or it is a trap." So the cap is the point at
 * which staying put stops being cheaper than moving up — `price(next) −
 * price(current)` of overage — and at that point the upgrade happens by itself. A
 * customer on Crew ($249) therefore accrues at most $350 of overage, because $350
 * is exactly what closes the gap to Multi ($599); one filing later she is on Multi,
 * paying $599 for an unlimited allowance instead of $601.50 for a metered one.
 * Reading the phrase the other way — an overage cap equal to the whole of the next
 * tier's price — would let her pay $249 + $599 = $848 for something we sell for
 * $599, which is the trap §11.4 names.
 *
 * Money is `Cents` throughout (`src/lib/money.ts`): an integer count of cents, never
 * a float and never a JS number holding dollars.
 */

import { Cents } from '../../lib/money';

export interface PlanRow {
  readonly id: string;
  readonly name: string;
  readonly priceCents: Cents;
  /** `null` means unlimited — the top of the ladder, which has no next tier and
   *  therefore no overage and no auto-upgrade. */
  readonly includedFilings: number | null;
  readonly overagePriceCents: Cents | null;
  readonly autoUpgradeTo: string | null;
  readonly projectCap: number | null;
  readonly workerCap: number | null;
  readonly features: Readonly<Record<string, unknown>>;
}

export interface UsageAssessment {
  readonly planId: string;
  readonly billableFilings: number;
  readonly includedFilings: number | null;
  readonly overageFilings: number;
  readonly overageCents: Cents;
  /** `null` at the top of the ladder. */
  readonly capCents: Cents | null;
  readonly overageFilingsToCap: number | null;
  /** True the moment overage reaches the cap; the worker then upgrades. */
  readonly atCap: boolean;
  /** USER_JOURNEY §11.4: "pre-announced at 80% of the cap". */
  readonly approachingCap: boolean;
  readonly autoUpgradeTo: string | null;
  readonly periodTotalCents: Cents;
}

export const CAP_WARNING_FRACTION = 0.8;

/**
 * What this account owes this period, and whether the upgrade fires.
 *
 * `billableFilings` is the count of filings that reached CERTIFIABLE or
 * CERTIFIABLE_DATED and were released. A `DRAFT — NOT CERTIFIABLE` filing is not in
 * it and never can be (§9.5): "we do not charge for the artifact we told you not to
 * sign." That exclusion is applied at the query, in `meter.ts`, and asserted there;
 * this function only ever sees the count that survived it.
 */
export function assessUsage(input: {
  readonly plan: PlanRow;
  readonly nextPlan: PlanRow | null;
  readonly billableFilings: number;
}): UsageAssessment {
  const { plan, nextPlan } = input;
  const billable = Math.max(0, Math.trunc(input.billableFilings));

  const included = plan.includedFilings;
  const overagePrice = plan.overagePriceCents;

  if (included === null || overagePrice === null || overagePrice <= 0) {
    // Unlimited, or a plan with no overage price configured. Failing toward
    // "everything is included" is the deliberate direction: an under-specified
    // catalogue must never invent a charge.
    return {
      planId: plan.id,
      billableFilings: billable,
      includedFilings: included,
      overageFilings: 0,
      overageCents: Cents.of(0),
      capCents: null,
      overageFilingsToCap: null,
      atCap: false,
      approachingCap: false,
      autoUpgradeTo: null,
      periodTotalCents: plan.priceCents,
    };
  }

  const overageFilings = Math.max(0, billable - included);

  const capCents =
    nextPlan && nextPlan.priceCents > plan.priceCents
      ? Cents.of(nextPlan.priceCents - plan.priceCents)
      : null;

  const uncappedCents = Cents.of(overageFilings * overagePrice);
  const overageCents = capCents === null ? uncappedCents : Cents.min(uncappedCents, capCents);
  const overageFilingsToCap = capCents === null ? null : Math.floor(capCents / overagePrice);

  const atCap = capCents !== null && uncappedCents >= capCents;
  const approachingCap =
    capCents !== null && !atCap && uncappedCents >= Math.ceil(capCents * CAP_WARNING_FRACTION);

  return {
    planId: plan.id,
    billableFilings: billable,
    includedFilings: included,
    overageFilings,
    overageCents,
    capCents,
    overageFilingsToCap,
    atCap,
    approachingCap,
    autoUpgradeTo: atCap ? plan.autoUpgradeTo : null,
    periodTotalCents: Cents.add(plan.priceCents, overageCents),
  };
}

/**
 * The sentence USER_JOURNEY §11.7 requires when the upgrade fires, generated from
 * the arithmetic rather than written by hand — so it cannot claim a saving the
 * numbers do not support.
 *
 * The comparison is stated in both directions because that is the honesty test: if
 * the upgrade were ever more expensive than staying, this string would say so, and
 * the caller asserts it never can.
 */
export function autoUpgradeNotice(input: {
  readonly assessment: UsageAssessment;
  readonly plan: PlanRow;
  readonly nextPlan: PlanRow;
}): string {
  const { assessment, plan, nextPlan } = input;
  const wouldHavePaid = Cents.add(
    plan.priceCents,
    Cents.of(assessment.overageFilings * (plan.overagePriceCents ?? 0)),
  );
  return (
    `You passed ${String(assessment.includedFilings ?? 0)} included filings on ${plan.name} ` +
    `and reached the overage cap at ${String(assessment.billableFilings)} filings, so we moved you to ` +
    `${nextPlan.name} at ${Cents.toDollarString(nextPlan.priceCents)} and stopped charging overage. ` +
    `On ${plan.name} this period would have cost ${Cents.toDollarString(wouldHavePaid)}. ` +
    `One click puts you back.`
  );
}

/**
 * A downgrade never removes the archive or the export.
 *
 * USER_JOURNEY §11.4 lists what changes and what does not, and the second list is
 * the load-bearing one: "**the archive itself, and export, never**." This function
 * is what the downgrade screen renders from, so the two lists cannot drift from the
 * entitlement code that enforces them.
 */
export function downgradeEffects(from: PlanRow, to: PlanRow): {
  readonly loses: readonly string[];
  readonly keeps: readonly string[];
} {
  const featureLabels: Readonly<Record<string, string>> = {
    ecpr: 'California eCPR XML export',
    wd_change_alerts: 'wage-determination change alerts with one-click regenerate',
    portal_export: 'portal export bundles',
    full_archive: 'the full rate-of-record archive view',
  };

  const loses: string[] = [];
  for (const [key, label] of Object.entries(featureLabels)) {
    if (from.features[key] === true && to.features[key] !== true) loses.push(label);
  }
  if ((from.includedFilings ?? Number.POSITIVE_INFINITY) > (to.includedFilings ?? Number.POSITIVE_INFINITY)) {
    loses.push(
      `included filings drop from ${String(from.includedFilings ?? 0)} to ${String(to.includedFilings ?? 0)} per period`,
    );
  }

  return {
    loses,
    keeps: [
      'every filing and artifact already generated, at every tier, forever',
      'one-click export of the whole archive, at every tier and in every billing state',
      'the wage-determination revision pinned to each project',
    ],
  };
}
