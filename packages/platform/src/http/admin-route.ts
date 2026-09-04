/**
 * GET /admin — the metrics table, guarded by `OPS_SHARED_SECRET`.
 *
 * A shared secret rather than a role on a user account, for the same reason
 * Clausewright's ops console uses one: the people who read it are the founder
 * and an agent, neither of whom should need a customer account, and a secret in
 * an env var cannot be granted to the wrong signup by mistake. The secret is
 * accepted from a header (an agent, a curl) or a query string (a browser), and
 * compared in constant time.
 */

import { secretsMatch } from '../auth/tokens';
import { renderAdminMetricsHtml } from '../events/admin';
import { computeMetrics, defaultRanges, type MetricsRange } from '../events/metrics';
import { queueDepth } from '../jobs/queue';
import { getContext, requirePlans } from '../runtime';

export function createAdminMetricsHandler(options: { ranges?: MetricsRange[] } = {}) {
  return async (request: Request): Promise<Response> => {
    const ctx = await getContext();
    const secret = ctx.env.OPS_SHARED_SECRET;
    const url = new URL(request.url);

    const header = request.headers.get('authorization') ?? '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
    const provided = bearer || request.headers.get('x-ops-secret') || url.searchParams.get('secret');

    if (!secret || !secretsMatch(provided, secret)) {
      return new Response('unauthorized', {
        status: 401,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    const ranges = options.ranges ?? defaultRanges();
    const plans = requirePlans();
    const metrics = [];
    for (const range of ranges) {
      metrics.push(
        await computeMetrics(ctx.db, {
          plans,
          env: ctx.env,
          ...(ctx.config.activationEvent ? { activationEvent: ctx.config.activationEvent } : {}),
          range,
        }),
      );
    }

    const html = renderAdminMetricsHtml({
      appName: ctx.env.APP_NAME,
      metrics,
      queueDepth: await queueDepth(ctx.db),
    });

    return new Response(html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    });
  };
}
