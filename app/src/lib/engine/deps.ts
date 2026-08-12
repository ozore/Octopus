/**
 * The engine's dependencies, in one place.
 *
 * Spec: ARCHITECTURE.md §2.2 factor IV (attached resources), LLM_ENGINE.md §3.4
 * (cache hygiene).
 *
 * Note what is NOT here: no vendor SDK, no database handle, no clock. The engine
 * talks to exactly one model surface — the `AnthropicAdapter` interface — which
 * is what lets the whole suite run with no network and no API key. Persistence
 * is the caller's job; the engine returns values.
 */

import type { EngineConfig } from './config';
import { engineConfigFromEnv } from './config';
import type { CorpusProvider } from './corpus-port';
import type { EngineEventSink } from './events';
import { noopEventSink } from './events';
import type { AnthropicAdapter } from '../adapters/anthropic';

/**
 * Remembers which (model, system-prefix) pairs this process has already sent, so
 * a *repeat* request reporting `cache_read_input_tokens === 0` can be alarmed on.
 * The first request is expected to be a cache write; the second is the one that
 * proves an invalidator has not crept above the breakpoint (§3.4).
 */
export class PrefixWitness {
  private seen = new Set<string>();

  /** @returns true if this exact prefix has been sent to this model before. */
  witness(model: string, prefix: string): boolean {
    const key = `${model}::${fnv1a(prefix)}`;
    const repeat = this.seen.has(key);
    this.seen.add(key);
    return repeat;
  }

  reset(): void {
    this.seen.clear();
  }
}

export type EngineDeps = {
  readonly model: AnthropicAdapter;
  readonly corpus: CorpusProvider;
  readonly config: EngineConfig;
  readonly events: EngineEventSink;
  readonly witness: PrefixWitness;
};

export type EngineDepsInput = {
  model: AnthropicAdapter;
  corpus: CorpusProvider;
  config?: EngineConfig;
  events?: EngineEventSink;
  witness?: PrefixWitness;
};

export function createDeps(input: EngineDepsInput): EngineDeps {
  return {
    model: input.model,
    corpus: input.corpus,
    config: input.config ?? engineConfigFromEnv(),
    events: input.events ?? noopEventSink,
    witness: input.witness ?? new PrefixWitness(),
  };
}

function fnv1a(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
