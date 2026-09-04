/**
 * THE VENDOR-FACING EMAIL — `specs/07` §6, §6.1 and §6.2.
 *
 * This composer is the only place a V-email is built, and it is written as a
 * closed system on purpose: the body is assembled from a fixed list of parts in
 * a fixed order, and every URL it can possibly emit comes out of `links` so a
 * test can assert the allowlist rather than grep the HTML.
 *
 * THE THREE RULES THAT ARE NOT STYLE:
 *
 *  1. **No marketing, at all** (`specs/07` §6.2, `BACKLOG.md` N13). No product
 *     CTA, no pricing link, no signup link, no referral, no logo linking to the
 *     marketing site. A marketing line here removes any argument that the
 *     message is transactional AND burns the customer's relationship with their
 *     own vendor, which is worth more to them than we are. `LINK_KINDS` is the
 *     whole permitted set: the upload link, the two unsubscribe scopes, and the
 *     legal pages.
 *  2. **The full CAN-SPAM footer, five elements** (§6.1). These messages are
 *     sent by the company on a customer's behalf to a business that has no
 *     relationship with us. A document request under an existing business
 *     relationship is arguably transactional; we treat every V-email as
 *     commercial and carry the whole footer anyway, because it costs four lines
 *     and removes the argument.
 *  3. **No literal domain** (REVIEW.md B-11). Every URL is built from
 *     `appOrigin()`, and `tests/vocabulary.test.ts` greps the source for one.
 *
 * The `From` DISPLAY NAME — *"{Customer Org} via {APP_NAME}"* (§6.1 item 1) —
 * is returned on the composed message but cannot be handed to the platform's
 * email port, which takes its `from` from `EMAIL_FROM` for the whole app. The
 * substantive identification requirement is met by body line 1, which names the
 * customer in words. Recorded as a platform request in `REQUESTS.md`.
 */

import { disclaimers } from '../kb/disclaimers';
import type { RequirementLine } from './summary';
import type { Rung } from './ladder';

export type VendorEmailBrand = {
  /** `APP_NAME` — the product name is configuration (`IDENTITY.md` §2.3). */
  appName: string;
  /** `COMPANY_ADDRESS` — element 2 of §6.1, rendered, never linked. */
  companyAddress: string;
  /** `APP_ORIGIN`, an env value. Never a literal domain. */
  origin: string;
};

export type VendorEmailInput = {
  brand: VendorEmailBrand;
  /** The CUSTOMER's org name — the most prominent thing in the message. */
  orgName: string;
  vendorName: string;
  rung: Rung;
  /** The expiry this ladder runs on, `YYYY-MM-DD`. */
  expiryDate: string;
  /** Which coverages carry that date, in words. */
  policyDescription: string;
  /** Other expiries on the same certificate, listed as a note (§11). */
  otherExpiries: string[];
  requirements: RequirementLine[];
  /** The raw upload token. It exists here and in the message, nowhere else. */
  uploadToken: string;
  /** The unsubscribe capability — one per message (see `unsubscribe.ts`). */
  unsubscribeToken: string;
  /** `n` and `total` for §6 item 5. */
  messageNumber: number;
  messageTotal: number;
  /** The customer's own mailbox, so an agent's reply reaches a human. */
  replyTo: string;
  /** `to` for a recipient the message is addressed to; `cc` for a copy. */
  deliveryRole: 'to' | 'cc';
  recipientKind: 'vendor' | 'producer';
};

export type ComposedVendorEmail = {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
  /** *"{Customer Org} via {APP_NAME}"* — §6.1 item 1. */
  fromDisplayName: string;
  /** Every URL in the message, for the §6.2 allowlist test. */
  links: string[];
};

/** The ONLY link kinds a V-email may carry (§6.2). */
export const LINK_KINDS = ['upload', 'unsubscribe_org', 'unsubscribe_global', 'legal'] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

const escape = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function uploadUrl(origin: string, token: string): string {
  return `${origin}/u/${token}`;
}

export function unsubscribeUrl(origin: string, token: string, scope: 'org' | 'global'): string {
  return `${origin}/unsubscribe/${token}?scope=${scope}`;
}

/** The four legal pages a V-email may link to, and no others. */
export function legalUrls(origin: string): string[] {
  return [`${origin}/legal/terms`, `${origin}/legal/privacy`, `${origin}/legal/disclaimer`];
}

/**
 * `specs/07` §6: names the vendor and the real date and nothing else. Not a
 * question, not an urgency device, not a name that implies the customer's own
 * domain — element 4 of §6.1.
 */
export function subjectLine(input: Pick<VendorEmailInput, 'rung' | 'vendorName' | 'expiryDate'>): string {
  return input.rung.startsWith('T+')
    ? `Insurance certificate for ${input.vendorName} has expired`
    : `Insurance certificate for ${input.vendorName} expires ${input.expiryDate}`;
}

/**
 * §6 item 5, verbatim in shape: the promise on the landing page is one the
 * queue enforces, so the sentence states the number the caps allow.
 */
export function scheduleSentence(n: number, total: number): string {
  return `This is message ${n} of ${total} about this certificate. They stop as soon as a current certificate arrives.`;
}

export function composeVendorEmail(input: VendorEmailInput): ComposedVendorEmail {
  const { brand } = input;
  const upload = uploadUrl(brand.origin, input.uploadToken);
  const stopOrg = unsubscribeUrl(brand.origin, input.unsubscribeToken, 'org');
  const stopAll = unsubscribeUrl(brand.origin, input.unsubscribeToken, 'global');
  const legal = legalUrls(brand.origin);
  const links = [upload, stopOrg, stopAll, ...legal];

  const identification = `Sent by ${brand.appName} on behalf of ${input.orgName}.`;
  const copied =
    input.deliveryRole === 'cc'
      ? `You are copied because this address is printed on ${input.vendorName}'s certificate.`
      : null;
  const ask = `${input.orgName} needs a current certificate of insurance for ${input.vendorName}. ${input.policyDescription} ${input.rung.startsWith('T+') ? 'expired' : 'expires'} on ${input.expiryDate}.`;
  const others =
    input.otherExpiries.length > 0
      ? `Other coverages on the certificate expire ${input.otherExpiries.join(', ')}.`
      : null;
  const schedule = scheduleSentence(input.messageNumber, input.messageTotal);
  const noCharge = `${input.vendorName} is never charged for this, and no account or password is needed. You can also reply to this message with the certificate attached.`;
  const disclaimer = disclaimers.primary;

  const requirementItems = input.requirements.map((line) => line.text);

  const text = [
    identification,
    copied,
    '',
    ask,
    others,
    '',
    'What is required:',
    ...requirementItems.map((line) => `  - ${line}`),
    '',
    `Upload the renewal certificate: ${upload}`,
    '',
    schedule,
    noCharge,
    '',
    `${disclaimer.heading} ${disclaimer.body}`,
    '',
    '---',
    `${brand.appName}`,
    brand.companyAddress,
    `Stop requests from ${input.orgName}: ${stopOrg}`,
    `Stop all ${brand.appName} requests, from every customer: ${stopAll}`,
    `Terms ${legal[0]} · Privacy ${legal[1]} · Disclaimer ${legal[2]}`,
  ]
    .filter((line) => line !== null)
    .join('\n');

  const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#111;margin:0;padding:24px">
<div style="max-width:560px;margin:0 auto">
<p style="margin:0 0 16px;font-size:13px;color:#555">${escape(identification)}${copied ? ` ${escape(copied)}` : ''}</p>
<p style="margin:0 0 12px"><strong>${escape(ask)}</strong></p>
${others ? `<p style="margin:0 0 12px;font-size:13px;color:#555">${escape(others)}</p>` : ''}
<p style="margin:20px 0 6px"><strong>What is required</strong></p>
<ul style="margin:0 0 20px;padding-left:20px">${requirementItems.map((line) => `<li style="margin:0 0 6px">${escape(line)}</li>`).join('')}</ul>
<p style="margin:24px 0"><a href="${escape(upload)}" style="background:#111;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">Upload the renewal certificate</a></p>
<p style="margin:0 0 8px;font-size:13px;color:#555">${escape(schedule)}</p>
<p style="margin:0 0 8px;font-size:13px;color:#555">${escape(noCharge)}</p>
<p style="margin:20px 0 0;font-size:12px;color:#666"><strong>${escape(disclaimer.heading)}</strong> ${escape(disclaimer.body)}</p>
<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0 12px">
<p style="font-size:12px;color:#666;margin:0">${escape(brand.appName)}<br>${escape(brand.companyAddress)}<br>
<a href="${escape(stopOrg)}" style="color:#666">Stop requests from ${escape(input.orgName)}</a> ·
<a href="${escape(stopAll)}" style="color:#666">Stop all ${escape(brand.appName)} requests, from every customer</a><br>
<a href="${escape(legal[0] ?? '')}" style="color:#666">Terms</a> ·
<a href="${escape(legal[1] ?? '')}" style="color:#666">Privacy</a> ·
<a href="${escape(legal[2] ?? '')}" style="color:#666">Disclaimer</a>
</p>
</div></body></html>`;

  return {
    subject: subjectLine(input),
    html,
    text,
    replyTo: input.replyTo,
    fromDisplayName: `${input.orgName} via ${brand.appName}`,
    links,
  };
}

/** Every http(s) URL a composed message actually contains. */
export function extractUrls(message: ComposedVendorEmail): string[] {
  const found = new Set<string>();
  for (const source of [message.text, message.html]) {
    for (const match of source.matchAll(/https?:\/\/[^\s"'<>)]+/g)) found.add(match[0]);
  }
  return [...found];
}
