/**
 * Reading the text — and its coordinates — back out of a PDF we wrote.
 *
 * **WHY THIS EXISTS AND WHY IT IS SMALL.** Five of WL-06's properties are
 * assertions about the *rendered* document rather than about the code that
 * rendered it:
 *
 *  - V4 / gate G8 — every footer carries the WD number, the modification, the
 *    publication date and the "not an official DOL document" line;
 *  - V3 / gate G5 — the three certifications appear with the form's wording;
 *  - V10 — the PDF is text-based and selectable, so an auditor can search it. A
 *    rasterised page would yield nothing here, which is exactly the point;
 *  - V2 and the privacy test — `4821` appears and no nine-digit sequence and no
 *    `NNN-NN-NNNN` pattern appears anywhere (29 CFR 5.5(a)(3)(ii)(B), as a test);
 *  - **field placement** — a snapshot of every run with its page and its
 *    coordinates, so a layout change is a reviewed diff and not a surprise.
 *
 * Doing that with a PDF parsing dependency would add a package to the runtime
 * for a job only the tests need. The pages this reads are the pages this
 * codebase writes — Flate-compressed content streams of `Tm` + `Tj`/`TJ`
 * operators with WinAnsi strings — so a short reader is the honest size.
 */

import { inflateSync } from 'node:zlib';

/** CP1252's 0x80–0x9F block, the only place WinAnsi and Latin-1 disagree. */
const CP1252_HIGH: Record<number, string> = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡',
  0x88: 'ˆ', 0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ', 0x8e: 'Ž', 0x91: '‘',
  0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—', 0x98: '˜',
  0x99: '™', 0x9a: 'š', 0x9b: '›', 0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ',
};

function decodeWinAnsi(bytes: number[]): string {
  return bytes.map((b) => CP1252_HIGH[b] ?? String.fromCharCode(b)).join('');
}

/** PDF literal-string escapes, including the three-digit octal form. */
function decodeLiteral(raw: string): string {
  const out: number[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i] as string;
    if (ch !== '\\') {
      out.push(ch.charCodeAt(0));
      continue;
    }
    const next = raw[i + 1] as string | undefined;
    if (next === undefined) break;
    if (next >= '0' && next <= '7') {
      let octal = '';
      let j = i + 1;
      while (j < raw.length && octal.length < 3 && (raw[j] as string) >= '0' && (raw[j] as string) <= '7') {
        octal += raw[j] as string;
        j += 1;
      }
      out.push(parseInt(octal, 8));
      i = j - 1;
      continue;
    }
    const simple: Record<string, number> = { n: 10, r: 13, t: 9, b: 8, f: 12 };
    if (next in simple) out.push(simple[next] as number);
    else if (next !== '\n') out.push(next.charCodeAt(0));
    i += 1;
  }
  return decodeWinAnsi(out);
}

type Objects = Map<number, { header: string; stream: Buffer | null }>;

function parseObjects(pdf: Uint8Array): Objects {
  const buffer = Buffer.from(pdf);
  const text = buffer.toString('latin1');
  const objects: Objects = new Map();
  for (const match of text.matchAll(/(\d+) 0 obj\b/g)) {
    const number = Number(match[1]);
    const start = (match.index ?? 0) + (match[0] as string).length;
    const end = text.indexOf('endobj', start);
    if (end === -1) continue;
    const body = text.slice(start, end);
    const streamAt = body.indexOf('stream');
    if (streamAt === -1) {
      objects.set(number, { header: body, stream: null });
      continue;
    }
    let bodyStart = start + streamAt + 'stream'.length;
    if (text[bodyStart] === '\r') bodyStart += 1;
    if (text[bodyStart] === '\n') bodyStart += 1;
    const streamEnd = text.indexOf('endstream', bodyStart);
    objects.set(number, {
      header: body.slice(0, streamAt),
      stream: buffer.subarray(bodyStart, streamEnd === -1 ? end : streamEnd),
    });
  }
  return objects;
}

function inflateIfNeeded(header: string, stream: Buffer): string {
  if (header.includes('/FlateDecode')) {
    try {
      return inflateSync(stream).toString('latin1');
    } catch {
      /* fall through: a stream we cannot inflate is reported as raw */
    }
  }
  return stream.toString('latin1');
}

/** The content stream of each page, in page order. */
function pageStreams(pdf: Uint8Array): string[] {
  const objects = parseObjects(pdf);
  let kids: number[] = [];
  for (const [, object] of objects) {
    if (!/\/Type\s*\/Pages\b/.test(object.header)) continue;
    const list = /\/Kids\s*\[([^\]]*)\]/.exec(object.header)?.[1] ?? '';
    kids = [...list.matchAll(/(\d+) 0 R/g)].map((m) => Number(m[1]));
    break;
  }
  const out: string[] = [];
  for (const kid of kids) {
    const page = objects.get(kid);
    if (!page) continue;
    const contents = [...(/\/Contents\s*(?:\[([^\]]*)\]|(\d+) 0 R)/.exec(page.header) ?? [])];
    const refs = contents[1]
      ? [...contents[1].matchAll(/(\d+) 0 R/g)].map((m) => Number(m[1]))
      : contents[2]
        ? [Number(contents[2])]
        : [];
    let joined = '';
    for (const ref of refs) {
      const stream = objects.get(ref);
      if (stream?.stream) joined += `${inflateIfNeeded(stream.header, stream.stream)}\n`;
    }
    out.push(joined);
  }
  return out;
}

export type PdfTextRun = {
  page: number;
  x: number;
  y: number;
  size: number;
  text: string;
};

/**
 * `Tf` (which face and size), `Tm` (where), and the three ways a run of text is
 * written: a literal string, a hex string — which is what `pdf-lib` emits for a
 * standard font, because `encodeText` returns a `PDFHexString` — and a `TJ`
 * array of either kind with kerning numbers between them.
 */
const TOKEN =
  /\/([A-Za-z0-9#+._-]+)\s+([\d.]+)\s+Tf|([-\d.]+)\s+([-\d.]+)\s+Tm|\(((?:\\.|[^\\()])*)\)\s*Tj|<([0-9A-Fa-f\s]*)>\s*Tj|\[((?:[^\][]|\\.)*)\]\s*TJ/gs;

/** `<504159…>` → the WinAnsi text it encodes. */
function decodeHex(raw: string): string {
  const clean = raw.replace(/\s+/g, '');
  const bytes: number[] = [];
  for (let i = 0; i + 1 < clean.length; i += 2) bytes.push(parseInt(clean.slice(i, i + 2), 16));
  return decodeWinAnsi(bytes);
}

/** Every drawn run, in document order, with the page and point it sits at. */
export function extractPdfRuns(pdf: Uint8Array): PdfTextRun[] {
  const runs: PdfTextRun[] = [];
  pageStreams(pdf).forEach((stream, page) => {
    let size = 0;
    let x = 0;
    let y = 0;
    for (const match of stream.matchAll(TOKEN)) {
      if (match[2] !== undefined) {
        size = Number(match[2]);
        continue;
      }
      if (match[3] !== undefined && match[4] !== undefined) {
        x = Number(match[3]);
        y = Number(match[4]);
        continue;
      }
      let text = '';
      if (match[5] !== undefined) {
        text = decodeLiteral(match[5]);
      } else if (match[6] !== undefined) {
        text = decodeHex(match[6]);
      } else {
        for (const part of (match[7] ?? '').matchAll(/\(((?:\\.|[^\\()])*)\)|<([0-9A-Fa-f\s]*)>/gs)) {
          text += part[1] !== undefined ? decodeLiteral(part[1]) : decodeHex(part[2] ?? '');
        }
      }
      if (text !== '') runs.push({ page, x, y, size, text });
    }
  });
  return runs;
}

/**
 * The text of a generated PDF, runs joined by single spaces.
 *
 * The join is a single space because the generator wraps its own paragraphs
 * with single spaces between words, so a paragraph split across drawn lines
 * reads back exactly as it was written — which is what makes "the extracted
 * text contains the certification, verbatim" a meaningful assertion.
 */
export function extractPdfText(pdf: Uint8Array): string {
  return extractPdfRuns(pdf)
    .map((run) => run.text)
    .join(' ');
}

/** The text of one page, for a placement assertion scoped to page 1 or page 2. */
export function extractPdfPageText(pdf: Uint8Array, page: number): string {
  return extractPdfRuns(pdf)
    .filter((run) => run.page === page)
    .map((run) => run.text)
    .join(' ');
}

export function countPdfPages(pdf: Uint8Array): number {
  return pageStreams(pdf).length;
}
