/**
 * GET /admin?secret=… — signups, activation, conversion, MRR, churn.
 * Guarded by OPS_SHARED_SECRET, never by a customer account.
 */
import '@/lib/platform';

import { createAdminMetricsHandler } from '@octopus/platform/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = createAdminMetricsHandler();
