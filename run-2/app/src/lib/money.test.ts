/**
 * Unit tests for the money types and the rounding discipline.
 *
 * ENGINE.md §11.3 item 3 requires "exhaustive unit test of `roundHalfUpToCents`
 * over the boundary set {…, x.xx4999, x.xx5, x.xx5001, …} including negatives and
 * both zero directions". `roundHalfUpToCents` is private by design, so it is
 * exercised through `Cents.fromMicroDollars`, which is the only door it has.
 *
 * These tests are offline, deterministic and import nothing but the module under
 * test — the same property the module itself has.
 */

import { describe, expect, it } from 'vitest';

import {
  Cents,
  Hours,
  MICRO_PER_CENT,
  MicroDollars,
  MilliRate,
  MoneyError,
  NARROWING_SITES,
  roundingResidualBound,
} from './money';

describe('Cents.fromMicroDollars — R1, R3 half-up to the nearest cent', () => {
  it('is exact when there is no remainder', () => {
    expect(Cents.fromMicroDollars(MicroDollars.of(0))).toBe(0);
    expect(Cents.fromMicroDollars(MicroDollars.of(10_000))).toBe(1);
    expect(Cents.fromMicroDollars(MicroDollars.of(693_590_000))).toBe(69_359);
  });

  it('rounds the boundary set half-UP, not half-even', () => {
    // 4999 microdollars is below half a cent; 5000 is exactly half; 5001 is above.
    expect(Cents.fromMicroDollars(MicroDollars.of(4_999))).toBe(0);
    expect(Cents.fromMicroDollars(MicroDollars.of(5_000))).toBe(1);
    expect(Cents.fromMicroDollars(MicroDollars.of(5_001))).toBe(1);
    // The banker's-rounding trap: 0.5 and 1.5 cents both round UP under R3.
    expect(Cents.fromMicroDollars(MicroDollars.of(15_000))).toBe(2);
    expect(Cents.fromMicroDollars(MicroDollars.of(25_000))).toBe(3);
    expect(Cents.fromMicroDollars(MicroDollars.of(35_000))).toBe(4);
  });

  it('rounds negatives AWAY from zero, symmetrically', () => {
    expect(Cents.fromMicroDollars(MicroDollars.of(-4_999))).toBe(0);
    expect(Cents.fromMicroDollars(MicroDollars.of(-5_000))).toBe(-1);
    expect(Cents.fromMicroDollars(MicroDollars.of(-5_001))).toBe(-1);
    expect(Cents.fromMicroDollars(MicroDollars.of(-15_000))).toBe(-2);
  });

  it('is symmetric across zero for every offset in a full cent', () => {
    for (let micro = 0; micro <= MICRO_PER_CENT * 3; micro += 1) {
      const positive = Cents.fromMicroDollars(MicroDollars.of(micro));
      const negative = Cents.fromMicroDollars(MicroDollars.of(-micro));
      // `-positive` would be `-0` at the origin. Zero has no sign in money, and
      // the module refuses to produce `-0` precisely because it compares equal to
      // `0` under `===`, survives every guard a reviewer would write, and then
      // prints as "-$0.00" on a certified payroll.
      expect(negative).toBe(positive === 0 ? 0 : -positive);
      expect(Object.is(negative, -0)).toBe(false);
    }
  });

  it("reproduces ENGINE.md's own worked example", () => {
    // LABORER: ASPHALT at $18.62/hr for 37.25 hours = 693_595_000 microdollars
    // = $693.595, which is not representable in cents. Half-up gives $693.60.
    const rate = MilliRate.fromDecimalString('18.62');
    const hours = Hours.fromDecimalString('37.25');
    const micro = MicroDollars.fromRateHours(rate, hours);
    expect(micro).toBe(693_595_000);
    expect(Cents.fromMicroDollars(micro)).toBe(69_360);
    expect(Cents.toDollarString(Cents.fromMicroDollars(micro))).toBe('$693.60');
  });

  it('refuses a non-integer, because a float is how the gate is lost', () => {
    expect(() => MicroDollars.of(0.1 + 0.2)).toThrow(MoneyError);
    expect(() => Cents.of(12.5)).toThrow(MoneyError);
  });
});

describe('Cents.fromRatio — the ONE genuine ratio, site N5', () => {
  it('yields a CENT figure, because that is what an auditor compares', () => {
    // ENGINE.md §11.1: DOL's Method 1 prints the intermediate regular rate as a
    // rounded cent figure ($10.91 in FOH 15k11(b)(1), Step 2), not $10.909090…,
    // and the contractor's payroll register shows the same. Carrying full
    // precision through and rounding only at the end is defensible arithmetic and
    // indefensible evidence. The engine's own reproduction of DOL's four worked
    // examples lives in the golden fixtures (ENGINE §12.3); what is asserted here
    // is the UNIT and the rounding rule this function contributes to them.
    const earnings = MicroDollars.of(436_400_000); // $436.40
    const hours = Hours.fromDecimalString('40.00');
    expect(Cents.fromRatio(earnings, hours)).toBe(1_091); // $10.91/hr
  });

  it('rounds the derived rate half-up, on both sides of the half', () => {
    const hours = Hours.fromDecimalString('40.00');
    // $436.42 / 40 = $10.9105 -> $10.91
    expect(Cents.fromRatio(MicroDollars.of(436_420_000), hours)).toBe(1_091);
    // $436.60 / 40 = $10.9150 -> $10.92, half-up rather than half-even
    expect(Cents.fromRatio(MicroDollars.of(436_600_000), hours)).toBe(1_092);
    // $437.00 / 40 = $10.9250 -> $10.93, likewise
    expect(Cents.fromRatio(MicroDollars.of(437_000_000), hours)).toBe(1_093);
  });

  it('divides in one half-up step rather than rounding twice (R4)', () => {
    // $100.005 over 1 hour is 100_005_000 microdollars -> 10_001 cents, half-up.
    expect(Cents.fromRatio(MicroDollars.of(100_005_000), Hours.of(100))).toBe(10_001);
    // Two hours halves it exactly.
    expect(Cents.fromRatio(MicroDollars.of(100_000_000), Hours.of(200))).toBe(5_000);
  });

  it('refuses zero hours rather than inventing a rate', () => {
    // A worker-week with earnings and no hours is a broken input the caller must
    // block (P-A), not a division to round away.
    expect(() => Cents.fromRatio(MicroDollars.of(1_000_000), Hours.of(0))).toThrow(MoneyError);
  });
});

describe('MilliRate.fromDecimalString — the text boundary, without parseFloat', () => {
  it('parses what a wage determination actually prints', () => {
    expect(MilliRate.fromDecimalString('$ 36.85')).toBe(368_500);
    expect(MilliRate.fromDecimalString('14.13')).toBe(141_300);
    expect(MilliRate.fromDecimalString('24.03')).toBe(240_300);
    expect(MilliRate.fromDecimalString('0.00')).toBe(0);
    expect(MilliRate.fromDecimalString('1,234.56')).toBe(12_345_600);
  });

  it('parses the value floats cannot represent, exactly', () => {
    expect(MilliRate.fromDecimalString('0.10')).toBe(1_000);
    expect(MilliRate.fromDecimalString('0.20')).toBe(2_000);
    // 0.1 + 0.2 !== 0.3 in IEEE-754; here it is exact.
    expect(MilliRate.add(MilliRate.of(1_000), MilliRate.of(2_000))).toBe(3_000);
    expect(MilliRate.fromDecimalString('0.30')).toBe(3_000);
  });

  it('refuses more precision than it can hold, rather than truncating a rate', () => {
    expect(() => MilliRate.fromDecimalString('18.62345')).toThrow(MoneyError);
    expect(() => MilliRate.fromDecimalString('not a rate')).toThrow(MoneyError);
  });

  it('round-trips through its own formatter', () => {
    for (const text of ['36.85', '14.13', '0.00', '100.50']) {
      expect(MilliRate.toDecimalString(MilliRate.fromDecimalString(text))).toBe(text);
    }
  });
});

describe('Hours.fromDecimalString', () => {
  it('parses the hundredths payroll systems export', () => {
    expect(Hours.fromDecimalString('37.25')).toBe(3_725);
    expect(Hours.fromDecimalString('40')).toBe(4_000);
    expect(Hours.fromDecimalString('8.5')).toBe(850);
  });

  it('refuses thousandths rather than rounding hours away', () => {
    expect(() => Hours.fromDecimalString('37.253')).toThrow(MoneyError);
  });
});

describe('Cents.toDollarString — a fixed formatter, no locale (E1)', () => {
  it('formats without depending on the machine', () => {
    expect(Cents.toDollarString(Cents.of(0))).toBe('$0.00');
    expect(Cents.toDollarString(Cents.of(5))).toBe('$0.05');
    expect(Cents.toDollarString(Cents.of(123_456))).toBe('$1,234.56');
    expect(Cents.toDollarString(Cents.of(100_000_000))).toBe('$1,000,000.00');
    expect(Cents.toDollarString(Cents.of(-2_500))).toBe('-$25.00');
  });
});

describe('R2 — narrow at the line, then sum in cents', () => {
  it('sums already-narrowed cents rather than recomputing from micro-dollars', () => {
    const rate = MilliRate.fromDecimalString('18.62');
    const lines = ['37.25', '12.33', '7.77'].map((h) => Hours.fromDecimalString(h));
    const perLine = lines.map((h) => Cents.fromMicroDollars(MicroDollars.fromRateHours(rate, h)));
    const summed = Cents.sum(perLine);

    const narrowedOnce = Cents.fromMicroDollars(
      MicroDollars.sum(lines.map((h) => MicroDollars.fromRateHours(rate, h))),
    );

    // The two differ — that is the honest fact §11.4 bounds rather than denies.
    expect(Math.abs(summed - narrowedOnce)).toBeLessThanOrEqual(
      roundingResidualBound(perLine.length),
    );
  });

  it('P-19 holds across a randomised but deterministic sweep', () => {
    // Deterministic LCG: the suite must be reproducible byte-for-byte (E1).
    let seed = 20260813;
    const next = (bound: number): number => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % bound;
    };
    for (let trial = 0; trial < 500; trial += 1) {
      const siteCount = 1 + next(9);
      const micros: ReturnType<typeof MicroDollars.of>[] = [];
      for (let i = 0; i < siteCount; i += 1) {
        const rate = MilliRate.of(100_000 + next(850_000));
        const hours = Hours.of(1 + next(8_400));
        micros.push(MicroDollars.fromRateHours(rate, hours));
      }
      const perSite = Cents.sum(micros.map((m) => Cents.fromMicroDollars(m)));
      const once = Cents.fromMicroDollars(MicroDollars.sum(micros));
      expect(Math.abs(perSite - once)).toBeLessThanOrEqual(roundingResidualBound(siteCount));
    }
  });
});

describe('the narrowing-site table is the specification', () => {
  it('enumerates N1..N10 with no gaps and no duplicates', () => {
    const ids = NARROWING_SITES.map((s) => s.id);
    expect(ids).toEqual(['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10']);
    expect(new Set(NARROWING_SITES.map((s) => s.site)).size).toBe(NARROWING_SITES.length);
  });

  it('names exactly one ratio site, because there is exactly one ratio', () => {
    const ratios = NARROWING_SITES.filter((s) => s.expression.includes('fromRatio'));
    expect(ratios).toHaveLength(1);
    expect(ratios[0]?.id).toBe('N5');
  });
});
