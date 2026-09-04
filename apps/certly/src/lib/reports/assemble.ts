/**
 * BUILDING THE SNAPSHOT — `specs/12` §3, §7, §13.
 *
 * THE COVER COUNTS COME FROM THE DASHBOARD'S OWN PREDICATE MODULE
 * (`src/lib/repos/dashboard.ts`). `specs/12` §13 requires it in as many words —
 * "a test asserts both call it, so cover counts can never disagree with the
 * screen" — and `tests/reports.test.ts` is that test. A report whose cover says
 * seven gaps beside a screen that says eight is not evidence; it is an argument.
 *
 * TWO SECTIONS ARE NEVER OMITTED, and both exist for the same reason:
 *
 *  - **"Not checked by Certly"** (§3 item 5). Carrier ratings today, and
 *    anything else outside launch scope. A report that hides what it did not
 *    check is the failure mode this whole product exists to correct.
 *  - **"Read, but not confident enough to compare (n)"** (§3 item 6, REVIEW.md
 *    B-09). Those vendors are counted under **No certificate** on the cover and
 *    appear in no green count — an unreviewed extraction never colours a vendor
 *    green (`specs/06` §8).
 */

import { and, eq, inArray } from 'drizzle-orm';

import type { Db } from '../db';
import { ENGINE_VERSION, formatMoney, formatDate } from '../engine';
import {
  COUNTER_ORDER,
  comparisonRows,
  dashboardCounters,
  latestComparisons,
  rosterForScope,
  type DashboardFilter,
} from '../repos/dashboard';
import { reviewQueue, documentLabel } from '../repos/review-queue';
import {
  certificateInsurers,
  certificates,
  coverageLimits,
  coverages,
  documents,
  requirementSets,
} from '../schema';
import { getTemplate } from '../templates';
import { VENDOR_WORD } from '../status';
import {
  REPORT_SNAPSHOT_VERSION,
  type ReportScope,
  type ReportSnapshot,
  type SnapshotResultRow,
  type SnapshotVendor,
} from './types';

/** `specs/12` §8 — a selection is at most 1,000 vendors. */
export const MAX_SCOPE_VENDORS = 1000;

export function scopeToFilter(scope: ReportScope): DashboardFilter {
  switch (scope.kind) {
    case 'all':
      return {};
    case 'filter':
      return { status: scope.status ?? null, q: scope.q ?? null };
    case 'selection':
      return { vendorIds: scope.vendorIds.slice(0, MAX_SCOPE_VENDORS) };
    case 'vendor':
      return { vendorIds: [scope.vendorId] };
  }
}

export function scopeLabel(scope: ReportScope): string {
  switch (scope.kind) {
    case 'all':
      return 'Every vendor on the roster';
    case 'filter':
      return `Filtered: ${[scope.status ? `status ${scope.status}` : null, scope.q ? `search “${scope.q}”` : null]
        .filter(Boolean)
        .join(', ') || 'no filter'}`;
    case 'selection':
      return `${scope.vendorIds.length} selected ${scope.vendorIds.length === 1 ? 'vendor' : 'vendors'}`;
    case 'vendor':
      return 'One vendor';
  }
}

/** What the requirement demanded, printed — the report's "required value". */
function requiredValue(row: {
  kind: string;
  label: string;
  state: string;
}): string {
  // The engine already renders the demand into the row label and explanation;
  // the column exists so a spreadsheet can pivot on it, so it repeats the
  // label rather than inventing a second phrasing of the same fact.
  return row.label;
}

export async function assembleReport(
  db: Db,
  input: {
    orgId: string;
    orgName: string;
    entityBlock: string | null;
    timezone: string;
    today: string;
    reportId: string;
    scope: ReportScope;
    generatedBy?: string | null;
    now?: Date;
  },
): Promise<ReportSnapshot> {
  const filter = scopeToFilter(input.scope);
  const roster = await rosterForScope(db, { orgId: input.orgId, filter, limit: MAX_SCOPE_VENDORS });
  const counters = await dashboardCounters(db, input.orgId, filter);
  const vendorIds = roster.map((row) => row.id);

  const latest = await latestComparisons(db, input.orgId, vendorIds);
  const rows = await comparisonRows(db, [...latest.values()].map((c) => c.comparisonId));
  const rowsByComparison = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = rowsByComparison.get(row.comparisonId) ?? [];
    list.push(row);
    rowsByComparison.set(row.comparisonId, list);
  }

  // --- requirement sets, for the provenance appendix ------------------------
  const setIds = [...new Set([...latest.values()].map((c) => c.requirementSetId).filter(Boolean))] as string[];
  const sets =
    setIds.length > 0
      ? await db.select().from(requirementSets).where(inArray(requirementSets.id, setIds))
      : [];
  const setById = new Map(sets.map((set) => [set.id, set]));

  // --- certificates and what they printed -----------------------------------
  const certRows =
    vendorIds.length > 0
      ? await db
          .select({
            id: certificates.id,
            vendorId: certificates.vendorId,
            certificateDate: certificates.certificateDate,
            extractionId: certificates.extractionId,
            documentId: certificates.documentId,
            storageKey: documents.storageKey,
            uploadedAt: documents.uploadedAt,
          })
          .from(certificates)
          .innerJoin(documents, eq(documents.id, certificates.documentId))
          .where(
            and(
              eq(certificates.orgId, input.orgId),
              eq(certificates.status, 'active'),
              inArray(certificates.vendorId, vendorIds),
            ),
          )
      : [];
  const certByVendor = new Map(certRows.map((row) => [row.vendorId, row]));
  const certIds = certRows.map((row) => row.id);

  const coverageRows =
    certIds.length > 0
      ? await db.select().from(coverages).where(inArray(coverages.certificateId, certIds))
      : [];
  const limitRows =
    coverageRows.length > 0
      ? await db
          .select()
          .from(coverageLimits)
          .where(inArray(coverageLimits.coverageId, coverageRows.map((row) => row.id)))
      : [];
  const insurerRows =
    certIds.length > 0
      ? await db.select().from(certificateInsurers).where(inArray(certificateInsurers.certificateId, certIds))
      : [];

  const limitsByCoverage = new Map<string, typeof limitRows>();
  for (const limit of limitRows) {
    const list = limitsByCoverage.get(limit.coverageId) ?? [];
    list.push(limit);
    limitsByCoverage.set(limit.coverageId, list);
  }

  /**
   * The certificate's own row for a coverage type, so the CSV can print the
   * policy number, the expiry, the insurer and — for an `OTHER:` block — the
   * PRINTED limit label (REVIEW.md MJ-18). Matched on the printed characters,
   * never on a re-derived value.
   */
  function certificateFacts(certificateId: string | undefined, coverage: string | null, foundRaw: string | null) {
    if (!certificateId || !coverage) return { policyNumber: null, policyExp: null, insurer: null, labelRaw: null };
    const row = coverageRows.find((c) => c.certificateId === certificateId && c.type === coverage);
    if (!row) return { policyNumber: null, policyExp: null, insurer: null, labelRaw: null };
    const insurer =
      insurerRows.find((i) => i.certificateId === certificateId && i.letter === row.insrLetter)?.name ?? null;
    const limits = limitsByCoverage.get(row.id) ?? [];
    const matched = foundRaw ? limits.find((limit) => limit.raw === foundRaw) : undefined;
    return {
      policyNumber: row.policyNumber,
      policyExp: row.policyExp,
      insurer,
      labelRaw: matched?.labelRaw ?? row.typeLabelRaw ?? null,
    };
  }

  // --- one snapshot vendor per roster row ------------------------------------
  const notChecked: ReportSnapshot['notChecked'] = [];
  const engineVersions = new Set<string>();

  const vendors: SnapshotVendor[] = roster.map((vendor) => {
    const comparison = latest.get(vendor.id) ?? null;
    const cert = certByVendor.get(vendor.id);
    const set = comparison?.requirementSetId ? setById.get(comparison.requirementSetId) : undefined;
    const template = set?.sourceTemplateId ? getTemplate(set.sourceTemplateId) : null;
    if (comparison) engineVersions.add(comparison.engineVersion);

    const resultRows: SnapshotResultRow[] = (
      comparison ? (rowsByComparison.get(comparison.comparisonId) ?? []) : []
    ).map((row) => {
      const facts = certificateFacts(cert?.id, row.coverage, row.foundRaw);
      if (row.state === 'not_checked') {
        notChecked.push({ vendorName: vendor.name, label: row.label, explanation: row.explanation });
      }
      return {
        requirementId: row.requirementId,
        origin: row.origin,
        kind: row.kind,
        coverage: row.coverage,
        label: row.label,
        severity: row.severity,
        state: row.state,
        requiredValue: requiredValue(row),
        foundValueRaw: row.foundRaw,
        foundAmount: row.foundAmount,
        foundLabelRaw: facts.labelRaw,
        conditional: row.conditional,
        explanation: row.explanation,
        policyNumber: facts.policyNumber,
        policyExp: facts.policyExp,
        insurer: facts.insurer,
      };
    });

    return {
      id: vendor.id,
      name: vendor.name,
      legalName: vendor.legalName,
      externalRef: vendor.externalRef,
      type: vendor.vendorTypeLabel,
      status: vendor.status,
      statusWord: VENDOR_WORD[vendor.status],
      earliestRequiredExpiry: vendor.earliestRequiredExpiry,
      metCount: comparison?.metCount ?? 0,
      gapCount: comparison?.gapCount ?? 0,
      assertedOnlyCount: comparison?.assertedOnlyCount ?? 0,
      notCheckedCount: comparison?.notCheckedCount ?? 0,
      undeterminedCount: comparison?.undeterminedCount ?? 0,
      evaluationDate: comparison?.evaluationDate ?? null,
      evaluatedAt: comparison?.evaluatedAt.toISOString() ?? null,
      engineVersion: comparison?.engineVersion ?? null,
      requirementSetName: set?.name ?? null,
      requirementSetVersion: comparison?.requirementSetVersion ?? null,
      sourceTemplateId: set?.sourceTemplateId ?? null,
      certificateDate: cert?.certificateDate ?? null,
      documentLabel: cert ? documentLabel(cert.storageKey) : null,
      documentUploadedAt: cert?.uploadedAt.toISOString() ?? null,
      extractionId: cert?.extractionId ?? null,
      sources:
        template?.sources.map((source) => ({
          url: source.url,
          title: source.title,
          last_verified: source.last_verified,
        })) ?? [],
      rows: resultRows,
    };
  });

  // --- §3 item 6 -------------------------------------------------------------
  const queue = await reviewQueue(db, input.orgId, { vendorIds, limit: MAX_SCOPE_VENDORS });
  const needsReview = queue.map((item) => ({
    vendorName: item.vendorName,
    documentLabel: item.documentLabel,
    uploadedAt: item.uploadedAt.toISOString(),
    reason: item.reason,
  }));

  const counterRecord = { ...counters };
  const roster_total = COUNTER_ORDER.reduce((sum, state) => sum + counterRecord[state], 0);

  return {
    version: REPORT_SNAPSHOT_VERSION,
    reportId: input.reportId,
    generatedAt: (input.now ?? new Date()).toISOString(),
    timezone: input.timezone,
    asOf: input.today,
    org: { name: input.orgName, entityBlock: input.entityBlock },
    generatedBy: input.generatedBy ?? null,
    scope: input.scope,
    scopeLabel: scopeLabel(input.scope),
    counters: { ...counterRecord, roster: roster_total },
    vendors,
    notChecked,
    needsReview,
    engineVersions: engineVersions.size > 0 ? [...engineVersions] : [ENGINE_VERSION],
    note: null,
  };
}

/** `$1,000,000` and `12 September 2026` — the product's only two formats. */
export const printMoney = formatMoney;
export const printDate = formatDate;
