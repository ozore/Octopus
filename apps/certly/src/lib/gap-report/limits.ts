/**
 * The free report's limits, audiences and labels.
 *
 * They live in their OWN module, apart from `sessions.ts`, because the public
 * form is a client component and `sessions.ts` reaches Postgres, the rate
 * limiter and `node:crypto`. A client component that imports a module which
 * imports those pulls the whole server graph into the browser bundle, and the
 * build fails on `node:` imports rather than shipping them, which is the right
 * failure. Everything here is a constant or a type guard: no database, no
 * request, no secret.
 */

import type { Audience } from '../templates';

export const MAX_DOCUMENTS_PER_SESSION = 25;
export const MAX_SESSION_BYTES = 50 * 1024 * 1024;
export const SESSIONS_PER_IP_PER_DAY = 3;
export const DOCUMENTS_PER_IP_PER_DAY = 100;
export const PURGE_AFTER_DAYS = 7;

/** The four audiences and the library template each one starts from (§2). */
export const AUDIENCE_TEMPLATE: Record<Audience, string> = {
  pm: 'pm.baseline',
  hoa: 'hoa.baseline',
  gc: 'gc.baseline',
  tenant: 'tenant.commercial.baseline',
};

export const AUDIENCE_LABEL: Record<Audience, string> = {
  pm: 'property manager',
  hoa: 'HOA manager',
  gc: 'general contractor',
  tenant: 'commercial landlord',
};

export function isAudience(value: unknown): value is Audience {
  return typeof value === 'string' && value in AUDIENCE_TEMPLATE;
}
