/**
 * The knowledge base's job handlers.
 *
 * THE THREE WAYS A DETERMINATION ENTERS THE CORPUS (WL-13):
 *
 *  1. **Daily index diff** — a `(wd_number, modification_number)` pair appears
 *     that we do not hold → `kb.fetch_determination`.
 *  2. **Someone touches a WD number** — a project pins it, a visitor opens
 *     `/wd/:wdNumber`, a watch is created, WL-08 diffs it → `kb.fetch_history`,
 *     which is one small request and is therefore EAGER.
 *  3. **Someone names a specific older revision** — the explicit-modification
 *     pin, the public modification picker → `kb.fetch_determination` for that
 *     exact revision, which is 17 KB and is therefore LAZY.
 *
 * Every handler is idempotent, because Vercel's own documentation says cron
 * delivery is best effort and may fire the same schedule twice.
 */

import { and, eq } from 'drizzle-orm';

import { track } from '@octopus/platform/events';
import { enqueue, type JobRegistry } from '@octopus/platform/jobs';
import type { Db } from '@octopus/platform/db';

import { projects, kbWdModifications } from '../schema';
import { getSamAdapter } from './adapter';
import { fetchHistory, ingestDetermination, type IngestTrigger } from './ingest';
import { KB_JOB_KINDS } from './job-kinds';
import { PARSER_VERSION } from './parser';
import type { SamAdapter } from './sam';

export type KbJobContext = { db: Db; sam: SamAdapter };

export async function handleFetchDetermination(
  ctx: KbJobContext,
  payload: { wdNumber?: unknown; modificationNumber?: unknown; trigger?: unknown },
): Promise<void> {
  const wdNumber = String(payload.wdNumber ?? '');
  const modificationNumber = Number(payload.modificationNumber ?? 0);
  const trigger = (payload.trigger as IngestTrigger | undefined) ?? 'index';
  if (!wdNumber) throw new Error('kb.fetch_determination: wdNumber is required');

  const result = await ingestDetermination(ctx.db, ctx.sam, {
    wdNumber,
    revision: modificationNumber,
    trigger,
  });

  if (result.status === 'inserted') {
    // `text_held` is the answer to "can we draw this revision?" and it is a fact
    // about our database, so it is written where the timeline reads it.
    await ctx.db
      .update(kbWdModifications)
      .set({ textHeld: true })
      .where(
        and(
          eq(kbWdModifications.wdNumber, wdNumber),
          eq(kbWdModifications.modificationNumber, modificationNumber),
        ),
      );

    await track(ctx.db, {
      name: 'kb_determination_added',
      props: {
        wd_number: wdNumber,
        modification_number: modificationNumber,
        classifications: result.classifications,
      },
    });

    // `trigger` tells us whether anyone actually uses the differentiator, which
    // is the question OFFER §11.3 Q7 asks.
    if (result.supersededFromModification === undefined && modificationNumber >= 0 && trigger !== 'index') {
      await track(ctx.db, {
        name: 'kb_superseded_revision_added',
        props: { wd_number: wdNumber, modification_number: modificationNumber, trigger },
      });
    }

    if (result.supersededFromModification !== undefined) {
      // One alert per pinned project, and the unique index on
      // (project, wd, to_modification) is what makes a re-run silent.
      const pinned = await ctx.db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.wdNumber, wdNumber), eq(projects.status, 'active')));
      await track(ctx.db, {
        name: 'kb_modification_detected',
        props: {
          wd_number: wdNumber,
          from_mod: result.supersededFromModification,
          to_mod: modificationNumber,
          pinned_projects: pinned.length,
        },
      });
      for (const project of pinned) {
        await enqueue(ctx.db, {
          kind: KB_JOB_KINDS.modificationDetected,
          payload: {
            projectId: project.id,
            wdNumber,
            fromModification: result.supersededFromModification,
            toModification: modificationNumber,
          },
          dedupeKey: `wd.modification_detected:${project.id}:${wdNumber}:${modificationNumber}`,
        });
      }
      await enqueue(ctx.db, {
        kind: KB_JOB_KINDS.watchNotify,
        payload: {
          wdNumber,
          fromModification: result.supersededFromModification,
          toModification: modificationNumber,
        },
        dedupeKey: `wd.watch_notify:${wdNumber}:${modificationNumber}`,
      });
    }
  }
}

export async function handleFetchHistory(
  ctx: KbJobContext,
  payload: { wdNumber?: unknown; wantedRevisions?: unknown },
): Promise<void> {
  const wdNumber = String(payload.wdNumber ?? '');
  if (!wdNumber) throw new Error('kb.fetch_history: wdNumber is required');

  const result = await fetchHistory(ctx.db, ctx.sam, wdNumber);
  await track(ctx.db, {
    name: 'kb_history_fetched',
    props: { wd_number: wdNumber, revisions: result.revisions },
  });

  // Only revisions someone asked for get their text fetched. There is no crawl
  // of every historical revision: 4,235 determinations × every revision back to
  // 2003 is neither needed nor polite (V12).
  const wanted = Array.isArray(payload.wantedRevisions)
    ? (payload.wantedRevisions as unknown[]).map(Number).filter((n) => Number.isFinite(n))
    : [];
  for (const revision of wanted) {
    if (result.heldRevisions.includes(revision)) continue;
    await enqueue(ctx.db, {
      kind: KB_JOB_KINDS.fetchDetermination,
      payload: { wdNumber, modificationNumber: revision, trigger: 'backfill' },
      dedupeKey: `kb.fetch:${wdNumber}:${revision}`,
    });
  }
}

/** `kb.reparse` re-derives classifications from the STORED `document_text`,
 *  with zero network requests. That is why the verbatim text is kept. */
export async function handleReparse(ctx: KbJobContext, payload: { wdNumber?: unknown }): Promise<void> {
  void ctx;
  void payload;
  throw new Error(
    `kb.reparse is not implemented in sub-wave A. The parser is at version ${PARSER_VERSION}; ` +
      're-deriving rows from stored document_text belongs to whoever changes the parser next (see BUILD.md).',
  );
}

/**
 * Register the knowledge base's jobs on the platform's registry.
 *
 * `wd.modification_detected` and `wd.watch_notify` are ENQUEUED here but owned
 * by WL-08 and WL-14. Until those agents land, they are registered as explicit
 * no-ops rather than left unregistered: an unregistered kind is parked as dead
 * with "no handler registered", which would make a real modification look like
 * a bug in the queue. The no-op is a seam with a name.
 */
export function registerKbJobs(registry: JobRegistry, context: () => Promise<KbJobContext>): void {
  registry.override(KB_JOB_KINDS.fetchDetermination, async (payload) => {
    await handleFetchDetermination(await context(), payload);
  });
  registry.override(KB_JOB_KINDS.fetchHistory, async (payload) => {
    await handleFetchHistory(await context(), payload);
  });
  registry.override(KB_JOB_KINDS.backfillHistory, async (payload) => {
    const ctx = await context();
    const wdNumbers = Array.isArray(payload['wdNumbers']) ? (payload['wdNumbers'] as string[]) : [];
    for (const wdNumber of wdNumbers) {
      await enqueue(ctx.db, {
        kind: KB_JOB_KINDS.fetchHistory,
        payload: { wdNumber },
        dedupeKey: `kb.history:${wdNumber}`,
      });
    }
  });
  registry.override(KB_JOB_KINDS.reparse, async (payload) => {
    await handleReparse(await context(), payload);
  });
  registry.override(KB_JOB_KINDS.modificationDetected, async () => {
    /* WL-08 owns this handler. See apps/wagelens/BUILD.md. */
  });
  registry.override(KB_JOB_KINDS.watchNotify, async () => {
    /* WL-14 owns this handler. See apps/wagelens/BUILD.md. */
  });
}

export function kbJobContext(db: Db): KbJobContext {
  return { db, sam: getSamAdapter() };
}
