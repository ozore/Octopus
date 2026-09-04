import { getDb } from '@/lib/db';
import { boardCsv, buildBoard } from '@/lib/repos/board';
import { track } from '@octopus/platform/events';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * The CSV export — `specs/07` §Errors' working fallback, and the format half
 * this persona will always prefer (`PERSONA.md` §2.2: they already live in a
 * spreadsheet).
 *
 * It carries the **citation URL and `last_verified` on every derived row**, the
 * same as the print view, because an export that drops the provenance turns
 * this product's output back into the spreadsheet it replaced.
 */
export async function GET(request: Request): Promise<Response> {
  const { org } = await requireOrg();
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);
  const state = new URL(request.url).searchParams.get('state');

  const model = await buildBoard(db, org.id, today, { state });
  await track(db, { name: 'dashboard_exported', orgId: org.id, props: { format: 'csv', state } });

  const slug = org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'company';
  return new Response(boardCsv(model), {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${slug}-compliance-${today}.csv"`,
      'cache-control': 'private, no-store',
    },
  });
}
