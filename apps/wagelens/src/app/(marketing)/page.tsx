import Link from 'next/link';

import { StandingDisclaimer } from '@/components/disclaimer';
import { LookupForm } from '@/components/lookup-form';
import { productName } from '@/env';
import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import { corpusHealth, listCounties, listStates } from '@/lib/kb';

export const dynamic = 'force-dynamic';

/**
 * THE LANDING PAGE IS A PLACEHOLDER AND IS OWNED BY SUB-WAVE B.
 * `phase-4-revenue/wagelens/LANDING_SPEC.md` is the specification — the hero,
 * the worked ledger, the WH-347 artefact, the determination timeline, the
 * comparison table and the FAQ — and none of it is here. What IS here is the
 * one element the landing spec calls #2 and the offer calls non-negotiable: the
 * live lookup, working, above the fold, with no email and no card. The page can
 * therefore be replaced without breaking anything the corpus depends on.
 *
 * The copy below states only what is true and buildable today: no penalty
 * figure, no claimed rate of success, no promise that a filing is accepted, and
 * a call to action that names the trial's length and its charge (WL-09 V16a).
 */
export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const state = typeof params['state'] === 'string' ? params['state'] : undefined;

  const db = await getDb();
  const [states, health] = await Promise.all([listStates(db), corpusHealth(db)]);
  const counties = state ? await listCounties(db, state) : [];
  await emitEvent(db, 'hero_viewed', { props: { variant: 'sub-wave-a' } });

  const product = productName();

  return (
    <>
      <section className="wl-hero wl-stack">
        <h1>The county pays a number. Your payroll has to say it.</h1>
        <p className="wl-lead">
          {product} holds every active federal Davis-Bacon wage determination, with its
          classifications, its rates and its fringes — and it holds the modification your contract
          locked, not only the one published this month. Look up any county below. No login, no
          card, no email.
        </p>
      </section>

      <section className="wl-panel">
        <div className="wl-panel__body wl-stack">
          <LookupForm states={states} counties={counties} {...(state ? { selectedState: state } : {})} />
          <p className="wl-xs wl-muted" data-testid="corpus-stat">
            {health.activeDeterminations} active determinations ·{' '}
            {health.supersededRevisionsHeld} superseded revisions held ·{' '}
            {health.classifications} classification rows.
          </p>
        </div>
      </section>

      <section className="wl-cols-2">
        <article className="wl-panel">
          <div className="wl-panel__body wl-stack-2">
            <h2>Every rate carries its source</h2>
            <p className="wl-sm">
              The determination number, the modification number, the publication date and a link to
              the official document on SAM.gov — on the rate, not in a footnote. Check any figure we
              show you in ten seconds, from the front page, before you give us anything.
            </p>
          </div>
        </article>
        <article className="wl-panel">
          <div className="wl-panel__body wl-stack-2">
            <h2>The modification your contract names</h2>
            <p className="wl-sm">
              29 CFR 1.6 fixes the applicable determination at solicitation or award. When your
              contract locked modification 0 and DOL has since published modification 1, you can read
              and pin modification 0 — permanently, with the newer one named, and never moved for you.
            </p>
          </div>
        </article>
      </section>

      <section className="wl-panel">
        <div className="wl-panel__body wl-stack-2">
          <h2>The rate is free. The weekly form is the work.</h2>
          <p className="wl-sm wl-muted">
            The lookup above stays free forever. What you pay for is the roster, the hours, the
            WH-347, the Statement of Compliance and the three-year archive. Your first two Fridays
            are free — card on file, charged on day 15.
          </p>
          <p>
            <Link className="wl-btn wl-btn--primary" href="/login" data-testid="hero-cta">
              Start 14-day trial
            </Link>{' '}
            <Link className="wl-btn wl-btn--ghost" href="/pricing">
              See pricing
            </Link>
          </p>
        </div>
      </section>

      <StandingDisclaimer />
    </>
  );
}
