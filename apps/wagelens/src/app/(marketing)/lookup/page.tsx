import Link from 'next/link';
import { redirect } from 'next/navigation';

import { StandingDisclaimer } from '@/components/disclaimer';
import { LookupForm } from '@/components/lookup-form';
import { CorpusUnavailable } from '@/components/determination';
import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import { corpusHealth, listCounties, listStates } from '@/lib/kb';

export const dynamic = 'force-dynamic';

/**
 * `/lookup` — the widget, full page.
 *
 * When all three fields are chosen it REDIRECTS to
 * `/lookup/:state/:county/:type`, which is the page that renders. That is
 * deliberate: the result URL is the thing a person sends to their estimator and
 * the thing a search engine indexes, so it has to be a real address and not a
 * query string on a form endpoint.
 */
export default async function LookupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const state = typeof params['state'] === 'string' ? params['state'] : undefined;
  const county = typeof params['county'] === 'string' ? params['county'] : undefined;
  const type = typeof params['type'] === 'string' ? params['type'] : undefined;

  if (state && county) {
    redirect(`/lookup/${state.toLowerCase()}/${county}/${(type || 'all').toLowerCase()}`);
  }

  const db = await getDb();
  const [states, health] = await Promise.all([listStates(db), corpusHealth(db)]);
  const counties = state ? await listCounties(db, state) : [];
  await emitEvent(db, 'lookup_started', { props: { field_first_touched: state ? 'county' : 'state' } });

  return (
    <>
      <section className="wl-stack">
        <h1>What does this county pay?</h1>
        <p className="wl-lead">
          Pick a state, a county and a construction type. You get the classifications and the rates
          from the federal wage determination that covers them — with the determination number, the
          modification number and a link to the official document on SAM.gov. No login, no card, no
          email.
        </p>
      </section>

      {health.activeDeterminations === 0 ? (
        <CorpusUnavailable reason="Our copy of the determination corpus is empty or still loading." />
      ) : (
        <section className="wl-panel">
          <div className="wl-panel__body wl-stack">
            <LookupForm
              states={states}
              counties={counties}
              {...(state ? { selectedState: state } : {})}
              {...(county ? { selectedCounty: county } : {})}
              {...(type ? { selectedType: type } : {})}
            />
            {state && counties.length === 0 ? (
              <p className="wl-xs wl-muted">
                We do not hold the county list for {state} yet. The corpus is built one state at a
                time; the states above are the ones we can answer for today.
              </p>
            ) : null}
            {state ? null : (
              <p className="wl-xs wl-muted">
                Choose a state and press <strong>Show the rates</strong> to load its counties.
              </p>
            )}
          </div>
        </section>
      )}

      <section className="wl-panel">
        <header className="wl-panel__head">
          <h2>How to read a determination</h2>
        </header>
        <div className="wl-panel__body wl-stack wl-prose">
          <p>
            A <strong>general wage determination</strong> is a document, not a rate. It is identified
            by a number like <span className="wl-mono">TX20260253</span> and a{' '}
            <strong>modification number</strong>, and it lists every classification of worker on the
            job with the minimum hourly rate and the fringe benefit that must be paid for that class
            of work in that county.
          </p>
          <p>
            Geography narrows it; <strong>your contract decides it</strong>. About one county-and-type
            combination in eight is covered by more than one determination, so a page that promised
            you a single answer would be wrong in a way you could not detect. When that happens we
            show you the candidates and what tells them apart.
          </p>
          <p>
            <Link href="/help/find-your-wage-determination-number">
              Where to find your determination number →
            </Link>
          </p>
        </div>
      </section>

      <StandingDisclaimer />
    </>
  );
}
