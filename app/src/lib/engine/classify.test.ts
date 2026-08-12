/**
 * Stage 1 and the threshold gate.
 *
 * Spec: LLM_ENGINE.md §5.1, §6.1, E6, I5. Every case below is an escalation
 * path, because escalation is the behaviour that keeps R3 ("a confidently-wrong
 * document is worse than no product") from happening. A test suite that only
 * exercised the happy path would be testing the least important half.
 */

import { describe, expect, it } from 'vitest';

import { applyThreshold, buildClassifyRequest, classify, isVerbatim } from './classify';
import { engineConfigFromEnv } from './config';
import { createDeps } from './deps';
import { CollectingEventSink } from './events';
import { createFixtureCorpus } from './evals/fixture-corpus';
import { GOLDEN_SET } from './evals/golden-set';
import { recordClassification } from './evals/recorded';
import { MockAnthropicAdapter } from '../adapters/anthropic.mock';
import { REASON_CODES } from '../domain/reason-codes';
import type { ClassificationResponse, NoticeDocument } from '../domain/types';

const config = engineConfigFromEnv();

const NOTICE = [
  'Your Amazon selling account has been deactivated.',
  'Your order defect rate is above the 1% target that we require of all sellers.',
  'A rights owner reported that your listings infringe their trademark.',
].join('\n');

const response = (over: Partial<ClassificationResponse> = {}): ClassificationResponse => ({
  marketplace: 'amazon',
  scope: 'account',
  noticeLanguage: 'en',
  candidates: [
    {
      code: 'AMZ.PERF.ODR',
      confidence: 0.94,
      evidenceSpans: [{ quote: 'Your order defect rate is above the 1% target', start: 50, end: 94 }],
    },
    { code: 'AMZ.PERF.AHR', confidence: 0.05, evidenceSpans: [] },
  ],
  noticeContainsInstructions: false,
  ...over,
});

const notice = (text = NOTICE): NoticeDocument => ({
  caseId: 'case_test',
  text,
  sha256: 'sha',
  receivedVia: 'paste',
});

describe('applyThreshold — the gate decides, the model ranks', () => {
  it('classifies when all three signals agree', () => {
    const outcome = applyThreshold(response(), NOTICE, config);
    expect(outcome.kind).toBe('classified');
    if (outcome.kind !== 'classified') return;
    expect(outcome.code).toBe('AMZ.PERF.ODR');
    expect(outcome.margin).toBeCloseTo(0.89, 5);
    expect(outcome.evidence).toHaveLength(1);
  });

  it('escalates a listing-level notice as out of scope (N9)', () => {
    const outcome = applyThreshold(response({ scope: 'listing' }), NOTICE, config);
    expect(outcome).toMatchObject({ kind: 'escalate', reason: 'out_of_scope' });
  });

  it('escalates when the marketplace cannot be identified (N8)', () => {
    const outcome = applyThreshold(response({ marketplace: 'unknown' }), NOTICE, config);
    expect(outcome).toMatchObject({ kind: 'escalate', reason: 'unsupported_marketplace' });
  });

  it('escalates UNCLASSIFIED rather than guessing', () => {
    const outcome = applyThreshold(
      response({
        candidates: [{ code: 'UNCLASSIFIED', confidence: 0.99, evidenceSpans: [] }],
      }),
      NOTICE,
      config,
    );
    expect(outcome).toMatchObject({ kind: 'escalate', reason: 'unclassified' });
  });

  it('routes a refused category out before payment REGARDLESS of confidence (§6.1)', () => {
    const outcome = applyThreshold(
      response({
        candidates: [
          {
            code: 'AMZ.IP.TRADEMARK',
            confidence: 0.99,
            evidenceSpans: [
              { quote: 'A rights owner reported that your listings infringe', start: 0, end: 50 },
            ],
          },
        ],
      }),
      NOTICE,
      config,
    );
    expect(outcome).toMatchObject({ kind: 'escalate', reason: 'refused_category' });
  });

  it('escalates when the evidence span is fabricated — caught by string search, not judgment', () => {
    const outcome = applyThreshold(
      response({
        candidates: [
          {
            code: 'AMZ.PERF.ODR',
            confidence: 0.98,
            evidenceSpans: [
              { quote: 'your account was closed for late shipments', start: 0, end: 41 },
            ],
          },
        ],
      }),
      NOTICE,
      config,
    );
    expect(outcome).toMatchObject({ kind: 'escalate', reason: 'no_evidence_span' });
  });

  it('escalates when no evidence span is offered at all', () => {
    const outcome = applyThreshold(
      response({
        candidates: [{ code: 'AMZ.PERF.ODR', confidence: 0.97, evidenceSpans: [] }],
      }),
      NOTICE,
      config,
    );
    expect(outcome).toMatchObject({ kind: 'escalate', reason: 'no_evidence_span' });
  });

  it('escalates below τ', () => {
    const base = response();
    const outcome = applyThreshold(
      response({
        candidates: [{ ...base.candidates[0]!, confidence: 0.4 }],
      }),
      NOTICE,
      config,
    );
    expect(outcome).toMatchObject({ kind: 'escalate', reason: 'low_confidence' });
  });

  it('escalates a thin margin even when top-1 clears τ — the dangerous case', () => {
    const base = response();
    const outcome = applyThreshold(
      response({
        candidates: [
          { ...base.candidates[0]!, confidence: 0.82 },
          { code: 'AMZ.PERF.AHR', confidence: 0.78, evidenceSpans: [] },
        ],
      }),
      NOTICE,
      config,
    );
    expect(outcome).toMatchObject({ kind: 'escalate', reason: 'thin_margin' });
  });

  it('escalates when the code does not belong to the reported marketplace', () => {
    const outcome = applyThreshold(
      response({
        candidates: [
          {
            code: 'WMT.PERF.ODR',
            confidence: 0.95,
            evidenceSpans: [
              { quote: 'Your order defect rate is above the 1% target', start: 0, end: 44 },
            ],
          },
        ],
      }),
      NOTICE,
      config,
    );
    expect(outcome).toMatchObject({ kind: 'escalate', reason: 'unsupported_marketplace' });
  });

  it('does not take the model\'s word for its own ordering', () => {
    const base = response();
    const outcome = applyThreshold(
      response({
        candidates: [
          { code: 'AMZ.PERF.AHR', confidence: 0.02, evidenceSpans: [] },
          { ...base.candidates[0]! },
        ],
      }),
      NOTICE,
      config,
    );
    expect(outcome).toMatchObject({ kind: 'classified', code: 'AMZ.PERF.ODR' });
  });
});

describe('isVerbatim', () => {
  it('matches across the line breaks a pasted notice carries', () => {
    expect(isVerbatim('deactivated. Your order defect rate', NOTICE)).toBe(true);
  });

  it('rejects a degenerate span that would match anything', () => {
    expect(isVerbatim('the', NOTICE)).toBe(false);
  });
});

describe('the stage-1 request', () => {
  const deps = () =>
    createDeps({
      model: new MockAnthropicAdapter(),
      corpus: createFixtureCorpus(),
      config,
      events: new CollectingEventSink(),
    });

  it('carries the whole L1 taxonomy in the cached prefix — it cannot route without it', () => {
    const request = buildClassifyRequest(deps(), notice(), 2000);
    for (const code of REASON_CODES) expect(request.systemPrefix).toContain(code);
  });

  it('keeps every volatile value BELOW the breakpoint (§3.1)', () => {
    const d = deps();
    const a = buildClassifyRequest(d, notice(), 2000);
    const b = buildClassifyRequest(d, { ...notice(), caseId: 'case_other', text: 'different text' }, 4000);
    expect(a.systemPrefix).toBe(b.systemPrefix);
    expect(a.systemPrefix).not.toContain('case_test');
    expect(a.systemPrefix).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('sends the notice as a document, never concatenated into instructions (§6.2)', () => {
    const request = buildClassifyRequest(deps(), notice(), 2000);
    expect(request.documents?.[0]?.source).toEqual({ type: 'text', text: NOTICE });
    expect(request.systemPrefix).not.toContain(NOTICE);
    expect(request.userText).not.toContain(NOTICE);
  });

  it('sends a strict JSON schema and no citations (they would 400 together)', () => {
    const request = buildClassifyRequest(deps(), notice(), 2000);
    expect(request.kind).toBe('structured');
    expect(request.schemaName).toBe('classification_response');
    expect(request.jsonSchema).toHaveProperty('properties');
    expect(request).not.toHaveProperty('citableDocumentIds');
  });
});

describe('classify — end to end against a recorded response', () => {
  it('validates the contract and applies the gate', async () => {
    const fixture = GOLDEN_SET[1]!;
    const model = new MockAnthropicAdapter().queueStructured(recordClassification(fixture));
    const events = new CollectingEventSink();
    const deps = createDeps({ model, corpus: createFixtureCorpus(), config, events });

    const { outcome, response: parsed } = await classify(deps, notice(fixture.notice));
    expect(parsed.marketplace).toBe('amazon');
    expect(outcome).toMatchObject({ kind: 'classified', code: 'AMZ.PERF.ODR' });
    expect(events.of('model_call')).toHaveLength(1);
  });

  it('is a hard error, never a repaired value, when the contract is violated', async () => {
    const model = new MockAnthropicAdapter().queueStructured({
      json: { marketplace: 'ebay', scope: 'account', candidates: [] },
    });
    const deps = createDeps({ model, corpus: createFixtureCorpus(), config });
    await expect(classify(deps, notice())).rejects.toThrow(/contract/i);
  });
});
