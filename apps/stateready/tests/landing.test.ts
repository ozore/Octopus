/**
 * M15 — the landing page's guarantees, as tests.
 *
 * Four of these are the reason the file exists, and each one is a rule that is
 * worthless as a convention and load-bearing as a build failure:
 *
 *  1. **The word count.** `LANDING_SPEC.md` §1 sets a hard ceiling of 450 words
 *     from the top of the page to the top of the pricing block, and the deck in
 *     §13 counts to 439. This suite renders the real component and counts the
 *     real DOM between `#hero` and `#pricing`, under the spec's own mechanical
 *     rule, so a copy edit cannot quietly evade the ceiling and the deck cannot
 *     quietly disagree with the build.
 *  2. **The guarantees.** The Entry Pack Guarantee is asserted **byte-identical
 *     to `OFFER.md` §5.1 item 2**, read from that document rather than from a
 *     copy of it (`specs/12` AC8b). The Accuracy Guarantee's compression is
 *     asserted against AC8c's four conditions: it keeps the five-business-day
 *     window and the one-credit cap, it links to `/legal/refunds`, it adds no
 *     quantity, and it never says "guarantee" in a strip without that link.
 *  3. **Every number comes from the knowledge base.** The divergence card, the
 *     coverage counter, the runway's walls and every demo row are compared
 *     against the committed JSON read independently in this file. A number
 *     typed into the page would have to be typed into the record too.
 *  4. **What the page may never contain** (`LANDING_SPEC.md` §11), grepped over
 *     the rendered HTML rather than over the source, because the rule is about
 *     what a stranger can read.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  countWords,
  DECK_WORDS,
  divergenceCaption,
  FAQ_STATIC,
  GUARANTEES,
  HERO,
  isWordToken,
  WORD_CEILING,
} from '../src/components/marketing/copy';
import {
  buildRulebook,
  coverageSummary,
  divergence,
  divergenceNumbers,
  ENTRY_PACK_STEPS,
  faqAnswers,
  runwayLanes,
  sampleTiles,
} from '../src/components/marketing/data';
import { CLIENT_EVENT_NAMES, LANDING_EVENTS } from '../src/components/marketing/events';
import { buildLandingData, Landing } from '../src/components/marketing/landing';
import { RulebookResultPanel } from '../src/components/marketing/rulebook';
import { CE_BROKER_PRICE, CITED_SOURCES, IL_PLUMBING_RENEWAL } from '../src/components/marketing/sources';
import { DEMO_RATE_LIMIT, EVENT_RATE_LIMIT } from '../src/components/marketing/track';
import { ONE_OFF_PRICES, plans } from '../src/lib/plans';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(appRoot, '..', '..');
const TODAY = '2026-09-04';

const ENV = {
  today: TODAY,
  appName: 'StateReady',
  companyName: 'TheVillage',
  companyAddress: '1 Example Street, Wilmington DE',
  supportEmail: 'support@thevillage.example',
};

function render(billing: 'annual' | 'monthly' = 'annual'): string {
  return renderToStaticMarkup(Landing({ data: buildLandingData({ ...ENV, billing }) }));
}

const HTML = render();

/* ---------------------------------------------------------------------------
 * The counting rule, implemented over the rendered DOM exactly as
 * `LANDING_SPEC.md` §1 states it. Chrome — form labels, map legends, graphic
 * labels, source chips, the demo's output — carries `data-wc="chrome"` and its
 * whole subtree is skipped, as are visually-hidden accessibility equivalents.
 * ------------------------------------------------------------------------- */

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

export function countedRegionText(html: string): string {
  const from = html.lastIndexOf('<', html.indexOf('id="hero"'));
  const to = html.lastIndexOf('<', html.indexOf('id="pricing"'));
  const region = html.slice(from, to);

  let text = '';
  let cursor = 0;
  const stack: { skip: boolean }[] = [];
  let skipDepth = 0;

  while (cursor < region.length) {
    const open = region.indexOf('<', cursor);
    if (open === -1) {
      if (skipDepth === 0) text += ` ${region.slice(cursor)}`;
      break;
    }
    if (skipDepth === 0) text += ` ${region.slice(cursor, open)}`;
    const close = region.indexOf('>', open);
    if (close === -1) break;
    const tag = region.slice(open, close + 1);
    cursor = close + 1;
    if (tag.startsWith('<!')) continue;
    if (tag.startsWith('</')) {
      const popped = stack.pop();
      if (popped?.skip) skipDepth -= 1;
      continue;
    }
    const name = /^<([a-zA-Z0-9-]+)/.exec(tag)?.[1]?.toLowerCase() ?? '';
    if (tag.endsWith('/>') || VOID_ELEMENTS.has(name)) continue;
    const chrome =
      tag.includes('data-wc="chrome"') ||
      tag.includes('sr-visually-hidden') ||
      name === 'script' ||
      name === 'style';
    stack.push({ skip: chrome });
    if (chrome) skipDepth += 1;
  }

  return text
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const COUNTED = countedRegionText(HTML);

/* ------------------------------------------------------------ the record -- */

function kb(file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(appRoot, 'kb', 'kb-data', `${file}.json`), 'utf8')) as Record<string, unknown>;
}

function ceHours(file: string): number {
  const record = kb(file) as { licence_types: { continuing_education: { required: { value: unknown }; hours: { value: unknown } } }[] };
  const hours = record.licence_types
    .filter((licenceType) => licenceType.continuing_education.required.value === true)
    .map((licenceType) => Number(licenceType.continuing_education.hours.value))
    .filter((value) => Number.isFinite(value));
  return Math.max(...hours);
}

describe('the word budget — LANDING_SPEC.md §1, counted in CI', () => {
  it('counts a token as a word unless it carries no letter, digit or &', () => {
    for (const symbol of ['—', '…', '·', '↓', '↑']) expect(isWordToken(symbol), symbol).toBe(false);
    for (const word of ['&', '§7031', '8', 'licence']) expect(isWordToken(word), word).toBe(true);
    expect(countWords('HVAC · Plumbing · Electrical')).toBe(3);
    expect(countWords('— California Business & Professions Code §7031')).toBe(6);
  });

  it('the page between #hero and #pricing is under the 450-word ceiling', () => {
    expect(countWords(COUNTED)).toBeLessThanOrEqual(WORD_CEILING);
  });

  it('and it is the deck: 439 words, the number §1 and §13 both publish', () => {
    // If this fails, the copy changed. Update the page, `LANDING_SPEC.md` §1's
    // table and §13's per-section figures in the same commit — the number
    // appears in three places on purpose.
    expect(countWords(COUNTED)).toBe(DECK_WORDS);
  });

  it('counts all three CTA placements, because CI measures the DOM (wave-1b m9)', () => {
    const placements = HTML.match(/data-cta="/g) ?? [];
    expect(placements).toHaveLength(3);
    expect(COUNTED.match(/Start your free trial/g)).toHaveLength(3);
    expect(COUNTED.match(/14 days\. No credit card\./g)).toHaveLength(3);
  });

  it('renders the deck itself, not a paraphrase of it', () => {
    for (const line of [
      HERO.eyebrow,
      HERO.h1,
      HERO.subhead,
      'What happens when a credential lapses',
      "See your own state's rules before you give us anything.",
      'Pick a state and a trade. No email, no account.',
      'What you can check before you pay',
      'A lapse is not a fine — it is the right to work, and the right to be paid for it.',
    ]) {
      expect(COUNTED, line).toContain(line);
    }
  });
});

describe('the guarantees — specs/12 AC8, against OFFER.md itself', () => {
  const offer = readFileSync(join(repoRoot, 'phase-4-revenue', 'stateready', 'OFFER.md'), 'utf8');

  function blockquoteAfter(heading: string): string {
    const start = offer.indexOf(heading);
    expect(start, `OFFER.md no longer contains ${heading}`).toBeGreaterThan(-1);
    const lines = offer.slice(start).split('\n');
    const quote: string[] = [];
    let started = false;
    for (const line of lines) {
      if (line.startsWith('> ')) {
        started = true;
        quote.push(line.slice(2).trim());
      } else if (started) break;
    }
    return quote.join(' ').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  }

  it('AC8b — the Entry Pack Guarantee is byte-identical to OFFER.md §5.1 item 2', () => {
    expect(GUARANTEES.entryPack).toBe(blockquoteAfter('**2. The Entry Pack Guarantee**'));
  });

  it('AC8b — and the page renders it whole, all 63 words of it', () => {
    expect(countWords(GUARANTEES.entryPack)).toBe(63);
    expect(COUNTED).toContain(GUARANTEES.entryPack);
    // The two facts a compression dropped, and the reason R1 was raised.
    expect(GUARANTEES.entryPack).toContain('within 90 days of your purchase');
    expect(GUARANTEES.entryPack).toContain('limited to the fee you paid for that pack');
  });

  it('AC8c — the Accuracy Guarantee is a shortening, never a strengthening', () => {
    const canonical = blockquoteAfter('**1. The Accuracy Guarantee**');
    const compressed = GUARANTEES.accuracyCompressed;

    expect(compressed).toContain('five business days');
    expect(compressed).toContain('one credit');
    expect(HTML).toContain(`href="${GUARANTEES.accuracyLinkHref}"`);
    expect(countWords(compressed)).toBeLessThan(countWords(canonical));

    // No quantity may be moved, added or dropped into the compression.
    const numbers = (text: string) => new Set(text.toLowerCase().match(/\b(one|two|three|four|five|six|\d+)\b/g) ?? []);
    for (const quantity of numbers(compressed)) {
      expect([...numbers(canonical)], `the compression invents "${quantity}"`).toContain(quantity);
    }
    // And no escalation word.
    for (const word of ['guarantee', 'always', 'never', 'any', 'all', 'unlimited', 'full']) {
      expect(compressed.toLowerCase().split(/\W+/), word).not.toContain(word);
    }
  });

  it('the word "guarantee" never appears in a strip without a link to the terms', () => {
    const strip = HTML.slice(HTML.indexOf('id="guarantees"'), HTML.indexOf('id="pricing"'));
    expect(strip).toContain('Two things we guarantee');
    expect(strip).toContain('/legal/refunds');
  });
});

describe('every number on the page is read from the knowledge base', () => {
  it('the divergence card is the record, not a caption someone typed', () => {
    const hvac = ceHours('tx-hvac');
    const electrical = ceHours('tx-electrical');
    expect(hvac).not.toBe(electrical); // the whole argument of the card

    const numbers = divergenceNumbers(TODAY);
    expect(numbers.hvac).toBe(String(hvac));
    expect(numbers.electrical).toBe(String(electrical));

    // The caption is a function of those two values, and the page renders it.
    expect(COUNTED).toContain(divergenceCaption(String(hvac), String(electrical)));
    expect(divergenceCaption('9', '5')).toContain('for 9 hours');
  });

  it('the card carries a source chip per row and never a bare number', () => {
    const card = divergence('TX', TODAY);
    expect(card.rows).toHaveLength(2);
    for (const row of card.rows) {
      expect(row.hours?.source_url, row.trade).toMatch(/^https:\/\/www\.tdlr\.texas\.gov\//);
      expect(row.hours?.last_verified, row.trade).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('the coverage counter is the committed records, counted', () => {
    const summary = coverageSummary(TODAY);
    expect(summary.rulebooks).toBe(9);
    expect(summary.states).toEqual(['FL', 'NC', 'TX']);
    expect(summary.licenceTypes).toBeGreaterThan(0);
    expect(summary.pagesRead).toBeGreaterThan(0);
    expect(HTML).toContain(`refreshed ${summary.refreshedOn ?? ''}`);
  });

  it('the runway is built from expiry_rule tokens, and Illinois is named as uncovered', () => {
    const lanes = runwayLanes(TODAY);
    const nc = lanes.find((lane) => lane.id.startsWith('NC-wall'));
    expect(nc?.date?.slice(5)).toBe('12-31'); // fixed_date:12-31, from nc-hvac/nc-plumbing
    const tx = lanes.find((lane) => lane.label.startsWith('Texas'));
    expect(tx?.kind).toBe('spread'); // every Texas rule is an anniversary

    const illinois = lanes.find((lane) => lane.id === 'IL-plumbing');
    expect(illinois?.date?.slice(5)).toBe('04-30');
    expect(illinois?.covered).toBe(false);
    expect(illinois?.source?.source_url).toBe(IL_PLUMBING_RENEWAL.source_url);
    expect(illinois?.inlineLabel).toContain('30 April');
  });

  it('the pricing ladder is plans.ts, to the cent', () => {
    const annual = buildLandingData({ ...ENV, billing: 'annual' }).plans;
    expect(annual.map((plan) => plan.price)).toEqual(['$1,490', '$3,490', '$5,990']);
    const monthly = buildLandingData({ ...ENV, billing: 'monthly' }).plans;
    expect(monthly.map((plan) => plan.price)).toEqual(['$149', '$349', '$599']);
    // The grouping is local; the cents are the plan map's.
    expect(plans.plans.map((plan) => plan.amountCents)).toEqual([14_900, 149_000, 34_900, 349_000, 59_900, 599_000]);
    expect(monthly.map((plan) => plan.limits)).toEqual([
      '1 state · 25 technicians',
      '5 states · 75 technicians',
      '15 states · 250 technicians',
    ]);
    expect(plans.plans).toHaveLength(6);

    const pricing = render('monthly');
    expect(pricing).toContain('$1,500 per state');
    expect(pricing).toContain('Your first state: $750');
    expect(ONE_OFF_PRICES.entryPack.amountCents).toBe(150_000);
  });

  it('the tile grid draws 51 jurisdictions and gives a hollow tile no status word', () => {
    const tiles = sampleTiles();
    expect(tiles).toHaveLength(51);
    const ohio = tiles.find((tile) => tile.state === 'OH');
    expect(ohio?.status).toBeNull();
    expect(ohio?.accessibleName).toBe('Ohio — not in your footprint');
    for (const word of ['READY', 'AT RISK', 'LAPSED', 'NOT TRACKED']) {
      expect(ohio?.accessibleName, word).not.toContain(word);
    }
    // Only states we hold a rulebook for are ever in the sample footprint.
    const operated = tiles.filter((tile) => tile.status !== null).map((tile) => tile.state).sort();
    expect(operated).toEqual(coverageSummary(TODAY).states);
  });
});

describe('the source chip — V5, and the refusal it renders instead of a number', () => {
  it('a value the board does not publish renders "not yet verified", never a blank', () => {
    const data = buildLandingData(ENV);
    expect(data.unpublished.value).toBeNull(); // tx-hvac bond.amount is unknown
    expect(HTML).toContain('not yet verified');
    expect(HTML).toContain('data-testid="source-chip-refused"');
  });

  it('a verified value renders its host and the day we read it', () => {
    expect(HTML).toContain('tdlr.texas.gov');
    expect(HTML).toMatch(/checked 20\d\d-\d\d-\d\d/);
  });

  it('every cited non-KB source carries a URL, an evidence line and a date', () => {
    for (const source of CITED_SOURCES) {
      expect(source.source_url).toMatch(/^https:\/\//);
      expect(source.last_verified).toBe('2026-09-03');
      expect(source.evidence?.length ?? 0).toBeGreaterThan(0);
      expect(source.verified_by ?? []).toHaveLength(2);
    }
    expect(CE_BROKER_PRICE.value).toBe('Starting at $39.99 /yr');
  });
});

describe('the no-login demo — LANDING_SPEC.md §12', () => {
  const texas = buildRulebook('TX', 'hvac', TODAY);

  it('answers Texas × HVAC from the same read path the product uses', () => {
    expect(texas.covered).toBe(true);
    if (!texas.covered) return;
    expect(texas.rows.map((row) => row.id)).toEqual(['classes', 'renewal', 'ce', 'late']);
    const ce = texas.rows.find((row) => row.id === 'ce');
    expect(ce?.entries[0]?.text).toContain(String(ceHours('tx-hvac')));
    expect(ce?.entries[0]?.source.source_url).toContain('tdlr.texas.gov');
  });

  it('the default view contains NO unverified value row (wave-1b M19)', () => {
    expect(texas.covered).toBe(true);
    if (!texas.covered) return;
    for (const row of texas.rows) {
      for (const entry of row.entries) {
        expect(entry.source.status, `${row.id} shows an unverified value`).toBe('verified');
        expect(entry.source.source_url, `${row.id} shows a value with no source`).toBeTruthy();
      }
    }
    const panel = renderToStaticMarkup(
      RulebookResultPanel({ result: texas, today: TODAY, supportEmail: ENV.supportEmail }),
    );
    const rows = panel.slice(0, panel.indexOf('demo-gaps'));
    expect(rows).not.toContain('not yet verified');
  });

  it('and names what the board does not publish, with the pages we read', () => {
    expect(texas.covered).toBe(true);
    if (!texas.covered) return;
    expect(texas.gaps.pagesRead).toBe(5);
    expect(texas.gaps.fields.join(' · ')).toMatch(/bond amount/i);
    expect(texas.gaps.sources.length).toBe(5);
  });

  it('auto-populates the comparison with the same state and a different trade', () => {
    expect(texas.covered).toBe(true);
    if (!texas.covered) return;
    expect(texas.compare?.trade).toBe('electrical');
    expect(texas.compare?.hoursText).toBe(String(ceHours('tx-electrical')));
  });

  it('degrades honestly for a state we do not cover', () => {
    const california = buildRulebook('CA', 'hvac', TODAY);
    expect(california.covered).toBe(false);
    if (california.covered) return;
    expect(california.onLaunchList).toBe(true);
    const panel = renderToStaticMarkup(
      RulebookResultPanel({ result: california, today: TODAY, supportEmail: ENV.supportEmail }),
    );
    expect(panel).toContain('Not covered yet');
    expect(panel).toContain('front of the queue');
    expect(panel).not.toMatch(/\b(soon|coming|shortly)\b/i);
  });

  it('is rate limited without ever prompting anybody', () => {
    expect(DEMO_RATE_LIMIT.limit).toBe(60);
    expect(DEMO_RATE_LIMIT.windowMs).toBe(600_000);
    expect(EVENT_RATE_LIMIT.limit).toBeGreaterThan(DEMO_RATE_LIMIT.limit);
    // No captcha, no email wall, no "sign up to continue" anywhere on the page.
    for (const pattern of [/captcha/i, /sign up to (see|continue)/i, /enter your email to/i]) {
      expect(HTML, String(pattern)).not.toMatch(pattern);
    }
  });

  it('carries the disclaimer inside its own container, not only in the footer', () => {
    const panel = renderToStaticMarkup(
      RulebookResultPanel({ result: texas, today: TODAY, supportEmail: ENV.supportEmail }),
    );
    expect(panel).toContain('data-testid="disclaimer"');
  });
});

describe('conversion instrumentation — LANDING_SPEC.md §10', () => {
  it('uses the canonical event names and no others', () => {
    expect(Object.values(LANDING_EVENTS)).toEqual([
      'lp_view',
      'lp_scroll_depth',
      'lp_demo_open',
      'lp_demo_query',
      'lp_demo_source_click',
      'lp_sample_pack_open',
      'lp_pricing_view',
      'lp_plan_toggle',
      'lp_cta_click',
      'lp_trial_start',
      'lp_checkout_start',
      'lp_checkout_complete',
      'lp_enterprise_enquiry',
      'lp_faq_open',
    ]);
  });

  it('never lets the browser forge the two events the server owns', () => {
    expect(CLIENT_EVENT_NAMES).not.toContain(LANDING_EVENTS.view);
    expect(CLIENT_EVENT_NAMES).not.toContain(LANDING_EVENTS.demoQuery);
  });

  it('ships the instrumentation inline, with no third-party request', () => {
    expect(HTML).toContain('sendBeacon');
    expect(HTML).not.toMatch(/<script[^>]+src=/);
    expect(HTML).not.toMatch(/<img/);
    expect(HTML).not.toMatch(/<iframe/);
    expect(HTML).not.toMatch(/googletagmanager|posthog|segment|hotjar|facebook|doubleclick/i);
  });
});

describe('what this page may never contain — LANDING_SPEC.md §11', () => {
  const surfaces = ['copy.ts', 'data.ts', 'landing.tsx', 'rulebook.tsx', 'sources.ts', 'visuals.tsx'].map((file) =>
    readFileSync(join(appRoot, 'src', 'components', 'marketing', file), 'utf8'),
  );

  it('no EPA 608 penalty figure, re-grepped before every deploy', () => {
    expect(HTML).not.toMatch(/44,?539/);
    for (const source of surfaces) expect(source).not.toMatch(/44,?539/);
  });

  it('no Illinois plumber CE hour count — the date is verified, the hours are not', () => {
    const runway = runwayLanes(TODAY).find((lane) => lane.id === 'IL-plumbing');
    expect(runway?.inlineLabel).not.toMatch(/hour/i);
    const illinoisContext = HTML.split('Illinois').slice(1).join(' ').slice(0, 400);
    expect(illinoisContext).not.toMatch(/\d+\s*hours/i);
  });

  it('no outcome promise, and "no job stops" in particular stays deleted', () => {
    for (const banned of [
      /no job stops/i,
      /guaranteed compliance/i,
      /never (expires?|lapse)/i,
      /we (make sure|ensure) (your|you)/i,
    ]) {
      expect(HTML, String(banned)).not.toMatch(banned);
    }
  });

  it('no claim that we build the roster, and no Alert Guarantee', () => {
    expect(HTML).not.toMatch(/we build (your|the) roster/i);
    expect(HTML).not.toMatch(/from the public registers/i);
    expect(HTML).not.toMatch(/Alert Guarantee/i);
    expect(HTML).not.toMatch(/we refund every month you have paid us/i);
    expect(HTML).not.toMatch(/reinstatement fee/i);
  });

  it('no testimonial, customer count, logo or scarcity device', () => {
    for (const banned of [
      /trusted by/i,
      /\bjoin \d+/i,
      /\d+\+? (companies|contractors|customers) (use|trust)/i,
      /limited time/i,
      /prices? (rise|increase) on/i,
      /spots? (left|remaining)/i,
    ]) {
      expect(HTML, String(banned)).not.toMatch(banned);
    }
  });

  it('no dollar figure for the cost of a lapse, a fine or downtime', () => {
    // The only money on the page is our own prices and a competitor's published
    // one. Every published figure for the cost of a lapse in this category is an
    // unsourced vendor estimate.
    const money = HTML.match(/\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g) ?? [];
    const allowed = new Set(['$149', '$349', '$599', '$1,490', '$3,490', '$5,990', '$1,500', '$750', '$39.99']);
    for (const figure of money) expect([...allowed], `unexpected money on the page: ${figure}`).toContain(figure);
  });

  it('no bond amount, insurance minimum or processing time is sold', () => {
    // Naming a bond amount as a gap is REQUIRED; selling one is forbidden. So
    // the rule is about figures and about prose, not about the word.
    expect(HTML).not.toMatch(/bond[^<.]{0,40}\$\s?[\d]/i);
    expect(COUNTED).not.toMatch(/bond|processing time/i);
    // "insurance" is on the page exactly once, inside a regulator's own
    // sentence. Quoting a board is not selling a field.
    expect(COUNTED.replace(/“[^”]*”/g, ' ')).not.toMatch(/insurance/i);
    expect(HERO.subhead).not.toMatch(/bond|insurance/i);
  });

  it('no photograph, and nothing that animates', () => {
    // Comments are where this codebase explains WHY a thing is forbidden, so a
    // grep for forbidden text has to read the CSS and not the prose about it.
    const css = readFileSync(join(appRoot, 'src', 'app', '(marketing)', 'landing.css'), 'utf8').replace(
      /\/\*[\s\S]*?\*\//g,
      ' ',
    );
    expect(css).not.toMatch(/@keyframes|animation:|transition:/);
    expect(css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
    for (const usage of css.match(/var\(--[a-z0-9-]+\)/g) ?? []) expect(usage).toMatch(/var\(--sr-/);
  });
});

describe('the rest of the page', () => {
  it('asks at most six questions and answers each in 45 words or fewer', () => {
    expect(FAQ_STATIC.length).toBeLessThanOrEqual(6);
    const live = faqAnswers(TODAY);
    for (const item of FAQ_STATIC) {
      const answer = item.answer || live.find((candidate) => candidate.id === item.id)?.answer || '';
      expect(answer, item.id).not.toBe('');
      expect(countWords(answer), item.id).toBeLessThanOrEqual(45);
    }
  });

  it('answers the coverage question from the knowledge base, never from a promise', () => {
    const answer = faqAnswers(TODAY).find((item) => item.id === 'coverage')?.answer ?? '';
    for (const state of coverageSummary(TODAY).stateNames) expect(answer).toContain(state);
    expect(HTML).toContain('href="/coverage"');
  });

  it('says what a field-service platform does do, because claiming otherwise is false', () => {
    const answer = faqAnswers(TODAY).find((item) => item.id === 'fsm')?.answer ?? '';
    expect(answer).toMatch(/^Partly\./);
    expect(answer).toContain('They store the date you type');
  });

  it('links the public coverage page and the legal pages from the footer', () => {
    const footer = HTML.slice(HTML.indexOf('id="footer"'));
    for (const href of ['/coverage', '/legal/terms', '/legal/privacy', '/legal/refunds', '/legal/disclaimer']) {
      expect(footer, href).toContain(`href="${href}"`);
    }
    expect(footer).toContain('data-testid="landing-disclaimer"');
    expect(footer).toContain(ENV.companyAddress);
  });

  it('draws the seven Entry Pack steps, with the bond card gone for good', () => {
    expect(ENTRY_PACK_STEPS).toHaveLength(7);
    expect(ENTRY_PACK_STEPS[6]?.title).toBe('What the board does not publish');
    expect(ENTRY_PACK_STEPS.map((step) => step.artefact).join(' ')).not.toMatch(/bond/i);
    expect(ENTRY_PACK_STEPS.filter((step) => step.risk).map((step) => step.n)).toEqual([2, 3]);
  });
});
