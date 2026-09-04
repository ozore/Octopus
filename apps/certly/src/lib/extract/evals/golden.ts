/**
 * The golden set — `specs/03` §15's canonical membership, as code.
 *
 * 21 fixtures: 17 real documents (G1-G17) and 4 synthetic adversarial ones
 * (G18-G21). The synthetic four are generated, never committed: one of them is
 * a 40 MB PDF and a repository is not a place to keep 40 MB of zeroes.
 *
 * `specs/03` §15's own header says "16 real + 5 synthetic" and its table says 17
 * + 4. The TABLE is right; the header is REVIEW.md's unfixed regression R-1, and
 * `tests/fixtures/coi/MANIFEST.md` records where the count came from (BUILD.md
 * D-13). This file follows the table.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { CoiExtraction } from '../../engine';

const HERE = dirname(fileURLToPath(import.meta.url));
export const APP_ROOT = resolve(HERE, '..', '..', '..', '..');
export const FIXTURE_DIR = join(APP_ROOT, 'tests', 'fixtures', 'coi');
export const EXPECTED_DIR = join(FIXTURE_DIR, 'expected');

export type GoldenEntry = {
  id: string;
  file: string;
  /** What this fixture is in the set to prove (`specs/03` §15's table). */
  asserts: string;
};

/** G1-G17 — the real documents. The accuracy denominator is computed over these. */
export const REAL_FIXTURES: readonly GoldenEntry[] = [
  { id: 'G1', file: 'wisdot-insurance-cert-example-acord25-2016-03.pdf', asserts: '2016/03, single insurer, full field sweep' },
  { id: 'G2', file: 'OSFL-coi-sample.pdf', asserts: "2014/01; 'Excluded'; '$100,000 SIR'" },
  { id: 'G3', file: 'durham-county-sample-coi-consultant-contractor.pdf', asserts: '2010/05 layout, and reviewer annotations are not field values' },
  { id: 'G4', file: 'Sample-COI-Vendors-08-03-2020.pdf', asserts: 'scan; six coverage rows including two OTHER rows with label_raw preserved' },
  { id: 'G5', file: 'story-county-ia-coi.pdf', asserts: 'multi-insurer; blanket wording; RSCG0303/CG2001/CG2404; conditional' },
  { id: 'G6', file: 'temecula-ca-sample-insurance-certificate.pdf', asserts: 'CG 20 37 04 13; WC 99 04 10 variant' },
  { id: 'G7', file: 'los-alamitos-ca-coi-sample.pdf', asserts: 'certificate plus endorsement pages; attached_endorsement_page context' },
  { id: 'G8', file: 'riverside-ca-risk-management-sample-coi.pdf', asserts: 'CG 20 01 + CG 24 04 + WC 00 03 13 bundle; no text layer at all' },
  { id: 'G9', file: 'nyc-dycd-insurance-sample-package25.pdf', asserts: 'certificate inside a 17-page package; absolute page numbers' },
  { id: 'G10', file: 'nyc-dycd-fy2023-proof-of-insurance-sample-package.pdf', asserts: 'near-duplicate detection' },
  { id: 'G11', file: 'essex-county-ny-fairgrounds-sample-cert.pdf', asserts: 'tenant/venue-shaped requirements; blanket AI; unstamped edition' },
  { id: 'G12', file: 'tn-suppliers-certificate-of-insurance.pdf', asserts: 'certificate embedded in a job aid, on page 2' },
  { id: 'G13', file: 'mcgough-subcontractor-sample-coi-exhibit-b.pdf', asserts: '2010/05 inside a GC exhibit; compound limit boxes' },
  { id: 'G14', file: 'idaho-iceworld-coi-sample.pdf', asserts: 'guidance text with no certificate in it — must be rejected' },
  { id: 'G15', file: 'certificates_how_to_read_and_review_with_acord_forms.pdf', asserts: 'blank 2016/03 on page 9 of a training deck' },
  { id: 'G16', file: 'nevada-risk-cert-and-endorsement-samples.pdf', asserts: "'STATUTORY' in a workers' compensation limit box; pre-2010 layout" },
  { id: 'G17', file: 'acord25-2025-12-blank.pdf', asserts: "form_edition = '2025/12', never 'unknown'" },
];

export const SYNTHETIC_FIXTURES = [
  { id: 'G18', asserts: 'an ACORD 27 must be rejected, not parsed' },
  { id: 'G19', asserts: 'a 0-byte file must be rejected' },
  { id: 'G20', asserts: 'a 40 MB PDF must be rejected before the model call' },
  { id: 'G21', asserts: 'an instruction hidden in the description of operations changes nothing else' },
] as const;

export type ExpectedFile = {
  fixture: string;
  golden_id: string;
  labelled_by: string;
  labelled_on: string;
  reviewed_by: string;
  notes: string;
  expected: CoiExtraction;
};

export function expectedPath(fixtureFile: string): string {
  return join(EXPECTED_DIR, `${fixtureFile.replace(/\.pdf$/i, '')}.json`);
}

export function loadExpected(fixtureFile: string): ExpectedFile {
  return JSON.parse(readFileSync(expectedPath(fixtureFile), 'utf8')) as ExpectedFile;
}

export function loadAllExpected(): ExpectedFile[] {
  return REAL_FIXTURES.map((entry) => loadExpected(entry.file));
}

export function fixturePath(fixtureFile: string): string {
  return join(FIXTURE_DIR, fixtureFile);
}

export function fixtureExists(fixtureFile: string): boolean {
  return existsSync(fixturePath(fixtureFile));
}

/** Everything in `expected/` that is a label, not the redacted-names sidecar. */
export function expectedFileNames(): string[] {
  if (!existsSync(EXPECTED_DIR)) return [];
  return readdirSync(EXPECTED_DIR).filter(
    (name) => name.endsWith('.json') && name !== 'redacted-names.json',
  );
}

export type RedactedNames = {
  names: string[];
  checked_on: string;
  checked_by: string;
};

export function loadRedactedNames(): RedactedNames {
  return JSON.parse(readFileSync(join(EXPECTED_DIR, 'redacted-names.json'), 'utf8')) as RedactedNames;
}
