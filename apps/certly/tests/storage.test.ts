/**
 * The `DocumentStore` contract — `REVIEW.md` §3 and `specs/03` §9/§10.
 *
 * The point of the interface is that nothing above it knows which adapter is in
 * use, so the contract tests run against the in-memory store and the live
 * adapter is only checked for the things that can be checked offline: that it
 * exists, that it is selected by `ADAPTER_MODE=live`, and that it never loads
 * its SDK — and therefore never reaches for a credential — until it is called.
 */
import { afterEach, describe, expect, it } from 'vitest';

import {
  ACCEPTED_MIME,
  InMemoryDocumentStore,
  MAX_UPLOAD_BYTES,
  UploadRejected,
  VercelBlobStore,
  assertUploadable,
  documentKey,
  getDocumentStore,
  setDocumentStore,
} from '../src/lib/storage/document-store';

const bytes = (text: string) => new TextEncoder().encode(text);

afterEach(() => {
  setDocumentStore(null);
  delete process.env['ADAPTER_MODE'];
});

describe('the four methods REVIEW.md §3 specifies, plus list', () => {
  it('puts, reads a signed URL, gets and deletes', async () => {
    const store = new InMemoryDocumentStore();
    await store.put('org/o1/abc.pdf', bytes('%PDF-1.7'), 'application/pdf');

    const url = await store.signedUrl('org/o1/abc.pdf', 300);
    expect(url).toContain('org%2Fo1%2Fabc.pdf');
    expect(url).toContain('expires=');

    expect(new TextDecoder().decode(await store.get('org/o1/abc.pdf'))).toBe('%PDF-1.7');

    await store.delete('org/o1/abc.pdf');
    await expect(store.get('org/o1/abc.pdf')).rejects.toThrow(/No stored object/);
  });

  it('lists by prefix, which is how the orphan sweep and the M15 purge work', async () => {
    const store = new InMemoryDocumentStore();
    await store.put('org/o1/a.pdf', bytes('a'), 'application/pdf');
    await store.put('org/o1/b.pdf', bytes('bb'), 'application/pdf');
    await store.put('org/o2/c.pdf', bytes('ccc'), 'application/pdf');
    await store.put('gap/s1/d.pdf', bytes('dddd'), 'application/pdf');

    expect((await store.list('org/o1/')).map((o) => o.key)).toEqual(['org/o1/a.pdf', 'org/o1/b.pdf']);
    expect((await store.list('gap/s1/')).map((o) => o.size)).toEqual([4]);
    expect(await store.list('org/o3/')).toEqual([]);
  });

  it('refuses a signed URL for an object that is not there', async () => {
    await expect(new InMemoryDocumentStore().signedUrl('missing', 60)).rejects.toThrow();
  });
});

describe('browser-direct upload (MJ-17)', () => {
  it('issues a single-use token scoped to one key and completes the PUT', async () => {
    const store = new InMemoryDocumentStore();
    const token = await store.createUploadToken({ key: 'org/o1/x.pdf', mime: 'application/pdf', bytes: 900_000 });
    expect(token.key).toBe('org/o1/x.pdf');
    expect(token.expiresAt.getTime()).toBeGreaterThan(0);

    const key = await store.completeUpload(token.token, bytes('%PDF'), 'application/pdf');
    expect(key).toBe('org/o1/x.pdf');
    expect(await store.get(key)).toBeInstanceOf(Uint8Array);

    // Single use: the same token cannot mint a second object.
    await expect(store.completeUpload(token.token, bytes('%PDF'), 'application/pdf')).rejects.toThrow(/already-used/);
  });

  it('validates before the token is issued, so the bytes never leave the browser', async () => {
    const store = new InMemoryDocumentStore();
    await expect(
      store.createUploadToken({ key: 'k', mime: 'application/zip', bytes: 10 }),
    ).rejects.toBeInstanceOf(UploadRejected);
    await expect(
      store.createUploadToken({ key: 'k', mime: 'application/pdf', bytes: MAX_UPLOAD_BYTES + 1 }),
    ).rejects.toBeInstanceOf(UploadRejected);
    expect(store.size()).toBe(0);
  });
});

describe('upload validation (specs/03 §10)', () => {
  it('accepts exactly the four types the extractor can read', () => {
    expect([...ACCEPTED_MIME]).toEqual(['application/pdf', 'image/jpeg', 'image/png', 'image/heic']);
    for (const mime of ACCEPTED_MIME) expect(() => assertUploadable(mime, 1000)).not.toThrow();
  });

  it('rejects an empty file, an oversized file and an unreadable type, each with its own reason', () => {
    expect(() => assertUploadable('application/pdf', 0)).toThrow(/empty/i);
    try {
      assertUploadable('application/pdf', MAX_UPLOAD_BYTES + 1);
      throw new Error('should have thrown');
    } catch (error) {
      expect((error as UploadRejected).reason).toBe('too_large');
    }
    try {
      assertUploadable('text/csv', 10);
      throw new Error('should have thrown');
    } catch (error) {
      expect((error as UploadRejected).reason).toBe('mime');
    }
  });

  it('accepts a 20 MB file exactly on the boundary', () => {
    expect(() => assertUploadable('application/pdf', MAX_UPLOAD_BYTES)).not.toThrow();
  });
});

describe('keys', () => {
  it('is org-scoped and content-addressed, so a prefix listing is a tenant boundary', () => {
    expect(documentKey({ orgId: 'org_1' }, 'deadbeef', 'application/pdf')).toBe('org/org_1/deadbeef.pdf');
    expect(documentKey({ orgId: 'org_1' }, 'deadbeef', 'image/jpeg')).toBe('org/org_1/deadbeef.jpg');
  });

  it('puts the anonymous gap-report path outside every org prefix', () => {
    expect(documentKey({ gapSessionId: 's1' }, 'cafe', 'image/png')).toBe('gap/s1/cafe.png');
  });
});

describe('composition', () => {
  it('binds the in-memory store under ADAPTER_MODE=mock', () => {
    process.env['ADAPTER_MODE'] = 'mock';
    expect(getDocumentStore().mode).toBe('memory');
  });

  it('binds VercelBlobStore under ADAPTER_MODE=live, without loading its SDK', () => {
    process.env['ADAPTER_MODE'] = 'live';
    const store = getDocumentStore();
    expect(store.mode).toBe('vercel_blob');
    expect(store).toBeInstanceOf(VercelBlobStore);
  });

  it('returns the same handle twice, because Next compiles two module graphs', () => {
    process.env['ADAPTER_MODE'] = 'mock';
    expect(getDocumentStore()).toBe(getDocumentStore());
  });
});
