/**
 * THE LADDER, L-A THROUGH L-F.
 *
 * The through-line of every case below is **E5**: there is no confidence value at
 * which the model resolves a classification. Six levels, one pre-selection licence,
 * and a line that stays blocked until a person clicks.
 *
 * These cases need no database: the free generator has no account, and the model
 * paths are exercised through recorded responses. The memory half of the ladder —
 * L-A, and the click that mints it — is in `crosswalk.test.ts`, where a real
 * Postgres with real row-level security is worth the fixture cost.
 */

import { describe, expect, it } from 'vitest';

import {
  CONFORMANCE_CITATION,
  forbiddenRanker,
  interpretWireResponse,
  normalizeTitle,
  PICKER_FOOTNOTE,
  rankOfChoice,
  recordedRanker,
  resolveClassification,
  unreachableRanker,
  type ClassificationOutcome,
  type ResolveDeps,
} from '@/classify';
import { CLASSIFICATION_LADDER } from '@/lib/types';

import { classByName, PIN, VA_CLASSES } from './fixtures';
import wire from './fixtures/rank-wire.json';

const RECORDINGS = wire as unknown as Record<string, unknown>;
const MODEL = 'claude-sonnet-5';

function paidWith(key: string): ResolveDeps {
  const parsed = interpretWireResponse(RECORDINGS[key]);
  return {
    transport: recordedRanker([{ match: '*', result: parsed }]),
    modelId: MODEL,
  };
}

async function resolve(
  rawTitle: string,
  deps: ResolveDeps = {},
  overrides: { readonly tier?: 'free' | 'paid'; readonly modelBudgetExhausted?: boolean } = {},
): Promise<ClassificationOutcome> {
  return resolveClassification(deps, {
    lineId: 'line-1',
    rawTitle,
    tier: overrides.tier ?? 'paid',
    pin: PIN,
    classifications: VA_CLASSES,
    ...(overrides.modelBudgetExhausted !== undefined
      ? { modelBudgetExhausted: overrides.modelBudgetExhausted }
      : {}),
  });
}

/** Every string this module can put on a screen, for the A3 and copy-rule sweeps. */
function stringsOf(outcome: ClassificationOutcome): readonly string[] {
  const strings: string[] = [];
  const refusal = outcome.refusal;
  if (refusal !== null && refusal.primitive === 'P-A') {
    strings.push(refusal.headline, refusal.detail);
    for (const choice of refusal.choices) {
      strings.push(choice.label, choice.verbatimSource, choice.sourceCitation);
    }
  }
  const declined = outcome.declined;
  if (declined !== null && declined.primitive === 'P-D') {
    strings.push(declined.headline, declined.rule, declined.citation, declined.declined);
    for (const fact of declined.observableFacts) strings.push(fact.label, fact.value);
  }
  if (outcome.banner !== null) strings.push(outcome.banner);
  return strings;
}

describe('L-C1 — the only level at which a radio arrives filled', () => {
  it('pre-selects an exact normalized match against the determination’s own label', async () => {
    const outcome = await resolve('Cement Mason/Concrete Finisher', { transport: forbiddenRanker() });
    expect(outcome.level).toBe('L_C1');
    expect(outcome.modelCalled).toBe(false);
    expect(outcome.preSelected).toBe(classByName('CEMENT MASON/CONCRETE FINISHER').id);
    expect(outcome.picker).toHaveLength(1);
    // Pre-selected is still BLOCKED: the customer confirms, the line does not
    // resolve itself.
    expect(outcome.resolved).toBeNull();
    expect(outcome.refusal?.primitive).toBe('P-A');
  });

  it('carries the determination’s own words and line span beside the candidate', async () => {
    const outcome = await resolve('Cement Mason/Concrete Finisher');
    const refusal = outcome.refusal;
    expect(refusal?.primitive).toBe('P-A');
    if (refusal?.primitive !== 'P-A') return;
    const choice = refusal.choices[0];
    expect(choice?.verbatimSource).toBe('CEMENT MASON/CONCRETE FINISHER');
    expect(choice?.sourceCitation).toContain('VA20260195 revision 2');
    expect(choice?.sourceCitation).toContain('lines 48');
    expect(choice?.baseRate).toBe(classByName('CEMENT MASON/CONCRETE FINISHER').baseRate);
  });
});

describe('L-C2 — above the band, below exact: no model call, nothing pre-selected', () => {
  it('skips the model and fills no radio', async () => {
    const outcome = await resolve('pipelayer laborer', {
      transport: forbiddenRanker('L-C2 must not reach the model'),
      modelId: MODEL,
    });
    expect(outcome.level).toBe('L_C2');
    expect(outcome.modelCalled).toBe(false);
    expect(outcome.preSelected).toBeNull();
    expect(outcome.picker[0]?.classification.className).toBe('LABORER: PIPELAYER');
    expect(outcome.resolved).toBeNull();
  });
});

describe('L-D — the model ordered, and that is all it did', () => {
  it('reorders the top three and pre-selects nothing', async () => {
    const outcome = await resolve('conc pump op', paidWith('accepted'));
    expect(outcome.level).toBe('L_D');
    expect(outcome.modelCalled).toBe(true);
    expect(outcome.preSelected).toBeNull();
    expect(outcome.picker.map((candidate) => candidate.classification.className)).toEqual([
      'OPERATOR: BACKHOE/EXCAVATOR/TRACKHOE',
      'OPERATOR: BOBCAT/SKID STEER/SKID LOADER',
      'CEMENT MASON/CONCRETE FINISHER',
    ]);
  });

  it('cannot shorten the candidate list or introduce a row', async () => {
    const deterministic = await resolve('conc pump op', paidWith('index_out_of_range'));
    const ranked = await resolve('conc pump op', paidWith('accepted'));
    expect([...ranked.candidates].map((c) => c.classificationId).sort()).toEqual(
      [...deterministic.candidates].map((c) => c.classificationId).sort(),
    );
  });

  it('records the attribution a confirmation stamps', async () => {
    const outcome = await resolve('conc pump op', paidWith('accepted'));
    expect(outcome.attribution.ordering).toBe('llm_ranked');
    expect(outcome.attribution.modelId).toBe(MODEL);
    expect(outcome.attribution.promptBundleHash).toMatch(/^[0-9a-f]{64}$/);
    expect(outcome.attribution.usage?.cacheReadInputTokens).toBe(2114);
    expect(outcome.attribution.cacheReadZero).toBe(false);
  });

  it('flags a cold cache read, which is §15.6’s drift signal', async () => {
    const outcome = await resolve('conc pump op', paidWith('accepted_cold_cache'));
    expect(outcome.level).toBe('L_D');
    expect(outcome.attribution.cacheReadZero).toBe(true);
  });
});

describe('L-E — every model failure lands in the same place, and it is a product surface', () => {
  it.each([
    ['numeric_prose', 'forbidden_prose'],
    ['asserting_prose', 'forbidden_prose'],
    ['extra_field', 'schema_invalid'],
    ['index_out_of_range', 'index_out_of_range'],
    ['duplicate_index', 'ranked_duplicate_index'],
    ['span_mismatch', 'span_empty_or_mismatched'],
    ['low_confidence', 'confidence_not_high'],
    ['truncated_json', 'transport_malformed'],
    ['refusal', 'transport_refusal'],
    ['max_tokens', 'transport_max_tokens'],
  ])('degrades %s to L-E with reason %s', async (key, reason) => {
    const outcome = await resolve('conc pump op', paidWith(key));
    expect(outcome.level).toBe('L_E');
    expect(outcome.preSelected).toBeNull();
    expect(outcome.attribution.rejection).toBe(reason);
    expect(outcome.banner).toBe(CLASSIFICATION_LADDER.L_E.banner);
  });

  it('degrades to L-E when Anthropic is unreachable, and the ordering survives', async () => {
    const unreachable = await resolve('conc pump op', {
      transport: unreachableRanker(),
      modelId: MODEL,
    });
    const noModel = await resolve('conc pump op');
    expect(unreachable.level).toBe('L_E');
    expect(unreachable.attribution.rejection).toBe('transport_unreachable');
    // "There is no state in which the product is worse off than if the model had
    // been unavailable": the deterministic ordering is identical either way.
    expect(unreachable.picker.map((c) => c.classificationId)).toEqual(
      noModel.picker.map((c) => c.classificationId),
    );
  });

  it('degrades to L-E without calling the model when the P12 budget is tripped', async () => {
    const outcome = await resolve(
      'conc pump op',
      { transport: forbiddenRanker('budget exhaustion must not call the model'), modelId: MODEL },
      { modelBudgetExhausted: true },
    );
    expect(outcome.level).toBe('L_E');
    expect(outcome.modelCalled).toBe(false);
    expect(outcome.attribution.rejection).toBe('budget_exhausted');
  });
});

describe('the free tier makes ZERO model calls', () => {
  it.each(['conc pump op', 'oper backhoe', 'CEM MASON - FINISH', 'laborer'])(
    'never reaches the transport for %s',
    async (title) => {
      const transport = recordedRanker([
        { match: '*', result: interpretWireResponse(RECORDINGS['accepted']) },
      ]);
      const outcome = await resolve(title, { transport, modelId: MODEL }, { tier: 'free' });
      expect(transport.calls).toHaveLength(0);
      expect(outcome.modelCalled).toBe(false);
      expect(CLASSIFICATION_LADDER[outcome.level].modelCall).toBe(false);
    },
  );

  it('throws if a free-tier path so much as touches a transport', async () => {
    // `forbiddenRanker` throws when called; the assertion is that it never is.
    await expect(
      resolve('conc pump op', { transport: forbiddenRanker(), modelId: MODEL }, { tier: 'free' }),
    ).resolves.toMatchObject({ level: 'L_E', modelCalled: false });
  });
});

describe('L-F — the honest refusal', () => {
  it('fires when nothing clears the lexical floor, and offers the whole list', async () => {
    const outcome = await resolve('underwater welder diver', { transport: forbiddenRanker() });
    expect(outcome.level).toBe('L_F');
    expect(outcome.picker).toHaveLength(VA_CLASSES.length);
    expect(outcome.preSelected).toBeNull();
    expect(outcome.resolved).toBeNull();
  });

  it('fires when the model declines, and does not fall back to a guess', async () => {
    const outcome = await resolve('conc pump op', paidWith('declined'));
    expect(outcome.level).toBe('L_F');
    expect(outcome.modelCalled).toBe(true);
    expect(outcome.picker).toHaveLength(VA_CLASSES.length);
  });

  it('describes the conformance path and declines the conclusion (P-D)', async () => {
    const outcome = await resolve('underwater welder diver');
    const refusal = outcome.refusal;
    expect(refusal?.primitive).toBe('P-A');
    if (refusal?.primitive !== 'P-A') return;
    expect(refusal.detail).toContain('Standard Form 1444, submitted by the contracting officer');
    expect(refusal.detail).toContain('Ratepin does not prepare or file SF-1444s');

    const declined = outcome.declined;
    expect(declined?.primitive).toBe('P-D');
    if (declined?.primitive !== 'P-D') return;
    expect(declined.citation).toBe(CONFORMANCE_CITATION);
    expect(declined.rule).toContain('be classified in conformance with the wage determination');
    expect(declined.declined).toContain('does not conclude');
    expect(declined.observableFacts.map((fact) => fact.label)).toContain('Wage determination');
  });

  it('carries no P-D at any other level', async () => {
    for (const title of ['Cement Mason/Concrete Finisher', 'pipelayer laborer', 'conc pump op']) {
      const outcome = await resolve(title, paidWith('accepted'));
      expect(outcome.declined).toBeNull();
    }
  });
});

describe('the invariants that hold at every level', () => {
  const cases: readonly (readonly [string, string, ResolveDeps])[] = [
    ['L_C1', 'Cement Mason/Concrete Finisher', {}],
    ['L_C2', 'pipelayer laborer', {}],
    ['L_D', 'conc pump op', paidWith('accepted')],
    ['L_E', 'conc pump op', paidWith('low_confidence')],
    ['L_F', 'underwater welder diver', {}],
  ];

  it.each(cases)('%s blocks the line until a click', async (level, title, deps) => {
    const outcome = await resolve(title, deps);
    expect(outcome.level).toBe(level);
    expect(outcome.resolved).toBeNull();
    expect(outcome.refusal?.primitive).toBe('P-A');
    if (outcome.refusal?.primitive !== 'P-A') return;
    expect(outcome.refusal.blockReason).toBe('UNMAPPED_TRADE');
    expect(outcome.refusal.ladderLevel).toBe(level);
    expect(CLASSIFICATION_LADDER[outcome.level].lineBlockedUntilChosen).toBe(true);
  });

  it.each(cases)('%s fills a radio only where the ladder table permits it', async (level, title, deps) => {
    const outcome = await resolve(title, deps);
    expect(outcome.preSelected !== null).toBe(CLASSIFICATION_LADDER[outcome.level].preSelected);
  });

  it.each(cases)('%s offers no route to a person (A3)', async (_level, title, deps) => {
    const outcome = await resolve(title, deps);
    for (const text of stringsOf(outcome)) {
      expect(text).not.toMatch(/mailto:|@[a-z0-9-]+\.[a-z]{2,}|contact (us|support)|help ?desk/i);
      expect(text).not.toMatch(/\bsupport\b|\bticket\b|\bescalat/i);
    }
  });

  it.each(cases)('%s never asserts, and never labels a candidate', async (_level, title, deps) => {
    const outcome = await resolve(title, deps);
    for (const text of stringsOf(outcome)) {
      expect(text).not.toMatch(/\brecommended\b|\bbest match\b|\bmost contractors\b/i);
      expect(text).not.toMatch(/\bcompliant\b|\bapproved\b|is correct\b/i);
    }
  });

  it('states the ordering footnote once, and no count beside any candidate', async () => {
    const outcome = await resolve('conc pump op', paidWith('accepted'));
    const refusal = outcome.refusal;
    if (refusal?.primitive !== 'P-A') throw new Error('expected P-A');
    expect(refusal.detail).toContain(PICKER_FOOTNOTE);
    expect(refusal.detail.split(PICKER_FOOTNOTE).length - 1).toBe(1);
    for (const choice of refusal.choices) {
      expect(Object.keys(choice)).not.toContain('count');
      expect(Object.keys(choice)).not.toContain('supportingAccounts');
    }
  });
});

describe('“None of these” opens onto the determination’s whole list', () => {
  it.each([
    ['L_C1', 'Cement Mason/Concrete Finisher'],
    ['L_C2', 'pipelayer laborer'],
    ['L_F', 'underwater welder diver'],
  ])('%s carries every parsed row behind the picker', async (level, title) => {
    const outcome = await resolve(title);
    expect(outcome.level).toBe(level);
    expect(outcome.candidates).toHaveLength(VA_CLASSES.length);
    // Best-first, and the picker is a prefix of it wherever the picker is the
    // ordered slice.
    expect([...outcome.candidates.map((c) => c.classificationId)].sort()).toEqual(
      [...VA_CLASSES.map((row) => row.id)].sort(),
    );
  });

  it('keeps the one pre-selected candidate at the head of the full list at L-C1', async () => {
    const outcome = await resolve('Cement Mason/Concrete Finisher');
    expect(outcome.picker).toHaveLength(1);
    expect(outcome.candidates[0]?.classificationId).toBe(outcome.preSelected);
  });
});

describe('rankOfChoice — what the crosswalk records about our own ranking', () => {
  it('reports the 1-based position inside the offered top three', async () => {
    const outcome = await resolve('conc pump op', paidWith('accepted'));
    const first = outcome.picker[0];
    const third = outcome.picker[2];
    expect(rankOfChoice(outcome, first?.classificationId ?? ('x' as never))).toBe(1);
    expect(rankOfChoice(outcome, third?.classificationId ?? ('x' as never))).toBe(3);
  });

  it('reports null when the customer went past the top three — the ranker’s regression row', async () => {
    const outcome = await resolve('underwater welder diver');
    const fifth = outcome.candidates[5];
    expect(rankOfChoice(outcome, fifth?.classificationId ?? ('x' as never))).toBeNull();
  });
});

describe('a title that normalizes away', () => {
  it('routes to L-F rather than to a guess', async () => {
    const outcome = await resolve('   12   ');
    expect(normalizeTitle('   12   ')).toBe('');
    expect(outcome.level).toBe('L_F');
    expect(outcome.declined?.primitive).toBe('P-D');
  });
});
