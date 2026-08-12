/**
 * Stage 2 — retrieval. `ReasonCode -> CorpusSlice`, and nothing else.
 *
 * Spec: ADR-003 (no vector database; retrieval is a pure in-process function
 * keyed on the reason code the classifier already produced), LLM_ENGINE.md §3
 * stage 2 and §5.3, CORPUS_DESIGN.md §5.1.
 *
 * Three constraints that do not show up in the signature:
 *
 *  - **The retriever being dumb is a feature** (LLM_ENGINE §3, stage 2). The
 *    classifier has produced an exact key; there is nothing fuzzy left to do. A
 *    clever retriever's mis-retrieval would be invisible to the citation gate,
 *    because a wrong clause is still a real clause with a real id.
 *
 *  - **Gate G7 is enforced here, not downstream.** Clauses from a non-US or
 *    unconfirmed edition are filtered out for US sellers. Where that leaves a
 *    code with nothing citable, this function returns `insufficient_corpus`
 *    rather than a thin slice — escalating is the honest outcome, and a draft
 *    built on zero clauses would fail the citation invariant anyway.
 *
 *  - **Ordering is fixed and total.** Documents sort by source id, clauses by
 *    clause id, rubric criteria by criterion id. The packed bytes must be
 *    identical across two builds of the same content or the prompt cache silently
 *    stops paying (ADR-003), and a silent cache miss has no functional symptom —
 *    only a 10x cost regression.
 */

import type { ReasonCode } from '../domain/reason-codes';
import type {
  CorpusClause,
  CorpusDocument,
  CorpusSlice,
  RubricSpec,
  TaxonomyRecord,
} from '../domain/types';
import type { AppealPattern, CorpusBundle, Jurisdiction, PolicyClause } from './types';

export type RetrievalOptions = {
  /**
   * 'US' applies gate G7. 'any' disables the jurisdiction filter and is for
   * corpus tooling and tests only — never for a drafting path.
   */
  jurisdiction: Jurisdiction;
  promptBundleHash: string;
};

export type RetrievalResult =
  | { ok: true; slice: CorpusSlice; excludedClauseIds: readonly string[] }
  | {
      ok: false;
      reason: 'unknown_code' | 'no_pattern' | 'insufficient_corpus';
      detail: string;
      /** Clauses that exist but were withheld, so the escalation can explain itself. */
      excludedClauseIds: readonly string[];
    };

/** L3 pattern content is namespaced so a citation to it can never be rendered
 *  as a policy clause. It is our own guidance, not the platform's rule. */
export const PATTERN_DOCUMENT_PREFIX = 'pattern:';

export function isPolicyClauseId(clauseId: string): boolean {
  return !clauseId.startsWith(PATTERN_DOCUMENT_PREFIX);
}

function toCorpusClause(clause: PolicyClause): CorpusClause {
  return {
    clauseId: clause.clauseId,
    heading: clause.heading,
    // The paragraphs are joined for the domain type's single-string field; the
    // citation packer (`pack.ts`) uses the paragraph array directly so that one
    // paragraph is one content block (CORPUS_DESIGN §5.2).
    ourSummary: clause.ourSummary.join('\n\n'),
    quotedExcerpt: clause.quotedExcerpt,
    obligationType: clause.obligationType,
  };
}

function buildTaxonomyRecord(bundle: CorpusBundle, code: ReasonCode, pattern: AppealPattern): TaxonomyRecord {
  const record = bundle.reasonCodes.get(code)!;
  return {
    code,
    plainEnglish: record.plainEnglish,
    triggerPhrases: record.triggerPhrases.map((p) => p.phrase),
    requiredEvidence: pattern.evidenceRequired.filter((e) => e.mandatory).map((e) => e.label),
    typicalFailureModes: pattern.antiPatterns.map((a) => a.critique),
  };
}

function buildRubric(code: ReasonCode, pattern: AppealPattern): RubricSpec {
  return {
    code,
    criteria: pattern.antiPatterns
      .map((a) => ({ id: a.id, label: a.detect, weight: a.weight }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };
}

function buildPatternDocument(
  bundle: CorpusBundle,
  code: ReasonCode,
  pattern: AppealPattern,
): CorpusDocument {
  const s = pattern.structure;
  const sectionClause = (id: string, heading: string, sec: { mustContain: readonly string[]; mustAvoid: readonly string[] }): CorpusClause => ({
    clauseId: `${PATTERN_DOCUMENT_PREFIX}${code}#${id}`,
    heading,
    ourSummary: [
      `Must contain: ${sec.mustContain.join(' | ')}`,
      sec.mustAvoid.length > 0 ? `Must avoid: ${sec.mustAvoid.join(' | ')}` : '',
    ]
      .filter((x) => x !== '')
      .join('\n\n'),
    quotedExcerpt: null,
    obligationType: 'requirement',
  });

  return {
    documentId: `${PATTERN_DOCUMENT_PREFIX}${code}`,
    title: `Appeal pattern — ${code}`,
    // An L3 pattern has no external source. The URL is our own corpus path so
    // that every CitedClause the gate constructs still carries a resolvable
    // pointer, and so a pattern reference is visibly ours rather than Amazon's.
    sourceUrl: `corpus://L3-appeal-patterns/${code}`,
    corpusRelease: bundle.corpusRelease,
    clauses: [
      sectionClause('root-cause', 'Root cause — what a strong section contains', s.rootCause),
      sectionClause('immediate-corrective', 'Immediate corrective actions', s.immediateCorrective),
      sectionClause('preventive', 'Preventive measures', s.preventive),
      {
        clauseId: `${PATTERN_DOCUMENT_PREFIX}${code}#evidence`,
        heading: 'Evidence kit',
        ourSummary: pattern.evidenceRequired
          .map((e) => `${e.mandatory ? 'Mandatory' : 'Strengthens'}: ${e.label}${e.redactionNote ? ` (${e.redactionNote})` : ''}`)
          .join('\n\n'),
        quotedExcerpt: null,
        obligationType: 'requirement',
      },
    ],
  };
}

/**
 * Group the code's governing clauses into one `CorpusDocument` per source
 * document, preserving the source's identity and URL. One document per source
 * (rather than one per clause) is what makes `document_index` resolve to a real
 * policy document and `content_block_index` resolve to a clause paragraph.
 */
function buildPolicyDocuments(
  bundle: CorpusBundle,
  clauses: readonly PolicyClause[],
): CorpusDocument[] {
  const bySource = new Map<string, PolicyClause[]>();
  for (const clause of clauses) {
    const existing = bySource.get(clause.sourceId);
    if (existing) existing.push(clause);
    else bySource.set(clause.sourceId, [clause]);
  }
  return [...bySource.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sourceId, group]) => {
      const source = bundle.sourcesById.get(sourceId)!;
      return {
        documentId: sourceId,
        title: source.title,
        sourceUrl: source.url,
        corpusRelease: bundle.corpusRelease,
        clauses: group
          .slice()
          .sort((a, b) => a.clauseId.localeCompare(b.clauseId))
          .map(toCorpusClause),
      };
    });
}

export function selectCorpusSlice(
  bundle: CorpusBundle,
  code: ReasonCode,
  options: RetrievalOptions,
): RetrievalResult {
  const record = bundle.reasonCodes.get(code);
  if (!record) {
    return { ok: false, reason: 'unknown_code', detail: `${code} is not in the corpus`, excludedClauseIds: [] };
  }
  const pattern = bundle.patterns.get(code);
  if (!pattern) {
    return {
      ok: false,
      reason: 'no_pattern',
      detail: `${code} has no L3 appeal pattern — gate G3 should have failed the build`,
      excludedClauseIds: [],
    };
  }

  const excluded: string[] = [];
  const selected: PolicyClause[] = [];

  for (const clauseId of record.governedBy) {
    const clause = bundle.clausesById.get(clauseId);
    if (!clause) {
      // Referential integrity is gate G2's job and fails the build. Reaching
      // here at runtime means the build gate was bypassed, so drop the clause
      // rather than emitting a citation that resolves to nothing.
      excluded.push(clauseId);
      continue;
    }
    if (clause.status !== 'active') {
      excluded.push(clauseId);
      continue;
    }
    const source = bundle.sourcesById.get(clause.sourceId);
    if (!source || !source.citable || source.stub) {
      excluded.push(clauseId);
      continue;
    }
    if (options.jurisdiction === 'US' && source.jurisdictionCaveat) {
      excluded.push(clauseId);
      continue;
    }
    selected.push(clause);
  }

  if (selected.length === 0) {
    return {
      ok: false,
      reason: 'insufficient_corpus',
      detail:
        `${code} has no citable clause for jurisdiction ${options.jurisdiction}. ` +
        `Withheld: ${excluded.join(', ') || 'none'}. ` +
        'Escalate rather than draft: a document with no citation cannot satisfy the citation invariant (ADR-004).',
      excludedClauseIds: excluded,
    };
  }

  const slice: CorpusSlice = {
    code,
    taxonomy: buildTaxonomyRecord(bundle, code, pattern),
    policyDocs: buildPolicyDocuments(bundle, selected),
    patternDoc: buildPatternDocument(bundle, code, pattern),
    rubric: buildRubric(code, pattern),
    corpusRelease: bundle.corpusRelease,
    promptBundleHash: options.promptBundleHash,
  };

  return { ok: true, slice, excludedClauseIds: excluded };
}

/** Every code the corpus can currently draft for, in taxonomy order. */
export function draftableCodes(bundle: CorpusBundle, jurisdiction: Jurisdiction): ReasonCode[] {
  const out: ReasonCode[] = [];
  for (const code of bundle.reasonCodes.keys()) {
    const result = selectCorpusSlice(bundle, code, { jurisdiction, promptBundleHash: 'probe' });
    if (result.ok) out.push(code);
  }
  return out;
}
