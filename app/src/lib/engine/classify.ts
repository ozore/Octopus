/**
 * Stage 1 — CLASSIFY (routing) and the threshold gate.
 *
 * Spec: LLM_ENGINE.md §2.2 (routing pattern, `claude-sonnet-5`), §5.1 (the
 * response contract), §5.2 (the outcome union), §6.1 (the three signals), E6.
 *
 * THE DIVISION OF LABOUR, which is the whole of I5 and is not visible from any
 * single function: the model RANKS and EVIDENCES; this file's `applyThreshold`
 * DECIDES. A self-reported confidence scalar is a token sequence, not a
 * calibrated posterior, so it is one of three inputs and never the sole gate.
 * The strongest signal is the one that is falsifiable in code — a quote the
 * model claims to have read in the notice either is in the notice or is not, and
 * a string search settles it without judgment.
 *
 * A misclassification escalates; it never guesses. Escalation converts to the
 * $399 human tier, which is why the asymmetry in §6.1's loss function points the
 * way it does: a false escalation costs reviewer time and earns revenue, while a
 * confident misclassification burns the seller's one appeal attempt.
 */

import { CLASSIFICATION_SCHEMA, ClassificationResponseWire, toClassificationResponse } from './contracts';
import type { EngineConfig } from './config';
import type { EngineDeps } from './deps';
import { EngineError } from './errors';
import { callStructured } from './model-call';
import {
  CLASSIFY_INSTRUCTION_TAIL,
  NOTICE_DOCUMENT_CONTEXT,
  NOTICE_DOCUMENT_TITLE,
  assertPrefixIsCacheable,
  buildClassifyPrefix,
} from './prompts';
import type { StructuredRequest } from '../adapters/anthropic';
import { REFUSED_CATEGORIES, UNCLASSIFIED, isReasonCode } from '../domain/reason-codes';
import type { ReasonCode } from '../domain/reason-codes';
import type {
  Candidate,
  ClassificationOutcome,
  ClassificationResponse,
  Marketplace,
  NoticeDocument,
} from '../domain/types';

export type ClassifyResult = {
  response: ClassificationResponse;
  outcome: ClassificationOutcome;
};

/** The notice's document id, used by the allowlist to prove a citation is NOT
 *  policy (ADR-102). Deterministic per case. */
export function noticeDocumentId(caseId: string): string {
  return `notice:${caseId}`;
}

export function buildClassifyRequest(
  deps: EngineDeps,
  notice: NoticeDocument,
  maxTokens: number,
): StructuredRequest {
  const systemPrefix = buildClassifyPrefix(deps.corpus.listTaxonomy());
  assertPrefixIsCacheable(systemPrefix, deps.config);

  return {
    kind: 'structured',
    model: deps.config.models.classify,
    systemPrefix,
    maxTokens,
    effort: deps.config.effort.classify,
    cacheTtl: deps.config.cacheTtl,
    schemaName: CLASSIFICATION_SCHEMA.name,
    jsonSchema: CLASSIFICATION_SCHEMA.jsonSchema,
    // The notice rides as a document even here, where citations are impossible:
    // the data/instruction separation is the structural half of the injection
    // control (§6.2 control 1) and does not depend on citations being on.
    documents: [
      {
        documentId: noticeDocumentId(notice.caseId),
        title: NOTICE_DOCUMENT_TITLE,
        context: NOTICE_DOCUMENT_CONTEXT,
        source: { type: 'text', text: notice.text },
        cache: false,
      },
    ],
    userText: CLASSIFY_INSTRUCTION_TAIL,
  };
}

export async function classify(deps: EngineDeps, notice: NoticeDocument): Promise<ClassifyResult> {
  const started = Date.now();
  const raw = await callStructured(deps, 'classify', (maxTokens) =>
    buildClassifyRequest(deps, notice, maxTokens),
  );

  const parsed = ClassificationResponseWire.safeParse(raw.json);
  if (!parsed.success) {
    throw new EngineError(
      'contract_validation_failure',
      `classification response failed its contract: ${parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'} ${i.message}`)
        .join('; ')}`,
      'classify',
    );
  }

  const response = toClassificationResponse(parsed.data);
  if (response.noticeContainsInstructions) {
    deps.events.emit({ type: 'notice_contains_instructions', caseId: notice.caseId });
  }

  const outcome = applyThreshold(response, notice.text, deps.config);
  if (outcome.kind === 'escalate') {
    deps.events.emit({ type: 'escalation', reason: outcome.reason, detail: outcome.detail });
  }

  deps.events.emit({ type: 'stage_complete', stage: 'classify', durationMs: Date.now() - started });
  return { response, outcome };
}

// ---------------------------------------------------------------------------
// The gate
// ---------------------------------------------------------------------------

const normalise = (s: string): string => s.replace(/\s+/g, ' ').trim().toLowerCase();

/** A span is evidence only if the words are actually in the notice. */
export function isVerbatim(quote: string, noticeText: string): boolean {
  const q = normalise(quote);
  // A span of a handful of characters ("the", "we") matches everything and
  // evidences nothing; it is a degenerate span, not a quote.
  if (q.length < 8) return false;
  return normalise(noticeText).includes(q);
}

function marketplaceOfCode(code: ReasonCode): Marketplace {
  return code.startsWith('WMT.') ? 'walmart' : 'amazon';
}

function ranked(candidates: readonly Candidate[]): Candidate[] {
  // The contract says "ordered, descending confidence"; the gate does not take
  // the model's word for its own ordering.
  return [...candidates].sort((a, b) => b.confidence - a.confidence);
}

export function applyThreshold(
  response: ClassificationResponse,
  noticeText: string,
  config: EngineConfig,
): ClassificationOutcome {
  const candidates = ranked(response.candidates);
  const top = candidates[0];
  const escalate = (
    reason: Extract<ClassificationOutcome, { kind: 'escalate' }>['reason'],
    detail: string,
  ): ClassificationOutcome => ({ kind: 'escalate', reason, detail, candidates });

  if (!top) return escalate('unclassified', 'classifier returned no candidates');

  // 1. Scope and marketplace, before anything about codes. N9 puts listing-level
  //    notices out of v1 scope; N8 puts every marketplace but these two out.
  if (response.scope === 'listing') {
    return escalate('out_of_scope', 'notice is listing-level, not account-level (N9)');
  }
  if (response.marketplace === 'unknown') {
    return escalate('unsupported_marketplace', 'marketplace could not be identified from the notice');
  }

  // 2. UNCLASSIFIED is an outcome, not an error. It is the one the pipeline is
  //    built to reach rather than to avoid.
  if (top.code === UNCLASSIFIED || !isReasonCode(top.code)) {
    return escalate('unclassified', 'top candidate is UNCLASSIFIED');
  }
  const code: ReasonCode = top.code;

  // 3. Refused categories are a separate, EARLIER gate than confidence (§6.1):
  //    they route out before payment regardless of how confident the classifier
  //    is, to an attorney referral rather than a draft.
  if (REFUSED_CATEGORIES.has(code)) {
    return escalate('refused_category', `${code} routes to counsel referral before payment`);
  }

  if (marketplaceOfCode(code) !== response.marketplace) {
    return escalate(
      'unsupported_marketplace',
      `code ${code} does not belong to the reported marketplace ${response.marketplace}`,
    );
  }

  // 4. The falsifiable signal. An empty span list is the real low-confidence
  //    tell; a fabricated quote is caught by string search, not by judgment.
  const verbatim = top.evidenceSpans.filter((span) => isVerbatim(span.quote, noticeText));
  if (verbatim.length === 0) {
    return escalate(
      'no_evidence_span',
      top.evidenceSpans.length === 0
        ? 'classifier returned no evidence span'
        : 'no evidence span appears verbatim in the notice',
    );
  }

  // 5. Then, and only then, the two numeric signals.
  if (top.confidence < config.thresholds.confidenceFloor) {
    return escalate(
      'low_confidence',
      `top-1 confidence ${top.confidence} is below τ=${config.thresholds.confidenceFloor}`,
    );
  }

  const second = candidates[1];
  const margin = second ? top.confidence - second.confidence : top.confidence;
  if (margin < config.thresholds.confidenceMargin) {
    return escalate(
      'thin_margin',
      `margin ${margin.toFixed(3)} between ${top.code} and ${second?.code} is below δ=${
        config.thresholds.confidenceMargin
      }`,
    );
  }

  return {
    kind: 'classified',
    code,
    confidence: top.confidence,
    margin,
    evidence: verbatim,
    marketplace: response.marketplace,
  };
}
