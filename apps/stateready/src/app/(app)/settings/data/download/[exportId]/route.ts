/**
 * GET /settings/data/download/{id} — the export zip.
 *
 * Org-scoped twice: the row must belong to the session's organisation AND the
 * storage key must start with `org/<orgId>/`. A document URL from organisation
 * A returns 404 for a session in organisation B even if the id leaks, which is
 * the same property `specs/04` requires of a licence document.
 */
import '@/lib/platform';

import { and, eq } from 'drizzle-orm';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { belongsToOrg, getDocumentStore } from '@/lib/documents';
import { dataExports } from '@/lib/schema';
import { track } from '@octopus/platform/events';
import { getSession } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ exportId: string }> },
): Promise<Response> {
  const session = await getSession();
  if (!session) return new Response('not found', { status: 404 });

  const { exportId } = await context.params;
  const db = await getDb();
  const [row] = await db
    .select()
    .from(dataExports)
    .where(and(eq(dataExports.id, exportId), eq(dataExports.orgId, session.org.id)))
    .limit(1);

  if (!row || row.status !== 'ready' || !row.storageKey) return new Response('not found', { status: 404 });
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    return new Response('that link expired — request a new export', { status: 410 });
  }
  if (!belongsToOrg(row.storageKey, session.org.id)) return new Response('not found', { status: 404 });

  const bytes = await getDocumentStore(getEnv()).get(session.org.id, row.storageKey);
  if (!bytes) return new Response('not found', { status: 404 });

  await track(db, { name: 'export_downloaded', orgId: session.org.id, userId: session.user.id });

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="stateready-export-${row.createdAt.toISOString().slice(0, 10)}.zip"`,
      'cache-control': 'private, no-store',
    },
  });
}
