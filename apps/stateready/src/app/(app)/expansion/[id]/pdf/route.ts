import { track } from '@octopus/platform/events';
import { requireOrg } from '@octopus/platform/next';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { getDocumentStore } from '@/lib/documents';
import { renderPackPdf } from '@/lib/packs/pdf';
import { getPlaybook } from '@/lib/packs/service';
import type { EntryPack } from '@/lib/packs/types';

export const dynamic = 'force-dynamic';

/**
 * The delivered pack's PDF.
 *
 * It serves the STORED bytes when they exist, because a pack is a statement
 * about the world on a date and re-rendering it after the knowledge base moved
 * would quietly hand the buyer a different document under the same purchase.
 * If the renderer was down at delivery (`specs/08` §Errors) and there is no
 * stored key, it renders from the stored `contentJson` — the same frozen
 * object, never from the live records.
 *
 * The document key carries the organisation id, so a pack from organisation A
 * cannot be fetched by a session in organisation B even if the key leaks.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const { org } = await requireOrg();
  const db = await getDb();

  const playbook = await getPlaybook(db, org.id, id);
  if (!playbook || playbook.status !== 'ready' || !playbook.contentJson) {
    return new Response('Not found', { status: 404 });
  }

  let bytes: Uint8Array | null = null;
  if (playbook.pdfStorageKey) {
    bytes = await getDocumentStore(getEnv()).get(org.id, playbook.pdfStorageKey);
  }
  if (!bytes) bytes = await renderPackPdf(playbook.contentJson as unknown as EntryPack);

  await track(db, {
    name: 'playbook_pdf_downloaded',
    orgId: org.id,
    props: { playbookId: playbook.id, mode: 'full' },
  });

  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="state-entry-pack-${playbook.targetState.toLowerCase()}.pdf"`,
      'cache-control': 'no-store',
    },
  });
}
