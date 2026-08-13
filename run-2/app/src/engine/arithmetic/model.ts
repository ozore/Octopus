/**
 * THE ARITHMETIC'S OUTPUT SHAPE — every field §25 compares, and nothing else.
 *
 * AUTHORITY: `ENGINE.md` §25 (exact-match semantics: "every field of the rendered
 * `Wh347Artifact` struct … Also compared, because §7.0 and §7.3 made them
 * load-bearing and an uncompared field is an untested one: `contractValueBand`,
 * `hoursWorked`, `statutoryOtHours`, `regularRate`, `premiumOwed`,
 * `premiumCredit`, `cwhssaPremium`, `premiumPaidTotal` and `dbaCompensationDue`").
 *
 * ---------------------------------------------------------------------------
 * THE RULE THIS SHAPE ENFORCES
 *
 * Every quantity §25 names has a field here, and every field here is either
 * printed on an artifact or compared by the canary. There is no third kind of
 * field, because an intermediate that is neither printed nor compared is an
 * untested number that a renderer will eventually reach for.
 *
 * Three shapes are deliberate:
 *
 *   - `regularRate` is `Cents | null`, and `null` is not zero. Below the
 *     $100,000 threshold there is no premium for a regular rate to be the base of
 *     (§7.2), so the quantity does not exist rather than being zero. A `0` would
 *     read as "the weighted average of this week's rates was nothing".
 *
 *   - `baseRate` is `MilliRate | null` for the same reason: 5.32(a)'s floor is
 *     expressly about "the regular or basic rate upon which premium pay for
 *     overtime is calculated", so it travels with the CWHSSA gate.
 *
 *   - `dbaCompensationDue` is a field of its own and is NOT column 7A. F-PWRB-44h
 *     pins DOL's 44-hour example at $2,034.00 total DBA compensation due, against
 *     a column 7A of $1,242.00 on the same week. Asserting the published figure
 *     against 7A would be asserting a number DOL did not publish about a column
 *     DOL was not describing.
 */

import type { Cents, Hours, MicroDollars, MilliRate } from '@/lib/money';
import type {
  BlockReason,
  ClassificationId,
  ContractValueBand,
  DayHours,
  DeductionCategory,
  IsoDate,
  ViolationFlag,
  WorkerRef,
} from '@/lib/types';

import type { NarrowingLedger } from './narrowing';

/**
 * The premium buckets, and the property that decides how each is treated.
 *
 * `SELF_PRICED` is the buckets whose hours enter gross AT THEIR OWN RATE (§8), so
 * their premium dollars are already inside column 7A and crediting them is what
 * stops the engine charging for the same premium twice. `ot` is not self-priced:
 * §8 follows DOL's Method-1 shape, paying every hour at the straight-time
 * `cashRate` and adding the CWHSSA half-time premium as a separate addend, so
 * overtime hours carry no premium dollars inside 7A for a credit to draw on —
 * `cwhssaPremium` IS their premium.
 *
 * The rule is stated over the PROPERTY ("does this bucket price its own hours in
 * gross?") rather than over the column name, so a future bucket the CSV mapper
 * learns to read inherits the correct treatment from how it is paid rather than
 * from what it is called. That generalisation is R-CRIT4's actual lesson: the old
 * rule was written about the word `dt` and a mis-mapped column walked straight
 * through it.
 */
export type PremiumBucket = 'ot' | 'dt';

export const SELF_PRICED: readonly PremiumBucket[] = ['dt'] as const;

export const PREMIUM_BUCKETS: readonly PremiumBucket[] = ['ot', 'dt'] as const;

/** One violation flag with the arithmetic that produced it. §10: the engine
 *  "never characterises a shortfall as a violation of law" — it states the
 *  arithmetic and names the rule, which is why the shortfall travels with the
 *  flag rather than the flag travelling alone. */
export interface ViolationFinding {
  readonly flag: ViolationFlag;
  readonly lineId: string | null;
  readonly shortfall: Cents;
  readonly required: Cents;
  readonly paid: Cents;
  readonly citation: string;
}

/** WH-347 column 8, per permissible category of 29 CFR 3.5. */
export interface DeductionTotal {
  readonly category: DeductionCategory;
  /** The lettered paragraph, or `null` for the `UNMAPPED` sentinel. */
  readonly paragraph: string | null;
  readonly amount: Cents;
  readonly labels: readonly string[];
}

/** One classification worked, computed. WH-347 columns 3–7A live here. */
export interface LineComputation {
  readonly lineId: string;
  readonly ordinal: number;
  readonly classificationId: ClassificationId | null;
  /** Column 3, as the determination words it. Ratepin never authors scope text. */
  readonly classNameVerbatim: string | null;

  /** Column 4 — the seven-day grid, passed through unchanged. The engine never
   *  reads a clock, so the grid a filing regenerated eighteen months later during
   *  a dispute produces is the identical grid (§4 A3). */
  readonly dayHours: readonly DayHours[];
  readonly stHours: Hours;
  /** The CSV's own overtime hours. Distinct from `statutoryOtHours`, which is a
   *  worker-week quantity and a CWHSSA characterisation. */
  readonly otHours: Hours;
  readonly dtHours: Hours;
  /** Column 5. */
  readonly totalHours: Hours;

  /** Column 6A top row: "the actual hourly rate paid for straight time", and WHD
   *  is explicit — "do not include cash payments in lieu of fringe benefits in
   *  this column". */
  readonly col6AStraightTime: MilliRate;
  /** Column 6A bottom row: the overtime rate actually paid. `null` is not zero. */
  readonly col6AOvertime: MilliRate | null;
  /** Column 6B — employer contributions/costs. NOT in gross: they are not wages
   *  paid to the worker in the pay period, they are credits against the wage
   *  obligation. */
  readonly col6B: Cents;
  /** Column 6C — a DISCLOSURE of dollars already inside 7A, never an addend. */
  readonly col6C: Cents;

  /** N3 — `(st + ot) × cashRate`. */
  readonly straightTimeCash: Cents;
  /** N4 — `dt × dtRate`. Zero when the bucket carries no hours. */
  readonly doubleTimeCash: Cents;

  /** `max(BHR_WD, cashRate − cashInLieu)`; `null` off the CWHSSA path. */
  readonly baseRate: MilliRate | null;
  /** The determination's own figures, carried so the exception report can show
   *  the comparison rather than assert its conclusion. */
  readonly wdBasicHourlyRate: MilliRate | null;
  readonly wdFringeRate: MilliRate | null;

  /** N9 — `(BHR_WD + FRINGE_WD) × allHours`. */
  readonly requiredTotal: Cents;
  /** N10 + column 6B. §10, corrected: cash-in-lieu is already inside the cash
   *  term by definition, so adding column 6C would count it twice. */
  readonly paidTotal: Cents;

  /** `resolved` only when the line arrived resolved AND the arithmetic added no
   *  block of its own. P-13 turns on this field: any line that is not `resolved`
   *  forces `DRAFT — NOT CERTIFIABLE` with the signature block withheld, and a
   *  model failure and a missing CSV column travel the same code path. */
  readonly resolutionState: 'pending' | 'resolved' | 'blocked';
  readonly blockReasons: readonly BlockReason[];
  readonly findings: readonly ViolationFinding[];
}

/** One worker's week, computed. Columns 7A–9 and every CWHSSA quantity. */
export interface WorkerComputation {
  readonly workerRef: WorkerRef;
  /** Column 2. */
  readonly status: 'J' | 'RA';
  readonly lines: readonly LineComputation[];

  /** §7.3 step 1: every covered hour, whatever column of the CSV it arrived in.
   *  There is no column label that removes an hour from the CWHSSA denominator. */
  readonly hoursWorked: Hours;
  /** `max(0, hoursWorked − 40)`. Computed on every band, because it is a fact
   *  about hours; USED only on `over_100k`, because it is CWHSSA that acts on it. */
  readonly statutoryOtHours: Hours;
  /** The CSV's own reported overtime, summed. What column 4's OT sub-row shows on
   *  an `at_or_under_100k` project, "with no CWHSSA characterisation" (§7.0). */
  readonly reportedOtHours: Hours;

  /**
   * §7.3 step 2 — straight-time earnings, the numerator of the one ratio, EXACT in
   * micro-dollars and never narrowed (narrowing it and then dividing would be
   * rounding twice, R4). `null` off the CWHSSA path.
   *
   * Exposed because F-FOH-15k11b-M1 pins it: DOL's Step 1 publishes "Total straight
   * time wages = $480.00" before Step 2 divides, and a fixture that could only
   * assert the quotient would pass on a numerator that was wrong by a compensating
   * error in the denominator.
   */
  readonly straightTimeEarnings: MicroDollars | null;
  /** N5, the one genuine ratio. `null` off the CWHSSA path (§7.2). */
  readonly regularRate: Cents | null;
  /** N6 — `statutoryOtHours × regularRate × ½`. */
  readonly premiumOwed: Cents;
  /** N7 — premium already inside gross on PROVEN self-priced hours only, CAPPED at
   *  `premiumOwed`. §7.3.1's M4b table shows the raw $160.00 "capped at $40.00" and
   *  §12.3 pins the field at $40.00, so the capped figure is the one that travels:
   *  it is what was actually credited, and an uncapped field would read as though
   *  $120.00 of premium were owed back to the contractor. */
  readonly premiumCredit: Cents;
  /** `max(0, premiumOwed − min(premiumCredit, premiumOwed))`. Never negative: a
   *  generous premium is not a credit against next week. */
  readonly cwhssaPremium: Cents;
  /** N8 — what the contractor actually paid in premium, over BOTH buckets and
   *  ALL hours with a stated rate. Deliberately broader than `premiumCredit`;
   *  §10's table says why. */
  readonly premiumPaidTotal: Cents;

  /** Column 7A — gross earned on this project. */
  readonly col7A: Cents;
  /** Column 7B — customer-supplied, covering all work. */
  readonly col7B: Cents;
  /** Column 8, per category. */
  readonly deductions: readonly DeductionTotal[];
  readonly deductionTotal: Cents;
  /** `col7B − Σ deductions`. Compared against the customer's own column 9; never
   *  written over it. */
  readonly netComputed: Cents;
  /** Column 9 — the actual dollar amount paid, customer-supplied. */
  readonly netPaid: Cents;

  /** Σ `requiredTotal` + `premiumOwed`. NOT column 7A — see the module docblock. */
  readonly dbaCompensationDue: Cents;

  readonly blockReasons: readonly BlockReason[];
  readonly findings: readonly ViolationFinding[];
  readonly narrowing: NarrowingLedger;
}

/**
 * The six statement-of-compliance checkbox states.
 *
 * The six boxes are the WH-347 FORM's own reverse, per WHD's instructions —
 * "Boxes 1, 2, 3 and 6 (i.e., the first three boxes and the last box) always must
 * be checked"; box 4 when a worker is paid as an apprentice; box 5 when "claiming
 * an hourly credit for their contributions to or reasonably anticipated costs of
 * bona fide fringe benefit plans". They are NOT 29 CFR 5.5(a)(3)(ii)(C), which
 * requires THREE certifications and has no (4), (5) or (6) — ES-5 corrects the
 * miscitation, and the distinction matters because a builder who believes the
 * regulation enumerates six will find three and invent the other three.
 *
 * Box 5 is derived from `Σ col6B > 0` so the checkbox cannot drift from the
 * arithmetic: it is the same value rendered twice (P-12).
 */
export interface StatementOfComplianceBoxes {
  readonly box1: true;
  readonly box2: true;
  readonly box3: true;
  readonly box4: boolean;
  readonly box5: boolean;
  readonly box6: true;
}

/** One payroll week, computed. The whole return value of the arithmetic. */
export interface FilingComputation {
  readonly weekEnding: IsoDate;
  readonly contractValueBand: ContractValueBand;
  readonly wdNumber: string;
  readonly revision: number;
  readonly wdPublishedDate: IsoDate;
  readonly workers: readonly WorkerComputation[];

  /** Filing-scoped, not line-scoped: the question is about the contract or the
   *  corpus, not about a row (§7.0's `CWHSSA_COVERAGE_UNDETERMINED`). */
  readonly filingBlockReasons: readonly BlockReason[];
  /** Every block reason anywhere in the filing, de-duplicated and ordered. */
  readonly allBlockReasons: readonly BlockReason[];
  readonly findings: readonly ViolationFinding[];
  readonly statementOfCompliance: StatementOfComplianceBoxes;

  /** Filing totals — sums of already-narrowed cents (R2), never recomputed from
   *  micro-dollars. */
  readonly totalCol7A: Cents;
  readonly totalCol7B: Cents;
  readonly totalDeductions: Cents;
  readonly totalCwhssaPremium: Cents;
  readonly totalHoursWorked: Hours;
}
