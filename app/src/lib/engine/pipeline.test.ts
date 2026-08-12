/**
 * The pipeline as a whole.
 *
 * Spec: LLM_ENGINE.md §1 (the chain and its two exits), §2.2 (per-stage model
 * assignment), §3.4 (cache hygiene), §5.4/§5.5 (contracts), §6.4 (the failure
 * table), E1 (workflow, not agent).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { engineConfigFromEnv } from './config';
import { CollectingEventSink } from './events';
import { createEngine } from './pipeline';
import { createFixtureCorpus, fixtureSlice } from './evals/fixture-corpus';
import { GOLDEN_SET } from './evals/golden-set';
import { queueFixture, recordClassification, recordCritique, recordDraft } from './evals/recorded';
import { MockAnthropicAdapter } from '../adapters/anthropic.mock';
import type { NoticeDocument } from '../domain/types';

const config = engineConfigFromEnv();
const ODR = GOLDEN_SET[1]!; // AMZ.PERF.ODR — a clean drafted case
const REVIEW = GOLDEN_SET[4]!; // AMZ.COC.REVIEW_MANIP — one blocking deficiency

const noticeFor = (fixture: (typeof GOLDEN_SET)[number]): NoticeDocument => ({
  caseId: `case_${fixture.id}`,
  text: fixture.notice,
  sha256: 'sha',
  receivedVia: 'paste',
});

function engineFor(fixture: (typeof GOLDEN_SET)[number]) {
  const model = new MockAnthropicAdapter();
  queueFixture(model, fixture, fixtureSlice(fixture.label as 'AMZ.PERF.ODR'));
  const events = new CollectingEventSink();
  return {
    model,
    events,
    engine: createEngine({ model, corpus: createFixtureCorpus(), config, events }),
  };
}

describe('the happy path', () => {
  it('classifies, retrieves, drafts and critiques — three model calls, one per stage', async () => {
    const { engine, model, events } = engineFor(ODR);
    const result = await engine.run(noticeFor(ODR));

    expect(result.kind).toBe('drafted');
    if (result.kind !== 'drafted') return;

    expect(result.classification.code).toBe('AMZ.PERF.ODR');
    expect(result.iterations).toBe(1);
    expect(model.calls.map((c) => c.kind)).toEqual(['structured', 'cited', 'structured']);
    expect(model.calls[0]?.request.model).toBe(config.models.classify);
    expect(model.calls[1]?.request.model).toBe(config.models.draft);
    expect(model.calls[2]?.request.model).toBe(config.models.critique);

    // Stage 2 is a pure lookup: it emits a stage_complete and makes no call.
    expect(events.of('stage_complete').map((e) => e.stage)).toEqual([
      'classify',
      'retrieve',
      'draft',
      'critique',
    ]);
  });

  it('stamps the corpus release and prompt bundle hash on the draft (ADR-008)', async () => {
    const { engine } = engineFor(ODR);
    const result = await engine.run(noticeFor(ODR));
    if (result.kind !== 'drafted') throw new Error('expected a draft');
    expect(result.draft.corpusRelease).toBe(result.slice.corpusRelease);
    expect(result.draft.promptBundleHash).toBe(result.slice.promptBundleHash);
    expect(result.draft.modelId).toBe(config.models.draft);
  });

  it('computes the readiness score in code, never from the model (§5.5)', async () => {
    const { engine } = engineFor(ODR);
    const result = await engine.run(noticeFor(ODR));
    if (result.kind !== 'drafted') throw new Error('expected a draft');

    const total = result.critique.criteria.reduce((n, c) => n + c.weight, 0);
    const met = result.critique.criteria.filter((c) => c.met).reduce((n, c) => n + c.weight, 0);
    expect(result.critique.readinessScore).toBe(Math.round((met / total) * 100));
    // The weights come from the corpus rubric, not from the model's response.
    expect(result.critique.criteria.map((c) => c.weight)).toEqual(
      result.slice.rubric.criteria.map((c) => c.weight),
    );
  });

  it('parses the three sentinel sections and nothing else', async () => {
    const { engine } = engineFor(ODR);
    const result = await engine.run(noticeFor(ODR));
    if (result.kind !== 'drafted') throw new Error('expected a draft');
    expect(Object.keys(result.draft.sections)).toEqual([
      'rootCause',
      'correctiveActions',
      'preventiveMeasures',
    ]);
    for (const body of Object.values(result.draft.sections)) expect(body.length).toBeGreaterThan(20);
  });
});

describe('the evaluator-optimizer loop is BOUNDED (E1 — no agent loop)', () => {
  it('revises once when the critique reports a blocking deficiency', async () => {
    const { engine, model, events } = engineFor(REVIEW);
    const result = await engine.run(noticeFor(REVIEW));

    if (result.kind !== 'drafted') throw new Error('expected a draft');
    expect(result.iterations).toBe(2);
    expect(result.critique.blockingDeficiencies).toEqual([]);
    expect(events.of('draft_iteration')).toHaveLength(2);

    const revision = model.calls[3];
    expect(revision?.kind).toBe('cited');
    // A revision is a FRESH request carrying the previous draft as text (§3.4),
    // not an appended turn onto a growing message array.
    expect(revision?.request.userText).toContain('## PREVIOUS DRAFT');
    expect(revision?.request.systemPrefix).toBe(model.calls[1]?.request.systemPrefix);
  });

  it('stops at maxDraftIterations even if the critique never clears', async () => {
    const slice = fixtureSlice('AMZ.COC.REVIEW_MANIP');
    const model = new MockAnthropicAdapter()
      .queueStructured(recordClassification(REVIEW))
      .queueCited(recordDraft(REVIEW, slice))
      .queueStructured(recordCritique(REVIEW, slice))
      .queueCited(recordDraft(REVIEW, slice, { revision: true }))
      .queueStructured(recordCritique(REVIEW, slice));

    const engine = createEngine({ model, corpus: createFixtureCorpus(), config });
    const result = await engine.run(noticeFor(REVIEW));

    if (result.kind !== 'drafted') throw new Error('expected a draft');
    expect(result.iterations).toBe(config.maxDraftIterations);
    expect(model.calls.filter((c) => c.kind === 'cited')).toHaveLength(2);
    // It still returns the better of the two, with the deficiency surfaced
    // rather than hidden — the critique is the pre-paywall differentiator.
    expect(result.critique.blockingDeficiencies).toContain('third_parties_named');
  });
});

describe('the failure table (§6.4)', () => {
  it('escalates a refusal, branching on stop_reason before reading content', async () => {
    const model = new MockAnthropicAdapter().queueStructured({
      json: {},
      stopReason: 'refusal',
      refusalCategory: 'other',
    });
    const events = new CollectingEventSink();
    const engine = createEngine({ model, corpus: createFixtureCorpus(), config, events });

    const result = await engine.run(noticeFor(ODR));
    expect(result).toMatchObject({ kind: 'escalate', reason: 'unclassified', failure: 'model_refusal' });
    expect(events.of('escalation')).toHaveLength(1);
  });

  it('retries max_tokens at a higher ceiling rather than accepting a truncated result', async () => {
    const model = new MockAnthropicAdapter()
      .queueStructured({ json: {}, stopReason: 'max_tokens' })
      .queueStructured(recordClassification(ODR))
      .queueCited(recordDraft(ODR, fixtureSlice('AMZ.PERF.ODR')))
      .queueStructured(recordCritique(ODR, fixtureSlice('AMZ.PERF.ODR')));

    const engine = createEngine({ model, corpus: createFixtureCorpus(), config });
    const result = await engine.run(noticeFor(ODR));

    expect(result.kind).toBe('drafted');
    expect(model.calls[0]?.request.maxTokens).toBe(config.maxTokens.classify);
    expect(model.calls[1]?.request.maxTokens).toBe(config.retryMaxTokens.classify);
  });

  it('escalates when the exhausted retry still truncates', async () => {
    const model = new MockAnthropicAdapter()
      .queueStructured({ json: {}, stopReason: 'max_tokens' })
      .queueStructured({ json: {}, stopReason: 'max_tokens' });
    const engine = createEngine({ model, corpus: createFixtureCorpus(), config });
    const result = await engine.run(noticeFor(ODR));
    expect(result).toMatchObject({ kind: 'escalate', failure: 'max_tokens_exhausted' });
  });

  it('retries a sentinel parse failure once, then escalates rather than shipping it', async () => {
    const broken = {
      blocks: [
        {
          text: 'Here is my appeal, with no headings at all.',
          citations: [
            {
              citedText: fixtureSlice('AMZ.PERF.ODR').policyDocs[0]!.clauses[0]!.ourSummary,
              documentIndex: 0,
              documentTitle: 'p',
              startBlockIndex: 0,
              endBlockIndex: 0,
            },
          ],
        },
      ],
    };
    const model = new MockAnthropicAdapter()
      .queueStructured(recordClassification(ODR))
      .queueCited(broken)
      .queueCited(broken);

    const engine = createEngine({ model, corpus: createFixtureCorpus(), config });
    const result = await engine.run(noticeFor(ODR));

    expect(result).toMatchObject({ kind: 'escalate', failure: 'draft_parse_failure' });
    expect(model.calls.filter((c) => c.kind === 'cited')).toHaveLength(2);
  });

  it('escalates an empty notice without spending a model call', async () => {
    const model = new MockAnthropicAdapter();
    const engine = createEngine({ model, corpus: createFixtureCorpus(), config });
    const result = await engine.run({ ...noticeFor(ODR), text: '   \n  ' });
    expect(result).toMatchObject({ kind: 'escalate', reason: 'unclassified' });
    expect(model.calls).toHaveLength(0);
  });
});

describe('cache hygiene (§3.4, §8.5)', () => {
  it('reads the cache on a second identical request, and says so in the event stream', async () => {
    const model = new MockAnthropicAdapter();
    const slice = fixtureSlice('AMZ.PERF.ODR');
    queueFixture(model, ODR, slice);
    queueFixture(model, ODR, slice);

    const events = new CollectingEventSink();
    const engine = createEngine({ model, corpus: createFixtureCorpus(), config, events });
    await engine.run(noticeFor(ODR));
    await engine.run(noticeFor(ODR));

    const calls = events.of('model_call');
    expect(calls).toHaveLength(6);
    // Second pass over each stage's prefix must be a cache READ, not a write.
    expect(calls.slice(3).every((c) => c.usage.cacheReadInputTokens > 0)).toBe(true);
    expect(calls[3]?.promptTokens).toBeGreaterThan(calls[3]!.usage.inputTokens);
    // Zero reads on a REPEATED prefix is the alarm; the first pass is expected
    // to be a write, so only repeats are flagged.
    expect(events.of('cache_read_zero').filter((e) => e.repeatOfIdenticalPrefix)).toHaveLength(0);
  });
});

describe('structural constraints that must not erode', () => {
  it('never imports a vendor SDK anywhere in the engine', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) {
          walk(path);
          continue;
        }
        // Test files may name an SDK in order to assert it is absent.
        if (!path.endsWith('.ts') || path.endsWith('.test.ts')) continue;
        const source = readFileSync(path, 'utf8');
        if (/@anthropic-ai\/sdk|from 'stripe'|from 'resend'/.test(source)) offenders.push(path);
      }
    };
    walk(join(process.cwd(), 'src/lib/engine'));
    expect(offenders).toEqual([]);
  });

  it('declares no tools on any request (§7.2)', async () => {
    const { engine, model } = engineFor(ODR);
    await engine.run(noticeFor(ODR));
    for (const call of model.calls) expect(call.request).not.toHaveProperty('tools');
  });

  it('never combines citations with structured output on one call (§7.1)', async () => {
    const { engine, model } = engineFor(ODR);
    await engine.run(noticeFor(ODR));
    for (const call of model.calls) {
      if (call.kind === 'cited') {
        expect(call.request).not.toHaveProperty('jsonSchema');
        expect(call.request.citableDocumentIds.length).toBeGreaterThan(0);
      } else {
        expect(call.request).not.toHaveProperty('citableDocumentIds');
        expect(call.request.jsonSchema).toBeTruthy();
      }
    }
  });
});
