/**
 * WHAT THE FREE REPORT SAYS — `specs/15` §4 and §4.1.
 *
 * The rendering rules are liability controls, not layout preferences
 * (`OFFER.md` §7 L5), and every one of them is expressed here as a field the
 * page and the emailed artefact both read, so neither can quietly omit one:
 *
 *   - the §F.1 disclaimer **on page 1**, not in a footer;
 *   - a **scope line** naming the document count and the date, and saying that
 *     the template is a suggested starting point and not the visitor's
 *     contract;
 *   - the §F.2 template disclaimer beside the requirement summary;
 *   - a **"Not checked"** section, always;
 *   - **"Read, but not confident enough to compare (k)"**, with the reason in
 *     words per document (§4.1, REVIEW.md B-09);
 *   - a headline that is **a count and a date, not a verdict**, and that states
 *     BOTH counts — how many were compared and how many could not be.
 *
 * That last one is the section this file exists for. `specs/05` §7 says a
 * comparison needs a `ready` extraction; on this page there is no human and no
 * account, so a `needs_review` document can NEVER be compared. Without the
 * section, a stranger who uploads 18 certificates silently gets a report about
 * 12 — which is exactly the dishonesty `specs/12` §3.5 exists to prevent.
 *
 * The words are never "compliant", "verified", or the retired status word: the
 * green state reads **"Meets requirements"** (REVIEW.md B-02).
 */

import {
  compare,
  type CoiExtraction,
  type ComparisonResult,
  type RequirementSet,
  type ResultRow,
} from '../engine';
import { VENDOR_STATUS, vendorWord, type VendorState } from '../status';

export type ReportDocumentInput = {
  documentId: string;
  /** What the visitor called it — §4.1 names the file back to them. */
  originalFilename: string | null;
  insuredNameRead: string | null;
  status: 'ready' | 'needs_review' | 'rejected' | 'uploaded' | 'extracting';
  /** §4.1's reason in words. Null for a `ready` document. */
  reason: string | null;
  payload: CoiExtraction | null;
};

export type ComparedVendor = {
  documentId: string;
  filename: string;
  vendorName: string;
  status: VendorState;
  statusWord: string;
  expiry: string | null;
  expired: boolean;
  gaps: ResultRow[];
  assertedOnly: ResultRow[];
  notChecked: ResultRow[];
  result: ComparisonResult;
};

export type UncomparedDocument = {
  documentId: string;
  filename: string;
  insuredNameRead: string | null;
  reason: string;
};

export type GapReport = {
  generatedOn: string;
  templateName: string;
  documentCount: number;
  comparedCount: number;
  needsReviewCount: number;
  rejectedCount: number;
  expiredCount: number;
  assertedOnlyCount: number;
  gapCount: number;
  meetsCount: number;
  /** A count and a date, never a verdict. Both counts, always. */
  headline: string;
  /** *"Read from the n documents you supplied on <date>. Compared against …"* */
  scopeLine: string;
  /** Expired first, then gaps — the order `specs/15` A2 requires. */
  vendors: ComparedVendor[];
  /** §4.1 — every `needs_review` document, named, with a reason in words. */
  uncompared: UncomparedDocument[];
  /** Documents that were not certificates at all, counted DISTINCTLY (§10). */
  rejected: UncomparedDocument[];
  /** Requirements the engine cannot check, aggregated (M12 §3.5). */
  notChecked: string[];
  /** The line that makes §4.1 a selling point rather than an embarrassment. */
  uncomparedNote: string;
};

const STATUS_ORDER: Record<VendorState, number> = {
  expired: 0,
  gap: 1,
  asserted_only: 2,
  expiring: 3,
  meets: 4,
  no_certificate: 5,
};

function insuredName(payload: CoiExtraction | null, fallback: string): string {
  return payload?.insured?.name?.value?.trim() || fallback;
}

/** §4.1's honest line, quoted from the spec. */
export const UNCOMPARED_NOTE =
  'We would rather tell you we are unsure than guess. In the product these go to a review queue where you correct them in one click.';

export function buildGapReport(input: {
  documents: ReportDocumentInput[];
  requirementSet: RequirementSet;
  templateName: string;
  evaluationDate: string;
}): GapReport {
  const vendors: ComparedVendor[] = [];
  const uncompared: UncomparedDocument[] = [];
  const rejected: UncomparedDocument[] = [];

  for (const document of input.documents) {
    const filename = document.originalFilename ?? 'an unnamed file';
    if (document.status === 'rejected') {
      rejected.push({
        documentId: document.documentId,
        filename,
        insuredNameRead: document.insuredNameRead,
        reason: document.reason ?? 'this does not look like a certificate of liability insurance',
      });
      continue;
    }
    if (document.status !== 'ready' || !document.payload) {
      uncompared.push({
        documentId: document.documentId,
        filename,
        insuredNameRead: document.insuredNameRead,
        reason: document.reason ?? 'we were not confident enough about what we read to compare it',
      });
      continue;
    }

    const name = insuredName(document.payload, filename);
    const result = compare({
      extraction: document.payload,
      requirementSet: input.requirementSet,
      evaluationDate: input.evaluationDate,
      vendor: { name },
      // No org: there is no account here, so the certificate-holder check
      // resolves to `not_checked` and the report says so rather than guessing
      // whose name should be on the certificate.
      org: { entityBlock: null, alternateHolders: [] },
    });

    vendors.push({
      documentId: document.documentId,
      filename,
      vendorName: name,
      status: result.status,
      statusWord: vendorWord(result.status),
      expiry: result.earliestRequiredExpiry,
      expired: result.status === 'expired',
      gaps: result.results.filter((row) => row.state === 'gap'),
      assertedOnly: result.results.filter((row) => row.state === 'asserted_only'),
      notChecked: result.results.filter((row) => row.state === 'not_checked'),
      result,
    });
  }

  // A2: the expired ones are listed FIRST. A report that buries the lapse
  // under an alphabetical sort is a report that did not do its job.
  vendors.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.vendorName.localeCompare(b.vendorName));

  const expiredCount = vendors.filter((vendor) => vendor.status === 'expired').length;
  const assertedOnlyCount = vendors.filter((vendor) => vendor.assertedOnly.length > 0).length;
  const gapCount = vendors.filter((vendor) => vendor.gaps.length > 0).length;
  const meetsCount = vendors.filter((vendor) => vendor.status === 'meets').length;

  const notChecked = [
    ...new Set(vendors.flatMap((vendor) => vendor.notChecked.map((row) => row.label))),
  ].sort();

  const headline = buildHeadline({
    documentCount: input.documents.length,
    comparedCount: vendors.length,
    expiredCount,
    assertedOnlyCount,
    uncomparedCount: uncompared.length,
  });

  const scopeLine =
    `Read from the ${input.documents.length} ${input.documents.length === 1 ? 'document' : 'documents'} you supplied on ` +
    `${input.evaluationDate}. Compared against ${input.templateName}, a suggested starting point — not your contract.`;

  return {
    generatedOn: input.evaluationDate,
    templateName: input.templateName,
    documentCount: input.documents.length,
    comparedCount: vendors.length,
    needsReviewCount: uncompared.length,
    rejectedCount: rejected.length,
    expiredCount,
    assertedOnlyCount,
    gapCount,
    meetsCount,
    headline,
    scopeLine,
    vendors,
    uncompared,
    rejected,
    notChecked,
    uncomparedNote: UNCOMPARED_NOTE,
  };
}

/**
 * THE HEADLINE, in the shape `specs/15` §4 writes out: a count and a date, both
 * counts named, and no verdict about anybody's insurance.
 */
export function buildHeadline(input: {
  documentCount: number;
  comparedCount: number;
  expiredCount: number;
  assertedOnlyCount: number;
  uncomparedCount: number;
}): string {
  if (input.comparedCount === 0) {
    // A10: an honest page, never an empty report.
    return `We could not read any of the ${input.documentCount} ${input.documentCount === 1 ? 'file' : 'files'} you sent well enough to compare them.`;
  }
  const parts = [`We compared ${input.comparedCount} of the ${input.documentCount} certificates you sent.`];
  const findings: string[] = [];
  if (input.expiredCount > 0) {
    findings.push(`${input.expiredCount} of those ${input.expiredCount === 1 ? 'has' : 'have'} already expired`);
  }
  if (input.assertedOnlyCount > 0) {
    findings.push(
      `${input.assertedOnlyCount} ${input.assertedOnlyCount === 1 ? 'claims an endorsement the certificate does not evidence' : 'claim endorsements the certificate does not evidence'}`,
    );
  }
  if (findings.length > 0) parts.push(`${findings.join(', and ')}.`);
  if (input.uncomparedCount > 0) {
    parts.push(
      `The other ${input.uncomparedCount} we read but could not compare — ${input.uncomparedCount === 1 ? 'it is' : 'they are'} listed below.`,
    );
  }
  return parts.join(' ');
}

/** The report as plain text — what the email carries and what is stored. */
export function renderReportText(report: GapReport, appName: string, disclaimer: { heading: string; body: string }): string {
  const lines: string[] = [];
  lines.push(`${appName} — Free Gap Report`);
  lines.push(report.scopeLine);
  lines.push('');
  // Page 1, first thing, verbatim (A4).
  lines.push(`${disclaimer.heading} ${disclaimer.body}`);
  lines.push('');
  lines.push(report.headline);
  lines.push('');

  for (const vendor of report.vendors) {
    lines.push(`${vendor.vendorName} — ${vendor.statusWord}${vendor.expiry ? ` (earliest required expiry ${vendor.expiry})` : ''}`);
    for (const row of [...vendor.gaps, ...vendor.assertedOnly]) lines.push(`  - ${row.explanation}`);
    lines.push('');
  }

  if (report.uncompared.length > 0) {
    lines.push(`Read, but not confident enough to compare (${report.uncompared.length})`);
    for (const document of report.uncompared) {
      lines.push(
        `  - ${document.filename}${document.insuredNameRead ? ` (${document.insuredNameRead})` : ''}: ${document.reason}`,
      );
    }
    lines.push(report.uncomparedNote);
    lines.push('');
  }

  if (report.rejected.length > 0) {
    lines.push(`Not a certificate of liability insurance (${report.rejected.length})`);
    for (const document of report.rejected) lines.push(`  - ${document.filename}: ${document.reason}`);
    lines.push('');
  }

  lines.push('Not checked by ' + appName);
  if (report.notChecked.length === 0) {
    lines.push('  - Nothing in this requirement set is outside what we read.');
  } else {
    for (const label of report.notChecked) lines.push(`  - ${label}`);
  }
  lines.push('');
  lines.push('We read these to make your report and then delete them. The files themselves were deleted the moment this report was built. The reading and the report are deleted after 7 days. We never record the agent’s name, phone or email from your certificates. We never train on them.');
  return lines.join('\n');
}

export { VENDOR_STATUS };
