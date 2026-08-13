/**
 * THE CANARY CASE MODEL AND THE EXACT-MATCH FIELD MAP.
 *
 * AUTHORITY: `ENGINE.md` §21–§25 (Part 3, the golden-payroll canary suite), and
 * D10's own words, which G1 quotes verbatim:
 *
 * > "A ≥500-line golden payroll suite spanning ≥25 WDs across ≥8 states, covering
 * > overtime, fringe credit, cash-in-lieu and deduction permutations, re-scored on
 * > every corpus refresh and every deploy. 100% exact match required; any
 * > divergence blocks index promotion and the build. No accuracy claim published
 * > until 30 consecutive green days."
 *
 * ===========================================================================
 * THE DESIGN INSIGHT THAT MAKES IT MORE THAN A REGRESSION SUITE
 *
 * The two failure modes it defends against are different, and only a cross-product
 * gate catches both:
 *
 *   - WE CHANGED THE CODE. Caught by any test suite. Gates the build.
 *   - THE CORPUS CHANGED UNDER US — or our parse of it did. NOT caught by any test
 *     suite that fixtures its own data. This is the one that matters, because the
 *     real enemy is "SAM is up and wrong", or "SAM is up and our parser is wrong".
 *     Both produce a plausible-looking snapshot.
 *
 * So the same lines run against three `(code, corpus)` pairs, and the suite gates
 * BOTH the build and the index.
 *
 * ===========================================================================
 * PINNING (E9) — WHY A CASE IS KEYED `(case_id, wd_snapshot_id)`
 *
 * When a WD publishes a new revision, the pinned case KEEPS its expectation and a
 * NEW case is added for the new revision. A pinned case's output changing means our
 * parse of an IMMUTABLE HISTORICAL DOCUMENT changed — which is always a bug in us,
 * never a change upstream. Without pinning, "the WD changed" becomes a universal
 * excuse that absorbs every parser regression, and the corpus gate stops gating.
 *
 * ===========================================================================
 * THREE ORACLE CLASSES, AND THE DIFFERENT AUTHORITY OF EACH
 *
 *   1 REGULATORY — DOL authored the expected value. NEVER regenerable; no flag
 *     exists. If DOL is wrong, DOL is still the oracle, because DOL is who audits
 *     the customer.
 *   2 FROZEN — our engine authored it once, reviewed line-by-line against the cited
 *     regulation, then frozen. Regenerable only via `--regenerate` AND a `REGEN.md`
 *     entry naming the regulation and the reason.
 *   3 METAMORPHIC — nobody authored it: a relation, not an answer. Those live in the
 *     property suite, not here.
 *
 * Class 2 is where the discipline lives. The failure mode of every golden-file suite
 * is the reflex `--update-snapshots` after a red build, which converts the suite
 * from a specification into a transcript.
 *
 * Labelling an authored figure class 1 to make it feel more binding would corrupt
 * the one distinction §23 exists to protect: nobody at DOL published $1,534.92.
 */

import { Cents, Hours, MilliRate } from '@/lib/money';
import type { ArtifactVerdict, Freshness } from '@/lib/types';

import type { FilingComputation } from '../arithmetic/model';
import type { EngineInput } from '../arithmetic/week';

export type OracleClass = 1 | 2 | 3;

export type ConstructionType = 'building' | 'heavy' | 'highway' | 'residential';

/** A field map is flat, ordered and primitive-valued so `expected === actual` is a
 *  total predicate over it. Tolerance: none (§25). A one-cent difference is a
 *  failure, because it means the rounding rule moved, and a rounding rule that
 *  moves once will move again on a bigger number. */
export type FieldMap = Readonly<Record<string, string | number | boolean | null>>;

export interface CanaryCase {
  readonly caseId: string;
  readonly oracleClass: OracleClass;
  /** The citation, for class 1; `"authored, §n"` for class 2. */
  readonly source: string;
  /** What this case pins, in one sentence, and against which field. */
  readonly asserts: string;
  /** E9's pinning key. A new WD revision creates a NEW case; it never edits this. */
  readonly wdSnapshotId: string;
  readonly stateCode: string;
  readonly constructionType: ConstructionType;
  readonly input: EngineInput;
  /** Only the fields this case pins. A regulatory case pins what DOL published and
   *  nothing more — asserting an unpublished field against a class-1 label would be
   *  giving our own arithmetic DOL's authority. */
  readonly expected: FieldMap;
}

/**
 * The determinism harness's freshness value.
 *
 * Fixed, injected, and never `new Date()` at call time. §25: "TZ=UTC, a fixed
 * injected clock, LANG=C, no locale-sensitive formatting, no RNG." The engine reads
 * no clock, so this only reaches `deriveStatus`, which uses the STATE and not the
 * timestamps — but a canary input carrying a live clock would still be the
 * `NONDETERMINISM` failure, and that failure invalidates the gate itself.
 */
export const CANARY_FRESHNESS: Freshness = {
  state: 'FRESH',
  corpusVerifiedAt: new Date('2026-08-13T02:00:00.000Z'),
  checkedAt: new Date('2026-08-13T02:00:00.000Z'),
};

/**
 * Every field §25 names, flattened into one comparable map.
 *
 * "Also compared, because §7.0 and §7.3 made them load-bearing and AN UNCOMPARED
 * FIELD IS AN UNTESTED ONE: `contractValueBand`, `hoursWorked`, `statutoryOtHours`,
 * `regularRate`, `premiumOwed`, `premiumCredit`, `cwhssaPremium`,
 * `premiumPaidTotal` and `dbaCompensationDue`."
 *
 * Money is emitted as integer cents and hours as integer hundredths — the values
 * themselves, not formatted strings. A formatted string would fold a rendering
 * decision into an arithmetic comparison, and the two fail for different reasons.
 * PDF bytes are deliberately absent: font metrics and library versions produce byte
 * differences that carry no arithmetic meaning, and folding them in would train
 * everyone to treat red as noise (§25).
 */
export function flattenFiling(computation: FilingComputation, verdict: ArtifactVerdict): FieldMap {
  const out: Record<string, string | number | boolean | null> = {};

  out['filing.weekEnding'] = computation.weekEnding;
  out['filing.contractValueBand'] = computation.contractValueBand;
  out['filing.wdNumber'] = computation.wdNumber;
  out['filing.revision'] = computation.revision;
  out['filing.wdPublishedDate'] = computation.wdPublishedDate;
  out['filing.status'] = verdict.status;
  out['filing.signatureBlockRendered'] = verdict.status !== 'DRAFT_NOT_CERTIFIABLE';
  out['filing.blockReasons'] = [...computation.allBlockReasons].join(',');
  out['filing.filingBlockReasons'] = [...computation.filingBlockReasons].join(',');
  out['filing.totalCol7A'] = computation.totalCol7A;
  out['filing.totalCol7B'] = computation.totalCol7B;
  out['filing.totalDeductions'] = computation.totalDeductions;
  out['filing.totalCwhssaPremium'] = computation.totalCwhssaPremium;
  out['filing.totalHoursWorked'] = computation.totalHoursWorked;
  out['filing.soc.box1'] = computation.statementOfCompliance.box1;
  out['filing.soc.box2'] = computation.statementOfCompliance.box2;
  out['filing.soc.box3'] = computation.statementOfCompliance.box3;
  out['filing.soc.box4'] = computation.statementOfCompliance.box4;
  out['filing.soc.box5'] = computation.statementOfCompliance.box5;
  out['filing.soc.box6'] = computation.statementOfCompliance.box6;
  out['filing.findings'] = computation.findings
    .map((f) => `${f.flag}:${f.lineId ?? '-'}:${f.shortfall}`)
    .join('|');

  computation.workers.forEach((worker, w) => {
    const p = `worker[${w}]`;
    out[`${p}.status`] = worker.status;
    out[`${p}.hoursWorked`] = worker.hoursWorked;
    out[`${p}.statutoryOtHours`] = worker.statutoryOtHours;
    out[`${p}.reportedOtHours`] = worker.reportedOtHours;
    out[`${p}.straightTimeEarnings`] = worker.straightTimeEarnings;
    out[`${p}.regularRate`] = worker.regularRate;
    out[`${p}.premiumOwed`] = worker.premiumOwed;
    out[`${p}.premiumCredit`] = worker.premiumCredit;
    out[`${p}.cwhssaPremium`] = worker.cwhssaPremium;
    out[`${p}.premiumPaidTotal`] = worker.premiumPaidTotal;
    out[`${p}.col7A`] = worker.col7A;
    out[`${p}.col7B`] = worker.col7B;
    out[`${p}.deductionTotal`] = worker.deductionTotal;
    out[`${p}.netComputed`] = worker.netComputed;
    out[`${p}.netPaid`] = worker.netPaid;
    out[`${p}.dbaCompensationDue`] = worker.dbaCompensationDue;
    out[`${p}.blockReasons`] = [...worker.blockReasons].join(',');
    out[`${p}.narrowingSites`] = worker.narrowing.siteCount;
    worker.deductions.forEach((deduction) => {
      out[`${p}.col8[${deduction.category}]`] = deduction.amount;
    });
    worker.lines.forEach((line, l) => {
      const q = `${p}.line[${l}]`;
      out[`${q}.classification`] = line.classificationId;
      out[`${q}.stHours`] = line.stHours;
      out[`${q}.otHours`] = line.otHours;
      out[`${q}.dtHours`] = line.dtHours;
      out[`${q}.totalHours`] = line.totalHours;
      out[`${q}.col6A.st`] = line.col6AStraightTime;
      out[`${q}.col6A.ot`] = line.col6AOvertime;
      out[`${q}.col6B`] = line.col6B;
      out[`${q}.col6C`] = line.col6C;
      out[`${q}.straightTimeCash`] = line.straightTimeCash;
      out[`${q}.doubleTimeCash`] = line.doubleTimeCash;
      out[`${q}.baseRate`] = line.baseRate;
      out[`${q}.requiredTotal`] = line.requiredTotal;
      out[`${q}.paidTotal`] = line.paidTotal;
      out[`${q}.resolutionState`] = line.resolutionState;
      out[`${q}.blockReasons`] = [...line.blockReasons].join(',');
      line.dayHours.forEach((day, d) => {
        out[`${q}.day[${d}].st`] = day.st;
        out[`${q}.day[${d}].ot`] = day.ot;
        out[`${q}.day[${d}].dt`] = day.dt;
      });
    });
  });

  return out;
}

// ===========================================================================
// Expectation helpers — so a fixture reads like the regulation it transcribes
// ===========================================================================

/** `"$662.00"` as the integer cents the engine compares. Written as a decimal
 *  string so a fixture line can be read against DOL's published sentence without
 *  anyone doing arithmetic in their head — which is how a transcription error
 *  enters a suite whose whole value is that its answers came from elsewhere. */
export function dollars(decimal: string): number {
  const rate = MilliRate.fromDecimalString(decimal);
  if (rate % 100 !== 0) throw new Error(`${decimal} is not a whole number of cents`);
  return Cents.of(rate / 100);
}

/** `"480.00"` as the exact micro-dollars `straightTimeEarnings` carries. DOL's
 *  Step 1 prints a dollar figure; the engine holds the exact numerator, and the
 *  two are the same quantity in different units. */
export function microDollars(decimal: string): number {
  return dollars(decimal) * 10_000;
}

/** `"44"` or `"37.25"` as integer hundredths of an hour. */
export function hours(decimal: string): number {
  return Hours.fromDecimalString(decimal);
}

/** `"36.85"` as a `MilliRate`'s integer ten-thousandths. */
export function rate(decimal: string): number {
  return MilliRate.fromDecimalString(decimal);
}
