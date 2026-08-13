/**
 * CASE BUILDERS — a payroll week and its pinned rate table, as one value.
 *
 * AUTHORITY: `ENGINE.md` §3 (the line and week model), §24 (pinning, **E9**), §22
 * (the permutation matrix these builders have to be able to express).
 *
 * ===========================================================================
 * WHY THE BUILDER LIVES IN `src/engine` AND NOT IN `tests/`
 *
 * Because a canary case is a PRODUCTION ARTIFACT, not a test fixture. §24 runs the
 * same 500 lines in three places — per commit, before index promotion, and after
 * deploy — and only the first of those is a test run. The pre-promotion run is the
 * one that catches the enemy §21 names: "SAM is up and wrong", or "SAM is up and
 * our parser is wrong". Both produce a plausible-looking snapshot, and the only
 * defence is to compute the snapshot in full, score it against answers we already
 * know, and THEN decide whether it becomes visible. A builder that only existed
 * under `tests/` could not be called from the promotion path.
 *
 * ===========================================================================
 * WHAT A BUILDER MAY NOT DO
 *
 * It may not compute. Every expected value in this suite is authored — by DOL
 * (class 1) or by us once, reviewed line-by-line against the cited regulation and
 * then frozen (class 2) — and a builder that derived an expectation from the engine
 * would convert the suite from a specification into a transcript. That is the
 * failure mode of every golden-file suite, and it is why `--regenerate` requires a
 * `REGEN.md` entry naming the regulation and the reason (§23).
 *
 * So these functions assemble INPUTS only. `allWorkGross` and `netPaid` default to
 * a self-consistent pair rather than to anything the engine produced: column 7B and
 * column 9 are customer-supplied and RECONCILED, never computed (§9.3 D3).
 */

import { Cents, Hours, MilliRate } from '@/lib/money';
import {
  classificationIdFromMirrorRow,
  isoDate,
  sha256Hex,
  wdNumber,
  type ClassificationId,
  type ContractValueBand,
  type DayHours,
  type DeductionEntry,
  type FringePlanCredit,
  type PayrollLine,
  type PayrollWeek,
  type PinRef,
  type ProjectRef,
  type SnapshotRef,
  type WdPin,
  type WorkerRef,
  type WorkerWeek,
} from '@/lib/types';

import { pinnedRateTable, type PinnedRateTable, type WdRate } from '../arithmetic/rates';
import type { EngineInput } from '../arithmetic/week';

const ZERO_DAY: DayHours = { st: Hours.of(0), ot: Hours.of(0), dt: Hours.of(0) };

/** Seven entries, always. The CA eCPR XSD declares `day` with `minOccurs="7"
 *  maxOccurs="7"`, so matching the strictest downstream consumer means the XML
 *  renderer never has to invent a day. */
export type DayGrid = readonly [DayHours, DayHours, DayHours, DayHours, DayHours, DayHours, DayHours];

function emptyGrid(): DayGrid {
  return [ZERO_DAY, ZERO_DAY, ZERO_DAY, ZERO_DAY, ZERO_DAY, ZERO_DAY, ZERO_DAY];
}

/** Weekly bucket totals placed on one day. Day placement changes no output field
 *  (P-08) — the engine never reads a clock and the workweek is a project setting,
 *  not a calendar inference (§4 A3) — so a case that does not care about the grid
 *  states its totals and a case that does states its days. */
export function daysFromTotals(input: {
  readonly st?: string;
  readonly ot?: string;
  readonly dt?: string;
  readonly onDay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}): DayGrid {
  const grid = [...emptyGrid()] as DayHours[];
  const day = input.onDay ?? 1;
  grid[day] = {
    st: Hours.fromDecimalString(input.st ?? '0'),
    ot: Hours.fromDecimalString(input.ot ?? '0'),
    dt: Hours.fromDecimalString(input.dt ?? '0'),
  };
  return grid as unknown as DayGrid;
}

/** Explicit per-day buckets, for cases where DOL's own example places the hours —
 *  FOH 15k11(b)'s painter 8+8+8 and electrician 8+8+4, with the four overtime hours
 *  falling on Saturday. */
export function daysFrom(spec: readonly { st?: string; ot?: string; dt?: string }[]): DayGrid {
  const grid = [...emptyGrid()] as DayHours[];
  spec.forEach((entry, index) => {
    if (index > 6) throw new Error('a workweek has seven days');
    grid[index] = {
      st: Hours.fromDecimalString(entry.st ?? '0'),
      ot: Hours.fromDecimalString(entry.ot ?? '0'),
      dt: Hours.fromDecimalString(entry.dt ?? '0'),
    };
  });
  return grid as unknown as DayGrid;
}

export interface ClassSpec {
  /** The determination's own words. Ratepin never authors scope text. */
  readonly className: string;
  /** `BHR_WD`, as the determination prints it: `"12.00"`. Parsed exactly, never
   *  through `parseFloat`. */
  readonly wdBase: string;
  /** `FRINGE_WD`. Eight of the ten rows in §15.3's live extract carry `"0.00"`. */
  readonly wdFringe: string;
  readonly isUnionGroup?: boolean;
  readonly rateIdentifier?: string;
}

export interface LineSpec extends ClassSpec {
  readonly lineId?: string;
  /** The GROSS straight-time cash rate actually paid (5.32(a)). */
  readonly cashRate: string;
  /** Customer-asserted portion of `cashRate` paid in lieu of fringe. */
  readonly cashInLieu?: string;
  readonly otRate?: string | null;
  readonly dtRate?: string | null;
  readonly days?: DayGrid;
  readonly st?: string;
  readonly ot?: string;
  readonly dt?: string;
  readonly plans?: readonly { readonly name: string; readonly credit: string }[];
  /** Set to simulate a line the classification ladder has not resolved. */
  readonly unresolved?: boolean;
  /** Set to simulate a classification absent from the pinned revision. */
  readonly notOnDetermination?: boolean;
}

export interface WorkerSpec {
  readonly ref?: string;
  readonly status?: 'J' | 'RA';
  readonly apprentice?: {
    readonly programName: string;
    readonly registrar: 'OA' | 'SAA';
    readonly levelOfProgression: string;
  };
  readonly lines: readonly LineSpec[];
  /** Column 7B. Defaults to zero: DOL's worked examples publish no all-work gross,
   *  and inventing one would put a number in a compared field that no oracle
   *  authored. */
  readonly allWorkGross?: string;
  readonly deductions?: readonly { readonly label: string; readonly category: DeductionEntry['category']; readonly amount: string }[];
  /** Column 9. Defaults to `7B − Σ deductions`, the reconciling value, so a case
   *  that is not about reconciliation does not accidentally test it. */
  readonly netPaid?: string;
}

export interface WeekSpec {
  readonly weekEnding?: string;
  readonly workweekStartDay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  readonly band: ContractValueBand;
  readonly wd?: string;
  readonly revision?: number;
  readonly publishDate?: string;
  readonly workers: readonly WorkerSpec[];
}

function cents(decimal: string): Cents {
  const rate = MilliRate.fromDecimalString(decimal);
  if (rate % 100 !== 0) {
    throw new Error(`${decimal} is not a whole number of cents; column 7B and column 9 are cent figures`);
  }
  return Cents.of(rate / 100);
}

function plansOf(spec: LineSpec): readonly FringePlanCredit[] {
  return (spec.plans ?? []).map((plan) => ({
    planName: plan.name,
    hourlyCredit: MilliRate.fromDecimalString(plan.credit),
  }));
}

/**
 * Build the input pair. Deterministic in every respect: identifiers are derived
 * from ordinals rather than generated, so the same spec produces byte-identical
 * values on every machine and in every year (E1).
 */
export function buildCase(spec: WeekSpec): EngineInput {
  const wd = wdNumber(spec.wd ?? 'VA20260195');
  const revision = spec.revision ?? 2;
  const publishDate = isoDate(spec.publishDate ?? '2026-08-06');
  const snapshotRef = 'snapshot-canary' as SnapshotRef;

  const rates: WdRate[] = [];
  const idFor = new Map<string, ClassificationId>();
  let ordinal = 0;

  for (const worker of spec.workers) {
    for (const line of worker.lines) {
      const key = `${line.className}|${line.wdBase}|${line.wdFringe}`;
      if (idFor.has(key)) continue;
      const classificationId = classificationIdFromMirrorRow({
        wdNumber: wd,
        revision,
        parserVersion: 1,
        ordinal,
      });
      idFor.set(key, classificationId);
      ordinal += 1;
      if (line.notOnDetermination === true) continue;
      rates.push({
        classificationId,
        basicHourlyRate: MilliRate.fromDecimalString(line.wdBase),
        fringeRate: MilliRate.fromDecimalString(line.wdFringe),
        isUnionGroup: line.isUnionGroup ?? false,
        rateIdentifier: line.rateIdentifier ?? 'SUVA2016-080',
        classNameVerbatim: line.className,
        sourceLineStart: 100 + ordinal,
        sourceLineEnd: 100 + ordinal,
      });
    }
  }

  const pin: WdPin = {
    pinId: 'pin-canary' as PinRef,
    projectId: 'project-canary' as ProjectRef,
    wdNumber: wd,
    revision,
    wdPublishedDate: publishDate,
    snapshotId: snapshotRef,
    /** A FIXED instant. §25's determinism harness pins TZ, the clock and the
     *  locale; the engine reads none of them, and a canary case that carried
     *  `new Date()` would be the `NONDETERMINISM` failure §27 ranks above every
     *  other — a different answer on each run leaves every other result unproven. */
    pinnedAt: new Date('2026-01-01T00:00:00.000Z'),
    freshnessCheckedAt: new Date('2026-01-01T00:00:00.000Z'),
    freshnessState: 'FRESH',
  };

  const workers: WorkerWeek[] = spec.workers.map((worker, workerIndex) => {
    const lines: PayrollLine[] = worker.lines.map((line, lineIndex) => {
      const key = `${line.className}|${line.wdBase}|${line.wdFringe}`;
      const classificationId = idFor.get(key) ?? null;
      const days =
        line.days ?? daysFromTotals({ st: line.st, ot: line.ot, dt: line.dt });
      return {
        lineId: line.lineId ?? `w${workerIndex}l${lineIndex}`,
        ordinal: lineIndex,
        rawTitle: line.className,
        titleNorm: line.className.toUpperCase(),
        classificationId: line.unresolved === true ? null : classificationId,
        resolvedAtLevel: line.unresolved === true ? null : 'L_A',
        dayHours: days,
        cashRate: MilliRate.fromDecimalString(line.cashRate),
        cashInLieu: MilliRate.fromDecimalString(line.cashInLieu ?? '0'),
        otRate: line.otRate === undefined || line.otRate === null ? null : MilliRate.fromDecimalString(line.otRate),
        dtRate: line.dtRate === undefined || line.dtRate === null ? null : MilliRate.fromDecimalString(line.dtRate),
        fringeCreditPlans: plansOf(line),
        resolutionState: line.unresolved === true ? 'pending' : 'resolved',
        blockReasons: [],
      };
    });

    const deductions: DeductionEntry[] = (worker.deductions ?? []).map((entry) => ({
      rawLabel: entry.label,
      category: entry.category,
      amount: cents(entry.amount),
    }));
    const allWorkGross = cents(worker.allWorkGross ?? '0');
    const deductionTotal = Cents.sum(deductions.map((d) => d.amount));
    const netPaid =
      worker.netPaid === undefined ? Cents.sub(allWorkGross, deductionTotal) : cents(worker.netPaid);

    const base = {
      workerRef: (worker.ref ?? `worker-${workerIndex}`) as WorkerRef,
      status: worker.status ?? 'J',
      lines,
      allWorkGross,
      deductions,
      netPaid,
    } satisfies Omit<WorkerWeek, 'apprentice'>;

    return worker.apprentice === undefined ? base : { ...base, apprentice: worker.apprentice };
  });

  const week: PayrollWeek = {
    weekEnding: isoDate(spec.weekEnding ?? '2026-08-07'),
    workweekStartDay: spec.workweekStartDay ?? 0,
    contractValueBand: spec.band,
    pin,
    workers,
  };

  const table: PinnedRateTable = pinnedRateTable({
    wdNumber: wd,
    revision,
    publishDate,
    snapshotRef,
    rates,
  });

  return { week, rates: table };
}

/** A fixed digest for cases that need one. Never a hash of anything — the mirror
 *  computes real digests, and a canary input carrying a computed one would make
 *  the case depend on a hash function's version. */
export const CANARY_SNAPSHOT_SHA = sha256Hex('c'.repeat(64));
