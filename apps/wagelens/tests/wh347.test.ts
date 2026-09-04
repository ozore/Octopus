/**
 * WL-06 · the generated WH-347 and Statement of Compliance.
 *
 * **GATE G5 IS THE FIRST DESCRIBE IN THIS FILE AND IT IS ITS OWN TEST.** 29 CFR
 * 5.5(a)(3)(ii) accepts page 2 of the WH-347 "or another document with
 * identical wording" and accepts nothing else, so the wording is compared
 * against the committed extraction of the official PDF — both that the
 * constants match it, and that the constants actually reach the rendered page.
 *
 * The layout is checked as a **field-placement snapshot**: every drawn run with
 * its page and its coordinates, committed to
 * `tests/fixtures/wh347-placement.json`. A layout change that moves a field is
 * then a reviewed diff rather than a silent regression, which is what the spec
 * asks a golden-file test for.
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { documentFooterText } from '../src/components/disclaimer';
import { countPdfPages, extractPdfPageText, extractPdfRuns, extractPdfText } from '../src/lib/documents/pdf-text';
import { sanitizeText } from '../src/lib/documents/pdf';
import {
  APPRENTICESHIP_ATTESTATION,
  CERTIFICATIONS,
  DRAFT_WATERMARK,
  FALSIFICATION_WARNING,
  FRINGE_ATTESTATION,
  FRINGE_BLOCK_INSTRUCTION,
  FRINGE_BLOCK_TITLE,
  NO_REBATES_ATTESTATION,
  NO_WORK_PERFORMED_BANNER,
  SOC_PREAMBLE,
  SOC_VERBATIM_BLOCKS,
  WH347_COLUMN_BAND,
  normalisedFixture,
  normaliseFormText,
} from '../src/lib/documents/statement-of-compliance';
import { renderStatementOfCompliance, renderWh347 } from '../src/lib/documents/wh347';
import { fixtureModel, fixtureRow, twentyWorkerModel } from './fixtures/wh347-model';

const here = dirname(fileURLToPath(import.meta.url));
const officialPage2 = readFileSync(join(here, 'fixtures', 'wh347-page2-statement-of-compliance.txt'), 'utf8');
const placementPath = join(here, 'fixtures', 'wh347-placement.json');

const sha256 = (bytes: Uint8Array) => createHash('sha256').update(Buffer.from(bytes)).digest('hex');

// ---------------------------------------------------------------------------
// Gate G5 — the wording
// ---------------------------------------------------------------------------

describe('gate G5 — the Statement of Compliance is the form’s own wording', () => {
  const official = normalisedFixture(officialPage2);

  it('carries every block verbatim from the official page 2', () => {
    for (const block of SOC_VERBATIM_BLOCKS) {
      expect(official, `missing from the official extraction: ${block.slice(0, 48)}…`).toContain(block);
    }
  });

  it('names the three certifications KNOWLEDGE_BASE KB-7 enumerates', () => {
    expect(CERTIFICATIONS).toHaveLength(3);
    expect(CERTIFICATIONS[0]).toContain('bona fide fringe benefit plan, fund or program');
    expect(CERTIFICATIONS[1]).toContain('made available upon request');
    expect(CERTIFICATIONS[2]).toContain('actually performed');
  });

  it('cites 18 U.S.C. § 1001 and 31 U.S.C. § 3729 in the falsification warning', () => {
    expect(FALSIFICATION_WARNING).toContain('SECTION 1001 OF TITLE 18');
    expect(FALSIFICATION_WARNING).toContain('SECTION 3729 OF TITLE 31');
  });

  it('normalises only the extractor’s artefacts and never a letter', () => {
    // Strip the ligatures and the private-use glyphs from the input FIRST; the
    // normaliser must then be a whitespace collapse and nothing more.
    const stripped = officialPage2
      .replace(/[ﬀ-ﬄ]/g, (m) => ({ 'ﬀ': 'ff', 'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬃ': 'ffi', 'ﬄ': 'ffl' })[m] as string)
      .replace(/[-]/g, ' ');
    expect(normaliseFormText(stripped)).toBe(normaliseFormText(officialPage2));
  });

  it('reaches the rendered page 2 unaltered, and survives WinAnsi encoding', async () => {
    for (const block of SOC_VERBATIM_BLOCKS) {
      expect(sanitizeText(block), `${block.slice(0, 40)} is not encodable`).not.toContain('?');
    }
    const { bytes } = await renderStatementOfCompliance(fixtureModel());
    const text = extractPdfText(bytes);
    for (const block of SOC_VERBATIM_BLOCKS) expect(text).toContain(block);
  });
});

// ---------------------------------------------------------------------------
// The two documents
// ---------------------------------------------------------------------------

describe('the WH-347 as filed', () => {
  it('is the payroll grid followed by the Statement of Compliance', async () => {
    const { bytes, pageCount } = await renderWh347(fixtureModel());
    expect(pageCount).toBe(2);
    expect(countPdfPages(bytes)).toBe(2);
    const { pageCount: socPages } = await renderStatementOfCompliance(fixtureModel());
    expect(socPages).toBe(1);
  });

  it('prints the header block, the column band and every worker row', async () => {
    const { bytes } = await renderWh347(fixtureModel());
    const page1 = extractPdfPageText(bytes, 0);

    // The header field the whole product exists to fill correctly.
    expect(page1).toContain('WAGE DETERMINATION NO.');
    expect(page1).toContain('TX20260253');
    expect(page1).toContain('CERTIFIED PAYROLL NO.');
    expect(page1).toContain('8');
    expect(page1).toContain('2026-12-05');
    expect(page1).toContain('Ridgeline Mechanical LLC');
    expect(page1).toContain('1200 Kirby Drive, Suite 300, Houston, TX 77019');
    expect(page1).toContain('Bldg 4200 roof replacement');
    expect(page1).toContain('W912-26-C-0041');

    // The column band, labelled exactly as KNOWLEDGE_BASE §5 requires. `(8)`
    // is printed as its four sub-columns, which is how the form prints it.
    for (const code of WH347_COLUMN_BAND) {
      if (code === '(8)') {
        for (const sub of ['(8a)', '(8b)', '(8c)', '(8d)']) expect(page1).toContain(sub);
        continue;
      }
      if (code === '(4)') {
        expect(page1).toContain('(4) DAY AND DATE');
        continue;
      }
      expect(page1, `column ${code} is missing from the band`).toContain(code);
    }

    // Three workers, each with their four digits, their classification and the
    // seven dated day columns.
    expect(page1).toContain('Reyes');
    expect(page1).toContain('Okafor');
    expect(page1).toContain('Vandenberg-Alvarado');
    expect(page1).toContain('4821');
    expect(page1).toContain('ELECTRICIAN');
    for (const day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) expect(page1).toContain(day);
    for (const date of ['11-29', '11-30', '12-01', '12-05']) expect(page1).toContain(date);
  });

  it('writes the rate in the form’s own $12.25/.40 notation', async () => {
    const rows = [fixtureRow(1, { rateSt: '12.25', paymentInLieuHourly: '0.40' })];
    const { bytes } = await renderWh347(fixtureModel({ rows }));
    expect(extractPdfPageText(bytes, 0)).toContain('$12.25/.40');
  });

  it('prints money to exactly two decimals with no separators (V7)', async () => {
    const rows = [fixtureRow(1, { grossProject: '1540.00', grossAllWork: '12345.67' })];
    const { bytes } = await renderWh347(fixtureModel({ rows }));
    const page1 = extractPdfPageText(bytes, 0);
    expect(page1).toContain('1540.00');
    expect(page1).toContain('12345.67');
    expect(page1).not.toMatch(/\d,\d{3}\.\d{2}/);
  });

  it('wraps a long name rather than truncating it (V8)', async () => {
    const rows = [
      fixtureRow(1, {
        lastName: 'Vandenberg-Alvarado-Whitfield',
        firstName: 'Bartholomew',
      }),
    ];
    const { bytes } = await renderWh347(fixtureModel({ rows }));
    const runs = extractPdfRuns(bytes).filter((r) => r.page === 0);
    const joined = runs.map((r) => r.text).join('');
    // Every character of the name is on the page, across however many lines it
    // took. A truncated name on a certified payroll is a defective filing.
    expect(joined.replace(/\s/g, '')).toContain('Vandenberg-Alvarado-Whitfield'.replace(/\s/g, ''));
    expect(joined).toContain('Bartholomew');
  });

  it('paginates 20 workers into 8-row pages with unbroken entry numbers', async () => {
    const { bytes, pageCount } = await renderWh347(twentyWorkerModel());
    // Three grid pages (8 + 8 + 4), then the Statement of Compliance — which
    // itself runs to two pages here, because its fringe block prints 8 worker
    // rows at a time and 20 workers claim a credit. A plan or a worker is
    // never dropped to make a page fit.
    expect(pageCount).toBe(5);
    for (const page of [0, 1, 2]) {
      expect(extractPdfPageText(bytes, page)).toContain('WORK CLASSIFICATION');
    }
    expect(extractPdfPageText(bytes, 3)).toContain(CERTIFICATIONS[0]);
    const text = extractPdfText(bytes);
    for (let n = 1; n <= 20; n += 1) {
      expect(text, `worker ${n} is missing`).toContain(`Worker${String(n).padStart(2, '0')}`);
    }
    for (let page = 1; page <= pageCount; page += 1) {
      expect(text).toContain(`Page ${page} of ${pageCount}`);
    }
    // The header block repeats on every continuation page.
    for (const page of [0, 1, 2]) {
      expect(extractPdfPageText(bytes, page)).toContain('WAGE DETERMINATION NO.');
    }
  });

  it('says so, in the grid, when no work was performed (V9)', async () => {
    const { bytes, pageCount } = await renderWh347(
      fixtureModel({ rows: [], noWorkPerformed: true, header: { ...fixtureModel().header, payrollNumber: 9 } }),
    );
    expect(pageCount).toBe(2);
    const page1 = extractPdfPageText(bytes, 0);
    expect(page1).toContain(NO_WORK_PERFORMED_BANNER);
    expect(page1).toContain('9');
    // A full Statement of Compliance is still produced.
    expect(extractPdfPageText(bytes, 1)).toContain(CERTIFICATIONS[0]);
  });

  it('watermarks a preview and never a filed document (V1)', async () => {
    const draft = await renderWh347(fixtureModel({ draft: true }));
    expect(extractPdfText(draft.bytes)).toContain(DRAFT_WATERMARK);
    const filed = await renderWh347(fixtureModel());
    expect(extractPdfText(filed.bytes)).not.toContain(DRAFT_WATERMARK);
  });
});

// ---------------------------------------------------------------------------
// Page 2 blocks
// ---------------------------------------------------------------------------

describe('page 2 — the Statement of Compliance', () => {
  it('prints the seven header fields, the apprenticeship block and the signature block', async () => {
    const { bytes } = await renderStatementOfCompliance(fixtureModel());
    const text = extractPdfText(bytes);
    for (const label of [
      'PROJECT NAME',
      'PROJECT NO. or CONTRACT NO.',
      'PAYROLL NO.',
      'PRIME CONTRACTOR’S/SUBCONTRACTOR’S BUSINESS NAME',
      'PROJECT LOCATION',
      'WEEK ENDING DATE',
      'CERTIFYING OFFICIAL’s NAME AND TITLE',
      'APPRENTICESHIP PROGRAM NAME',
      'REGISTERED NAME OF LABOR CLASSIFICATION',
      'ADDITIONAL REMARKS',
      'SIGNATURE OF CERTIFYING OFFICIAL',
      'DATE',
      'TELEPHONE NUMBER',
      'EMAIL ADDRESS',
      'OA',
      'SAA',
    ]) {
      expect(text, `page 2 is missing the label ${label}`).toContain(label);
    }
    expect(text).toContain('Rosa Delgado');
    expect(text).toContain('Office Manager');
    expect(text).toContain('(713) 555-0142');
    expect(text).toContain('rosa@ridgeline.test');
    expect(text).toContain('IBEW Local 716 JATC');
    expect(text).toContain(SOC_PREAMBLE);
    expect(text).toContain(APPRENTICESHIP_ATTESTATION);
    expect(text).toContain(FRINGE_ATTESTATION);
    expect(text).toContain(FRINGE_BLOCK_TITLE);
    expect(text).toContain(FRINGE_BLOCK_INSTRUCTION);
    expect(text).toContain(NO_REBATES_ATTESTATION);
    expect(text).toContain(FALSIFICATION_WARNING);
  });

  it('prints each fringe plan with its name, type, number, funded flag and credit (V6)', async () => {
    const { bytes } = await renderStatementOfCompliance(fixtureModel());
    const text = extractPdfText(bytes);
    expect(text).toContain('FB NAME IBEW Health and Welfare');
    expect(text).toContain('FB TYPE health');
    expect(text).toContain('PLAN NO. H-716');
    expect(text).toContain('FB NAME IBEW Pension');
    expect(text).toContain('Funded');
    expect(text).toContain('Unfunded');
    expect(text).toContain('Hourly Credit $ 7.21');
    expect(text).toContain('Hourly Credit $ 3.50');
    // The row total is column (6B) for that worker: 7.21 + 3.50 = 10.71.
    expect(text).toContain('$10.71');
  });

  it('spills a seventh plan onto a continuation block rather than dropping it', async () => {
    const plans = Array.from({ length: 7 }, (_, i) => ({
      planName: `Plan ${i + 1}`,
      planType: 'other',
      planNo: `P-${i + 1}`,
      isFunded: i % 2 === 0,
      hourlyCredit: '1.53',
    }));
    const rows = [fixtureRow(1, { fringeCredits: plans, fringeCreditHourly: '10.71' })];
    const { bytes } = await renderStatementOfCompliance(fixtureModel({ rows }));
    const text = extractPdfText(bytes);
    for (const plan of plans) expect(text, `${plan.planName} was dropped`).toContain(plan.planName);
  });
});

// ---------------------------------------------------------------------------
// Provenance, privacy and determinism
// ---------------------------------------------------------------------------

describe('gate G8 — a generated document carries its determination', () => {
  it('stamps the WD number, the modification, the date and the §9.2 footer on every page', async () => {
    const model = fixtureModel();
    const { bytes, pageCount } = await renderWh347(model);
    const footer = documentFooterText({
      productName: model.productName,
      productUrl: model.productUrl,
      generatedAt: model.certifiedAt,
      wdNumber: 'TX20260253',
      modificationNumber: 1,
      publicationDate: '2026-05-18',
    });
    for (let page = 0; page < pageCount; page += 1) {
      const text = extractPdfPageText(bytes, page);
      expect(text).toContain('Wage determination TX20260253, modification 1, published 2026-05-18.');
      expect(text).toContain(footer);
      expect(text).toContain('not an official DOL document');
      expect(text).toContain('WH-347 Rev. January 2025');
      expect(text).toContain('OMB 1235-0008');
    }
  });

  it('names the newer modification when the project is pinned to a superseded one (V14)', async () => {
    const { bytes } = await renderWh347(
      fixtureModel({
        provenance: {
          wdNumber: 'TX20260253',
          modificationNumber: 1,
          publicationDate: '2026-05-18',
          newerModification: { modificationNumber: 2, publicationDate: '2026-07-02' },
        },
      }),
    );
    const text = extractPdfText(bytes);
    expect(text).toContain('A newer modification (2) was published on 2026-07-02');
    expect(text).toContain('the determination incorporated into the contract governs');
  });
});

describe('privacy — 29 CFR 5.5(a)(3)(ii)(B) as a test', () => {
  it('prints the last four and no full identifying number anywhere', async () => {
    for (const model of [fixtureModel(), twentyWorkerModel(), fixtureModel({ rows: [], noWorkPerformed: true })]) {
      const wh347 = await renderWh347(model);
      const soc = await renderStatementOfCompliance(model);
      for (const { bytes } of [wh347, soc]) {
        const text = extractPdfText(bytes);
        expect(text).not.toMatch(/\d{3}-\d{2}-\d{4}/);
        expect(text).not.toMatch(/(?<!\d)\d{9}(?!\d)/);
      }
    }
    const { bytes } = await renderWh347(fixtureModel());
    expect(extractPdfText(bytes)).toContain('4821');
  });
});

describe('V5 — the same certified payroll renders to the same bytes', () => {
  it('produces an identical sha256 on a second run', async () => {
    const first = await renderWh347(fixtureModel());
    const second = await renderWh347(fixtureModel());
    expect(sha256(second.bytes)).toBe(sha256(first.bytes));
    const socA = await renderStatementOfCompliance(fixtureModel());
    const socB = await renderStatementOfCompliance(fixtureModel());
    expect(sha256(socB.bytes)).toBe(sha256(socA.bytes));
  });

  it('changes the hash when the payroll changes', async () => {
    const a = await renderWh347(fixtureModel());
    const b = await renderWh347(fixtureModel({ rows: [fixtureRow(1, { hoursSt: ['8', '8', '8', '8', '8', '0', '0'] })] }));
    expect(sha256(b.bytes)).not.toBe(sha256(a.bytes));
  });
});

// ---------------------------------------------------------------------------
// The placement snapshot
// ---------------------------------------------------------------------------

describe('field placement is a committed snapshot', () => {
  it('places every field on both pages where the snapshot says', async () => {
    const { bytes } = await renderWh347(fixtureModel());
    const runs = extractPdfRuns(bytes).map((run) => ({
      page: run.page,
      x: Math.round(run.x * 10) / 10,
      y: Math.round(run.y * 10) / 10,
      size: run.size,
      text: run.text,
    }));
    const actual = `${JSON.stringify(runs, null, 1)}\n`;
    if (process.env['UPDATE_PLACEMENT'] === '1') writeFileSync(placementPath, actual);
    const expected = readFileSync(placementPath, 'utf8');
    expect(actual).toBe(expected);
  });
});
