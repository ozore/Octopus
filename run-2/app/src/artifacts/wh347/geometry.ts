/**
 * THE FIELD-GEOMETRY TABLES — one per layout, checked into the repo.
 *
 * AUTHORITY: `ARCHITECTURE.md` **ADR-008** ("compose the page directly … from a
 * declarative field-geometry table checked into the repo, one table per layout"),
 * **ADR-012** ("Ship both WH-347 layouts behind a per-project flag"),
 * `DESIGN_SYSTEM.md` §8.8.1 (the verified MediaBox and the column set), deep dive
 * 04 §1.1 (what changed on the Rev. January 2025 form).
 *
 * ===========================================================================
 * THE PAGE SIZE IS VERIFIED, NOT ASSUMED
 *
 * DOL's own WH-347 PDF declares `MediaBox [0 0 792 612]` on BOTH of its two pages —
 * 792 × 612 pt is 11in × 8.5in, US Letter LANDSCAPE (verified 2026-08-13 against
 * the form PDF). Page 1 is the payroll grid; page 2 is the statement of compliance.
 * Every number below is in PostScript points at that page size.
 *
 * ===========================================================================
 * WHY BOTH LAYOUTS SHIP
 *
 * The widely repeated 1 October 2026 mandatory cutover to the revised form is
 * VENDOR-ASSERTED with no DOL source (deep dive 04 §1.1: Points North, SkillSmart,
 * LCPtracker; no DOL page found, and the asserting article cites none). Shipping
 * only the revised form bets every filing in the transition window on a date we
 * cannot source; shipping only the legacy one bets against a revision that is
 * already published. Both cost one table each. `rev-2025-01` is the default and the
 * flag is per project, so a receiving clerk who rejects the new layout is a
 * setting, not a support request (A3 — there is nobody to ask).
 *
 * ===========================================================================
 * HOW THE WIDTHS WERE CHOSEN
 *
 * The grid is 741 pt wide, centred at x = 25.5 — inside the 0.35in (25.2 pt)
 * margin `DESIGN_SYSTEM.md` §11.2 sets for the artifact print path. Widths are
 * INTEGERS SUMMING EXACTLY to 741, so no scale factor is applied at render time and
 * no column boundary lands on an irrational coordinate. Money columns are sized
 * from the metric of the widest realistic cell — `1,234,567.89` at 6.5 pt Helvetica
 * — rather than by eye, and `assertGeometry` re-checks the sum at module load, so a
 * mis-edited table fails at import rather than by overrunning the page.
 */

import type { Wh347Layout } from '@/lib/types';

// ===========================================================================
// Column identity
// ===========================================================================

export type Wh347ColumnId =
  // Rev. January 2025
  | '1A' | '1B' | '1C' | '1D' | '1E' | '2'
  // shared
  | '3' | 'SOD' | '4' | '5' | '8' | '9'
  // Rev. January 2025 money columns
  | '6A' | '6B' | '6C' | '7A' | '7B'
  // legacy
  | '1' | '2X' | '6' | '7';

/** Which datum fills the column, and therefore how the renderer walks it. */
export type ColumnScope =
  /** One value per worker block, drawn once on the block's first row. */
  | 'worker'
  /** One value per classification line, drawn on the line's first sub-row. */
  | 'line'
  /** Three values per line, one per sub-row (straight / overtime / double). */
  | 'subrow'
  /** The seven day cells. */
  | 'days'
  /** The deduction sub-columns. */
  | 'deductions';

export interface ColumnSpec {
  readonly id: Wh347ColumnId;
  /** Stacked heading lines, drawn top-down inside the column head. */
  readonly heading: readonly string[];
  readonly width: number;
  readonly align: 'left' | 'center' | 'right';
  readonly scope: ColumnScope;
  /** Fixed sub-column labels, for column 8. Column 4's sub-columns are the week's
   *  own dates and are generated at render time. */
  readonly subColumns?: readonly { readonly label: string; readonly width: number }[];
}

export interface HeaderFieldSpec {
  readonly id:
    | 'contractorName'
    | 'contractorAddress'
    | 'payrollNumber'
    | 'forWeekEnding'
    | 'projectAndLocation'
    | 'projectOrContractNumber'
    | 'wageDeterminationNumber'
    | 'finalPayroll';
  readonly label: string;
  /** Fraction of the grid width, within the header row this field sits on. */
  readonly widthFraction: number;
  readonly row: 0 | 1;
}

export interface LayoutGeometry {
  readonly layout: Wh347Layout;
  readonly formRevisionLabel: string;
  readonly ombLabel: string;
  readonly page: { readonly width: number; readonly height: number };
  readonly grid: { readonly left: number; readonly width: number };
  readonly margin: { readonly top: number; readonly bottom: number };
  /** The full-contrast DRAFT band across the top of the page (`DESIGN_SYSTEM.md`
   *  §8.8.2). Occupies space only when the status is DRAFT — NOT CERTIFIABLE. */
  readonly bandHeight: number;
  readonly bandGap: number;
  readonly headerHeight: number;
  readonly headerRowHeight: number;
  readonly columnHeadHeight: number;
  /** The group-label band inside the column head, used by columns 4 and 8. */
  readonly columnHeadGroupHeight: number;
  readonly subRowHeight: number;
  /** Straight time, overtime, double time — three sub-rows per classification line
   *  on both layouts. `dt` is a pass-through of the customer's dollars and OUR
   *  count of hours (`ENGINE.md` §4 A2), so it gets a row of its own rather than
   *  being folded into overtime where it would disappear. */
  readonly subRowsPerLine: number;
  /** The filing-totals strip, between the grid box and the footer rule. It is part
   *  of the page budget rather than something drawn into the footer's space —
   *  §8.9's footer has no print override and nothing may crowd it. */
  readonly totalsHeight: number;
  readonly footerHeight: number;
  readonly columns: readonly ColumnSpec[];
  readonly headerFields: readonly HeaderFieldSpec[];
  /** Type sizes, in points. Named rather than inlined so a legibility change is one
   *  edit and a diff a reviewer can read. */
  readonly type: {
    readonly formTitle: number;
    readonly formSubtitle: number;
    readonly fieldLabel: number;
    readonly fieldValue: number;
    readonly columnHead: number;
    readonly cell: number;
    readonly money: number;
    readonly footer: number;
    readonly boundary: number;
    readonly band: number;
    readonly watermark: number;
  };
}

// ===========================================================================
// The palette — the design system's LIGHT tokens, because paper has one theme
// ===========================================================================

/** `DESIGN_SYSTEM.md` §11.3: the print path forces the light palette regardless of
 *  the reader's screen theme, because "an inverted artifact is not the artifact".
 *  A PDF has no theme at all, so these are simply the values. */
export const INK = '#14120E'; // --rp-ink-950
export const INK_2 = '#403A30'; // --rp-ink-800
export const INK_3 = '#5C5648'; // --rp-ink-600
export const RULE = '#87806E'; // --rp-stock-400, the meaningful border
export const RULE_HAIR = '#D8D3C7'; // --rp-stock-200, decorative hairline
export const SUNKEN = '#F3F1EB'; // --rp-stock-050
export const DRAFT = '#A61B10'; // --rp-draft-700
export const DATED = '#8A5200'; // --rp-dated-700
export const PAPER = '#FFFFFF';
/**
 * The watermark's composite, taken from `DESIGN_SYSTEM.md` §4.6's own certified
 * table: "Light, print (α 0.24) → #EAC8C6", chosen as the largest alpha that keeps
 * `--rp-ink-3` above 4.5:1 over it. Drawing that composite as an OPAQUE colour
 * gives exactly the certified result without a transparency group — so every glyph
 * on the page still sits at full contrast over one of exactly two known backdrops.
 */
export const WATERMARK = '#EAC8C6';

// ===========================================================================
// Rev. January 2025
// ===========================================================================

const DAY_COLUMN_WIDTH = 18;

const REV_2025_COLUMNS: readonly ColumnSpec[] = [
  { id: '1A', heading: ['1A', 'ENTRY', 'NO.'], width: 18, align: 'center', scope: 'worker' },
  { id: '1B', heading: ['1B', 'LAST NAME'], width: 50, align: 'left', scope: 'worker' },
  { id: '1C', heading: ['1C', 'FIRST NAME'], width: 38, align: 'left', scope: 'worker' },
  { id: '1D', heading: ['1D', 'M.I.'], width: 13, align: 'center', scope: 'worker' },
  { id: '1E', heading: ['1E', 'WORKER IDENT.', 'NO. (LAST 4)'], width: 34, align: 'center', scope: 'worker' },
  { id: '2', heading: ['2', '(J)/(RA)', 'LEVEL'], width: 26, align: 'center', scope: 'worker' },
  { id: '3', heading: ['3', 'WORK CLASSIFICATION'], width: 70, align: 'left', scope: 'line' },
  { id: 'SOD', heading: [''], width: 10, align: 'center', scope: 'subrow' },
  {
    id: '4',
    heading: ['4  DAY AND DATE — HOURS WORKED EACH DAY'],
    width: DAY_COLUMN_WIDTH * 7,
    align: 'center',
    scope: 'days',
  },
  { id: '5', heading: ['5', 'TOTAL', 'HOURS'], width: 24, align: 'right', scope: 'line' },
  { id: '6A', heading: ['6A', 'RATE OF PAY', 'PER HOUR'], width: 30, align: 'right', scope: 'subrow' },
  { id: '6B', heading: ['6B', 'TOTAL FRINGE', 'BENEFIT CREDIT'], width: 32, align: 'right', scope: 'line' },
  { id: '6C', heading: ['6C', 'PAYMENT IN LIEU', 'OF FRINGE BEN.'], width: 30, align: 'right', scope: 'line' },
  { id: '7A', heading: ['7A', 'GROSS EARNED', 'THIS PROJECT'], width: 40, align: 'right', scope: 'worker' },
  { id: '7B', heading: ['7B', 'GROSS EARNED', 'ALL WORK'], width: 40, align: 'right', scope: 'worker' },
  {
    id: '8',
    heading: ['8  DEDUCTIONS'],
    width: 124,
    align: 'right',
    scope: 'deductions',
    subColumns: [
      { label: 'FICA', width: 31 },
      { label: 'WITHHOLDING TAX', width: 31 },
      { label: 'OTHER', width: 31 },
      { label: 'TOTAL', width: 31 },
    ],
  },
  { id: '9', heading: ['9', 'NET WAGES', 'PAID FOR WEEK'], width: 36, align: 'right', scope: 'worker' },
];

const REV_2025_HEADER_FIELDS: readonly HeaderFieldSpec[] = [
  { id: 'contractorName', label: 'NAME OF CONTRACTOR OR SUBCONTRACTOR', widthFraction: 0.34, row: 0 },
  { id: 'contractorAddress', label: 'ADDRESS', widthFraction: 0.34, row: 0 },
  { id: 'payrollNumber', label: 'PAYROLL NO.', widthFraction: 0.12, row: 0 },
  { id: 'forWeekEnding', label: 'FOR WEEK ENDING', widthFraction: 0.2, row: 0 },
  { id: 'projectAndLocation', label: 'PROJECT AND LOCATION', widthFraction: 0.34, row: 1 },
  { id: 'projectOrContractNumber', label: 'PROJECT OR CONTRACT NO.', widthFraction: 0.22, row: 1 },
  // The field that makes this product's claim the form's own question (deep dive
  // 04 §1.1). It does not exist on the legacy layout.
  { id: 'wageDeterminationNumber', label: 'WAGE DETERMINATION NO.', widthFraction: 0.32, row: 1 },
  { id: 'finalPayroll', label: 'FINAL PAYROLL', widthFraction: 0.12, row: 1 },
];

// ===========================================================================
// Legacy
// ===========================================================================

const LEGACY_DAY_COLUMN_WIDTH = 20;

const LEGACY_COLUMNS: readonly ColumnSpec[] = [
  {
    id: '1',
    heading: ['1', 'NAME AND INDIVIDUAL IDENTIFYING NUMBER', 'OF WORKER (LAST 4 OF SSN)'],
    width: 150,
    align: 'left',
    scope: 'worker',
  },
  { id: '2X', heading: ['2', 'NO. OF WITH-', 'HOLDING EXEMP.'], width: 34, align: 'center', scope: 'worker' },
  { id: '3', heading: ['3', 'WORK CLASSIFICATION'], width: 116, align: 'left', scope: 'line' },
  { id: 'SOD', heading: [''], width: 10, align: 'center', scope: 'subrow' },
  {
    id: '4',
    heading: ['4  DAY AND DATE — HOURS WORKED EACH DAY'],
    width: LEGACY_DAY_COLUMN_WIDTH * 7,
    align: 'center',
    scope: 'days',
  },
  { id: '5', heading: ['5', 'TOTAL', 'HOURS'], width: 28, align: 'right', scope: 'line' },
  {
    id: '6',
    // The legacy form's column 6 is a single rate cell — the split into 6A/6B/6C is
    // exactly what the revision introduced. We print the straight-time cash rate
    // here and disclose the fringe credit under REMARKS rather than inventing a
    // combined figure the customer never asserted.
    heading: ['6', 'RATE OF PAY', 'PER HOUR'],
    width: 40,
    align: 'right',
    scope: 'subrow',
  },
  { id: '7', heading: ['7', 'GROSS AMOUNT EARNED', 'PROJECT / ALL WORK'], width: 60, align: 'right', scope: 'worker' },
  {
    id: '8',
    heading: ['8  DEDUCTIONS'],
    width: 128,
    align: 'right',
    scope: 'deductions',
    subColumns: [
      { label: 'FICA', width: 32 },
      { label: 'WITHHOLDING TAX', width: 32 },
      { label: 'OTHER', width: 32 },
      { label: 'TOTAL', width: 32 },
    ],
  },
  { id: '9', heading: ['9', 'NET WAGES', 'PAID FOR WEEK'], width: 35, align: 'right', scope: 'worker' },
];

const LEGACY_HEADER_FIELDS: readonly HeaderFieldSpec[] = [
  { id: 'contractorName', label: 'NAME OF CONTRACTOR OR SUBCONTRACTOR', widthFraction: 0.4, row: 0 },
  { id: 'contractorAddress', label: 'ADDRESS', widthFraction: 0.4, row: 0 },
  { id: 'payrollNumber', label: 'PAYROLL NO.', widthFraction: 0.2, row: 0 },
  { id: 'projectAndLocation', label: 'PROJECT AND LOCATION', widthFraction: 0.44, row: 1 },
  { id: 'projectOrContractNumber', label: 'PROJECT OR CONTRACT NO.', widthFraction: 0.32, row: 1 },
  { id: 'forWeekEnding', label: 'FOR WEEK ENDING', widthFraction: 0.24, row: 1 },
];

// ===========================================================================
// The tables
// ===========================================================================

const SHARED = {
  page: { width: 792, height: 612 },
  grid: { left: 25.5, width: 741 },
  margin: { top: 25.2, bottom: 25.2 },
  bandHeight: 20,
  bandGap: 4,
  headerHeight: 92,
  headerRowHeight: 26,
  columnHeadHeight: 40,
  columnHeadGroupHeight: 13,
  subRowHeight: 9.5,
  subRowsPerLine: 3,
  totalsHeight: 13,
  footerHeight: 72,
  type: {
    formTitle: 10,
    formSubtitle: 6,
    fieldLabel: 5,
    fieldValue: 8,
    columnHead: 4.6,
    cell: 6.5,
    money: 6.5,
    footer: 6.5,
    boundary: 7,
    band: 8.5,
    watermark: 34,
  },
} as const;

export const WH347_REV_2025_01: LayoutGeometry = {
  layout: 'wh347_rev_2025_01',
  formRevisionLabel: 'Rev. January 2025',
  ombLabel: 'OMB No. 1235-0008  ·  Expires 01/31/2028',
  ...SHARED,
  columns: REV_2025_COLUMNS,
  headerFields: REV_2025_HEADER_FIELDS,
};

export const WH347_LEGACY: LayoutGeometry = {
  layout: 'wh347_legacy',
  formRevisionLabel: 'Legacy layout (pre-Rev. January 2025)',
  ombLabel: 'OMB No. 1235-0008',
  ...SHARED,
  columns: LEGACY_COLUMNS,
  headerFields: LEGACY_HEADER_FIELDS,
};

export const WH347_GEOMETRY: Readonly<Record<Wh347Layout, LayoutGeometry>> = {
  wh347_rev_2025_01: WH347_REV_2025_01,
  wh347_legacy: WH347_LEGACY,
} as const;

// ===========================================================================
// Derived geometry
// ===========================================================================

export interface ColumnBox {
  readonly spec: ColumnSpec;
  readonly x: number;
  readonly width: number;
}

/** Left edges, accumulated left to right. Pure, so the column head and the cells
 *  cannot disagree about where a boundary is. */
export function columnBoxes(geometry: LayoutGeometry): readonly ColumnBox[] {
  const boxes: ColumnBox[] = [];
  let x = geometry.grid.left;
  for (const spec of geometry.columns) {
    boxes.push({ spec, x, width: spec.width });
    x += spec.width;
  }
  return boxes;
}

export function lineHeight(geometry: LayoutGeometry): number {
  return geometry.subRowHeight * geometry.subRowsPerLine;
}

/**
 * How many classification lines fit on one page.
 *
 * The DRAFT band costs a row and that is the correct trade: the band is the thing a
 * reader sees first, and a form that silently dropped it to keep a twelfth row
 * would be optimising the wrong quantity.
 */
export function rowsPerPage(geometry: LayoutGeometry, withBand: boolean): number {
  const bandCost = withBand ? geometry.bandHeight + geometry.bandGap : 0;
  const available =
    geometry.page.height -
    geometry.margin.top -
    geometry.margin.bottom -
    bandCost -
    geometry.headerHeight -
    geometry.columnHeadHeight -
    geometry.totalsHeight -
    geometry.footerHeight;
  return Math.max(1, Math.floor(available / lineHeight(geometry)));
}

/** Fail at import rather than off the edge of the page. */
function assertGeometry(geometry: LayoutGeometry): void {
  const sum = geometry.columns.reduce((total, column) => total + column.width, 0);
  if (sum !== geometry.grid.width) {
    throw new Error(
      `${geometry.layout}: column widths sum to ${sum}, not ${geometry.grid.width}. ` +
        'The geometry table is the source of truth for the form (ADR-008); a table that ' +
        'does not fit the page would render a certified payroll with a column off the edge.',
    );
  }
  if (geometry.grid.left + geometry.grid.width > geometry.page.width) {
    throw new Error(`${geometry.layout}: the grid overruns the page width`);
  }
  for (const column of geometry.columns) {
    if (!column.subColumns) continue;
    const subSum = column.subColumns.reduce((total, sub) => total + sub.width, 0);
    if (subSum !== column.width) {
      throw new Error(
        `${geometry.layout}: column ${column.id}'s sub-columns sum to ${subSum}, not ${column.width}`,
      );
    }
  }
  if (rowsPerPage(geometry, true) < 1) {
    throw new Error(`${geometry.layout}: no payroll rows fit on a page with the DRAFT band`);
  }
}

assertGeometry(WH347_REV_2025_01);
assertGeometry(WH347_LEGACY);
