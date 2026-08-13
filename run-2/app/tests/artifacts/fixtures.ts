/**
 * THE GOLDEN PAYROLL WEEK — one week, computed by hand, pinned to the byte.
 *
 * AUTHORITY: `ENGINE.md` §25 (exact-match semantics), §12.3 (the regulatory
 * fixtures), `ARCHITECTURE.md` §6.1 (the offline guarantee).
 *
 * ===========================================================================
 * WHY THIS IS A LITERAL AND NOT A CALL INTO THE ENGINE
 *
 * These fixtures build a `FilingComputation` DIRECTLY rather than by running
 * `computeFiling`. That is deliberate and it is not laziness.
 *
 * The golden-file test in this directory asserts that a given artifact struct
 * renders to given bytes. If the struct came out of the arithmetic, a legitimate
 * engine change — a new field, a corrected premium credit — would fail a RENDERER
 * test, and the person reading the red would learn nothing about the renderer. The
 * two suites answer different questions: G1 asks "is the arithmetic right", and
 * this file asks "does the same struct still produce the same page".
 *
 * The coupling that matters is kept: the literal is TYPED as `FilingComputation`,
 * so if the engine's output shape changes, this file stops compiling — which is a
 * signal at exactly the right moment and in exactly the right place.
 *
 * ===========================================================================
 * THE ARITHMETIC BELOW WAS DONE BY HAND, AND SHOWS ITS WORKING
 *
 * Every figure carries the computation that produced it, in micro-dollars, with the
 * narrowing site named. That is what makes it an ORACLE rather than a snapshot of
 * whatever the code did on the day it was written.
 */

import { Cents, Hours, MicroDollars, MilliRate } from '@/lib/money';
import { EMPTY_LEDGER, type FilingComputation, type WorkerComputation } from '@/engine';
import {
  classificationIdFromMirrorRow,
  isoDate,
  sha256Hex,
  wdNumber,
  type ArtifactProvenance,
  type ArtifactVerdict,
  type DayHours,
  type Freshness,
  type PinRef,
  type SnapshotRef,
  type WorkerRef,
} from '@/lib/types';

import { identifyingNumber, ssn9 } from '@/artifacts';
import type { Wh347HeaderInput, Wh347WorkerIdentity } from '@/artifacts';
import type { EcprContractor, EcprProject, EcprWorkerIdentity } from '@/artifacts';

// ===========================================================================
// Coordinates
// ===========================================================================

export const WD = wdNumber('CA20260012');
export const REVISION = 4;
export const PUBLISH_DATE = isoDate('2026-07-31');
/** A Saturday, so the workweek runs Sunday 2026-08-02 to Saturday 2026-08-08. */
export const WEEK_ENDING = isoDate('2026-08-08');

/** Frozen. Nothing in the artifact path reads a clock; every timestamp on a
 *  rendered page arrives on the provenance struct (E1). */
export const GENERATED_AT = new Date('2026-08-14T15:52:00.000Z');
export const CORPUS_VERIFIED_AT = new Date('2026-08-14T02:41:00.000Z');

const CLASS_LABORER = classificationIdFromMirrorRow({
  wdNumber: WD,
  revision: REVISION,
  parserVersion: 3,
  ordinal: 17,
});

const CLASS_CEMENT = classificationIdFromMirrorRow({
  wdNumber: WD,
  revision: REVISION,
  parserVersion: 3,
  ordinal: 42,
});

function days(pattern: readonly (readonly [number, number, number])[]): readonly [
  DayHours,
  DayHours,
  DayHours,
  DayHours,
  DayHours,
  DayHours,
  DayHours,
] {
  const built = pattern.map(([st, ot, dt]) => ({
    st: Hours.of(st),
    ot: Hours.of(ot),
    dt: Hours.of(dt),
  }));
  return built as unknown as readonly [
    DayHours,
    DayHours,
    DayHours,
    DayHours,
    DayHours,
    DayHours,
    DayHours,
  ];
}

// ===========================================================================
// Worker 1 — DOE, Jane M. Journeyworker, one classification, no overtime.
//
//   cashRate            $18.62/hr        186_200 milli
//   cashInLieu          $0.00
//   fringe plan credit  $6.30/hr          63_000 milli   ("Ratepin Health & Welfare")
//   hours               8+8+8+8+5.25 = 37.25            3_725 hundredths
//
//   N3  straightTimeCash = 3_725 × 186_200 =   693_595_000 µ$ → 69_359.5¢ → 69_360¢
//   N1  col6B           = 3_725 ×  63_000 =   234_675_000 µ$ → 23_467.5¢ → 23_468¢
//   N9  requiredTotal   = 3_725 × (205_000 + 62_700 … see below)
//   N5  regularRate     = 693_595_000 µ$ ÷ 37.25 h        = 1_862¢/hr exactly
//
//   WD row: BHR $18.62, fringe $6.27 → requiredTotal = 3_725 × 248_900
//                                    = 927_152_500 µ$ → 92_715.25¢ → 92_715¢
//   N10 paidTotalCashTerm = 69_360¢; + col6B 23_468¢ = 92_828¢ ≥ 92_715¢, so the
//   week carries no violation finding — this is the CERTIFIABLE case.
// ===========================================================================

export const WORKER_1: WorkerRef = 'wkr_01HQ8ZJANEDOE' as WorkerRef;
export const WORKER_2: WorkerRef = 'wkr_01HQ8ZLRIVERA' as WorkerRef;

const worker1: WorkerComputation = {
  workerRef: WORKER_1,
  status: 'J',
  lines: [
    {
      lineId: 'ln_1',
      ordinal: 1,
      classificationId: CLASS_LABORER,
      classNameVerbatim: 'LABORER: ASPHALT, CONCRETE AND SEAL COAT',
      dayHours: days([
        [0, 0, 0],
        [800, 0, 0],
        [800, 0, 0],
        [800, 0, 0],
        [800, 0, 0],
        [525, 0, 0],
        [0, 0, 0],
      ]),
      stHours: Hours.of(3725),
      otHours: Hours.of(0),
      dtHours: Hours.of(0),
      totalHours: Hours.of(3725),
      col6AStraightTime: MilliRate.of(186_200),
      col6AOvertime: null,
      col6B: Cents.of(23_468),
      col6C: Cents.of(0),
      straightTimeCash: Cents.of(69_360),
      doubleTimeCash: Cents.of(0),
      baseRate: MilliRate.of(186_200),
      wdBasicHourlyRate: MilliRate.of(186_200),
      wdFringeRate: MilliRate.of(62_700),
      requiredTotal: Cents.of(92_715),
      paidTotal: Cents.of(92_828),
      straightTimeEquivalentCash: Cents.of(69_360),
      resolutionState: 'resolved',
      blockReasons: [],
      findings: [],
    },
  ],
  hoursWorked: Hours.of(3725),
  statutoryOtHours: Hours.of(0),
  reportedOtHours: Hours.of(0),
  straightTimeEarnings: MicroDollars.of(693_595_000),
  regularRate: Cents.of(1_862),
  premiumOwed: Cents.of(0),
  premiumCredit: Cents.of(0),
  cwhssaPremium: Cents.of(0),
  premiumPaidTotal: Cents.of(0),
  premiumRatesStated: false,
  col7A: Cents.of(69_360),
  col7B: Cents.of(69_360),
  deductions: [
    { category: 'STATUTORY', paragraph: 'a', amount: Cents.of(8_425), labels: ['FED W/H', 'FICA', 'CA SIT'] },
    { category: 'CHARITABLE_501C3', paragraph: 'g', amount: Cents.of(500), labels: ['UNITED WAY'] },
  ],
  deductionTotal: Cents.of(8_925),
  netComputed: Cents.of(60_435),
  netPaid: Cents.of(60_435),
  dbaCompensationDue: Cents.of(92_715),
  blockReasons: [],
  workerScopedBlockReasons: [],
  findings: [],
  narrowing: EMPTY_LEDGER,
};

// ===========================================================================
// Worker 2 — RIVERA, Luis. Registered apprentice, 40 ST + 6 OT, cash in lieu.
//
//   cashRate        $26.00/hr   260_000 milli
//   cashInLieu       $1.00/hr    10_000 milli  → col6A ST = $25.00
//   otRate          $39.00/hr   390_000 milli
//   plan credit      $3.00/hr    30_000 milli
//   hours           40 ST + 6 OT = 46          4_600 hundredths
//
//   N3  straightTimeCash = 4_600 × 260_000 = 1_196_000_000 µ$ → 119_600¢ exactly
//   N1  col6B            = 4_600 ×  30_000 =   138_000_000 µ$ →  13_800¢ exactly
//   N2  col6C            = 4_600 ×  10_000 =    46_000_000 µ$ →   4_600¢ exactly
//   base rate = max(BHR_WD 205_000, 260_000 − 10_000) = 250_000
//   N5  regularRate = (250_000 × 4_600) ÷ 46 h = 2_500¢/hr exactly
//   N6  premiumOwed = 6 h × 2_500¢ × ½ = 7_500¢
//       ot is NOT self-priced (SELF_PRICED = ['dt']), so premiumCredit = 0 and
//       cwhssaPremium = 7_500¢.
//   N8  premiumPaidTotal = 6 h × (3_900¢ − 2_500¢) = 8_400¢
//   N9  requiredTotal = 4_600 × (205_000 + 81_500) = 1_317_900_000 µ$ → 131_790¢
//   N10 paidTotalCashTerm = 119_600¢; + col6B 13_800¢ = 133_400¢ ≥ 131_790¢
//       col7A = straightTimeCash + doubleTimeCash + cwhssaPremium = 127_100¢
// ===========================================================================

const worker2: WorkerComputation = {
  workerRef: WORKER_2,
  status: 'RA',
  lines: [
    {
      lineId: 'ln_2',
      ordinal: 1,
      classificationId: CLASS_CEMENT,
      classNameVerbatim: 'CEMENT MASON/CONCRETE FINISHER',
      dayHours: days([
        [0, 0, 0],
        [800, 0, 0],
        [800, 0, 0],
        [800, 0, 0],
        [800, 0, 0],
        [800, 0, 0],
        [0, 600, 0],
      ]),
      stHours: Hours.of(4000),
      otHours: Hours.of(600),
      dtHours: Hours.of(0),
      totalHours: Hours.of(4600),
      col6AStraightTime: MilliRate.of(250_000),
      col6AOvertime: MilliRate.of(390_000),
      col6B: Cents.of(13_800),
      col6C: Cents.of(4_600),
      straightTimeCash: Cents.of(119_600),
      doubleTimeCash: Cents.of(0),
      baseRate: MilliRate.of(250_000),
      wdBasicHourlyRate: MilliRate.of(205_000),
      wdFringeRate: MilliRate.of(81_500),
      requiredTotal: Cents.of(131_790),
      paidTotal: Cents.of(133_400),
      straightTimeEquivalentCash: Cents.of(119_600),
      resolutionState: 'resolved',
      blockReasons: [],
      findings: [],
    },
  ],
  hoursWorked: Hours.of(4600),
  statutoryOtHours: Hours.of(600),
  reportedOtHours: Hours.of(600),
  straightTimeEarnings: MicroDollars.of(1_150_000_000),
  regularRate: Cents.of(2_500),
  premiumOwed: Cents.of(7_500),
  premiumCredit: Cents.of(0),
  cwhssaPremium: Cents.of(7_500),
  premiumPaidTotal: Cents.of(8_400),
  premiumRatesStated: true,
  col7A: Cents.of(127_100),
  col7B: Cents.of(127_100),
  deductions: [
    { category: 'STATUTORY', paragraph: 'a', amount: Cents.of(15_230), labels: ['FED W/H', 'FICA', 'CA SIT'] },
    { category: 'BENEFIT_FUND', paragraph: 'd', amount: Cents.of(2_400), labels: ['HRA'] },
  ],
  deductionTotal: Cents.of(17_630),
  netComputed: Cents.of(109_470),
  netPaid: Cents.of(109_470),
  dbaCompensationDue: Cents.of(139_290),
  blockReasons: [],
  workerScopedBlockReasons: [],
  findings: [],
  narrowing: EMPTY_LEDGER,
};

// ===========================================================================
// The filing
// ===========================================================================

export const GOLDEN_COMPUTATION: FilingComputation = {
  weekEnding: WEEK_ENDING,
  contractValueBand: 'over_100k',
  wdNumber: String(WD),
  revision: REVISION,
  wdPublishedDate: PUBLISH_DATE,
  workers: [worker1, worker2],
  filingBlockReasons: [],
  allBlockReasons: [],
  findings: [],
  statementOfCompliance: { box1: true, box2: true, box3: true, box4: true, box5: true, box6: true },
  totalCol7A: Cents.of(196_460),
  totalCol7B: Cents.of(196_460),
  totalDeductions: Cents.of(26_555),
  totalCwhssaPremium: Cents.of(7_500),
  totalHoursWorked: Hours.of(8_325),
};

/**
 * The same week with worker 1's line unresolved.
 *
 * `UNMAPPED_TRADE` is the commonest block in the product and the one D7 names. The
 * classification is `null` — not a guess, not a placeholder — because the whole
 * point of the block is that we do not know what the line is.
 */
export const DRAFT_COMPUTATION: FilingComputation = {
  ...GOLDEN_COMPUTATION,
  allBlockReasons: ['UNMAPPED_TRADE'],
  workers: [
    {
      ...worker1,
      lines: [
        {
          ...(worker1.lines[0] as (typeof worker1.lines)[number]),
          classificationId: null,
          classNameVerbatim: null,
          resolutionState: 'blocked',
          blockReasons: ['UNMAPPED_TRADE'],
        },
      ],
      blockReasons: ['UNMAPPED_TRADE'],
    },
    worker2,
  ],
};

// ===========================================================================
// Provenance and verdicts
// ===========================================================================

export const FRESH: Freshness = {
  state: 'FRESH',
  corpusVerifiedAt: CORPUS_VERIFIED_AT,
  checkedAt: CORPUS_VERIFIED_AT,
};

export const DATED: Freshness = {
  state: 'DATED',
  corpusVerifiedAt: new Date('2026-08-12T04:12:00.000Z'),
  checkedAt: new Date('2026-08-12T04:12:00.000Z'),
};

export const CERTIFIABLE_VERDICT: ArtifactVerdict = { status: 'CERTIFIABLE', freshness: FRESH };

export const DATED_VERDICT: ArtifactVerdict = { status: 'CERTIFIABLE_DATED', freshness: DATED };

export const DRAFT_VERDICT: ArtifactVerdict = {
  status: 'DRAFT_NOT_CERTIFIABLE',
  freshness: FRESH,
  blocks: ['UNMAPPED_TRADE'],
  signatureBlockWithheld: true,
};

export const PIN: PinRef = 'pin_01HQ8ZPIN0001' as PinRef;
export const SNAPSHOT: SnapshotRef = '9f2c4d1a77b3e6c8d90a4f2b17ce5d3ba17e' as SnapshotRef;

export const PROVENANCE: ArtifactProvenance = {
  wdNumber: WD,
  revisionPinned: REVISION,
  revisionAtAward: REVISION,
  publishDate: PUBLISH_DATE,
  canonicalSha256: sha256Hex('3b1f9c0d7e5a2648b0d4c1a97f36e802d5c47ba91e0f6d3287c4a5b60e19f7d2'),
  snapshotRef: SNAPSHOT,
  merkleRoot: sha256Hex('c0ffee11deadbeef22a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f607'),
  inclusionProof: [sha256Hex('11'.repeat(32)), sha256Hex('22'.repeat(32))],
  leafIndex: 137,
  corpusVerifiedAt: CORPUS_VERIFIED_AT,
  generatedAt: GENERATED_AT,
  formLayout: 'wh347_rev_2025_01',
  formPdfSha256: sha256Hex('7a5e1c93b408d26f5a1b0c7d8e9f0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b'),
  xsdSha256: sha256Hex('2ea52e977ab4ac74f7bb99aa9fb7634de8b48db7e090864150428b63c800d01a'),
  engineVersion: 1,
  buildSha: 'test-build',
  contractValueBand: 'over_100k',
  freshnessState: 'FRESH',
  certifiable: true,
  blockReasons: [],
};

// ===========================================================================
// Identity — federal (four digits) and California (nine)
// ===========================================================================

export const HEADER: Wh347HeaderInput = {
  contractorName: 'Grade & Pour Concrete, Inc.',
  isSubcontractor: true,
  contractorAddress: '1140 Harbor Way, Richmond, CA 94804',
  payrollNumber: '32',
  projectAndLocation: 'Bay Trail Segment 7 — Richmond, Contra Costa County, CA',
  projectOrContractNumber: 'DOT-FHWA-2026-0119',
  isFinalPayroll: false,
};

export const FEDERAL_IDENTITIES: readonly Wh347WorkerIdentity[] = [
  {
    workerRef: WORKER_1,
    lastName: 'Doe',
    firstName: 'Jane',
    middleInitial: 'M',
    ssnLast4: '4821',
    numWithholdingExemptions: '2',
    levelOfProgression: null,
    apprenticeProgram: null,
  },
  {
    workerRef: WORKER_2,
    lastName: 'Rivera',
    firstName: 'Luis',
    middleInitial: null,
    ssnLast4: '7310',
    numWithholdingExemptions: '1',
    levelOfProgression: '3rd period',
    apprenticeProgram: 'Northern California Cement Masons Apprenticeship Program (OA)',
  },
];

/** The nine-digit values. They exist ONLY on this shape, are accepted by exactly
 *  one function in the product, and never appear on a `Wh347WorkerIdentity`. */
export const CA_IDENTITIES: readonly EcprWorkerIdentity[] = [
  {
    workerRef: WORKER_1,
    lastName: 'Doe',
    firstName: 'Jane',
    middleInitial: 'M',
    ssn: ssn9('551234821'),
    address: '88 Cutting Blvd',
    city: 'Richmond',
    state: 'CA',
    zip: '94804',
    numWithholdingExemp: 2,
    checkNumber: '20417',
  },
  {
    workerRef: WORKER_2,
    lastName: 'Rivera',
    firstName: 'Luis',
    middleInitial: null,
    ssn: ssn9('602557310'),
    address: '19 Nevin Ave',
    city: 'Richmond',
    state: 'CA',
    zip: '94801',
    numWithholdingExemp: 1,
    checkNumber: '20418',
  },
];

export const CA_CONTRACTOR: EcprContractor = {
  name: 'Grade & Pour Concrete, Inc.',
  address: '1140 Harbor Way',
  city: 'Richmond',
  state: 'CA',
  zip: '94804',
  pwcr: '1000512847',
  fein: '941234567',
  licenseType: 'CSLB',
  licenseNumber: '1027744',
};

export const CA_PROJECT: EcprProject = {
  dirProjectId: '552310',
  name: 'Bay Trail Segment 7',
  awardingAgency: 'City of Richmond',
  isFinalPayroll: false,
};

/** The nightly probe's last observation, matching the pinned digest — the green
 *  case. Tests construct the red case by changing one byte. */
export const XSD_OBSERVATION_GREEN = {
  sha256: sha256Hex('2ea52e977ab4ac74f7bb99aa9fb7634de8b48db7e090864150428b63c800d01a'),
  byteLength: 49_325,
  observedAt: new Date('2026-08-14T02:41:00.000Z'),
};

export const PINNED_XSD_SHA256 = sha256Hex(
  '2ea52e977ab4ac74f7bb99aa9fb7634de8b48db7e090864150428b63c800d01a',
);

export const SIGNATORY = { name: 'Dolores Estrada', title: 'Payroll Administrator' } as const;

/** Assert at import time that the fixture's own identifying numbers are four
 *  digits — the fixture is an oracle, and an oracle with nine digits in column 1E
 *  would make the leak test pass for the wrong reason. */
for (const identity of FEDERAL_IDENTITIES) {
  if (identity.ssnLast4 !== null) identifyingNumber(identity.ssnLast4);
}
