/**
 * The drawing primitives the WH-347 generator is built from.
 *
 * **WE ARE DRAWING A DOCUMENT, NOT FILLING ONE** (KNOWLEDGE_BASE KB-6). The
 * official WH-347 (Rev. January 2025) has an `/AcroForm` whose `/Fields` is an
 * empty array and not one `/Widget` annotation on either page: `get_fields()`
 * returns 0. There is nothing to fill, so the form is composed from scratch —
 * ruled boxes, a column band labelled exactly as the form labels it, and text.
 *
 * **`pdf-lib`, and no headless browser.** Vercel's serverless runtime has no
 * Chromium and no native binaries, and a screenshot of a web page is not a
 * reproducible federal filing. `pdf-lib` is pure JavaScript, runs in the Node
 * runtime unmodified, and emits a text-based PDF whose content an auditor can
 * select and search (WL-06 V10).
 *
 * **DETERMINISM IS A REQUIREMENT, NOT A NICETY** (V5: regenerating an unchanged
 * certified payroll must produce the same sha256). Three things make it hold:
 * the standard-14 fonts are referenced rather than embedded, so no subsetting
 * decision can vary; `CreationDate` and `ModDate` are pinned to the payroll's
 * `certified_at` rather than to the clock; and object streams are off, so the
 * byte layout is a function of the content alone.
 *
 * **THE TYPEFACE IS COURIER, and that is a deviation from IDENTITY.md §7.3
 * recorded in BUILD.md §6.** The identity asks for IBM Plex Mono in the
 * rendered form. Embedding it would mean committing a font binary and a
 * `fontkit` dependency for one document; Courier is a standard-14 face, is
 * monospaced and tabular by construction, needs no embedding, and renders the
 * `$12.25/.40` column alignment the identity is actually asking for. The
 * on-screen preview stays in the identity's own mono through `--wl-font-mono`.
 */

import { PDFDocument, PDFFont, PDFPage, StandardFonts, degrees, rgb } from 'pdf-lib';

/** US Legal, landscape — the shape of the official page-1 grid. */
export const PAGE_WIDTH = 1008;
export const PAGE_HEIGHT = 612;
export const MARGIN = 22;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export const INK = rgb(0.106, 0.094, 0.082);
export const RULE = rgb(0.569, 0.529, 0.463);
export const HAIRLINE = rgb(0.78, 0.75, 0.7);
export const TINT = rgb(0.965, 0.949, 0.922);
export const WATERMARK_INK = rgb(0.78, 0.72, 0.68);

/**
 * CP1252's 0x80–0x9F block as Unicode codepoints. Everything a standard PDF
 * font can encode is Latin-1 plus these; anything else has to be normalised
 * before it reaches `drawText`, which throws rather than dropping a glyph.
 */
const CP1252_EXTRA = new Set(
  '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'.split(''),
);

const LIGATURE_MAP: Record<string, string> = {
  'ﬀ': 'ff',
  'ﬁ': 'fi',
  'ﬂ': 'fl',
  'ﬃ': 'ffi',
  'ﬄ': 'ffl',
};

/**
 * Make a string encodable by a standard-14 font without losing a letter.
 * Ligatures expand, private-use Wingdings glyphs become spaces, and anything
 * still outside WinAnsi becomes `?` — which never happens for the form's own
 * wording and is asserted by `tests/wh347.test.ts`.
 */
export function sanitizeText(text: string): string {
  let out = '';
  for (const ch of text) {
    const mapped = LIGATURE_MAP[ch];
    if (mapped) {
      out += mapped;
      continue;
    }
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0xf020 && code <= 0xf0ff) {
      out += ' ';
    } else if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff)) {
      out += ch;
    } else if (CP1252_EXTRA.has(ch)) {
      out += ch;
    } else if (code === 0x09) {
      out += ' ';
    } else {
      out += '?';
    }
  }
  return out;
}

export type Fonts = { regular: PDFFont; bold: PDFFont };

/** Courier's advance width is exactly 0.6 em at every size. */
export function textWidth(text: string, size: number): number {
  return sanitizeText(text).length * size * 0.6;
}

/** How many characters of `size` fit in `width`. */
export function charsPerWidth(width: number, size: number): number {
  return Math.max(1, Math.floor(width / (size * 0.6)));
}

/**
 * Greedy word wrap. **Never truncates** — WL-06 V8: a truncated name on a
 * certified payroll is a defective filing, so a value that does not fit gets
 * more lines, and the caller gets a taller row.
 */
export function wrapText(text: string, width: number, size: number): string[] {
  const limit = charsPerWidth(width, size);
  const words = sanitizeText(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current === '') {
      current = word;
    } else if (current.length + 1 + word.length <= limit) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
    // A single word longer than the line is broken rather than overflowing.
    while (current.length > limit) {
      lines.push(current.slice(0, limit));
      current = current.slice(limit);
    }
  }
  if (current !== '') lines.push(current);
  return lines;
}

/** Truncating middle-ellipsis is NOT used for names; this is for chrome only. */
export function clip(text: string, width: number, size: number): string {
  const limit = charsPerWidth(width, size);
  const s = sanitizeText(text);
  return s.length <= limit ? s : s.slice(0, limit);
}

export type DrawTextOptions = {
  size?: number;
  bold?: boolean;
  align?: 'start' | 'end' | 'center';
  /** Width the alignment is computed against. */
  width?: number;
  color?: ReturnType<typeof rgb>;
};

export function drawText(
  page: PDFPage,
  fonts: Fonts,
  text: string,
  x: number,
  y: number,
  options: DrawTextOptions = {},
): void {
  const size = options.size ?? 6;
  const value = sanitizeText(text);
  if (value === '') return;
  let left = x;
  if (options.width !== undefined && options.align && options.align !== 'start') {
    const w = textWidth(value, size);
    left =
      options.align === 'end'
        ? x + options.width - w
        : x + (options.width - w) / 2;
  }
  page.drawText(value, {
    x: left,
    y,
    size,
    font: options.bold ? fonts.bold : fonts.regular,
    color: options.color ?? INK,
  });
}

export function drawRect(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  options: { fill?: ReturnType<typeof rgb>; stroke?: ReturnType<typeof rgb>; thickness?: number } = {},
): void {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    ...(options.fill ? { color: options.fill } : {}),
    borderColor: options.stroke ?? RULE,
    borderWidth: options.thickness ?? 0.5,
  });
}

export function drawLine(
  page: PDFPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = RULE,
  thickness = 0.5,
): void {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color, thickness });
}

/**
 * The form's checkbox: a real square, optionally with a cross. The official
 * text layer carries a Wingdings glyph here; a drawn box is what it depicts and
 * is what survives copy-and-paste.
 */
export function drawCheckbox(
  page: PDFPage,
  x: number,
  y: number,
  checked: boolean,
  size = 6,
): void {
  drawRect(page, x, y, size, size, { stroke: INK, thickness: 0.6 });
  if (checked) {
    drawLine(page, x + 1, y + 1, x + size - 1, y + size - 1, INK, 0.8);
    drawLine(page, x + 1, y + size - 1, x + size - 1, y + 1, INK, 0.8);
  }
}

/** A labelled box: the small caps label inside the top-left, the value below. */
export function drawField(
  page: PDFPage,
  fonts: Fonts,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    value?: string;
    valueSize?: number;
  },
): void {
  const { x, y, width, height, label } = options;
  drawRect(page, x, y, width, height, { stroke: RULE });
  drawText(page, fonts, label, x + 2, y + height - 6, { size: 4.5, bold: true });
  const valueSize = options.valueSize ?? 7;
  if (options.value) {
    const lines = wrapText(options.value, width - 4, valueSize);
    let cursor = y + height - 14;
    for (const line of lines) {
      if (cursor < y + 1.5) break;
      drawText(page, fonts, line, x + 2, cursor, { size: valueSize });
      cursor -= valueSize + 1.5;
    }
  }
}

/**
 * A document whose bytes are a function of its content alone: metadata pinned
 * to `pinnedDate`, no object streams, no producer string that carries a
 * version we do not control.
 */
export async function createDeterministicDocument(pinnedDate: Date): Promise<{
  pdf: PDFDocument;
  fonts: Fonts;
}> {
  const pdf = await PDFDocument.create();
  pdf.setCreationDate(pinnedDate);
  pdf.setModificationDate(pinnedDate);
  pdf.setProducer('');
  pdf.setCreator('');
  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Courier),
    bold: await pdf.embedFont(StandardFonts.CourierBold),
  };
  return { pdf, fonts };
}

export async function serialise(pdf: PDFDocument): Promise<Uint8Array> {
  return pdf.save({ useObjectStreams: false, addDefaultPage: false });
}

/** `DRAFT — NOT FOR SUBMISSION`, across the page, on every preview page (V1). */
export function drawWatermark(page: PDFPage, fonts: Fonts, text: string): void {
  page.drawText(sanitizeText(text), {
    x: 120,
    y: PAGE_HEIGHT / 2 - 20,
    size: 44,
    font: fonts.bold,
    color: WATERMARK_INK,
    opacity: 0.35,
    rotate: degrees(12),
  });
}
