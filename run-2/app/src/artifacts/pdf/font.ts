/**
 * THE BASE-14 FONT LAYER — encoding and metrics, with no font file anywhere.
 *
 * AUTHORITY: `ARCHITECTURE.md` ADR-008 ("compose the page directly with a vector
 * PDF library from a declarative field-geometry table … no headless browser, no
 * third-party form fill"), §2.3 (Chromium rejected for "a class of font-rendering
 * nondeterminism"), `DESIGN_SYSTEM.md` §12 ("Not built: any font file").
 *
 * ===========================================================================
 * WHY THE METRICS ARE IN THE REPO
 *
 * A PDF viewer already has Helvetica, Helvetica-Bold and Courier: they are three of
 * the fourteen standard faces every conforming reader must supply, so a `/Type1`
 * font dictionary naming one needs no `/FontFile` and no embedded bytes. What the
 * reader will NOT do is tell us how wide a string is before we place it, and this
 * renderer has to right-align dollars in a 31-point cell and truncate a
 * classification name to fit an 80-point column. So the widths travel with the
 * code.
 *
 * The consequence that matters is determinism (E1): the same artifact struct
 * produces the same bytes on any machine, in any locale, eighteen months later,
 * because nothing here reads a system font, a fontconfig cache or a clock.
 *
 * ===========================================================================
 * WHY WINANSI AND NOT UTF-8
 *
 * A simple `/Type1` font with `/Encoding /WinAnsiEncoding` addresses glyphs by
 * single byte, and that covers every character this product prints on a federal
 * form: ASCII, the em dash in `DRAFT — NOT CERTIFIABLE`, the middle dot separating
 * provenance fields, the section sign in `29 CFR 5.5(a)(3)(ii)(C)`, and the Latin-1
 * accents a worker's surname may carry. Anything outside that set is replaced with
 * `?` AND REPORTED, rather than being dropped silently — a name that renders as a
 * blank on a certified payroll is a defect that looks like a typo.
 */

// ===========================================================================
// Faces
// ===========================================================================

/** The three faces this renderer uses, keyed by the resource name written into
 *  each page's `/Font` dictionary. `C` carries every number, identifier, date and
 *  hash, per `DESIGN_SYSTEM.md` §5.4's numeral stack — Courier is the only
 *  monospaced face in the standard fourteen. */
export type FontId = 'H' | 'HB' | 'C';

export const FONT_POSTSCRIPT_NAME: Readonly<Record<FontId, string>> = {
  H: 'Helvetica',
  HB: 'Helvetica-Bold',
  C: 'Courier',
} as const;

export const FONT_IDS: readonly FontId[] = ['H', 'HB', 'C'] as const;

// ===========================================================================
// WinAnsi encoding
// ===========================================================================

/** Codepoints that WinAnsi places in the 0x80–0x9F band, where Latin-1 has
 *  controls. Everything else in 0x20–0xFF maps to itself. */
const WINANSI_HIGH: ReadonlyMap<number, number> = new Map([
  [0x20ac, 0x80], // €
  [0x201a, 0x82], // ‚
  [0x0192, 0x83], // ƒ
  [0x201e, 0x84], // „
  [0x2026, 0x85], // …
  [0x2020, 0x86], // †
  [0x2021, 0x87], // ‡
  [0x02c6, 0x88], // ˆ
  [0x2030, 0x89], // ‰
  [0x0160, 0x8a], // Š
  [0x2039, 0x8b], // ‹
  [0x0152, 0x8c], // Œ
  [0x017d, 0x8e], // Ž
  [0x2018, 0x91], // ‘
  [0x2019, 0x92], // ’
  [0x201c, 0x93], // “
  [0x201d, 0x94], // ”
  [0x2022, 0x95], // •
  [0x2013, 0x96], // –
  [0x2014, 0x97], // —
  [0x02dc, 0x98], // ˜
  [0x2122, 0x99], // ™
  [0x0161, 0x9a], // š
  [0x203a, 0x9b], // ›
  [0x0153, 0x9c], // œ
  [0x017e, 0x9e], // ž
  [0x0178, 0x9f], // Ÿ
]);

export const REPLACEMENT_BYTE = 0x3f; // '?'

/**
 * Map one codepoint to its WinAnsi byte, or `null` when the face cannot carry it.
 *
 * `null` rather than a silent substitution: `encodeWinAnsi` decides what to do and
 * records that it happened, because "this glyph is not on the form" is information
 * the caller may need to surface.
 */
export function winAnsiByte(codepoint: number): number | null {
  if (codepoint === 0x0a || codepoint === 0x0d) return null; // never inside a Tj
  if (codepoint >= 0x20 && codepoint <= 0x7e) return codepoint;
  const high = WINANSI_HIGH.get(codepoint);
  if (high !== undefined) return high;
  if (codepoint >= 0xa0 && codepoint <= 0xff) return codepoint;
  return null;
}

export interface EncodedText {
  readonly bytes: readonly number[];
  /** Characters the encoding could not carry, in order of first appearance. */
  readonly unsupported: readonly string[];
}

export function encodeWinAnsi(text: string): EncodedText {
  const bytes: number[] = [];
  const unsupported: string[] = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    const byte = winAnsiByte(cp);
    if (byte === null) {
      bytes.push(REPLACEMENT_BYTE);
      if (!unsupported.includes(ch)) unsupported.push(ch);
    } else {
      bytes.push(byte);
    }
  }
  return { bytes, unsupported };
}

/**
 * A PDF literal string, parenthesised and escaped, as a latin1-safe JS string.
 *
 * Escaping `\`, `(` and `)` is not cosmetic: an unescaped parenthesis in a worker's
 * name terminates the string operand and corrupts every byte after it in the
 * content stream — a payroll that renders as garbage from the third row down.
 */
export function pdfLiteral(text: string): string {
  const { bytes } = encodeWinAnsi(text);
  let out = '(';
  for (const byte of bytes) {
    if (byte === 0x28 || byte === 0x29 || byte === 0x5c) out += `\\${String.fromCharCode(byte)}`;
    else if (byte < 0x20 || byte > 0x7e) out += `\\${byte.toString(8).padStart(3, '0')}`;
    else out += String.fromCharCode(byte);
  }
  return `${out})`;
}

// ===========================================================================
// Metrics — Adobe's standard AFM widths, in 1/1000 em
// ===========================================================================

const HELVETICA_ASCII = [
  278, 278, 355, 556, 556, 889, 667, 222, 333, 333, 389, 584, 278, 333, 278, 278, // 32-47
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, // 48-63
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, // 64-79
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, // 80-95
  222, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, // 96-111
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, // 112-126
] as const;

const HELVETICA_BOLD_ASCII = [
  278, 333, 474, 556, 556, 889, 722, 278, 333, 333, 389, 584, 278, 333, 278, 278, // 32-47
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, // 48-63
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, // 64-79
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, // 80-95
  278, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, // 96-111
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, // 112-126
] as const;

/** The high-band glyphs this product actually prints, plus the Latin-1 letters a
 *  surname can carry. Anything else falls back to the face's average lowercase
 *  width, which is only ever a measurement question — the glyph still renders. */
const HELVETICA_HIGH: ReadonlyMap<number, number> = new Map([
  [0x85, 1000], [0x91, 222], [0x92, 222], [0x93, 333], [0x94, 333],
  [0x95, 350], [0x96, 556], [0x97, 1000], [0xa0, 278], [0xa7, 556],
  [0xb0, 400], [0xb7, 278], [0xbd, 834], [0xd7, 584],
]);

const HELVETICA_BOLD_HIGH: ReadonlyMap<number, number> = new Map([
  [0x85, 1000], [0x91, 278], [0x92, 278], [0x93, 500], [0x94, 500],
  [0x95, 350], [0x96, 556], [0x97, 1000], [0xa0, 278], [0xa7, 556],
  [0xb0, 400], [0xb7, 278], [0xbd, 834], [0xd7, 584],
]);

/** Latin-1 accented letters take their base letter's width in both Helvetica
 *  faces — the accent sits above the glyph box, not beside it. */
function latin1Base(byte: number): number | null {
  if (byte >= 0xc0 && byte <= 0xc5) return 0x41; // À-Å -> A
  if (byte === 0xc6) return null; // Æ is wider; handled by fallback
  if (byte === 0xc7) return 0x43; // Ç -> C
  if (byte >= 0xc8 && byte <= 0xcb) return 0x45; // È-Ë -> E
  if (byte >= 0xcc && byte <= 0xcf) return 0x49; // Ì-Ï -> I
  if (byte === 0xd1) return 0x4e; // Ñ -> N
  if (byte >= 0xd2 && byte <= 0xd6) return 0x4f; // Ò-Ö -> O
  if (byte >= 0xd9 && byte <= 0xdc) return 0x55; // Ù-Ü -> U
  if (byte === 0xdd) return 0x59; // Ý -> Y
  if (byte >= 0xe0 && byte <= 0xe5) return 0x61; // à-å -> a
  if (byte === 0xe7) return 0x63; // ç -> c
  if (byte >= 0xe8 && byte <= 0xeb) return 0x65; // è-ë -> e
  if (byte >= 0xec && byte <= 0xef) return 0x69; // ì-ï -> i
  if (byte === 0xf1) return 0x6e; // ñ -> n
  if (byte >= 0xf2 && byte <= 0xf6) return 0x6f; // ò-ö -> o
  if (byte >= 0xf9 && byte <= 0xfc) return 0x75; // ù-ü -> u
  if (byte === 0xfd || byte === 0xff) return 0x79; // ý ÿ -> y
  return null;
}

function helveticaWidth(byte: number, bold: boolean): number {
  const ascii = bold ? HELVETICA_BOLD_ASCII : HELVETICA_ASCII;
  const high = bold ? HELVETICA_BOLD_HIGH : HELVETICA_HIGH;
  if (byte >= 0x20 && byte <= 0x7e) return ascii[byte - 0x20] ?? (bold ? 611 : 556);
  const direct = high.get(byte);
  if (direct !== undefined) return direct;
  const base = latin1Base(byte);
  if (base !== null) return ascii[base - 0x20] ?? (bold ? 611 : 556);
  return bold ? 611 : 556;
}

/** Courier is monospaced at 600/1000 for every glyph in the face — one of the
 *  reasons it is the numeral stack here (`DESIGN_SYSTEM.md` §5.4: a column of
 *  dollars must align on the decimal). */
const COURIER_WIDTH = 600;

export function glyphWidth(byte: number, font: FontId): number {
  switch (font) {
    case 'C':
      return COURIER_WIDTH;
    case 'HB':
      return helveticaWidth(byte, true);
    case 'H':
      return helveticaWidth(byte, false);
  }
}

/** Width of `text` at `size` points. Exact for the standard faces, which is what
 *  lets a money cell be right-aligned to the hundredth of a point. */
export function measureText(text: string, font: FontId, size: number): number {
  const { bytes } = encodeWinAnsi(text);
  let thousandths = 0;
  for (const byte of bytes) thousandths += glyphWidth(byte, font);
  return (thousandths * size) / 1000;
}

const ELLIPSIS = '…';

/**
 * Fit `text` into `maxWidth`, ending with an ellipsis when it does not.
 *
 * Truncation is visible on purpose. A classification name silently clipped by a
 * column boundary reads as the whole name, and column 3 is the field the entire
 * product is about — the reader has to be able to see that there is more.
 */
export function truncateToWidth(text: string, font: FontId, size: number, maxWidth: number): string {
  if (measureText(text, font, size) <= maxWidth) return text;
  const ellipsisWidth = measureText(ELLIPSIS, font, size);
  const budget = maxWidth - ellipsisWidth;
  if (budget <= 0) return '';
  let out = '';
  let width = 0;
  for (const ch of text) {
    const chWidth = measureText(ch, font, size);
    if (width + chWidth > budget) break;
    out += ch;
    width += chWidth;
  }
  return `${out.trimEnd()}${ELLIPSIS}`;
}

/** Greedy word wrap. Words longer than the measure are broken rather than allowed
 *  to overflow the cell — a certification paragraph that runs off the page is not a
 *  certification anyone can read. */
export function wrapToWidth(
  text: string,
  font: FontId,
  size: number,
  maxWidth: number,
): readonly string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter((w) => w.length > 0);
    let current = '';
    for (const word of words) {
      const candidate = current === '' ? word : `${current} ${word}`;
      if (measureText(candidate, font, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current !== '') {
        lines.push(current);
        current = '';
      }
      if (measureText(word, font, size) <= maxWidth) {
        current = word;
        continue;
      }
      let chunk = '';
      for (const ch of word) {
        if (measureText(chunk + ch, font, size) > maxWidth && chunk !== '') {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      current = chunk;
    }
    lines.push(current);
  }
  return lines;
}
