/**
 * STAGE 0 — the account's own memory, and the write that mints it.
 *
 * AUTHORITY: `ENGINE.md` §15.1 (Stage 0) and §15.7 (the crosswalk write);
 * `CORPUS_DESIGN.md` §7.2 (DDL) and §7.3 (how a correction feeds the crosswalk);
 * `USER_JOURNEY.md` §6.3 (the three mechanisms) and §6.3.1 (the permission table).
 *
 * ===========================================================================
 * THIS IS THE ONE SILENT PATH IN THE PRODUCT, AND IT IS THE PRODUCT
 *
 * `USER_JOURNEY.md` §6.3.1's permission table grants exactly one power to
 * auto-apply with no picker: **this account's own `user_confirmed` entry for this
 * `(wd_number, normalized_title)`**. The reasoning is not that the account is
 * trusted more than a model — it is that the account is asserting a fact about its
 * own crew to itself. There is no cross-tenant trust involved, so there is no sybil
 * surface: an attacker who creates accounts can only poison their own picker.
 *
 * Everything else on the ladder blocks the line. A6's economics and D6's "asked
 * once, never again" both rest on this single query returning a row.
 *
 * ===========================================================================
 * THREE THINGS THE LOOKUP DOES THAT LOOK LIKE OVERKILL
 *
 * 1. **It filters `provenance = 'user_confirmed'`.** A deterministic guess and a
 *    model ordering are also rows in this table — they are written for the eval set
 *    (§26) — and neither may auto-apply. Reading them back as memory would convert
 *    our own suggestion into the customer's answer, which is the exact loop that
 *    makes a measured hit rate meaningless.
 * 2. **It takes the LATEST row, not the first.** The table is append-only and the
 *    memory editor (S20) writes a correction as a new row. Latest-wins is what makes
 *    "she realises three weeks later that she picked wrong" a one-click fix.
 * 3. **It re-resolves the remembered class against THIS revision's parsed rows.**
 *    A pin can move to a new revision (J8) and a classification can leave a
 *    determination. If the remembered class is not on the revision in front of us,
 *    the lookup MISSES and the customer sees the picker — rather than the engine
 *    resolving to a class that is not on the document the filing cites.
 *
 * ===========================================================================
 * EVERY QUERY HERE RUNS INSIDE `withTenant`
 *
 * `crosswalk_observation` carries RLS (`ratepin_enable_tenant_rls`), so an unscoped
 * connection reads zero rows and writes none. That is the boundary failing closed:
 * forgetting the tenant context is a zero-row bug, not a leak.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db, type Tx } from '@/db';
import type { AccountId } from '@/db/tenant';
import type { Classification, ClassificationLevel, WdNumber } from '@/lib/types';

import type { LexicalCandidate } from './lexical';
import type { TitleNorm } from './normalize';

export type Executor = Db | Tx;

/** `crosswalk_observation.provenance`. `ARCHITECTURE.md` §3.7's three sources. */
export type CrosswalkProvenance = 'deterministic' | 'llm_ranked' | 'user_confirmed';

export interface CrosswalkHit {
  readonly observationId: number;
  readonly titleNorm: TitleNorm;
  readonly chosenClassNorm: string;
  readonly chosenIdentifier: string;
  readonly resolvedAtLevel: ClassificationLevel;
  readonly decidedAt: Date;
}

interface HitRow {
  observation_id: number | string;
  title_norm: string;
  chosen_class_norm: string;
  chosen_identifier: string;
  resolved_at_level: ClassificationLevel;
  decided_at: string | Date;
}

export interface CrosswalkQuery {
  readonly account: AccountId;
  readonly wdNumber: WdNumber;
  readonly titleNorm: TitleNorm;
}

/**
 * The account's latest confirmed answer for this title on this determination.
 *
 * The key includes `wd_number` deliberately: the same title maps to different
 * classifications on different determinations, and pretending otherwise is how a
 * Building-determination carpenter rate lands on a Highway filing
 * (`CORPUS_DESIGN.md` §7.3 step 2).
 */
export async function lookupCrosswalk(
  db: Executor,
  query: CrosswalkQuery,
): Promise<CrosswalkHit | null> {
  if (String(query.titleNorm) === '') return null;
  const rows = rowsOf<HitRow>(
    await db.execute(sql`
      SELECT observation_id, title_norm, chosen_class_norm, chosen_identifier,
             resolved_at_level, decided_at
      FROM crosswalk_observation
      WHERE account_id = ${query.account}::uuid
        AND wd_number = ${query.wdNumber}
        AND title_norm = ${String(query.titleNorm)}
        AND provenance = 'user_confirmed'
      ORDER BY decided_at DESC, observation_id DESC
      LIMIT 1
    `),
  );
  const row = rows[0];
  if (row === undefined) return null;
  return {
    observationId: Number(row.observation_id),
    titleNorm: row.title_norm as TitleNorm,
    chosenClassNorm: row.chosen_class_norm,
    chosenIdentifier: row.chosen_identifier,
    resolvedAtLevel: row.resolved_at_level,
    decidedAt: row.decided_at instanceof Date ? row.decided_at : new Date(row.decided_at),
  };
}

/**
 * Project a remembered answer onto THIS revision's parsed rows.
 *
 * `undefined` — the class is not on this revision — is a MISS, not an error: the
 * line goes to the picker and the customer's next confirmation becomes the memory
 * for the new revision. Silence here would be a rate on a form citing a document
 * that does not contain it.
 */
export function resolveHit(
  hit: CrosswalkHit,
  classifications: readonly Classification[],
): Classification | undefined {
  return classifications.find(
    (classification) =>
      classification.classNameNorm === hit.chosenClassNorm &&
      classification.rateIdentifier === hit.chosenIdentifier,
  );
}

/**
 * The account's own earlier choices on this determination, as ordinals — the only
 * per-account history `CORPUS_DESIGN.md` §7.4 permits into the prompt.
 */
export async function ownPriorOrdinals(
  db: Executor,
  query: Pick<CrosswalkQuery, 'account' | 'wdNumber'>,
  classifications: readonly Classification[],
  limit = 8,
): Promise<readonly number[]> {
  const rows = rowsOf<{ chosen_class_norm: string; chosen_identifier: string }>(
    await db.execute(sql`
      SELECT DISTINCT ON (chosen_class_norm, chosen_identifier)
             chosen_class_norm, chosen_identifier
      FROM crosswalk_observation
      WHERE account_id = ${query.account}::uuid
        AND wd_number = ${query.wdNumber}
        AND provenance = 'user_confirmed'
      ORDER BY chosen_class_norm, chosen_identifier
      LIMIT ${limit}
    `),
  );
  const ordinals: number[] = [];
  for (const row of rows) {
    const match = classifications.find(
      (classification) =>
        classification.classNameNorm === row.chosen_class_norm &&
        classification.rateIdentifier === row.chosen_identifier,
    );
    if (match !== undefined) ordinals.push(match.ordinal);
  }
  return ordinals;
}

// ===========================================================================
// The write — §15.7, "where the moat is minted"
// ===========================================================================

/** One row of the `offered` audit payload: what we put in front of the customer,
 *  so a correction is MEASURABLE rather than anecdotal (§7.3 step 6). */
export interface OfferedCandidate {
  readonly class: string;
  readonly identifier: string;
  readonly rank: number;
  readonly score: number;
  readonly source: 'deterministic' | 'llm_ranked' | 'aggregate_ordered';
}

export function offeredFrom(
  candidates: readonly LexicalCandidate[],
  source: OfferedCandidate['source'],
): readonly OfferedCandidate[] {
  return candidates.map((candidate, index) => ({
    class: candidate.classification.classNameNorm,
    identifier: candidate.classification.rateIdentifier,
    rank: index + 1,
    score: candidate.score,
    source,
  }));
}

export interface ConfirmationInput {
  readonly account: AccountId;
  /** Required by `cw_obs_confirmed_by`: a `user_confirmed` row without a person is
   *  a contradiction, and the database says so rather than the code remembering. */
  readonly userId: string;
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly rawTitle: string;
  readonly titleNorm: TitleNorm;
  readonly chosen: Classification;
  readonly offered: readonly OfferedCandidate[];
  /**
   * 1-based position in the top three, or `null` when the customer picked outside
   * it. `NULL` is "the single most informative row in the table" (§7.3 step 6) — it
   * is the ranker's regression set.
   */
  readonly chosenRank: number | null;
  readonly resolvedAtLevel: ClassificationLevel;
  readonly llmUsed: boolean;
  readonly rankerVersion: number;
  /** §15.7's attribution. See the note below on where it is stored. */
  readonly modelId?: string;
  readonly promptBundleHash?: string;
  readonly corpusSnapshotRef?: string;
}

/**
 * Write the confirmation.
 *
 * NOTE ON WHERE THE ATTRIBUTION LIVES. `ENGINE.md` §15.7 stamps `prompt_bundle_hash`
 * and `model_id` as COLUMNS; `CORPUS_DESIGN.md` §7.2's DDL — which
 * `drizzle/0000_init.sql` implements and which is the schema of record — has neither.
 * Rather than edit a schema this module does not own, both travel inside the
 * `offered` jsonb alongside the candidate list, so §26's benchmark can still be
 * sliced by prompt build and model id. The departure is recorded here and reported
 * upward; the fix is a column, not a convention.
 *
 * Returns the new `observation_id`. Idempotency is deliberately NOT attempted: the
 * table is append-only and latest-wins, so a double click writes two identical rows
 * and reads back the same answer, where a unique constraint would reject the
 * customer's CORRECTION as a duplicate.
 */
export async function recordConfirmation(tx: Tx, input: ConfirmationInput): Promise<number> {
  if (input.chosenRank !== null && (input.chosenRank < 1 || input.chosenRank > 3)) {
    throw new Error(
      `recordConfirmation: chosenRank must be 1..3 or null (got ${String(input.chosenRank)}); ` +
        'a pick outside the offered top three is recorded as null, which is the row the ' +
        'ranker benchmark reads.',
    );
  }
  if (String(input.titleNorm) === '') {
    throw new Error('recordConfirmation: refusing to remember an empty normalized title');
  }

  await tx.execute(sql`
    INSERT INTO payroll_title (title_norm, observation_ct)
    VALUES (${String(input.titleNorm)}, 1)
    ON CONFLICT (title_norm)
    DO UPDATE SET observation_ct = payroll_title.observation_ct + 1
  `);

  const payload = {
    candidates: input.offered,
    model_id: input.modelId ?? null,
    prompt_bundle_hash: input.promptBundleHash ?? null,
    corpus_snapshot: input.corpusSnapshotRef ?? null,
    ranker_version: input.rankerVersion,
  };

  const rows = rowsOf<{ observation_id: number | string }>(
    await tx.execute(sql`
      INSERT INTO crosswalk_observation
        (account_id, confirmed_by_user_id, wd_number, revision, title_norm, title_raw,
         chosen_class_norm, chosen_identifier, provenance, offered, chosen_rank,
         ranker_version, resolved_at_level, llm_used)
      VALUES
        (${input.account}::uuid, ${input.userId}::uuid, ${input.wdNumber}, ${input.revision},
         ${String(input.titleNorm)}, ${input.rawTitle},
         ${input.chosen.classNameNorm}, ${input.chosen.rateIdentifier}, 'user_confirmed',
         ${JSON.stringify(payload)}::jsonb, ${input.chosenRank},
         ${input.rankerVersion}, ${input.resolvedAtLevel}, ${input.llmUsed})
      RETURNING observation_id
    `),
  );
  const row = rows[0];
  /* c8 ignore next */
  if (row === undefined) throw new Error('recordConfirmation: insert returned no row');
  return Number(row.observation_id);
}

/**
 * `USER_JOURNEY.md` §6.3's peak-end line, rendered from a per-account counter and
 * from nothing else.
 *
 * H2 — ">= 90% of titles resolve from memory after four filings" — is a HYPOTHESIS
 * about the fleet and the UI never states it. What the UI may state is her own
 * number, because it is a report of a counter she owns rather than a claim about
 * anyone else. `CORRECTIONS.md` F-4 forbids the other kind.
 */
export function memoryResolutionLine(resolved: number, total: number): string {
  if (total <= 0) return '';
  return resolved === total
    ? `${resolved} of ${total} titles resolved from memory this week. No classification decisions needed.`
    : `${resolved} of ${total} titles resolved from memory this week.`;
}
