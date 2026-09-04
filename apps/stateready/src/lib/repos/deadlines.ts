/**
 * The derivation SERVICE — the database side of M5.
 *
 * The engine itself (`src/lib/rules/`) is pure and knows nothing about this
 * file. Everything here is persistence, supersession and the activation event.
 *
 * THREE PROPERTIES:
 *
 *  1. **Deadlines are superseded, never updated in place.** A changed date
 *     writes a NEW row and stamps `superseded_at` on the old one, so "you told
 *     me 4 June" is answerable with what we knew, when, and from which snapshot.
 *  2. **`licence_deadline_derived` is emitted HERE**, not from the licence
 *     create path (`specs/05` §Analytics, wave-1b **M4**). Every route into
 *     derivation — create, CSV import, profile change, KB publish, the nightly
 *     cron — therefore counts as activation. Emitting it at creation counted one
 *     route out of five and would have silently under-counted `THRESHOLDS.md` T1.
 *  3. **Re-deriving is idempotent.** An unchanged deadline supersedes nothing
 *     and inserts nothing, so the nightly cron does not churn the table or the
 *     activation metric.
 */

import { newId } from '@octopus/platform';
import { track } from '@octopus/platform/events';
import { and, asc, eq, isNull } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';

import { getKbRecord } from '../kb/accessors';
import { currentSnapshotId } from '../kb/snapshot';
import type { Trade } from '../kb/types';
import { ACTIVATION_EVENT } from '../plans';
import { allDeadlines, derive, type DerivationResult, type DerivedDeadline } from '../rules';
import { deadlines, licences, type Licence } from '../schema';

export type DeriveOptions = { today: string; userId?: string | null; snapshotId?: string | null };

function toRow(
  deadline: DerivedDeadline,
  licence: Licence,
  snapshotId: string | null,
): typeof deadlines.$inferInsert {
  return {
    id: newId('dln'),
    orgId: licence.orgId,
    licenceId: licence.id,
    kind: deadline.kind,
    dueOn: deadline.dueOn,
    source: deadline.source,
    rule: deadline.rule,
    kbRecordId: deadline.kbRecordId,
    kbLicenceTypeId: deadline.kbLicenceTypeId,
    kbSnapshotId: snapshotId,
    citationUrl: deadline.citation.url,
    citationText: deadline.citation.text,
    citationLastVerified: deadline.citation.lastVerified,
    confidence: deadline.confidence,
    needsHumanCheck: deadline.needsHumanCheck,
    flagReasons: deadline.flagReasons,
    notes: deadline.notes,
    detail: deadline.detail as never,
    trace: deadline.trace as never,
  };
}

/** Same date, same rule, same flag, same citation — nothing a customer would notice. */
function unchanged(row: typeof deadlines.$inferSelect, next: DerivedDeadline): boolean {
  return (
    row.dueOn === next.dueOn &&
    row.kind === next.kind &&
    row.source === next.source &&
    (row.rule ?? null) === (next.rule ?? null) &&
    row.confidence === next.confidence &&
    row.needsHumanCheck === next.needsHumanCheck &&
    (row.citationUrl ?? null) === (next.citation.url ?? null)
  );
}

export function deriveForLicenceInput(licence: Licence, today: string): DerivationResult {
  const record = getKbRecord(licence.state, licence.trade);
  return derive(
    {
      state: licence.state,
      trade: licence.trade,
      kbLicenceTypeId: licence.kbLicenceTypeId,
      issuedOn: licence.issuedOn,
      expiresOn: licence.expirySource === 'entered' ? licence.expiresOn : null,
      ceRecords: [],
      ceCarriedInHours: Number(licence.ceCarriedInHours ?? 0),
      qualifierDisassociatedOn: licence.qualifierDisassociatedOn,
    },
    record,
    today,
  );
}

export type DerivationDiff = {
  inserted: number;
  superseded: number;
  unchanged: number;
  explanations: DerivationResult['explanations'];
  result: DerivationResult;
};

export async function deriveForLicence(
  db: Db,
  licenceId: string,
  options: DeriveOptions,
): Promise<DerivationDiff> {
  const rows = await db.select().from(licences).where(eq(licences.id, licenceId)).limit(1);
  const licence = rows[0];
  if (!licence) throw new Error(`no licence ${licenceId}`);

  const snapshotId = options.snapshotId ?? (await currentSnapshotId(db));
  const result = deriveForLicenceInput(licence, options.today);
  const next = allDeadlines(result);

  const live = await db
    .select()
    .from(deadlines)
    .where(and(eq(deadlines.licenceId, licence.id), isNull(deadlines.supersededAt)));

  const diff: DerivationDiff = { inserted: 0, superseded: 0, unchanged: 0, explanations: result.explanations, result };
  const matched = new Set<string>();

  for (const deadline of next) {
    const existing = live.find((row) => row.kind === deadline.kind && !matched.has(row.id));
    if (existing && unchanged(existing, deadline)) {
      matched.add(existing.id);
      diff.unchanged += 1;
      continue;
    }
    if (existing) {
      await db
        .update(deadlines)
        .set({ supersededAt: new Date() })
        .where(eq(deadlines.id, existing.id));
      matched.add(existing.id);
      diff.superseded += 1;
    }
    await db.insert(deadlines).values(toRow(deadline, licence, snapshotId));
    diff.inserted += 1;

    // THE ACTIVATION EVENT. Emitted from the derivation service, once per
    // DERIVED deadline, whatever route reached it (create, import, profile
    // change, KB publish, nightly cron).
    //
    // A deadline the customer TYPED is not an activation: `THRESHOLDS.md` T1
    // measures "the product told me a date I did not know I had", and counting
    // a date they entered themselves would make T1 measure data entry. Those
    // rows get their own name so the two are never confused.
    await track(db, {
      name: deadline.source === 'derived' ? ACTIVATION_EVENT : 'licence_deadline_recorded',
      orgId: licence.orgId,
      ...(options.userId ? { userId: options.userId } : {}),
      props: {
        kind: deadline.kind,
        rule: deadline.rule,
        confidence: deadline.confidence,
        needs_human_check: deadline.needsHumanCheck,
        state: licence.state,
        trade: licence.trade,
      },
    });
  }

  // A deadline that no longer derives (the KB lost the rule, the licence was
  // re-typed) is superseded rather than deleted: the history is the product.
  for (const row of live) {
    if (matched.has(row.id)) continue;
    await db.update(deadlines).set({ supersededAt: new Date() }).where(eq(deadlines.id, row.id));
    diff.superseded += 1;
    await track(db, { name: 'deadline_superseded', orgId: licence.orgId, props: { kind: row.kind } });
  }

  if (result.explanations.length > 0 && next.length === 0) {
    await track(db, {
      name: 'derivation_failed',
      orgId: licence.orgId,
      props: {
        state: licence.state,
        trade: licence.trade,
        reasons: result.explanations.map((e) => e.reason),
      },
    });
  }

  return diff;
}

/** Batched: used after a profile change, a CSV import or a knowledge-base publish. */
export async function deriveForOrganisation(db: Db, orgId: string, options: DeriveOptions) {
  const rows = await db
    .select({ id: licences.id })
    .from(licences)
    .where(and(eq(licences.orgId, orgId), eq(licences.status, 'active')));
  const totals = { inserted: 0, superseded: 0, unchanged: 0, licences: rows.length };
  for (const row of rows) {
    const diff = await deriveForLicence(db, row.id, options);
    totals.inserted += diff.inserted;
    totals.superseded += diff.superseded;
    totals.unchanged += diff.unchanged;
  }
  return totals;
}

export async function liveDeadlines(db: Db, orgId: string) {
  return db
    .select()
    .from(deadlines)
    .where(and(eq(deadlines.orgId, orgId), isNull(deadlines.supersededAt)))
    .orderBy(asc(deadlines.dueOn));
}

export async function liveDeadlinesForLicence(db: Db, licenceId: string) {
  return db
    .select()
    .from(deadlines)
    .where(and(eq(deadlines.licenceId, licenceId), isNull(deadlines.supersededAt)))
    .orderBy(asc(deadlines.dueOn));
}

/** `explainDeadline` — the "why this date?" panel. Emits `deadline_explained`. */
export async function explainDeadline(db: Db, orgId: string, deadlineId: string) {
  const rows = await db
    .select()
    .from(deadlines)
    .where(and(eq(deadlines.id, deadlineId), eq(deadlines.orgId, orgId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  await track(db, { name: 'deadline_explained', orgId, props: { kind: row.kind, rule: row.rule } });
  return row;
}

export type { Trade };
