/**
 * THE WORKER — the second process type, and the whole of "unattended operations".
 *
 * Spec: ARCHITECTURE.md ADR-001 ("one TypeScript deployable, TWO PROCESS TYPES"),
 * §2.2 factor XII (admin processes run from the release image), §7 (the scheduler),
 * §8 (fail-closed), §10.1 (I7 — no alerting to a human), A5.
 *
 * Run it with `npm run worker`. It shares the image, the code and the database with
 * the web process and differs only in what it does with them, which is what factor
 * XII asks for and what makes "did the deployed code run the nightly job?" a
 * question with one answer.
 *
 * ===========================================================================
 * THE LOOP, IN FOUR STEPS, IN THIS ORDER
 *
 *   1. RECLAIM  — leases that expired go back to `ready`, each writing a
 *                 `lease_expired` row. Before claiming, so a crashed attempt is
 *                 re-claimable in the same tick rather than the next one.
 *   2. SCHEDULE — every registry entry whose slot has opened is enqueued under the
 *                 slot's name. Idempotent by unique key, so N workers and a restart
 *                 produce one job.
 *   3. CLAIM    — `FOR UPDATE SKIP LOCKED`, with a lease.
 *   4. RUN      — each job, with its outcome written to `job_runs` whatever happens.
 *
 * ===========================================================================
 * WHAT HAPPENS WHEN A JOB THROWS, STATED ONCE
 *
 * The exception is caught, the run is recorded as `failed_closed`, the job is
 * rescheduled with backoff (or marked `dead` after five attempts), and the job's
 * declared `signalOnFailure` — if it has one — is turned into an incident whose
 * `auto_response` is computed by `respond`. Nothing is printed to a pager, nothing
 * is emailed to an operator, and the loop continues. That is not stoicism; it is
 * §10.1: "an alert is a request that a human do something. There is no human."
 *
 * The customer-visible consequence of a persistently failing ingest is the freshness
 * ladder — a dated footer, then a banner, then an accruing credit — and those
 * happen because the mirror stopped moving, not because anybody noticed.
 */

import { assertRlsEnforced, createDb, type Db } from '../db';
import { getConfig, type Config } from '../lib/config';
import { ensurePlanCatalog } from '../platform/billing/catalog';
import { createFakeStripe } from '../platform/billing/stripe-fake';
import { createLiveStripe } from '../platform/billing/stripe-live';
import { systemClock, type Clock } from '../platform/clock';
import { ensurePlatformSchema } from '../platform/schema';
import { createRecordingMailer, type Mailer } from '../platform/ops/outbox';
import { openIncident } from '../platform/ops/incidents';
import { createRecordingSink, type ExportSink } from '../platform/account/export';
import { REGULATORY_FIXTURES, runSuite } from '../engine';
import { createResendMailer } from './mailer';
import {
  JOB_REGISTRY,
  jobByKind,
  type CanarySuiteVerdict,
  type JobDefinition,
  type WorkerDeps,
} from './jobs';
import {
  claimJobs,
  completeJob,
  enqueue,
  failJob,
  reclaimExpiredLeases,
  recordRun,
  type JobRow,
} from './queue';
import { slotFor } from './schedule';

export * from './jobs';
export * from './queue';
export * from './schedule';

// ===========================================================================
// Scheduling
// ===========================================================================

export interface ScheduleReport {
  readonly enqueued: readonly string[];
  readonly alreadyQueued: readonly string[];
}

/**
 * Enqueue every registry entry whose slot has opened.
 *
 * The key IS the slot name, so this function is safe to call from every worker
 * instance on every tick. `alreadyQueued` is the ordinary result and is reported
 * rather than swallowed, because "the scheduler is running and finding nothing to
 * do" and "the scheduler is not running" must not look the same.
 */
export async function scheduleDueJobs(deps: {
  readonly db: Db;
  readonly clock: Clock;
  readonly registry?: readonly JobDefinition[];
}): Promise<ScheduleReport> {
  const now = deps.clock.now();
  const enqueued: string[] = [];
  const alreadyQueued: string[] = [];

  for (const job of deps.registry ?? JOB_REGISTRY) {
    const slot = slotFor(job.schedule, now);
    if (!slot) continue;
    const key = `${job.kind}:${slot.slot}`;
    const result = await enqueue(
      deps.db,
      { kind: job.kind, idempotencyKey: key, runAfter: slot.openedAt, payload: { slot: slot.slot } },
      deps.clock,
    );
    (result.enqueued ? enqueued : alreadyQueued).push(key);
  }
  return { enqueued, alreadyQueued };
}

// ===========================================================================
// Running one job
// ===========================================================================

export interface JobRunReport {
  readonly kind: string;
  readonly outcome: 'ok' | 'failed_closed';
  readonly detail: Readonly<Record<string, unknown>>;
  readonly error: string | null;
}

export async function runOneJob(deps: WorkerDeps, row: JobRow): Promise<JobRunReport> {
  const definition = jobByKind(row.kind);
  const startedAt = deps.clock.now();

  if (!definition) {
    // A queued kind with no definition is a deploy that removed a job while rows
    // were in flight. It is not an error and it is not silently dropped: the row is
    // completed and the ledger says why.
    await completeJob(deps.db, row.id);
    await recordRun(deps.db, {
      jobId: row.id,
      kind: row.kind,
      idempotencyKey: row.idempotencyKey,
      attempt: row.attempts,
      startedAt,
      finishedAt: deps.clock.now(),
      outcome: 'skipped_duplicate',
      detail: { reason: 'no definition for this kind in the current release' },
    });
    return { kind: row.kind, outcome: 'ok', detail: { skipped: true }, error: null };
  }

  try {
    const result = await definition.run({ deps, payload: row.payload });
    await completeJob(deps.db, row.id);
    await recordRun(deps.db, {
      jobId: row.id,
      kind: row.kind,
      idempotencyKey: row.idempotencyKey,
      attempt: row.attempts,
      startedAt,
      finishedAt: deps.clock.now(),
      outcome: 'ok',
      detail: { performed: result.performed, ...result.detail },
    });
    return { kind: row.kind, outcome: 'ok', detail: result.detail, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const state = await failJob(
      deps.db,
      { id: row.id, attempts: row.attempts, error: message },
      deps.clock,
    );
    await recordRun(deps.db, {
      jobId: row.id,
      kind: row.kind,
      idempotencyKey: row.idempotencyKey,
      attempt: row.attempts,
      startedAt,
      finishedAt: deps.clock.now(),
      outcome: 'failed_closed',
      detail: { job_state: state.state, retry_at: state.retryAt?.toISOString() ?? null },
      error: message,
    });

    if (definition.signalOnFailure) {
      await openIncident(
        deps.db,
        {
          signal: definition.signalOnFailure,
          level: definition.signalOnFailure.kind === 'canary_red' ? 'L5_RELEASE_FROZEN' : 'L3_QUARANTINE',
          scope: `job:${definition.kind}`,
          cause: `${definition.kind} failed`,
          detail: { error: message, attempts: row.attempts, fails_closed_by: definition.failsClosedBy },
        },
        deps.clock,
      );
    }

    return { kind: row.kind, outcome: 'failed_closed', detail: {}, error: message };
  }
}

export interface TickReport {
  readonly reclaimed: number;
  readonly scheduled: ScheduleReport;
  readonly ran: readonly JobRunReport[];
}

/** One pass of the loop. Exported because the tests drive it directly: a test that
 *  had to wait for an interval is a test that is either slow or flaky. */
export async function tick(
  deps: WorkerDeps,
  options?: { readonly limit?: number; readonly leaseSeconds?: number },
): Promise<TickReport> {
  const reclaimed = await reclaimExpiredLeases(deps.db, deps.clock);
  const scheduled = await scheduleDueJobs({ db: deps.db, clock: deps.clock });
  const claimed = await claimJobs(deps.db, {
    limit: options?.limit ?? 10,
    ...(options?.leaseSeconds === undefined ? {} : { leaseSeconds: options.leaseSeconds }),
    clock: deps.clock,
  });

  const ran: JobRunReport[] = [];
  for (const row of claimed) ran.push(await runOneJob(deps, row));
  return { reclaimed, scheduled, ran };
}

/** Enqueue a job that has no schedule of its own — the post-deploy canary, an
 *  export, a replay somebody asked for. */
export async function enqueueOnDemand(
  db: Db,
  input: {
    readonly kind: string;
    readonly payload?: Readonly<Record<string, unknown>>;
    readonly idempotencyKey: string;
  },
  clock: Clock = systemClock,
): Promise<{ readonly enqueued: boolean }> {
  const result = await enqueue(db, input, clock);
  return { enqueued: result.enqueued };
}

// ===========================================================================
// The default dependency set
// ===========================================================================

/**
 * G1's runner, bound to the engine's suite.
 *
 * `pass` is EXACT MATCH ONLY. Coverage shortfalls are reported in their own field
 * and do not set `pass`, because `ENGINE.md` §27 routes COVERAGE_SHORTFALL to "fail
 * CI" rather than to a production freeze — and because the ≥500-line suite is drawn
 * from the corpus and cannot exist before it. Reporting the shortfall in numbers is
 * `G1_SUITE_STATUS`'s whole point; treating it as green would be the one bug the
 * canary cannot have.
 */
export function engineCanary(): () => Promise<CanarySuiteVerdict> {
  return async () => {
    const suite = runSuite(REGULATORY_FIXTURES);
    const states = new Set(REGULATORY_FIXTURES.map((c) => c.stateCode));
    const wds = new Set(REGULATORY_FIXTURES.map((c) => c.wdSnapshotId));
    return {
      pass: suite.firstFailure === null,
      total: suite.casesRun,
      passed: suite.casesPassed,
      distinctWds: wds.size,
      distinctStates: states.size,
      firstDivergence: suite.firstFailure === null ? null : { case_id: suite.firstFailure.caseId },
      coverageShortfalls: suite.coverage.shortfalls.map((s) => s.dimension),
    };
  };
}

export interface BuildDepsOptions {
  readonly db: Db;
  readonly config?: Config;
  readonly clock?: Clock;
  readonly mailer?: Mailer;
  readonly exportSink?: ExportSink;
}

/**
 * The dependency set a live worker runs with.
 *
 * Every upstream that has no configured credential resolves to `null` rather than to
 * a stub that returns plausible data. A job with a `null` port reports
 * `performed: false` with a reason, which is honest and is also the same
 * customer-visible outcome as an upstream that is down: the mirror does not move and
 * the freshness clock keeps running.
 */
export function buildWorkerDeps(options: BuildDepsOptions): WorkerDeps {
  const config = options.config ?? getConfig();
  const clock = options.clock ?? systemClock;
  const stripe =
    config.ADAPTER_MODE === 'live' && config.STRIPE_SECRET_KEY
      ? createLiveStripe(config.STRIPE_SECRET_KEY)
      : createFakeStripe();
  const mailer =
    options.mailer ??
    (config.ADAPTER_MODE === 'live' && config.RESEND_API_KEY
      ? createResendMailer({
          apiKey: config.RESEND_API_KEY,
          from: config.EMAIL_FROM,
          baseUrl: config.APP_BASE_URL,
        })
      : createRecordingMailer());

  return {
    db: options.db,
    clock,
    config,
    stripe,
    mailer,
    canary: engineCanary(),
    // The corpus ingest, the upstream probes, the backup verifier and the object
    // store are wired in the deploy image; in every other environment they are
    // absent and the jobs say so.
    ingest: null,
    probes: null,
    backups: null,
    retention: null,
    exportSink: options.exportSink ?? createRecordingSink(),
    buildSha: config.BUILD_SHA,
  };
}

// ===========================================================================
// The process
// ===========================================================================

export interface WorkerHandle {
  stop(): void;
  readonly stopped: Promise<void>;
}

/** The loop. `intervalMs` is the poll interval, not the schedule: the schedule lives
 *  in the slots, so a slow poll makes a job late and never makes it skip. */
export function startWorker(
  deps: WorkerDeps,
  options?: { readonly intervalMs?: number; readonly limit?: number },
): WorkerHandle {
  let running = true;
  let resolveStopped: () => void = () => undefined;
  const stopped = new Promise<void>((resolve) => {
    resolveStopped = resolve;
  });

  const loop = async (): Promise<void> => {
    while (running) {
      try {
        await tick(deps, { ...(options?.limit === undefined ? {} : { limit: options.limit }) });
      } catch (error) {
        // A failure of the LOOP itself — the database went away mid-tick. There is
        // nobody to tell, and the next tick either works or does not. What must not
        // happen is the process exiting, because a worker that exits on a transient
        // database blip stops running the credit job that pays for the outage.
        process.stderr.write(`worker tick failed: ${String(error)}\n`);
      }
      await new Promise((resolve) => setTimeout(resolve, options?.intervalMs ?? 15_000));
    }
    resolveStopped();
  };
  void loop();

  return {
    stop() {
      running = false;
    },
    stopped,
  };
}

export async function main(): Promise<void> {
  const config = getConfig();
  const handle = await createDb();

  // Factor XII: the admin work runs from the release image, as the release's code.
  await ensurePlatformSchema(handle.db);
  await ensurePlanCatalog(handle.db);
  // ADR-011's second mechanism is inert under a role that can bypass it, and that
  // failure has no symptom other than queries returning more rows than they should.
  await assertRlsEnforced(handle.db);

  const deps = buildWorkerDeps({ db: handle.db, config });
  const worker = startWorker(deps);

  const shutdown = (signal: string): void => {
    process.stderr.write(`worker: ${signal} received, finishing the current tick\n`);
    worker.stop();
    void worker.stopped.then(async () => {
      await handle.close();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });

  process.stdout.write(
    `worker: ${String(JOB_REGISTRY.length)} jobs registered, polling as ${config.DATABASE_APP_ROLE}\n`,
  );
  await worker.stopped;
}

// `npm run worker` executes this file directly; importing it from a test does not.
if (process.argv[1] !== undefined && process.argv[1].includes('worker/index')) {
  void main().catch((error: unknown) => {
    process.stderr.write(`worker: refusing to start — ${String(error)}\n`);
    process.exit(1);
  });
}
