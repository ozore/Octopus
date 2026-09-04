import { and, eq } from 'drizzle-orm';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { getDocumentStore } from '@/lib/documents';
import { licenceDocuments } from '@/lib/schema';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * M4 — the document viewer. `specs/04` §Screens and §Test plan (Security).
 *
 * **A document URL from organisation A returns 404 for a session in
 * organisation B**, and it does so THREE TIMES OVER, because a leak here is a
 * customer's compliance file in a stranger's browser:
 *
 *  1. the row lookup is scoped by `org_id`, so a guessed id finds nothing;
 *  2. `DocumentStore.get` re-checks the organisation against the storage key
 *     itself (`org/<orgId>/…`), so a mismatched row cannot resolve bytes;
 *  3. the response is 404, never 403 — a 403 confirms the id exists, and the id
 *     is the only thing an attacker has.
 *
 * Inline for images and PDFs, a download for anything else (`specs/04`
 * §Screens). `Content-Disposition` is built from a sanitised filename: a
 * filename is customer input and it travels in a header.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; documentId: string }> },
): Promise<Response> {
  const { id, documentId } = await context.params;
  const { org } = await requireOrg();
  const db = await getDb();

  const rows = await db
    .select()
    .from(licenceDocuments)
    .where(
      and(
        eq(licenceDocuments.id, documentId),
        eq(licenceDocuments.orgId, org.id),
        eq(licenceDocuments.licenceId, id),
      ),
    )
    .limit(1);
  const document = rows[0];
  if (!document) return new Response('Not found', { status: 404 });

  const store = getDocumentStore(getEnv());
  const body = await store.get(org.id, document.storageKey);
  if (!body) return new Response('Not found', { status: 404 });

  const inline = document.contentType.startsWith('image/') || document.contentType === 'application/pdf';
  const safeName = document.filename.replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 120) || 'document';

  return new Response(new Uint8Array(body), {
    status: 200,
    headers: {
      'content-type': document.contentType,
      'content-length': String(document.byteSize),
      'content-disposition': `${inline ? 'inline' : 'attachment'}; filename="${safeName}"`,
      // A licence document is private to one organisation and must never sit in
      // a shared cache on the way back.
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
