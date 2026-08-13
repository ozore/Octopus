/**
 * ADR-011, pinned — on the role that carries it.
 *
 * §11.2 puts TWO independent mechanisms under the tenant boundary: tenant-scoped
 * repositories, and row-level security. This file used to record the second one as
 * a known defect and marked its own test expected-to-fail, because the application
 * could not boot on `ratepin_app` at all: `resolveSession` joined `users`, whose
 * policy needs the account the session lookup exists to discover, and provisioning
 * inserted four rows with no tenant context to satisfy any policy with. The result
 * was not "RLS untested" but "RLS unreachable" — no request ever got past
 * `requireSession`, and the sixteen journey screenshots were captured as a
 * superuser, where every policy is silently inert.
 *
 * Both halves are now fixed and the marker is gone. The assertions below are the
 * shape of the fix rather than a restatement of it:
 *
 *   1. the role exists, can connect, and cannot bypass a policy;
 *   2. it can provision a brand-new identity — through the one SECURITY DEFINER
 *      function, which is the only place a write crosses the boundary;
 *   3. it CANNOT provision one any other way, so there is exactly one path and it
 *      is the one a reviewer reads;
 *   4. two tenants, seeded by the owner, are invisible to each other through every
 *      relation that carries a policy — the property every repository in
 *      `src/app/(app)/_lib/**` depends on.
 *
 * Nothing here uses a browser. The boundary is between the auth module and the
 * schema, and the smallest honest reproduction is the statements themselves.
 * `journey.spec.ts` is what drives the boundary through the product.
 */

import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

import { db } from './support';

/** The NOBYPASSRLS role every policy in `drizzle/0000_init.sql` is written `TO`. */
const APP_ROLE = 'ratepin_app';
/** The NOLOGIN role that owns the one boundary-crossing function. */
const PROVISIONER_ROLE = 'ratepin_provisioner';

test.describe('the tenant role', () => {
  test('exists and cannot bypass row-level security', async () => {
    const sql = db();
    try {
      const rows = await sql<{ rolsuper: boolean; rolbypassrls: boolean; rolcanlogin: boolean }[]>`
        SELECT rolsuper, rolbypassrls, rolcanlogin FROM pg_roles WHERE rolname = ${APP_ROLE}
      `;
      const role = rows[0];
      expect(role, `${APP_ROLE} does not exist; run npm run db:migrate`).toBeDefined();
      expect(role?.rolsuper, 'a superuser ignores every policy silently').toBe(false);
      expect(role?.rolbypassrls).toBe(false);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  test('crosses the tenant boundary through one function owned by a role nothing can connect as', async () => {
    const sql = db();
    try {
      const rows = await sql<
        { owner: string; prosecdef: boolean; rolcanlogin: boolean; rolbypassrls: boolean }[]
      >`
        SELECT r.rolname AS owner, p.prosecdef, r.rolcanlogin, r.rolbypassrls
          FROM pg_proc p JOIN pg_roles r ON r.oid = p.proowner
         WHERE p.proname = 'ratepin_provision_identity'
      `;
      const fn = rows[0];
      expect(fn, 'ratepin_provision_identity is missing; run npm run db:migrate').toBeDefined();
      expect(fn?.owner).toBe(PROVISIONER_ROLE);
      expect(fn?.prosecdef, 'the function must run as its owner, not its caller').toBe(true);
      expect(fn?.rolcanlogin, 'the provisioning role must not be connectable').toBe(false);
      expect(fn?.rolbypassrls, 'a bypass is not the fix; four narrow policies are').toBe(false);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  /**
   * PLAN.md A1: "signup … happen[s] with no human on the seller side. No demos, no
   * onboarding calls, NO MANUAL ACCOUNT PROVISIONING." Redemption is the
   * provisioning step, and it runs before the account it creates exists. This is the
   * statement that used to be marked `test.fail()`.
   */
  test('can provision a brand-new identity, the way sign-in does', async () => {
    const sql = db();
    const email = `tenancy.${Date.now().toString(36)}@journey.ratepin.test`;
    try {
      await sql.unsafe(`SET ROLE ${APP_ROLE}`);
      const provisioned = await sql<{ user_id: string; account_id: string; created_account: boolean }[]>`
        SELECT user_id, account_id, created_account
          FROM ratepin_provision_identity(${email}, 'Tenancy spec')
      `;
      expect(provisioned[0]?.created_account).toBe(true);
      expect(provisioned[0]?.account_id).toBeTruthy();

      // A second redemption for the same address is a returning customer, not a
      // second account. Provisioning is idempotent on the identity, which is what
      // makes a mail client that prefetches the link harmless.
      const again = await sql<{ account_id: string; created_account: boolean }[]>`
        SELECT account_id, created_account
          FROM ratepin_provision_identity(${email}, 'Tenancy spec')
      `;
      expect(again[0]?.created_account).toBe(false);
      expect(again[0]?.account_id).toBe(provisioned[0]?.account_id);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  test('cannot provision one any other way', async () => {
    // Two paths to an account would mean the reviewed one and the other one.
    const sql = db();
    try {
      await sql.unsafe(`SET ROLE ${APP_ROLE}`);
      for (const statement of [
        `INSERT INTO users (id, email, created_at) VALUES (gen_random_uuid(), 'direct.${Date.now()}@journey.ratepin.test', now())`,
        `INSERT INTO accounts (id, name) VALUES (gen_random_uuid(), 'direct')`,
      ]) {
        const failure = await sql.unsafe(statement).then(
          () => null,
          (error: unknown) => String(error),
        );
        expect(failure, `ACCEPTED without the definer function: ${statement}`).toMatch(
          /permission denied/i,
        );
        // postgres-js aborts the transaction-less session cleanly; nothing to reset.
      }
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  /**
   * The property every repository in `src/app/(app)/_lib/**` leans on. Seeded as the
   * owner — a migration legitimately is the owner — and read back on the application
   * role with each tenant's context in force, over EVERY relation that carries a
   * policy rather than over a hand-picked few.
   */
  test('shows one tenant nothing of another, on every policied relation', async () => {
    const sql = db();
    const left = randomUUID();
    const right = randomUUID();
    try {
      for (const [id, name] of [
        [left, `tenancy-left-${left.slice(0, 8)}`],
        [right, `tenancy-right-${right.slice(0, 8)}`],
      ] as const) {
        await sql`INSERT INTO accounts (id, name) VALUES (${id}::uuid, ${name})`;
      }

      const policied = await sql<{ tablename: string }[]>`
        SELECT DISTINCT tablename FROM pg_policies
         WHERE policyname LIKE '%\\_tenant\\_isolation' ORDER BY tablename
      `;
      expect(policied.length, 'no tenant policies exist at all').toBeGreaterThanOrEqual(25);

      const scoped = await sql<{ table_name: string }[]>`
        SELECT table_name FROM information_schema.columns WHERE column_name = 'account_id'
      `;
      const hasAccountId = new Set(scoped.map((r) => r.table_name));

      await sql.unsafe(`SET ROLE ${APP_ROLE}`);
      // Session-scoped rather than transaction-scoped, because this handle is a
      // single dedicated connection and each statement below is its own transaction.
      // The application sets it `local => true` inside `withTenant`; the property
      // being asserted is the policy, not the scoping helper.
      await sql`SELECT set_config('ratepin.account_id', ${right}, false)`;
      for (const { tablename } of policied) {
        const column = hasAccountId.has(tablename) ? 'account_id' : 'id';
        const rows = (await sql.unsafe(
          `SELECT count(*)::text AS n FROM ${tablename} WHERE ${column} = '${left}'`,
        )) as unknown as { n: string }[];
        expect(rows[0]?.n, `${tablename} leaked one tenant to another`).toBe('0');
      }

      // And the boundary fails CLOSED with no context at all, which is what makes a
      // forgotten `withTenant` a zero-row bug rather than a cross-tenant read.
      await sql`SELECT set_config('ratepin.account_id', '', false)`;
      const unscoped = (await sql.unsafe(
        `SELECT count(*)::text AS n FROM accounts`,
      )) as unknown as { n: string }[];
      expect(unscoped[0]?.n).toBe('0');
    } finally {
      await sql.unsafe(`RESET ROLE`).catch(() => undefined);
      await sql`DELETE FROM accounts WHERE id IN (${left}::uuid, ${right}::uuid)`.catch(
        () => undefined,
      );
      await sql.end({ timeout: 5 });
    }
  });
});
