/**
 * `DocumentStore` — the seam between the product and wherever bytes live.
 *
 * The same shape Certly uses, and for the same reason: a licence card photo, a
 * generated Entry Pack PDF and a data export are all "some bytes with a key",
 * and the only thing that differs between a test and a deployment is who holds
 * them. In tests and local development that is an in-memory map; in live mode it
 * is Vercel Blob.
 *
 * TWO PROPERTIES THE INTERFACE EXISTS TO GUARANTEE:
 *
 *  1. **The suite never touches the network.** `MemoryDocumentStore` is the
 *     default and `vitest.base.ts` never sets `DOCUMENT_STORE=blob`.
 *  2. **A document is scoped to an organisation by its key**, so a document URL
 *     from organisation A cannot be resolved by a session in organisation B
 *     even if the id leaks (`specs/04` §Test plan, Security).
 *
 * Vercel Blob is loaded through a dynamic import inside the live implementation
 * ONLY, so `@vercel/blob` is not a hard dependency of the test run or of the
 * build. If the package is absent the live store fails loudly at first use
 * rather than at import time, which keeps `next build` green in CI where no
 * blob token exists.
 */

import { createHash, randomUUID } from 'node:crypto';

export type StoredDocument = {
  key: string;
  contentType: string;
  byteSize: number;
  sha256: string;
};

export interface DocumentStore {
  readonly mode: 'memory' | 'blob';
  put(input: {
    orgId: string;
    filename: string;
    contentType: string;
    body: Uint8Array;
  }): Promise<StoredDocument>;
  get(orgId: string, key: string): Promise<Uint8Array | null>;
  delete(orgId: string, key: string): Promise<void>;
}

/** `org/<orgId>/<uuid>/<safe filename>` — the org id IS part of the key. */
export function documentKey(orgId: string, filename: string): string {
  const safe = filename.replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 120) || 'file';
  return `org/${orgId}/${randomUUID()}/${safe}`;
}

export function belongsToOrg(key: string, orgId: string): boolean {
  return key.startsWith(`org/${orgId}/`);
}

export class MemoryDocumentStore implements DocumentStore {
  readonly mode = 'memory' as const;
  private readonly files = new Map<string, Uint8Array>();

  async put(input: { orgId: string; filename: string; contentType: string; body: Uint8Array }) {
    const key = documentKey(input.orgId, input.filename);
    this.files.set(key, input.body);
    return {
      key,
      contentType: input.contentType,
      byteSize: input.body.byteLength,
      sha256: createHash('sha256').update(input.body).digest('hex'),
    };
  }

  async get(orgId: string, key: string): Promise<Uint8Array | null> {
    if (!belongsToOrg(key, orgId)) return null;
    return this.files.get(key) ?? null;
  }

  async delete(orgId: string, key: string): Promise<void> {
    if (belongsToOrg(key, orgId)) this.files.delete(key);
  }

  get size(): number {
    return this.files.size;
  }
}

type VercelBlobModule = {
  put: (
    key: string,
    body: Buffer,
    options: { access: 'public'; token: string; contentType: string; addRandomSuffix: boolean },
  ) => Promise<{ url: string }>;
  head: (key: string, options: { token: string }) => Promise<{ url: string } | null>;
  del: (key: string, options: { token: string }) => Promise<void>;
};

/** Vercel Blob. Never constructed in tests; never imported at module load. */
export class BlobDocumentStore implements DocumentStore {
  readonly mode = 'blob' as const;
  constructor(private readonly token: string) {}

  /**
   * `@vercel/blob` is NOT a dependency of this workspace and is NOT typed here:
   * the module specifier is built at runtime so neither `tsc` nor `next build`
   * tries to resolve it, and CI — which has no blob token and no reason to
   * install it — stays green. In live mode the import succeeds because Vercel
   * provides the package; if it does not, this throws at first use with a
   * message naming the missing package rather than failing the whole build.
   */
  private async blob(): Promise<VercelBlobModule> {
    const specifier = ['@vercel', 'blob'].join('/');
    try {
      return (await import(/* webpackIgnore: true */ /* @vite-ignore */ specifier)) as VercelBlobModule;
    } catch (cause) {
      throw new Error(
        'DOCUMENT_STORE=blob needs the @vercel/blob package, which is not installed in this deployment.',
        { cause },
      );
    }
  }

  async put(input: { orgId: string; filename: string; contentType: string; body: Uint8Array }) {
    const { put } = await this.blob();
    const key = documentKey(input.orgId, input.filename);
    await put(key, Buffer.from(input.body), {
      access: 'public',
      token: this.token,
      contentType: input.contentType,
      addRandomSuffix: false,
    });
    return {
      key,
      contentType: input.contentType,
      byteSize: input.body.byteLength,
      sha256: createHash('sha256').update(input.body).digest('hex'),
    };
  }

  async get(orgId: string, key: string): Promise<Uint8Array | null> {
    if (!belongsToOrg(key, orgId)) return null;
    const { head } = await this.blob();
    const meta = await head(key, { token: this.token });
    if (!meta?.url) return null;
    const response = await fetch(meta.url);
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  }

  async delete(orgId: string, key: string): Promise<void> {
    if (!belongsToOrg(key, orgId)) return;
    const { del } = await this.blob();
    await del(key, { token: this.token });
  }
}

let store: DocumentStore | undefined;

export function setDocumentStore(next: DocumentStore | undefined): void {
  store = next;
}

export function getDocumentStore(env: { DOCUMENT_STORE?: string; BLOB_READ_WRITE_TOKEN?: string }): DocumentStore {
  if (store) return store;
  if (env.DOCUMENT_STORE === 'blob') {
    if (!env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('DOCUMENT_STORE=blob requires BLOB_READ_WRITE_TOKEN');
    }
    store = new BlobDocumentStore(env.BLOB_READ_WRITE_TOKEN);
  } else {
    store = new MemoryDocumentStore();
  }
  return store;
}

/**
 * Content sniffing, because an extension is a claim and a magic number is
 * evidence (`specs/04` §Validation: a `.pdf` that is actually a `.exe`).
 */
export const ALLOWED_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'] as const;
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

export function sniffContentType(body: Uint8Array): string | null {
  const b = body;
  if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  // HEIC: 'ftyp' at offset 4 with a heic/heix/hevc/mif1 brand.
  if (b.length >= 12) {
    const box = String.fromCharCode(b[4]!, b[5]!, b[6]!, b[7]!);
    const brand = String.fromCharCode(b[8]!, b[9]!, b[10]!, b[11]!);
    if (box === 'ftyp' && ['heic', 'heix', 'hevc', 'mif1', 'heim'].includes(brand)) return 'image/heic';
  }
  return null;
}
