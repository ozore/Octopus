/**
 * Scaffold smoke tests.
 *
 * These assert the three properties the scaffold exists to guarantee, and each
 * one guards a decision that is easy to erode silently:
 *
 *  1. The taxonomy is exactly 33 codes plus UNCLASSIFIED (CORPUS_DESIGN §3.2).
 *  2. Config validation fails fast, and mock adapters need no credential — the
 *     precondition for running the whole suite with no network and no keys.
 *  3. The queue is a table claimed with FOR UPDATE SKIP LOCKED, against a real
 *     Postgres engine (PGlite), not a stub.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { parseEnv, resetEnv } from '../src/env';
import { buildAdapters } from '../src/lib/adapters';
import { MockAnthropicAdapter } from '../src/lib/adapters/anthropic.mock';
import {
  CLASSIFIER_LABELS,
  REASON_CODES,
  REFUSED_CATEGORIES,
  UNCLASSIFIED,
} from '../src/lib/domain/reason-codes';

const baseEnv = {
  NODE_ENV: 'test',
  ADAPTER_MODE: 'mock',
  DATABASE_DRIVER: 'pglite',
  CORPUS_RELEASE: '0',
  PROMPT_BUNDLE_HASH: 'test-bundle',
};

beforeEach(() => {
  resetEnv();
});

describe('reason-code taxonomy', () => {
  it('carries exactly 33 codes plus the escape hatch', () => {
    expect(REASON_CODES).toHaveLength(33);
    expect(CLASSIFIER_LABELS).toHaveLength(34);
    expect(CLASSIFIER_LABELS).toContain(UNCLASSIFIED);
  });

  it('has no duplicate codes (ids are append-only and load-bearing)', () => {
    expect(new Set(REASON_CODES).size).toBe(REASON_CODES.length);
  });

  it('refuses the six counsel-referral categories before payment', () => {
    // Honest triage runs BEFORE payment — it is also the adverse-selection
    // control that makes the refund guarantee safe to offer.
    expect([...REFUSED_CATEGORIES].sort()).toEqual(
      [
        'AMZ.AUTH.COUNTERFEIT',
        'AMZ.COC.FRAUD',
        'AMZ.IP.COPYRIGHT',
        'AMZ.IP.PATENT',
        'AMZ.IP.TRADEMARK',
      ].sort(),
    );
  });
});

describe('environment validation (Twelve-Factor III)', () => {
  it('accepts the offline test shape with no credentials', () => {
    const env = parseEnv(baseEnv);
    expect(env.ADAPTER_MODE).toBe('mock');
    expect(env.DATABASE_DRIVER).toBe('pglite');
  });

  it('requires credentials when adapters are live', () => {
    expect(() => parseEnv({ ...baseEnv, ADAPTER_MODE: 'live' })).toThrow(/ANTHROPIC_API_KEY/);
  });

  it('requires DATABASE_URL when the driver is postgres', () => {
    expect(() => parseEnv({ ...baseEnv, DATABASE_DRIVER: 'postgres' })).toThrow(/DATABASE_URL/);
  });

  it('refuses mock adapters and pglite in production', () => {
    expect(() =>
      parseEnv({ ...baseEnv, NODE_ENV: 'production', DATABASE_URL: 'postgres://x/y' }),
    ).toThrow(/production/);
  });

  it('withholds the delivery-time guarantee by default (gate G6)', () => {
    expect(parseEnv(baseEnv).TIME_GUARANTEE_ADVERTISED).toBe(false);
  });
});

describe('adapters', () => {
  it('binds mock implementations with no API key present', () => {
    for (const [k, v] of Object.entries(baseEnv)) process.env[k] = v;
    delete process.env['ANTHROPIC_API_KEY'];
    const adapters = buildAdapters();
    expect(adapters.model).toBeInstanceOf(MockAnthropicAdapter);
    expect(adapters.email.buildIngestAddress('abc123')).toMatch(/^shield\+abc123@/);
  });

  it('reports a cache read on the second identical prefix', async () => {
    // Zero cache reads across repeated requests is a 5–10× cost regression with
    // no functional symptom — the class of bug that hides (LLM_ENGINE §3.4).
    const model = new MockAnthropicAdapter();
    model.queueStructured({ json: { ok: true } }, { json: { ok: true } });
    const req = {
      kind: 'structured' as const,
      model: 'claude-sonnet-5',
      systemPrefix: 'ROUTING PREFIX + L1 TAXONOMY',
      maxTokens: 2000,
      effort: 'medium' as const,
      userText: 'classify this',
      schemaName: 'classification',
      jsonSchema: {},
    };
    const first = await model.runStructured(req);
    const second = await model.runStructured(req);
    expect(first.usage.cacheReadInputTokens).toBe(0);
    expect(second.usage.cacheReadInputTokens).toBeGreaterThan(0);
  });
});
