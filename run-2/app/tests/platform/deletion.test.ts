/**
 * DELETION — the undo window, the enumeration, and the promise we refuse to make.
 *
 * Spec: ARCHITECTURE.md §5.5 (authoritative), USER_JOURNEY.md §12.2, §12.4.
 *
 * The two properties worth stating before reading the cases:
 *
 *   1. **The window is honoured to the hour.** Executing early is not a bug that
 *      loses a day; it is the irreversible destruction of a signed federal record
 *      that the customer had six more days to reconsider.
 *
 *   2. **The screen and the report render from one array.** `DELETION_SCOPE` is the
 *      specification, `deletionPreview` is what the customer reads before the click,
 *      and the erasure report is the same array with counts attached. The test
 *      asserts they cannot diverge, because §5.5's whole reason for existing is that
 *      "a deletion promise the customer only discovers to be partial is worse than a
 *      narrower promise made up front."
 */

import { afterEach, describe, expect, it } from 'vitest';

import {
  DELETION_BOUNDARY_STATEMENT,
  DELETION_SCOPE,
  UNDO_WINDOW_DAYS,
  deletionPreview,
  dueDeletions,
  executeAccountDeletion,
  readDeletion,
  requestAccountDeletion,
  undoAccountDeletion,
} from '../../src/platform/account/deletion';
import { createFakeStripe } from '../../src/platform/billing/stripe-fake';
import { backupWindowSentence } from '../../src/platform/ops/status';
import { fixedClock } from '../../src/platform/clock';
import type { TestDb } from '../helpers/pglite';
import { createPlatformDb, seedBilling, seedFiling, seedTenant, IDS, uuidFor } from './helpers';

let tdb!: TestDb;
let open = false;

afterEach(async () => {
  if (!open) return;
  open = false;
  await tdb.close();
});

const REQUESTED = new Date('2026-08-13T12:00:00.000Z');
const NAME = 'Coastline Insulation';

async function setup(): Promise<void> {
  tdb = await createPlatformDb();
  open = true;
  await seedTenant(tdb, {
    account: IDS.accountA,
    user: IDS.userA,
    project: IDS.projectA,
    band: 'over_100k',
    name: NAME,
  });
  await seedBilling(tdb, IDS.accountA, {
    planId: 'crew',
    priceCents: 24900,
    status: 'active',
    stateSince: REQUESTED,
    periodStart: new Date('2026-08-01T00:00:00Z'),
    periodEnd: new Date('2026-09-01T00:00:00Z'),
    customerId: 'cus_coastline',
  });

  const filing = uuidFor(0x0f, 1);
  await seedFiling(tdb, {
    id: filing,
    account: IDS.accountA,
    project: IDS.projectA,
    weekEnding: '2026-08-07',
    status: 'CERTIFIABLE',
    releasedAt: REQUESTED,
  });
  await tdb.client.query(
    `INSERT INTO artifacts (id, account_id, filing_id, kind, sha256, r2_key, byte_size, pii_class, provenance)
     VALUES ($1, $2, $3, 'wh347_pdf', decode(repeat('0a',32),'hex'), 'a/wh347.pdf', 10, 'non_pii', '{}'::jsonb),
            ($4, $2, $3, 'ecpr_xml',  decode(repeat('0b',32),'hex'), 'pii/ecpr/x.xml', 20, 'ssn_bearing', '{}'::jsonb)`,
    [uuidFor(0x1a, 1), IDS.accountA, filing, uuidFor(0x1b, 1)],
  );
  await tdb.client.query(
    `INSERT INTO workers (id, account_id, last_name, first_name, ssn_ciphertext, ssn_last4)
     VALUES ($1, $2, 'Alvarez', 'Rosa', decode('deadbeef','hex'), '1234')`,
    [uuidFor(0x2a, 1), IDS.accountA],
  );
  await tdb.client.query(
    `INSERT INTO accounts (id, name) VALUES ($1, 'Other Co') ON CONFLICT DO NOTHING`,
    [IDS.accountB],
  );
}

describe('the enumeration is the specification', () => {
  it('gives every erased entry a mechanism and every retained entry a reason and a clock', () => {
    for (const entry of DELETION_SCOPE) {
      expect(entry.mechanism.length).toBeGreaterThan(8);
      if (entry.disposition === 'retained') {
        // §5.5: "Not erased, and why — each with a NUMBER attached."
        expect(entry.retention).toBeTruthy();
        expect(entry.why).toBeTruthy();
      }
    }
    // Both halves are present. A scope with nothing retained would be the claim of
    // totality this product refuses to make.
    expect(DELETION_SCOPE.some((e) => e.disposition === 'erased')).toBe(true);
    expect(DELETION_SCOPE.some((e) => e.disposition === 'retained')).toBe(true);
  });

  it('refuses to claim that deletion is total, and states what is enforced instead', () => {
    expect(DELETION_BOUNDARY_STATEMENT).toContain('will not tell you that deletion is total');
    expect(DELETION_BOUNDARY_STATEMENT).toContain('no key exists that can decrypt');
    const preview = deletionPreview();
    expect(preview.lines).toHaveLength(DELETION_SCOPE.length);
    expect(preview.boundaryStatement).toBe(DELETION_BOUNDARY_STATEMENT);
  });

  it('quotes a backup window only when one has been measured', () => {
    expect(backupWindowSentence(null)).toContain('have not yet measured');
    expect(backupWindowSentence(null)).not.toMatch(/\b\d+ days\b/);
    expect(backupWindowSentence(new Date('2026-08-03T00:00:00Z'))).toContain('2026-08-03');
  });
});

describe('the request', () => {
  it('refuses a confirmation that is not the account name', async () => {
    await setup();
    const stripe = createFakeStripe();
    const result = await requestAccountDeletion(
      tdb.db,
      { accountId: IDS.accountA, requestedBy: IDS.userA, typedConfirmation: 'coastline' },
      { stripe, clock: fixedClock(REQUESTED) },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('name_mismatch');
  });

  it('accepts the name, cancels the subscription immediately, and states the date', async () => {
    await setup();
    const stripe = createFakeStripe();
    const result = await requestAccountDeletion(
      tdb.db,
      { accountId: IDS.accountA, requestedBy: IDS.userA, typedConfirmation: `  ${NAME}  ` },
      { stripe, clock: fixedClock(REQUESTED), exportKey: 'exports/a.zip' },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.record.effectiveAt.toISOString()).toBe('2026-08-20T12:00:00.000Z');
    expect(result.record.exportKey).toBe('exports/a.zip');

    // §12.4: she should not have to cancel first and then delete. Two-step
    // destruction is two chances to leave a subscription running.
    expect(stripe.callsTo('cancelSubscription')).toHaveLength(1);
    expect(stripe.callsTo('cancelSubscription')[0]?.payload['atPeriodEnd']).toBe(false);

    const queued = await tdb.client.query<{ template: string; payload: Record<string, unknown> }>(
      `SELECT template, payload FROM email_outbox WHERE account_id = $1`,
      [IDS.accountA],
    );
    expect(queued.rows[0]?.template).toBe('deletion_scheduled');
    expect(queued.rows[0]?.payload['undo_window_days']).toBe(UNDO_WINDOW_DAYS);
  });
});

describe('deletion honours the undo window', () => {
  async function schedule(): Promise<void> {
    await setup();
    const stripe = createFakeStripe();
    await requestAccountDeletion(
      tdb.db,
      { accountId: IDS.accountA, requestedBy: IDS.userA, typedConfirmation: NAME },
      { stripe, clock: fixedClock(REQUESTED) },
    );
  }

  it('is not due on day six', async () => {
    await schedule();
    const daySix = fixedClock(new Date(REQUESTED.getTime() + 6 * 86_400_000));
    expect(await dueDeletions(tdb.db, daySix.now())).toEqual([]);

    const result = await executeAccountDeletion(tdb.db, IDS.accountA, {
      stripe: createFakeStripe(),
      clock: daySix,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('not_due');

    // And the data is all still there, which is the point of the window.
    const workers = await tdb.client.query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM workers`);
    expect(Number(workers.rows[0]?.n)).toBe(1);
  });

  it('undoes on day six and never executes afterwards', async () => {
    await schedule();
    const daySix = fixedClock(new Date(REQUESTED.getTime() + 6 * 86_400_000));
    const undone = await undoAccountDeletion(tdb.db, IDS.accountA, daySix);
    expect(undone.ok).toBe(true);

    const account = await tdb.client.query<{ deletion_requested_at: string | null }>(
      `SELECT deletion_requested_at FROM accounts WHERE id = $1`,
      [IDS.accountA],
    );
    expect(account.rows[0]?.deletion_requested_at).toBeNull();

    const dayEight = fixedClock(new Date(REQUESTED.getTime() + 8 * 86_400_000));
    expect(await dueDeletions(tdb.db, dayEight.now())).toEqual([]);
    const result = await executeAccountDeletion(tdb.db, IDS.accountA, {
      stripe: createFakeStripe(),
      clock: dayEight,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('undone');
  });

  it('refuses an undo once the window has closed', async () => {
    await schedule();
    const dayEight = fixedClock(new Date(REQUESTED.getTime() + 8 * 86_400_000));
    const undone = await undoAccountDeletion(tdb.db, IDS.accountA, dayEight);
    expect(undone.ok).toBe(false);
    if (!undone.ok) expect(undone.reason).toBe('window_closed');
  });

  it('executes on day eight, erases what it promised and keeps what it said it would', async () => {
    await schedule();
    const stripe = createFakeStripe();
    const dayEight = fixedClock(new Date(REQUESTED.getTime() + 8 * 86_400_000));

    expect(await dueDeletions(tdb.db, dayEight.now())).toEqual([IDS.accountA]);
    const result = await executeAccountDeletion(tdb.db, IDS.accountA, { stripe, clock: dayEight });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // --- erased ---------------------------------------------------------
    const gone = async (table: string): Promise<number> => {
      const r = await tdb.client.query<{ n: string }>(
        `SELECT COUNT(*)::text AS n FROM ${table} WHERE account_id = $1`,
        [IDS.accountA],
      );
      return Number(r.rows[0]?.n);
    };
    expect(await gone('workers')).toBe(0);
    expect(await gone('memberships')).toBe(0);
    const ecpr = await tdb.client.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM artifacts WHERE pii_class = 'ssn_bearing'`,
    );
    expect(Number(ecpr.rows[0]?.n)).toBe(0);

    // The claim that IS made, because it is enforced: the key is destroyed, so any
    // residual ciphertext in a backup is permanently undecryptable.
    const account = await tdb.client.query<{
      name: string;
      status: string;
      data_key_uri: string | null;
      data_key_destroyed_at: string | null;
    }>(`SELECT name, status, data_key_uri, data_key_destroyed_at FROM accounts WHERE id = $1`, [
      IDS.accountA,
    ]);
    expect(account.rows[0]?.data_key_destroyed_at).not.toBeNull();
    expect(account.rows[0]?.data_key_uri).toBeNull();
    expect(account.rows[0]?.status).toBe('deleted');
    expect(account.rows[0]?.name).not.toBe(NAME);
    expect(account.rows[0]?.name).toContain('deleted-account-');

    // --- retained -------------------------------------------------------
    // The evidence layer of a signed federal certification survives, and so does
    // the non-PII artifact it points at.
    expect(await gone('filings')).toBe(1);
    const wh347 = await tdb.client.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM artifacts WHERE pii_class = 'non_pii'`,
    );
    expect(Number(wh347.rows[0]?.n)).toBe(1);

    // Stripe: we submit a redaction and report its state. We do not claim an
    // erasure Stripe has told us it will not perform.
    expect(stripe.callsTo('requestCustomerRedaction')).toHaveLength(1);
    const stripeLine = result.report.lines.find((l) => l.id === 'stripe_record');
    expect(stripeLine?.disposition).toBe('retained');
    expect(stripeLine?.note).toContain('Stripe');

    // --- the report renders from the same enumeration the screen renders from ---
    expect(result.report.lines.map((l) => l.id)).toEqual(DELETION_SCOPE.map((e) => e.id));
    expect(result.report.lines.map((l) => l.label)).toEqual(DELETION_SCOPE.map((e) => e.label));
    for (const line of result.report.lines) {
      if (line.disposition === 'erased') expect(typeof line.affected).toBe('number');
      else expect(line.affected).toBeNull();
    }
    expect(result.report.lines.find((l) => l.id === 'ssn_ciphertext')?.affected).toBe(1);

    // Persisted, so the account's own record of what ran is the same object.
    const stored = await readDeletion(tdb.db, IDS.accountA);
    expect(stored?.executedAt).not.toBeNull();
    expect((stored?.report as { lines?: unknown[] }).lines).toHaveLength(DELETION_SCOPE.length);
  });

  it('is idempotent: a second execution does nothing', async () => {
    await schedule();
    const dayEight = fixedClock(new Date(REQUESTED.getTime() + 8 * 86_400_000));
    await executeAccountDeletion(tdb.db, IDS.accountA, { stripe: createFakeStripe(), clock: dayEight });
    const second = await executeAccountDeletion(tdb.db, IDS.accountA, {
      stripe: createFakeStripe(),
      clock: dayEight,
    });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe('already_executed');
  });

  it('leaves the gate counters standing, de-identified rather than deleted', async () => {
    await schedule();
    // A metered filing, which is what G5's and A6's denominators are counted from.
    await tdb.client.query(
      `INSERT INTO meter_events (account_id, filing_id, idempotency_key)
       VALUES ($1, $2, 'meter:test')`,
      [IDS.accountA, uuidFor(0x0f, 1)],
    );
    const dayEight = fixedClock(new Date(REQUESTED.getTime() + 8 * 86_400_000));
    await executeAccountDeletion(tdb.db, IDS.accountA, { stripe: createFakeStripe(), clock: dayEight });

    const meter = await tdb.client.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM meter_events WHERE account_id = $1`,
      [IDS.accountA],
    );
    // "A product that can silently shrink its own denominator has no gates."
    expect(Number(meter.rows[0]?.n)).toBe(1);
  });
});
