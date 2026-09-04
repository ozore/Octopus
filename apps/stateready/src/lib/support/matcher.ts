/**
 * The article matcher — `specs/11` AC1 and AC2, and the search behind `/help`.
 *
 * It is deliberately a local index over the committed articles: no third-party
 * search at launch (`specs/11` §Server actions), no network, no index to keep
 * warm, and it runs inside the sixty seconds the auto-responder has.
 *
 * THE SCORING, and why each weight is where it is:
 *
 *  - a **keyword** hit is worth most, because the keyword list on each article
 *    is the deliberate answer to "what will someone actually type";
 *  - a **title** hit next;
 *  - a **body** hit least, because a long article mentions many things;
 *  - the ticket's own **states** boost articles about those states, which is
 *    what makes "my Florida deadline makes no sense" find the Florida articles
 *    rather than the general one about unverified values.
 *
 * A tie is broken by the article's position in the committed list, so the
 * result is deterministic and a test can assert it.
 */

import { HELP_ARTICLES } from '@/content/help/articles';
import type { HelpArticle } from '@/content/help/types';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'to', 'of', 'in',
  'on', 'for', 'with', 'my', 'our', 'we', 'i', 'it', 'this', 'that', 'do', 'does', 'did', 'have',
  'has', 'had', 'why', 'what', 'when', 'how', 'can', 'not', 'no', 'you', 'your', 'me', 'us', 'at',
  'from', 'by', 'if', 'so', 'as', 'about', 'please', 'help', 'hi', 'hello', 'thanks',
]);

export function tokenise(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z0-9'-]*/g) ?? [])
    .map((word) => word.replace(/'s$/, ''))
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

function articleText(article: HelpArticle): string {
  const blocks = article.blocks.flatMap((block) =>
    block.kind === 'list' ? block.items : 'text' in block ? [block.text] : [],
  );
  return [article.description, ...blocks].join(' ');
}

export type MatchContext = { states?: readonly string[]; trades?: readonly string[] };

export type ArticleMatch = { article: HelpArticle; score: number };

export function scoreArticles(query: string, context: MatchContext = {}): ArticleMatch[] {
  const tokens = tokenise(query);
  const states = new Set((context.states ?? []).map((s) => s.toUpperCase()));
  const trades = new Set(context.trades ?? []);

  return HELP_ARTICLES.map((article, index) => {
    const keywords = new Set(article.keywords.flatMap((keyword) => tokenise(keyword)));
    const keywordPhrases = article.keywords.map((keyword) => keyword.toLowerCase());
    const title = new Set(tokenise(article.title));
    const body = new Set(tokenise(articleText(article)));

    let score = 0;
    for (const token of tokens) {
      if (keywords.has(token)) score += 6;
      if (title.has(token)) score += 3;
      if (body.has(token)) score += 1;
    }
    // A multi-word keyword typed whole ("continuing education") counts once
    // more, because it is a stronger signal than its two words separately.
    const lower = query.toLowerCase();
    for (const phrase of keywordPhrases) {
      if (phrase.includes(' ') && lower.includes(phrase)) score += 4;
    }

    if (score > 0) {
      for (const state of article.states) if (states.has(state)) score += 4;
      for (const trade of article.trades) if (trades.has(trade)) score += 2;
    }

    return { article, score, index };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ article, score }) => ({ article, score }));
}

/** `specs/11` AC1: the auto-response carries three article links. */
export function matchArticles(query: string, context: MatchContext = {}, limit = 3): HelpArticle[] {
  const scored = scoreArticles(query, context).slice(0, limit).map((row) => row.article);
  if (scored.length >= limit) return scored;

  // Never send fewer than three: a message we cannot match is exactly the
  // message that needs the three articles everybody needs. They are appended in
  // committed order and never duplicated.
  const fallback: HelpArticle[] = [];
  for (const slug of [
    'what-we-could-not-verify-means',
    'what-stateready-does-not-cover',
    'how-we-keep-the-rules-current',
  ]) {
    const article = HELP_ARTICLES.find((a) => a.slug === slug);
    if (article && !scored.includes(article)) fallback.push(article);
  }
  return [...scored, ...fallback].slice(0, limit);
}

/** `/help?q=` — the same index, unlimited, with the score dropped. */
export function searchHelp(query: string): HelpArticle[] {
  if (!query.trim()) return [...HELP_ARTICLES];
  return scoreArticles(query).map((row) => row.article);
}
