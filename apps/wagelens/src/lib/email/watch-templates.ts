/**
 * WL-14's two messages, E-W1 and E-W2.
 *
 * These are **marketing** email to a stranger who asked for it — a different
 * promise, a different consent basis and a different unsubscribe from WL-08's
 * project alerts, which are transactional mail to a paying customer. The two
 * never share a send path, and this file is one half of that separation.
 *
 * What is not negotiable in either message (WL-14, PLAN.md D4/P10):
 *
 *  - the determination is named in the subject and in the first line;
 *  - the sending entity and a **physical postal address**;
 *  - a working unsubscribe that needs no login and no reply, in the body AND
 *    in `List-Unsubscribe` with `List-Unsubscribe-Post: List-Unsubscribe=One-Click`,
 *    so a mail client's own button works;
 *  - an accurate subject and no deceptive header;
 *  - the product's name from `APP_NAME`, never a literal (WL-11 V8, M12);
 *  - at most one product line in E-W2, below the change itself.
 *
 * The CHANGE is the message. A watcher asked to be told when a determination
 * moves; the classifications that moved, with both modification numbers, are
 * the whole content, and the link to SAM.gov is there so nobody has to take
 * our word for it.
 */

import type { EmailBrand } from '@octopus/platform/email';

import { publicDeterminationUrl } from '../kb/sam-endpoints';
import { buildEmail, escapeHtml, listUnsubscribeHeaders, type AppEmailContent } from './layout';

export type WatchChangeRow = {
  label: string;
  oldRate?: string | null;
  newRate?: string | null;
  oldFringe?: string | null;
  newFringe?: string | null;
  kind: 'changed' | 'removed' | 'added';
};

export const WATCH_CONSENT_TEXT = (wdNumber: string): string =>
  `Email me when the U.S. Department of Labor publishes a modification to ${wdNumber}. ` +
  `I can unsubscribe from any of these emails.`;

/**
 * E-W1 — the double opt-in. Nothing else is ever sent to a `pending` row, and
 * this message says so: if you did not ask for it, ignoring it is the whole
 * of the action required.
 */
export function watchConfirmEmail(
  brand: EmailBrand,
  input: { wdNumber: string; confirmUrl: string; unsubscribeUrl: string; expiryDays: number },
): AppEmailContent {
  const wd = escapeHtml(input.wdNumber);
  const bodyHtml = `<p>Confirm that you want an email when wage determination <strong>${wd}</strong> changes.</p>
<p><a href="${escapeHtml(input.confirmUrl)}">Confirm alerts for ${wd}</a></p>
<p>The link expires in ${input.expiryDays} days and works once.</p>
<p>If you did not ask for this, ignore this message and nothing happens — we never send an alert to an address that has not confirmed.</p>`;

  const bodyText = `Confirm that you want an email when wage determination ${input.wdNumber} changes.

Confirm alerts for ${input.wdNumber}: ${input.confirmUrl}

The link expires in ${input.expiryDays} days and works once.

If you did not ask for this, ignore this message and nothing happens — we never send an alert to an address that has not confirmed.`;

  return buildEmail(brand, {
    subject: `Confirm alerts for ${input.wdNumber}`,
    bodyHtml,
    bodyText,
    footer: {
      kind: 'with-unsubscribe',
      unsubscribeUrl: input.unsubscribeUrl,
      unsubscribeLabel: 'Stop these emails',
      whyReceiving: `This address was entered on our public page for ${input.wdNumber}. No alert is ever sent until it is confirmed.`,
    },
    headers: listUnsubscribeHeaders(input.unsubscribeUrl),
  });
}

/**
 * E-W2 — a modification landed. Both modification numbers, the rows that
 * moved, our page and SAM.gov, and the unsubscribe.
 */
export function watchAlertEmail(
  brand: EmailBrand,
  input: {
    wdNumber: string;
    fromModification: number;
    toModification: number;
    rows: WatchChangeRow[];
    unsubscribeUrl: string;
    manageUrl: string;
    publishedOn?: string;
  },
): AppEmailContent {
  const wd = escapeHtml(input.wdNumber);
  const changedCount = input.rows.filter((r) => r.kind !== 'added').length;
  const ourPage = `${brand.baseUrl}/wd/${input.wdNumber}/${input.toModification}`;
  const samPage = publicDeterminationUrl(input.wdNumber, input.toModification);

  const describe = (row: WatchChangeRow): string => {
    if (row.kind === 'removed') return 'no longer listed';
    if (row.kind === 'added') return `new — ${row.newRate ?? '—'} base / ${row.newFringe ?? '—'} fringe`;
    return `${row.oldRate ?? '—'} → ${row.newRate ?? '—'} base · ${row.oldFringe ?? '—'} → ${row.newFringe ?? '—'} fringe`;
  };

  const rowsHtml = input.rows
    .map((row) => `<tr><td>${escapeHtml(row.label)}</td><td>${escapeHtml(describe(row))}</td></tr>`)
    .join('');

  const bodyHtml = `<p>Modification <strong>${input.toModification}</strong> of wage determination <strong>${wd}</strong> has been published${input.publishedOn ? ` (${escapeHtml(input.publishedOn)})` : ''}. You were watching modification ${input.fromModification}.</p>
<table><thead><tr><th>Classification</th><th>Modification ${input.fromModification} → ${input.toModification}</th></tr></thead><tbody>${rowsHtml || '<tr><td colspan="2">No classification changed. The document itself was reissued.</td></tr>'}</tbody></table>
<p><a href="${escapeHtml(ourPage)}">Read modification ${input.toModification}</a> · <a href="${escapeHtml(samPage)}">the official document on SAM.gov</a></p>
<p>Rates above are our reproduction of a published U.S. Department of Labor wage determination, shown with its number, modification and date. Verify against the determination incorporated into your contract before you file.</p>
<p>If you have to produce a certified payroll against this determination, ${escapeHtml(brand.appName)} does that: <a href="${escapeHtml(brand.baseUrl)}/pricing">what it costs</a>.</p>`;

  const bodyText = `Modification ${input.toModification} of wage determination ${input.wdNumber} has been published${input.publishedOn ? ` (${input.publishedOn})` : ''}. You were watching modification ${input.fromModification}.

${
    input.rows.length > 0
      ? input.rows.map((row) => `- ${row.label}: ${describe(row)}`).join('\n')
      : 'No classification changed. The document itself was reissued.'
  }

Read modification ${input.toModification}: ${ourPage}
The official document on SAM.gov: ${samPage}

Rates above are our reproduction of a published U.S. Department of Labor wage determination, shown with its number, modification and date. Verify against the determination incorporated into your contract before you file.

If you have to produce a certified payroll against this determination, ${brand.appName} does that: ${brand.baseUrl}/pricing`;

  return buildEmail(brand, {
    subject: `Modification ${input.toModification} changes ${changedCount} classification${changedCount === 1 ? '' : 's'} on ${input.wdNumber}`,
    bodyHtml,
    bodyText,
    footer: {
      kind: 'with-unsubscribe',
      unsubscribeUrl: input.unsubscribeUrl,
      unsubscribeLabel: `Stop alerts for ${input.wdNumber}`,
      whyReceiving: `You confirmed this address for alerts on ${input.wdNumber}. Manage every determination on this address: ${input.manageUrl}`,
    },
    headers: listUnsubscribeHeaders(input.unsubscribeUrl),
  });
}

/**
 * The final message on a determination that has been WITHDRAWN. We do not go
 * silent on a document somebody is relying on (WL-14, edge cases).
 */
export function watchWithdrawnEmail(
  brand: EmailBrand,
  input: { wdNumber: string; lastModification: number; unsubscribeUrl: string; manageUrl: string },
): AppEmailContent {
  const ourPage = `${brand.baseUrl}/wd/${input.wdNumber}/${input.lastModification}`;
  const bodyHtml = `<p>Wage determination <strong>${escapeHtml(input.wdNumber)}</strong> is no longer published in the active index. The last revision we hold is modification ${input.lastModification}.</p>
<p><a href="${escapeHtml(ourPage)}">Read the archived revision</a>. We are not moving you to another determination — which one applies to a contract is decided by the contract, not by us.</p>
<p>This is the last alert for this determination.</p>`;
  const bodyText = `Wage determination ${input.wdNumber} is no longer published in the active index. The last revision we hold is modification ${input.lastModification}.

Read the archived revision: ${ourPage}

We are not moving you to another determination — which one applies to a contract is decided by the contract, not by us.

This is the last alert for this determination.`;

  return buildEmail(brand, {
    subject: `${input.wdNumber} is no longer published`,
    bodyHtml,
    bodyText,
    footer: {
      kind: 'with-unsubscribe',
      unsubscribeUrl: input.unsubscribeUrl,
      unsubscribeLabel: `Stop alerts for ${input.wdNumber}`,
      whyReceiving: `You confirmed this address for alerts on ${input.wdNumber}. Manage every determination on this address: ${input.manageUrl}`,
    },
    headers: listUnsubscribeHeaders(input.unsubscribeUrl),
  });
}
