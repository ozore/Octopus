/**
 * The schema's own guarantees, checked against a real Postgres.
 *
 * The tenancy test is the one that matters most: it enumerates every table this
 * app declares and fails the build if any of them lacks `org_id`. That is the
 * guard that stops a cross-tenant leak being a code-review problem (`specs/01`
 * §Test plan). The knowledge-base tables are the NAMED exemption — the
 * knowledge base is one shared, versioned artefact, not a per-customer one —
 * and naming them beats pattern-matching them, because a new table that happens
 * to start with `kb_` would otherwise exempt itself.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { newId } from '@octopus/platform';
import { organisations, users } from '@octopus/platform/db';
import { createTestDb } from '@octopus/platform/testing';

import { appMigrationsDir } from '../src/lib/db';
import { appSchema, deadlines, licences, technicians } from '../src/lib/schema';


/**
 * Drizzle wraps a Postgres error, so the constraint name lives on `cause`
 * rather than on the top-level message. Asserting on the NAME rather than on
 * "it threw" is the point: a test that only checks for a rejection passes when
 * the insert fails for an unrelated reason.
 */
async function expectConstraintViolation(work: Promise<unknown>, constraint: string): Promise<void> {
  try {
    await work;
  } catch (error) {
    const messages: string[] = [];
    let current: unknown = error;
    for (let depth = 0; depth < 5 && current instanceof Error; depth += 1) {
      messages.push(current.message);
      current = (current as { cause?: unknown }).cause;
    }
    expect(messages.join(' | ')).toContain(constraint);
    return;
  }
  throw new Error(`expected a ${constraint} violation, but the write succeeded`);
}

let db: Awaited<ReturnType<typeof createTestDb>>;
let orgId: string;

beforeEach(async () => {
  db = await createTestDb([appMigrationsDir()]);
  orgId = newId('org');
  await db.db.insert(organisations).values({ id: orgId, name: 'Sila Mechanical', slug: `sila-${orgId}` });
});
afterEach(async () => {
  await db.close();
});

/** The knowledge base is shared and versioned, not tenanted. */
const KB_TABLES = new Set(['kb_snapshots', 'kb_records', 'kb_sources', 'kb_drift_items']);
/** Keyed on the user, not the organisation, because the preference is the person's. */
const USER_KEYED = new Set(['alert_recipients', 'notification_preferences']);

describe('the app schema composes onto the platform schema', () => {
  it('applies after the platform migrations and resolves the foreign keys', async () => {
    const result = await db.client.query<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema='public' order by table_name`,
    );
    const tables = result.rows.map((r) => r.table_name);
    expect(tables).toContain('organisations');
    expect(tables).toContain('deadlines');
    expect(tables).toContain('kb_snapshots');

    await expect(
      db.db.insert(technicians).values({ id: 't1', orgId: 'org_missing', firstName: 'A', lastName: 'B' }),
    ).rejects.toThrow();
  });
});

describe('tenancy', () => {
  it('every product table carries org_id', async () => {
    const result = await db.client.query<{ table_name: string; column_name: string }>(
      `select table_name, column_name from information_schema.columns where table_schema='public'`,
    );
    const columns = new Map<string, Set<string>>();
    for (const row of result.rows) {
      const set = columns.get(row.table_name) ?? new Set<string>();
      set.add(row.column_name);
      columns.set(row.table_name, set);
    }

    const appTables = Object.values(appSchema).map((table) => {
      const symbols = Object.getOwnPropertySymbols(table);
      const nameSymbol = symbols.find((s) => String(s).includes('Name'));
      return nameSymbol ? String((table as never as Record<symbol, unknown>)[nameSymbol]) : '';
    });
    expect(appTables.filter(Boolean).length).toBe(Object.keys(appSchema).length);

    const offenders = appTables.filter(
      (name) => name && !KB_TABLES.has(name) && !USER_KEYED.has(name) && !columns.get(name)?.has('org_id'),
    );
    expect(offenders, 'every product table must carry org_id').toEqual([]);

    // The user-keyed pair still carries org_id; it is just not the primary key.
    for (const name of USER_KEYED) expect(columns.get(name)?.has('org_id'), name).toBe(true);
  });

  it('the NEVER list is enforced by the absence of the columns, not by a policy document', async () => {
    const result = await db.client.query<{ column_name: string }>(
      `select column_name from information_schema.columns where table_schema='public' and table_name='technicians'`,
    );
    const columns = result.rows.map((r) => r.column_name);
    for (const banned of ['phone', 'phone_number', 'home_address', 'address', 'date_of_birth', 'dob', 'ssn']) {
      expect(columns, `technicians must not carry ${banned}`).not.toContain(banned);
    }
  });
});

describe('the two constraints that live in the database', () => {
  it('a derived deadline cannot exist without a citation — specs/05 invariant 1', async () => {
    await expectConstraintViolation(
      db.db.insert(deadlines).values({
        id: newId('dln'),
        orgId,
        kind: 'renewal',
        dueOn: '2027-03-14',
        source: 'derived',
        citationUrl: null,
      }),
      'deadlines_citation_ck',
    );

    // An ENTERED date needs no citation: the customer is the source.
    await expect(
      db.db.insert(deadlines).values({
        id: newId('dln'),
        orgId,
        kind: 'renewal',
        dueOn: '2027-03-14',
        source: 'entered',
        citationUrl: null,
      }),
    ).resolves.toBeDefined();
  });

  it('a licence is held by exactly one of an entity or a technician', async () => {
    await expectConstraintViolation(
      db.db.insert(licences).values({
        id: newId('lic'),
        orgId,
        holderKind: 'entity',
        state: 'TX',
        trade: 'hvac',
      }),
      'licences_holder_ck',
    );

    const techId = newId('tec');
    await db.db.insert(technicians).values({ id: techId, orgId, firstName: 'Dave', lastName: 'Alvarez' });
    await expect(
      db.db.insert(licences).values({
        id: newId('lic'),
        orgId,
        holderKind: 'technician',
        technicianId: techId,
        state: 'TX',
        trade: 'hvac',
      }),
    ).resolves.toBeDefined();
  });
});

describe('the per-recipient anti-duplicate guarantee', () => {
  it('is a unique constraint on (deadline, offset, recipient) — not on (deadline, offset)', async () => {
    const userA = newId('usr');
    const userB = newId('usr');
    await db.db.insert(users).values([
      { id: userA, email: `a-${userA}@example.test` },
      { id: userB, email: `b-${userB}@example.test` },
    ]);
    const deadlineId = newId('dln');
    await db.db.insert(deadlines).values({
      id: deadlineId,
      orgId,
      kind: 'renewal',
      dueOn: '2027-03-14',
      source: 'entered',
    });

    const { alerts } = await import('../src/lib/schema');
    // Two recipients, one deadline, one offset: TWO rows. The wave-1 model made
    // this unrepresentable, so a two-person compliance team could only ever be
    // told once, between them (wave-1b B10).
    await db.db.insert(alerts).values([
      { id: newId('alr'), orgId, deadlineId, recipientUserId: userA, offsetDays: 90, status: 'queued' },
      { id: newId('alr'), orgId, deadlineId, recipientUserId: userB, offsetDays: 90, status: 'queued' },
    ]);

    // The same recipient twice: refused.
    await expectConstraintViolation(
      db.db.insert(alerts).values({
        id: newId('alr'),
        orgId,
        deadlineId,
        recipientUserId: userA,
        offsetDays: 90,
        status: 'queued',
      }),
      'alerts_once_idx',
    );
  });
});
