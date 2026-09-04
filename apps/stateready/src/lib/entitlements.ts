/**
 * What this organisation may do — `specs/09` §Server actions (`getEntitlements`)
 * and §Validation.
 *
 * THE PRIMARY LIMIT IS STATES. A state × trade is a rulebook we maintain, so
 * states are the actual cost driver and "we're in seven states" is the buyer's
 * own sentence (`OFFER.md` §7, H8). **Technicians are a fair-use guardrail, not
 * a price metric**: over the band the message is "let us move you up", and the
 * block only lands at twice the band — because a customer must never be stopped
 * from recording a licence they legally hold.
 *
 * THREE STATES OF ACCESS, NOT TWO. The platform's `Entitlement` carries
 * `active` and `inGrace`; the app-managed no-card trial adds a third —
 * **read-only**, where writes stop and reads and exports do not (`specs/09`
 * AC2, platform request P-3). Holding a customer's compliance data hostage is
 * both wrong and, for this buyer, unforgivable.
 *
 * Everything here reads OUR mirror. No page, action or job asks Stripe what a
 * customer may do.
 */

import { and, desc, eq } from 'drizzle-orm';
import { count } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';
import { events } from '@octopus/platform/db';
import { getEntitlement, limitOf, type Entitlement } from '@octopus/platform/billing';

import { getEnv } from '@/env';
import { ENTERPRISE_STATE_THRESHOLD, plans } from './plans';
import { operatingStates, technicians } from './schema';
import { trialState, type TrialState } from './trial';

/** `specs/09` AC5: a card that expires must not cost a customer a licence. */
export const PAST_DUE_GRACE_DAYS = 7;

/** Over the band we ask; at twice the band we stop. Never on the 26th technician. */
export const TECHNICIAN_HARD_BLOCK_MULTIPLE = 2;

export type StateReadyEntitlements = {
  planKey: string;
  planName: string;
  status: string;
  stateLimit: number;
  technicianLimit: number;
  statesUsed: number;
  techniciansUsed: number;
  canAddState: boolean;
  canAddTechnician: boolean;
  /** Over the fair-use band but not blocked — the softer message. */
  technicianGuardrailExceeded: boolean;
  /** Above the published ladder entirely: a route, not a wall. */
  needsEnterprise: boolean;
  /** Writes refused; reads and exports never are. */
  readOnly: boolean;
  readOnlyReason: 'trial_ended' | 'past_due' | null;
  inGrace: boolean;
  graceEndsAt: Date | null;
  trial: TrialState;
  entitlement: Entitlement;
};

async function distinctStateCount(db: Db, orgId: string): Promise<number> {
  const rows = await db
    .select({ state: operatingStates.state })
    .from(operatingStates)
    .where(eq(operatingStates.orgId, orgId));
  return new Set(rows.map((r) => r.state)).size;
}

async function technicianCount(db: Db, orgId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(technicians)
    .where(and(eq(technicians.orgId, orgId), eq(technicians.status, 'active')));
  return Number(row?.value ?? 0);
}

/** When the dunning clock started, from the event we recorded at the time. */
async function lastPaymentFailure(db: Db, orgId: string): Promise<Date | null> {
  const rows = await db
    .select({ ts: events.ts })
    .from(events)
    .where(and(eq(events.orgId, orgId), eq(events.name, 'payment_failed')))
    .orderBy(desc(events.ts))
    .limit(1);
  return rows[0]?.ts ?? null;
}

export async function getEntitlements(
  db: Db,
  orgId: string,
  options: { now?: Date } = {},
): Promise<StateReadyEntitlements> {
  const now = options.now ?? new Date();
  const entitlement = await getEntitlement(db, orgId, { plans, env: getEnv() });
  const hasPaidSubscription = entitlement.active && entitlement.planKey !== 'free';
  const trial = await trialState(db, orgId, { now, hasPaidSubscription });

  const stateLimit = Number(limitOf(entitlement, 'states', 1));
  const technicianLimit = Number(limitOf(entitlement, 'technicians', 25));
  const statesUsed = await distinctStateCount(db, orgId);
  const techniciansUsed = await technicianCount(db, orgId);

  // past_due keeps the product working while Stripe retries, then stops writes.
  const failedAt = entitlement.inGrace ? await lastPaymentFailure(db, orgId) : null;
  const graceEndsAt = failedAt ? new Date(failedAt.getTime() + PAST_DUE_GRACE_DAYS * 86_400_000) : null;
  const pastDueExpired = Boolean(graceEndsAt && now.getTime() > graceEndsAt.getTime());

  const readOnly = pastDueExpired || (!hasPaidSubscription && trial.readOnly);
  const readOnlyReason = readOnly ? (pastDueExpired ? 'past_due' : 'trial_ended') : null;

  return {
    planKey: hasPaidSubscription ? entitlement.planKey : trial.onTrial ? 'trial' : entitlement.planKey,
    planName: hasPaidSubscription ? entitlement.planName : trial.onTrial ? 'Trial' : entitlement.planName,
    status: hasPaidSubscription ? entitlement.status : trial.onTrial ? 'trialing' : entitlement.status,
    stateLimit,
    technicianLimit,
    statesUsed,
    techniciansUsed,
    canAddState: !readOnly && statesUsed < stateLimit,
    canAddTechnician: !readOnly && techniciansUsed < technicianLimit * TECHNICIAN_HARD_BLOCK_MULTIPLE,
    technicianGuardrailExceeded: techniciansUsed >= technicianLimit,
    needsEnterprise: statesUsed >= ENTERPRISE_STATE_THRESHOLD,
    readOnly,
    readOnlyReason,
    inGrace: entitlement.inGrace && !pastDueExpired,
    graceEndsAt,
    trial,
    entitlement,
  };
}

export type LimitRefusal = {
  limit: 'states' | 'technicians';
  requested: number;
  allowed: number;
  /** The exact number that has to change (`specs/09` §Validation). */
  message: string;
  /** Above the published ladder there is a real route, not a dead end. */
  enterprise: boolean;
};

/**
 * The state limit, answered with the number that has to change.
 *
 * *"Multi-State covers 5 states; you operate in 7."* A refusal that does not
 * name the number is a refusal the customer has to guess at.
 */
export function refuseStates(
  ent: Pick<StateReadyEntitlements, 'planName' | 'stateLimit'>,
  requested: number,
): LimitRefusal | null {
  if (requested <= ent.stateLimit) return null;
  const enterprise = requested > ENTERPRISE_STATE_THRESHOLD;
  return {
    limit: 'states',
    requested,
    allowed: ent.stateLimit,
    enterprise,
    message: enterprise
      ? `Above ${ENTERPRISE_STATE_THRESHOLD} states we quote rather than publish a price. Ask for an Enterprise quote and we answer within two business days, or we tell you we cannot help.`
      : `${ent.planName} covers ${ent.stateLimit} state${ent.stateLimit === 1 ? '' : 's'}; you operate in ${requested}.`,
  };
}

/** The guardrail: a warning, and a block only at twice the band. */
export function refuseTechnicians(
  ent: Pick<StateReadyEntitlements, 'planName' | 'technicianLimit'>,
  requested: number,
): { blocked: boolean; warn: boolean; message: string | null } {
  const hard = ent.technicianLimit * TECHNICIAN_HARD_BLOCK_MULTIPLE;
  if (requested > hard) {
    return {
      blocked: true,
      warn: true,
      message: `${ent.planName} is banded at ${ent.technicianLimit} technicians and you are recording ${requested}. Move up a plan and we will lift it immediately.`,
    };
  }
  if (requested > ent.technicianLimit) {
    return {
      blocked: false,
      warn: true,
      message: `You are over the ${ent.technicianLimit}-technician fair-use band — let us move you up. Nothing stops working in the meantime.`,
    };
  }
  return { blocked: false, warn: false, message: null };
}

/**
 * The one gate every write path calls. Reads and exports never reach it
 * (`specs/09` §Validation).
 */
export function assertWritable(ent: Pick<StateReadyEntitlements, 'readOnly' | 'readOnlyReason'>): void {
  if (!ent.readOnly) return;
  throw new ReadOnlyError(
    ent.readOnlyReason === 'past_due'
      ? 'Your last payment did not go through and the retry window has closed. Your data is all here and exports still work — update the card to start writing again.'
      : 'Your trial has ended. Your data is all here and exports still work — choose a plan to start writing again.',
  );
}

export class ReadOnlyError extends Error {
  readonly code = 'read_only';
  constructor(message: string) {
    super(message);
    this.name = 'ReadOnlyError';
  }
}
