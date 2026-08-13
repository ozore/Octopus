/**
 * PDF STRUCTURE — the assertions that are about the FILE, not about the numbers.
 *
 * AUTHORITY: `DESIGN_SYSTEM.md` §8.8.1 (the verified MediaBox: DOL's own WH-347
 * declares `[0 0 792 612]` on both pages), §8.8.2 (the watermark, the band, the
 * structurally replaced signature block), `ARCHITECTURE.md` §6.3,
 * `ENGINE.md` §18.3, §25 ("What is NOT in G1: PDF byte comparison … Geometry is
 * guarded by a separate visual-regression job").
 *
 * The most important test in this file is the negative one. `renders a DRAFT with
 * no signature block anywhere in the bytes` is the executable form of P-B: not
 * "the block is greyed out", not "the block is hidden by a flag", but "the string
 * SIGNATURE does not occur in the file". A greyed-out signature line photocopies
 * into a signable signature line; a line that was never drawn does not.
 */

import { describe, expect, it } from 'vitest';

import { projectWh347, renderWh347, wh347Fields } from '@/artifacts';
import { WATERMARK_TEXT } from '@/artifacts';

import {
  CERTIFIABLE_VERDICT,
  DATED_VERDICT,
  DRAFT_COMPUTATION,
  DRAFT_VERDICT,
  FEDERAL_IDENTITIES,
  GOLDEN_COMPUTATION,
  HEADER,
  PROVENANCE,
  SIGNATORY,
} from './fixtures';
import { allOperands, allText, mediaBoxes, pageCount, pageTexts } from './pdf-inspect';

function build(
  computation = GOLDEN_COMPUTATION,
  verdict = CERTIFIABLE_VERDICT,
  overrides: Partial<Parameters<typeof projectWh347>[0]> = {},
) {
  return projectWh347({
    layout: 'wh347_rev_2025_01',
    computation,
    verdict,
    provenance: PROVENANCE,
    header: HEADER,
    workers: FEDERAL_IDENTITIES,
    signatory: SIGNATORY,
    remarks: '',
    exceptions: [],
    bandRecordedOn: PROVENANCE.publishDate,
    contractLock: null,
    verifyUrl: 'ratepin.com/v/8c1f-22a9',
    ...overrides,
  });
}

describe('the page', () => {
  it('is US Letter landscape on every page, matching the DOL form PDF', () => {
    const { bytes, pageCount: pages } = renderWh347(build());
    const boxes = mediaBoxes(bytes);
    expect(boxes.length).toBe(pages);
    for (const box of boxes) expect(box).toBe('0 0 792 612');
  });

  it('is a payroll grid plus a statement of compliance — two pages for one crew', () => {
    const { bytes, pageCount: pages } = renderWh347(build());
    expect(pages).toBe(2);
    expect(pageCount(bytes)).toBe(2);
  });

  it('starts with a PDF header and ends with %%EOF', () => {
    const bytes = renderWh347(build()).bytes;
    const text = Buffer.from(bytes).toString('latin1');
    expect(text.startsWith('%PDF-1.7\n')).toBe(true);
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(text).toContain('startxref');
  });

  it('carries no glyph the encoding could not represent', () => {
    expect(renderWh347(build()).missingGlyphs).toEqual([]);
  });

  it('paginates a crew larger than one page and keeps the statement of compliance last', () => {
    const many = {
      ...GOLDEN_COMPUTATION,
      workers: Array.from({ length: 14 }, (_, index) => {
        const base = GOLDEN_COMPUTATION.workers[index % 2];
        if (base === undefined) throw new Error('fixture has no workers');
        return { ...base, workerRef: `${base.workerRef}_${index}` as typeof base.workerRef };
      }),
    };
    const identities = many.workers.map((worker, index) => {
      const base = FEDERAL_IDENTITIES[index % 2];
      if (base === undefined) throw new Error('fixture has no identities');
      return { ...base, workerRef: worker.workerRef };
    });
    const result = renderWh347(build(many, CERTIFIABLE_VERDICT, { workers: identities }));
    expect(result.pageCount).toBeGreaterThan(2);
    const pages = pageTexts(result.bytes);
    expect(pages[pages.length - 1]).toContain('STATEMENT OF COMPLIANCE');
  });
});

describe('the provenance footer', () => {
  it('appears on every page, including the statement of compliance', () => {
    const pages = pageTexts(renderWh347(build()).bytes);
    for (const page of pages) {
      expect(page).toContain('Rates from wage determination CA20260012 revision 4, published 2026-07-31.');
      expect(page).toContain('Ratepin computes and formats. You certify and file. This is not legal advice.');
      expect(page).toContain('Corpus snapshot');
      expect(page).toContain('generated 2026-08-14 15:52 UTC');
    }
  });

  it('carries the wage determination number in the header field the 2025 form added', () => {
    const text = allText(renderWh347(build()).bytes);
    expect(text).toContain('WAGE DETERMINATION NO.');
    expect(text).toContain('CA20260012 rev. 4 (published 2026-07-31)');
  });

  it('narrows only the freshness sentence when the corpus check is dated', () => {
    const fresh = allText(renderWh347(build()).bytes);
    const dated = allText(renderWh347(build(GOLDEN_COMPUTATION, DATED_VERDICT)).bytes);

    expect(fresh).toContain('No newer revision existed as of 2026-08-14 02:41 UTC.');
    expect(dated).toContain('Newer-revision check last completed 2026-08-12 04:12 UTC; not re-checked since.');

    // D7, as bytes: the rate claim is identical and the signature block still
    // renders. An unresolved line moves the status; a stale check moves a sentence.
    expect(dated).toContain('Rates from wage determination CA20260012 revision 4, published 2026-07-31.');
    expect(dated).toContain('SIGNATURE');
    expect(dated).not.toContain('DRAFT');
  });

  it('prints the contract-value band back as the customer\'s own dated assertion', () => {
    const text = allText(renderWh347(build()).bytes);
    expect(text).toContain('You recorded on 2026-07-31 that this contract is over $100,000.');
    // Never "this contract is covered by CWHSSA" — that would be a conclusion.
    expect(text).not.toContain('is covered by');
  });
});

describe('DRAFT — NOT CERTIFIABLE', () => {
  const draft = () => renderWh347(build(DRAFT_COMPUTATION, DRAFT_VERDICT));

  it('replaces the signature block structurally — no cell on any page is a signature field', () => {
    // Operand equality, not substring: the withheld block's own headline contains
    // the word, and the claim being tested is that no LABELLED FIELD exists.
    const operands = allOperands(draft().bytes);
    expect(operands).not.toContain('SIGNATURE');
    expect(operands).not.toContain('NAME AND TITLE');
    expect(allText(draft().bytes)).toContain('SIGNATURE BLOCK WITHHELD — DRAFT, NOT CERTIFIABLE');
    expect(allText(draft().bytes)).toContain('There is no signature line on this document');
  });

  it('renders the certifiable form WITH a signature block, so the negative test means something', () => {
    const operands = allOperands(renderWh347(build()).bytes);
    expect(operands).toContain('SIGNATURE');
    expect(operands).toContain('NAME AND TITLE');
    expect(operands).toContain('Dolores Estrada');
  });

  it('watermarks and bands every page, and adds the extra footer line', () => {
    const pages = pageTexts(draft().bytes);
    expect(pages.length).toBe(2);
    for (const page of pages) {
      expect(page).toContain(WATERMARK_TEXT);
      expect(page).toContain('DO NOT SIGN OR FILE');
      expect(page).toContain('The signature block is withheld and this document must not be signed or filed.');
    }
  });

  it('leaves the six certification boxes unmarked', () => {
    // Box 3 IS the certification an unresolved classification makes unsupportable.
    // The boxes still render — P-B says the artifact renders IN FULL — but nothing
    // on the page is marked as certified.
    const statementPage = pageTexts(draft().bytes)[1] ?? '';
    expect(statementPage).toContain('That each laborer or mechanic has been paid not less than');
    expect(statementPage).not.toContain('X');
    expect(statementPage).toContain('The six certification boxes above are shown unmarked');
  });

  it('marks the boxes on a certifiable filing', () => {
    const statementPage = pageTexts(renderWh347(build()).bytes)[1] ?? '';
    expect(statementPage).toContain('X');
  });

  it('names the block reason rather than gesturing at one', () => {
    expect(allText(draft().bytes)).toContain('UNMAPPED_TRADE');
  });

  it('offers nobody to contact, anywhere in the bytes', () => {
    // A3, as an assertion over the artifact rather than over the source. `Refusal`
    // has no field in which a support address could travel; this checks that none
    // arrived by another route.
    const text = allText(draft().bytes).toLowerCase();
    for (const forbidden of ['mailto:', 'support@', 'contact us', 'get back to you', 'help centre', 'help center', 'ticket']) {
      expect(text).not.toContain(forbidden);
    }
  });
});

describe('the two layouts (ADR-012)', () => {
  const legacy = () => renderWh347(build(GOLDEN_COMPUTATION, CERTIFIABLE_VERDICT, { layout: 'wh347_legacy' }));

  it('ships both, because the cutover date is vendor-asserted with no DOL source', () => {
    expect(allText(renderWh347(build()).bytes)).toContain('Rev. January 2025');
    expect(allText(legacy().bytes)).toContain('Legacy layout (pre-Rev. January 2025)');
  });

  it('puts the Wage Determination No. field on the revised layout only', () => {
    expect(allOperands(renderWh347(build()).bytes)).toContain('WAGE DETERMINATION NO.');
    expect(allOperands(legacy().bytes)).not.toContain('WAGE DETERMINATION NO.');
    // But the provenance footer carries it on BOTH: the claim is the product, and
    // it does not depend on which layout a receiving clerk prefers.
    expect(allText(legacy().bytes)).toContain(
      'Rates from wage determination CA20260012 revision 4, published 2026-07-31.',
    );
  });

  it('keeps the withholding-exemption column the revised form deleted', () => {
    expect(allText(legacy().bytes)).toContain('HOLDING');
    expect(allOperands(renderWh347(build()).bytes)).not.toContain('NO. OF WITH-');
  });

  it('discloses the fringe credit that the legacy layout has no column for', () => {
    const text = allText(legacy().bytes);
    expect(text).toContain('FRINGE BENEFIT CREDIT AND CASH IN LIEU — WEEKLY TOTALS');
    expect(text).toContain('fringe benefit credit 234.68');
    expect(text).toContain('cash paid in lieu of fringe benefits 46.00');
    expect(text).toContain('This layout has no column 6B or 6C');
  });
});

describe('the comparable field map', () => {
  it('reports the status, the withheld block and every printed column', () => {
    const fields = wh347Fields(build(DRAFT_COMPUTATION, DRAFT_VERDICT));
    expect(fields['artifact.status']).toBe('DRAFT_NOT_CERTIFIABLE');
    expect(fields['artifact.signatureBlockWithheld']).toBe(true);
    expect(fields['artifact.blockReasons']).toBe('UNMAPPED_TRADE');
    expect(fields['worker.0.line.0.col3']).toBe('');
    expect(fields['worker.1.line.0.col3']).toBe('CEMENT MASON/CONCRETE FINISHER');
    expect(fields['worker.1.col1E']).toBe('7310');
    expect(fields['provenance.wdNumber']).toBe('CA20260012');
  });

  it('does not move the status for freshness', () => {
    expect(wh347Fields(build(GOLDEN_COMPUTATION, DATED_VERDICT))['artifact.status']).toBe(
      'CERTIFIABLE_DATED',
    );
    expect(wh347Fields(build(GOLDEN_COMPUTATION, DATED_VERDICT))['artifact.signatureBlockWithheld']).toBe(
      false,
    );
  });
});
