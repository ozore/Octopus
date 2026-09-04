/**
 * One layout for every message this app sends, built on the PLATFORM's brand
 * helpers so the signature cannot drift.
 *
 * `signature(brand)` is the platform's own function and produces
 * `"<App>, a TheVillage company"` (PLAN.md D1: three sub-brands, one legal
 * entity). The product's name is never a literal here — `brandFromEnv()` reads
 * `APP_NAME`, so the founder's rename is an environment variable and a
 * redeploy (WL-11 V8, finding M12).
 *
 * **The CAN-SPAM footer is a parameter of the layout, not a convention.**
 * PLAN.md D4/P10 requires, in every commercial message: the sending entity, a
 * physical postal address, a working unsubscribe honoured within ten days, an
 * accurate subject and no deceptive header. `kind: 'with-unsubscribe'` renders
 * all of it and does not TYPE-CHECK without an unsubscribe URL, so a marketing
 * message that forgot one is a compile error rather than a complaint.
 *
 * Transactional mail (a magic link, a trial reminder, a renewal notice, a
 * project's determination alert) carries the postal address too — it costs
 * nothing and it is the honest thing — but no marketing unsubscribe, because
 * WL-14 V7 says an unsubscribe may never stop a message the customer needs.
 */

import { signature, type EmailBrand } from '@octopus/platform/email';

export type AppEmailContent = {
  subject: string;
  html: string;
  text: string;
  /**
   * RFC 8058 one-click unsubscribe. The adapter port has no `headers` field
   * today (see `REQUESTS.md`, request B3-1), so these travel with the content
   * and `sendScoped` passes them to the adapter; the mock records them and the
   * suite asserts on them.
   */
  headers?: Record<string, string>;
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type FooterOptions =
  | { kind: 'transactional' }
  | {
      /**
       * A message that carries its OWN unsubscribe. Every marketing message
       * must; a transactional message may — WL-08's project alert does,
       * because V6 gives change alerts an off switch that does not touch the
       * magic link or the billing mail.
       */
      kind: 'with-unsubscribe';
      /** Required. A message of this kind without one cannot be built. */
      unsubscribeUrl: string;
      unsubscribeLabel: string;
      /** "You are receiving this because you asked for alerts on TX20260253." */
      whyReceiving: string;
    };

export function buildEmail(
  brand: EmailBrand,
  input: {
    subject: string;
    bodyHtml: string;
    bodyText: string;
    footer: FooterOptions;
    /** Extra headers (List-Unsubscribe on a marketing message). */
    headers?: Record<string, string>;
  },
): AppEmailContent {
  const sig = signature(brand);
  const address = brand.companyAddress ?? '';

  const marketingHtml =
    input.footer.kind === 'with-unsubscribe'
      ? `<p>${escapeHtml(input.footer.whyReceiving)}</p>
<p><a href="${escapeHtml(input.footer.unsubscribeUrl)}">${escapeHtml(input.footer.unsubscribeLabel)}</a> — one click, no login, no reply. We honour it immediately.</p>`
      : '';
  const marketingText =
    input.footer.kind === 'with-unsubscribe'
      ? `\n${input.footer.whyReceiving}\n${input.footer.unsubscribeLabel}: ${input.footer.unsubscribeUrl}\nOne click, no login, no reply. We honour it immediately.\n`
      : '';

  const html = `<!doctype html><html lang="en"><body>
<div>
${input.bodyHtml}
<hr>
<div>
${marketingHtml}
<p>${escapeHtml(sig)}${address ? `<br>${escapeHtml(address)}` : ''}</p>
<p>Questions? <a href="mailto:${escapeHtml(brand.supportEmail)}">${escapeHtml(brand.supportEmail)}</a></p>
</div>
</div>
</body></html>`;

  const text = `${input.bodyText}\n\n—${marketingText}\n${sig}\n${address}\nQuestions? ${brand.supportEmail}\n`;

  return {
    subject: input.subject,
    html,
    text,
    ...(input.headers ? { headers: input.headers } : {}),
  };
}

/** RFC 8058: a mail client's own unsubscribe button, working without a reply. */
export function listUnsubscribeHeaders(url: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${url}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}
