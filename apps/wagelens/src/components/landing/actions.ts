'use server';

/**
 * The landing page's one write: an analytics row.
 *
 * A server action rather than a public JSON route, for two reasons. It keeps
 * the page's promise that `/api/public/counties` is the only public JSON
 * surface (BUILD.md §1), and it means the browser cannot name an event: the
 * action refuses anything outside `LANDING_CLIENT_EVENTS`, and `emitEvent`
 * refuses anything outside `WL-EVENTS.md`. Two gates, neither of them the
 * caller's.
 *
 * **Nothing the visitor types is transmitted.** The ledger in §3 computes in
 * the browser and reports `ledger_used` with no values at all; the prop filter
 * below drops any key that is not in the tiny allow-list, so a future edit
 * cannot start sending them by accident.
 */

import { isLandingClientEvent, LANDING_PROP_KEYS } from './events';
import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';

const ALLOWED_KEYS = new Set<string>(LANDING_PROP_KEYS);

export async function recordLandingEvent(
  name: string,
  props: Record<string, unknown> = {},
): Promise<void> {
  if (!isLandingClientEvent(name)) return;
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (typeof value === 'string' && value.length <= 64) safe[key] = value;
    else if (typeof value === 'number' && Number.isFinite(value)) safe[key] = value;
  }
  const db = await getDb();
  await emitEvent(db, name, { props: safe });
}
