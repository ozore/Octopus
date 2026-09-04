/**
 * GET /settings/profile/confirm?token=… — the link in the new address's inbox.
 *
 * A route handler and not a page, for the same reason the login callback is: it
 * has to be reachable from a mail client with no session, and it writes.
 */
import '@/lib/platform';

import { getDb } from '@/lib/db';
import { consumeEmailChange } from '@/lib/repos/settings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? '';
  if (!token) return Response.redirect(new URL('/settings/profile?error=invalid', url), 303);

  const result = await consumeEmailChange(await getDb(), { token });
  const query = result.status === 'changed' ? 'email=changed' : `error=${result.status}`;
  return Response.redirect(new URL(`/settings/profile?${query}`, url), 303);
}
