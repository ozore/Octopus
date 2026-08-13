/**
 * SMOKE — the schema boots, and the tenant boundary holds.
 *
 * This is the scaffold's only behavioural test and it exists to prove two claims
 * that everything else in the repository is built on top of:
 *
 *   1. The committed migration applies to a real Postgres engine, with the
 *      extensions, triggers, generated columns, views and materialized views it
 *      declares. If this fails, no other data-layer test means anything.
 *
 *   2. Row-level security isolates two tenants FOR REAL — not "the repository
 *      remembered to add a WHERE clause", which is what an application-layer test
 *      actually measures. ADR-011 requires two independent mechanisms; this test
 *      is the one that can tell whether the second exists.
 *
 * It runs offline: `vitest.setup.ts` has already made `fetch` throw.
 */

import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { withTenant, withoutTenant, accountId } from '../src/db/tenant';
import { createTestDb, seedTenant, FIXTURE, type TestDb } from './helpers/pglite';

let tdb: TestDb;

beforeEach(async () => {
  tdb = await createTestDb();
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
    band: 'at_or_under_100k',
    name: 'Coastline Insulation',
  });
});

afterEach(async () => {
  await tdb.close();
});

describe('the schema boots', () => {
  it('creates every table, view and materialized view the model declares', async () => {
    const tables = await tdb.client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    const matviews = await tdb.client.query<{ matviewname: string }>(
      `SELECT matviewname FROM pg_matviews WHERE schemaname = 'public'`,
    );
    const names = new Set([
      ...tables.rows.map((r) => r.table_name),
      ...matviews.rows.map((r) => r.matviewname),
    ]);

    for (const expected of [
      // tenancy
      'accounts', 'users', 'memberships',
      // the mirror
      'wd_blob', 'wd_revision', 'wd_alias', 'wd_index_record', 'wd_classification',
      'wd_parse_residue', 'wd_class_diff', 'wd_county_scope', 'wd_county_resolved',
      'corpus_snapshot', 'snapshot_member', 'advisory_variance', 'probe_run',
      'corpus_freeze', 'blocking_probe_register', 'obligation_changelog',
      'regulatory_constant', 'wd_classification_current', 'county_class_rate',
      // projects, pins, payroll
      'projects', 'project_band_events', 'wd_pins', 'pin_standing', 'workers',
      'payroll_imports', 'payroll_weeks', 'payroll_worker_weeks', 'payroll_lines',
      'payroll_line_fringe_credits', 'payroll_worker_deductions',
      // filings and artifacts
      'filings', 'artifacts', 'artifact_provenance', 'filing_events',
      // crosswalk
      'payroll_title', 'title_soc_edge', 'soc_wdclass_edge', 'crosswalk_observation',
      'crosswalk_eligible_account', 'crosswalk_prior',
      // billing
      'plans', 'subscriptions', 'meter_events', 'credits', 'refunds', 'stripe_events',
      'rate_card_purchases',
      // ops and the G1..G6 instrumentation
      'jobs', 'incidents', 'canary_runs', 'form_acceptance_confirmations',
      'corpus_reconciliation', 'filing_durations', 'published_addresses',
      'inbound_messages', 'staleness_windows', 'claim_gates',
    ]) {
      expect(names, `missing relation: ${expected}`).toContain(expected);
    }
  });

  it('starts every measurement gate LOCKED (CORRECTIONS.md §0.2)', async () => {
    const rows = await tdb.client.query<{ gate_key: string; state: string }>(
      `SELECT gate_key, state FROM claim_gates ORDER BY gate_key`,
    );
    expect(rows.rows.map((r) => r.gate_key)).toEqual(['G1', 'G2', 'G3', 'G4', 'G5', 'G6']);
    expect(rows.rows.every((r) => r.state === 'locked')).toBe(true);
  });

  it('keeps the two withdrawn probes in the register rather than deleting them', async () => {
    // "Deleting the evidence of a mistake is how the mistake comes back."
    const rows = await tdb.client.query<{ probe_key: string; red_rate_pct: string; armed: boolean }>(
      `SELECT probe_key, red_rate_pct, armed FROM blocking_probe_register
        WHERE withdrawn ORDER BY probe_key`,
    );
    expect(rows.rows.map((r) => r.probe_key)).toEqual([
      'mod_table_rows_eq_revision_plus_one',
      'standard_flag_disagreement',
    ]);
    expect(rows.rows.every((r) => r.armed === false)).toBe(true);
  });

  it('refuses to arm a blocking probe whose measured red rate exceeds 1%', async () => {
    // C5: a red rate above 1% on a blocking probe is a specification bug, not an
    // incident, and it is handled by changing the specification.
    await expect(
      tdb.client.query(
        `UPDATE blocking_probe_register
            SET armed = true, withdrawn = false
          WHERE probe_key = 'standard_flag_disagreement'`,
      ),
    ).rejects.toThrow();
  });
});

describe('the mirror is append-only (I5)', () => {
  it('refuses an UPDATE on wd_blob even as the owner', async () => {
    await expect(tdb.client.query(`UPDATE wd_blob SET byte_length = 1`)).rejects.toThrow(
      /append-only/,
    );
  });

  it('refuses a DELETE on wd_classification even as the owner', async () => {
    await expect(tdb.client.query(`DELETE FROM wd_classification`)).rejects.toThrow(/append-only/);
  });

  it('gives the application role no write grant on the mirror', async () => {
    await tdb.asApp(async () => {
      await expect(
        tdb.client.query(`INSERT INTO wd_alias (alias, wd_number) VALUES ('VA195', 'VA20260195')`),
      ).rejects.toThrow(/permission denied/);
    });
  });
});

describe('row-level security isolates two tenants', () => {
  it('shows each account only its own projects, accounts and users', async () => {
    const seen = await tdb.asApp(async () => {
      const forA = await withTenant(tdb.db, { accountId: accountId(FIXTURE.accountA) }, (tx) =>
        tx.execute(sql`SELECT name FROM projects ORDER BY name`),
      );
      const forB = await withTenant(tdb.db, { accountId: accountId(FIXTURE.accountB) }, (tx) =>
        tx.execute(sql`SELECT name FROM projects ORDER BY name`),
      );
      const accountsForA = await withTenant(
        tdb.db,
        { accountId: accountId(FIXTURE.accountA) },
        (tx) => tx.execute(sql`SELECT name FROM accounts ORDER BY name`),
      );
      const usersForA = await withTenant(tdb.db, { accountId: accountId(FIXTURE.accountA) }, (tx) =>
        tx.execute(sql`SELECT email FROM users ORDER BY email`),
      );
      return { forA: rowsOf(forA), forB: rowsOf(forB), accountsForA: rowsOf(accountsForA), usersForA: rowsOf(usersForA) };
    });

    expect(seen.forA.map((r) => r['name'])).toEqual(['Rio Vista Concrete — project']);
    expect(seen.forB.map((r) => r['name'])).toEqual(['Coastline Insulation — project']);
    // `accounts` is scoped on its own primary key; `users` by membership.
    expect(seen.accountsForA.map((r) => r['name'])).toEqual(['Rio Vista Concrete']);
    expect(seen.usersForA).toHaveLength(1);
  });

  it('shows an UNSCOPED connection nothing at all — the boundary fails closed', async () => {
    // This is the property that makes a forgotten `withTenant` a visible zero-row
    // bug rather than an invisible cross-tenant read.
    const rows = await tdb.asApp(async () =>
      rowsOf(await withoutTenant(tdb.db, (tx) => tx.execute(sql`SELECT id FROM projects`))),
    );
    expect(rows).toHaveLength(0);
  });

  it('refuses a cross-tenant INSERT even when the account_id is stated explicitly', async () => {
    // WITH CHECK, not just USING: reading another tenant's rows is one hole and
    // writing INTO another tenant is a different one. A policy with only USING
    // closes the first and leaves the second wide open.
    const thrown = await tdb.asApp(async () =>
      withTenant(tdb.db, { accountId: accountId(FIXTURE.accountA) }, (tx) =>
        tx.execute(sql`
          INSERT INTO projects
            (id, account_id, name, state_code, county_name, county_name_norm,
             construction_type, funding_source, contract_value_band,
             band_asserted_at, band_asserted_by)
          VALUES ('77777777-7777-4777-8777-777777777777',
                  ${FIXTURE.accountB}::uuid, 'Sneaky', 'NV', 'Clark', 'CLARK',
                  'BUILDING', 'FAA', 'unknown', now(), ${FIXTURE.userB}::uuid)
        `),
      ),
    ).then(
      () => null,
      (error: unknown) => error,
    );

    expect(thrown, 'the cross-tenant insert was ACCEPTED').not.toBeNull();
    // Drizzle wraps driver errors, so the Postgres message lives on the cause.
    expect(causeChain(thrown)).toMatch(/row-level security/);
  });

  it('leaves the tenant context unset after the transaction ends', async () => {
    // Transaction scope is what stops a pooled connection from carrying one
    // request's tenant into the next one's queries.
    await tdb.asApp(async () => {
      await withTenant(tdb.db, { accountId: accountId(FIXTURE.accountA) }, (tx) =>
        tx.execute(sql`SELECT 1`),
      );
      const after = await tdb.client.query<{ acct: string | null }>(
        `SELECT ratepin_current_account()::text AS acct`,
      );
      expect(after.rows[0]?.acct).toBeNull();
    });
  });
});

describe('the projects table refuses to guess a federal overtime obligation', () => {
  it('has no DEFAULT on contract_value_band, at any layer (AS-2)', async () => {
    const row = await tdb.client.query<{ column_default: string | null; is_nullable: string }>(
      `SELECT column_default, is_nullable FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'contract_value_band'`,
    );
    expect(row.rows[0]?.column_default).toBeNull();
    expect(row.rows[0]?.is_nullable).toBe('NO');
  });

  it('rejects an INSERT that omits the band rather than picking a side', async () => {
    await expect(
      tdb.client.query(
        `INSERT INTO projects
           (id, account_id, name, state_code, county_name, county_name_norm,
            construction_type, funding_source, band_asserted_at, band_asserted_by)
         VALUES ('88888888-8888-4888-8888-888888888888', $1, 'No band', 'CA', 'Kern', 'KERN',
                 'HIGHWAY', 'FHWA', now(), $2)`,
        [FIXTURE.accountA, FIXTURE.userA],
      ),
    ).rejects.toThrow();
  });
});

describe('the status gate cannot be contradicted by a row', () => {
  it('refuses a CERTIFIABLE filing that carries block reasons', async () => {
    await expect(
      tdb.client.query(
        `INSERT INTO filings
           (id, account_id, project_id, week_ending, artifact_status, block_reasons,
            engine_version, build_sha, freshness_state)
         VALUES ('99999999-9999-4999-8999-999999999999', $1, $2, DATE '2026-08-14',
                 'CERTIFIABLE', ARRAY['UNMAPPED_TRADE']::block_reason[], 1, 'test', 'FRESH')`,
        [FIXTURE.accountA, FIXTURE.projectA],
      ),
    ).rejects.toThrow();
  });

  it('refuses a DRAFT filing that names no reason for its watermark', async () => {
    await expect(
      tdb.client.query(
        `INSERT INTO filings
           (id, account_id, project_id, week_ending, artifact_status, engine_version,
            build_sha, freshness_state)
         VALUES ('aaaaaaaa-9999-4999-8999-999999999999', $1, $2, DATE '2026-08-14',
                 'DRAFT_NOT_CERTIFIABLE', 1, 'test', 'FRESH')`,
        [FIXTURE.accountA, FIXTURE.projectA],
      ),
    ).rejects.toThrow();
  });

  it('refuses to bill a filing whose signature block was withheld (§9.5)', async () => {
    await expect(
      tdb.client.query(
        `INSERT INTO filings
           (id, account_id, project_id, week_ending, artifact_status, block_reasons,
            engine_version, build_sha, freshness_state, billable)
         VALUES ('bbbbbbbb-9999-4999-8999-999999999999', $1, $2, DATE '2026-08-14',
                 'DRAFT_NOT_CERTIFIABLE', ARRAY['CWHSSA_COVERAGE_UNDETERMINED']::block_reason[],
                 1, 'test', 'FRESH', true)`,
        [FIXTURE.accountA, FIXTURE.projectA],
      ),
    ).rejects.toThrow();
  });

  it('refuses a CERTIFIABLE filing whose freshness is not FRESH', async () => {
    // §6.3: freshness DATED or STALE yields CERTIFIABLE_DATED, never CERTIFIABLE.
    await expect(
      tdb.client.query(
        `INSERT INTO filings
           (id, account_id, project_id, week_ending, artifact_status, engine_version,
            build_sha, freshness_state)
         VALUES ('cccccccc-9999-4999-8999-999999999999', $1, $2, DATE '2026-08-14',
                 'CERTIFIABLE', 1, 'test', 'STALE')`,
        [FIXTURE.accountA, FIXTURE.projectA],
      ),
    ).rejects.toThrow();
  });
});

/** Flatten an error and every `cause` beneath it into one searchable string. */
function causeChain(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current instanceof Error && depth < 8; depth += 1) {
    parts.push(current.message);
    current = (current as { cause?: unknown }).cause;
  }
  return parts.join(' | ');
}

function rowsOf(result: unknown): Record<string, unknown>[] {
  // Drizzle's `execute` returns the driver's own shape: an array for postgres-js,
  // `{ rows }` for PGlite. Normalising here keeps the assertions about the
  // boundary rather than about the driver.
  if (Array.isArray(result)) return result as Record<string, unknown>[];
  const rows = (result as { rows?: unknown }).rows;
  return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
}
