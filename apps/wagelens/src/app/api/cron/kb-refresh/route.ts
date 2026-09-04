/**
 * `GET /api/cron/kb-refresh` — the daily index pass (WL-13).
 *
 * pre-flight (gate G10) → index → diff → **enqueue**. It NEVER fetches
 * determination text itself: 4,235 records at ~0.33 s each does not fit in a
 * serverless invocation, and a route that tried would time out halfway through
 * a corpus rather than fail cleanly. The drain consumes what this enqueues.
 *
 * Vercel's cron delivery is best effort and may fire the same schedule twice,
 * so this is idempotent: a second run the same day enqueues nothing, inserts
 * nothing, and only moves `last_verified` forward.
 */
import '@/lib/platform';

import { enqueue } from '@octopus/platform/jobs';

import { emitEvent } from '@/lib/analytics/events';
import { requireCronSecret } from '@/lib/cron-auth';
import { getDb } from '@/lib/db';
import { getSamAdapter, KB_JOB_KINDS, refreshIndex } from '@/lib/kb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const refused = await requireCronSecret(request);
  if (refused) return refused;

  const url = new URL(request.url);
  const state = url.searchParams.get('state') ?? undefined;

  const db = await getDb();
  const sam = getSamAdapter();
  await emitEvent(db, 'kb_ingest_started', { props: { kind: state ? 'delta' : 'full' } });

  const result = await refreshIndex(db, sam, {
    ...(state ? { state } : {}),
    onNewPair: async ({ wdNumber, modificationNumber }) => {
      await enqueue(db, {
        kind: KB_JOB_KINDS.fetchDetermination,
        payload: { wdNumber, modificationNumber, trigger: 'index' },
        dedupeKey: `kb.fetch:${wdNumber}:${modificationNumber}`,
      });
      // History is cheap and is pulled for anything that moves, so the public
      // modification control can always be drawn.
      await enqueue(db, {
        kind: KB_JOB_KINDS.fetchHistory,
        payload: { wdNumber },
        dedupeKey: `kb.history:${wdNumber}`,
      });
    },
  });

  if (result.status === 'aborted_on_gate') {
    await emitEvent(db, 'kb_preflight_aborted', {
      props: { reason: result.failureReason ?? 'unknown', seen: result.seen },
    });
    return Response.json(result, { status: 503 });
  }

  await emitEvent(db, 'kb_index_fetched', { props: { records: result.seen } });
  return Response.json({
    run_id: result.runId,
    seen: result.seen,
    new: result.new.length,
    reverified: result.reverified,
    deactivated: result.deactivated,
  });
}
