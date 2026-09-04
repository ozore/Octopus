/**
 * POST /api/stripe/webhook — the source of truth for entitlement.
 *
 * `dynamic = 'force-dynamic'` and the Node runtime are both required: the
 * handler reads the RAW body for signature verification and writes to Postgres.
 */
import '@/lib/platform';

import { createStripeWebhookHandler } from '@octopus/platform/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = createStripeWebhookHandler();
