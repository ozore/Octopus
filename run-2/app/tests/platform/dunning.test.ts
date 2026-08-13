/**
 * DUNNING — the invariant that a payment failure never costs a customer their
 * records.
 *
 * Spec: ARCHITECTURE.md §9.1, §9.2, USER_JOURNEY §11.2, §11.3.
 *
 * §9.1's reasoning is commercial and correct — "a product that holds a contractor's
 * certified-payroll archive hostage during a payment failure is a product that earns
 * a chargeback and a bad story" — but the reason it is expressed as a total function
 * over a closed union is that a boolean written once at a call site is a boolean
 * somebody eventually writes differently at the next call site. So the first test
 * enumerates every money state rather than checking the cases anyone remembered.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { reconcileDunning } from '../../src/platform/billing/dunning';
import {
  ARCHIVE_DAYS,
  GRACE_HOURS,
  deriveEntitlement,
  deriveMoneyState,
  entitlementFor,
  type MoneyState,
} from '../../src/platform/billing/entitlement';
import { buildExport, createRecordingSink } from '../../src/platform/account/export';
import { fixedClock, mutableClock } from '../../src/platform/clock';
import type { TestDb } from '../helpers/pglite';
import { createPlatformDb, seedBilling, seedFiling, seedTenant, IDS, uuidFor } from './helpers';

let tdb!: TestDb;
let open = false;

afterEach(async () => {
  if (!open) return;
  open = false;
  await tdb.close();
});

const ALL_STATES: readonly MoneyState[] = [
  'none',
  'trialing',
  'active',
  'past_due_grace',
  'restricted',
  'archived',
  'cancelled',
];

const FAILED_AT = new Date('2026-08-01T00:00:00.000Z');

async function setup(): Promise<void> {
  tdb = await createPlatformDb();
  open = true;
  await seedTenant(tdb, {
    account: IDS.accountA,
    user: IDS.userA,
    project: IDS.projectA,
    band: 'over_100k',
    name: 'Coastline Insulation',
  });
  await seedBilling(tdb, IDS.accountA, {
    planId: 'crew',
    priceCents: 24900,
    status: 'past_due',
    stateSince: FAILED_AT,
    periodStart: new Date('2026-08-01T00:00:00.000Z'),
    periodEnd: new Date('2026-09-01T00:00:00.000Z'),
  });
  // Two filings and an artifact, so "nothing was deleted" is a count and not a hope.
  for (let i = 0; i < 2; i += 1) {
    const filing = uuidFor(0xfa, i);
    await seedFiling(tdb, {
      id: filing,
      account: IDS.accountA,
      project: IDS.projectA,
      weekEnding: '2026-07-31',
      sequence: i + 1,
      status: 'CERTIFIABLE',
      releasedAt: FAILED_AT,
    });
    await tdb.client.query(
      `INSERT INTO artifacts (id, account_id, filing_id, kind, sha256, r2_key, byte_size, pii_class, provenance)
       VALUES ($1, $2, $3, 'wh347_pdf', decode(repeat('0a', 32), 'hex'), $4, 1024, 'non_pii', '{"wd_number":"CA20260001"}'::jsonb)`,
      [uuidFor(0xfb, i), IDS.accountA, filing, `artifacts/${filing}/wh347.pdf`],
    );
  }
}

describe('export is open in every money state, without exception', () => {
  it.each(ALL_STATES)('%s can read and export the archive', (state) => {
    const entitlement = deriveEntitlement({
      status:
        state === 'past_due_grace' || state === 'restricted'
          ? 'past_due'
          : state === 'archived'
            ? 'unpaid'
            : state === 'cancelled'
              ? 'canceled'
              : state === 'none'
                ? null
                : state,
      stateSince: FAILED_AT,
      now: new Date(FAILED_AT.getTime() + (state === 'restricted' || state === 'archived' ? 40 : 1) * 86_400_000),
    });
    expect(entitlement.canExport).toBe(true);
    expect(entitlement.canReadArchive).toBe(true);
  });

  it('removes exactly one capability — generating new filings', () => {
    for (const state of ALL_STATES) {
      const capability = entitlementFor(state);
      if (capability === 'full') continue;
      // Whatever the capability enum says, export is never among the things it
      // takes away. The enum has no 'no_export' member, and this asserts the
      // absence rather than trusting it.
      expect(['restricted', 'export_only', 'none']).toContain(capability);
    }
  });
});

describe('the clock moves the state, and nothing else does', () => {
  it('walks active -> grace -> restricted -> archived on time alone', () => {
    const from = new Date('2026-08-01T00:00:00.000Z');
    const at = (hours: number): MoneyState =>
      deriveMoneyState({
        status: hours >= GRACE_HOURS + 1 ? 'unpaid' : 'past_due',
        stateSince: from,
        now: new Date(from.getTime() + hours * 3_600_000),
      });
    expect(at(1)).toBe('past_due_grace');
    expect(at(GRACE_HOURS - 1)).toBe('past_due_grace');
    expect(at(GRACE_HOURS + 1)).toBe('restricted');
    expect(at(ARCHIVE_DAYS * 24 + 1)).toBe('archived');
  });
});

describe('dunning never deletes data, and a restricted account keeps export open', () => {
  it('runs the whole lifecycle and touches no filing, artifact or worker row', async () => {
    await setup();
    const clock = mutableClock(FAILED_AT);

    const countRows = async (): Promise<{ filings: number; artifacts: number }> => {
      const f = await tdb.client.query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM filings`);
      const a = await tdb.client.query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM artifacts`);
      return { filings: Number(f.rows[0]?.n), artifacts: Number(a.rows[0]?.n) };
    };

    const before = await countRows();
    expect(before.filings).toBe(2);
    expect(before.artifacts).toBe(2);

    // Hour 1: grace. Everything still works.
    clock.advanceHours(1);
    const grace = await reconcileDunning(tdb.db, { clock });
    expect(grace.transitions[0]?.to).toBe('past_due_grace');

    // Hour 73: restricted. Generation pauses; the archive does not.
    clock.advanceHours(72);
    const restricted = await reconcileDunning(tdb.db, { clock });
    expect(restricted.transitions[0]?.to).toBe('restricted');
    expect(restricted.transitions[0]?.emailQueued).toBe('dunning_restricted');

    const account = await tdb.client.query<{ status: string }>(
      `SELECT status FROM accounts WHERE id = $1`,
      [IDS.accountA],
    );
    expect(account.rows[0]?.status).toBe('restricted');
    // The one status this path may never reach.
    expect(account.rows[0]?.status).not.toBe('deleted');

    // Day 31 unpaid: archived, and the message is the export link, sent first.
    await tdb.client.query(
      `UPDATE billing_account_index SET subscription_status = 'unpaid', state_since = $2 WHERE account_id = $1`,
      [IDS.accountA, FAILED_AT.toISOString()],
    );
    clock.advanceDays(31);
    const archived = await reconcileDunning(tdb.db, { clock });
    expect(archived.transitions[0]?.to).toBe('archived');
    expect(archived.transitions[0]?.emailQueued).toBe('archive_export_link');

    const after = await countRows();
    expect(after).toEqual(before);

    // And the export still builds, from the archived state, with no entitlement
    // parameter anywhere in its signature to refuse it.
    const sink = createRecordingSink();
    const bundle = await buildExport(tdb.db, IDS.accountA, {
      sink,
      clock: fixedClock(clock.now()),
    });
    expect(bundle.filingCount).toBe(2);
    expect(sink.files.has('manifest.json')).toBe(true);
    expect(sink.files.has('README.txt')).toBe(true);
    expect([...sink.files.keys()].filter((p) => p.endsWith('provenance.json'))).toHaveLength(2);

    // The dunning notice tells the customer the archive is open, because that is
    // the fact that separates this product from the ones that lock it.
    const notice = await tdb.client.query<{ payload: Record<string, unknown> }>(
      `SELECT payload FROM email_outbox WHERE template = 'dunning_restricted'`,
    );
    expect(notice.rows[0]?.payload['export_open']).toBe(true);
  });

  it('queues each transition notice once, however often the reconcile runs', async () => {
    await setup();
    const clock = fixedClock(new Date(FAILED_AT.getTime() + 3_600_000));
    await reconcileDunning(tdb.db, { clock });
    await reconcileDunning(tdb.db, { clock });
    await reconcileDunning(tdb.db, { clock });

    const queued = await tdb.client.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM email_outbox WHERE template = 'dunning_grace_started'`,
    );
    expect(Number(queued.rows[0]?.n)).toBe(1);
  });
});
