/**
 * The jobs the PLATFORM owns. An app registers these once
 * (`registerPlatformJobs(registry)`) and adds its own on top — WageLens's
 * knowledge-base refresh, Certly's document parse.
 *
 * All of them are emails or housekeeping, and all of them are idempotent: a
 * duplicate cron invocation (Vercel documents that delivery is best-effort and
 * may repeat) must not double-send.
 */

import { and, eq, gte, isNotNull, lte } from 'drizzle-orm';

import { getEntitlement } from '../billing/entitlement';
import type { Db } from '../db';
import { memberships, organisations, subscriptions, users } from '../db/schema';
import { brandFromEnv, sendEmail } from '../email/send';
import {
  paymentFailedEmail,
  paymentReceiptNoticeEmail,
  trialEndingEmail,
  welcomeEmail,
  notificationEmail,
} from '../email/templates';
import { purgeExpiredAuthRows } from '../auth/service';
import { pruneRateLimits } from '../auth/rate-limit';
import type { PlatformContext } from '../runtime';
import { enqueue } from './queue';
import type { JobRegistry } from './registry';

export const PLATFORM_JOB_KINDS = {
  welcomeEmail: 'platform.welcome_email',
  subscriptionActiveEmail: 'platform.subscription_active_email',
  paymentFailedEmail: 'platform.payment_failed_email',
  trialEndingEmail: 'platform.trial_ending_email',
  notificationEmail: 'platform.notification_email',
  housekeeping: 'platform.housekeeping',
} as const;

type ContextProvider = () => Promise<PlatformContext>;

/** Every recipient who can act on billing for an organisation. */
async function ownerEmails(db: Db, orgId: string): Promise<string[]> {
  const rows = await db
    .select({ email: users.email, role: memberships.role })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.orgId, orgId));
  const owners = rows.filter((r) => r.role === 'owner').map((r) => r.email);
  return owners.length > 0 ? owners : rows.map((r) => r.email);
}

export function registerPlatformJobs(registry: JobRegistry, getContext: ContextProvider): JobRegistry {
  registry.override(PLATFORM_JOB_KINDS.welcomeEmail, async (payload) => {
    const { db, adapters, env, config } = await getContext();
    const email = String(payload['email'] ?? '');
    if (!email) return;
    const firstStep = config.firstStep ?? { url: `${env.APP_BASE_URL}/dashboard`, label: 'Open your dashboard' };
    await sendEmail(db, adapters, {
      to: email,
      content: welcomeEmail(brandFromEnv(env), {
        firstStepUrl: firstStep.url,
        firstStepLabel: firstStep.label,
      }),
      tags: { kind: 'welcome' },
    });
  });

  registry.override(PLATFORM_JOB_KINDS.subscriptionActiveEmail, async (payload) => {
    const { db, adapters, env, config } = await getContext();
    const orgId = String(payload['orgId'] ?? '');
    if (!orgId) return;
    const planKey = String(payload['planKey'] ?? 'subscription');
    const planName = config.plans?.plans.find((p) => p.key === planKey)?.name ?? 'subscription';
    for (const to of await ownerEmails(db, orgId)) {
      await sendEmail(db, adapters, {
        to,
        content: paymentReceiptNoticeEmail(brandFromEnv(env), {
          planName,
          portalUrl: `${env.APP_BASE_URL}/settings/billing`,
        }),
        tags: { kind: 'subscription_active', org_id: orgId },
      });
    }
  });

  registry.override(PLATFORM_JOB_KINDS.paymentFailedEmail, async (payload) => {
    const { db, adapters, env } = await getContext();
    const orgId = String(payload['orgId'] ?? '');
    if (!orgId) return;
    for (const to of await ownerEmails(db, orgId)) {
      await sendEmail(db, adapters, {
        to,
        content: paymentFailedEmail(brandFromEnv(env), {
          manageUrl: `${env.APP_BASE_URL}/settings/billing`,
        }),
        tags: { kind: 'payment_failed', org_id: orgId },
      });
    }
  });

  registry.override(PLATFORM_JOB_KINDS.trialEndingEmail, async (payload) => {
    const { db, adapters, env, config } = await getContext();
    const orgId = String(payload['orgId'] ?? '');
    if (!orgId) return;
    const daysLeft = Number(payload['daysLeft'] ?? 3);
    const planName = config.plans
      ? (await getEntitlement(db, orgId, { plans: config.plans, env })).planName
      : 'subscription';
    for (const to of await ownerEmails(db, orgId)) {
      await sendEmail(db, adapters, {
        to,
        content: trialEndingEmail(brandFromEnv(env), {
          planName,
          daysLeft,
          manageUrl: `${env.APP_BASE_URL}/settings/billing`,
        }),
        tags: { kind: 'trial_ending', org_id: orgId },
      });
    }
  });

  registry.override(PLATFORM_JOB_KINDS.notificationEmail, async (payload) => {
    const { db, adapters, env } = await getContext();
    const to = String(payload['to'] ?? '');
    if (!to) return;
    await sendEmail(db, adapters, {
      to,
      content: notificationEmail(brandFromEnv(env), {
        subject: String(payload['subject'] ?? `${env.APP_NAME} notification`),
        paragraphs: (payload['paragraphs'] as string[] | undefined) ?? [],
        ...(payload['actionUrl'] ? { actionUrl: String(payload['actionUrl']) } : {}),
        ...(payload['actionLabel'] ? { actionLabel: String(payload['actionLabel']) } : {}),
      }),
      tags: { kind: 'notification' },
    });
  });

  /**
   * The daily tick. Two things that would otherwise need their own schedules:
   * expiry purging, and finding trials that are about to end — Stripe sends its
   * own `customer.subscription.trial_will_end` webhook, but relying on it means
   * the customer's warning depends on a vendor event we cannot replay.
   */
  registry.override(PLATFORM_JOB_KINDS.housekeeping, async () => {
    const { db } = await getContext();
    const now = new Date();
    await purgeExpiredAuthRows(db, now);
    await pruneRateLimits(db, new Date(now.getTime() - 24 * 3600 * 1000));

    const soon = new Date(now.getTime() + 3 * 24 * 3600 * 1000);
    const ending = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'trialing'),
          isNotNull(subscriptions.trialEndsAt),
          gte(subscriptions.trialEndsAt, now),
          lte(subscriptions.trialEndsAt, soon),
        ),
      );

    for (const sub of ending) {
      const daysLeft = Math.max(
        1,
        Math.ceil(((sub.trialEndsAt as Date).getTime() - now.getTime()) / (24 * 3600 * 1000)),
      );
      await enqueue(db, {
        kind: PLATFORM_JOB_KINDS.trialEndingEmail,
        payload: { orgId: sub.orgId, daysLeft },
        // One warning per subscription per day, whatever the cron does.
        dedupeKey: `${PLATFORM_JOB_KINDS.trialEndingEmail}:${sub.id}:${now.toISOString().slice(0, 10)}`,
      });
    }
  });

  return registry;
}

/** Convenience for an app's own notifications. */
export async function enqueueNotification(
  db: Db,
  input: {
    to: string;
    subject: string;
    paragraphs: string[];
    actionUrl?: string;
    actionLabel?: string;
    runAfter?: Date;
    dedupeKey?: string;
  },
): Promise<void> {
  await enqueue(db, {
    kind: PLATFORM_JOB_KINDS.notificationEmail,
    payload: { ...input },
    ...(input.runAfter ? { runAfter: input.runAfter } : {}),
    ...(input.dedupeKey ? { dedupeKey: input.dedupeKey } : {}),
  });
}

export async function organisationName(db: Db, orgId: string): Promise<string | undefined> {
  const [row] = await db
    .select({ name: organisations.name })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);
  return row?.name;
}
