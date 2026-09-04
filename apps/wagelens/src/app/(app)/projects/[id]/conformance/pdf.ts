/**
 * The conformance worksheet, as a PDF, written by hand.
 *
 * **THIS IS NOT STANDARD FORM SF-1444 AND SAYS SO ON ITS FIRST LINE** (WL-04
 * V9). KNOWLEDGE_BASE KB-10 records that gsa.gov returned 403 to this
 * environment on both attempts, so the real form's field list is UNVERIFIED —
 * and we do not ship a form we have not opened. What this document is: the
 * contractor's own working paper, assembled so a contracting officer has
 * everything they need to file the request. Generating an actual SF-1444 is
 * WL-31, and it is gated on somebody opening the PDF.
 *
 * Why a hand-written PDF and not a library: WL-06 owns `src/lib/documents/**`
 * and the WH-347 generator, and it is not built yet. A worksheet is nine
 * paragraphs of Helvetica on letter paper — one uncompressed content stream per
 * page, an xref table, no dependency, and no bytes this file did not write.
 * When WL-06 lands, this module folds into it.
 */

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const LINE_HEIGHT = 14;
const BODY_SIZE = 10;
const LINES_PER_PAGE = Math.floor((PAGE_HEIGHT - MARGIN * 2) / LINE_HEIGHT);
/** Helvetica at 10pt averages ~5pt a glyph; 96 characters fits the measure. */
const WRAP_AT = 96;

type Line = { text: string; bold?: boolean; size?: number; blank?: boolean };

/** PDF strings are Latin-1 byte strings: the typographic characters this app's
 *  copy uses have to become their ASCII equivalents or they arrive as mojibake
 *  in a reader. Losing a curly quote is a smaller harm than a corrupt file. */
function toLatin1(value: string): string {
  return value
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
    .replace(/[^\x20-\x7e]/g, '');
}

function escape(value: string): string {
  return toLatin1(value).replace(/([\\()])/g, '\\$1');
}

/** Wraps on spaces only, so an address, a citation or a determination number is
 *  never broken across two lines. */
function wrap(text: string, width = WRAP_AT): string[] {
  const words = toLatin1(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current.length === 0) current = word;
    else if (current.length + 1 + word.length <= width) current = `${current} ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  lines.push(current);
  return lines;
}

export type ConformanceWorksheetPdfInput = {
  productName: string;
  projectName: string;
  projectOrContractNo: string;
  locationDescription: string;
  workerName: string | null;
  wdNumber: string;
  wdModificationNumber: number;
  dutiesDescription: string;
  proposedClassification: string;
  proposedBaseRate: string;
  proposedFringeRate: string;
  comparedClassifications: Array<{ label: string; baseRate: string; fringeRate: string }>;
  generatedAt: Date;
};

/** The document's words, in one place, so the test and the reader see the same
 *  text. Every regulatory sentence carries its citation. */
export function conformanceWorksheetLines(input: ConformanceWorksheetPdfInput): Line[] {
  const lines: Line[] = [];
  const add = (text: string, options: Omit<Line, 'text'> = {}) => {
    for (const part of wrap(text)) lines.push({ text: part, ...options });
  };
  const blank = () => lines.push({ text: '', blank: true });

  add('CONFORMANCE REQUEST WORKSHEET', { bold: true, size: 14 });
  blank();
  add(
    'This is a worksheet, not Standard Form SF-1444. Your contracting agency submits the conformance request to DBAConformance@dol.gov.',
    { bold: true },
  );
  blank();
  add(`Prepared with ${input.productName} on ${input.generatedAt.toISOString().slice(0, 10)}.`);
  add(
    'It is not an official U.S. Department of Labor document, and it does not decide anything: the classification and the proposed rate below are the contractor’s.',
  );
  blank();

  add('THE JOB', { bold: true });
  add(`Project: ${input.projectName}`);
  add(`Project or contract number: ${input.projectOrContractNo || 'not recorded'}`);
  add(`Location: ${input.locationDescription || 'not recorded'}`);
  add(
    `Wage determination: ${input.wdNumber}, modification ${input.wdModificationNumber} (retrieved from SAM.gov).`,
  );
  if (input.workerName) add(`Worker: ${input.workerName}`);
  blank();

  add('THE WORK ACTUALLY PERFORMED', { bold: true });
  add(input.dutiesDescription);
  blank();

  add('THE CLASSIFICATION AND RATE PROPOSED BY THE CONTRACTOR', { bold: true });
  add(`Proposed classification: ${input.proposedClassification}`);
  add(`Proposed base rate: $${Number(input.proposedBaseRate).toFixed(2)} per hour`);
  add(`Proposed fringe benefits: $${Number(input.proposedFringeRate).toFixed(2)} per hour`);
  blank();

  add('COMPARED AGAINST THESE LISTED CLASSIFICATIONS', { bold: true });
  for (const compared of input.comparedClassifications) {
    add(
      `- ${compared.label}: base $${Number(compared.baseRate).toFixed(2)}, fringe $${Number(compared.fringeRate).toFixed(2)}`,
    );
  }
  blank();

  add('THE THREE CRITERIA (ALL THREE MUST BE TRUE)', { bold: true });
  add('1. The work performed is not performed by a classification listed in the wage determination.');
  add('2. The proposed classification is used in the area by the construction industry.');
  add(
    '3. The proposed wage rate, including any fringe benefits, bears a reasonable relationship to the wage rates contained in the wage determination.',
  );
  blank();

  add('WHAT HAPPENS NEXT', { bold: true });
  add(
    'Your contracting agency — not you, and not us — submits this request to the Wage and Hour Division at DBAConformance@dol.gov.',
  );
  add(
    'WHD will approve, modify or disapprove the additional classification action within 30 days of receipt, or advise that additional time is necessary.',
  );
  add(
    'The conformance process may not be used to split, subdivide, or otherwise avoid application of classifications listed in the wage determination. 29 CFR 5.5(a)(1)(iii)(B).',
  );
  add(
    'Until it is approved, pay at least the rate of the closest listed classification and file on time. An approved conformance applies from the first day that work was performed.',
  );
  blank();
  add(
    'This worksheet is an information tool. It is not legal advice, it is not a filing, and it is not a substitute for the wage determination incorporated into your contract.',
  );

  return lines;
}

/** One uncompressed content stream per page: the text layer is the bytes, so
 *  an extraction test reads what a person reads. */
function contentStream(lines: Line[]): string {
  let out = '';
  let y = PAGE_HEIGHT - MARGIN;
  for (const line of lines) {
    if (!line.blank && line.text.length > 0) {
      const font = line.bold ? '/F2' : '/F1';
      const size = line.size ?? BODY_SIZE;
      out += `BT ${font} ${size} Tf 1 0 0 1 ${MARGIN} ${y} Tm (${escape(line.text)}) Tj ET\n`;
    }
    y -= LINE_HEIGHT;
  }
  return out;
}

export function renderConformanceWorksheetPdf(input: ConformanceWorksheetPdfInput): Uint8Array {
  const all = conformanceWorksheetLines(input);
  const pages: Line[][] = [];
  for (let index = 0; index < all.length; index += LINES_PER_PAGE) {
    pages.push(all.slice(index, index + LINES_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  // Object numbering: 1 catalog, 2 pages, 3 regular font, 4 bold font, then a
  // page object and a content object per page.
  const objects: string[] = [];
  const pageIds = pages.map((_, index) => 5 + index * 2);
  objects.push(`<< /Type /Catalog /Pages 2 0 R >>`);
  objects.push(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`,
  );
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);
  objects.push(
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`,
  );
  pages.forEach((page, index) => {
    const contentId = pageIds[index]! + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    const stream = contentStream(page);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const bytes = new Uint8Array(pdf.length);
  for (let index = 0; index < pdf.length; index += 1) bytes[index] = pdf.charCodeAt(index) & 0xff;
  return bytes;
}
