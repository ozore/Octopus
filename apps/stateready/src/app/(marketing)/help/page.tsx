import Link from 'next/link';

import { HELP_ARTICLES } from '@/content/help/articles';
import { HELP_CATEGORIES } from '@/content/help/types';
import { getEnv } from '@/env';
import { searchHelp } from '@/lib/support/matcher';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Help — StateReady',
  description:
    'Answers written from the confusions this data actually creates: two North Carolina boards with two renewal rules, two Florida renewal parities, and what "we could not verify this" means.',
};

/**
 * `/help` — search and categories. **Public and indexable** (`specs/11` AC4):
 * these articles are also the search results for exactly our buyer's questions,
 * and a compliance buyer who lands on "why does my North Carolina electrical
 * licence renew on its anniversary" has already been sold the product.
 *
 * Server-rendered, no client search index: the whole corpus is fifteen articles
 * and the index is a function (`src/lib/support/matcher.ts`), so the query is a
 * URL and the result is a page a search engine can read.
 */
export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const env = getEnv();
  const query = typeof params['q'] === 'string' ? params['q'] : '';
  const results = query ? searchHelp(query) : [];

  return (
    <main className="narrow">
      <p className="sr-eyebrow">Help</p>
      <h1>Answers, and the board page behind each one</h1>
      <p className="sr-lead">
        Every article that states a rule links to the same board page the product cites for it. Help content
        is not allowed to invent regulatory statements either.
      </p>

      <form action="/help" method="get" role="search">
        <label htmlFor="help-q">Search help</label>
        <input
          defaultValue={query}
          id="help-q"
          name="q"
          placeholder="florida ce, anniversary, reciprocity…"
          type="search"
        />
        <button className="button secondary" type="submit">
          Search
        </button>
      </form>

      {query ? (
        <section data-testid="help-results">
          <h2>
            {results.length} result{results.length === 1 ? '' : 's'} for “{query}”
          </h2>
          {results.length === 0 ? (
            <p className="notice">
              No article matches. Ask us — we answer within one business day.{' '}
              <Link href={`/support?subject=${encodeURIComponent(query)}`}>Send us the question.</Link>
            </p>
          ) : (
            <ul>
              {results.map((article) => (
                <li key={article.slug}>
                  <Link href={`/help/${article.slug}`}>{article.title}</Link>
                  <p className="small muted">{article.description}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {HELP_CATEGORIES.map((category) => {
        const articles = HELP_ARTICLES.filter((article) => article.category === category);
        if (articles.length === 0) return null;
        return (
          <section data-testid={`help-category-${category.replace(/\s+/g, '-').toLowerCase()}`} key={category}>
            <h2>{category}</h2>
            <ul>
              {articles.map((article) => (
                <li key={article.slug}>
                  <Link href={`/help/${article.slug}`}>{article.title}</Link>
                  <p className="small muted">{article.description}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <h2>Still stuck</h2>
      <p>
        <Link href="/support">Send us a message</Link> and we answer within one business day. If a value
        looks wrong, use the &ldquo;this rule looks wrong&rdquo; option — that goes into our knowledge-base
        review queue rather than into an inbox, and it is the most useful thing you can send us. Or write to{' '}
        <a href={`mailto:${env.SUPPORT_EMAIL}`}>{env.SUPPORT_EMAIL}</a>.
      </p>
      <p className="small">
        <Link href="/help/methodology">How the rule library is built, and how we are doing against our own
        targets.</Link>
      </p>
    </main>
  );
}
