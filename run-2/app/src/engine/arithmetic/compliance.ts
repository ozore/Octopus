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
  /** N10 + column 6B. See the module docblock for why column 6C is absent. */
  readonly paidTotal: Cents;
  readonly findings: readonly ViolationFinding[];
}

/**
 * §10 for one line. `allHours = st + ot + dt` — the fringe obligation runs on every
 * hour worked, overtime included.
 */
export function computeLineCompliance(input: {
  readonly line: PayrollLine;
  readonly wdRate: WdRate | null;
  readonly allHours: Hours;
  readonly col6B: Cents;
  readonly col6C: Cents;
  readonly ledger: LedgerRecorder;
  readonly scope: string;
}): LineComplianceResult {
  const { line, wdRate, allHours, col6B, col6C, ledger, scope } = input;

  const cashTerm = ledger.narrow('N10', scope, MicroDollars.fromRateHours(line.cashRate, allHours));
  const paidTotal = Cents.add(cashTerm, col6B);

  if (wdRate === null) {
    // No rate of record, so no comparison. `requiredTotal` is zero rather than
    // "unknown" because the line is already blocked and the exception report says
    // which classification is missing; inventing a requirement from the cash rate
    // would be comparing the contractor against themselves.
    return { requiredTotal: Cents.of(0), paidTotal, findings: [] };
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

  return { requiredTotal, paidTotal, findings };
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
 * Unproven hours in a week with statutory overtime have already blocked the line at
 * P-A, so the two never disagree on a rendered artifact — and P-18 asserts the flag
 * fires whenever a certifiable week's premium falls short.
 */
export function premiumBelowStatutory(input: {
  readonly band: ContractValueBand;
  readonly premiumOwed: Cents;
  readonly premiumPaidTotal: Cents;
}): ViolationFinding | null {
  if (input.band !== 'over_100k') return null;
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
