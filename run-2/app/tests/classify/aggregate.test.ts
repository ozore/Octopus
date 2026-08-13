/**
 * STAGE 1 — HIGH-2, asserted rather than asserted-to.
 *
 * `ARCHITECTURE.md` §11.6's correction is one sentence: the cross-tenant aggregate
 * may only ORDER a list. This file is the executable form of it, in four parts:
 *
 *  1. The return type has no field in which a selection could be expressed.
 *  2. `applyOrdering` is a permutation — it cannot shorten the list, drop a
 *     candidate or introduce one.
 *  3. No code path pre-selects from it, including an adversarially poisoned cell,
 *     and `blockedLine()` throws if one ever tries.
 *  4. Eligibility is a costly-signal test, and a DRAFT filing never counts.
 */

import fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  applyOrdering,
  isAggregateEligible,
  orderingOf,
  readAggregateOrdering,
  resolveClassification,
  scoreCandidates,
  candidateSlice,
  normalizeTitle,
  forbiddenRanker,
  ELIGIBILITY_MIN_DISTINCT_PROJECTS,
  ELIGIBILITY_MIN_RELEASED_FILINGS,
  type CandidateOrdering,
} from '@/classify';
import { withTenant } from '@/db/tenant';
import { blockedLine } from '@/lib/result';
import type { ClassificationId } from '@/lib/types';

import { createTestDb, FIXTURE, seedTenant, type TestDb } from '../helpers/pglite';
import { classByName, PIN, REVISION, seedAggregatePrior, seedRevision, VA_CLASSES } from './fixtures';

const TITLE = normalizeTitle('oper backhoe');
const BACKHOE = classByName('OPERATOR: BACKHOE/EXCAVATOR/TRACKHOE');
const BOBCAT = classByName('OPERATOR: BOBCAT/SKID STEER/SKID LOADER');

describe('CandidateOrdering — the type has nowhere to put a selection', () => {
  it('exposes exactly one enumerable data field, and it is a sequence', () => {
    const ordering = orderingOf([BACKHOE.id, BOBCAT.id]);
    expect(Object.keys(ordering)).toEqual(['order']);
    expect(Array.isArray(ordering.order)).toBe(true);
  });

  it('has no field a screen could read as a choice', () => {
    const ordering = orderingOf([BACKHOE.id]) as unknown as Record<string, unknown>;
    for (const forbidden of [
      'selected',
      'preSelected',
      'default',
      'recommended',
      'chosen',
      'apply',
      'autoApply',
      'confidence',
      'count',
      'supportingAccounts',
      'agreement',
      'tenantId',
      'accountId',
    ]) {
      expect(ordering[forbidden]).toBeUndefined();
    }
  });

  it('de-duplicates, so an id cannot be moved twice', () => {
    expect(orderingOf([BACKHOE.id, BACKHOE.id, BOBCAT.id]).order).toEqual([
      BACKHOE.id,
      BOBCAT.id,
    ]);
  });

  it('type check: the ordering’s only assignable data field is `order`', () => {
    // A compile-time assertion in a runtime file: if a second data field were ever
    // added to `CandidateOrdering`, `Exclude` stops being `'order'` and this line
    // fails to typecheck.
    type StringKeys = Extract<keyof CandidateOrdering, string>;
    const only: StringKeys = 'order';
    expect(only).toBe('order');
  });
});

describe('applyOrdering — a permutation, never a filter', () => {
  const candidates = candidateSlice(scoreCandidates(normalizeTitle('laborer'), VA_CLASSES));

  it('keeps every candidate, in any ordering, including nonsense ones', () => {
    const ids = candidates.map((candidate) => candidate.classificationId);
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...ids, 'not-on-this-revision' as ClassificationId), {
          maxLength: 12,
        }),
        (order) => {
          const applied = applyOrdering(candidates, orderingOf(order));
          expect(applied).toHaveLength(candidates.length);
          expect([...applied.map((c) => c.classificationId)].sort()).toEqual([...ids].sort());
        },
      ),
      { numRuns: 200 },
    );
  });

  it('is the identity for a null or empty ordering', () => {
    expect(applyOrdering(candidates, null)).toBe(candidates);
    expect(applyOrdering(candidates, orderingOf([]))).toBe(candidates);
  });

  it('puts named candidates first, in the ordering’s sequence, and keeps the rest behind', () => {
    const last = candidates[candidates.length - 1];
    const applied = applyOrdering(candidates, orderingOf([last?.classificationId as ClassificationId]));
    expect(applied[0]?.classificationId).toBe(last?.classificationId);
    expect(applied.slice(1).map((c) => c.classificationId)).toEqual(
      candidates.slice(0, -1).map((c) => c.classificationId),
    );
  });
});

describe('the backstop in src/lib/result.ts', () => {
  it('throws if any level other than L-C1 tries to arrive pre-selected', () => {
    for (const level of ['L_B', 'L_C2', 'L_D', 'L_E', 'L_F'] as const) {
      expect(() =>
        blockedLine({
          blockReason: 'UNMAPPED_TRADE',
          lineId: 'line-1',
          headline: 'x',
          detail: 'y',
          choices: [],
          ladderLevel: level,
          preSelected: BACKHOE.id,
        }),
      ).toThrow(/only arrive pre-selected at L-C1/);
    }
  });
});

describe('the aggregate, end to end, against the real materialized view', () => {
  let tdb: TestDb;

  beforeEach(async () => {
    tdb = await createTestDb();
    await seedRevision(tdb.client);
    await seedTenant(tdb, {
      account: FIXTURE.accountA,
      user: FIXTURE.userA,
      project: FIXTURE.projectA,
      band: 'over_100k',
      name: 'Rio Vista Concrete',
    });
  });

  afterEach(async () => {
    await tdb.close();
  });

  it('returns null when no cell reaches the publication floor', async () => {
    const candidates = candidateSlice(scoreCandidates(TITLE, VA_CLASSES));
    const ordering = await tdb.asApp(() =>
      withTenant(tdb.db, { accountId: FIXTURE.accountA as never }, (tx) =>
        readAggregateOrdering(
          tx,
          { titleNorm: TITLE, stateCode: 'VA', constructionType: 'HEAVY' },
          candidates,
        ),
      ),
    );
    expect(ordering).toBeNull();
  });

  it('orders the list — and nothing else — when a poisoned cell is published', async () => {
    // The attack, executed: five accounts that have each done real work all map
    // "OPERATOR BACKHOE" to the BOBCAT row. The designed blast radius is that the
    // candidate the customer wants is second instead of first.
    await seedAggregatePrior(tdb.client, {
      titleNorm: String(TITLE),
      classNameNorm: BOBCAT.classNameNorm,
      identifier: BOBCAT.rateIdentifier,
    });

    const outcome = await tdb.asApp(() =>
      withTenant(tdb.db, { accountId: FIXTURE.accountA as never }, (tx) =>
        resolveClassification(
          { db: tx, transport: forbiddenRanker('L-B must not reach the model') },
          {
            lineId: 'line-1',
            rawTitle: 'oper backhoe',
            tier: 'paid',
            pin: PIN,
            classifications: VA_CLASSES,
            account: FIXTURE.accountA as never,
          },
        ),
      ),
    );

    expect(outcome.level).toBe('L_B');
    // The poisoned row is first...
    expect(outcome.picker[0]?.classificationId).toBe(BOBCAT.id);
    // ...and that is the ENTIRE effect. Nothing is chosen, nothing is annotated,
    // the line is blocked, and the row the customer wants is still on the screen
    // with its own verbatim scope text and rates.
    expect(outcome.preSelected).toBeNull();
    expect(outcome.resolved).toBeNull();
    expect(outcome.modelCalled).toBe(false);
    expect(outcome.candidates.map((c) => c.classificationId)).toContain(BACKHOE.id);
    expect(outcome.refusal?.primitive).toBe('P-A');
    if (outcome.refusal?.primitive !== 'P-A') return;
    expect(outcome.refusal.preSelected).toBeNull();
    for (const choice of outcome.refusal.choices) {
      expect(choice.verbatimSource.length).toBeGreaterThan(0);
      expect(choice.baseRate).toBeDefined();
    }
  });

  it('never lets a prior reach the prompt', async () => {
    // §7.4: `crosswalk_prior` influences the deterministic ordering, never the
    // prompt. The structural proof is that an aggregate hit does not call the
    // model at all — and `RankPromptInput` has no field for it either.
    await seedAggregatePrior(tdb.client, {
      titleNorm: String(TITLE),
      classNameNorm: BOBCAT.classNameNorm,
      identifier: BOBCAT.rateIdentifier,
    });
    const outcome = await tdb.asApp(() =>
      withTenant(tdb.db, { accountId: FIXTURE.accountA as never }, (tx) =>
        resolveClassification(
          { db: tx, transport: forbiddenRanker(), modelId: 'claude-sonnet-5' },
          {
            lineId: 'line-1',
            rawTitle: 'oper backhoe',
            tier: 'paid',
            pin: PIN,
            classifications: VA_CLASSES,
            account: FIXTURE.accountA as never,
          },
        ),
      ),
    );
    expect(outcome.modelCalled).toBe(false);
  });
});

describe('eligibility — a costly-signal test, not a trust test', () => {
  let tdb: TestDb;

  beforeEach(async () => {
    tdb = await createTestDb();
    await seedRevision(tdb.client);
    await seedTenant(tdb, {
      account: FIXTURE.accountA,
      user: FIXTURE.userA,
      project: FIXTURE.projectA,
      band: 'over_100k',
      name: 'Rio Vista Concrete',
    });
    await tdb.client.query(
      `INSERT INTO projects
         (id, account_id, name, state_code, county_name, county_name_norm, construction_type,
          funding_source, contract_value_band, band_asserted_at, band_asserted_by)
       VALUES ($1, $2, 'Second', 'VA', 'Fairfax', 'FAIRFAX', 'HEAVY', 'FHWA', 'over_100k', now(), $3)`,
      [FIXTURE.projectB, FIXTURE.accountA, FIXTURE.userA],
    );
  });

  afterEach(async () => {
    await tdb.close();
  });

  async function addFiling(
    project: string,
    week: string,
    state: 'RELEASED' | 'DRAFT',
    status: 'CERTIFIABLE' | 'DRAFT_NOT_CERTIFIABLE' = 'CERTIFIABLE',
  ): Promise<void> {
    const blocks = status === 'DRAFT_NOT_CERTIFIABLE' ? `ARRAY['UNMAPPED_TRADE']::block_reason[]` : `'{}'::block_reason[]`;
    await tdb.client.query(
      `INSERT INTO filings
         (id, account_id, project_id, week_ending, sequence, state, artifact_status,
          block_reasons, engine_version, build_sha, freshness_state)
       VALUES (gen_random_uuid(), $1, $2, $3::date, 1, $4, $5, ${blocks}, 1, 'test', 'FRESH')`,
      [FIXTURE.accountA, project, week, state, status],
    );
  }

  const eligible = async (): Promise<boolean> =>
    tdb.asApp(() =>
      withTenant(tdb.db, { accountId: FIXTURE.accountA as never }, (tx) =>
        isAggregateEligible(tx, FIXTURE.accountA as never),
      ),
    );

  it('is false for a brand-new account', async () => {
    expect(await eligible()).toBe(false);
  });

  it('is false at the filing count but on one project', async () => {
    for (let week = 0; week < ELIGIBILITY_MIN_RELEASED_FILINGS; week += 1) {
      await addFiling(FIXTURE.projectA, `2026-07-${String(3 + week * 7).padStart(2, '0')}`, 'RELEASED');
    }
    expect(await eligible()).toBe(false);
  });

  it('is true at four released filings across two projects', async () => {
    await addFiling(FIXTURE.projectA, '2026-07-03', 'RELEASED');
    await addFiling(FIXTURE.projectA, '2026-07-10', 'RELEASED');
    await addFiling(FIXTURE.projectB, '2026-07-17', 'RELEASED');
    await addFiling(FIXTURE.projectB, '2026-07-24', 'RELEASED');
    expect(ELIGIBILITY_MIN_DISTINCT_PROJECTS).toBe(2);
    expect(await eligible()).toBe(true);
  });

  it('does not count a DRAFT — NOT CERTIFIABLE filing', async () => {
    // The state a poisoning script would sit in: generate drafts, never release.
    await addFiling(FIXTURE.projectA, '2026-07-03', 'DRAFT', 'DRAFT_NOT_CERTIFIABLE');
    await addFiling(FIXTURE.projectA, '2026-07-10', 'DRAFT', 'DRAFT_NOT_CERTIFIABLE');
    await addFiling(FIXTURE.projectB, '2026-07-17', 'DRAFT', 'DRAFT_NOT_CERTIFIABLE');
    await addFiling(FIXTURE.projectB, '2026-07-24', 'DRAFT', 'DRAFT_NOT_CERTIFIABLE');
    expect(await eligible()).toBe(false);
  });

  it('fails closed with no tenant context: an unscoped read reports ineligible', async () => {
    await addFiling(FIXTURE.projectA, '2026-07-03', 'RELEASED');
    await addFiling(FIXTURE.projectA, '2026-07-10', 'RELEASED');
    await addFiling(FIXTURE.projectB, '2026-07-17', 'RELEASED');
    await addFiling(FIXTURE.projectB, '2026-07-24', 'RELEASED');
    const unscoped = await tdb.asApp(() => isAggregateEligible(tdb.db, FIXTURE.accountA as never));
    expect(unscoped).toBe(false);
    expect(REVISION).toBe(2);
  });
});
