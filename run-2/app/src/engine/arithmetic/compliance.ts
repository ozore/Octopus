/**
 * STAGE G — THE UNDERPAYMENT CHECK AND THE VIOLATION FLAGS.
 *
 * AUTHORITY: `ENGINE.md` §10.
 *
 * "The engine performs one comparison that no incumbent form-filler performs,
 * because it is the comparison that requires a pinned rate of record."
 *
 * ===========================================================================
 * WHAT THE FLAGS ARE, AND WHAT THEY ARE NOT
 *
 * `WD_UNDERPAYMENT` does NOT block the line. The contractor may have a reason we
 * cannot see, and an artifact refused on our own inference would be worse than one
 * that renders with a stated concern. It renders as a prominent exception with the
 * arithmetic shown, and the artifact status stays CERTIFIABLE unless something ELSE
 * blocks it.
 *
 * Two things this module never does: it never characterises a shortfall as a
 * violation of law, and it never computes liquidated damages for a customer. It
 * states the arithmetic and names the rule. 29 CFR 5.5(b)(2)'s $33/calendar-day
 * figure is a corpus value with an effective date (the Field Operations Handbook,
 * Rev. 660 dated 10/25/2010, quotes the identical sentence with $10 — same rule,
 * same words, a figure that has tripled through inflation adjustment), and it is
 * printed only on `over_100k` projects, because 5.5(b)(2) is a clause inserted by
 * the same preamble that carries the threshold.
 *
 * ===========================================================================
 * THE CHECK IS NEVER GATED BY `contractValueBand`
 *
 * The Davis-Bacon prevailing-wage obligation attaches at $2,000, not $100,000. A
 * sub-$100k project loses its CWHSSA premium (§7.0) and keeps every dollar of its
 * DBA obligation. Nor does this read `baseRate`. Keeping the two independent is
 * what stops §7.0's gate from quietly disabling the one comparison no incumbent
 * form-filler performs — P-22 is that promise as an executable property.
 *
 * ===========================================================================
 * ONE CORRECTION TO §10's PUBLISHED FORMULA — `col6C` IS NOT AN ADDEND HERE EITHER
 *
 * §10 states:
 *
 *     paidTotal(line) = Cents.fromMicroDollars( cashRate × allHours )
 *                     + col6B(line) + col6C(line)
 *
 * That is the CRIT-2 double count in a second column, and it runs in the dangerous
 * direction. §3 defines `cashInLieu` as "the customer-asserted PORTION OF
 * `cashRate` paid in lieu of fringe", and §8.1 states the containment in a table:
 * `col6C ⊆ 7A`, "already counted once". So `Cents(cashRate × allHours)` ALREADY
 * CONTAINS every cash-in-lieu dollar, and adding `col6C` counts them twice — on the
 * side of the comparison that SUPPRESSES the flag.
 *
 * Worked, to show it is not theoretical. WD `$21.93 + $6.27` (the 5.30 figure-1
 * laborer, required total $28.20/hr). A contractor pays $22.00/hr all cash and
 * asserts $6.27 of it is in lieu of fringe. Under §10 as published:
 * paid = $22.00 + $6.27 = $28.27 ≥ $28.20 → NO FLAG. Under the containment rule:
 * paid = $22.00 < $28.20 → shortfall $6.20/hr, which is what the contractor
 * actually owes, and which is precisely the underpayment this product exists to
 * surface.
 *
 * `col6B` stays in the sum, because employer contributions are NOT wages paid in
 * the period and are therefore genuinely outside the cash term — §7.4's note
 * confirms it against DOL's own oracle: FOH 15k11(a)(2) pays $10.00 cash + $4.50
 * fringe against a required $12.00 + $2.50, and `paidTotal` must come to exactly
 * $14.50/hr so that §10 does NOT fire on a week DOL calls compliant.
 *
 * The correction is also what makes `FRINGE_BELOW_WD` coherent: that flag exists
 * for the contractor whose fringe is short but whose CASH EXCESS covers the total
 * under 5.31(b)(3)'s combination method, and "cash excess" is only a meaningful
 * quantity if the cash term is counted once.
 *
 * ===========================================================================
 * R-BUILD C-1 — THE CASH TERM IS A STRAIGHT-TIME-EQUIVALENT, NOT `cashRate × allHours`
 *
 * WHAT WAS WRONG. N10 was `Cents(cashRate × allHours)` with `allHours = st + ot + dt`,
 * so the comparison asserted that every DOUBLE-TIME hour had been paid at `cashRate`.
 * §8, one file over, prices those same hours at `dtRate` into column 7A. Two columns
 * of one artifact described the same hours at two different rates, and the divergence
 * ran in the direction that SUPPRESSES the flag: WD `$30.00 + $10.00`, 20 ST + 8 DT,
 * `cashRate $45.00`, `dtRate $0.00` printed `col7A = $900.00` against a required
 * $1,120.00 and reported `paidTotal = $1,260.00` — no `WD_UNDERPAYMENT`, no block,
 * CERTIFIABLE. Under forty hours P-A cannot fire, and `dtRate === 0` is not `null`,
 * so nothing else caught it.
 *
 * WHY THE OBVIOUS REPAIR IS ALSO WRONG. Composing the cash term from §8's own terms
 * (`straightTimeCash + doubleTimeCash`) makes the two columns agree, and carries the
 * identical defect mirrored: with WD `$30.00 + $10.00`, 40 ST + 8 DT, `cashRate
 * $35.00`, `dtRate $70.00`, it reports paid `$1,960.00` against a required
 * $1,920.00 and again raises nothing — while the worker's STRAIGHT-TIME rate is
 * $35.00 against a required $40.00, a real $240.00 shortfall for the week. Crediting
 * a premium dollar against the straight-time obligation discharges it with money the
 * regulation does not let it be discharged with.
 *
 * VERIFIED AGAINST. 29 CFR 5.31(b), fetched from the eCFR versioner API on
 * 2026-08-13 (title-29, issue 2026-08-11). Every one of its three methods is
 * denominated in a STRAIGHT TIME rate: (b)(1) "the payment of a straight time hourly
 * rate of not less than $21.93 and by contributions of not less than a total of
 * $6.27"; (b)(2) "paying directly to the laborers a straight time hourly rate of not
 * less than $28.60"; (b)(3) "an hourly rate, partly in cash and partly in payments or
 * costs for fringe benefits which total not less than $28.60". 29 CFR 5.32(a) holds
 * the premium apart from that rate on the other side, and the Davis-Bacon obligation
 * it describes is owed on every hour worked.
 *
 * SO THE CASH TERM CREDITS EACH HOUR AT ITS STRAIGHT-TIME EQUIVALENT:
 *
 *     N10 = Cents( cashRate × (st + ot)  +  min(cashRate, dtRate) × dt )
 *
 * `st` and `ot` at `cashRate` because §8's Method-1 shape prices them there in gross
 * and their premium is the separate `cwhssaPremium` addend. `dt` at the LESSER of the
 * two rates the row itself carries, because both bounds are facts on the row and
 * neither is an inference: crediting more than `dtRate` asserts money that was not
 * paid, and crediting more than `cashRate` asserts a straight-time rate higher than
 * the payroll's own. A `null` `dtRate` credits nothing for those hours — the line is
 * blocked at `MISSING_REQUIRED_FIELD` either way, and "we cannot price it" must not
 * become "it was paid".
 *
 * The two bounds are asserted as properties rather than left as prose: for every
 * line, `paidTotal − col6B ≤ straightTimeCash + doubleTimeCash` (never more than the
 * form says was earned) and `paidTotal − col6B ≤ Cents(cashRate × allHours)` (never
 * a straight-time rate above the payroll's own). The withdrawn formula violates the
 * first; the obvious repair violates the second.
 */

import { Cents, MicroDollars, MilliRate, type Hours } from '@/lib/money';
import type { ContractValueBand, PayrollLine } from '@/lib/types';

import type { ViolationFinding } from './model';
import type { LedgerRecorder } from './narrowing';
import type { WdRate } from './rates';

const CITATION_WD_UNDERPAYMENT = '29 CFR 5.5(a)(1)(i); 29 CFR 5.31(b)';
const CITATION_FRINGE = '29 CFR 5.31(b)(3)';
const CITATION_PREMIUM = '29 CFR 5.5(b)(1); 29 CFR 5.32';

export interface LineComplianceResult {
  /** N9 — `(BHR_WD + FRINGE_WD) × allHours`. Zero when the class is unresolved:
   *  there is no rate of record to require anything, and the line is blocked. */
  readonly requiredTotal: Cents;
  /** N10 + column 6B. See the module docblock for why column 6C is absent, and for
   *  why the cash term is a straight-time equivalent rather than `cashRate × allHours`. */
  readonly paidTotal: Cents;
  /** The N10 cash term alone, exposed so the two bounds in the module docblock are
   *  assertable without re-deriving them from `paidTotal` and `col6B`. */
  readonly straightTimeEquivalentCash: Cents;
  readonly findings: readonly ViolationFinding[];
}

/**
 * The straight-time equivalent of the double-time rate: the LESSER of the two rates
 * the row carries. `null` when the bucket has no rate — the caller credits nothing.
 *
 * `MilliRate` has no `min`, and adding one to `money.ts` for a single call site
 * would widen a value-type surface this module does not own; `MilliRate.of` is the
 * branded constructor and re-brands the integer without leaving the type.
 */
function dtStraightTimeRate(line: PayrollLine): MilliRate | null {
  if (line.dtRate === null) return null;
  return MilliRate.of(Math.min(line.cashRate, line.dtRate));
}

/**
 * §10 for one line. `allHours = st + ot + dt` — the fringe obligation runs on every
 * hour worked, overtime included.
 */
export function computeLineCompliance(input: {
  readonly line: PayrollLine;
  readonly wdRate: WdRate | null;
  readonly allHours: Hours;
  /** `st + ot`, already summed by the caller so the day grid is walked once. */
  readonly stOtHours: Hours;
  readonly dtHours: Hours;
  readonly col6B: Cents;
  readonly col6C: Cents;
  readonly ledger: LedgerRecorder;
  readonly scope: string;
}): LineComplianceResult {
  const { line, wdRate, allHours, stOtHours, dtHours, col6B, col6C, ledger, scope } = input;

  const dtRate = dtStraightTimeRate(line);
  const cashTerm = ledger.narrow(
    'N10',
    scope,
    MicroDollars.add(
      MicroDollars.fromRateHours(line.cashRate, stOtHours),
      dtHours > 0 && dtRate !== null
        ? MicroDollars.fromRateHours(dtRate, dtHours)
        : MicroDollars.of(0),
    ),
  );
  const paidTotal = Cents.add(cashTerm, col6B);

  if (wdRate === null) {
    // No rate of record, so no comparison. `requiredTotal` is zero rather than
    // "unknown" because the line is already blocked and the exception report says
    // which classification is missing; inventing a requirement from the cash rate
    // would be comparing the contractor against themselves.
    return {
      requiredTotal: Cents.of(0),
      paidTotal,
      straightTimeEquivalentCash: cashTerm,
      findings: [],
    };
  }

  const requiredRate = MilliRate.add(wdRate.basicHourlyRate, wdRate.fringeRate);
  const requiredTotal = ledger.narrow('N9', scope, MicroDollars.fromRateHours(requiredRate, allHours));

  const findings: ViolationFinding[] = [];

  if (paidTotal < requiredTotal) {
    findings.push({
      flag: 'WD_UNDERPAYMENT',
      lineId: line.lineId,
      shortfall: Cents.sub(requiredTotal, paidTotal),
      required: requiredTotal,
      paid: paidTotal,
      citation: CITATION_WD_UNDERPAYMENT,
    });
  } else {
    /**
     * `FRINGE_BELOW_WD` — UNGATED, and only meaningful when the total is met.
     *
     * Legal under 5.31(b)(3)'s combination method (the cash excess covers it), but
     * worth surfacing because it is the shape of a contractor who thinks they are
     * compliant on the cash line and has not checked the total. This is a DBA
     * fringe observation, not a CWHSSA one, so §7.0's gate does not apply.
     *
     * The comparison runs in exact micro-dollars. Narrowing the required fringe
     * into the ledger would add an eleventh site to a table §11.2 closes at ten,
     * and it would be a site that composes no printed total — so it appears on
     * neither side of P-19's residual and would only inflate `n`.
     */
    const fringeRequiredMicro = MicroDollars.fromRateHours(wdRate.fringeRate, allHours);
    const fringeCreditedMicro = MicroDollars.fromCents(Cents.add(col6B, col6C));
    if (fringeCreditedMicro < fringeRequiredMicro) {
      const fringeRequired = Cents.fromMicroDollars(fringeRequiredMicro);
      const fringeCredited = Cents.add(col6B, col6C);
      findings.push({
        flag: 'FRINGE_BELOW_WD',
        lineId: line.lineId,
        shortfall: Cents.of(Math.max(0, fringeRequired - fringeCredited)),
        required: fringeRequired,
        paid: fringeCredited,
        citation: CITATION_FRINGE,
      });
    }
  }

  return { requiredTotal, paidTotal, straightTimeEquivalentCash: cashTerm, findings };
}

/**
 * `PREMIUM_BELOW_STATUTORY` — worker-scoped, and GATED on `over_100k` because it
 * names a CWHSSA obligation.
 *
 * The previous statement of this flag derived it from `col6A_ot × otHours` alone
 * and never looked at `dt`, which meant it was blind to exactly the hours CRIT-4
 * showed were escaping the threshold. Restated over §7.3's quantities, it sees
 * every premium bucket.
 *
 * The flag and §7.3's `premiumCredit` differ deliberately, on two axes:
 *
 *   |         | §7.3 `premiumCredit`            | §10 `premiumPaidTotal`         |
 *   | Question| what have we already accounted  | what did the contractor        |
 *   |         | for in gross?                   | actually pay?                  |
 *   | Buckets | SELF_PRICED only (`dt`)         | both `ot` and `dt`             |
 *   | Hours   | proven only (≥ 1.5 × rr)        | all hours with a stated rate   |
 *
 * ===========================================================================
 * R-BUILD H-4 — THE FLAG NOW REQUIRES EVIDENCE, RATHER THAN ITS ABSENCE
 *
 * WHAT WAS WRONG. The flag fired whenever `premiumOwed > premiumPaidTotal`, and
 * `premiumPaidTotal` counts only buckets carrying a STATED rate. A payroll export
 * with no overtime-rate column therefore produced `premiumPaidTotal = 0` and a
 * shortfall equal to the entire statutory premium, on every week over forty hours —
 * INCLUDING DOL'S OWN WORKED EXAMPLES. FOH 15k11(a)(1) publishes "44 hours x $12.00
 * = $528.00 for prevailing wages; 4 hours x ½ x $12.00 = $24.00 for CWHSSA earnings;
 * $662.00 Total" as a CORRECT computation, and the engine accused it of a $24.00
 * premium shortfall. Three class-1 fixtures pinned that accusation as expected.
 *
 * The docblock above claimed the flag and column 7A "never disagree on a rendered
 * artifact" because unproven premium hours block at P-A. That reasoning holds only
 * for `SELF_PRICED` buckets (`dt`). `ot` is not self-priced, so `unprovenPremiumHours`
 * is zero, nothing blocks, and the artifact renders certifiable saying of the same
 * $24.00 both "earned, and inside column 7A" and "not paid". The invariant was false,
 * and it was invisible only because no violation finding reached ink (R-BUILD C-2).
 *
 * WHAT IT IS NOW. The flag is an observation about EVIDENCE, not about its absence:
 * it fires only when at least one premium bucket in the week carries a stated rate
 * and the stated rates fall short. When no bucket carries a rate at all there is
 * nothing to compare, and the honest artifact line is a P-D — `premiumRateNotReported`
 * in `exceptions.ts` — which says what column 7A contains and declines to conclude
 * whether it was paid. That is not the CRIT-4 error class of treating "we cannot see
 * it" as "it was paid": nothing is credited anywhere, and the customer is told so.
 *
 * VERIFIED AGAINST. 29 CFR 5.32(a) and 5.5(b)(1), eCFR versioner API, fetched
 * 2026-08-13 (title-29 issue 2026-08-11), and FOH 15k11(a)(1)–(2) as transcribed in
 * `canary/fixtures.ts` — the oracle the accusation was being levelled against.
 */
export function premiumBelowStatutory(input: {
  readonly band: ContractValueBand;
  readonly premiumOwed: Cents;
  readonly premiumPaidTotal: Cents;
  /** True when at least one premium bucket in the week carries hours AND a stated
   *  rate. Without it there is no evidence to compare and the flag stays silent. */
  readonly premiumRatesStated: boolean;
}): ViolationFinding | null {
  if (input.band !== 'over_100k') return null;
  if (!input.premiumRatesStated) return null;
  const shortfall = input.premiumOwed - input.premiumPaidTotal;
  if (shortfall <= 0) return null;
  return {
    flag: 'PREMIUM_BELOW_STATUTORY',
    lineId: null,
    shortfall: Cents.of(shortfall),
    required: input.premiumOwed,
    paid: input.premiumPaidTotal,
    citation: CITATION_PREMIUM,
  };
}
