/**
 * The tenant context — the application half of ADR-011.
 *
 * ARCHITECTURE.md §11.2 requires TWO independent mechanisms, not one:
 * tenant-scoped repositories AND row-level security. This module is the bridge,
 * and it has exactly one important property.
 *
 * THE CONTEXT IS TRANSACTION-SCOPED, NOT SESSION-SCOPED. `ratepin_set_account`
 * calls `set_config(…, is_local => true)`, so the GUC reverts at COMMIT or
 * ROLLBACK. That is not a detail — with a connection pool a session-scoped GUC
 * survives the request that set it and is inherited by whoever gets that
 * connection next, which is a cross-tenant read with no code path to blame.
 * Transaction scope makes the leak structurally impossible, at the cost of one
 * rule: every tenant-scoped query runs inside `withTenant`.
 *
 * FORGETTING IT IS A ZERO-ROW BUG, NOT A LEAK. `ratepin_current_account()` returns
 * NULL when the GUC has never been set, and `account_id = NULL` is never true, so
 * an unscoped connection sees nothing at all. The boundary fails closed. That is
 * the opposite of the usual default and it is the whole point: a query that
 * silently returns everyone's rows looks like it works.
 */

import { sql } from 'drizzle-orm';

import type { Db, Tx } from './index';

/** An account id, narrowed once at the boundary so it cannot be a bare string. */
export type AccountId = string & { readonly __brand: 'AccountId' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function accountId(value: string): AccountId {
  if (!UUID_RE.test(value)) {
    throw new TypeError(`not an account id: ${JSON.stringify(value)}`);
  }
  return value as AccountId;
}

export interface TenantContext {
  readonly accountId: AccountId;
  /** The user who initiated the request, where there is one. Batch and worker jobs
   *  legitimately act for an account with no user attached. */
  readonly userId?: string;
}

/**
 * Run `fn` inside a transaction with the tenant context set. Everything the
 * callback does through `tx` is filtered by the RLS policies; everything it writes
 * is checked against them by `WITH CHECK`, so a row cannot be inserted for another
 * account even by an explicit `account_id`.
 */
export async function withTenant<T>(
  db: Db,
  ctx: TenantContext,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT ratepin_set_account(${ctx.accountId}::uuid)`);
    return fn(tx as Tx);
  });
}

/**
 * Run `fn` with NO tenant context, for the global surfaces that legitimately have
 * none: the mirror read model, the county x craft pages, the free generator, the
 * status endpoint, the ingest workers. It is a separate, named function so that
 * "this query is deliberately not tenant-scoped" is a visible decision in the diff
 * rather than an omission.
 */
export async function withoutTenant<T>(db: Db, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT ratepin_clear_account()`);
    return fn(tx as Tx);
  });
}
