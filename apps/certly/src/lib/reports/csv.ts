/**
 * THE CSV — `specs/12` §4.
 *
 * ONE ROW PER (VENDOR × REQUIREMENT), long format and not wide, because the
 * customer's next move is a pivot table and their spreadsheet has to be able to
 * make one.
 *
 * THE VOCABULARY IN THIS FILE IS THE VOCABULARY EVERYWHERE ELSE. This CSV is
 * forwarded to owners, lenders and auditors; `vendor_status` takes one of the
 * six canonical vendor values and `state` one of the five requirement values,
 * and no seventh word is invented for a spreadsheet (REVIEW.md B-02, §2.2).
 *
 * `found_value_raw` CARRIES THE PRINTED TEXT, never a coerced number (A5).
 * `Excluded` and `X $100,000 SIR` are what the document said; a CSV that turns
 * either into `0` is a CSV that tells its reader a lie in a cell they will
 * paste into a board pack.
 */

import { disclaimers } from '../kb/disclaimers';
import type { ReportSnapshot } from './types';

export const CSV_COLUMNS = [
  'vendor_name',
  'vendor_type',
  'external_ref',
  'vendor_status',
  'requirement_kind',
  'coverage',
  'requirement_label',
  'required_value',
  'found_value_raw',
  'found_amount',
  'found_label_raw',
  'state',
  'conditional',
  'explanation',
  'policy_number',
  'policy_exp',
  'certificate_date',
  'insurer',
  'document_filename',
  'extraction_id',
  'requirement_set_version',
  'engine_version',
  'evaluated_at',
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];

/**
 * RFC 4180 escaping. A comma, a quote or a newline inside `explanation` is the
 * ordinary case here, not the edge case: the engine's sentences contain commas
 * and quote the document, so this function runs on every row of every export.
 */
export function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsvRows(snapshot: ReportSnapshot): string[][] {
  const rows: string[][] = [[...CSV_COLUMNS]];

  for (const vendor of snapshot.vendors) {
    if (vendor.rows.length === 0) {
      // A vendor with no comparison at all is still IN the file — `specs/12`
      // §10: "included, status 'no certificate received', in its own summary
      // section". Dropping the row would make the CSV disagree with the cover.
      rows.push([
        vendor.name,
        vendor.type ?? '',
        vendor.externalRef ?? '',
        vendor.status,
        '',
        '',
        'No certificate on record',
        '',
        '',
        '',
        '',
        'not_checked',
        'false',
        'Certly has no certificate on record for this vendor, so nothing was compared.',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        vendor.engineVersion ?? snapshot.engineVersions[0] ?? '',
        vendor.evaluatedAt ?? '',
      ]);
      continue;
    }

    for (const row of vendor.rows) {
      rows.push([
        vendor.name,
        vendor.type ?? '',
        vendor.externalRef ?? '',
        vendor.status,
        row.kind,
        row.coverage ?? '',
        row.label,
        row.requiredValue,
        row.foundValueRaw ?? '',
        row.foundAmount === null ? '' : String(row.foundAmount),
        row.foundLabelRaw ?? '',
        row.state,
        row.conditional ? 'true' : 'false',
        row.explanation,
        row.policyNumber ?? '',
        row.policyExp ?? '',
        vendor.certificateDate ?? '',
        row.insurer ?? '',
        vendor.documentLabel ?? '',
        vendor.extractionId ?? '',
        vendor.requirementSetVersion === null ? '' : String(vendor.requirementSetVersion),
        vendor.engineVersion ?? '',
        vendor.evaluatedAt ?? '',
      ]);
    }
  }

  return rows;
}

/**
 * The file itself.
 *
 * The §F.1 disclaimer rides ABOVE the header row as `#` comment lines — surface
 * 7 of the eleven (KB §F.4) — because a report that travels away from the app
 * has to carry its own limits, and a CSV that carries them in a separate file
 * carries them nowhere. Excel and Sheets both import the rest correctly; the
 * lines are marked so a script can skip them.
 *
 * A UTF-8 BOM leads the file: without it Excel on Windows renders a vendor name
 * with an accent as mojibake, and `specs/12` §10 requires that a non-Latin name
 * never degrade to a question mark.
 */
export function renderCsv(snapshot: ReportSnapshot): string {
  const primary = disclaimers.primary;
  const preamble = [
    `# ${snapshot.org.name} — gap report`,
    `# generated ${snapshot.generatedAt} (${snapshot.timezone}); figures as of ${snapshot.asOf}`,
    `# scope: ${snapshot.scopeLabel}`,
    `# ${primary.heading} ${primary.body}`,
    `# not checked by Certly: ${snapshot.notChecked.length} rows; read but not confident enough to compare: ${snapshot.needsReview.length} documents`,
  ];
  const body = toCsvRows(snapshot)
    .map((row) => row.map(escapeCell).join(','))
    .join('\r\n');
  return `﻿${preamble.join('\r\n')}\r\n${body}\r\n`;
}
