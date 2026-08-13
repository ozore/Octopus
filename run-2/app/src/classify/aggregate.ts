/**
 * STAGE 1 — the cross-tenant aggregate, which may ORDER a list and do nothing else.
 *
 * AUTHORITY: `ARCHITECTURE.md` §11.6 (**AS-5**, the HIGH-2 correction) and §3.9's
 * boundary row for `crosswalk/aggregate/**`; `USER_JOURNEY.md` §6.3.1's permission
 * table; `CORPUS_DESIGN.md` §7.2 and §7.4 (the storage half); `ENGINE.md` §15.1.
 *
 * ===========================================================================
 * THE FINDING, IN ONE SENTENCE, BECAUSE THIS FILE IS WHERE IT IS KEPT OR BROKEN
 *
 * > The cross-tenant aggregate may only ORDER a list. It may never pre-select,
 * > default, or auto-apply.
 *
 * The reason is not that another contractor's answer is weak evidence. It is that
 * signup is a free magic link (A1), so `count(DISTINCT account_id) >= 5` is an
 * ATTACKER-CONTROLLED INPUT — k-anonymity is a disclosure construct and was being
 * used here as an integrity control. Five sybils are a Tuesday afternoon.
 *
 * The asymmetry between the two powers is the whole argument:
 *
 *  - **As an ordering input**, a poisoned cell produces three real classifications
 *    from this determination's own parsed rows in a worse sequence. Each still
 *    carries its verbatim label, its verbatim scope text, its base and fringe rates
 *    and a link to the source lines, and the customer still has to read one and
 *    click it. The blast radius is *a worse first guess*.
 *  - **As a pre-selection**, it is a wrong classification, hence a wrong rate,
 *    arriving already chosen, on a document signed under 18 U.S.C. 1001, for every
 *    tenant on that WD group — accepted by anyone who does not read. And
 *    `USER_JOURNEY.md`'s **H-J6b** says out loud that we have not measured whether
 *    anyone reads.
 *
 * ===========================================================================
 * HOW THAT IS ENFORCED HERE: THE RETURN TYPE HAS NOWHERE TO PUT A SELECTION
 *
 * `CandidateOrdering` carries one data field — a sequence of ids. There is no
 * `selected`, no `default`, no `recommended`, no `confidence`, no `count`, and no
 * per-candidate annotation, so a screen that wanted to fill a radio from this would
 * have to invent the field first, which is a diff a reviewer can see. `AS-5` calls
 * this "enforced structurally rather than by policy"; the structure is the absence
 * of a field.
 *
 * Two further properties are asserted rather than described, in
 * `tests/classify/aggregate.test.ts`:
 *
 *  - `applyOrdering` returns a PERMUTATION. It cannot shorten the list (§11.6's
 *    "may not shorten the list"), cannot drop a candidate the retriever found, and
 *    cannot introduce one it did not.
 *  - No `Refusal` produced under an aggregate ordering carries a pre-selection —
 *    and `blockedLine()` in `src/lib/result.ts` throws if one ever tries, because
 *    `preSelected` is only legal at L-C1.
 *
 * ===========================================================================
 * WHAT WE READ, AND WHAT WE DELIBERATELY CANNOT READ
 *
 * `crosswalk_prior` publishes a BUCKETED agreement ratio, never a count: §7.4 (iv)
 * — "the exact k of a cell is not readable through any API". So the L-B trigger's
 * "agreement >= 0.90" is not observable from the published view; the strictest
 * thing that is, is the top `width_bucket(…, 0, 1, 5)` band, which is agreement
 * above 0.8. We take the top band and say so here rather than pretending to a
 * precision the view was coarsened to remove. Recorded as **Q-CL2**.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db, type Tx } from '@/db';
import type { AccountId } from '@/db/tenant';
import type { ClassificationId } from '@/lib/types';

import type { LexicalCandidate } from './lexical';
import type { TitleNorm } from './normalize';

export type Executor = Db | Tx;

/** `CORPUS_DESIGN.md` §7.4. A publication floor, and — since HIGH-2 — explicitly
 *  not a defence against poisoning. The defence is that the power granted is
 *  ordering. */
export const AGGREGATE_K = 5;

/** The top bucket of `width_bucket(ratio, 0, 1, 5)`. See Q-CL2 above. */
export const AGGREGATE_MIN_BAND = 5;

/** `ARCHITECTURE.md` §11.6 protection 3 and `CORPUS_DESIGN.md` §7.2's
 *  `crosswalk_eligible_account`: weeks of real work per sybil, against a $0 signup. */
export const ELIGIBILITY_MIN_RELEASED_FILINGS = 4;
export const ELIGIBILITY_MIN_DISTINCT_PROJECTS = 2;

/** Module-private and unforgeable: a call site outside this file cannot write an
 *  object literal that satisfies `CandidateOrdering`, so the only way to produce
 *  one is `orderingOf`, and the only thing `orderingOf` can express is a sequence. */
const ORDERING_ONLY: unique symbol = Symbol('ratepin.candidate-ordering');

/**
 * AN ORDERING. Not a suggestion, not a default, not a selection.
 *
 * The private symbol makes this unforgeable from a literal, so a call site cannot
 * hand-roll `{ order: [...] }` and slip a second field past review by widening the
 * type later.
 */
export interface CandidateOrdering {
  readonly [ORDERING_ONLY]: 'crosswalk-aggregate-ordering';
  /** THE ONLY DATA FIELD, AND IT MUST STAY THAT WAY. */
  readonly order: readonly ClassificationId[];
}

/** The only constructor. De-duplicates, because a repeated id in an ordering is a
 *  bug that would otherwise silently move a candidate twice. */
export function orderingOf(ids: readonly ClassificationId[]): CandidateOrdering {
  const seen = new Set<string>();
  const order: ClassificationId[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
  }
  return { [ORDERING_ONLY]: 'crosswalk-aggregate-ordering', order: Object.freeze(order) };
}

export interface AggregateQuery {
  readonly titleNorm: TitleNorm;
  /** From the pinned revision. `null` matches the view's own `NULL` state code. */
  readonly stateCode: string | null;
  readonly constructionType: string;
}

interface PriorRow {
  chosen_class_norm: string;
  agreement_band: number | string | null;
}

/**
 * Read the aggregate prior and project it onto the candidates the retriever already
 * found.
 *
 * THREE THINGS THIS FUNCTION CANNOT DO, and the reasons are structural rather than
 * disciplinary: it cannot return a classification (the return type is an ordering
 * of ids the caller already holds), it cannot introduce a candidate that is not on
 * this revision (an id it does not recognise is skipped), and it cannot leak a
 * tenant identity (the view publishes none — `crosswalk_eligible_account` is not
 * even granted to the application role).
 *
 * Returns `null` when no cell qualifies, which is the ordinary case and is what
 * keeps L-B off the ladder for most titles.
 */
export async function readAggregateOrdering(
  db: Executor,
  query: AggregateQuery,
  candidates: readonly LexicalCandidate[],
): Promise<CandidateOrdering | null> {
  if (candidates.length === 0) return null;

  const rows = rowsOf<PriorRow>(
    await db.execute(sql`
      SELECT chosen_class_norm, agreement_band
      FROM crosswalk_prior
      WHERE title_norm = ${String(query.titleNorm)}
        AND construction_type = ${query.constructionType}
        AND (state_code = ${query.stateCode} OR (state_code IS NULL AND ${query.stateCode}::text IS NULL))
        AND agreement_band >= ${AGGREGATE_MIN_BAND}
      ORDER BY agreement_band DESC, chosen_class_norm ASC
    `),
  );
  if (rows.length === 0) return null;

  // `class_name_norm` is the corpus's own normalization (`normaliseClassName`), and
  // it is what `recordConfirmation` writes, so the two sides of this join are the
  // same function's output by construction.
  const byClassNorm = new Map<string, ClassificationId>();
  for (const candidate of candidates) {
    const key = candidate.classification.classNameNorm;
    if (!byClassNorm.has(key)) byClassNorm.set(key, candidate.classificationId);
  }

  const ordered: ClassificationId[] = [];
  for (const row of rows) {
    const id = byClassNorm.get(row.chosen_class_norm);
    if (id !== undefined) ordered.push(id);
  }
  return ordered.length === 0 ? null : orderingOf(ordered);
}

/**
 * Apply an ordering. THE RESULT IS A PERMUTATION OF THE INPUT — same members, same
 * length, every time.
 *
 * Candidates the ordering names come first, in its sequence; everything else keeps
 * the retriever's own order behind them. Nothing is dropped, because §11.6 forbids
 * shortening the list, and because a candidate the customer needs must not vanish
 * on the strength of what five strangers did.
 */
export function applyOrdering(
  candidates: readonly LexicalCandidate[],
  ordering: CandidateOrdering | null,
): readonly LexicalCandidate[] {
  if (ordering === null || ordering.order.length === 0) return candidates;
  const rank = new Map<string, number>();
  ordering.order.forEach((id, index) => rank.set(id, index));

  const named: LexicalCandidate[] = [];
  const rest: LexicalCandidate[] = [];
  for (const candidate of candidates) {
    if (rank.has(candidate.classificationId)) named.push(candidate);
    else rest.push(candidate);
  }
  named.sort(
    (left, right) =>
      (rank.get(left.classificationId) ?? 0) - (rank.get(right.classificationId) ?? 0),
  );
  return [...named, ...rest];
}

/**
 * Whether THIS account's confirmations may contribute to the aggregate at all.
 *
 * `crosswalk_eligible_account` in `drizzle/0000_init.sql` is the authority and runs
 * inside the materialized view as owner; this is the same predicate, readable by
 * the account about itself, for the status surface and for the tests that assert
 * the rule exists. It is a costly-signal test, not a trust test: four RELEASED
 * filings across two projects is weeks of real work per sybil, and a
 * `DRAFT — NOT CERTIFIABLE` filing never counts, because the customer downloading a
 * draft is the state a poisoning script would sit in.
 *
 * Must be called inside `withTenant`: `filings` is RLS-scoped, so an unscoped call
 * counts zero rows and reports ineligible — the boundary fails closed.
 */
export async function isAggregateEligible(db: Executor, account: AccountId): Promise<boolean> {
  const rows = rowsOf<{ released: number | string; projects: number | string }>(
    await db.execute(sql`
      SELECT count(*)::int AS released, count(DISTINCT project_id)::int AS projects
      FROM filings
      WHERE account_id = ${account}::uuid AND state = 'RELEASED'
    `),
  );
  const row = rows[0];
  if (row === undefined) return false;
  return (
    Number(row.released) >= ELIGIBILITY_MIN_RELEASED_FILINGS &&
    Number(row.projects) >= ELIGIBILITY_MIN_DISTINCT_PROJECTS
  );
}
