/**
 * GET /login/callback?token=… — the link in the email.
 *
 * A route handler, not a page: exchanging the token must set an httpOnly
 * cookie, and a Server Component cannot write cookies.
 */
import '@/lib/platform';

import { createLoginCallbackHandler } from '@octopus/platform/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = createLoginCallbackHandler();
