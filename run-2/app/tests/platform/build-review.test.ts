/**
 * THE BUILD REVIEW'S AUTONOMY AND CLAIMS FINDINGS, EACH PINNED BY THE TEST THAT
 * WOULD HAVE CAUGHT IT.
 *
 * Sources: `run-2/phase-2-build/build-review/autonomy-degradation.md` (C1–C4, H1–H3)
 * and `build-review/claims-and-gates.md` (C-1–C-3, H-1–H-3). Every case below fails
 * against the code as it was reviewed and passes against the code as it now stands;
 * none of them asserts on a comment.
 *
 * The organising idea is the one the review itself lands on: the dangerous failures
 * were not wrong answers, they were states a customer could reach with no way
 * forward, and counters that could not move. Both are invisible to a suite that only
 * checks arithmetic, so they are checked here by driving the real functions.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fixedClock, mutableClock } from '../../src/platform/clock';
import { createFakeStripe } from '../../src/platform/billing/stripe-fake';
import { enforceOverageCap } from '../../src/platform/billing/meter';
import { readBillingAccount, recordPlanChange } from '../../src/platform/billing/account';
import {
  DELETION_ERASED,
  DELETION_RETAINED,
  DELETION_SCOPE,
  deletionPreview,
  normaliseAccountName,
  readAccountName,
  requestAccountDeletion,
} from '../../src/platform/account/deletion';
import { buildExport, createZipSink } from '../../src/platform/account/export';
import { crc32 } from '../../src/platform/account/zip';
import {
  readGate,
  recordAcceptanceConfirmation,
  recordCanaryRun,
  recordChaosCreditRun,
  recordFilingDuration,
} from '../../src/platform/ops/gates';
import { recordInboundMessage } from '../../src/platform/ops/inbound';
import { openIncident } from '../../src/platform/ops/incidents';
import type { TestDb } from '../helpers/pglite';
import { createPlatformDb, seedBilling, seedFiling, seedTenant, uuidFor, IDS } from './helpers';

let tdb!: TestDb;
let open = false;

afterEach(async () => {
  if (!open) return;
  open = false;
  await tdb.close();
});

const NOW = new Date('2026-08-13T12:00:00.000Z');
const CLOCK = fixedClock(NOW);

async function setup(name = 'Coastline Insulation'): Promise<void> {
  tdb = await createPlatformDb();
  open = true;
  await seedTenant(tdb, {
    account: IDS.accountA,
    user: IDS.userA,
    project: IDS.projectA,
    band: 'over_100k',
    name,
  });
}

// ===========================================================================
// autonomy C3 — the deletion screen told her to type a name the server rejected
// ===========================================================================

describe('the deletion confirmation can actually be completed', () => {
  it('offers the name that the comparison accepts, for THIS account', async () => {
    await setup('Deleter Review');
    // A second account exists, and its row sorts first — which is exactly the
    // condition under which the screen's old `SELECT name FROM accounts LIMIT 1`
    // printed somebody else's name and made the deletion uncompletable with no
    // support address to ask about it.
    await seedTenant(tdb, {
      account: IDS.accountB,
      user: IDS.userB,
      project: IDS.projectB,
      band: 'over_100k',
      name: 'Aaaa Other Company',
    });

    const shown = await readAccountName(tdb.db, IDS.accountA);
    expect(shown).toBe('Deleter Review');

    const outcome = await requestAccountDeletion(
      tdb.db,
      { accountId: IDS.accountA, requestedBy: IDS.userA, typedConfirmation: shown ?? '' },
      { stripe: createFakeStripe(), clock: CLOCK },
    );
    expect(outcome.ok).toBe(true);
  });

  it('compares after trimming and case-folding and in no other way', () => {
    expect(normaliseAccountName('  Deleter   Review ')).toBe('deleter review');
    expect(normaliseAccountName('DELETER REVIEW')).toBe(normaliseAccountName('deleter review'));
  });
});

// ===========================================================================
// claims C-3 + the recorded §12.2/§5.5 divergence — one enumeration, four renderers
// ===========================================================================

describe('what deletion erases is stated once and rendered everywhere', () => {
  it('keeps the retained entries retained, with a duration and a reason each', () => {
    const retained = DELETION_SCOPE.filter((entry) => entry.disposition === 'retained');
    for (const id of ['filings_and_artifacts', 'last4_and_names_in_artifacts', 'projects_and_pins']) {
      const entry = retained.find((row) => row.id === id);
      expect(entry, `${id} must be retained per ARCHITECTURE §5.5`).toBeDefined();
      expect(entry?.retention?.length ?? 0).toBeGreaterThan(0);
      expect(entry?.why?.length ?? 0).toBeGreaterThan(0);
    }
    expect(DELETION_ERASED.length + DELETION_RETAINED.length).toBe(DELETION_SCOPE.length);
  });

  it('renders the same labels on /legal, on the confirmation screen and in the report', () => {
    // The two screens are source-read rather than rendered here because they are
    // server components; what is asserted is that neither contains a SECOND list —
    // both must map over the enumeration, and `/legal`'s old hardcoded prose (which
    // promised erasure of the three entries above) must not come back.
    const legal = readFileSync(
      join(process.cwd(), 'src/app/(marketing)/legal/page.tsx'),
      'utf8',
    );
    const screen = readFileSync(
      join(process.cwd(), 'src/app/(app)/app/settings/data/page.tsx'),
      'utf8',
    );
    expect(legal).toContain('DELETION_ERASED.map');
    expect(legal).toContain('DELETION_RETAINED.map');
    expect(screen).toContain('report.lines.map');
    expect(legal).not.toMatch(/Every project, pin, payroll line, filing and artifact/);

    // And the report the executor produces carries every entry, retained included —
    // a report listing only what was destroyed reads as a claim of totality.
    const preview = deletionPreview();
    expect(preview.lines.map((line) => line.id)).toEqual(DELETION_SCOPE.map((entry) => entry.id));
    expect(preview.lines.filter((line) => line.disposition === 'retained').length).toBe(
      DELETION_RETAINED.length,
    );
  });
});

// ===========================================================================
// autonomy H2 — the overage job was not idempotent and undid the one-click revert
// ===========================================================================

describe('the overage cap charges once per crossing and respects the revert', () => {
  const PERIOD_START = new Date('2026-08-01T00:00:00.000Z');
  const PERIOD_END = new Date('2026-09-01T00:00:00.000Z');

  async function overageSetup(): Promise<void> {
    await setup();
    await seedBilling(tdb, IDS.accountA, {
      planId: 'solo',
      priceCents: 9900,
      status: 'active',
      stateSince: PERIOD_START,
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
    });
    // Ninety released filings, metered — far past Solo's allowance, so `atCap` is
    // true and the job's only remaining question is whether it has already acted.
    for (let n = 0; n < 90; n += 1) {
      await seedFiling(tdb, {
        id: uuidFor(0xfeed, n),
        account: IDS.accountA,
        project: IDS.projectA,
        weekEnding: '2026-08-08',
        status: 'CERTIFIABLE',
        sequence: n + 1,
      });
      await tdb.client.query(
        `INSERT INTO meter_events (account_id, filing_id, at, quantity, idempotency_key)
         VALUES ($1, $2, $3, 1, $4)`,
        [IDS.accountA, uuidFor(0xfeed, n), new Date(PERIOD_START.getTime() + 3600_000).toISOString(), `m:${String(n)}`],
      );
    }
  }

  it('calls Stripe once across three hourly runs before the webhook lands', async () => {
    await overageSetup();
    const stripe = createFakeStripe();
    const clock = mutableClock(new Date('2026-08-14T14:00:00.000Z'));
    let calls = 0;
    const counting = {
      ...stripe,
      updateSubscriptionPrice: async (input: Parameters<typeof stripe.updateSubscriptionPrice>[0]) => {
        calls += 1;
        return stripe.updateSubscriptionPrice(input);
      },
    };

    for (let hour = 0; hour < 3; hour += 1) {
      const account = await readBillingAccount(tdb.db, IDS.accountA);
      expect(account).not.toBeNull();
      await enforceOverageCap(tdb.db, account!, {
        stripe: counting,
        clock,
        priceIdFor: () => 'price_crew',
      });
      clock.advanceHours(1);
    }

    // One crossing, one proration. `account.planId` never moves in this test —
    // that is the point: it moves on `customer.subscription.updated`, and the job
    // ran three times before it arrived.
    expect(calls).toBe(1);
    const rows = await tdb.client.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM plan_changes WHERE kind = 'auto_upgrade'`,
    );
    expect(Number(rows.rows[0]?.n)).toBe(1);
  });

  it('does not re-upgrade an account that used the revert button this period', async () => {
    await overageSetup();
    const stripe = createFakeStripe();
    const clock = mutableClock(new Date('2026-08-14T14:00:00.000Z'));

    // She was upgraded, and she pressed "Put me back on solo".
    await recordPlanChange(
      tdb.db,
      {
        accountId: IDS.accountA,
        fromPlanId: 'solo',
        toPlanId: 'crew',
        kind: 'auto_upgrade',
        effectiveAt: clock.now(),
      },
      clock,
    );
    await recordPlanChange(
      tdb.db,
      {
        accountId: IDS.accountA,
        fromPlanId: 'crew',
        toPlanId: 'solo',
        kind: 'revert',
        effectiveAt: clock.now(),
      },
      clock,
    );

    clock.advanceHours(1);
    const account = await readBillingAccount(tdb.db, IDS.accountA);
    const outcome = await enforceOverageCap(tdb.db, account!, {
      stripe,
      clock,
      priceIdFor: () => 'price_crew',
    });

    expect(outcome.upgraded).toBe(false);
    expect(outcome.skipped).toBe('customer_reverted_this_period');
  });
});

// ===========================================================================
// claims C-1 / C-2 / H-3 — the counters that could not move, and the streaks that
// counted gaps as passes
// ===========================================================================

describe('G5 is clearable by being autonomous rather than by being contacted', () => {
  it('unlocks on ninety days of zero inbound at fifty paying accounts', async () => {
    await setup();
    for (let n = 0; n < 55; n += 1) {
      await tdb.client.query(
        `INSERT INTO accounts (id, name, status, created_at) VALUES ($1, $2, 'active', now())
         ON CONFLICT (id) DO NOTHING`,
        [uuidFor(0xbeef, n), `Paying ${String(n)}`],
      );
      await tdb.client.query(
        `INSERT INTO billing_account_index
           (account_id, stripe_customer_id, plan_id, price_cents, entitlement_state,
            subscription_status, state_since, current_period_start, current_period_end)
         VALUES ($1, $2, 'solo', 9900, 'full', 'active', now(), now(), now() + interval '30 days')
         ON CONFLICT (account_id) DO NOTHING`,
        [uuidFor(0xbeef, n), `cus_${String(n)}`],
      );
    }

    const reading = await readGate(tdb.db, 'G5', CLOCK);
    // The old query grouped on `received_at`, so a day with no message produced no
    // row and did not count as a day under the ceiling: perfect autonomy returned
    // `consecutiveDays: 0` and the gate could only be cleared by receiving mail.
    expect(reading.consecutiveDays).toBeGreaterThanOrEqual(90);
    expect(reading.state).toBe('unlocked');
  });

  it('breaks the streak on a day that is actually over the ceiling', async () => {
    await setup();
    await tdb.client.query(
      `INSERT INTO billing_account_index
         (account_id, stripe_customer_id, plan_id, price_cents, entitlement_state,
          subscription_status, state_since, current_period_start, current_period_end)
       VALUES ($1, 'cus_one', 'solo', 9900, 'full', 'active', now(), now(), now() + interval '30 days')`,
      [IDS.accountA],
    );
    // One paying account and one long message today: 30 minutes/customer/month,
    // well over the ceiling of 2.
    await recordInboundMessage(tdb.db, { address: 'billing@ratepin.com', receivedAt: NOW }, CLOCK);

    const reading = await readGate(tdb.db, 'G5', CLOCK);
    expect(reading.consecutiveDays).toBe(0);
  });
});

describe('a consecutive-day streak is consecutive, and anchored to now', () => {
  it('refuses to unlock G1 on thirty green runs one a month, last seen a year ago', async () => {
    await setup();
    const clock = mutableClock(new Date('2023-01-01T03:00:00.000Z'));
    for (let n = 0; n < 30; n += 1) {
      await recordCanaryRun(
        tdb.db,
        {
          buildSha: 'sparse',
          corpusSnapshotId: null,
          trigger: 'ci',
          total: 600,
          passed: 600,
          distinctWds: 30,
          distinctStates: 10,
          firstDivergence: null,
        },
        clock,
      );
      clock.advanceHours(24 * 30);
    }

    const reading = await readGate(tdb.db, 'G1', CLOCK);
    expect(reading.state).not.toBe('unlocked');
    // A gap is a break, so thirty monthly runs are a streak of one.
    expect(reading.consecutiveDays).toBeLessThan(30);
    // And the instrument itself is stale, which is its own threshold.
    const freshness = reading.thresholds.find((t) => t.name.includes('canary run in the last'));
    expect(freshness?.met).toBe(false);
  });

  it('unlocks G1 on thirty contiguous green days ending today', async () => {
    await setup();
    const clock = mutableClock(new Date(NOW.getTime() - 29 * 86_400_000));
    for (let n = 0; n < 30; n += 1) {
      await recordCanaryRun(
        tdb.db,
        {
          buildSha: 'dense',
          corpusSnapshotId: null,
          trigger: 'post_deploy',
          total: 600,
          passed: 600,
          distinctWds: 30,
          distinctStates: 10,
          firstDivergence: null,
        },
        clock,
      );
      clock.advanceHours(24);
    }

    const reading = await readGate(tdb.db, 'G1', CLOCK);
    expect(reading.consecutiveDays).toBe(30);
    expect(reading.state).toBe('unlocked');
  });
});

describe('the four gates that had no writer now have one', () => {
  it('records a filing duration and moves G4 off nothing', async () => {
    await setup();
    await tdb.client.query(
      `INSERT INTO payroll_weeks (id, account_id, project_id, week_ending, workweek_start_day,
                                  contract_value_band)
       VALUES ($1, $2, $3, '2026-08-08', 1, 'over_100k')`,
      [uuidFor(0xaa, 1), IDS.accountA, IDS.projectA],
    );
    await seedFiling(tdb, {
      id: uuidFor(0xab, 1),
      account: IDS.accountA,
      project: IDS.projectA,
      weekEnding: '2026-08-08',
      status: 'CERTIFIABLE',
    });

    const recorded = await recordFilingDuration(tdb.db, {
      accountId: IDS.accountA,
      filingId: uuidFor(0xab, 1),
      uploadAt: new Date(NOW.getTime() - 240_000),
      artifactAt: NOW,
      realFiling: true,
    });
    expect(recorded.recorded).toBe(true);
    expect(recorded.seconds).toBe(240);

    const reading = await readGate(tdb.db, 'G4', CLOCK);
    expect(reading.measured).toBe(240);
    expect(reading.denominator).toBe(1);
    // One filing is evidence, not a cleared gate.
    expect(reading.state).toBe('measuring');
  });

  it('records a chaos credit run and lets G6 count the scales it fired at', async () => {
    await setup();
    const opened = await openIncident(
      tdb.db,
      {
        signal: { kind: 'freshness_stale' },
        level: 'L2_STALE',
        scope: 'chaos-drill',
        cause: 'scheduled chaos drill of the staleness credit path',
        detail: { chaos_test: true },
      },
      CLOCK,
    );
    const incidentId = opened.id;

    const credits: { id: number; accountId: string }[] = [];
    for (let n = 0; n < 3; n += 1) {
      await tdb.client.query(
        `INSERT INTO accounts (id, name, status, created_at) VALUES ($1, $2, 'active', now())
         ON CONFLICT (id) DO NOTHING`,
        [uuidFor(0xcafe, n), `Credited ${String(n)}`],
      );
      const row = await tdb.client.query<{ id: number }>(
        `INSERT INTO credits (account_id, incident_id, cents, reason, idempotency_key, created_at)
         VALUES ($1, $2, 100, 'corpus_staleness', $3, now()) RETURNING id`,
        [uuidFor(0xcafe, n), incidentId, `chaos:${String(n)}`],
      );
      credits.push({ id: Number(row.rows[0]?.id), accountId: uuidFor(0xcafe, n) });
    }

    const result = await recordChaosCreditRun(
      tdb.db,
      { incidentId, verifiedAt: new Date(NOW.getTime() - 4 * 86_400_000), credits },
      CLOCK,
    );
    expect(result.windows).toBe(3);

    // Idempotent: the drill runs weekly and must record one window per account per
    // incident however often it runs.
    await recordChaosCreditRun(
      tdb.db,
      { incidentId, verifiedAt: new Date(NOW.getTime() - 4 * 86_400_000), credits },
      CLOCK,
    );
    const windows = await tdb.client.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM staleness_windows WHERE chaos_test`,
    );
    expect(Number(windows.rows[0]?.n)).toBe(3);

    const reading = await readGate(tdb.db, 'G6', CLOCK);
    // Three accounts is the SMALL scale. One of two, so the gate stays shut — which
    // is the MED-3 correction: a drill that only fires where the ceiling is
    // comfortable has not tested the guarantee.
    expect(reading.measured).toBe(1);
    expect(reading.state).toBe('measuring');
  });
});

// ===========================================================================
// claims H-4 — the evidence for G2 and G4 was editable by the tier that reports it
// ===========================================================================

/**
 * `filing_durations` is G4's every reading and `form_acceptance_confirmations` is
 * the whole of G2, and the shared RLS helper handed `ratepin_app` `UPDATE` and
 * `DELETE` on both by default. A gate whose evidence the web tier can edit is not a
 * gate; it is a preference with a number next to it. Both mechanisms are asserted
 * here, because either alone is a convention: no mutating grant, so the application
 * cannot try — and a trigger, so not even the owner succeeds.
 */
describe('the two tables the gates are measured on are append-only', () => {
  async function seedEvidence(): Promise<string> {
    await setup();
    const filing = uuidFor(0xac, 1);
    await tdb.client.query(
      `INSERT INTO payroll_weeks (id, account_id, project_id, week_ending, workweek_start_day,
                                  contract_value_band)
       VALUES ($1, $2, $3, '2026-08-08', 1, 'over_100k')`,
      [uuidFor(0xad, 1), IDS.accountA, IDS.projectA],
    );
    await seedFiling(tdb, {
      id: filing,
      account: IDS.accountA,
      project: IDS.projectA,
      weekEnding: '2026-08-08',
      status: 'CERTIFIABLE',
    });
    await recordFilingDuration(tdb.db, {
      accountId: IDS.accountA,
      filingId: filing,
      uploadAt: new Date(NOW.getTime() - 600_000),
      artifactAt: NOW,
      realFiling: true,
    });
    await recordAcceptanceConfirmation(
      tdb.db,
      {
        id: uuidFor(0xae, 1),
        accountId: IDS.accountA,
        filingId: filing,
        artifactKind: 'wh347_pdf',
        receiver: 'gc',
        accepted: true,
      },
      CLOCK,
    );
    return filing;
  }

  it('holds no UPDATE or DELETE grant for the application role', async () => {
    await seedEvidence();
    const rows = await tdb.client.query<{ table_name: string; privilege_type: string }>(
      `SELECT table_name, privilege_type FROM information_schema.table_privileges
        WHERE grantee = 'ratepin_app'
          AND table_name IN ('filing_durations', 'form_acceptance_confirmations')
        ORDER BY table_name, privilege_type`,
    );
    expect(rows.rows.map((r) => `${r.table_name}:${r.privilege_type}`)).toEqual([
      'filing_durations:INSERT',
      'filing_durations:SELECT',
      'form_acceptance_confirmations:INSERT',
      'form_acceptance_confirmations:SELECT',
    ]);
  });

  it('refuses the edit at the database, even for the owner', async () => {
    await seedEvidence();
    // As the OWNER — the role that holds every grant there is. The trigger is what
    // makes the rule survive a migration, a psql session and a future grant.
    for (const statement of [
      `UPDATE filing_durations SET seconds = 1`,
      `DELETE FROM filing_durations`,
      `UPDATE form_acceptance_confirmations SET accepted = true`,
      `DELETE FROM form_acceptance_confirmations`,
    ]) {
      const thrown = await tdb.client.query(statement).then(
        () => null,
        (error: unknown) => String(error),
      );
      expect(thrown, `ACCEPTED: ${statement}`).toMatch(/append-only/);
    }
  });

  it('still accepts the INSERTs the two writers actually make', async () => {
    const filing = await seedEvidence();
    // Both writers are idempotent by ON CONFLICT … DO NOTHING, which is an INSERT
    // that writes nothing rather than an UPDATE — so re-running them must not trip
    // the trigger. This is the case that would have broken if append-only had been
    // implemented as a blanket rule instead of read out of the writers.
    const again = await recordFilingDuration(tdb.db, {
      accountId: IDS.accountA,
      filingId: filing,
      uploadAt: new Date(NOW.getTime() - 60_000),
      artifactAt: NOW,
      realFiling: true,
    });
    expect(again.recorded).toBe(false);
    await recordAcceptanceConfirmation(
      tdb.db,
      {
        id: uuidFor(0xae, 1),
        accountId: IDS.accountA,
        filingId: filing,
        artifactKind: 'wh347_pdf',
        receiver: 'gc',
        accepted: false,
      },
      CLOCK,
    );
    const kept = await tdb.client.query<{ seconds: number; accepted: boolean }>(
      `SELECT d.seconds, c.accepted
         FROM filing_durations d, form_acceptance_confirmations c
        WHERE d.filing_id = $1 AND c.filing_id = $1`,
      [filing],
    );
    expect(Number(kept.rows[0]?.seconds)).toBe(600);
    expect(kept.rows[0]?.accepted).toBe(true);
  });
});

// ===========================================================================
// autonomy C4 — the export button produced a string
// ===========================================================================

describe('the export is a file the customer receives', () => {
  it('produces a real ZIP whose entries are the bundle', async () => {
    await setup();
    const sink = createZipSink();
    const bundle = await buildExport(tdb.db, IDS.accountA, { sink, clock: CLOCK });
    const bytes = sink.finish(bundle.generatedAt);

    // Local file header, central directory, end-of-central-directory: a reader that
    // does not find all three has not been given an archive.
    expect(Buffer.from(bytes.slice(0, 4)).toString('hex')).toBe('504b0304');
    expect(Buffer.from(bytes).includes(Buffer.from('504b0506', 'hex'))).toBe(true);
    expect(Buffer.from(bytes).includes(Buffer.from('manifest.json'))).toBe(true);
    expect(Buffer.from(bytes).includes(Buffer.from('README.txt'))).toBe(true);
    expect(bytes.length).toBeGreaterThan(200);

    // Byte-deterministic: nothing in the writer reads a clock or an RNG.
    const second = createZipSink();
    const again = await buildExport(tdb.db, IDS.accountA, { sink: second, clock: CLOCK });
    expect(Buffer.from(second.finish(again.generatedAt)).equals(Buffer.from(bytes))).toBe(true);
  });

  it('computes the CRC-32 the format requires', () => {
    // The published check value for "123456789".
    expect(crc32(new Uint8Array(Buffer.from('123456789')))).toBe(0xcbf4_3926);
  });

  it('names every entry it could not include, rather than dropping it', async () => {
    await setup();
    const sink = createZipSink();
    const bundle = await buildExport(tdb.db, IDS.accountA, { sink, clock: CLOCK });
    for (const entry of bundle.entries) {
      if (entry.included) continue;
      expect(entry.note?.length ?? 0).toBeGreaterThan(20);
      expect(entry.sha256.length).toBeGreaterThan(0);
    }
  });
});
