/**
 * One pipeline run per case, replayable — SERVER ONLY.
 *
 * Spec: ARCHITECTURE.md §3.1 (the SSE preview), §2.2 Twelve-Factor IX
 * (disposability — "an interrupted draft must be resumable, because the seller
 * is mid-panic and will not paste twice").
 *
 * WHY A REGISTRY AND NOT A BARE STREAM. An `EventSource` reconnects on its own,
 * React's development strict mode mounts effects twice, and a seller in a panic
 * reloads the tab. Every one of those opens a second GET on the same case, and a
 * route handler that started a fresh pipeline per connection would bill three
 * model calls per reload and interleave two narrations in one timeline. So the
 * run is keyed by case id: the first connection starts it, later connections
 * replay the buffer and then follow along.
 *
 * The buffer is also what makes the *late* joiner correct rather than merely
 * cheap — a reader who reconnects at stage 4 still sees stages 1–3 as done,
 * which is the Nielsen #1 property (the system reports where it actually is),
 * not a nicety.
 */

import type { ProgressEvent } from './progress';

export type Run = {
  caseId: string;
  events: ProgressEvent[];
  done: boolean;
  listeners: Set<(event: ProgressEvent) => void>;
};

const g = globalThis as typeof globalThis & { __cwRuns?: Map<string, Run> };
const runs: Map<string, Run> = (g.__cwRuns ??= new Map());

export function getRun(caseId: string): Run | undefined {
  return runs.get(caseId);
}

/**
 * Starts `exec` exactly once per case. Returns the existing run if there is one,
 * finished or not.
 */
export function startRun(
  caseId: string,
  exec: (emit: (event: ProgressEvent) => void) => Promise<void>,
): Run {
  const existing = runs.get(caseId);
  if (existing) return existing;

  const run: Run = { caseId, events: [], done: false, listeners: new Set() };
  runs.set(caseId, run);

  const emit = (event: ProgressEvent) => {
    run.events.push(event);
    for (const listener of run.listeners) listener(event);
  };

  void exec(emit)
    .catch((error: unknown) => {
      emit({
        type: 'failed',
        message: error instanceof Error ? error.message : 'The run stopped unexpectedly.',
      });
    })
    .finally(() => {
      emit({ type: 'done' });
      run.done = true;
    });

  return run;
}

/** Replays the buffer, then follows. Returns an unsubscribe function. */
export function subscribe(run: Run, listener: (event: ProgressEvent) => void): () => void {
  for (const event of run.events) listener(event);
  if (run.done) return () => undefined;
  run.listeners.add(listener);
  return () => run.listeners.delete(listener);
}

/** Test seam. */
export function resetRuns(): void {
  runs.clear();
}
