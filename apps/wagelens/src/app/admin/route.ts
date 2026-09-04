/**
 * GET /admin — WL-12.
 *
 * `THRESHOLDS.md` pre-commits to numbers evaluated at n ≥ 100 signups, with
 * persevere / iterate / stop actions attached to each band. **A pre-committed
 * decision that cannot be evaluated is not a commitment, it is a wish** — this
 * page is what makes the commitment real, and it exists before the first cold
 * email rather than after.
 *
 * Guarded by `OPS_SHARED_SECRET`, not by a customer account. The spec asks for
 * `ADMIN_EMAILS` plus a session; sub-wave A had already chosen the shared
 * secret for the platform's own admin route and `src/env.ts` is frozen, so this
 * route keeps that boundary — and it is arguably the better one: the people who
 * read this are the founder and an agent, neither of whom should need a
 * customer account, and a secret in an env var cannot be granted to the wrong
 * signup by a bug in a role column. The deviation is recorded in `CLAUDE.md`.
 *
 * An unauthorised request gets **404**, not 401: no oracle that the page exists.
 */
import '@/lib/platform';

import { getEnv } from '@/env';
import { emitEvent } from '@/lib/analytics/events';
import { renderAdminPage } from '@/lib/analytics/admin-render';
import { buildAdminReport, exportEvents, windows, type MetricWindow } from '@/lib/analytics/funnel';
import { getDb } from '@/lib/db';
import { plans } from '@/lib/plans';
import { secretsMatch } from '@octopus/platform/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const env = getEnv();
  const url = new URL(request.url);
  const header = request.headers.get('authorization') ?? '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  const provided = bearer || request.headers.get('x-ops-secret') || url.searchParams.get('secret');

  if (!env.OPS_SHARED_SECRET || !secretsMatch(provided, env.OPS_SHARED_SECRET)) {
    // 404, not 403: a 403 confirms the page is there.
    return new Response('not found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const db = await getDb();
  const available = windows();
  const requested = url.searchParams.get('window') ?? '30d';
  const windowKey = requested in available ? requested : '30d';
  const window = available[windowKey] as MetricWindow;

  if (url.searchParams.get('format') === 'csv') {
    const csv = await exportEvents(db, window);
    await emitEvent(db, 'admin_events_exported', {
      props: { window: windowKey, rows: csv.split('\n').length - 1 },
    });
    return new Response(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="events-${windowKey}.csv"`,
        'cache-control': 'no-store',
      },
    });
  }

  const report = await buildAdminReport(db, { plans, env: env as never, window });
  await emitEvent(db, 'admin_metrics_viewed', { props: { window: windowKey } });

  const html = renderAdminPage({ appName: env.APP_NAME, report, windowKey });
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}
