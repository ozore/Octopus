/**
 * THE CALIFORNIA eCPR — the pinned schema, the fail-closed gate, and the four
 * constraints deep dive 04 verified against DIR's own file.
 *
 * AUTHORITY: `ARCHITECTURE.md` ADR-009 and §8.1 L4, `USER_JOURNEY.md` §10,
 * `CORPUS_DESIGN.md` §12.4, deep dive 04 §1.6.
 *
 * The load-bearing test in this file is `blocks the XML and ONLY the XML`. L4 is
 * the single place in the whole product where output is blocked, and the only row
 * in `CORPUS_LADDER` with `blocksEcprGeneration: true` — while
 * `blocksFilingOnPinnedProject` is `false` on every row without exception. A
 * regression that let a schema change touch the federal path would be invisible
 * until a customer could not file on a Friday.
 */

import { describe, expect, it } from 'vitest';

import {
  DIR_PUBLISHED_XSD_BYTES,
  DIR_PUBLISHED_XSD_SHA256,
  GENERATED_NOT_ACCEPTANCE_TESTED,
  SCHEMA_CONSTRAINTS,
  SHIPPED_XSD_SHA256,
  checkXsdPin,
  constraintsEnforced,
  projectWh347,
  renderEcprXml,
  renderWh347,
  validateEcpr,
  type EcprRenderInput,
  type XmlElement,
} from '@/artifacts';
import { sha256Hex } from '@/lib/types';

import {
  CA_CONTRACTOR,
  CA_IDENTITIES,
  CA_PROJECT,
  CERTIFIABLE_VERDICT,
  FEDERAL_IDENTITIES,
  GOLDEN_COMPUTATION,
  HEADER,
  PINNED_XSD_SHA256,
  PROVENANCE,
  SIGNATORY,
  WEEK_ENDING,
  WORKER_1,
  XSD_OBSERVATION_GREEN,
} from './fixtures';
import { allText } from './pdf-inspect';
import { parseXml } from './xml-parse';

function input(overrides: Partial<EcprRenderInput> = {}): EcprRenderInput {
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

describe('the pinned schema', () => {
  it('records DIR\'s digest and our transcription\'s digest as different things', () => {
    // The failure this prevents is a green gate that compared our file to our file.
    expect(SHIPPED_XSD_SHA256).not.toBe(DIR_PUBLISHED_XSD_SHA256);
    expect(DIR_PUBLISHED_XSD_SHA256).toBe(
      '2ea52e977ab4ac74f7bb99aa9fb7634de8b48db7e090864150428b63c800d01a',
    );
    expect(DIR_PUBLISHED_XSD_BYTES).toBe(49_325);
  });

  it('extracts the verified constraints from the schema text rather than restating them', () => {
    expect(SCHEMA_CONSTRAINTS.dayMinOccurs).toBe(7);
    expect(SCHEMA_CONSTRAINTS.dayMaxOccurs).toBe(7);
    expect(SCHEMA_CONSTRAINTS.employeeMaxOccurs).toBe(500);
    expect(SCHEMA_CONSTRAINTS.ssnPattern).toBe('[0-9]{9}');
    expect(SCHEMA_CONSTRAINTS.pwcrPattern).toBe('[0-9]{10}|NA');
    expect(SCHEMA_CONSTRAINTS.feinPattern).toBe('[0-9]{9}');
    expect(SCHEMA_CONSTRAINTS.licenseTypes).toEqual(['CSLB', 'PL', 'OTHER']);
    expect([...SCHEMA_CONSTRAINTS.fixedEmptyElements].sort()).toEqual(['amendmentNum', 'payrollNum']);
    // The version attribute says 1.0 while DIR publishes the schema as V1.3, which
    // is precisely why the pin is a content hash.
    expect(SCHEMA_CONSTRAINTS.schemaVersion).toBe('1.0');
  });

  it('states the rules it enforces instead of claiming full XSD validation', () => {
    expect(constraintsEnforced.length).toBeGreaterThan(5);
    expect(constraintsEnforced.join(' ')).toContain('at most 500');
  });
});

describe('the fail-closed hash gate (L4)', () => {
  it('passes when the observed digest equals the pinned digest', () => {
    const result = checkXsdPin(PINNED_XSD_SHA256, XSD_OBSERVATION_GREEN);
    expect(result.ok).toBe(true);
  });

  it('refuses with P-B, names XSD_HASH_MISMATCH, and shows a diff', () => {
    const result = checkXsdPin(PINNED_XSD_SHA256, {
      ...XSD_OBSERVATION_GREEN,
      sha256: sha256Hex('ff'.repeat(32)),
      byteLength: 49_400,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.refusal.primitive).toBe('P-B');
    if (result.refusal.primitive !== 'P-B') throw new Error('unreachable');
    expect(result.refusal.blockReasons).toEqual(['XSD_HASH_MISMATCH']);
    expect(result.refusal.exceptionReport.join('\n')).toContain(PINNED_XSD_SHA256);
    expect(result.refusal.exceptionReport.join('\n')).toContain('ff'.repeat(32));
    // A3: the refusal explains and offers nobody to ask.
    const prose = `${result.refusal.headline} ${result.refusal.detail}`.toLowerCase();
    for (const forbidden of ['contact', 'support', 'get back to you', 'email us', 'ticket']) {
      expect(prose).not.toContain(forbidden);
    }
    expect(result.refusal.detail).toContain('WH-347 PDF is unaffected');
  });

  it('produces a line-level diff when the probe stored the bytes', () => {
    const result = checkXsdPin(PINNED_XSD_SHA256, {
      ...XSD_OBSERVATION_GREEN,
      sha256: sha256Hex('ab'.repeat(32)),
      text: '<?xml version="1.0" encoding="UTF-8"?>\n<xs:schema>changed</xs:schema>\n',
    });
    if (result.ok) throw new Error('unreachable');
    if (result.refusal.primitive !== 'P-B') throw new Error('unreachable');
    expect(result.refusal.exceptionReport.some((line) => line.startsWith('+ '))).toBe(true);
  });

  it('blocks the XML and ONLY the XML — the federal path still renders in full', () => {
    const red = renderEcprXml(
      input({ observation: { ...XSD_OBSERVATION_GREEN, sha256: sha256Hex('ff'.repeat(32)) } }),
    );
    expect(red.ok).toBe(false);

    const pdf = renderWh347(
      projectWh347({
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
      }),
    );
    expect(pdf.pageCount).toBe(2);
    expect(allText(pdf.bytes)).toContain('SIGNATURE');
    expect(allText(pdf.bytes)).not.toContain('DRAFT');
  });
});

describe('the emitted document', () => {
  const artifact = () => {
    const result = renderEcprXml(input());
    if (!result.ok) throw new Error(`unexpected refusal: ${result.refusal.headline}`);
    return result.value;
  };

  it('round-trips: the SERIALIZED file, read back, still validates against the checked-in XSD', () => {
    // The writer validates the tree it built. This validates the BYTES — an
    // escaping bug or a mis-nested element would pass the first check and fail
    // DIR's parser, which is the failure we cannot observe (G2).
    const parsed = parseXml(artifact().xml);
    const validation = validateEcpr(parsed);
    expect(validation.violations).toEqual([]);
    expect(validation.ok).toBe(true);
    expect(validation.rulesApplied.length).toBeGreaterThan(5);
    expect(artifact().employeeCount).toBe(2);
  });

  it('declares the schema namespace on the document element', () => {
    const parsed = parseXml(artifact().xml);
    expect(parsed.name).toBe('eCPR');
    expect(parsed.attributes?.['xmlns']).toBe(SCHEMA_CONSTRAINTS.targetNamespace);
  });

  it('emits exactly seven day elements per employee', () => {
    const xml = artifact().xml;
    const perEmployee = xml.split('<employee>').slice(1);
    expect(perEmployee.length).toBe(2);
    for (const chunk of perEmployee) {
      expect(chunk.match(/<day>/g)?.length).toBe(7);
    }
    expect(xml).toContain('<date>2026-08-02</date>');
    expect(xml).toContain('<date>2026-08-08</date>');
  });

  it('emits nine-digit SSNs — California only', () => {
    const xml = artifact().xml;
    expect(xml).toContain('<ssn>551234821</ssn>');
    expect(xml).toContain('<ssn>602557310</ssn>');
    expect(xml).toContain('<name id="551234821::DOE, JANE, M">Doe, Jane, M</name>');
  });

  it('emits payrollNum and amendmentNum EMPTY, because DIR auto-increments them', () => {
    const xml = artifact().xml;
    expect(xml).toContain('<payrollNum></payrollNum>');
    expect(xml).toContain('<amendmentNum></amendmentNum>');
    expect(xml).not.toMatch(/<payrollNum>[^<]/);
    expect(xml).not.toMatch(/<payrollNum\/>/);
  });

  it('carries the provenance and the G2 label in its own comment header', () => {
    const xml = artifact().xml;
    expect(xml).toContain(GENERATED_NOT_ACCEPTANCE_TESTED);
    expect(xml).toContain(`Schema ${PINNED_XSD_SHA256}`);
    expect(artifact().acceptanceLabel).toBe(GENERATED_NOT_ACCEPTANCE_TESTED);
  });

  it('removes the label only when the G2 counter says so', () => {
    const result = renderEcprXml(input({ g2Cleared: true }));
    if (!result.ok) throw new Error('unexpected refusal');
    expect(result.value.acceptanceLabel).toBeNull();
    expect(result.value.xml).not.toContain(GENERATED_NOT_ACCEPTANCE_TESTED);
  });

  it('reconciles the deduction total exactly, with the balance explained', () => {
    const xml = artifact().xml;
    // Worker 1: $84.25 statutory + $5.00 charitable = $89.25, none of which maps to
    // a California element without a split, so the whole amount lands in `other`
    // and the note names the 29 CFR 3.5 paragraphs behind it.
    expect(xml).toContain('<other>89.25</other>');
    expect(xml).toContain('<total>89.25</total>');
    expect(xml).toContain('29 CFR 3.5(a)');
    expect(xml).toContain('29 CFR 3.5(g)');
  });

  it('places the split in the named elements when the payroll input carried one', () => {
    const workers = CA_IDENTITIES.map((worker) =>
      String(worker.workerRef) === String(WORKER_1)
        ? {
            ...worker,
            deductionSplit: { fedTax: 5_000 as never, fica: 3_425 as never },
          }
        : worker,
    );
    const result = renderEcprXml(input({ workers }));
    if (!result.ok) throw new Error('unexpected refusal');
    expect(result.value.xml).toContain('<fedTax>50.00</fedTax>');
    expect(result.value.xml).toContain('<FICA>34.25</FICA>');
    expect(result.value.xml).toContain('<other>5.00</other>');
    expect(result.value.xml).toContain('<total>89.25</total>');
  });
});

describe('per-worker eligibility', () => {
  it('blocks the file when a worker has no SSN and the exclusion was not acknowledged', () => {
    const workers = CA_IDENTITIES.map((worker, index) => (index === 0 ? { ...worker, ssn: null } : worker));
    const result = renderEcprXml(input({ workers }));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    if (result.refusal.primitive !== 'P-B') throw new Error('unreachable');
    expect(result.refusal.exceptionReport.join(' ')).toContain('Doe, Jane');
    expect(result.refusal.detail).toContain('WH-347 PDF is unaffected');
  });

  it('omits the worker when the exclusion IS acknowledged, and records the omission', () => {
    const workers = CA_IDENTITIES.map((worker, index) => (index === 0 ? { ...worker, ssn: null } : worker));
    const result = renderEcprXml(input({ workers, acknowledgedExclusions: [WORKER_1] }));
    if (!result.ok) throw new Error(`unexpected refusal: ${result.refusal.headline}`);
    expect(result.value.employeeCount).toBe(1);
    expect(result.value.excluded).toHaveLength(1);
    expect(result.value.xml).toContain('Excluded by explicit acknowledgement: Doe, Jane');
    expect(result.value.xml).not.toContain('551234821');
  });

  it('blocks a worker California cannot represent, and says why without inventing a rate', () => {
    const twoLines = {
      ...GOLDEN_COMPUTATION,
      workers: GOLDEN_COMPUTATION.workers.map((worker, index) =>
        index === 0
          ? { ...worker, lines: [...worker.lines, ...worker.lines] }
          : worker,
      ),
    };
    const result = renderEcprXml(input({ computation: twoLines }));
    if (result.ok) throw new Error('expected a refusal');
    if (result.refusal.primitive !== 'P-B') throw new Error('unreachable');
    expect(result.refusal.exceptionReport.join(' ')).toContain('one classification and one hourly rate');
    expect(result.refusal.exceptionReport.join(' ')).toContain('does not invent a blended rate');
  });

  it('declines the 500-employee ceiling rather than inventing a splitting scheme', () => {
    const base = GOLDEN_COMPUTATION.workers[1];
    if (base === undefined) throw new Error('fixture');
    const many = {
      ...GOLDEN_COMPUTATION,
      workers: Array.from({ length: 501 }, (_, index) => ({
        ...base,
        workerRef: `${base.workerRef}_${index}` as typeof base.workerRef,
      })),
    };
    const identity = CA_IDENTITIES[1];
    if (identity === undefined) throw new Error('fixture');
    const workers = many.workers.map((worker) => ({ ...identity, workerRef: worker.workerRef }));
    const result = renderEcprXml(input({ computation: many, workers }));
    if (result.ok) throw new Error('expected a refusal');
    expect(result.refusal.primitive).toBe('P-D');
    if (result.refusal.primitive !== 'P-D') throw new Error('unreachable');
    expect(result.refusal.rule).toContain('maxOccurs="500"');
    expect(result.refusal.declined).toContain('DIR has not documented');
  });
});

describe('the validator', () => {
  const document = (): XmlElement => ({
    name: 'eCPR',
    children: [
      {
        name: 'cprInfo',
        children: [
          { name: 'contractorPWCR', text: 'NOT-A-PWCR' },
          { name: 'contractorFEIN', text: '12345' },
          { name: 'licenseType', text: 'BOGUS' },
          { name: 'payrollNum', text: '7' },
        ],
      },
      { name: 'employees', children: [] },
    ],
  });

  it('quotes the schema rule for every violation', () => {
    const result = validateEcpr(document());
    expect(result.ok).toBe(false);
    const rules = result.violations.map((violation) => violation.rule).join(' ');
    expect(rules).toContain('[0-9]{10}|NA');
    expect(rules).toContain('[0-9]{9}');
    expect(rules).toContain('CSLB');
    expect(rules).toContain('fixed=""');
    for (const violation of result.violations) {
      expect(violation.path.length).toBeGreaterThan(0);
      expect(violation.found.length).toBeGreaterThan(0);
    }
  });

  it('rejects an amendmentNum that is present but not empty', () => {
    const result = validateEcpr(document());
    expect(result.violations.some((violation) => violation.path.endsWith('amendmentNum'))).toBe(true);
  });
});
