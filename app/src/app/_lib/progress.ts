/**
 * The wire format of the appeal preview stream, and the narration that goes with
 * it.
 *
 * Spec: ARCHITECTURE.md §3.1 (SSE preview), USER_JOURNEY.md §6 (Nielsen #1 under
 * a long wait) and §6.2 (the copy is in the seller's language, never a stage
 * name), DESIGN_SYSTEM.md §8.3.
 *
 * WHY FIVE NODES FOR FOUR STAGES. USER_JOURNEY §1.1 sequences the wait as
 * "reading your notice → identifying the policy → checking the exact clause →
 * drafting → checking our own draft for weaknesses". Classification produces two
 * things a seller cares about at different moments — that we have read the
 * notice, and *what it turned out to be* — so it earns two nodes. The five nodes
 * are still five REAL checkpoints, not a padded progress bar: each one is
 * emitted by a genuine transition in `lib/engine`'s pipeline (D9/I1 — because
 * control flow lives in code, the UI has honest checkpoints to narrate).
 *
 * This module is imported by both the route handler and the client component,
 * so it holds no server-only imports and no secrets.
 */

import type { TimelineNodeState } from '@/components/StatusTimeline';
import type { CitedClause, Critique, EscalationReason } from '@/lib/domain/types';

export const STAGE_KEYS = ['read', 'identify', 'clause', 'draft', 'check'] as const;
export type StageKey = (typeof STAGE_KEYS)[number];

export type PreviewPayload = {
  caseId: string;
  reasonCode: string;
  /** The seller-facing gloss, never the code (Nielsen #2, NAMING.md §5). */
  plainEnglish: string;
  marketplace: string;
  clauses: CitedClause[];
  /**
   * THE DRAFTED SECTIONS ARE DELIBERATELY ABSENT FROM THIS TYPE, and their
   * absence is the paywall rather than a layout decision.
   *
   * This payload is serialised onto an SSE stream that a seller reads BEFORE
   * paying (ARCHITECTURE.md §1: "the paywall therefore sits between the critique
   * and the full document"). A field that no component renders is still a field
   * the browser receives, so carrying `sections` here published the $149
   * artifact to anyone with a devtools network tab while the screen showed a
   * paywall. The preview is complete and sellable without it: reason code,
   * cited clause, critique — which is exactly what §7.1's comparative
   * assumption A4 needs visible before the paywall.
   *
   * The sections are persisted by the same run (`updateCase`) and served, after
   * a `paid` payment, by `/case/{id}/plan`.
   */
  critique: Critique;
  /** Rubric labels keyed by criterion id — the rubric owns the wording. */
  rubricLabels: Record<string, string>;
  /**
   * Provenance, carried to the screen rather than hidden. LLM_ENGINE §8.1
   * requires synthetic material to be labelled wherever it surfaces, and a page
   * that presented fixture policy text as if it were the corpus would be the
   * same defect class as C-1 — marketing a mechanism the system does not have.
   */
  syntheticCorpus: boolean;
  recordedModel: boolean;
};

export type ProgressEvent =
  | { type: 'stage'; key: StageKey; state: TimelineNodeState; detail?: string }
  | { type: 'preview'; preview: PreviewPayload }
  | {
      type: 'escalated';
      reason: EscalationReason;
      detail: string;
      /** What the seller is offered instead of a draft (ARCHITECTURE.md §3.6). */
      disposition: 'human_tier' | 'refer_out';
    }
  | { type: 'failed'; message: string }
  | { type: 'done' };

/**
 * Node copy, per state. Pending is future tense, active is a present participle,
 * done is past tense plus the finding — DESIGN_SYSTEM §8.3's copy contract, which
 * exists so that the tense itself carries state for a reader who is skimming.
 */
export const STAGE_LABELS: Record<StageKey, Record<'pending' | 'active' | 'done', string>> = {
  read: {
    pending: 'Read your notice',
    active: 'Reading your notice…',
    done: 'Read your notice.',
  },
  identify: {
    pending: 'Identify the policy you were charged under',
    active: 'Identifying the policy you were charged under…',
    done: 'Identified the policy you were charged under.',
  },
  clause: {
    pending: 'Check the exact policy clause',
    active: 'Checking the exact policy clause…',
    done: 'Checked the exact policy clause.',
  },
  draft: {
    pending: 'Draft your Plan of Action',
    active: 'Drafting your Plan of Action…',
    done: 'Drafted your Plan of Action.',
  },
  check: {
    pending: 'Double-check our own draft',
    active: 'Double-checking our own draft…',
    done: 'Double-checked our own draft for weaknesses.',
  },
};

/**
 * The `slow` state's copy, verbatim from USER_JOURNEY §6.4. That section names
 * silence at this moment "the single highest-risk micro-interaction in the
 * product", which is why this string is a constant here rather than a phrase
 * someone types at a call site.
 */
export const SLOW_LABEL = 'Still working — this one’s taking a bit longer, your draft is not lost.';

/** The threshold after which an active node flips to `slow`. */
export const SLOW_AFTER_MS = 20_000;

export const BLOCKED_LABEL = 'This one needs a person.';

export function encodeSse(event: ProgressEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
