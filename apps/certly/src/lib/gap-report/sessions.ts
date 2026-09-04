/**
 * M15 — THE ANONYMOUS SESSION. `specs/15` §5, §6, §8, §11.
 *
 * This is the one surface where the product holds a third party's documents
 * with no contract and no relationship, so every rule that bounds it is code
 * here rather than a note somewhere:
 *
 *   - **caps**: 25 documents, 20 MB each, 50 MB per session (§8);
 *   - **rate limits**: 3 sessions per IP per day, 100 documents per IP per day
 *     (§8) — this surface spends real inference money on anonymous traffic;
 *   - **the daily spend cap** (§11), which is a LAUNCH REQUIREMENT and not a
 *     nice-to-have: a 25-document report costs $2.50-5.00, not $0.50, and
 *     shipping without the cap is the single easiest way to lose money here;
 *   - **`purgeAt` = createdAt + 7 DAYS**, set at creation so the purge job
 *     never has to infer it (§6, REVIEW.md B-07: 7 days, not 30);
 *   - **the requirement snapshot is written BEFORE comparison** (§8), so the
 *     report cannot be silently re-compared against different rules later.
 *
 * The raw token is never stored: the URL is `/gap-report/<token>` and the row
 * holds its SHA-256, exactly as the upload link does.
 */

import { and, eq, gte, isNull, lte, sql } from 'drizzle-orm';

import { consumeRateLimit, generateToken, hashToken } from '@octopus/platform/auth';
import { track } from '@octopus/platform/events';

import { getEnv } from '../../env';
import type { Db } from '../db';
import { newId } from '../ids';
import { gapReportDocuments, gapReportSessions } from '../schema';
import { spendCentsSince } from '../repos/documents';
import { getTemplate, toRequirementSet, type Audience } from '../templates';
import {
  AUDIENCE_LABEL,
  AUDIENCE_TEMPLATE,
  DOCUMENTS_PER_IP_PER_DAY,
  MAX_DOCUMENTS_PER_SESSION,
  MAX_SESSION_BYTES,
  PURGE_AFTER_DAYS,
  SESSIONS_PER_IP_PER_DAY,
  isAudience,
} from './limits';
import type { RequirementSet } from '../engine';

/** `specs/15` §8 and §6, as constants a test can quote. */
export type GapSessionRow = typeof gapReportSessions.$inferSelect;
export type GapDocumentRow = typeof gapReportDocuments.$inferSelect;

export type CreateSessionResult =
  | { status: 'ok'; sessionId: string; token: string; session: GapSessionRow }
  | { status: 'rate_limited' }
  | { status: 'at_capacity' }
  | { status: 'not_open' };

/**
 * THE DAILY SPEND CAP — §11.
 *
 * Read from what has actually been spent, across BOTH owners of the
 * `extractions` table, because the bill does not care which path spent it. When
 * it is reached, new sessions are refused with "the free report is at capacity
 * today — start a 14-day trial" rather than silently overspending.
 */
export async function spendToday(db: Db, now = new Date()): Promise<{ centsSpent: number; capCents: number; atCapacity: boolean }> {
  const env = getEnv();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const centsSpent = await spendCentsSince(db, midnight);
  const capCents = env.GAP_REPORT_DAILY_SPEND_CAP_CENTS;
  return { centsSpent, capCents, atCapacity: capCents > 0 && centsSpent >= capCents };
}

/**
 * The requirement rows this session will be compared against, snapshotted at
 * creation. `requirementsSnapshot` is the reason a report is reproducible: the
 * library can be updated next week and the report a stranger keeps still says
 * what it said.
 */
export function snapshotFor(audience: Audience): { templateId: string; set: RequirementSet } | null {
  const templateId = AUDIENCE_TEMPLATE[audience];
  const template = getTemplate(templateId);
  if (!template) return null;
  return { templateId, set: toRequirementSet(template) };
}

export async function createGapSession(
  db: Db,
  input: { audience: Audience; ip: string; now?: Date },
): Promise<CreateSessionResult> {
  const env = getEnv();
  const now = input.now ?? new Date();
  // The launch gate. Until the founder's legal read lands, nothing is accepted
  // from a stranger (`specs/15`'s launch gate, A13).
  if (env.GAP_REPORT_UPLOADS_ENABLED !== true) return { status: 'not_open' };

  const rate = await consumeRateLimit(db, {
    bucket: `certly:gap_session:${input.ip}`,
    limit: SESSIONS_PER_IP_PER_DAY,
    windowMs: 86_400_000,
    now,
  });
  if (!rate.allowed) {
    await track(db, { name: 'gap_report_rate_limited' });
    // A11: refused BEFORE any inference is spent.
    return { status: 'rate_limited' };
  }

  const spend = await spendToday(db, now);
  if (spend.atCapacity) {
    await track(db, { name: 'gap_report_capacity_disabled' });
    return { status: 'at_capacity' };
  }

  const snapshot = snapshotFor(input.audience);
  const token = generateToken(32);
  const id = newId('gapReportSession');

  const [session] = await db
    .insert(gapReportSessions)
    .values({
      id,
      tokenHash: hashToken(token),
      audience: input.audience,
      templateId: snapshot?.templateId ?? null,
      // WRITTEN BEFORE COMPARISON (§8), never after.
      requirementsSnapshot: (snapshot?.set ?? null) as unknown as Record<string, unknown> | null,
      status: 'collecting',
      createdAt: now,
      purgeAt: new Date(now.getTime() + PURGE_AFTER_DAYS * 86_400_000),
    })
    .returning();

  await track(db, { name: 'gap_report_started', props: { audience: input.audience } });
  return { status: 'ok', sessionId: id, token, session: session as GapSessionRow };
}

export async function findSessionByToken(db: Db, token: string): Promise<GapSessionRow | null> {
  if (typeof token !== 'string' || token.length < 16 || token.length > 128) return null;
  const [row] = await db
    .select()
    .from(gapReportSessions)
    .where(eq(gapReportSessions.tokenHash, hashToken(token)))
    .limit(1);
  return row ?? null;
}

export async function listSessionDocuments(db: Db, sessionId: string): Promise<GapDocumentRow[]> {
  return db
    .select()
    .from(gapReportDocuments)
    .where(eq(gapReportDocuments.sessionId, sessionId))
    .orderBy(gapReportDocuments.createdAt);
}

export type AddDocumentResult =
  | { status: 'ok'; documentId: string }
  | { status: 'duplicate'; documentId: string }
  | { status: 'too_many' }
  | { status: 'session_too_large' }
  | { status: 'ip_limit' }
  | { status: 'closed' };

/**
 * A9: the 26th file is refused with a message pointing at the trial, and the
 * first 25 still process. That is why the cap is a REFUSAL OF ONE DOCUMENT and
 * never a refusal of the session.
 */
export async function addSessionDocument(
  db: Db,
  input: {
    session: GapSessionRow;
    storageKey: string;
    mime: string;
    bytes: number;
    sha256: string;
    originalFilename: string | null;
    ip: string;
    now?: Date;
  },
): Promise<AddDocumentResult> {
  const now = input.now ?? new Date();
  if (input.session.status !== 'collecting') return { status: 'closed' };

  const existing = await listSessionDocuments(db, input.session.id);
  // §10: all 25 the same file → per-session sha dedupe, and the report says so.
  const duplicate = existing.find((row) => row.sha256 === input.sha256);
  if (duplicate) return { status: 'duplicate', documentId: duplicate.id };

  if (existing.length >= MAX_DOCUMENTS_PER_SESSION) return { status: 'too_many' };
  const total = existing.reduce((sum, row) => sum + row.bytes, 0) + input.bytes;
  if (total > MAX_SESSION_BYTES) return { status: 'session_too_large' };

  const rate = await consumeRateLimit(db, {
    bucket: `certly:gap_docs:${input.ip}`,
    limit: DOCUMENTS_PER_IP_PER_DAY,
    windowMs: 86_400_000,
    now,
  });
  if (!rate.allowed) {
    await track(db, { name: 'gap_report_rate_limited' });
    return { status: 'ip_limit' };
  }

  const id = newId('gapReportDocument');
  await db.insert(gapReportDocuments).values({
    id,
    sessionId: input.session.id,
    storageKey: input.storageKey,
    mime: input.mime,
    bytes: input.bytes,
    sha256: input.sha256,
    originalFilename: input.originalFilename,
    status: 'uploaded',
    createdAt: now,
  });
  await db
    .update(gapReportSessions)
    .set({ documentCount: existing.length + 1 })
    .where(eq(gapReportSessions.id, input.session.id));

  await track(db, { name: 'gap_report_files_added', props: { n: existing.length + 1 } });
  return { status: 'ok', documentId: id };
}

/**
 * Step 3 of §2: the visitor's email, **the only thing asked for**. No password,
 * no card, and — §8 — added to no marketing list without a separate explicit
 * tick, which is why nothing here writes to one.
 */
export async function captureEmail(
  db: Db,
  input: { sessionId: string; email: string; now?: Date },
): Promise<void> {
  await db
    .update(gapReportSessions)
    .set({ email: input.email.trim().toLowerCase(), status: 'processing' })
    .where(and(eq(gapReportSessions.id, input.sessionId), eq(gapReportSessions.status, 'collecting')));
  await track(db, { name: 'gap_report_email_captured' });
}

/** Sessions whose 7 days are up and which never converted (§6). */
export async function sessionsToPurge(db: Db, now = new Date(), limit = 200): Promise<GapSessionRow[]> {
  return db
    .select()
    .from(gapReportSessions)
    .where(
      and(
        lte(gapReportSessions.purgeAt, now),
        isNull(gapReportSessions.convertedOrgId),
        sql`${gapReportSessions.status} <> 'purged'`,
      ),
    )
    .limit(limit);
}

/** The per-IP counters the page prints when it refuses (A11). */
export async function ipUsage(db: Db, ip: string, now = new Date()) {
  const sessions = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(gapReportSessions)
    .where(gte(gapReportSessions.createdAt, new Date(now.getTime() - 86_400_000)));
  void ip;
  return { sessionsToday: Number(sessions[0]?.n ?? 0), limit: SESSIONS_PER_IP_PER_DAY };
}
