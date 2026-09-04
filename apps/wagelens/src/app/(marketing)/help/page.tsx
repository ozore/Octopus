import Link from 'next/link';

import { StandingDisclaimer } from '@/components/disclaimer';
import { Ledger, LedgerRow } from '@/components/primitives';
import { getEnv, productName } from '@/env';
import { HELP_ARTICLES } from '@/content/help/articles';

export const dynamic = 'force-dynamic';

export default function HelpPage() {
  const env = getEnv();
  const product = productName();
  return (
    <>
      <h1>Help</h1>
      <p className="wl-lead">
        Six articles for the six questions that stop a Friday afternoon. Every regulatory statement
        cites the section it comes from, and every article carries the date it was last reviewed.
      </p>

      <Ledger>
        {HELP_ARTICLES.map((article) => (
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
