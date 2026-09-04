import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Disclaimer, Provenance } from '@/components/provenance';
import { HELP_ARTICLES, helpArticle } from '@/content/help/articles';
import { rateArticleAction } from '@/lib/support/actions';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return HELP_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = helpArticle(slug);
  if (!article) return { title: 'Help — StateReady' };
  // `specs/11` AC4: unique titles and descriptions, asserted by `tests/help.test.ts`.
  return { title: `${article.title} — StateReady`, description: article.description };
}

/**
 * An article. Every regulatory sentence renders with the board page it came
 * from, in the same `.sr-source` provenance line the product uses, because a
 * help page that states a rule without its citation is a help page that can
 * drift away from the product it explains.
 */
export default async function HelpArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const article = helpArticle(slug);
  if (!article) notFound();

  const rated = query['rated'] === '1';

  return (
    <main className="narrow">
      <p className="sr-eyebrow">
        <Link href="/help">Help</Link> · {article.category}
      </p>
      <h1>{article.title}</h1>
      <p className="sr-lead">{article.description}</p>

      <article data-testid="help-article">
        {article.blocks.map((block, index) => {
          const key = `${block.kind}-${index}`;
          if (block.kind === 'h') return <h2 key={key}>{block.text}</h2>;
          if (block.kind === 'p') return <p key={key}>{block.text}</p>;
          if (block.kind === 'list') {
            return (
              <ul key={key}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          }
          if (block.kind === 'policy') {
            return (
              <p data-policy={block.from} key={key}>
                {block.text}
              </p>
            );
          }
          return (
            <div data-testid="help-claim" key={key}>
              <p>{block.text}</p>
              <Provenance confidence="high" lastVerified={null} title={block.sourceTitle} url={block.sourceUrl} />
            </div>
          );
        })}
      </article>

      <section>
        <h2>Was this helpful?</h2>
        {rated ? (
          <p className="notice" data-testid="help-rated">
            Thank you — the answers people mark unhelpful are the ones we rewrite first.
          </p>
        ) : (
          <form action={rateArticleAction}>
            <input name="slug" type="hidden" value={article.slug} />
            <label htmlFor="comment">Anything we should add? (optional)</label>
            <input id="comment" name="comment" type="text" />
            <button className="button secondary" name="helpful" type="submit" value="yes">
              Yes
            </button>{' '}
            <button className="button secondary" name="helpful" type="submit" value="no">
              No
            </button>
          </form>
        )}
        <p className="small">
          <Link href="/support">Ask us instead</Link> — we answer within one business day.
        </p>
      </section>

      <Disclaimer />
    </main>
  );
}
