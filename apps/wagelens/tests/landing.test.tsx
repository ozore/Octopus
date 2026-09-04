/**
 * THE LANDING PAGE'S PROPERTIES, AS TESTS (LANDING_SPEC.md §14).
 *
 * The one that matters most is the first: **450 words above the pricing
 * block**, counted by §2's own convention, so the page cannot quietly grow
 * into the brochure the whole document exists to prevent. The rest are the
 * checklist items that are cheap to assert and expensive to notice by eye — no
 * banned figure, no purchase control on the tier that is not for sale, no
 * event name this page coined, no raw colour, no third-party resource, and a
 * disclaimer on every surface that shows a rate.
 *
 * §2's counting convention, implemented exactly:
 *   · a word is a whitespace-separated token containing at least one letter or
 *     digit, so `WH-347`, `5.5(a)(3)(ii)(G)` and `$99` count ONE each and an
 *     em-dash counts zero;
 *   · **step numerals are layout chrome** and are not counted;
 *   · **field labels and their help text are controls** and are not counted —
 *     which is why `<label>`, `<select>`, `<option>` and `.wl-field__help` are
 *     skipped wherever they appear, rather than needing an attribute;
 *   · **button labels and standing notices ARE copy** and are counted;
 *   · data the widget renders — the classification rows, the candidate list,
 *     the modification dates, the drawings' own labels — is not copy, and is
 *     marked `data-wordcount="exclude"` in the DOM so the exclusion is visible
 *     in the source rather than living in this file;
 *   · the rendered WH-347 artefact is excluded by the same rule (§2), as is
 *     the DOL burden statement, which is a quotation with its source rather
 *     than a sentence of ours;
 *   · a REPEATED call to action is the same offer and is counted once, which
 *     is how LANDING_SPEC's own arithmetic treats it.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { AboveThePricingBlock } from '../src/components/landing/sections';
import { PricingBlock } from '../src/components/landing/pricing';
import { LandingFaq } from '../src/components/landing/faq';
import { LANDING_CLIENT_EVENTS } from '../src/components/landing/events';
import { CAPTIONS, HERO, LEDGER, LOOKUP, PROOF, REFUSALS, STEPS, FRIDAY_LINE } from '../src/components/landing/copy';
import { WL_EVENTS } from '../src/lib/analytics/events';
import { candidate, landingData, PROOF_PROPS } from './landing-fixture';
import type { LandingData } from '../src/components/landing/demo-data';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** LANDING_SPEC §2. The ceiling, not a target. */
const CEILING = 450;

const SKIP_TAGS = new Set(['label', 'select', 'option', 'optgroup', 'datalist', 'title', 'desc', 'script', 'style']);
/** HTML void elements only. SVG shapes are NOT void — React closes them with
 *  a real end tag, and treating `<path>` as void would unbalance the stack and
 *  silently stop excluding everything after the first drawing. */
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source',
  'track', 'wbr',
]);

function decode(text: string): string {
  return text
    .replaceAll('&#x27;', '’')
    .replaceAll('&#39;', '’')
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&nbsp;', ' ');
}

/** The counted text of a rendered tree, with the excluded subtrees removed. */
export function countedText(html: string): string {
  const tagPattern = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/?)>/g;
  const stack: Array<{ tag: string; skip: boolean }> = [];
  let skipDepth = 0;
  const kept: string[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(html)) !== null) {
    if (skipDepth === 0) kept.push(html.slice(cursor, match.index));
    cursor = tagPattern.lastIndex;

    const closing = match[1] === '/';
    const tag = (match[2] as string).toLowerCase();
    const attrs = match[3] ?? '';
    const selfClosing = match[4] === '/' || VOID_TAGS.has(tag);

    if (closing) {
      // Unwind to the matching open tag. Popping blind would let one stray
      // element switch the exclusion off for the rest of the document.
      const at = stack.map((entry) => entry.tag).lastIndexOf(tag);
      if (at >= 0) {
        for (const entry of stack.splice(at)) if (entry.skip) skipDepth -= 1;
      }
    } else if (!selfClosing) {
      const skip =
        attrs.includes('data-wordcount="exclude"') ||
        SKIP_TAGS.has(tag) ||
        /class="[^"]*wl-field__help/.test(attrs);
      stack.push({ tag, skip });
      if (skip) skipDepth += 1;
    }
  }
  if (skipDepth === 0) kept.push(html.slice(cursor));
  return decode(kept.join(' '));
}

export function countWords(html: string): string[] {
  return countedText(html)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => /[\p{L}\p{N}]/u.test(token));
}

function aboveThePricingBlock(): string {
  return renderToStaticMarkup(
    <AboveThePricingBlock data={landingData()} proof={PROOF_PROPS} />,
  );
}

describe('the word budget above the pricing block (LANDING_SPEC §2)', () => {
  const words = countWords(aboveThePricingBlock());

  it(`counts ${words.length} words against a ceiling of ${CEILING}`, () => {
    // Printed on failure so the diff names the words, not only the number.
    expect(words.length, `above the pricing block: ${words.join(' ')}`).toBeLessThanOrEqual(CEILING);
  });

  it('stays under the ceiling in every state the widget can be in', () => {
    // The default paint is not the worst case: the ambiguous result adds its
    // 12-word disambiguating line and the empty result adds its refusal, and
    // both are copy. Counted separately so the budget holds for the visitor
    // who meets them, not only for the visitor who does not.
    const base = landingData();
    const states: Array<[string, LandingData]> = [
      ['first paint', base],
      [
        'ambiguous',
        landingData({
          selection: { state: 'TX', county: 'harris', type: 'Heavy' },
          result: {
            kind: 'candidates',
            countyLabel: 'Harris County, TX',
            candidates: [candidate(), candidate({ wdId: 'wd_2', wdNumber: 'TX20260031' })],
          },
        }),
      ],
      [
        'no determination',
        landingData({
          selection: { state: 'TX', county: 'bastrop', type: 'Building' },
          result: {
            kind: 'empty',
            countyLabel: 'Bastrop County, TX',
            constructionType: 'Building',
            href: '/lookup/tx/bastrop/all',
          },
        }),
      ],
      [
        'an earlier modification chosen',
        landingData({
          result: {
            ...(base.result as Extract<LandingData['result'], { kind: 'determination' }>),
            pinned: 0,
            current: 1,
          },
        }),
      ],
    ];
    for (const [label, data] of states) {
      const count = countWords(
        renderToStaticMarkup(<AboveThePricingBlock data={data} proof={PROOF_PROPS} />),
      ).length;
      expect(count, `${label}: ${count} words`).toBeLessThanOrEqual(CEILING);
    }
  });

  it('spends the budget on the sections the spec budgets, and no others', () => {
    // Every counted string in copy.ts is on the page; nothing counted is
    // written anywhere else. This is what stops the budget and the page from
    // drifting apart between edits.
    const text = countedText(aboveThePricingBlock()).replace(/\s+/g, ' ');
    for (const line of [
      HERO.headline,
      HERO.sub,
      HERO.microcopy,
      LOOKUP.heading,
      LOOKUP.notice,
      LEDGER.heading,
      LEDGER.body,
      LEDGER.closing,
      FRIDAY_LINE,
      PROOF.heading,
      PROOF.body,
      PROOF.noRateHeading,
      PROOF.noRateBody,
      PROOF.audit,
      REFUSALS.heading,
      REFUSALS.body,
      CAPTIONS.wall,
      CAPTIONS.form,
    ]) {
      expect(text, `missing from the page: ${line}`).toContain(line.replace(/\s+/g, ' '));
    }
    for (const step of STEPS) {
      expect(text).toContain(step.crosshead);
      expect(text).toContain(step.body.replace(/\s+/g, ' '));
    }
  });

  it('does not count the data the widget renders, the artefact, or a step numeral', () => {
    const text = countedText(aboveThePricingBlock());
    // Classification labels and rate figures are data.
    expect(text).not.toContain('ELECTRICIAN');
    expect(text).not.toContain('$38.50');
    // The step numerals are layout chrome (§2's rule, named explicitly).
    expect(text).not.toContain('Step 01');
    // The rendered WH-347 and the DOL burden quotation are excluded.
    expect(text).not.toContain('WILLFUL FALSIFICATION');
    expect(text).not.toContain('55 minutes to complete this collection');
  });
});

describe('what the page may never contain (LANDING_SPEC §5, §14)', () => {
  const whole =
    aboveThePricingBlock() +
    renderToStaticMarkup(<PricingBlock supportEmail="support@example.test" />) +
    renderToStaticMarkup(<LandingFaq />);

  it('carries no banned figure and no claim we cannot support', () => {
    expect(whole).not.toMatch(/13,508/);
    expect(whole).not.toMatch(/success rate/i);
    expect(whole).not.toMatch(/audit[- ]proof/i);
    expect(whole).not.toMatch(/100%\s*accurate/i);
    expect(whole).not.toMatch(/guarantee[sd]? compliance|guaranteed compliant/i);
    expect(whole).not.toMatch(/\bseamless\b|\beffortless\b/i);
  });

  it('never calls the trial free, and every paid call to action names it', () => {
    expect(whole).not.toMatch(/Start free/i);
    expect(whole).toContain('Start 14-day trial');
  });

  it('carries no refund sentence without its cap in the same sentence (finding B8)', () => {
    for (const sentence of whole.split(/(?<=[.!?])\s+/)) {
      if (/refund/i.test(sentence)) expect(sentence).toMatch(/up to three/i);
    }
  });

  it('shows no testimonial, no customer logo and no federal seal', () => {
    expect(whole).not.toMatch(/<img|<figure[^>]*logo|testimonial/i);
    expect(whole).not.toMatch(/as seen in|trusted by \d/i);
  });

  it('loads nothing from a third party: no image, no script, no font, no stylesheet', () => {
    expect(whole).not.toMatch(/<img\b/);
    expect(whole).not.toMatch(/<script\b/);
    expect(whole).not.toMatch(/<iframe\b/);
    expect(whole).not.toMatch(/<link\b/);
    expect(whole).not.toMatch(/url\(https?:/);
    // Off-site URLs may appear only as links the reader chooses to follow.
    const offsite = [...whole.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]);
    for (const url of offsite) {
      expect(url, `off-site reference: ${url}`).toMatch(/^https:\/\/(sam\.gov|www\.dol\.gov)\//);
    }
  });
});

describe('the GC tier is published and not for sale (finding B2)', () => {
  const pricing = renderToStaticMarkup(<PricingBlock supportEmail="support@example.test" />);
  const card = pricing.slice(
    pricing.indexOf('data-testid="gc-waitlist"'),
    pricing.indexOf('data-testid="comparison-table"'),
  );

  it('shows the price, marks it coming, and offers a waitlist', () => {
    expect(card).toContain('$299');
    expect(card).toContain('coming');
    expect(card).toContain('Join the list');
  });

  it('contains no purchase control of any kind', () => {
    expect(card).not.toMatch(/Start 14-day trial|Subscribe|Buy|Checkout|<form/i);
    expect(card).not.toMatch(/href="\/login\?plan=gc"/);
  });

  it('states in words that nothing in it is for sale yet', () => {
    expect(card).toMatch(/none of it is for sale yet/i);
  });
});

describe('gate G8 on the landing page — no rate renders without its source', () => {
  const CURRENCY = /\$\d[\d,]*\.\d{2}/g;

  function everyRateCarriesProvenance(html: string): boolean {
    const segments = html.split(/(?=<)/);
    let depthWithProvenance = 0;
    let open = 0;
    for (const segment of segments) {
      const isClosing = segment.startsWith('</');
      const isSelfClosing = /\/>$/.test(segment);
      const hasProvenance =
        /data-wd-number="/.test(segment) && /data-modification="/.test(segment);
      if (!isClosing && segment.startsWith('<') && !isSelfClosing) {
        open += 1;
        if (hasProvenance) depthWithProvenance = depthWithProvenance || open;
      }
      const text = segment.replace(/^<[^>]*>/, '');
      if (CURRENCY.test(text)) {
        CURRENCY.lastIndex = 0;
        if (depthWithProvenance === 0) return false;
      }
      if (isClosing) {
        if (depthWithProvenance === open) depthWithProvenance = 0;
        open -= 1;
      }
    }
    return true;
  }

  it('stamps the determination onto every figure, including the rendered form', () => {
    const html = aboveThePricingBlock();
    expect(html).toMatch(CURRENCY);
    CURRENCY.lastIndex = 0;
    expect(everyRateCarriesProvenance(html)).toBe(true);
  });
});

describe('the page coins no event name (finding B6)', () => {
  it('every event the browser can ask for is in WL-EVENTS.md', () => {
    for (const name of LANDING_CLIENT_EVENTS) {
      expect(WL_EVENTS as readonly string[]).toContain(name);
    }
  });

  it('emits both halves of the ratio THRESHOLDS.md §1 pre-commits to', () => {
    const page = readFileSync(join(appRoot, 'src', 'app', '(marketing)', 'page.tsx'), 'utf8');
    expect(page).toContain("'lookup_performed'");
    expect(LANDING_CLIENT_EVENTS as readonly string[]).toContain('lookup_cta_clicked');
  });
});

describe('the identity is built from tokens, and motion is optional', () => {
  const css = readFileSync(join(appRoot, 'src', 'styles', 'landing.css'), 'utf8');

  it('the landing stylesheet contains no raw colour', () => {
    const raw = css.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g) ?? [];
    expect(raw, `use --wl-* tokens, not ${raw[0]}`).toEqual([]);
  });

  it('binds every choreography duration to the identity’s motion tokens', () => {
    for (const token of ['--wl-dur-1', '--wl-dur-2', '--wl-dur-3', '--wl-ease']) {
      expect(css).toContain(token);
    }
  });

  it('honours prefers-reduced-motion for V1, V2, V3, V4 and V5', () => {
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    for (const cls of [
      'wl-land__rateline', // V1 rows
      'wl-land__chip', // V1 source chip
      'wl-land__axis', // V2
      'wl-land__marker',
      'wl-land__pin',
      'wl-land__bracket',
      'wl-land__cell', // V3
      'wl-land__page2', // V5
    ]) {
      expect(reduced, `${cls} must stop moving`).toContain(cls);
    }
    expect(reduced).toContain('animation-duration: 1ms !important');
  });
});
