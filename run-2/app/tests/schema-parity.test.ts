/**
 * SCHEMA PARITY — the typed mirror may not drift from the schema of record.
 *
 * `drizzle/*.sql` is authoritative (see `drizzle.config.ts` for why: triggers,
 * policies, digest CHECKs and views are not expressible in a table declaration).
 * `src/db/schema.ts` is the surface the application queries through. Two artefacts
 * describing one schema is a drift hazard, and the usual outcome is a column added
 * in one place, absent in the other, and discovered by a production 42703.
 *
 * This test closes it mechanically: every table and column declared in the mirror
 * must exist in the migrated database, with the same name and the same nullability.
 * It deliberately does NOT assert the converse — the SQL legitimately holds
 * constraints, policies and seed rows the mirror has no way to express.
 */

import { is } from 'drizzle-orm';
import {
  PgMaterializedView,
  PgTable as PgTableClass,
  PgView,
  getTableConfig,
  getViewConfig,
} from 'drizzle-orm/pg-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { schema } from '../src/db/schema';
import { createTestDb, type TestDb } from './helpers/pglite';

let tdb: TestDb;
let columns: Map<string, Map<string, { nullable: boolean }>>;

beforeAll(async () => {
  tdb = await createTestDb();
  const rows = await tdb.client.query<{
    table_name: string;
    column_name: string;
    is_nullable: string;
  }>(
    `SELECT c.table_name, c.column_name, c.is_nullable
       FROM information_schema.columns c
      WHERE c.table_schema = 'public'
      UNION ALL
     SELECT c.relname AS table_name, a.attname AS column_name, 'YES' AS is_nullable
       FROM pg_attribute a
       JOIN pg_class c ON c.oid = a.attrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'm' AND a.attnum > 0 AND NOT a.attisdropped`,
  );
  columns = new Map();
  for (const row of rows.rows) {
    let table = columns.get(row.table_name);
    if (!table) {
      table = new Map();
      columns.set(row.table_name, table);
    }
    table.set(row.column_name, { nullable: row.is_nullable === 'YES' });
  }
}, 120_000);

afterAll(async () => {
  await tdb?.close();
});

type AnyTable = Parameters<typeof getTableConfig>[0];
type AnyView = Parameters<typeof getViewConfig>[0];

describe('every table in the typed mirror exists in the migration', () => {
  const tables = Object.values(schema).filter((v) => is(v, PgTableClass)) as unknown as AnyTable[];

  it('declares a non-trivial number of tables', () => {
    expect(tables.length).toBeGreaterThan(45);
  });

  it.each(tables.map((t) => [getTableConfig(t).name, t] as const))(
    '%s',
    (name, table) => {
      const actual = columns.get(name);
      expect(actual, `table ${name} is declared in schema.ts but absent from drizzle/*.sql`).toBeDefined();

      for (const column of getTableConfig(table).columns) {
        const found = actual?.get(column.name);
        expect(found, `${name}.${column.name} is declared in schema.ts but absent from the migration`).toBeDefined();
        if (found && !column.generated) {
          // A column the mirror calls NOT NULL and the SQL leaves nullable is the
          // drift that produces a runtime type lie rather than a query error.
          expect(
            found.nullable,
            `${name}.${column.name}: schema.ts says notNull=${String(column.notNull)}, ` +
              `the migration says nullable=${String(found.nullable)}`,
          ).toBe(!column.notNull);
        }
      }
    },
  );
});

describe('every view in the typed mirror exists in the migration', () => {
  const views = Object.values(schema).filter(
    (v) => is(v, PgView) || is(v, PgMaterializedView),
  ) as unknown as AnyView[];

  it('declares the five relations the SQL builds by hand', () => {
    expect(views.map((v) => getViewConfig(v).name).sort()).toEqual([
      'county_class_rate',
      'crosswalk_eligible_account',
      'crosswalk_prior',
      'pin_standing',
      'wd_classification_current',
    ]);
  });

  it.each(views.map((v) => [getViewConfig(v).name, v] as const))('%s', (name) => {
    expect(columns.get(name), `view ${name} is declared in schema.ts but absent from the migration`)
      .toBeDefined();
  });
});
