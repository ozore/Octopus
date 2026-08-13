/**
 * MONEY — the integer value types and the rounding discipline.
 *
 * AUTHORITY: `ENGINE.md` §2 (value types), §2.1 (rounding is a property of every
 * rate x hours product), §11 (the narrowing rule, the enumerated sites, the
 * residual bound P-19).
 *
 * THIS MODULE IMPORTS NOTHING. Not a type, not a constant, not a logger. That is
 * the enforcement of invariant I1 at its narrowest point: the arithmetic core must
 * not be able to reach the network or the model, and the cheapest way to guarantee
 * a leaf is to have no edges. A filing must be producible with networking
 * disabled; this file is the part of that claim that cannot be argued with.
 *
 * ---------------------------------------------------------------------------
 * WHY INTEGERS
 *
 * IEEE-754 binary floating point cannot represent $0.10. A build that computes
 * `0.1 + 0.2 !== 0.3` has already lost G1's exact-match gate, and an approximate
 * gate on a federal false-statement surface is not a gate (E1). So:
 *
 *   Cents        integer count of cents                       — every printed money cell
 *   MicroDollars integer count of 10^-6 dollars               — the exact product space
 *   MilliRate    integer count of 10^-4 dollars per hour      — every rate
 *   Hours        integer count of 10^-2 hours                 — what payroll systems export
 *
 * MilliRate carries four decimals, which is two more than any wage determination
 * publishes (`$ 36.85` / `14.13`), so parsing a determination into MilliRate is
 * lossless and the extra digits exist only to keep a customer-supplied blended
 * rate from being rounded on the way in.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS A NARROWING STEP AT ALL
 *
 * An earlier revision of ENGINE.md claimed the only division in the engine was the
 * weighted-average regular rate and that everything else was exact integer
 * multiply-and-add. That claim is arithmetically false and was withdrawn. The
 * multiply IS exact; the UNIT CONVERSION AFTER IT is not:
 *
 *   MilliRate x Hours  =  10^-4 $  x  10^-2 h  =  10^-6 dollars
 *
 * and reaching cents means dividing by 10,000, which generally has a remainder.
 * ENGINE.md's own live extract: `LABORER: ASPHALT` at $18.62/hr for 37.25 hours is
 * 186_200 x 3_725 = 693_595_000 microdollars = $693.595 — not representable in
 * cents. So there are two arithmetically distinct operations, and conflating them
 * is what produced the false claim:
 *
 *   NARROWING     MicroDollars -> Cents, a scale change by 10^4. Remainder in
 *                 [0, 10^4) microdollars. Happens once per (line, column).
 *   THE ONE RATIO stEarnings / hoursWorked — a quotient of unlike quantities, once
 *                 per worker-week, and the only place a RATE is derived rather
 *                 than read.
 *
 * `fromMicroDollars` and `fromRatio` below are those two operations and there are
 * no others. `roundHalfUpToCents` is private, exactly as §11.3 requires.
 *
 * ---------------------------------------------------------------------------
 * THE FOUR RULES (ENGINE.md §11.1)
 *
 *   R1  One narrowing function. Half-up to the nearest cent, away from zero on
 *       negatives.
 *   R2  Narrow at the line, then sum in cents. Every rate x hours product is
 *       computed exactly in MicroDollars, narrowed ONCE at the (line, column) it
 *       belongs to, and only then summed. No total is recomputed from
 *       micro-dollars.
 *   R3  Half-up, not banker's. Banker's rounding is statistically superior and
 *       reconciles with no payroll system in the field. Consistency with the
 *       customer's own records beats distributional elegance.
 *   R4  Never twice. Each quantity is narrowed exactly once. Double rounding is
 *       how a penny appears from nowhere.
 *
 * Why narrow at the line rather than at the end, stated because it looks wrong:
 * DOL's Method 1 prints the intermediate regular rate as $10.91 (FOH 15k11(b)(1),
 * Step 2) — a rounded cent figure, not $10.909090… — and the contractor's payroll
 * register shows the same. An auditor holding our form beside that register
 * compares cents. Carrying full precision and rounding only at the end is
 * defensible arithmetic and indefensible EVIDENCE: it produces figures that
 * reconcile with nothing anyone else holds.
 *
 * The cost is bounded rather than denied — see `roundingResidualBound` and P-19.
 */

// ===========================================================================
// The four value types
// ===========================================================================

export type Cents = number & { readonly __brand: 'Cents' };
export type MicroDollars = number & { readonly __brand: 'MicroDollars' };
export type MilliRate = number & { readonly __brand: 'MilliRate' };
export type Hours = number & { readonly __brand: 'Hours' };

/** Scale factors, named so no call site writes a bare 10000. */
export const MICRO_PER_CENT = 10_000;
export const MICRO_PER_DOLLAR = 1_000_000;
export const MILLI_PER_DOLLAR = 10_000;
export const HUNDREDTHS_PER_HOUR = 100;

export class MoneyError extends TypeError {}

function assertSafeInteger(value: number, what: string): void {
  if (!Number.isInteger(value)) {
    throw new MoneyError(
      `${what} must be an integer, got ${String(value)}. ` +
        'Money in Ratepin is an integer count of cents or micro-dollars — never a ' +
        'float and never a JS number holding dollars (ENGINE.md §2).',
    );
  }
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError(`${what} exceeds the safe integer range: ${String(value)}`);
  }
}

// ===========================================================================
// R1 — the one narrowing function, and the one ratio
// ===========================================================================

/**
 * Half-up to the nearest cent, away from zero on negatives.
 *
 * Private, and stays private: §11.3 replaced an unenforceable "called from exactly
 * two sites" grep with a type boundary. `Cents` is constructible from a wider
 * quantity ONLY through `Cents.fromMicroDollars` and `Cents.fromRatio`, and this
 * is their shared implementation.
 */
function roundHalfUpToCents(micro: number): number {
  const magnitude = Math.abs(micro);
  const whole = Math.trunc(magnitude / MICRO_PER_CENT);
  const remainder = magnitude - whole * MICRO_PER_CENT;
  const rounded = remainder * 2 >= MICRO_PER_CENT ? whole + 1 : whole;
  // `-0` is deliberately not produced. It compares equal to `0` under `===` and
  // NOT under `Object.is`, so it survives every guard a reviewer would think to
  // write and then shows up formatted as "-$0.00" on a certified payroll.
  if (rounded === 0) return 0;
  return micro < 0 ? -rounded : rounded;
}

/**
 * Integer half-up division of `numerator / denominator`, away from zero, with no
 * intermediate float. `denominator` must be positive.
 */
function divideHalfUp(numerator: number, denominator: number): number {
  if (denominator <= 0) throw new MoneyError('denominator must be positive');
  const magnitude = Math.abs(numerator);
  const whole = Math.trunc(magnitude / denominator);
  const remainder = magnitude - whole * denominator;
  const rounded = remainder * 2 >= denominator ? whole + 1 : whole;
  if (rounded === 0) return 0;
  return numerator < 0 ? -rounded : rounded;
}

export const Cents = {
  /** An exact integer count of cents. Not a narrowing — nothing is lost. */
  of(value: number): Cents {
    assertSafeInteger(value, 'Cents');
    return value as Cents;
  },

  /**
   * NARROWING SITE. The only path from a wider quantity to a printed money cell.
   * Half-up (R3), once (R4).
   */
  fromMicroDollars(micro: MicroDollars): Cents {
    assertSafeInteger(micro, 'MicroDollars');
    return roundHalfUpToCents(micro) as Cents;
  },

  /**
   * THE ONE GENUINE RATIO (ENGINE.md §11.2, site N5). Derives a per-hour figure —
   * the weighted-average regular rate — from earnings and hours, expressed in
   * cents per hour because that is the unit DOL prints it in.
   *
   * Units: (10^-6 $) x 100 / (10^-2 h) gives 10^-6 $ per hour; dividing by 10^4
   * reaches cents per hour. Both steps are folded into ONE half-up division, so
   * the result is narrowed exactly once (R4) rather than rounded twice.
   *
   * `hours` of zero is not an arithmetic edge case to be papered over with a
   * zero: a worker-week with earnings and no hours is a broken input, and the
   * caller must block the line rather than divide.
   */
  fromRatio(numerator: MicroDollars, hours: Hours): Cents {
    assertSafeInteger(numerator, 'MicroDollars');
    assertSafeInteger(hours, 'Hours');
    if (hours <= 0) {
      throw new MoneyError(
        'Cents.fromRatio: hours must be positive. A worker-week with earnings and ' +
          'no hours is an input the caller must block, not a division to round away.',
      );
    }
    return divideHalfUp(numerator * HUNDREDTHS_PER_HOUR, hours * MICRO_PER_CENT) as Cents;
  },

  add(a: Cents, b: Cents): Cents {
    return Cents.of(a + b);
  },

  sub(a: Cents, b: Cents): Cents {
    return Cents.of(a - b);
  },

  /** R2: worker-week and filing totals are sums of ALREADY-NARROWED cents. */
  sum(values: readonly Cents[]): Cents {
    let total = 0;
    for (const value of values) total += value;
    return Cents.of(total);
  },

  neg(value: Cents): Cents {
    return Cents.of(-value);
  },

  max(a: Cents, b: Cents): Cents {
    return a >= b ? a : b;
  },

  min(a: Cents, b: Cents): Cents {
    return a <= b ? a : b;
  },

  /**
   * Rendering, with a FIXED formatter and no locale. A locale-sensitive formatter
   * in the core would make the engine's output depend on the machine, which
   * violates E1 — byte-identical output a year later on a different box.
   */
  toDollarString(value: Cents): string {
    const negative = value < 0;
    const magnitude = Math.abs(value);
    const dollars = Math.trunc(magnitude / 100);
    const remainder = magnitude - dollars * 100;
    const grouped = String(dollars).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${negative ? '-' : ''}$${grouped}.${String(remainder).padStart(2, '0')}`;
  },
} as const;

export const MicroDollars = {
  of(value: number): MicroDollars {
    assertSafeInteger(value, 'MicroDollars');
    return value as MicroDollars;
  },

  /**
   * The exact product. `MilliRate x Hours` has units 10^-4 $ x 10^-2 h = 10^-6 $,
   * and this multiply loses nothing — it is the NARROWING afterwards that has a
   * remainder.
   */
  fromRateHours(rate: MilliRate, hours: Hours): MicroDollars {
    assertSafeInteger(rate, 'MilliRate');
    assertSafeInteger(hours, 'Hours');
    return MicroDollars.of(rate * hours);
  },

  fromCents(value: Cents): MicroDollars {
    return MicroDollars.of(value * MICRO_PER_CENT);
  },

  add(a: MicroDollars, b: MicroDollars): MicroDollars {
    return MicroDollars.of(a + b);
  },

  sum(values: readonly MicroDollars[]): MicroDollars {
    let total = 0;
    for (const value of values) total += value;
    return MicroDollars.of(total);
  },
} as const;

export const MilliRate = {
  of(value: number): MilliRate {
    assertSafeInteger(value, 'MilliRate');
    return value as MilliRate;
  },

  /**
   * Parse a decimal dollar string EXACTLY — no `parseFloat`, ever. This is the
   * boundary the wage-determination parser crosses ("$ 36.85" -> 368_500) and the
   * boundary a payroll CSV crosses. A float here would reintroduce the entire
   * class of error the integer types exist to remove, at the one point where the
   * number still looks like text.
   *
   * More than four decimal places is rejected rather than rounded: silently
   * truncating a customer's rate is a decision about their money that we are not
   * entitled to make without telling them.
   */
  fromDecimalString(input: string): MilliRate {
    const text = input.trim().replace(/^\$\s*/, '').replace(/,/g, '');
    const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(text);
    if (!match) throw new MoneyError(`not a decimal money string: ${JSON.stringify(input)}`);
    const [, sign, whole, fraction = ''] = match;
    if (fraction.length > 4) {
      throw new MoneyError(
        `rate ${JSON.stringify(input)} carries more than four decimal places; ` +
          'Ratepin will not silently truncate a rate.',
      );
    }
    const scaled = Number(whole) * MILLI_PER_DOLLAR + Number(fraction.padEnd(4, '0'));
    return MilliRate.of(sign === '-' ? -scaled : scaled);
  },

  toDecimalString(value: MilliRate): string {
    const negative = value < 0;
    const magnitude = Math.abs(value);
    const whole = Math.trunc(magnitude / MILLI_PER_DOLLAR);
    const fraction = String(magnitude - whole * MILLI_PER_DOLLAR).padStart(4, '0');
    return `${negative ? '-' : ''}${whole}.${fraction.replace(/0+$/, '').padEnd(2, '0')}`;
  },

  add(a: MilliRate, b: MilliRate): MilliRate {
    return MilliRate.of(a + b);
  },

  sub(a: MilliRate, b: MilliRate): MilliRate {
    return MilliRate.of(a - b);
  },

  max(a: MilliRate, b: MilliRate): MilliRate {
    return a >= b ? a : b;
  },
} as const;

export const Hours = {
  of(value: number): Hours {
    assertSafeInteger(value, 'Hours');
    return value as Hours;
  },

  /** "37.25" -> 3_725. Same exactness rule as `MilliRate.fromDecimalString`. */
  fromDecimalString(input: string): Hours {
    const text = input.trim();
    const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(text);
    if (!match) throw new MoneyError(`not a decimal hours string: ${JSON.stringify(input)}`);
    const [, sign, whole, fraction = ''] = match;
    if (fraction.length > 2) {
      throw new MoneyError(
        `hours ${JSON.stringify(input)} carry more than two decimal places; ` +
          'payroll systems export hundredths and Ratepin will not round them away.',
      );
    }
    const scaled = Number(whole) * HUNDREDTHS_PER_HOUR + Number(fraction.padEnd(2, '0'));
    return Hours.of(sign === '-' ? -scaled : scaled);
  },

  add(a: Hours, b: Hours): Hours {
    return Hours.of(a + b);
  },

  sub(a: Hours, b: Hours): Hours {
    return Hours.of(a - b);
  },

  sum(values: readonly Hours[]): Hours {
    let total = 0;
    for (const value of values) total += value;
    return Hours.of(total);
  },

  toDecimalString(value: Hours): string {
    const negative = value < 0;
    const magnitude = Math.abs(value);
    const whole = Math.trunc(magnitude / HUNDREDTHS_PER_HOUR);
    const fraction = String(magnitude - whole * HUNDREDTHS_PER_HOUR).padStart(2, '0');
    return `${negative ? '-' : ''}${whole}.${fraction}`;
  },
} as const;

// ===========================================================================
// §11.2 — the narrowing sites, enumerated
//
// There is no call-site COUNT; there is a call-site TABLE, and this is it.
// `col7A`, `col5`, the column-8 totals and every filing-level total are SUMS of
// the below, not narrowings of their own. Adding a printed money column to the
// engine means adding a row here: the table is the specification, and the
// exact-match field list of the golden canary suite is its mirror.
// ===========================================================================

export type NarrowingSiteId =
  | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6' | 'N7' | 'N8' | 'N9' | 'N10';

export interface NarrowingSite {
  readonly id: NarrowingSiteId;
  readonly site: string;
  readonly expression: string;
  /** The unit the site instantiates per — how many times it appears in a week. */
  readonly per: 'line' | 'line x plan' | 'line x bucket' | 'worker-week';
}

export const NARROWING_SITES: readonly NarrowingSite[] = [
  { id: 'N1', site: 'col6B', expression: 'Σ_p plan.hourlyCredit × totalHours', per: 'line x plan' },
  { id: 'N2', site: 'col6C', expression: 'cashInLieu × totalHours', per: 'line' },
  { id: 'N3', site: 'straightTimeCash', expression: '(st + ot) × cashRate', per: 'line' },
  { id: 'N4', site: 'doubleTimeCash', expression: 'dt × dtRate', per: 'line' },
  { id: 'N5', site: 'regularRate', expression: 'Cents.fromRatio(stEarnings, hoursWorked)', per: 'worker-week' },
  { id: 'N6', site: 'premiumOwed', expression: 'statutoryOtHours × regularRate × ½', per: 'worker-week' },
  { id: 'N7', site: 'premiumCredit', expression: 'provenPremiumHours × (rate − regularRate)', per: 'line x bucket' },
  { id: 'N8', site: 'premiumPaidTotal', expression: 'hours(bucket) × (rate − regularRate)', per: 'line x bucket' },
  { id: 'N9', site: 'requiredTotal', expression: '(BHR_WD + FRINGE_WD) × allHours', per: 'line' },
  /**
   * R-BUILD C-1. Was `cashRate × allHours`, which priced double-time hours at a rate
   * the row does not report and suppressed `WD_UNDERPAYMENT` on a real shortfall.
   * 29 CFR 5.31(b) denominates all three discharge methods in a STRAIGHT TIME hourly
   * rate, so each hour is credited at its straight-time equivalent and the
   * double-time bucket at the lesser of the two rates the row itself carries.
   * `compliance.ts` holds the derivation and the executed cases.
   */
  {
    id: 'N10',
    site: 'straightTimeEquivalentCash',
    expression: 'cashRate × (st + ot) + min(cashRate, dtRate) × dt',
    per: 'line',
  },
] as const;

/**
 * P-19, THE RESIDUAL BOUND — the property that actually holds.
 *
 * Narrowing at the line and narrowing at the end are different arithmetic, and
 * honest specification means BOUNDING the difference rather than pretending it is
 * zero. For a worker-week instantiating `n` narrowing sites:
 *
 *   | Σ(per-site narrowed cents) − narrow(Σ exact micro-dollars) |  ≤  n  cents
 *
 * The bound is provable, not empirical: each narrowing has error in (−½, +½] cents,
 * so `n` of them sum to error in (−n/2, +n/2]; the single narrowing of the exact
 * sum contributes at most ½; total < n/2 + ½ ≤ n for n ≥ 1.
 *
 * It is a genuine invariant of the specified discipline, which is what makes it
 * useful: it FAILS if a stage narrows twice (R4), if a total is recomputed from
 * micro-dollars instead of summed (R2), or if truncation is substituted for
 * half-up anywhere (R1).
 *
 * G1's exact-match gate is achievable not because rounding happens in one place —
 * it does not — but because WHERE it happens is enumerated, HOW it happens is one
 * function, and HOW FAR it can move a total is bounded and tested.
 */
export function roundingResidualBound(narrowingSiteCount: number): number {
  if (!Number.isInteger(narrowingSiteCount) || narrowingSiteCount < 1) {
    throw new MoneyError('narrowingSiteCount must be a positive integer');
  }
  return narrowingSiteCount;
}
