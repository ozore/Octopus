import { sql } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';

import { organisations, readJournal, readMigrationStatements, withTx } from '../src/db';
import { platformMigrationsDir } from '../src/db/migrations';
import { newId } from '../src/ids';
import { createTestDb, type TestDb } from '../src/testing';

let harness: TestDb | undefined;
afterEach(async () => {
  await harness?.close();
  harness = undefined;
});

describe('db', () => {
  it('reads every committed migration in journal order', () => {
    const journal = readJournal(platformMigrationsDir());
    expect(journal.entries.length).toBeGreaterThan(0);
    const statements = readMigrationStatements(platformMigrationsDir());
    expect(statements.length).toBeGreaterThan(10);
    expect(statements.join('\n')).toContain('CREATE TABLE "organisations"');
  });

  it('boots PGlite with the real schema', async () => {
    harness = await createTestDb();
    const result = await harness.client.query<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema = 'public' order by table_name`,
    );
    const tables = result.rows.map((r) => r.table_name);
    expect(tables).toEqual(
      expect.arrayContaining([
        'customers',
        'email_suppressions',
        'events',
        'jobs',
        'login_tokens',
        'memberships',
        'organisations',
        'rate_limits',
        'sessions',
        'stripe_events',
        'subscriptions',
        'users',
      ]),
    );
  });

  it('enforces the constraints migrations declare', async () => {
    harness = await createTestDb();
    await harness.db.insert(organisations).values({ id: newId('org'), name: 'A', slug: 'dup' });
    await expect(
      harness.db.insert(organisations).values({ id: newId('org'), name: 'B', slug: 'dup' }),
    ).rejects.toThrow();
  });

  it('withTx rolls the whole unit back on failure', async () => {
    harness = await createTestDb();
    const { db } = harness;
    await expect(
      withTx(db, async (tx) => {
        await tx.insert(organisations).values({ id: newId('org'), name: 'tx', slug: 'tx-org' });
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(organisations);
    expect(Number(row?.count ?? 0)).toBe(0);
  });
});
