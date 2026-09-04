/**
 * THE REPORT SNAPSHOT — `specs/12` §6.
 *
 * **Reports are immutable snapshots.** A report someone forwarded in March must
 * still say in June what it said in March, otherwise it is not evidence. So the
 * report is assembled ONCE into this structure, rendered from it, and the
 * structure is stored beside the rendered file. Regenerating creates a new row;
 * nothing ever rewrites one.
 *
 * That is also why every provenance field is carried IN the snapshot rather
 * than looked up when the report is opened: `engineVersion`,
 * `requirementSetVersion`, `extractionId` and the template's `source_url` and
 * `last_verified` are what make the report defensible under questioning, and a
 * value re-read at view time is a value that can change under the reader.
 */

import type { RequirementState, VendorState } from '../status';

export const REPORT_SNAPSHOT_VERSION = 'certly.report.v1';

export type ReportScope =
  | { kind: 'all' }
  | { kind: 'filter'; status?: VendorState | null; q?: string | null }
  | { kind: 'selection'; vendorIds: string[] }
  | { kind: 'vendor'; vendorId: string };

export type SnapshotResultRow = {
  requirementId: string;
  origin: string;
  kind: string;
  coverage: string | null;
  label: string;
  severity: string;
  state: RequirementState;
  /** What the requirement demanded, printed. */
  requiredValue: string;
  /** The characters as printed on the certificate. NEVER a coerced number. */
  foundValueRaw: string | null;
  foundAmount: number | null;
  /** The printed limit label, for an `OTHER:` row (REVIEW.md MJ-18). */
  foundLabelRaw: string | null;
  conditional: boolean;
  explanation: string;
  policyNumber: string | null;
  policyExp: string | null;
  insurer: string | null;
};

export type SnapshotVendor = {
  id: string;
  name: string;
  legalName: string | null;
  externalRef: string | null;
  type: string | null;
  status: VendorState;
  statusWord: string;
  earliestRequiredExpiry: string | null;
  metCount: number;
  gapCount: number;
  assertedOnlyCount: number;
  notCheckedCount: number;
  undeterminedCount: number;
  /** Null when there is no comparison at all — a vendor who never sent one. */
  evaluationDate: string | null;
  evaluatedAt: string | null;
  engineVersion: string | null;
  requirementSetName: string | null;
  requirementSetVersion: number | null;
  sourceTemplateId: string | null;
  /** `specs/12` §3 item 7 — the provenance appendix, per vendor. */
  certificateDate: string | null;
  documentLabel: string | null;
  documentUploadedAt: string | null;
  extractionId: string | null;
  sources: { url: string; title: string; last_verified: string }[];
  rows: SnapshotResultRow[];
};

export type SnapshotNeedsReview = {
  vendorName: string | null;
  documentLabel: string;
  uploadedAt: string;
  /** The reason in words — `specs/12` §3 item 6. */
  reason: string;
};

export type ReportSnapshot = {
  version: typeof REPORT_SNAPSHOT_VERSION;
  reportId: string;
  /** ISO instant, with the org's zone printed beside it on the cover. */
  generatedAt: string;
  timezone: string;
  /** The org's local date the comparison figures are true as of. */
  asOf: string;
  org: { name: string; entityBlock: string | null };
  generatedBy: string | null;
  scope: ReportScope;
  scopeLabel: string;
  counters: Record<VendorState, number> & { roster: number };
  vendors: SnapshotVendor[];
  /** `specs/12` §3 item 5 — its own section, never omitted. */
  notChecked: { vendorName: string; label: string; explanation: string }[];
  /** `specs/12` §3 item 6 — its own section whenever the scope has any. */
  needsReview: SnapshotNeedsReview[];
  engineVersions: string[];
  /** A re-evaluation in flight at generation time — `specs/12` §10. */
  note: string | null;
};
