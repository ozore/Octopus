/**
 * GET /api/cron/drain — the queue drain, called by Vercel Cron (vercel.json).
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET`. POST is accepted too, so
 * an operator can trigger a drain by hand during an incident.
 */
import '@/lib/platform';

import { createCronDrainHandler } from '@octopus/platform/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
/** Bounded work per invocation; Vercel kills the function at the plan limit. */
export const maxDuration = 60;

const handler = createCronDrainHandler();

export const GET = handler;
export const POST = handler;
