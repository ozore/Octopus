import Link from 'next/link';

import { StandingDisclaimer } from '@/components/disclaimer';
import { Ledger, LedgerRow } from '@/components/primitives';
import { getEnv, productName } from '@/env';
import { HELP_ARTICLES } from '@/content/help/articles';
import { searchArticles } from '@/content/help/search';
import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * `/help` — the index, searchable (WL-11).
 *
 * The search is a GET form and the results are server-rendered, so it works
 * with JavaScript off and a result is a URL somebody can send to a colleague.
 * **An empty result is never a dead end** (WL-11 Errors): the message says so
 * and the whole index renders beneath it.
 *
 * `help_searched {query, result_count}` is the one event here that changes
 * anything: a query that returns nothing is an article that has not been
 * written, which is the cheapest content roadmap this product will ever get.
 */
export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = typeof params['q'] === 'string' ? params['q'].slice(0, 80) : '';
  const matches = query ? searchArticles(query) : [];

  if (query) {
    const db = await getDb();
    await emitEvent(db, 'help_searched', {
      props: { query: query.toLowerCase(), result_count: matches.length },
    });
  }

  const env = getEnv();
  const product = productName();
  const listed = query && matches.length > 0 ? matches : HELP_ARTICLES;

  return (
    <>
      <h1>Help</h1>
      <p className="wl-lead">
        Six articles for the six questions that stop a Friday afternoon. Every regulatory statement
        cites the section it comes from, and every article carries the date it was last reviewed.
      </p>

      <form className="wl-lookup" action="/help" method="get" data-testid="help-search">
        <div className="wl-field">
          <label className="wl-field__label" htmlFor="q">
            Search the help
          </label>
          <input
            id="q"
            name="q"
            className="wl-input"
            type="search"
            defaultValue={query}
            placeholder="conformance, no work performed, WH-347"
          />
        </div>
        <div className="wl-lookup__actions">
          <button className="wl-btn wl-btn--secondary" type="submit">
            Search
          </button>
        </div>
      </form>

      {query ? (
        <p className="wl-sm" data-testid="help-search-result" aria-live="polite">
          {matches.length > 0 ? (
            <>
              {matches.length} article{matches.length === 1 ? '' : 's'} match &ldquo;{query}&rdquo;.
            </>
          ) : (
            <>
              Nothing here answers &ldquo;{query}&rdquo; yet. All six articles are below, and{' '}
              <a href={`mailto:${env.SUPPORT_EMAIL}?subject=${encodeURIComponent(query)}`}>
                a person reads every message
              </a>{' '}
              — tell us what you were looking for and we will write it.
            </>
          )}
        </p>
      ) : null}

      <Ledger>
        {listed.map((article) => (
          <LedgerRow
            key={article.slug}
            href={`/help/${article.slug}`}
            title={article.question}
            meta={
              <>
                <span>{article.title}</span>
                <span>reviewed {article.lastReviewed}</span>
              </>
            }
          />
        ))}
      </Ledger>

      <section className="wl-panel">
        <header className="wl-panel__head">
          <h2>Signing in</h2>
        </header>
        <div className="wl-panel__body wl-stack-2 wl-prose">
          <p>
            There is no password. Enter your email address and we send a link that works once and
            expires in {env.LOGIN_TOKEN_TTL_MINUTES} minutes. If it does not arrive, check spam, then
            ask for another.
          </p>
          <p>
            The <Link href="/lookup">rate lookup</Link> needs no account at all.
          </p>
        </div>
      </section>

      <section className="wl-panel">
        <header className="wl-panel__head">
          <h2>Something looks wrong</h2>
        </header>
        <div className="wl-panel__body wl-stack-2 wl-prose">
          <p>
            Tell us what you were doing and what you saw. If it is a rate, include the determination
            number and modification we showed beside it — that is the fastest possible fix, because
            it tells us exactly which row to re-read.
          </p>
          <p>
            A person reads every message sent to{' '}
            <a href={`mailto:${env.SUPPORT_EMAIL}?subject=${encodeURIComponent(`${product} help`)}`}>
              {env.SUPPORT_EMAIL}
            </a>
            . Expect a reply within one business day.
          </p>
        </div>
      </section>

      <StandingDisclaimer />
    </>
  );
}
