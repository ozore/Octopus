import '@/lib/platform';

import { createLoginRequestHandler } from '@octopus/platform/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** POST { email, redirectTo? } — the JSON twin of the login form's action. */
export const POST = createLoginRequestHandler();
