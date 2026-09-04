/**
 * POST /u/<token>/upload-token — `specs/08` §5.
 *
 * Issues a short-lived, single-use, KEY-SCOPED credential for a browser-direct
 * PUT, and returns the URL to PUT to. **The file never passes through a route
 * handler**: a Vercel Function's request body caps far below the 20 MB rule
 * (`document-store.ts`, REVIEW.md MJ-17), and an agent photographing a
 * certificate on a phone is exactly the case that breaks.
 *
 * `bytes` is what the CLIENT CLAIMS. It is validated here so the bytes never
 * leave the browser when the answer is going to be no — and re-read from the
 * stored object in `/complete`, which is the number that counts.
 */
import '@/lib/platform';

import { headers } from 'next/headers';

import { consumeRateLimit } from '@octopus/platform/auth';

import { getDb } from '@/lib/db';
import { resolveUploadLink } from '@/lib/repos/upload-links';
import { UploadRejected, assertUploadable, documentKey, getDocumentStore } from '@/lib/storage/document-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** `specs/08` §6: 10 uploads per token per day. */
const UPLOADS_PER_TOKEN_PER_DAY = 10;

export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await ctx.params;
  const db = await getDb();
  const resolved = await resolveUploadLink(db, token);
  if (resolved.state !== 'valid') return new Response('this link is not active', { status: 404 });

  const limit = await consumeRateLimit(db, {
    bucket: `certly:link_upload:${resolved.linkId}`,
    limit: UPLOADS_PER_TOKEN_PER_DAY,
    windowMs: 86_400_000,
  });
  if (!limit.allowed) return new Response('too many uploads on this link today', { status: 429 });

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
  const key = documentKey({ orgId: resolved.orgId as string }, body.sha256, body.mime);
  const issued = await store.createUploadToken({ key, mime: body.mime, bytes: body.bytes, ttlSeconds: 120 });

  // In the mock formation the store's own upload URL is not reachable from a
  // browser, so the local stand-in route is handed back instead. The SEQUENCE
  // the client performs is identical either way.
  const origin = new URL(request.url).origin;
  const uploadUrl =
    store.mode === 'memory' ? `${origin}/mock/blob/${encodeURIComponent(issued.token)}` : issued.uploadUrl;

  return Response.json(
    { uploadUrl, token: issued.token, key: issued.key, expiresAt: issued.expiresAt.toISOString() },
    { status: 200 },
  );
}
