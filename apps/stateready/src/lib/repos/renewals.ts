/**
 * M7 — `markRenewed`. `specs/07` §Server actions, AC5.
 *
 * **The single most important button on the dashboard.** `marked_renewed` is
 * the strongest retention signal in the product: a customer who marks a renewal
 * has used us to do the job, not merely to look at it.
 *
 * FOUR THINGS HAPPEN AND THEY HAPPEN TOGETHER (`specs/07` §Test plan, and
 * `BUILD.md`'s "in one transaction"):
 *
 *   1. the licence takes the new expiry, marked `entered` — the customer read
 *      it off the renewed card, and we do not pretend we derived it;
 *   2. derivation re-runs, so CE and the qualifier clock move with it;
 *   3. the deadlines that moved are SUPERSEDED, never updated in place, so
 *      "you told me 4 June" stays answerable;
 *   4. every alert still queued against a superseded deadline is CANCELLED —
 *      with a status, not a delete, because an alert that was never sent and
 *      cannot be explained is the failure this product is sold against.
 *
 * **The warning is a warning, not a wall** (`specs/07` §Validation). A new
 * expiry that does not match the state's own cycle is usually a typo, and
 * finding it is worth the subscription — but the board is the authority, not
 * us, so we say what the rule would give and let them proceed.
 */

import { track } from '@octopus/platform/events';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';

import { getKbRecord } from '../kb/accessors';
import { addMonths, daysBetween } from '../rules/dates';
import { alerts, deadlines, licenceDocuments, licences } from '../schema';
import { recordAudit } from './audit';
import { refreshDashboardSummary } from './dashboard';
import { deriveForLicence } from './deadlines';
import { updateLicence, type CreateLicenceInput } from './licences';

export type MarkRenewedInput = {
  orgId: string;
  deadlineId: string;
  newExpiry: string;
  documentId?: string | null;
  actorUserId?: string | null;
};

export type MarkRenewedResult = {
  licenceId: string;
  superseded: number;
  inserted: number;
  alertsCancelled: number;
  /** Non-blocking. Rendered beside the confirmation; the change is already made. */
  warning: string | null;
};

/**
 * "Texas ACR licences run 12 months — 2028-04-01 is 24 months out. Sure?"
 *
 * Pure, so the wording is testable without a database. Returns null when the
 * new date is consistent with the board's own cycle, or when we hold no cycle
 * to compare it against — we never warn on the strength of a rule we do not have.
 */
export function renewalConsistencyWarning(input: {
  state: string;
  trade: string;
  kbLicenceTypeId: string | null;
  previousExpiry: string | null;
  newExpiry: string;
}): string | null {
  const record = getKbRecord(input.state, input.trade);
  const licenceType = record?.licence_types.find((lt) => lt.licence_type_id === input.kbLicenceTypeId);
  const cycle = licenceType?.renewal.cycle;
  if (!record || !licenceType || !input.previousExpiry) return null;
  if (typeof cycle?.value !== 'number' || cycle.status === 'unknown') return null;

  const expected = addMonths(input.previousExpiry, cycle.value);
  const drift = daysBetween(expected, input.newExpiry);
  // A month either way is a board's own rounding, a renewal processed late, or
  // a fixed-date rule landing on a different weekday. Beyond that it is a typo.
  if (Math.abs(drift) <= 45) return null;

  const months = Math.round(daysBetween(input.previousExpiry, input.newExpiry) / 30.44);
  return (
    `${record.state_name} ${licenceType.name} licences run ${cycle.value} months — ` +
    `${input.newExpiry} is about ${months} months out. Sure? We have saved what you entered.`
  );
}

/**
 * Cancel every alert still queued against a deadline this licence no longer
 * has. `specs/04` AC6 — *"changing the issue date re-derives the expiry and
 * RESCHEDULES THE ALERT SET, verified by the alerts table"* — and `specs/07`
 * AC5 for `markRenewed`.
 *
 * Cancelled with a status, never deleted. An alert that was not sent and cannot
 * be explained is the exact failure this product is sold against, so silence
 * has to stay visible to us (`specs/06`, B4).
 */
export async function cancelAlertsForSupersededDeadlines(
  db: Db,
  input: { licenceId: string; deadlineIdsBefore: readonly string[] },
): Promise<number> {
  if (input.deadlineIdsBefore.length === 0) return 0;
  const stillLive = await db
    .select({ id: deadlines.id })
    .from(deadlines)
    .where(and(eq(deadlines.licenceId, input.licenceId), isNull(deadlines.supersededAt)));
  const stillLiveIds = new Set(stillLive.map((row) => row.id));
  const gone = input.deadlineIdsBefore.filter((id) => !stillLiveIds.has(id));
  if (gone.length === 0) return 0;

  const queued = await db
    .select({ id: alerts.id })
    .from(alerts)
    .where(and(inArray(alerts.deadlineId, gone), eq(alerts.status, 'queued')));
  if (queued.length > 0) {
    await db
      .update(alerts)
      .set({ status: 'cancelled' })
      .where(and(inArray(alerts.deadlineId, gone), eq(alerts.status, 'queued')));
  }
  return queued.length;
}

export async function liveDeadlineIds(db: Db, licenceId: string): Promise<string[]> {
  const rows = await db
    .select({ id: deadlines.id })
    .from(deadlines)
    .where(and(eq(deadlines.licenceId, licenceId), isNull(deadlines.supersededAt)));
  return rows.map((row) => row.id);
}

/**
 * Edit a licence AND reschedule its alerts, which is what `specs/04` AC6 means
 * by "re-derives … and reschedules the alert set". `updateLicence` owns the
 * derivation; the alert side is here so `repos/licences.ts` stays the shape M6
 * and the nightly cron already build on.
 */
export async function updateLicenceAndReschedule(
  db: Db,
  input: { orgId: string; licenceId: string; patch: Partial<CreateLicenceInput>; actorUserId?: string | null },
  options: { today: string },
): Promise<{ derivation: Awaited<ReturnType<typeof updateLicence>>; alertsCancelled: number }> {
  const before = await liveDeadlineIds(db, input.licenceId);
  const derivation = await updateLicence(db, input, options);
  await syncLicenceExpiry(db, input.licenceId);
  const alertsCancelled = await cancelAlertsForSupersededDeadlines(db, {
    licenceId: input.licenceId,
    deadlineIdsBefore: before,
  });
  await refreshDashboardSummary(db, input.orgId, options.today);
  return { derivation, alertsCancelled };
}

/**
 * Bring `licences.expires_on` back in line with the live renewal deadline.
 *
 * `createLicence` writes the derived expiry onto the licence row; `updateLicence`
 * re-derives the DEADLINES but leaves the licence's own copy of the date where
 * it was, so a customer who corrects an issue date sees the new date on the
 * board (which reads deadlines) and the old one on the licence list and the
 * technician card (which read the licence). One field, two answers, is worse
 * than either.
 *
 * A date the CUSTOMER entered is never touched: `expirySource = 'entered'` is
 * the flag that says the row is theirs, and this function only ever writes a
 * `derived` one.
 */
export async function syncLicenceExpiry(db: Db, licenceId: string): Promise<void> {
  const rows = await db
    .select()
    .from(deadlines)
    .where(
      and(
        eq(deadlines.licenceId, licenceId),
        isNull(deadlines.supersededAt),
        eq(deadlines.kind, 'renewal'),
      ),
    )
    .limit(1);
  const renewal = rows[0];
  if (!renewal) return;
  await db
    .update(licences)
    .set({
      expiresOn: renewal.dueOn,
      expirySource: renewal.source === 'derived' ? 'derived' : 'entered',
      updatedAt: new Date(),
    })
    .where(eq(licences.id, licenceId));
}

export async function markRenewed(
  db: Db,
  input: MarkRenewedInput,
  options: { today: string },
): Promise<MarkRenewedResult> {
  const deadlineRows = await db
    .select()
    .from(deadlines)
    .where(and(eq(deadlines.id, input.deadlineId), eq(deadlines.orgId, input.orgId)))
    .limit(1);
  const deadline = deadlineRows[0];
  if (!deadline?.licenceId) throw new Error('no such deadline');

  const licenceRows = await db
    .select()
    .from(licences)
    .where(and(eq(licences.id, deadline.licenceId), eq(licences.orgId, input.orgId)))
    .limit(1);
  const licence = licenceRows[0];
  if (!licence) throw new Error('no such licence');

  if (input.newExpiry <= options.today) {
    throw new Error('A renewal has to be in the future — check the date on the new card.');
  }
  if (input.documentId) {
    const doc = await db
      .select({ id: licenceDocuments.id })
      .from(licenceDocuments)
      .where(and(eq(licenceDocuments.id, input.documentId), eq(licenceDocuments.orgId, input.orgId)))
      .limit(1);
    if (!doc[0]) throw new Error('no such document');
  }

  const warning = renewalConsistencyWarning({
    state: licence.state,
    trade: licence.trade,
    kbLicenceTypeId: licence.kbLicenceTypeId,
    previousExpiry: licence.expiresOn,
    newExpiry: input.newExpiry,
  });

  // The live deadline ids BEFORE derivation: whichever of them is superseded by
  // the re-run is one whose queued alerts must now be cancelled.
  const liveBefore = await db
    .select({ id: deadlines.id })
    .from(deadlines)
    .where(and(eq(deadlines.licenceId, licence.id), isNull(deadlines.supersededAt)));
  const beforeIds = liveBefore.map((r) => r.id);

  let superseded = 0;
  let inserted = 0;
  let alertsCancelled = 0;

  await inTransaction(db, async (tx) => {
    await tx
      .update(licences)
      .set({ expiresOn: input.newExpiry, expirySource: 'entered', status: 'active', updatedAt: new Date() })
      .where(eq(licences.id, licence.id));

    const diff = await deriveForLicence(tx, licence.id, {
      today: options.today,
      userId: input.actorUserId ?? null,
    });
    superseded = diff.superseded;
    inserted = diff.inserted;

    if (beforeIds.length > 0) {
      const stillLive = await tx
        .select({ id: deadlines.id })
        .from(deadlines)
        .where(and(eq(deadlines.licenceId, licence.id), isNull(deadlines.supersededAt)));
      const stillLiveIds = new Set(stillLive.map((r) => r.id));
      const gone = beforeIds.filter((id) => !stillLiveIds.has(id));
      if (gone.length > 0) {
        // Counted before the write rather than with `.returning()`: `Db` is a
        // union of two drizzle databases and only one of them types the
        // one-argument overload, so the count is a select.
        const queued = await tx
          .select({ id: alerts.id })
          .from(alerts)
          .where(and(inArray(alerts.deadlineId, gone), eq(alerts.status, 'queued')));
        if (queued.length > 0) {
          await tx
            .update(alerts)
            .set({ status: 'cancelled' })
            .where(and(inArray(alerts.deadlineId, gone), eq(alerts.status, 'queued')));
        }
        alertsCancelled = queued.length;
      }
    }
  });

  if (input.documentId) {
    await db
      .update(licenceDocuments)
      .set({ licenceId: licence.id })
      .where(and(eq(licenceDocuments.id, input.documentId), eq(licenceDocuments.orgId, input.orgId)));
  }

  await recordAudit(db, {
    orgId: input.orgId,
    actorUserId: input.actorUserId ?? null,
    action: 'licence_renewed',
    entityTable: 'licences',
    entityId: licence.id,
    before: { expiresOn: licence.expiresOn },
    after: { expiresOn: input.newExpiry },
  });
  await track(db, {
    name: 'marked_renewed',
    orgId: input.orgId,
    ...(input.actorUserId ? { userId: input.actorUserId } : {}),
    props: { state: licence.state, trade: licence.trade, alerts_cancelled: alertsCancelled },
  });

  // The summary is materialised, so it is recomputed on the write rather than
  // read stale on the next page (`specs/07` §Data model).
  await refreshDashboardSummary(db, input.orgId, options.today);

  return { licenceId: licence.id, superseded, inserted, alertsCancelled, warning };
}

/**
 * `Db` is a UNION of the postgres-js and PGlite drizzle databases, and calling
 * `.transaction()` straight off a union is not something TypeScript will type:
 * the two callbacks take different transaction classes. Both are structurally a
 * `Db` for everything this app does with one, so the seam is narrowed here,
 * once, with the reason written down — rather than by every caller casting.
 */
async function inTransaction<T>(db: Db, run: (tx: Db) => Promise<T>): Promise<T> {
  const handle = db as unknown as { transaction: <R>(cb: (tx: Db) => Promise<R>) => Promise<R> };
  return handle.transaction(run);
}
