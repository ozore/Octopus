/**
 * THE MODEL EDGE — the schema, the five gates, the digit ban, and the prompt bundle.
 *
 * Two whole classes of bug are what this file exists to prevent:
 *
 *  - A model response that reaches an artifact carrying something it invented. The
 *    schema makes a rate and a class name unrepresentable; these tests hold the
 *    line at every other shape a wrong response can take.
 *  - A silent cache invalidator. `cache_read_input_tokens` sitting at zero is a
 *    5–10x cost regression with NO functional symptom, so byte-stability of the
 *    cached prefix is asserted here rather than noticed on a bill.
 */

import { describe, expect, it } from 'vitest';

import {
  buildRankRequest,
  cachedPrefixOf,
  chooseCacheLayout,
  clampRawTitle,
  FORBIDDEN_PROSE,
  interpretWireResponse,
  normalizeTitle,
  RANK_ENUM_K,
  RANK_RESPONSE_SCHEMA,
  RANKER_SYSTEM_PROMPT,
  recordedRanker,
  serializeWdSlice,
  toWireBody,
  validateRankResponse,
  type RankVerdict,
} from '@/classify';
import type { ClassificationId } from '@/lib/types';

import { classByName, PIN, VA_CLASSES } from './fixtures';
import wire from './fixtures/rank-wire.json';

const RECORDINGS = wire as unknown as Record<string, unknown>;

const TITLE = normalizeTitle('conc pump op');
const CANDIDATES: readonly ClassificationId[] = [
  classByName('CEMENT MASON/CONCRETE FINISHER').id,
  classByName('OPERATOR: BACKHOE/EXCAVATOR/TRACKHOE').id,
  classByName('OPERATOR: BOBCAT/SKID STEER/SKID LOADER').id,
];

function verdictOf(key: string): RankVerdict {
  const parsed = interpretWireResponse(RECORDINGS[key]);
  if (!parsed.ok) throw new Error(`recording ${key} did not parse: ${parsed.reason}`);
  return validateRankResponse(parsed.json, { candidates: CANDIDATES, titleNorm: TITLE });
}

describe('the schema itself — E6', () => {
  it('has no numeric field and no classification-name field', () => {
    const properties = (RANK_RESPONSE_SCHEMA['properties'] ?? {}) as Record<
      string,
      { type?: string }
    >;
    expect(Object.keys(properties).sort()).toEqual([
      'confidence',
      'no_suitable_candidate',
      'ranked',
      'rationale_span',
    ]);
    // The only classification-bearing field is an integer index into a list this
    // process retrieved. A rate has nowhere to go.
    expect(properties['ranked']?.type).toBe('array');
    expect(RANK_RESPONSE_SCHEMA['additionalProperties']).toBe(false);
  });

  it('fixes the enum at [0..11] regardless of candidate count, for the grammar cache', () => {
    const ranked = (RANK_RESPONSE_SCHEMA['properties'] as Record<string, unknown>)['ranked'] as {
      items: { enum: readonly number[] };
    };
    expect(ranked.items.enum).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(ranked.items.enum.length).toBe(RANK_ENUM_K);
  });
});

describe('validateRankResponse — ENGINE §15.5’s five gates', () => {
  it('accepts a well-formed high-confidence ordering and returns ids it was given', () => {
    const verdict = verdictOf('accepted');
    expect(verdict.kind).toBe('accepted');
    if (verdict.kind !== 'accepted') return;
    expect(verdict.ranked).toEqual([CANDIDATES[1], CANDIDATES[2], CANDIDATES[0]]);
    // Gate 5 is total by construction: every returned id is one of the inputs.
    expect(verdict.ranked.every((id) => CANDIDATES.includes(id))).toBe(true);
  });

  it('reads no_suitable_candidate as a DECLINE, before any ordering gate', () => {
    // The recording has an empty `ranked` and low confidence: gates that ran first
    // would convert the most useful answer into a rejection.
    expect(verdictOf('declined').kind).toBe('declined');
  });

  it.each([
    ['extra_field', 'schema_invalid'],
    ['numeric_prose', 'forbidden_prose'],
    ['asserting_prose', 'forbidden_prose'],
    ['index_out_of_range', 'index_out_of_range'],
    ['duplicate_index', 'ranked_duplicate_index'],
    ['span_mismatch', 'span_empty_or_mismatched'],
    ['low_confidence', 'confidence_not_high'],
  ])('rejects %s with reason %s', (key, reason) => {
    const verdict = verdictOf(key);
    expect(verdict.kind).toBe('rejected');
    if (verdict.kind !== 'rejected') return;
    expect(verdict.reason).toBe(reason);
  });

  it('rejects an empty ranked array that did not decline', () => {
    const verdict = validateRankResponse(
      { ranked: [], confidence: 'high', rationale_span: 'PUMP' },
      { candidates: CANDIDATES, titleNorm: TITLE },
    );
    expect(verdict).toEqual({ kind: 'rejected', reason: 'ranked_empty' });
  });

  it('rejects a ranked array longer than the candidate list', () => {
    const verdict = validateRankResponse(
      { ranked: [0, 1, 2, 3], confidence: 'high', rationale_span: 'PUMP' },
      { candidates: CANDIDATES.slice(0, 2), titleNorm: TITLE },
    );
    expect(verdict).toEqual({ kind: 'rejected', reason: 'ranked_too_long' });
  });

  it.each([null, undefined, 42, 'a string', [], { ranked: 'nope' }])(
    'rejects a non-conforming body (%s)',
    (body) => {
      expect(
        validateRankResponse(body, { candidates: CANDIDATES, titleNorm: TITLE }),
      ).toEqual({ kind: 'rejected', reason: 'schema_invalid' });
    },
  );
});

describe('the digit ban — E7', () => {
  it.each(['20.74', '$', 'VA20260195', '§5.5', 'rate 1'])('rejects prose containing %s', (text) => {
    expect(FORBIDDEN_PROSE.test(text)).toBe(true);
  });

  it('accepts prose that is words only', () => {
    expect(FORBIDDEN_PROSE.test('PUMP OPERATOR')).toBe(false);
  });

  it('is consistent with normalization: a digit can never quote a normalized title', () => {
    // `normalizeTitle` drops every token carrying a digit, so the digit ban and the
    // substring gate are the same gate seen from two sides.
    expect(normalizeTitle('CREW 12 OPERATOR')).toBe('CREW OPERATOR');
    const verdict = validateRankResponse(
      { ranked: [0], confidence: 'high', rationale_span: 'CREW 12' },
      { candidates: CANDIDATES, titleNorm: normalizeTitle('CREW 12 OPERATOR') },
    );
    expect(verdict).toEqual({ kind: 'rejected', reason: 'forbidden_prose' });
  });
});

describe('interpretWireResponse — the transport’s closed set of outcomes', () => {
  it('reads stop_reason BEFORE content', () => {
    expect(interpretWireResponse(RECORDINGS['refusal'])).toMatchObject({
      ok: false,
      reason: 'refusal',
    });
    // The max_tokens recording carries a partial JSON body; it must never be parsed.
    expect(interpretWireResponse(RECORDINGS['max_tokens'])).toMatchObject({
      ok: false,
      reason: 'max_tokens',
    });
  });

  it.each(['truncated_json', 'no_text_block'])('maps %s to malformed', (key) => {
    expect(interpretWireResponse(RECORDINGS[key])).toMatchObject({
      ok: false,
      reason: 'malformed',
    });
  });

  it.each([null, undefined, 'text', 7])('maps a non-object body (%s) to malformed', (body) => {
    expect(interpretWireResponse(body)).toEqual({ ok: false, reason: 'malformed' });
  });

  it('surfaces the cache-read counter, which is the drift signal', () => {
    const warm = interpretWireResponse(RECORDINGS['accepted']);
    const cold = interpretWireResponse(RECORDINGS['accepted_cold_cache']);
    expect(warm.ok && warm.usage.cacheReadInputTokens).toBe(2114);
    expect(cold.ok && cold.usage.cacheReadInputTokens).toBe(0);
    expect(cold.ok && cold.usage.cacheCreationInputTokens).toBe(2114);
  });
});

describe('the prompt bundle — §15.6’s two silent-invalidator rules', () => {
  const slice = {
    wdNumber: PIN.wdNumber,
    revision: PIN.revision,
    publishDate: PIN.publishDate,
    snapshotRef: PIN.snapshotRef,
    classifications: VA_CLASSES,
  };
  const promptInput = {
    slice,
    rawTitle: 'conc pump op',
    titleNorm: TITLE,
    candidates: [
      classByName('CEMENT MASON/CONCRETE FINISHER'),
      classByName('OPERATOR: BACKHOE/EXCAVATOR/TRACKHOE'),
    ],
  };

  it('serializes block A identically whatever order the mirror returned its rows', () => {
    const forward = serializeWdSlice(slice);
    const reversed = serializeWdSlice({ ...slice, classifications: [...VA_CLASSES].reverse() });
    expect(reversed).toBe(forward);
  });

  it('puts no clock, no tenant and no request id in the cached prefix', () => {
    const request = buildRankRequest(promptInput, { model: 'claude-sonnet-5' });
    const prefix = cachedPrefixOf(request);
    expect(prefix).toContain('VA20260195 rev 2');
    expect(prefix).not.toMatch(/\d{4}-\d{2}-\d{2}T/); // no ISO timestamp
    expect(prefix).not.toMatch(/account|tenant|user|request_id/i);
    // Two independent builds of the same bundle are byte-identical.
    expect(cachedPrefixOf(buildRankRequest(promptInput, { model: 'claude-sonnet-5' }))).toBe(prefix);
  });

  it('changes the bundle hash when the volatile tail changes, and not before', () => {
    const a = buildRankRequest(promptInput, { model: 'claude-sonnet-5' });
    const b = buildRankRequest(promptInput, { model: 'claude-sonnet-5' });
    const c = buildRankRequest(
      { ...promptInput, rawTitle: 'concrete pump operator' },
      { model: 'claude-sonnet-5' },
    );
    expect(b.bundleHash).toBe(a.bundleHash);
    expect(c.bundleHash).not.toBe(a.bundleHash);
  });

  it('refuses to ask the model to rank an empty or oversized candidate list', () => {
    expect(() => buildRankRequest({ ...promptInput, candidates: [] }, { model: 'm' })).toThrow(
      /empty candidate list/,
    );
    const thirteen = Array.from({ length: 13 }, () => classByName('LABORER: PIPELAYER'));
    expect(() =>
      buildRankRequest({ ...promptInput, candidates: thirteen }, { model: 'm' }),
    ).toThrow(/fixed enum width/);
  });

  it('numbers slots in the tail and rows in the slice, so an index cannot be misread', () => {
    const request = buildRankRequest(promptInput, { model: 'claude-sonnet-5' });
    expect(request.tail.text).toContain('slot 0 = row 2');
    expect(request.tail.text).toContain('slot 1 = row 8');
    expect(request.tail.text).toContain('Normalized: "CONCRETE PUMP OPERATOR"');
  });

  it('caps the raw title at the character budget §11.4 allows the model to see', () => {
    expect(clampRawTitle(`${'x'.repeat(200)}`)).toHaveLength(128);
    expect(clampRawTitle('a b\tc')).toBe('a b c');
  });

  it('collapses to a single breakpoint when the system block is under the minimum', () => {
    expect(chooseCacheLayout(900, 1024)).toBe('single_breakpoint');
    expect(chooseCacheLayout(1100, 1024)).toBe('two_breakpoints');
    // The default is the honest one: one breakpoint at the end of block A, where
    // the prefix is comfortably over any model's minimum.
    const request = buildRankRequest(promptInput, { model: 'claude-sonnet-5' });
    expect(request.layout).toBe('single_breakpoint');
    expect(request.system.cache).toBeNull();
    expect(request.wdSlice.cache).toBe('1h');
  });

  it('states the order-only rule in the frozen instruction', () => {
    expect(RANKER_SYSTEM_PROMPT).toContain('You order a list. You never write one.');
    expect(RANKER_SYSTEM_PROMPT).toMatch(/Never state or restate a wage rate/);
  });
});

describe('toWireBody — ENGINE §20’s shape, and what it deliberately omits', () => {
  const request = buildRankRequest(
    {
      slice: {
        wdNumber: PIN.wdNumber,
        revision: PIN.revision,
        publishDate: PIN.publishDate,
        snapshotRef: PIN.snapshotRef,
        classifications: VA_CLASSES,
      },
      rawTitle: 'conc pump op',
      titleNorm: TITLE,
      candidates: [classByName('OPERATOR: BACKHOE/EXCAVATOR/TRACKHOE')],
    },
    { model: 'claude-sonnet-5' },
  );

  it('sends structured outputs, adaptive thinking and low effort', () => {
    const body = toWireBody(request);
    expect(body['model']).toBe('claude-sonnet-5');
    expect(body['thinking']).toEqual({ type: 'adaptive' });
    expect(body['output_config']).toMatchObject({
      effort: 'low',
      format: { type: 'json_schema', schema: RANK_RESPONSE_SCHEMA },
    });
  });

  it('sends no tools, no sampling parameters and no prefill', () => {
    const body = toWireBody(request);
    for (const banned of ['tools', 'tool_choice', 'temperature', 'top_p', 'top_k', 'citations', 'budget_tokens']) {
      expect(body[banned]).toBeUndefined();
    }
    const messages = body['messages'] as readonly { role: string }[];
    expect(messages.every((message) => message.role === 'user')).toBe(true);
  });

  it('puts the one-hour breakpoint on block A and none on the tail', () => {
    const body = toWireBody(request);
    const content = (body['messages'] as readonly { content: readonly Record<string, unknown>[] }[])[0]
      ?.content as readonly Record<string, unknown>[];
    expect(content[0]?.['cache_control']).toEqual({ type: 'ephemeral', ttl: '1h' });
    expect(content[1]?.['cache_control']).toBeUndefined();
  });
});

describe('recordedRanker — the suite’s only ranker', () => {
  it('matches a recording on the normalized title and records the request', async () => {
    const parsed = interpretWireResponse(RECORDINGS['accepted']);
    const transport = recordedRanker([{ match: String(TITLE), result: parsed }]);
    const request = buildRankRequest(
      {
        slice: {
          wdNumber: PIN.wdNumber,
          revision: PIN.revision,
          publishDate: PIN.publishDate,
          snapshotRef: PIN.snapshotRef,
          classifications: VA_CLASSES,
        },
        rawTitle: 'conc pump op',
        titleNorm: TITLE,
        candidates: [classByName('OPERATOR: BACKHOE/EXCAVATOR/TRACKHOE')],
      },
      { model: 'claude-sonnet-5' },
    );
    const result = await transport.send(request);
    expect(result.ok).toBe(true);
    expect(transport.calls).toHaveLength(1);
  });

  it('reports unreachable when nothing was recorded for the title', async () => {
    const transport = recordedRanker([]);
    const request = buildRankRequest(
      {
        slice: {
          wdNumber: PIN.wdNumber,
          revision: PIN.revision,
          publishDate: PIN.publishDate,
          snapshotRef: PIN.snapshotRef,
          classifications: VA_CLASSES,
        },
        rawTitle: 'anything',
        titleNorm: normalizeTitle('anything'),
        candidates: [classByName('LABORER: PIPELAYER')],
      },
      { model: 'claude-sonnet-5' },
    );
    expect(await transport.send(request)).toEqual({ ok: false, reason: 'unreachable' });
  });
});
