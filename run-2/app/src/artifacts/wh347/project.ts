/**
 * THE PROJECTION — engine output plus identity, into the struct the renderer prints.
 *
 * AUTHORITY: `ENGINE.md` §4 (columns 4 and 5), §5 (column 6A and the two ladders),
 * §6 (6B and 6C, both WEEKLY TOTALS), §8 (7A and 7B), §9 (column 8 and net),
 * §25 (what the canary compares), `ARCHITECTURE.md` §11.3 (the renderer can only
 * read `ssn_last4`), `DESIGN_SYSTEM.md` §8.8.1 (the column set).
 *
 * ===========================================================================
 * THIS FUNCTION FORMATS. IT DOES NOT COMPUTE.
 *
 * Every money figure that arrives here has already been narrowed exactly once at
 * its enumerated site (`money.ts` §11.2, sites N1–N10). Nothing below adds, scales
 * or re-rounds a cent — the only arithmetic is the integer digit-splitting inside
 * `money()`, which turns a `Cents` into characters and is the last operation before
 * ink. That boundary is what makes G1's exact-match gate meaningful: if the
 * renderer could compute, the canary would be comparing a second implementation.
 *
 * ===========================================================================
 * TWO REFUSALS ARE ENCODED IN THIS FILE'S SHAPE
 *
 * 1. IT NEVER GUESSES WHICH STATUTORY TAX A LABEL NAMES. The form's column 8 has a
 *    FICA sub-column and a WITHHOLDING TAX sub-column; 29 CFR 3.5(a) covers both
 *    with one paragraph — "any Federal, State, or local tax required by law to be
 *    withheld" — and the engine's categories are the regulation's, not the form's.
 *    Matching `/fica|social security|medicare/i` against a stranger's payroll export
 *    would be a heuristic writing a number into a signed federal document. So the
 *    split is supplied by the caller when the payroll input SEPARATED the two, and
 *    when it did not, the statutory total is itemised under OTHER with its
 *    paragraph letter attached. It is never swept into a column that would assert
 *    which tax it is.
 *
 * 2. IT NEVER MOVES THE STATUS. `deriveStatus` is the single total constructor
 *    (`ARCHITECTURE.md` §6.3). This function reads the verdict and renders it; a
 *    missing identifying number produces a blank cell here and a blocked line
 *    upstream, because a renderer that could add a block reason would be a second
 *    construction path for the one gate that governs the signature block.
 */

import { Cents, type Hours, type MilliRate } from '@/lib/money';
import type {
  ArtifactProvenance,
  ArtifactVerdict,
  DeductionCategory,
  IsoDate,
  Wh347Layout,
  WorkerRef,
} from '@/lib/types';
import { isoDate } from '@/lib/types';

import type { FilingComputation, LineComputation, WorkerComputation } from '@/engine';

import { identifyingNumber, type IdentifyingNumber } from '../identity';
import { provenanceFooterLines } from '../provenance';
import { DAY_LABELS } from './formtext';
import type {
  Wh347Artifact,
  Wh347DayCell,
  Wh347DeductionCell,
  Wh347Header,
  Wh347LineRow,
  Wh347WorkerBlock,
} from './model';

// ===========================================================================
// Formatting — integer in, characters out, no locale
// ===========================================================================

/**
 * `1,234.56`. No currency symbol: the form's own column heads say what the number
 * is, and a `$` in a 31-point cell costs a digit of headroom.
 *
 * Integer arithmetic only — `Cents` is an integer count and this splits it. A
 * `toLocaleString` here would make the artifact depend on the machine's ICU data,
 * which is exactly the class of nondeterminism E1 forbids.
 */
export function money(value: Cents): string {
  const negative = value < 0;
  const magnitude = Math.abs(value);
  const dollars = Math.trunc(magnitude / 100);
  const remainder = magnitude - dollars * 100;
  const grouped = String(dollars).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${grouped}.${String(remainder).padStart(2, '0')}`;
}

/** Hours to hundredths. A zero day is BLANK, not `0.00`: an untouched day is empty
 *  on the paper form, and a grid of zeros hides the one day that carries hours. */
export function hoursCell(value: Hours): string {
  if (value === 0) return '';
  return hoursTotal(value);
}

export function hoursTotal(value: Hours): string {
  const negative = value < 0;
  const magnitude = Math.abs(value);
  const whole = Math.trunc(magnitude / 100);
  const fraction = magnitude - whole * 100;
  return `${negative ? '-' : ''}${whole}.${String(fraction).padStart(2, '0')}`;
}

/** A rate, to the cent — the precision a wage determination publishes and a payroll
 *  register shows. `MilliRate` carries four decimals so parsing is lossless; the
 *  extra two are an internal guarantee, not something to print at 6.5 pt. */
export function rateCell(value: MilliRate): string {
  const negative = value < 0;
  const magnitude = Math.abs(value);
  const cents = Math.round(magnitude / 100);
  const dollars = Math.trunc(cents / 100);
  const remainder = cents - dollars * 100;
  return `${negative ? '-' : ''}${dollars}.${String(remainder).padStart(2, '0')}`;
}

// ===========================================================================
// The week's seven days — derived from the week-ending date, never from a clock
// ===========================================================================

const MS_PER_DAY = 86_400_000;

/**
 * The seven dates of the workweek ending on `weekEnding`, oldest first.
 *
 * `Date.UTC` is used purely as calendar arithmetic — no local zone, no DST, no
 * clock read. ENGINE §4 A3: "The engine never reads a clock, so a filing
 * regenerated eighteen months later during a dispute produces the identical grid."
 */
export function weekDates(weekEnding: IsoDate): readonly IsoDate[] {
  const [year, month, day] = String(weekEnding).split('-').map(Number);
  const end = Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  const dates: IsoDate[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const at = new Date(end - offset * MS_PER_DAY);
    const iso = `${String(at.getUTCFullYear()).padStart(4, '0')}-${String(at.getUTCMonth() + 1).padStart(2, '0')}-${String(at.getUTCDate()).padStart(2, '0')}`;
    dates.push(isoDate(iso));
  }
  return dates;
}

export function dayLabelFor(date: IsoDate): string {
  const [year, month, day] = String(date).split('-').map(Number);
  const index = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)).getUTCDay();
  return DAY_LABELS[index] ?? '';
}

// ===========================================================================
// Deduction labels — the regulation's categories, with their paragraph letters
// ===========================================================================

const CATEGORY_LABEL: Readonly<Record<DeductionCategory, string>> = {
  STATUTORY: 'Tax withholding',
  BONA_FIDE_PREPAYMENT: 'Prepayment',
  COURT_PROCESS: 'Court process',
  BENEFIT_FUND: 'Benefit fund',
  CREDIT_UNION: 'Credit union',
  GOVERNMENTAL: 'Governmental',
  CHARITABLE_501C3: 'Charitable',
  UNION_DUES: 'Union dues',
  BOARD_LODGING_FACILITIES: 'Board / lodging',
  SAFETY_EQUIPMENT: 'Safety equipment',
  UNMAPPED: 'Unmapped — see exceptions',
} as const;


// ===========================================================================
// Input
// ===========================================================================

export interface Wh347WorkerIdentity {
  readonly workerRef: WorkerRef;
  readonly lastName: string;
  readonly firstName: string;
  readonly middleInitial: string | null;
  /**
   * The LAST FOUR DIGITS, as stored. `null` when the account holds none — the cell
   * renders blank and the line blocks upstream; this function does not invent an
   * identifier and does not move the status.
   *
   * There is deliberately no field here for a full SSN. `identifyingNumber` rejects
   * anything that is not exactly four digits, so a decrypted value reaching this
   * struct is a `TypeError` at construction rather than nine digits on a federal
   * form (29 CFR 5.5(a)(3)(ii)(B)).
   */
  readonly ssnLast4: string | null;
  /** Legacy layout only; deleted from the Rev. January 2025 form. */
  readonly numWithholdingExemptions: string | null;
  readonly levelOfProgression: string | null;
  readonly apprenticeProgram: string | null;
  /**
   * Supplied ONLY when the payroll input separated FICA from income-tax
   * withholding. Absent means absent: the statutory total is itemised under OTHER
   * with its paragraph letter rather than being assigned to a sub-column we would
   * be guessing at.
   */
  readonly statutorySplit?: { readonly fica: Cents; readonly withholdingTax: Cents } | null;
}

export interface Wh347HeaderInput {
  readonly contractorName: string;
  readonly isSubcontractor: boolean;
  readonly contractorAddress: string;
  readonly payrollNumber: string;
  readonly projectAndLocation: string;
  readonly projectOrContractNumber: string;
  readonly isFinalPayroll: boolean;
}

export interface Wh347ProjectionInput {
  readonly layout: Wh347Layout;
  readonly computation: FilingComputation;
  readonly verdict: ArtifactVerdict;
  readonly provenance: ArtifactProvenance;
  readonly header: Wh347HeaderInput;
  readonly workers: readonly Wh347WorkerIdentity[];
  readonly signatory: { readonly name: string; readonly title: string };
  readonly remarks: string;
  /** Exception sentences, already rendered from `buildExceptionReport`. This module
   *  never authors a refusal — it prints the ones the engine produced. */
  readonly exceptions: readonly string[];
  readonly bandRecordedOn: IsoDate | null;
  readonly contractLock: { readonly revisionAtAward: number; readonly recordedOn: IsoDate } | null;
  readonly verifyUrl: string | null;
}

// ===========================================================================
// Projection
// ===========================================================================

function projectDeductions(
  worker: WorkerComputation,
  identity: Wh347WorkerIdentity | undefined,
): Wh347DeductionCell {
  const split = identity?.statutorySplit ?? null;
  const statutory = worker.deductions.find((entry) => entry.category === 'STATUTORY');
  const statutoryAmount = statutory?.amount ?? Cents.of(0);

  if (split !== null && split.fica + split.withholdingTax !== statutoryAmount) {
    // An internal failure, not a customer-visible refusal (`result.ts`): the caller
    // built the split, and a column 8 whose sub-columns do not add to the category
    // total is a defective form rather than something to show a payroll admin.
    throw new Error(
      `column 8: the supplied FICA/withholding split (${split.fica} + ${split.withholdingTax}) ` +
        `does not equal the 29 CFR 3.5(a) statutory total (${statutoryAmount}) for worker ` +
        `${worker.workerRef}.`,
    );
  }

  const others: { label: string; amount: string }[] = [];
  const otherAmounts: Cents[] = [];
  for (const entry of worker.deductions) {
    if (entry.category === 'STATUTORY' && split !== null) continue;
    if (entry.amount === 0) continue;
    const paragraph = entry.paragraph === null ? '' : ` (3.5(${entry.paragraph}))`;
    others.push({ label: `${CATEGORY_LABEL[entry.category]}${paragraph}`, amount: money(entry.amount) });
    otherAmounts.push(entry.amount);
  }

  return {
    fica: split === null ? null : money(split.fica),
    withholdingTax: split === null ? null : money(split.withholdingTax),
    // `Cents.sum` over ALREADY-NARROWED figures. R2's own sentence: "worker-week
    // and filing totals are sums of already-narrowed cents". Nothing here narrows,
    // rescales or re-rounds, so the sub-columns add to the total exactly.
    otherTotal: money(Cents.sum(otherAmounts)),
    other: others,
    total: money(worker.deductionTotal),
  };
}

function projectLine(line: LineComputation, dates: readonly IsoDate[]): Wh347LineRow {
  const days: Wh347DayCell[] = dates.map((date, index) => {
    const hours = line.dayHours[index];
    return {
      dayLabel: dayLabelFor(date),
      date,
      st: hours ? hoursCell(hours.st) : '',
      ot: hours ? hoursCell(hours.ot) : '',
      dt: hours ? hoursCell(hours.dt) : '',
    };
  });

  return {
    lineId: line.lineId,
    ordinal: line.ordinal,
    // Column 3 carries the determination's OWN words. Ratepin never authors scope
    // text, and an unresolved line has none to carry.
    col3Classification: line.classNameVerbatim ?? '',
    col4Days: days,
    col5TotalHours: hoursTotal(line.totalHours),
    col6AStraightTime: rateCell(line.col6AStraightTime),
    // `null` stays null through to the ink. A blank overtime rate says "we cannot
    // prove a premium was paid"; `0.00` would say "nothing was paid", and those are
    // different facts with different outcomes.
    col6AOvertime: line.col6AOvertime === null ? null : rateCell(line.col6AOvertime),
    // WEEKLY TOTALS, both of them (`ENGINE.md` §6). Not rates.
    col6BFringeCredit: money(line.col6B),
    col6CInLieu: money(line.col6C),
    blocked: line.resolutionState !== 'resolved',
    blockReasons: line.blockReasons,
  };
}

function projectWorker(
  worker: WorkerComputation,
  index: number,
  identities: ReadonlyMap<string, Wh347WorkerIdentity>,
  dates: readonly IsoDate[],
): Wh347WorkerBlock {
  const identity = identities.get(String(worker.workerRef));
  const last4 = identity?.ssnLast4 ?? null;
  const identNumber: IdentifyingNumber | null = last4 === null ? null : identifyingNumber(last4);

  const netMismatch =
    worker.netComputed === worker.netPaid ? null : `computed ${money(worker.netComputed)}`;

  return {
    entryNumber: String(index + 1),
    lastName: identity?.lastName ?? '',
    firstName: identity?.firstName ?? '',
    middleInitial: identity?.middleInitial ?? '',
    // The type on the model is non-nullable, so a missing identifier renders as an
    // empty cell rather than as a forged one. `as` is not used: the empty string is
    // not an `IdentifyingNumber`, which is why the model's field is nullable.
    identifyingNumber: identNumber,
    col2Status: worker.status,
    col2LevelOfProgression: identity?.levelOfProgression ?? null,
    apprenticeProgram: identity?.apprenticeProgram ?? null,
    numWithholdingExemptions: identity?.numWithholdingExemptions ?? null,
    lines: worker.lines.map((line) => projectLine(line, dates)),
    col7AGross: money(worker.col7A),
    col7BAllWork: money(worker.col7B),
    col8Deductions: projectDeductions(worker, identity),
    col9NetPaid: money(worker.netPaid),
    netMismatch,
  };
}

/**
 * Build the artifact struct.
 *
 * The wage-determination header field is composed here rather than by the renderer
 * because a WD number without a revision does not identify a rate, and the one
 * field the Rev. January 2025 form added is the one this product exists to fill.
 */
export function projectWh347(input: Wh347ProjectionInput): Wh347Artifact {
  const { computation, verdict, provenance } = input;
  const dates = weekDates(computation.weekEnding);
  const identities = new Map(input.workers.map((worker) => [String(worker.workerRef), worker]));

  const header: Wh347Header = {
    contractorName: input.header.contractorName,
    isSubcontractor: input.header.isSubcontractor,
    contractorAddress: input.header.contractorAddress,
    payrollNumber: input.header.payrollNumber,
    forWeekEnding: computation.weekEnding,
    projectAndLocation: input.header.projectAndLocation,
    projectOrContractNumber: input.header.projectOrContractNumber,
    wageDeterminationNumber:
      `${provenance.wdNumber} rev. ${provenance.revisionPinned} ` +
      `(published ${provenance.publishDate})`,
    isFinalPayroll: input.header.isFinalPayroll,
  };

  const workers = computation.workers.map((worker, index) =>
    projectWorker(worker, index, identities, dates),
  );

  const unresolvedLineCount = computation.workers.reduce(
    (total, worker) => total + worker.lines.filter((line) => line.resolutionState !== 'resolved').length,
    0,
  );

  // WHD's box-4 instruction names the PROGRAM. The worker and the level of
  // progression travel with it because column 2 cannot hold a level at a readable
  // size, and a program named without the apprentice it covers is not the
  // statement the box is making.
  const apprenticeshipPrograms = workers
    .filter((worker) => worker.col2Status === 'RA' && worker.apprenticeProgram !== null)
    .map((worker) => {
      const name = [worker.lastName, worker.firstName].filter((part) => part !== '').join(', ');
      const level = worker.col2LevelOfProgression === null ? '' : ` (${worker.col2LevelOfProgression})`;
      return `${name}${level} — ${worker.apprenticeProgram ?? ''}`;
    });

  const footer = provenanceFooterLines({
    provenance,
    freshness: verdict.freshness,
    status: verdict.status,
    blockReasons: computation.allBlockReasons,
    bandRecordedOn: input.bandRecordedOn,
    contractLock: input.contractLock,
    verifyUrl: input.verifyUrl,
    unresolvedLineCount,
  });

  return {
    layout: input.layout,
    formRevisionLabel:
      input.layout === 'wh347_rev_2025_01' ? 'Rev. January 2025' : 'Legacy layout (pre-Rev. January 2025)',
    ombLabel:
      input.layout === 'wh347_rev_2025_01'
        ? 'OMB No. 1235-0008  ·  Expires 01/31/2028'
        : 'OMB No. 1235-0008',
    status: verdict.status,
    blockReasons: computation.allBlockReasons,
    freshnessState: verdict.freshness.state,
    signatureBlockWithheld: verdict.status === 'DRAFT_NOT_CERTIFIABLE',
    unresolvedLineCount,
    header,
    workers,
    totals: {
      hoursWorked: hoursTotal(computation.totalHoursWorked),
      col7A: money(computation.totalCol7A),
      col7B: money(computation.totalCol7B),
      deductions: money(computation.totalDeductions),
      cwhssaPremium: money(computation.totalCwhssaPremium),
    },
    statementOfCompliance: {
      signatoryName: input.signatory.name,
      signatoryTitle: input.signatory.title,
      boxes: computation.statementOfCompliance,
      apprenticeshipPrograms,
      remarks: input.remarks,
      exceptions: input.exceptions,
    },
    footer,
    provenance,
  };
}
