/**
 * The one place a model call is made, and the one place its stop reasons are
 * interpreted.
 *
 * Spec: LLM_ENGINE.md §6.4 (the failure table), §3.4 (cache hygiene).
 *
 * Two orderings here are load-bearing and invisible from the call sites:
 *
 *  1. `stop_reason` is checked BEFORE any content is read. A refusal carries no
 *     usable content, and `stop_details` may be null even on a refusal — so the
 *     branch is on `stop_reason`, never on `stop_details`.
 *
 *  2. `max_tokens` is a hard failure with exactly one retry at a higher ceiling,
 *     never a truncated result passed downstream. A truncated plan of action
 *     burns the seller's one appeal attempt and is strictly worse than a delay.
 */

import type { EngineStage } from './config';
import type { EngineDeps } from './deps';
import { EngineError } from './errors';
import type {
  CitedRequest,
  CitedResponse,
  StructuredRequest,
  StructuredResponse,
} from '../adapters/anthropic';

type Stage = EngineStage;

function promptTokens(usage: {
  inputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
}): number {
  // Dashboards read the SUM. `inputTokens` alone is the uncached remainder and
  // will understate the prompt by the whole cached prefix (§3.4).
  return usage.inputTokens + usage.cacheCreationInputTokens + usage.cacheReadInputTokens;
}

function record(
  deps: EngineDeps,
  stage: Stage,
  attempt: number,
  response: StructuredResponse | CitedResponse,
  systemPrefix: string,
): void {
  deps.events.emit({
    type: 'model_call',
    stage,
    model: response.modelId,
    stopReason: response.stopReason,
    usage: response.usage,
    promptTokens: promptTokens(response.usage),
    attempt,
  });

  const repeat = deps.witness.witness(response.modelId, systemPrefix);
  if (response.usage.cacheReadInputTokens === 0) {
    deps.events.emit({
      type: 'cache_read_zero',
      stage,
      model: response.modelId,
      repeatOfIdenticalPrefix: repeat,
    });
  }
}

function interpret(
  stage: Stage,
  response: StructuredResponse | CitedResponse,
  attempt: number,
  attempts: number,
  maxTokens: number,
): 'ok' | 'retry' {
  if (response.stopReason === 'refusal') {
    // A refusal on a suspension appeal is a signal about the case, not a bug —
    // it routes to human escalation with the category logged.
    throw new EngineError(
      'model_refusal',
      `stage ${stage} refused (${response.refusalCategory ?? 'unspecified'})`,
      stage,
    );
  }
  if (response.stopReason === 'max_tokens') {
    if (attempt < attempts) return 'retry';
    throw new EngineError(
      'max_tokens_exhausted',
      `stage ${stage} hit max_tokens (${maxTokens}) on the retry ceiling`,
      stage,
    );
  }
  return 'ok';
}

export async function callStructured(
  deps: EngineDeps,
  stage: Stage,
  build: (maxTokens: number) => StructuredRequest,
  ceilingsOverride?: readonly number[],
): Promise<StructuredResponse> {
  const ceilings = ceilingsOverride ?? [deps.config.maxTokens[stage], deps.config.retryMaxTokens[stage]];
  for (let attempt = 1; attempt <= ceilings.length; attempt += 1) {
    const maxTokens = ceilings[attempt - 1] as number;
    const request = build(maxTokens);
    const response = await deps.model.runStructured(request);
    record(deps, stage, attempt, response, request.systemPrefix);
    if (interpret(stage, response, attempt, ceilings.length, maxTokens) === 'ok') return response;
  }
  throw new EngineError('max_tokens_exhausted', `stage ${stage} exhausted retries`, stage);
}

export async function callCited(
  deps: EngineDeps,
  stage: Stage,
  build: (maxTokens: number) => CitedRequest,
  ceilingsOverride?: readonly number[],
): Promise<CitedResponse> {
  const ceilings = ceilingsOverride ?? [deps.config.maxTokens[stage], deps.config.retryMaxTokens[stage]];
  for (let attempt = 1; attempt <= ceilings.length; attempt += 1) {
    const maxTokens = ceilings[attempt - 1] as number;
    const request = build(maxTokens);
    const response = await deps.model.runCited(request);
    record(deps, stage, attempt, response, request.systemPrefix);
    if (interpret(stage, response, attempt, ceilings.length, maxTokens) === 'ok') return response;
  }
  /* c8 ignore next */
  throw new EngineError('max_tokens_exhausted', `stage ${stage} exhausted retries`, stage);
}
