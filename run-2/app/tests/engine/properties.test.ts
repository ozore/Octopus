/**
 * LAYER 2 — THE PROPERTY SUITE, P-01…P-22.
 *
 * AUTHORITY: `ENGINE.md` §12.2, and the three properties that document says are
 * worth arguing for: P-06 (metamorphic — it needs no known answer, only a relation
 * that must hold), P-11 (the executable form of E1), P-19 (the executable form of
 * §11's rounding discipline).
 *
 * Every test here runs OFFLINE: `vitest.setup.ts` replaces `fetch` with a rejecting
 * stub, and `offline.test.ts` proves the engine's module graph could not use one
 * anyway. That is `ARCHITECTURE.md` §6.1's third enforcement — "a test that runs the
 * entire golden canary suite with outbound network disabled at the process level"
 * — applied to the arithmetic as well.
 *
 * ===========================================================================
 * THREE PLACES THIS SUITE STATES A PROPERTY MORE PRECISELY THAN §12.2 DOES
 *
 * Each is flagged at its test with the arithmetic that forced it, and each is the
 * same species of correction §12.2 itself made to P-02: "a property that a
 * regulatory fixture falsifies is a specification bug, not a test failure."
 *
 *  - P-02's `col7A ≥ Σ Cents((st+ot+dt) × cashRate)` compares a ONE-narrowing
 *    quantity against a TWO-narrowing one. `round(a) + round(b)` can be one cent
 *    BELOW `round(a+b)` — take a = b = 0.4 cent — so the untoleranced form is
 *    falsified by a legitimate sub-cent rate, which G-SUBCENT guarantees will be
 *    drawn. Split into an exact part and a toleranced part.
 *  - P-04 and P-05 assert monotonicity through `regularRate`, which is narrowed to
 *    cents (N5) before it multiplies the overtime hours (N6). The tolerance is
 *    derived, not chosen.
 *  - P-07's identity holds exactly only when the base rate is a whole cent; under a
 *    sub-cent rate `regularRate` rounds first and the two sides differ by design.
 *    Tested exactly on whole-cent rates, which is the case the property is about.
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { Cents, Hours, MicroDollars, MilliRate } from '@/lib/money';
import { computeFiling } from '@/engine/arithmetic/week';
import { roundingResidual } from '@/engine/arithmetic/narrowing';
import { deriveStatusForFiling } from '@/engine/status';
import { CANARY_FRESHNESS, flattenFiling } from '@/engine/canary/case';
import { buildCase, type WeekSpec } from '@/engine/canary/build';
import type { EngineInput } from '@/engine/arithmetic/week';
import type { FilingComputation, WorkerComputation } from '@/engine/arithmetic/model';

import { FC, arbEngineInput, arbWeekSpec, measureSubCentShare } from './generators';

const FORTY_HOURS = Hours.of(40 * 100);

function run(input: EngineInput): FilingComputation {
  return computeFiling(input);
}

function certifiable(computation: FilingComputation): boolean {
  return deriveStatusForFiling(computation, CANARY_FRESHNESS).status !== 'DRAFT_NOT_CERTIFIABLE';
}

/** Weeks with no unpriceable premium bucket and no unmapped deduction — the shape
 *  the "for every certifiable week" properties are stated over. */
const CLEAN = {
  allowDoubleTime: true,
  allowUnpriceableDoubleTime: false,
  allowUnmappedDeduction: false,
} as const;

// ===========================================================================
// G-SUBCENT — the generator constraint, measured rather than assumed
// ===========================================================================

describe('G-SUBCENT — at least 20% of generated rates are sub-cent', () => {
  it('measures the share instead of trusting the weights', () => {
    const specs: WeekSpec[] = fc.sample(arbWeekSpec(CLEAN), { numRuns: 300, seed: FC.seed });
    const share = measureSubCentShare(specs);
    // Without this, P-06's tolerance is never exercised, P-19's residual is always
    // zero and P-10's bound is never approached — three properties that would be
    // both wrong and green, which is the worst state a test can be in.
    expect(share).toBeGreaterThanOrEqual(0.2);
  });
});

// ===========================================================================
// P-01 — the net identity
// ===========================================================================

describe('P-01 — netPaid + Σ deductions == col7B for every certifiable week', () => {
  it('holds, which is what makes column 8 run against 7B and not 7A', () => {
    fc.assert(
      fc.property(arbEngineInput(CLEAN), (input) => {
        const computation = run(input);
        if (!certifiable(computation)) return;
        for (const worker of computation.workers) {
          expect(Cents.add(worker.netPaid, worker.deductionTotal)).toBe(worker.col7B);
        }
      }),
      FC,
    );
  });
});

// ===========================================================================
// P-02 — gross is at least the cash, and exceeds it only by the premium
// ===========================================================================

describe('P-02 — col7A against the cash actually paid', () => {
  it('exactly: col7A − (straight-time cash + double-time cash) == cwhssaPremium', () => {
    fc.assert(
      fc.property(arbEngineInput({ ...CLEAN, allowUnpriceableDoubleTime: true }), (input) => {
        const computation = run(input);
        for (const worker of computation.workers) {
          const cash = Cents.sum([
            ...worker.lines.map((l) => l.straightTimeCash),
            ...worker.lines.map((l) => l.doubleTimeCash),
          ]);
          expect(Cents.sub(worker.col7A, cash)).toBe(worker.cwhssaPremium);
          expect(worker.col7A >= cash).toBe(true);
        }
      }),
      FC,
    );
  });

  it('§12.2’s form, with the split-narrowing tolerance derived rather than chosen', () => {
    fc.assert(
      fc.property(arbEngineInput(CLEAN), (input) => {
        const computation = run(input);
        input.week.workers.forEach((sourceWorker, w) => {
          const worker = computation.workers[w];
          if (worker === undefined) return;
          // Guard: `dtRate ≥ cashRate`. Below it the property is false for a reason
          // that has nothing to do with rounding — double time paid at $0.00 is less
          // cash, not a rounding artifact — and §12.2 states the equality condition
          // in terms of `dtRate == cashRate`, which presupposes the guard.
          const guarded = sourceWorker.lines.every(
            (line) => line.dtRate === null || line.dtRate >= line.cashRate,
          );
          if (!guarded) return;
          const atCashRate = Cents.sum(
            worker.lines.map((line) =>
              Cents.fromMicroDollars(
                MicroDollars.fromRateHours(
                  MilliRate.of(sourceWorker.lines[line.ordinal]?.cashRate ?? 0),
                  line.totalHours,
                ),
              ),
            ),
          );
          // `round(a) + round(b)` versus `round(a + b)`: at most one cent per line,
          // in either direction. See the docblock's 0.4 + 0.4 example.
          expect(worker.col7A).toBeGreaterThanOrEqual(atCashRate - worker.lines.length);
        });
      }),
      FC,
    );
  });
});

// ===========================================================================
// P-03 / P-04 / P-05 — the forty-hour boundary and the two monotonicities
// ===========================================================================

describe('P-03 — at or below forty hours worked there is no CWHSSA premium', () => {
  it('catches an off-by-one at the boundary', () => {
    fc.assert(
      fc.property(arbEngineInput({ ...CLEAN, allowUnpriceableDoubleTime: true }), (input) => {
        for (const worker of run(input).workers) {
          if (worker.hoursWorked <= FORTY_HOURS) expect(worker.cwhssaPremium).toBe(0);
        }
      }),
      FC,
    );
  });
});

/**
 * The derived tolerance for the two monotonicity properties.
 *
 * `premiumOwed = round(statOtHours × round(stEarnings ÷ hoursWorked) ÷ 2)`. The
 * inner narrowing (N5) moves the regular rate by at most half a cent; multiplied by
 * the overtime hours and halved, that is `statOtHours / 4` cents, and the outer
 * narrowing (N6) adds another half. So a quantity that is monotone in exact
 * arithmetic can appear to fall by that much and no more.
 *
 * The bound is stated as a function rather than as a number so it cannot be widened
 * quietly, and it is small enough that a sign error or a branch that skips the
 * weighted average — the bugs §12.2 names — clears it by orders of magnitude.
 */
function monotonicityTolerance(worker: WorkerComputation): number {
  return Math.ceil(worker.statutoryOtHours / 100 / 4) + 1;
}

describe('P-04 — cwhssaPremium is monotone non-decreasing in hours worked', () => {
  it('adding straight-time hours never reduces the premium', () => {
    fc.assert(
      fc.property(
        arbWeekSpec({ ...CLEAN, bands: ['over_100k'] }),
        fc.integer({ min: 1, max: 800 }),
        (spec, extraHundredths) => {
          const before = run(buildCase(spec));
          const grown: WeekSpec = {
            ...spec,
            workers: spec.workers.map((worker) => ({
              ...worker,
              lines: worker.lines.map((line, index) =>
                index === 0
                  ? {
                      ...line,
                      st: Hours.toDecimalString(
                        Hours.of(Hours.fromDecimalString(line.st ?? '0') + extraHundredths),
                      ),
                    }
                  : line,
              ),
            })),
          };
          const after = run(buildCase(grown));
          after.workers.forEach((workerAfter, index) => {
            const workerBefore = before.workers[index];
            if (workerBefore === undefined) return;
            expect(workerAfter.cwhssaPremium).toBeGreaterThanOrEqual(
              workerBefore.cwhssaPremium - monotonicityTolerance(workerAfter),
            );
          });
        },
      ),
      FC,
    );
  });
});

describe('P-05 — col7A is monotone non-decreasing in every hours field', () => {
  it('adding hours to any bucket never reduces gross', () => {
    fc.assert(
      fc.property(
        arbWeekSpec(CLEAN),
        fc.constantFrom<'st' | 'ot' | 'dt'>('st', 'ot', 'dt'),
        fc.integer({ min: 1, max: 400 }),
        (spec, bucket, extra) => {
          const before = run(buildCase(spec));
          const grown: WeekSpec = {
            ...spec,
            workers: spec.workers.map((worker) => ({
              ...worker,
              lines: worker.lines.map((line, index) => {
                if (index !== 0) return line;
                if (bucket === 'dt' && line.dtRate === null) return line;
                const current = Hours.fromDecimalString(line[bucket] ?? '0');
                return { ...line, [bucket]: Hours.toDecimalString(Hours.of(current + extra)) };
              }),
            })),
          };
          const after = run(buildCase(grown));
          after.workers.forEach((workerAfter, index) => {
            const workerBefore = before.workers[index];
            if (workerBefore === undefined) return;
            expect(workerAfter.col7A).toBeGreaterThanOrEqual(
              workerBefore.col7A - monotonicityTolerance(workerAfter),
            );
          });
        },
      ),
      FC,
    );
  });
});

// ===========================================================================
// P-06 — the metamorphic property, and E4
// ===========================================================================

describe('P-06 — the regular rate lies within its own inputs', () => {
  /**
   * The property §12.2 argues hardest for: it needs no known answer, only a relation
   * that must hold, and it catches the entire class of "the weighted average went
   * wrong" without anyone computing an expected value.
   *
   * The ±$0.005 tolerance is LOAD-BEARING, NOT SLACK. `regularRate` is narrowed to
   * cents (N5) while `baseRate` is a `MilliRate` carrying four decimals, so a
   * single-classification week at `baseRate = $10.0050` yields `regularRate = $10.01`,
   * which strictly exceeds `max_c baseRate` and falsifies the untoleranced form on a
   * perfectly legitimate input. Half a cent is exactly the maximum a single half-up
   * narrowing can move a value: the tolerance is the narrowing rule restated, and it
   * must not be widened.
   */
  it('min baseRate − $0.005 ≤ regularRate ≤ max baseRate + $0.005', () => {
    fc.assert(
      fc.property(arbEngineInput({ ...CLEAN, bands: ['over_100k'] }), (input) => {
        for (const worker of run(input).workers) {
          if (worker.regularRate === null) continue;
          const bases = worker.lines
            .filter((line) => line.totalHours > 0 && line.baseRate !== null)
            .map((line) => line.baseRate as MilliRate);
          if (bases.length === 0) continue;
          const asMilli = worker.regularRate * 100;
          expect(asMilli).toBeGreaterThanOrEqual(Math.min(...bases) - 50);
          expect(asMilli).toBeLessThanOrEqual(Math.max(...bases) + 50);
        }
      }),
      FC,
    );
  });

  it('E4 — the weighted average is NOT floored at the WD basic hourly rate', () => {
    // The regression this exists to stop, stated directly rather than only through
    // F-FOH-15k11b-M1: a week whose weighted average falls below one classification's
    // WD basic rate must keep the average. Flooring it produces $24.00 where DOL
    // publishes $21.82 — a 10% overstatement and an entirely plausible number.
    const input = buildCase({
      band: 'over_100k',
      workers: [
        {
          lines: [
            { className: 'PAINTER', wdBase: '10.00', wdFringe: '3.00', cashRate: '10.00', st: '24' },
            { className: 'ELECTRICIAN', wdBase: '12.00', wdFringe: '2.50', cashRate: '12.00', st: '20' },
          ],
        },
      ],
    });
    const worker = run(input).workers[0];
    expect(worker?.regularRate).toBe(1091);
    expect(worker?.regularRate).toBeLessThan(1200);
    expect(worker?.cwhssaPremium).toBe(2182);
  });
});

// ===========================================================================
// P-07 — the single-classification case is the one-element case
// ===========================================================================

describe('P-07 — one classification: the weighted average equals the base rate', () => {
  it('premium == statutoryOT × 0.5 × baseRate, exactly, on whole-cent rates', () => {
    fc.assert(
      fc.property(
        arbEngineInput({
          ...CLEAN,
          bands: ['over_100k'],
          minLines: 1,
          maxLines: 1,
          maxWorkers: 1,
          wholeCentRatesOnly: true,
          allowDoubleTime: false,
        }),
        (input) => {
          const worker = run(input).workers[0];
          if (worker === undefined || worker.regularRate === null) return;
          const line = worker.lines[0];
          if (line?.baseRate === undefined || line.baseRate === null) return;
          // regularRate is the base rate, in cents.
          expect(worker.regularRate * 100).toBe(line.baseRate);
          const expected = Cents.fromMicroDollars(
            MicroDollars.of(MicroDollars.fromRateHours(line.baseRate, worker.statutoryOtHours) / 2),
          );
          expect(worker.premiumOwed).toBe(expected);
        },
      ),
      FC,
    );
  });
});

// ===========================================================================
// P-08 / P-09 — structural invariances
// ===========================================================================

function withoutDayFields(map: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(map).filter(([key]) => !key.includes('.day[')));
}

describe('P-08 — permuting the day columns changes no output field', () => {
  it('catches day-order dependence and timezone leakage', () => {
    fc.assert(
      fc.property(arbEngineInput({ ...CLEAN, allowUnpriceableDoubleTime: true }), (input) => {
        const original = run(input);
        const reversed: EngineInput = {
          rates: input.rates,
          week: {
            ...input.week,
            workers: input.week.workers.map((worker) => ({
              ...worker,
              lines: worker.lines.map((line) => ({
                ...line,
                dayHours: [...line.dayHours].reverse() as unknown as typeof line.dayHours,
              })),
            })),
          },
        };
        const permuted = run(reversed);
        expect(withoutDayFields(flattenFiling(permuted, deriveStatusForFiling(permuted, CANARY_FRESHNESS)))).toEqual(
          withoutDayFields(flattenFiling(original, deriveStatusForFiling(original, CANARY_FRESHNESS))),
        );
      }),
      FC,
    );
  });
});

describe('P-09 — splitting a line in two moves nothing but the rounding residual', () => {
  it('catches per-line versus per-class aggregation errors', () => {
    fc.assert(
      fc.property(
        arbWeekSpec({
          ...CLEAN,
          bands: ['over_100k'],
          minLines: 1,
          maxLines: 1,
          maxWorkers: 1,
          allowDoubleTime: false,
        }),
        (spec) => {
          const whole = run(buildCase(spec));
          const split: WeekSpec = {
            ...spec,
            workers: spec.workers.map((worker) => ({
              ...worker,
              lines: worker.lines.flatMap((line) => {
                const total = Hours.fromDecimalString(line.st ?? '0');
                const first = Math.floor(total / 2);
                // Only `st` is split; `ot` and `dt` stay on the first half. Copying
                // the whole line into both halves would DUPLICATE those buckets, and
                // the property is about splitting hours, not adding them.
                return [
                  { ...line, lineId: `${line.lineId ?? 'l'}a`, st: Hours.toDecimalString(Hours.of(first)) },
                  {
                    ...line,
                    lineId: `${line.lineId ?? 'l'}b`,
                    st: Hours.toDecimalString(Hours.of(total - first)),
                    ot: '0',
                    dt: '0',
                  },
                ];
              }),
            })),
          };
          const parts = run(buildCase(split));
          const before = whole.workers[0];
          const after = parts.workers[0];
          if (before === undefined || after === undefined) return;
          expect(after.hoursWorked).toBe(before.hoursWorked);
          expect(after.statutoryOtHours).toBe(before.statutoryOtHours);
          // The extra line instantiates its own narrowing sites, so §11.4's residual
          // bound is exactly the right allowance: one cent per site, no more.
          expect(Math.abs(after.col7A - before.col7A)).toBeLessThanOrEqual(
            after.narrowing.moneySiteCount,
          );
        },
      ),
      FC,
    );
  });
});

// ===========================================================================
// P-10 — scaling
// ===========================================================================

describe('P-10 — scaling every rate by k scales col7A by k, within the bound', () => {
  it('catches rounding applied in the wrong place', () => {
    fc.assert(
      fc.property(
        arbWeekSpec({
          ...CLEAN,
          bands: ['over_100k'],
          maxWorkers: 1,
          allowDoubleTime: false,
        }),
        fc.integer({ min: 2, max: 5 }),
        (spec, k) => {
          const base = run(buildCase(spec));
          const scaled = run(
            buildCase({
              ...spec,
              workers: spec.workers.map((worker) => ({
                ...worker,
                lines: worker.lines.map((line) => ({
                  ...line,
                  wdBase: MilliRate.toDecimalString(
                    MilliRate.of(MilliRate.fromDecimalString(line.wdBase) * k),
                  ),
                  cashRate: MilliRate.toDecimalString(
                    MilliRate.of(MilliRate.fromDecimalString(line.cashRate) * k),
                  ),
                  cashInLieu: MilliRate.toDecimalString(
                    MilliRate.of(MilliRate.fromDecimalString(line.cashInLieu ?? '0') * k),
                  ),
                  otRate:
                    line.otRate === null || line.otRate === undefined
                      ? null
                      : MilliRate.toDecimalString(MilliRate.of(MilliRate.fromDecimalString(line.otRate) * k)),
                  plans: (line.plans ?? []).map((plan) => ({
                    name: plan.name,
                    credit: MilliRate.toDecimalString(
                      MilliRate.of(MilliRate.fromDecimalString(plan.credit) * k),
                    ),
                  })),
                })),
              })),
            }),
          );
          const before = base.workers[0];
          const after = scaled.workers[0];
          if (before === undefined || after === undefined) return;
          /**
           * The bound, derived rather than tuned. For one narrowing,
           * `narrow(kµ) − k·narrow(µ) = e' − k·e` with `|e|, |e'| ≤ ½`, so the
           * magnitude is at most `(k+1)/2`; over n sites, `n(k+1)/2`. The premium
           * adds the amplified N5 error — `statOtHours × ½ ÷ 2` cents — and one more
           * half from N6. Rounded up and stated as one expression:
           */
          const bound =
            Math.ceil((after.narrowing.moneySiteCount * (k + 1)) / 2) +
            Math.ceil((after.statutoryOtHours / 100) * ((k + 1) / 4)) +
            k +
            1;
          expect(Math.abs(after.col7A - k * before.col7A)).toBeLessThanOrEqual(bound);
        },
      ),
      FC,
    );
  });
});

// ===========================================================================
// P-11 — E1, executable
// ===========================================================================

describe('P-11 — the clock, the timezone and the locale change nothing', () => {
  /**
   * "Running the engine twice with `TZ`, locale and system clock changed produces
   * byte-identical output." This is why a filing regenerated eighteen months from
   * now during a dispute is the same document, and it is the executable form of E1.
   */
  it('is byte-identical across TZ, locale and a year of clock drift', () => {
    fc.assert(
      fc.property(arbEngineInput({ ...CLEAN, allowUnpriceableDoubleTime: true }), (input) => {
        const originalTz = process.env['TZ'];
        const originalLang = process.env['LANG'];
        const realNow = Date.now;
        try {
          process.env['TZ'] = 'UTC';
          process.env['LANG'] = 'C';
          const first = JSON.stringify(flattenFiling(run(input), deriveStatusForFiling(run(input), CANARY_FRESHNESS)));

          process.env['TZ'] = 'Pacific/Kiritimati';
          process.env['LANG'] = 'de_DE.UTF-8';
          Date.now = () => realNow() + 365 * 24 * 60 * 60 * 1000;
          const second = JSON.stringify(flattenFiling(run(input), deriveStatusForFiling(run(input), CANARY_FRESHNESS)));

          expect(second).toBe(first);
        } finally {
          Date.now = realNow;
          if (originalTz === undefined) delete process.env['TZ'];
          else process.env['TZ'] = originalTz;
          if (originalLang === undefined) delete process.env['LANG'];
          else process.env['LANG'] = originalLang;
        }
      }),
      { ...FC, numRuns: 60 },
    );
  });
});

// ===========================================================================
// P-12 / P-13 — the checkbox and the withheld signature
// ===========================================================================

describe('P-12 — box 5 is Σ col6B > 0, rendered twice', () => {
  it('cannot drift from the arithmetic', () => {
    fc.assert(
      fc.property(arbEngineInput({ ...CLEAN, allowUnpriceableDoubleTime: true }), (input) => {
        const computation = run(input);
        const anyCredit = computation.workers.some((w) => w.lines.some((l) => l.col6B > 0));
        expect(computation.statementOfCompliance.box5).toBe(anyCredit);
      }),
      FC,
    );
  });
});

describe('P-13 — any unresolved line withholds the signature block', () => {
  it('is D7’s core promise as a property', () => {
    fc.assert(
      fc.property(
        arbEngineInput({ ...CLEAN, allowUnpriceableDoubleTime: true, allowUnmappedDeduction: true }),
        (input) => {
          const computation = run(input);
          const verdict = deriveStatusForFiling(computation, CANARY_FRESHNESS);
          const anyUnresolved = computation.workers.some((w) =>
            w.lines.some((l) => l.resolutionState !== 'resolved'),
          );
          if (anyUnresolved || computation.filingBlockReasons.length > 0) {
            expect(verdict.status).toBe('DRAFT_NOT_CERTIFIABLE');
            expect(verdict.status === 'DRAFT_NOT_CERTIFIABLE' && verdict.signatureBlockWithheld).toBe(true);
          }
        },
      ),
      FC,
    );
  });
});

// ===========================================================================
// P-14 / P-16 / P-17 / P-18 — the flags and the composition of 7A
// ===========================================================================

describe('P-14 — WD_UNDERPAYMENT fires exactly when paid < required', () => {
  it('with the flagged shortfall equal to the difference', () => {
    fc.assert(
      fc.property(arbEngineInput({ ...CLEAN, allowUnpriceableDoubleTime: true }), (input) => {
        const computation = run(input);
        for (const worker of computation.workers) {
          for (const line of worker.lines) {
            const finding = worker.findings.find(
              (f) => f.flag === 'WD_UNDERPAYMENT' && f.lineId === line.lineId,
            );
            const shouldFire = line.classificationId !== null && line.paidTotal < line.requiredTotal;
            expect(finding !== undefined).toBe(shouldFire);
            if (finding !== undefined) {
              expect(finding.shortfall).toBe(Cents.sub(line.requiredTotal, line.paidTotal));
            }
          }
        }
      }),
      FC,
    );
  });
});

describe('P-15 — no float ever leaks past the branded types', () => {
  it('every money and hours field is a finite integer', () => {
    fc.assert(
      fc.property(
        arbEngineInput({ ...CLEAN, allowUnpriceableDoubleTime: true, allowUnmappedDeduction: true }),
        (input) => {
          const computation = run(input);
          const map = flattenFiling(computation, deriveStatusForFiling(computation, CANARY_FRESHNESS));
          for (const [field, value] of Object.entries(map)) {
            if (typeof value !== 'number') continue;
            expect(Number.isFinite(value), `${field} = ${value}`).toBe(true);
            expect(Number.isInteger(value), `${field} = ${value}`).toBe(true);
          }
        },
      ),
      FC,
    );
  });
});

describe('P-16 — col7A’s composition, exactly (the CRIT-2 double count)', () => {
  /**
   * "Fails under the withdrawn §8 formula on any week with `cashInLieu > 0`."
   *
   * This is the property that had to be added because none of the ones that existed
   * could see the bug: P-01 tested the net identity against 7B, P-05 passed under
   * both formulas, and the canary would have caught it only by luck. It tests the
   * COMPOSITION rather than a consequence of it.
   */
  it('col7A == Σ((st+ot) × cashRate) + Σ(dt × dtRate) + cwhssaPremium', () => {
    fc.assert(
      fc.property(arbEngineInput({ ...CLEAN, allowUnpriceableDoubleTime: true }), (input) => {
        const computation = run(input);
        input.week.workers.forEach((sourceWorker, w) => {
          const worker = computation.workers[w];
          if (worker === undefined) return;
          const parts: number[] = [];
          for (const line of sourceWorker.lines) {
            const st = Hours.sum(line.dayHours.map((d) => d.st));
            const ot = Hours.sum(line.dayHours.map((d) => d.ot));
            const dt = Hours.sum(line.dayHours.map((d) => d.dt));
            parts.push(
              Cents.fromMicroDollars(MicroDollars.fromRateHours(line.cashRate, Hours.of(st + ot))),
            );
            if (dt > 0 && line.dtRate !== null) {
              parts.push(Cents.fromMicroDollars(MicroDollars.fromRateHours(line.dtRate, dt)));
            }
          }
          parts.push(worker.cwhssaPremium);
          expect(worker.col7A).toBe(Cents.sum(parts.map((p) => Cents.of(p))));
        });
      }),
      FC,
    );
  });
});

describe('P-17 — cash in lieu never exceeds the cash actually paid', () => {
  it('and an input that says otherwise is blocked rather than computed on', () => {
    fc.assert(
      fc.property(arbEngineInput({ ...CLEAN, allowUnpriceableDoubleTime: true }), (input) => {
        const computation = run(input);
        input.week.workers.forEach((sourceWorker, w) => {
          const worker = computation.workers[w];
          if (worker === undefined) return;
          const inLieu = Cents.sum(worker.lines.map((l) => l.col6C));
          const cash = Cents.sum(
            worker.lines.map((line) =>
              Cents.fromMicroDollars(
                MicroDollars.fromRateHours(
                  MilliRate.of(sourceWorker.lines[line.ordinal]?.cashRate ?? 0),
                  line.totalHours,
                ),
              ),
            ),
          );
          expect(inLieu).toBeLessThanOrEqual(cash);
        });
      }),
      FC,
    );
  });

  it('blocks a line whose cash-in-lieu exceeds its cash rate', () => {
    const input = buildCase({
      band: 'over_100k',
      workers: [
        {
          lines: [
            { className: 'LABORER', wdBase: '20.00', wdFringe: '0.00', cashRate: '20.00', cashInLieu: '25.00', st: '40' },
          ],
        },
      ],
    });
    expect(run(input).workers[0]?.lines[0]?.blockReasons).toContain('AMBIGUOUS_RATE_BASIS');
  });
});

describe('P-18 — the CRIT-4 hole: a mis-labelled premium column cannot zero the premium', () => {
  it('either PREMIUM_BELOW_STATUTORY fires or the line is blocked', () => {
    fc.assert(
      fc.property(
        arbEngineInput({ ...CLEAN, bands: ['over_100k'], allowUnpriceableDoubleTime: true }),
        (input) => {
          const computation = run(input);
          for (const worker of computation.workers) {
            if (worker.hoursWorked <= FORTY_HOURS) continue;
            if (worker.premiumPaidTotal >= worker.premiumOwed) continue;
            const flagged = computation.findings.some((f) => f.flag === 'PREMIUM_BELOW_STATUTORY');
            const blocked = worker.lines.some((l) => l.resolutionState !== 'resolved');
            expect(flagged || blocked).toBe(true);
          }
        },
      ),
      FC,
    );
  });

  it('M4a — 36 ST + 8 DT at $1.00 blocks instead of rendering CERTIFIABLE', () => {
    const input = buildCase({
      band: 'over_100k',
      workers: [
        {
          lines: [
            { className: 'LABORER', wdBase: '20.00', wdFringe: '0.00', cashRate: '20.00', dtRate: '1.00', st: '36', dt: '8' },
          ],
        },
      ],
    });
    const computation = run(input);
    expect(computation.workers[0]?.hoursWorked).toBe(Hours.of(4_400));
    expect(computation.workers[0]?.statutoryOtHours).toBe(Hours.of(400));
    expect(computation.workers[0]?.lines[0]?.blockReasons).toContain('PREMIUM_HOURS_UNPROVEN');
    expect(deriveStatusForFiling(computation, CANARY_FRESHNESS).status).toBe('DRAFT_NOT_CERTIFIABLE');
  });
});

// ===========================================================================
// P-19 — the residual bound
// ===========================================================================

describe('P-19 — per-site narrowing moves a weekly total by at most one cent per site', () => {
  /**
   * The executable form of §11's rounding discipline. It fails if a stage narrows
   * twice (R4), if a total is recomputed from micro-dollars instead of summed (R2),
   * or if truncation is substituted for half-up anywhere (R1).
   *
   * The bound is provable, not empirical: each narrowing has error in (−½, +½] cents,
   * so n of them sum to error in (−n/2, +n/2]; the single narrowing of the exact sum
   * contributes at most ½; total < n/2 + ½ ≤ n for n ≥ 1.
   */
  it('holds over the sub-cent generators that make the residual non-zero', () => {
    fc.assert(
      fc.property(
        arbEngineInput({ ...CLEAN, allowUnpriceableDoubleTime: true, maxWorkers: 3 }),
        (input) => {
          for (const worker of run(input).workers) {
            const n = worker.narrowing.moneySiteCount;
            if (n === 0) continue;
            expect(roundingResidual(worker.narrowing)).toBeLessThanOrEqual(n);
          }
        },
      ),
      FC,
    );
  });

  it('is not vacuous — some generated week actually has a non-zero residual', () => {
    const inputs = fc.sample(arbEngineInput({ ...CLEAN, maxWorkers: 3 }), {
      numRuns: 400,
      seed: FC.seed,
    });
    const residuals = inputs.flatMap((input) =>
      run(input).workers.map((worker) => roundingResidual(worker.narrowing)),
    );
    expect(Math.max(...residuals)).toBeGreaterThan(0);
  });
});

// ===========================================================================
// P-20 / P-21 / P-22 — the gate, the deductions, and the check the gate must not touch
// ===========================================================================

describe('P-20 — §7.0’s gate, as a property rather than a paragraph', () => {
  it('unknown withholds certification; at_or_under_100k zeroes the premium', () => {
    fc.assert(
      fc.property(arbEngineInput({ ...CLEAN, allowUnpriceableDoubleTime: true }), (input) => {
        const computation = run(input);
        const verdict = deriveStatusForFiling(computation, CANARY_FRESHNESS);
        if (computation.contractValueBand === 'unknown') {
          expect(verdict.status).toBe('DRAFT_NOT_CERTIFIABLE');
          expect(computation.filingBlockReasons).toContain('CWHSSA_COVERAGE_UNDETERMINED');
        }
        if (computation.contractValueBand === 'at_or_under_100k') {
          for (const worker of computation.workers) expect(worker.cwhssaPremium).toBe(0);
          expect(computation.findings.some((f) => f.flag === 'PREMIUM_BELOW_STATUTORY')).toBe(false);
        }
      }),
      FC,
    );
  });
});

describe('P-21 — a lawful deduction never blocks a line', () => {
  it('no block is raised for any category that is a member of the enum', () => {
    fc.assert(
      fc.property(arbEngineInput({ ...CLEAN, allowUnmappedDeduction: false }), (input) => {
        for (const worker of run(input).workers) {
          expect(worker.blockReasons).not.toContain('UNMAPPED_DEDUCTION');
        }
      }),
      FC,
    );
  });

  /**
   * §9.2.1's second CI test, by behaviour rather than by count: "a fixture set of
   * realistic field-crew deduction labels … must map to (j) and (i) respectively and
   * must produce ZERO `BlockReason`s. This is the test that would have caught the
   * eight-category enum by its behaviour rather than by its count."
   */
  it('the field-crew label set produces zero blocks', () => {
    const input = buildCase({
      band: 'over_100k',
      workers: [
        {
          lines: [{ className: 'LABORER', wdBase: '20.00', wdFringe: '0.00', cashRate: '25.00', st: '40' }],
          allWorkGross: '1000.00',
          deductions: [
            { label: 'SAFETY BOOTS', category: 'SAFETY_EQUIPMENT', amount: '45.00' },
            { label: 'HARD HAT', category: 'SAFETY_EQUIPMENT', amount: '18.00' },
            { label: 'SAFETY GLASSES', category: 'SAFETY_EQUIPMENT', amount: '12.00' },
            { label: 'GLOVES', category: 'SAFETY_EQUIPMENT', amount: '9.00' },
            { label: 'CAMP ROOM & BOARD', category: 'BOARD_LODGING_FACILITIES', amount: '120.00' },
            { label: 'EMPLOYER HOUSING', category: 'BOARD_LODGING_FACILITIES', amount: '80.00' },
          ],
        },
      ],
    });
    const computation = run(input);
    expect(computation.allBlockReasons).toEqual([]);
    expect(deriveStatusForFiling(computation, CANARY_FRESHNESS).status).toBe('CERTIFIABLE');
  });
});

describe('P-22 — the underpayment check is never gated by the contract value band', () => {
  it('fires identically on all three bands for identical inputs', () => {
    fc.assert(
      fc.property(arbWeekSpec({ ...CLEAN, bands: ['over_100k'] }), (spec) => {
        const signature = (band: WeekSpec['band']): string =>
          run(buildCase({ ...spec, band }))
            .findings.filter((f) => f.flag === 'WD_UNDERPAYMENT')
            .map((f) => `${f.lineId}:${f.shortfall}`)
            .join('|');
        const over = signature('over_100k');
        expect(signature('at_or_under_100k')).toBe(over);
        expect(signature('unknown')).toBe(over);
      }),
      FC,
    );
  });
});
