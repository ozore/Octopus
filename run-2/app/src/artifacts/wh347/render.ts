/**
 * THE WH-347 RENDERER — the artifact struct, composed into PDF bytes.
 *
 * AUTHORITY: `ARCHITECTURE.md` **ADR-008** (own geometry, no AcroForm, no headless
 * browser), §6.3 (the three statuses and the withheld signature block),
 * `DESIGN_SYSTEM.md` §8.8 (the sheet, the watermark, the band, the structurally
 * replaced signature block), §8.9 (the provenance footer, on every page),
 * `USER_JOURNEY.md` §7.3–§7.4, `ENGINE.md` §18.3.
 *
 * ===========================================================================
 * THE THREE STATUSES, RENDERED
 *
 *   CERTIFIABLE          the form, the six boxes marked, the signature block.
 *   CERTIFIABLE_DATED    IDENTICAL INK, except one footer sentence. The status
 *                        chip does not move, the rate does not move, the signature
 *                        block is still rendered. That is D7: an unresolved line
 *                        moves the status; a stale check moves a sentence.
 *   DRAFT_NOT_CERTIFIABLE  watermark on every page, a full-contrast band across the
 *                        top of every page, an extra footer line, the six boxes
 *                        rendered UNMARKED, and the signature block STRUCTURALLY
 *                        REPLACED by a double-ruled withheld box.
 *
 * The third one is where the care goes. `DESIGN_SYSTEM.md` §8.8.2: "a greyed-out
 * signature line photocopies into a signable signature line." So the withheld
 * rendering does not disable a signature line, hide one, or grey one out — there is
 * no line on the page to sign. A warning can be clicked past; a missing signature
 * block cannot.
 *
 * The checkbox marks are suppressed on a draft for the same reason and it is a
 * deliberate reading rather than an omission: box 3 IS certification (3), the very
 * claim an unresolved classification makes unsupportable. Rendering it marked on a
 * document we are telling the customer not to sign would put the assertion on the
 * paper and the refusal only in the ink around it. The boxes still render — the
 * artifact renders IN FULL, per P-B — they simply carry no marks, and the withheld
 * block says so in words.
 *
 * ===========================================================================
 * WHAT THIS FILE MAY NOT DO
 *
 * It may not compute a number, derive a status, or author a refusal. Every string
 * it prints arrives on the struct or comes from `formtext.ts` with a citation
 * attached. There is no support address, no contact affordance and no escalation
 * path anywhere in it (A3), and there is no field on any input in which one could
 * travel.
 */

import type { Wh347Layout } from '@/lib/types';

import { measureText, truncateToWidth, wrapToWidth, type FontId } from '../pdf/font';
import { PdfPage, rgb, serializePdf, type Rgb } from '../pdf/writer';
import type { FooterLine } from '../provenance';
import { BOUNDARY_STATEMENT_FULL } from '../provenance';
import {
  COMPLIANCE_BOXES,
  CONTINUATION_NOTE,
  EXCEPTIONS_LABEL,
  FALSIFICATION_WARNING,
  FORM_AGENCY,
  FORM_SUBTITLE,
  FORM_TITLE,
  PERSONS_STATEMENT,
  REMARKS_LABEL,
  SIGNATURE_LABEL,
  SIGNATURE_NAME_LABEL,
  SIGNATURE_NOTE,
  STATEMENT_DATE_LABEL,
  STATEMENT_DO_HEREBY_STATE,
  STATEMENT_OPENING,
  STATEMENT_SIGNATORY_HINT,
  STATEMENT_TITLE,
  STATEMENT_TITLE_HINT,
  SUB_ROW_LABELS,
  WATERMARK_TEXT,
  WITHHELD_BODY,
  WITHHELD_HEADLINE,
  bandText,
} from './formtext';
import {
  DATED,
  DRAFT,
  INK,
  INK_2,
  INK_3,
  PAPER,
  RULE,
  RULE_HAIR,
  SUNKEN,
  WATERMARK,
  WH347_GEOMETRY,
  columnBoxes,
  lineHeight,
  rowsPerPage,
  type ColumnBox,
  type LayoutGeometry,
} from './geometry';
import type { Wh347Artifact, Wh347DeductionCell, Wh347LineRow, Wh347WorkerBlock } from './model';

// ===========================================================================
// Colours, resolved once
// ===========================================================================

const C_INK = rgb(INK);
const C_INK_2 = rgb(INK_2);
const C_INK_3 = rgb(INK_3);
const C_RULE = rgb(RULE);
const C_HAIR = rgb(RULE_HAIR);
const C_SUNKEN = rgb(SUNKEN);
const C_DRAFT = rgb(DRAFT);
const C_DATED = rgb(DATED);
const C_PAPER = rgb(PAPER);
const C_WATERMARK = rgb(WATERMARK);

const CELL_PAD = 1.5;

/** Baseline for text vertically centred in a box of `height` starting at `top`.
 *  0.36em is half of Helvetica's cap height, which is what the eye centres on. */
function centreBaseline(page: PdfPage, top: number, height: number, size: number): number {
  return page.fromTop(top + height / 2 + size * 0.36);
}

function baselineAt(page: PdfPage, top: number, size: number): number {
  return page.fromTop(top + size * 0.86);
}

/**
 * Shrink a column-head label until its LONGEST WORD fits the column.
 *
 * A government form's column heads are long words in narrow columns —
 * `WITHHOLDING TAX` over 31 points — and the greedy wrapper's fallback is to break
 * the word, which produced `WITHHOLDI` / `NG TAX` on an early render. Breaking a
 * word in a form's own column head is worse than setting it a point smaller: the
 * reader has to reassemble a label they are using to identify a money column.
 */
function fitSize(text: string, font: FontId, maxWidth: number, preferred: number, min = 3.4): number {
  const longest = text
    .split(/[\s\n]+/)
    .reduce((widest, word) => (measureText(word, font, 1) > measureText(widest, font, 1) ? word : widest), '');
  if (longest === '') return preferred;
  const unitWidth = measureText(longest, font, 1);
  if (unitWidth === 0) return preferred;
  const fits = maxWidth / unitWidth;
  return Math.max(min, Math.min(preferred, Math.floor(fits * 10) / 10));
}

// ===========================================================================
// Page furniture
// ===========================================================================

/**
 * The watermark. Repeated, rotated −24°, drawn FIRST so every glyph on the page
 * sits at full contrast over one of exactly two known backdrops (`DESIGN_SYSTEM.md`
 * §4.6). The colour is the certified light-print composite, so no transparency
 * group is needed and the result is the value the contrast table was computed on.
 */
function drawWatermark(page: PdfPage, geometry: LayoutGeometry): void {
  const size = geometry.type.watermark;
  const width = measureText(WATERMARK_TEXT, 'HB', size);
  const stepY = 150;
  const stepX = width * 0.55;
  for (let row = 0; row < 5; row += 1) {
    const y = 60 + row * stepY;
    for (let column = -1; column < 3; column += 1) {
      const x = 20 + column * (stepX + 120);
      if (x > geometry.page.width) continue;
      page.text(x, y, WATERMARK_TEXT, {
        font: 'HB',
        size,
        color: C_WATERMARK,
        rotate: -24,
        charSpace: 1.5,
      });
    }
  }
}

/** The full-contrast band. This is what a screen reader gets, once, and what a
 *  reader at arm's length sees before anything else. */
function drawBand(page: PdfPage, geometry: LayoutGeometry, top: number, artifact: Wh347Artifact): number {
  const { grid, bandHeight, bandGap, type } = geometry;
  page.rect(grid.left, page.fromTop(top + bandHeight), grid.width, bandHeight, { fill: C_DRAFT });
  page.text(grid.left + grid.width / 2, centreBaseline(page, top, bandHeight, type.band), bandText(artifact.unresolvedLineCount), {
    font: 'HB',
    size: type.band,
    color: C_PAPER,
    align: 'center',
    charSpace: 0.4,
  });
  return top + bandHeight + bandGap;
}

function drawFormHeader(
  page: PdfPage,
  geometry: LayoutGeometry,
  artifact: Wh347Artifact,
  top: number,
  pageNumber: number,
  pageCount: number,
): number {
  const { grid, type } = geometry;
  const right = grid.left + grid.width;

  // -- Title band ---------------------------------------------------------
  page.text(grid.left, baselineAt(page, top + 2, type.formTitle), FORM_TITLE, {
    font: 'HB',
    size: type.formTitle,
    color: C_INK,
    charSpace: 1.2,
  });
  page.text(grid.left, baselineAt(page, top + 14, type.formSubtitle), FORM_AGENCY, {
    size: type.formSubtitle,
    color: C_INK_2,
  });
  page.text(grid.left, baselineAt(page, top + 21, type.formSubtitle), FORM_SUBTITLE, {
    size: type.formSubtitle,
    color: C_INK_3,
  });

  page.text(right, baselineAt(page, top + 2, type.formSubtitle), artifact.ombLabel, {
    size: type.formSubtitle,
    color: C_INK_2,
    align: 'right',
    font: 'C',
  });
  page.text(right, baselineAt(page, top + 10, type.formSubtitle), artifact.formRevisionLabel, {
    size: type.formSubtitle,
    color: C_INK_2,
    align: 'right',
  });
  page.text(right, baselineAt(page, top + 18, type.formSubtitle), `Page ${pageNumber} of ${pageCount}`, {
    size: type.formSubtitle,
    color: C_INK_3,
    align: 'right',
    font: 'C',
  });

  // -- Field rows ---------------------------------------------------------
  const rowTops = [top + 28, top + 28 + geometry.headerRowHeight];
  const values = headerValues(artifact);

  for (const row of [0, 1] as const) {
    const fields = geometry.headerFields.filter((field) => field.row === row);
    if (fields.length === 0) continue;
    const rowTop = rowTops[row] ?? top;
    let x = grid.left;
    const totalFraction = fields.reduce((sum, field) => sum + field.widthFraction, 0);
    fields.forEach((field, index) => {
      const width =
        index === fields.length - 1
          ? grid.left + grid.width - x
          : (field.widthFraction / totalFraction) * grid.width;
      page.rect(x, page.fromTop(rowTop + geometry.headerRowHeight), width, geometry.headerRowHeight, {
        stroke: C_RULE,
        lineWidth: 0.5,
      });
      page.text(x + CELL_PAD + 1, baselineAt(page, rowTop + 2.5, type.fieldLabel), field.label, {
        size: type.fieldLabel,
        color: C_INK_3,
        charSpace: 0.3,
      });
      const value = values[field.id] ?? '';
      const numeric =
        field.id === 'forWeekEnding' ||
        field.id === 'payrollNumber' ||
        field.id === 'projectOrContractNumber' ||
        field.id === 'wageDeterminationNumber';
      const font: FontId = numeric ? 'C' : 'H';
      const size = numeric ? type.fieldValue - 0.8 : type.fieldValue;
      page.text(
        x + CELL_PAD + 1,
        baselineAt(page, rowTop + 12, size),
        truncateToWidth(value, font, size, width - 2 * CELL_PAD - 2),
        { size, color: C_INK, font },
      );
      x += width;
    });
  }

  return top + geometry.headerHeight;
}

function headerValues(artifact: Wh347Artifact): Readonly<Record<string, string>> {
  const header = artifact.header;
  return {
    contractorName: header.contractorName,
    contractorAddress: header.contractorAddress,
    payrollNumber: header.payrollNumber,
    forWeekEnding: String(header.forWeekEnding),
    projectAndLocation: header.projectAndLocation,
    projectOrContractNumber: header.projectOrContractNumber,
    wageDeterminationNumber: header.wageDeterminationNumber,
    finalPayroll: header.isFinalPayroll ? 'YES' : 'NO',
  };
}

// ===========================================================================
// The column head
// ===========================================================================

function drawColumnHead(
  page: PdfPage,
  geometry: LayoutGeometry,
  artifact: Wh347Artifact,
  top: number,
  boxes: readonly ColumnBox[],
): number {
  const height = geometry.columnHeadHeight;
  const groupHeight = geometry.columnHeadGroupHeight;
  const size = geometry.type.columnHead;

  page.rect(geometry.grid.left, page.fromTop(top + height), geometry.grid.width, height, {
    fill: C_SUNKEN,
    stroke: C_RULE,
    lineWidth: 0.7,
  });

  const days = artifact.workers[0]?.lines[0]?.col4Days ?? [];

  for (const box of boxes) {
    if (box.x > geometry.grid.left) {
      page.line(box.x, page.fromTop(top + height), box.x, page.fromTop(top), 0.5, C_RULE);
    }

    const spec = box.spec;
    if (spec.scope === 'days' || spec.scope === 'deductions') {
      const groupLabel = spec.heading[0] ?? '';
      page.text(box.x + box.width / 2, centreBaseline(page, top, groupHeight, size + 0.4), groupLabel, {
        font: 'HB',
        size: size + 0.4,
        color: C_INK,
        align: 'center',
        charSpace: 0.2,
      });
      page.line(box.x, page.fromTop(top + groupHeight), box.x + box.width, page.fromTop(top + groupHeight), 0.4, C_RULE);

      const subTop = top + groupHeight;
      const subHeight = height - groupHeight;
      const subs =
        spec.scope === 'days'
          ? days.map((day) => ({ label: day.dayLabel, second: String(day.date).slice(5), width: box.width / 7 }))
          : (spec.subColumns ?? []).map((sub) => ({ label: sub.label, second: '', width: sub.width }));

      let subX = box.x;
      for (const sub of subs) {
        if (subX > box.x) {
          page.line(subX, page.fromTop(subTop + subHeight), subX, page.fromTop(subTop), 0.3, C_HAIR);
        }
        const labelSize = fitSize(sub.label, 'HB', sub.width - 2, size);
        const lines = wrapToWidth(sub.label, 'HB', labelSize, sub.width - 2);
        const stack = sub.second === '' ? lines : [...lines, sub.second];
        const startTop = subTop + Math.max(1, (subHeight - stack.length * (labelSize + 1)) / 2);
        stack.forEach((text, index) => {
          page.text(subX + sub.width / 2, baselineAt(page, startTop + index * (labelSize + 1), labelSize), text, {
            font: index < lines.length ? 'HB' : 'C',
            size: labelSize,
            color: index < lines.length ? C_INK : C_INK_3,
            align: 'center',
          });
        });
        subX += sub.width;
      }
      continue;
    }

    const headSize = fitSize(spec.heading.join(' '), 'HB', box.width - 2, size);
    const stack = spec.heading.flatMap((headline) => wrapToWidth(headline, 'HB', headSize, box.width - 2));
    const startTop = top + Math.max(1, (height - stack.length * (headSize + 1.4)) / 2);
    stack.forEach((text, index) => {
      page.text(box.x + box.width / 2, baselineAt(page, startTop + index * (headSize + 1.4), headSize), text, {
        font: 'HB',
        size: headSize,
        color: C_INK,
        align: 'center',
      });
    });
  }

  return top + height;
}

// ===========================================================================
// The grid
// ===========================================================================

interface GridRow {
  readonly worker: Wh347WorkerBlock;
  readonly workerIndex: number;
  readonly line: Wh347LineRow;
  readonly lineIndex: number;
  readonly firstRowOfWorkerOnPage: boolean;
}

/**
 * Pack worker blocks into pages.
 *
 * A worker's classification lines stay together when they fit, because a reader
 * comparing 7A against the lines that produced it should not have to turn a page to
 * do it. A worker with more lines than a page holds is split — and the continuation
 * repeats the name, marked, so no row on page two is anonymous.
 */
function paginate(artifact: Wh347Artifact, capacity: number): readonly (readonly GridRow[])[] {
  const pages: GridRow[][] = [];
  let current: GridRow[] = [];

  const flush = (): void => {
    if (current.length > 0) pages.push(current);
    current = [];
  };

  artifact.workers.forEach((worker, workerIndex) => {
    const lines = worker.lines;
    if (lines.length === 0) return;
    if (current.length > 0 && current.length + lines.length > capacity && lines.length <= capacity) {
      flush();
    }
    lines.forEach((line, lineIndex) => {
      if (current.length >= capacity) flush();
      current.push({
        worker,
        workerIndex,
        line,
        lineIndex,
        firstRowOfWorkerOnPage: current.length === 0 || current[current.length - 1]?.workerIndex !== workerIndex,
      });
    });
  });

  flush();
  return pages.length > 0 ? pages : [[]];
}

function drawGrid(
  page: PdfPage,
  geometry: LayoutGeometry,
  rows: readonly GridRow[],
  top: number,
  bottom: number,
  boxes: readonly ColumnBox[],
): void {
  const rowHeight = lineHeight(geometry);
  const subHeight = geometry.subRowHeight;

  page.rect(geometry.grid.left, page.fromTop(bottom), geometry.grid.width, bottom - top, {
    stroke: C_RULE,
    lineWidth: 0.7,
  });

  for (const box of boxes) {
    if (box.x > geometry.grid.left) {
      page.line(box.x, page.fromTop(bottom), box.x, page.fromTop(top), 0.5, C_RULE);
    }
    if (box.spec.scope === 'days') {
      const dayWidth = box.width / 7;
      for (let day = 1; day < 7; day += 1) {
        const x = box.x + day * dayWidth;
        page.line(x, page.fromTop(bottom), x, page.fromTop(top), 0.3, C_HAIR);
      }
    }
    if (box.spec.subColumns) {
      let x = box.x;
      for (const sub of box.spec.subColumns.slice(0, -1)) {
        x += sub.width;
        page.line(x, page.fromTop(bottom), x, page.fromTop(top), 0.3, C_HAIR);
      }
    }
  }

  rows.forEach((row, index) => {
    const rowTop = top + index * rowHeight;
    if (rowTop + rowHeight > bottom + 0.01) return;

    // A worker boundary is a full-weight rule; a line boundary inside one worker is
    // a hairline. The reader can see where a person's week starts without reading.
    const boundaryWeight = row.lineIndex === 0 ? 0.7 : 0.3;
    if (index > 0) {
      page.line(
        geometry.grid.left,
        page.fromTop(rowTop),
        geometry.grid.left + geometry.grid.width,
        page.fromTop(rowTop),
        boundaryWeight,
        row.lineIndex === 0 ? C_RULE : C_HAIR,
      );
    }

    for (let sub = 1; sub < geometry.subRowsPerLine; sub += 1) {
      const y = page.fromTop(rowTop + sub * subHeight);
      page.line(geometry.grid.left, y, geometry.grid.left + geometry.grid.width, y, 0.2, C_HAIR);
    }

    drawRow(page, geometry, row, rowTop, boxes);
  });
}

function drawRow(
  page: PdfPage,
  geometry: LayoutGeometry,
  row: GridRow,
  rowTop: number,
  boxes: readonly ColumnBox[],
): void {
  const size = geometry.type.cell;
  const money = geometry.type.money;
  const subHeight = geometry.subRowHeight;
  const { worker, line } = row;
  const showWorkerMoney = row.lineIndex === 0;
  const showWorkerName = row.lineIndex === 0 || row.firstRowOfWorkerOnPage;
  const blockedColor = line.blocked ? C_DRAFT : C_INK;

  const cellText = (
    box: ColumnBox,
    text: string,
    subRow: number,
    options: { font?: FontId; size?: number; color?: Rgb } = {},
  ): void => {
    if (text === '') return;
    const font = options.font ?? 'C';
    const fontSize = options.size ?? size;
    const color = options.color ?? C_INK;
    const inner = box.width - 2 * CELL_PAD;
    const value = truncateToWidth(text, font, fontSize, inner);
    const align = box.spec.align;
    const x =
      align === 'right' ? box.x + box.width - CELL_PAD : align === 'center' ? box.x + box.width / 2 : box.x + CELL_PAD;
    page.text(x, centreBaseline(page, rowTop + subRow * subHeight, subHeight, fontSize), value, {
      font,
      size: fontSize,
      color,
      align,
    });
  };

  for (const box of boxes) {
    const id = box.spec.id;

    switch (id) {
      case '1A':
        if (showWorkerMoney) cellText(box, worker.entryNumber, 0);
        break;
      case '1B':
        if (showWorkerName) {
          cellText(box, worker.lastName, 0, { font: 'H' });
          if (row.lineIndex !== 0) cellText(box, CONTINUATION_NOTE, 1, { font: 'H', size: size - 1, color: C_INK_3 });
        }
        break;
      case '1C':
        if (showWorkerName) cellText(box, worker.firstName, 0, { font: 'H' });
        break;
      case '1D':
        if (showWorkerName) cellText(box, worker.middleInitial, 0, { font: 'H' });
        break;
      case '1E':
        if (showWorkerName) cellText(box, worker.identifyingNumber ?? '', 0);
        break;
      case '1':
        if (showWorkerName) {
          const name = [worker.lastName, worker.firstName, worker.middleInitial].filter((part) => part !== '').join(', ');
          cellText(box, name, 0, { font: 'H' });
          cellText(box, worker.identifyingNumber === null ? '' : `Ident. no. ${worker.identifyingNumber}`, 1, {
            size: size - 0.5,
            color: C_INK_2,
          });
        }
        break;
      case '2':
        if (showWorkerName) {
          cellText(box, `(${worker.col2Status})`, 0, { font: 'HB', size: size - 0.5 });
          // The level of progression is part of what column 2 asks for on the
          // revised form, so it is set small enough to fit rather than clipped.
          cellText(box, worker.col2LevelOfProgression ?? '', 1, { font: 'H', size: size - 1.5, color: C_INK_2 });
        }
        break;
      case '2X':
        if (showWorkerName) cellText(box, worker.numWithholdingExemptions ?? '', 0);
        break;
      case '3': {
        const inner = box.width - 2 * CELL_PAD;
        const wrapped = wrapToWidth(line.col3Classification, 'H', size - 0.5, inner).slice(
          0,
          geometry.subRowsPerLine,
        );
        wrapped.forEach((text, index) => {
          page.text(
            box.x + CELL_PAD,
            centreBaseline(page, rowTop + index * subHeight, subHeight, size - 0.5),
            text,
            { font: 'H', size: size - 0.5, color: blockedColor },
          );
        });
        break;
      }
      case 'SOD':
        SUB_ROW_LABELS.slice(0, geometry.subRowsPerLine).forEach((label, index) => {
          cellText(box, label, index, { font: 'HB', size: size - 1, color: C_INK_3 });
        });
        break;
      case '4': {
        const dayWidth = box.width / 7;
        line.col4Days.forEach((day, index) => {
          const cellX = box.x + index * dayWidth + dayWidth - CELL_PAD;
          const values = [day.st, day.ot, day.dt];
          values.slice(0, geometry.subRowsPerLine).forEach((value, sub) => {
            if (value === '') return;
            page.text(cellX, centreBaseline(page, rowTop + sub * subHeight, subHeight, size), value, {
              font: 'C',
              size,
              color: C_INK,
              align: 'right',
            });
          });
        });
        break;
      }
      case '5':
        cellText(box, line.col5TotalHours, 0, { font: 'C' });
        break;
      case '6A':
      case '6':
        cellText(box, line.col6AStraightTime, 0);
        cellText(box, line.col6AOvertime ?? '', 1);
        // The double-time sub-row of column 6A is deliberately blank: WHD's column
        // 6A has a straight-time row and an overtime row, and inventing a third
        // rate row would be adding a field to a federal form.
        break;
      case '6B':
        // WEEKLY TOTAL — employer contributions × ALL hours worked, narrowed once
        // at N1. Not an hourly figure.
        cellText(box, line.col6BFringeCredit, 0);
        break;
      case '6C':
        // WEEKLY TOTAL — cash in lieu × ALL hours (N2). A disclosure of dollars
        // already inside 7A, never an addend to it.
        cellText(box, line.col6CInLieu, 0);
        break;
      case '7A':
        if (showWorkerMoney) cellText(box, worker.col7AGross, 0, { size: money });
        break;
      case '7B':
        if (showWorkerMoney) cellText(box, worker.col7BAllWork, 0, { size: money });
        break;
      case '7':
        if (showWorkerMoney) {
          cellText(box, worker.col7AGross, 0, { size: money });
          cellText(box, worker.col7BAllWork, 1, { size: money, color: C_INK_2 });
        }
        break;
      case '8':
        if (showWorkerMoney) drawDeductions(page, geometry, box, worker.col8Deductions, rowTop);
        break;
      case '9':
        if (showWorkerMoney) {
          cellText(box, worker.col9NetPaid, 0, { size: money });
          if (worker.netMismatch !== null) {
            cellText(box, worker.netMismatch, 1, { size: money - 1.2, color: C_DRAFT });
          }
        }
        break;
      default:
        break;
    }
  }
}

function drawDeductions(
  page: PdfPage,
  geometry: LayoutGeometry,
  box: ColumnBox,
  cell: Wh347DeductionCell,
  rowTop: number,
): void {
  const subs = box.spec.subColumns ?? [];
  const size = geometry.type.money;
  const subHeight = geometry.subRowHeight;
  // Four money figures, one per sub-column, nothing else. The 29 CFR 3.5
  // itemisation behind OTHER is printed on the statement page, where a paragraph
  // letter has room to be read.
  const values: readonly (string | null)[] = [
    cell.fica,
    cell.withholdingTax,
    cell.otherTotal,
    cell.total,
  ];
  let x = box.x;
  subs.forEach((sub, index) => {
    const value = values[index] ?? null;
    if (value !== null) {
      page.text(x + sub.width - CELL_PAD, centreBaseline(page, rowTop, subHeight, size), value, {
        font: 'C',
        size,
        color: index === 3 ? C_INK : C_INK_2,
        align: 'right',
      });
    }
    x += sub.width;
  });
  // The reader is told where the breakdown is, rather than being left to wonder
  // whether the OTHER figure is a bucket or a sweep.
  if (cell.other.length > 0) {
    page.text(
      box.x + CELL_PAD,
      centreBaseline(page, rowTop + subHeight, subHeight, size - 1.5),
      'Itemised by 29 CFR 3.5 category on page 2',
      { font: 'H', size: size - 1.5, color: C_INK_3 },
    );
  }
}

// ===========================================================================
// The provenance footer — every page, no exceptions, no print override
// ===========================================================================

function footerColour(line: FooterLine): Rgb {
  switch (line.emphasis) {
    case 'dated':
      return C_DATED;
    case 'draft':
      return C_DRAFT;
    case 'ink':
      return C_INK;
  }
}

function drawFooter(page: PdfPage, geometry: LayoutGeometry, artifact: Wh347Artifact): void {
  const bottom = geometry.page.height - geometry.margin.bottom;
  const top = bottom - geometry.footerHeight;
  const size = geometry.type.footer;

  page.line(
    geometry.grid.left,
    page.fromTop(top),
    geometry.grid.left + geometry.grid.width,
    page.fromTop(top),
    2,
    C_INK,
  );

  // The footer is the one component with no print override (`DESIGN_SYSTEM.md`
  // §8.9), so it may not be truncated and may not run off the sheet. Count the
  // wrapped lines first and tighten the leading if a long build string or a
  // wrapped block-reason list needs the room. Leading gives; content does not.
  const rendered = artifact.footer.map((line) => {
    const fontSize = line.id === 'boundary' ? geometry.type.boundary : size;
    const font: FontId = line.emphasis === 'draft' ? 'HB' : line.numeric ? 'C' : 'H';
    return { line, font, fontSize, texts: wrapToWidth(line.text, font, fontSize, geometry.grid.width) };
  });
  const totalLines = rendered.reduce((count, entry) => count + entry.texts.length, 0);
  const leading = Math.min(size + 1.4, (geometry.footerHeight - 8) / Math.max(1, totalLines));

  let y = top + 5;
  for (const { line, font, fontSize, texts } of rendered) {
    for (const text of texts) {
      page.text(geometry.grid.left, baselineAt(page, y, fontSize), text, {
        font,
        size: fontSize,
        color: footerColour(line),
      });
      y += leading;
    }
  }
}

// ===========================================================================
// Page 2 — the statement of compliance
// ===========================================================================

function drawStatementPage(geometry: LayoutGeometry, artifact: Wh347Artifact): PdfPage {
  const page = new PdfPage(geometry.page.width, geometry.page.height);
  const isDraft = artifact.status === 'DRAFT_NOT_CERTIFIABLE';
  if (isDraft) drawWatermark(page, geometry);

  let top = geometry.margin.top;
  if (isDraft) top = drawBand(page, geometry, top, artifact);

  const { grid } = geometry;
  const right = grid.left + grid.width;
  const gutter = 18;
  const columnWidth = (grid.width - gutter) / 2;
  const leftX = grid.left;
  const rightX = grid.left + columnWidth + gutter;

  page.text(leftX, baselineAt(page, top, 11), STATEMENT_TITLE, {
    font: 'HB',
    size: 11,
    color: C_INK,
    charSpace: 1,
  });
  page.text(right, baselineAt(page, top + 1, 6), artifact.ombLabel, {
    size: 6,
    color: C_INK_2,
    align: 'right',
    font: 'C',
  });
  top += 16;
  page.line(grid.left, page.fromTop(top), right, page.fromTop(top), 1.2, C_INK);
  top += 10;

  // -- The "I, ___ do hereby state" line ----------------------------------
  const soc = artifact.statementOfCompliance;
  page.text(leftX, baselineAt(page, top, 7.5), STATEMENT_DATE_LABEL, { size: 6, color: C_INK_3 });
  page.text(leftX + 26, baselineAt(page, top, 7.5), String(artifact.header.forWeekEnding), {
    size: 7.5,
    color: C_INK,
    font: 'C',
  });
  top += 12;

  const stateLine = `${STATEMENT_OPENING} ${soc.signatoryName} ${STATEMENT_SIGNATORY_HINT}, ${soc.signatoryTitle} ${STATEMENT_TITLE_HINT}, ${STATEMENT_DO_HEREBY_STATE}`;
  for (const text of wrapToWidth(stateLine, 'H', 7.5, grid.width)) {
    page.text(leftX, baselineAt(page, top, 7.5), text, { size: 7.5, color: C_INK });
    top += 10;
  }
  top += 4;

  // -- The six boxes ------------------------------------------------------
  const boxSize = 7;
  const boxLeading = 8.2;
  const marks: Readonly<Record<number, boolean>> = {
    1: soc.boxes.box1,
    2: soc.boxes.box2,
    3: soc.boxes.box3,
    4: soc.boxes.box4,
    5: soc.boxes.box5,
    6: soc.boxes.box6,
  };

  let columnTop = top;
  let secondColumnTop = top;
  for (const box of COMPLIANCE_BOXES) {
    const inFirstColumn = box.number <= 3;
    const x = inFirstColumn ? leftX : rightX;
    let y = inFirstColumn ? columnTop : secondColumnTop;

    const glyphSize = 8;
    page.rect(x, page.fromTop(y + glyphSize), glyphSize, glyphSize, { stroke: C_INK, lineWidth: 0.7 });
    // Marks are suppressed on a draft: box 3 IS the certification an unresolved
    // classification makes unsupportable, and a marked box on an unsigned page is
    // the assertion without the signature.
    if (marks[box.number] === true && !isDraft) {
      page.text(x + glyphSize / 2, page.fromTop(y + glyphSize - 1.6), 'X', {
        font: 'HB',
        size: 7,
        color: C_INK,
        align: 'center',
      });
    }
    page.text(x + glyphSize + 4, baselineAt(page, y, boxSize), `${box.number}`, {
      font: 'HB',
      size: boxSize,
      color: C_INK,
    });

    const textX = x + glyphSize + 14;
    const textWidth = columnWidth - (glyphSize + 14);
    for (const text of wrapToWidth(box.text, 'H', boxSize - 0.5, textWidth)) {
      page.text(textX, baselineAt(page, y, boxSize - 0.5), text, {
        size: boxSize - 0.5,
        color: C_INK,
      });
      y += boxLeading;
    }
    y += 5;

    if (inFirstColumn) columnTop = y;
    else secondColumnTop = y;
  }

  if (soc.apprenticeshipPrograms.length > 0) {
    // WHD's instruction for box 4: each registered program is NAMED.
    page.text(rightX, baselineAt(page, secondColumnTop, 6), 'REGISTERED APPRENTICESHIP PROGRAMS', {
      font: 'HB',
      size: 6,
      color: C_INK_3,
      charSpace: 0.3,
    });
    secondColumnTop += 9;
    for (const program of soc.apprenticeshipPrograms) {
      for (const text of wrapToWidth(`· ${program}`, 'H', 6.5, columnWidth)) {
        page.text(rightX, baselineAt(page, secondColumnTop, 6.5), text, { size: 6.5, color: C_INK });
        secondColumnTop += 8;
      }
    }
    secondColumnTop += 4;
  }

  // -- Column 8, itemised by 29 CFR 3.5 category ---------------------------
  const itemised = artifact.workers.filter((worker) => worker.col8Deductions.other.length > 0);
  if (itemised.length > 0) {
    page.text(rightX, baselineAt(page, secondColumnTop, 6), 'COLUMN 8 — DEDUCTIONS BY 29 CFR 3.5 CATEGORY', {
      font: 'HB',
      size: 6,
      color: C_INK_3,
      charSpace: 0.3,
    });
    secondColumnTop += 9;
    for (const worker of itemised) {
      const entries = worker.col8Deductions.other
        .map((entry) => `${entry.label} ${entry.amount}`)
        .join(';  ');
      const label = `${worker.entryNumber}. ${worker.lastName}, ${worker.firstName} — ${entries}`;
      for (const text of wrapToWidth(label, 'H', 6, columnWidth)) {
        page.text(rightX, baselineAt(page, secondColumnTop, 6), text, { size: 6, color: C_INK });
        secondColumnTop += 7.4;
      }
    }
    secondColumnTop += 4;
  }

  // -- The legacy layout has no 6B/6C, so the credit is disclosed here ------
  //
  // The pre-revision form carries ONE rate column. Folding an hourly fringe credit
  // into it would produce a rate the contractor never paid in cash, and dropping
  // the credit would remove the thing the payment method turns on (29 CFR 5.31(b)
  // gives three ways to discharge the obligation and the form has to show which).
  // So the figures are disclosed here verbatim, labelled with the columns they
  // would occupy on the revised layout.
  if (artifact.layout === 'wh347_legacy') {
    const credits = artifact.workers.flatMap((worker) =>
      worker.lines
        .filter((line) => line.col6BFringeCredit !== '0.00' || line.col6CInLieu !== '0.00')
        .map(
          (line) =>
            `${worker.entryNumber}. ${worker.lastName}, ${worker.firstName} — ${line.col3Classification || 'unresolved line'}: ` +
            `fringe benefit credit ${line.col6BFringeCredit}, cash paid in lieu of fringe benefits ${line.col6CInLieu}, for the workweek`,
        ),
    );
    if (credits.length > 0) {
      page.text(
        rightX,
        baselineAt(page, secondColumnTop, 6),
        'FRINGE BENEFIT CREDIT AND CASH IN LIEU — WEEKLY TOTALS',
        { font: 'HB', size: 6, color: C_INK_3, charSpace: 0.3 },
      );
      secondColumnTop += 9;
      page.text(
        rightX,
        baselineAt(page, secondColumnTop, 5.5),
        'This layout has no column 6B or 6C; the Rev. January 2025 form does. Figures are as asserted by the contractor.',
        { size: 5.5, color: C_INK_3 },
      );
      secondColumnTop += 8;
      for (const credit of credits) {
        for (const text of wrapToWidth(credit, 'H', 6, columnWidth)) {
          page.text(rightX, baselineAt(page, secondColumnTop, 6), text, { size: 6, color: C_INK });
          secondColumnTop += 7.4;
        }
      }
      secondColumnTop += 4;
    }
  }

  // -- Remarks and the exception report -----------------------------------
  let remarksTop = Math.max(columnTop, secondColumnTop) + 2;
  const signatureTop = geometry.page.height - geometry.margin.bottom - geometry.footerHeight - 84;
  // The DO-NOT-ASSERT list (ARCHITECTURE §11.7 / USER_JOURNEY §7.4) rendered as
  // copy, once per artifact, immediately above whatever occupies the signature
  // area — so it is the last thing read before the block that is or is not there.
  const boundaryTop = signatureTop - 20;

  page.text(leftX, baselineAt(page, remarksTop, 6), REMARKS_LABEL, {
    font: 'HB',
    size: 6,
    color: C_INK_3,
    charSpace: 0.4,
  });
  remarksTop += 9;
  if (soc.remarks !== '') {
    for (const text of wrapToWidth(soc.remarks, 'H', 6.5, grid.width)) {
      if (remarksTop > boundaryTop - 10) break;
      page.text(leftX, baselineAt(page, remarksTop, 6.5), text, { size: 6.5, color: C_INK });
      remarksTop += 8;
    }
  }

  if (soc.exceptions.length > 0) {
    page.text(leftX, baselineAt(page, remarksTop, 6), EXCEPTIONS_LABEL, {
      font: 'HB',
      size: 6,
      color: C_INK_3,
      charSpace: 0.4,
    });
    remarksTop += 9;
    let shown = 0;
    for (const exception of soc.exceptions) {
      const wrapped = wrapToWidth(`· ${exception}`, 'H', 6, grid.width);
      if (remarksTop + wrapped.length * 7.2 > boundaryTop - 12) break;
      for (const text of wrapped) {
        page.text(leftX, baselineAt(page, remarksTop, 6), text, { size: 6, color: C_INK_2 });
        remarksTop += 7.2;
      }
      shown += 1;
    }
    if (shown < soc.exceptions.length) {
      page.text(
        leftX,
        baselineAt(page, remarksTop, 6),
        `· and ${soc.exceptions.length - shown} more on the attached exception report.`,
        { size: 6, color: C_INK_2 },
      );
    }
  }

  // -- The boundary statement, in full, every artifact ---------------------
  let boundaryY = boundaryTop;
  for (const text of wrapToWidth(BOUNDARY_STATEMENT_FULL, 'H', 6, grid.width)) {
    page.text(leftX, baselineAt(page, boundaryY, 6), text, { size: 6, color: C_INK_2 });
    boundaryY += 7.4;
  }

  // -- The signature block, or its structural replacement -----------------
  if (artifact.signatureBlockWithheld) {
    drawWithheldBlock(page, geometry, artifact, signatureTop);
  } else {
    drawSignatureBlock(page, geometry, artifact, signatureTop);
  }

  drawFooter(page, geometry, artifact);
  return page;
}

function drawSignatureBlock(
  page: PdfPage,
  geometry: LayoutGeometry,
  artifact: Wh347Artifact,
  top: number,
): void {
  const { grid } = geometry;
  const right = grid.left + grid.width;
  const half = grid.width / 2 - 12;
  const soc = artifact.statementOfCompliance;

  page.text(grid.left, baselineAt(page, top, 6), SIGNATURE_NAME_LABEL, {
    font: 'HB',
    size: 6,
    color: C_INK_3,
    charSpace: 0.4,
  });
  page.text(grid.left + half + 24, baselineAt(page, top, 6), SIGNATURE_LABEL, {
    font: 'HB',
    size: 6,
    color: C_INK_3,
    charSpace: 0.4,
  });

  const lineTop = top + 26;
  page.line(grid.left, page.fromTop(lineTop), grid.left + half, page.fromTop(lineTop), 0.7, C_INK);
  page.line(grid.left + half + 24, page.fromTop(lineTop), right, page.fromTop(lineTop), 0.7, C_INK);

  page.text(grid.left, baselineAt(page, lineTop - 12, 8), `${soc.signatoryName}`, {
    size: 8,
    color: C_INK,
  });
  page.text(grid.left, baselineAt(page, lineTop + 3, 6), soc.signatoryTitle, { size: 6, color: C_INK_3 });

  page.text(grid.left, baselineAt(page, lineTop + 14, 5.5), SIGNATURE_NOTE, { size: 5.5, color: C_INK_3 });
  page.text(grid.left, baselineAt(page, lineTop + 23, 5.5), FALSIFICATION_WARNING, {
    size: 5.5,
    color: C_INK_2,
  });
  page.text(grid.left, baselineAt(page, lineTop + 32, 5.5), PERSONS_STATEMENT, { size: 5.5, color: C_INK_3 });
  page.text(right, baselineAt(page, lineTop + 3, 6), `Week ending ${artifact.header.forWeekEnding}`, {
    size: 6,
    color: C_INK_3,
    align: 'right',
    font: 'C',
  });
}

/**
 * P-B, rendered structurally.
 *
 * A 4px double border in the draft hue, and NO SIGNATURE LINE INSIDE IT. The reader
 * cannot sign this by accident because there is nothing there to sign, and a
 * photocopy of it is still not signable — which a greyed-out line would not
 * survive (`DESIGN_SYSTEM.md` §8.8.2).
 */
function drawWithheldBlock(
  page: PdfPage,
  geometry: LayoutGeometry,
  artifact: Wh347Artifact,
  top: number,
): void {
  const { grid } = geometry;
  const height = 78;
  const outerY = page.fromTop(top + height);

  page.rect(grid.left, outerY, grid.width, height, { stroke: C_DRAFT, lineWidth: 1.5 });
  page.rect(grid.left + 3, outerY + 3, grid.width - 6, height - 6, { stroke: C_DRAFT, lineWidth: 1.5 });

  let y = top + 9;
  page.text(grid.left + 10, baselineAt(page, y, 9), WITHHELD_HEADLINE, {
    font: 'HB',
    size: 9,
    color: C_DRAFT,
    charSpace: 0.5,
  });
  y += 12;

  for (const paragraph of WITHHELD_BODY) {
    for (const text of wrapToWidth(paragraph, 'H', 6.5, grid.width - 20)) {
      page.text(grid.left + 10, baselineAt(page, y, 6.5), text, { size: 6.5, color: C_INK });
      y += 7.6;
    }
    y += 1.5;
  }

  const reasons = artifact.blockReasons.length > 0 ? [...artifact.blockReasons].join(', ') : 'none recorded';
  page.text(grid.left + 10, baselineAt(page, y, 6.5), `Unresolved: ${reasons}.`, {
    font: 'HB',
    size: 6.5,
    color: C_DRAFT,
  });
  y += 8;
  page.text(
    grid.left + 10,
    baselineAt(page, y, 6),
    'The six certification boxes above are shown unmarked: nothing on this document is certified.',
    { size: 6, color: C_INK_2 },
  );
}

// ===========================================================================
// The entry point
// ===========================================================================

export interface Wh347RenderResult {
  readonly bytes: Uint8Array;
  readonly pageCount: number;
  /** Characters WinAnsi could not carry. Empty in every normal filing; non-empty is
   *  a data-quality signal about a name, not a rendering failure. */
  readonly missingGlyphs: readonly string[];
}

export function renderWh347(artifact: Wh347Artifact): Wh347RenderResult {
  const geometry = geometryFor(artifact.layout);
  const isDraft = artifact.status === 'DRAFT_NOT_CERTIFIABLE';
  const boxes = columnBoxes(geometry);
  const capacity = rowsPerPage(geometry, isDraft);
  const gridPages = paginate(artifact, capacity);

  const pages: PdfPage[] = [];
  const totalPages = gridPages.length + 1;

  gridPages.forEach((rows, index) => {
    const page = new PdfPage(geometry.page.width, geometry.page.height);
    if (isDraft) drawWatermark(page, geometry);
    let top = geometry.margin.top;
    if (isDraft) top = drawBand(page, geometry, top, artifact);
    top = drawFormHeader(page, geometry, artifact, top, index + 1, totalPages);
    top = drawColumnHead(page, geometry, artifact, top, boxes);
    const bottom =
      geometry.page.height - geometry.margin.bottom - geometry.footerHeight - geometry.totalsHeight;
    drawGrid(page, geometry, rows, top, bottom, boxes);
    drawTotals(page, geometry, artifact, bottom, index === gridPages.length - 1);
    drawFooter(page, geometry, artifact);
    pages.push(page);
  });

  pages.push(drawStatementPage(geometry, artifact));

  const bytes = serializePdf(pages, {
    title: `WH-347 payroll — ${artifact.header.contractorName} — week ending ${artifact.header.forWeekEnding}`,
    subject: `${artifact.status} · ${artifact.provenance.wdNumber} rev ${artifact.provenance.revisionPinned}`,
    generatedAt: artifact.provenance.generatedAt,
  });

  const missing = [...new Set(pages.flatMap((page) => page.missing))];
  return { bytes, pageCount: pages.length, missingGlyphs: missing };
}

/** The convenience entry point: bytes only. */
export function renderWh347Pdf(artifact: Wh347Artifact): Uint8Array {
  return renderWh347(artifact).bytes;
}

export function geometryFor(layout: Wh347Layout): LayoutGeometry {
  return WH347_GEOMETRY[layout];
}

/**
 * The filing totals strip, under the grid on the last payroll page.
 *
 * Sums of already-narrowed cents (R2), carried on the struct — this function
 * prints them and computes nothing.
 */
function drawTotals(
  page: PdfPage,
  geometry: LayoutGeometry,
  artifact: Wh347Artifact,
  bottom: number,
  isLastGridPage: boolean,
): void {
  if (!isLastGridPage) return;
  const size = geometry.type.cell;
  const y = bottom + (geometry.totalsHeight - size) / 2;
  const labelX = geometry.grid.left + 2;

  page.text(labelX, baselineAt(page, y, size), 'FILING TOTALS', {
    font: 'HB',
    size,
    color: C_INK_3,
    charSpace: 0.4,
  });

  const parts = [
    `hours ${artifact.totals.hoursWorked}`,
    `7A ${artifact.totals.col7A}`,
    `7B ${artifact.totals.col7B}`,
    `deductions ${artifact.totals.deductions}`,
    `CWHSSA premium ${artifact.totals.cwhssaPremium}`,
  ].join('   ·   ');

  // Right-aligned to the grid's right edge, and truncated to the room between the
  // label and that edge. A totals line that ran off the page would be a figure the
  // reader can see the start of and not the end of, which is worse than a shorter
  // one.
  const labelEnd = labelX + measureText('FILING TOTALS', 'HB', size) + 14;
  const available = geometry.grid.left + geometry.grid.width - labelEnd;
  page.text(
    geometry.grid.left + geometry.grid.width,
    baselineAt(page, y, size),
    truncateToWidth(parts, 'C', size, available),
    { font: 'C', size, color: C_INK, align: 'right' },
  );
}
