/**
 * The one send path. Everything that mails a customer goes through here so that
 * the suppression check, the brand signature and the audit event cannot be
 * forgotten at a call site.
 */

import type { Adapters } from '../adapters';
import type { Db } from '../db';
import { getEnv } from '../env';
import type { EmailBrand, EmailContent } from './templates';
import { isSuppressed } from './suppression';

export type SendResult =
  | { status: 'sent'; id: string }
  | { status: 'suppressed'; email: string };

export function brandFromEnv(env = getEnv()): EmailBrand {
  return {
    appName: env.APP_NAME,
    companyName: env.COMPANY_NAME,
    supportEmail: env.SUPPORT_EMAIL,
    baseUrl: env.APP_BASE_URL,
    companyAddress: env.COMPANY_ADDRESS,
  };
}

export async function sendEmail(
  db: Db,
  adapters: Adapters,
  input: { to: string; content: EmailContent; tags?: Record<string, string> },
): Promise<SendResult> {
  if (await isSuppressed(db, input.to)) {
    return { status: 'suppressed', email: input.to };
  }
  const sent = await adapters.email.send({
    to: input.to,
    subject: input.content.subject,
    html: input.content.html,
    text: input.content.text,
    ...(input.tags ? { tags: input.tags } : {}),
  });
  return { status: 'sent', id: sent.id };
}
