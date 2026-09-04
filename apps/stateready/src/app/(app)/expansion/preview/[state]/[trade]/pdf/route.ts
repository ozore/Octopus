import { track } from '@octopus/platform/events';
import { requireOrg } from '@octopus/platform/next';

import { getDb } from '@/lib/db';
import { assertPackIntegrity } from '@/lib/packs/integrity';
import { renderPackPdf } from '@/lib/packs/pdf';
import { holdingsFor, previewEntryPack } from '@/lib/packs/service';

export const dynamic = 'force-dynamic';

/**
 * The preview, on paper.
 *
 * It is the same `EntryPack` object the preview page renders, in `preview`
 * mode, so the two cannot disagree about what is withheld — and the integrity
 * assertion runs here too, because a preview that leaked an unsourced figure
 * would be exactly as bad as a paid pack that did.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ state: string; trade: string }> },
): Promise<Response> {
  const { state, trade } = await context.params;
  const { org } = await requireOrg();
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);

  const holdings = await holdingsFor(db, org.id);
  const { records, pack } = previewEntryPack({
    state,
    trades: [trade],
    today,
    holdings,
    organisationName: org.name,
  });
  if (!pack) return new Response('Not found', { status: 404 });

  assertPackIntegrity(pack, records);
  const bytes = await renderPackPdf(pack);

  await track(db, {
    name: 'playbook_pdf_downloaded',
    orgId: org.id,
    props: { state: pack.targetState, trades: pack.trades, mode: 'preview' },
  });

  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="state-entry-pack-preview-${pack.targetState.toLowerCase()}-${trade}.pdf"`,
      'cache-control': 'no-store',
    },
  });
}
