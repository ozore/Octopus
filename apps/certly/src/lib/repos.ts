/**
 * Repositories — the only place SQL is written.
 *
 * Every function here takes the `Db` handle rather than opening its own, so a
 * caller can run several of them inside one `withTx` and get the property
 * `specs/09` §2 requires: the audit write and the change it describes commit
 * together, or neither does.
 *
 * Every read is ORG-SCOPED, and `orgId` is never taken from a client-supplied
 * parameter without a membership check upstream (`specs/01` §6). A cross-org
 * read returns nothing, which the caller turns into a 404 rather than a 403 —
 * a 403 confirms the resource exists (`specs/01` A6).
 */

import { and, asc, count, desc, eq, isNull, sql } from 'drizzle-orm';

import { writeAuditEvent, type AuditActor } from './audit';
import type { Db } from './db';
import { compare, type ComparisonResult, type Requirement, type RequirementSet } from './engine';
import { newId } from './ids';
import {
  comparisonResults,
  comparisons,
  orgSettings,
  requirementSets,
  requirements,
  vendorTypes,
  vendors,
} from './schema';
import { getTemplate, TEMPLATE_LIBRARY_VERSION, toRequirementSet } from './templates';
import type { MappedRow } from './vendors/csv';

// ---------------------------------------------------------------------------
// Org settings (M1 / M13)
// ---------------------------------------------------------------------------

export type OrgSettings = typeof orgSettings.$inferSelect;

export async function ensureOrgSettings(db: Db, orgId: string): Promise<OrgSettings> {
  const [existing] = await db.select().from(orgSettings).where(eq(orgSettings.orgId, orgId));
  if (existing) return existing;
  const [created] = await db.insert(orgSettings).values({ orgId }).returning();
  return created as OrgSettings;
}

export async function updateOrgSettings(
  db: Db,
  input: { orgId: string; actor: AuditActor; patch: Partial<Pick<OrgSettings, 'entityBlock' | 'timezone' | 'audience' | 'alternateHolders'>> },
): Promise<OrgSettings> {
  await ensureOrgSettings(db, input.orgId);
  const [updated] = await db
    .update(orgSettings)
    .set({ ...input.patch, updatedAt: new Date() })
    .where(eq(orgSettings.orgId, input.orgId))
    .returning();

  // The entity block is a FUNCTIONAL DEPENDENCY of M5's holder match, so
  // changing it is its own audit kind and, in sub-wave B, enqueues a bulk
  // re-evaluation (specs/13 §2, SH-8).
  const kind = 'entityBlock' in input.patch ? 'org.entity_block_changed' : 'org.settings_changed';
  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind,
    subjectType: 'org',
    subjectId: input.orgId,
    payload: { field: Object.keys(input.patch).join(', '), reevaluatedVendors: 0 },
  });
  return updated as OrgSettings;
}

// ---------------------------------------------------------------------------
// Requirement sets (M2)
// ---------------------------------------------------------------------------

/**
 * A TEMPLATE IS COPIED, NOT REFERENCED (`specs/02` §2). When we update the
 * library next quarter, no customer's requirements change under them — they see
 * "a newer version is available" and choose. `sourceTemplateVersion` is what
 * makes that diff possible.
 */
export async function applyTemplate(
  db: Db,
  input: { orgId: string; templateId: string; actor: AuditActor; name?: string; makeDefault?: boolean },
): Promise<string> {
  const template = getTemplate(input.templateId);
  if (!template) throw new Error(`No such template: ${input.templateId}`);

  const setId = newId('requirementSet');
  const rows = toRequirementSet(template).requirements;

  if (input.makeDefault) {
    await db
      .update(requirementSets)
      .set({ isOrgDefault: false })
      .where(and(eq(requirementSets.orgId, input.orgId), eq(requirementSets.isOrgDefault, true)));
  }

  await db.insert(requirementSets).values({
    id: setId,
    orgId: input.orgId,
    name: input.name ?? template.label,
    audience: template.audience,
    sourceTemplateId: template.id,
    sourceTemplateVersion: TEMPLATE_LIBRARY_VERSION,
    version: 1,
    isOrgDefault: input.makeDefault ?? false,
    createdBy: input.actor.kind === 'user' ? input.actor.userId : null,
  });

  await db.insert(requirements).values(
    rows.map((row) => ({
      id: newId('requirement'),
      requirementSetId: setId,
      orgId: input.orgId,
      kind: row.kind,
      coverage: row.coverage,
      limitLabel: row.limitLabel,
      minAmount: row.minAmount,
      combinable: row.combinable,
      endorsementKey: row.endorsementKey,
      acceptsForms: row.acceptsForms,
      condition: (row.condition ?? null) as Record<string, unknown> | null,
      otherLabel: row.otherLabel,
      label: row.label,
      severity: row.severity,
      note: row.note,
      sortOrder: row.sortOrder,
    })),
  );

  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'requirements.template_applied',
    subjectType: 'requirement_set',
    subjectId: setId,
    payload: { templateId: template.id, rows: rows.length, requirementSetName: input.name ?? template.label },
  });

  return setId;
}

/** The engine's input shape, loaded from the customer's own copy. */
export async function loadRequirementSet(db: Db, orgId: string, setId: string): Promise<RequirementSet | null> {
  const [set] = await db
    .select()
    .from(requirementSets)
    .where(and(eq(requirementSets.id, setId), eq(requirementSets.orgId, orgId)));
  if (!set) return null;

  const rows = await db
    .select()
    .from(requirements)
    .where(eq(requirements.requirementSetId, setId))
    .orderBy(asc(requirements.sortOrder), asc(requirements.id));

  return {
    id: set.id,
    name: set.name,
    audience: set.audience as RequirementSet['audience'],
    version: set.version,
    requirements: rows.map(
      (row): Requirement => ({
        id: row.id,
        kind: row.kind as Requirement['kind'],
        coverage: row.coverage as Requirement['coverage'],
        limitLabel: row.limitLabel as Requirement['limitLabel'],
        minAmount: row.minAmount,
        combinable: row.combinable,
        endorsementKey: row.endorsementKey as Requirement['endorsementKey'],
        acceptsForms: row.acceptsForms ?? [],
        condition: (row.condition ?? null) as Requirement['condition'],
        otherLabel: row.otherLabel,
        label: row.label,
        severity: row.severity as Requirement['severity'],
        note: row.note,
        sortOrder: row.sortOrder,
      }),
    ),
  };
}

/**
 * `specs/02` §8: the VENDOR TYPE WINS; the org default is the fallback; a
 * vendor with no type gets the org default.
 */
export async function resolveRequirementSetId(db: Db, orgId: string, vendorId: string): Promise<string | null> {
  const [vendor] = await db
    .select({ vendorTypeId: vendors.vendorTypeId })
    .from(vendors)
    .where(and(eq(vendors.id, vendorId), eq(vendors.orgId, orgId)));
  if (!vendor) return null;

  if (vendor.vendorTypeId) {
    const [type] = await db
      .select({ requirementSetId: vendorTypes.requirementSetId })
      .from(vendorTypes)
      .where(and(eq(vendorTypes.id, vendor.vendorTypeId), eq(vendorTypes.orgId, orgId)));
    if (type?.requirementSetId) return type.requirementSetId;
  }

  const [fallback] = await db
    .select({ id: requirementSets.id })
    .from(requirementSets)
    .where(and(eq(requirementSets.orgId, orgId), eq(requirementSets.isOrgDefault, true)));
  return fallback?.id ?? null;
}

// ---------------------------------------------------------------------------
// Vendors (M3)
// ---------------------------------------------------------------------------

export type VendorInput = {
  name: string;
  legalName?: string | null;
  vendorTypeId?: string | null;
  contactEmail?: string | null;
  contactLabel?: string | null;
  externalRef?: string | null;
};

export async function createVendor(
  db: Db,
  input: { orgId: string; actor: AuditActor; vendor: VendorInput },
): Promise<string> {
  const id = newId('vendor');
  await db.insert(vendors).values({
    id,
    orgId: input.orgId,
    name: input.vendor.name.trim(),
    legalName: input.vendor.legalName ?? null,
    vendorTypeId: input.vendor.vendorTypeId ?? null,
    contactEmail: input.vendor.contactEmail?.toLowerCase() ?? null,
    contactLabel: input.vendor.contactLabel ?? null,
    externalRef: input.vendor.externalRef ?? null,
  });
  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'vendor.created',
    subjectType: 'vendor',
    subjectId: id,
    payload: { vendorName: input.vendor.name, source: 'manual' },
  });
  return id;
}

/** Archive, never delete — certificates and audit rows are evidence. */
export async function archiveVendor(
  db: Db,
  input: { orgId: string; vendorId: string; actor: AuditActor },
): Promise<void> {
  const [vendor] = await db
    .select({ name: vendors.name })
    .from(vendors)
    .where(and(eq(vendors.id, input.vendorId), eq(vendors.orgId, input.orgId)));
  if (!vendor) return;

  await db
    .update(vendors)
    .set({ archivedAt: new Date(), remindersPaused: true, updatedAt: new Date() })
    .where(and(eq(vendors.id, input.vendorId), eq(vendors.orgId, input.orgId)));

  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'vendor.archived',
    subjectType: 'vendor',
    subjectId: input.vendorId,
    payload: { vendorName: vendor.name },
  });
}

export type ImportResult = { created: number; updated: number; skipped: number; vendorIds: string[] };

/**
 * `specs/04` A4: a name already present in the org UPDATES rather than
 * duplicating. Matched on `externalRef` when the file carries one, else on the
 * normalised name — a vendor renamed at the source system keeps its identity
 * through its reference (`specs/04` §8).
 */
export async function importVendors(
  db: Db,
  input: { orgId: string; actor: AuditActor; rows: MappedRow[]; limit?: number },
): Promise<ImportResult> {
  const existing = await db
    .select({ id: vendors.id, name: vendors.name, externalRef: vendors.externalRef })
    .from(vendors)
    .where(eq(vendors.orgId, input.orgId));

  const byRef = new Map(existing.filter((v) => v.externalRef).map((v) => [v.externalRef as string, v.id]));
  const byName = new Map(existing.map((v) => [v.name.trim().toLowerCase(), v.id]));

  const result: ImportResult = { created: 0, updated: 0, skipped: 0, vendorIds: [] };
  // Last one wins for a duplicate INSIDE one file, counted once (specs/04 §8).
  const seen = new Map<string, MappedRow>();
  for (const row of input.rows) {
    seen.set((row.externalRef ?? row.name).trim().toLowerCase(), row);
  }

  for (const row of seen.values()) {
    const matchId =
      (row.externalRef ? byRef.get(row.externalRef) : undefined) ?? byName.get(row.name.trim().toLowerCase());

    if (matchId) {
      await db
        .update(vendors)
        .set({
          name: row.name,
          legalName: row.legalName,
          contactEmail: row.contactEmail,
          contactLabel: row.contactLabel,
          externalRef: row.externalRef,
          updatedAt: new Date(),
        })
        .where(and(eq(vendors.id, matchId), eq(vendors.orgId, input.orgId)));
      result.updated += 1;
      result.vendorIds.push(matchId);
      continue;
    }

    // The entitlement cap fills to the limit and reports the remainder
    // (specs/10 A10) rather than failing the whole import.
    if (typeof input.limit === 'number' && result.created >= input.limit) {
      result.skipped += 1;
      continue;
    }

    const id = newId('vendor');
    await db.insert(vendors).values({
      id,
      orgId: input.orgId,
      name: row.name,
      legalName: row.legalName,
      contactEmail: row.contactEmail,
      contactLabel: row.contactLabel,
      externalRef: row.externalRef,
    });
    byName.set(row.name.trim().toLowerCase(), id);
    if (row.externalRef) byRef.set(row.externalRef, id);
    result.created += 1;
    result.vendorIds.push(id);
  }

  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'vendor.created',
    subjectType: 'org',
    subjectId: input.orgId,
    summary: `${result.created} vendors were imported and ${result.updated} updated from a spreadsheet.`,
    payload: { source: 'csv', ...result, vendorIds: undefined },
  });

  return result;
}

export async function countTrackedVendors(db: Db, orgId: string): Promise<number> {
  // THE METER: one non-archived vendor in the account. A vendor who has not
  // sent anything yet still occupies a slot — finding those is the point
  // (specs/10 §2.1).
  const [row] = await db
    .select({ value: count() })
    .from(vendors)
    .where(and(eq(vendors.orgId, orgId), isNull(vendors.archivedAt)));
  return Number(row?.value ?? 0);
}

export async function listVendors(db: Db, orgId: string, limit = 100) {
  return db
    .select()
    .from(vendors)
    .where(and(eq(vendors.orgId, orgId), isNull(vendors.archivedAt)))
    .orderBy(asc(vendors.earliestRequiredExpiry), asc(vendors.name))
    .limit(limit);
}

/** The dashboard's six counters, in one indexed query (specs/06 §3). */
export async function vendorStatusCounts(db: Db, orgId: string): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: vendors.status, value: count() })
    .from(vendors)
    .where(and(eq(vendors.orgId, orgId), isNull(vendors.archivedAt)))
    .groupBy(vendors.status);
  const counts: Record<string, number> = {
    meets: 0,
    asserted_only: 0,
    expiring: 0,
    gap: 0,
    expired: 0,
    no_certificate: 0,
  };
  for (const row of rows) counts[row.status] = Number(row.value);
  return counts;
}

// ---------------------------------------------------------------------------
// Comparisons (M5)
// ---------------------------------------------------------------------------

/**
 * Persists a comparison and refreshes the vendor's cached status.
 *
 * `vendors.status` and `vendors.earliestRequiredExpiry` are CACHES of exactly
 * this output and are never written anywhere else (`specs/04` §4). Writing them
 * here, in the same transaction as the comparison, is what keeps the dashboard
 * a single indexed query without letting it drift.
 */
export async function saveComparison(
  db: Db,
  input: {
    orgId: string;
    vendorId: string;
    certificateId?: string | null;
    requirementSetId?: string | null;
    result: ComparisonResult;
    actor: AuditActor;
    vendorName?: string;
    requirementSetName?: string;
  },
): Promise<string> {
  const id = newId('comparison');
  const { result } = input;

  await db.insert(comparisons).values({
    id,
    orgId: input.orgId,
    vendorId: input.vendorId,
    certificateId: input.certificateId ?? null,
    requirementSetId: input.requirementSetId ?? null,
    requirementSetVersion: result.requirementSetVersion,
    engineVersion: result.engineVersion,
    evaluationDate: result.evaluationDate,
    status: result.status,
    metCount: result.metCount,
    gapCount: result.gapCount,
    assertedOnlyCount: result.assertedOnlyCount,
    notCheckedCount: result.notCheckedCount,
    undeterminedCount: result.undeterminedCount,
    earliestRequiredExpiry: result.earliestRequiredExpiry,
  });

  if (result.results.length > 0) {
    await db.insert(comparisonResults).values(
      result.results.map((row) => ({
        id: newId('comparisonResult'),
        comparisonId: id,
        requirementId: row.requirementId,
        origin: row.origin,
        kind: row.kind,
        coverage: row.coverage,
        label: row.label,
        severity: row.severity,
        state: row.state,
        foundAmount: row.foundAmount,
        foundRaw: row.foundRaw,
        foundForm: row.foundForm,
        conditional: row.conditional,
        explanation: row.explanation,
        evidence: row.evidence,
        sortOrder: row.sortOrder,
      })),
    );
  }

  await db
    .update(vendors)
    .set({
      status: result.status,
      earliestRequiredExpiry: result.earliestRequiredExpiry,
      updatedAt: new Date(),
    })
    .where(and(eq(vendors.id, input.vendorId), eq(vendors.orgId, input.orgId)));

  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'comparison.run',
    subjectType: 'vendor',
    subjectId: input.vendorId,
    payload: {
      // The three ids that make the result reproducible (specs/09 A3).
      comparisonId: id,
      requirementSetVersion: result.requirementSetVersion,
      engineVersion: result.engineVersion,
      extractionId: input.certificateId ?? null,
      vendorName: input.vendorName ?? 'a vendor',
      requirementSetName: input.requirementSetName ?? 'your requirements',
      metCount: result.metCount,
      gapCount: result.gapCount,
      assertedOnlyCount: result.assertedOnlyCount,
    },
  });

  return id;
}

export async function latestComparison(db: Db, orgId: string, vendorId: string) {
  const [row] = await db
    .select()
    .from(comparisons)
    .where(and(eq(comparisons.orgId, orgId), eq(comparisons.vendorId, vendorId)))
    .orderBy(desc(comparisons.evaluatedAt))
    .limit(1);
  if (!row) return null;
  const rows = await db
    .select()
    .from(comparisonResults)
    .where(eq(comparisonResults.comparisonId, row.id))
    .orderBy(asc(comparisonResults.sortOrder));
  return { comparison: row, results: rows };
}

/**
 * The whole loop, in one place, so a caller does not have to remember the
 * order: resolve the requirement set → compare → persist → refresh the cache.
 * Used by the M4 job in sub-wave B and by the tests here.
 */
export async function runComparison(
  db: Db,
  input: {
    orgId: string;
    vendorId: string;
    extraction: Parameters<typeof compare>[0]['extraction'];
    evaluationDate: string;
    actor: AuditActor;
    certificateId?: string | null;
  },
): Promise<{ comparisonId: string; result: ComparisonResult } | null> {
  const [vendor] = await db
    .select()
    .from(vendors)
    .where(and(eq(vendors.id, input.vendorId), eq(vendors.orgId, input.orgId)));
  if (!vendor) return null;

  const setId = await resolveRequirementSetId(db, input.orgId, input.vendorId);
  if (!setId) return null;
  const set = await loadRequirementSet(db, input.orgId, setId);
  if (!set) return null;

  const settings = await ensureOrgSettings(db, input.orgId);
  const result = compare({
    extraction: input.extraction,
    requirementSet: set,
    evaluationDate: input.evaluationDate,
    vendor: { name: vendor.name, legalName: vendor.legalName },
    org: { entityBlock: settings.entityBlock, alternateHolders: settings.alternateHolders ?? [] },
  });

  const comparisonId = await saveComparison(db, {
    orgId: input.orgId,
    vendorId: input.vendorId,
    certificateId: input.certificateId ?? null,
    requirementSetId: setId,
    result,
    actor: input.actor,
    vendorName: vendor.name,
    requirementSetName: set.name,
  });

  return { comparisonId, result };
}

/** Test and admin affordance: the retention-deletion flag `specs/09` §7 requires. */
export async function allowAuditRetentionDelete(db: Db): Promise<void> {
  await db.execute(sql`SET LOCAL certly.audit_retention_delete = 'on'`);
}
