/**
 * Cost accounting — `specs/03` §14, `THRESHOLDS.md` §5, `specs/15` §11.
 *
 * `extraction_succeeded.cost_cents` is what retires the cost hypothesis
 * `H-EC-1`. It comes from the REAL `usage` object, never from a model of it —
 * which is why this module takes a `ModelUsage` and refuses to estimate from
 * page counts or characters.
 *
 * The rate card is a fetched fact with a date, like every other number in this
 * repo: platform.claude.com pricing, read 2026-09-04. Cache writes bill at
 * ~1.25x input and cache reads at ~0.1x input.
 */

import type { ModelUsage } from './adapters/anthropic';

export type RateCard = {
  /** US dollars per million input tokens. */
  inputPerMTok: number;
  outputPerMTok: number;
};

export const RATES_VERIFIED_ON = '2026-09-04';

/**
 * Only the models this product is allowed to run. An unknown model id is an
 * ERROR rather than a default rate: a silently-wrong `cost_cents` is worse than
 * a missing one, because it is the number the margin claim rests on.
 */
export const RATE_CARD: Record<string, RateCard> = {
  'claude-opus-5': { inputPerMTok: 5, outputPerMTok: 25 },
  'claude-sonnet-5': { inputPerMTok: 2, outputPerMTok: 10 },
};

export const CACHE_WRITE_MULTIPLIER = 1.25;
export const CACHE_READ_MULTIPLIER = 0.1;

export class UnknownModelRateError extends Error {
  constructor(readonly model: string) {
    super(
      `No published rate for "${model}". Add it to RATE_CARD with the date it was read, ` +
        'or cost_cents becomes a number nobody can defend.',
    );
    this.name = 'UnknownModelRateError';
  }
}

/** Dollars, full precision. `cost_cents` on the row is this × 100. */
export function costDollars(model: string, usage: ModelUsage): number {
  const rate = RATE_CARD[model];
  if (!rate) throw new UnknownModelRateError(model);
  const perInputToken = rate.inputPerMTok / 1_000_000;
  const perOutputToken = rate.outputPerMTok / 1_000_000;
  return (
    usage.inputTokens * perInputToken +
    usage.cacheCreationInputTokens * perInputToken * CACHE_WRITE_MULTIPLIER +
    usage.cacheReadInputTokens * perInputToken * CACHE_READ_MULTIPLIER +
    usage.outputTokens * perOutputToken
  );
}

/** `numeric(8,4)` on `extractions.cost_cents` — four decimal places of a cent. */
export function costCents(model: string, usage: ModelUsage): number {
  return Math.round(costDollars(model, usage) * 100 * 10_000) / 10_000;
}

/**
 * Batch pricing. Backfills and the anonymous gap report route through the
 * Message Batches API at 50% (`specs/03` §5, `specs/15` §11). Interactive
 * uploads never do — a customer watching a spinner is not a batch job.
 */
export function batchCostCents(model: string, usage: ModelUsage): number {
  return Math.round(costCents(model, usage) * 0.5 * 10_000) / 10_000;
}
