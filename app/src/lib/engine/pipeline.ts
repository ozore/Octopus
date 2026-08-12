/**
 * The pipeline — classify → retrieve → draft → critique, composed IN CODE.
 *
 * Spec: LLM_ENGINE.md §1 (the chain), E1 (three named workflow patterns, no
 * agent loop), §6.4 (the failure table), D9 / N7 / I1.
 *
 * WHY THIS IS A WORKFLOW AND NOT AN AGENT (D9, E1): every transition below is a
 * `const`, an `if`, or a bounded `for`. No model chooses the next step, no model
 * calls a tool, and no stage can re-enter itself an unbounded number of times.
 * Anthropic's *Building Effective Agents* draws the line exactly there —
 * workflows "orchestrate LLMs and tools through predefined code paths"; agents
 * "dynamically direct their own processes" — and this is a fixed pipeline over a
 * closed 33-code taxonomy, which is the simplest thing that can work.
 *
 * READ THE TWO EXITS. A case we cannot classify, and a draft that yields no
 * resolvable policy clause, both leave the machine for human escalation. There
 * is no path that produces a confidently-wrong document (I5, R3) — which is the
 * design's central asymmetry: competitors triage hard cases away, we sell them.
 */

import { assertRenderableDraft, type RenderableDraft } from './citation-gate';
import { classify } from './classify';
import { critiqueDraft } from './critique';
import type { EngineDeps, EngineDepsInput } from './deps';
import { createDeps } from './deps';
import { EngineError, type EngineFailure } from './errors';
import { draftPlainText, generateDraft, type Classified } from './draft';
import { retrieve } from './retrieve';
import type {
  Candidate,
  CorpusSlice,
  Critique,
  EscalationReason,
  NoticeDocument,
  PipelineResult,
} from '../domain/types';

export type EngineRunResult =
  | {
      kind: 'drafted';
      classification: Classified;
      slice: CorpusSlice;
      /** Branded: it has passed the render boundary (ADR-004). */
      draft: RenderableDraft;
      critique: Critique;
      /** How many draft→critique passes ran, bounded by config. */
      iterations: number;
    }
  | {
      kind: 'escalate';
      reason: EscalationReason;
      detail: string;
      failure?: EngineFailure;
      /** Present when the escalation happened at or after stage 1: what the
       *  classifier ranked, so the ops console and the confusion matrix can see
       *  the model's answer even though the gate declined to act on it. */
      candidates?: readonly Candidate[];
    };

/** Compile-time proof that the engine's richer result still IS a PipelineResult. */
const _assignable: (r: EngineRunResult) => PipelineResult = (r) => r;
void _assignable;

/**
 * Engine failure → domain escalation reason.
 *
 * `EscalationReason` is owned by `domain/types.ts` and the engine does not widen
 * it, so each engine failure maps to the nearest domain reason and the precise
 * cause travels in `detail` (prefixed with the failure code) and in the emitted
 * `escalation` event. The mapping is stated once, here, rather than inferred at
 * each throw site:
 *
 *   classify stage failures  → 'unclassified'        (we never learned the code)
 *   retrieve/draft/critique  → 'zero_cited_clauses'  (no cited document reaches
 *                                                     the seller, which is
 *                                                     exactly what §6.4 says
 *                                                     must not render)
 */
function toEscalation(error: EngineError): Extract<EngineRunResult, { kind: 'escalate' }> {
  const reason: EscalationReason = error.stage === 'classify' ? 'unclassified' : 'zero_cited_clauses';
  return { kind: 'escalate', reason, detail: error.detail, failure: error.failure };
}

export async function runPipeline(
  deps: EngineDeps,
  notice: NoticeDocument,
): Promise<EngineRunResult> {
  if (notice.text.trim().length === 0) {
    const result = {
      kind: 'escalate' as const,
      reason: 'unclassified' as const,
      detail: 'notice is empty',
    };
    deps.events.emit({ type: 'escalation', reason: result.reason, detail: result.detail });
    return result;
  }

  try {
    // ---- Stage 1: classify (routing) ------------------------------------
    const { outcome } = await classify(deps, notice);
    if (outcome.kind === 'escalate') {
      return {
        kind: 'escalate',
        reason: outcome.reason,
        detail: outcome.detail,
        candidates: outcome.candidates,
      };
    }

    // ---- Stage 2: retrieve (pure) ---------------------------------------
    const slice = retrieve(deps, outcome.code);

    // ---- Stages 3+4: draft, then evaluate, bounded ----------------------
    let draft = assertRenderableDraft(
      await generateDraft(deps, { classification: outcome, slice, notice }),
    );
    let critique = await critiqueDraft(deps, slice, draft.sections);
    let iterations = 1;
    deps.events.emit({
      type: 'draft_iteration',
      iteration: iterations,
      readinessScore: critique.readinessScore,
      blocking: critique.blockingDeficiencies,
    });

    let best = { draft, critique };

    while (
      critique.blockingDeficiencies.length > 0 &&
      iterations < deps.config.maxDraftIterations
    ) {
      iterations += 1;
      try {
        draft = assertRenderableDraft(
          await generateDraft(deps, {
            classification: outcome,
            slice,
            notice,
            revision: { previous: draftPlainText(best.draft.sections), critique },
          }),
        );
        critique = await critiqueDraft(deps, slice, draft.sections);
      } catch (error) {
        // A failed REVISION does not discard a draft that already passed the
        // render boundary — the seller keeps the better artifact and the failure
        // is an event, not an escalation. (A failed FIRST draft escalates; that
        // throw is outside this loop.)
        if (error instanceof EngineError) {
          deps.events.emit({
            type: 'escalation',
            reason: 'zero_cited_clauses',
            failure: error.failure,
            detail: `revision ${iterations} discarded — ${error.detail}`,
          });
          break;
        }
        throw error;
      }

      deps.events.emit({
        type: 'draft_iteration',
        iteration: iterations,
        readinessScore: critique.readinessScore,
        blocking: critique.blockingDeficiencies,
      });

      if (critique.readinessScore >= best.critique.readinessScore) {
        best = { draft, critique };
      }
    }

    return {
      kind: 'drafted',
      classification: outcome,
      slice,
      draft: best.draft,
      critique: best.critique,
      iterations,
    };
  } catch (error) {
    if (error instanceof EngineError) {
      const escalation = toEscalation(error);
      deps.events.emit({
        type: 'escalation',
        reason: escalation.reason,
        failure: escalation.failure,
        detail: escalation.detail,
      });
      return escalation;
    }
    throw error;
  }
}

export type Engine = {
  readonly deps: EngineDeps;
  run(notice: NoticeDocument): Promise<EngineRunResult>;
};

export function createEngine(input: EngineDepsInput): Engine {
  const deps = createDeps(input);
  return { deps, run: (notice) => runPipeline(deps, notice) };
}
