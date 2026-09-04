/**
 * M5 GOLDEN TESTS — `specs/05` §8 acceptance criteria, one describe per
 * criterion, in the spec's own order and with the spec's own numbers.
 *
 * These were written FROM THE SPEC BEFORE THE ENGINE, which is why the
 * explanation strings are asserted verbatim rather than by regex: A1 and A3
 * publish exact sentences, and a sentence the customer forwards to their owner
 * is part of the contract, not an implementation detail.
 */
import { describe, expect, it } from 'vitest';

import { compare, ENGINE_VERSION } from '../../src/lib/engine';
import {
  coverage,
  extraction,
  FAR_EXPIRY,
  limit,
  mention,
  ORG,
  requirement,
  requirementSet,
  TODAY,
  VENDOR,
} from './fixtures';

const run = (extractionValue: Parameters<typeof compare>[0]['extraction'], requirements: ReturnType<typeof requirement>[], evaluationDate = TODAY) =>
  compare({
    extraction: extractionValue,
    requirementSet: requirementSet(requirements),
    evaluationDate,
    vendor: VENDOR,
    org: ORG,
  });

const glLimit = (amount: number) =>
  requirement({
    kind: 'limit',
    coverage: 'general_liability',
    limitLabel: 'each_occurrence',
    minAmount: amount,
    sortOrder: 1,
  });

describe('A1 — a limit that meets the requirement', () => {
  it('is `met`, and the explanation prints both numbers in the spec’s words', () => {
    const result = run(
      extraction({
        coverages: [coverage('general_liability', { limits: [limit('each_occurrence', 1_000_000)], exp: FAR_EXPIRY })],
      }),
      [glLimit(1_000_000)],
    );
    const row = result.results.find((r) => r.requirementId.startsWith('req_'));
    expect(row?.state).toBe('met');
    expect(row?.explanation).toBe(
      'General liability each occurrence is $1,000,000; you require $1,000,000.',
    );
    expect(row?.statusState).toBe('meets');
  });
});

describe('A2 — a limit below the requirement', () => {
  it('is `gap`, with both numbers in the explanation', () => {
    const result = run(
      extraction({
        coverages: [coverage('general_liability', { limits: [limit('each_occurrence', 500_000)], exp: FAR_EXPIRY })],
      }),
      [glLimit(1_000_000)],
    );
    const row = result.results.find((r) => r.requirementId.startsWith('req_'));
    expect(row?.state).toBe('gap');
    expect(row?.explanation).toContain('$500,000');
    expect(row?.explanation).toContain('$1,000,000');
    expect(result.status).toBe('gap');
  });
});

describe('A3 — a ticked ADDL INSD column with no endorsement page', () => {
  it('is `asserted_only`, with the spec’s exact sentence', () => {
    const result = run(
      extraction({
        coverages: [coverage('general_liability', { addlInsd: 'Y', exp: FAR_EXPIRY, limits: [limit('each_occurrence', 1_000_000)] })],
      }),
      [
        requirement({
          kind: 'endorsement',
          endorsementKey: 'additional_insured_ongoing',
          acceptsForms: ['CG 20 10'],
          sortOrder: 1,
        }),
      ],
    );
    const row = result.results.find((r) => r.requirementId.startsWith('req_'));
    expect(row?.state).toBe('asserted_only');
    expect(row?.explanation).toBe(
      'The certificate says additional insured, but no endorsement page was provided. ' +
        'A statement on a certificate does not confer additional-insured status.',
    );
    expect(result.status).toBe('asserted_only');
  });
});

describe('A4 — the same requirement with the endorsement page attached', () => {
  it('is `met`', () => {
    const result = run(
      extraction({
        coverages: [coverage('general_liability', { addlInsd: 'Y', exp: FAR_EXPIRY })],
        forms: [mention('CG 20 10 04 13', 'attached_endorsement_page')],
      }),
      [
        requirement({
          kind: 'endorsement',
          endorsementKey: 'additional_insured_ongoing',
          acceptsForms: ['CG 20 10'],
          sortOrder: 1,
        }),
      ],
    );
    const row = result.results.find((r) => r.requirementId.startsWith('req_'));
    expect(row?.state).toBe('met');
    expect(row?.foundForm).toBe('CG 20 10 04 13');
  });
});

describe('A5 — corpus C2’s shape: Y in both columns, forms only in Description of Operations', () => {
  /**
   * Modelled on `story-county-ia-coi.pdf` (C2) as `kb-samples/MANIFEST.md` and
   * `KNOWLEDGE_BASE.md` §C.5 describe it: three insurers, `Y` in ADDL INSD and
   * SUBR WVD, and `RSCG0303`, `CG2001`, `CG2404` named ONLY in the free-text
   * box, all conditionally. The assertion against the real bytes belongs to the
   * golden set (`specs/03` §15, G5) and lands with the labelling pass.
   */
  const c2 = extraction({
    coverages: [
      coverage('general_liability', {
        addlInsd: 'Y',
        subrWvd: 'Y',
        exp: FAR_EXPIRY,
        limits: [limit('each_occurrence', 1_000_000), limit('general_aggregate', 2_000_000)],
      }),
    ],
    descriptionOfOperations:
      'The certificate holder is an additional insured, where required by written contract or agreement, ' +
      'subject to the provisions and limitations of form RSCG0303. The General Liability policy is primary ' +
      'as per Form CG2001 and the General Liability policy contains CG2404.',
    forms: [
      mention('RSCG0303', 'description_of_operations', true),
      mention('CG2001', 'description_of_operations', true),
      mention('CG2404', 'description_of_operations', true),
    ],
  });

  const requirements = [
    requirement({ kind: 'endorsement', endorsementKey: 'additional_insured_ongoing', acceptsForms: ['CG 20 10', 'CG 20 33'], sortOrder: 1, id: 'req_ai' }),
    requirement({ kind: 'endorsement', endorsementKey: 'primary_non_contributory', acceptsForms: ['CG 20 01'], sortOrder: 2, id: 'req_pnc' }),
    requirement({ kind: 'endorsement', endorsementKey: 'waiver_of_subrogation_gl', acceptsForms: ['CG 24 04', 'CG 24 53'], sortOrder: 3, id: 'req_wos' }),
  ];

  it('marks all three `asserted_only`', () => {
    const result = run(c2, requirements);
    const states = result.results.filter((r) => r.origin === 'requirement').map((r) => r.state);
    expect(states).toEqual(['asserted_only', 'asserted_only', 'asserted_only']);
  });

  it('names RSCG0303, CG 20 01 and CG 24 04 respectively', () => {
    const result = run(c2, requirements);
    const byId = Object.fromEntries(result.results.map((r) => [r.requirementId, r]));
    expect(byId['req_ai']?.explanation).toContain('RSCG0303');
    expect(byId['req_pnc']?.explanation).toContain('CG 20 01');
    expect(byId['req_wos']?.explanation).toContain('CG 24 04');
  });

  it('flags each one conditional', () => {
    const result = run(c2, requirements);
    for (const row of result.results.filter((r) => r.origin === 'requirement')) {
      expect(row.conditional).toBe(true);
      expect(row.explanation).toContain('conditionally');
    }
  });

  it('does not credit the additional-insured row with another row’s form', () => {
    const result = run(c2, requirements);
    const ai = result.results.find((r) => r.requirementId === 'req_ai');
    expect(ai?.explanation).not.toContain('CG 20 01');
    expect(ai?.explanation).not.toContain('CG 24 04');
  });
});

describe('A6 — a combinable limit met by GL plus umbrella', () => {
  it('is `met`, and the explanation names both policies', () => {
    const result = run(
      extraction({
        coverages: [
          coverage('general_liability', { limits: [limit('each_occurrence', 1_000_000)], exp: FAR_EXPIRY }),
          coverage('umbrella_liability', { limits: [limit('umbrella_each_occurrence', 4_000_000)], exp: FAR_EXPIRY }),
        ],
      }),
      [
        requirement({
          kind: 'limit',
          coverage: 'general_liability',
          limitLabel: 'each_occurrence',
          minAmount: 5_000_000,
          combinable: true,
          sortOrder: 1,
        }),
      ],
    );
    const row = result.results.find((r) => r.requirementId.startsWith('req_'));
    expect(row?.state).toBe('met');
    expect(row?.explanation).toContain('general liability $1,000,000');
    expect(row?.explanation).toContain('umbrella liability $4,000,000');
    expect(row?.explanation).toContain('$5,000,000 together');
  });

  it('does not combine when the requirement is not `combinable`', () => {
    const result = run(
      extraction({
        coverages: [
          coverage('general_liability', { limits: [limit('each_occurrence', 1_000_000)], exp: FAR_EXPIRY }),
          coverage('umbrella_liability', { limits: [limit('umbrella_each_occurrence', 4_000_000)], exp: FAR_EXPIRY }),
        ],
      }),
      [glLimit(5_000_000)],
    );
    expect(result.results.find((r) => r.requirementId.startsWith('req_'))?.state).toBe('gap');
  });
});

describe('A7 — a limit box that is not a number', () => {
  for (const raw of ['Excluded', 'STATUTORY', '$100,000 SIR']) {
    it(`is \`undetermined\` for a limit box printed “${raw}” — never gap, never met`, () => {
      const result = run(
        extraction({
          coverages: [coverage('general_liability', { limits: [limit('each_occurrence', null, raw)], exp: FAR_EXPIRY })],
        }),
        [glLimit(1_000_000)],
      );
      const row = result.results.find((r) => r.requirementId.startsWith('req_'));
      expect(row?.state).toBe('undetermined');
      expect(row?.statusState).toBe('needs_review');
      expect(row?.explanation).toContain(raw);
      expect(result.undeterminedCount).toBeGreaterThan(0);
    });
  }
});

describe('A8 — the named-insured match', () => {
  it('is `met` for “ACME ROOFING, INC.” against vendor “Acme Roofing Inc”', () => {
    const result = compare({
      extraction: extraction({ insuredName: 'ACME ROOFING, INC.' }),
      requirementSet: requirementSet([]),
      evaluationDate: TODAY,
      vendor: { name: 'Acme Roofing Inc' },
      org: ORG,
    });
    expect(result.results.find((r) => r.requirementId === 'check:name')?.state).toBe('met');
  });

  it('is `undetermined` — never a pass, never a gap — for “Acme Roofing of Texas LLC”', () => {
    const result = compare({
      extraction: extraction({ insuredName: 'Acme Roofing of Texas LLC' }),
      requirementSet: requirementSet([]),
      evaluationDate: TODAY,
      vendor: { name: 'Acme Roofing Inc' },
      org: ORG,
    });
    const row = result.results.find((r) => r.requirementId === 'check:name');
    expect(row?.state).toBe('undetermined');
    expect(row?.statusState).toBe('needs_review');
  });
});

describe('A9 — a required coverage that expired yesterday', () => {
  it('makes the vendor status `expired`, which paints in the gap ramp with its own word', () => {
    const result = run(
      extraction({
        coverages: [coverage('general_liability', { limits: [limit('each_occurrence', 1_000_000)], exp: '2026-05-31' })],
      }),
      [glLimit(1_000_000)],
      '2026-06-01',
    );
    expect(result.status).toBe('expired');
    expect(result.statusState).toBe('gap');
    expect(result.statusWord).toBe('Expired');
  });
});

describe('A10 — a carrier-rating requirement', () => {
  it('is `not_checked` and says so in those words', () => {
    const result = run(
      extraction({ coverages: [coverage('general_liability', { exp: FAR_EXPIRY })] }),
      [
        requirement({
          kind: 'carrier',
          condition: { amBestMin: 'A-', financialSizeMin: 'VIII' },
          sortOrder: 1,
        }),
      ],
    );
    const row = result.results.find((r) => r.requirementId.startsWith('req_'));
    expect(row?.state).toBe('not_checked');
    expect(row?.statusState).toBe('not_checked');
    expect(row?.explanation).toContain('not checked by Certly');
    expect(result.notCheckedCount).toBe(1);
  });

  it('never folds a not_checked row into the green count', () => {
    const result = run(
      extraction({ coverages: [coverage('general_liability', { exp: FAR_EXPIRY })] }),
      [requirement({ kind: 'carrier', condition: { amBestMin: 'A-' }, sortOrder: 1 })],
    );
    expect(result.metCount).not.toBe(result.results.length);
  });
});

describe('A11 — determinism', () => {
  // ONE extraction, ONE requirement set, evaluated twice — which is what A11
  // actually says: the same (extractionId, requirementSetVersion,
  // engineVersion, evaluationDate) run twice.
  const payload = extraction({
    coverages: [
      coverage('general_liability', {
        addlInsd: 'Y',
        exp: FAR_EXPIRY,
        limits: [limit('each_occurrence', 1_000_000), limit('general_aggregate', 2_000_000)],
      }),
      coverage('workers_compensation', { exp: FAR_EXPIRY, limits: [limit('el_each_accident', 1_000_000)] }),
    ],
    forms: [mention('CG 20 01', 'description_of_operations', true)],
  });
  const set = requirementSet([
    glLimit(1_000_000),
    requirement({ kind: 'coverage_present', coverage: 'workers_compensation', sortOrder: 2 }),
    requirement({ kind: 'endorsement', endorsementKey: 'primary_non_contributory', acceptsForms: ['CG 20 01'], sortOrder: 3 }),
    requirement({ kind: 'carrier', condition: { amBestMin: 'A-' }, sortOrder: 4 }),
  ]);
  const build = () =>
    compare({ extraction: payload, requirementSet: set, evaluationDate: TODAY, vendor: VENDOR, org: ORG });

  it('produces byte-identical output for the same inputs', () => {
    expect(JSON.stringify(build())).toBe(JSON.stringify(build()));
  });

  it('stamps the engine version and the requirement-set version on the result', () => {
    expect(build().engineVersion).toBe(ENGINE_VERSION);
    expect(build().requirementSetVersion).toBe(1);
  });
});
