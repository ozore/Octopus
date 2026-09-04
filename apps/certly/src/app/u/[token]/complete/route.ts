/**
 * POST /u/<token>/complete — `specs/08` §5.
 *
 * THE SERVER RE-READS SIZE AND CONTENT TYPE FROM THE STORED OBJECT and never
 * trusts the client's numbers. It then writes the document with
 * `source = 'link'` and `uploadedBy = null` — an upload through a link is
 * attributed to the vendor on the link and to no user, and a link cannot be
 * repointed at another vendor (§6).
 *
 * Extraction is ENQUEUED, not awaited: A2 gives the agent "received" within two
 * seconds, because an agent who waits for a model call is an agent who closes
 * the tab.
 */
import '@/lib/platform';

import { createHash } from 'node:crypto';

import { enqueue } from '@octopus/platform/jobs';
import { track } from '@octopus/platform/events';

import { writeAuditEvent } from '@/lib/audit';
import { getDb } from '@/lib/db';
import { createDocument } from '@/lib/repos/documents';
import { recordLinkOpen, resolveUploadLink } from '@/lib/repos/upload-links';
import { UploadRejected, assertUploadable, getDocumentStore } from '@/lib/storage/document-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** The mime the object claims, narrowed to what `specs/03` §10 accepts. */
function sniff(bytes: Uint8Array, declared: string | null): string {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'application/pdf';
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  return declared ?? 'application/octet-stream';
}

export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await ctx.params;
  const db = await getDb();
  const resolved = await resolveUploadLink(db, token);
  if (resolved.state !== 'valid' || !resolved.orgId || !resolved.vendorId) {
    return new Response('this link is not active', { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { key?: string; filename?: string } | null;
  if (!body?.key) return Response.json({ error: 'key is required' }, { status: 400 });

  // A key is only ever accepted under this org's prefix. Without this check a
  // link for one customer could be used to attach another customer's object.
  if (!body.key.startsWith(`org/${resolved.orgId}/`)) {
    return Response.json({ error: 'that object does not belong to this request' }, { status: 403 });
  }

  const store = getDocumentStore();
  let bytes: Uint8Array;
  try {
    bytes = await store.get(body.key);
  } catch {
    return Response.json({ error: 'we could not read the uploaded file. Try again.' }, { status: 409 });
  }

  const mime = sniff(bytes, null);
  try {
    assertUploadable(mime, bytes.byteLength);
  } catch (error) {
    if (error instanceof UploadRejected) {
      await store.delete(body.key);
      await track(db, {
        name: 'vendor_upload_rejected',
        orgId: resolved.orgId,
        props: { reason: error.reason },
      });
      return Response.json({ error: error.message, reason: error.reason }, { status: 415 });
    }
    throw error;
  }

  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const { documentId, duplicate } = await createDocument(db, {
    orgId: resolved.orgId,
    vendorId: resolved.vendorId,
    storageKey: body.key,
    mime,
    bytes: bytes.byteLength,
    sha256,
    source: 'link',
    uploadedBy: null,
    filename: body.filename ?? 'a certificate',
    vendorName: resolved.vendorName,
    actor: { kind: 'vendor_link' },
  });

  if (resolved.linkId) await recordLinkOpen(db, resolved.linkId);

  if (!duplicate) {
    // B1's pipeline: the kind is registered in `src/lib/platform.ts` and its
    // handler belongs to M4. Enqueueing rather than calling keeps this route
    // inside its two-second budget and keeps M8 independent of M4's shape.
    await enqueue(db, {
      kind: 'certly.extract_document',
      payload: { documentId, orgId: resolved.orgId, source: 'link' },
      dedupeKey: `certly.extract_document:${documentId}`,
    });
    await writeAuditEvent(db, {
      orgId: resolved.orgId,
      actor: { kind: 'vendor_link' },
      kind: 'link.upload_received',
      subjectType: 'vendor',
      subjectId: resolved.vendorId,
      payload: { vendorName: resolved.vendorName },
    });
  }

  await track(db, {
    name: 'vendor_upload_completed',
    orgId: resolved.orgId,
    props: { mime, bytes: bytes.byteLength },
  });

  return Response.json({ status: duplicate ? 'already_received' : 'received', documentId }, { status: 200 });
}
