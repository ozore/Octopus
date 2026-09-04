/**
 * The State Entry Pack, on paper.
 *
 * **Paper is what leaves the building** (`IDENTITY_ARBITRATION.md` §3.2,
 * `BUILD.md` §1). The board is the coordinator's instrument surface; a pack is
 * forwarded to a COO and a lawyer who have never logged in, so it renders on
 * paper whatever the buyer's theme, and the palette below is the
 * `[data-theme="paper"]` block of `design-system.css`, token for token —
 * `tests/packs.test.ts` reads that CSS and asserts the hexes still match, so
 * the PDF cannot drift away from the screen it was copied from.
 *
 * WHY pdf-lib AND NOT A HEADLESS BROWSER. A pack must be generated inside a
 * serverless function in under two minutes (`UX.md` S16c) with no binary to
 * install and no network. `pdf-lib` is pure JavaScript with the fourteen
 * standard fonts built in; a headless Chromium is a 300 MB dependency, a cold
 * start we cannot afford, and one more thing that can be unavailable on the
 * Friday night a buyer pays at 22:00.
 *
 * WHAT THE RENDERER MAY NOT DO. It takes the assembled `EntryPack` and prints
 * it. It does not read the knowledge base, does not format a value and does not
 * decide what is verified — all of that happened in `assemble.ts`, which is why
 * `specs/08` AC6 ("the PDF and the web version contain identical values") is a
 * property of the data rather than a diff between two renderers.
 *
 * FULL URLS, NOT LINK TEXT. `UX.md` S16d: the PDF prints the provenance line as
 * a complete address, because the reader of a printed pack cannot hover.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';

import { STEP_LEDES } from './fields';
import type { EntryPack, PackItem } from './types';

/**
 * `design-system.css` `:root[data-theme="paper"]`. Mirrored, not imported: the
 * CSS is a stylesheet, not a module, and `next build` does not hand it to a
 * serverless function. The test that compares the two is what keeps this
 * honest.
 */
export const PAPER = {
  ground: '#E9ECE8',
  surface: '#FFFFFF',
  line: '#CBD1CB',
  lineStrong: '#78827C',
  ink: '#131714',
  ink2: '#454B47',
  ink3: '#5F6762',
  risk: '#8A4E08',
  riskEdge: '#A9701F',
} as const;

function hex(value: string): RGB {
  return rgb(
    Number.parseInt(value.slice(1, 3), 16) / 255,
    Number.parseInt(value.slice(3, 5), 16) / 255,
    Number.parseInt(value.slice(5, 7), 16) / 255,
  );
}

/**
 * The fourteen standard fonts are WinAnsi-encoded, so a character outside that
 * set throws at draw time rather than rendering as a box. Everything this
 * product writes — em dashes, curly quotes, the multiplication sign — is inside
 * WinAnsi, but a board's own prose is not ours to control, so the substitution
 * table below is applied to every string and anything still outside the set is
 * replaced rather than allowed to fail a paid delivery.
 */
const SUBSTITUTIONS: Array<[RegExp, string]> = [
  [/[‘’‚′]/g, "'"],
  [/[“”„″]/g, '"'],
  [/[‐‑‒–]/g, '-'],
  [/…/g, '...'],
  [/ /g, ' '],
  [/[≤]/g, '<='],
  [/[≥]/g, '>='],
  [/→/g, '->'],
  [/[\r\n\t]+/g, ' '],
];

export function toWinAnsi(text: string): string {
  let out = text;
  for (const [pattern, replacement] of SUBSTITUTIONS) out = out.replace(pattern, replacement);
  // Anything left outside Latin-1 is dropped rather than thrown on.
  return out.replace(/[^ -~¡-ÿ—‘’“”•]/g, '');
}

const PAGE = { width: 595.28, height: 841.89 }; // A4 portrait, in points.
const MARGIN = 54;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

type Cursor = { page: PDFPage; y: number };

class PackWriter {
  private cursor: Cursor;
  readonly pages: PDFPage[] = [];

  constructor(
    private readonly doc: PDFDocument,
    private readonly body: PDFFont,
    private readonly bold: PDFFont,
    private readonly mono: PDFFont,
  ) {
    this.cursor = { page: this.newPage(), y: PAGE.height - MARGIN };
  }

  private newPage(): PDFPage {
    const page = this.doc.addPage([PAGE.width, PAGE.height]);
    // Paper is a colour, not the absence of one: an unpainted page is white,
    // and white is not this product's paper.
    page.drawRectangle({ x: 0, y: 0, width: PAGE.width, height: PAGE.height, color: hex(PAPER.ground) });
    this.pages.push(page);
    return page;
  }

  private ensure(space: number): void {
    if (this.cursor.y - space < MARGIN) this.cursor = { page: this.newPage(), y: PAGE.height - MARGIN };
  }

  wrap(text: string, font: PDFFont, size: number, width = CONTENT_WIDTH): string[] {
    const words = toWinAnsi(text).split(' ').filter((w) => w.length > 0);
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > width && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines.length > 0 ? lines : [''];
  }

  text(
    value: string,
    options: {
      size?: number;
      font?: 'body' | 'bold' | 'mono';
      color?: string;
      indent?: number;
      gap?: number;
    } = {},
  ): void {
    const size = options.size ?? 10;
    const font = options.font === 'bold' ? this.bold : options.font === 'mono' ? this.mono : this.body;
    const indent = options.indent ?? 0;
    const leading = size * 1.45;
    for (const line of this.wrap(value, font, size, CONTENT_WIDTH - indent)) {
      this.ensure(leading);
      this.cursor.y -= leading;
      this.cursor.page.drawText(line, {
        x: MARGIN + indent,
        y: this.cursor.y,
        size,
        font,
        color: hex(options.color ?? PAPER.ink),
      });
    }
    this.cursor.y -= options.gap ?? 4;
  }

  rule(color: string = PAPER.line): void {
    this.ensure(10);
    this.cursor.y -= 6;
    this.cursor.page.drawLine({
      start: { x: MARGIN, y: this.cursor.y },
      end: { x: PAGE.width - MARGIN, y: this.cursor.y },
      thickness: 0.75,
      color: hex(color),
    });
    this.cursor.y -= 8;
  }

  space(points: number): void {
    this.cursor.y -= points;
  }

  pageBreak(): void {
    this.cursor = { page: this.newPage(), y: PAGE.height - MARGIN };
  }

  get currentPage(): PDFPage {
    return this.cursor.page;
  }
}

function provenanceLine(item: PackItem): string {
  const bits: string[] = [];
  if (item.provenance.url) bits.push(item.provenance.url);
  if (item.provenance.lastVerified) bits.push(`checked ${item.provenance.lastVerified}`);
  if (item.provenance.confidence !== 'high') bits.push(`${item.provenance.confidence} confidence`);
  return bits.length > 0 ? `Source: ${bits.join(' · ')}` : 'Source: we have no published page for this.';
}

function drawItem(writer: PackWriter, item: PackItem): void {
  const heading = item.scope && item.scope !== item.label ? `${item.label}` : item.label;
  writer.text(`${heading}: ${item.text}`, { size: 10, font: 'bold', gap: 1 });
  if (item.provenance.evidence) {
    writer.text(`"${item.provenance.evidence}"`, { size: 8.5, color: PAPER.ink2, indent: 12, gap: 1 });
  }
  writer.text(provenanceLine(item), { size: 7.5, font: 'mono', color: PAPER.ink3, indent: 12, gap: 2 });
  if (item.flagReason) {
    writer.text(`Needs checking — ${item.flagReason}`, { size: 8.5, color: PAPER.risk, indent: 12, gap: 1 });
  }
  if (item.note) writer.text(item.note, { size: 8.5, color: PAPER.ink2, indent: 12, gap: 2 });
  if (item.askThis) writer.text(`Ask the board: ${item.askThis}`, { size: 8.5, color: PAPER.risk, indent: 12, gap: 2 });
  writer.space(3);
}

/**
 * Render the pack. Deterministic: the same `EntryPack` produces the same bytes,
 * because the creation and modification dates are pinned to the pack's own
 * `today` rather than to the clock. That is what lets a golden test exist at
 * all, and it is the same reasoning as `kbSnapshotId` being non-optional — a
 * pack is a statement about the world on a date.
 */
export async function renderPackPdf(pack: EntryPack): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const body = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);

  const title = `State Entry Pack — ${pack.targetStateName}, ${pack.trades.join(' and ')}`;
  doc.setTitle(toWinAnsi(title));
  doc.setSubject(toWinAnsi('Every requirement the board publishes, and every requirement it does not.'));
  doc.setProducer('StateReady');
  doc.setCreator('StateReady');
  const stamp = new Date(`${pack.today}T00:00:00Z`);
  doc.setCreationDate(stamp);
  doc.setModificationDate(stamp);

  const writer = new PackWriter(doc, body, bold, mono);

  // --- Page one, in the order `specs/08` fixes -----------------------------
  writer.text(title, { size: 18, font: 'bold', gap: 2 });
  writer.text(
    pack.mode === 'preview'
      ? 'Preview. The first section is complete; every value in the sections after it is withheld until purchase. Every gap this board leaves is shown in full, below, before you pay.'
      : `Assembled for ${pack.organisationName ?? 'your organisation'} on ${pack.today}.`,
    { size: 9, color: PAPER.ink3, gap: 6 },
  );
  writer.rule(PAPER.lineStrong);

  writer.text('The answer, first', { size: 13, font: 'bold', gap: 2 });
  writer.text(pack.answer.map((segment) => segment.text).join(''), { size: 10.5, gap: 8 });

  writer.text(
    `What ${pack.targetStateName} does not publish`,
    { size: 13, font: 'bold', gap: 2 },
  );
  writer.text(
    pack.gaps.length === 0
      ? 'Nothing. Every requirement in the disclosed set is published by this board and verified in this pack.'
      : `${pack.gaps.length} requirement(s) below are not published by this board, or we could not establish them from a public page. They are named here, before anything we do know. We never estimate a fee, an hour count or a processing time.`,
    { size: 9.5, color: PAPER.ink2, gap: 6 },
  );
  for (const gap of pack.gaps) {
    writer.text(`${gap.scope ? `${gap.scope} — ` : ''}${gap.label}: ${gap.text}`, {
      size: 10,
      font: 'bold',
      color: PAPER.risk,
      gap: 1,
    });
    if (gap.whatWeRead) writer.text(`What we read: ${gap.whatWeRead}`, { size: 8.5, color: PAPER.ink2, indent: 12, gap: 1 });
    if (gap.askThis) writer.text(`Ask ${gap.boardName ?? 'the board'}: ${gap.askThis}`, { size: 8.5, color: PAPER.ink2, indent: 12, gap: 1 });
    if (gap.boardUrl) writer.text(gap.boardUrl, { size: 7.5, font: 'mono', color: PAPER.ink3, indent: 12, gap: 4 });
  }

  writer.rule();
  writer.text('The Entry Pack Guarantee', { size: 12, font: 'bold', gap: 2 });
  writer.text(pack.guarantee, { size: 9.5, gap: 8 });

  writer.text(pack.disclaimer, { size: 8, color: PAPER.ink3, gap: 4 });

  // --- The boards, before anything else, because writing to the wrong agency
  //     costs three weeks (`specs/08` §Edge cases) --------------------------
  writer.pageBreak();
  writer.text('Who issues what', { size: 13, font: 'bold', gap: 4 });
  for (const board of pack.boards) {
    writer.text(`${board.name} (${board.trade})`, { size: 10, font: 'bold', gap: 1 });
    writer.text(board.scope, { size: 9, color: PAPER.ink2, indent: 12, gap: 1 });
    writer.text(board.phone ? `${board.url} · ${board.phone}` : board.url, {
      size: 7.5,
      font: 'mono',
      color: PAPER.ink3,
      indent: 12,
      gap: 6,
    });
  }

  if (pack.needsHumanCheck.length > 0) {
    writer.rule(PAPER.riskEdge);
    writer.text(`${pack.needsHumanCheck.length} value(s) we could not fully verify`, {
      size: 12,
      font: 'bold',
      color: PAPER.risk,
      gap: 2,
    });
    writer.text(
      'Each of these is printed with the value we read and the reason it is flagged. Confirm them with the board before you rely on them.',
      { size: 9, color: PAPER.ink2, gap: 6 },
    );
    for (const item of pack.needsHumanCheck) {
      writer.text(`${item.scope ? `${item.scope} — ` : ''}${item.label}: ${item.text}`, {
        size: 9.5,
        font: 'bold',
        gap: 1,
      });
      if (item.flagReason) writer.text(item.flagReason, { size: 8.5, color: PAPER.ink2, indent: 12, gap: 1 });
      if (item.note) writer.text(item.note, { size: 8.5, color: PAPER.ink2, indent: 12, gap: 4 });
    }
  }

  // --- The eight steps, per trade ------------------------------------------
  for (const section of pack.sections) {
    writer.pageBreak();
    writer.text(`${pack.targetStateName} — ${section.trade}`, { size: 15, font: 'bold', gap: 2 });
    writer.text(
      'Two trades are two sections. Nothing below is merged with any other trade’s advice.',
      { size: 8.5, color: PAPER.ink3, gap: 6 },
    );

    for (const step of section.steps) {
      writer.rule();
      writer.text(`${step.number}. ${step.title}`, { size: 12, font: 'bold', gap: 2 });
      writer.text(step.lede, { size: 9, color: PAPER.ink2, gap: 6 });

      if (step.key === 'sources') {
        for (const source of pack.sources) {
          writer.text(source.title ?? source.url, { size: 9, gap: 1 });
          writer.text(`${source.url} · read ${source.fetchedAt.slice(0, 10)}`, {
            size: 7.5,
            font: 'mono',
            color: PAPER.ink3,
            indent: 12,
            gap: 4,
          });
        }
        continue;
      }

      if (step.withheld) {
        writer.text(STEP_LEDES[step.key], { size: 9, color: PAPER.ink3, gap: 2 });
      }

      for (const group of step.groups) {
        writer.text(group.heading, { size: 10.5, font: 'bold', color: PAPER.lineStrong, gap: 3 });
        for (const item of group.items) drawItem(writer, item);
      }
      if (step.groups.length === 0) {
        writer.text('This board publishes nothing under this heading that we could establish.', {
          size: 9,
          color: PAPER.risk,
          gap: 4,
        });
      }
    }

    if (section.coverageNotes.length > 0) {
      writer.rule();
      writer.text('What this record does not cover', { size: 11, font: 'bold', gap: 3 });
      for (const note of section.coverageNotes) writer.text(note, { size: 8.5, color: PAPER.ink2, gap: 4 });
    }
  }

  // --- Footer on every page, including the watermark the share link needs ---
  const total = writer.pages.length;
  writer.pages.forEach((page, i) => {
    const footer = toWinAnsi(
      `StateReady · ${pack.targetStateName} ${pack.trades.join('/')} · assembled ${pack.today} · page ${i + 1} of ${total}`,
    );
    page.drawText(footer, { x: MARGIN, y: MARGIN - 22, size: 7.5, font: mono, color: hex(PAPER.ink3) });
    if (pack.organisationName) {
      const mark = toWinAnsi(`Prepared for ${pack.organisationName}`);
      page.drawText(mark, {
        x: PAGE.width - MARGIN - mono.widthOfTextAtSize(mark, 7.5),
        y: MARGIN - 22,
        size: 7.5,
        font: mono,
        color: hex(PAPER.ink3),
      });
    }
  });

  return doc.save();
}

/**
 * Every value the PDF prints, extracted from the same object the PDF was drawn
 * from. `specs/08` AC6 asks for "byte-comparable value extraction" between the
 * PDF and the web version; both render this list, so the comparison is exact
 * rather than approximate — and a renderer that silently dropped a section
 * would still be caught, because the web renderer is tested against the same
 * extraction.
 */
export function extractPackValues(pack: EntryPack): string[] {
  const out: string[] = [];
  for (const section of pack.sections) {
    for (const step of section.steps) {
      for (const group of step.groups) {
        for (const item of group.items) out.push(`${item.id}=${item.text}`);
      }
    }
  }
  return out.sort();
}
