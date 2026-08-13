/**
 * SCHEMA PARITY — the .xsd on disk and the string the runtime hashes are one file.
 *
 * `src/artifacts/ecpr/CPR.xsd` is the artifact an operator diffs against the one
 * DIR serves. `src/artifacts/ecpr/xsd.generated.ts` is what the runtime hashes and
 * what the validator reads its rules from, because a bundler that does not trace a
 * `.xsd` out of `src/` would turn a fail-closed schema gate into a missing-file
 * crash at 16:00 on a Friday (`ARCHITECTURE.md` §2.2 factor V: the XSD ships IN THE
 * IMAGE).
 *
 * Two copies of one document is a drift hazard, and this test is the mechanism that
 * removes it: a single byte of difference fails the build, so the two cannot become
 * two different schemas without somebody noticing at the moment they do it.
 */

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { CPR_XSD_TEXT, SHIPPED_XSD_SHA256 } from '@/artifacts';

const XSD_PATH = new URL('../../src/artifacts/ecpr/CPR.xsd', import.meta.url);

describe('the shipped schema', () => {
  const onDisk = readFileSync(XSD_PATH, 'utf8');

  it('is byte-identical to the embedded copy the runtime hashes', () => {
    expect(CPR_XSD_TEXT).toBe(onDisk);
  });

  it('hashes to the digest the module reports', () => {
    const digest = createHash('sha256').update(Buffer.from(onDisk, 'utf8')).digest('hex');
    expect(SHIPPED_XSD_SHA256).toBe(digest);
  });

  it('says in its own header that it is a transcription, not DIR\'s bytes', () => {
    // The one sentence that must never be edited out: presenting our transcription
    // as DIR's file is what would make the L4 gate compare our file to our file.
    expect(onDisk).toContain('This is a TRANSCRIPTION');
    expect(onDisk).toContain('It is NOT a\n  byte copy of that file');
    expect(onDisk).toContain('2ea52e977ab4ac74f7bb99aa9fb7634de8b48db7e090864150428b63c800d01a');
  });

  it('declares every constraint deep dive 04 verified', () => {
    expect(onDisk).toContain('minOccurs="7" maxOccurs="7"');
    expect(onDisk).toContain('maxOccurs="500"');
    expect(onDisk).toContain('<xs:pattern value="[0-9]{9}"/>');
    expect(onDisk).toContain('<xs:pattern value="[0-9]{10}|NA"/>');
    expect(onDisk).toContain('fixed=""');
    expect(onDisk).toContain('numWithholdingExemp');
    expect(onDisk).toContain('deductionsContribPay');
  });
});
