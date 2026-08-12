/**
 * Email copy.
 *
 * Spec: BRAND.md §2 (the ER-doctor register — calm, specific, candid about
 * limits, not the hero) and §2.4's four registers by moment (R-1 triage, R-2
 * diagnosis, R-3 consequence, R-4 relief). ARCHITECTURE.md §3.1 / NAMING.md
 * §5 invariant 2: never "POA" or "Plan of Action" in customer-facing copy —
 * "your case document" / "your draft" throughout.
 *
 * Every function here is pure: `(data) -> { subject, html, text }`. No I/O, no
 * adapter import, so these are trivially unit-testable and the calm-voice
 * rules (no exclamation marks, no emoji, "you" outnumbers "we") are checkable
 * by inspecting a string, not by mocking a network call.
 */

export type EmailContent = { subject: string; html: string; text: string };

const WORDMARK = 'Clausewright';

function wrap(bodyHtml: string): string {
  // A single translucent-adjacent card, content-first (identity/DESIGN_SYSTEM.md
  // §Liquid Glass alignment) — but email clients strip most CSS, so this stays
  // deliberately plain: a neutral background, generous whitespace, one column.
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f5f4f2;font-family:Georgia,'Iowan Old Style',serif;color:#1c1b19;">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <tr><td>
        <p style="font-size:13px;letter-spacing:0.04em;text-transform:lowercase;color:#6b6459;margin:0 0 24px;">${WORDMARK}</p>
        ${bodyHtml}
        <p style="font-size:12px;color:#8a8377;margin-top:32px;border-top:1px solid #ece9e3;padding-top:16px;">
          Not legal advice. Clausewright drafts from policy text and appeal patterns; a licensed attorney has not reviewed your case unless you chose the human-review tier.
        </p>
      </td></tr>
    </table>
  </body>
</html>`;
}

// ---------------------------------------------------------------------------
// R-4 relief / confirmation — the receipt (sent immediately at fulfilment)
// ---------------------------------------------------------------------------

export function receiptEmail(input: {
  tierLabel: string;
  amountCents: number;
  currency: string;
  caseId: string;
}): EmailContent {
  const amount = formatAmount(input.amountCents, input.currency);
  const subject = `Receipt — ${input.tierLabel}, ${amount}`;
  const text =
    `You paid ${amount} for ${input.tierLabel}.\n\n` +
    `Case reference: ${input.caseId}\n\n` +
    `We are working on your case document now. You'll get a separate email the moment it's ready.`;
  const html = wrap(
    `<p style="font-size:16px;line-height:1.6;">You paid <strong>${amount}</strong> for <strong>${input.tierLabel}</strong>.</p>` +
      `<p style="font-size:14px;color:#6b6459;">Case reference: ${input.caseId}</p>` +
      `<p style="font-size:16px;line-height:1.6;">We are working on your case document now. You'll get a separate email the moment it's ready.</p>`,
  );
  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// R-4 relief — the document is ready (magic-link retrieval, N4: no accounts)
// ---------------------------------------------------------------------------

export function draftReadyEmail(input: {
  reasonCodeLabel: string;
  magicLinkUrl: string;
  isRevision?: boolean;
}): EmailContent {
  const subject = input.isRevision ? 'Your revised case document is ready' : 'Your case document is ready';
  const lead = input.isRevision
    ? `Your revised document is ready. It covers the ${input.reasonCodeLabel} clause.`
    : `Your case document is ready. It covers the ${input.reasonCodeLabel} clause, quoted with its source.`;
  const text = `${lead}\n\nOpen it here: ${input.magicLinkUrl}\n\nReview it yourself before you submit — that submission is the one that starts the clock.`;
  const html = wrap(
    `<p style="font-size:16px;line-height:1.6;">${lead}</p>` +
      `<p><a href="${input.magicLinkUrl}" style="display:inline-block;padding:12px 20px;background:#1c1b19;color:#fff;text-decoration:none;border-radius:6px;">Open your case document</a></p>` +
      `<p style="font-size:14px;color:#6b6459;line-height:1.6;">Review it yourself before you submit — that submission is the one that starts the clock.</p>`,
  );
  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// R-3 consequence — escalation confirmation (I5: a human is now on the case)
// ---------------------------------------------------------------------------

export function escalationEmail(input: { caseId: string; reasonDetail: string; humanTier: boolean }): EmailContent {
  const subject = 'A reviewer is on your case';
  const body = input.humanTier
    ? `We're not confident enough in a code to draft this one automatically, so a reviewer is handling it directly — same business day. ${input.reasonDetail}`
    : `A reviewer is on your case. ${input.reasonDetail} You have not been charged for the automated draft; the human review is included.`;
  const text = `${body}\n\nCase reference: ${input.caseId}`;
  const html = wrap(
    `<p style="font-size:16px;line-height:1.6;">${body}</p>` +
      `<p style="font-size:14px;color:#6b6459;">Case reference: ${input.caseId}</p>`,
  );
  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// R-4 relief — monitoring alert (ADR-006: Shield reuses the classifier)
// ---------------------------------------------------------------------------

export function monitoringAlertEmail(input: {
  marketplace: 'amazon' | 'walmart' | 'unknown';
  summary: string;
  actionUrl?: string;
}): EmailContent {
  const subject = `Monitoring: new account-health activity on ${labelMarketplace(input.marketplace)}`;
  const body = `We received a new account-health message from ${labelMarketplace(input.marketplace)} and are reviewing it. ${input.summary}`;
  const cta = input.actionUrl
    ? `<p><a href="${input.actionUrl}" style="display:inline-block;padding:12px 20px;background:#1c1b19;color:#fff;text-decoration:none;border-radius:6px;">Review it</a></p>`
    : '';
  const text = `${body}${input.actionUrl ? `\n\n${input.actionUrl}` : ''}`;
  const html = wrap(`<p style="font-size:16px;line-height:1.6;">${body}</p>${cta}`);
  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// R-4 relief — Shield activation (S7): no new decision required right now
// ---------------------------------------------------------------------------

export function shieldActivationEmail(input: { includedUntil: Date }): EmailContent {
  const until = formatDate(input.includedUntil);
  const subject = 'Monitoring is on — 30 days included';
  const body = `Monitoring is on for your account, included free through ${until}. Nothing charges you before then, and cancelling is one click at any time.`;
  const text = body;
  const html = wrap(`<p style="font-size:16px;line-height:1.6;">${body}</p>`);
  return { subject, html, text };
}

/** S15 — the renewal decision, framed with equal visual weight (Nielsen #3).
 *  BRAND.md §2.4 R-4 sample line adapted verbatim. */
export function shieldRenewalDecisionEmail(input: {
  daysRemaining: number;
  whatMonitoringFlagged: string;
  keepUrl: string;
  lapseUrl: string;
}): EmailContent {
  const subject = `Your free monitoring ends in ${input.daysRemaining} days`;
  const body = `Your 30 days of free monitoring end in ${input.daysRemaining} days. ${input.whatMonitoringFlagged}`;
  const text = `${body}\n\nKeep it at $49/mo: ${input.keepUrl}\nLet it lapse: ${input.lapseUrl}\n\nBoth are one click.`;
  const html = wrap(
    `<p style="font-size:16px;line-height:1.6;">${body}</p>` +
      `<table role="presentation"><tr>` +
      `<td style="padding-right:12px;"><a href="${input.keepUrl}" style="display:inline-block;padding:12px 20px;background:#1c1b19;color:#fff;text-decoration:none;border-radius:6px;">Keep it — $49/mo</a></td>` +
      `<td><a href="${input.lapseUrl}" style="display:inline-block;padding:12px 20px;background:#ffffff;color:#1c1b19;text-decoration:none;border-radius:6px;border:1px solid #1c1b19;">Let it lapse</a></td>` +
      `</tr></table>`,
  );
  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// B9 — the day 3 / 10 / 21 outcome sequence. §4.6 of CORPUS_DESIGN.md: a
// one-click "Rejected" must be exactly as prominent as one-click "Reinstated".
// ---------------------------------------------------------------------------

export function outcomeRequestEmail(input: {
  day: 3 | 10 | 21;
  reinstatedUrl: string;
  rejectedUrl: string;
  noResponseUrl: string;
}): EmailContent {
  const subject =
    input.day === 21 ? 'Last check-in: how did it go?' : 'Quick check-in: how did it go?';
  const text =
    `One click, no form: how did your appeal go?\n\n` +
    `Reinstated: ${input.reinstatedUrl}\n` +
    `Rejected: ${input.rejectedUrl}\n` +
    `Still waiting: ${input.noResponseUrl}`;
  const html = wrap(
    `<p style="font-size:16px;line-height:1.6;">One click, no form: how did your appeal go?</p>` +
      `<table role="presentation"><tr>` +
      `<td style="padding-right:8px;"><a href="${input.reinstatedUrl}" style="display:inline-block;padding:10px 16px;background:#1c1b19;color:#fff;text-decoration:none;border-radius:6px;">Reinstated</a></td>` +
      `<td style="padding-right:8px;"><a href="${input.rejectedUrl}" style="display:inline-block;padding:10px 16px;background:#ffffff;color:#1c1b19;text-decoration:none;border-radius:6px;border:1px solid #1c1b19;">Rejected</a></td>` +
      `<td><a href="${input.noResponseUrl}" style="display:inline-block;padding:10px 16px;background:#ffffff;color:#6b6459;text-decoration:none;border-radius:6px;border:1px solid #ece9e3;">Still waiting</a></td>` +
      `</tr></table>`,
  );
  return { subject, html, text };
}

function labelMarketplace(m: 'amazon' | 'walmart' | 'unknown'): string {
  if (m === 'amazon') return 'Amazon';
  if (m === 'walmart') return 'Walmart';
  return 'your marketplace';
}

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
    cents / 100,
  );
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
