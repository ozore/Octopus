/**
 * Fixtures for the platform suite.
 *
 * Everything here seeds as the OWNER, which is how a migration and an admin process
 * legitimately write, and every assertion that matters about the tenant boundary
 * runs through `withTenant` in the code under test. The platform DDL is applied on
 * top of the schema of record by `ensurePlatformSchema` — the same function the
 * worker calls at boot, so the tests exercise the DDL production gets.
 */

import { createTestDb, seedTenant, type TestDb } from '../helpers/pglite';
import { ensurePlatformSchema } from '../../src/platform/schema';
import { ensurePlanCatalog } from '../../src/platform/billing/catalog';
import { ensurePublishedAddresses } from '../../src/platform/ops/inbound';

export async function createPlatformDb(): Promise<TestDb> {
  const tdb = await createTestDb();
  await ensurePlatformSchema(tdb.db);
  await ensurePlanCatalog(tdb.db);
  await ensurePublishedAddresses(tdb.db);
  return tdb;
}

export { seedTenant };

export const IDS = {
  accountA: '11111111-1111-4111-8111-111111111111',
  accountB: '22222222-2222-4222-8222-222222222222',
  userA: '33333333-3333-4333-8333-333333333333',
  userB: '44444444-4444-4444-8444-444444444444',
  projectA: '55555555-5555-4555-8555-555555555555',
  projectB: '66666666-6666-4666-8666-666666666666',
} as const;

/** A uuid built from a counter, so a failure names the same row on every run. */
export function uuidFor(prefix: number, n: number): string {
  const hex = n.toString(16).padStart(12, '0');
  const p = prefix.toString(16).padStart(8, '0');
  return `${p}-0000-4000-8000-${hex}`;
}

export interface BillingSeed {
  readonly planId: 'solo' | 'crew' | 'multi';
  readonly priceCents: number;
  readonly status: 'active' | 'past_due' | 'unpaid' | 'trialing' | 'canceled';
  readonly stateSince: Date;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly customerId?: string;
  readonly subscriptionId?: string;
}

/** The fleet index row plus the tenant-scoped subscription row, as the webhook
 *  would have left them. */
export async function seedBilling(
  tdb: TestDb,
  account: string,
  seed: BillingSeed,
): Promise<void> {
  const customerId = seed.customerId ?? `cus_${account.slice(0, 8)}`;
  await tdb.client.query(
    `INSERT INTO billing_account_index
       (account_id, stripe_customer_id, plan_id, price_cents, entitlement_state,
        subscription_status, state_since, current_period_start, current_period_end)
     VALUES ($1, $2, $3, $4, 'full', $5, $6, $7, $8)
     ON CONFLICT (account_id) DO UPDATE SET
       stripe_customer_id = EXCLUDED.stripe_customer_id,
       plan_id = EXCLUDED.plan_id,
       price_cents = EXCLUDED.price_cents,
       subscription_status = EXCLUDED.subscription_status,
       state_since = EXCLUDED.state_since,
       current_period_start = EXCLUDED.current_period_start,
       current_period_end = EXCLUDED.current_period_end`,
    [
      account,
      customerId,
      seed.planId,
      seed.priceCents,
      seed.status,
      seed.stateSince.toISOString(),
      seed.periodStart.toISOString(),
      seed.periodEnd.toISOString(),
    ],
  );
  await tdb.client.query(
    `INSERT INTO subscriptions
       (account_id, stripe_subscription_id, plan_id, status, entitlement_state,
        current_period_start, current_period_end)
     VALUES ($1, $2, $3, $4, 'full', $5, $6)
     ON CONFLICT (account_id) DO UPDATE SET
       stripe_subscription_id = EXCLUDED.stripe_subscription_id,
       plan_id = EXCLUDED.plan_id,
       status = EXCLUDED.status`,
    [
      account,
      seed.subscriptionId ?? `sub_${account.slice(0, 8)}`,
      seed.planId,
      seed.status,
      seed.periodStart.toISOString(),
      seed.periodEnd.toISOString(),
    ],
  );
}

export interface FilingSeed {
  readonly id: string;
  readonly account: string;
  readonly project: string;
  readonly weekEnding: string;
  readonly status: 'CERTIFIABLE' | 'CERTIFIABLE_DATED' | 'DRAFT_NOT_CERTIFIABLE';
  readonly state?: 'DRAFT' | 'RELEASED';
  readonly releasedAt?: Date | null;
  readonly sequence?: number;
}

/**
 * One filing row, with the status and the block reasons kept consistent — the
 * `filings_status_blocks` CHECK refuses a DRAFT with no reasons and a CERTIFIABLE
 * with any, in both directions, so a fixture cannot construct the state the
 * arithmetic forbids.
 */
export async function seedFiling(tdb: TestDb, seed: FilingSeed): Promise<void> {
  const draft = seed.status === 'DRAFT_NOT_CERTIFIABLE';
  await tdb.client.query(
    `INSERT INTO filings
       (id, account_id, project_id, week_ending, sequence, state, artifact_status,
        block_reasons, engine_version, build_sha, freshness_state, released_at, billable)
     VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8::block_reason[], 1, 'test-build', $9, $10, $11)`,
    [
      seed.id,
      seed.account,
      seed.project,
      seed.weekEnding,
      seed.sequence ?? 1,
      seed.state ?? 'RELEASED',
      seed.status,
      draft ? '{UNMAPPED_TRADE}' : '{}',
      seed.status === 'CERTIFIABLE' ? 'FRESH' : 'DATED',
      (seed.releasedAt === undefined ? new Date() : seed.releasedAt)?.toISOString() ?? null,
      !draft,
    ],
  );
}

/** A promoted corpus snapshot, so the freshness clock has something to age from. */
export async function seedPromotedSnapshot(
  tdb: TestDb,
  input: { readonly ref: string; readonly promotedAt: Date },
): Promise<number> {
  const result = await tdb.client.query<{ snapshot_id: number }>(
    `INSERT INTO corpus_snapshot
       (snapshot_ref, state, promoted_at, merkle_root, golden_suite_pass, blocking_variances,
        active_wd_count, index_total_active)
     VALUES ($1, 'promoted', $2, decode(repeat('ab', 32), 'hex'), true, 0, 4236, 4236)
     RETURNING snapshot_id`,
    [input.ref, input.promotedAt.toISOString()],
  );
  return Number(result.rows[0]?.snapshot_id);
}
