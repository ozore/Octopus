/**
 * ADR-011 as an executable fact: the tenant boundary on the role that carries it.
 *
 * WHAT THIS FILE IS FOR. `ARCHITECTURE.md` §11.2 puts TWO independent mechanisms
 * under the boundary — tenant-scoped repositories and row-level security — and the
 * second one was, until this suite existed, unreachable. `resolveSession` joined
 * `users`, whose policy needs the account the session lookup exists to discover, so
 * on `ratepin_app` every request resolved `unknown`, no authenticated screen was
 * reachable, and not one of the tenant policies could be evaluated from the web
 * tier at all. The product functioned only as a superuser, where RLS is inert. A
 * boundary nobody can reach is not a boundary that was untested; it is a boundary
 * that was not there.
 *
 * Every assertion below therefore runs inside `asApp()` — session role
 * `ratepin_app`, NOLOGIN, NOBYPASSRLS, exactly the posture production runs in — and
 * drives the REAL functions (`requestMagicLink`, `redeemMagicLink`,
 * `resolveSession`, `withTenant`) rather than hand-written SQL that resembles them.
 *
 * Seeding happens as the owner, because a migration and an ingest job legitimately
 * are the owner. Nothing a browser can reach does.
 */

import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { rowsOf } from '../../src/db';
import { accountId, withTenant, withoutTenant } from '../../src/db/tenant';
import { redeemMagicLink, requestMagicLink } from '../../src/platform/auth/magic-link';
import {
  createSession,
  resolveSession,
  revokeSession,
  sessionStillAuthorized,
  purgeDeadSessions,
} from '../../src/platform/auth/session';
import { fixedClock } from '../../src/platform/clock';
import { createPlatformDb, seedFiling, seedTenant } from './helpers';
import { FIXTURE } from '../helpers/pglite';
import type { TestDb } from '../helpers/pglite';

let tdb: TestDb;

const BASE = 'https://app.ratepin.test';
const NOW = new Date('2026-08-13T12:00:00.000Z');
const clock = fixedClock(NOW);

beforeAll(async () => {
  tdb = await createPlatformDb();
  await seedTenant(tdb, {
    account: FIXTURE.accountA,
    user: FIXTURE.userA,
    project: FIXTURE.projectA,
    band: 'over_100k',
    name: 'Rio Vista Concrete',
  });
  await seedTenant(tdb, {
    account: FIXTURE.accountB,
    user: FIXTURE.userB,
    project: FIXTURE.projectB,
    band: 'unknown',
    name: 'Coastline Insulation',
  });

  // The rows a leak would actually be about: a worker's surname and SSN last four,
  // and a filing with an artifact hanging off it. An isolation assertion over empty
  // tables proves nothing, so the enumeration below checks these are non-empty.
  await tdb.client.query(
    `INSERT INTO workers (id, account_id, last_name, first_name, ssn_last4)
     VALUES ($1, $2, 'Alvarado', 'Ines', '4471')`,
    [FILING.worker, FIXTURE.accountA],
  );
  await seedFiling(tdb, {
    id: FILING.id,
    account: FIXTURE.accountA,
    project: FIXTURE.projectA,
    weekEnding: '2026-08-14',
    status: 'CERTIFIABLE',
  });
  await tdb.client.query(
    `INSERT INTO artifacts (id, account_id, filing_id, kind, sha256, r2_key, byte_size,
                            pii_class, provenance)
     VALUES ($1, $2, $3, 'wh347_pdf', decode(repeat('ab', 32), 'hex'), 'k/1', 10,
             'ssn_bearing', '{}'::jsonb)`,
    [FILING.artifact, FIXTURE.accountA, FILING.id],
  );
}, 120_000);

/** Account A's customer data, so the isolation loop has something to isolate. */
const FILING = {
  id: '88888888-8888-4888-8888-888888888888',
  worker: '99999999-9999-4999-8999-999999999999',
  artifact: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
} as const;

afterAll(async () => {
  await tdb.close();
});

/** Mint a link and redeem it, on the application role, the way the product does. */
async function signIn(email: string): Promise<{ token: string; account: string }> {
  return tdb.asApp(async () => {
    const issued = await requestMagicLink(tdb.db, { email }, { baseUrl: BASE, clock });
    const outcome = await redeemMagicLink(tdb.db, issued.token, { clock });
    if (!outcome.ok) throw new Error(`sign-in failed: ${outcome.reason}`);
    return { token: outcome.issued.token, account: outcome.issued.session.accountId };
  });
}

describe('sign-in on the role every policy is written TO', () => {
  it('provisions a brand-new identity and resolves the session it minted', async () => {
    const email = `first.timer@journey.ratepin.test`;
    const { token } = await signIn(email);

    const lookup = await tdb.asApp(() => resolveSession(tdb.db, token, clock));
    expect(lookup.ok, `resolveSession said ${lookup.ok ? '' : lookup.reason}`).toBe(true);
    if (!lookup.ok) return;
    expect(lookup.session.email).toBe(email);

    // The whole point: the tenant the session names is now usable, which is what
    // makes the 27 tenant policies reachable at all.
    const projects = await tdb.asApp(() =>
      withTenant(tdb.db, { accountId: lookup.session.accountId }, async (tx) =>
        rowsOf<{ name: string }>(await tx.execute(sql`SELECT name FROM projects`)),
      ),
    );
    expect(projects).toHaveLength(0);
  });

  it('returns a returning customer to the same account rather than making a second one', async () => {
    const email = 'returning@journey.ratepin.test';
    const first = await signIn(email);
    const second = await signIn(email);
    expect(second.account).toBe(first.account);

    const accounts = await tdb.client.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM accounts a
        JOIN memberships m ON m.account_id = a.id
        JOIN users u ON u.id = m.user_id WHERE u.email = $1`,
      [email],
    );
    expect(accounts.rows[0]?.n).toBe('1');
  });

  it('resolves a session without reading one tenant-scoped table', async () => {
    // The structural version of the headline defect. `resolveSession` may touch
    // nothing that carries a policy keyed on ratepin_current_account(), or the
    // lookup that establishes the tenant depends on the tenant. Proved by running
    // it with the context explicitly cleared and the application role in force.
    const { token } = await signIn('unscoped.resolve@journey.ratepin.test');
    const lookup = await tdb.asApp(() =>
      withoutTenant(tdb.db, (tx) => resolveSession(tx, token, clock)),
    );
    expect(lookup.ok).toBe(true);
  });

  it('reports revoked, expired and unknown distinctly on the application role', async () => {
    const { token } = await signIn('lifecycle@journey.ratepin.test');
    const live = await tdb.asApp(() => resolveSession(tdb.db, token, clock));
    expect(live.ok).toBe(true);
    if (!live.ok) return;

    const later = fixedClock(new Date(NOW.getTime() + 15 * 86_400_000));
    const expired = await tdb.asApp(() => resolveSession(tdb.db, token, later));
    expect(expired.ok ? 'ok' : expired.reason).toBe('expired');

    await tdb.asApp(() => revokeSession(tdb.db, live.session.id, clock));
    const revoked = await tdb.asApp(() => resolveSession(tdb.db, token, clock));
    expect(revoked.ok ? 'ok' : revoked.reason).toBe('revoked');

    const unknown = await tdb.asApp(() => resolveSession(tdb.db, 'not-a-token', clock));
    expect(unknown.ok ? 'ok' : unknown.reason).toBe('unknown');
  });
});

describe('the pre-tenant surface is exactly two tables and one function', () => {
  it('gives the application role no way to insert an identity directly', async () => {
    // Provisioning is a function call the database can audit, not a privilege the
    // web tier carries. If this ever passes again, there are two ways to create an
    // account and only one of them is the one anybody reviews.
    for (const statement of [
      `INSERT INTO users (id, email) VALUES (gen_random_uuid(), 'direct@journey.ratepin.test')`,
      `INSERT INTO accounts (id, name) VALUES (gen_random_uuid(), 'direct')`,
      `INSERT INTO memberships (account_id, user_id, role)
         VALUES ('${FIXTURE.accountA}', '${FIXTURE.userB}', 'owner')`,
    ]) {
      const thrown = await tdb
        .asApp(() => tdb.client.query(statement))
        .then(
          () => null,
          (error: unknown) => String(error),
        );
      expect(thrown, `ACCEPTED: ${statement}`).toMatch(/permission denied/i);
    }
  });

  it('runs the provisioning function as a NOLOGIN, NOBYPASSRLS role', async () => {
    const row = await tdb.client.query<{
      owner: string;
      security_definer: boolean;
      rolcanlogin: boolean;
      rolbypassrls: boolean;
      rolsuper: boolean;
    }>(
      `SELECT r.rolname AS owner, p.prosecdef AS security_definer,
              r.rolcanlogin, r.rolbypassrls, r.rolsuper
         FROM pg_proc p JOIN pg_roles r ON r.oid = p.proowner
        WHERE p.proname = 'ratepin_provision_identity'`,
    );
    const fn = row.rows[0];
    expect(fn?.owner).toBe('ratepin_provisioner');
    expect(fn?.security_definer).toBe(true);
    expect(fn?.rolcanlogin, 'the provisioning role must not be connectable').toBe(false);
    expect(fn?.rolbypassrls, 'a bypass is not the fix; four policies are').toBe(false);
    expect(fn?.rolsuper).toBe(false);
  });

  it('gives the provisioning role no reach into any customer relation', async () => {
    // The blast radius of the one boundary crossing, stated as a query. If the
    // definer function is ever widened, this fails before the reviewer has to
    // notice a new statement in its body.
    const rows = await tdb.client.query<{ table_name: string; privilege_type: string }>(
      `SELECT table_name, privilege_type FROM information_schema.table_privileges
        WHERE grantee = 'ratepin_provisioner' ORDER BY table_name, privilege_type`,
    );
    const granted = rows.rows.map((r) => `${r.table_name}:${r.privilege_type}`).sort();
    expect(granted).toEqual([
      'accounts:INSERT',
      'billing_account_index:INSERT',
      'memberships:INSERT',
      'memberships:SELECT',
      'users:INSERT',
      'users:SELECT',
    ]);
  });

  it('refuses an address the caller did not normalise', async () => {
    const thrown = await tdb
      .asApp(() =>
        tdb.client.query(`SELECT * FROM ratepin_provision_identity('Not An Email', 'x')`),
      )
      .then(
        () => null,
        (error: unknown) => String(error),
      );
    expect(thrown).toMatch(/not a normalised email address/);
  });
});

describe('a failed redemption does not burn the link', () => {
  /**
   * The compounding half of the sign-in defect. The consuming UPDATE used to commit
   * on its own, so a provisioning failure left the link consumed: the retry the
   * customer inevitably makes lands on "this link was already used", requesting
   * another repeats it, and under A3 there is no support address by design. That is
   * an unrecoverable denial of signup with no exit — and the screen misdescribes the
   * cause. Redemption is now one transaction, proved here by forcing the failure.
   */
  it('rolls the consume back and the same token still works afterwards', async () => {
    // `auth_magic_links` constrains the address to lower case and nothing else, so
    // a malformed one reaches the provisioning function and is refused there —
    // a failure AFTER the consuming UPDATE, which is the shape that matters.
    const token = 'rollback-probe-token';
    const digest = await tdb.client.query<{ h: string }>(
      `SELECT encode(digest($1, 'sha256'), 'hex') AS h`,
      [token],
    );
    await tdb.client.query(
      `INSERT INTO auth_magic_links (id, email, token_hash, created_at, expires_at)
       VALUES (gen_random_uuid(), 'not-an-email', $1, now(), now() + interval '15 minutes')`,
      [digest.rows[0]?.h ?? ''],
    );

    const failed = await tdb
      .asApp(() => redeemMagicLink(tdb.db, token, { clock }))
      .then(
        () => null,
        (error: unknown) => String(error),
      );
    expect(failed, 'the malformed address should have raised').not.toBeNull();

    const after = await tdb.client.query<{ consumed_at: string | null }>(
      `SELECT consumed_at FROM auth_magic_links WHERE email = 'not-an-email'`,
    );
    expect(after.rows[0]?.consumed_at, 'the link was consumed by a failed attempt').toBeNull();
  });
});

/** Relations the loop must find account A actually owning, or it proves nothing. */
const NON_VACUOUS = new Set(['accounts', 'memberships', 'projects', 'workers', 'filings', 'artifacts']);

describe('a second tenant cannot read the first through anything', () => {
  /**
   * The repositories in `src/app/(app)/_lib/**` select without an account predicate
   * and lean wholly on RLS. That is one mechanism where §11.2 asks for two, and the
   * predicate half is being restored in that module. This is the half that lives
   * here: proving the policies actually hold, on the actual role, for EVERY relation
   * that carries one — not for the handful a hand-picked test would list.
   */
  it('shows account B nothing of account A, on every policied relation', async () => {
    const policied = await tdb.client.query<{ tablename: string }>(
      `SELECT DISTINCT tablename FROM pg_policies
        WHERE policyname LIKE '%_tenant_isolation' ORDER BY tablename`,
    );
    const tables = policied.rows.map((r) => r.tablename);
    expect(tables.length, 'no tenant policies found at all').toBeGreaterThanOrEqual(25);

    // `ratepin_enable_tenant_rls` takes the tenant column as a parameter — `accounts`
    // is scoped on its own primary key — so the column is discovered, not assumed.
    const columns = await tdb.client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.columns WHERE column_name = 'account_id'`,
    );
    const hasAccountId = new Set(columns.rows.map((r) => r.table_name));

    for (const table of tables) {
      const column = hasAccountId.has(table) ? 'account_id' : 'id';
      const owned = await tdb.client.query<{ n: string }>(
        `SELECT count(*)::text AS n FROM ${table} WHERE ${column} = $1`,
        [FIXTURE.accountA],
      );
      const visible = await tdb.asApp(() =>
        withTenant(tdb.db, { accountId: accountId(FIXTURE.accountB) }, async (tx) =>
          rowsOf<{ n: string }>(
            await tx.execute(
              sql.raw(`SELECT count(*)::text AS n FROM ${table} WHERE ${column} = '${FIXTURE.accountA}'`),
            ),
          ),
        ),
      );
      expect(visible[0]?.n, `${table} leaked account A to account B`).toBe('0');
      // And the fixture is not vacuous where it matters: A really does own rows.
      if (NON_VACUOUS.has(table)) {
        expect(Number(owned.rows[0]?.n), `${table} fixture is empty`).toBeGreaterThan(0);
      }
    }
  });

  it('shows a signed-in stranger their own empty account, not the seeded one', async () => {
    // The reviewer's scenario, run as code: a brand-new account created through the
    // product's own sign-in, reading the dashboard's own relations.
    const { token } = await signIn('mallory@evil.test');
    const lookup = await tdb.asApp(() => resolveSession(tdb.db, token, clock));
    expect(lookup.ok).toBe(true);
    if (!lookup.ok) return;

    const seen = await tdb.asApp(() =>
      withTenant(tdb.db, { accountId: lookup.session.accountId }, async (tx) => ({
        projects: rowsOf(await tx.execute(sql`SELECT id FROM projects`)),
        filings: rowsOf(await tx.execute(sql`SELECT id FROM filings`)),
        workers: rowsOf(await tx.execute(sql`SELECT id FROM workers`)),
        accounts: rowsOf<{ name: string }>(await tx.execute(sql`SELECT name FROM accounts`)),
      })),
    );
    expect(seen.projects).toHaveLength(0);
    expect(seen.filings).toHaveLength(0);
    expect(seen.workers).toHaveLength(0);
    expect(seen.accounts.map((a) => a.name)).not.toContain('Rio Vista Concrete');
  });

  it('treats a revoked membership as a revoked session', async () => {
    // `sessionStillAuthorized` is the second half of the boundary in a case RLS
    // cannot see: `auth_sessions.account_id` is fixed at issue time, so a membership
    // removed afterwards leaves a cookie with full read and write access for the
    // rest of a 14-day TTL. The check used to query `memberships` with no tenant
    // context, which returns zero rows for EVERYBODY on the application role — a
    // check that fails closed for every session is not a check.
    const email = 'revoked.member@journey.ratepin.test';
    const { token, account } = await signIn(email);
    const lookup = await tdb.asApp(() => resolveSession(tdb.db, token, clock));
    expect(lookup.ok).toBe(true);
    if (!lookup.ok) return;

    expect(await tdb.asApp(() => sessionStillAuthorized(tdb.db, lookup.session))).toBe(true);

    await tdb.client.query(`DELETE FROM memberships WHERE account_id = $1`, [account]);
    expect(await tdb.asApp(() => sessionStillAuthorized(tdb.db, lookup.session))).toBe(false);
  });
});

describe('the retention sweep does not leave credentials behind', () => {
  it('drops consumed links and empties the payload of a sent message', async () => {
    // `email_outbox` is deliberately outside RLS — it is a fleet surface — and the
    // magic-link send puts a live sign-in URL in `payload`. Nulling it on send bounds
    // the exposure to the send rather than leaving a permanent historical record of
    // every credential ever issued. The write itself belongs to the sender.
    await tdb.client.query(
      `INSERT INTO email_outbox (id, to_address, template, payload, sent_at, idempotency_key)
       VALUES (gen_random_uuid(), 'sent@journey.ratepin.test', 'magic_link',
               '{"url":"https://app.ratepin.test/auth/callback?token=live"}'::jsonb,
               now(), 'sweep-probe')`,
    );
    await tdb.asApp(() => purgeDeadSessions(tdb.db, clock));

    const outbox = await tdb.client.query<{ payload: Record<string, unknown> }>(
      `SELECT payload FROM email_outbox WHERE idempotency_key = 'sweep-probe'`,
    );
    expect(JSON.stringify(outbox.rows[0]?.payload)).not.toMatch(/token=/);

    const consumed = await tdb.client.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM auth_magic_links WHERE consumed_at IS NOT NULL`,
    );
    expect(consumed.rows[0]?.n).toBe('0');
  });
});

describe('createSession records the identity it was minted for', () => {
  it('stores the email on the session row, not on a table with a policy', async () => {
    const issued = await tdb.asApp(() =>
      createSession(
        tdb.db,
        { userId: FIXTURE.userA, accountId: FIXTURE.accountA, email: 'owner@example.test' },
        clock,
      ),
    );
    const row = await tdb.client.query<{ email: string }>(
      `SELECT email FROM auth_sessions WHERE id = $1`,
      [issued.session.id],
    );
    expect(row.rows[0]?.email).toBe('owner@example.test');
  });
});
