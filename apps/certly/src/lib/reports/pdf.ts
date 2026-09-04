/**
 * THE PDF — `specs/12` §3. **The order of the sections is the spec.**
 *
 * This is differentiator D2. A dashboard cannot be forwarded to a board, an
 * owner, a lender or an insurer; the artefact that gets forwarded is the
 * artefact that sells the next seat. So the file has to stand on its own: it
 * says what it is, what it compared, what it did not check, and what it could
 * not read — on paper, in greyscale, months later.
 *
 * WHY `pdf-lib`. It is pure JavaScript with no native module and no headless
 * browser, so it runs inside a Vercel Function unchanged; the alternatives
 * (Puppeteer, wkhtmltopdf, a native binding) need a binary this platform has no
 * place to put. Its cost is that there is no HTML layout engine, so the
 * paragraph wrapping and the pagination below are written out by hand — which
 * is a fair trade for a document whose structure is fixed by a specification.
 *
 * WHY THE STANDARD-14 HELVETICA AND NOT THE BRAND FACE. `specs/12` §10 requires
 * that a non-Latin character in a vendor name never degrade to a `?`. The
 * standard font covers WinAnsi (Latin-1 plus the common punctuation), needs no
 * embedding, and keeps a 400-vendor report small enough to e-mail. Anything
 * outside WinAnsi is transliterated by `toWinAnsi` below — and the CSV, which
 * has no such limit, carries the name in full.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

import { disclaimers } from '../kb/disclaimers';
import { COUNTER_ORDER } from '../repos/dashboard';
import { VENDOR_COUNTER_LABEL } from '../status';
import type { ReportSnapshot } from './types';

// A4 in points, and a measure wide enough for a table but narrow enough to read.
const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const BODY = 9.5;
const LEAD = 13;

/**
 * Everything outside WinAnsi, made printable — and NEVER as `?`.
 *
 * Decomposing first (NFKD) turns `Ł`, `č` and `ā` into a base letter plus a
 * combining mark, and dropping the marks leaves a name a reader still
 * recognises. What genuinely has no Latin form — CJK, Cyrillic, Greek — becomes
 * a middle dot, which is in WinAnsi and reads as "a character was here" rather
 * than as a mistake. The full string is in the CSV and in the app.
 */
export function toWinAnsi(input: string): string {
  const mapped = input
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‐‑‒–]/g, '-')
    .replace(/—/g, '—')
    .replace(/…/g, '...')
    .replace(/[   ]/g, ' ')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');
  let out = '';
  for (const char of mapped) {
    const code = char.codePointAt(0) ?? 0;
    if (code === 10 || code === 13 || (code >= 32 && code <= 126)) out += char;
    else if (WINANSI_HIGH.has(char)) out += char;
    else out += '·';
  }
  return out;
}

/** The printable high half of WinAnsi that this document actually uses. */
const WINANSI_HIGH = new Set(
  '€‚ƒ„…†‡ˆ‰Š‹Œ Ž‘’“”•–—˜™š›œ žŸ¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ'.split(
    '',
  ),
);

type Cursor = { page: PDFPage; y: number };

export type Fonts = { regular: PDFFont; bold: PDFFont };

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of toWinAnsi(text).split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > width && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

class Writer {
  readonly doc: PDFDocument;
  readonly fonts: Fonts;
  private cursor: Cursor;
  readonly width = PAGE.width - MARGIN * 2;

  constructor(doc: PDFDocument, fonts: Fonts) {
    this.doc = doc;
    this.fonts = fonts;
    this.cursor = { page: doc.addPage([PAGE.width, PAGE.height]), y: PAGE.height - MARGIN };
  }

  get page(): PDFPage {
    return this.cursor.page;
  }

  get pageCount(): number {
    return this.doc.getPageCount();
  }

  break(): void {
    this.cursor = { page: this.doc.addPage([PAGE.width, PAGE.height]), y: PAGE.height - MARGIN };
  }

  space(points: number): void {
    this.need(points);
    this.cursor.y -= points;
  }

  /** Start a new page when the next block would run off this one. */
  need(points: number): void {
    if (this.cursor.y - points < MARGIN) this.break();
  }

  text(
    value: string,
    options: { size?: number; bold?: boolean; indent?: number; grey?: boolean; width?: number } = {},
  ): void {
    const size = options.size ?? BODY;
    const font = options.bold ? this.fonts.bold : this.fonts.regular;
    const indent = options.indent ?? 0;
    const lines = wrap(value, font, size, (options.width ?? this.width) - indent);
    for (const line of lines) {
      this.need(size + 3);
      this.cursor.page.drawText(line, {
        x: MARGIN + indent,
        y: this.cursor.y - size,
        size,
        font,
        color: options.grey ? rgb(0.38, 0.38, 0.38) : rgb(0.08, 0.08, 0.08),
      });
      this.cursor.y -= size + (size >= 12 ? 6 : 3.5);
    }
  }

  rule(): void {
    this.need(8);
    this.cursor.page.drawLine({
      start: { x: MARGIN, y: this.cursor.y - 4 },
      end: { x: PAGE.width - MARGIN, y: this.cursor.y - 4 },
      thickness: 0.6,
      color: rgb(0.75, 0.75, 0.75),
    });
    this.cursor.y -= 12;
  }

  /** A fixed-column row. Columns are points from the left margin. */
  row(cells: string[], columns: number[], options: { bold?: boolean; size?: number } = {}): void {
    const size = options.size ?? BODY;
    const font = options.bold ? this.fonts.bold : this.fonts.regular;
    this.need(size + 6);
    cells.forEach((cell, index) => {
      const x = MARGIN + (columns[index] ?? 0);
      const limit = (columns[index + 1] ?? this.width) - (columns[index] ?? 0) - 6;
      let value = toWinAnsi(cell);
      while (value.length > 1 && font.widthOfTextAtSize(value, size) > limit) {
        // `specs/12` §10: a very long value is truncated with an ellipsis in
        // the PDF and printed in full in the CSV.
        value = `${value.slice(0, value.length - 2)}...`;
      }
      this.cursor.page.drawText(value, { x, y: this.cursor.y - size, size, font, color: rgb(0.08, 0.08, 0.08) });
    });
    this.cursor.y -= size + 5;
  }
}

/** The report, in the order `specs/12` §3 lays it out. That order is the spec. */
export async function renderPdf(snapshot: ReportSnapshot): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${toWinAnsi(snapshot.org.name)} — gap report ${snapshot.asOf}`);
  doc.setProducer('Certly');
  doc.setCreationDate(new Date(snapshot.generatedAt));

  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  const w = new Writer(doc, fonts);

  // --- 1. Cover -------------------------------------------------------------
  w.text('Gap report', { size: 22, bold: true });
  w.text(snapshot.org.name, { size: 13, bold: true });
  if (snapshot.org.entityBlock) w.text(snapshot.org.entityBlock, { size: 9, grey: true });
  w.space(6);
  w.text(`Generated ${snapshot.generatedAt} (${snapshot.timezone}).`, { size: 9.5 });
  w.text(`Figures are as of ${snapshot.asOf}, the organisation's local date.`, { size: 9.5 });
  w.text(`Scope: ${snapshot.scopeLabel}.`, { size: 9.5 });
  w.space(8);

  w.text('Where the roster stands', { size: 12, bold: true });
  const counterColumns = [0, 220, 300];
  w.row(['Status', 'Vendors', ''], counterColumns, { bold: true });
  for (const state of COUNTER_ORDER) {
    w.row([VENDOR_COUNTER_LABEL[state], String(snapshot.counters[state]), ''], counterColumns);
  }
  w.rule();
  w.row(['Total in scope', String(snapshot.counters.roster), ''], counterColumns, { bold: true });
  w.text(
    'These six are mutually exclusive and exhaustive: every vendor in scope is in exactly one, and they sum to the total.',
    { size: 8.5, grey: true },
  );
  w.space(10);

  // --- 2. The §F.1 disclaimer, ON THE COVER, not in a footnote --------------
  const primary = disclaimers.primary;
  w.text(primary.heading, { size: 10, bold: true });
  w.text(primary.body, { size: 9 });
  w.space(6);

  // --- 3. Summary table -----------------------------------------------------
  w.break();
  w.text('Every vendor in scope', { size: 14, bold: true });
  const summaryColumns = [0, 180, 270, 380, 460];
  w.row(['Vendor', 'Type', 'Status', 'Earliest required expiry', 'Gaps'], summaryColumns, { bold: true });
  w.rule();
  for (const vendor of snapshot.vendors) {
    w.row(
      [
        vendor.name,
        vendor.type ?? '—',
        vendor.statusWord,
        vendor.earliestRequiredExpiry ?? '—',
        String(vendor.gapCount),
      ],
      summaryColumns,
    );
  }

  // --- 4. Detail, one block per vendor with something outstanding -----------
  const outstanding = snapshot.vendors.filter(
    (vendor) => vendor.gapCount > 0 || vendor.assertedOnlyCount > 0 || vendor.undeterminedCount > 0,
  );
  if (outstanding.length > 0) {
    w.break();
    w.text('What is outstanding, vendor by vendor', { size: 14, bold: true });
    for (const vendor of outstanding) {
      w.space(6);
      w.need(60);
      w.text(vendor.name, { size: 11, bold: true });
      w.text(
        `${vendor.statusWord} · ${vendor.gapCount} gaps · ${vendor.assertedOnlyCount} claimed, not evidenced · ${vendor.undeterminedCount} needs review`,
        { size: 8.5, grey: true },
      );
      for (const row of vendor.rows) {
        if (row.state === 'met' || row.state === 'not_checked') continue;
        w.text(`${row.label} — ${STATE_WORD[row.state]}`, { size: 9.5, bold: true, indent: 10 });
        w.text(`Required: ${row.requiredValue}`, { size: 9, indent: 20, grey: true });
        w.text(`Found, as printed: ${row.foundValueRaw ?? 'nothing in this box'}`, { size: 9, indent: 20, grey: true });
        w.text(row.explanation, { size: 9, indent: 20 });
      }
    }
  }

  // --- 5. Not checked by Certly. NEVER OMITTED ------------------------------
  w.break();
  w.text('Not checked by Certly', { size: 14, bold: true });
  w.text(
    'Certly did not evaluate the requirements below. They are listed here rather than folded into a green count, because a report that hides what it did not check is worth less than no report.',
    { size: 9 },
  );
  w.space(4);
  if (snapshot.notChecked.length === 0) {
    w.text('Nothing in this scope fell outside what Certly checks.', { size: 9, grey: true });
  } else {
    const columns = [0, 180, 340];
    w.row(['Vendor', 'Requirement', 'Why not'], columns, { bold: true });
    w.rule();
    for (const row of snapshot.notChecked) {
      w.row([row.vendorName, row.label, row.explanation], columns);
    }
  }

  // --- 6. Read, but not confident enough to compare -------------------------
  w.space(12);
  w.text(`Read, but not confident enough to compare (${snapshot.needsReview.length})`, { size: 14, bold: true });
  if (snapshot.needsReview.length === 0) {
    w.text('Every document in this scope was read confidently enough to compare.', { size: 9, grey: true });
  } else {
    w.text(
      'These documents were read but a person still has to look at them. Their vendors are counted under “No certificate” on the cover and appear in no green count.',
      { size: 9 },
    );
    for (const item of snapshot.needsReview) {
      w.text(`${item.vendorName ?? 'Unmatched document'} — ${item.documentLabel}`, { size: 9.5, bold: true, indent: 10 });
      w.text(item.reason, { size: 9, indent: 20, grey: true });
    }
  }

  // --- 7. Provenance appendix ----------------------------------------------
  w.break();
  w.text('Provenance', { size: 14, bold: true });
  w.text(
    'Exactly what was compared, against what, on what date. This is what makes the report answerable under questioning.',
    { size: 9 },
  );
  for (const vendor of snapshot.vendors) {
    w.space(4);
    w.need(50);
    w.text(vendor.name, { size: 10, bold: true });
    w.text(
      [
        `certificate issued ${vendor.certificateDate ?? 'no certificate on record'}`,
        `document ${vendor.documentLabel ?? '—'}`,
        `uploaded ${vendor.documentUploadedAt ?? '—'}`,
        `extraction ${vendor.extractionId ?? '—'}`,
        `requirements ${vendor.requirementSetName ?? '—'} v${vendor.requirementSetVersion ?? '—'}`,
        `engine ${vendor.engineVersion ?? '—'}`,
        `evaluated ${vendor.evaluationDate ?? '—'}`,
      ].join(' · '),
      { size: 8.5, indent: 10, grey: true },
    );
    for (const source of vendor.sources) {
      w.text(`${source.title} — ${source.url} (checked ${source.last_verified})`, {
        size: 8.5,
        indent: 20,
        grey: true,
      });
    }
  }

  w.space(10);
  w.text(`Report ${snapshot.reportId}. Engine ${snapshot.engineVersions.join(', ')}.`, { size: 8, grey: true });

  return doc.save();
}

/** The five requirement states, in the words the rest of the product uses. */
const STATE_WORD: Record<string, string> = {
  met: 'Meets requirements',
  gap: 'Gap',
  asserted_only: 'Claimed, not evidenced',
  not_checked: 'Not checked',
  undetermined: 'Needs review',
};
