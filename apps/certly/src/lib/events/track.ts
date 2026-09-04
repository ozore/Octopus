/**
 * The ONE call site for a product or landing event.
 *
 * Two properties, both from `specs/00`:
 *
 *  1. **The name is a literal from the generated union.** `EventName` is
 *     emitted from `specs/00-event-vocabulary.md`, so a typo is a compile error
 *     rather than a hole in a funnel nobody notices for a month.
 *  2. **No PII, ever.** No email address, no vendor name, no insured name, no
 *     certificate value. `sanitiseProps` is a mechanical guard rather than a
 *     convention, because the failure mode is one hurried `props: { email }`
 *     in a route handler at 1am.
 *
 * `track()` itself never throws into the path it measures (the platform's
 * guarantee); this wrapper keeps that property.
 */

import { track as platformTrack } from '@octopus/platform/events';

import type { Db } from '@/lib/db';
import type { EventName } from './names';

/** Keys that carry a person or a customer's document content, by name. */
const BANNED_KEYS =
  /^(email|e_mail|address|phone|vendor_name|insured_name|producer|holder|certificate_holder|policy_number|name|query|user_agent|ip)$/i;

const EMAIL_SHAPED = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export function sanitiseProps(props: Record<string, unknown> = {}): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (BANNED_KEYS.test(key)) continue;
    if (typeof value === 'string') {
      if (EMAIL_SHAPED.test(value)) continue;
      // A free-text value is a leak waiting to happen; a bounded one is a fact.
      clean[key] = value.slice(0, 64);
      continue;
    }
    if (value === null || ['number', 'boolean'].includes(typeof value)) clean[key] = value;
  }
  return clean;
}

export type TrackEventInput = {
  name: EventName;
  orgId?: string | null;
  userId?: string | null;
  props?: Record<string, unknown>;
  ts?: Date;
};

export async function trackEvent(db: Db, input: TrackEventInput): Promise<void> {
  await platformTrack(db, {
    name: input.name,
    orgId: input.orgId ?? null,
    userId: input.userId ?? null,
    props: sanitiseProps(input.props),
    ...(input.ts ? { ts: input.ts } : {}),
  });
}

export type { EventName };
