/**
 * STAGE C — FRINGE CREDIT (column 6B) AND CASH IN LIEU (column 6C).
 *
 * AUTHORITY: `ENGINE.md` §6, §6.1 (what the engine refuses to compute here), §8.1
 * (the CRIT-2 correction: 6C is a disclosure of a subset of 7A, never an addend).
 *
 * ---------------------------------------------------------------------------
 * THE THREE DISCHARGE METHODS, QUOTED
 *
 * 29 CFR 5.31(b) gives exactly three ways to discharge the obligation:
 *
 *   (1) "By paying not less than the basic hourly rate to the laborers or
 *       mechanics and by making contributions for 'bona fide' fringe benefits in a
 *       total amount not less than the total of the fringe benefits required by
 *       the wage determination. For example, the obligations for 'Laborer: common
 *       or general' … will be met by the payment of a straight time hourly rate of
 *       not less than $21.93 and by contributions of not less than a total of
 *       $6.27 an hour for 'bona fide' fringe benefits; or
 *   (2) By paying in cash directly to laborers or mechanics for the basic hourly
 *       rate and by making an additional cash payment in lieu of the required
 *       benefits. For example … $28.60 ($21.93 basic hourly rate plus $6.27 for
 *       fringe benefits); or
 *   (3) … a combination …"
 *
 * Method (1) discharges with dollars that are NOT wages, so they sit in 6B and
 * OUTSIDE 7A. Method (2) discharges with dollars that ARE wages, so they sit in 6C
 * and INSIDE 7A. That asymmetry is the whole point of the two columns, and it is
 * why they must never be summed into a single "fringe" figure.
 *
 * ---------------------------------------------------------------------------
 * BOTH ARE WEEKLY TOTALS, AND BOTH COVER OVERTIME HOURS
 *
 * WHD's instructions: enter "the TOTAL of the contractor's or subcontractor's
 * contributions" and "the total amount IN CASH provided in lieu of fringe benefits
 * to the worker during the workweek". So these are dollars, not rates.
 *
 * And they multiply ALL hours, overtime included. The DOL Prevailing Wage Resource
 * Book is unambiguous: "Under Davis-Bacon, fringe benefits must be paid for ALL
 * hours worked, including overtime hours. However, the fringe benefit amounts
 * listed in the applicable wage determination may be excluded from the half-time
 * premium due as overtime compensation." Fringe is owed on hour 44; only the
 * PREMIUM excludes it.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS MODULE REFUSES TO COMPUTE, AND WHY THAT IS THE HONEST ANSWER
 *
 * ANNUALIZATION IS OUT. 29 CFR 5.25(c): "contractors must 'annualize' all
 * contributions … To annualize the cost of providing a fringe benefit, a
 * contractor must divide the total cost of the fringe benefit contribution … by
 * the total number of hours worked on both private (non-DBRA) work and work
 * covered by the Davis-Bacon Act … during the time period to which the cost is
 * attributable." A certified-payroll CSV contains covered hours for one week on
 * one project. It does not contain total private hours or annual plan cost, so the
 * annualized rate is NOT COMPUTABLE from our inputs.
 *
 * Approximating it — dividing plan cost by covered hours only — would INFLATE the
 * credit for exactly the open-shop contractor this product is for, which is the
 * commonest way a contractor gets this wrong. We would be automating the error. So
 * `hourlyCredit` is a customer assertion, printed in 6B and disclaimed on the
 * exception report as a P-D declined conclusion.
 */

import { Cents, MicroDollars, type Hours, type MilliRate } from '@/lib/money';
import type { FringePlanCredit, PayrollLine } from '@/lib/types';

import type { LedgerRecorder } from './narrowing';

/**
 * NARROWING SITE N1 — column 6B, per (line × plan).
 *
 * R2 puts the narrowing at the site the figure belongs to, so each plan's weekly
 * contribution is narrowed once and the column total is a sum of already-narrowed
 * cents. Narrowing the summed micro-dollars instead would produce a 6B total that
 * reconciles with no individual plan's own figure — defensible arithmetic and
 * indefensible evidence, since the contractor's plan statements are what an
 * auditor sets beside this column.
 */
export function col6B(
  plans: readonly FringePlanCredit[],
  hours: Hours,
  ledger: LedgerRecorder,
  scope: string,
): Cents {
  const perPlan = plans.map((plan) =>
    ledger.narrow('N1', `${scope}/plan:${plan.planName}`, MicroDollars.fromRateHours(plan.hourlyCredit, hours)),
  );
  return Cents.sum(perPlan);
}

/**
 * NARROWING SITE N2 — column 6C, per line.
 *
 * A DISCLOSURE of dollars already inside column 7A, never an addend to it.
 * `cashInLieu` is by definition a PORTION OF `cashRate` (§3), so
 * `Σ((st+ot) × cashRate)` already contains every cash-in-lieu dollar. Adding 6C on
 * top adds them a second time: on §7.6's M3 — 48 hours at $30.00 with $6.27
 * asserted in lieu — the error is $300.96 on ONE worker-week, printed against a
 * cheque for $1,534.92, on the gross-earned column of a document signed under
 * 18 U.S.C. 1001. It grows linearly with crew size. F-M3-CIL pins the corrected
 * figure and P-16 tests the composition of 7A directly, because the properties
 * that existed before CRIT-2 all passed under both formulas.
 */
export function col6C(cashInLieu: MilliRate, hours: Hours, ledger: LedgerRecorder, scope: string): Cents {
  return ledger.narrow('N2', scope, MicroDollars.fromRateHours(cashInLieu, hours));
}

/**
 * WH-347 column 6A top row.
 *
 * WHD's instructions are explicit: "List the actual hourly rate paid for straight
 * time (top row) and overtime (bottom row)" and "do not include cash payments in
 * lieu of fringe benefits in this column."
 *
 * The wage determination's own rate is NEVER printed in 6A. It appears in the
 * header's Wage Determination No. field, in the provenance footer, and in §10's
 * comparison. That separation is the product: the form asks what you paid, and
 * Ratepin's claim is that what you paid is defensible against a named revision of
 * a named determination.
 */
export function col6AStraightTime(line: PayrollLine): MilliRate {
  return (line.cashRate - line.cashInLieu) as MilliRate;
}

/** True when any plan credit is claimed anywhere in the filing — the sole driver
 *  of statement-of-compliance box 5, so the checkbox cannot drift from the
 *  arithmetic (P-12). */
export function anyFringeCreditClaimed(totals: readonly Cents[]): boolean {
  return Cents.sum(totals) > 0;
}
