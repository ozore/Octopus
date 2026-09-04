import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { LANDING_EVENTS } from '@/components/marketing/events';
import { buildLandingData, Landing } from '@/components/marketing/landing';
import { recordLandingEvent } from '@/components/marketing/track';
import { getEnv } from '@/env';

import './landing.css';

/**
 * `/` — the landing page (M15, `LANDING_SPEC.md`).
 *
 * The copy deck, the five visuals and the demo live in
 * `src/components/marketing/`; this route is the thin part: read the
 * environment, read the clock once, assemble the data, record `lp_view`.
 *
 * **`force-dynamic`, and for two reasons rather than one.** The page reads
 * `APP_NAME`, `COMPANY_ADDRESS` and the support address at request time
 * (Twelve-Factor III — prerendering would bake one deploy's values into the
 * bundle and would fail the build in CI, where no environment is set); and the
 * coverage counter, the divergence card and the demo are read from the
 * knowledge base against **today's** civil date, so the 180-day staleness rule
 * is applied on the day the visitor arrives rather than on the day we deployed.
 *
 * There is no third-party request on this page and no client framework: the
 * only script is ~1 KB of inline instrumentation posting to our own endpoint,
 * and the page is fully functional without it.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Every licence, every state, with the board page it came from',
  description:
    'StateReady tracks every licence and CE hour your crews hold, in every state you work in — each ' +
    'date shown with the board page it came from and the day we last checked it. Try it without ' +
    'signing up.',
};

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const env = getEnv();
  const today = new Date().toISOString().slice(0, 10);
  const billing = params['billing'] === 'monthly' ? 'monthly' : 'annual';

  const data = buildLandingData({
    today,
    billing,
    appName: env.APP_NAME,
    companyName: env.COMPANY_NAME,
    companyAddress: env.COMPANY_ADDRESS,
    supportEmail: env.SUPPORT_EMAIL,
  });

  const headerList = await headers();
  const utm = Object.fromEntries(
    Object.entries(params).filter(([key]) => key.startsWith('utm_')).map(([key, value]) => [key, String(value)]),
  );
  await recordLandingEvent(LANDING_EVENTS.view, {
    referrer: headerList.get('referer') ?? null,
    campaign: typeof params['c'] === 'string' ? params['c'] : (utm['utm_campaign'] ?? null),
    ...utm,
  });

  return <Landing data={data} />;
}
