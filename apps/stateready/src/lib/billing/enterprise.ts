/**
 * The Enterprise row — `specs/09` §Above the 15-state cap, wave-1b **M8** and D4.
 *
 * Twelve of the twenty highest-fit accounts in the phase-3 file operate in more
 * than 15 states on day one. At wave 1 they landed in a tier with **no price and
 * no path**, so the outbound fleet had nothing to route them to and the product
 * had nothing to show them.
 *
 * **No price is invented.** There is no basis for one and a rate card with a
 * made-up number on it rots the moment the first deal contradicts it. What
 * exists instead is a published row with a route behind it and exactly one
 * promise, which is one we control: *a quote within two business days, or we
 * say we cannot help.*
 *
 * Both parties are emailed and no human is inside the product's loop: the
 * enquiry is a hand-off at the edge, exactly like support (`PLAN.md` A6).
 */

import { count, eq } from 'drizzle-orm';
import type { Adapters } from '@octopus/platform/adapters';
import type { Db } from '@octopus/platform/db';
import { newId } from '@octopus/platform';
import { brandFromEnv, notificationEmail, sendEmail } from '@octopus/platform/email';
import { track } from '@octopus/platform/events';

import { enterpriseEnquiries, operatingStates, technicians } from '../schema';

/** The only number on the row, and it is ours to keep. */
export const ENTERPRISE_QUOTE_PROMISE = 'a quote within two business days, or we say we cannot help';

export type EnterpriseEnquiryInput = {
  orgId: string;
  userId?: string | null;
  email: string;
  organisationName: string;
  message?: string | null;
  now?: Date;
};

export async function createEnterpriseEnquiry(
  ctx: { db: Db; adapters: Adapters; env: Record<string, unknown> & { APP_NAME: string; SUPPORT_EMAIL: string } },
  input: EnterpriseEnquiryInput,
): Promise<{ id: string; stateCount: number; technicianCount: number }> {
  const { db } = ctx;
  const rows = await db
    .select({ state: operatingStates.state, trade: operatingStates.trade })
    .from(operatingStates)
    .where(eq(operatingStates.orgId, input.orgId));
  const states = [...new Set(rows.map((r) => r.state))].sort();
  const trades = [...new Set(rows.map((r) => r.trade))].sort();
  const [techRow] = await db
    .select({ value: count() })
    .from(technicians)
    .where(eq(technicians.orgId, input.orgId));
  const technicianCount = Number(techRow?.value ?? 0);

  const id = newId('ent');
  await db.insert(enterpriseEnquiries).values({
    id,
    orgId: input.orgId,
    userId: input.userId ?? null,
    stateCount: states.length,
    technicianCount,
    trades: trades as never,
    states: states as never,
    message: input.message ?? null,
  });

  const brand = brandFromEnv(ctx.env as never);

  // The founder's mailbox, with everything pre-filled so the reply is a reply
  // rather than a research task.
  await sendEmail(db, ctx.adapters, {
    to: brand.supportEmail,
    content: notificationEmail(brand, {
      subject: `Enterprise enquiry — ${input.organisationName} (${states.length} states, ${technicianCount} technicians)`,
      paragraphs: [
        `${input.organisationName} operates in ${states.length} state${states.length === 1 ? '' : 's'}: ${states.join(', ') || 'none recorded'}.`,
        `Trades: ${trades.join(', ') || 'none recorded'}. Technicians on the roster: ${technicianCount}.`,
        `Contact: ${input.email}.`,
        input.message ? `They wrote: ${input.message}` : 'They left no message.',
        `You promised ${ENTERPRISE_QUOTE_PROMISE}.`,
      ],
    }),
    tags: { kind: 'enterprise_enquiry', org_id: input.orgId },
  });

  // …and the customer, naming the promise so it is theirs to hold us to.
  await sendEmail(db, ctx.adapters, {
    to: input.email,
    content: notificationEmail(brand, {
      subject: `Your ${brand.appName} Enterprise enquiry`,
      paragraphs: [
        `You operate in ${states.length} states, which is above the ${brand.appName} Platform plan's published cap.`,
        'We do not publish a price above it, because we have no honest basis for one and a made-up number would be worse than a conversation.',
        `What we do promise: ${ENTERPRISE_QUOTE_PROMISE}.`,
        'Nothing in your account changes in the meantime, and nothing has been charged.',
      ],
    }),
    tags: { kind: 'enterprise_enquiry_ack', org_id: input.orgId },
  });

  await track(db, {
    name: 'enterprise_enquiry_created',
    orgId: input.orgId,
    userId: input.userId ?? null,
    // The measure of how much of the target list the published ladder cannot
    // serve — and the input that decides whether a price is ever written.
    props: { state_count: states.length, technician_count: technicianCount, trades },
  });

  return { id, stateCount: states.length, technicianCount };
}
