/**
 * THE SPECIMEN WH-347 ON THE LANDING PAGE — inputs in, arithmetic computed.
 *
 * AUTHORITY: `identity/landing/index.html` §"THE HERO" (the sheet this reproduces),
 * `ENGINE.md` §2 (money is an integer count of cents, narrowed half-up once, at the
 * (line, column) the figure belongs to), `USER_JOURNEY.md` §8.8 (the three artifact
 * states and what changes between them), `CORRECTIONS.md` CL-2 (an unattributed
 * numeral on a public surface fails the build).
 *
 * ===========================================================================
 * WHY THIS IS A COMPUTATION AND NOT A TABLE OF STRINGS
 *
 * The landing page's grid is the most-read artifact this company owns, and a
 * marketing page that hand-types money is a marketing page that can disagree with
 * the product. So every dollar figure the sheet renders is DERIVED here, at render
 * time, from four kinds of input:
 *
 *   1. the determination's own rate and fringe obligation, read from SAM on
 *      2026-08-13 and reproduced without alteration;
 *   2. the invented payroll — hours, plan credit, cash in lieu, federal tax;
 *   3. the statutory ratios (CWHSSA's half-time premium, the 1.5x overtime rate,
 *      FICA's 7.65%), each written once, as a named constant;
 *   4. nothing else. There is no literal in this file that is a total.
 *
 * `tests/web/marketing.test.ts` asserts every derived figure against the values the
 * design document verified by hand, so a change to the arithmetic fails a test
 * rather than shipping a sheet whose footnotes no longer describe it.
 *
 * WHAT IS REAL AND WHAT IS INVENTED, because the sheet says so in print and this
 * module has to agree with the sheet: the wage determination number, modification
 * number, publication date, group identifier, classification names and hourly rates
 * are real. The contractor, project, addresses, contract number, worker names,
 * hours, plan credits and deductions are fictitious. The sheet carries SPECIMEN in
 * all three states for that reason.
 */

import { Cents, Hours, MILLI_PER_DOLLAR, MicroDollars, MilliRate } from '@/lib/money';

// ===========================================================================
// The statutory ratios. Each is written once and cited where it is written.
// ===========================================================================

/** 29 CFR 5.5(b)(1) — the CWHSSA premium is a HALF-time addition on hours over 40,
 *  because the straight-time hour is already paid in the base. */
const CWHSSA_PREMIUM_NUMERATOR = 1;
const CWHSSA_PREMIUM_DENOMINATOR = 2;

/** The overtime rate printed on the form's O row: 1.5x the basic hourly rate. */
const OVERTIME_MULTIPLIER_NUMERATOR = 3;
const OVERTIME_MULTIPLIER_DENOMINATOR = 2;

/** FICA — 6.20% OASDI + 1.45% Medicare = 7.65%, expressed in micro-dollars per
 *  cent so the multiply is exact: cents x 10^4 micro/cent x 0.0765 = cents x 765. */
const FICA_MICRO_PER_CENT = 765;

/**
 * A rate scaled by an exact integer ratio.
 *
 * `MilliRate.of` throws on a non-integer, which is the point: a ratio that does not
 * divide exactly at this scale is a rate we would have to round before printing it
 * in a rate column, and rounding a RATE (rather than a product) is the one narrowing
 * `ENGINE.md` §2 does not permit. Failing loudly here is cheaper than a form that
 * says $16.665.
 */
function scaleRate(rate: MilliRate, numerator: number, denominator: number): MilliRate {
  return MilliRate.of((rate * numerator) / denominator);
}

/** The exact product, narrowed half-up to cents exactly once (R3, R4). */
function money(rate: MilliRate, hours: Hours): Cents {
  return Cents.fromMicroDollars(MicroDollars.fromRateHours(rate, hours));
}

// ===========================================================================
// Inputs
// ===========================================================================

export interface SpecimenClassification {
  /** The determination's own spelling, verbatim. */
  readonly name: string;
  /** The rate identifier — `SU` prefix means a survey rate, not a CBA. */
  readonly group: string;
  readonly rate: MilliRate;
  /** The determination's published hourly fringe obligation. */
  readonly fringe: MilliRate;
}

export interface SpecimenWorkerInput {
  readonly no: number;
  readonly name: string;
  /** 1E on the January 2025 layout — an individually identifying number, never a
   *  full SSN. 29 CFR 5.5(a)(3)(ii)(B): full numbers "must not be included on
   *  weekly transmittals". */
  readonly idNo: string;
  readonly classification: SpecimenClassification;
  /** A tag under the classification cell: where the mapping came from. */
  readonly mappingNote: string | null;
  /** Sa Su Mo Tu We Th Fr, straight-time hours, `null` where no hours were worked. */
  readonly straightDays: readonly (Hours | null)[];
  /** The same seven days, premium hours. */
  readonly premiumDays: readonly (Hours | null)[];
  /** The hourly plan contribution the contractor asserts (col 6B is its weekly
   *  total). Ratepin neither computed nor verified annualization — 29 CFR 5.25(c). */
  readonly planCreditPerHour: MilliRate;
  /** Cash paid in lieu of fringe benefits, per hour (col 6C is its weekly total). */
  readonly cashInLieuPerHour: MilliRate;
  readonly federalTax: Cents;
  readonly otherDeductions: Cents;
}

// ===========================================================================
// Outputs — every figure the grid prints
// ===========================================================================

export interface SpecimenWorker {
  readonly input: SpecimenWorkerInput;
  readonly straightHours: Hours;
  readonly premiumHours: Hours;
  readonly totalHours: Hours;
  /** Col 6A on the S row — the basic hourly rate actually paid, excluding cash in
   *  lieu. The only hourly column on the form. */
  readonly straightRate: MilliRate;
  /** Col 6A on the O row — 1.5x. */
  readonly overtimeRate: MilliRate;
  /** Col 6B — the WEEKLY total of plan contributions, not an hourly figure. */
  readonly col6B: Cents;
  /** Col 6C — the WEEKLY total of cash paid in lieu of fringes. */
  readonly col6C: Cents;
  /** Straight-time cash for every hour worked, at the basic rate. */
  readonly basicCash: Cents;
  /** The CWHSSA half-time premium on hours over 40. */
  readonly premiumCash: Cents;
  /** Col 7A — gross earned on this project. Cash in lieu is counted here ONCE. */
  readonly gross: Cents;
  readonly fica: Cents;
  readonly deductionsTotal: Cents;
  /** Col 9 — net paid for the week. */
  readonly net: Cents;
  /** 6B + 6C, and the obligation it discharges: hours x the determination's fringe.
   *  Equal by construction on this specimen, which is what the footnote asserts. */
  readonly fringeDischarged: Cents;
  readonly fringeObligation: Cents;
}

function sumHours(days: readonly (Hours | null)[]): Hours {
  let total = 0;
  for (const day of days) total += day ?? 0;
  return Hours.of(total);
}

export function computeSpecimenWorker(input: SpecimenWorkerInput): SpecimenWorker {
  const straightHours = sumHours(input.straightDays);
  const premiumHours = sumHours(input.premiumDays);
  const totalHours = Hours.add(straightHours, premiumHours);

  const rate = input.classification.rate;
  const col6B = money(input.planCreditPerHour, totalHours);
  const col6C = money(input.cashInLieuPerHour, totalHours);
  const basicCash = money(rate, totalHours);
  const premiumCash = money(
    scaleRate(rate, CWHSSA_PREMIUM_NUMERATOR, CWHSSA_PREMIUM_DENOMINATOR),
    premiumHours,
  );

  // Col 7A. The cash in lieu is WAGES and is counted here once — never added a
  // second time and never a deduction in column 8. The plan contribution behind 6B
  // is not cash to the worker and is not in gross.
  const gross = Cents.sum([basicCash, premiumCash, col6C]);

  const fica = Cents.fromMicroDollars(MicroDollars.of(gross * FICA_MICRO_PER_CENT));
  const deductionsTotal = Cents.sum([fica, input.federalTax, input.otherDeductions]);

  return {
    input,
    straightHours,
    premiumHours,
    totalHours,
    straightRate: rate,
    overtimeRate: scaleRate(rate, OVERTIME_MULTIPLIER_NUMERATOR, OVERTIME_MULTIPLIER_DENOMINATOR),
    col6B,
    col6C,
    basicCash,
    premiumCash,
    gross,
    fica,
    deductionsTotal,
    net: Cents.sub(gross, deductionsTotal),
    fringeDischarged: Cents.sum([col6B, col6C]),
    fringeObligation: money(input.classification.fringe, totalHours),
  };
}

// ===========================================================================
// The determination, the payroll, and the sheet's header
// ===========================================================================

/** Read from `sam.gov/api/prod/wdol/v1/wd/TN20260151/1` on 2026-08-13 and
 *  reproduced without alteration, classification names included. */
export const SPECIMEN_ELECTRICIAN: SpecimenClassification = {
  name: 'ELECTRICIAN',
  group: 'SUTN2017-004',
  rate: MilliRate.fromDecimalString('22.00'),
  fringe: MilliRate.fromDecimalString('11.77'),
};

export const SPECIMEN_LABORER: SpecimenClassification = {
  name: 'LABORER: COMMON OR GENERAL',
  group: 'SUTN2017-004',
  rate: MilliRate.fromDecimalString('13.00'),
  fringe: MilliRate.fromDecimalString('3.99'),
};

export interface SpecimenHeader {
  readonly contractor: string;
  readonly address: string;
  readonly project: string;
  readonly location: string;
  readonly contractNo: string;
  readonly payrollNo: string;
  readonly weekEnding: string;
  readonly wdNumber: string;
  readonly modification: string;
  readonly published: string;
  readonly snapshot: string;
  readonly engineVersion: string;
  readonly generatedAt: string;
  readonly checkedAt: string;
  readonly datedSince: string;
  readonly verifyUrl: string;
  readonly sourceUrl: string;
  readonly counties: string;
  readonly constructionType: string;
  readonly dayLabels: readonly string[];
}

export const SPECIMEN_HEADER: SpecimenHeader = {
  contractor: 'MERIDIAN ELECTRIC LLC',
  address: '418 N MAIN ST · SHELBYVILLE TN 37160',
  project: 'CENTRAL ELEM — ELECTRICAL UPGRADE',
  location: 'BEDFORD COUNTY, TENNESSEE',
  contractNo: 'FA-2026-0148',
  payrollNo: '6',
  weekEnding: '2026-08-07',
  wdNumber: 'TN20260151',
  modification: '1',
  published: '2026-05-18',
  snapshot: '4b91e30c',
  engineVersion: '1.0.0',
  generatedAt: '2026-08-07 16:41 CT',
  checkedAt: '2026-08-07 02:07 ET',
  datedSince: '2026-08-05 02:07 ET',
  verifyUrl: 'ratepin.com/v/7c3a-91d4',
  sourceUrl: 'https://sam.gov/api/prod/wdol/v1/wd/TN20260151/1',
  counties: 'BEDFORD · COFFEE',
  constructionType: 'BUILDING',
  dayLabels: ['Sa 8/1', 'Su 8/2', 'Mo 8/3', 'Tu 8/4', 'We 8/5', 'Th 8/6', 'Fr 8/7'],
};

const H = (value: string): Hours => Hours.fromDecimalString(value);

/** A dollar string to cents, exactly and without `parseFloat`: `MilliRate` parses
 *  the decimal at 10^-4, and `Cents.of` refuses the division if the input carried
 *  a fraction of a cent. */
const D = (value: string): Cents =>
  Cents.of(MilliRate.fromDecimalString(value) / (MILLI_PER_DOLLAR / 100));

/** Entry 1 — 40 straight hours, the traced line the "where the $22.00 came from"
 *  section walks through. */
export const SPECIMEN_ENTRY_1: SpecimenWorkerInput = {
  no: 1,
  name: 'DELGADO, ANTONIO R',
  idNo: '4417',
  classification: SPECIMEN_ELECTRICIAN,
  mappingNote: null,
  straightDays: [null, null, H('8'), H('8'), H('8'), H('8'), H('8')],
  premiumDays: [null, null, null, null, null, null, null],
  // $6.10 in plan contributions + $5.67 cash in lieu = the determination's $11.77
  // hourly obligation, discharged by the combination method of 29 CFR 5.31(b)(3).
  planCreditPerHour: MilliRate.fromDecimalString('6.10'),
  cashInLieuPerHour: MilliRate.fromDecimalString('5.67'),
  federalTax: D('96.00'),
  otherDeductions: D('0'),
};

/** Entry 2 — 46 hours, six of them over CWHSSA's weekly 40. */
export const SPECIMEN_ENTRY_2: SpecimenWorkerInput = {
  no: 2,
  name: 'OKAFOR, RUTH N',
  idNo: '8102',
  classification: SPECIMEN_ELECTRICIAN,
  mappingNote: null,
  straightDays: [null, null, H('10'), H('10'), H('10'), H('10'), null],
  premiumDays: [null, null, null, null, null, null, H('6')],
  planCreditPerHour: MilliRate.fromDecimalString('6.10'),
  cashInLieuPerHour: MilliRate.fromDecimalString('5.67'),
  federalTax: D('121.00'),
  otherDeductions: D('0'),
};

/** Entry 3 — the laborer whose determination rate is below EO 13658's floor, and
 *  the conclusion Ratepin declines (P-D). */
export const SPECIMEN_ENTRY_3: SpecimenWorkerInput = {
  no: 3,
  name: 'BRYSON, TERRELL J',
  idNo: '2290',
  classification: SPECIMEN_LABORER,
  mappingNote: null,
  straightDays: [null, null, H('8'), H('8'), H('8'), H('8'), H('4')],
  premiumDays: [null, null, null, null, null, null, null],
  // The whole obligation in cash — 29 CFR 5.31(b)(2).
  planCreditPerHour: MilliRate.fromDecimalString('0'),
  cashInLieuPerHour: MilliRate.fromDecimalString('3.99'),
  federalTax: D('31.00'),
  otherDeductions: D('0'),
};

/** Entries 1–3, identical in all three artifact states. */
export const SPECIMEN_WORKERS: readonly SpecimenWorkerInput[] = [
  SPECIMEN_ENTRY_1,
  SPECIMEN_ENTRY_2,
  SPECIMEN_ENTRY_3,
];

/** Entry 4, resolved. Present at CERTIFIABLE and CERTIFIABLE (DATED). */
export const SPECIMEN_WORKER_4: SpecimenWorkerInput = {
  no: 4,
  name: 'RIVERA, MARISOL',
  idNo: '6035',
  classification: SPECIMEN_ELECTRICIAN,
  mappingNote: 'this account’s own confirmed mapping',
  straightDays: [null, null, H('8'), H('8'), H('8'), H('8'), H('8')],
  premiumDays: [null, null, null, null, null, null, null],
  planCreditPerHour: MilliRate.fromDecimalString('6.10'),
  cashInLieuPerHour: MilliRate.fromDecimalString('5.67'),
  federalTax: D('88.00'),
  otherDeductions: D('0'),
};

/**
 * Entry 4, blocked. The same worker and the same hours, with the payroll title
 * VERBATIM and no money at all — P-A. The blocked line is not entry 4 priced
 * differently; it is entry 4 with the money columns structurally absent, which is
 * why it is a separate shape rather than a flag on the computed row.
 */
export const SPECIMEN_BLOCKED = {
  no: 4,
  name: 'RIVERA, MARISOL',
  idNo: '6035',
  rawTitle: 'LOW VOLTAGE TECH',
  straightDays: SPECIMEN_WORKER_4.straightDays,
  hours: Hours.of(4000),
} as const;

export const SPECIMEN_COMPUTED_1: SpecimenWorker = computeSpecimenWorker(SPECIMEN_ENTRY_1);
export const SPECIMEN_COMPUTED_2: SpecimenWorker = computeSpecimenWorker(SPECIMEN_ENTRY_2);
export const SPECIMEN_COMPUTED_3: SpecimenWorker = computeSpecimenWorker(SPECIMEN_ENTRY_3);
export const SPECIMEN_COMPUTED_4: SpecimenWorker = computeSpecimenWorker(SPECIMEN_WORKER_4);

export const SPECIMEN_COMPUTED: readonly SpecimenWorker[] = [
  SPECIMEN_COMPUTED_1,
  SPECIMEN_COMPUTED_2,
  SPECIMEN_COMPUTED_3,
];

/**
 * A rate, in cents, for the form's one hourly column.
 *
 * `Cents.of` throws rather than truncating: a determination that published a rate
 * with a fraction of a cent in it is a rate we would have to alter to print, and
 * altering a published rate is the one thing this product exists not to do.
 */
export function rateInCents(rate: MilliRate): Cents {
  return Cents.of(rate / (MILLI_PER_DOLLAR / 100));
}

export type ArtifactState = 'certifiable' | 'dated' | 'draft';
