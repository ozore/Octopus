/**
 * A MINIMAL PDF INSPECTOR, FOR TESTS ONLY.
 *
 * The renderer emits uncompressed content streams by design (`pdf/writer.ts`: Flate
 * output is a function of the zlib build, and a compression-level change would move
 * every byte of every golden file without moving a number on the form). That
 * decision pays for itself here: a structural assertion can read the page without a
 * PDF parsing library, so "the signature block is absent in DRAFT" is checked
 * against the ACTUAL BYTES a customer would download rather than against the struct
 * that produced them.
 *
 * This is deliberately not a PDF parser. It finds MediaBoxes and text-showing
 * operators, which is exactly what the four assertions in this directory need.
 */

const WINANSI_TO_UNICODE: ReadonlyMap<number, string> = new Map([
  [0x80, '€'], [0x82, '‚'], [0x83, 'ƒ'], [0x84, '„'], [0x85, '…'], [0x86, '†'],
  [0x87, '‡'], [0x88, 'ˆ'], [0x89, '‰'], [0x8a, 'Š'], [0x8b, '‹'], [0x8c, 'Œ'],
  [0x8e, 'Ž'], [0x91, '‘'], [0x92, '’'], [0x93, '“'], [0x94, '”'],
  [0x95, '•'], [0x96, '–'], [0x97, '—'], [0x98, '˜'], [0x99, '™'], [0x9a, 'š'],
  [0x9b, '›'], [0x9c, 'œ'], [0x9e, 'ž'], [0x9f, 'Ÿ'],
]);

function decodeByte(byte: number): string {
  return WINANSI_TO_UNICODE.get(byte) ?? String.fromCharCode(byte);
}

/** Decode one PDF literal string body (already stripped of its parentheses). */
function decodeLiteral(body: string): string {
  let out = '';
  for (let index = 0; index < body.length; index += 1) {
    const ch = body[index];
    if (ch !== '\\') {
      out += decodeByte(body.charCodeAt(index));
      continue;
    }
    const next = body[index + 1] ?? '';
    if (/[0-7]/.test(next)) {
      const octal = body.slice(index + 1, index + 4);
      out += decodeByte(Number.parseInt(octal, 8));
      index += octal.length;
      continue;
    }
    out += next;
    index += 1;
  }
  return out;
}

export function pdfString(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('latin1');
}

/** Every `/MediaBox [ … ]` in the file, in order. */
export function mediaBoxes(bytes: Uint8Array): readonly string[] {
  return [...pdfString(bytes).matchAll(/\/MediaBox \[ ([^\]]+) \]/g)].map((match) =>
    (match[1] ?? '').trim(),
  );
}

export function pageCount(bytes: Uint8Array): number {
  const match = /\/Type \/Pages [^>]*\/Count (\d+)/.exec(pdfString(bytes));
  return match?.[1] === undefined ? 0 : Number(match[1]);
}

/** Every content stream, in page order. */
export function contentStreams(bytes: Uint8Array): readonly string[] {
  const text = pdfString(bytes);
  return [...text.matchAll(/stream\n([\s\S]*?)\nendstream/g)].map((match) => match[1] ?? '');
}

/** Every string shown with `Tj`, in drawing order, decoded back to Unicode. */
export function textOperands(stream: string): readonly string[] {
  const out: string[] = [];
  const pattern = /\(((?:[^()\\]|\\[\s\S])*)\) Tj/g;
  let match: RegExpExecArray | null = pattern.exec(stream);
  while (match !== null) {
    out.push(decodeLiteral(match[1] ?? ''));
    match = pattern.exec(stream);
  }
  return out;
}

/** All visible text on all pages, joined per page. */
export function pageTexts(bytes: Uint8Array): readonly string[] {
  return contentStreams(bytes).map((stream) => textOperands(stream).join('\n'));
}

export function allText(bytes: Uint8Array): string {
  return pageTexts(bytes).join('\n');
}

/** Every text operand in the file, flat and undivided. Assertions about a LABEL —
 *  "no cell on this page says SIGNATURE" — need exact operand equality, because a
 *  substring search also matches the withheld block's own headline. */
export function allOperands(bytes: Uint8Array): readonly string[] {
  return contentStreams(bytes).flatMap((stream) => textOperands(stream));
}
