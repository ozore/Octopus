/**
 * Stage 2 and the corpus port.
 *
 * Spec: LLM_ENGINE.md §2.2 (retrieval is a pure code-keyed lookup), §5.3,
 * ADR-003. The integrity assertions are the only place a malformed slice can be
 * caught before it becomes an unciteable document set — after that point a bad
 * slice looks exactly like a good one to the citation gate, because a citation
 * into the WRONG corpus document is still a citation into a corpus document.
 */

import { describe, expect, it } from 'vitest';

import { adaptCorpusModule } from './corpus-port';
import { engineConfigFromEnv } from './config';
import { createDeps } from './deps';
import { CorpusIntegrityError } from './errors';
import { assertSliceIntegrity, retrieve } from './retrieve';
import { createFixtureCorpus, fixtureSlice } from './evals/fixture-corpus';
import { MockAnthropicAdapter } from '../adapters/anthropic.mock';
import { REASON_CODES } from '../domain/reason-codes';

const config = engineConfigFromEnv();
const deps = () =>
  createDeps({ model: new MockAnthropicAdapter(), corpus: createFixtureCorpus(), config });

describe('retrieve', () => {
  it('is total over the taxonomy — every one of the 33 codes resolves', () => {
    const d = deps();
    for (const code of REASON_CODES) {
      const slice = retrieve(d, code);
      expect(slice.code).toBe(code);
      expect(slice.policyDocs.length).toBeGreaterThan(0);
      expect(slice.rubric.criteria.length).toBeGreaterThan(0);
    }
  });

  it('makes no model call', async () => {
    const model = new MockAnthropicAdapter();
    retrieve(createDeps({ model, corpus: createFixtureCorpus(), config }), 'AMZ.PERF.ODR');
    expect(model.calls).toHaveLength(0);
  });

  it('rejects a slice whose clause ids collide — citation resolution must stay unambiguous', () => {
    const slice = fixtureSlice('AMZ.PERF.ODR');
    const doc = slice.policyDocs[0]!;
    const broken = {
      ...slice,
      policyDocs: [{ ...doc, clauses: [doc.clauses[0]!, { ...doc.clauses[1]!, clauseId: doc.clauses[0]!.clauseId }] }],
    };
    expect(() => assertSliceIntegrity(broken, 'AMZ.PERF.ODR')).toThrow(CorpusIntegrityError);
  });

  it('rejects a slice with no policy document — a code with no clause cannot be cited', () => {
    const slice = fixtureSlice('AMZ.PERF.ODR');
    expect(() => assertSliceIntegrity({ ...slice, policyDocs: [] }, 'AMZ.PERF.ODR')).toThrow(
      /no L2 policy documents/,
    );
  });

  it('rejects a slice that answers for a different code', () => {
    expect(() => assertSliceIntegrity(fixtureSlice('AMZ.PERF.ODR'), 'AMZ.PERF.LSR')).toThrow(
      CorpusIntegrityError,
    );
  });
});

describe('the corpus port', () => {
  it('binds a corpus module that exports the contract under any of its accepted names', () => {
    const fixture = createFixtureCorpus();
    const provider = adaptCorpusModule({
      getCorpusSlice: fixture.getSlice,
      listTaxonomyRecords: fixture.listTaxonomy,
      CORPUS_RELEASE: 7,
      PROMPT_BUNDLE_HASH: 'abc123',
    });
    expect(provider.corpusRelease).toBe(7);
    expect(provider.promptBundleHash).toBe('abc123');
    expect(provider.listTaxonomy()).toHaveLength(REASON_CODES.length);
    expect(provider.getSlice('AMZ.PERF.ODR').code).toBe('AMZ.PERF.ODR');
  });

  it('fails at wiring time, naming what was missing, rather than at the first request', () => {
    expect(() => adaptCorpusModule({ somethingElse: () => undefined })).toThrow(
      /does not satisfy CorpusProvider/,
    );
  });
});
