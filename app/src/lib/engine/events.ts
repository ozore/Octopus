/**
 * The engine's event stream.
 *
 * Spec: LLM_ENGINE.md §3.4 (cache hygiene is an operational invariant), §6.2
 * control 5 (detection), ADR-102 (injection signals are counted), Twelve-Factor
 * XI (logs are an event stream, not a runbook step).
 *
 * Why a sink rather than a logger call: two of these events are *alarms* whose
 * absence is the bug. `cache_read_zero` on a repeated request is a 5–10× cost
 * regression with no functional symptom, and `injection_signal` is the earliest
 * evidence that someone is probing the one untrusted input surface we have.
 * Making them values rather than log lines is what lets CI assert on them.
 */

import type { EngineStage } from './config';
import type { EngineFailure } from './errors';
import type { ModelUsage } from '../adapters/anthropic';
import type { EscalationReason } from '../domain/types';

export type EngineEvent =
  | {
      type: 'model_call';
      stage: EngineStage;
      model: string;
      stopReason: string;
      usage: ModelUsage;
      /** Total prompt size is the SUM of the three input counters; `inputTokens`
       *  alone is the uncached remainder and will mislead a dashboard. */
      promptTokens: number;
      attempt: number;
    }
  | { type: 'cache_read_zero'; stage: EngineStage; model: string; repeatOfIdenticalPrefix: boolean }
  | { type: 'citation_leak'; caseId: string; count: number; sample: string }
  | { type: 'injection_signal'; caseId: string; documentIndex: number; citedText: string }
  | { type: 'notice_contains_instructions'; caseId: string }
  | { type: 'citation_unresolved'; caseId: string; documentIndex: number; blockIndex: number }
  | { type: 'stage_complete'; stage: EngineStage | 'retrieve'; durationMs: number }
  | { type: 'draft_iteration'; iteration: number; readinessScore: number; blocking: string[] }
  | { type: 'escalation'; reason: EscalationReason; failure?: EngineFailure; detail: string };

export interface EngineEventSink {
  emit(event: EngineEvent): void;
}

export const noopEventSink: EngineEventSink = { emit: () => undefined };

export class CollectingEventSink implements EngineEventSink {
  readonly events: EngineEvent[] = [];

  emit(event: EngineEvent): void {
    this.events.push(event);
  }

  of<T extends EngineEvent['type']>(type: T): Extract<EngineEvent, { type: T }>[] {
    return this.events.filter((e): e is Extract<EngineEvent, { type: T }> => e.type === type);
  }

  reset(): void {
    this.events.length = 0;
  }
}
