/**
 * THE PDF WRITER — vector page composition, emitting bytes directly.
 *
 * AUTHORITY: `ARCHITECTURE.md` ADR-008 ("Render our own WH-347 geometry; never fill
 * DOL's AcroForm … compose the page directly with a vector PDF library from a
 * declarative field-geometry table checked into the repo"), §2.3 (headless Chromium
 * rejected: "~400 MB of image, a class of font-rendering nondeterminism, and a
 * per-render process"), §5.3 (the artifact is the evidence eighteen months later).
 *
 * ===========================================================================
 * WHAT THIS IS AND IS NOT
 *
 * It is a PDF 1.7 serializer for exactly what a fixed-geometry government form
 * needs: lines, filled and stroked rectangles, and single-byte text in three
 * standard faces. It is not a general document engine — there is no flow layout, no
 * image support, no font embedding, no encryption and no incremental update, and
 * every one of those absences removes a nondeterminism or a dependency.
 *
 * ===========================================================================
 * DETERMINISM, WHICH IS THE WHOLE POINT (E1)
 *
 * Two artifacts generated from the same struct must be byte-identical, on any
 * machine, in any timezone, at any later date. So:
 *
 *   - THERE IS NO CLOCK IN THIS FILE. `/CreationDate` comes from the provenance
 *     struct's `generatedAt`, which the caller supplies and the database stores.
 *   - THERE IS NO RANDOMNESS. `/ID` is a SHA-256 of the body bytes rather than the
 *     usual random pair, so it is a function of the content — which is also more
 *     useful: two files with the same `/ID` really do have the same body.
 *   - STREAMS ARE UNCOMPRESSED. Flate output is a function of the zlib build, and a
 *     compression-level change would move every byte of every golden file without
 *     moving a single number on the form. A WH-347 is ~40 KB uncompressed; the
 *     trade is not close.
 *   - NUMBERS ARE FORMATTED ONE WAY. `fmt` rounds to three decimals and strips
 *     trailing zeros, so `25.5` and `25.500000000000004` cannot both appear.
 */

import { createHash } from 'node:crypto';

import {
  FONT_IDS,
  FONT_POSTSCRIPT_NAME,
  measureText,
  pdfLiteral,
  pdfTextString,
  type FontId,
} from './font';

// ===========================================================================
// Geometry primitives
// ===========================================================================

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** `#RRGGBB` from the design system's token table into PDF's 0–1 device RGB. */
export function rgb(hex: string): Rgb {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!match || match[1] === undefined) throw new TypeError(`not a hex colour: ${JSON.stringify(hex)}`);
  const value = Number.parseInt(match[1], 16);
  return {
    r: ((value >> 16) & 0xff) / 255,
    g: ((value >> 8) & 0xff) / 255,
    b: (value & 0xff) / 255,
  };
}

export type TextAlign = 'left' | 'center' | 'right';

export interface TextOptions {
  readonly font?: FontId;
  readonly size?: number;
  readonly color?: Rgb;
  readonly align?: TextAlign;
  /** Rotation in degrees, counter-clockwise about the anchor. */
  readonly rotate?: number;
  /** Extra inter-character spacing, in points (`Tc`). */
  readonly charSpace?: number;
}

export interface RectOptions {
  readonly fill?: Rgb;
  readonly stroke?: Rgb;
  readonly lineWidth?: number;
}

/**
 * Three decimals, trailing zeros stripped. PDF's own number syntax has no exponent
 * form, so `1e-7` would be a syntax error rather than a rounding annoyance.
 */
function fmt(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  const normalised = Object.is(rounded, -0) ? 0 : rounded;
  return String(normalised);
}

// ===========================================================================
// A page
// ===========================================================================

export class PdfPage {
  readonly width: number;
  readonly height: number;
  private readonly ops: string[] = [];
  private readonly usedFonts = new Set<FontId>();
  private readonly missingGlyphs = new Set<string>();

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /** Convert a distance from the top edge into PDF's bottom-left origin. Layout
   *  code reads top-down because forms are read top-down; the file does not. */
  fromTop(distance: number): number {
    return this.height - distance;
  }

  text(x: number, baselineY: number, value: string, options: TextOptions = {}): void {
    if (value === '') return;
    const font = options.font ?? 'H';
    const size = options.size ?? 7;
    const color = options.color ?? { r: 0, g: 0, b: 0 };
    const align = options.align ?? 'left';
    const rotate = options.rotate ?? 0;
    const charSpace = options.charSpace ?? 0;

    this.usedFonts.add(font);
    const width = measureText(value, font, size) + charSpace * Math.max(0, [...value].length - 1);
    const offset = align === 'right' ? -width : align === 'center' ? -width / 2 : 0;

    this.ops.push('BT');
    this.ops.push(`${fmt(color.r)} ${fmt(color.g)} ${fmt(color.b)} rg`);
    this.ops.push(`/${font} ${fmt(size)} Tf`);
    if (charSpace !== 0) this.ops.push(`${fmt(charSpace)} Tc`);
    if (rotate === 0) {
      this.ops.push(`1 0 0 1 ${fmt(x + offset)} ${fmt(baselineY)} Tm`);
    } else {
      const radians = (rotate * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      // Offset along the rotated baseline, so alignment survives rotation.
      const dx = x + offset * cos;
      const dy = baselineY + offset * sin;
      this.ops.push(`${fmt(cos)} ${fmt(sin)} ${fmt(-sin)} ${fmt(cos)} ${fmt(dx)} ${fmt(dy)} Tm`);
    }
    this.ops.push(`${pdfLiteral(value)} Tj`);
    if (charSpace !== 0) this.ops.push('0 Tc');
    this.ops.push('ET');
  }

  line(x1: number, y1: number, x2: number, y2: number, width = 0.5, color: Rgb = { r: 0, g: 0, b: 0 }): void {
    this.ops.push(`${fmt(color.r)} ${fmt(color.g)} ${fmt(color.b)} RG`);
    this.ops.push(`${fmt(width)} w`);
    this.ops.push(`${fmt(x1)} ${fmt(y1)} m ${fmt(x2)} ${fmt(y2)} l S`);
  }

  rect(x: number, y: number, width: number, height: number, options: RectOptions = {}): void {
    const { fill, stroke, lineWidth = 0.5 } = options;
    if (!fill && !stroke) return;
    if (fill) this.ops.push(`${fmt(fill.r)} ${fmt(fill.g)} ${fmt(fill.b)} rg`);
    if (stroke) {
      this.ops.push(`${fmt(stroke.r)} ${fmt(stroke.g)} ${fmt(stroke.b)} RG`);
      this.ops.push(`${fmt(lineWidth)} w`);
    }
    this.ops.push(`${fmt(x)} ${fmt(y)} ${fmt(width)} ${fmt(height)} re`);
    this.ops.push(fill && stroke ? 'B' : fill ? 'f' : 'S');
  }

  /** Record a glyph the encoder could not carry, for the caller's report. */
  noteMissingGlyphs(glyphs: readonly string[]): void {
    for (const glyph of glyphs) this.missingGlyphs.add(glyph);
  }

  get missing(): readonly string[] {
    return [...this.missingGlyphs];
  }

  get fonts(): readonly FontId[] {
    return FONT_IDS.filter((id) => this.usedFonts.has(id));
  }

  content(): string {
    return `${this.ops.join('\n')}\n`;
  }
}

// ===========================================================================
// The document
// ===========================================================================

export interface PdfMeta {
  readonly title: string;
  /** From the provenance struct. NEVER `new Date()` — see the module docblock. */
  readonly generatedAt: Date;
  /** Printed into `/Subject`, so the status travels in the file's own metadata and
   *  not only in its ink. */
  readonly subject: string;
}

function pdfDate(date: Date): string {
  const pad = (n: number, width = 2): string => String(n).padStart(width, '0');
  return (
    `D:${pad(date.getUTCFullYear(), 4)}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/**
 * Serialize pages into PDF bytes.
 *
 * Object layout is fixed and dense: catalog, page tree, three font dictionaries,
 * the info dictionary, then one page object and one content stream per page. Fixed
 * order means the byte offsets in the cross-reference table are a pure function of
 * the content, which is what makes a golden-file comparison meaningful.
 */
export function serializePdf(pages: readonly PdfPage[], meta: PdfMeta): Uint8Array {
  if (pages.length === 0) throw new Error('a PDF must have at least one page');

  const objects: string[] = [];
  const reserve = (): number => {
    objects.push('');
    return objects.length; // 1-based object number
  };
  const put = (number: number, body: string): void => {
    objects[number - 1] = body;
  };

  const catalogId = reserve();
  const pagesId = reserve();
  const fontIds = new Map<FontId, number>();
  for (const font of FONT_IDS) fontIds.set(font, reserve());
  const infoId = reserve();

  const pageIds: number[] = [];
  const contentIds: number[] = [];
  for (let i = 0; i < pages.length; i += 1) {
    pageIds.push(reserve());
    contentIds.push(reserve());
  }

  put(catalogId, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  put(
    pagesId,
    `<< /Type /Pages /Kids [ ${pageIds.map((id) => `${id} 0 R`).join(' ')} ] /Count ${pages.length} >>`,
  );
  for (const font of FONT_IDS) {
    const id = fontIds.get(font);
    if (id === undefined) continue;
    put(
      id,
      `<< /Type /Font /Subtype /Type1 /BaseFont /${FONT_POSTSCRIPT_NAME[font]} ` +
        `/Encoding /WinAnsiEncoding >>`,
    );
  }
  /**
   * The information dictionary. Its four descriptive entries are PDF **text
   * strings** and go through `pdfTextString`, which emits UTF-16BE behind a BOM;
   * `pdfLiteral` is for content streams, where the font's `/Encoding
   * /WinAnsiEncoding` governs. Sharing one function between the two put an em dash
   * in `/Title` as WinAnsi 0x97 and made every viewer render it as a different
   * character — `font.ts`'s `pdfTextString` carries the finding and the citation.
   *
   * `/CreationDate` and `/ModDate` stay on `pdfLiteral`: a PDF date is a **date
   * string**, ASCII by construction (§7.9.4), and is not a text string.
   */
  put(
    infoId,
    `<< /Title ${pdfTextString(meta.title)} /Subject ${pdfTextString(meta.subject)} ` +
      `/Producer ${pdfTextString('Ratepin')} /Creator ${pdfTextString('Ratepin')} ` +
      `/CreationDate ${pdfLiteral(pdfDate(meta.generatedAt))} /ModDate ${pdfLiteral(pdfDate(meta.generatedAt))} >>`,
  );

  pages.forEach((page, index) => {
    const pageId = pageIds[index];
    const contentId = contentIds[index];
    if (pageId === undefined || contentId === undefined) return;
    const fontEntries = FONT_IDS.map((font) => `/${font} ${fontIds.get(font) ?? 0} 0 R`).join(' ');
    put(
      pageId,
      `<< /Type /Page /Parent ${pagesId} 0 R ` +
        `/MediaBox [ 0 0 ${fmt(page.width)} ${fmt(page.height)} ] ` +
        `/Resources << /Font << ${fontEntries} >> /ProcSet [ /PDF /Text ] >> ` +
        `/Contents ${contentId} 0 R >>`,
    );
    const stream = page.content();
    put(contentId, `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}endstream`);
  });

  const chunks: string[] = [];
  let offset = 0;
  const push = (text: string): void => {
    chunks.push(text);
    offset += Buffer.byteLength(text, 'latin1');
  };

  push('%PDF-1.7\n');
  // A comment line of high bytes, which tells every downstream tool that this file
  // is binary and must not be transformed by a text-mode transfer.
  push('%\xE2\xE3\xCF\xD3\n');

  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(offset);
    push(`${index + 1} 0 obj\n${body}\nendobj\n`);
  });

  const xrefOffset = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const objectOffset of offsets) {
    xref += `${String(objectOffset).padStart(10, '0')} 00000 n \n`;
  }
  push(xref);

  const body = Buffer.from(chunks.join(''), 'latin1');
  const digest = createHash('sha256').update(body).digest('hex').slice(0, 32).toUpperCase();

  const trailer =
    `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R ` +
    `/ID [ <${digest}> <${digest}> ] >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Uint8Array.from(Buffer.concat([body, Buffer.from(trailer, 'latin1')]));
}
