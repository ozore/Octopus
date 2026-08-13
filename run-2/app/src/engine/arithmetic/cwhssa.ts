/**
 * STAGE D — CWHSSA OVERTIME, THE COVERAGE GATE, AND THE HALF-TIME-ON-BASE-RATE RULE.
 *
 * AUTHORITY: `ENGINE.md` §7.0 (the $100,000 gate, superseding `ARCHITECTURE.md`
 * §3.2 — ES-3), §7.1 (the statutory chain, quoted), §7.2 (the per-classification
 * base rate), §7.3 (the weighted average, the hours base and the premium credit),
 * §7.5 (**E4**, the case most worth stealing from that document).
 *
 * "This is the section that earns the product. It is also the section where every
 * incumbent's blog post is subtly wrong."
 *
 * ===========================================================================
 * 1. THE GATE — CWHSSA ATTACHES ONLY ABOVE $100,000 (E3a, ES-3)
 *
 * 29 CFR 5.5(b), verbatim: the Agency Head "must cause or require the contracting
 * officer to insert the following clauses … IN ANY CONTRACT IN AN AMOUNT IN EXCESS
 * OF $100,000 and subject to the overtime provisions of the Contract Work Hours and
 * Safety Standards Act."
 *
 * The Davis-Bacon Act itself attaches far lower: 40 U.S.C. 3142(a) reaches "every
 * contract in excess of $2,000". The two thresholds are FIFTY TIMES APART, and a
 * specialty subcontractor sits between them routinely — so a DBA-covered project
 * with no CWHSSA obligation is not an edge case, it is a normal week, and an engine
 * that cannot represent one is wrong about a large fraction of its market.
 *
 * `unknown` is therefore P-B and never a guess. Guessing COVERED computes a premium
 * that is not owed, applies a floor that does not apply, prints hours in a CWHSSA
 * column on a contract with no CWHSSA column, and can raise a flag naming a statute
 * the contract is not subject to — telling a compliant contractor they underpaid.
 * Guessing NOT COVERED silently deletes a real federal overtime obligation from a
 * document signed under 18 U.S.C. 1001. There is no safe default, so there is no
 * default.
 *
 * ===========================================================================
 * 2. THE BASE RATE — PER CLASSIFICATION, TO STRAIGHT TIME (E4)
 *
 *     baseRate(line) = max( BHR_WD, cashRate − cashInLieu )
 *
 * Start from what was actually paid in cash EXCLUDING any bona fide cash-in-lieu
 * (5.32(c)(1) excludes it); never go below the determination's basic hourly rate
 * (5.32(a)'s floor). Employer fringe CONTRIBUTIONS never enter this expression at
 * all; employee contributions never REDUCE it, because `cashRate` is gross —
 * 5.32(a): "an employee's regular or basic straight-time rate is computed on his
 * earnings before any deductions are made for the employee's contributions to
 * fringe benefits."
 *
 * Four DOL examples confirm this single expression, and they disagree with each
 * other in ways a wrong formula could not survive:
 *
 *   5.32(c)(1)  WD $3.00+$0.50, paid $3.50 all cash w/ $0.50 in lieu → base $3.00
 *   5.32(c)(2)  WD $3.00+$0.50, paid $3.25 cash + $0.50 contrib     → base $3.25
 *   5.32(c)(3)  WD $3.00+$0.50, paid $2.75 cash + $1.00 benefit     → base $3.00
 *   FOH 15k11(a)(2)  WD $12.00+$2.50, paid $10.00 + $4.50 fringe    → base $12.00
 *
 * Rows three and four kill the intuitive "premium is half the rate actually paid",
 * by $0.13/hr and $1.00/hr, always in the contractor's favour and therefore always
 * an underpayment. Row two kills the equally intuitive "premium is half the WD's
 * basic hourly rate" — that one overpays, which is cheaper but still a wrong number
 * on a certified document.
 *
 * ===========================================================================
 * 3. E4 — THE FLOOR IS NEVER RE-APPLIED TO THE WEIGHTED AVERAGE
 *
 * This is the single most likely place for a plausible-looking wrong number.
 *
 * FOH 15k11(b)(1): a painter/electrician week — painter 24 h at WD $10.00,
 * electrician 20 h at WD $12.00, 44 h total. DOL publishes: "($480.00 / 44 hours
 * worked) = $10.91 'regular rate'. … ½($10.91) x 4 overtime hours worked = $21.82."
 *
 * $10.91 is BELOW the electrician's WD basic hourly rate of $12.00. An
 * implementation that reads 5.32(a)'s "in no event … less than the basic hourly
 * rate" as a floor on the weighted average produces $12.00 and a premium of $24.00
 * — a 10% overstatement, and an entirely plausible-looking number. It is wrong
 * because the 5.32(a) floor governs the RATE PAID FOR HOURS IN A CLASSIFICATION,
 * which step 1 has already satisfied per class; the weighted average is a derived
 * quantity for the premium and carries no floor of its own.
 *
 * So the floor appears exactly once in this module — inside `baseRate`, per line —
 * and `regularRate` is a bare ratio. F-FOH-15k11b-M1 pins $10.91 / $21.82.
 *
 * ===========================================================================
 * 4. THE HOURS BASE, AND WHY `ot` IS IN THE THRESHOLD BUT NOT IN THE CREDIT
 *
 * §8 follows DOL's Method-1 shape: EVERY hour enters gross at the straight-time
 * `cashRate`, and the half-time premium is a separate addend on top. Overtime hours
 * therefore carry no premium dollars INSIDE column 7A for a credit to draw on —
 * `cwhssaPremium` IS their premium. Double-time hours are different: §8 pays them at
 * `dtRate`, so their premium is already in gross and crediting it is what stops the
 * engine charging for it twice.
 *
 * Hence `SELF_PRICED = { dt }`, stated over the property rather than the column
 * name (see `model.ts`).
 *
 * And the credit is narrow while §10's flag is broad, deliberately: the credit
 * REDUCES WHAT WE COMPUTE IS OWED, and reducing an obligation on an unproven
 * assertion is how CRIT-4 happened; the flag should not accuse a contractor who
 * paid something merely for failing to prove it was enough.
 */

import { Cents, Hours, MicroDollars, MilliRate } from '@/lib/money';
import type { ContractValueBand, PayrollLine } from '@/lib/types';

import { statutoryOtHours as statutoryOtHoursOf } from './hours';
import { SELF_PRICED, type PremiumBucket, PREMIUM_BUCKETS } from './model';
import { centsPerHourAsRate, halfOf, onePointFiveTimes, type LedgerRecorder } from './narrowing';
import type { WdRate } from './rates';

/** One payroll line with its hours summed and its rate of record resolved. The
 *  shape Stages D, E and G all read, computed once so the seven day columns are
 *  walked exactly once per line. */
export interface PreparedLine {
  readonly input: PayrollLine;
  readonly ordinal: number;
  readonly scope: string;
  readonly wdRate: WdRate | null;
  readonly stHours: Hours;
  readonly otHours: Hours;
  readonly dtHours: Hours;
  readonly totalHours: Hours;
  /** `max(BHR_WD, cashRate − cashInLieu)` on the CWHSSA path; `null` otherwise. */
  readonly baseRate: MilliRate | null;
}

export interface CwhssaResult {
  /** `contractValueBand === 'over_100k'`. The one input that turns §7 on. */
  readonly covered: boolean;
  readonly hoursWorked: Hours;
  readonly statutoryOtHours: Hours;
  readonly reportedOtHours: Hours;
  /** The exact numerator of the one ratio. Never narrowed. */
  readonly straightTimeEarnings: MicroDollars | null;
  readonly regularRate: Cents | null;
  readonly premiumOwed: Cents;
  /** Capped at `premiumOwed` — see `model.ts`. */
  readonly premiumCredit: Cents;
  readonly cwhssaPremium: Cents;
  readonly premiumPaidTotal: Cents;
  /** Self-priced hours the row does not prove were paid at ≥1.5×. */
  readonly unprovenPremiumHours: Hours;
  /** The lines carrying them — P-A blocks these and no others. */
  readonly unprovenLineIds: readonly string[];
}

/**
 * §7.2 — the per-classification base rate. Computed ONLY on the CWHSSA path.
 *
 * On an `at_or_under_100k` project there is no premium for the 5.32(a) floor to
 * floor, so `baseRate` is not computed. The Davis-Bacon obligation on those same
 * hours is unaffected and is checked in §10, which compares total straight-time
 * compensation against `BHR_WD + FRINGE_WD` and does not read `baseRate` at all.
 * Losing the CWHSSA premium below the threshold does NOT lose the underpayment
 * check — `compliance.ts` holds the other half of that promise.
 */
export function baseRate(line: PayrollLine, wdRate: WdRate | null, band: ContractValueBand): MilliRate | null {
  if (band !== 'over_100k') return null;
  const cashExcludingInLieu = MilliRate.of(line.cashRate - line.cashInLieu);
  if (wdRate === null) {
    // An unresolved classification has no `BHR_WD` to floor against. The line is
    // blocked either way (`UNMAPPED_TRADE` / `UNPARSED_CLASSIFICATION`) and the
    // artifact is DRAFT — NOT CERTIFIABLE, so nothing here is certified; computing
    // the cash side anyway is what lets the customer see a complete draft of the
    // week instead of a hole where the arithmetic stopped.
    return cashExcludingInLieu;
  }
  return MilliRate.max(wdRate.basicHourlyRate, cashExcludingInLieu);
}

function bucketHours(line: PreparedLine, bucket: PremiumBucket): Hours {
  return bucket === 'ot' ? line.otHours : line.dtHours;
}

function bucketRate(line: PreparedLine, bucket: PremiumBucket): MilliRate | null {
  return bucket === 'ot' ? line.input.otRate : line.input.dtRate;
}

/**
 * §7.3 in full, gated by §7.0.
 *
 * Single-classification weeks are the ONE-ELEMENT CASE of the same formula, not a
 * separate branch: with one line, `stEarnings = H × base` and `regularRate = base`,
 * so `premium = statutoryOT × 0.5 × base`. There is no special-case branch to drift
 * from the general one, and P-07 asserts the two agree.
 */
export function computeCwhssa(
  lines: readonly PreparedLine[],
  band: ContractValueBand,
  ledger: LedgerRecorder,
  scope: string,
): CwhssaResult {
  const hoursWorked = Hours.sum(lines.map((l) => l.totalHours));
  const reportedOtHours = Hours.sum(lines.map((l) => l.otHours));
  const statOt = statutoryOtHoursOf(hoursWorked);

  // ---------------------------------------------------------------------
  // The gate. `at_or_under_100k` zeroes the premium and suppresses the CWHSSA
  // flags; `unknown` withholds certification upstream (P-B) and computes no
  // premium either way, because both guesses are wrong in opposite directions.
  // `statutoryOtHours` is still reported on every band: it is a fact about hours,
  // and §25 compares it. What the gate governs is whether anything ACTS on it.
  // ---------------------------------------------------------------------
  if (band !== 'over_100k') {
    return {
      covered: false,
      hoursWorked,
      statutoryOtHours: statOt,
      reportedOtHours,
      straightTimeEarnings: null,
      regularRate: null,
      premiumOwed: Cents.of(0),
      premiumCredit: Cents.of(0),
      cwhssaPremium: Cents.of(0),
      premiumPaidTotal: Cents.of(0),
      unprovenPremiumHours: Hours.of(0),
      unprovenLineIds: [],
    };
  }

  // ---------------------------------------------------------------------
  // Step 2 — straight-time earnings. Premium buckets enter at their STRAIGHT-time
  // equivalent, because 29 CFR 778.202 excludes the premium portion from the
  // regular rate. Exact micro-dollars: this is the numerator of the one ratio and
  // narrowing it here would be narrowing twice (R4).
  // ---------------------------------------------------------------------
  const stEarnings = MicroDollars.sum(
    lines.map((line) =>
      line.baseRate === null
        ? MicroDollars.of(0)
        : MicroDollars.fromRateHours(line.baseRate, line.totalHours),
    ),
  );

  // Step 3 — N5, the one genuine ratio, narrowed once, to the cent DOL prints.
  const regularRate = hoursWorked > 0 ? ledger.narrowRatio(scope, Cents.fromRatio(stEarnings, hoursWorked)) : null;

  if (regularRate === null) {
    return {
      covered: true,
      hoursWorked,
      statutoryOtHours: statOt,
      reportedOtHours,
      straightTimeEarnings: stEarnings,
      regularRate: null,
      premiumOwed: Cents.of(0),
      premiumCredit: Cents.of(0),
      cwhssaPremium: Cents.of(0),
      premiumPaidTotal: Cents.of(0),
      unprovenPremiumHours: Hours.of(0),
      unprovenLineIds: [],
    };
  }

  const regularRateAsRate = centsPerHourAsRate(regularRate);

  // Step 4 — N6. What CWHSSA owes on the over-40 hours.
  const premiumOwed =
    statOt > 0
      ? ledger.narrow('N6', scope, halfOf(MicroDollars.fromRateHours(regularRateAsRate, statOt)))
      : Cents.of(0);

  // ---------------------------------------------------------------------
  // Step 5 — the credit, and the proof test.
  //
  // A premium label discharges the obligation on its own hours ONLY IF THE ROW
  // PROVES IT: the bucket carries an explicit rate and that rate is at least
  // 1.5 × the week's regular rate. `null` rate and `$0.00` rate produce the same
  // outcome deliberately — both are "we cannot prove ≥1.5× was paid", and the
  // customer resolves both the same way, once, with the same closed choice.
  // ---------------------------------------------------------------------
  const premiumThreshold = onePointFiveTimes(regularRate);
  const credits: Cents[] = [];
  const unprovenHoursPerLine: Hours[] = [];
  const unprovenLineIds: string[] = [];

  for (const line of lines) {
    let lineUnproven = 0;
    for (const bucket of SELF_PRICED) {
      const hours = bucketHours(line, bucket);
      if (hours <= 0) continue;
      const rate = bucketRate(line, bucket);
      const proven = rate !== null && rate >= premiumThreshold;
      if (proven && rate !== null) {
        const excess = rate - regularRateAsRate;
        if (excess > 0) {
          credits.push(
            ledger.narrow(
              'N7',
              `${line.scope}/${bucket}`,
              MicroDollars.fromRateHours(MilliRate.of(excess), hours),
            ),
          );
        }
      } else {
        lineUnproven += hours;
      }
    }
    if (lineUnproven > 0) {
      unprovenHoursPerLine.push(Hours.of(lineUnproven));
      unprovenLineIds.push(line.input.lineId);
    }
  }

  // Capped at what is owed. §7.3.1's M4b shows $160.00 of proven premium against
  // $40.00 owed and reports the credit as $40.00: the engine credits what it
  // charged and nothing more, because a generous premium is not a credit against
  // next week.
  const premiumCredit = Cents.min(Cents.sum(credits), premiumOwed);

  // Step 6 — the residual. Never negative.
  const cwhssaPremium = Cents.of(Math.max(0, premiumOwed - premiumCredit));

  // ---------------------------------------------------------------------
  // §10's companion quantity — N8. Broader than the credit on both axes: BOTH
  // buckets (the contractor's reported OT rate is exactly what this asks about),
  // and ALL premium hours with a stated rate rather than only proven ones.
  // ---------------------------------------------------------------------
  const premiumPaidParts: Cents[] = [];
  for (const line of lines) {
    for (const bucket of PREMIUM_BUCKETS) {
      const hours = bucketHours(line, bucket);
      if (hours <= 0) continue;
      const rate = bucketRate(line, bucket);
      if (rate === null) continue;
      const excess = rate - regularRateAsRate;
      if (excess <= 0) continue;
      premiumPaidParts.push(
        ledger.narrow('N8', `${line.scope}/${bucket}`, MicroDollars.fromRateHours(MilliRate.of(excess), hours)),
      );
    }
  }

  return {
    covered: true,
    hoursWorked,
    statutoryOtHours: statOt,
    reportedOtHours,
    straightTimeEarnings: stEarnings,
    regularRate,
    premiumOwed,
    premiumCredit,
    cwhssaPremium,
    premiumPaidTotal: Cents.sum(premiumPaidParts),
    unprovenPremiumHours: Hours.sum(unprovenHoursPerLine),
    unprovenLineIds,
  };
}

/**
 * §7.3's blocking rule (P-A), as a predicate.
 *
 * > If `statutoryOtHours > 0` AND `unprovenPremiumHours > 0`, the line is blocked
 * > with `PREMIUM_HOURS_UNPROVEN` and the picker offers a CLOSED CHOICE: these
 * > hours were ordinary hours mis-labelled by the export, or these hours were paid
 * > at a premium rate of ___. The engine does not choose, and does not proceed on
 * > either reading.
 *
 * Two properties of the shape, both deliberate:
 *
 *  - IT DOES NOT TRY TO WORK OUT WHICH HOURS CROSSED FORTY. Doing so needs a
 *    within-week ordering the CSV does not carry, and inventing one would be the
 *    §4 A1 error — manufacturing the very record 5.5(a)(1)(i) requires the
 *    employer to have kept. So the trigger is the conjunction, which over-blocks
 *    slightly and under-blocks never.
 *  - BELOW FORTY HOURS WORKED, NOTHING BLOCKS HERE. No CWHSSA obligation exists,
 *    so an unpriceable premium bucket raises no premium question. (It still raises
 *    a GROSS question when the bucket has hours and no rate at all, which
 *    `week.ts` handles separately and for a different reason.)
 */
export function premiumHoursUnproven(result: CwhssaResult): boolean {
  return result.covered && result.statutoryOtHours > 0 && result.unprovenPremiumHours > 0;
}
