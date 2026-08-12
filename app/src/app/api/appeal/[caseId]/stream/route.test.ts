/**
 * The SSE transport, including the path that is easiest to get wrong.
 *
 * Spec: ARCHITECTURE.md §3.1 (the streaming preview), §2.2 Twelve-Factor IX
 * ("an interrupted draft must be resumable, because the seller is mid-panic and
 * will not paste twice"), USER_JOURNEY.md §6.
 *
 * THE REJOIN IS THE TEST WORTH HAVING. A first connection to a running case is
 * the easy case and it is what a developer clicks through. The one that breaks
 * silently is the second connection — a reload, an `EventSource` reconnect, or
 * React's development strict mode mounting the effect twice — because the run
 * registry replays its whole buffer *synchronously*, so a finished case emits
 * `done` before `subscribe` has even returned. A handler that assumed the
 * subscription existed by then would throw inside the stream's `start`, and the
 * seller who reloaded would get a dead page rather than the narration they
 * already paid attention to.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { ensureRun } from '@/app/_lib/appeal-run';
import { createCase, resetCaseStore } from '@/app/_lib/case-store';
import type { ProgressEvent } from '@/app/_lib/progress';
import { resetRuns, subscribe } from '@/app/_lib/run-registry';
import { GOLDEN_SET } from '@/lib/engine/evals';

import { GET } from './route';

afterEach(() => {
  resetCaseStore();
  resetRuns();
});

function notice(): string {
  const fixture = GOLDEN_SET[0];
  if (!fixture) throw new Error('the golden set is empty');
  return fixture.notice;
}

/** Reads the whole SSE body and parses the `data:` frames back into events. */
async function drain(response: Response): Promise<ProgressEvent[]> {
  const body = await response.text();
  return body
    .split('\n\n')
    .filter((frame) => frame.startsWith('data: '))
    .map((frame) => JSON.parse(frame.slice('data: '.length)) as ProgressEvent);
}

function request(caseId: string): Promise<Response> {
  return GET(new Request(`http://localhost/api/appeal/${caseId}/stream`), {
    params: Promise.resolve({ caseId }),
  });
}

describe('GET /api/appeal/{caseId}/stream', () => {
  it('narrates a fresh case from the first stage to done', async () => {
    const record = createCase(notice());
    const events = await drain(await request(record.id));

    expect(events.some((e) => e.type === 'stage')).toBe(true);
    expect(events.at(-1)?.type).toBe('done');
  });

  it('replays the whole run to a reader who reconnects after it finished', async () => {
    const record = createCase(notice());
    const run = ensureRun(record);
    await new Promise<void>((resolve) => {
      subscribe(run, (event) => event.type === 'done' && resolve());
    });

    // The reload. This must not throw, and it must not hand back a truncated
    // narration — a rejoining reader sees the earlier stages as done, which is
    // the Nielsen #1 property (the system reports where it actually is).
    const events = await drain(await request(record.id));

    expect(events.filter((e) => e.type === 'done')).toHaveLength(1);
    expect(events.some((e) => e.type === 'stage' && e.state === 'done')).toBe(true);
    expect(events.some((e) => e.type === 'preview' || e.type === 'escalated')).toBe(true);
  });

  it('sends event-stream headers with buffering disabled end to end', async () => {
    const record = createCase(notice());
    const response = await request(record.id);

    expect(response.headers.get('content-type')).toMatch(/text\/event-stream/);
    expect(response.headers.get('cache-control')).toMatch(/no-cache/);
    // A proxy that holds 4KB before flushing turns a narrated wait back into a
    // silent one — the exact failure USER_JOURNEY §6 exists to prevent.
    expect(response.headers.get('x-accel-buffering')).toBe('no');
    await response.text();
  });

  it('404s an unknown case rather than opening an empty stream', async () => {
    const response = await request('case_does_not_exist');
    expect(response.status).toBe(404);
  });
});
