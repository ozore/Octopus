/**
 * Generates STRIPE_SETUP.md from this app's plan map:
 *
 *   npm run stripe:setup --workspace apps/wagelens > STRIPE_SETUP.md
 *
 * The founder creates the products by hand (PLAN.md D2); this removes every
 * judgement call from that job and cannot drift from the code, because it IS
 * the code.
 */
import { renderStripeSetup } from '@octopus/platform/billing';

import { plans } from '../lib/plans';

const project = process.env['VERCEL_PROJECT'] ?? `octopus-${process.env['APP_SLUG'] ?? 'wagelens'}`;
const baseUrl = process.env['APP_BASE_URL'] ?? `https://${project}.vercel.app`;

process.stdout.write(renderStripeSetup(plans, { vercelProject: project, appBaseUrl: baseUrl }));
