/**
 * The one place a cron route checks its secret.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` on every cron invocation;
 * `x-cron-secret` is accepted too, for a manual curl during an incident. The
 * comparison is constant-time (the platform's `secretsMatch`), and an absent
 * secret is a REFUSAL rather than a bypass — a route that opens itself when its
 * guard is unconfigured is worse than one that fails closed.
 */

import { secretsMatch } from '@octopus/platform/auth';
import { getContext } from '@octopus/platform/runtime';

export async function requireCronSecret(request: Request): Promise<Response | null> {
  const ctx = await getContext();
  const secret = ctx.env.CRON_SECRET;
  const header = request.headers.get('authorization') ?? '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  const alternative = request.headers.get('x-cron-secret') ?? '';
  if (!secret || !(secretsMatch(bearer, secret) || secretsMatch(alternative, secret))) {
    return new Response('unauthorized', { status: 401 });
  }
  return null;
}
