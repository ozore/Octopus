/**
 * The trial lifecycle — `specs/09` §Flow and AC2, D1.
 *
 *   signup → 14 days, no card, full product, ALERTS LIVE
 *     ├─ day 7  banner + email: "your trial ends in a week"
 *     ├─ day 12 email with the plan the usage implies
 *     └─ day 14 READ-ONLY: data intact, exports intact, alerts PAUSED and the
 *               customer is told so IN WORDS
 *
 * **Alerts pause rather than stop, and we say so.** Silently continuing to send
 * would mean the product's value is free; silently stopping would let a licence
 * lapse on our watch. Every deadline that passes an offset while paused is
 * recorded `suppressed` with the reason `subscription_paused` — carve-out (e),
 * and the reason the drain reads `getEntitlements()` before it sends.
 *
 * Nothing here touches Stripe. A no-card trial is app-managed by construction:
 * `trialDays` is 0 on every price and `trial_grants` is the whole mechanism.
 */

import { eq } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';
import { memberships, users } from '@octopus/platform/db';
import { enqueueNotification } from '@octopus/platform/jobs';
import { track } from '@octopus/platform/events';

import { recordAudit } from '../repos/audit';

import { getEntitlements } from '../entitlements';
import { plans, TRIAL_DAYS } from '../plans';
import { trialGrants } from '../schema';

export { TRIALS_JOB } from './kinds';

/** The two lifecycle touches, in days elapsed since the trial started. */
export const TRIAL_NOTICE_DAYS = [7, 12] as const;

export type TrialSweep = {
  notified7: number;
  notified12: number;
  ended: number;
};

function daysElapsed(startedAt: Date, now: Date): number {
  return Math.floor((now.getTime() - startedAt.getTime()) / 86_400_000);
}

async function recipients(db: Db, orgId: string): Promise<string[]> {
  const rows = await db
    .select({ email: users.email, role: memberships.role })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.orgId, orgId));
  const owners = rows.filter((r) => r.role === 'owner').map((r) => r.email);
  return owners.length > 0 ? owners : rows.map((r) => r.email);
}

/**
 * The plan the usage implies — the day-12 email's whole job. It is read from
 * what they actually operate, not from a marketing preference: a one-state shop
 * is told about Single State, and telling them otherwise is how a trial ends in
 * a "these people do not know what I do" reply.
 */
export function impliedPlan(statesUsed: number, techniciansUsed: number) {
  const monthly = plans.plans.filter((p) => p.interval === 'month');
  return (
    monthly.find(
      (p) => statesUsed <= Number(p.limits['states']) && techniciansUsed <= Number(p.limits['technicians']),
    ) ?? monthly[monthly.length - 1]!
  );
}

export async function runTrialLifecycle(
  ctx: { db: Db; env: { APP_NAME: string; APP_BASE_URL: string } },
  options: { now?: Date } = {},
): Promise<TrialSweep> {
  const now = options.now ?? new Date();
  const { db } = ctx;
  const summary: TrialSweep = { notified7: 0, notified12: 0, ended: 0 };

  const grants = await db.select().from(trialGrants).where(eq(trialGrants.isInternal, false));

  for (const grant of grants) {
    const startedAt = new Date(grant.trialEndsAt.getTime() - grant.trialDays * 86_400_000);
    const elapsed = daysElapsed(startedAt, now);
    const ent = await getEntitlements(db, grant.orgId, { now });
    if (ent.entitlement.active && ent.entitlement.planKey !== 'free') continue; // they paid

    const to = await recipients(db, grant.orgId);
    if (to.length === 0) continue;

    if (elapsed === TRIAL_NOTICE_DAYS[0]) {
      for (const email of to) {
        await enqueueNotification(db, {
          to: email,
          subject: `Your ${ctx.env.APP_NAME} trial ends in a week`,
          paragraphs: [
            `You have ${TRIAL_DAYS - elapsed} days left. Everything you have entered stays, whatever you decide.`,
            'On day 14 the account becomes read-only: your licences, dates, documents and exports all keep working, and new entries and alerts pause until you choose a plan.',
          ],
          actionUrl: `${ctx.env.APP_BASE_URL}/pricing`,
          actionLabel: 'See the plans',
          dedupeKey: `stateready.trial_day7:${grant.orgId}`,
        });
      }
      summary.notified7 += 1;
      await track(db, { name: 'trial_day7_notified', orgId: grant.orgId, props: { days_left: TRIAL_DAYS - elapsed } });
    }

    if (elapsed === TRIAL_NOTICE_DAYS[1]) {
      const plan = impliedPlan(ent.statesUsed, ent.techniciansUsed);
      for (const email of to) {
        await enqueueNotification(db, {
          to: email,
          subject: `Two days left — ${plan.name} is the plan your account implies`,
          paragraphs: [
            `You are tracking ${ent.statesUsed} state${ent.statesUsed === 1 ? '' : 's'} and ${ent.techniciansUsed} technician${ent.techniciansUsed === 1 ? '' : 's'}, which is ${plan.name}.`,
            'On day 14 the account becomes read-only. Nothing is deleted, exports keep working, and the alerts pause with a notice rather than stopping silently.',
          ],
          actionUrl: `${ctx.env.APP_BASE_URL}/settings/billing`,
          actionLabel: `Continue on ${plan.name}`,
          dedupeKey: `stateready.trial_day12:${grant.orgId}`,
        });
      }
      summary.notified12 += 1;
    }

    if (elapsed >= grant.trialDays && ent.readOnly) {
      for (const email of to) {
        await enqueueNotification(db, {
          to: email,
          subject: `Your ${ctx.env.APP_NAME} trial has ended — your alerts are paused`,
          paragraphs: [
            'Your data is all here and it stays here. You can read every licence, every date and every citation, and you can still export the lot.',
            'Two things are paused until you choose a plan: new entries, and the renewal alerts. We are telling you rather than going quiet, because a licence that lapses while we said nothing is the one outcome this product exists to prevent.',
          ],
          actionUrl: `${ctx.env.APP_BASE_URL}/pricing`,
          actionLabel: 'Choose a plan',
          dedupeKey: `stateready.trial_ended:${grant.orgId}`,
        });
      }
      summary.ended += 1;
      await track(db, { name: 'trial_ended', orgId: grant.orgId, props: { days: grant.trialDays } });
    }
  }

  return summary;
}

/** Admin action: one 14-day extension, with a reason, logged (`specs/09`). */
export async function extendTrial(
  db: Db,
  input: { orgId: string; reason: string; now?: Date },
): Promise<{ status: 'extended' | 'already_extended' | 'no_trial'; endsAt?: Date }> {
  const now = input.now ?? new Date();
  const [grant] = await db.select().from(trialGrants).where(eq(trialGrants.orgId, input.orgId)).limit(1);
  if (!grant) return { status: 'no_trial' };
  if (grant.trialDays > TRIAL_DAYS) return { status: 'already_extended' };

  const endsAt = new Date(grant.trialEndsAt.getTime() + TRIAL_DAYS * 86_400_000);
  await db
    .update(trialGrants)
    .set({ trialDays: grant.trialDays + TRIAL_DAYS, trialEndsAt: endsAt })
    .where(eq(trialGrants.orgId, input.orgId));
  // The audit log, not the events table: `specs/13` AC1 asserts the emitted
  // event set EQUALS the documented one, so a new event name is a spec change
  // and an admin action with a reason belongs in the audit trail anyway.
  await recordAudit(db, {
    orgId: input.orgId,
    action: 'trial_extended',
    entityTable: 'trial_grants',
    entityId: input.orgId,
    after: { reason: input.reason, endsAt: endsAt.toISOString(), at: now.toISOString() },
  });
  return { status: 'extended', endsAt };
}
