/**
 * PUT /mock/blob/<token> — the local stand-in for Vercel Blob's client upload.
 *
 * The browser-direct upload path is the same in every formation: ask a route
 * handler for a short-lived, key-scoped token, then PUT the bytes to whatever
 * `uploadUrl` that handler returned. In `ADAPTER_MODE=mock` the store is the
 * in-memory one, whose `uploadUrl` is not something a browser can reach — so
 * this route IS that URL, exactly as `/mock/checkout` is Stripe's hosted page.
 *
 * It exists so the Playwright journey exercises the REAL upload sequence
 * offline rather than a second, easier one that only tests itself.
 *
 * It refuses to run against a real store: if the bound adapter is Vercel Blob,
 * there is nothing here to stand in for and a request is a bug.
 */
import '@/lib/platform';

import { getDocumentStore } from '@/lib/storage/document-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(request: Request, ctx: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await ctx.params;
  const store = getDocumentStore();
  if (store.mode !== 'memory' || !('completeUpload' in store)) {
    return new Response('not available', { status: 404 });
  }

  const mime = request.headers.get('content-type') ?? 'application/octet-stream';
  const bytes = new Uint8Array(await request.arrayBuffer());
  try {
    const key = await (store as unknown as {
      completeUpload(token: string, bytes: Uint8Array, mime: string): Promise<string>;
    }).completeUpload(token, bytes, mime);
    return Response.json({ key }, { status: 200 });
  } catch {
    // The same answer for an unknown token and a spent one: the browser has
    // nothing to learn from the difference.
    return new Response('invalid upload token', { status: 403 });
  }
}
