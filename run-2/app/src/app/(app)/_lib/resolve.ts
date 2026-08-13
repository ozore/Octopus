/**
 * THE CLASSIFICATION PICKER — J6, and the memory that removes it permanently.
 *
 * AUTHORITY: `USER_JOURNEY.md` §6.1 (the picker: nothing pre-selected, confirm
 * inert, verbatim label and scope text and line span beside every candidate),
 * §6.3.1 (**the permission table** — what may auto-apply, what may pre-select, what
 * may only order), §6.4 (the unhappy paths, including L-F's conformance path),
 * `ENGINE.md` §18.2 (the L-A..L-F ladder), `src/classify/index.ts` (the module that
 * owns all of it).
 *
 * ===========================================================================
 * THIS MODULE DECIDES NOTHING ABOUT CLASSIFICATION
 *
 * `resolveClassification` owns the ladder. What lives here is the plumbing either
 * side of it: reading the week's unresolved titles out of Postgres, and writing the
 * customer's click back. Two consequences follow and both are deliberate.
 *
 * 1. **L-A applies silently, here, and nowhere else.** When the ladder returns
 *    `resolved` — which it does at L-A only — this module writes the classification
 *    onto the line without asking. That is the product: her own confirmed answers
 *    apply, and she is never asked again.
 * 2. **Nothing else applies silently, ever.** Every other level comes back with a
 *    P-A refusal and a blocked line. There is no confidence threshold in this file,
 *    no "if score > x", and no branch that fills a radio: `preSelected` arrives
 *    non-null only at L-C1 and `blockedLine()` throws if that is violated.
 */

import { sql } from 'drizzle-orm';

import {
  confirmChoice,
  normalizeTitle,
  resolveClassification,
  anthropicRanker,
  type ClassificationOutcome,
  type PinnedRevision,
  type RankerTransport,
} from '@/classify';
import { rowsOf, type Db, type Tx } from '@/db';
import { accountId as brandAccountId } from '@/db/tenant';
import type { Classification, ClassificationId, IsoDate, WdNumber } from '@/lib/types';
import { parseClassificationId } from '@/lib/types';

import { appConfig } from './deps';
import { classificationsOf } from './mirror';
import type { PinRecord, ProjectRecord } from './projects';

// ===========================================================================
// The week's lines
// ===========================================================================

export interface LineRow {
  readonly lineId: string;
  readonly workerWeekId: string;
  readonly ordinal: number;
  readonly rawTitle: string;
  readonly titleNorm: string;
  readonly resolutionState: 'pending' | 'resolved' | 'blocked';
  readonly blockReasons: readonly string[];
  readonly classOrdinal: number | null;
  readonly workerName: string;
  readonly hoursHundredths: number;
  readonly cashRateMilli: number;
}

export async function weekLines(tx: Tx, weekId: string): Promise<readonly LineRow[]> {
  return rowsOf<{
    id: string;
    worker_week_id: string;
    ordinal: number | string;
    raw_title: string;
    title_norm: string;
    resolution_state: 'pending' | 'resolved' | 'blocked';
    block_reasons: string[];
    class_ordinal: number | string | null;
    worker_name: string;
    hours: number | string;
    cash_rate_milli: number | string;
  }>(
    await tx.execute(sql`
      SELECT l.id, l.worker_week_id, l.ordinal, l.raw_title, l.title_norm, l.resolution_state,
             l.block_reasons, l.class_ordinal,
             (w.first_name || ' ' || w.last_name) AS worker_name,
             (SELECT coalesce(sum(v), 0) FROM unnest(l.day_st_hours || l.day_ot_hours || l.day_dt_hours) AS v) AS hours,
             l.cash_rate_milli
        FROM payroll_lines l
        JOIN payroll_worker_weeks ww ON ww.id = l.worker_week_id
        JOIN workers w ON w.id = ww.worker_id
       WHERE ww.week_id = ${weekId}::uuid
       ORDER BY w.last_name, w.first_name, l.ordinal
    `),
  ).map((row) => ({
    lineId: row.id,
    workerWeekId: row.worker_week_id,
    ordinal: Number(row.ordinal),
    rawTitle: row.raw_title,
    titleNorm: row.title_norm,
    resolutionState: row.resolution_state,
    blockReasons: row.block_reasons ?? [],
    classOrdinal: row.class_ordinal === null ? null : Number(row.class_ordinal),
    workerName: row.worker_name,
    hoursHundredths: Number(row.hours),
    cashRateMilli: Number(row.cash_rate_milli),
  }));
}

// ===========================================================================
// The ladder, run over a week
// ===========================================================================

export interface TitleResolution {
  readonly rawTitle: string;
  readonly titleNorm: string;
  /** Every line carrying this title, so one click resolves all of them — and, on the
   *  Friday board, every project sharing the determination's group. */
  readonly lineIds: readonly string[];
  readonly workers: readonly string[];
  readonly hoursHundredths: number;
  readonly outcome: ClassificationOutcome;
}

export interface WeekResolution {
  readonly resolved: readonly TitleResolution[];
  readonly blocked: readonly TitleResolution[];
  readonly classifications: readonly Classification[];
}

function pinnedRevisionOf(project: ProjectRecord, pin: PinRecord): PinnedRevision {
  return {
    wdNumber: pin.wdNumber,
    revision: pin.revision,
    publishDate: pin.wdPublishedDate,
    snapshotRef: String(pin.snapshotId) as unknown as PinnedRevision['snapshotRef'],
    stateCode: project.stateCode,
    constructionType: project.constructionType,
  };
}

/**
 * The transport, or nothing.
 *
 * Absent is a supported product state, not a degradation to apologise for: without
 * it the ladder lands on L-E, which is the free generator's own path and the most
 * exercised code in the product (`ARCHITECTURE.md` §3.8). The offline suite runs
 * with `ADAPTER_MODE=mock`, so every test in this repository exercises L-E rather
 * than a mocked L-D.
 */
function rankerTransport(): RankerTransport | undefined {
  const config = appConfig();
  if (config.ADAPTER_MODE !== 'live' || !config.ANTHROPIC_API_KEY) return undefined;
  return anthropicRanker({
    apiKey: config.ANTHROPIC_API_KEY,
    ...(config.ANTHROPIC_BASE_URL === undefined ? {} : { baseUrl: config.ANTHROPIC_BASE_URL }),
  });
}

/**
 * Resolve every distinct title on a week against the pinned revision, applying the
 * account's own memory silently and blocking everything else.
 */
export async function resolveWeek(
  db: Db,
  tx: Tx,
  input: {
    readonly accountId: string;
    readonly weekId: string;
    readonly project: ProjectRecord;
    readonly pin: PinRecord;
  },
): Promise<WeekResolution> {
  const classifications = await classificationsOf(db, input.pin.wdNumber, input.pin.revision);
  const lines = await weekLines(tx, input.weekId);
  const pin = pinnedRevisionOf(input.project, input.pin);
  const transport = rankerTransport();

  const byTitle = new Map<string, LineRow[]>();
  for (const line of lines) {
    const list = byTitle.get(line.rawTitle) ?? [];
    list.push(line);
    byTitle.set(line.rawTitle, list);
  }

  const resolved: TitleResolution[] = [];
  const blocked: TitleResolution[] = [];

  for (const [rawTitle, group] of byTitle) {
    const outcome = await resolveClassification(
      {
        db: tx,
        ...(transport === undefined ? {} : { transport, modelId: appConfig().MODEL_CLASSIFY }),
      },
      {
        lineId: group[0]?.lineId ?? rawTitle,
        rawTitle,
        tier: 'paid',
        pin,
        classifications,
        account: brandAccountId(input.accountId),
      },
    );

    const entry: TitleResolution = {
      rawTitle,
      titleNorm: String(normalizeTitle(rawTitle)),
      lineIds: group.map((line) => line.lineId),
      workers: [...new Set(group.map((line) => line.workerName))],
      hoursHundredths: group.reduce((total, line) => total + line.hoursHundredths, 0),
      outcome,
    };

    if (outcome.resolved !== null) {
      // L-A, and only L-A. Her own confirmed answer, applied without a question.
      await applyClassification(tx, entry.lineIds, outcome.resolved, 'L_A');
      resolved.push(entry);
    } else {
      blocked.push(entry);
    }
  }

  return { resolved, blocked, classifications };
}

/** Write a chosen classification onto every line that carried the title. */
export async function applyClassification(
  tx: Tx,
  lineIds: readonly string[],
  classification: Classification,
  level: 'L_A' | 'L_B' | 'L_C1' | 'L_C2' | 'L_D' | 'L_E' | 'L_F',
): Promise<void> {
  if (lineIds.length === 0) return;
  for (const lineId of lineIds) {
    await tx.execute(sql`
      UPDATE payroll_lines
         SET class_wd_number = ${String(classification.wdNumber)},
             class_revision = ${classification.revision},
             class_parser_version = ${classification.parserVersion},
             class_ordinal = ${classification.ordinal},
             class_name_norm = ${classification.classNameNorm},
             resolved_at_level = ${level},
             block_reasons = array_remove(block_reasons, 'UNMAPPED_TRADE'::block_reason),
             resolution_state = CASE
               WHEN array_length(array_remove(block_reasons, 'UNMAPPED_TRADE'::block_reason), 1) IS NULL
                 THEN 'resolved'::line_resolution
               ELSE 'blocked'::line_resolution END
       WHERE id = ${lineId}::uuid
    `);
  }
}

/** Mark every line carrying an unresolved title as blocked, with the reason named. */
export async function blockUnresolved(tx: Tx, lineIds: readonly string[]): Promise<void> {
  for (const lineId of lineIds) {
    await tx.execute(sql`
      UPDATE payroll_lines
         SET resolution_state = 'blocked',
             block_reasons = CASE WHEN 'UNMAPPED_TRADE' = ANY(block_reasons) THEN block_reasons
                                  ELSE array_append(block_reasons, 'UNMAPPED_TRADE'::block_reason) END
       WHERE id = ${lineId}::uuid AND class_wd_number IS NULL
    `);
  }
}

// ===========================================================================
// The click
// ===========================================================================

export interface ConfirmResult {
  readonly chosen: Classification;
  readonly observationId: number;
}

/**
 * Her choice: applied to this week, written to the crosswalk, and never asked again.
 *
 * The chosen id must be one of the candidates the outcome offered — including the
 * full list behind "None of these" — which `confirmChoice` enforces. A crafted POST
 * can therefore name only a row of the pinned revision, and the worst it can do is
 * choose a real classification badly.
 */
export async function confirmClassification(
  db: Db,
  tx: Tx,
  input: {
    readonly accountId: string;
    readonly userId: string;
    readonly project: ProjectRecord;
    readonly pin: PinRecord;
    readonly weekId: string;
    readonly rawTitle: string;
    readonly chosenOrdinal: number;
  },
): Promise<ConfirmResult | null> {
  const classifications = await classificationsOf(db, input.pin.wdNumber, input.pin.revision);
  const chosen = classifications.find((row) => row.ordinal === input.chosenOrdinal);
  if (!chosen) return null;

  const outcome = await resolveClassification(
    { db: tx },
    {
      lineId: input.rawTitle,
      rawTitle: input.rawTitle,
      tier: 'paid',
      pin: pinnedRevisionOf(input.project, input.pin),
      classifications,
      account: brandAccountId(input.accountId),
    },
  );

  const confirmation = await confirmChoice(tx, outcome, {
    account: brandAccountId(input.accountId),
    userId: input.userId,
    chosen: chosen.id,
    revision: input.pin.revision,
    corpusSnapshotRef: String(input.pin.snapshotId),
  });

  const lines = await weekLines(tx, input.weekId);
  const lineIds = lines.filter((line) => line.rawTitle === input.rawTitle).map((line) => line.lineId);
  await applyClassification(tx, lineIds, chosen, outcome.level === 'L_A' ? 'L_A' : outcome.level);

  return { chosen: confirmation.chosen, observationId: confirmation.observationId };
}

// ===========================================================================
// Settings → classification memory (S20)
// ===========================================================================

export interface MemoryEntry {
  readonly observationId: number;
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly titleRaw: string;
  readonly titleNorm: string;
  readonly chosenClassNorm: string;
  readonly chosenIdentifier: string;
  readonly provenance: 'deterministic' | 'llm_ranked' | 'user_confirmed';
  readonly resolvedAtLevel: string;
  readonly decidedAt: Date;
  /** How many filings already carry this mapping. Changing memory never rewrites
   *  them — §6.4 — so the count is what the amendment offer is sized from. */
  readonly affectedFilings: number;
}

export async function listMemory(tx: Tx): Promise<readonly MemoryEntry[]> {
  return rowsOf<{
    observation_id: number | string;
    wd_number: string;
    revision: number | string;
    title_raw: string;
    title_norm: string;
    chosen_class_norm: string;
    chosen_identifier: string;
    provenance: 'deterministic' | 'llm_ranked' | 'user_confirmed';
    resolved_at_level: string;
    decided_at: string | Date;
    affected: number | string;
  }>(
    await tx.execute(sql`
      SELECT o.observation_id, o.wd_number, o.revision, o.title_raw, o.title_norm,
             o.chosen_class_norm, o.chosen_identifier, o.provenance::text AS provenance,
             o.resolved_at_level::text AS resolved_at_level, o.decided_at,
             (SELECT count(DISTINCT f.id)::int
                FROM payroll_lines l
                JOIN payroll_worker_weeks ww ON ww.id = l.worker_week_id
                JOIN filings f ON f.week_id = ww.week_id
               WHERE l.title_norm = o.title_norm AND l.class_name_norm = o.chosen_class_norm) AS affected
        FROM crosswalk_observation o
       ORDER BY o.decided_at DESC
    `),
  ).map((row) => ({
    observationId: Number(row.observation_id),
    wdNumber: row.wd_number as WdNumber,
    revision: Number(row.revision),
    titleRaw: row.title_raw,
    titleNorm: row.title_norm,
    chosenClassNorm: row.chosen_class_norm,
    chosenIdentifier: row.chosen_identifier,
    provenance: row.provenance,
    resolvedAtLevel: row.resolved_at_level,
    decidedAt: new Date(row.decided_at),
    affectedFilings: Number(row.affected),
  }));
}

/**
 * Forget one remembered mapping.
 *
 * DELETE rather than UPDATE, because the crosswalk is a log of decisions and the
 * next upload will ask again and record a new one. Filings already generated are
 * untouched: artifacts are immutable, and the way to correct a released filing is an
 * amendment she signs, not a silent rewrite.
 */
export async function forgetMemory(tx: Tx, observationId: number): Promise<void> {
  await tx.execute(sql`
    DELETE FROM crosswalk_observation WHERE observation_id = ${observationId}
  `);
}

/** The `(wd_group, normalized_title)` keys this account has confirmed — used by
 *  find-my-WD to show "how many of your crafts this determination lists". */
export async function confirmedClassNorms(tx: Tx): Promise<readonly string[]> {
  return rowsOf<{ chosen_class_norm: string }>(
    await tx.execute(sql`
      SELECT DISTINCT chosen_class_norm FROM crosswalk_observation WHERE provenance = 'user_confirmed'
    `),
  ).map((row) => row.chosen_class_norm);
}

export function ordinalOf(id: ClassificationId): number {
  return parseClassificationId(id).ordinal;
}

export type { IsoDate };
