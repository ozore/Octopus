/**
 * L-A AND THE CLICK THAT MINTS IT.
 *
 * This is the journey the entire autonomy argument rests on: A3 names one
 * human-shaped question in this product — *"which classification is this guy?"* —
 * and this file is where it is answered without a human, once, forever.
 *
 * A real Postgres with real row-level security is worth the fixture cost here,
 * because three of the properties below are the database's and not the code's: the
 * tenant boundary, the `user_confirmed` constraint, and the append-only shape that
 * makes a correction a new row rather than an edit.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  confirmChoice,
  forbiddenRanker,
  lookupCrosswalk,
  memoryResolutionLine,
  normalizeTitle,
  ownPriorOrdinals,
  resolveClassification,
  type ClassificationOutcome,
} from '@/classify';
import type { Tx } from '@/db';
import { withTenant } from '@/db/tenant';
import type { ClassificationId } from '@/lib/types';

import { createTestDb, FIXTURE, seedTenant, type TestDb, type SeededTenant } from '../helpers/pglite';
import { classByName, PIN, REVISION, seedRevision, VA_CLASSES } from './fixtures';

const RAW = 'CEM MASON - FINISH';
const TITLE = normalizeTitle(RAW);
const MASON = classByName('CEMENT MASON/CONCRETE FINISHER');

let tdb: TestDb;
let alvarado: SeededTenant;
let bell: SeededTenant;

beforeEach(async () => {
  tdb = await createTestDb();
  await seedRevision(tdb.client);
  alvarado = await seedTenant(tdb, {
    account: FIXTURE.accountA,
    user: FIXTURE.userA,
    project: FIXTURE.projectA,
    band: 'over_100k',
    name: 'Rio Vista Concrete',
  });
  bell = await seedTenant(tdb, {
    account: FIXTURE.accountB,
    user: FIXTURE.userB,
    project: FIXTURE.projectB,
    band: 'over_100k',
    name: 'Bell Striping',
  });
});

afterEach(async () => {
  await tdb.close();
});

async function asTenant<T>(tenant: SeededTenant, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return tdb.asApp(() => withTenant(tdb.db, { accountId: tenant.accountId }, fn));
}

async function resolveFor(
  tenant: SeededTenant,
  rawTitle = RAW,
  classifications = VA_CLASSES,
): Promise<ClassificationOutcome> {
  return asTenant(tenant, (tx) =>
    resolveClassification(
      { db: tx, transport: forbiddenRanker('this case must not reach the model') },
      {
        lineId: 'line-1',
        rawTitle,
        tier: 'paid',
        pin: PIN,
        classifications,
        account: tenant.accountId,
      },
    ),
  );
}

describe('the unmapped line stays blocked until a click, then never asks again', () => {
  it('blocks with P-A before the click, and resolves silently after it', async () => {
    const before = await resolveFor(alvarado);
    expect(before.level).toBe('L_E');
    expect(before.resolved).toBeNull();
    expect(before.refusal?.primitive).toBe('P-A');
    if (before.refusal?.primitive !== 'P-A') return;
    expect(before.refusal.blockReason).toBe('UNMAPPED_TRADE');
    expect(before.refusal.preSelected).toBeNull();
    expect(before.refusal.choices.map((choice) => choice.value)).toContain(MASON.id);

    const { observationId, chosen } = await asTenant(alvarado, (tx) =>
      confirmChoice(tx, before, {
        account: alvarado.accountId,
        userId: alvarado.userId,
        chosen: MASON.id,
        revision: REVISION,
      }),
    );
    expect(observationId).toBeGreaterThan(0);
    expect(chosen.className).toBe(MASON.className);

    const after = await resolveFor(alvarado);
    expect(after.level).toBe('L_A');
    expect(after.resolved?.id).toBe(MASON.id);
    expect(after.refusal).toBeNull();
    expect(after.picker).toHaveLength(0);
    expect(after.attribution.ordering).toBe('crosswalk');
  });

  it('remembers across spellings that normalize to the same key', async () => {
    const outcome = await resolveFor(alvarado);
    await asTenant(alvarado, (tx) =>
      confirmChoice(tx, outcome, {
        account: alvarado.accountId,
        userId: alvarado.userId,
        chosen: MASON.id,
        revision: REVISION,
      }),
    );
    for (const spelling of ['cem mason – finish', 'CEM  MASON   -  FINISH.', 'Cement Mason Finisher']) {
      expect(normalizeTitle(spelling)).toBe(TITLE);
      expect((await resolveFor(alvarado, spelling)).level).toBe('L_A');
    }
  });

  it('records the rank we offered, so a correction is measurable', async () => {
    const outcome = await resolveFor(alvarado);
    await asTenant(alvarado, (tx) =>
      confirmChoice(tx, outcome, {
        account: alvarado.accountId,
        userId: alvarado.userId,
        chosen: MASON.id,
        revision: REVISION,
      }),
    );
    const rows = await tdb.client.query<{ chosen_rank: number; llm_used: boolean; offered: unknown }>(
      `SELECT chosen_rank, llm_used, offered FROM crosswalk_observation`,
    );
    expect(rows.rows[0]?.chosen_rank).toBe(1);
    expect(rows.rows[0]?.llm_used).toBe(false);
    expect(rows.rows[0]?.offered).toMatchObject({ ranker_version: 1 });
  });

  it('records NULL when the customer picked past the offered top three', async () => {
    // The single most informative row in the table: the ranker was wrong.
    const outcome = await resolveFor(alvarado, 'underwater welder diver');
    expect(outcome.level).toBe('L_F');
    const outside = outcome.candidates[6] as { classificationId: ClassificationId };
    await asTenant(alvarado, (tx) =>
      confirmChoice(tx, outcome, {
        account: alvarado.accountId,
        userId: alvarado.userId,
        chosen: outside.classificationId,
        revision: REVISION,
      }),
    );
    const rows = await tdb.client.query<{ chosen_rank: number | null }>(
      `SELECT chosen_rank FROM crosswalk_observation`,
    );
    expect(rows.rows[0]?.chosen_rank).toBeNull();
  });

  it('counts the title, so `payroll_title` knows how often the fleet sees it', async () => {
    const outcome = await resolveFor(alvarado);
    for (let index = 0; index < 2; index += 1) {
      await asTenant(alvarado, (tx) =>
        confirmChoice(tx, outcome, {
          account: alvarado.accountId,
          userId: alvarado.userId,
          chosen: MASON.id,
          revision: REVISION,
        }),
      );
    }
    const rows = await tdb.client.query<{ observation_ct: number }>(
      `SELECT observation_ct FROM payroll_title WHERE title_norm = $1`,
      [String(TITLE)],
    );
    expect(rows.rows[0]?.observation_ct).toBe(2);
  });

  it('refuses a confirmation naming a classification that was never offered', async () => {
    const outcome = await resolveFor(alvarado);
    await expect(
      asTenant(alvarado, (tx) =>
        confirmChoice(tx, outcome, {
          account: alvarado.accountId,
          userId: alvarado.userId,
          chosen: 'VA20260195:2:1:99' as ClassificationId,
          revision: REVISION,
        }),
      ),
    ).rejects.toThrow(/may only name a row of the pinned revision/);
  });
});

describe('what auto-applies, and what deliberately does not', () => {
  it('never auto-applies a row that is not user_confirmed', async () => {
    // A deterministic guess and a model ordering are also rows in this table — they
    // are written for the eval set — and reading them back as memory would turn our
    // own suggestion into the customer's answer.
    await tdb.client.query(`INSERT INTO payroll_title (title_norm) VALUES ($1) ON CONFLICT DO NOTHING`, [
      String(TITLE),
    ]);
    await tdb.client.query(
      `INSERT INTO crosswalk_observation
         (account_id, wd_number, revision, title_norm, title_raw, chosen_class_norm,
          chosen_identifier, provenance, offered, chosen_rank, ranker_version,
          resolved_at_level, llm_used)
       VALUES ($1, 'VA20260195', $2::smallint, $3, $4, $5, $6, 'llm_ranked',
               '{"candidates":[]}'::jsonb, 1, 1, 'L_D', true)`,
      [alvarado.accountId, REVISION, String(TITLE), RAW, MASON.classNameNorm, MASON.rateIdentifier],
    );

    const hit = await asTenant(alvarado, (tx) =>
      lookupCrosswalk(tx, {
        account: alvarado.accountId,
        wdNumber: PIN.wdNumber,
        titleNorm: TITLE,
      }),
    );
    expect(hit).toBeNull();
    expect((await resolveFor(alvarado)).level).not.toBe('L_A');
  });

  it('misses — and shows the picker — when the remembered class left the revision', async () => {
    const outcome = await resolveFor(alvarado);
    await asTenant(alvarado, (tx) =>
      confirmChoice(tx, outcome, {
        account: alvarado.accountId,
        userId: alvarado.userId,
        chosen: MASON.id,
        revision: REVISION,
      }),
    );
    const without = VA_CLASSES.filter((row) => row.id !== MASON.id);
    const next = await resolveFor(alvarado, RAW, without);
    // Silence here would put a rate on a form citing a document that does not
    // contain it.
    expect(next.level).not.toBe('L_A');
    expect(next.resolved).toBeNull();
  });

  it('takes the latest row, so a correction three weeks later wins', async () => {
    const outcome = await resolveFor(alvarado);
    await asTenant(alvarado, (tx) =>
      confirmChoice(tx, outcome, {
        account: alvarado.accountId,
        userId: alvarado.userId,
        chosen: MASON.id,
        revision: REVISION,
      }),
    );
    // The memory editor (S20) writes a correction as a NEW row rather than an edit,
    // because the table is append-only and an artifact already generated must stay
    // reproducible. Written here as the owner, which is what a later dated row is.
    const carpenter = classByName('CARPENTER, INCLUDES FORM WORK');
    await tdb.client.query(
      `INSERT INTO crosswalk_observation
         (account_id, confirmed_by_user_id, wd_number, revision, title_norm, title_raw,
          chosen_class_norm, chosen_identifier, provenance, offered, chosen_rank,
          ranker_version, resolved_at_level, llm_used, decided_at)
       VALUES ($1, $2, 'VA20260195', $3::smallint, $4, $5, $6, $7, 'user_confirmed',
               '{"candidates":[]}'::jsonb, NULL, 1, 'L_F', false, now() + interval '1 day')`,
      [
        alvarado.accountId,
        alvarado.userId,
        REVISION,
        String(TITLE),
        RAW,
        carpenter.classNameNorm,
        carpenter.rateIdentifier,
      ],
    );
    const after = await resolveFor(alvarado);
    expect(after.level).toBe('L_A');
    expect(after.resolved?.className).toBe(carpenter.className);
  });
});

describe('the tenant boundary', () => {
  it('does not let one account read or use another’s memory', async () => {
    const outcome = await resolveFor(alvarado);
    await asTenant(alvarado, (tx) =>
      confirmChoice(tx, outcome, {
        account: alvarado.accountId,
        userId: alvarado.userId,
        chosen: MASON.id,
        revision: REVISION,
      }),
    );
    expect((await resolveFor(alvarado)).level).toBe('L_A');

    const otherHit = await asTenant(bell, (tx) =>
      lookupCrosswalk(tx, {
        account: alvarado.accountId,
        wdNumber: PIN.wdNumber,
        titleNorm: TITLE,
      }),
    );
    // Row-level security filters the read even though the query names the other
    // account explicitly: the boundary is the database's, not the query's.
    expect(otherHit).toBeNull();
    expect((await resolveFor(bell)).level).not.toBe('L_A');
  });

  it('reads nothing at all with no tenant context — a zero-row bug, not a leak', async () => {
    const outcome = await resolveFor(alvarado);
    await asTenant(alvarado, (tx) =>
      confirmChoice(tx, outcome, {
        account: alvarado.accountId,
        userId: alvarado.userId,
        chosen: MASON.id,
        revision: REVISION,
      }),
    );
    const unscoped = await tdb.asApp(() =>
      lookupCrosswalk(tdb.db, {
        account: alvarado.accountId,
        wdNumber: PIN.wdNumber,
        titleNorm: TITLE,
      }),
    );
    expect(unscoped).toBeNull();
  });
});

describe('what the account’s own history is allowed to do', () => {
  it('feeds the prompt as ordinals — the only history §7.4 permits into it', async () => {
    const outcome = await resolveFor(alvarado);
    await asTenant(alvarado, (tx) =>
      confirmChoice(tx, outcome, {
        account: alvarado.accountId,
        userId: alvarado.userId,
        chosen: MASON.id,
        revision: REVISION,
      }),
    );
    const ordinals = await asTenant(alvarado, (tx) =>
      ownPriorOrdinals(
        tx,
        { account: alvarado.accountId, wdNumber: PIN.wdNumber },
        VA_CLASSES,
      ),
    );
    expect(ordinals).toEqual([MASON.ordinal]);
    // Ordinals, never counts, never another account's anything.
    expect(ordinals.every((value) => Number.isInteger(value))).toBe(true);
  });
});

describe('the line the fourth Friday shows', () => {
  it('reports her own counter and claims nothing about the fleet', () => {
    expect(memoryResolutionLine(12, 12)).toBe(
      '12 of 12 titles resolved from memory this week. No classification decisions needed.',
    );
    expect(memoryResolutionLine(9, 12)).toBe('9 of 12 titles resolved from memory this week.');
    expect(memoryResolutionLine(0, 0)).toBe('');
    for (const line of [memoryResolutionLine(12, 12), memoryResolutionLine(9, 12)]) {
      expect(line).not.toMatch(/%|contractors|average|typical/i);
    }
  });
});
