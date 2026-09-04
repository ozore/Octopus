/**
 * The audit trail. Append-only, never read by a hot path, always available in
 * the customer's own export (`specs/10`).
 *
 * It exists because "we can show you what we knew, when" is the product, and
 * because a compliance buyer's first question about any system is whether it
 * can tell them who changed a date.
 *
 * `recordAudit` NEVER THROWS INTO THE PATH IT MEASURES — the same rule the
 * platform's `track()` follows. An audit write that fails must not lose a
 * customer's licence edit; it is logged and swallowed.
 */

import { newId } from '@octopus/platform';
import { and, desc, eq } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';

import { auditLog } from '../schema';

export type AuditInput = {
  orgId: string;
  actorUserId?: string | null;
  action: string;
  entityTable: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
};

export async function recordAudit(db: Db, input: AuditInput): Promise<void> {
  try {
    await db.insert(auditLog).values({
      id: newId('aud'),
      orgId: input.orgId,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityTable: input.entityTable,
      entityId: input.entityId ?? null,
      before: (input.before ?? null) as never,
      after: (input.after ?? null) as never,
    });
  } catch (error) {
    console.error('[stateready] audit write failed', input.action, error);
  }
}

export async function listAudit(db: Db, orgId: string, limit = 100) {
  return db
    .select()
    .from(auditLog)
    .where(eq(auditLog.orgId, orgId))
    .orderBy(desc(auditLog.at))
    .limit(limit);
}

export async function auditForEntity(db: Db, orgId: string, entityId: string) {
  return db
    .select()
    .from(auditLog)
    .where(and(eq(auditLog.orgId, orgId), eq(auditLog.entityId, entityId)))
    .orderBy(desc(auditLog.at));
}
