/**
 * STAGE 2 — the deterministic retriever, which is also the free tier and also the
 * tested fallback for a model outage.
 *
 * The properties asserted here are the ones the ladder's decisions rest on: an
 * exact match is exactly one thing, the ordering is total, the union penalty cannot
 * reach an exact match, and the L-C2 band governs A MODEL CALL and nothing else.
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  CANDIDATE_SLICE_MAX,
  candidateSlice,
  DELTA_LEX_1E4,
  LEXICAL_FLOOR_1E4,
  normalizeTitle,
  scoreCandidates,
  skipsModelCall,
  soleExactMatch,
  TAU_LEX_1E4,
  UNION_GROUP_FACTOR_1E4,
  type LexicalCandidate,
} from '@/classify';
import type { Classification } from '@/lib/types';

import { classByName, VA_CLASSES } from './fixtures';

function score(title: string, name: string): number {
  const found = scoreCandidates(normalizeTitle(title), VA_CLASSES).find(
    (candidate) => candidate.classification.className === name,
  );
  return found?.score1e4 ?? -1;
}

describe('scoreCandidates — the exact match', () => {
  it('scores the determination’s own label at 1.0 and marks it exact', () => {
    const scored = scoreCandidates(
      normalizeTitle('Cement Mason/Concrete Finisher'),
      VA_CLASSES,
    );
    const top = scored[0] as LexicalCandidate;
    expect(top.classification.className).toBe('CEMENT MASON/CONCRETE FINISHER');
    expect(top.score1e4).toBe(10_000);
    expect(top.exact).toBe(true);
    expect(soleExactMatch(scored)?.classificationId).toBe(top.classificationId);
  });

  it('does NOT mark a token permutation exact, even at score 1.0', () => {
    // This is the L-C1 / L-C2 line: "pipelayer laborer" has the same token set as
    // "LABORER: PIPELAYER" and therefore scores 1.0, but the strings differ, so no
    // radio may be filled. Similarity below exact orders the list and nothing more.
    const scored = scoreCandidates(normalizeTitle('pipelayer laborer'), VA_CLASSES);
    const top = scored[0] as LexicalCandidate;
    expect(top.classification.className).toBe('LABORER: PIPELAYER');
    expect(top.score1e4).toBe(10_000);
    expect(top.exact).toBe(false);
    expect(soleExactMatch(scored)).toBeUndefined();
  });

  it('refuses to name a sole exact match when two rows normalize alike', () => {
    // An ambiguous exact match is a parser question, not a pre-selection licence.
    const twin: Classification = {
      ...classByName('IRONWORKER, STRUCTURAL'),
      className: 'IRONWORKER, REINFORCING',
      ordinal: 30,
    };
    const scored = scoreCandidates(normalizeTitle('ironworker reinforcing'), [
      ...VA_CLASSES,
      twin,
    ]);
    expect(scored[0]?.exact).toBe(true);
    expect(soleExactMatch(scored)).toBeUndefined();
  });
});

describe('scoreCandidates — the synonym layer', () => {
  it('folds a hand-curated compound onto the determination’s own words', () => {
    // "ROD BUSTER" is the trade's word; "IRONWORKER, REINFORCING" is the
    // determination's. Neither shares a token with the other.
    expect(score('rod buster', 'IRONWORKER, REINFORCING')).toBe(10_000);
  });

  it('expands abbreviations before scoring', () => {
    expect(score('oper backhoe', 'OPERATOR: BACKHOE/EXCAVATOR/TRACKHOE')).toBe(5_000);
  });
});

describe('scoreCandidates — the union-group penalty', () => {
  const electrician = classByName('ELECTRICIAN, INCLUDES TRAFFIC SIGNALIZATION');

  it('demotes an inexact union row by exactly the published factor', () => {
    expect(electrician.identifierKind).toBe('union');
    const union = score('traffic signalization', electrician.className);
    const survey = scoreCandidates(normalizeTitle('traffic signalization'), [
      { ...electrician, identifierKind: 'survey' },
    ])[0] as LexicalCandidate;
    expect(union).toBe(Math.round((survey.score1e4 * UNION_GROUP_FACTOR_1E4) / 10_000));
    expect(union).toBeLessThan(survey.score1e4);
  });

  it('cannot demote an exact match, because L-C1’s licence is the federal text', () => {
    expect(score(electrician.className, electrician.className)).toBe(10_000);
  });
});

describe('scoreCandidates — determinism', () => {
  it('is a total order: the same rows in any input order give the same output order', () => {
    const title = normalizeTitle('laborer');
    const forward = scoreCandidates(title, VA_CLASSES).map((c) => c.classification.ordinal);
    fc.assert(
      fc.property(fc.shuffledSubarray([...VA_CLASSES], { minLength: VA_CLASSES.length }), (shuffled) => {
        const again = scoreCandidates(title, shuffled).map((c) => c.classification.ordinal);
        expect(again).toEqual(forward);
      }),
      { numRuns: 50 },
    );
  });

  it('breaks ties on ordinal rather than on input order', () => {
    const scored = scoreCandidates(normalizeTitle('conc pump op'), VA_CLASSES);
    const tied = scored.filter((candidate) => candidate.score1e4 === scored[0]?.score1e4);
    expect(tied.length).toBeGreaterThan(1);
    expect(tied.map((candidate) => candidate.classification.ordinal)).toEqual(
      [...tied.map((candidate) => candidate.classification.ordinal)].sort((a, b) => a - b),
    );
  });

  it('scores are integers in [0, 10000] with a float derived from them', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 40 }), (raw) => {
        for (const candidate of scoreCandidates(normalizeTitle(raw), VA_CLASSES)) {
          expect(Number.isInteger(candidate.score1e4)).toBe(true);
          expect(candidate.score1e4).toBeGreaterThanOrEqual(0);
          expect(candidate.score1e4).toBeLessThanOrEqual(10_000);
          expect(candidate.score).toBe(candidate.score1e4 / 10_000);
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe('candidateSlice — the floor and the fixed enum width', () => {
  it('drops everything below the floor', () => {
    const scored = scoreCandidates(normalizeTitle('oper backhoe'), VA_CLASSES);
    const slice = candidateSlice(scored);
    expect(slice.length).toBeGreaterThan(0);
    expect(slice.every((candidate) => candidate.score1e4 >= LEXICAL_FLOOR_1E4)).toBe(true);
    expect(slice.length).toBeLessThan(scored.length);
  });

  it('returns nothing when no row clears the floor — the L-F route', () => {
    expect(candidateSlice(scoreCandidates(normalizeTitle('underwater welder diver'), VA_CLASSES)))
      .toHaveLength(0);
  });

  it('never exceeds the schema’s fixed enum width', () => {
    const many = Array.from({ length: 40 }, (_, index) => ({
      ...classByName('LABORER: COMMON OR GENERAL'),
      ordinal: 100 + index,
    }));
    const slice = candidateSlice(scoreCandidates(normalizeTitle('laborer common'), many));
    expect(slice.length).toBe(CANDIDATE_SLICE_MAX);
  });
});

describe('skipsModelCall — L-C2’s band decides a CALL, never a selection', () => {
  it('skips on an exact match', () => {
    const slice = candidateSlice(
      scoreCandidates(normalizeTitle('Cement Mason/Concrete Finisher'), VA_CLASSES),
    );
    expect(skipsModelCall(slice)).toBe(true);
  });

  it('skips above tau with the margin, below exact', () => {
    const slice = candidateSlice(scoreCandidates(normalizeTitle('pipelayer laborer'), VA_CLASSES));
    const [top, second] = slice;
    expect(top?.score1e4).toBeGreaterThanOrEqual(TAU_LEX_1E4);
    expect((top?.score1e4 ?? 0) - (second?.score1e4 ?? 0)).toBeGreaterThanOrEqual(DELTA_LEX_1E4);
    expect(skipsModelCall(slice)).toBe(true);
  });

  it('does not skip when the top is tied — the ambiguous case is what the model is for', () => {
    const slice = candidateSlice(scoreCandidates(normalizeTitle('conc pump op'), VA_CLASSES));
    expect(skipsModelCall(slice)).toBe(false);
  });

  it('does not skip on an empty slice', () => {
    expect(skipsModelCall([])).toBe(false);
  });
});
