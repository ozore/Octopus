/**
 * Onboarding state, and the ONE place `activated` is emitted.
 *
 * `specs/11` §2 is the canonical and only definition of activation in the whole
 * folder (REVIEW.md B-05): **one comparison against a certificate the org
 * uploaded, with the extraction out of `needs_review`**, emitted once per org
 * by the comparison path and never by the UI. Three rival definitions were
 * retired — the four-condition trial checklist (one of whose conditions
 * requires a gap to EXIST, which would make a clean portfolio a failed
 * activation and a self-inflicted STOP), `first_status_rendered` (a UI event),
 * and `LANDING_SPEC.md`'s own trio.
 *
 * So `markActivated` lives beside the comparison, takes the comparison's own
 * counts, and is idempotent on `onboarding_state.activated_at`.
 */

import { and, count, eq, isNotNull } from 'drizzle-orm';

import type { Db } from '@/lib/db';
import { trackEvent } from '@/lib/events';
import { comparisons, onboardingState, orgSettings } from '@/lib/schema';
import { ensureOrgSettings } from '@/lib/repos';
import { organisations } from '@octopus/platform/db';
import {
  ONBOARDING_STEPS,
  completedCount,
  resumeStep,
  type OnboardingStep,
  type StepsCompleted,
} from './steps';

export type OnboardingView = {
  orgId: string;
  audience: string | null;
  steps: StepsCompleted;
  completed: number;
  total: number;
  resume: OnboardingStep;
  skippedAt: Date | null;
  activatedAt: Date | null;
  firstCertificateId: string | null;
  startedAt: Date;
};

export async function ensureOnboarding(db: Db, orgId: string): Promise<OnboardingView> {
  const [existing] = await db
    .select()
    .from(onboardingState)
    .where(eq(onboardingState.orgId, orgId))
    .limit(1);

  const row =
    existing ??
    (
      await db
        .insert(onboardingState)
        .values({ orgId })
        .onConflictDoNothing({ target: onboardingState.orgId })
        .returning()
    )[0] ??
    (await db.select().from(onboardingState).where(eq(onboardingState.orgId, orgId)).limit(1))[0];

  const settings = await ensureOrgSettings(db, orgId);
  const steps = (row?.stepsCompleted ?? {}) as StepsCompleted;

  return {
    orgId,
    audience: settings.audience,
    steps,
    completed: completedCount(steps),
    total: ONBOARDING_STEPS.length,
    resume: resumeStep(steps),
    skippedAt: row?.skippedAt ?? null,
    activatedAt: row?.activatedAt ?? null,
    firstCertificateId: row?.firstCertificateId ?? null,
    startedAt: row?.startedAt ?? new Date(),
  };
}

export async function completeStep(
  db: Db,
  input: { orgId: string; step: OnboardingStep; seconds?: number },
): Promise<OnboardingView> {
  const current = await ensureOnboarding(db, input.orgId);
  const steps: StepsCompleted = { ...current.steps, [input.step]: true };
  await db
    .update(onboardingState)
    .set({ stepsCompleted: steps, updatedAt: new Date() })
    .where(eq(onboardingState.orgId, input.orgId));

  await trackEvent(db, {
    name: 'onboarding_step_completed',
    orgId: input.orgId,
    props: { step: input.step, seconds: input.seconds ?? 0 },
  });

  return ensureOnboarding(db, input.orgId);
}

export async function startOnboarding(
  db: Db,
  input: { orgId: string; audience: string },
): Promise<void> {
  await ensureOnboarding(db, input.orgId);
  await trackEvent(db, {
    name: 'onboarding_started',
    orgId: input.orgId,
    props: { audience: input.audience },
  });
}

export async function skipOnboarding(db: Db, orgId: string): Promise<void> {
  const view = await ensureOnboarding(db, orgId);
  await db
    .update(onboardingState)
    .set({ skippedAt: new Date(), updatedAt: new Date() })
    .where(eq(onboardingState.orgId, orgId));
  const last = [...ONBOARDING_STEPS].reverse().find((step) => view.steps[step]) ?? 'none';
  await trackEvent(db, {
    name: 'onboarding_skipped',
    orgId,
    props: { last_step: last },
  });
}

export async function setAudience(db: Db, input: { orgId: string; audience: string }): Promise<void> {
  await ensureOrgSettings(db, input.orgId);
  await db
    .update(orgSettings)
    .set({ audience: input.audience, updatedAt: new Date() })
    .where(eq(orgSettings.orgId, input.orgId));
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

export type ActivationInput = {
  orgId: string;
  certificateId: string | null;
  gapsFound: number;
  /** `false` when the extraction is still `needs_review` — A5: never before. */
  reviewCleared: boolean;
};

/**
 * A4/A5/A8/A8b: emitted ONCE per org, after a comparison against a certificate
 * the org uploaded whose extraction is out of review — and emitted even when
 * the comparison found ZERO gaps, because a clean portfolio is an activation
 * rather than a failure.
 */
export async function markActivated(
  db: Db,
  input: ActivationInput,
): Promise<{ status: 'activated' | 'already' | 'not_yet'; minutesFromSignup?: number }> {
  if (!input.reviewCleared) return { status: 'not_yet' };

  const view = await ensureOnboarding(db, input.orgId);
  if (view.activatedAt) return { status: 'already' };

  const now = new Date();
  const [org] = await db
    .select({ createdAt: organisations.createdAt })
    .from(organisations)
    .where(eq(organisations.id, input.orgId))
    .limit(1);
  const minutesFromSignup = org
    ? Math.max(0, Math.round((now.getTime() - org.createdAt.getTime()) / 60_000))
    : 0;

  const [vendorsAtActivation] = await db
    .select({ value: count() })
    .from(comparisons)
    .where(eq(comparisons.orgId, input.orgId));

  await db
    .update(onboardingState)
    .set({
      activatedAt: now,
      firstCertificateId: input.certificateId,
      updatedAt: now,
    })
    .where(and(eq(onboardingState.orgId, input.orgId), eq(onboardingState.orgId, input.orgId)));

  await trackEvent(db, {
    name: 'activated',
    orgId: input.orgId,
    props: {
      minutes_from_signup: minutesFromSignup,
      vendors_at_activation: Number(vendorsAtActivation?.value ?? 0),
      gaps_found: input.gapsFound,
    },
  });

  return { status: 'activated', minutesFromSignup };
}

/** Admin/metrics helper: has this org activated? */
export async function activatedOrgCount(db: Db): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(onboardingState)
    .where(isNotNull(onboardingState.activatedAt));
  return Number(row?.value ?? 0);
}
