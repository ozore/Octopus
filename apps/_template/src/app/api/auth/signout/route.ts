import '@/lib/platform';

import { createSignOutHandler } from '@octopus/platform/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = createSignOutHandler({ redirectTo: '/' });
