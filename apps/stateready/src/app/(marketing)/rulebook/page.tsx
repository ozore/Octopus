import type { Metadata } from 'next';
import Link from 'next/link';

import { CTA_LABEL, CTA_MICROCOPY, DEMO } from '@/components/marketing/copy';
import { buildRulebook, TRADE_LABEL } from '@/components/marketing/data';
import { LANDING_EVENTS } from '@/components/marketing/events';
import {
  DEMO_DEFAULT_STATE,
  DEMO_DEFAULT_TRADE,
  RulebookPicker,
  RulebookResultPanel,
} from '@/components/marketing/rulebook';
import { allowDemoLookup, recordLandingEvent } from '@/components/marketing/track';
import { getEnv } from '@/env';
import { isTrade, JURISDICTION_NAMES, listKbRecords } from '@/lib/kb/accessors';
import type { Trade } from '@/lib/kb/types';

import '../landing.css';

/**
 * `/rulebook?state=tx&trade=hvac` — the no-login demo as its own page
 * (`LANDING_SPEC.md` §12; `BUILD.md` names the route `rulebook`, the spec's
 * deep links say `/demo`, and `/demo` redirects here so both are true).
 *
 * **Server-rendered, deep-linkable and correct with JavaScript off.** The
 * picker is a GET form that lands here, so every state × trade combination is a
 * shareable, indexable URL with its own title and description — the
 * programmatic-SEO asset falls out of the demo for free, and an outbound email
 * can link a prospect straight to the two states their last acquisition added.
 *
 * **Rate limited, and never with a prompt.** §12.2 forbids asking a stranger
 * for anything at all, so the limit is invisible in normal use (sixty lookups
 * per connection per ten minutes) and when it trips the page says one plain
 * sentence and keeps working. It exists to stop a script walking every
 * combination in a loop, not to gate a human. See `track.ts`.
 */
export const dynamic = 'force-dynamic';

function readParams(params: Record<string, string | string[] | undefined>): { state: string; trade: Trade } {
  const rawState = typeof params['state'] === 'string' ? params['state'] : DEMO_DEFAULT_STATE;
  const rawTrade = typeof params['trade'] === 'string' ? params['trade'] : DEMO_DEFAULT_TRADE;
  const state = rawState.toUpperCase().slice(0, 2);
  return {
    state: JURISDICTION_NAMES[state] ? state : DEMO_DEFAULT_STATE,
    trade: isTrade(rawTrade) ? rawTrade : DEMO_DEFAULT_TRADE,
  };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { state, trade } = readParams(await searchParams);
  const stateName = JURISDICTION_NAMES[state] ?? state;
  const tradeLabel = TRADE_LABEL[trade];
  return {
    title: `${stateName} ${tradeLabel} licensing rules — renewal, CE and what the board does not publish`,
    description:
      `What ${stateName} requires of a ${tradeLabel} contractor: licence classes, renewal cycle and ` +
      'continuing education, each with the board page it came from and the day we last checked it.',
    alternates: { canonical: `/rulebook?state=${state.toLowerCase()}&trade=${trade}` },
  };
}

export default async function RulebookPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { state, trade } = readParams(params);
  const env = getEnv();
  const today = new Date().toISOString().slice(0, 10);
  const coveredStates = [...new Set(listKbRecords().map((record) => record.state))];

  const verdict = await allowDemoLookup();
  const result = verdict.allowed ? buildRulebook(state, trade, today) : null;

  if (result) {
    await recordLandingEvent(LANDING_EVENTS.demoQuery, {
      state,
      trade,
      was_covered: result.covered,
      result_count: result.covered ? result.licenceTypeCount : 0,
      source: 'rulebook_route',
    });
  }

  return (
    <main className="lp">
      <section className="lp-demo" id="demo">
        <h1>{DEMO.heading}</h1>
        <p className="lp-demo__instruction">{DEMO.instruction}</p>
        <RulebookPicker action="/rulebook" coveredStates={coveredStates} state={state} trade={trade} />
        {result ? (
          <RulebookResultPanel result={result} today={today} supportEmail={env.SUPPORT_EMAIL} />
        ) : (
          <p className="lp-demo__result" data-testid="demo-rate-limited">
            That is a lot of lookups from this connection in the last few minutes. Nothing is locked and
            nothing is asked of you — give it a moment and ask again, or read{' '}
            <Link href="/coverage">the coverage page</Link> meanwhile.
          </p>
        )}
        <p className="lp-cta">
          <Link className="sr-btn sr-btn--primary" data-cta="rulebook" href="/login?from=lp&placement=rulebook">
            {CTA_LABEL}
          </Link>
          <span className="lp-cta__micro">{CTA_MICROCOPY}</span>
        </p>
        <p className="small">
          <Link href="/">Back to the front page</Link> · <Link href="/coverage">Everything we cover</Link>
        </p>
      </section>
    </main>
  );
}
