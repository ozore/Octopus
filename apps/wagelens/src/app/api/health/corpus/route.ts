/**
 * `GET /api/health/corpus` — the ops surface, and the source of gate G6's
 * alert.
 *
 * Public on purpose: it holds no customer data, and a public corpus health
 * endpoint is the cheapest possible answer to "is your data current?" — which
 * is the question the whole product's credibility rests on. `stale` is true
 * when the oldest active determination has not been re-verified in 35 days, and
 * also when the corpus is EMPTY: an empty corpus is not fresh.
 */
import '@/lib/platform';

import { getDb } from '@/lib/db';
import { corpusHealth, PARSER_VERSION } from '@/lib/kb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  const db = await getDb();
  const health = await corpusHealth(db);
  return Response.json(
    {
      active_determinations: health.activeDeterminations,
      superseded_revisions_held: health.supersededRevisionsHeld,
      determinations_with_history: health.determinationsWithHistory,
      classifications: health.classifications,
      counties: health.counties,
      oldest_last_verified: health.oldestLastVerified,
      parser_version: health.parserVersion ?? PARSER_VERSION,
      status: health.stale ? 'degraded' : 'ok',
    },
    { status: health.stale ? 503 : 200 },
  );
}
