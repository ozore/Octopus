/**
 * THE NARROWING LEDGER — §11's rounding discipline, made observable.
 *
 * AUTHORITY: `ENGINE.md` §11.1 (R1–R4), §11.2 (the enumerated sites N1–N10),
 * §11.3 (the CI control that replaced the unenforceable grep), §11.4 (P-19).
 *
 * ---------------------------------------------------------------------------
 * WHY A LEDGER RATHER THAN A COMMENT
 *
 * §11.3 withdrew "`roundHalfUpToCents` is called from exactly two sites, enforced
 * by a grep in CI" as unenforceable — there are ten sites, not two, and the rule's
 * two failure modes were both bad: fail on the first honest implementation, or be
 * satisfied by silently truncating micro-dollars inside the arithmetic, which is a
 * different rounding rule applied invisibly.
 *
 * What replaced it is a type boundary plus a lint. This module adds the third
 * thing those two cannot give you: P-19 is a statement about the DIFFERENCE
 * between narrowing at each line and narrowing once at the end, and you cannot
 * test a difference you never computed. The ledger records `(site, exact micro,
 * narrowed cents)` for every narrowing a worker-week performs, so the property
 *
 *     | Σ(per-site narrowed cents)  −  narrow(Σ exact micro-dollars) |  ≤  n
 *
 * is evaluable from the engine's own output rather than by re-implementing the
 * arithmetic a second way inside the test — which would only prove the two
 * implementations agree.
 *
 * The bound is provable, not empirical: each narrowing has error in (−½, +½]
 * cents, so n of them sum to error in (−n/2, +n/2]; the single narrowing of the
 * exact sum contributes at most ½; total < n/2 + ½ ≤ n for n ≥ 1.
 *
 * It FAILS if a stage narrows twice (R4), if a total is recomputed from
 * micro-dollars instead of summed (R2), or if truncation is substituted for
 * half-up anywhere (R1).
 *
 * ---------------------------------------------------------------------------
 * WHY N5 IS COUNTED BUT NOT SUMMED
 *
 * Nine of the ten sites narrow a MONEY quantity: micro-dollars to cents. N5 —
 * `regularRate = Cents.fromRatio(stEarnings, hoursWorked)` — narrows a RATIO of
 * unlike quantities and yields cents PER HOUR. Adding a rate into a sum of dollars
 * is not a tighter test, it is a category error, and it would make the residual
 * bound meaningless in exactly the direction that hides a real regression.
 *
 * So N5 is recorded (it is a narrowing, and §25 compares `regularRate` exactly)
 * and counted in `siteCount`, while the additive residual runs over the money
 * sites and is bounded by `moneySiteCount` — the tighter of the two bounds, and
 * therefore the stronger property.
 */

import { Cents, MicroDollars, type MilliRate, type NarrowingSiteId } from '@/lib/money';

export interface NarrowingRecord {
  readonly site: NarrowingSiteId;
  /** Which instantiation — `line:3/plan:Health & Welfare` — so a residual can be
   *  attributed rather than merely observed. */
  readonly scope: string;
  /** The exact quantity before narrowing. `null` at N5, the one ratio site. */
  readonly micro: MicroDollars | null;
  readonly cents: Cents;
}

export interface NarrowingLedger {
  readonly records: readonly NarrowingRecord[];
  /** Every site the week instantiated, ratio included — P-19's `n`. */
  readonly siteCount: number;
  /** The money sites alone, which is what the additive residual is bounded by. */
  readonly moneySiteCount: number;
  /** Σ of the exact micro-dollars over the money sites. */
  readonly totalMicro: MicroDollars;
  /** Σ of the per-site narrowed cents over the money sites. */
  readonly totalCents: Cents;
}

/** The write side. Local to one worker-week's computation and never exported
 *  beyond it — `freezeLedger` is the only way a caller sees the result. */
export interface LedgerRecorder {
  /**
   * NARROWING SITES N1–N4, N6–N10. Records the exact micro-dollars, narrows once
   * (R1, R4), and returns the cents. Every printed money cell in the engine comes
   * through here, which is what makes the site table (§11.2) a specification
   * rather than a comment.
   */
  narrow(site: NarrowingSiteId, scope: string, micro: MicroDollars): Cents;
  /** NARROWING SITE N5, the one genuine ratio. */
  narrowRatio(scope: string, cents: Cents): Cents;
}

export function createLedger(): LedgerRecorder & { freeze(): NarrowingLedger } {
  const records: NarrowingRecord[] = [];
  return {
    narrow(site, scope, micro) {
      const cents = Cents.fromMicroDollars(micro);
      records.push({ site, scope, micro, cents });
      return cents;
    },
    narrowRatio(scope, cents) {
      records.push({ site: 'N5', scope, micro: null, cents });
      return cents;
    },
    freeze(): NarrowingLedger {
      const money = records.filter((r): r is NarrowingRecord & { micro: MicroDollars } => r.micro !== null);
      return {
        records: [...records],
        siteCount: records.length,
        moneySiteCount: money.length,
        totalMicro: MicroDollars.sum(money.map((r) => r.micro)),
        totalCents: Cents.sum(money.map((r) => r.cents)),
      };
    },
  };
}

/**
 * P-19, evaluated. The difference between the two orders of operations, in cents.
 *
 * Note this is NOT in tension with G1's zero-tolerance exact match (§25): P-19
 * bounds the difference between two different orders of operations, only one of
 * which the engine performs. The engine performs the §11.2 order, deterministically,
 * so a pinned expectation is exact. P-19 exists to prove the specified order is the
 * one implemented; G1 exists to prove it has not changed.
 */
export function roundingResidual(ledger: NarrowingLedger): number {
  const narrowedAtTheEnd = Cents.fromMicroDollars(ledger.totalMicro);
  return Math.abs(ledger.totalCents - narrowedAtTheEnd);
}

/** An empty ledger — a worker-week with no lines instantiates no sites. */
export const EMPTY_LEDGER: NarrowingLedger = {
  records: [],
  siteCount: 0,
  moneySiteCount: 0,
  totalMicro: MicroDollars.of(0),
  totalCents: Cents.of(0),
};

// ===========================================================================
// Unit conversions that are exact, and are therefore not narrowing sites
// ===========================================================================

/**
 * A cents-per-hour figure as a `MilliRate`, exactly.
 *
 * `regularRate` is narrowed to cents at N5 because that is the unit DOL prints it
 * in — FOH 15k11(b)(1) Step 2 publishes "$10.91", not "$10.909090…", and an
 * auditor holding our form beside the contractor's payroll register compares
 * cents. Feeding it back into a rate × hours product needs the `MilliRate` scale,
 * and 10⁻² → 10⁻⁴ is a multiplication by 100: exact, lossless, and NOT a
 * narrowing. Naming it here keeps a bare `* 100` out of the arithmetic.
 */
export function centsPerHourAsRate(centsPerHour: Cents): MilliRate {
  return (centsPerHour * 100) as MilliRate;
}

/**
 * Half of an exact micro-dollar quantity, for CWHSSA's `× ½`.
 *
 * Always integral where the engine uses it: the multiplicand is
 * `centsPerHourAsRate(regularRate) × hours`, a multiple of 100. The assertion is
 * kept anyway — `MicroDollars.of` throws on a non-integer — because a silent
 * `Math.trunc` here would be truncation substituted for half-up (R1) at the one
 * site where the error compounds across every overtime hour in the week.
 */
export function halfOf(micro: MicroDollars): MicroDollars {
  return MicroDollars.of(micro / 2);
}

/**
 * 1.5 × a cents-per-hour figure, as a `MilliRate`, exactly.
 *
 * The premium-proof test of §7.3: a self-priced bucket discharges its own hours
 * only if its stated rate is at least one and one-half times the week's regular
 * rate — 29 CFR 5.5(b)(1)'s "not less than one and one-half times the basic rate
 * of pay". `centsPerHourAsRate` yields a multiple of 100, so `× 3 / 2` is exact
 * and no rounding decision hides inside the comparison.
 */
export function onePointFiveTimes(centsPerHour: Cents): MilliRate {
  const rate = centsPerHourAsRate(centsPerHour);
  return ((rate * 3) / 2) as MilliRate;
}
