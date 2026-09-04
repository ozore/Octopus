/**
 * WL-08's determination-change alert — **transactional** mail to a paying
 * customer about a project they own.
 *
 * It is not WL-14's watch and it must never share a send path with it (WL-14's
 * opening section, V7): different table, different consent basis, different
 * unsubscribe. This message carries its own off switch — "stop change alerts"
 * turns off exactly these emails for this organisation (V6) and cannot stop a
 * magic link, a trial reminder or a renewal notice.
 *
 * The message answers three questions in this order, because that is the order
 * the reader has them in: **what moved**, **who it affects**, **what it costs
 * or saves per hour**. A delta is stated, not implied, and both modification
 * numbers appear so the reader can check us against SAM.gov.
 */

import type { EmailBrand } from '@octopus/platform/email';

import { publicDeterminationUrl } from '../kb/sam-endpoints';
import { buildEmail, escapeHtml, listUnsubscribeHeaders, type AppEmailContent } from './layout';

export type AlertEmailRow = {
  label: string;
  kind: 'changed' | 'removed';
  oldRate?: string | null;
  newRate?: string | null;
  oldFringe?: string | null;
  newFringe?: string | null;
  /** Total (base + fringe) delta per hour, signed, as a string like `+1.25`. */
  delta?: string | null;
  /** The workers on this project mapped to this classification. */
  workers: string[];
};

function describe(row: AlertEmailRow): string {
  if (row.kind === 'removed') {
    return `not listed in the new modification — ${row.workers.length} worker${row.workers.length === 1 ? '' : 's'} mapped to it`;
  }
  const rates = `$${row.oldRate ?? '—'} → $${row.newRate ?? '—'} base · $${row.oldFringe ?? '—'} → $${row.newFringe ?? '—'} fringe`;
  return row.delta ? `${rates} (${row.delta}/hour)` : rates;
}

export function determinationChangedEmail(
  brand: EmailBrand,
  input: {
    projectName: string;
    wdNumber: string;
    fromModification: number;
    toModification: number;
    rows: AlertEmailRow[];
    affectedWorkerCount: number;
    totalWorkerCount: number;
    alertUrl: string;
    unsubscribeUrl: string;
    /** The tracking pixel. Absent in a text-only client, which is fine. */
    openPixelUrl?: string;
    publishedOn?: string;
    /** True when the diff could not be computed — degraded, never silent. */
    degraded?: boolean;
  },
): AppEmailContent {
  const wd = escapeHtml(input.wdNumber);
  const samPage = publicDeterminationUrl(input.wdNumber, input.toModification);
  const removed = input.rows.filter((r) => r.kind === 'removed');

  const rowsHtml = input.rows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.label)}</td><td>${escapeHtml(describe(row))}</td><td>${escapeHtml(
          row.workers.join(', ') || '—',
        )}</td></tr>`,
    )
    .join('');

  const degradedHtml = input.degraded
    ? `<p>Modification ${input.toModification} was published — we could not compute the line-by-line difference this time, so review it before your next payroll.</p>`
    : '';

  const bodyHtml = `<p>Wage determination <strong>${wd}</strong> — the one <strong>${escapeHtml(input.projectName)}</strong> is pinned to — moved from modification ${input.fromModification} to modification ${input.toModification}${input.publishedOn ? `, published ${escapeHtml(input.publishedOn)}` : ''}.</p>
${degradedHtml}
<p>This affects <strong>${input.affectedWorkerCount}</strong> of your ${input.totalWorkerCount} mapped worker${input.totalWorkerCount === 1 ? '' : 's'} on this project.</p>
<table><thead><tr><th>Classification</th><th>Modification ${input.fromModification} → ${input.toModification}</th><th>Workers</th></tr></thead><tbody>${rowsHtml || '<tr><td colspan="3">Nothing this project uses changed.</td></tr>'}</tbody></table>
${
    removed.length > 0
      ? `<p><strong>${removed.length} classification${removed.length === 1 ? ' is' : 's are'} no longer listed.</strong> Those workers have to be re-mapped before the project can move to modification ${input.toModification}. Staying on modification ${input.fromModification} is a first-class choice — 29 CFR 1.6 fixes the determination at award, so if your contract names modification ${input.fromModification}, that is the one that governs.</p>`
      : ''
}
<p><a href="${escapeHtml(input.alertUrl)}">Review the change</a> · <a href="${escapeHtml(samPage)}">the official determination on SAM.gov</a></p>
<p>Nothing has changed on your side. Payrolls you have already certified are never altered, and this project stays on modification ${input.fromModification} until you move it yourself.</p>
${input.openPixelUrl ? `<img src="${escapeHtml(input.openPixelUrl)}" width="1" height="1" alt="">` : ''}`;

  const bodyText = `Wage determination ${input.wdNumber} — the one ${input.projectName} is pinned to — moved from modification ${input.fromModification} to modification ${input.toModification}${input.publishedOn ? `, published ${input.publishedOn}` : ''}.
${input.degraded ? `\nWe could not compute the line-by-line difference this time, so review it before your next payroll.\n` : ''}
This affects ${input.affectedWorkerCount} of your ${input.totalWorkerCount} mapped workers on this project.

${
    input.rows.length > 0
      ? input.rows
          .map((row) => `- ${row.label}: ${describe(row)}${row.workers.length ? ` [${row.workers.join(', ')}]` : ''}`)
          .join('\n')
      : 'Nothing this project uses changed.'
  }

Review the change: ${input.alertUrl}
The official determination on SAM.gov: ${samPage}

Nothing has changed on your side. Payrolls you have already certified are never altered, and this project stays on modification ${input.fromModification} until you move it yourself.`;

  return buildEmail(brand, {
    subject: `Wage determination ${input.wdNumber} changed — ${input.projectName}`,
    bodyHtml,
    bodyText,
    footer: {
      kind: 'with-unsubscribe',
      unsubscribeUrl: input.unsubscribeUrl,
      unsubscribeLabel: 'Stop determination-change alerts',
      whyReceiving:
        'You are receiving this because a project in your organisation is pinned to this determination. Stopping these alerts does not affect sign-in or billing email.',
    },
    headers: listUnsubscribeHeaders(input.unsubscribeUrl),
  });
}
