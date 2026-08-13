/**
 * THE ARTIFACT-SIDE BUILD-REVIEW REGRESSIONS.
 *
 * Each test is an executed defect from `phase-2-build/build-review/` or from
 * `JOURNEY_VERIFIED.md` §4.3, written to fail against the artifact layer as it
 * shipped. Where the correction rests on a primary source, the source and its fetch
 * date are named beside the assertion.
 *
 * Everything here reads the ACTUAL EMITTED BYTES rather than the struct that
 * produced them, wherever the defect was about what a viewer or an auditor sees.
 * Three of the four findings below survived precisely because a test asserted the
 * struct and the bytes said something else.
 */

import { describe, expect, it } from 'vitest';

import { Cents, Hours, MicroDollars, MilliRate } from '@/lib/money';
import type { Wh347Artifact } from '@/artifacts/wh347/model';
import { renderWh347Pdf } from '@/artifacts/wh347/render';
import { hoursTotal, money, projectWh347, rateCell } from '@/artifacts/wh347/project';
import { pdfLiteral, pdfTextString } from '@/artifacts/pdf/font';
import { ecprFooter, renderEcprXml, type EcprRenderInput } from '@/artifacts/ecpr/render';
import {
  CA_CONTRACTOR,
  CA_IDENTITIES,
  CA_PROJECT,
  CERTIFIABLE_VERDICT,
  DRAFT_COMPUTATION,
  DRAFT_VERDICT,
  FEDERAL_IDENTITIES,
  GOLDEN_COMPUTATION,
  HEADER,
  PINNED_XSD_SHA256,
  PROVENANCE,
  SIGNATORY,
  WEEK_ENDING,
  XSD_OBSERVATION_GREEN,
} from './fixtures';
import { pdfString } from './pdf-inspect';

/** The same projection the golden suite builds, so a difference here is a
 *  difference in the writer rather than in the fixture. */
function goldenArtifact(): Wh347Artifact {
  return projectWh347({
    layout: 'wh347_rev_2025_01',
    computation: GOLDEN_COMPUTATION,
    verdict: CERTIFIABLE_VERDICT,
    provenance: PROVENANCE,
    header: HEADER,
    workers: FEDERAL_IDENTITIES,
    signatory: SIGNATORY,
    remarks: 'Crew worked Saturday to close the pour.',
    exceptions: [],
    bandRecordedOn: PROVENANCE.publishDate,
    contractLock: { revisionAtAward: 4, recordedOn: PROVENANCE.publishDate },
    verifyUrl: 'ratepin.com/v/8c1f-22a9',
  });
}

function draftArtifact(): Wh347Artifact {
  return projectWh347({
    layout: 'wh347_rev_2025_01',
    computation: DRAFT_COMPUTATION,
    verdict: DRAFT_VERDICT,
    provenance: PROVENANCE,
    header: HEADER,
    workers: FEDERAL_IDENTITIES,
    signatory: SIGNATORY,
    remarks: '',
    exceptions: [],
    bandRecordedOn: null,
    contractLock: null,
    verifyUrl: null,
  });
}

// ===========================================================================
// The document information dictionary — JOURNEY_VERIFIED.md §4.3
// ===========================================================================

/** Decode one escaped PDF literal body back to bytes, the way a conforming reader
 *  does. Octal escapes, the three special escapes, everything else literal. */
function literalBytes(body: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (ch !== '\\') {
      out.push(body.charCodeAt(i));
      continue;
    }
    const next = body[i + 1] ?? '';
    if (/[0-7]/.test(next)) {
      const octal = body.slice(i + 1, i + 4);
      out.push(Number.parseInt(octal, 8));
      i += octal.length;
      continue;
    }
    out.push(next.charCodeAt(0));
    i += 1;
  }
  return out;
}

/** Read an `/Info` entry the way a PDF reader reads a TEXT STRING (§7.9.2.2): if
 *  the bytes open with the UTF-16BE BOM, decode UTF-16BE; otherwise PDFDocEncoding,
 *  which agrees with Latin-1 outside 0x80–0x9F and is where the bug lived. */
function infoTextString(bytes: Uint8Array, key: string): string {
  const file = pdfString(bytes);
  const match = new RegExp(`/${key} \\((.*?)\\) /`, 's').exec(file);
  if (match?.[1] === undefined) throw new Error(`no /${key} in the info dictionary`);
  const raw = literalBytes(match[1]);
  if (raw[0] === 0xfe && raw[1] === 0xff) {
    let out = '';
    for (let i = 2; i + 1 < raw.length; i += 2) {
      out += String.fromCharCode(((raw[i] ?? 0) << 8) | (raw[i + 1] ?? 0));
    }
    return out;
  }
  return Buffer.from(Uint8Array.from(raw)).toString('latin1');
}

describe('the /Info dictionary is UTF-16BE, not WinAnsi', () => {
  /**
   * WHAT WAS WRONG. `/Title` read `WH-347 payroll \227 … \227 week ending …`. Octal
   * 227 is 0x97 — an em dash in WinAnsiEncoding, which is right for a content stream
   * (each `/Type1` font dictionary carries `/Encoding /WinAnsiEncoding`) and wrong
   * for an information-dictionary string, which ISO 32000-1 §7.9.2.2 reads as
   * PDFDocEncoding unless it opens with a UTF-16BE byte-order mark. The two
   * encodings differ exactly in 0x80–0x9F, which is where the em dash lives.
   * Chromium rendered it `Š` in the browser tab, visible in
   * `phase-2-build/screenshots/05-free-wh347-draft-preview.png`.
   */
  it('the title round-trips through a conforming reader with its em dashes intact', () => {
    const bytes = renderWh347Pdf(goldenArtifact());
    const title = infoTextString(bytes, 'Title');
    expect(title).toContain('—');
    expect(title).not.toContain('Š');
    expect(title.startsWith('WH-347 payroll')).toBe(true);
  });

  it('every text-string entry carries the byte-order mark', () => {
    const file = pdfString(renderWh347Pdf(goldenArtifact()));
    for (const key of ['Title', 'Subject', 'Producer', 'Creator']) {
      const match = new RegExp(`/${key} \\((.*?)\\) /`, 's').exec(file);
      expect(match?.[1]?.startsWith('\\376\\377')).toBe(true);
    }
  });

  it('`/CreationDate` stays a DATE string, which is ASCII by construction', () => {
    // §7.9.4: a date is not a text string, so it takes no BOM. Wrapping it in one
    // would produce a date no reader parses.
    const file = pdfString(renderWh347Pdf(goldenArtifact()));
    expect(file).toMatch(/\/CreationDate \(D:\d{14}Z\)/);
  });

  it('`pdfTextString` and `pdfLiteral` disagree exactly where the encodings do', () => {
    // WinAnsi puts the em dash at 0x97. UTF-16BE puts U+2014 at 0x20 0x14 — the
    // first of which is a printable space and needs no escape, the second of which
    // does. Both forms are correct; they are correct for different dictionaries.
    expect(pdfLiteral('—')).toBe('(\\227)');
    expect(pdfTextString('—')).toBe('(\\376\\377 \\024)');
    // Above 0xA0 the two encodings agree on the character but not on the bytes:
    // one byte per glyph versus two.
    expect(pdfLiteral('·')).toBe('(\\267)');
    expect(pdfTextString('·')).toBe('(\\376\\377\\000\\267)');
  });

  it('carries a glyph WinAnsi cannot, instead of replacing it with a question mark', () => {
    // A name outside Latin-1 became `?` in the file's metadata under the old path.
    expect(pdfLiteral('Łukasz')).toContain('?');
    expect(pdfTextString('Łukasz')).not.toContain('?');
  });

  it('the content stream is untouched — still single-byte WinAnsi', () => {
    // The fix must not have changed how the FORM is drawn: the font dictionaries
    // still declare WinAnsiEncoding and the em dash in the DRAFT band is still 0x97.
    const file = pdfString(renderWh347Pdf(draftArtifact()));
    expect(file).toContain('/Encoding /WinAnsiEncoding');
    expect(file).toContain('DRAFT \\227 NOT CERTIFIABLE');
  });
});

// ===========================================================================
// M-2 — the rate cell prints the rate, at the precision the rate carries
// ===========================================================================

describe('M-2 — column 6A prints the rate the arithmetic used', () => {
  /**
   * WHAT WAS WRONG. `rateCell` was `Math.round(magnitude / 100)` — a second rounding
   * function outside `money.ts`, narrowing a `MilliRate` to cents without ever
   * constructing a `Cents`, so §11.3's type boundary did not cover it. At
   * `$20.0050` over 40.00 h, column 6A printed `20.01` against a `col7A` of $800.20;
   * multiplying the two printed cells gave $800.40, a figure the form does not carry.
   *
   * WHD's instructions to form WH-347, fetched 2026-08-13: column 6 lists "the
   * ACTUAL HOURLY RATE PAID for straight time". $20.01 is a rate nobody paid.
   */
  it('a sub-cent rate is printed, not rounded away', () => {
    expect(rateCell(MilliRate.fromDecimalString('20.0050'))).toBe('20.005');
    expect(rateCell(MilliRate.fromDecimalString('20.0001'))).toBe('20.0001');
  });

  it('the printed 6A times the printed column 5 reconciles with column 7A', () => {
    const rate = MilliRate.fromDecimalString('20.0050');
    const hours = Hours.of(4_000); // 40.00 h
    const printedRate = Number(rateCell(rate));
    const printedHours = Number(hoursTotal(hours));
    const gross = Cents.fromMicroDollars(MicroDollars.fromRateHours(rate, hours));
    expect(money(gross)).toBe('800.20');
    // 20.005 × 40.00 = 800.20 exactly. Under the old cell this was 20.01 × 40.00 =
    // 800.40, a $0.20 divergence on a week where nothing is wrong.
    expect(Math.round(printedRate * printedHours * 100) / 100).toBe(800.2);
  });

  it('an ordinary two-decimal rate is unchanged, including its trailing zero', () => {
    expect(rateCell(MilliRate.fromDecimalString('36.85'))).toBe('36.85');
    expect(rateCell(MilliRate.fromDecimalString('30.00'))).toBe('30.00');
    expect(rateCell(MilliRate.fromDecimalString('0.00'))).toBe('0.00');
    expect(rateCell(MilliRate.fromDecimalString('-5.50'))).toBe('-5.50');
  });
});

// ===========================================================================
// C-3 — the eCPR reads the artifact status
// ===========================================================================

function ecprInput(overrides: Partial<EcprRenderInput> = {}): EcprRenderInput {
  return {
    contractor: CA_CONTRACTOR,
    project: CA_PROJECT,
    weekEnding: WEEK_ENDING,
    workers: CA_IDENTITIES,
    acknowledgedExclusions: [],
    computation: GOLDEN_COMPUTATION,
    provenance: PROVENANCE,
    verdict: CERTIFIABLE_VERDICT,
    footer: [],
    observation: XSD_OBSERVATION_GREEN,
    pinnedSha256: PINNED_XSD_SHA256,
    ...overrides,
  };
}

describe('C-3 — a DRAFT filing emits no California eCPR', () => {
  /**
   * WHAT WAS WRONG. `renderEcprXml` never read `ArtifactStatus`. A filing that is
   * DRAFT — NOT CERTIFIABLE federally produced a complete, well-formed, submittable
   * eCPR whose only DRAFT marker was an XML COMMENT, which DIR's parser discards.
   * The signature block is structurally withheld on the PDF and structurally
   * unrepresentable in the XML, so the P-B governing the federal artifact did not
   * exist on the state one.
   */
  it('refuses with P-B, before anything is built', () => {
    const result = renderEcprXml(
      ecprInput({ computation: DRAFT_COMPUTATION, verdict: DRAFT_VERDICT }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected a refusal');
    expect(result.refusal.primitive).toBe('P-B');
    if (result.refusal.primitive !== 'P-B') throw new Error('expected P-B');
    expect(result.refusal.signatureBlockWithheld).toBe(true);
    expect(result.refusal.blockReasons).toEqual(
      DRAFT_VERDICT.status === 'DRAFT_NOT_CERTIFIABLE' ? DRAFT_VERDICT.blocks : [],
    );
    // §10.2 still holds in the other direction: the PDF is unaffected.
    expect(result.refusal.detail).toContain('WH-347 still generates');
    // A3 — nobody to contact, and the customer can clear it alone.
    expect(`${result.refusal.headline} ${result.refusal.detail}`).not.toMatch(
      /contact|support|get in touch|we will look/i,
    );
  });

  it('a CERTIFIABLE filing is unaffected and still emits', () => {
    const result = renderEcprXml(ecprInput());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected an artifact');
    expect(result.value.xml).toContain('<eCPR');
  });
});

// ===========================================================================
// L-1 — the eCPR footer and the PDF footer describe one filing one way
// ===========================================================================

describe('L-1 — the XML’s draft sentence agrees with the PDF’s', () => {
  /** `ecprFooter` passed `unresolvedLineCount: 0` unconditionally, and
   *  `draftSentence` branches on it: at zero the subject became "This filing is
   *  unresolved" where the PDF for the same filing said "N payroll lines are
   *  unresolved". One artifact, two descriptions of one fact. */
  it('counts the unresolved lines from the computation it was handed', () => {
    const unresolved = DRAFT_COMPUTATION.workers.reduce(
      (total, worker) =>
        total + worker.lines.filter((line) => line.resolutionState !== 'resolved').length,
      0,
    );
    expect(unresolved).toBeGreaterThan(0);

    const footer = ecprFooter({
      provenance: PROVENANCE,
      computation: DRAFT_COMPUTATION,
      verdict: DRAFT_VERDICT,
      bandRecordedOn: null,
    });
    const text = footer.map((line) => line.text).join('\n');
    expect(text).toContain(String(unresolved));
    expect(text).not.toContain('This filing is unresolved');
  });

  it('and the PDF for the same filing says the same thing', () => {
    const pdf = pdfString(renderWh347Pdf(draftArtifact()));
    const footer = ecprFooter({
      provenance: PROVENANCE,
      computation: DRAFT_COMPUTATION,
      verdict: DRAFT_VERDICT,
      bandRecordedOn: null,
    });
    const draftLine = footer.find((line) => /unresolved/.test(line.text));
    expect(draftLine).toBeDefined();
    // The PDF wraps its footer, so compare the distinguishing clause rather than the
    // whole sentence: the count and the plural noun are what used to disagree.
    const match = /(\d+) payroll lines? (?:is|are) unresolved/.exec(draftLine?.text ?? '');
    expect(match).not.toBeNull();
    expect(pdf).toContain(`${match?.[1]} payroll line`);
  });
});
