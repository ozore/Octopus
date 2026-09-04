/**
 * POST /api/auth/request — { email, redirectTo? }.
 *
 * The JSON twin of the login form's action. `magic_link_requested` and
 * `magic_link_sent` are emitted here rather than inside the platform, because
 * the platform's own names (`signup_requested`, `login_requested`) are a
 * different vocabulary and `specs/13` AC1 asserts the app emits the set
 * `specs/01`–`specs/12` document.
 *
 * The RESPONSE SHAPE IS UNCHANGED and must stay so: it is identical whether or
 * not the address has an account, because a login endpoint that distinguishes
 * them is an account-enumeration oracle.
 */
import '@/lib/platform';

import { getDb } from '@octopus/platform/db';
import { track } from '@octopus/platform/events';
import { createLoginRequestHandler } from '@octopus/platform/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const handler = createLoginRequestHandler();

export async function POST(request: Request): Promise<Response> {
  const response = await handler(request.clone());
  const db = await getDb();
  await track(db, { name: 'magic_link_requested', props: { status: response.status } });
  if (response.ok) await track(db, { name: 'magic_link_sent', props: {} });
  return response;
}
