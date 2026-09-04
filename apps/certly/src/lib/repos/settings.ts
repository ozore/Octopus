/**
 * M13's repository — members and their roles, invitations, per-user
 * notification switches, and the scheduled deletion.
 *
 * Two rules the database enforces rather than the caller:
 *   - an invitation token is stored HASHED, single use and email-bound;
 *   - an org always has at least one owner, so removing the last one is refused
 *     (A4) — a check that lives here because the UI is not the only caller.
 */

import { createHash, randomBytes } from 'node:crypto';

import { and, count, eq, isNull } from 'drizzle-orm';

import { writeAuditEvent, type AuditActor } from '@/lib/audit';
import type { Db } from '@/lib/db';
import { newId } from '@/lib/ids';
import { deletionRequests, invitations, memberRoles, userPreferences } from '@/lib/schema';
import { isCertlyRole, roleFromPlatform, type CertlyRole } from '@/lib/settings/roles';
import { memberships, users } from '@octopus/platform/db';

export const INVITATION_TTL_DAYS = 7;
export const DELETION_DELAY_DAYS = 30;

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export type MemberView = {
  userId: string;
  email: string;
  role: CertlyRole;
  platformRole: string;
  joinedAt: Date;
};

export async function listMembers(db: Db, orgId: string): Promise<MemberView[]> {
  const rows = await db
    .select({
      userId: memberships.userId,
      platformRole: memberships.role,
      joinedAt: memberships.createdAt,
      email: users.email,
      role: memberRoles.role,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .leftJoin(
      memberRoles,
      and(eq(memberRoles.orgId, memberships.orgId), eq(memberRoles.userId, memberships.userId)),
    )
    .where(eq(memberships.orgId, orgId));

  return rows.map((row) => ({
    userId: row.userId,
    email: row.email,
    platformRole: row.platformRole,
    joinedAt: row.joinedAt,
    role: isCertlyRole(row.role) ? row.role : roleFromPlatform(row.platformRole),
  }));
}

/** The effective role for one user, with the platform role as the fallback. */
export async function roleFor(
  db: Db,
  input: { orgId: string; userId: string; platformRole: string },
): Promise<CertlyRole> {
  const [row] = await db
    .select()
    .from(memberRoles)
    .where(and(eq(memberRoles.orgId, input.orgId), eq(memberRoles.userId, input.userId)))
    .limit(1);
  return isCertlyRole(row?.role) ? (row!.role as CertlyRole) : roleFromPlatform(input.platformRole);
}

export async function setRole(
  db: Db,
  input: { orgId: string; userId: string; role: CertlyRole; actor: AuditActor; email?: string },
): Promise<{ status: 'ok' | 'last_owner' }> {
  const members = await listMembers(db, input.orgId);
  const owners = members.filter((member) => member.role === 'owner');
  // A4: an org always has at least one owner. Demoting the last one is refused
  // with an explanation, never silently ignored.
  if (input.role !== 'owner' && owners.length === 1 && owners[0]?.userId === input.userId) {
    return { status: 'last_owner' };
  }

  await db
    .insert(memberRoles)
    .values({ orgId: input.orgId, userId: input.userId, role: input.role })
    .onConflictDoUpdate({
      target: [memberRoles.orgId, memberRoles.userId],
      set: { role: input.role, updatedAt: new Date() },
    });

  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'member.role_changed',
    subjectType: 'user',
    subjectId: input.userId,
    payload: { role: input.role, email: input.email ?? 'a member' },
  });
  return { status: 'ok' };
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

export type InvitationResult =
  | { status: 'invited'; token: string; invitationId: string }
  | { status: 'seat_limit'; used: number; limit: number }
  | { status: 'already_member' };

export async function inviteMember(
  db: Db,
  input: {
    orgId: string;
    email: string;
    role: CertlyRole;
    invitedBy: string;
    actor: AuditActor;
    seatLimit: number;
  },
): Promise<InvitationResult> {
  const email = input.email.trim().toLowerCase();
  const members = await listMembers(db, input.orgId);
  if (members.some((member) => member.email.toLowerCase() === email)) {
    return { status: 'already_member' };
  }

  const [pending] = await db
    .select({ value: count() })
    .from(invitations)
    .where(and(eq(invitations.orgId, input.orgId), isNull(invitations.acceptedAt)));

  // A12: seats are SOLD on the pricing cards, so the limit is enforced here and
  // the plan is named in the refusal (MJ-03).
  const used = members.length + Number(pending?.value ?? 0);
  if (used >= input.seatLimit) {
    return { status: 'seat_limit', used, limit: input.seatLimit };
  }

  const token = randomBytes(32).toString('base64url');
  const id = newId('audit').replace('aud_', 'inv_');
  await db.insert(invitations).values({
    id,
    orgId: input.orgId,
    email,
    role: input.role,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 86_400_000),
    invitedBy: input.invitedBy,
  });

  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'member.invited',
    subjectType: 'org',
    subjectId: input.orgId,
    payload: { email, role: input.role },
  });

  return { status: 'invited', token, invitationId: id };
}

export async function listInvitations(db: Db, orgId: string) {
  return db
    .select()
    .from(invitations)
    .where(and(eq(invitations.orgId, orgId), isNull(invitations.acceptedAt)));
}

export type AcceptResult =
  | { status: 'accepted'; orgId: string; role: CertlyRole; email: string }
  | { status: 'invalid' }
  | { status: 'expired' }
  | { status: 'used' };

/** Single use, 7 days, email-bound (§7). The token itself is never stored. */
export async function acceptInvitation(db: Db, token: string): Promise<AcceptResult> {
  const [row] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.tokenHash, hashToken(token)))
    .limit(1);
  if (!row || row.revokedAt) return { status: 'invalid' };
  if (row.acceptedAt) return { status: 'used' };
  if (row.expiresAt.getTime() < Date.now()) return { status: 'expired' };

  await db
    .update(invitations)
    .set({ acceptedAt: new Date() })
    .where(eq(invitations.id, row.id));

  return {
    status: 'accepted',
    orgId: row.orgId,
    role: isCertlyRole(row.role) ? row.role : 'editor',
    email: row.email,
  };
}

// ---------------------------------------------------------------------------
// Notification preferences
// ---------------------------------------------------------------------------

export type Preferences = { weeklyDigest: boolean; reviewAlerts: boolean; bounceAlerts: boolean };

export async function getPreferences(
  db: Db,
  input: { orgId: string; userId: string },
): Promise<Preferences> {
  const [row] = await db
    .select()
    .from(userPreferences)
    .where(and(eq(userPreferences.orgId, input.orgId), eq(userPreferences.userId, input.userId)))
    .limit(1);
  return {
    weeklyDigest: row?.weeklyDigest ?? true,
    reviewAlerts: row?.reviewAlerts ?? true,
    bounceAlerts: row?.bounceAlerts ?? true,
  };
}

export async function setPreferences(
  db: Db,
  input: { orgId: string; userId: string; preferences: Preferences },
): Promise<void> {
  await db
    .insert(userPreferences)
    .values({
      id: newId('audit').replace('aud_', 'prf_'),
      orgId: input.orgId,
      userId: input.userId,
      ...input.preferences,
    })
    .onConflictDoUpdate({
      target: [userPreferences.userId, userPreferences.orgId],
      set: { ...input.preferences, updatedAt: new Date() },
    });
}

// ---------------------------------------------------------------------------
// Deletion — scheduled, cancellable, never immediate
// ---------------------------------------------------------------------------

export async function requestDeletion(
  db: Db,
  input: { orgId: string; userId: string; actor: AuditActor },
): Promise<{ scheduledFor: Date }> {
  const scheduledFor = new Date(Date.now() + DELETION_DELAY_DAYS * 86_400_000);
  await db.insert(deletionRequests).values({
    id: newId('audit').replace('aud_', 'del_'),
    orgId: input.orgId,
    requestedBy: input.userId,
    scheduledFor,
  });
  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'data.deleted',
    subjectType: 'org',
    subjectId: input.orgId,
    payload: { what: `a deletion scheduled for ${scheduledFor.toISOString().slice(0, 10)}` },
  });
  return { scheduledFor };
}

export async function pendingDeletion(db: Db, orgId: string) {
  const [row] = await db
    .select()
    .from(deletionRequests)
    .where(
      and(
        eq(deletionRequests.orgId, orgId),
        isNull(deletionRequests.cancelledAt),
        isNull(deletionRequests.completedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function cancelDeletion(
  db: Db,
  input: { orgId: string; actor: AuditActor },
): Promise<boolean> {
  const pending = await pendingDeletion(db, input.orgId);
  if (!pending) return false;
  await db
    .update(deletionRequests)
    .set({ cancelledAt: new Date() })
    .where(eq(deletionRequests.id, pending.id));
  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'org.settings_changed',
    subjectType: 'org',
    subjectId: input.orgId,
    payload: { field: 'the scheduled deletion, which was cancelled' },
  });
  return true;
}
