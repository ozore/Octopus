/**
 * M5 PROPERTY TESTS — `specs/05` §12.
 *
 * "The engine is pure, so it can be tested hard." Three properties, plus the
 * one grep the vocabulary decision earned:
 *
 *   determinism      1,000 random (extraction, requirement set) pairs, run
 *                    twice, byte-identical
 *   monotonicity     raising a `minAmount` never turns a `gap` into a `met`
 *   state totality   every requirement produces exactly ONE of the five states,
 *                    never zero, never two
 *   vocabulary       no code path can emit the string `covered` (REVIEW.md B-02)
 *
 * The generator is seeded, so a failure is reproducible from the seed printed
 * in the message rather than from luck.
 */
import { describe, expect, it } from 'vitest';

import { REQUIREMENT_STATES } from '../../src/lib/status';
import { compare } from '../../src/lib/engine';
import type { CoiExtraction, Requirement, RequirementSet } from '../../src/lib/engine';
import { coverage, extraction, limit, mention, requirement, requirementSet, ORG, VENDOR } from './fixtures';

/** A tiny deterministic PRNG — mulberry32. No `Math.random` in a pure suite. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AMOUNTS = [null, 0, 100_000, 500_000, 1_000_000, 2_000_000, 5_000_000];
const RAWS = ['1000000', 'Excluded', 'STATUTORY', '$100,000 SIR', ''];
const TICKS = [null, 'Y', 'N', 'N/A'];
const EXPIRIES = [null, '2025-01-01', '2026-06-01', '2026-06-15', '2027-01-01'];
const FORMS = ['CG 20 10', 'CG 20 10 04 13', 'CG2001', 'CG 24 04 05 09', 'RSCG0303', 'WC 00 03 13'];

function randomCase(random: () => number): { payload: CoiExtraction; set: RequirementSet } {
  const pick = <T,>(list: T[]): T => list[Math.floor(random() * list.length)] as T;

  const coverages = [
    coverage('general_liability', {
      addlInsd: pick(TICKS),
      subrWvd: pick(TICKS),
      exp: pick(EXPIRIES),
      formBasis: pick([null, 'occurrence', 'claims_made']),
      aggregateAppliesPer: pick([null, 'policy', 'project', 'loc']),
      limits: [
        limit('each_occurrence', pick(AMOUNTS), pick(RAWS)),
        limit('general_aggregate', pick(AMOUNTS), pick(RAWS)),
      ],
    }),
    coverage('workers_compensation', { subrWvd: pick(TICKS), exp: pick(EXPIRIES), limits: [limit('el_each_accident', pick(AMOUNTS), pick(RAWS))] }),
    coverage('umbrella_liability', { exp: pick(EXPIRIES), limits: [limit('umbrella_each_occurrence', pick(AMOUNTS), pick(RAWS))] }),
  ].slice(0, 1 + Math.floor(random() * 3));

  const payload = extraction({
    coverages,
    insuredName: pick(['ACME ROOFING, INC.', 'Acme Roofing of Texas LLC', null]),
    insuredAddress: pick(['400 Pike Street, Seattle WA 98101', '12 Mill Road, Austin TX 78702', null]),
    holder: pick(['RIVERGATE PROPERTY MANAGEMENT', 'Bellhaven Management Services LLC', null]),
    forms: random() > 0.5 ? [mention(pick(FORMS), pick(['description_of_operations', 'attached_endorsement_page', 'other']), random() > 0.5)] : [],
  });

  const requirements: Requirement[] = [
    requirement({ kind: 'limit', coverage: 'general_liability', limitLabel: 'each_occurrence', minAmount: pick(AMOUNTS.filter((a): a is number => a !== null && a > 0)), combinable: random() > 0.5, sortOrder: 1 }),
    requirement({ kind: 'coverage_present', coverage: pick(['general_liability', 'workers_compensation', 'automobile_liability'] as const), sortOrder: 2 }),
    requirement({ kind: 'endorsement', endorsementKey: pick(['additional_insured_ongoing', 'waiver_of_subrogation_gl', 'waiver_of_subrogation_wc', 'primary_non_contributory'] as const), acceptsForms: [pick(FORMS)], sortOrder: 3 }),
    requirement({ kind: 'policy_condition', coverage: 'general_liability', condition: pick([{ formBasis: 'occurrence' as const }, { aggregateAppliesPer: 'project' as const }, { maxSir: 25_000 }, { wcStopGapStates: ['WA', 'OH', 'WY', 'ND'] }]), sortOrder: 4 }),
    requirement({ kind: 'carrier', condition: { amBestMin: 'A-' }, sortOrder: 5 }),
  ].slice(0, 1 + Math.floor(random() * 5));

  return { payload, set: requirementSet(requirements) };
}

const DATES = ['2026-06-01', '2026-01-01', '2027-01-01'];

describe('determinism over 1,000 random pairs', () => {
  it('produces byte-identical output when run twice', () => {
    const random = rng(20260903);
    for (let i = 0; i < 1000; i += 1) {
      const { payload, set } = randomCase(random);
      const evaluationDate = DATES[i % DATES.length] as string;
      const input = { extraction: payload, requirementSet: set, evaluationDate, vendor: VENDOR, org: ORG };
      const first = JSON.stringify(compare(input));
      const second = JSON.stringify(compare(input));
      expect(second, `case ${i} (seed 20260903) is not reproducible`).toBe(first);
    }
  });

  it('does not mutate its inputs', () => {
    const random = rng(7);
    const { payload, set } = randomCase(random);
    const before = JSON.stringify({ payload, set });
    compare({ extraction: payload, requirementSet: set, evaluationDate: '2026-06-01', vendor: VENDOR, org: ORG });
    expect(JSON.stringify({ payload, set })).toBe(before);
  });
});

describe('state totality', () => {
  it('gives every requirement exactly one of the five states, never zero, never two', () => {
    const random = rng(4242);
    for (let i = 0; i < 500; i += 1) {
      const { payload, set } = randomCase(random);
      const result = compare({ extraction: payload, requirementSet: set, evaluationDate: '2026-06-01', vendor: VENDOR, org: ORG });
      const requirementRows = result.results.filter((row) => row.origin === 'requirement');
      expect(requirementRows).toHaveLength(set.requirements.length);
      for (const row of requirementRows) {
        expect(REQUIREMENT_STATES).toContain(row.state);
      }
      // The five counters must sum to every row the engine emitted.
      const total = result.metCount + result.gapCount + result.assertedOnlyCount + result.notCheckedCount + result.undeterminedCount;
      expect(total).toBe(result.results.length);
    }
  });

  it('always writes a non-empty explanation', () => {
    const random = rng(99);
    for (let i = 0; i < 300; i += 1) {
      const { payload, set } = randomCase(random);
      const result = compare({ extraction: payload, requirementSet: set, evaluationDate: '2026-06-01', vendor: VENDOR, org: ORG });
      for (const row of result.results) {
        expect(row.explanation.length).toBeGreaterThan(10);
        expect(row.explanation).not.toContain('undefined');
        expect(row.explanation).not.toContain('[object');
      }
    }
  });
});

describe('monotonicity', () => {
  it('raising a minAmount never turns a gap into a met', () => {
    const random = rng(31337);
    for (let i = 0; i < 300; i += 1) {
      const amount = [null, 250_000, 1_000_000, 5_000_000][Math.floor(random() * 4)] as number | null;
      const payload = extraction({
        coverages: [coverage('general_liability', { exp: '2027-01-01', limits: [limit('each_occurrence', amount)] })],
      });
      const low = 500_000;
      const high = low + Math.floor(random() * 5_000_000) + 1;
      const at = (min: number) =>
        compare({
          extraction: payload,
          requirementSet: requirementSet([
            requirement({ kind: 'limit', coverage: 'general_liability', limitLabel: 'each_occurrence', minAmount: min, sortOrder: 1 }),
          ]),
          evaluationDate: '2026-06-01',
          vendor: VENDOR,
          org: ORG,
        }).results.find((r) => r.origin === 'requirement')?.state;

      if (at(low) === 'gap') expect(at(high)).not.toBe('met');
      if (at(high) === 'met') expect(at(low)).toBe('met');
    }
  });
});

describe('vocabulary', () => {
  it('never emits the retired status word in any explanation, over 1,000 random cases', () => {
    const random = rng(5150);
    for (let i = 0; i < 1000; i += 1) {
      const { payload, set } = randomCase(random);
      const result = compare({ extraction: payload, requirementSet: set, evaluationDate: '2026-06-01', vendor: VENDOR, org: ORG });
      const json = JSON.stringify(result).toLowerCase();
      expect(json, `case ${i} emitted the retired status word`).not.toMatch(/\bcovered\b/);
      expect(json).not.toMatch(/\bcompliant\b/);
      expect(json).not.toMatch(/\bverified\b/);
    }
  });

  it('never emits `covered` as a status value', () => {
    const result = compare({
      extraction: extraction({ coverages: [coverage('general_liability', { exp: '2027-01-01', limits: [limit('each_occurrence', 1_000_000)] })] }),
      requirementSet: requirementSet([requirement({ kind: 'limit', coverage: 'general_liability', limitLabel: 'each_occurrence', minAmount: 1_000_000, sortOrder: 1 })]),
      evaluationDate: '2026-06-01',
      vendor: VENDOR,
      org: ORG,
    });
    expect(result.status).toBe('meets');
    expect(result.statusWord).toBe('Meets requirements');
  });
});
