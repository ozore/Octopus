/**
 * Incidents — the persisted form of an automatic response.
 *
 * Spec: ARCHITECTURE.md §10.1 (I7 — "the alert is not the deliverable; the automatic
 * response is"), ADR-010, and the `incidents_response` CHECK in the schema of
 * record, which permits exactly four values and none of them means "notify someone".
 *
 * An incident row in this system is NOT a ticket. Nobody triages it, nobody is
 * assigned to it, and closing it is done by the same job that opened it observing
 * that the condition has cleared. It exists for three readers, all of them code or
 * customers: the status page, the credit job (which needs an incident id to be
 * idempotent per incident), and the gate queries.
 *
 * `openIncident` therefore takes a `Signal` rather than a free-text severity: the
 * response is computed by `respond`, which is total over a closed union, so an
 * incident cannot be opened for a condition that has no automatic answer. That is
 * the compile-time half of §10.1 reaching the database.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db, type Tx } from '../../db';
import type { CorpusLadderLevel } from '../../lib/types';
import { systemClock, type Clock } from '../clock';
import { autoResponseColumn, respond, type Response, type Signal } from './response';

export interface IncidentRow {
  readonly id: number;
  readonly openedAt: Date;
  readonly closedAt: Date | null;
  readonly level: CorpusLadderLevel;
  readonly scope: string;
  readonly cause: string;
  readonly autoResponse: string;
  readonly detail: Readonly<Record<string, unknown>>;
}

export interface OpenIncidentInput {
  readonly signal: Signal;
  readonly level: CorpusLadderLevel;
  /** 'snapshot' | 'product' | 'wd:<number>' | 'release' | 'job:<kind>'. */
  readonly scope: string;
  readonly cause: string;
  readonly detail?: Readonly<Record<string, unknown>>;
}

export interface OpenedIncident {
  readonly id: number;
  readonly response: Response;
  readonly reopened: boolean;
}

/**
 * Open one, or return the open one that already exists for this (scope, cause).
 *
 * The dedupe is deliberate and it is what keeps the credit ceiling meaningful:
 * §9.4's budget is PER INCIDENT, so a job that opened a fresh incident on every run
 * of the same condition would hand itself a fresh budget every hour, and the ceiling
 * would protect nothing.
 */
export async function openIncident(
  db: Db | Tx,
  input: OpenIncidentInput,
  clock: Clock = systemClock,
): Promise<OpenedIncident> {
  const response = respond(input.signal);

  const existing = rowsOf<{ id: number | string }>(
    await db.execute(sql`
      SELECT id FROM incidents
       WHERE closed_at IS NULL AND scope = ${input.scope} AND cause = ${input.cause}
       ORDER BY opened_at DESC LIMIT 1
    `),
  )[0];
  if (existing) return { id: Number(existing.id), response, reopened: true };

  const inserted = rowsOf<{ id: number | string }>(
    await db.execute(sql`
      INSERT INTO incidents (opened_at, level, scope, cause, auto_response, detail)
      VALUES (${clock.now().toISOString()}::timestamptz, ${input.level}::ladder_level,
              ${input.scope}, ${input.cause}, ${autoResponseColumn(response)},
              ${JSON.stringify(input.detail ?? {})}::jsonb)
      RETURNING id
    `),
  )[0];
  if (!inserted) throw new Error('incidents: the insert returned no row');
  return { id: Number(inserted.id), response, reopened: false };
}

/** Close every open incident matching a scope and cause. Called by the job that
 *  observes the condition has cleared — there is no manual close. */
export async function closeIncident(
  db: Db | Tx,
  input: { readonly scope: string; readonly cause: string },
  clock: Clock = systemClock,
): Promise<number> {
  const result = await db.execute(sql`
    UPDATE incidents SET closed_at = ${clock.now().toISOString()}::timestamptz
     WHERE closed_at IS NULL AND scope = ${input.scope} AND cause = ${input.cause}
     RETURNING id
  `);
  return rowsOf(result).length;
}

interface RawIncident {
  readonly id: number | string;
  readonly opened_at: string | Date;
  readonly closed_at: string | Date | null;
  readonly level: CorpusLadderLevel;
  readonly scope: string;
  readonly cause: string;
  readonly auto_response: string;
  readonly detail: Record<string, unknown> | null;
}

function toIncident(row: RawIncident): IncidentRow {
  return {
    id: Number(row.id),
    openedAt: new Date(row.opened_at),
    closedAt: row.closed_at === null ? null : new Date(row.closed_at),
    level: row.level,
    scope: row.scope,
    cause: row.cause,
    autoResponse: row.auto_response,
    detail: row.detail ?? {},
  };
}

export async function openIncidents(db: Db | Tx): Promise<readonly IncidentRow[]> {
  return rowsOf<RawIncident>(
    await db.execute(sql`
      SELECT id, opened_at, closed_at, level, scope, cause, auto_response, detail
        FROM incidents WHERE closed_at IS NULL ORDER BY opened_at DESC
    `),
  ).map(toIncident);
}

/** The most recent open incident whose response is a customer credit — the id
 *  `issueStalenessCredits` needs to keep one budget per staleness event. */
export async function currentCreditIncidentId(db: Db | Tx): Promise<number | null> {
  const row = rowsOf<{ id: number | string }>(
    await db.execute(sql`
      SELECT id FROM incidents
       WHERE closed_at IS NULL AND auto_response = 'credit_customer'
       ORDER BY opened_at DESC LIMIT 1
    `),
  )[0];
  return row ? Number(row.id) : null;
}

/** The worst open level, which is what the ladder shows. `L0_NORMAL` when nothing
 *  is open — an empty incident table is a claim we are entitled to make. */
export async function currentLadderLevel(db: Db | Tx): Promise<CorpusLadderLevel> {
  const order: readonly CorpusLadderLevel[] = [
    'L0_NORMAL',
    'L1_DATED',
    'L2_STALE',
    'L3_QUARANTINE',
    'L4_XML_BLOCKED',
    'L5_RELEASE_FROZEN',
  ];
  const open = await openIncidents(db);
  let worst: CorpusLadderLevel = 'L0_NORMAL';
  for (const incident of open) {
    if (order.indexOf(incident.level) > order.indexOf(worst)) worst = incident.level;
  }
  return worst;
}
