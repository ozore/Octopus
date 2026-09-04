/**
 * M8 — THE BRANDED, NO-ACCOUNT UPLOAD LINK. `specs/08` §4, §5, §6.
 *
 * **MULTI-USE BY DESIGN.** A single-use link breaks the moment an agent
 * forwards it to the colleague who actually has the PDF, which is exactly how
 * this gets done. Security is not "the link can be used once"; it is:
 *
 *   - a 32-byte token, stored only as a SHA-256 hash — a database dump is not
 *     a set of upload capabilities;
 *   - an expiry, and revocability;
 *   - the page exposes nothing but a vendor name, a requirement summary and an
 *     upload box (§6, and `projectLink` below is the allowlist);
 *   - IP rate limiting and constant-time comparison against enumeration.
 *
 * `specs/08` §6, MJ-14, on what a bad token sees — and the distinction is a UX
 * ruling, not an oversight:
 *
 *   - **expired** or **revoked**: a real link a real agent holds, so the page
 *     names the customer's org and says "ask them for a new one". A bare 404
 *     reads as broken and generates a support email.
 *   - **never issued** or **malformed**: a GENERIC page naming nobody, and it
 *     must be indistinguishable — status, body and timing bucket — from the
 *     malformed case. An attacker learns nothing from a valid link they
 *     already hold, so the enumeration defence is the entropy, the rate limit
 *     and the identical response, not a uniform error page.
 */

import { and, eq, sql } from 'drizzle-orm';
import { timingSafeEqual } from 'node:crypto';

import { generateToken, hashToken } from '@octopus/platform/auth';
import { organisations } from '@octopus/platform/db';

import { writeAuditEvent, type AuditActor } from '../audit';
import type { Db } from '../db';
import { newId } from '../ids';
import { uploadLinks, vendors } from '../schema';

/** `specs/08` §4: expiry + 45 days, and never less than 30 days from creation. */
export const LINK_DAYS_AFTER_EXPIRY = 45;
export const LINK_MIN_DAYS = 30;

export type CreateUploadLinkInput = {
  orgId: string;
  vendorId: string;
  /** `'reminder:T-30'` | `'manual'` — what asked for this link. */
  createdFor: string;
  /** The certificate expiry the link is chasing, if there is one. */
  expiryDate?: string | null;
  createdBy?: string | null;
  now?: Date;
  actor?: AuditActor;
};

export type CreatedUploadLink = {
  id: string;
  /** THE RAW TOKEN, RETURNED ONCE. It exists in the email and nowhere else. */
  token: string;
  expiresAt: Date;
};

export function linkExpiry(expiryDate: string | null | undefined, now: Date): Date {
  const floor = new Date(now.getTime() + LINK_MIN_DAYS * 86_400_000);
  if (!expiryDate) return floor;
  const fromExpiry = new Date(
    Date.UTC(+expiryDate.slice(0, 4), +expiryDate.slice(5, 7) - 1, +expiryDate.slice(8, 10)) +
      LINK_DAYS_AFTER_EXPIRY * 86_400_000,
  );
  return fromExpiry.getTime() > floor.getTime() ? fromExpiry : floor;
}

export async function createUploadLink(db: Db, input: CreateUploadLinkInput): Promise<CreatedUploadLink> {
  const now = input.now ?? new Date();
  const token = generateToken(32);
  const id = newId('uploadLink');
  const expiresAt = linkExpiry(input.expiryDate ?? null, now);

  await db.insert(uploadLinks).values({
    id,
    orgId: input.orgId,
    vendorId: input.vendorId,
    tokenHash: hashToken(token),
    expiresAt,
    createdBy: input.createdBy ?? null,
    createdFor: input.createdFor,
    createdAt: now,
  });

  if (input.actor) {
    await writeAuditEvent(db, {
      orgId: input.orgId,
      actor: input.actor,
      kind: 'link.created',
      subjectType: 'vendor',
      subjectId: input.vendorId,
      payload: { expiresAt: expiresAt.toISOString().slice(0, 10), purpose: input.createdFor },
    });
  }

  return { id, token, expiresAt };
}

export type LinkState = 'valid' | 'expired' | 'revoked' | 'archived' | 'invalid';

export type ResolvedUploadLink = {
  state: LinkState;
  linkId: string | null;
  orgId: string | null;
  orgName: string | null;
  vendorId: string | null;
  vendorName: string | null;
  createdFor: string | null;
  useCount: number;
  firstOpen: boolean;
};

const INVALID: ResolvedUploadLink = {
  state: 'invalid',
  linkId: null,
  orgId: null,
  orgName: null,
  vendorId: null,
  vendorName: null,
  createdFor: null,
  useCount: 0,
  firstOpen: false,
};

/**
 * Resolve a raw token. The hash is compared with `timingSafeEqual` even though
 * the lookup is already by hash: the point is that no code path here branches
 * on a partial match, so a timing signal cannot distinguish "close" from
 * "wrong". A token of the wrong SHAPE returns the same `invalid` as one that
 * was never issued (A5b).
 */
export async function resolveUploadLink(
  db: Db,
  rawToken: string,
  options: { now?: Date } = {},
): Promise<ResolvedUploadLink> {
  const now = options.now ?? new Date();
  if (typeof rawToken !== 'string' || rawToken.length < 16 || rawToken.length > 128) return INVALID;

  const hash = hashToken(rawToken);
  const [row] = await db
    .select({
      id: uploadLinks.id,
      orgId: uploadLinks.orgId,
      vendorId: uploadLinks.vendorId,
      tokenHash: uploadLinks.tokenHash,
      expiresAt: uploadLinks.expiresAt,
      revokedAt: uploadLinks.revokedAt,
      createdFor: uploadLinks.createdFor,
      useCount: uploadLinks.useCount,
      firstOpenedAt: uploadLinks.firstOpenedAt,
      vendorName: vendors.name,
      archivedAt: vendors.archivedAt,
      orgName: organisations.name,
    })
    .from(uploadLinks)
    .innerJoin(vendors, eq(vendors.id, uploadLinks.vendorId))
    .innerJoin(organisations, eq(organisations.id, uploadLinks.orgId))
    .where(eq(uploadLinks.tokenHash, hash))
    .limit(1);

  if (!row) return INVALID;
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(row.tokenHash, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return INVALID;

  const base = {
    linkId: row.id,
    orgId: row.orgId,
    orgName: row.orgName,
    vendorId: row.vendorId,
    vendorName: row.vendorName,
    createdFor: row.createdFor,
    useCount: row.useCount,
    firstOpen: row.firstOpenedAt === null,
  };

  // Precedence: revoked beats expired beats archived. A customer who revoked a
  // link wants the agent told that, not told the vendor is gone.
  if (row.revokedAt) return { ...base, state: 'revoked' };
  if (row.expiresAt.getTime() <= now.getTime()) return { ...base, state: 'expired' };
  if (row.archivedAt) return { ...base, state: 'archived' };
  return { ...base, state: 'valid' };
}

/** A7: three people open one link, all three can upload, `useCount` is 3. */
export async function recordLinkOpen(db: Db, linkId: string, now = new Date()): Promise<void> {
  await db
    .update(uploadLinks)
    .set({
      useCount: sql`${uploadLinks.useCount} + 1`,
      lastOpenedAt: now,
      firstOpenedAt: sql`coalesce(${uploadLinks.firstOpenedAt}, ${now})`,
    })
    .where(eq(uploadLinks.id, linkId));
}

export async function revokeUploadLink(
  db: Db,
  input: { orgId: string; linkId: string; actor: AuditActor; now?: Date },
): Promise<boolean> {
  const rows = await db
    .update(uploadLinks)
    .set({ revokedAt: input.now ?? new Date() })
    .where(and(eq(uploadLinks.id, input.linkId), eq(uploadLinks.orgId, input.orgId)))
    .returning();
  const row = rows[0];
  if (!row) return false;
  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'link.revoked',
    subjectType: 'vendor',
    subjectId: row.vendorId,
  });
  return true;
}

export async function listUploadLinks(db: Db, orgId: string, vendorId: string) {
  return db
    .select()
    .from(uploadLinks)
    .where(and(eq(uploadLinks.orgId, orgId), eq(uploadLinks.vendorId, vendorId)))
    .orderBy(sql`${uploadLinks.createdAt} desc`)
    .limit(50);
}

/**
 * THE PAGE'S DATA PROJECTION — `specs/08` §6 and A9, as a function rather than
 * as a convention.
 *
 * The page renders ONLY: the customer's org name, the vendor name, the
 * requirement summary, and what expired. Never another vendor, another
 * document, a user's name, a price, or any other org data. `tests/upload-link`
 * serialises this object and asserts its key set, because the failure mode is
 * somebody passing the whole row into a component "just for now".
 */
export type LinkPageProps = {
  state: LinkState;
  orgName: string | null;
  vendorName: string | null;
  requirements: { key: string; text: string }[];
  expiryDate: string | null;
  expiredCoverages: string[];
  canUpload: boolean;
};

export const LINK_PAGE_KEYS: ReadonlyArray<keyof LinkPageProps> = [
  'state',
  'orgName',
  'vendorName',
  'requirements',
  'expiryDate',
  'expiredCoverages',
  'canUpload',
];

export function projectLink(input: {
  resolved: ResolvedUploadLink;
  requirements: { key: string; text: string }[];
  expiryDate: string | null;
  expiredCoverages: string[];
}): LinkPageProps {
  const named = input.resolved.state !== 'invalid';
  return {
    state: input.resolved.state,
    orgName: named ? input.resolved.orgName : null,
    vendorName: named ? input.resolved.vendorName : null,
    requirements: input.resolved.state === 'valid' ? input.requirements : [],
    expiryDate: input.resolved.state === 'valid' ? input.expiryDate : null,
    expiredCoverages: input.resolved.state === 'valid' ? input.expiredCoverages : [],
    canUpload: input.resolved.state === 'valid',
  };
}
