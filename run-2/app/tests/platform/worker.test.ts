/**
 * THE WORKER — idempotent scheduling, fail-closed jobs, and a ledger that records
 * both.
 *
 * Spec: ARCHITECTURE.md §7 (the scheduler), §7.1 (the schedule), §8 (fail closed),
 * §10.1 (I7 — no alerting), §10.4 ("worker crash mid-job → lease expires, job
 * re-claimed, idempotency key prevents double effects").
 *
 * The cases are written against the three failures an unattended scheduler actually
 * has: it runs twice, it dies halfway, and it starts throwing at 03:00 on a Sunday
 * with nobody watching. The last one is the one the whole design is for — the
 * assertion is not that the job recovers, it is that its failure leaves the product
 * in the state a customer can survive.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { createFakeStripe } from '../../src/platform/billing/stripe-fake';
import { createRecordingMailer } from '../../src/platform/ops/outbox';
import { createRecordingSink } from '../../src/platform/account/export';
import { openIncidents } from '../../src/platform/ops/incidents';
import { readStatus } from '../../src/platform/ops/status';
import { fixedClock, mutableClock } from '../../src/platform/clock';
import { getConfig } from '../../src/lib/config';
import {
  JOB_REGISTRY,
  claimJobs,
  enqueue,
  engineCanary,
  jobByKind,
  runOneJob,
  scheduleDueJobs,
  slotFor,
  tick,
  type WorkerDeps,
} from '../../src/worker';
import { describeSchedule, etWallClockToInstant, inDirCycleWindow, partsInEt } from '../../src/worker/schedule';
import type { TestDb } from '../helpers/pglite';
import { createPlatformDb, seedPromotedSnapshot, seedTenant, IDS } from './helpers';

let tdb!: TestDb;
let open = false;

afterEach(async () => {
  if (!open) return;
  open = false;
  await tdb.close();
});

const NOW = new Date('2026-08-13T12:00:00.000Z');

function depsFor(clock = fixedClock(NOW)): WorkerDeps {
  return {
    db: tdb.db,
    clock,
    config: getConfig(),
    stripe: createFakeStripe(),
    mailer: createRecordingMailer(),
    canary: engineCanary(),
    ingest: null,
    probes: null,
    backups: null,
    retention: null,
    exportSink: createRecordingSink(),
    buildSha: 'test-build',
  };
}

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
}

describe('the registry declares what §7.1 requires it to declare', () => {
  it('gives every job a cadence, a fail-closed sentence, and a handler', () => {
    for (const job of JOB_REGISTRY) {
      expect(job.kind).toMatch(/^[a-z][a-z.]+$/);
      expect(describeSchedule(job.schedule).length).toBeGreaterThan(3);
      // The field that closes the "what happens when it fails" question at the
      // point where somebody could otherwise leave it open.
      expect(job.failsClosedBy.length).toBeGreaterThan(20);
      expect(typeof job.run).toBe('function');
    }
  });

  it('covers the jobs the schedule names', () => {
    const kinds = JOB_REGISTRY.map((j) => j.kind);
    for (const required of [
      'ingest.corpus.nightly',
      'canary.golden',
      'ingest.ecfr',
      'ingest.dir.xsd',
      'freshness.sweep',
      'billing.credit',
      'billing.dunning',
      'billing.replay',
      'outbox.drain',
      'retention.sweep',
      'backup.verify',
      'account.deletion.execute',
    ]) {
      expect(kinds).toContain(required);
    }
  });

  it('routes every declared failure signal to one of exactly four automatic responses', () => {
    // I7 as a type: `respond` is total over a closed union with no NOTIFY member, so
    // a job cannot declare a signal that means "tell somebody".
    for (const job of JOB_REGISTRY) {
      if (!job.signalOnFailure) continue;
      expect(['canary_red', 'xsd_hash_mismatch', 'wd_quarantine', 'index_count_delta']).toContain(
        job.signalOnFailure.kind,
      );
    }
  });
});

describe('schedules are slots, not timers', () => {
  it('puts the nightly run at 02:00 Eastern, through both offsets', () => {
    const schedule = { kind: 'daily', hourEt: 2, minuteEt: 0 } as const;

    // Mid-August: Eastern is UTC-4, so 02:00 ET is 06:00 UTC.
    const summer = slotFor(schedule, new Date('2026-08-13T12:00:00Z'));
    expect(summer?.slot).toBe('2026-08-13');
    expect(summer?.openedAt.toISOString()).toBe('2026-08-13T06:00:00.000Z');

    // Mid-January: Eastern is UTC-5, so 02:00 ET is 07:00 UTC. A schedule stored as
    // a UTC hour would have drifted by one; this one does not.
    const winter = slotFor(schedule, new Date('2026-01-15T12:00:00Z'));
    expect(winter?.slot).toBe('2026-01-15');
    expect(winter?.openedAt.toISOString()).toBe('2026-01-15T07:00:00.000Z');

    // Before the slot opens, the current slot is still yesterday's.
    const early = slotFor(schedule, new Date('2026-08-13T05:00:00Z'));
    expect(early?.slot).toBe('2026-08-12');
  });

  it('resolves the spring-forward gap to a real instant, once, on the right day', () => {
    // 2026-03-08 02:00 ET does not exist: the clock jumps from 01:59:59 EST to
    // 03:00:00 EDT. The requirement on a nightly job is not that it lands on a
    // particular minute; it is that it runs EXACTLY ONCE on that calendar day. This
    // resolution lands at 01:00 EST — an hour early, one night a year — and the
    // slot is still named for the ET date, so it is enqueued once and only once.
    const resolved = etWallClockToInstant({ year: 2026, month: 3, day: 8, hour: 2, minute: 0 });
    expect(Number.isNaN(resolved.getTime())).toBe(false);
    expect(partsInEt(resolved).day).toBe(8);

    const schedule = { kind: 'daily', hourEt: 2, minuteEt: 0 } as const;
    const slots = new Set<string>();
    // Every hour of the transition day resolves to one of two slot names — the
    // transition day and the day before it — and never to none.
    for (let hour = 0; hour < 24; hour += 1) {
      const slot = slotFor(schedule, new Date(Date.UTC(2026, 2, 8, hour)));
      expect(slot).not.toBeNull();
      if (slot) slots.add(slot.slot);
    }
    expect([...slots].sort()).toEqual(['2026-03-07', '2026-03-08']);
  });

  it('tightens the DIR schema check around the publication cycle dates', () => {
    expect(inDirCycleWindow(new Date('2026-08-20T12:00:00Z'))).toBe(true);
    expect(inDirCycleWindow(new Date('2026-02-16T12:00:00Z'))).toBe(true);
    expect(inDirCycleWindow(new Date('2026-05-01T12:00:00Z'))).toBe(false);
  });

  it('returns no slot for an on-demand job, so the clock never enqueues it', () => {
    expect(slotFor({ kind: 'onDemand' }, NOW)).toBeNull();
  });
});

describe('scheduling is idempotent', () => {
  it('enqueues one job per slot however many workers are running', async () => {
    await setup();
    const clock = fixedClock(NOW);

    const first = await scheduleDueJobs({ db: tdb.db, clock });
    const second = await scheduleDueJobs({ db: tdb.db, clock });
    const third = await scheduleDueJobs({ db: tdb.db, clock });

    expect(first.enqueued.length).toBeGreaterThan(0);
    expect(second.enqueued).toHaveLength(0);
    expect(third.enqueued).toHaveLength(0);
    expect(second.alreadyQueued.length).toBe(first.enqueued.length);

    const rows = await tdb.client.query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM jobs`);
    expect(Number(rows.rows[0]?.n)).toBe(first.enqueued.length);
  });

  it('enqueues the missed slot exactly once when the scheduler was down', async () => {
    await setup();
    const clock = mutableClock(NOW);
    await scheduleDueJobs({ db: tdb.db, clock });

    // Two hours later, having missed the hourly slots in between: the current slot
    // is enqueued, once, and dated to when it OPENED rather than to now.
    clock.advanceHours(2);
    const late = await scheduleDueJobs({ db: tdb.db, clock });
    expect(late.enqueued.some((k) => k.startsWith('freshness.sweep:'))).toBe(true);

    const again = await scheduleDueJobs({ db: tdb.db, clock });
    expect(again.enqueued).toHaveLength(0);
  });
});

describe('a job that throws fails closed', () => {
  it('records the failure, reschedules with backoff, opens the declared incident, and pages nobody', async () => {
    await setup();
    const deps = depsFor();

    // The failure is injected through the PORT rather than through a fake job, so
    // what is exercised is a real registry entry — `canary.golden`, which is the one
    // job whose failure rolls a release back — taking the same path a scheduled run
    // takes. A test-only job definition would prove the harness works.
    expect(jobByKind('canary.golden')).not.toBeNull();
    await enqueue(tdb.db, { kind: 'canary.golden', idempotencyKey: 'canary.golden:manual' }, deps.clock);
    const claimed = await claimJobs(tdb.db, { clock: deps.clock });
    expect(claimed).toHaveLength(1);

    // Swap the canary for one that throws, which is the failure the real job has.
    const failing: WorkerDeps = {
      ...deps,
      canary: () => {
        throw new Error('upstream returned 500');
      },
    };
    const report = await runOneJob(failing, claimed[0]!);
    expect(report.outcome).toBe('failed_closed');
    expect(report.error).toContain('upstream returned 500');

    const runs = await tdb.client.query<{ outcome: string; error: string }>(
      `SELECT outcome, error FROM job_runs WHERE kind = 'canary.golden'`,
    );
    expect(runs.rows[0]?.outcome).toBe('failed_closed');

    // Back in the queue with a later run_after, not lost and not retried instantly.
    const job = await tdb.client.query<{ state: string; run_after: string; attempts: number }>(
      `SELECT state, run_after, attempts FROM jobs WHERE kind = 'canary.golden'`,
    );
    expect(job.rows[0]?.state).toBe('ready');
    expect(new Date(job.rows[0]!.run_after).getTime()).toBeGreaterThan(deps.clock.now().getTime());

    // The incident's automatic response is one of four verbs, and none of them is
    // "notify". There is no pager in this system to assert the absence of, so the
    // assertion is on the column that would have to carry one.
    const incidents = await openIncidents(tdb.db);
    expect(incidents).toHaveLength(1);
    expect(incidents[0]?.autoResponse).toBe('rollback_release');
    expect(['degrade_claim', 'freeze_promotion', 'credit_customer', 'rollback_release']).toContain(
      incidents[0]?.autoResponse,
    );
  });

  it('stops retrying after five attempts instead of escalating', async () => {
    await setup();
    const deps = depsFor();
    const failing: WorkerDeps = {
      ...deps,
      canary: () => {
        throw new Error('still broken');
      },
    };
    await enqueue(tdb.db, { kind: 'canary.golden', idempotencyKey: 'canary.golden:manual' }, deps.clock);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      // Rewind past the backoff explicitly, against the injected clock rather than
      // against wall time — a test that depends on `now()` is a test that passes in
      // the morning.
      await tdb.client.query(
        `UPDATE jobs SET state = 'ready', run_after = timestamptz '2026-08-01 00:00:00Z'`,
      );
      const claimed = await claimJobs(tdb.db, { clock: deps.clock });
      if (claimed.length === 0) break;
      await runOneJob(failing, claimed[0]!);
    }

    const job = await tdb.client.query<{ state: string }>(`SELECT state FROM jobs`);
    expect(job.rows[0]?.state).toBe('dead');

    // A dead job is a row the status page renders. Nothing else consumes it,
    // because the customer-visible response to a dead ingest is the freshness
    // ladder rather than a fixed ingest.
    const status = await readStatus(
      tdb.db,
      { datedHours: 24, slaHours: 72, creditFloorCents: 100, creditCeilingPct: 100 },
      deps.clock,
    );
    expect(status.jobs.find((j) => j.kind === 'canary.golden')?.consecutiveFailures).toBeGreaterThan(0);
  });
});

describe('a crashed attempt is re-claimable, and the ledger says so', () => {
  it('returns an expired lease to the pool with a lease_expired row', async () => {
    await setup();
    const clock = mutableClock(NOW);
    await enqueue(tdb.db, { kind: 'outbox.drain', idempotencyKey: 'outbox.drain:manual' }, clock);
    await claimJobs(tdb.db, { clock, leaseSeconds: 60 });

    clock.advanceHours(1);
    const report = await tick(depsFor(clock));
    expect(report.reclaimed).toBeGreaterThanOrEqual(1);

    const runs = await tdb.client.query<{ outcome: string }>(
      `SELECT outcome FROM job_runs WHERE kind = 'outbox.drain' ORDER BY id`,
    );
    expect(runs.rows.map((r) => r.outcome)).toContain('lease_expired');
    // Re-claimed and run in the same tick, so a crash costs one poll interval.
    expect(runs.rows.map((r) => r.outcome)).toContain('ok');
  });
});

describe('a full tick', () => {
  it('schedules, claims, runs and records every due job without an upstream', async () => {
    await setup();
    await seedPromotedSnapshot(tdb, {
      ref: 'cs_2026-08-13T06:00Z',
      promotedAt: new Date('2026-08-13T06:00:00Z'),
    });
    const clock = fixedClock(NOW);
    const report = await tick(depsFor(clock), { limit: 50 });

    expect(report.ran.length).toBeGreaterThan(0);
    expect(report.ran.every((r) => r.outcome === 'ok')).toBe(true);

    // The jobs with no configured upstream report that they did not run, rather
    // than inventing data — which is the same customer-visible outcome as an
    // upstream that is down.
    const runs = await tdb.client.query<{ kind: string; detail: Record<string, unknown> }>(
      `SELECT kind, detail FROM job_runs ORDER BY kind`,
    );
    const ecfr = runs.rows.find((r) => r.kind === 'ingest.ecfr');
    expect(ecfr?.detail['performed']).toBe(false);
    expect(ecfr?.detail['reason']).toBe('no_upstream_configured');

    // The freshness sweep is a pure function of timestamps and always performs.
    const freshness = runs.rows.find((r) => r.kind === 'freshness.sweep');
    expect(freshness?.detail['performed']).toBe(true);
    expect(freshness?.detail['blocks_filing']).toBe(false);

    // G1's counter was written by the canary job, and the gate read from it.
    const canary = await tdb.client.query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM canary_runs`);
    expect(Number(canary.rows[0]?.n)).toBe(1);

    const status = await readStatus(
      tdb.db,
      { datedHours: 24, slaHours: 72, creditFloorCents: 100, creditCeilingPct: 100 },
      clock,
    );
    expect(status.corpus.state).toBe('FRESH');
    expect(status.corpus.blocksFiling).toBe(false);
    expect(status.gates).toHaveLength(6);
    // Every gate is locked or measuring, and no outcome sentence is available —
    // nothing has been measured yet, and the copy says so by saying nothing.
    expect(status.gates.every((g) => g.outcome === null)).toBe(true);
  });

  it('runs the same slot only once across repeated ticks', async () => {
    await setup();
    const clock = fixedClock(NOW);
    const deps = depsFor(clock);
    await tick(deps, { limit: 50 });
    const second = await tick(deps, { limit: 50 });
    expect(second.ran).toHaveLength(0);

    const runs = await tdb.client.query<{ kind: string; n: string }>(
      `SELECT kind, COUNT(*)::text AS n FROM job_runs GROUP BY kind`,
    );
    for (const row of runs.rows) expect(Number(row.n)).toBe(1);
  });
});

describe('the freshness sweep never blocks a filing', () => {
  it('reaches L2 and opens a credit incident without touching the filing path', async () => {
    await setup();
    await seedPromotedSnapshot(tdb, {
      ref: 'cs_stale',
      // Four days ago: past the 72-hour SLA.
      promotedAt: new Date('2026-08-09T06:00:00Z'),
    });
    const clock = fixedClock(NOW);
    const deps = depsFor(clock);
    await tick(deps, { limit: 50 });

    const runs = await tdb.client.query<{ detail: Record<string, unknown> }>(
      `SELECT detail FROM job_runs WHERE kind = 'freshness.sweep'`,
    );
    expect(runs.rows[0]?.detail['state']).toBe('STALE');
    // D7, in the ledger: L2 blocks NEW pins and never a filing.
    expect(runs.rows[0]?.detail['blocks_filing']).toBe(false);
    expect(runs.rows[0]?.detail['blocks_new_pins']).toBe(true);

    const incidents = await openIncidents(tdb.db);
    const staleness = incidents.find((i) => i.cause.includes('verification has not completed'));
    expect(staleness?.autoResponse).toBe('credit_customer');
    expect(staleness?.level).toBe('L2_STALE');
  });
});
