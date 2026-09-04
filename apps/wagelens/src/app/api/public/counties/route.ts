/**
 * `GET /api/public/counties?state=XX` — the county select's data.
 *
 * This is the ONE public JSON endpoint, and it exists because a `<select>` of
 * 254 counties has to come from somewhere. **There is no public JSON API for
 * rates**, and that is a deliberate decision recorded in WL-00 so nobody adds
 * one for convenience: the HTML pages are public because the data is public,
 * but the corpus is the moat and handing it over in bulk is the one way to lose
 * it. Counties are a dictionary, not the corpus.
 */
import '@/lib/platform';

import { getDb } from '@/lib/db';
import { listCounties } from '@/lib/kb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const state = new URL(request.url).searchParams.get('state');
  if (!state || !/^[A-Za-z]{2}$/.test(state)) {
    return Response.json({ error: 'state must be a two-letter code' }, { status: 400 });
  }
  const db = await getDb();
  const counties = await listCounties(db, state);
  return Response.json(
    { state: state.toUpperCase(), counties },
    { headers: { 'cache-control': 'public, max-age=3600' } },
  );
}
