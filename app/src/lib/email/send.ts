/**
 * Thin senders — bind a template's output to `adapters.email.send`, tagging
 * every send with `case_id` so the outcome sequence's bookkeeping (which
 * email went to which case) never depends on parsing subject lines.
 *
 * Spec: ARCHITECTURE.md §2.1 (Resend, one vendor for both directions), §3.7.
 */

import type { Adapters } from '../adapters';
import type { SentEmail } from '../adapters/resend';
import * as templates from './templates';

export async function sendReceiptEmail(
  adapters: Adapters,
  to: string,
  input: Parameters<typeof templates.receiptEmail>[0],
): Promise<SentEmail> {
  const content = templates.receiptEmail(input);
  return adapters.email.send({
    to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    tags: { case_id: input.caseId, kind: 'receipt' },
  });
}

export async function sendDraftReadyEmail(
  adapters: Adapters,
  to: string,
  caseId: string,
  input: Parameters<typeof templates.draftReadyEmail>[0],
): Promise<SentEmail> {
  const content = templates.draftReadyEmail(input);
  return adapters.email.send({
    to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    tags: { case_id: caseId, kind: 'draft_ready' },
  });
}

export async function sendEscalationEmail(
  adapters: Adapters,
  to: string,
  input: Parameters<typeof templates.escalationEmail>[0],
): Promise<SentEmail> {
  const content = templates.escalationEmail(input);
  return adapters.email.send({
    to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    tags: { case_id: input.caseId, kind: 'escalation' },
  });
}

export async function sendMonitoringAlertEmail(
  adapters: Adapters,
  to: string,
  caseId: string | undefined,
  input: Parameters<typeof templates.monitoringAlertEmail>[0],
): Promise<SentEmail> {
  const content = templates.monitoringAlertEmail(input);
  return adapters.email.send({
    to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    tags: { kind: 'monitoring_alert', ...(caseId ? { case_id: caseId } : {}) },
  });
}

export async function sendShieldActivationEmail(
  adapters: Adapters,
  to: string,
  caseId: string,
  input: Parameters<typeof templates.shieldActivationEmail>[0],
): Promise<SentEmail> {
  const content = templates.shieldActivationEmail(input);
  return adapters.email.send({
    to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    tags: { case_id: caseId, kind: 'shield_activation' },
  });
}

export async function sendOutcomeRequestEmail(
  adapters: Adapters,
  to: string,
  caseId: string,
  input: Parameters<typeof templates.outcomeRequestEmail>[0],
): Promise<SentEmail> {
  const content = templates.outcomeRequestEmail(input);
  return adapters.email.send({
    to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    tags: { case_id: caseId, kind: `outcome_d${input.day}` },
  });
}
