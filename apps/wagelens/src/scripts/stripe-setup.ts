/**
 * Generates STRIPE_SETUP.md from this app's plan map and its price catalogue:
 *
 *   npm run stripe:setup --workspace apps/wagelens > STRIPE_SETUP.md
 *
 * The founder creates the products by hand (PLAN.md D2); this removes every
 * judgement call from that job and cannot drift from the code, because it IS
 * the code. Two sources, in this order:
 *
 *  1. **The platform's `renderStripeSetup()`** — the products this deployment
 *     can sell, their env variables, the Portal, the webhook endpoint and the
 *     events it subscribes to.
 *  2. **This app's catalogue** (`src/lib/billing/catalogue.ts`) — the four
 *     things the platform's generator cannot know: the lookup keys, the price
 *     metadata, the annual prices, and the tier that is published and NOT for
 *     sale. OFFER.md §10 is the source; the boot assertion is the enforcement.
 *
 * The output contains no secret and no price id — only names.
 */
import { renderStripeSetup } from '@octopus/platform/billing';

import { plans } from '../lib/plans';
import { renderCatalogue } from '../lib/billing/catalogue';

const project = process.env['VERCEL_PROJECT'] ?? `octopus-${process.env['APP_SLUG'] ?? 'wagelens'}`;
const baseUrl = process.env['APP_BASE_URL'] ?? `https://${project}.vercel.app`;

const core = renderStripeSetup(plans, { vercelProject: project, appBaseUrl: baseUrl });

process.stdout.write(`${core}\n${renderCatalogue(plans.appName)}`);
