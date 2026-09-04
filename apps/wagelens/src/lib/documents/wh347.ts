/**
 * The generator. Page 1 is the payroll grid, page 2 is the Statement of
 * Compliance, and both are drawn from scratch because the official form has
 * nothing to fill (KB-6, and `pdf.ts`'s header for the mechanics).
 *
 * **WHAT THE LAYOUT REPRODUCES, AND WHY EXACTLY THAT.** KNOWLEDGE_BASE §5 fixes
 * three things: the column band is labelled exactly
 * `(1A) (1B) (1C) (1D) (1E) (2) (3) (4) (5) (6A) (6B) (6C) (7A) (7B) (8) (9)`;
 * eight worker rows print per page, each occupying a straight-time row and an
 * overtime row across seven dated day columns; and the Statement of Compliance
 * is verbatim. Everything else about the layout is ours, because the official
 * PDF has no continuation convention and we have to state one: the header block
 * repeats, `Page n of m` is printed, and `worker_entry_no` runs unbroken across
 * pages (WL-06 edge cases).
 *
 * **THREE RULES THAT ARE NOT LAYOUT CHOICES.**
 *  - Column (1E) prints four characters, because no column upstream stores more
 *    (gate G7, V2). There is no `slice` here doing the work — the value arrives
 *    already four characters long, and the privacy test regexes every rendered
 *    fixture for a nine-digit sequence.
 *  - A name that does not fit is WRAPPED, never truncated (V8). A truncated
 *    name on a certified payroll is a defective filing.
 *  - Money prints to exactly two decimals with no separators and no locale
 *    (V7): the form is a fixed-width grid, and `1,540.00` in a cell sized for
 *    `1540.00` is how a column stops lining up.
 */

import type { PDFDocument, PDFPage } from 'pdf-lib';

import { documentFooterText } from '@/components/disclaimer';

import {
  formatHours,
  formatMoney,
  cents,
  fromCents,
  rateNotation,
  weekDates,
  weekDayLabels,
} from '../domain/payroll-math';
import {
  CONTENT_WIDTH,
  type Fonts,
  HAIRLINE,
  MARGIN,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  RULE,
  TINT,
  createDeterministicDocument,
  drawCheckbox,
  drawField,
  drawLine,
  drawRect,
  drawText,
  drawWatermark,
  serialise,
  wrapText,
} from './pdf';
import {
  ROWS_PER_GRID_PAGE,
  displayName,
  rowsWithFringeCredit,
  type FringeCreditLine,
  type Wh347Model,
  type Wh347Row,
} from './model';
import {
  APPRENTICESHIP_ATTESTATION,
  CERTIFICATIONS,
  DRAFT_WATERMARK,
  FALSIFICATION_WARNING,
  FORM_REVISION,
  FRINGE_ATTESTATION,
  FRINGE_BLOCK_INSTRUCTION,
  FRINGE_BLOCK_TITLE,
  NO_REBATES_ATTESTATION,
  NO_WORK_PERFORMED_BANNER,
  OMB_CONTROL_NUMBER,
  OMB_EXPIRES,
  PUBLIC_BURDEN_MINUTES,
  SOC_PREAMBLE,
} from './statement-of-compliance';

// ---------------------------------------------------------------------------
// The page-1 column band
// ---------------------------------------------------------------------------

type Column = {
  code: string;
  label: string;
  width: number;
  align: 'start' | 'end' | 'center';
};

/** Widths sum to exactly `CONTENT_WIDTH` (964pt on US Legal landscape). */
const IDENTITY_COLUMNS: Column[] = [
  { code: '(1A)', label: 'NO.', width: 20, align: 'center' },
  { code: '(1B)', label: 'LAST NAME', width: 80, align: 'start' },
  { code: '(1C)', label: 'FIRST NAME', width: 66, align: 'start' },
  { code: '(1D)', label: 'MI', width: 16, align: 'center' },
  { code: '(1E)', label: 'ID NO.', width: 26, align: 'center' },
  { code: '(2)', label: 'J/RA', width: 20, align: 'center' },
  { code: '(3)', label: 'WORK CLASSIFICATION', width: 120, align: 'start' },
];

const DAY_COLUMN_WIDTH = 26;

const MONEY_COLUMNS: Column[] = [
  { code: '(5)', label: 'TOTAL HRS', width: 30, align: 'end' },
  { code: '(6A)', label: 'RATE OF PAY', width: 40, align: 'end' },
  { code: '(6B)', label: 'FRINGE CR.', width: 34, align: 'end' },
  { code: '(6C)', label: 'IN LIEU', width: 34, align: 'end' },
  { code: '(7A)', label: 'THIS PROJECT', width: 46, align: 'end' },
  { code: '(7B)', label: 'ALL WORK', width: 46, align: 'end' },
  { code: '(8a)', label: 'TAX', width: 36, align: 'end' },
  { code: '(8b)', label: 'FICA', width: 32, align: 'end' },
  { code: '(8c)', label: 'OTHER', width: 54, align: 'end' },
  { code: '(8d)', label: 'TOTAL DED.', width: 36, align: 'end' },
  { code: '(9)', label: 'NET PAY', width: 46, align: 'end' },
];

/** x offset of every column, left to right, from the page's left margin. */
function columnOffsets(): { x: number[]; total: number } {
  const widths = [
    ...IDENTITY_COLUMNS.map((c) => c.width),
    ...new Array<number>(7).fill(DAY_COLUMN_WIDTH),
    ...MONEY_COLUMNS.map((c) => c.width),
  ];
  const x: number[] = [];
  let cursor = MARGIN;
  for (const w of widths) {
    x.push(cursor);
    cursor += w;
  }
  x.push(cursor);
  return { x, total: cursor - MARGIN };
}

const OFFSETS = columnOffsets();
const IDENTITY_END = IDENTITY_COLUMNS.length;
const DAY_START = IDENTITY_END;
const MONEY_START = DAY_START + 7;

// ---------------------------------------------------------------------------
// The sheet: pages, a cursor, a footer on every page and a deferred page count
// ---------------------------------------------------------------------------

const FOOTER_RESERVE = 44;
const BODY_BOTTOM = MARGIN + FOOTER_RESERVE;

class Sheet {
  readonly pages: PDFPage[] = [];
  page!: PDFPage;
  y = 0;
  private readonly pageNumberSlots: Array<{ page: PDFPage; x: number; y: number }> = [];

  constructor(
    private readonly pdf: PDFDocument,
    readonly fonts: Fonts,
    readonly model: Wh347Model,
    private readonly title: string,
  ) {}

  newPage(): PDFPage {
    const page = this.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pages.push(page);
    this.page = page;
    this.y = PAGE_HEIGHT - MARGIN;
    this.drawMasthead();
    this.drawFooter(page);
    if (this.model.draft) drawWatermark(page, this.fonts, DRAFT_WATERMARK);
    return page;
  }

  ensure(height: number): void {
    if (!this.page || this.y - height < BODY_BOTTOM) this.newPage();
  }

  private drawMasthead(): void {
    drawText(this.page, this.fonts, this.title, MARGIN, this.y - 8, { size: 9, bold: true });
    const meta = `${FORM_REVISION} · OMB ${OMB_CONTROL_NUMBER} · expires ${OMB_EXPIRES} · public burden ${PUBLIC_BURDEN_MINUTES} minutes`;
    drawText(this.page, this.fonts, meta, MARGIN, this.y - 17, {
      size: 5,
      width: CONTENT_WIDTH,
      align: 'end',
    });
    this.pageNumberSlots.push({ page: this.page, x: MARGIN, y: this.y - 17 });
    this.y -= 22;
  }

  /**
   * §9.2's footer, verbatim, plus the provenance line the gate reads. The
   * words live in ONE place — `documentFooterText` in the disclaimer
   * component — so a change to them is a change to one file.
   */
  private drawFooter(page: PDFPage): void {
    const { provenance } = this.model;
    drawLine(page, MARGIN, MARGIN + FOOTER_RESERVE - 8, PAGE_WIDTH - MARGIN, MARGIN + FOOTER_RESERVE - 8, HAIRLINE);

    const provenanceLine = `Wage determination ${provenance.wdNumber}, modification ${provenance.modificationNumber}, published ${provenance.publicationDate}.`;
    const superseded = provenance.newerModification
      ? ` A newer modification (${provenance.newerModification.modificationNumber}) was published on ${provenance.newerModification.publicationDate}; the determination incorporated into the contract governs.`
      : '';

    const footer = documentFooterText({
      productName: this.model.productName,
      productUrl: this.model.productUrl,
      generatedAt: this.model.certifiedAt,
      wdNumber: provenance.wdNumber,
      modificationNumber: provenance.modificationNumber,
      publicationDate: provenance.publicationDate,
    });

    let cursor = MARGIN + FOOTER_RESERVE - 16;
    for (const line of wrapText(`${provenanceLine}${superseded}`, CONTENT_WIDTH, 5)) {
      drawText(page, this.fonts, line, MARGIN, cursor, { size: 5, bold: true });
      cursor -= 6;
    }
    for (const line of wrapText(footer, CONTENT_WIDTH, 4.6)) {
      drawText(page, this.fonts, line, MARGIN, cursor, { size: 4.6 });
      cursor -= 5.4;
    }
  }

  /** `Page n of m` can only be written once m is known. */
  finish(): void {
    const total = this.pages.length;
    for (const slot of this.pageNumberSlots) {
      const index = this.pages.indexOf(slot.page) + 1;
      drawText(slot.page, this.fonts, `Page ${index} of ${total}`, slot.x, slot.y, { size: 5 });
    }
  }
}

// ---------------------------------------------------------------------------
// Page 1 — the payroll grid
// ---------------------------------------------------------------------------

function drawHeaderBlock(sheet: Sheet): void {
  const { header } = sheet.model;
  const fonts = sheet.fonts;
  const page = sheet.page;

  // Row A — the two checkbox groups the form opens with.
  const rowA = sheet.y - 12;
  drawCheckbox(page, MARGIN, rowA, header.isFinal, 6);
  drawText(page, fonts, 'SUBMISSION OF FINAL DBRA CERTIFIED PAYROLL FORM', MARGIN + 9, rowA + 1, {
    size: 5.5,
    bold: true,
  });
  drawCheckbox(page, MARGIN + 260, rowA, header.ourRole === 'prime', 6);
  drawText(page, fonts, 'PRIME CONTRACTOR', MARGIN + 269, rowA + 1, { size: 5.5, bold: true });
  drawCheckbox(page, MARGIN + 360, rowA, header.ourRole === 'sub', 6);
  drawText(page, fonts, 'SUBCONTRACTOR', MARGIN + 369, rowA + 1, { size: 5.5, bold: true });
  sheet.y -= 16;

  // Row B
  const rowB = sheet.y - 26;
  const b = [300, 220, 150, CONTENT_WIDTH - 670];
  let x = MARGIN;
  drawField(page, fonts, { x, y: rowB, width: b[0] as number, height: 26, label: 'PROJECT NAME', value: header.projectName });
  x += b[0] as number;
  drawField(page, fonts, { x, y: rowB, width: b[1] as number, height: 26, label: 'PROJECT NO. or CONTRACT NO.', value: header.projectOrContractNo });
  x += b[1] as number;
  drawField(page, fonts, {
    x,
    y: rowB,
    width: b[2] as number,
    height: 26,
    label: 'CERTIFIED PAYROLL NO.',
    value: header.payrollNumber === null ? 'PROVISIONAL' : String(header.payrollNumber),
  });
  x += b[2] as number;
  drawField(page, fonts, { x, y: rowB, width: b[3] as number, height: 26, label: 'WEEK ENDING DATE', value: header.weekEndingDate });
  sheet.y -= 26;

  // Row C
  const rowC = sheet.y - 26;
  drawField(page, fonts, {
    x: MARGIN,
    y: rowC,
    width: 382,
    height: 26,
    label: 'PRIME CONTRACTOR’S/SUBCONTRACTOR’S BUSINESS NAME',
    value: header.businessName,
  });
  drawField(page, fonts, {
    x: MARGIN + 382,
    y: rowC,
    width: CONTENT_WIDTH - 382,
    height: 26,
    label: 'PRIME CONTRACTOR’S/SUBCONTRACTOR’S BUSINESS ADDRESS',
    value: header.businessAddress,
    valueSize: 6,
  });
  sheet.y -= 26;

  // Row D — the field the whole product exists to fill correctly.
  const rowD = sheet.y - 26;
  drawField(page, fonts, {
    x: MARGIN,
    y: rowD,
    width: 582,
    height: 26,
    label: 'PROJECT LOCATION',
    value: header.projectLocation,
  });
  drawField(page, fonts, {
    x: MARGIN + 582,
    y: rowD,
    width: CONTENT_WIDTH - 582,
    height: 26,
    label: 'WAGE DETERMINATION NO.',
    value: header.wageDeterminationNo,
    valueSize: 9,
  });
  sheet.y -= 30;
}

function drawColumnBand(sheet: Sheet): void {
  const page = sheet.page;
  const fonts = sheet.fonts;
  const dates = weekDates(sheet.model.header.weekEndingDate);
  const labels = weekDayLabels(sheet.model.header.weekEndingDate);

  const groupTop = sheet.y;
  const groupH = 11;
  const bandH = 18;
  const bodyTop = groupTop - groupH - bandH;

  drawRect(page, MARGIN, groupTop - groupH, CONTENT_WIDTH, groupH, { fill: TINT, stroke: RULE });
  drawRect(page, MARGIN, bodyTop, CONTENT_WIDTH, bandH, { fill: TINT, stroke: RULE });

  const dayStartX = OFFSETS.x[DAY_START] as number;
  const dayWidth = DAY_COLUMN_WIDTH * 7;
  drawText(page, fonts, '(1) WORKER', MARGIN, groupTop - groupH + 3, {
    size: 5,
    bold: true,
    width: (OFFSETS.x[5] as number) - MARGIN,
    align: 'center',
  });
  drawText(
    page,
    fonts,
    '(4) DAY AND DATE — HOURS WORKED EACH DAY',
    dayStartX,
    groupTop - groupH + 3,
    { size: 5, bold: true, width: dayWidth, align: 'center' },
  );
  const moneyStartX = OFFSETS.x[MONEY_START] as number;
  drawText(
    page,
    fonts,
    '(5) TOTAL · (6) RATE OF PAY · (7) GROSS AMOUNT EARNED · (8) DEDUCTIONS FOR ALL WORK · (9) NET PAY',
    moneyStartX,
    groupTop - groupH + 3,
    { size: 5, bold: true, width: CONTENT_WIDTH - (moneyStartX - MARGIN), align: 'center' },
  );

  const cell = (index: number, code: string, label: string, sub?: string) => {
    const x = OFFSETS.x[index] as number;
    const width = (OFFSETS.x[index + 1] as number) - x;
    drawLine(page, x, bodyTop, x, bodyTop + bandH, RULE);
    drawText(page, fonts, code, x, bodyTop + bandH - 6, { size: 5, bold: true, width, align: 'center' });
    drawText(page, fonts, label, x, bodyTop + bandH - 12, { size: 4.2, width, align: 'center' });
    if (sub) drawText(page, fonts, sub, x, bodyTop + 2, { size: 4.2, width, align: 'center' });
  };

  IDENTITY_COLUMNS.forEach((column, index) => cell(index, column.code, column.label));
  for (let d = 0; d < 7; d += 1) {
    cell(DAY_START + d, labels[d] as string, '', (dates[d] as string).slice(5));
  }
  MONEY_COLUMNS.forEach((column, index) => cell(MONEY_START + index, column.code, column.label));

  sheet.y = bodyTop;
}

const SUB_ROW_HEIGHT = 15;
const WORKER_ROW_HEIGHT = SUB_ROW_HEIGHT * 2;

function drawWorkerRow(sheet: Sheet, row: Wh347Row): void {
  const page = sheet.page;
  const fonts = sheet.fonts;
  const top = sheet.y;
  const stTop = top - SUB_ROW_HEIGHT;
  const otTop = top - WORKER_ROW_HEIGHT;

  drawRect(page, MARGIN, otTop, CONTENT_WIDTH, WORKER_ROW_HEIGHT, { stroke: RULE });
  drawLine(page, OFFSETS.x[DAY_START] as number, stTop, PAGE_WIDTH - MARGIN, stTop, HAIRLINE);

  const put = (index: number, value: string, options: { align?: Column['align']; size?: number; y?: number } = {}) => {
    const x = OFFSETS.x[index] as number;
    const width = (OFFSETS.x[index + 1] as number) - x;
    drawText(page, fonts, value, x + 2, options.y ?? top - 10, {
      size: options.size ?? 6,
      width: width - 4,
      align: options.align ?? 'start',
    });
  };
  for (let i = 1; i < OFFSETS.x.length - 1; i += 1) {
    drawLine(page, OFFSETS.x[i] as number, otTop, OFFSETS.x[i] as number, top, RULE);
  }

  // --- (1A)…(3): one cell per worker, spanning both sub-rows ---------------
  put(0, String(row.entryNo), { align: 'center' });
  const nameWidth = (OFFSETS.x[2] as number) - (OFFSETS.x[1] as number) - 4;
  wrapText(row.lastName, nameWidth, 6).forEach((line, i) => {
    put(1, line, { y: top - 10 - i * 7 });
  });
  const firstWidth = (OFFSETS.x[3] as number) - (OFFSETS.x[2] as number) - 4;
  wrapText(row.firstName, firstWidth, 6).forEach((line, i) => {
    put(2, line, { y: top - 10 - i * 7 });
  });
  put(3, row.middleInitial ?? '', { align: 'center' });
  // (1E) — four characters, because nothing upstream holds more.
  put(4, row.identifyingNoLast4, { align: 'center' });
  put(5, row.workerStatus, { align: 'center' });
  const classWidth = (OFFSETS.x[7] as number) - (OFFSETS.x[6] as number) - 4;
  wrapText(row.classificationLabel, classWidth, 5.4).forEach((line, i) => {
    if (i > 3) return;
    put(6, line, { y: top - 9 - i * 6, size: 5.4 });
  });

  // --- (4): the 7×2 hours grid ---------------------------------------------
  for (let d = 0; d < 7; d += 1) {
    put(DAY_START + d, formatHours(row.hoursSt[d]), { align: 'center', y: stTop + 4 });
    put(DAY_START + d, formatHours(row.hoursOt[d]), { align: 'center', y: otTop + 4 });
  }

  // --- (5) and (6A) split across the ST and OT sub-rows ---------------------
  // The (5) cell names its own sub-row, so a reader never has to count rows to
  // know which line is straight time and which is overtime.
  put(MONEY_START, `ST ${formatHours(row.totalHoursSt) || '0'}`, { align: 'end', size: 5, y: stTop + 4 });
  put(MONEY_START, `OT ${formatHours(row.totalHoursOt) || '0'}`, { align: 'end', size: 5, y: otTop + 4 });
  /**
   * The form's own notation (WH-347 instructions, column 6, and IDENTITY §7.3):
   * where cash is paid in lieu of fringes, the rate is written `$12.25/.40` —
   * the basic hourly rate, then the cash payment. Reproduced literally because
   * it is what the buyer and the prime both expect to read.
   */
  put(MONEY_START + 1, rateNotation(row.rateSt, row.paymentInLieuHourly), { align: 'end', y: stTop + 4 });
  put(MONEY_START + 1, `$${formatMoney(row.rateOt)}`, { align: 'end', y: otTop + 4 });

  // --- one cell each, spanning both sub-rows --------------------------------
  const mid = top - WORKER_ROW_HEIGHT / 2 - 2;
  put(MONEY_START + 2, formatMoney(row.fringeCreditHourly), { align: 'end', y: mid });
  put(MONEY_START + 3, formatMoney(row.paymentInLieuHourly), { align: 'end', y: mid });
  put(MONEY_START + 4, formatMoney(row.grossProject), { align: 'end', y: mid });
  put(MONEY_START + 5, formatMoney(row.grossAllWork), { align: 'end', y: mid });
  put(MONEY_START + 6, formatMoney(row.dedTaxWithholdings), { align: 'end', y: mid });
  put(MONEY_START + 7, formatMoney(row.dedFica), { align: 'end', y: mid });
  put(MONEY_START + 8, formatMoney(row.dedOther), { align: 'end', y: top - 9 });
  if (row.dedOtherNote) {
    const width = (OFFSETS.x[MONEY_START + 9] as number) - (OFFSETS.x[MONEY_START + 8] as number) - 4;
    wrapText(row.dedOtherNote, width, 4.2).forEach((line, i) => {
      if (i > 2) return;
      put(MONEY_START + 8, line, { y: top - 16 - i * 5, size: 4.2 });
    });
  }
  put(MONEY_START + 9, formatMoney(row.dedTotal), { align: 'end', y: mid });
  put(MONEY_START + 10, formatMoney(row.netPay), { align: 'end', y: mid });

  sheet.y -= WORKER_ROW_HEIGHT;
}

function drawTotalsRow(sheet: Sheet, rows: Wh347Row[]): void {
  const page = sheet.page;
  const fonts = sheet.fonts;
  const height = 14;
  const top = sheet.y;
  drawRect(page, MARGIN, top - height, CONTENT_WIDTH, height, { fill: TINT, stroke: RULE });
  drawText(page, fonts, 'TOTALS', MARGIN + 3, top - 10, { size: 5.5, bold: true });

  const sum = (pick: (row: Wh347Row) => string) =>
    fromCents(rows.reduce((acc, row) => acc + cents(pick(row)), 0));

  const put = (index: number, value: string) => {
    const x = OFFSETS.x[index] as number;
    const width = (OFFSETS.x[index + 1] as number) - x;
    drawText(page, fonts, value, x + 2, top - 10, { size: 5.5, bold: true, width: width - 4, align: 'end' });
  };
  put(MONEY_START, `${formatHours(sum((r) => r.totalHoursSt)) || '0'}/${formatHours(sum((r) => r.totalHoursOt)) || '0'}`);
  put(MONEY_START + 4, formatMoney(sum((r) => r.grossProject)));
  put(MONEY_START + 5, formatMoney(sum((r) => r.grossAllWork)));
  put(MONEY_START + 9, formatMoney(sum((r) => r.dedTotal)));
  put(MONEY_START + 10, formatMoney(sum((r) => r.netPay)));
  sheet.y -= height;
}

function drawGridPages(sheet: Sheet): void {
  const model = sheet.model;
  const pages = model.noWorkPerformed
    ? [[] as Wh347Row[]]
    : chunk(model.rows, ROWS_PER_GRID_PAGE);

  for (const pageRows of pages) {
    sheet.newPage();
    drawHeaderBlock(sheet);
    drawColumnBand(sheet);
    if (model.noWorkPerformed) {
      // V9 — the header prints, the grid says so, and the number is consumed.
      const height = WORKER_ROW_HEIGHT * 2;
      drawRect(sheet.page, MARGIN, sheet.y - height, CONTENT_WIDTH, height, { stroke: RULE });
      drawText(sheet.page, sheet.fonts, NO_WORK_PERFORMED_BANNER, MARGIN, sheet.y - height / 2, {
        size: 14,
        bold: true,
        width: CONTENT_WIDTH,
        align: 'center',
      });
      sheet.y -= height;
    } else {
      for (const row of pageRows) drawWorkerRow(sheet, row);
      drawTotalsRow(sheet, pageRows);
    }
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// ---------------------------------------------------------------------------
// Page 2 — the Statement of Compliance
// ---------------------------------------------------------------------------

const PLAN_COLUMNS_PER_BLOCK = 6;
const FRINGE_ROWS_PER_BLOCK = 8;
const APPRENTICESHIP_PRINTED_ROWS = 3;

/** A plan is a COLUMN on page 2, so the distinct plans are collected once. */
function distinctPlans(rows: Wh347Row[]): FringeCreditLine[] {
  const seen = new Map<string, FringeCreditLine>();
  for (const row of rows) {
    for (const credit of row.fringeCredits) {
      const key = `${credit.planName}|${credit.planType}|${credit.planNo ?? ''}`;
      if (!seen.has(key)) seen.set(key, credit);
    }
  }
  return [...seen.values()];
}

function paragraph(sheet: Sheet, text: string, options: { size?: number; checkbox?: boolean; bold?: boolean } = {}): void {
  const size = options.size ?? 6;
  const indent = options.checkbox ? 12 : 0;
  const lines = wrapText(text, CONTENT_WIDTH - indent, size);
  sheet.ensure(lines.length * (size + 1.6) + 4);
  if (options.checkbox) drawCheckbox(sheet.page, MARGIN, sheet.y - size - 1, true, 6);
  for (const line of lines) {
    drawText(sheet.page, sheet.fonts, line, MARGIN + indent, sheet.y - size, {
      size,
      ...(options.bold ? { bold: true } : {}),
    });
    sheet.y -= size + 1.6;
  }
  sheet.y -= 3;
}

function drawSocHeader(sheet: Sheet): void {
  const { header, certifyingOfficial } = sheet.model;
  sheet.ensure(60);
  const page = sheet.page;
  const fonts = sheet.fonts;

  const row1 = sheet.y - 24;
  let x = MARGIN;
  const widths1 = [300, 220, 110, CONTENT_WIDTH - 630];
  drawField(page, fonts, { x, y: row1, width: widths1[0] as number, height: 24, label: 'PROJECT NAME', value: header.projectName, valueSize: 6 });
  x += widths1[0] as number;
  drawField(page, fonts, { x, y: row1, width: widths1[1] as number, height: 24, label: 'PROJECT NO. or CONTRACT NO.', value: header.projectOrContractNo, valueSize: 6 });
  x += widths1[1] as number;
  drawField(page, fonts, {
    x,
    y: row1,
    width: widths1[2] as number,
    height: 24,
    label: 'PAYROLL NO.',
    value: header.payrollNumber === null ? 'PROVISIONAL' : String(header.payrollNumber),
    valueSize: 6,
  });
  x += widths1[2] as number;
  drawField(page, fonts, {
    x,
    y: row1,
    width: widths1[3] as number,
    height: 24,
    label: 'PRIME CONTRACTOR’S/SUBCONTRACTOR’S BUSINESS NAME',
    value: header.businessName,
    valueSize: 6,
  });
  sheet.y -= 26;

  const row2 = sheet.y - 24;
  x = MARGIN;
  const widths2 = [350, 200, CONTENT_WIDTH - 550];
  drawField(page, fonts, { x, y: row2, width: widths2[0] as number, height: 24, label: 'PROJECT LOCATION', value: header.projectLocation, valueSize: 6 });
  x += widths2[0] as number;
  drawField(page, fonts, { x, y: row2, width: widths2[1] as number, height: 24, label: 'WEEK ENDING DATE', value: header.weekEndingDate, valueSize: 6 });
  x += widths2[1] as number;
  drawField(page, fonts, {
    x,
    y: row2,
    width: widths2[2] as number,
    height: 24,
    label: 'CERTIFYING OFFICIAL’s NAME AND TITLE',
    value: [certifyingOfficial.name, certifyingOfficial.title].filter(Boolean).join(', '),
    valueSize: 6,
  });
  sheet.y -= 30;
}

function drawApprenticeshipBlock(sheet: Sheet): void {
  const rows = sheet.model.apprenticeshipPrograms;
  const printed = Math.max(APPRENTICESHIP_PRINTED_ROWS, rows.length);
  const rowH = 12;
  sheet.ensure(rowH * (printed + 1) + 6);
  const page = sheet.page;
  const fonts = sheet.fonts;
  const cols = [420, 120, CONTENT_WIDTH - 540];

  const headTop = sheet.y - rowH;
  drawRect(page, MARGIN, headTop, CONTENT_WIDTH, rowH, { fill: TINT, stroke: RULE });
  drawText(page, fonts, 'APPRENTICESHIP PROGRAM NAME', MARGIN + 3, headTop + 4, { size: 5, bold: true });
  drawText(page, fonts, 'OA / SAA', MARGIN + (cols[0] as number) + 3, headTop + 4, { size: 5, bold: true });
  drawText(
    page,
    fonts,
    'REGISTERED NAME OF LABOR CLASSIFICATION',
    MARGIN + (cols[0] as number) + (cols[1] as number) + 3,
    headTop + 4,
    { size: 5, bold: true },
  );
  sheet.y -= rowH;

  for (let i = 0; i < printed; i += 1) {
    const entry = rows[i];
    const top = sheet.y - rowH;
    drawRect(page, MARGIN, top, CONTENT_WIDTH, rowH, { stroke: RULE });
    drawLine(page, MARGIN + (cols[0] as number), top, MARGIN + (cols[0] as number), top + rowH, RULE);
    drawLine(
      page,
      MARGIN + (cols[0] as number) + (cols[1] as number),
      top,
      MARGIN + (cols[0] as number) + (cols[1] as number),
      top + rowH,
      RULE,
    );
    if (entry) drawText(page, fonts, entry.programName, MARGIN + 3, top + 4, { size: 5.5 });
    const boxX = MARGIN + (cols[0] as number) + 4;
    drawCheckbox(page, boxX, top + 3, entry?.registrar === 'OA', 5.5);
    drawText(page, fonts, 'OA', boxX + 8, top + 4, { size: 5 });
    drawCheckbox(page, boxX + 40, top + 3, entry?.registrar === 'SAA', 5.5);
    drawText(page, fonts, 'SAA', boxX + 48, top + 4, { size: 5 });
    if (entry) {
      drawText(
        page,
        fonts,
        entry.registeredClassification,
        MARGIN + (cols[0] as number) + (cols[1] as number) + 3,
        top + 4,
        { size: 5.5 },
      );
    }
    sheet.y -= rowH;
  }
  sheet.y -= 6;
}

function drawFringeBlock(sheet: Sheet, plans: FringeCreditLine[], rows: Wh347Row[]): void {
  const page = sheet.page;
  const fonts = sheet.fonts;
  const nameWidth = 130;
  const totalWidth = 54;
  const planWidth = (CONTENT_WIDTH - nameWidth - totalWidth) / PLAN_COLUMNS_PER_BLOCK;
  const headH = 34;
  const rowH = 12;

  sheet.ensure(headH + rowH * Math.max(rows.length, 1) + 6);

  const headTop = sheet.y - headH;
  drawRect(page, MARGIN, headTop, CONTENT_WIDTH, headH, { fill: TINT, stroke: RULE });
  drawText(page, fonts, 'NAME OF WORKER', MARGIN + 3, headTop + headH - 8, { size: 5, bold: true });
  drawText(page, fonts, 'TOTAL HOURLY CREDIT', MARGIN + CONTENT_WIDTH - totalWidth + 2, headTop + headH - 8, {
    size: 4,
    bold: true,
    width: totalWidth - 4,
    align: 'center',
  });

  for (let p = 0; p < PLAN_COLUMNS_PER_BLOCK; p += 1) {
    const x = MARGIN + nameWidth + p * planWidth;
    drawLine(page, x, headTop, x, headTop + headH, RULE);
    const plan = plans[p];
    const label = (text: string, value: string, line: number) =>
      drawText(page, fonts, `${text} ${value}`, x + 3, headTop + headH - 8 - line * 7, { size: 4.6 });
    label('FB NAME', plan?.planName ?? '', 0);
    label('FB TYPE', plan?.planType ?? '', 1);
    label('PLAN NO.', plan?.planNo ?? '', 2);
    drawCheckbox(page, x + 3, headTop + headH - 8 - 3 * 7 - 1, plan?.isFunded === true, 4.5);
    drawText(page, fonts, 'Funded', x + 9, headTop + headH - 8 - 3 * 7, { size: 4.6 });
    drawCheckbox(page, x + 38, headTop + headH - 8 - 3 * 7 - 1, plan !== undefined && !plan.isFunded, 4.5);
    drawText(page, fonts, 'Unfunded', x + 44, headTop + headH - 8 - 3 * 7, { size: 4.6 });
  }
  drawLine(page, MARGIN + CONTENT_WIDTH - totalWidth, headTop, MARGIN + CONTENT_WIDTH - totalWidth, headTop + headH, RULE);
  sheet.y -= headH;

  const printed = rows.length === 0 ? 1 : rows.length;
  for (let r = 0; r < printed; r += 1) {
    const row = rows[r];
    const top = sheet.y - rowH;
    drawRect(page, MARGIN, top, CONTENT_WIDTH, rowH, { stroke: RULE });
    if (row) drawText(page, fonts, displayName(row), MARGIN + 3, top + 4, { size: 5.2 });
    for (let p = 0; p < PLAN_COLUMNS_PER_BLOCK; p += 1) {
      const x = MARGIN + nameWidth + p * planWidth;
      drawLine(page, x, top, x, top + rowH, RULE);
      const plan = plans[p];
      const credit =
        row && plan
          ? row.fringeCredits.find(
              (c) => c.planName === plan.planName && c.planType === plan.planType && (c.planNo ?? '') === (plan.planNo ?? ''),
            )
          : undefined;
      drawText(page, fonts, `Hourly Credit $ ${credit ? formatMoney(credit.hourlyCredit) : ''}`, x + 3, top + 4, {
        size: 4.6,
      });
    }
    const totalX = MARGIN + CONTENT_WIDTH - totalWidth;
    drawLine(page, totalX, top, totalX, top + rowH, RULE);
    if (row) {
      drawText(page, fonts, `$${formatMoney(row.fringeCreditHourly)}`, totalX + 2, top + 4, {
        size: 5.2,
        width: totalWidth - 4,
        align: 'end',
      });
    }
    sheet.y -= rowH;
  }
  sheet.y -= 6;
}

function drawClosingBlock(sheet: Sheet): void {
  const { additionalRemarks, certifyingOfficial, certifiedAt } = sheet.model;
  const page = sheet.page;
  const fonts = sheet.fonts;

  const remarkLines = wrapText(additionalRemarks || '', CONTENT_WIDTH - 6, 6);
  const remarksH = Math.max(28, 14 + remarkLines.length * 8);
  sheet.ensure(remarksH + 34);

  const remarksTop = sheet.y - remarksH;
  drawRect(page, MARGIN, remarksTop, CONTENT_WIDTH, remarksH, { stroke: RULE });
  drawText(page, fonts, 'ADDITIONAL REMARKS', MARGIN + 3, remarksTop + remarksH - 7, { size: 5, bold: true });
  remarkLines.forEach((line, i) => {
    drawText(page, fonts, line, MARGIN + 3, remarksTop + remarksH - 16 - i * 8, { size: 6 });
  });
  sheet.y -= remarksH + 4;

  const rowH = 26;
  const top = sheet.y - rowH;
  const widths = [390, 130, 200, CONTENT_WIDTH - 720];
  let x = MARGIN;
  drawField(page, fonts, {
    x,
    y: top,
    width: widths[0] as number,
    height: rowH,
    label: 'SIGNATURE OF CERTIFYING OFFICIAL',
    value: certifyingOfficial.name ? `/s/ ${certifyingOfficial.name}` : '',
    valueSize: 7,
  });
  x += widths[0] as number;
  drawField(page, fonts, {
    x,
    y: top,
    width: widths[1] as number,
    height: rowH,
    label: 'DATE',
    value: certifiedAt.toISOString().slice(0, 10),
    valueSize: 6,
  });
  x += widths[1] as number;
  drawField(page, fonts, {
    x,
    y: top,
    width: widths[2] as number,
    height: rowH,
    label: 'TELEPHONE NUMBER',
    value: certifyingOfficial.phone,
    valueSize: 6,
  });
  x += widths[2] as number;
  drawField(page, fonts, {
    x,
    y: top,
    width: widths[3] as number,
    height: rowH,
    label: 'EMAIL ADDRESS',
    value: certifyingOfficial.email,
    valueSize: 6,
  });
  sheet.y -= rowH + 6;
}

function drawStatementPages(sheet: Sheet): void {
  const model = sheet.model;
  sheet.newPage();
  drawSocHeader(sheet);
  paragraph(sheet, SOC_PREAMBLE, { size: 6.5 });
  for (const certification of CERTIFICATIONS) paragraph(sheet, certification, { checkbox: true });

  paragraph(sheet, APPRENTICESHIP_ATTESTATION, { checkbox: true });
  drawApprenticeshipBlock(sheet);

  paragraph(sheet, FRINGE_ATTESTATION, { checkbox: true });
  paragraph(sheet, FRINGE_BLOCK_TITLE, { size: 7, bold: true });
  paragraph(sheet, FRINGE_BLOCK_INSTRUCTION, { size: 5.5 });

  const creditRows = rowsWithFringeCredit(model.rows);
  const plans = distinctPlans(creditRows);
  // A 7th plan, or a 9th worker, spills to a continuation block with the same
  // header — never silently dropped (WL-06 edge cases).
  const planBlocks = plans.length === 0 ? [[]] : chunk(plans, PLAN_COLUMNS_PER_BLOCK);
  for (const planBlock of planBlocks) {
    for (const rowBlock of chunk(creditRows, FRINGE_ROWS_PER_BLOCK)) {
      drawFringeBlock(sheet, planBlock, rowBlock);
    }
  }

  paragraph(sheet, NO_REBATES_ATTESTATION, { checkbox: true });
  drawClosingBlock(sheet);
  paragraph(sheet, FALSIFICATION_WARNING, { size: 5 });
}

// ---------------------------------------------------------------------------
// The two documents
// ---------------------------------------------------------------------------

export type RenderResult = { bytes: Uint8Array; pageCount: number };

/**
 * The WH-347 as filed: the payroll grid (with continuation pages of 8 rows)
 * followed by the Statement of Compliance.
 */
export async function renderWh347(model: Wh347Model): Promise<RenderResult> {
  const { pdf, fonts } = await createDeterministicDocument(model.certifiedAt);
  pdf.setTitle(`WH-347 · ${model.header.projectName} · week ending ${model.header.weekEndingDate}`);
  pdf.setSubject(
    `Certified payroll ${model.header.payrollNumber ?? 'provisional'} · ${model.provenance.wdNumber} mod ${model.provenance.modificationNumber}`,
  );
  const sheet = new Sheet(pdf, fonts, model, 'PAYROLL — U.S. DEPARTMENT OF LABOR (WH-347)');
  drawGridPages(sheet);
  drawStatementPages(sheet);
  sheet.finish();
  return { bytes: await serialise(pdf), pageCount: sheet.pages.length };
}

/**
 * The Statement of Compliance on its own — the document 29 CFR 5.5(a)(3)(ii)
 * calls "page 2 of the WH-347 or another document with identical wording", so
 * it can be sent, signed and retained separately.
 */
export async function renderStatementOfCompliance(model: Wh347Model): Promise<RenderResult> {
  const { pdf, fonts } = await createDeterministicDocument(model.certifiedAt);
  pdf.setTitle(
    `Statement of Compliance · ${model.header.projectName} · week ending ${model.header.weekEndingDate}`,
  );
  const sheet = new Sheet(pdf, fonts, model, 'STATEMENT OF COMPLIANCE (WH-347, page 2)');
  drawStatementPages(sheet);
  sheet.finish();
  return { bytes: await serialise(pdf), pageCount: sheet.pages.length };
}
