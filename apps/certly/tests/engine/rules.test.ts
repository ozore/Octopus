/**
 * M5 RULE TABLES — one test per rule in `specs/05` §3 and §4, including the
 * three "rules taken directly from real documents", plus the eight edge cases
 * in §9. The acceptance criteria live in `acceptance.test.ts`; this file is the
 * regression net for the rules themselves.
 */
import { describe, expect, it } from 'vitest';

import { compare, formatDate, matchName, normaliseName, parseFormNumber, parseMoney, stateFromAddress, formMatches } from '../../src/lib/engine';
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

const run = (payload: Parameters<typeof compare>[0]['extraction'], requirements: ReturnType<typeof requirement>[], evaluationDate = TODAY) =>
  compare({ extraction: payload, requirementSet: requirementSet(requirements), evaluationDate, vendor: VENDOR, org: ORG });

const only = (result: ReturnType<typeof compare>) => result.results.find((r) => r.origin === 'requirement');

// ---------------------------------------------------------------------------
// §3 step 2 — coverage presence and limits
// ---------------------------------------------------------------------------

describe('§3 — coverage presence', () => {
  it('is `met` when a row of the type exists', () => {
    const result = run(
      extraction({ coverages: [coverage('automobile_liability', { exp: FAR_EXPIRY })] }),
      [requirement({ kind: 'coverage_present', coverage: 'automobile_liability' })],
    );
    expect(only(result)?.state).toBe('met');
  });

  it('is `gap` when the coverage is absent', () => {
    const result = run(
      extraction({ coverages: [coverage('general_liability', { exp: FAR_EXPIRY })] }),
      [requirement({ kind: 'coverage_present', coverage: 'workers_compensation' })],
    );
    expect(only(result)?.state).toBe('gap');
  });

  it('matches an OTHER: row on its printed label', () => {
    const result = run(
      extraction({
        coverages: [coverage('other', { typeLabelRaw: 'Professional Liability', exp: FAR_EXPIRY })],
      }),
      [requirement({ kind: 'coverage_present', coverage: 'other', otherLabel: 'Professional Liability' })],
    );
    expect(only(result)?.state).toBe('met');
  });

  it('is `not_checked` for an `other` requirement that names no label to match on', () => {
    const result = run(
      extraction({ coverages: [coverage('other', { typeLabelRaw: 'Cyber Security Liability', exp: FAR_EXPIRY })] }),
      [requirement({ kind: 'coverage_present', coverage: 'other' })],
    );
    expect(only(result)?.state).toBe('not_checked');
  });
});

describe('§3 — limits', () => {
  it('evaluates against the BEST matching row when a certificate carries two of a type, and never sums them', () => {
    const result = run(
      extraction({
        coverages: [
          coverage('general_liability', { limits: [limit('each_occurrence', 500_000)], exp: FAR_EXPIRY, insrLetter: 'A' }),
          coverage('general_liability', { limits: [limit('each_occurrence', 900_000)], exp: FAR_EXPIRY, insrLetter: 'B' }),
        ],
      }),
      [requirement({ kind: 'limit', coverage: 'general_liability', limitLabel: 'each_occurrence', minAmount: 1_000_000 })],
    );
    // 500k + 900k would clear the requirement; the best single row does not.
    expect(only(result)?.state).toBe('gap');
    expect(only(result)?.foundAmount).toBe(900_000);
  });

  it('reads an umbrella row that prints its limits under the primary labels', () => {
    const result = run(
      extraction({
        coverages: [
          coverage('general_liability', { limits: [limit('each_occurrence', 1_000_000)], exp: FAR_EXPIRY }),
          coverage('excess_liability', { limits: [limit('each_occurrence', 4_000_000)], exp: FAR_EXPIRY }),
        ],
      }),
      [requirement({ kind: 'limit', coverage: 'general_liability', limitLabel: 'each_occurrence', minAmount: 5_000_000, combinable: true })],
    );
    expect(only(result)?.state).toBe('met');
  });

  it('is `gap` on a limit requirement when the coverage row prints no limits at all', () => {
    const result = run(
      extraction({ coverages: [coverage('general_liability', { limits: [], exp: FAR_EXPIRY })] }),
      [requirement({ kind: 'limit', coverage: 'general_liability', limitLabel: 'each_occurrence', minAmount: 1_000_000 })],
    );
    expect(only(result)?.state).toBe('gap');
    expect(only(result)?.explanation).toContain('no limits at all');
  });

  it('is `met` on coverage_present for the same zero-limit row (§9)', () => {
    const result = run(
      extraction({ coverages: [coverage('general_liability', { limits: [], exp: FAR_EXPIRY })] }),
      [requirement({ kind: 'coverage_present', coverage: 'general_liability' })],
    );
    expect(only(result)?.state).toBe('met');
  });

  it('matches an OTHER: row’s limit on `label_raw` (MJ-18)', () => {
    const result = run(
      extraction({
        coverages: [
          coverage('other', {
            typeLabelRaw: 'Cyber Security Liability',
            exp: FAR_EXPIRY,
            limits: [limit('other', 2_000_000, '2000000', 'CYBER AGGREGATE')],
          }),
        ],
      }),
      [
        requirement({
          kind: 'limit',
          coverage: 'other',
          otherLabel: 'Cyber Security Liability',
          limitLabel: 'other',
          minAmount: 1_000_000,
        }),
      ],
    );
    // The template names the OTHER row by label; the limit box matches on its
    // printed label, which is the only string available for an OTHER: row.
    expect(only(result)?.state).toBe('met');
  });
});

// ---------------------------------------------------------------------------
// §4 — endorsements, and the three rules from real documents
// ---------------------------------------------------------------------------

describe('§4 — endorsement evaluation', () => {
  const aiRequirement = () =>
    requirement({ kind: 'endorsement', endorsementKey: 'additional_insured_ongoing', acceptsForms: ['CG 20 10', 'CG 20 33'] });

  it('attached page naming an accepted form → met', () => {
    const result = run(
      extraction({ coverages: [coverage('general_liability', { exp: FAR_EXPIRY })], forms: [mention('CG 20 33', 'attached_endorsement_page')] }),
      [aiRequirement()],
    );
    expect(only(result)?.state).toBe('met');
  });

  it('named in Description of Operations only → asserted_only', () => {
    const result = run(
      extraction({ coverages: [coverage('general_liability', { exp: FAR_EXPIRY })], forms: [mention('CG 20 10', 'description_of_operations')] }),
      [aiRequirement()],
    );
    expect(only(result)?.state).toBe('asserted_only');
  });

  it('an unrecognised form number is NEVER a gap (corpus C2’s RSCG0303)', () => {
    const result = run(
      extraction({ coverages: [coverage('general_liability', { exp: FAR_EXPIRY })], forms: [mention('RSCG0303', 'description_of_operations')] }),
      [aiRequirement()],
    );
    expect(only(result)?.state).toBe('asserted_only');
    expect(only(result)?.explanation).toContain('RSCG0303');
    expect(only(result)?.explanation).toContain('cannot tell you what it covers');
  });

  it('nothing named, nothing attached, column N or blank → gap', () => {
    const result = run(
      extraction({ coverages: [coverage('general_liability', { addlInsd: 'N', exp: FAR_EXPIRY })] }),
      [aiRequirement()],
    );
    expect(only(result)?.state).toBe('gap');
  });

  it('records and displays conditional wording without adjudicating it', () => {
    const result = run(
      extraction({ coverages: [coverage('general_liability', { exp: FAR_EXPIRY })], forms: [mention('CG 20 10', 'description_of_operations', true)] }),
      [aiRequirement()],
    );
    expect(only(result)?.conditional).toBe(true);
    expect(only(result)?.explanation).toContain('where required by written contract');
  });

  it('a GL waiver says nothing about a WC waiver (KB §C.3)', () => {
    const payload = extraction({
      coverages: [
        coverage('general_liability', { subrWvd: 'Y', exp: FAR_EXPIRY }),
        coverage('workers_compensation', { subrWvd: 'N', exp: FAR_EXPIRY }),
      ],
    });
    const gl = run(payload, [requirement({ kind: 'endorsement', endorsementKey: 'waiver_of_subrogation_gl', acceptsForms: ['CG 24 04'] })]);
    const wc = run(payload, [requirement({ kind: 'endorsement', endorsementKey: 'waiver_of_subrogation_wc', acceptsForms: ['WC 00 03 13'] })]);
    expect(only(gl)?.state).toBe('asserted_only');
    expect(only(wc)?.state).toBe('gap');
  });

  it('primary and non-contributory has no column, so a tick cannot evidence it', () => {
    const result = run(
      extraction({ coverages: [coverage('general_liability', { addlInsd: 'Y', subrWvd: 'Y', exp: FAR_EXPIRY })] }),
      [requirement({ kind: 'endorsement', endorsementKey: 'primary_non_contributory', acceptsForms: ['CG 20 01'] })],
    );
    expect(only(result)?.state).toBe('gap');
    expect(only(result)?.explanation).toContain('no column for it');
  });

  it('an edition demanded by the requirement must be matched exactly', () => {
    const strict = requirement({ kind: 'endorsement', endorsementKey: 'additional_insured_ongoing', acceptsForms: ['CG 20 10 11 85'] });
    const wrongEdition = run(
      extraction({ coverages: [coverage('general_liability', { exp: FAR_EXPIRY })], forms: [mention('CG 20 10 04 13', 'attached_endorsement_page')] }),
      [strict],
    );
    expect(only(wrongEdition)?.state).toBe('asserted_only'); // unrecognised edition, never a gap
    const rightEdition = run(
      extraction({ coverages: [coverage('general_liability', { exp: FAR_EXPIRY })], forms: [mention('CG 20 10 11 85', 'attached_endorsement_page')] }),
      [strict],
    );
    expect(only(rightEdition)?.state).toBe('met');
  });
});

// ---------------------------------------------------------------------------
// §3 step 2 — policy conditions
// ---------------------------------------------------------------------------

describe('§3 — policy conditions', () => {
  it('form basis: occurrence required, claims-made shown → gap', () => {
    const result = run(
      extraction({ coverages: [coverage('general_liability', { formBasis: 'claims_made', exp: FAR_EXPIRY })] }),
      [requirement({ kind: 'policy_condition', coverage: 'general_liability', condition: { formBasis: 'occurrence' } })],
    );
    expect(only(result)?.state).toBe('gap');
  });

  it('form basis: nothing printed → undetermined, not a gap', () => {
    const result = run(
      extraction({ coverages: [coverage('general_liability', { exp: FAR_EXPIRY })] }),
      [requirement({ kind: 'policy_condition', coverage: 'general_liability', condition: { formBasis: 'occurrence' } })],
    );
    expect(only(result)?.state).toBe('undetermined');
  });

  it('aggregate applies per project', () => {
    const result = run(
      extraction({ coverages: [coverage('general_liability', { aggregateAppliesPer: 'project', exp: FAR_EXPIRY })] }),
      [requirement({ kind: 'policy_condition', coverage: 'general_liability', condition: { aggregateAppliesPer: 'project' } })],
    );
    expect(only(result)?.state).toBe('met');
  });

  it('an SIR above the allowed maximum is a gap that must be disclosed (R1)', () => {
    const result = run(
      extraction({
        coverages: [coverage('general_liability', { exp: FAR_EXPIRY, limits: [limit('each_occurrence', null, '$100,000 SIR')] })],
      }),
      [requirement({ kind: 'policy_condition', coverage: 'general_liability', condition: { maxSir: 25_000 } })],
    );
    expect(only(result)?.state).toBe('gap');
    expect(only(result)?.explanation).toContain('$100,000');
  });

  it('WC “statutory” in a monopolistic state is a gap on employers’ liability (KB §B.2)', () => {
    const result = run(
      extraction({
        insuredAddress: '400 Pike Street, Seattle WA 98101',
        coverages: [
          coverage('workers_compensation', { exp: FAR_EXPIRY, limits: [limit('el_each_accident', null, 'STATUTORY')] }),
        ],
      }),
      [
        requirement({
          kind: 'policy_condition',
          coverage: 'workers_compensation',
          condition: { wcStopGapStates: ['WA', 'OH', 'WY', 'ND'] },
        }),
      ],
    );
    expect(only(result)?.state).toBe('gap');
    expect(only(result)?.explanation).toContain('stop-gap');
  });

  it('the same requirement in a non-monopolistic state is met', () => {
    const result = run(
      extraction({
        insuredAddress: '12 Mill Road, Austin TX 78702',
        coverages: [coverage('workers_compensation', { exp: FAR_EXPIRY, limits: [limit('el_each_accident', null, 'STATUTORY')] })],
      }),
      [requirement({ kind: 'policy_condition', coverage: 'workers_compensation', condition: { wcStopGapStates: ['WA', 'OH', 'WY', 'ND'] } })],
    );
    expect(only(result)?.state).toBe('met');
  });

  it('is undetermined when the insured’s state cannot be read', () => {
    const result = run(
      extraction({
        insuredAddress: null,
        coverages: [coverage('workers_compensation', { exp: FAR_EXPIRY })],
      }),
      [requirement({ kind: 'policy_condition', coverage: 'workers_compensation', condition: { wcStopGapStates: ['WA'] } })],
    );
    expect(only(result)?.state).toBe('undetermined');
  });
});

// ---------------------------------------------------------------------------
// §3 step 4 — the roll-up, and §9's edge cases
// ---------------------------------------------------------------------------

describe('§4 — vendor roll-up', () => {
  const live = () => coverage('general_liability', { limits: [limit('each_occurrence', 1_000_000)], exp: FAR_EXPIRY });
  const glReq = () => requirement({ kind: 'limit', coverage: 'general_liability', limitLabel: 'each_occurrence', minAmount: 1_000_000 });

  it('is `no_certificate` when there is no active certificate at all', () => {
    const result = compare({
      extraction: null,
      requirementSet: requirementSet([glReq()]),
      evaluationDate: TODAY,
      vendor: VENDOR,
    });
    expect(result.status).toBe('no_certificate');
    expect(result.statusState).toBe('no_certificate');
    expect(result.results).toEqual([]);
  });

  it('is `meets` when everything resolves', () => {
    expect(run(extraction({ coverages: [live()] }), [glReq()]).status).toBe('meets');
  });

  it('is `expiring` inside the 30-day window and `meets` outside it', () => {
    const soon = extraction({ coverages: [coverage('general_liability', { limits: [limit('each_occurrence', 1_000_000)], exp: '2026-06-20' })] });
    expect(run(soon, [glReq()], '2026-06-01').status).toBe('expiring');
    expect(run(soon, [glReq()], '2026-05-01').status).toBe('meets');
  });

  it('prefers `gap` over `expiring` and `expired` over `gap`', () => {
    const short = extraction({ coverages: [coverage('general_liability', { limits: [limit('each_occurrence', 100)], exp: '2026-06-20' })] });
    expect(run(short, [glReq()], '2026-06-01').status).toBe('gap');
    const gone = extraction({ coverages: [coverage('general_liability', { limits: [limit('each_occurrence', 100)], exp: '2026-05-01' })] });
    expect(run(gone, [glReq()], '2026-06-01').status).toBe('expired');
  });

  it('never lets an `advisory` requirement mark a vendor red', () => {
    const payload = extraction({ coverages: [live()] });
    const advisory = requirement({
      kind: 'limit',
      coverage: 'umbrella_liability',
      limitLabel: 'umbrella_each_occurrence',
      minAmount: 5_000_000,
      severity: 'advisory',
    });
    const result = run(payload, [glReq(), advisory]);
    expect(result.results.find((r) => r.requirementId === advisory.id)?.state).toBe('gap');
    expect(result.status).toBe('meets');
  });

  it('does not let `undetermined` change the vendor state, but does count it', () => {
    const payload = extraction({
      coverages: [coverage('general_liability', { limits: [limit('each_occurrence', null, 'Excluded')], exp: FAR_EXPIRY })],
    });
    const result = run(payload, [glReq()]);
    expect(result.undeterminedCount).toBeGreaterThan(0);
    expect(result.status).toBe('meets');
  });

  it('ignores an umbrella row the template does not ask about', () => {
    const payload = extraction({
      coverages: [live(), coverage('umbrella_liability', { limits: [limit('umbrella_each_occurrence', 5_000_000)], exp: FAR_EXPIRY })],
    });
    expect(run(payload, [glReq()]).status).toBe('meets');
  });

  it('reports the earliest required expiry, ignoring coverages nothing asks about', () => {
    const payload = extraction({
      coverages: [
        coverage('general_liability', { limits: [limit('each_occurrence', 1_000_000)], exp: '2027-03-01' }),
        coverage('automobile_liability', { exp: '2026-07-01' }),
      ],
    });
    expect(run(payload, [glReq()]).earliestRequiredExpiry).toBe('2027-03-01');
  });

  it('treats a certificate dated in the future as ordinary', () => {
    const payload = extraction({ coverages: [coverage('general_liability', { limits: [limit('each_occurrence', 1_000_000)], eff: '2026-09-01', exp: '2027-09-01' })] });
    expect(run(payload, [glReq()], '2026-06-01').status).toBe('meets');
  });
});

describe('§9 — the certificate holder is a managing agent', () => {
  it('is `undetermined`, and an alternate accepted holder resolves it', () => {
    const payload = extraction({ holder: 'Bellhaven Management Services LLC' });
    const strict = compare({
      extraction: payload,
      requirementSet: requirementSet([]),
      evaluationDate: TODAY,
      vendor: VENDOR,
      org: ORG,
    });
    expect(strict.results.find((r) => r.requirementId === 'check:holder')?.state).toBe('undetermined');

    const withAlternate = compare({
      extraction: payload,
      requirementSet: requirementSet([]),
      evaluationDate: TODAY,
      vendor: VENDOR,
      org: { ...ORG, alternateHolders: ['Bellhaven Management Services LLC'] },
    });
    expect(withAlternate.results.find((r) => r.requirementId === 'check:holder')?.state).toBe('met');
  });

  it('says so plainly when no entity block has been configured', () => {
    const result = compare({
      extraction: extraction({}),
      requirementSet: requirementSet([]),
      evaluationDate: TODAY,
      vendor: VENDOR,
    });
    const row = result.results.find((r) => r.requirementId === 'check:holder');
    expect(row?.state).toBe('undetermined');
    expect(row?.explanation).toContain('Add it in settings');
  });
});

// ---------------------------------------------------------------------------
// Helper units
// ---------------------------------------------------------------------------

describe('form-number normalisation (KB §C.5)', () => {
  it('treats space as noise: CG2001 ≡ CG 20 01', () => {
    expect(parseFormNumber('CG2001').base).toBe('CG 20 01');
    expect(parseFormNumber('cg 20 01').base).toBe('CG 20 01');
    expect(formMatches('CG 20 01', 'CG2001')).toBe(true);
  });

  it('keeps the edition as its own field: CG 24 04 05 09', () => {
    const parsed = parseFormNumber('CG 24 04 05 09');
    expect(parsed.base).toBe('CG 24 04');
    expect(parsed.edition).toBe('05 09');
  });

  it('keeps a carrier proprietary form whole', () => {
    const parsed = parseFormNumber('RSCG0303');
    expect(parsed.isoShaped).toBe(false);
    expect(parsed.base).toBe('RSCG0303');
  });

  it('accepts an edition on the found side when the requirement names none', () => {
    expect(formMatches('CG 20 10', 'CG 20 10 04 13')).toBe(true);
  });
});

describe('limit-box parsing (specs/03 §4)', () => {
  it.each([
    ['1,000,000', 1_000_000],
    ['$1,000,000', 1_000_000],
    ['1000000', 1_000_000],
    ['$1,000,000.00', 1_000_000],
  ])('parses %s as an amount', (raw, expected) => {
    expect(parseMoney(raw).amount).toBe(expected);
  });

  it.each(['Excluded', 'STATUTORY', 'Included', 'N/A'])('never coerces %s to a number', (raw) => {
    expect(parseMoney(raw).amount).toBeNull();
  });

  it('recovers the figure from an SIR while leaving the limit unreadable', () => {
    const parsed = parseMoney('$100,000 SIR');
    expect(parsed.amount).toBeNull();
    expect(parsed.sir).toBe(100_000);
  });
});

describe('name normalisation (specs/05 §3)', () => {
  it('strips one trailing entity suffix, not all of them', () => {
    expect(normaliseName('ACME ROOFING, INC.')).toBe('ACME ROOFING');
    expect(normaliseName('Smith Co Inc')).toBe('SMITH CO');
  });

  it('turns & into AND', () => {
    expect(normaliseName('Harbour & Vale LLC')).toBe('HARBOUR AND VALE');
  });

  it('refuses to fuzzy-match', () => {
    expect(matchName('Acme Roofing of Texas LLC', 'Acme Roofing Inc')).toBe('undetermined');
    expect(matchName(null, 'Acme')).toBe('undetermined');
  });
});

describe('state parsing for the stop-gap check', () => {
  it.each([
    ['400 Pike Street, Seattle WA 98101', 'WA'],
    ['1 Main St, Columbus, OH 43215', 'OH'],
    ['12 Mill Road, Austin TX 78702', 'TX'],
  ])('reads %s as %s', (address, expected) => {
    expect(stateFromAddress(address)).toBe(expected);
  });

  it('returns null rather than guessing', () => {
    expect(stateFromAddress('somewhere')).toBeNull();
    expect(stateFromAddress(null)).toBeNull();
  });
});

describe('date formatting', () => {
  it('prints one format, everywhere', () => {
    expect(formatDate('2026-09-12')).toBe('12 September 2026');
  });
});
