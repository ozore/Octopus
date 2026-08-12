/**
 * Packing a `CorpusSlice` into prompt-cache-ready, citation-ready document
 * blocks.
 *
 * Spec: LLM_ENGINE.md §4.2 (custom-content documents; one content block per
 * clause), §3.4 (cache hygiene), CORPUS_DESIGN.md §5.1–§5.2, ADR-003.
 *
 * The two mechanisms this file serves want opposite things, and the packing is
 * where they are reconciled:
 *
 *  - **Prompt caching is a prefix match.** Any byte change anywhere in the
 *    prefix invalidates everything after it. So the packed bytes must be a pure
 *    function of corpus content: sorted keys, fixed record order, no clock, no
 *    build id, no UUID. `assertCacheSafe` makes that checkable rather than
 *    hoped-for, because a silent invalidation has no functional symptom at all —
 *    only a ~10x cost increase that nobody notices for a month.
 *
 *  - **Citations need small, addressable documents.** One content block per
 *    clause makes `content_block_location.start_block_index` a direct index into
 *    our own clause array, so `clause_id` resolution is total: no fuzzy
 *    character-offset matching, no chunk-boundary artifacts, and no chunking
 *    strategy to tune (which is exactly what N5 wanted to avoid).
 *
 * `title` and `context` are passed to the model but are NOT citable, which is
 * why clause ids, source URLs and the corpus release live there: visible as
 * grounding metadata, structurally incapable of being returned as a quoted
 * policy clause.
 */

import { createHash } from 'node:crypto';

import type { CorpusDocument, CorpusSlice } from '../domain/types';
import { PATTERN_DOCUMENT_PREFIX } from './retrieval';

export type TextBlock = { type: 'text'; text: string };

export type DocumentBlock = {
  type: 'document';
  source: { type: 'content'; content: TextBlock[] };
  title: string;
  context: string;
  citations: { enabled: true };
  cache_control?: { type: 'ephemeral' };
};

export type AllowlistEntry = {
  documentIndex: number;
  documentId: string;
  sourceUrl: string;
  title: string;
  /** 'policy' may render as a policy clause; 'pattern' is our own guidance. */
  kind: 'policy' | 'pattern';
  clauseIds: string[];
};

export type PackedSlice = {
  blocks: DocumentBlock[];
  /** document_index -> corpus record. The citation gate's allowlist (ADR-102). */
  allowlist: Map<number, AllowlistEntry>;
  /** SHA-256 over the canonical serialisation. Stable across builds. */
  contentHash: string;
};

/** JSON with keys sorted at every level — the serialisation ADR-003 requires. */
export function canonicalJson(value: unknown): string {
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(v as Record<string, unknown>).sort()) {
        out[key] = walk((v as Record<string, unknown>)[key]);
      }
      return out;
    }
    return v;
  };
  return JSON.stringify(walk(value));
}

export function sha256Hex(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * Gate G11. Anything that varies between two builds of identical content is a
 * cache invalidator; these are the shapes that actually show up in practice.
 * Returns the offending substrings so a failure names itself.
 */
export function findCacheInvalidators(text: string): string[] {
  const patterns: Array<[string, RegExp]> = [
    ['iso timestamp', /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/],
    ['uuid', /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i],
    ['ulid', /\bcase_[0-9A-HJKMNP-TV-Z]{26}\b/],
    ['epoch millis', /\b1[6-9]\d{11}\b/],
    ['build id', /\bbuild[_-]?id\b/i],
  ];
  return patterns.filter(([, re]) => re.test(text)).map(([name]) => name);
}

export function assertCacheSafe(text: string): void {
  const found = findCacheInvalidators(text);
  if (found.length > 0) {
    throw new Error(
      `cached prefix contains volatile content (${found.join(', ')}). ` +
        'Gate G11 — a cache invalidator above a breakpoint has no functional symptom, only a 10x cost regression.',
    );
  }
}

function documentBlock(doc: CorpusDocument, kind: 'policy' | 'pattern'): DocumentBlock {
  return {
    type: 'document',
    source: {
      type: 'content',
      // ONE BLOCK PER CLAUSE. The block index is the clause index; do not merge,
      // split or reorder without treating it as a breaking corpus change.
      content: doc.clauses.map((clause) => ({
        type: 'text' as const,
        text: clause.quotedExcerpt
          ? `${clause.heading}\n\n${clause.ourSummary}\n\nQuoted excerpt: "${clause.quotedExcerpt}"`
          : `${clause.heading}\n\n${clause.ourSummary}`,
      })),
    },
    title: doc.title,
    context: canonicalJson({
      clause_ids: doc.clauses.map((c) => c.clauseId),
      corpus_release: doc.corpusRelease,
      kind,
      source_url: doc.sourceUrl,
    }),
    citations: { enabled: true },
  };
}

/**
 * Pack the slice for the drafting call.
 *
 * `citations: {enabled: true}` is set on every document because the API requires
 * all-or-nothing per request. The seller's notice is deliberately NOT packed
 * here: it is appended by the caller as a separate document whose index is
 * absent from this allowlist, so a citation resolving to the notice is
 * detectable as an injection signal rather than rendering as policy (ADR-102).
 */
export function packSlice(slice: CorpusSlice, opts: { cacheBreakpoint: boolean } = { cacheBreakpoint: true }): PackedSlice {
  const docs: Array<{ doc: CorpusDocument; kind: 'policy' | 'pattern' }> = [
    ...slice.policyDocs
      .slice()
      .sort((a, b) => a.documentId.localeCompare(b.documentId))
      .map((doc) => ({ doc, kind: 'policy' as const })),
    { doc: slice.patternDoc, kind: 'pattern' as const },
  ];

  const blocks: DocumentBlock[] = [];
  const allowlist = new Map<number, AllowlistEntry>();

  docs.forEach(({ doc, kind }, index) => {
    blocks.push(documentBlock(doc, kind));
    allowlist.set(index, {
      documentIndex: index,
      documentId: doc.documentId,
      sourceUrl: doc.sourceUrl,
      title: doc.title,
      kind,
      clauseIds: doc.clauses.map((c) => c.clauseId),
    });
  });

  if (opts.cacheBreakpoint && blocks.length > 0) {
    // One breakpoint, on the last block: everything above it is the stable
    // per-code prefix, and the volatile notice sits below it.
    blocks[blocks.length - 1]!.cache_control = { type: 'ephemeral' };
  }

  const serialised = canonicalJson(blocks.map(({ cache_control: _ignored, ...rest }) => rest));
  assertCacheSafe(serialised);

  return { blocks, allowlist, contentHash: sha256Hex(serialised) };
}

/**
 * Resolve a citation to a clause id. Total over the allowlist by construction:
 * an index that is not in the allowlist yields null, which the caller must treat
 * as an injection signal, not as a missing lookup (ADR-102).
 */
export function resolveCitation(
  allowlist: ReadonlyMap<number, AllowlistEntry>,
  documentIndex: number,
  startBlockIndex: number,
): { clauseId: string; sourceUrl: string; documentTitle: string; kind: 'policy' | 'pattern' } | null {
  const entry = allowlist.get(documentIndex);
  if (!entry) return null;
  const clauseId = entry.clauseIds[startBlockIndex];
  if (clauseId === undefined) return null;
  return { clauseId, sourceUrl: entry.sourceUrl, documentTitle: entry.title, kind: entry.kind };
}

/** True where the resolved citation may render in the policy-clause slot. */
export function isRenderablePolicyCitation(resolved: { clauseId: string; kind: string } | null): boolean {
  return resolved !== null && resolved.kind === 'policy' && !resolved.clauseId.startsWith(PATTERN_DOCUMENT_PREFIX);
}

/**
 * A character heuristic, and labelled as one. LLM_ENGINE.md §3.2 requires the
 * BUILD to count tokens with the API's `count_tokens` and fail above the
 * ceiling; that call needs the network and a key, so it cannot live in the test
 * suite. This estimate exists to catch order-of-magnitude drift offline. Do not
 * promote it to the gate.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.6);
}
