/**
 * The digest email — `specs/06` §Screens, AC6, AC7, AC8.
 *
 * **It renders in PAPER, whatever the reader prefers.** The board is the
 * operator's instrument surface; everything that leaves the building is paper
 * (`IDENTITY_ARBITRATION.md` §3.2), and an email is the most forwarded artefact
 * this product makes — `PERSONA.md` §9's general manager who has never logged
 * in reads it in whatever client he has. Colours are therefore literal here
 * rather than `--sr-*` tokens: an email client strips `<style>` and knows
 * nothing about custom properties, so the paper palette is inlined, and it is
 * the SAME palette `design-system.css` declares under `[data-theme="paper"]`.
 *
 * FOUR CONSTRAINTS FROM AC8, EACH TESTED:
 *
 *  1. **Table layout, not flexbox.** Outlook desktop renders through Word.
 *  2. **No remote images.** Not one `<img src="http…">`: images are blocked by
 *     default in every client that matters, a broken image is a broken promise,
 *     and a tracking pixel in a compliance email is a bad look. The status
 *     glyphs are the same characters the board uses.
 *  3. **Under 102 KB.** Gmail clips a longer message behind "[Message clipped]",
 *     and the clipped part is the end — which is where the footer, the
 *     unsubscribe and the address are.
 *  4. **A 25-line cap** with "and N more". An unbounded email is an unread one.
 *
 * The subject is the whole message for the reader who never opens it:
 * `3 licences need attention — 1 in 7 days`.
 */

import type { EmailContent } from '@octopus/platform/email';

/** The `[data-theme="paper"]` values from `design-system.css`, inlined. */
const PAPER = {
  ground: '#E9ECE8',
  surface: '#FFFFFF',
  ink: '#131714',
  muted: '#5F6762',
  rule: '#CBD1CB',
  ready: '#146A46',
  risk: '#8A4E08',
  lapsed: '#A81B2C',
  none: '#5F6762',
} as const;

export const DIGEST_LINE_CAP = 25;
/** Gmail clips beyond this. Measured on the rendered HTML, not guessed at. */
export const DIGEST_MAX_BYTES = 102_000;

export type DigestItem = {
  deadlineId: string;
  licenceId: string | null;
  offsetDays: number;
  /** Whole days from today to the deadline; negative once it has passed. */
  daysAway: number;
  dueOn: string;
  state: string;
  holder: string;
  licenceType: string;
  whatIsDue: string;
  url: string;
  citationUrl: string | null;
  citationText: string | null;
  citationLastVerified: string | null;
  confidence: 'high' | 'medium' | 'low' | string;
  needsHumanCheck: boolean;
  notes: string[];
};

export type DigestBrand = {
  appName: string;
  companyName: string;
  supportEmail: string;
  baseUrl: string;
  companyAddress?: string | undefined;
};

/** Urgency first, then state — the order `specs/06` AC3 asserts. */
export const URGENCY_GROUPS = [
  { key: 'lapsed', heading: 'Lapsed', match: (d: DigestItem) => d.daysAway < 0 },
  { key: 'today', heading: 'Expires today', match: (d: DigestItem) => d.daysAway === 0 },
  { key: 'week', heading: 'Within 7 days', match: (d: DigestItem) => d.daysAway > 0 && d.daysAway <= 7 },
  { key: 'month', heading: 'Within 30 days', match: (d: DigestItem) => d.daysAway > 7 && d.daysAway <= 30 },
  { key: 'quarter', heading: 'Within 90 days', match: (d: DigestItem) => d.daysAway > 30 },
] as const;

const escape = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function sortItems(items: readonly DigestItem[]): DigestItem[] {
  return [...items].sort((a, b) => {
    if (a.daysAway !== b.daysAway) return a.daysAway - b.daysAway;
    if (a.state !== b.state) return a.state.localeCompare(b.state);
    return a.holder.localeCompare(b.holder);
  });
}

export function groupItems(items: readonly DigestItem[]): Array<{ heading: string; items: DigestItem[] }> {
  const sorted = sortItems(items);
  return URGENCY_GROUPS.map((group) => ({
    heading: group.heading,
    items: sorted.filter((item) => group.match(item)),
  })).filter((group) => group.items.length > 0);
}

/**
 * `3 licences need attention — 1 in 7 days`. The most urgent count is in the
 * subject because the subject is the whole message for the reader who does not
 * open it.
 */
export function digestSubject(items: readonly DigestItem[]): string {
  const n = items.length;
  const noun = n === 1 ? 'licence needs' : 'licences need';
  const lapsed = items.filter((i) => i.daysAway < 0).length;
  if (lapsed > 0) return `${n} ${noun} attention — ${lapsed} already lapsed`;
  const soon = items.filter((i) => i.daysAway >= 0 && i.daysAway <= 7).length;
  if (soon > 0) return `${n} ${noun} attention — ${soon} in 7 days`;
  return `${n} ${noun} attention`;
}

function statusColour(item: DigestItem): string {
  if (item.daysAway < 0) return PAPER.lapsed;
  if (item.daysAway <= 90) return PAPER.risk;
  return PAPER.ready;
}

/**
 * `specs/06` AC7 — a flagged rule says so IN WORDS, not only in a colour. A
 * reader who cannot see the pale amber must still be told to check the board.
 */
export const NEEDS_CHECK_WORDING =
  'we could not fully verify this rule — check the board before you rely on it';

function itemRow(item: DigestItem): string {
  const due = `${escape(item.dueOn)}${item.daysAway < 0 ? ' · lapsed' : ` · in ${item.daysAway} day${item.daysAway === 1 ? '' : 's'}`}`;
  const citation = item.citationUrl
    ? `<div style="font-size:12px;color:${PAPER.muted};margin-top:4px">` +
      `<a href="${escape(item.citationUrl)}" style="color:${PAPER.muted}">${escape(hostOf(item.citationUrl))}</a>` +
      (item.citationLastVerified ? ` · checked ${escape(item.citationLastVerified)}` : '') +
      (item.confidence !== 'high' ? ` · ${escape(item.confidence)} confidence` : '') +
      '</div>'
    : `<div style="font-size:12px;color:${PAPER.muted};margin-top:4px">Unverified — we have no published page for this.</div>`;
  // A medium-confidence line carries the value's own note (`specs/05` invariant 2).
  const notes = item.notes
    .map((note) => `<div style="font-size:12px;color:${PAPER.muted};margin-top:2px">${escape(note)}</div>`)
    .join('');
  const flag = item.needsHumanCheck
    ? `<div style="font-size:12px;color:${PAPER.lapsed};margin-top:4px">⚑ ${escape(NEEDS_CHECK_WORDING)}</div>`
    : '';

  return `<tr>
<td style="padding:10px 0;border-bottom:1px solid ${PAPER.rule};vertical-align:top">
<div style="font-size:15px;color:${PAPER.ink}">
<strong style="color:${statusColour(item)}">${escape(item.state)}</strong>
· ${escape(item.holder)} · ${escape(item.licenceType)}
</div>
<div style="font-size:14px;color:${PAPER.ink};margin-top:2px">
<a href="${escape(item.url)}" style="color:${PAPER.ink}">${escape(item.whatIsDue)}</a> — ${due}
</div>
${citation}${notes}${flag}
</td>
</tr>`;
}

function hostOf(url: string): string {
  return url.replace(/^https?:\/\//, '').split('/')[0] ?? url;
}

export type DigestRenderOptions = {
  /** The line the honest-but-not-yet-exact promise needs (`specs/06` §Flow). */
  digestHourLocal: number;
  timezone: string;
  /** Trial ended / past due: the alerts are PAUSED and we say so in words. */
  pausedNotice?: string | null;
  settingsUrl?: string;
  cap?: number;
};

export function renderDigest(
  brand: DigestBrand,
  items: readonly DigestItem[],
  options: DigestRenderOptions,
): EmailContent {
  const cap = options.cap ?? DIGEST_LINE_CAP;
  const groups = groupItems(items);
  const sorted = sortItems(items);
  const shown = sorted.slice(0, cap);
  const overflow = sorted.length - shown.length;
  const shownIds = new Set(shown.map((i) => i.deadlineId));
  const settingsUrl = options.settingsUrl ?? `${brand.baseUrl}/settings/notifications`;

  const body = groups
    .map((group) => {
      const rows = group.items.filter((i) => shownIds.has(i.deadlineId));
      if (rows.length === 0) return '';
      return `<tr><td style="padding:18px 0 0">
<div style="font-family:'Barlow Condensed',Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em;font-size:13px;color:${PAPER.muted}">${escape(group.heading)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows.map(itemRow).join('')}</table>
</td></tr>`;
    })
    .join('');

  const more =
    overflow > 0
      ? `<tr><td style="padding:12px 0"><a href="${escape(brand.baseUrl)}/dashboard" style="color:${PAPER.ink}">and ${overflow} more on your board</a></td></tr>`
      : '';

  const paused = options.pausedNotice
    ? `<tr><td style="padding:12px;background:${PAPER.ground};border:1px solid ${PAPER.rule};font-size:14px;color:${PAPER.ink}">${escape(options.pausedNotice)}</td></tr>`
    : '';

  const html = `<!doctype html>
<html><body data-theme="paper" style="margin:0;padding:0;background:${PAPER.ground}">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PAPER.ground};padding:24px 12px">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:${PAPER.surface};border:1px solid ${PAPER.rule};padding:24px;font-family:Barlow,-apple-system,Segoe UI,Arial,sans-serif;color:${PAPER.ink}">
<tr><td style="font-family:'Barlow Condensed',Arial,sans-serif;font-size:22px;letter-spacing:.04em;text-transform:uppercase">${escape(brand.appName)}</td></tr>
<tr><td style="font-size:16px;padding-top:8px">${escape(digestSubject(items))}</td></tr>
${paused}
${body}
${more}
<tr><td style="padding:24px 0 0">
<a href="${escape(brand.baseUrl)}/dashboard" style="display:inline-block;background:${PAPER.ink};color:${PAPER.surface};padding:12px 20px;text-decoration:none;font-size:15px">Open ${escape(brand.appName)}</a>
</td></tr>
<tr><td style="padding-top:24px;border-top:1px solid ${PAPER.rule};font-size:12px;color:${PAPER.muted}">
<p style="margin:12px 0 0">Every date above shows the board page it came from and the day we last checked it. ${escape(brand.appName)} is a tracking and research tool, not legal advice and not a licensing service. The licensing board, not ${escape(brand.appName)}, is the authority on your licence.</p>
<p style="margin:8px 0 0">You are aiming for ${String(options.digestHourLocal).padStart(2, '0')}:00 in ${escape(options.timezone)}. We currently send one digest a day; your digest is released in the first run on or after that hour. <a href="${escape(settingsUrl)}" style="color:${PAPER.muted}">Change what you get, or stop it</a>.</p>
<p style="margin:8px 0 0">${escape(brand.appName)}, a ${escape(brand.companyName)} company${brand.companyAddress ? `<br>${escape(brand.companyAddress)}` : ''}<br><a href="mailto:${escape(brand.supportEmail)}" style="color:${PAPER.muted}">${escape(brand.supportEmail)}</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    digestSubject(items),
    '',
    ...groups.flatMap((group) => {
      const rows = group.items.filter((i) => shownIds.has(i.deadlineId));
      if (rows.length === 0) return [];
      return [
        group.heading.toUpperCase(),
        ...rows.map(
          (item) =>
            `  ${item.state} · ${item.holder} · ${item.licenceType} · ${item.whatIsDue} · ${item.dueOn}` +
            (item.citationUrl ? `\n    ${item.citationUrl}` : '') +
            (item.needsHumanCheck ? `\n    ⚑ ${NEEDS_CHECK_WORDING}` : '') +
            item.notes.map((n) => `\n    ${n}`).join(''),
        ),
        '',
      ];
    }),
    ...(overflow > 0 ? [`and ${overflow} more on your board`, ''] : []),
    ...(options.pausedNotice ? [options.pausedNotice, ''] : []),
    `Open ${brand.appName}: ${brand.baseUrl}/dashboard`,
    '',
    `Change what you get, or stop it: ${settingsUrl}`,
    `${brand.appName}, a ${brand.companyName} company`,
    brand.companyAddress ?? '',
  ].join('\n');

  return { subject: digestSubject(items), html, text };
}

/** AC8, as a function so the job can refuse to send an over-size digest. */
export function digestByteLength(content: EmailContent): number {
  return Buffer.byteLength(content.html, 'utf8');
}

export function hasRemoteImages(content: EmailContent): boolean {
  return /<img\b[^>]*src=["']?https?:/i.test(content.html);
}
