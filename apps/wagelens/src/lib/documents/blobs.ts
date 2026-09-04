/**
 * The blob store, which is a table (see `schema/documents-extra.ts` for why).
 *
 * This module is the SEAM. Every read and write of a generated file goes
 * through `putBlob` / `getBlob`, so the day `@octopus/platform` grows a real
 * object-store adapter, the change is this file and nothing else — no
 * migration, no change to `documents.storage_key`, no re-hash of a filed
 * document. The request for that adapter is in `REQUESTS.md`.
 *
 * The key is **content-addressed by identity, not by content**:
 * `payroll/<payrollId>/<kind>-<generatorVersion>.pdf`. Re-running a generation
 * therefore overwrites the same key with identical bytes (V5) instead of
 * accumulating copies, and a `generator_version` bump writes a NEW key and
 * keeps the old document exactly as it was filed.
 */

import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';

import type { Db } from '@octopus/platform/db';

import { documentBlobs } from '../schema';

export type BlobKind = 'wh347' | 'statement_of_compliance';

export function documentStorageKey(
  payrollId: string,
  kind: BlobKind,
  generatorVersion: string,
): string {
  return `payroll/${payrollId}/${kind}-${generatorVersion}.pdf`;
}

export function exportStorageKey(exportId: string, extension: string): string {
  return `export/${exportId}.${extension}`;
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(Buffer.from(bytes)).digest('hex');
}

export async function putBlob(
  db: Db,
  input: { storageKey: string; bytes: Uint8Array; contentType?: string },
): Promise<{ storageKey: string; byteSize: number; sha256: string }> {
  const buffer = Buffer.from(input.bytes);
  const values = {
    storageKey: input.storageKey,
    contentType: input.contentType ?? 'application/pdf',
    byteSize: buffer.byteLength,
    contentBase64: buffer.toString('base64'),
  };
  await db
    .insert(documentBlobs)
    .values(values)
    .onConflictDoUpdate({
      target: documentBlobs.storageKey,
      set: {
        contentType: values.contentType,
        byteSize: values.byteSize,
        contentBase64: values.contentBase64,
      },
    });
  return { storageKey: input.storageKey, byteSize: buffer.byteLength, sha256: sha256Hex(buffer) };
}

/** `undefined` when the blob is missing — the caller regenerates rather than
 *  serving a 500, because a certified payroll with no file is recoverable. */
export async function getBlob(
  db: Db,
  storageKey: string,
): Promise<{ bytes: Buffer; contentType: string } | undefined> {
  const [row] = await db
    .select()
    .from(documentBlobs)
    .where(eq(documentBlobs.storageKey, storageKey))
    .limit(1);
  if (!row) return undefined;
  return { bytes: Buffer.from(row.contentBase64, 'base64'), contentType: row.contentType };
}
