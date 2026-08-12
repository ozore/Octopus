/**
 * Engine configuration.
 *
 * Spec: LLM_ENGINE.md §2.2 (per-stage model assignment), ADR-101 (mixed tiers),
 * §6.1 (thresholds), §3.3 (cache TTL policy), Twelve-Factor III.
 *
 * Two constraints that are invisible in the code below:
 *
 *  - Model IDs are PINNED, not tuned. ADR-101: a model change is an ADR and a
 *    corpus-release bump, never a config tweak, because outcome attribution
 *    (ADR-008) depends on `model_id` being stamped on every persisted output.
 *    They are read from the environment only so a staging deploy can pin a
 *    different *release of the same decision*.
 *
 *  - τ (`confidenceFloor`) and δ (`confidenceMargin`) are DELIBERATELY UNSET as
 *    findings (LLM_ENGINE §9 Q-E3). The values here are the scaffold's
 *    placeholders carried over from `reason-codes.ts`; §6.1 specifies the
 *    *method* for setting them — an asymmetric loss function that bounds the
 *    confident-wrong rate on the golden set, not accuracy maximisation. They are
 *    config, not constants, precisely so calibration is a config change.
 */

import { getEnv } from '../../env';
import type { CacheTtl, Effort, ModelId } from '../adapters/anthropic';
import { DEFAULT_CLASSIFIER_FLOOR, DEFAULT_CONFIDENCE_MARGIN } from '../domain/reason-codes';

export type EngineStage = 'classify' | 'draft' | 'critique';

export type EngineConfig = {
  readonly models: Readonly<Record<EngineStage, ModelId>>;
  readonly effort: Readonly<Record<EngineStage, Effort>>;
  /** `max_tokens` caps thinking + text TOGETHER on Opus 5, hence the headroom. */
  readonly maxTokens: Readonly<Record<EngineStage, number>>;
  /** One retry ceiling per stage. A truncated POA burns the seller's one
   *  attempt and is strictly worse than a delay (LLM_ENGINE §6.4). */
  readonly retryMaxTokens: Readonly<Record<EngineStage, number>>;
  readonly cacheTtl: CacheTtl;
  readonly thresholds: {
    /** τ — top-1 confidence floor. */
    readonly confidenceFloor: number;
    /** δ — top1 − top2 margin. Genuine two-code ambiguity is the dangerous case. */
    readonly confidenceMargin: number;
  };
  /**
   * Bounded evaluator-optimizer iterations, counting the first draft. 2 means:
   * draft → critique → at most one revision → critique. Bounded in code because
   * an unbounded optimise-until-satisfied loop is an agent loop, which D9/N7
   * forbid and E1 replaces with a fixed pipeline.
   */
  readonly maxDraftIterations: number;
  readonly corpusRelease: number;
  readonly promptBundleHash: string;
};

export type EngineConfigOverrides = {
  models?: Partial<Record<EngineStage, ModelId>>;
  thresholds?: Partial<EngineConfig['thresholds']>;
  maxDraftIterations?: number;
  cacheTtl?: CacheTtl;
  corpusRelease?: number;
  promptBundleHash?: string;
};

const BASE_MAX_TOKENS: Record<EngineStage, number> = {
  classify: 2_000,
  draft: 16_000,
  critique: 4_000,
};

const RETRY_MAX_TOKENS: Record<EngineStage, number> = {
  classify: 4_000,
  draft: 24_000,
  critique: 6_000,
};

const EFFORT: Record<EngineStage, Effort> = {
  classify: 'medium',
  draft: 'high',
  critique: 'high',
};

export function engineConfigFromEnv(overrides: EngineConfigOverrides = {}): EngineConfig {
  const env = getEnv();
  return {
    models: {
      classify: overrides.models?.classify ?? env.MODEL_CLASSIFY,
      draft: overrides.models?.draft ?? env.MODEL_DRAFT,
      critique: overrides.models?.critique ?? env.MODEL_CRITIQUE,
    },
    effort: EFFORT,
    maxTokens: BASE_MAX_TOKENS,
    retryMaxTokens: RETRY_MAX_TOKENS,
    cacheTtl: overrides.cacheTtl ?? env.CORPUS_CACHE_TTL,
    thresholds: {
      confidenceFloor: overrides.thresholds?.confidenceFloor ?? DEFAULT_CLASSIFIER_FLOOR,
      confidenceMargin: overrides.thresholds?.confidenceMargin ?? DEFAULT_CONFIDENCE_MARGIN,
    },
    maxDraftIterations: overrides.maxDraftIterations ?? 2,
    corpusRelease: overrides.corpusRelease ?? env.CORPUS_RELEASE,
    promptBundleHash: overrides.promptBundleHash ?? env.PROMPT_BUNDLE_HASH,
  };
}
