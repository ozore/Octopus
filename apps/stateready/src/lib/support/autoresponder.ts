/**
 * Support: the ticket, the auto-response, and the escalation to the founder's
 * mailbox — `specs/11` §What we ship item 3, and PLAN.md A6.
 *
 * > *No human in the product; one human at the edge.*
 *
 * FOUR RULES THAT ARE NOT NEGOTIABLE, each of them from an edge case in
 * `specs/11` rather than from taste:
 *
 *  1. **The ticket is written before anything is sent.** "Support that depends
 *     on an email hop must not lose the message." `submitTicket` writes the row
 *     and enqueues the send; a mail outage costs an acknowledgement, never a
 *     ticket.
 *  2. **A data-quality report is not support.** "Texas raised the fee to $70"
 *     is the most valuable message we will ever get and it must not die in an
 *     inbox. It is tagged `isDataQualityReport`, it is escalated as one, and
 *     where the customer gave us the board link we showed them, it opens a
 *     review item against that source so it lands in the knowledge-base queue
 *     with everything else that says a page moved.
 *  3. **A hostile message gets an acknowledgement and nothing else.** No
 *     article suggestions, no "here are three things to read" — it is stored,
 *     it is escalated, and a person decides.
 *  4. **Escalation failure is visible, not silent.** If the founder's mailbox
 *     rejects the forward, the ticket is flagged `escalation_failed` in its own
 *     context so `/admin` can show it, and the job retries.
 */

import { and, eq, gte } from 'drizzle-orm';

import { newId } from '@octopus/platform';
import type { Adapters } from '@octopus/platform/adapters';
import type { Db } from '@octopus/platform/db';
import { sendEmail } from '@octopus/platform/email';
import { track } from '@octopus/platform/events';
import { enqueue } from '@octopus/platform/jobs';

import { DISCLAIMER_SHORT } from '@/components/provenance';
import { kbSources, supportTickets } from '@/lib/schema';
import { kbDriftItems } from '@/lib/schema';

import { matchArticles } from './matcher';

export const SUPPORT_JOB = 'stateready.support_autorespond';

/** `specs/11` §Validation. */
export const SUBJECT_MIN = 3;
export const SUBJECT_MAX = 140;
export const BODY_MIN = 10;
export const BODY_MAX = 5_000;
export const TICKETS_PER_HOUR = 5;

/**
 * The human response time we quote. `specs/11` §Errors already prints "we
 * answer within one business day" on the empty-search state, so the two agree
 * because they read the same constant.
 */
export const HUMAN_RESPONSE = 'one business day';

export type SupportEnv = {
  APP_NAME: string;
  APP_BASE_URL: string;
  COMPANY_NAME: string;
  COMPANY_ADDRESS: string;
  SUPPORT_EMAIL: string;
};

export type TicketContext = {
  route?: string | null;
  licenceId?: string | null;
  deadlineId?: string | null;
  states?: string[];
  trades?: string[];
  /** The board link we showed beside the value the customer is disputing. */
  sourceUrl?: string | null;
  recordId?: string | null;
};

export type SubmitTicketInput = {
  orgId?: string | null;
  userId?: string | null;
  email?: string | null;
  subject: string;
  body: string;
  isDataQualityReport?: boolean;
  context?: TicketContext;
  now?: Date;
};

export type SubmitTicketResult =
  | { status: 'ok'; ticketId: string; reference: string; suggestedArticles: string[]; escalatedOnly: boolean }
  | { status: 'invalid'; field: 'subject' | 'body'; message: string }
  | { status: 'rate_limited'; retryAfterMinutes: number };

/**
 * `SR-2026-0413` — the year and a per-year counter, because a reference a
 * customer reads aloud on the telephone has to be short.
 */
export async function nextReference(db: Db, now: Date): Promise<string> {
  const year = now.getUTCFullYear();
  const rows = await db.select({ reference: supportTickets.reference }).from(supportTickets);
  const used = rows
    .map((row) => row.reference)
    .filter((reference) => reference.startsWith(`SR-${year}-`))
    .map((reference) => Number.parseInt(reference.split('-')[2] ?? '0', 10))
    .filter((n) => Number.isFinite(n));
  const next = (used.length > 0 ? Math.max(...used) : 0) + 1;
  return `SR-${year}-${String(next).padStart(4, '0')}`;
}

/**
 * A message we will not auto-answer with reading material. Deliberately narrow:
 * the cost of a false positive is a customer who gets an acknowledgement
 * instead of three links, which is survivable; the cost of cheerfully sending
 * "here are three articles" to someone who has just sworn at us is not.
 */
const HOSTILE = /\b(fuck|shit|bastard|arsehole|asshole|idiots?|scam|fraud|sue you|lawyer up|useless)\b/i;

export function isHostile(text: string): boolean {
  return HOSTILE.test(text);
}

export async function submitTicket(
  ctx: { db: Db; env: SupportEnv },
  input: SubmitTicketInput,
): Promise<SubmitTicketResult> {
  const now = input.now ?? new Date();
  const subject = input.subject.trim();
  const body = input.body.trim();

  if (subject.length < SUBJECT_MIN || subject.length > SUBJECT_MAX) {
    return {
      status: 'invalid',
      field: 'subject',
      message: `A subject is between ${SUBJECT_MIN} and ${SUBJECT_MAX} characters.`,
    };
  }
  if (body.length < BODY_MIN || body.length > BODY_MAX) {
    return {
      status: 'invalid',
      field: 'body',
      message: `Tell us a little more — between ${BODY_MIN} and ${BODY_MAX} characters.`,
    };
  }

  if (input.userId) {
    const since = new Date(now.getTime() - 60 * 60 * 1000);
    const recent = await ctx.db
      .select({ id: supportTickets.id })
      .from(supportTickets)
      .where(and(eq(supportTickets.userId, input.userId), gte(supportTickets.createdAt, since)));
    if (recent.length >= TICKETS_PER_HOUR) return { status: 'rate_limited', retryAfterMinutes: 60 };
  }

  const hostile = isHostile(`${subject} ${body}`);
  const articles = hostile
    ? []
    : matchArticles(`${subject} ${body}`, {
        ...(input.context?.states ? { states: input.context.states } : {}),
        ...(input.context?.trades ? { trades: input.context.trades } : {}),
      });

  const ticketId = newId('tkt');
  const reference = await nextReference(ctx.db, now);

  await ctx.db.insert(supportTickets).values({
    id: ticketId,
    reference,
    orgId: input.orgId ?? null,
    userId: input.userId ?? null,
    subject,
    body,
    context: {
      ...(input.context ?? {}),
      anonymous: !input.orgId,
      hostile,
      replyTo: input.email ?? null,
    },
    status: 'open',
    isDataQualityReport: input.isDataQualityReport ?? false,
    suggestedArticles: articles.map((article) => article.slug),
  });

  if (input.isDataQualityReport) {
    await openDriftReview(ctx.db, { ticketId, reference, context: input.context ?? {}, subject, body });
    await track(ctx.db, {
      name: 'data_quality_report_submitted',
      orgId: input.orgId ?? null,
      userId: input.userId ?? null,
      props: { reference, recordId: input.context?.recordId ?? null },
    });
  }

  await track(ctx.db, {
    name: 'ticket_submitted',
    orgId: input.orgId ?? null,
    userId: input.userId ?? null,
    props: { reference, category: input.isDataQualityReport ? 'data_quality' : 'support', hostile },
  });

  // The row exists. Everything after this point can fail and be retried.
  await enqueue(ctx.db, {
    kind: SUPPORT_JOB,
    payload: { ticketId },
    dedupeKey: `support:${ticketId}`,
  });

  return {
    status: 'ok',
    ticketId,
    reference,
    suggestedArticles: articles.map((article) => article.slug),
    escalatedOnly: hostile,
  };
}

/**
 * Route a "this rule looks wrong" report into the knowledge-base review queue.
 *
 * `kb_drift_items.source_id` is a real foreign key into `kb_sources`, so this
 * can only open an item when the customer gave us a board link we actually
 * hold — which is why the support form pre-fills it from the provenance line we
 * showed them. Where it cannot resolve, the ticket is still stored and still
 * tagged, and the escalation says so; the report is never lost, it is only
 * sometimes un-routed.
 */
async function openDriftReview(
  db: Db,
  input: { ticketId: string; reference: string; context: TicketContext; subject: string; body: string },
): Promise<void> {
  const url = input.context.sourceUrl;
  if (!url) return;
  const rows = await db.select().from(kbSources).where(eq(kbSources.url, url)).limit(1);
  const source = rows[0];
  if (!source) return;

  await db
    .insert(kbDriftItems)
    .values({
      id: newId('drf'),
      sourceId: source.sourceId,
      kind: 'content_changed',
      previousSha256: source.baselineSha256 ?? null,
      currentSha256: null,
      diffSummary: `Customer report ${input.reference}: ${input.subject}`,
      affectedRecordIds: input.context.recordId ? [input.context.recordId] : [],
      status: 'open',
    })
    .onConflictDoNothing();
}

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function acknowledgementEmail(input: {
  env: SupportEnv;
  reference: string;
  subject: string;
  articles: { slug: string; title: string }[];
}): { subject: string; html: string; text: string } {
  const { env } = input;
  const links = input.articles.map((article) => ({
    title: article.title,
    url: `${env.APP_BASE_URL}/help/${article.slug}`,
  }));

  const bodyHtml = `<p>We have your message. Its reference is <strong>${escape(input.reference)}</strong>.</p>
<p>A person reads every one of these and will reply within ${escape(HUMAN_RESPONSE)}.</p>
${
  links.length > 0
    ? `<p>While you wait, these three may already answer it:</p><ul>${links
        .map((link) => `<li><a href="${escape(link.url)}">${escape(link.title)}</a></li>`)
        .join('')}</ul>`
    : ''
}
<p style="font-size:12px;color:#5F6762">${escape(DISCLAIMER_SHORT)}</p>
<p style="font-size:12px;color:#5F6762">${escape(env.APP_NAME)}, a ${escape(env.COMPANY_NAME)} company<br>${escape(
    env.COMPANY_ADDRESS,
  )}</p>`;

  const bodyText = [
    `We have your message. Its reference is ${input.reference}.`,
    `A person reads every one of these and will reply within ${HUMAN_RESPONSE}.`,
    links.length > 0 ? 'While you wait, these three may already answer it:' : '',
    ...links.map((link) => `- ${link.title}: ${link.url}`),
    '',
    DISCLAIMER_SHORT,
    '',
    `${env.APP_NAME}, a ${env.COMPANY_NAME} company`,
    env.COMPANY_ADDRESS,
  ]
    .filter(Boolean)
    .join('\n');

  return { subject: `[${input.reference}] ${input.subject}`, html: bodyHtml, text: bodyText };
}

export function escalationEmail(input: {
  env: SupportEnv;
  reference: string;
  subject: string;
  body: string;
  organisationName: string | null;
  planName: string | null;
  licenceCount: number;
  recentEvents: { name: string; ts: string }[];
  isDataQualityReport: boolean;
  hostile: boolean;
  replyTo: string | null;
}): { subject: string; html: string; text: string } {
  const facts = [
    `Organisation: ${input.organisationName ?? 'anonymous (logged out)'}`,
    `Plan: ${input.planName ?? 'unknown'}`,
    `Licences tracked: ${input.licenceCount}`,
    `Reply to: ${input.replyTo ?? 'unknown'}`,
    input.isDataQualityReport ? 'THIS IS A DATA-QUALITY REPORT — it belongs in the KB queue.' : '',
    input.hostile ? 'Flagged hostile: acknowledged only, no articles were suggested.' : '',
  ].filter(Boolean);

  const events = input.recentEvents.map((event) => `${event.ts} ${event.name}`);

  const text = [
    `[${input.reference}] ${input.subject}`,
    '',
    ...facts,
    '',
    '--- message ---',
    input.body,
    '',
    '--- last ten events ---',
    ...events,
  ].join('\n');

  return {
    subject: `[${input.reference}] ${input.isDataQualityReport ? 'DATA QUALITY — ' : ''}${input.subject}`,
    html: `<pre style="font-family:ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap">${escape(text)}</pre>`,
    text,
  };
}

export type AutoResponderResult = {
  ticketId: string;
  acknowledged: boolean;
  escalated: boolean;
  articles: string[];
};

/**
 * The job body. Sends the acknowledgement to the customer and the escalation to
 * the founder's mailbox, with the organisation, plan, licence count and the
 * last ten events attached "so the reply is one message rather than three".
 */
export async function runAutoResponder(
  ctx: { db: Db; adapters: Adapters; env: SupportEnv },
  input: { ticketId: string },
): Promise<AutoResponderResult> {
  const { db, adapters, env } = ctx;
  const rows = await db.select().from(supportTickets).where(eq(supportTickets.id, input.ticketId)).limit(1);
  const ticket = rows[0];
  if (!ticket) return { ticketId: input.ticketId, acknowledged: false, escalated: false, articles: [] };

  const context = (ticket.context ?? {}) as TicketContext & { replyTo?: string | null; hostile?: boolean };
  const slugs = (ticket.suggestedArticles as string[]) ?? [];
  const articles = matchArticles(`${ticket.subject} ${ticket.body}`, {
    ...(context.states ? { states: context.states } : {}),
    ...(context.trades ? { trades: context.trades } : {}),
  }).filter((article) => slugs.includes(article.slug));

  const profile = await organisationProfile(db, ticket.orgId);

  let acknowledged = false;
  const replyTo = context.replyTo ?? null;
  if (replyTo) {
    const content = acknowledgementEmail({
      env,
      reference: ticket.reference,
      subject: ticket.subject,
      articles: articles.map((article) => ({ slug: article.slug, title: article.title })),
    });
    try {
      const result = await sendEmail(db, adapters, { to: replyTo, content, tags: { ref: ticket.reference } });
      acknowledged = result.status === 'sent';
    } catch {
      acknowledged = false;
    }
  }

  let escalated = false;
  try {
    const content = escalationEmail({
      env,
      reference: ticket.reference,
      subject: ticket.subject,
      body: ticket.body,
      organisationName: profile.organisationName,
      planName: profile.planName,
      licenceCount: profile.licenceCount,
      recentEvents: profile.recentEvents,
      isDataQualityReport: ticket.isDataQualityReport,
      hostile: Boolean(context.hostile),
      replyTo,
    });
    const result = await sendEmail(db, adapters, {
      to: env.SUPPORT_EMAIL,
      content,
      tags: { ref: ticket.reference },
    });
    escalated = result.status === 'sent';
  } catch {
    escalated = false;
  }

  await db
    .update(supportTickets)
    .set({
      status: escalated ? 'escalated' : 'open',
      context: { ...context, escalationFailed: !escalated, acknowledged },
    })
    .where(eq(supportTickets.id, ticket.id));

  if (acknowledged) {
    await track(db, {
      name: 'ticket_auto_answered',
      orgId: ticket.orgId,
      props: { reference: ticket.reference, articles: articles.map((a) => a.slug) },
    });
  }
  if (escalated) {
    await track(db, {
      name: 'ticket_escalated',
      orgId: ticket.orgId,
      props: { reference: ticket.reference, dataQuality: ticket.isDataQualityReport },
    });
  }

  // A failed forward is retried by the queue, and the flag above is what
  // `/admin` shows in the meantime. The ticket itself is never lost.
  if (!escalated) throw new Error(`support escalation failed for ${ticket.reference}`);

  return {
    ticketId: ticket.id,
    acknowledged,
    escalated,
    articles: articles.map((article) => article.slug),
  };
}

async function organisationProfile(
  db: Db,
  orgId: string | null,
): Promise<{
  organisationName: string | null;
  planName: string | null;
  licenceCount: number;
  recentEvents: { name: string; ts: string }[];
}> {
  if (!orgId) return { organisationName: null, planName: null, licenceCount: 0, recentEvents: [] };

  const { organisations, events, subscriptions } = await import('@octopus/platform/db');
  const { desc } = await import('drizzle-orm');
  const { licences } = await import('@/lib/schema');

  const org = (await db.select().from(organisations).where(eq(organisations.id, orgId)).limit(1))[0];
  const held = await db.select({ id: licences.id }).from(licences).where(eq(licences.orgId, orgId));
  const subscription = (
    await db.select().from(subscriptions).where(eq(subscriptions.orgId, orgId)).limit(1)
  )[0];
  const recent = await db
    .select({ name: events.name, ts: events.ts })
    .from(events)
    .where(eq(events.orgId, orgId))
    .orderBy(desc(events.ts))
    .limit(10);

  return {
    organisationName: org?.name ?? null,
    planName: subscription?.status ? `${subscription.priceId} (${subscription.status})` : null,
    licenceCount: held.length,
    recentEvents: recent.map((row) => ({ name: row.name, ts: row.ts.toISOString() })),
  };
}
