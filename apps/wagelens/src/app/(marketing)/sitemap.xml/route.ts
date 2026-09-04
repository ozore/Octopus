/**
 * `/sitemap.xml`, generated from `kb_*`.
 *
 * 3,088 (state, county) pairs × four construction types is a large, genuinely
 * useful, entirely factual public surface, and it is the only organic
 * acquisition channel this product has. **Active modifications only** (WL-00):
 * superseded revisions are reachable and canonical at their own URL, but an old
 * rate is not what a searcher wants first, so they are not submitted for
 * indexing.
 */
import '@/lib/platform';

import { eq, sql } from 'drizzle-orm';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { kbCounties, kbWageDeterminations, kbWdCounties } from '@/lib/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  const env = getEnv();
  const db = await getDb();
  const base = env.APP_BASE_URL.replace(/\/$/, '');

  const combos = await db
    .selectDistinct({
      stateCode: kbWdCounties.stateCode,
      slug: kbCounties.slug,
      types: kbWageDeterminations.constructionTypes,
    })
    .from(kbWdCounties)
    .innerJoin(kbWageDeterminations, eq(kbWdCounties.wdId, kbWageDeterminations.id))
    .innerJoin(
      kbCounties,
      sql`${kbCounties.stateCode} = ${kbWdCounties.stateCode} and ${kbCounties.samCountyCode} = ${kbWdCounties.samCountyCode} and ${kbCounties.countyName} = ${kbWdCounties.countyName}`,
    )
    .where(eq(kbWageDeterminations.isActive, true));

  const active = await db
    .select({ wdNumber: kbWageDeterminations.wdNumber })
    .from(kbWageDeterminations)
    .where(eq(kbWageDeterminations.isActive, true));

  const urls = new Set<string>([`${base}/`, `${base}/lookup`, `${base}/pricing`, `${base}/help`]);
  for (const combo of combos) {
    for (const type of combo.types) {
      urls.add(`${base}/lookup/${combo.stateCode.toLowerCase()}/${combo.slug}/${type.toLowerCase()}`);
    }
  }
  for (const row of active) urls.add(`${base}/wd/${row.wdNumber}`);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls].map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}
