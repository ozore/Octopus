/**
 * Stage 2 — RETRIEVE. A pure function, no model call, ~0 ms, $0.
 *
 * Spec: LLM_ENGINE.md §2.2 (stage 2), E3, ADR-003 (no vector DB, no chunking, no
 * embeddings — retrieval is a code-keyed lookup on a build artifact).
 *
 * THE RETRIEVER BEING DUMB IS A FEATURE, and this is the non-obvious part: a
 * mis-retrieval would be invisible to the citation gate downstream, because a
 * citation into the *wrong* corpus document is still a citation into a corpus
 * document. A deterministic `ReasonCode → CorpusSlice` lookup has no failure
 * mode to be invisible about. Anything cleverer here would need its own
 * verification layer, which is exactly the complexity ADR-003 declines.
 *
 * The integrity checks below are therefore not defensive noise: they are the
 * only place a malformed slice can be caught before it becomes an unciteable
 * document set or a clause id that resolves to nothing.
 */

import type { EngineDeps } from './deps';
import { CorpusIntegrityError } from './errors';
import type { ReasonCode } from '../domain/reason-codes';
import type { CorpusSlice } from '../domain/types';

export function retrieve(deps: EngineDeps, code: ReasonCode): CorpusSlice {
  const started = Date.now();
  const slice = deps.corpus.getSlice(code);
  assertSliceIntegrity(slice, code);
  deps.events.emit({ type: 'stage_complete', stage: 'retrieve', durationMs: Date.now() - started });
  return slice;
}

export function assertSliceIntegrity(slice: CorpusSlice, code: ReasonCode): void {
  if (slice.code !== code) {
    throw new CorpusIntegrityError(`slice for ${code} reports code ${slice.code}`);
  }
  if (slice.taxonomy.code !== code) {
    throw new CorpusIntegrityError(`slice ${code} carries the L1 record for ${slice.taxonomy.code}`);
  }
  if (slice.policyDocs.length === 0) {
    // A code with no L2 clause cannot produce a cited draft, and a draft with no
    // allowlisted citation does not render (§6.4). Fail at retrieval, where the
    // cause is legible, rather than after paying for an Opus draft.
    throw new CorpusIntegrityError(`slice ${code} has no L2 policy documents`);
  }
  if (slice.rubric.code !== code || slice.rubric.criteria.length === 0) {
    throw new CorpusIntegrityError(`slice ${code} has no usable rubric`);
  }

  const seenClauseIds = new Set<string>();
  for (const doc of [...slice.policyDocs, slice.patternDoc]) {
    if (doc.clauses.length === 0) {
      throw new CorpusIntegrityError(`document ${doc.documentId} in slice ${code} has no clauses`);
    }
    for (const clause of doc.clauses) {
      // Clause ids are the citation's destination; a duplicate makes the
      // (document_index, block_index) → clause_id resolution ambiguous, which is
      // precisely the property E5 chose custom-content documents to guarantee.
      if (seenClauseIds.has(clause.clauseId)) {
        throw new CorpusIntegrityError(`duplicate clause id ${clause.clauseId} in slice ${code}`);
      }
      seenClauseIds.add(clause.clauseId);
      if (clause.ourSummary.trim().length === 0) {
        throw new CorpusIntegrityError(`clause ${clause.clauseId} has an empty summary`);
      }
    }
  }
}
