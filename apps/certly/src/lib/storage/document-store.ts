/**
 * THE ONLY STORAGE CONTRACT IN THE CODEBASE — `specs/03` §9, `REVIEW.md` §3.
 *
 * Vercel Blob at launch, behind this interface, with an `S3Store` written only
 * when total storage passes ~500 GB or egress becomes a visible line. Nothing
 * above the interface knows which is in use, and **Neon never holds document
 * bytes** — only `documents.storageKey`.
 *
 * WHY UPLOADS ARE NOT A MULTIPART POST. A Vercel Function caps the REQUEST BODY
 * far below the 20 MB the specs validate (4.5 MB at the time of writing), so
 * every phone photo from an agent (`specs/08`) and every multi-file gap-report
 * session (`specs/15`) would fail at the platform rather than at our validator
 * (REVIEW.md MJ-17). All three upload paths therefore use the CLIENT-UPLOAD
 * FLOW: the browser asks a route handler for a short-lived token, PUTs the
 * bytes straight to Blob, and the server receives only the blob reference.
 * `createUploadToken` is that route handler's half of it, and it is why this
 * interface has five methods rather than four.
 *
 * `list` is the fifth. `REVIEW.md` §3 names four — put, signedUrl, get, delete
 * — and two jobs the specs require cannot be written without enumeration: the
 * daily sweep of orphaned blobs with no `documents` row (`specs/03` §9) and
 * M15's purge (`specs/15` §6). Recorded as deviation D-4 in BUILD.md.
 */

export type StoredObject = {
  key: string;
  size: number;
  mime: string | null;
  uploadedAt: Date;
};

export type UploadToken = {
  /** Where the browser PUTs the bytes. */
  uploadUrl: string;
  /** The short-lived credential the browser presents. Never persisted. */
  token: string;
  /** The key the object will have. The server records this, not a URL. */
  key: string;
  expiresAt: Date;
};

export interface DocumentStore {
  /** Server-side write. The browser path uses `createUploadToken` instead. */
  put(key: string, bytes: Uint8Array, mime: string): Promise<void>;
  /** A time-limited URL for reading one object. Never a permanent public link. */
  signedUrl(key: string, ttlSeconds: number): Promise<string>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
  /** Enumeration, for the orphan sweep and the M15 purge. */
  list(prefix: string): Promise<StoredObject[]>;
  /**
   * A single-use, single-key, short-lived credential for a browser-direct PUT.
   * `bytes` is the size the client CLAIMS; the server re-reads the object's
   * real size and content type after the PUT and never trusts this number
   * (`specs/03` §9, `POST /api/upload/complete`).
   */
  createUploadToken(input: {
    key: string;
    mime: string;
    bytes: number;
    ttlSeconds?: number;
  }): Promise<UploadToken>;
  /** Which adapter this is, for the admin page and for tests. */
  readonly mode: 'memory' | 'vercel_blob';
}

/** The upload rules every path shares — `specs/03` §10. */
export const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'] as const;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_PAGES = 25;
/**
 * The measured Vercel Function request-body limit at the time of writing.
 * `specs/03` §9 asks wave 2 to re-verify it and record the number with its
 * date. **Measured: not re-verified in sub-wave A** — no deployment exists to
 * measure against yet, so this carries the spec's own figure and its date, and
 * BUILD.md hands the measurement to the M4 agent (platform request PR-2).
 */
export const VERCEL_REQUEST_BODY_LIMIT_BYTES = 4.5 * 1024 * 1024;
export const VERCEL_REQUEST_BODY_LIMIT_SOURCE = 'specs/03 §9, stated 2026-09-03; not re-measured';

export class UploadRejected extends Error {
  constructor(
    readonly reason: 'mime' | 'too_large' | 'empty',
    message: string,
  ) {
    super(message);
    this.name = 'UploadRejected';
  }
}

/** Validated BEFORE a token is issued, so the bytes never leave the browser. */
export function assertUploadable(mime: string, bytes: number): void {
  if (!(ACCEPTED_MIME as readonly string[]).includes(mime)) {
    throw new UploadRejected('mime', `Certly reads PDFs and photos. It cannot read ${mime}.`);
  }
  if (bytes <= 0) throw new UploadRejected('empty', 'That file is empty.');
  if (bytes > MAX_UPLOAD_BYTES) {
    throw new UploadRejected('too_large', `That file is larger than ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.`);
  }
}

/**
 * `org/<orgId>/<sha256>.<ext>` — org-scoped so a prefix listing is a tenant
 * boundary, and content-addressed so the same certificate uploaded twice is one
 * object. The gap-report path uses `gap/<sessionId>/…`, which has no org.
 */
export function documentKey(scope: { orgId: string } | { gapSessionId: string }, sha256: string, mime: string): string {
  const ext = mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : mime === 'image/heic' ? 'heic' : 'jpg';
  const prefix = 'orgId' in scope ? `org/${scope.orgId}` : `gap/${scope.gapSessionId}`;
  return `${prefix}/${sha256}.${ext}`;
}

// ---------------------------------------------------------------------------
// In-memory adapter — tests, `ADAPTER_MODE=mock`, and local development
// ---------------------------------------------------------------------------

export class InMemoryDocumentStore implements DocumentStore {
  readonly mode = 'memory' as const;
  private readonly objects = new Map<string, { bytes: Uint8Array; mime: string; uploadedAt: Date }>();
  private readonly tokens = new Map<string, { key: string; expiresAt: Date }>();
  private clock = 0;
  private counter = 0;

  /** Deterministic time, so a test never depends on the machine's clock. */
  private now(): Date {
    this.clock += 1000;
    return new Date(Date.UTC(2026, 0, 1) + this.clock);
  }

  async put(key: string, bytes: Uint8Array, mime: string): Promise<void> {
    this.objects.set(key, { bytes: new Uint8Array(bytes), mime, uploadedAt: this.now() });
  }

  async signedUrl(key: string, ttlSeconds: number): Promise<string> {
    if (!this.objects.has(key)) throw new Error(`No stored object at ${key}`);
    // Shaped like the real thing so a caller cannot come to depend on the
    // difference: an opaque URL with an expiry in it, valid only for one key.
    const expires = Math.floor(this.now().getTime() / 1000) + ttlSeconds;
    return `memory://documents/${encodeURIComponent(key)}?expires=${expires}`;
  }

  async get(key: string): Promise<Uint8Array> {
    const found = this.objects.get(key);
    if (!found) throw new Error(`No stored object at ${key}`);
    return found.bytes;
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }

  async list(prefix: string): Promise<StoredObject[]> {
    return [...this.objects.entries()]
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => ({ key, size: value.bytes.byteLength, mime: value.mime, uploadedAt: value.uploadedAt }))
      .sort((a, b) => (a.key < b.key ? -1 : 1));
  }

  async createUploadToken(input: { key: string; mime: string; bytes: number; ttlSeconds?: number }): Promise<UploadToken> {
    assertUploadable(input.mime, input.bytes);
    this.counter += 1;
    const token = `memtok_${this.counter}`;
    const expiresAt = new Date(this.now().getTime() + (input.ttlSeconds ?? 60) * 1000);
    this.tokens.set(token, { key: input.key, expiresAt });
    return { uploadUrl: `memory://upload/${token}`, token, key: input.key, expiresAt };
  }

  /** Test affordance: perform the PUT a browser would have performed. */
  async completeUpload(token: string, bytes: Uint8Array, mime: string): Promise<string> {
    const claim = this.tokens.get(token);
    if (!claim) throw new Error('unknown or already-used upload token');
    this.tokens.delete(token);
    await this.put(claim.key, bytes, mime);
    return claim.key;
  }

  /** Test affordance only. */
  size(): number {
    return this.objects.size;
  }
}

// ---------------------------------------------------------------------------
// Vercel Blob adapter — `ADAPTER_MODE=live`
// ---------------------------------------------------------------------------

/**
 * `@vercel/blob` is imported DYNAMICALLY, for two reasons that both matter:
 * the unit suite must never load a module that reaches for a credential, and
 * the mock formation must run with `BLOB_READ_WRITE_TOKEN` unset.
 */
export class VercelBlobStore implements DocumentStore {
  readonly mode = 'vercel_blob' as const;

  constructor(private readonly token?: string) {}

  private async sdk() {
    return import('@vercel/blob');
  }

  private options() {
    return this.token ? { token: this.token } : {};
  }

  async put(key: string, bytes: Uint8Array, mime: string): Promise<void> {
    const { put } = await this.sdk();
    await put(key, Buffer.from(bytes), {
      access: 'public',
      contentType: mime,
      addRandomSuffix: false,
      ...this.options(),
    });
  }

  /**
   * KNOWN LIMITATION, recorded as deviation D-5 and platform request PR-3.
   * Vercel Blob at 2.x serves objects from an unguessable public URL; per-request
   * signed URLs with a TTL are not in the public API. The key is content-addressed
   * (a SHA-256) under an org prefix, so the URL is unguessable, but it does not
   * EXPIRE. Until Blob ships private access, a customer document is protected by
   * URL entropy rather than by an expiry — which is weaker than this interface
   * promises. M4's agent must either (a) proxy reads through a route handler
   * that checks `requireOrg()` and streams the bytes, or (b) move to `S3Store`
   * with a presigned GET. `ttlSeconds` is kept in the signature so that neither
   * choice changes a call site.
   */
  async signedUrl(key: string, ttlSeconds: number): Promise<string> {
    void ttlSeconds;
    const { head } = await this.sdk();
    const meta = await head(key, this.options());
    return meta.url;
  }

  async get(key: string): Promise<Uint8Array> {
    const url = await this.signedUrl(key, 60);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Blob read failed for ${key}: ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    const { del } = await this.sdk();
    await del(key, this.options());
  }

  async list(prefix: string): Promise<StoredObject[]> {
    const { list } = await this.sdk();
    const out: StoredObject[] = [];
    let cursor: string | undefined;
    do {
      const page = await (cursor
        ? list({ prefix, cursor, ...this.options() })
        : list({ prefix, ...this.options() }));
      for (const blob of page.blobs) {
        out.push({ key: blob.pathname, size: blob.size, mime: null, uploadedAt: new Date(blob.uploadedAt) });
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return out;
  }

  async createUploadToken(input: { key: string; mime: string; bytes: number; ttlSeconds?: number }): Promise<UploadToken> {
    assertUploadable(input.mime, input.bytes);
    const { generateClientTokenFromReadWriteToken } = await import('@vercel/blob/client');
    const ttl = input.ttlSeconds ?? 60;
    const expiresAt = new Date(Date.now() + ttl * 1000);
    const token = await generateClientTokenFromReadWriteToken({
      pathname: input.key,
      allowedContentTypes: [input.mime],
      maximumSizeInBytes: MAX_UPLOAD_BYTES,
      validUntil: expiresAt.getTime(),
      addRandomSuffix: false,
      ...this.options(),
    });
    return { uploadUrl: 'https://blob.vercel-storage.com', token, key: input.key, expiresAt };
  }
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

const HANDLE = Symbol.for('octopus.certly.documentStore');

type Global = typeof globalThis & { [HANDLE]?: DocumentStore };

/**
 * Pinned to `globalThis` for the same reason the platform pins its adapters:
 * Next compiles the RSC graph and the route/action graph SEPARATELY, so a
 * module-level singleton is two singletons and an in-memory store would lose
 * half its objects (`packages/platform/README.md` §4).
 */
export function getDocumentStore(): DocumentStore {
  const global = globalThis as Global;
  if (global[HANDLE]) return global[HANDLE];
  const mode = process.env['ADAPTER_MODE'] ?? 'mock';
  const store =
    mode === 'live'
      ? new VercelBlobStore(process.env['BLOB_READ_WRITE_TOKEN'])
      : new InMemoryDocumentStore();
  global[HANDLE] = store;
  return store;
}

/** Tests and the mock formation replace the handle wholesale. */
export function setDocumentStore(store: DocumentStore | null): void {
  const global = globalThis as Global;
  if (store === null) delete global[HANDLE];
  else global[HANDLE] = store;
}
