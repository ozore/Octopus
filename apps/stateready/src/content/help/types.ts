/**
 * The help centre's content model — and the reason it is typed data rather than
 * free prose.
 *
 * `specs/11` AC3: *"Every help article that states a regulatory fact contains a
 * link to a board URL that also appears in `kb-data/`, asserted by a test that
 * walks the MDX for claims and cross-checks the URL set."* A test that has to
 * guess which sentence in a paragraph is a regulatory claim will get it wrong
 * in one of two directions and both are bad: miss a claim, or fail on a
 * sentence about our own product.
 *
 * So the block kinds make the distinction **structural**, and the test is
 * total rather than heuristic:
 *
 *  - `p` — our own prose. **No digit may appear in it.** A number in a help
 *    article is always either a board's rule or our own policy, and neither is
 *    plain prose.
 *  - `claim` — a board's rule. Carries the board URL it came from, and
 *    `tests/help.test.ts` asserts that URL is one the committed knowledge base
 *    actually cites. Help content is not allowed to invent regulatory
 *    statements either.
 *  - `policy` — our own rule (the 180-day staleness rule, the alert offsets,
 *    the trial length). Carries the name of the exported constant it is derived
 *    from, and the test asserts that constant exists in the source and that its
 *    value appears in the sentence — so a help page cannot drift away from the
 *    code the day someone changes a number.
 */

import type { Trade } from '@/lib/kb/types';

export const HELP_CATEGORIES = [
  'Reading a date we gave you',
  'State by state',
  'Your data',
  'Alerts',
  'Plans and billing',
] as const;

export type HelpCategory = (typeof HELP_CATEGORIES)[number];

export type HelpBlock =
  | { kind: 'h'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'claim'; text: string; sourceUrl: string; sourceTitle: string; recordId: string }
  | { kind: 'policy'; text: string; from: string }
  | { kind: 'list'; items: string[] };

export type HelpArticle = {
  slug: string;
  title: string;
  /** The meta description. `specs/11` AC4: unique titles and descriptions. */
  description: string;
  category: HelpCategory;
  /** Matched against a ticket's subject and body by `src/lib/support/matcher.ts`. */
  keywords: string[];
  states: string[];
  trades: Trade[];
  blocks: HelpBlock[];
};
