/**
 * `/help` search (WL-11: "index, six articles, **searchable**").
 *
 * Six articles do not need an index, a ranking model or a dependency — they
 * need to be findable at 4pm on a Friday by someone typing the word she has in
 * her head ("conformance", "no work", "SSN"). So: normalise, match on the
 * question, the title, the body and a small list of the words a person
 * actually types for each article, and rank by where the match landed.
 *
 * An empty result is not a dead end (WL-11 Errors): the caller renders the
 * whole index beneath the message, which is why this returns the matches and
 * never a 404.
 */

import { HELP_ARTICLES, type HelpArticle } from './articles';

/** The words people type that the article text does not contain. */
const ALIASES: Record<string, string[]> = {
  'what-is-certified-payroll': ['wh-347', 'wh347', 'weekly', 'statement of compliance', 'deadline', 'retention'],
  'find-your-wage-determination-number': ['wd number', 'determination number', 'modification', 'county', 'sam.gov'],
  'choosing-a-classification': ['job title', 'trade', 'apprentice', 'helper', 'foreman'],
  'nothing-matches-conformance': ['conformance', 'sf-1444', 'not listed', 'missing classification'],
  'no-work-performed-weeks': ['no work', 'gap', 'skipped week', 'zero hours'],
  'what-we-do-not-do': ['refund', 'advice', 'liability', 'what you do', 'disclaimer'],
};

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Whole words, with a prefix allowance for plurals and inflections.
 *
 * Substring matching is what makes a six-article search useless: "sales tax in
 * ohio" contains "in", "in" is inside "including", and every article matches.
 * A search that always returns everything answers nothing and, worse, makes
 * `help_searched.result_count` a number that cannot be read.
 */
function matches(tokens: string[], term: string): boolean {
  return tokens.some((token) => token === term || (term.length >= 4 && token.startsWith(term)));
}

/** Words too common to carry a query, and short enough to match everything. */
const STOP = new Set([
  'the', 'and', 'for', 'you', 'your', 'are', 'was', 'with', 'that', 'this', 'from', 'what',
  'how', 'why', 'when', 'who', 'does', 'did', 'can', 'not', 'but', 'all', 'any', 'its', 'it',
  'in', 'on', 'of', 'to', 'a', 'i', 'is', 'do', 'my', 'me', 'we', 'us', 'at', 'or', 'if', 'be',
]);

export function searchArticles(query: string): HelpArticle[] {
  const term = normalise(query);
  if (term.length === 0) return [];
  const terms = term.split(' ').filter((t) => t.length > 1 && !STOP.has(t));
  if (terms.length === 0) return [];

  const scored = HELP_ARTICLES.map((article) => {
    const question = normalise(article.question).split(' ');
    const title = normalise(article.title).split(' ');
    const aliases = normalise((ALIASES[article.slug] ?? []).join(' ')).split(' ');
    const body = normalise(article.body.join(' ')).split(' ');
    let score = 0;
    for (const t of terms) {
      if (matches(question, t)) score += 8;
      if (matches(title, t)) score += 6;
      if (matches(aliases, t)) score += 5;
      if (matches(body, t)) score += 2;
    }
    return { article, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((row) => row.article);
}
