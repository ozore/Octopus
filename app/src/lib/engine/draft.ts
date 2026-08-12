/**
 * Stage 3 — DRAFT (prompt chaining), and the gate that runs on its output.
 *
 * Spec: LLM_ENGINE.md §2.2 (`claude-opus-5`, citations on, no `output_config.format`),
 * §3.3 (two-level caching), §4.2 (custom-content documents), §5.4 (the Draft
 * contract), §6.3 (Opus 5 behavioural guardrails), §7.4 (request shape),
 * ADR-102 (the allowlist).
 *
 * Three things here are not visible from the code that surrounds them:
 *
 *  1. ONE CONTENT BLOCK PER CLAUSE, in clause order, is a hard requirement, not
 *     a formatting choice. `content_block_location.start_block_index` is a
 *     direct index into `doc.clauses`, so inserting a heading block or merging
 *     two clauses would silently repoint every citation onto the wrong clause id.
 *
 *  2. THE NOTICE IS APPENDED LAST and is deliberately absent from the allowlist.
 *     Citations are all-or-none per request, so the notice is necessarily
 *     citable; its exclusion from the allowlist is the entire mechanism of
 *     ADR-102.
 *
 *  3. A REVISION IS A FRESH REQUEST, not an appended turn. A cache breakpoint
 *     walks back at most 20 content blocks, so a growing message array would
 *     stop hitting the prefix with no visible symptom (§3.4).
 */

import {
  blockHasAllowlistedCitation,
  buildCitationAllowlist,
  extractCitedClauses,
  stripUncitedPolicySpans,
  type CitationAllowlist,
} from './citation-gate';
import type { EngineDeps } from './deps';
import { EngineError } from './errors';
import { callCited } from './model-call';
import { noticeDocumentId } from './classify';
import {
  NOTICE_DOCUMENT_CONTEXT,
  NOTICE_DOCUMENT_TITLE,
  SECTION_SENTINELS,
  SENTINEL_ORDER,
  assertPrefixIsCacheable,
  buildDocumentContext,
  buildDraftInstruction,
  buildDraftPrefix,
} from './prompts';
import type { CitedRequest, CitedTextBlock, ModelDocument } from '../adapters/anthropic';
import type {
  ClassificationOutcome,
  CorpusClause,
  CorpusDocument,
  CorpusSlice,
  Critique,
  Draft,
  DraftSections,
  NoticeDocument,
} from '../domain/types';

export type Classified = Extract<ClassificationOutcome, { kind: 'classified' }>;

export type DraftArgs = {
  /** I5, statically: the draft stage is unreachable for every escalation path,
   *  because the escalating variant of the union is not assignable here. */
  classification: Classified;
  slice: CorpusSlice;
  notice: NoticeDocument;
  revision?: { previous: string; critique: Critique };
};

/** One block per clause, in clause order. See note 1 above. */
export function renderClauseBlock(clause: CorpusClause): string {
  const excerpt = clause.quotedExcerpt?.trim();
  return excerpt ? `${clause.ourSummary.trim()} Policy wording: "${excerpt}"` : clause.ourSummary.trim();
}

export function toModelDocument(doc: CorpusDocument, cache: boolean): ModelDocument {
  return {
    documentId: doc.documentId,
    title: doc.title,
    context: buildDocumentContext({
      corpusRelease: doc.corpusRelease,
      clauseIds: doc.clauses.map((c) => c.clauseId),
      sourceUrl: doc.sourceUrl,
    }),
    source: { type: 'content', blocks: doc.clauses.map(renderClauseBlock) },
    cache,
  };
}

export type DraftPlan = {
  documents: ModelDocument[];
  citableDocumentIds: string[];
  allowlist: CitationAllowlist;
  noticeDocumentIndex: number;
};

export function planDraftDocuments(slice: CorpusSlice, notice: NoticeDocument): DraftPlan {
  const citableDocs: CorpusDocument[] = [...slice.policyDocs, slice.patternDoc];
  const documents: ModelDocument[] = citableDocs.map((doc) => toModelDocument(doc, true));

  documents.push({
    documentId: noticeDocumentId(notice.caseId),
    title: NOTICE_DOCUMENT_TITLE,
    context: NOTICE_DOCUMENT_CONTEXT,
    source: { type: 'text', text: notice.text },
    cache: false,
  });

  return {
    documents,
    citableDocumentIds: citableDocs.map((doc) => doc.documentId),
    allowlist: buildCitationAllowlist(citableDocs),
    noticeDocumentIndex: citableDocs.length,
  };
}

export function buildDraftRequest(
  deps: EngineDeps,
  args: DraftArgs,
  plan: DraftPlan,
  maxTokens: number,
): CitedRequest {
  const systemPrefix = buildDraftPrefix();
  assertPrefixIsCacheable(systemPrefix, deps.config);
  return {
    kind: 'cited',
    model: deps.config.models.draft,
    systemPrefix,
    maxTokens,
    effort: deps.config.effort.draft,
    cacheTtl: deps.config.cacheTtl,
    documents: plan.documents,
    citableDocumentIds: plan.citableDocumentIds,
    userText: buildDraftInstruction(args.classification, args.slice, args.revision),
  };
}

// ---------------------------------------------------------------------------
// Sentinel parsing (§5.4)
// ---------------------------------------------------------------------------

export class DraftParseError extends EngineError {
  constructor(message: string) {
    super('draft_parse_failure', message, 'draft');
    this.name = 'DraftParseError';
  }
}

/**
 * Missing or duplicated sentinels are a hard parse failure. So are extra
 * top-level headings: Opus 5 can expand task scope, and a plan of action with
 * invented sections breaks the three-part structure investigators read for
 * (§6.3). A POA missing its preventive-measures section is worse than no POA.
 */
export function parseDraftSections(text: string): DraftSections {
  const headings = [...text.matchAll(/^##[ \t]+(.+?)[ \t]*$/gm)];
  const seen = headings.map((m) => `## ${(m[1] ?? '').trim()}`);

  for (const sentinel of SENTINEL_ORDER) {
    const count = seen.filter((h) => h.toUpperCase() === sentinel).length;
    if (count === 0) throw new DraftParseError(`missing section heading "${sentinel}"`);
    if (count > 1) throw new DraftParseError(`duplicated section heading "${sentinel}"`);
  }
  if (seen.length !== SENTINEL_ORDER.length) {
    throw new DraftParseError(
      `unexpected top-level heading(s): ${seen
        .filter((h) => !SENTINEL_ORDER.includes(h.toUpperCase() as (typeof SENTINEL_ORDER)[number]))
        .join(', ')}`,
    );
  }

  const order = seen.map((h) => h.toUpperCase());
  if (order.join('|') !== SENTINEL_ORDER.join('|')) {
    throw new DraftParseError(`sections are out of order: ${order.join(' → ')}`);
  }

  const body = (sentinel: string): string => {
    const start = text.toUpperCase().indexOf(sentinel);
    const from = start + sentinel.length;
    const nextStarts = SENTINEL_ORDER.map((s) => text.toUpperCase().indexOf(s, from)).filter(
      (i) => i > -1,
    );
    const end = nextStarts.length > 0 ? Math.min(...nextStarts) : text.length;
    return text.slice(from, end).trim();
  };

  const sections: DraftSections = {
    rootCause: body(SECTION_SENTINELS.rootCause),
    correctiveActions: body(SECTION_SENTINELS.correctiveActions),
    preventiveMeasures: body(SECTION_SENTINELS.preventiveMeasures),
  };

  for (const [name, value] of Object.entries(sections)) {
    if (value.trim().length === 0) throw new DraftParseError(`section "${name}" is empty`);
  }
  return sections;
}

export function draftPlainText(sections: DraftSections): string {
  return [
    SECTION_SENTINELS.rootCause,
    sections.rootCause,
    '',
    SECTION_SENTINELS.correctiveActions,
    sections.correctiveActions,
    '',
    SECTION_SENTINELS.preventiveMeasures,
    sections.preventiveMeasures,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// The stage
// ---------------------------------------------------------------------------

export type SanitisedText = { text: string; leaks: number; stripped: string[] };

/**
 * Assemble the model's text blocks, stripping policy-shaped prose from any block
 * that carries no allowlisted citation. A block WITH an allowlisted citation
 * keeps its text: its policy claim is the citation, and the render boundary
 * re-checks it at paragraph granularity afterwards.
 */
export function sanitiseBlocks(
  blocks: readonly CitedTextBlock[],
  allowlist: CitationAllowlist,
): SanitisedText {
  let leaks = 0;
  const stripped: string[] = [];
  const parts = blocks.map((block) => {
    if (blockHasAllowlistedCitation(block, allowlist)) return block.text;
    const result = stripUncitedPolicySpans(block.text);
    leaks += result.leaks;
    stripped.push(...result.stripped);
    // Preserve the block's own leading/trailing whitespace. Blocks are
    // concatenated, so a stripped block that lost its trailing newline would run
    // the next block's `## HEADING` into the previous line and turn a citation
    // leak into a sentinel parse failure — a real bug found by the ADR-102
    // fixture, where EVERY block is uncited.
    const lead = /^\s*/.exec(block.text)?.[0] ?? '';
    const tail = /\s*$/.exec(block.text)?.[0] ?? '';
    return `${lead}${result.text}${tail}`;
  });
  return { text: parts.join(''), leaks, stripped };
}

export async function generateDraft(deps: EngineDeps, args: DraftArgs): Promise<Draft> {
  const started = Date.now();
  const plan = planDraftDocuments(args.slice, args.notice);

  // One retry on a sentinel parse failure, at the higher ceiling, then escalate
  // (§5.4). The retry is a fresh request, not a continuation.
  const ceilingsByAttempt = [
    [deps.config.maxTokens.draft, deps.config.retryMaxTokens.draft],
    [deps.config.retryMaxTokens.draft, deps.config.retryMaxTokens.draft],
  ];

  let lastParseError: DraftParseError | undefined;
  for (const ceilings of ceilingsByAttempt) {
    const response = await callCited(
      deps,
      'draft',
      (maxTokens) => buildDraftRequest(deps, args, plan, maxTokens),
      ceilings,
    );

    const extraction = extractCitedClauses(response.blocks, plan.allowlist, {
      caseId: args.notice.caseId,
      events: deps.events,
    });
    const sanitised = sanitiseBlocks(response.blocks, plan.allowlist);

    if (sanitised.leaks > 0) {
      deps.events.emit({
        type: 'citation_leak',
        caseId: args.notice.caseId,
        count: sanitised.leaks,
        sample: sanitised.stripped[0] ?? '',
      });
    }

    let sections: DraftSections;
    try {
      sections = parseDraftSections(sanitised.text);
    } catch (error) {
      if (error instanceof DraftParseError) {
        lastParseError = error;
        continue;
      }
      throw error;
    }

    if (extraction.clauses.length === 0) {
      // §6.4: a draft yielding zero allowlisted citations does not render at
      // all. Shipping an uncited draft from a product named for citations is the
      // one failure that destroys the thing we sell.
      throw new EngineError(
        'zero_allowlisted_citations',
        `draft produced no citation resolving to a corpus document (${extraction.injectionSignals} resolved to the notice)`,
        'draft',
      );
    }

    deps.events.emit({ type: 'stage_complete', stage: 'draft', durationMs: Date.now() - started });

    return {
      sections,
      clauses: extraction.clauses,
      citationLeaks: sanitised.leaks,
      injectionSignals: extraction.injectionSignals,
      modelId: response.modelId,
      corpusRelease: args.slice.corpusRelease,
      promptBundleHash: args.slice.promptBundleHash,
    };
  }

  throw lastParseError ?? new DraftParseError('draft could not be parsed');
}
