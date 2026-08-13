/**
 * ADR-011, pinned — including the part of it that does not work.
 *
 * §11.2 puts TWO independent mechanisms under the tenant boundary: tenant-scoped
 * repositories, and row-level security. The journey in `journey.spec.ts` runs with
 * the second one INERT, because the application cannot currently boot on the role
 * that carries it. This file is where that is written down as an executable fact
 * rather than a paragraph, so it stops being true the moment somebody fixes it.
 *
 * Nothing here uses a browser. The defect is at the boundary between the auth
 * module and the schema, and the smallest honest reproduction is the statements
 * themselves.
 */

import { expect, test } from '@playwright/test';

import { db } from './support';

/** The NOBYPASSRLS role every policy in `drizzle/0000_init.sql` is written `TO`. */
const APP_ROLE = 'ratepin_app';

test.describe('the tenant role', () => {
  test('exists, can log in, and cannot bypass row-level security', async () => {
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

  /**
   * KNOWN DEFECT, MARKED FAILING ON PURPOSE.
   *
   * `redeemMagicLink` is the whole of account provisioning (PLAN.md A1: "no manual
   * account provisioning" — the absence of a provisioning table is the mechanism).
   * It runs on the pool handle with NO tenant context, because at that moment there
   * is no tenant: the account it will create does not exist yet. Every policy it
   * must satisfy is written against `ratepin_current_account()`, which is NULL
   * there, so:
   *
   *   - `INSERT INTO users … ON CONFLICT (email) DO NOTHING` is refused with 42501.
   *     `WITH CHECK` on the users policy is `true`, but `ON CONFLICT` additionally
   *     applies the policy's `USING` expression to the proposed row, and that one
   *     requires a membership the row cannot have yet.
   *   - `INSERT INTO memberships …` would be refused for the same reason, its
   *     `WITH CHECK` being `account_id = ratepin_current_account()`.
   *   - The returning-user lookup `SELECT … FROM users WHERE email = …` returns
   *     nothing, because the same `USING` hides a user whose account is not the
   *     current one — so a customer who already has an account is treated as new.
   *
   * The consequence is not subtle: ON THE ROLE ADR-011 MANDATES, NOBODY CAN SIGN IN.
   * It is invisible to `npm test` because PGlite connects as a superuser and the
   * harness switches to `ratepin_app` only for the assertions that are about RLS,
   * and invisible to `npm run seed` because the seed connects as the owner.
   *
   * The fix is a decision, not a patch — provisioning has to cross the tenant
   * boundary somewhere, and the choice of where (a `SECURITY DEFINER` function owned
   * by a dedicated role, versus policies that admit an unscoped self-provisioning
   * insert) belongs in an ADR. So this test states the intended behaviour, is marked
   * expected-to-fail, and will fail the suite as "passed unexpectedly" on the day it
   * starts working — which is the reminder to delete the marker.
   */
  test('can provision a brand-new identity, the way sign-in does', async () => {
    // Scoped to THIS test. `test.fail()` at describe level marks every test in the
    // block, which would turn the passing role check above into "passed
    // unexpectedly".
    test.fail();
    const sql = db();
    const email = `tenancy.${Date.now().toString(36)}@journey.ratepin.test`;
    try {
      await sql.unsafe(`SET ROLE ${APP_ROLE}`);
      await sql.unsafe(
        `INSERT INTO users (id, email, created_at)
         VALUES (gen_random_uuid(), $1, now())
         ON CONFLICT (email) DO NOTHING`,
        [email] as never,
      );
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});
