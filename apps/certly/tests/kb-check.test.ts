/**
 * `kb:check` runs in the suite as well as from the command line, so that a
 * template edit that breaks a source URL or a schema drift on the form edition
 * fails `npm test` rather than waiting for somebody to remember the script.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { runKbCheck } from '../src/scripts/kb-check';

const FIXTURES = join(import.meta.dirname, 'fixtures', 'coi');

describe('kb:check', () => {
  const report = runKbCheck(new Date('2026-09-03T00:00:00Z'));

  it('passes with no failures', () => {
    expect(report.failures, report.failures.join('\n')).toEqual([]);
  });

  it('reports both unverified templates as notes rather than hiding them', () => {
    expect(report.notes.some((note) => note.startsWith('pm.snow'))).toBe(true);
    expect(report.notes.some((note) => note.startsWith('tenant.retail_food'))).toBe(true);
  });

  it('has the whole golden set on disk, labelled, with nothing pending', () => {
    // Both of these were open when the check was written: G17 was a URL in the
    // manifest, and no fixture had an expected-value file. Both are done, so
    // the notes that reported them must be gone. `report.failures` being empty
    // above is what proves the labelling is COMPLETE: once one expected-value
    // file exists, `kb:check` turns every unlabelled fixture into a failure.
    expect(report.notes.some((note) => note.includes('PENDING'))).toBe(false);
    expect(report.notes.some((note) => note.includes('NOT LABELLED'))).toBe(false);
  });

  it('warns on a template source older than 180 days, without failing the build', () => {
    // Every source is dated 2026-09-03, so a year later they are all stale —
    // and `kb:check` must still exit 0, because KB §E's rule is a visible date,
    // not a blocked deploy.
    const future = runKbCheck(new Date('2027-09-03T00:00:00Z'));
    expect(future.failures).toEqual([]);
    expect(future.warnings.length).toBeGreaterThan(0);
    expect(future.warnings[0]).toContain('last checked');
  });
});

describe('the golden-set fixtures are actually here', () => {
  const files = [
    'wisdot-insurance-cert-example-acord25-2016-03.pdf',
    'story-county-ia-coi.pdf',
    'OSFL-coi-sample.pdf',
    'nevada-risk-cert-and-endorsement-samples.pdf',
  ];

  it('copied the corpus, and each file is a real PDF', () => {
    for (const name of files) {
      const path = join(FIXTURES, name);
      expect(existsSync(path), `${name} is missing`).toBe(true);
      expect(readFileSync(path).subarray(0, 4).toString('latin1')).toBe('%PDF');
    }
  });

  it('carries the licence and personal-data rules next to the bytes', () => {
    const manifest = readFileSync(join(FIXTURES, 'MANIFEST.md'), 'utf8');
    expect(manifest).toContain('ACORD');
    expect(manifest).toContain('may not');
    expect(manifest).toContain('UNVERIFIED');
    expect(manifest).toContain('Certly-authored fixture');
  });

  it('tells the labelling agent what an expected-value file looks like', () => {
    const readme = readFileSync(join(FIXTURES, 'expected', 'README.md'), 'utf8');
    expect(readme).toContain('coi.v1');
    expect(readme).toContain('labelled_by');
    expect(readme).toContain('reviewed_by');
    expect(readme).toContain('redacted-names.json');
    expect(readme).toContain('N_ship');
  });
});
