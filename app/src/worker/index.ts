/**
 * Worker process entrypoint — the second of the two process types.
 *
 * Spec: ARCHITECTURE.md ADR-001 (one image, two process types), ADR-005
 * (Postgres is the queue and the scheduler), §4.2 (the worker's four jobs:
 * job runner, scheduler, PDF renderer, redaction pipeline).
 *
 * Twelve-Factor VIII (Concurrency): `web` and `worker` are scaled independently
 * via the process formation. This is what gives us background work WITHOUT
 * introducing a broker.
 *
 * Twelve-Factor IX (Disposability): SIGTERM stops the claim loop, lets in-flight
 * handlers finish, and returns anything unfinished to the queue. An interrupted
 * draft must be resumable, because the seller is mid-panic and will not paste
 * twice.
 *
 * Twelve-Factor XI (Logs): every line is JSON on stdout, carrying case_id,
 * stage, corpus_release, model_id, prompt_bundle_hash and cache-hit token
 * counts. The process never writes or routes a log file.
 */

import { closeDb, getDb } from '../lib/db';
import type { Db } from '../lib/db';
import { claimJobs, completeJob, failJob, reclaimStaleJobs } from '../lib/db/queue';
import type { JobKind } from '../lib/db/queue';
import type { Job } from '../lib/db/schema';
import { getAdapters } from '../lib/adapters';
import { registerAllHandlers } from '../lib/queue/worker-registration';
import { buildHandlerOptions } from './composition';
import { getEnv } from '../env';

type Handler = (db: Db, job: Job) => Promise<void>;

/**
 * The job table is the whole scheduler. Handlers are registered here and
 * implemented in their own modules as the build proceeds; an unregistered kind
 * is a hard failure rather than a silent no-op, so a job added to the enum
 * without a handler surfaces immediately instead of accumulating dead rows.
 */
const handlers: Partial<Record<JobKind, Handler>> = {};

export function registerHandler(kind: JobKind, handler: Handler): void {
  handlers[kind] = handler;
}

export function log(level: 'debug' | 'info' | 'warn' | 'error', event: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    proc: 'worker',
    event,
    ...fields,
  });
  if (level === 'error') process.stderr.write(`${line}\n`);
  else process.stdout.write(`${line}\n`);
}

let running = true;

async function tick(db: Db, workerId: string, batchSize: number): Promise<number> {
  const claimed = await claimJobs(db, { workerId, limit: batchSize });
  for (const job of claimed) {
    const handler = handlers[job.kind];
    if (!handler) {
      await failJob(db, job, new Error(`no handler registered for job kind "${job.kind}"`));
      log('error', 'job.unhandled', { job_id: job.id, kind: job.kind });
      continue;
    }
    const startedAt = Date.now();
    try {
      await handler(db, job);
      await completeJob(db, job.id);
      log('info', 'job.done', { job_id: job.id, kind: job.kind, ms: Date.now() - startedAt });
    } catch (err) {
      await failJob(db, job, err);
      log('error', 'job.failed', {
        job_id: job.id,
        kind: job.kind,
        attempts: job.attempts,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return claimed.length;
}

export async function runWorker(): Promise<void> {
  const env = getEnv(); // Boot-time config validation — fail fast (factor III).
  const db = await getDb();

  // Wire the jobs owned by data/billing/email/outcome-capture
  // (queue/worker-registration.ts), with their engine-backed seams filled in by
  // the composition root (./composition.ts) — notably ADR-006's requirement that
  // an inbound Shield notice go through the SAME classifier as a pasted one.
  // `render_pdf`, `escalation_review` and `cache_rewarm` belong to other
  // workstreams and are deliberately left unregistered; the "no handler
  // registered" failure is the loud signal for those.
  //
  // Loading the corpus here also makes it a BOOT-time failure: a worker that
  // cannot read `corpus/` must not start and quietly take jobs it will fail.
  registerAllHandlers(registerHandler, getAdapters(), await buildHandlerOptions());

  log('info', 'worker.start', {
    worker_id: env.WORKER_ID,
    corpus_release: env.CORPUS_RELEASE,
    prompt_bundle_hash: env.PROMPT_BUNDLE_HASH,
    model_draft: env.MODEL_DRAFT,
    poll_ms: env.WORKER_POLL_INTERVAL_MS,
  });

  const shutdown = (signal: string) => {
    running = false;
    log('info', 'worker.shutdown', { signal });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  let sinceReclaim = 0;
  while (running) {
    try {
      // Reclaim rows whose worker died mid-job (disposability).
      if (sinceReclaim >= 30) {
        const reclaimed = await reclaimStaleJobs(db);
        if (reclaimed > 0) log('warn', 'jobs.reclaimed', { count: reclaimed });
        sinceReclaim = 0;
      }
      const processed = await tick(db, env.WORKER_ID, env.WORKER_BATCH_SIZE);
      if (processed === 0) {
        sinceReclaim += 1;
        await sleep(env.WORKER_POLL_INTERVAL_MS);
      }
    } catch (err) {
      log('error', 'worker.tick_failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      await sleep(env.WORKER_POLL_INTERVAL_MS);
    }
  }

  await closeDb();
  log('info', 'worker.stopped', {});
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Only start the loop when executed as the process entrypoint, so importing this
// module in a test does not spawn a poller.
if (process.env['CLAUSEWRIGHT_WORKER_AUTOSTART'] !== 'false') {
  const isEntrypoint = process.argv[1]?.includes('worker');
  if (isEntrypoint) {
    runWorker().catch((err: unknown) => {
      log('error', 'worker.crashed', { error: err instanceof Error ? err.stack : String(err) });
      process.exitCode = 1;
    });
  }
}
