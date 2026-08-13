/**
 * GOLDEN FILES — the same struct still produces the same bytes.
 *
 * AUTHORITY: `ENGINE.md` §25 ("What is NOT in G1: PDF byte comparison. Font metrics
 * and PDF library versions produce byte differences that carry no arithmetic
 * meaning… Geometry is guarded by a SEPARATE visual-regression job over rendered
 * page images and by XSD validation against the pinned CA schema hash — both gate
 * the deploy, neither gates the index"), §27's `RENDER_DIFF`, `ARCHITECTURE.md`
 * §6.1 (E1: a filing regenerated eighteen months later must produce the identical
 * artifact).
 *
 * ===========================================================================
 * WHAT THIS SUITE IS AND IS NOT
 *
 * It is the RENDER_DIFF gate, not G1. A red here means the renderer moved, and that
 * is exactly the question: is the page a customer downloads today the page they
 * downloaded last month? The arithmetic is pinned elsewhere, by the canary, against
 * regulatory oracles; here the input is a frozen struct and the only variable is
 * the composition.
 *
 * A byte comparison is only meaningful because the renderer is deterministic BY
 * CONSTRUCTION: no clock (`generatedAt` arrives on the provenance struct), no
 * randomness (`/ID` is a digest of the body), no compression (Flate output is a
 * function of the zlib build), no locale (money and dates are formatted by integer
 * arithmetic), and no font file (the metrics are in the repo). Each of those is a
 * decision recorded in `pdf/writer.ts`, and each one exists so that this test can
 * be exact rather than approximate.
 *
 * ===========================================================================
 * REGENERATING
 *
 *   RATEPIN_UPDATE_GOLDEN=1 npx vitest run tests/artifacts/golden.test.ts
 *
 * That is a deliberate act, and the diff it produces is the thing to review: a
 * golden file updated without a reader looking at what moved is a test that has
 * been switched off rather than updated.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  ecprFooter,
  projectWh347,
  renderEcprXml,
  renderWh347,
  type EcprRenderInput,
  type Wh347Artifact,
  type Wh347ProjectionInput,
} from '@/artifacts';

import {
  CA_CONTRACTOR,
  CA_IDENTITIES,
  CA_PROJECT,
  CERTIFIABLE_VERDICT,
  DATED_VERDICT,
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

const GOLDEN_DIR = join(dirname(fileURLToPath(import.meta.url)), 'golden');
const UPDATE = process.env['RATEPIN_UPDATE_GOLDEN'] === '1';

function compare(name: string, actual: Uint8Array): void {
  const path = join(GOLDEN_DIR, name);
  if (UPDATE || !existsSync(path)) {
    mkdirSync(GOLDEN_DIR, { recursive: true });
    writeFileSync(path, actual);
    if (!UPDATE) {
      throw new Error(
        `${name} did not exist and has been written. Review it, commit it, and re-run: ` +
          'a golden file that appears on its own asserts nothing.',
      );
    }
    return;
  }
  const expected = readFileSync(path);
  if (Buffer.from(actual).equals(expected)) return;

  // A byte diff on a 25 KB PDF is unreadable, so say WHERE it moved and by how
  // much. The reviewer's next question is always "did the geometry change or did
  // the content change", and the offset answers it.
  const actualBuffer = Buffer.from(actual);
  let offset = 0;
  while (offset < Math.min(actualBuffer.length, expected.length) && actualBuffer[offset] === expected[offset]) {
    offset += 1;
  }
  const window = (buffer: Buffer): string =>
    JSON.stringify(buffer.subarray(Math.max(0, offset - 40), offset + 40).toString('latin1'));
  expect.fail(
    `${name} differs from the golden file.\n` +
      `  golden ${expected.length} bytes, rendered ${actualBuffer.length} bytes\n` +
      `  first difference at byte ${offset}\n` +
      `  golden   …${window(expected)}\n` +
      `  rendered …${window(actualBuffer)}\n` +
      '  If the change is intended: RATEPIN_UPDATE_GOLDEN=1 npx vitest run tests/artifacts/golden.test.ts',
  );
}

function projection(overrides: Partial<Wh347ProjectionInput> = {}): Wh347Artifact {
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
    ...overrides,
  });
}

const ecprInput: EcprRenderInput = {
  contractor: CA_CONTRACTOR,
  project: CA_PROJECT,
  weekEnding: WEEK_ENDING,
  workers: CA_IDENTITIES,
  acknowledgedExclusions: [],
  computation: GOLDEN_COMPUTATION,
  provenance: PROVENANCE,
  // The XML's comment header carries the SAME sentences as the PDF's footer, from
  // the same builder — so the two artifacts of one filing cannot disagree about
  // how old our knowledge is (I6).
  footer: ecprFooter({
    provenance: PROVENANCE,
    computation: GOLDEN_COMPUTATION,
    verdict: CERTIFIABLE_VERDICT,
    bandRecordedOn: PROVENANCE.publishDate,
  }),
  observation: XSD_OBSERVATION_GREEN,
  pinnedSha256: PINNED_XSD_SHA256,
};

describe('the golden payroll week', () => {
  it('renders the certifiable WH-347 byte for byte', () => {
    compare('wh347-certifiable.pdf', renderWh347(projection()).bytes);
  });

  it('renders the dated WH-347 byte for byte — one sentence apart, signature intact', () => {
    compare('wh347-dated.pdf', renderWh347(projection({ verdict: DATED_VERDICT })).bytes);
  });

  it('renders the DRAFT WH-347 byte for byte', () => {
    compare(
      'wh347-draft.pdf',
      renderWh347(
        projection({
          computation: DRAFT_COMPUTATION,
          verdict: DRAFT_VERDICT,
          exceptions: [
            'Line ln_1 — the payroll title on this row is not a classification on wage determination CA20260012 revision 4. Choose from that determination\'s own list; the choice is remembered for every later week.',
          ],
        }),
      ).bytes,
    );
  });

  it('renders the legacy layout byte for byte', () => {
    compare('wh347-legacy.pdf', renderWh347(projection({ layout: 'wh347_legacy' })).bytes);
  });

  it('renders the California eCPR byte for byte', () => {
    const result = renderEcprXml(ecprInput);
    if (!result.ok) throw new Error(`unexpected refusal: ${result.refusal.headline}`);
    compare('ecpr.xml', Buffer.from(result.value.xml, 'utf8'));
  });
});

describe('determinism', () => {
  it('renders the identical bytes twice in the same process', () => {
    const first = renderWh347(projection()).bytes;
    const second = renderWh347(projection()).bytes;
    expect(Buffer.from(first).equals(Buffer.from(second))).toBe(true);
  });

  it('depends on the provenance timestamp, not on the clock', () => {
    const later = renderWh347(
      projection({ provenance: { ...PROVENANCE, generatedAt: new Date('2027-01-01T00:00:00.000Z') } }),
    ).bytes;
    const original = renderWh347(projection()).bytes;
    expect(Buffer.from(later).equals(Buffer.from(original))).toBe(false);
    expect(Buffer.from(later).toString('latin1')).toContain('D:20270101000000Z');
  });

  it('gives the same XML twice', () => {
    const first = renderEcprXml(ecprInput);
    const second = renderEcprXml(ecprInput);
    if (!first.ok || !second.ok) throw new Error('unexpected refusal');
    expect(first.value.xml).toBe(second.value.xml);
  });
});
