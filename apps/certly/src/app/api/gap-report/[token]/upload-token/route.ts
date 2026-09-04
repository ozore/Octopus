/**
 * POST /api/gap-report/<token>/upload-token — `specs/15` §7.
 *
 * The same browser-direct sequence as every other upload path in this product:
 * a short-lived, key-scoped credential, and the bytes PUT straight to storage.
 * The key sits under `gap/<sessionId>/`, which is **outside every org** — the
 * anonymous path never touches an org prefix.
 */
import '@/lib/platform';

import { getDb } from '@/lib/db';
import { findSessionByToken } from '@/lib/gap-report';
import { UploadRejected, assertUploadable, documentKey, getDocumentStore } from '@/lib/storage/document-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await ctx.params;
  const db = await getDb();
  const session = await findSessionByToken(db, token);
  if (!session || session.status !== 'collecting') {
    return new Response('this report is not accepting files', { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as
    | { filename?: string; mime?: string; bytes?: number; sha256?: string }
    | null;
  if (!body?.mime || typeof body.bytes !== 'number' || !body.sha256) {
    return Response.json({ error: 'filename, mime, bytes and sha256 are required' }, { status: 400 });
  }

  try {
    assertUploadable(body.mime, body.bytes);
  } catch (error) {
    if (error instanceof UploadRejected) {
      return Response.json({ error: error.message, reason: error.reason }, { status: 415 });
    }
    throw error;
  }

  const store = getDocumentStore();
  const key = documentKey({ gapSessionId: session.id }, body.sha256, body.mime);
  const issued = await store.createUploadToken({ key, mime: body.mime, bytes: body.bytes, ttlSeconds: 120 });
  const origin = new URL(request.url).origin;
  const uploadUrl =
    store.mode === 'memory' ? `${origin}/mock/blob/${encodeURIComponent(issued.token)}` : issued.uploadUrl;

  return Response.json({ uploadUrl, token: issued.token, key: issued.key }, { status: 200 });
}
