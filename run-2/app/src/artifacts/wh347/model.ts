/**
 * THE `Wh347Artifact` STRUCT — the rendered form as data, before it is ink.
 *
 * AUTHORITY: `ENGINE.md` §25 ("What is compared: EVERY FIELD of the rendered
 * `Wh347Artifact` struct — cols 1A–1E, 2, 3, 4 (seven days × ST/OT/DT), 5, 6A ST and
 * OT, 6B, 6C, 7A, 7B, 8 (per category and total), 9; the six
 * statement-of-compliance checkbox states; the artifact status enum and every
 * `BlockReason`; the full provenance struct"), `DESIGN_SYSTEM.md` §8.8.1 (the
 * column set, from the WHD form page), deep dive 04 §1.1 (the Rev. January 2025
 * layout).
 *
 * ===========================================================================
 * WHY THE STRUCT IS STRINGS AND THE COMPUTATION IS INTEGERS
 *
 * Everything on this struct that will be printed is ALREADY FORMATTED. That is the
 * boundary between the engine and the renderer: the engine owns integer cents and
 * the narrowing discipline (`money.ts` R1–R4), and this struct owns what the ink
 * says. A renderer that received `Cents` would be a second place where a money
 * figure gets turned into characters, and the second place is where the two
 * disagree by a penny.
 *
 * The struct is therefore also the comparable surface: §25's exact-match gate reads
 * these strings, so a formatting regression fails the canary rather than being
 * discovered by a general contractor.
 *
 * ===========================================================================
 * 6B AND 6C ARE WEEKLY TOTALS. 6A IS AN HOURLY RATE.
 *
 * This is the field most easily got wrong and it was a review finding. WHD's
 * instructions, quoted in `ENGINE.md` §6: column 6B is "the TOTAL of the
 * contractor's or subcontractor's contributions", 6C is "the TOTAL AMOUNT IN CASH
 * provided in lieu of fringe benefits to the worker DURING THE WORKWEEK". Only 6A
 * is per hour — "the actual hourly rate paid for straight time (top row) and
 * overtime (bottom row)".
 *
 * So `col6BFringeCredit` and `col6CInLieu` are dollar TOTALS carrying two decimals
 * and a thousands separator, and `col6AStraightTime` / `col6AOvertime` are RATES
 * carrying no separator. The types below are all strings, so the distinction is
 * carried by the field names, by this paragraph, and by
 * `tests/artifacts/wh347-projection.test.ts` — which asserts that 6B equals the
 * per-hour credit times TOTAL hours and not the per-hour credit itself.
 */

import type { IdentifyingNumber } from '../identity';
import type { FooterLine } from '../provenance';
import type {
  ArtifactProvenance,
  ArtifactStatus,
  BlockReason,
  FreshnessState,
  IsoDate,
  Wh347Layout,
} from '@/lib/types';

// ===========================================================================
// The header — the box above the grid
// ===========================================================================

export interface Wh347Header {
  readonly contractorName: string;
  /** The form's own alternative: "CONTRACTOR OR SUBCONTRACTOR". */
  readonly isSubcontractor: boolean;
  readonly contractorAddress: string;
  readonly payrollNumber: string;
  readonly forWeekEnding: IsoDate;
  readonly projectAndLocation: string;
  readonly projectOrContractNumber: string;
  /**
   * New on the Rev. January 2025 layout, and the reason the revision matters to
   * this product: the form itself now asks for the thing D3 makes the paid
   * boundary. Rendered as `{number} rev. {n} (published {date})`, because a WD
   * number without a revision does not identify a rate.
   */
  readonly wageDeterminationNumber: string;
  /** `true` on the final payroll for the project — the form's own checkbox. */
  readonly isFinalPayroll: boolean;
}

// ===========================================================================
// The grid
// ===========================================================================

/** One of the seven day columns of column 4. */
export interface Wh347DayCell {
  /** `MON`, `TUE`… derived from the date, never from a locale. */
  readonly dayLabel: string;
  readonly date: IsoDate;
  /** Blank strings, not `"0.00"`: an untouched day on a certified payroll is empty
   *  on the paper form, and a grid of zeros is harder to scan for the one day that
   *  carries hours. */
  readonly st: string;
  readonly ot: string;
  readonly dt: string;
}

export interface Wh347LineRow {
  readonly lineId: string;
  readonly ordinal: number;
  /** Column 3, as the determination words it. Ratepin never authors scope text. */
  readonly col3Classification: string;
  readonly col4Days: readonly Wh347DayCell[];
  readonly col5TotalHours: string;
  /** Column 6A top row — an HOURLY RATE, cash in lieu excluded per WHD. */
  readonly col6AStraightTime: string;
  /** Column 6A bottom row — the overtime rate actually paid. `null` is not `"0.00"`:
   *  a premium bucket with hours and no rate is a premium that cannot be proven. */
  readonly col6AOvertime: string | null;
  /** Column 6B — a WEEKLY TOTAL of employer contributions/costs. */
  readonly col6BFringeCredit: string;
  /** Column 6C — a WEEKLY TOTAL of cash paid in lieu; a disclosure of dollars
   *  already inside 7A, never an addend to it. */
  readonly col6CInLieu: string;
  readonly blocked: boolean;
  readonly blockReasons: readonly BlockReason[];
}

/**
 * Column 8. The sub-columns are the form's; the itemisation is 29 CFR 3.5's.
 *
 * The cell carries FOUR MONEY FIGURES and nothing else, because a 31-point column
 * cannot hold a label and a figure at a size anyone can read — an early draft
 * truncated `Tax withholding (3.5(a))` to `T…`, which is worse than absent. The
 * itemisation travels on `other` and is printed on the statement-of-compliance
 * page, where there is room for the paragraph letters. That is also what WHD's own
 * instruction asks for when column 8 is crowded: show the balance and attach a
 * statement.
 */
export interface Wh347DeductionCell {
  /** Populated only when the payroll input SEPARATED FICA from income-tax
   *  withholding. `null` when it did not — see `project.ts`, which refuses to guess
   *  which statutory tax a free-text label names. */
  readonly fica: string | null;
  readonly withholdingTax: string | null;
  /** The figure printed in the OTHER sub-column: everything not in the two named
   *  sub-columns above, summed in already-narrowed cents (R2). */
  readonly otherTotal: string;
  /** Every category behind that figure, each carrying its 29 CFR 3.5 paragraph
   *  letter so the reader can check the authority rather than trust the bucket.
   *  Printed on page 2, in full, never truncated. */
  readonly other: readonly { readonly label: string; readonly amount: string }[];
  readonly total: string;
}

export interface Wh347WorkerBlock {
  /** 1A — Worker Entry No., the form's own sequence within this payroll. */
  readonly entryNumber: string;
  /** 1B, 1C, 1D. */
  readonly lastName: string;
  readonly firstName: string;
  readonly middleInitial: string;
  /**
   * 1E. Typed so that a nine-digit value cannot be constructed here at all.
   *
   * `null` when the account holds no last-four for this worker. The cell renders
   * BLANK rather than being filled with a placeholder: 29 CFR 5.5(a)(3)(ii)(B)
   * requires "an individually identifying number for each worker", and a form that
   * invented one would be asserting an identity we do not hold. The missing field
   * blocks the line upstream, where the status is constructed.
   */
  readonly identifyingNumber: IdentifyingNumber | null;
  /** Column 2 — `(J)` journeyworker or `(RA)` registered apprentice. */
  readonly col2Status: 'J' | 'RA';
  /** Column 2's second half: the apprentice's level of progression. */
  readonly col2LevelOfProgression: string | null;
  /** Named on the statement of compliance when box 4 is checked. */
  readonly apprenticeProgram: string | null;
  /** LEGACY LAYOUT ONLY. Deleted from the Rev. January 2025 form federally, while
   *  CA's XML still mandates it (deep dive 04 §1.6). */
  readonly numWithholdingExemptions: string | null;
  readonly lines: readonly Wh347LineRow[];
  /** 7A — gross earned on this project. */
  readonly col7AGross: string;
  /** 7B — gross earned on all work, customer-supplied. */
  readonly col7BAllWork: string;
  readonly col8Deductions: Wh347DeductionCell;
  /** 9 — the actual amount paid. Reconciled against `7B − Σ deductions`, never
   *  written over it. */
  readonly col9NetPaid: string;
  /** Set when column 9 and the computed net disagree. Both figures are shown; ours
   *  never replaces theirs. */
  readonly netMismatch: string | null;
}

// ===========================================================================
// The statement of compliance — page 2
// ===========================================================================

export interface Wh347StatementOfCompliance {
  readonly signatoryName: string;
  readonly signatoryTitle: string;
  readonly boxes: {
    readonly box1: boolean;
    readonly box2: boolean;
    readonly box3: boolean;
    readonly box4: boolean;
    readonly box5: boolean;
    readonly box6: boolean;
  };
  /** Named registered programs, required by WHD's instructions when box 4 is
   *  checked. */
  readonly apprenticeshipPrograms: readonly string[];
  /** Free text from the customer. Rendered verbatim and never authored by us. */
  readonly remarks: string;
  /**
   * The exception report, as sentences. Attached to the artifact whenever the
   * status is DRAFT — NOT CERTIFIABLE (P-B), and printed under REMARKS.
   */
  readonly exceptions: readonly string[];
}

// ===========================================================================
// The artifact
// ===========================================================================

export interface Wh347Artifact {
  readonly layout: Wh347Layout;
  /** `Rev. January 2025` / the legacy label. Printed on the form, because the form
   *  revision is part of what a receiving clerk checks. */
  readonly formRevisionLabel: string;
  readonly ombLabel: string;

  readonly status: ArtifactStatus;
  readonly blockReasons: readonly BlockReason[];
  readonly freshnessState: FreshnessState;
  /** Structural, not decorative: `true` means the signature block is REPLACED by
   *  the withheld box, not hidden. */
  readonly signatureBlockWithheld: boolean;
  readonly unresolvedLineCount: number;

  readonly header: Wh347Header;
  readonly workers: readonly Wh347WorkerBlock[];

  /** Filing totals, already formatted. Sums of narrowed cents (R2). */
  readonly totals: {
    readonly hoursWorked: string;
    readonly col7A: string;
    readonly col7B: string;
    readonly deductions: string;
    readonly cwhssaPremium: string;
  };

  readonly statementOfCompliance: Wh347StatementOfCompliance;
  readonly footer: readonly FooterLine[];
  readonly provenance: ArtifactProvenance;
}

// ===========================================================================
// The flattening the canary compares — ENGINE §25
// ===========================================================================

export type ArtifactFieldMap = Readonly<Record<string, string | number | boolean | null>>;

/**
 * Every printed field, as one flat map.
 *
 * This exists so G1 can compare the RENDERED artifact rather than the computation
 * that fed it. §25's list is the specification and this function is its mirror: a
 * column added to the form without a row here is a column no case pins.
 */
export function wh347Fields(artifact: Wh347Artifact): ArtifactFieldMap {
  const out: Record<string, string | number | boolean | null> = {};

  out['artifact.layout'] = artifact.layout;
  out['artifact.status'] = artifact.status;
  out['artifact.signatureBlockWithheld'] = artifact.signatureBlockWithheld;
  out['artifact.freshnessState'] = artifact.freshnessState;
  out['artifact.blockReasons'] = [...artifact.blockReasons].join(',');
  out['artifact.unresolvedLineCount'] = artifact.unresolvedLineCount;

  out['header.wageDeterminationNumber'] = artifact.header.wageDeterminationNumber;
  out['header.forWeekEnding'] = artifact.header.forWeekEnding;
  out['header.payrollNumber'] = artifact.header.payrollNumber;
  out['header.projectOrContractNumber'] = artifact.header.projectOrContractNumber;

  artifact.workers.forEach((worker, w) => {
    const prefix = `worker.${w}`;
    out[`${prefix}.col1A`] = worker.entryNumber;
    out[`${prefix}.col1B`] = worker.lastName;
    out[`${prefix}.col1C`] = worker.firstName;
    out[`${prefix}.col1D`] = worker.middleInitial;
    out[`${prefix}.col1E`] = worker.identifyingNumber;
    out[`${prefix}.col2`] = worker.col2Status;
    out[`${prefix}.col2Level`] = worker.col2LevelOfProgression;
    out[`${prefix}.col7A`] = worker.col7AGross;
    out[`${prefix}.col7B`] = worker.col7BAllWork;
    out[`${prefix}.col8.fica`] = worker.col8Deductions.fica;
    out[`${prefix}.col8.withholdingTax`] = worker.col8Deductions.withholdingTax;
    out[`${prefix}.col8.otherTotal`] = worker.col8Deductions.otherTotal;
    out[`${prefix}.col8.other`] = worker.col8Deductions.other
      .map((entry) => `${entry.label}=${entry.amount}`)
      .join(';');
    out[`${prefix}.col8.total`] = worker.col8Deductions.total;
    out[`${prefix}.col9`] = worker.col9NetPaid;
    out[`${prefix}.netMismatch`] = worker.netMismatch;

    worker.lines.forEach((line, l) => {
      const linePrefix = `${prefix}.line.${l}`;
      out[`${linePrefix}.col3`] = line.col3Classification;
      line.col4Days.forEach((day, d) => {
        out[`${linePrefix}.col4.${d}.st`] = day.st;
        out[`${linePrefix}.col4.${d}.ot`] = day.ot;
        out[`${linePrefix}.col4.${d}.dt`] = day.dt;
      });
      out[`${linePrefix}.col5`] = line.col5TotalHours;
      out[`${linePrefix}.col6A.st`] = line.col6AStraightTime;
      out[`${linePrefix}.col6A.ot`] = line.col6AOvertime;
      out[`${linePrefix}.col6B`] = line.col6BFringeCredit;
      out[`${linePrefix}.col6C`] = line.col6CInLieu;
      out[`${linePrefix}.blocked`] = line.blocked;
    });
  });

  out['totals.hoursWorked'] = artifact.totals.hoursWorked;
  out['totals.col7A'] = artifact.totals.col7A;
  out['totals.col7B'] = artifact.totals.col7B;
  out['totals.deductions'] = artifact.totals.deductions;
  out['totals.cwhssaPremium'] = artifact.totals.cwhssaPremium;

  out['soc.box1'] = artifact.statementOfCompliance.boxes.box1;
  out['soc.box2'] = artifact.statementOfCompliance.boxes.box2;
  out['soc.box3'] = artifact.statementOfCompliance.boxes.box3;
  out['soc.box4'] = artifact.statementOfCompliance.boxes.box4;
  out['soc.box5'] = artifact.statementOfCompliance.boxes.box5;
  out['soc.box6'] = artifact.statementOfCompliance.boxes.box6;

  out['provenance.wdNumber'] = artifact.provenance.wdNumber;
  out['provenance.revisionPinned'] = artifact.provenance.revisionPinned;
  out['provenance.revisionAtAward'] = artifact.provenance.revisionAtAward;
  out['provenance.publishDate'] = artifact.provenance.publishDate;
  out['provenance.canonicalSha256'] = artifact.provenance.canonicalSha256;
  out['provenance.snapshotRef'] = artifact.provenance.snapshotRef;
  out['provenance.merkleRoot'] = artifact.provenance.merkleRoot;
  out['provenance.leafIndex'] = artifact.provenance.leafIndex;
  out['provenance.engineVersion'] = artifact.provenance.engineVersion;
  out['provenance.buildSha'] = artifact.provenance.buildSha;
  out['provenance.formLayout'] = artifact.provenance.formLayout;
  out['provenance.formPdfSha256'] = artifact.provenance.formPdfSha256;
  out['provenance.xsdSha256'] = artifact.provenance.xsdSha256;
  out['provenance.contractValueBand'] = artifact.provenance.contractValueBand;
  out['provenance.certifiable'] = artifact.provenance.certifiable;

  artifact.footer.forEach((line) => {
    out[`footer.${line.id}`] = line.text;
  });

  return out;
}
