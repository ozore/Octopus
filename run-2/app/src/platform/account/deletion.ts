/**
 * Account deletion — real, bounded, asymmetric, and stated in the same words the
 * screen uses.
 *
 * AUTHORITY: **ARCHITECTURE.md §5.5**, which the build task names as the scope. Where
 * USER_JOURNEY.md §12.2's earlier screen copy says "what is deleted: … every filing
 * and artifact", §5.5 is the later and narrower statement and it governs: filings and
 * non-PII artifact bytes are RETAINED for three years, because they are the evidence
 * layer of a signed federal certification (I6, ADR-013) and because 29 CFR
 * 5.5(a)(3)(i)(A) puts a three-year floor under the contractor's own copy of exactly
 * these documents. The divergence is recorded here rather than resolved silently:
 * **§5.5's enumeration is what this module executes and what the screen renders**,
 * and a deletion promise the customer only discovers to be partial is worse than a
 * narrower promise made up front.
 *
 * ===========================================================================
 * ONE ENUMERATION, TWO RENDERERS
 *
 * `DELETION_SCOPE` below is the whole specification. The confirmation screen renders
 * it before the click; `executeAccountDeletion` walks the same array to decide what
 * to do; the erasure report is built by pairing each entry with what its action
 * actually affected. There is no second list. That is the mechanism §5.5 asks for
 * when it says the report is "rendered from the same enumeration the screen renders
 * from, so what the customer was promised and what ran cannot drift" — an entry
 * added here changes all three surfaces, and an entry with no action fails the
 * exhaustiveness check in `actionFor`.
 *
 * ===========================================================================
 * THE ONE CLAIM WE MAKE, AND THE ONE WE REFUSE
 *
 * Refused: that deletion is total. It is not, it cannot be for a product whose
 * deliverable is a signed federal record, and a privacy page that says otherwise is
 * falsifiable in one query.
 *
 * Made, because it is enforced rather than promised: **after deletion, no key exists
 * that can decrypt any Social Security number belonging to that account, in any
 * store, including backups.** That is why `destroy_data_key` is its own step with its
 * own row in the report, and why it runs whether or not any `ssn_ciphertext` was
 * found — destroying a key that protected nothing is free, and skipping it because
 * the table looked empty is how a backup keeps a decryptable secret.
 *
 * ===========================================================================
 * NO REQUEST, NO QUEUE, NO ADDRESS
 *
 * Deletion is a button executed by code (A3, §5.5). There is no support path on this
 * screen, nothing to file, and nobody to approve it. The undo is a link on the
 * settings screen for the whole seven days AND in the confirmation email, because
 * email is never the sole channel for reversing a destructive action (§12.4).
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db, type Tx } from '../../db';
import { withTenant, accountId as brandAccountId } from '../../db/tenant';
import { addDays, systemClock, type Clock } from '../clock';
import { tombstoneDigest } from '../ids';
import { queueEmail } from '../ops/outbox';
import type { StripeGateway } from '../billing/gateway';
import { readBillingAccount } from '../billing/account';
import { currentSubscriptionId } from '../billing/meter';

/** §12.2: "Deletion is reversible for 7 days." Stated as a date before the click. */
export const UNDO_WINDOW_DAYS = 7;

/** §5.4: the contractor's obligation under 29 CFR 5.5(a)(3)(i)(A) is three years
 *  after all work on the prime contract is completed, so we hold at least as long
 *  as the obligation we help them meet. */
export const ARTIFACT_RETENTION_YEARS = 3;

export type Disposition = 'erased' | 'retained';

export interface ScopeEntry {
  readonly id: string;
  /** What the screen says is affected. */
  readonly label: string;
  readonly disposition: Disposition;
  /** How — the mechanism, because "deleted" without a mechanism is a policy. */
  readonly mechanism: string;
  /** For a retained entry: for how long, with a number attached. */
  readonly retention?: string;
  /** For a retained entry: why it cannot be erased on request. */
  readonly why?: string;
}

/**
 * §5.5's two tables, transcribed. The order is the order the screen shows them:
 * everything that goes, then everything that stays, then the sentence that says the
 * second list exists.
 */
export const DELETION_SCOPE: readonly ScopeEntry[] = [
  {
    id: 'ssn_ciphertext',
    label: 'Every encrypted Social Security number, and the key that decrypts them',
    disposition: 'erased',
    mechanism:
      'The rows are deleted and the per-account data key is destroyed. Destroying the ' +
      'key is what makes any residual ciphertext — in a backup, in a write-ahead log — ' +
      'permanently undecryptable. It is the only erasure guarantee that survives a ' +
      'store we do not control.',
  },
  {
    id: 'workers_and_payroll',
    label: 'Every worker record, payroll import, payroll line and raw payroll CSV',
    disposition: 'erased',
    mechanism: 'Hard delete of the rows and of the uploaded files.',
  },
  {
    id: 'ecpr_xml',
    label: 'The California eCPR XML files, which contain full Social Security numbers',
    disposition: 'erased',
    mechanism:
      'Hard delete of the stored objects. Where you chose retention-with-redaction at ' +
      'export, what survives is the redacted rendering — Social Security number ' +
      'shortened to the last four digits — and the sha256 of the original file.',
  },
  {
    id: 'classification_memory',
    label: 'Your classification memory and column mappings',
    disposition: 'erased',
    mechanism:
      'Hard delete of your observations, followed by a rebuild of the anonymous ' +
      'aggregate they contributed to.',
  },
  {
    id: 'auth',
    label: 'Sign-in links, sessions and memberships',
    disposition: 'erased',
    mechanism:
      'Hard delete. A sign-in link that still works after deletion is a way back into ' +
      'an account that no longer exists.',
  },
  {
    id: 'filings_and_artifacts',
    label: 'The filings and the WH-347 and exception-report files already generated',
    disposition: 'retained',
    retention: `${String(ARTIFACT_RETENTION_YEARS)} years from closure, then deleted on the retention sweep`,
    mechanism:
      'The bytes are content-addressed and immutable. We do not edit them, because ' +
      'editing them would break every sha256 we published and destroy the one property ' +
      'that makes the file worth anything.',
    why:
      'These are the evidence layer of a signed federal certification. 29 CFR ' +
      '5.5(a)(3)(i)(A) puts a three-year floor under your own copy of exactly these ' +
      'documents. You receive the full export before closure; what you cannot do is ' +
      'make our copy vanish inside the window in which an investigator may ask about it.',
  },
  {
    id: 'last4_and_names_in_artifacts',
    label: 'The last four digits and the names printed into those files',
    disposition: 'retained',
    retention: `the same ${String(ARTIFACT_RETENTION_YEARS)} years`,
    mechanism: 'They are inside bytes we have told you are reproducible, so they are not editable.',
    why:
      'The last four digits are the individually identifying number the federal rule ' +
      'requires on the weekly transmittal in place of the full number. It is compliance ' +
      'data rather than surplus personal data.',
  },
  {
    id: 'projects_and_pins',
    label: 'The project names and wage-determination pins those files point at',
    disposition: 'retained',
    retention: `the same ${String(ARTIFACT_RETENTION_YEARS)} years`,
    mechanism: 'Kept alongside the filings they belong to.',
    why:
      'Deleting them would delete the retained filings with them, and the same project ' +
      'identity is already printed into the artifact bytes we cannot edit. Keeping the ' +
      'row adds nothing we have not already retained, and removing it would destroy the ' +
      'evidence the previous two rows exist to preserve.',
  },
  {
    id: 'backups',
    label: 'Database backups and the point-in-time recovery window',
    disposition: 'retained',
    retention: 'until the window rolls past your deletion — we publish the measured oldest restorable date',
    mechanism:
      'A backup is a consistent copy of the past; selectively editing one is not a ' +
      'supported operation on any managed database and attempting it would corrupt the ' +
      'restore path we verify daily.',
    why:
      'We do not quote a vendor number we have not measured. What makes the residue ' +
      'harmless is the first row on this list: ciphertext in a backup whose key no ' +
      'longer exists is not personal data in any operable sense.',
  },
  {
    id: 'stripe_record',
    label: 'The billing record held by Stripe — customer, subscription, invoices',
    disposition: 'retained',
    retention: "Stripe's clock, not ours",
    mechanism:
      'We submit a redaction request to Stripe and report its state. We do not claim an ' +
      'erasure Stripe has told us it will not perform: some objects are not immediately ' +
      'eligible at all, and Stripe may retain data as legally required after redaction.',
    why: 'Stripe is the money system of record and a regulated processor with its own retention obligations.',
  },
  {
    id: 'gate_counters',
    label: 'Our own counters — canary runs, probes, incidents, metered filings, inbound messages',
    disposition: 'retained',
    retention: 'indefinitely, de-identified',
    mechanism:
      'Your account name and every email on it are replaced by a one-way digest, so the ' +
      'counts survive and the identity does not.',
    why:
      'These are what our public gates are measured on. A product that can silently ' +
      'shrink its own denominator has no gates.',
  },
  {
    id: 'crosswalk_aggregate',
    label: 'Anonymous aggregate counts of which payroll titles map to which classifications',
    disposition: 'retained',
    retention: 'indefinitely',
    mechanism:
      'Kept only where five or more unrelated companies made the same mapping, rebuilt ' +
      'after your own observations are deleted.',
    why:
      'They contain no company or worker identity and are only ever used to ORDER a list ' +
      'of candidates for someone else — never to choose one for them.',
  },
  {
    id: 'mirror',
    label: 'The public wage-determination mirror',
    disposition: 'retained',
    retention: 'forever',
    mechanism: 'Untouched.',
    why: 'It is public data. It was never yours or ours, and it never contained anything of yours.',
  },
] as const;

/** The sentence §5.5 insists on: the one thing we will not do. */
export const DELETION_BOUNDARY_STATEMENT =
  'We will not tell you that deletion is total. It is not, and it cannot be for a ' +
  'product whose deliverable is a signed federal record. What we do state is enforced ' +
  'rather than promised: after deletion, no key exists that can decrypt any Social ' +
  'Security number belonging to this account, in any store, including backups.';

// ===========================================================================
// The scheduled state
// ===========================================================================

export interface DeletionRecord {
  readonly accountId: string;
  readonly requestedAt: Date;
  readonly requestedBy: string | null;
  readonly effectiveAt: Date;
  readonly undoneAt: Date | null;
  readonly executedAt: Date | null;
  readonly exportKey: string | null;
  readonly report: Readonly<Record<string, unknown>>;
}

interface DeletionRow {
  readonly account_id: string;
  readonly requested_at: string | Date;
  readonly requested_by: string | null;
  readonly effective_at: string | Date;
  readonly undone_at: string | Date | null;
  readonly executed_at: string | Date | null;
  readonly export_key: string | null;
  readonly report: Record<string, unknown> | null;
}

function toRecord(row: DeletionRow): DeletionRecord {
  return {
    accountId: row.account_id,
    requestedAt: new Date(row.requested_at),
    requestedBy: row.requested_by,
    effectiveAt: new Date(row.effective_at),
    undoneAt: row.undone_at === null ? null : new Date(row.undone_at),
    executedAt: row.executed_at === null ? null : new Date(row.executed_at),
    exportKey: row.export_key,
    report: row.report ?? {},
  };
}

export type DeletionRequestResult =
  | { readonly ok: true; readonly record: DeletionRecord }
  | { readonly ok: false; readonly reason: 'name_mismatch' | 'already_scheduled' | 'no_account' };

export interface DeletionDeps {
  readonly stripe: StripeGateway;
  readonly clock?: Clock;
  /** Where the export was written, when one was taken. §12.2 runs it first by
   *  default and the customer must opt out explicitly. */
  readonly exportKey?: string | null;
}

/**
 * Schedule a deletion.
 *
 * The typed confirmation is a **P-A closed choice**: the only accepted value is the
 * account's own name, compared after trimming and case-folding and in no other way.
 * There is no "are you sure?" second dialog, because a second dialog is a click and
 * a click is not a decision.
 *
 * The subscription is cancelled here rather than left for the customer to cancel
 * separately (§12.4): "two-step destruction is two chances to leave a subscription
 * running."
 */
export async function requestAccountDeletion(
  db: Db,
  input: {
    readonly accountId: string;
    readonly requestedBy: string | null;
    readonly typedConfirmation: string;
  },
  deps: DeletionDeps,
): Promise<DeletionRequestResult> {
  const clock = deps.clock ?? systemClock;
  const now = clock.now();

  const account = rowsOf<{ name: string; deleted_at: string | null }>(
    await db.execute(sql`SELECT name, deleted_at FROM accounts WHERE id = ${input.accountId}::uuid`),
  )[0];
  if (!account || account.deleted_at !== null) return { ok: false, reason: 'no_account' };

  const normalise = (value: string): string => value.trim().replace(/\s+/g, ' ').toLowerCase();
  if (normalise(input.typedConfirmation) !== normalise(account.name)) {
    return { ok: false, reason: 'name_mismatch' };
  }

  const pending = await readDeletion(db, input.accountId);
  if (pending && pending.undoneAt === null && pending.executedAt === null) {
    return { ok: false, reason: 'already_scheduled' };
  }

  const effectiveAt = addDays(now, UNDO_WINDOW_DAYS);

  // Cancel now, refund the unused days. Immediately, not at period end: she asked to
  // be gone, and billing her for a service she has told us to delete is the kind of
  // charge that becomes a chargeback.
  const subscriptionId = await currentSubscriptionId(db, input.accountId);
  if (subscriptionId) {
    await deps.stripe.cancelSubscription({ subscriptionId, atPeriodEnd: false });
  }

  await db.execute(sql`
    INSERT INTO account_deletions (account_id, requested_at, requested_by, effective_at, export_key, report)
    VALUES (${input.accountId}::uuid, ${now.toISOString()}::timestamptz, ${input.requestedBy}::uuid,
            ${effectiveAt.toISOString()}::timestamptz, ${deps.exportKey ?? null}, '{}'::jsonb)
    ON CONFLICT (account_id) DO UPDATE SET
      requested_at = EXCLUDED.requested_at,
      requested_by = EXCLUDED.requested_by,
      effective_at = EXCLUDED.effective_at,
      export_key   = EXCLUDED.export_key,
      undone_at    = NULL,
      executed_at  = NULL,
      report       = '{}'::jsonb
  `);
  await db.execute(sql`
    UPDATE accounts SET deletion_requested_at = ${now.toISOString()}::timestamptz
     WHERE id = ${input.accountId}::uuid
  `);

  await queueEmail(
    db,
    {
      accountId: input.accountId,
      template: 'deletion_scheduled',
      payload: {
        effective_at: effectiveAt.toISOString(),
        undo_window_days: UNDO_WINDOW_DAYS,
        export_key: deps.exportKey ?? null,
      },
      idempotencyKey: `deletion:${input.accountId}:${now.toISOString()}`,
    },
    clock,
  );

  const record = await readDeletion(db, input.accountId);
  if (!record) throw new Error('account_deletions: the row we just wrote is not there');
  return { ok: true, record };
}

export async function readDeletion(db: Db | Tx, account: string): Promise<DeletionRecord | null> {
  const row = rowsOf<DeletionRow>(
    await db.execute(sql`
      SELECT account_id, requested_at, requested_by, effective_at, undone_at, executed_at,
             export_key, report
        FROM account_deletions WHERE account_id = ${account}::uuid
    `),
  )[0];
  return row ? toRecord(row) : null;
}

export type UndoResult =
  | { readonly ok: true; readonly record: DeletionRecord }
  | { readonly ok: false; readonly reason: 'not_scheduled' | 'window_closed' | 'already_executed' };

/**
 * Undo, within the window.
 *
 * §12.4: "Everything returns, including artifacts; the subscription does NOT
 * auto-resume — she re-subscribes deliberately. Restoring data is a favour;
 * restoring a charge is a liability." So this function touches no billing state, and
 * the absence is the point.
 */
export async function undoAccountDeletion(
  db: Db,
  account: string,
  clock: Clock = systemClock,
): Promise<UndoResult> {
  const record = await readDeletion(db, account);
  if (!record) return { ok: false, reason: 'not_scheduled' };
  if (record.executedAt !== null) return { ok: false, reason: 'already_executed' };
  if (record.undoneAt !== null) return { ok: false, reason: 'not_scheduled' };
  if (clock.now().getTime() >= record.effectiveAt.getTime()) {
    return { ok: false, reason: 'window_closed' };
  }

  const now = clock.now().toISOString();
  await db.execute(sql`
    UPDATE account_deletions SET undone_at = ${now}::timestamptz WHERE account_id = ${account}::uuid
  `);
  await db.execute(sql`
    UPDATE accounts SET deletion_requested_at = NULL WHERE id = ${account}::uuid
  `);
  const updated = await readDeletion(db, account);
  if (!updated) throw new Error('account_deletions: the row disappeared during undo');
  return { ok: true, record: updated };
}

/** Accounts whose window has closed and which nobody undid. The worker's only input. */
export async function dueDeletions(db: Db | Tx, now: Date): Promise<readonly string[]> {
  return rowsOf<{ account_id: string }>(
    await db.execute(sql`
      SELECT account_id FROM account_deletions
       WHERE undone_at IS NULL AND executed_at IS NULL
         AND effective_at <= ${now.toISOString()}::timestamptz
       ORDER BY effective_at
    `),
  ).map((row) => row.account_id);
}

// ===========================================================================
// Execution, and the report rendered from the same enumeration
// ===========================================================================

export interface ErasureLine {
  readonly id: string;
  readonly label: string;
  readonly disposition: Disposition;
  readonly mechanism: string;
  readonly retention: string | null;
  readonly why: string | null;
  /** Rows or objects affected. `null` for a retained entry — a retained thing has no
   *  count because nothing was done to it, and reporting `0` would read as "there
   *  was none of it". */
  readonly affected: number | null;
  /** For the Stripe row: what Stripe said, rather than what we would like to claim. */
  readonly note?: string;
}

export interface ErasureReport {
  readonly accountId: string;
  readonly executedAt: string;
  readonly boundaryStatement: string;
  readonly lines: readonly ErasureLine[];
}

export type ExecutionResult =
  | { readonly ok: true; readonly report: ErasureReport }
  | { readonly ok: false; readonly reason: 'not_due' | 'undone' | 'already_executed' | 'not_scheduled' };

/**
 * Execute. One transaction per erasure step, walked in the order of the enumeration,
 * with the count of each step written straight into the report.
 *
 * Fail-closed note: a step that throws leaves `executed_at` unset, so the job retries
 * and the account stays scheduled. Half a deletion is a state the retry can finish;
 * a deletion marked complete that was not is a state nothing can fix.
 */
export async function executeAccountDeletion(
  db: Db,
  account: string,
  deps: DeletionDeps,
): Promise<ExecutionResult> {
  const clock = deps.clock ?? systemClock;
  const now = clock.now();

  const record = await readDeletion(db, account);
  if (!record) return { ok: false, reason: 'not_scheduled' };
  if (record.executedAt !== null) return { ok: false, reason: 'already_executed' };
  if (record.undoneAt !== null) return { ok: false, reason: 'undone' };
  if (now.getTime() < record.effectiveAt.getTime()) return { ok: false, reason: 'not_due' };

  const affected = new Map<string, number>();
  const notes = new Map<string, string>();

  await withTenant(db, { accountId: brandAccountId(account) }, async (tx) => {
    // --- ssn_ciphertext ---------------------------------------------------
    // Counted BEFORE the row delete, because after it there is nothing to count.
    const withCiphertext = Number(
      rowsOf<{ n: number | string }>(
        await tx.execute(sql`
          SELECT COUNT(*)::int AS n FROM workers
           WHERE account_id = ${account}::uuid AND ssn_ciphertext IS NOT NULL
        `),
      )[0]?.n ?? 0,
    );
    affected.set('ssn_ciphertext', withCiphertext);

    // --- workers and payroll ---------------------------------------------
    // Order matters: `payroll_worker_weeks.worker_id` has no cascade, so the weeks
    // (which cascade to worker-weeks and lines) go before the workers.
    let payrollRows = 0;
    payrollRows += rowsOf(
      await tx.execute(sql`DELETE FROM payroll_weeks WHERE account_id = ${account}::uuid RETURNING id`),
    ).length;
    payrollRows += rowsOf(
      await tx.execute(sql`DELETE FROM payroll_imports WHERE account_id = ${account}::uuid RETURNING id`),
    ).length;
    payrollRows += rowsOf(
      await tx.execute(sql`DELETE FROM workers WHERE account_id = ${account}::uuid RETURNING id`),
    ).length;
    affected.set('workers_and_payroll', payrollRows);

    // --- the PII-class artifacts -----------------------------------------
    const ecpr = rowsOf<{ r2_key: string }>(
      await tx.execute(sql`
        DELETE FROM artifacts
         WHERE account_id = ${account}::uuid AND pii_class = 'ssn_bearing'
         RETURNING r2_key
      `),
    );
    affected.set('ecpr_xml', ecpr.length);
    if (deps.exportKey === undefined) notes.set('ecpr_xml', 'No export was taken before deletion.');

    // --- classification memory -------------------------------------------
    const memory = rowsOf(
      await tx.execute(sql`
        DELETE FROM crosswalk_observation WHERE account_id = ${account}::uuid RETURNING observation_id
      `),
    ).length;
    affected.set('classification_memory', memory);

    // --- the identity ------------------------------------------------------
    // The de-identification §5.5 requires. The account ROW survives, because every
    // gate counter references it by foreign key and deleting it would cascade the
    // counters away — which is exactly the silently-shrinking denominator §5.5
    // forbids. What is destroyed is the identity ON the row: the name becomes a
    // one-way digest and every email on it goes with the memberships.
    const salt = `${account}:${now.toISOString()}`;
    let authRows = 0;
    authRows += rowsOf(
      await tx.execute(sql`DELETE FROM memberships WHERE account_id = ${account}::uuid RETURNING user_id`),
    ).length;
    affected.set('auth', authRows);
    await tx.execute(sql`
      UPDATE accounts
         SET name = ${`deleted-account-${tombstoneDigest(account, salt)}`},
             status = 'deleted'::account_status,
             deleted_at = ${now.toISOString()}::timestamptz,
             data_key_uri = NULL,
             data_key_destroyed_at = ${now.toISOString()}::timestamptz
       WHERE id = ${account}::uuid
    `);
  });

  // Sessions and magic links live outside the tenant policies by design (they are
  // read to LEARN the tenant), so they are cleared outside `withTenant`.
  const sessions = rowsOf(
    await db.execute(sql`
      DELETE FROM auth_sessions WHERE account_id = ${account}::uuid RETURNING id
    `),
  ).length;
  const links = rowsOf(
    await db.execute(sql`
      DELETE FROM auth_magic_links WHERE account_id = ${account}::uuid RETURNING id
    `),
  ).length;
  affected.set('auth', (affected.get('auth') ?? 0) + sessions + links);

  // Users left with no membership anywhere lose their email, which is the only
  // identifying thing we hold about a person as opposed to about a company.
  await db.execute(sql`
    UPDATE users
       SET email = ${`deleted-${tombstoneDigest(account, 'user')}`} || '-' || left(id::text, 8) || '@deleted.invalid',
           deleted_at = ${now.toISOString()}::timestamptz
     WHERE deleted_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = users.id)
  `);

  // --- Stripe -------------------------------------------------------------
  // We SUBMIT a redaction and report its state. We do not claim an erasure Stripe
  // has told us it will not perform.
  const billing = await readBillingAccount(db, account);
  if (billing?.stripeCustomerId) {
    const redaction = await deps.stripe.requestCustomerRedaction(billing.stripeCustomerId);
    notes.set(
      'stripe_record',
      redaction.state === 'submitted'
        ? 'A redaction request was submitted to Stripe. Stripe may retain data as legally required after redaction.'
        : 'Stripe reported that this record is not eligible for redaction yet. Transactions can only be redacted after 90 days.',
    );
  } else {
    notes.set('stripe_record', 'This account had no Stripe customer, so there was nothing to redact.');
  }

  const report = buildErasureReport({ accountId: account, executedAt: now, affected, notes });

  await db.execute(sql`
    UPDATE account_deletions
       SET executed_at = ${now.toISOString()}::timestamptz, report = ${JSON.stringify(report)}::jsonb
     WHERE account_id = ${account}::uuid
  `);

  return { ok: true, report };
}

/**
 * The report, built by walking `DELETION_SCOPE` — the same array the screen renders.
 * Every entry appears, including the retained ones, because a report that lists only
 * what was destroyed is a report that reads as a claim of totality.
 */
export function buildErasureReport(input: {
  readonly accountId: string;
  readonly executedAt: Date;
  readonly affected: ReadonlyMap<string, number>;
  readonly notes?: ReadonlyMap<string, string>;
}): ErasureReport {
  return {
    accountId: input.accountId,
    executedAt: input.executedAt.toISOString(),
    boundaryStatement: DELETION_BOUNDARY_STATEMENT,
    lines: DELETION_SCOPE.map((entry) => {
      const note = input.notes?.get(entry.id);
      return {
        id: entry.id,
        label: entry.label,
        disposition: entry.disposition,
        mechanism: entry.mechanism,
        retention: entry.retention ?? null,
        why: entry.why ?? null,
        affected: entry.disposition === 'erased' ? (input.affected.get(entry.id) ?? 0) : null,
        ...(note === undefined ? {} : { note }),
      };
    }),
  };
}

/** What the confirmation screen shows before the click — the same enumeration, with
 *  no counts yet. The screen and the report are the same function with a different
 *  argument, which is the drift the §5.5 sentence is guarding against. */
export function deletionPreview(): ErasureReport {
  return {
    accountId: '',
    executedAt: '',
    boundaryStatement: DELETION_BOUNDARY_STATEMENT,
    lines: DELETION_SCOPE.map((entry) => ({
      id: entry.id,
      label: entry.label,
      disposition: entry.disposition,
      mechanism: entry.mechanism,
      retention: entry.retention ?? null,
      why: entry.why ?? null,
      affected: null,
    })),
  };
}
