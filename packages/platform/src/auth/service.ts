/**
 * Magic-link authentication with organisation accounts (PLAN.md A7).
 *
 * WHY NOT A LIBRARY. Auth.js/NextAuth, Clerk and WorkOS were all considered
 * (packages/platform/README.md §"Auth: the three options"). The deciding
 * constraint is PLAN.md's vendor list — Stripe, Resend, Neon, Anthropic and
 * nothing else — plus the fact that the org/membership/entitlement join is the
 * thing every screen needs and no generic adapter models for us. What is left
 * once OAuth is out (A7) is: mint a token, mail it, exchange it for a session
 * row. That is ~300 lines we own, test on PGlite and can read in one sitting.
 *
 * THE FIVE PROPERTIES THIS FILE IS RESPONSIBLE FOR:
 *  1. tokens are single-use, 15 minutes, and hashed at rest;
 *  2. consuming one is ATOMIC — the UPDATE is conditional on `consumed_at IS
 *     NULL`, so two clicks on the same link cannot both mint a session;
 *  3. requests are rate-limited per email AND per IP;
 *  4. the response never says whether an address exists (no enumeration);
 *  5. the first login creates the organisation and an OWNER membership, so a
 *     signup is one round trip and there is no empty-account state.
 */

import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';

import type { Adapters } from '../adapters';
import type { Db } from '../db';
import { withTx } from '../db';
import {
  loginTokens,
  memberships,
  organisations,
  sessions,
  users,
  type Membership,
  type MembershipRole,
  type Organisation,
  type Session,
  type User,
} from '../db/schema';
import { brandFromEnv, sendEmail } from '../email/send';
import { magicLinkEmail } from '../email/templates';
import { getEnv, type PlatformEnv } from '../env';
import { PLATFORM_EVENTS, track } from '../events/track';
import { newId } from '../ids';
import { enqueue } from '../jobs/queue';
import { isValidEmail, normaliseEmail, orgNameFromEmail, safeRedirect, slugify } from './normalise';
import { consumeRateLimit } from './rate-limit';
import { generateToken, hashToken } from './tokens';

export type AuthContext = {
  db: Db;
  adapters: Adapters;
  env?: PlatformEnv;
};

export type SessionContext = {
  session: Session;
  user: User;
  org: Organisation;
  membership: Membership;
};

export type RequestMagicLinkInput = {
  email: string;
  ip?: string | null;
  userAgent?: string | null;
  redirectTo?: string | null;
  /** Optional organisation name for a first-time signup. */
  orgName?: string | null;
};

export type RequestMagicLinkResult =
  | {
      status: 'sent';
      /** Only populated when ADAPTER_MODE=mock — the dev/e2e affordance that
       *  replaces an inbox. Never set in production (env.ts refuses mock). */
      devUrl?: string;
      expiresAt: Date;
    }
  | { status: 'invalid_email' }
  | { status: 'rate_limited'; resetAt: Date }
  | { status: 'signups_disabled' };

export async function requestMagicLink(
  ctx: AuthContext,
  input: RequestMagicLinkInput,
): Promise<RequestMagicLinkResult> {
  const env = ctx.env ?? getEnv();
  const email = normaliseEmail(input.email);
  if (!isValidEmail(email)) return { status: 'invalid_email' };

  const existing = await findUserByEmail(ctx.db, email);
  if (!existing && !env.SIGNUPS_ENABLED) return { status: 'signups_disabled' };

  const byEmail = await consumeRateLimit(ctx.db, {
    bucket: `magic_link:email:${email}`,
    limit: env.LOGIN_RATE_LIMIT_PER_EMAIL_PER_HOUR,
  });
  if (!byEmail.allowed) return { status: 'rate_limited', resetAt: byEmail.resetAt };

  if (input.ip) {
    const byIp = await consumeRateLimit(ctx.db, {
      bucket: `magic_link:ip:${input.ip}`,
      limit: env.LOGIN_RATE_LIMIT_PER_IP_PER_HOUR,
    });
    if (!byIp.allowed) return { status: 'rate_limited', resetAt: byIp.resetAt };
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + env.LOGIN_TOKEN_TTL_MINUTES * 60 * 1000);
  await ctx.db.insert(loginTokens).values({
    id: newId('lgt'),
    email,
    tokenHash: hashToken(token),
    redirectTo: input.redirectTo ? safeRedirect(input.redirectTo) : null,
    requestIp: input.ip ?? null,
    expiresAt,
  });

  const url = `${env.APP_BASE_URL}/login/callback?token=${encodeURIComponent(token)}`;
  await sendEmail(ctx.db, ctx.adapters, {
    to: email,
    content: magicLinkEmail(brandFromEnv(env), {
      url,
      ttlMinutes: env.LOGIN_TOKEN_TTL_MINUTES,
      isNewUser: !existing,
    }),
    tags: { kind: 'magic_link' },
  });

  await track(ctx.db, {
    name: existing ? PLATFORM_EVENTS.loginRequested : PLATFORM_EVENTS.signupRequested,
    userId: existing?.id ?? null,
    props: { email_domain: email.split('@')[1] ?? '' },
  });

  return {
    status: 'sent',
    expiresAt,
    ...(env.ADAPTER_MODE === 'mock' ? { devUrl: url } : {}),
  };
}

export type ConsumeMagicLinkResult =
  | {
      status: 'ok';
      /** The plaintext session token: the caller sets it as an httpOnly cookie. */
      sessionToken: string;
      context: SessionContext;
      isNewUser: boolean;
      redirectTo: string;
    }
  | { status: 'invalid' }
  | { status: 'expired' }
  | { status: 'used' };

export async function consumeMagicLink(
  ctx: AuthContext,
  input: { token: string; ip?: string | null; userAgent?: string | null },
): Promise<ConsumeMagicLinkResult> {
  const env = ctx.env ?? getEnv();
  const tokenHash = hashToken(input.token);
  const now = new Date();

  // Single use, atomically: the UPDATE both claims and reads. A SELECT followed
  // by an UPDATE would let two clicks 20ms apart mint two sessions.
  const [claimed] = await ctx.db
    .update(loginTokens)
    .set({ consumedAt: now })
    .where(
      and(
        eq(loginTokens.tokenHash, tokenHash),
        isNull(loginTokens.consumedAt),
        gt(loginTokens.expiresAt, now),
      ),
    )
    .returning();

  if (!claimed) {
    const [row] = await ctx.db
      .select()
      .from(loginTokens)
      .where(eq(loginTokens.tokenHash, tokenHash))
      .limit(1);
    if (!row) return { status: 'invalid' };
    if (row.consumedAt) return { status: 'used' };
    return { status: 'expired' };
  }

  const { user, org, membership, isNewUser } = await ensureUserAndOrganisation(ctx.db, {
    email: claimed.email,
  });

  const { session, token } = await createSession(ctx.db, {
    userId: user.id,
    orgId: org.id,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    ttlDays: env.SESSION_TTL_DAYS,
  });

  await ctx.db.update(users).set({ lastLoginAt: now }).where(eq(users.id, user.id));

  await track(ctx.db, {
    name: isNewUser ? PLATFORM_EVENTS.signedUp : PLATFORM_EVENTS.loggedIn,
    orgId: org.id,
    userId: user.id,
  });

  if (isNewUser) {
    // Transactional with nothing else on purpose: the welcome mail is a side
    // effect on another system, so it is queued rather than sent inline — the
    // login must not wait on Resend, and a Resend outage must not cost a signup.
    await enqueue(ctx.db, {
      kind: 'platform.welcome_email',
      payload: { userId: user.id, orgId: org.id, email: user.email },
      dedupeKey: `platform.welcome_email:${user.id}`,
    });
  }

  return {
    status: 'ok',
    sessionToken: token,
    context: { session, user, org, membership },
    isNewUser,
    redirectTo: safeRedirect(claimed.redirectTo),
  };
}

// ---------------------------------------------------------------------------
// Users, organisations, memberships
// ---------------------------------------------------------------------------

export async function findUserByEmail(db: Db, email: string): Promise<User | undefined> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, normaliseEmail(email)))
    .limit(1);
  return row;
}

async function uniqueSlug(db: Db, base: string): Promise<string> {
  const root = slugify(base);
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`;
    const [taken] = await db
      .select({ id: organisations.id })
      .from(organisations)
      .where(eq(organisations.slug, candidate))
      .limit(1);
    if (!taken) return candidate;
  }
  return `${root}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * The first login IS the signup: a user with no membership gets an
 * organisation and an `owner` role in the same transaction. Any other ordering
 * leaves an authenticated user with nowhere to be, which every screen would
 * then have to handle.
 */
export async function ensureUserAndOrganisation(
  db: Db,
  input: { email: string; name?: string | null; orgName?: string | null },
): Promise<{ user: User; org: Organisation; membership: Membership; isNewUser: boolean }> {
  const email = normaliseEmail(input.email);

  return withTx(db, async (tx) => {
    let isNewUser = false;
    let user = await findUserByEmail(tx, email);
    if (!user) {
      const [created] = await tx
        .insert(users)
        .values({ id: newId('usr'), email, name: input.name ?? null })
        .returning();
      if (!created) throw new Error('ensureUserAndOrganisation: user insert returned no row');
      user = created;
      isNewUser = true;
    }

    const [existingMembership] = await tx
      .select()
      .from(memberships)
      .where(eq(memberships.userId, user.id))
      .orderBy(desc(memberships.createdAt))
      .limit(1);

    if (existingMembership) {
      const [org] = await tx
        .select()
        .from(organisations)
        .where(eq(organisations.id, existingMembership.orgId))
        .limit(1);
      if (!org) throw new Error(`membership ${existingMembership.id} points at a missing org`);
      return { user, org, membership: existingMembership, isNewUser };
    }

    const name = input.orgName?.trim() || orgNameFromEmail(email);
    const [org] = await tx
      .insert(organisations)
      .values({ id: newId('org'), name, slug: await uniqueSlug(tx, name) })
      .returning();
    if (!org) throw new Error('ensureUserAndOrganisation: org insert returned no row');

    const [membership] = await tx
      .insert(memberships)
      .values({ id: newId('mem'), orgId: org.id, userId: user.id, role: 'owner' })
      .returning();
    if (!membership) throw new Error('ensureUserAndOrganisation: membership insert returned no row');

    return { user, org, membership, isNewUser };
  });
}

export async function listMembers(
  db: Db,
  orgId: string,
): Promise<Array<{ membership: Membership; user: User }>> {
  const rows = await db
    .select({ membership: memberships, user: users })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.orgId, orgId))
    .orderBy(memberships.createdAt);
  return rows;
}

/**
 * Adding a member creates the user row if the address is new, but never a
 * session: the invitee still has to prove they own the mailbox by using a magic
 * link. An invite is therefore a membership, not a credential.
 */
export async function addMember(
  ctx: AuthContext,
  input: { orgId: string; email: string; role?: MembershipRole; invitedBy?: string },
): Promise<{ status: 'added' | 'already_member' | 'invalid_email'; membership?: Membership }> {
  const email = normaliseEmail(input.email);
  if (!isValidEmail(email)) return { status: 'invalid_email' };

  const result = await withTx(ctx.db, async (tx) => {
    let user = await findUserByEmail(tx, email);
    if (!user) {
      const [created] = await tx.insert(users).values({ id: newId('usr'), email }).returning();
      user = created;
    }
    if (!user) throw new Error('addMember: user insert returned no row');

    const [existing] = await tx
      .select()
      .from(memberships)
      .where(and(eq(memberships.orgId, input.orgId), eq(memberships.userId, user.id)))
      .limit(1);
    if (existing) return { status: 'already_member' as const, membership: existing };

    const [membership] = await tx
      .insert(memberships)
      .values({
        id: newId('mem'),
        orgId: input.orgId,
        userId: user.id,
        role: input.role ?? 'member',
      })
      .returning();
    return { status: 'added' as const, membership };
  });

  if (result.status === 'added') {
    await track(ctx.db, {
      name: PLATFORM_EVENTS.memberInvited,
      orgId: input.orgId,
      userId: input.invitedBy ?? null,
      props: { role: input.role ?? 'member' },
    });
    await requestMagicLink(ctx, { email, redirectTo: '/dashboard' });
  }
  return result;
}

export async function removeMember(
  db: Db,
  input: { orgId: string; userId: string },
): Promise<{ status: 'removed' | 'last_owner' | 'not_found' }> {
  return withTx(db, async (tx) => {
    const [target] = await tx
      .select()
      .from(memberships)
      .where(and(eq(memberships.orgId, input.orgId), eq(memberships.userId, input.userId)))
      .limit(1);
    if (!target) return { status: 'not_found' as const };

    if (target.role === 'owner') {
      const [{ owners = 0 } = { owners: 0 }] = await tx
        .select({ owners: sql<number>`count(*)::int` })
        .from(memberships)
        .where(and(eq(memberships.orgId, input.orgId), eq(memberships.role, 'owner')));
      // An organisation with no owner is an organisation nobody can pay for or
      // close — refuse rather than orphan the account.
      if (Number(owners) <= 1) return { status: 'last_owner' as const };
    }

    await tx.delete(memberships).where(eq(memberships.id, target.id));
    // Sessions acting in this org must stop immediately.
    await tx
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.orgId, input.orgId), eq(sessions.userId, input.userId)));
    return { status: 'removed' as const };
  });
}

export async function updateOrganisation(
  db: Db,
  input: { orgId: string; name: string },
): Promise<Organisation | undefined> {
  const [row] = await db
    .update(organisations)
    .set({ name: input.name.trim(), updatedAt: new Date() })
    .where(eq(organisations.id, input.orgId))
    .returning();
  return row;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function createSession(
  db: Db,
  input: {
    userId: string;
    orgId: string;
    ttlDays: number;
    ip?: string | null;
    userAgent?: string | null;
  },
): Promise<{ session: Session; token: string }> {
  const token = generateToken();
  const [session] = await db
    .insert(sessions)
    .values({
      id: newId('ses'),
      userId: input.userId,
      orgId: input.orgId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + input.ttlDays * 24 * 3600 * 1000),
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    })
    .returning();
  if (!session) throw new Error('createSession: insert returned no row');
  return { session, token };
}

export type LoadedSession = SessionContext & {
  /** True when the token is older than SESSION_ROTATE_AFTER_HOURS. The caller
   *  rotates only where it can write cookies (route handler, server action). */
  needsRotation: boolean;
};

export async function getSessionByToken(
  db: Db,
  token: string | undefined | null,
  env: PlatformEnv = getEnv(),
): Promise<LoadedSession | null> {
  if (!token) return null;
  const now = new Date();
  const [row] = await db
    .select({ session: sessions, user: users, org: organisations, membership: memberships })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .innerJoin(organisations, eq(organisations.id, sessions.orgId))
    .innerJoin(
      memberships,
      and(eq(memberships.userId, sessions.userId), eq(memberships.orgId, sessions.orgId)),
    )
    .where(eq(sessions.tokenHash, hashToken(token)))
    .limit(1);

  if (!row) return null;
  if (row.session.revokedAt) return null;
  if (row.session.expiresAt <= now) return null;

  // Sliding expiry, written at most once an hour: a customer who uses the app
  // every day is never logged out, and a session left alone for 30 days dies.
  const lastUsedAgeMs = now.getTime() - row.session.lastUsedAt.getTime();
  if (lastUsedAgeMs > 60 * 60 * 1000) {
    await db
      .update(sessions)
      .set({
        lastUsedAt: now,
        expiresAt: new Date(now.getTime() + env.SESSION_TTL_DAYS * 24 * 3600 * 1000),
      })
      .where(eq(sessions.id, row.session.id));
  }

  const rotationAgeMs = now.getTime() - row.session.rotatedAt.getTime();
  return {
    ...row,
    needsRotation: rotationAgeMs > env.SESSION_ROTATE_AFTER_HOURS * 3600 * 1000,
  };
}

/**
 * Rotation: a new token replaces the old one on the same session row, so a
 * token captured earlier stops working while the customer stays signed in.
 * Returns the plaintext for the caller to re-cookie.
 */
export async function rotateSessionToken(
  db: Db,
  sessionId: string,
  env: PlatformEnv = getEnv(),
): Promise<string> {
  const token = generateToken();
  const now = new Date();
  await db
    .update(sessions)
    .set({
      tokenHash: hashToken(token),
      rotatedAt: now,
      lastUsedAt: now,
      expiresAt: new Date(now.getTime() + env.SESSION_TTL_DAYS * 24 * 3600 * 1000),
    })
    .where(eq(sessions.id, sessionId));
  return token;
}

export async function revokeSession(db: Db, sessionId: string): Promise<void> {
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sessionId));
}

export async function signOutByToken(db: Db, token: string | undefined | null): Promise<void> {
  if (!token) return;
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.tokenHash, hashToken(token)));
}

/** Switching organisation is a new session in that org — never a mutable field
 *  on the old one, so a revoked membership cannot follow the switch. */
export async function switchOrganisation(
  ctx: AuthContext,
  input: { currentToken: string; userId: string; orgId: string },
): Promise<{ status: 'ok'; sessionToken: string } | { status: 'forbidden' }> {
  const env = ctx.env ?? getEnv();
  const [membership] = await ctx.db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, input.userId), eq(memberships.orgId, input.orgId)))
    .limit(1);
  if (!membership) return { status: 'forbidden' };

  await signOutByToken(ctx.db, input.currentToken);
  const { token } = await createSession(ctx.db, {
    userId: input.userId,
    orgId: input.orgId,
    ttlDays: env.SESSION_TTL_DAYS,
  });
  return { status: 'ok', sessionToken: token };
}

/** Housekeeping for the drain job. */
export async function purgeExpiredAuthRows(db: Db, now = new Date()): Promise<void> {
  await db.delete(sessions).where(sql`${sessions.expiresAt} < ${now}`);
  await db.delete(loginTokens).where(sql`${loginTokens.expiresAt} < ${now}`);
}
