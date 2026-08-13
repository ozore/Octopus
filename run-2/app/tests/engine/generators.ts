/**
 * GENERATORS FOR THE PROPERTY SUITE — `ENGINE.md` §12.2, Layer 2.
 *
 * "Generators produce structurally valid `PayrollWeek` values over realistic
 * ranges: rates $10.00–$95.00, fringes $0.00–$35.00, hours 0.00–84.00 per week,
 * 1–4 classifications, 0–8 deductions, all three `contractValueBand` values, and
 * `dt` buckets with rates drawn from `{null, $0.00, below 1.5×, exactly 1.5×,
 * above 1.5×}`."
 *
 * ===========================================================================
 * G-SUBCENT IS THE CONSTRAINT THAT MAKES THE ROUNDING PROPERTIES REAL
 *
 * "At least 20% of generated rates must be SUB-CENT — `MilliRate` values not
 * divisible by 100, e.g. `$10.0050`, `$36.8525`. Payroll systems do export them.
 * Without this the rounding properties (P-06, P-10, P-19) are silently vacuous, and
 * A VACUOUS PROPERTY IS WORSE THAN A MISSING ONE BECAUSE IT REPORTS GREEN."
 *
 * `arbRate` draws sub-cent with weight 1 against whole-cent weight 3, so the
 * expected share is 25%. That is an expectation, not a guarantee, so
 * `measureSubCentShare` exists and the suite ASSERTS the share rather than assuming
 * it — the same discipline R-CRIT1 applies to probes: measure the rate before
 * relying on the behaviour.
 *
 * ===========================================================================
 * WHY THE GENERATOR EMITS A `WeekSpec` RATHER THAN A `PayrollWeek`
 *
 * Because `buildCase` is the same constructor the canary fixtures use. A generator
 * that assembled `PayrollWeek` values by hand would be a second construction path,
 * and the first time the two drifted the property suite would be testing a shape
 * the fixtures never produce.
 */

import fc from 'fast-check';

import { Hours, MilliRate } from '@/lib/money';
import type { ContractValueBand, DeductionCategory } from '@/lib/types';
import { buildCase, type LineSpec, type WeekSpec, type WorkerSpec } from '@/engine/canary/build';
import type { EngineInput } from '@/engine/arithmetic/week';

/** Deterministic. A property suite with a floating seed reports a different
 *  failure on every run, which is indistinguishable from a flaky product. */
export const FC = { numRuns: 200, seed: 20260813, verbose: 0 } as const;

// ===========================================================================
// Scalars
// ===========================================================================

const DOLLARS_10 = 100_000;
const DOLLARS_95 = 950_000;

const wholeCentRate = fc.integer({ min: 1_000, max: 9_500 }).map((cents) => cents * 100);

/** Not divisible by 100 — the values that make every narrowing site have a
 *  remainder, and therefore the values the rounding discipline is actually about. */
const subCentRate = fc
  .integer({ min: DOLLARS_10, max: DOLLARS_95 })
  .map((v) => (v % 100 === 0 ? v + 1 : v));

export const arbRateMilli = fc.oneof(
  { weight: 3, arbitrary: wholeCentRate },
  { weight: 1, arbitrary: subCentRate },
);

/** $0.00–$35.00, with the same sub-cent pressure. Eight of the ten rows in §15.3's
 *  live extract carry `0.00`, so zero is drawn deliberately often: the discharge
 *  branches of §6 are the common case, not an edge. */
export const arbFringeMilli = fc.oneof(
  { weight: 2, arbitrary: fc.constant(0) },
  { weight: 3, arbitrary: fc.integer({ min: 0, max: 3_500 }).map((c) => c * 100) },
  { weight: 1, arbitrary: fc.integer({ min: 1, max: 350_000 }) },
);

const rateString = (milli: number): string => MilliRate.toDecimalString(MilliRate.of(milli));
const hoursString = (hundredths: number): string => Hours.toDecimalString(Hours.of(hundredths));

export const arbBand: fc.Arbitrary<ContractValueBand> = fc.constantFrom(
  'over_100k',
  'at_or_under_100k',
  'unknown',
);

/** The ten lettered paragraphs plus the sentinel. `UNMAPPED` is drawn rarely and
 *  only when a property wants it: it blocks, and a suite whose every week is
 *  blocked tests the block and nothing else. */
export const MAPPED_CATEGORIES: readonly DeductionCategory[] = [
  'STATUTORY',
  'BONA_FIDE_PREPAYMENT',
  'COURT_PROCESS',
  'BENEFIT_FUND',
  'CREDIT_UNION',
  'GOVERNMENTAL',
  'CHARITABLE_501C3',
  'UNION_DUES',
  'BOARD_LODGING_FACILITIES',
  'SAFETY_EQUIPMENT',
] as const;

// ===========================================================================
// Lines
// ===========================================================================

export interface LineOptions {
  /** Draw `dt` hours at all. Off for properties whose statement is about the
   *  straight-time path. */
  readonly allowDoubleTime?: boolean;
  /** Include `null` and `$0.00` in the `dt` rate pool. Both block a week that has
   *  statutory overtime, so a property needing certifiable weeks turns this off. */
  readonly allowUnpriceableDoubleTime?: boolean;
  /** Force whole-cent rates, for the properties whose equalities are exact only
   *  when every narrowing has no remainder (P-07). */
  readonly wholeCentRatesOnly?: boolean;
  readonly maxLineHours?: number;
}

function arbLineHours(max: number): fc.Arbitrary<{ st: number; ot: number; dt: number }> {
  return fc.tuple(
    fc.integer({ min: 0, max: Math.floor(max * 0.62) }),
    fc.integer({ min: 0, max: Math.floor(max * 0.19) }),
    fc.integer({ min: 0, max: Math.floor(max * 0.19) }),
  ).map(([st, ot, dt]) => ({ st, ot, dt }));
}

export function arbLine(index: number, options: LineOptions = {}): fc.Arbitrary<LineSpec> {
  const rateArb = options.wholeCentRatesOnly === true ? wholeCentRate : arbRateMilli;
  const maxHours = options.maxLineHours ?? 2_100;

  return fc
    .record({
      wdBase: rateArb,
      wdFringe: options.wholeCentRatesOnly === true ? fc.constant(0) : arbFringeMilli,
      cashRate: rateArb,
      /** Drawn as a FRACTION of the cash rate, because `cashInLieu` is by definition
       *  a portion of it (§3). Generating it independently would spend most of the
       *  suite's runs on the `AMBIGUOUS_RATE_BASIS` block instead of on arithmetic. */
      inLieuNumerator: fc.integer({ min: 0, max: 100 }),
      hasInLieu: fc.boolean(),
      hours: arbLineHours(maxHours),
      hasOtRate: fc.boolean(),
      otMultiplier: fc.integer({ min: 100, max: 250 }),
      dtChoice: fc.constantFrom<'null' | 'zero' | 'below' | 'exact' | 'above'>(
        'null',
        'zero',
        'below',
        'exact',
        'above',
      ),
      planCount: fc.integer({ min: 0, max: 2 }),
      planCredit: arbFringeMilli,
      isUnionGroup: fc.constant(false),
    })
    .map((draw): LineSpec => {
      const cash = draw.cashRate;
      // `baseRate` is `cashRate − cashInLieu`, so a whole-cent CASH RATE is not
      // enough to make the base rate a whole cent — a percentage of it generally is
      // not. Whole-cent mode therefore drops cash in lieu entirely, which is the
      // condition P-07's exact identity is actually stated over.
      const cashInLieu =
        draw.hasInLieu && options.wholeCentRatesOnly !== true
          ? Math.floor((cash * draw.inLieuNumerator) / 100)
          : 0;
      const dtHours = options.allowDoubleTime === true ? draw.hours.dt : 0;

      let dtRate: string | null = null;
      if (dtHours > 0) {
        const unpriceable = options.allowUnpriceableDoubleTime === true;
        const choice = unpriceable ? draw.dtChoice : draw.dtChoice === 'null' || draw.dtChoice === 'zero' || draw.dtChoice === 'below' ? 'above' : draw.dtChoice;
        switch (choice) {
          case 'null':
            dtRate = null;
            break;
          case 'zero':
            dtRate = '0.00';
            break;
          case 'below':
            dtRate = rateString(Math.floor(cash * 1.49));
            break;
          case 'exact':
            dtRate = rateString(cash * 2);
            break;
          case 'above':
            dtRate = rateString(cash * 3);
            break;
        }
      }

      const plans = Array.from({ length: draw.planCount }, (_unused, planIndex) => ({
        name: `plan-${planIndex}`,
        credit: rateString(draw.planCredit),
      }));

      return {
        lineId: `l${index}`,
        className: `CLASS ${index}`,
        wdBase: rateString(draw.wdBase),
        wdFringe: rateString(draw.wdFringe),
        isUnionGroup: draw.isUnionGroup,
        cashRate: rateString(cash),
        cashInLieu: rateString(cashInLieu),
        otRate: draw.hasOtRate ? rateString(Math.floor((cash * draw.otMultiplier) / 100)) : null,
        dtRate,
        st: hoursString(draw.hours.st),
        ot: hoursString(draw.hours.ot),
        dt: hoursString(dtHours),
        plans,
      };
    });
}

// ===========================================================================
// Weeks
// ===========================================================================

export interface WeekOptions extends LineOptions {
  readonly bands?: readonly ContractValueBand[];
  readonly minLines?: number;
  readonly maxLines?: number;
  readonly maxWorkers?: number;
  readonly allowUnmappedDeduction?: boolean;
  readonly maxDeductions?: number;
}

export function arbWorker(options: WeekOptions = {}, workerIndex = 0): fc.Arbitrary<WorkerSpec> {
  const minLines = options.minLines ?? 1;
  const maxLines = options.maxLines ?? 4;
  return fc
    .record({
      lineCount: fc.integer({ min: minLines, max: maxLines }),
      deductions: fc.array(
        fc.record({
          category: options.allowUnmappedDeduction === true
            ? fc.constantFrom<DeductionCategory>(...MAPPED_CATEGORIES, 'UNMAPPED')
            : fc.constantFrom<DeductionCategory>(...MAPPED_CATEGORIES),
          amountCents: fc.integer({ min: 0, max: 25_000 }),
        }),
        { minLength: 0, maxLength: options.maxDeductions ?? 8 },
      ),
      grossCents: fc.integer({ min: 0, max: 2_000_00 }),
    })
    .chain((draw) =>
      fc
        .tuple(
          ...Array.from({ length: draw.lineCount }, (_unused, index) =>
            arbLine(index, { ...options, maxLineHours: Math.floor(8_400 / maxLines) }),
          ),
        )
        .map((lines): WorkerSpec => {
          const deductionTotal = draw.deductions.reduce((sum, d) => sum + d.amountCents, 0);
          /** Column 7B must be at least the deductions, or column 9 is negative —
           *  a shape no cheque has. Reconciliation is the DEFAULT here; the
           *  `NET_RECONCILIATION_FAILED` path is exercised by a targeted unit test
           *  rather than by a fifth of every property's runs. */
          const gross = draw.grossCents + deductionTotal;
          return {
            /** Unique across the filing. A `ViolationFinding` carries a `lineId`, so
             *  two workers sharing `l0` would make every per-line assertion ambiguous
             *  — and would be an invalid CSV besides, since a line id is a row. */
            lines: lines.map((line, index) => ({ ...line, lineId: `w${workerIndex}l${index}` })),
            allWorkGross: (gross / 100).toFixed(2),
            deductions: draw.deductions.map((d, index) => ({
              label: `DED-${index}`,
              category: d.category,
              amount: (d.amountCents / 100).toFixed(2),
            })),
          };
        }),
    );
}

export function arbWeekSpec(options: WeekOptions = {}): fc.Arbitrary<WeekSpec> {
  const bands = options.bands ?? (['over_100k', 'at_or_under_100k', 'unknown'] as const);
  return fc
    .record({
      band: fc.constantFrom(...bands),
      workerCount: fc.integer({ min: 1, max: options.maxWorkers ?? 2 }),
    })
    .chain((draw) =>
      fc
        .tuple(...Array.from({ length: draw.workerCount }, (_unused, index) => arbWorker(options, index)))
        .map((workers): WeekSpec => ({ band: draw.band, workers: [...workers] })),
    );
}

export function arbEngineInput(options: WeekOptions = {}): fc.Arbitrary<EngineInput> {
  return arbWeekSpec(options).map(buildCase);
}

/** Every rate a spec carries, in `MilliRate` units — for the G-SUBCENT assertion. */
export function ratesOf(spec: WeekSpec): readonly number[] {
  return spec.workers.flatMap((worker) =>
    worker.lines.flatMap((line) => [
      MilliRate.fromDecimalString(line.wdBase),
      MilliRate.fromDecimalString(line.cashRate),
    ]),
  );
}

export function measureSubCentShare(specs: readonly WeekSpec[]): number {
  const rates = specs.flatMap(ratesOf);
  if (rates.length === 0) return 0;
  return rates.filter((r) => r % 100 !== 0).length / rates.length;
}
