/**
 * Transactional email templates.
 *
 * Every message is plain, short and signed "<App>, a TheVillage company"
 * (PLAN.md D1: three sub-brands, one legal entity). HTML and text are produced
 * together — a text part is what keeps a magic link usable in a client that
 * strips HTML, and it is also what the mock adapter's `lastUrl()` reads in
 * tests.
 *
 * RECEIPTS ARE NOT HERE. Stripe emails the receipt and the invoice; duplicating
 * them would be a second source of truth on money. `paymentReceiptNoticeEmail`
 * only points at the Customer Portal.
 */

export type EmailBrand = {
  appName: string;
  companyName: string;
  supportEmail: string;
  baseUrl: string;
  /** Postal address — CAN-SPAM requires one in commercial mail. */
  companyAddress?: string;
};

export type EmailContent = { subject: string; html: string; text: string };

const escape = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** "WageLens, a TheVillage company" — the signature pattern for all three apps. */
export function signature(brand: EmailBrand): string {
  return `${brand.appName}, a ${brand.companyName} company`;
}

function layout(brand: EmailBrand, bodyHtml: string, bodyText: string, subject: string): EmailContent {
  const sig = signature(brand);
  const address = brand.companyAddress ? `<br>${escape(brand.companyAddress)}` : '';
  const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#111;margin:0;padding:24px">
<div style="max-width:520px;margin:0 auto">
${bodyHtml}
<hr style="border:none;border-top:1px solid #e5e5e5;margin:28px 0 12px">
<p style="font-size:12px;color:#666;margin:0">${escape(sig)}${address}<br>
Questions? <a href="mailto:${escape(brand.supportEmail)}" style="color:#666">${escape(brand.supportEmail)}</a>
</p>
</div></body></html>`;

  const text = `${bodyText}\n\n—\n${sig}\n${brand.companyAddress ?? ''}\nQuestions? ${brand.supportEmail}\n`;
  return { subject, html, text };
}

export function magicLinkEmail(
  brand: EmailBrand,
  input: { url: string; ttlMinutes: number; isNewUser: boolean },
): EmailContent {
  const verb = input.isNewUser ? 'finish creating your account' : 'sign in';
  return layout(
    brand,
    `<p>Click the button to ${verb} at ${escape(brand.appName)}. The link works once and expires in ${input.ttlMinutes} minutes.</p>
<p style="margin:24px 0"><a href="${escape(input.url)}" style="background:#111;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">Sign in to ${escape(brand.appName)}</a></p>
<p style="font-size:13px;color:#555">Or paste this into your browser:<br><span style="word-break:break-all">${escape(input.url)}</span></p>
<p style="font-size:13px;color:#555">If you did not ask for this, ignore it — nothing happens until the link is used.</p>`,
    `Click to ${verb} at ${brand.appName}. The link works once and expires in ${input.ttlMinutes} minutes.\n\n${input.url}\n\nIf you did not ask for this, ignore it — nothing happens until the link is used.`,
    `Your ${brand.appName} sign-in link`,
  );
}

export function welcomeEmail(
  brand: EmailBrand,
  input: { firstStepUrl: string; firstStepLabel: string },
): EmailContent {
  return layout(
    brand,
    `<p>Welcome to ${escape(brand.appName)}.</p>
<p>The fastest way to see whether this is worth paying for: <a href="${escape(input.firstStepUrl)}">${escape(input.firstStepLabel)}</a>.</p>
<p>Reply to this message if anything is unclear — a person reads it.</p>`,
    `Welcome to ${brand.appName}.\n\nThe fastest way to see whether this is worth paying for: ${input.firstStepLabel} — ${input.firstStepUrl}\n\nReply to this message if anything is unclear — a person reads it.`,
    `Welcome to ${brand.appName}`,
  );
}

/**
 * Stripe sends the receipt and the invoice PDF. This is the in-app note that
 * tells the customer where the receipts live, so support never has to.
 */
export function paymentReceiptNoticeEmail(
  brand: EmailBrand,
  input: { planName: string; portalUrl: string },
): EmailContent {
  return layout(
    brand,
    `<p>Your ${escape(brand.appName)} ${escape(input.planName)} subscription is active.</p>
<p>Stripe emails the receipt and every future invoice. Card changes, invoices and cancellation all live in the billing portal: <a href="${escape(input.portalUrl)}">manage billing</a>.</p>`,
    `Your ${brand.appName} ${input.planName} subscription is active.\n\nStripe emails the receipt and every future invoice. Card changes, invoices and cancellation live in the billing portal: ${input.portalUrl}`,
    `${brand.appName} subscription active`,
  );
}

export function trialEndingEmail(
  brand: EmailBrand,
  input: { planName: string; daysLeft: number; manageUrl: string },
): EmailContent {
  return layout(
    brand,
    `<p>Your ${escape(brand.appName)} trial ends in ${input.daysLeft} day${input.daysLeft === 1 ? '' : 's'}.</p>
<p>Nothing to do if you want to continue — the ${escape(input.planName)} plan starts automatically. To stop, cancel in <a href="${escape(input.manageUrl)}">billing</a> before then and you are not charged.</p>`,
    `Your ${brand.appName} trial ends in ${input.daysLeft} day(s).\n\nNothing to do to continue — the ${input.planName} plan starts automatically. To stop, cancel in billing before then and you are not charged: ${input.manageUrl}`,
    `Your ${brand.appName} trial ends in ${input.daysLeft} day${input.daysLeft === 1 ? '' : 's'}`,
  );
}

export function paymentFailedEmail(
  brand: EmailBrand,
  input: { manageUrl: string; retryDate?: string },
): EmailContent {
  const retry = input.retryDate ? ` Stripe retries on ${input.retryDate}.` : '';
  return layout(
    brand,
    `<p>Your last ${escape(brand.appName)} payment did not go through.${escape(retry)}</p>
<p>Updating the card takes a minute: <a href="${escape(input.manageUrl)}">update payment method</a>. Access stays on while the retries run.</p>`,
    `Your last ${brand.appName} payment did not go through.${retry}\n\nUpdate the card: ${input.manageUrl}\nAccess stays on while the retries run.`,
    `Payment failed for ${brand.appName}`,
  );
}

/** The catch-all an app uses for product notifications (a refreshed rule, a
 *  finished report). Deliberately structural: subject + paragraphs + one link. */
export function notificationEmail(
  brand: EmailBrand,
  input: { subject: string; paragraphs: string[]; actionUrl?: string; actionLabel?: string },
): EmailContent {
  const action =
    input.actionUrl && input.actionLabel
      ? `<p style="margin:24px 0"><a href="${escape(input.actionUrl)}" style="background:#111;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">${escape(input.actionLabel)}</a></p>`
      : '';
  const actionText =
    input.actionUrl && input.actionLabel ? `\n\n${input.actionLabel}: ${input.actionUrl}` : '';
  return layout(
    brand,
    `${input.paragraphs.map((p) => `<p>${escape(p)}</p>`).join('\n')}${action}`,
    `${input.paragraphs.join('\n\n')}${actionText}`,
    input.subject,
  );
}
