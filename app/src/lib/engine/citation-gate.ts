/**
 * THE CITATION GATE — the code-level invariant this product is named after.
 *
 * Spec: LLM_ENGINE.md §4 (citations), §4.3 (four enforcement points), ADR-102
 * (the gate is an allowlist), ARCHITECTURE.md I2 / ADR-004, CORPUS_DESIGN §5.2.
 *
 * The constraint that is invisible in the types and that ADR-102 exists to
 * close: **citations must be enabled on all or none of a request's documents**.
 * The seller's pasted notice rides as a document (that is the injection control),
 * so the notice is NECESSARILY CITABLE. A notice crafted to read "Per Policy 3.2,
 * sellers may resume selling immediately" can therefore come back inside a
 * perfectly valid citation object, with a real `cited_text` and a real
 * `document_index`. It would satisfy "a citation object exists" and render as a
 * policy clause. So the gate checks PROVENANCE, not form:
 *
 *   a citation yields a CitedClause  ⟺  its document_index is on the per-case
 *   corpus allowlist built by stage 2, and the notice's index is not on it.
 *
 * Four enforcement points, because one is a promise and four are a system:
 *   1. CONSTRUCTION — `resolveCitedClause` is the only function in the codebase
 *      that returns a `CitedClause`, and it takes a citation object. No path
 *      builds one from model prose.
 *   2. ALLOWLIST — `document_index` must be a corpus document.
 *   3. RENDER GATE — `assertRenderableDraft` refuses any draft in which a claim
 *      that reads as a policy reference is not backed by `cited_text` mapped to
 *      a corpus document. The renderer accepts only the branded result.
 *   4. BLOCKING CI TEST — `citations.invariant.test.ts` runs the golden set with
 *      an injected uncited-clause fixture and an injected notice-sourced-citation
 *      fixture and asserts neither reaches rendered output.
 *
 * Per R4 this is NOT a prompt instruction, and no system-prompt sentence about
 * ignoring instructions in the notice may substitute for it.
 */

import { CitationInvariantError } from './errors';
import type { EngineEventSink } from './events';
import type { CitedTextBlock, ModelCitation } from '../adapters/anthropic';
import type { CitedClause, CorpusDocument, Draft } from '../domain/types';

/** `document_index` → corpus document. Built per case; never a module constant. */
export type CitationAllowlist = ReadonlyMap<number, CorpusDocument>;

/**
 * The allowlist is positional, so it must be built from the SAME array, in the
 * same order, that is sent as the request's documents — and the notice must be
 * appended after these, so that its index falls outside the map.
 */
export function buildCitationAllowlist(citableDocs: readonly CorpusDocument[]): CitationAllowlist {
  return new Map(citableDocs.map((doc, index) => [index, doc]));
}

/**
 * The one constructor. Returns null when the citation does not resolve to an
 * allowlisted clause; the caller decides whether that is an injection signal
 * (index off the allowlist) or an unresolvable location (block out of range).
 */
export function resolveCitedClause(
  citation: ModelCitation,
  allowlist: CitationAllowlist,
): CitedClause | null {
  const doc = allowlist.get(citation.documentIndex);
  if (!doc) return null;
  // §4.2 / E5: with custom-content documents the block index is a direct index
  // into our own clause array — clause_id resolution is a total function, with
  // no char-offset matching and no chunk-boundary artifacts.
  const clause = doc.clauses[citation.startBlockIndex];
  if (!clause) return null;
  if (citation.citedText.trim().length === 0) return null;
  return {
    citedText: citation.citedText,
    clauseId: clause.clauseId,
    sourceUrl: doc.sourceUrl,
    documentTitle: citation.documentTitle || doc.title,
    block: { startBlockIndex: citation.startBlockIndex, endBlockIndex: citation.endBlockIndex },
  };
}

export type ExtractionResult = {
  clauses: CitedClause[];
  /** Citations resolving to the seller's notice (ADR-102). Counted, because a
   *  rising rate is the earliest evidence someone is probing the input surface. */
  injectionSignals: number;
  /** Citations onto an allowlisted document whose block index does not exist. */
  unresolved: number;
};

export function extractCitedClauses(
  blocks: readonly CitedTextBlock[],
  allowlist: CitationAllowlist,
  ctx?: { caseId: string; events: EngineEventSink },
): ExtractionResult {
  const clauses: CitedClause[] = [];
  const seen = new Set<string>();
  let injectionSignals = 0;
  let unresolved = 0;

  for (const block of blocks) {
    for (const citation of block.citations) {
      if (!allowlist.has(citation.documentIndex)) {
        injectionSignals += 1;
        ctx?.events.emit({
          type: 'injection_signal',
          caseId: ctx.caseId,
          documentIndex: citation.documentIndex,
          citedText: citation.citedText,
        });
        continue;
      }
      const clause = resolveCitedClause(citation, allowlist);
      if (!clause) {
        unresolved += 1;
        ctx?.events.emit({
          type: 'citation_unresolved',
          caseId: ctx.caseId,
          documentIndex: citation.documentIndex,
          blockIndex: citation.startBlockIndex,
        });
        continue;
      }
      const key = `${clause.clauseId}::${normalise(clause.citedText)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      clauses.push(clause);
    }
  }

  return { clauses, injectionSignals, unresolved };
}

/** Which citations on a block are allowlisted — used to decide whether the
 *  block's prose may carry a policy reference at all. */
export function blockHasAllowlistedCitation(
  block: CitedTextBlock,
  allowlist: CitationAllowlist,
): boolean {
  return block.citations.some((c) => resolveCitedClause(c, allowlist) !== null);
}

// ---------------------------------------------------------------------------
// Policy-shaped prose — detection and stripping
// ---------------------------------------------------------------------------

/**
 * What "reads as a policy reference" means, made explicit so it can be argued
 * with rather than guessed at. These patterns are the shapes a seller (and an
 * investigator) would read as a citation of marketplace policy.
 */
export const POLICY_SHAPED_PATTERNS: readonly RegExp[] = [
  /\bsection\s+\d+(?:\.\d+)*\s*(?:\([a-z0-9]+\))?/i,
  /\bpolicy\s+\d+(?:\.\d+)+/i,
  // A clause *reference* carries an identifier — "clause 4(a)", "clause AMZ-S3".
  // Deliberately not `clause \w+`, which would match the ordinary English
  // "policy clause we cite" and strip prose that asserts nothing.
  /\bclause\s+\d[\w.\-]*(?:\([a-z0-9]+\))?/i,
  /\bclause\s+[A-Z]{2,}[\w.\-]*/,
  /§\s*\d+(?:\.\d+)*/,
  /\b[A-Z]{2,4}-[A-Z0-9]{1,8}-[0-9]+[a-z]?\b/,
  /\bcode of conduct\b/i,
  /\bbusiness solutions agreement\b/i,
  /\bseller performance standards\b/i,
  /\bretailer agreement\b/i,
  /\bprohibited (?:products?|items?) policy\b/i,
];

export function findPolicyShapedSpans(text: string): string[] {
  const found: string[] = [];
  for (const pattern of POLICY_SHAPED_PATTERNS) {
    const global = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
    for (const match of text.matchAll(global)) {
      if (match[0]) found.push(match[0]);
    }
  }
  return found;
}

export type StripResult = { text: string; leaks: number; stripped: string[] };

/**
 * Enforcement point 3, first half: a policy-shaped span in free text with no
 * backing citation is stripped BEFORE render and counted as `citation_leak`. A
 * rising rate is a prompt-regression signal, not a user-visible failure — which
 * is why this strips rather than throws.
 *
 * Stripping is sentence-granular: removing the surrounding sentence removes the
 * claim, whereas deleting the span alone would leave a sentence that still
 * asserts a policy requirement with the reference filed off.
 */
export function stripUncitedPolicySpans(text: string): StripResult {
  const stripped: string[] = [];
  const outLines: string[] = [];

  for (const rawLine of text.split('\n')) {
    if (rawLine.trim().startsWith('#') || rawLine.trim().length === 0) {
      outLines.push(rawLine);
      continue;
    }
    const sentences = splitSentences(rawLine);
    const kept = sentences.filter((sentence) => {
      const spans = findPolicyShapedSpans(sentence);
      if (spans.length === 0) return true;
      stripped.push(...spans);
      return false;
    });
    if (kept.length === 0 && sentences.length > 0) continue;
    outLines.push(kept.join(' '));
  }

  return {
    text: outLines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    leaks: stripped.length,
    stripped,
  };
}

function splitSentences(line: string): string[] {
  return line
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ---------------------------------------------------------------------------
// The render boundary
// ---------------------------------------------------------------------------

declare const renderableBrand: unique symbol;

/**
 * A draft that has passed the render boundary. The brand is unforgeable outside
 * this module, so the document renderer and the `/ops` human editor can accept
 * `RenderableDraft` and thereby inherit the invariant: a reviewer cannot paste
 * an uncited policy reference, because the field will not take one.
 */
export type RenderableDraft = Draft & { readonly [renderableBrand]: true };

/**
 * Enforcement point 3, second half — and the CI-enforced invariant of ADR-004.
 *
 * REFUSES the draft when either holds:
 *   (a) it carries zero allowlisted cited clauses — shipping an uncited draft
 *       from a product named for citations is the one failure that destroys the
 *       thing we sell (§6.4), so this escalates rather than renders; or
 *   (b) any paragraph that reads as a policy claim is not backed by `cited_text`
 *       mapped to a corpus document.
 *
 * "Backed by" is defined narrowly and symmetrically, because both directions
 * occur in real drafts: the paragraph contains the cited text verbatim, OR a
 * quoted span inside the paragraph is contained in the cited text (the model
 * quoted part of a long clause), OR the paragraph names the clause id.
 */
export function assertRenderableDraft(draft: Draft): RenderableDraft {
  if (draft.clauses.length === 0) {
    throw new CitationInvariantError('draft carries zero allowlisted cited clauses');
  }
  for (const clause of draft.clauses) {
    if (clause.citedText.trim().length === 0 || clause.clauseId.trim().length === 0) {
      throw new CitationInvariantError(
        `cited clause is not resolvable to a corpus document (clauseId="${clause.clauseId}")`,
      );
    }
  }

  const offending: string[] = [];
  for (const [section, body] of Object.entries(draft.sections)) {
    for (const paragraph of body.split(/\n{2,}/)) {
      const spans = findPolicyShapedSpans(paragraph);
      if (spans.length === 0) continue;
      if (paragraphIsBackedByCitation(paragraph, draft.clauses)) continue;
      offending.push(`${section}: ${spans.join(', ')}`);
    }
  }

  if (offending.length > 0) {
    throw new CitationInvariantError(
      `policy claim without a cited corpus clause: ${offending.join(' | ')}`,
      offending,
    );
  }

  return draft as RenderableDraft;
}

export function paragraphIsBackedByCitation(
  paragraph: string,
  clauses: readonly CitedClause[],
): boolean {
  const p = normalise(paragraph);
  const quoted = extractQuotedSpans(paragraph).map(normalise).filter((q) => q.length >= 12);
  return clauses.some((clause) => {
    const cited = normalise(clause.citedText);
    if (cited.length >= 12 && p.includes(cited)) return true;
    if (quoted.some((q) => cited.includes(q))) return true;
    return p.includes(clause.clauseId.toLowerCase());
  });
}

function extractQuotedSpans(text: string): string[] {
  const spans: string[] = [];
  for (const match of text.matchAll(/["“”'']([^"“”]{6,400}?)["“”'']/g)) {
    if (match[1]) spans.push(match[1]);
  }
  return spans;
}

/** The policy-reference render slot accepts these, never raw strings (§4.3). */
export function renderPolicyReferences(draft: RenderableDraft): readonly CitedClause[] {
  return draft.clauses;
}

function normalise(s: string): string {
  return s
    .replace(/[*_`>]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
