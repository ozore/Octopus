/**
 * POST /api/gap-report/<token>/documents — `specs/15` §7, §8, A9.
 *
 * The server re-reads size and content type FROM THE OBJECT and applies M4's
 * file validation verbatim. The 26th file is refused with a message pointing at
 * the trial, and the first 25 still process — a cap that fails the session
 * would punish the visitor for the one file we would not take.
 */
import '@/lib/platform';

import { createHash } from 'node:crypto';

import { getDb } from '@/lib/db';
import { MAX_DOCUMENTS_PER_SESSION, addSessionDocument, findSessionByToken } from '@/lib/gap-report';
import { UploadRejected, assertUploadable, getDocumentStore } from '@/lib/storage/document-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function sniff(bytes: Uint8Array): string {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'application/pdf';
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  return 'application/octet-stream';
}

export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await ctx.params;
  const db = await getDb();
  const session = await findSessionByToken(db, token);
  if (!session) return new Response('unknown report', { status: 404 });

  const body = (await request.json().catch(() => null)) as { key?: string; originalFilename?: string } | null;
  if (!body?.key) return Response.json({ error: 'key is required' }, { status: 400 });
  // A key is only ever accepted under THIS session's prefix.
  if (!body.key.startsWith(`gap/${session.id}/`)) {
    return Response.json({ error: 'that object does not belong to this report' }, { status: 403 });
  }

  const store = getDocumentStore();
  let bytes: Uint8Array;
  try {
    bytes = await store.get(body.key);
  } catch {
    return Response.json({ error: 'we could not read that upload. Try again.' }, { status: 409 });
  }

  const mime = sniff(bytes);
  try {
    assertUploadable(mime, bytes.byteLength);
  } catch (error) {
    if (error instanceof UploadRejected) {
      await store.delete(body.key);
      return Response.json({ error: error.message, reason: error.reason }, { status: 415 });
    }
    throw error;
  }

  const result = await addSessionDocument(db, {
    session,
    storageKey: body.key,
    mime,
    bytes: bytes.byteLength,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    originalFilename: body.originalFilename ?? null,
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown',
  });

  switch (result.status) {
    case 'ok':
    case 'duplicate':
      return Response.json({ documentId: result.documentId, duplicate: result.status === 'duplicate' }, { status: 200 });
    case 'too_many':
      await store.delete(body.key);
      return Response.json(
        { error: `The free report covers ${MAX_DOCUMENTS_PER_SESSION} — start a trial to track more.` },
        { status: 409 },
      );
    case 'session_too_large':
      await store.delete(body.key);
      return Response.json({ error: 'That is more than 50 MB in one report. Send the largest files on their own.' }, { status: 413 });
    case 'ip_limit':
      await store.delete(body.key);
      return Response.json({ error: 'That is as many files as we take from one connection in a day.' }, { status: 429 });
    case 'closed':
      return Response.json({ error: 'This report is already being built.' }, { status: 409 });
  }
}
