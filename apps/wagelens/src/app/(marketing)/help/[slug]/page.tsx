import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StandingDisclaimer } from '@/components/disclaimer';
import { getEnv, productName } from '@/env';
import { HELP_ARTICLES, findArticle } from '@/content/help/articles';
import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Minimal, deliberate markdown: `**bold**` and `[label](href)` only. A help
 *  article is prose, not a CMS, and a bigger renderer is a bigger attack
 *  surface for no reader benefit. */
function render(text: string, key: string) {
  const parts: Array<React.ReactNode> = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let index = 0;
  let match: RegExpExecArray | null;
  let n = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > index) parts.push(text.slice(index, match.index));
    const token = match[0];
    n += 1;
    if (token.startsWith('**')) {
      parts.push(<strong key={`${key}-b${n}`}>{token.slice(2, -2)}</strong>);
    } else {
      const link = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (link?.[1] && link[2]) {
        parts.push(
          <Link key={`${key}-l${n}`} href={link[2]}>
            {link[1]}
          </Link>,
        );
      }
    }
    index = match.index + token.length;
  }
  if (index < text.length) parts.push(text.slice(index));
  return parts;
}

export default async function HelpArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) notFound();

  // `from` tells us which surface sent the reader here — the index, a search,
  // the certify screen or a rate's disclaimer. Whichever one dominates is the
  // screen that is not answering its own question (WL-11).
  const query = searchParams ? await searchParams : {};
  const from = typeof query['from'] === 'string' ? query['from'].slice(0, 32) : 'direct';
  const db = await getDb();
  await emitEvent(db, 'help_article_viewed', { props: { slug, from } });

  const env = getEnv();
  const product = productName();

  return (
    <>
      <p className="wl-xs wl-muted">
        <Link href="/help">Help</Link> / {article.question}
      </p>
      <article className="wl-panel">
        <div className="wl-panel__body wl-stack wl-prose">
          <h1>{article.title}</h1>
          {article.body.map((paragraph, i) => (
            <p key={`p${i}`}>{render(paragraph.replaceAll('{product}', product), `p${i}`)}</p>
          ))}

          <hr />
          <p className="wl-xs wl-muted">Last reviewed {article.lastReviewed}. Sources:</p>
          <ul className="wl-xs">
            {article.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer noopener">
                  {source.label} ↗
                </a>
              </li>
            ))}
          </ul>
          <p className="wl-xs wl-muted">
            Still stuck?{' '}
            <a
              href={`mailto:${env.SUPPORT_EMAIL}?subject=${encodeURIComponent(article.question)}`}
            >
              Email support
            </a>{' '}
            — say which page you were on.
          </p>
        </div>
      </article>

      <nav className="wl-panel">
        <div className="wl-panel__body wl-stack-2">
          <h2>The other articles</h2>
          <ul className="wl-prose">
            {HELP_ARTICLES.filter((a) => a.slug !== article.slug).map((other) => (
              <li key={other.slug}>
                <Link href={`/help/${other.slug}`}>{other.question}</Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <StandingDisclaimer />
    </>
  );
}
