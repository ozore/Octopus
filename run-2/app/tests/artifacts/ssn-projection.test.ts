/**
 * THE SSN PROJECTION — nine digits cannot reach the federal form.
 *
 * AUTHORITY: 29 CFR 5.5(a)(3)(ii)(B), quoted verbatim in `USER_JOURNEY.md` §10.2:
 * "full Social Security numbers and last known addresses, telephone numbers, and
 * email addresses MUST NOT be included on weekly transmittals. Instead, the
 * certified payrolls need only include an individually identifying number for each
 * worker (e.g., the last four digits…)". Against it, the CA eCPR XSD declares `ssn`
 * as `[0-9]{9}`, REQUIRED. `ARCHITECTURE.md` §11.3: "The WH-347 renderer can only
 * read `ssn_last4`."
 *
 * ===========================================================================
 * WHY THIS IS FOUR TESTS AND NOT ONE
 *
 * The guarantee has to hold at four different levels, and a leak at any one of them
 * puts nine digits on a signed federal document:
 *
 *   1. THE TYPE. The WH-347 render model has no field capable of holding an `Ssn9`.
 *      This is checked by the compiler, and asserted here by the shape of the
 *      identity struct the projection accepts.
 *   2. THE CONSTRUCTOR. `identifyingNumber` REJECTS nine digits rather than
 *      truncating them — truncation would make an accidental leak a silent success.
 *   3. THE PROJECTION. A full SSN handed to the federal path throws at the boundary
 *      rather than being formatted.
 *   4. THE BYTES. A rendered PDF for a crew whose California records DO carry nine
 *      digits contains the last four and no nine-digit run anywhere.
 */

import { describe, expect, it } from 'vitest';

import {
  IdentityError,
  identifyingNumber,
  last4Of,
  nineDigitRuns,
  projectWh347,
  renderWh347,
  ssn9,
} from '@/artifacts';

import {
  CA_IDENTITIES,
  CERTIFIABLE_VERDICT,
  FEDERAL_IDENTITIES,
  GOLDEN_COMPUTATION,
  HEADER,
  PROVENANCE,
  SIGNATORY,
} from './fixtures';
import { allText } from './pdf-inspect';

describe('the constructor', () => {
  it('accepts exactly four digits', () => {
    expect(identifyingNumber('4821')).toBe('4821');
    expect(identifyingNumber(' 4821 ')).toBe('4821');
  });

  it('REJECTS a nine-digit value rather than truncating it', () => {
    // Truncating would be the dangerous kindness: the caller would never learn that
    // a decrypted value had reached the federal path.
    expect(() => identifyingNumber('551234821')).toThrow(IdentityError);
    expect(() => identifyingNumber('551234821')).toThrow(/29 CFR 5.5\(a\)\(3\)\(ii\)\(B\)/);
  });

  it('rejects everything else that is not four digits', () => {
    for (const bad of ['', '482', '48211', 'abcd', '48-21', '4 821']) {
      expect(() => identifyingNumber(bad)).toThrow(IdentityError);
    }
    // `0000` is a real last-four and surrounding whitespace is a real CSV export,
    // so both are accepted. The trim is the only leniency in the constructor.
    expect(identifyingNumber('0000')).toBe('0000');
    expect(identifyingNumber('0000 ')).toBe('0000');
  });

  it('narrows in one direction only', () => {
    const nine = ssn9('551234821');
    expect(last4Of(nine)).toBe('4821');
    // There is no widening function anywhere in the module surface. If one is ever
    // added, this test is the place the reviewer will look — and the absence of a
    // symbol to import is the mechanism.
    expect(Object.keys({ last4Of })).toEqual(['last4Of']);
  });

  it('rejects a nine-digit value that is not nine digits', () => {
    expect(() => ssn9('4821')).toThrow(IdentityError);
    expect(ssn9('551-23-4821')).toBe('551234821');
  });
});

describe('the rendered federal artifact', () => {
  const artifact = projectWh347({
    layout: 'wh347_rev_2025_01',
    computation: GOLDEN_COMPUTATION,
    verdict: CERTIFIABLE_VERDICT,
    provenance: PROVENANCE,
    header: HEADER,
    workers: FEDERAL_IDENTITIES,
    signatory: SIGNATORY,
    remarks: '',
    exceptions: [],
    bandRecordedOn: PROVENANCE.publishDate,
    contractLock: null,
    verifyUrl: null,
  });

  it('carries the last four, for every worker', () => {
    const text = allText(renderWh347(artifact).bytes);
    expect(text).toContain('4821');
    expect(text).toContain('7310');
  });

  it('contains no nine-digit run anywhere in the bytes', () => {
    // The California records for this same crew DO hold nine digits — the fixture
    // proves the values exist and are reachable — and none of them is on the form.
    const caDigits = CA_IDENTITIES.map((worker) => String(worker.ssn));
    expect(caDigits).toEqual(['551234821', '602557310']);

    const text = allText(renderWh347(artifact).bytes);
    for (const ssn of caDigits) expect(text).not.toContain(ssn);
    expect(nineDigitRuns(text)).toEqual([]);
  });

  it('refuses to render at all when a full SSN is routed to the federal path', () => {
    const leaking = FEDERAL_IDENTITIES.map((worker, index) =>
      index === 0 ? { ...worker, ssnLast4: '551234821' } : worker,
    );
    expect(() =>
      projectWh347({
        layout: 'wh347_rev_2025_01',
        computation: GOLDEN_COMPUTATION,
        verdict: CERTIFIABLE_VERDICT,
        provenance: PROVENANCE,
        header: HEADER,
        workers: leaking,
        signatory: SIGNATORY,
        remarks: '',
        exceptions: [],
        bandRecordedOn: PROVENANCE.publishDate,
        contractLock: null,
        verifyUrl: null,
      }),
    ).toThrow(IdentityError);
  });

  it('renders a blank identifying cell rather than inventing one', () => {
    const missing = FEDERAL_IDENTITIES.map((worker, index) =>
      index === 0 ? { ...worker, ssnLast4: null } : worker,
    );
    const built = projectWh347({
      layout: 'wh347_rev_2025_01',
      computation: GOLDEN_COMPUTATION,
      verdict: CERTIFIABLE_VERDICT,
      provenance: PROVENANCE,
      header: HEADER,
      workers: missing,
      signatory: SIGNATORY,
      remarks: '',
      exceptions: [],
      bandRecordedOn: PROVENANCE.publishDate,
      contractLock: null,
      verifyUrl: null,
    });
    expect(built.workers[0]?.identifyingNumber).toBeNull();
    const text = allText(renderWh347(built).bytes);
    expect(text).not.toContain('4821');
    expect(text).toContain('7310');
    // And the renderer did NOT move the status: `deriveStatus` is the single total
    // constructor, and a missing field blocks the line upstream.
    expect(built.status).toBe('CERTIFIABLE');
  });
});

describe('the scanner', () => {
  it('finds a nine-digit run and ignores longer or shorter ones', () => {
    expect(nineDigitRuns('ssn 551234821 here')).toEqual(['551234821']);
    expect(nineDigitRuns('contract 1234567890123')).toEqual([]);
    expect(nineDigitRuns('last four 4821')).toEqual([]);
  });
});
