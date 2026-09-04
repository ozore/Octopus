/**
 * POST /api/gap-report/session — `specs/15` §7.
 *
 * No auth. Rate-limited by IP, and refused **before any inference is spent**
 * when the IP is over its daily allowance or the daily spend cap has been
 * reached (§8, §11, A11).
 *
 * The launch gate is checked here rather than only on the page: until the
 * founder's legal read lands, this endpoint accepts nothing from a stranger,
 * so a page cached before the flag flipped cannot open a session.
 */
import '@/lib/platform';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { createGapSession, isAudience } from '@/lib/gap-report';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  const env = getEnv();
  const db = await getDb();
  const body = (await request.json().catch(() => null)) as { audience?: string } | null;
  if (!isAudience(body?.audience)) {
    return Response.json({ error: 'choose who you are first' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const result = await createGapSession(db, { audience: body.audience, ip });

  switch (result.status) {
    case 'ok':
      return Response.json({ token: result.token }, { status: 200 });
    case 'not_open':
      return Response.json(
        { error: 'The free gap report is not open yet. Try the samples demo, or join the list.' },
        { status: 403 },
      );
    case 'rate_limited':
      return Response.json(
        { error: `That is the third free report from this connection today. A 14-day ${env.APP_NAME} trial has no such limit.` },
        { status: 429 },
      );
    case 'at_capacity':
      return Response.json(
        { error: `The free report is at capacity today — start a 14-day ${env.APP_NAME} trial.` },
        { status: 503 },
      );
  }
}
