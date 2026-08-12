/**
 * The streaming preview — `GET /api/appeal/{caseId}/stream`.
 *
 * Spec: ARCHITECTURE.md §3.1 ("`POST /api/appeal` opens a Server-Sent Events
 * stream. The client renders each stage as it completes"), USER_JOURNEY.md §6.
 *
 * GET RATHER THAN POST, and the difference matters: `EventSource` only issues
 * GETs, and the notice is already persisted against the case by the intake
 * action, so the stream carries no payload — it attaches to a run. That also
 * makes reconnection free, which Twelve-Factor IX asks for by name ("an
 * interrupted draft must be resumable, because the seller is mid-panic and will
 * not paste twice").
 *
 * The handler starts nothing itself; `ensureRun` owns the once-per-case
 * guarantee. This file is transport.
 */

import { getCase } from '@/app/_lib/case-store';
import { ensureRun } from '@/app/_lib/appeal-run';
import { encodeSse } from '@/app/_lib/progress';
import { subscribe } from '@/app/_lib/run-registry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ caseId: string }> },
): Promise<Response> {
  const { caseId } = await context.params;
  const record = getCase(caseId);

  if (!record) {
    return new Response('Unknown case.', { status: 404 });
  }

  const run = ensureRun(record);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed by the client going away */
        }
      };

      const unsubscribe = subscribe(run, (event) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(encodeSse(event)));
        } catch {
          close();
          return;
        }
        if (event.type === 'done') close();
      });

      if (run.done) close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      // No buffering anywhere in the path: a proxy that holds 4KB before
      // flushing turns a narrated wait back into a silent one, which is the
      // exact failure USER_JOURNEY §6 is written to prevent.
      'Cache-Control': 'no-cache, no-store, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
