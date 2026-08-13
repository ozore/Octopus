/**
 * THE DETERMINISTIC CORE — one payroll week in, one computation out.
 *
 * AUTHORITY: `ENGINE.md` §3 (the line and week model), §4 (Stage A), §5 (Stage B),
 * §6 (Stage C), §7 (Stage D), §8 (Stage E, and §8.1's CRIT-2 correction), §9 (Stage
 * F), §10 (Stage G), §11 (the rounding discipline), §13 (what the core refuses).
 *
 * ===========================================================================
 * E1 — WHAT "PURE" MEANS HERE, AND WHY IT IS THE WHOLE GATE
 *
 * "The money arithmetic is a pure function over integer cents with no clock, no
 * locale, no randomness and no I/O. Given the same inputs it returns byte-identical
 * output a year later on a different machine."
 *
 * That is what makes a $0.01 divergence a BUILD FAILURE rather than a tolerance.
 * G1 requires "100% exact match; any divergence blocks index promotion and the
 * build", and you cannot write that sentence about a stochastic process. Anything
 * non-deterministic in this file would force G1 to become an approximate gate, and
 * an approximate gate on a federal false-statement surface is not a gate.
 *
 * So this module imports `@/lib/money` and `@/lib/types` — value types with no
 * edges — and its own siblings, and nothing else. No `Date.now()`, no `Intl`, no
 * `Math.random`, no `fetch`, no database, no model. The import-boundary check
 * (`ARCHITECTURE.md` §3.10) fails the build on any edge out of here; the offline
 * test suite is the same claim executed rather than declared.
 *
 * ===========================================================================
 * COLUMN 7A, STATED ONCE SO IT CANNOT BE MISREAD (§8, §8.1)
 *
 *     col7A = Σ Cents((st + ot) × cashRate)      // N3, per line
 *           + Σ Cents(dt × dtRate)               // N4, per line
 *           + cwhssaPremium                      // 0 unless over_100k
 *
 *   | column  | contains                                   | relation to 7A       |
 *   | col6A_st| cashRate − cashInLieu                       | rate, not money      |
 *   | col6C   | cashInLieu × totalHours                     | ⊆ 7A, counted once   |
 *   | col6B   | employer contributions / costs              | ∉ 7A, never wages    |
 *   | col7A   | gross earned on this project                | the sum above        |
 *
 * 6B and 6C are asymmetric, and that asymmetry IS the point of the two columns.
 * Under the all-cash discharge (5.31(b)(2)) the fringe obligation is met with
 * dollars that ARE wages, so they sit in 6C and inside 7A. Under the contributions
 * method (5.31(b)(1)) it is met with dollars that are NOT wages, so they sit in 6B
 * and outside 7A. They must never be summed into one "fringe" figure, and neither
 * may be added to gross: 6B because it was never in it, 6C because it always was.
 *
 * ===========================================================================
 * WHY NO TEST CAUGHT THE OLD 7A, AND WHAT REPLACED THEM
 *
 * P-01 tested the net identity against 7B, not 7A. P-05 (monotone in hours) passed
 * under both formulas. P-02 as previously written passed under both. The G1 canary
 * would have caught it only if a class-2 expectation happened to be authored from
 * §7.6 rather than §8 — that is, by luck. P-16 tests 7A's COMPOSITION directly and
 * fails under the withdrawn formula on any week with `cashInLieu > 0`.
 */

import { Cents, Hours, MicroDollars, type MilliRate } from '@/lib/money';
import type {
  BlockReason,
  ContractValueBand,
  PayrollLine,
  PayrollWeek,
  WorkerWeek,
} from '@/lib/types';

import { computeLineCompliance, premiumBelowStatutory } from './compliance';
import { baseRate, computeCwhssa, premiumHoursUnproven, type PreparedLine } from './cwhssa';
import { computeDeductions } from './deductions';
import { col6AStraightTime, col6B as computeCol6B, col6C as computeCol6C } from './fringe';
import { dtHours, otHours, stHours, totalHours } from './hours';
import type {
  FilingComputation,
  LineComputation,
  StatementOfComplianceBoxes,
  ViolationFinding,
  WorkerComputation,
} from './model';
import { createLedger, type LedgerRecorder } from './narrowing';
import { assertTableMatchesPin, type PinnedRateTable, type WdRate } from './rates';

/**
 * The engine's whole input surface. Two values and nothing else: the week, and the
 * rates the caller resolved from the pinned mirror. A canary case is exactly this
 * pair, which is what lets a case pinned to a 2026 snapshot recompute in 2028 with
 * no database and no network (E9).
 */
export interface EngineInput {
  readonly week: PayrollWeek;
  readonly rates: PinnedRateTable;
}

// ===========================================================================
// Input validation — the refusals that come from the row itself
// ===========================================================================

/**
 * Every block the arithmetic can raise about one line, before any money moves.
 *
 * Each is a case where the correct behaviour is to say what is missing rather than
 * to allocate, infer or default. 29 CFR 5.5(a)(1)(i) is the shape of the whole
 * posture: per-classification rates are permitted "Provided, That the employer's
 * payroll records accurately set forth the time spent in each classification" — a
 * condition on the RECORDS. If we do not have the records, a heuristic would be us
 * manufacturing the very record the regulation requires the employer to have kept.
 */
function validateLine(line: PayrollLine, wdRate: WdRate | null, col6BTotal: Cents): BlockReason[] {
  const blocks: BlockReason[] = [];

  // The line arrived unresolved from the classification ladder. Its own reasons win.
  if (line.resolutionState !== 'resolved') {
    for (const reason of line.blockReasons) blocks.push(reason);
    if (line.classificationId === null && !blocks.includes('UNMAPPED_TRADE')) {
      blocks.push('UNMAPPED_TRADE');
    }
    if (blocks.length === 0) blocks.push('UNMAPPED_TRADE');
  } else {
    for (const reason of line.blockReasons) blocks.push(reason);
    if (line.classificationId === null) blocks.push('UNMAPPED_TRADE');
  }

  /**
   * The class is named but the pinned revision does not carry it. `ClassificationId`
   * is branded and constructible only from a mirror row, so this is not a typo — it
   * is a row that was parsed once and is not in the table we were handed. An
   * unparsed class surfaces as unavailable, never silently dropped, because a
   * silently dropped class is how the picker offers a wrong best answer.
   */
  if (line.classificationId !== null && wdRate === null) {
    blocks.push('UNPARSED_CLASSIFICATION');
  }

  /**
   * Negative hours or a negative rate. The adversarial suite (§26) sends both. There
   * is no arithmetic reading of a negative hour on a certified payroll, and the
   * engine will not net it against a positive one.
   */
  const negativeHours = line.dayHours.some((d) => d.st < 0 || d.ot < 0 || d.dt < 0);
  if (negativeHours || line.cashRate < 0 || line.cashInLieu < 0) {
    blocks.push('MISSING_REQUIRED_FIELD');
  }

  /**
   * P-17 — cash in lieu exceeding the cash actually paid.
   *
   * `cashInLieu` is a PORTION OF `cashRate` (§3), so a value above it is not a
   * generous assertion, it is an unrepresentable one: `col6A_st` would be negative
   * and `col6C` would exceed the cash the worker received. §8.1 names this block
   * `CASH_IN_LIEU_EXCEEDS_CASH_RATE`; that member does not exist in the shared
   * `BlockReason` union (`src/lib/types.ts`), which this module does not own, so it
   * maps to the closest true member — the composition of the rate as asserted
   * cannot be resolved. Reported upstream as a spec/scaffold divergence.
   */
  if (line.cashInLieu > line.cashRate) {
    blocks.push('AMBIGUOUS_RATE_BASIS');
  }

  /**
   * A premium bucket carrying hours and no rate at all.
   *
   * `null` is not zero (§3): a bucket with hours but no rate cannot be priced into
   * column 7A, and 7A is "the worker's gross amount earned for the workweek for
   * hours worked on this project". Pricing those hours at zero would understate
   * gross on a signed federal document; pricing them at `cashRate` would be
   * deciding, on the customer's behalf, that the export mis-labelled them.
   *
   * §7.3 says the PREMIUM rule does not fire below forty hours, and it does not —
   * `PREMIUM_HOURS_UNPROVEN` is raised only by `premiumHoursUnproven`. This is a
   * different question with a different answer: the premium rule asks whether an
   * obligation was discharged, and this asks whether gross is computable at all. It
   * resolves through the same P-A closed choice, so it costs the customer the same
   * single action. Reported upstream, since §7.3's "the line renders" sentence
   * reads as though it settles both.
   */
  if (dtHours(line) > 0 && line.dtRate === null) {
    blocks.push('MISSING_REQUIRED_FIELD');
  }

  /**
   * R-BUILD H-3 — a credit claimed against an UNFUNDED plan.
   *
   * WHAT WAS WRONG. `FringePlanCredit` carried no `unfunded` field, so an unfunded
   * plan was indistinguishable from a funded one. Its credit was narrowed at N1 into
   * column 6B, printed there, used to check box 5 of the statement of compliance,
   * and added to `paidTotal` — where it can carry a line over `requiredTotal` and
   * suppress `WD_UNDERPAYMENT` outright. The marketing copy told the customer we
   * refuse unfunded plans; the engine credited them.
   *
   * VERIFIED AGAINST. 29 CFR 5.28(b), eCFR versioner API, fetched 2026-08-13
   * (title-29 issue 2026-08-11): such a plan "may not constitute a fringe benefit
   * within the meaning of the Act unless" five conditions hold, the fifth of which is
   * that "the contractor or subcontractor requests and receives approval of the plan
   * or program from the Secretary, as described in paragraph (c) of this section."
   * Whether that approval exists is a fact about a filing with the Wage and Hour
   * Division, and no payroll export contains it — so the credit is not evaluable, and
   * taking it would be Ratepin deciding a question 5.28(c) reserves to the Secretary.
   *
   * It BLOCKS rather than dropping the credit silently. Dropping it would restate the
   * contractor's own assertion about their money without telling them, and would move
   * column 6B on a signed federal document; the P-A names 5.28(c)'s approval path,
   * which is a route the customer can walk alone.
   */
  if (line.fringeCreditPlans.some((plan) => plan.unfunded)) {
    blocks.push('UNFUNDED_PLAN_CREDIT');
  }

  /**
   * ES-4, the NARROWED union refusal. `ARCHITECTURE.md` §5.2/§15's blanket
   * `is_union_group` setup refusal is superseded: refuse only a 6B CREDIT CLAIM.
   *
   * A contractor paying `ELEC0080-011`'s `$36.85 + $14.13` entirely in cash under
   * 5.31(b)(2) needs no CBA schedule at all — the WD's own aggregate figure fully
   * supports the payment, and refusing them at project setup refuses a paying
   * customer with no compliance problem to solve. What we cannot evaluate is a
   * CREDIT claimed against a schedule we do not hold, which is exactly `col6B > 0`.
   */
  if (wdRate !== null && wdRate.isUnionGroup && col6BTotal > 0) {
    blocks.push('UNION_GROUP_REFUSED');
  }

  return blocks;
}

/** Stable, de-duplicated block list. Order is the order raised, so the exception
 *  report reads in the order the arithmetic discovered the problems. */
function dedupe(reasons: readonly BlockReason[]): readonly BlockReason[] {
  const seen = new Set<BlockReason>();
  const out: BlockReason[] = [];
  for (const reason of reasons) {
    if (seen.has(reason)) continue;
    seen.add(reason);
    out.push(reason);
  }
  return out;
}

// ===========================================================================
// One worker-week
// ===========================================================================

function prepareLine(
  line: PayrollLine,
  ordinal: number,
  rates: PinnedRateTable,
  band: ContractValueBand,
): PreparedLine {
  const wdRate = line.classificationId === null ? null : rates.lookup(line.classificationId);
  return {
    input: line,
    ordinal,
    scope: `line:${line.lineId}`,
    wdRate,
    stHours: stHours(line),
    otHours: otHours(line),
    dtHours: dtHours(line),
    totalHours: totalHours(line),
    baseRate: baseRate(line, wdRate, band),
  };
}

export function computeWorkerWeek(input: {
  readonly worker: WorkerWeek;
  readonly rates: PinnedRateTable;
  readonly band: ContractValueBand;
}): WorkerComputation {
  const { worker, rates, band } = input;
  const ledger = createLedger();
  const prepared = worker.lines.map((line, index) => prepareLine(line, index, rates, band));

  // -----------------------------------------------------------------------
  // Stages C, E and G, per line. Narrowing happens at the (line, column) the
  // figure belongs to (R2) and the column totals are sums of already-narrowed
  // cents — never a recomputation from micro-dollars, which is how a penny
  // appears from nowhere (R4).
  // -----------------------------------------------------------------------
  interface PerLine {
    readonly prepared: PreparedLine;
    readonly col6B: Cents;
    readonly col6C: Cents;
    readonly straightTimeCash: Cents;
    readonly doubleTimeCash: Cents;
    readonly requiredTotal: Cents;
    readonly paidTotal: Cents;
    /** The N10 cash term alone. Carried so the two C-1 bounds (`compliance.ts`) are
     *  assertable at the line without re-deriving them from `paidTotal − col6B`. */
    readonly straightTimeEquivalentCash: Cents;
    readonly findings: readonly ViolationFinding[];
    readonly blockReasons: readonly BlockReason[];
  }

  const perLine: PerLine[] = prepared.map((line) => {
    const scope = line.scope;
    const recorder: LedgerRecorder = ledger;

    const col6B = computeCol6B(line.input.fringeCreditPlans, line.totalHours, recorder, scope);
    const col6C = computeCol6C(line.input.cashInLieu, line.totalHours, recorder, scope);

    // N3 — every hour in the straight-time and overtime buckets enters gross at the
    // straight-time cash rate. DOL's Method-1 shape: the half-time premium is a
    // separate addend, computed once for the week, not folded into the ot rate.
    const stOtHours = Hours.of(line.stHours + line.otHours);
    const straightTimeCash = recorder.narrow(
      'N3',
      scope,
      MicroDollars.fromRateHours(line.input.cashRate, stOtHours),
    );

    // N4 — double time prices its own hours. Absent a rate the bucket cannot be
    // priced and the line is blocked above; contributing zero here keeps the draft
    // renderable without asserting that nothing was paid.
    const doubleTimeCash =
      line.dtHours > 0 && line.input.dtRate !== null
        ? recorder.narrow('N4', scope, MicroDollars.fromRateHours(line.input.dtRate, line.dtHours))
        : Cents.of(0);

    const compliance = computeLineCompliance({
      line: line.input,
      wdRate: line.wdRate,
      allHours: line.totalHours,
      stOtHours,
      dtHours: line.dtHours,
      col6B,
      col6C,
      ledger: recorder,
      scope,
    });

    return {
      prepared: line,
      col6B,
      col6C,
      straightTimeCash,
      doubleTimeCash,
      requiredTotal: compliance.requiredTotal,
      paidTotal: compliance.paidTotal,
      straightTimeEquivalentCash: compliance.straightTimeEquivalentCash,
      findings: compliance.findings,
      blockReasons: validateLine(line.input, line.wdRate, col6B),
    };
  });

  // -----------------------------------------------------------------------
  // Stage D — the CWHSSA quantities, once for the week.
  // -----------------------------------------------------------------------
  const cwhssa = computeCwhssa(prepared, band, ledger, `worker:${worker.workerRef}`);
  const unproven = new Set(cwhssa.unprovenLineIds);
  const premiumBlocks = premiumHoursUnproven(cwhssa);

  // Column 7A — the sum stated in the module docblock, and nothing else. Computed
  // here rather than at assembly because the 7A ≤ 7B check below is worker-scoped
  // and has to run before the block list is frozen.
  const col7A = Cents.sum([
    ...perLine.map((e) => e.straightTimeCash),
    ...perLine.map((e) => e.doubleTimeCash),
    cwhssa.cwhssaPremium,
  ]);

  // -----------------------------------------------------------------------
  // Stage F — column 8 and the column 9 reconciliation.
  // -----------------------------------------------------------------------
  const deductions = computeDeductions(worker);

  const workerBlocks: BlockReason[] = [];

  /**
   * R-BUILD H-1 — column 7A may not exceed column 7B.
   *
   * WHAT WAS WRONG. Nothing asserted the containment. `col7A` prices straight and
   * overtime hours at `cashRate` and adds the CWHSSA premium AS COMPUTED, so when
   * the row's own overtime rate is not `1.5 × regularRate` the printed 7A is gross
   * OWED rather than gross EARNED. Executed: 36 ST + 8 OT, `cashRate $20.00`,
   * `otRate $22.00`, `allWorkGross $896.00` printed `col7A = $920.00` against
   * `col7B = $896.00` with no block and status CERTIFIABLE.
   *
   * VERIFIED AGAINST. WHD's instructions to form WH-347 (dol.gov/agencies/whd/forms/
   * wh347, fetched 2026-08-13): 7A is "the worker's gross amount earned for the
   * workweek for hours worked on this Federal or federally assisted project"; 7B is
   * "the total gross amount earned during the week for all work performed during the
   * week". The first is a subset of the second, and column 9 is "the actual dollar
   * amount paid to the worker for all hours worked across all projects", which is
   * reconciled against 7B. A 7A above a non-zero 7B is not a close call; it is a form
   * that cannot be true.
   *
   * `col7B > 0` guards the check because WHD fills 7B only "if part of a worker's
   * weekly wage was earned on projects or work other than the project described on
   * this payroll" — a blank 7B is a legitimate all-work-on-this-project week, not a
   * zero to compare against.
   *
   * It BLOCKS rather than flagging. The contradiction is on the face of the document
   * the customer signs under 18 U.S.C. 1001, and we cannot tell which of the two
   * figures is wrong: a P-A closed choice hands that decision back, which is the only
   * place it belongs.
   */
  if (worker.allWorkGross > 0 && col7A > worker.allWorkGross) {
    workerBlocks.push('GROSS_EXCEEDS_ALL_WORK_GROSS');
  }

  if (deductions.hasUnmapped) workerBlocks.push('UNMAPPED_DEDUCTION');
  if (!deductions.reconciles) workerBlocks.push('NET_RECONCILIATION_FAILED');
  /**
   * WH-347 column 2 is `(J)` or `(RA)`, and WHD's instructions require box 4 of the
   * statement of compliance to name each registered programme when a worker is paid
   * as an apprentice. A worker marked `RA` with no programme, registrar or level of
   * progression cannot be rendered onto the form as anything: the fields the form
   * asks for do not exist. That is a missing required field, not an opinion about
   * programme compliance — the engine computes no apprenticeship ratio and never
   * will (§13, P-D).
   */
  if (
    worker.status === 'RA' &&
    (worker.apprentice === undefined || worker.apprentice.levelOfProgression.trim() === '')
  ) {
    workerBlocks.push('MISSING_REQUIRED_FIELD');
  }

  // -----------------------------------------------------------------------
  // Assembly.
  // -----------------------------------------------------------------------
  const lines: LineComputation[] = perLine.map((entry) => {
    const blocks = dedupe([
      ...entry.blockReasons,
      ...(premiumBlocks && unproven.has(entry.prepared.input.lineId)
        ? (['PREMIUM_HOURS_UNPROVEN'] as const)
        : []),
      ...workerBlocks,
    ]);
    const line = entry.prepared.input;
    const wdRate = entry.prepared.wdRate;
    return {
      lineId: line.lineId,
      ordinal: entry.prepared.ordinal,
      classificationId: line.classificationId,
      classNameVerbatim: wdRate?.classNameVerbatim ?? null,
      dayHours: line.dayHours,
      stHours: entry.prepared.stHours,
      otHours: entry.prepared.otHours,
      dtHours: entry.prepared.dtHours,
      totalHours: entry.prepared.totalHours,
      col6AStraightTime: col6AStraightTime(line),
      col6AOvertime: line.otRate,
      col6B: entry.col6B,
      col6C: entry.col6C,
      straightTimeCash: entry.straightTimeCash,
      doubleTimeCash: entry.doubleTimeCash,
      baseRate: entry.prepared.baseRate,
      wdBasicHourlyRate: wdRate?.basicHourlyRate ?? null,
      wdFringeRate: wdRate?.fringeRate ?? null,
      requiredTotal: entry.requiredTotal,
      paidTotal: entry.paidTotal,
      straightTimeEquivalentCash: entry.straightTimeEquivalentCash,
      resolutionState: blocks.length > 0 ? 'blocked' : line.resolutionState,
      blockReasons: blocks,
      findings: entry.findings,
    };
  });

  const premiumFinding = premiumBelowStatutory({
    band,
    premiumOwed: cwhssa.premiumOwed,
    premiumPaidTotal: cwhssa.premiumPaidTotal,
    premiumRatesStated: cwhssa.premiumRatesStated,
  });

  const findings: ViolationFinding[] = [
    ...perLine.flatMap((e) => e.findings),
    ...(premiumFinding === null ? [] : [premiumFinding]),
  ];

  return {
    workerRef: worker.workerRef,
    status: worker.status,
    lines,
    hoursWorked: cwhssa.hoursWorked,
    statutoryOtHours: cwhssa.statutoryOtHours,
    reportedOtHours: cwhssa.reportedOtHours,
    straightTimeEarnings: cwhssa.straightTimeEarnings,
    regularRate: cwhssa.regularRate,
    premiumOwed: cwhssa.premiumOwed,
    premiumCredit: cwhssa.premiumCredit,
    cwhssaPremium: cwhssa.cwhssaPremium,
    premiumPaidTotal: cwhssa.premiumPaidTotal,
    premiumRatesStated: cwhssa.premiumRatesStated,
    col7A,
    col7B: worker.allWorkGross,
    deductions: deductions.totals,
    deductionTotal: deductions.total,
    netComputed: deductions.netComputed,
    netPaid: deductions.netPaid,
    /**
     * Total DBA compensation due — NOT column 7A.
     *
     * F-PWRB-44h pins DOL's Prevailing Wage Resource Book example: 44 h at
     * $27.00 + $18.00 gives a straight-time wage of `44 × $45.00 = $1,980.00` and a
     * CWHSSA premium of `4 × ½ × $27.00 = $54.00`, for $2,034.00 due. Column 7A on
     * that same week is $1,242.00, because 7A is gross EARNED IN CASH on this
     * project and the $18.00 is a contribution, not a wage. Asserting DOL's figure
     * against 7A would assert a published number about a column DOL was not
     * describing.
     */
    dbaCompensationDue: Cents.add(
      Cents.sum(perLine.map((e) => e.requiredTotal)),
      cwhssa.premiumOwed,
    ),
    blockReasons: dedupe([...workerBlocks, ...lines.flatMap((l) => l.blockReasons)]),
    /**
     * R-BUILD H-2 — the worker-scoped blocks, on their own channel.
     *
     * WHAT WAS WRONG. `UNMAPPED_DEDUCTION`, `NET_RECONCILIATION_FAILED` and the
     * missing-apprentice-level case reached the artifact ONLY by being spliced into
     * each line's `blockReasons` above. `deriveStatus` reads line `resolutionState`
     * and `filingBlockReasons` and nothing else, so with `worker.lines === []` the
     * splice iterated zero times and both blocks were lost. Executed: one worker, no
     * lines, `allWorkGross $1,000.00`, one `UNMAPPED` deduction of $200.00 and
     * `netPaid $100.00` produced `blockReasons: ["UNMAPPED_DEDUCTION",
     * "NET_RECONCILIATION_FAILED"]` on the worker, `filingBlockReasons: []`, and
     * CERTIFIABLE with the signature block rendered. P-13 was satisfied vacuously by
     * the empty line list, which is why the property suite stayed green.
     *
     * VERIFIED AGAINST. 29 CFR 5.5(a)(3)(ii)(C)(2), eCFR, fetched 2026-08-13: the
     * signatory certifies "that no deductions have been made either directly or
     * indirectly from the full wages earned, other than permissible deductions as set
     * forth in 29 CFR part 3". Signing that with an unmapped deduction on the payroll
     * and a net that does not match the cheque is the certification §9.3 D1 says we
     * may not manufacture.
     *
     * The splice into lines STAYS, and is not redundant: it is what marks the
     * worker's rows as blocked on the rendered form, which is a question about ink.
     * This field is what governs the SIGNATURE BLOCK, which is a question about
     * status, and `status.ts` is the only place that answers it.
     */
    workerScopedBlockReasons: dedupe(workerBlocks),
    findings,
    narrowing: ledger.freeze(),
  };
}

// ===========================================================================
// The filing
// ===========================================================================

/**
 * THE ENTRY POINT. One payroll week and one pinned rate table in; one computation
 * out; no clock, no locale, no randomness, no I/O.
 */
export function computeFiling(input: EngineInput): FilingComputation {
  const { week, rates } = input;
  assertTableMatchesPin(rates, week.pin);

  const workers = week.workers.map((worker) =>
    computeWorkerWeek({ worker, rates, band: week.contractValueBand }),
  );

  /**
   * §7.0 — `unknown` is FILING-SCOPED, raised once, and it is P-B rather than a
   * guess in either direction. It means the customer was asked and chose not to
   * answer, which is a different fact from never having been asked, and neither
   * available guess is safe on a document signed under 18 U.S.C. 1001.
   */
  const filingBlockReasons: BlockReason[] =
    week.contractValueBand === 'unknown' ? ['CWHSSA_COVERAGE_UNDETERMINED'] : [];

  const anyFringeCredit = workers.some((w) => w.lines.some((l) => l.col6B > 0));
  const anyApprentice = workers.some((w) => w.status === 'RA');

  const statementOfCompliance: StatementOfComplianceBoxes = {
    box1: true,
    box2: true,
    box3: true,
    /** WHD's instructions: box 4 "must be checked" when a worker is paid as an
     *  apprentice, with each registered programme named. */
    box4: anyApprentice,
    /** Box 5 is the same value as `Σ col6B > 0` rendered twice, so the checkbox
     *  cannot drift from the arithmetic (P-12). */
    box5: anyFringeCredit,
    box6: true,
  };

  return {
    weekEnding: week.weekEnding,
    contractValueBand: week.contractValueBand,
    wdNumber: week.pin.wdNumber,
    revision: week.pin.revision,
    wdPublishedDate: week.pin.wdPublishedDate,
    workers,
    filingBlockReasons,
    allBlockReasons: dedupe([...filingBlockReasons, ...workers.flatMap((w) => w.blockReasons)]),
    findings: workers.flatMap((w) => w.findings),
    statementOfCompliance,
    totalCol7A: Cents.sum(workers.map((w) => w.col7A)),
    totalCol7B: Cents.sum(workers.map((w) => w.col7B)),
    totalDeductions: Cents.sum(workers.map((w) => w.deductionTotal)),
    totalCwhssaPremium: Cents.sum(workers.map((w) => w.cwhssaPremium)),
    totalHoursWorked: Hours.sum(workers.map((w) => w.hoursWorked)),
  };
}

/** Re-exported so a caller building a line does not have to reach into `fringe.ts`
 *  for the one rate the WH-347 asks it to print. */
export function straightTimeRatePaid(line: PayrollLine): MilliRate {
  return col6AStraightTime(line);
}
