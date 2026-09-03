import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  addMember,
  consumeMagicLink,
  createSession,
  getSessionByToken,
  listMembers,
  removeMember,
  requestMagicLink,
  rotateSessionToken,
  safeRedirect,
  signOutByToken,
  switchOrganisation,
  updateOrganisation,
  orgNameFromEmail,
  normaliseEmail,
  purgeExpiredAuthRows,
} from '../src/auth';
import { loginTokens, memberships, organisations, sessions, users } from '../src/db/schema';
import { newId } from '../src/ids';
import { jobs } from '../src/db/schema';
import { createTestHarness, type TestHarness } from '../src/testing';

let h: TestHarness;
beforeEach(async () => {
  h = await createTestHarness();
});
afterEach(async () => {
  await h.close();
});

const authCtx = () => ({ db: h.db, adapters: h.adapters, env: h.env });

async function signIn(email = 'owner@contractor.test') {
  const requested = await requestMagicLink(authCtx(), { email, ip: '203.0.113.10' });
  expect(requested.status).toBe('sent');
  const url = h.adapters.email.lastUrl();
  const token = new URL(url as string).searchParams.get('token') as string;
  return consumeMagicLink(authCtx(), { token, ip: '203.0.113.10' });
}

describe('normalisation', () => {
  it('lowercases and trims email', () => {
    expect(normaliseEmail('  Owner@Contractor.TEST ')).toBe('owner@contractor.test');
  });

  it('refuses off-site redirect targets', () => {
    expect(safeRedirect('/settings')).toBe('/settings');
    expect(safeRedirect('//evil.example/x')).toBe('/dashboard');
    expect(safeRedirect('https://evil.example')).toBe('/dashboard');
    expect(safeRedirect(null)).toBe('/dashboard');
  });

  it('names an organisation from a company domain, not a free mailbox', () => {
    expect(orgNameFromEmail('jo@ridgeline-electric.com')).toBe('Ridgeline-electric');
    expect(orgNameFromEmail('jo@gmail.com')).toBe("jo's workspace");
  });
});

describe('magic link', () => {
  it('mails a single-use link and creates the org on first use', async () => {
    const result = await signIn();
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;

    expect(result.isNewUser).toBe(true);
    expect(result.context.membership.role).toBe('owner');
    expect(result.context.org.slug).toBe('contractor');

    const mail = h.adapters.email.last();
    expect(mail?.subject).toContain('sign-in link');
    expect(mail?.text).toContain('a TheVillage company');

    // The welcome email is queued, not sent inline.
    const queued = await h.db.select().from(jobs);
    expect(queued.map((j) => j.kind)).toContain('platform.welcome_email');
  });

  it('refuses a token that was already used', async () => {
    const requested = await requestMagicLink(authCtx(), { email: 'twice@contractor.test' });
    expect(requested.status).toBe('sent');
    const token = new URL(h.adapters.email.lastUrl() as string).searchParams.get(
      'token',
    ) as string;

    expect((await consumeMagicLink(authCtx(), { token })).status).toBe('ok');
    expect((await consumeMagicLink(authCtx(), { token })).status).toBe('used');
  });

  it('refuses an expired token and an unknown token', async () => {
    await requestMagicLink(authCtx(), { email: 'stale@contractor.test' });
    const token = new URL(h.adapters.email.lastUrl() as string).searchParams.get(
      'token',
    ) as string;
    await h.db
      .update(loginTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(loginTokens.email, 'stale@contractor.test'));

    expect((await consumeMagicLink(authCtx(), { token })).status).toBe('expired');
    expect((await consumeMagicLink(authCtx(), { token: 'nonsense' })).status).toBe('invalid');
  });

  it('rejects an invalid address without mailing anything', async () => {
    const result = await requestMagicLink(authCtx(), { email: 'not-an-email' });
    expect(result.status).toBe('invalid_email');
    expect(h.adapters.email.sent).toHaveLength(0);
  });

  it('rate limits per email and per ip', async () => {
    const limit = h.env.LOGIN_RATE_LIMIT_PER_EMAIL_PER_HOUR;
    for (let i = 0; i < limit; i += 1) {
      expect((await requestMagicLink(authCtx(), { email: 'flood@contractor.test' })).status).toBe(
        'sent',
      );
    }
    const blocked = await requestMagicLink(authCtx(), { email: 'flood@contractor.test' });
    expect(blocked.status).toBe('rate_limited');

    // A different address from the same IP eventually hits the IP bucket.
    let ipBlocked = false;
    for (let i = 0; i < h.env.LOGIN_RATE_LIMIT_PER_IP_PER_HOUR + 2; i += 1) {
      const r = await requestMagicLink(authCtx(), {
        email: `person${i}@contractor.test`,
        ip: '198.51.100.7',
      });
      if (r.status === 'rate_limited') ipBlocked = true;
    }
    expect(ipBlocked).toBe(true);
  });

  it('hashes tokens at rest', async () => {
    await requestMagicLink(authCtx(), { email: 'hash@contractor.test' });
    const url = h.adapters.email.lastUrl() as string;
    const token = new URL(url).searchParams.get('token') as string;
    const [row] = await h.db.select().from(loginTokens);
    expect(row?.tokenHash).not.toBe(token);
    expect(row?.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('exposes the link only in mock mode, for dev and e2e', async () => {
    const result = await requestMagicLink(authCtx(), { email: 'dev@contractor.test' });
    expect(result.status === 'sent' && result.devUrl).toContain('/login/callback?token=');
  });
});

describe('sessions', () => {
  it('loads a session with its user, org and membership', async () => {
    const signedIn = await signIn();
    if (signedIn.status !== 'ok') throw new Error('sign-in failed');

    const loaded = await getSessionByToken(h.db, signedIn.sessionToken, h.env);
    expect(loaded?.user.email).toBe('owner@contractor.test');
    expect(loaded?.org.id).toBe(signedIn.context.org.id);
    expect(loaded?.needsRotation).toBe(false);
  });

  it('rejects a revoked, expired or unknown token', async () => {
    const signedIn = await signIn();
    if (signedIn.status !== 'ok') throw new Error('sign-in failed');

    expect(await getSessionByToken(h.db, 'nope', h.env)).toBeNull();

    await signOutByToken(h.db, signedIn.sessionToken);
    expect(await getSessionByToken(h.db, signedIn.sessionToken, h.env)).toBeNull();

    const { token } = await createSession(h.db, {
      userId: signedIn.context.user.id,
      orgId: signedIn.context.org.id,
      ttlDays: 30,
    });
    await h.db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() - 1000), revokedAt: null })
      .where(eq(sessions.userId, signedIn.context.user.id));
    expect(await getSessionByToken(h.db, token, h.env)).toBeNull();
  });

  it('flags rotation and issues a new token that replaces the old one', async () => {
    const signedIn = await signIn();
    if (signedIn.status !== 'ok') throw new Error('sign-in failed');

    await h.db
      .update(sessions)
      .set({ rotatedAt: new Date(Date.now() - 48 * 3600 * 1000) })
      .where(eq(sessions.id, signedIn.context.session.id));

    const stale = await getSessionByToken(h.db, signedIn.sessionToken, h.env);
    expect(stale?.needsRotation).toBe(true);

    const fresh = await rotateSessionToken(h.db, signedIn.context.session.id, h.env);
    expect(await getSessionByToken(h.db, fresh, h.env)).not.toBeNull();
    expect(await getSessionByToken(h.db, signedIn.sessionToken, h.env)).toBeNull();
  });

  it('purges expired sessions and tokens', async () => {
    const signedIn = await signIn();
    if (signedIn.status !== 'ok') throw new Error('sign-in failed');
    await h.db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) });
    await purgeExpiredAuthRows(h.db, new Date());
    expect(await h.db.select().from(sessions)).toHaveLength(0);
  });
});

describe('organisations and members', () => {
  it('adds a member, mails them a link, and refuses removing the last owner', async () => {
    const signedIn = await signIn();
    if (signedIn.status !== 'ok') throw new Error('sign-in failed');
    const orgId = signedIn.context.org.id;

    const added = await addMember(authCtx(), {
      orgId,
      email: 'Second@contractor.test',
      invitedBy: signedIn.context.user.id,
    });
    expect(added.status).toBe('added');
    expect(h.adapters.email.last()?.to).toBe('second@contractor.test');

    const again = await addMember(authCtx(), { orgId, email: 'second@contractor.test' });
    expect(again.status).toBe('already_member');

    const members = await listMembers(h.db, orgId);
    expect(members.map((m) => m.user.email).sort()).toEqual([
      'owner@contractor.test',
      'second@contractor.test',
    ]);

    expect(
      (await removeMember(h.db, { orgId, userId: signedIn.context.user.id })).status,
    ).toBe('last_owner');

    const second = members.find((m) => m.user.email === 'second@contractor.test');
    expect((await removeMember(h.db, { orgId, userId: second?.user.id as string })).status).toBe(
      'removed',
    );
  });

  it('renames an organisation', async () => {
    const signedIn = await signIn();
    if (signedIn.status !== 'ok') throw new Error('sign-in failed');
    const updated = await updateOrganisation(h.db, {
      orgId: signedIn.context.org.id,
      name: 'Ridgeline Electric',
    });
    expect(updated?.name).toBe('Ridgeline Electric');
  });

  it('switches organisation only where a membership exists', async () => {
    const signedIn = await signIn();
    if (signedIn.status !== 'ok') throw new Error('sign-in failed');

    const [other] = await h.db
      .insert(organisations)
      .values({ id: newId('org'), name: 'Other', slug: 'other' })
      .returning();

    const forbidden = await switchOrganisation(authCtx(), {
      currentToken: signedIn.sessionToken,
      userId: signedIn.context.user.id,
      orgId: other?.id as string,
    });
    expect(forbidden.status).toBe('forbidden');

    await h.db.insert(memberships).values({
      id: newId('mem'),
      orgId: other?.id as string,
      userId: signedIn.context.user.id,
      role: 'member',
    });

    const switched = await switchOrganisation(authCtx(), {
      currentToken: signedIn.sessionToken,
      userId: signedIn.context.user.id,
      orgId: other?.id as string,
    });
    expect(switched.status).toBe('ok');
    if (switched.status !== 'ok') return;
    const loaded = await getSessionByToken(h.db, switched.sessionToken, h.env);
    expect(loaded?.org.id).toBe(other?.id);
    // The old session is gone, so a stolen cookie cannot follow the switch.
    expect(await getSessionByToken(h.db, signedIn.sessionToken, h.env)).toBeNull();
  });

  it('reuses the existing organisation on a second login', async () => {
    const first = await signIn();
    const second = await signIn();
    if (first.status !== 'ok' || second.status !== 'ok') throw new Error('sign-in failed');
    expect(second.isNewUser).toBe(false);
    expect(second.context.org.id).toBe(first.context.org.id);
    expect(await h.db.select().from(users)).toHaveLength(1);
  });
});
