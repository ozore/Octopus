/**
 * The landing page's copy is a binding artifact, not a draft.
 *
 * `phase-2-build/identity/landing/index.html` is the reviewed source: BRAND and
 * NAMING bind every sentence, and it carries two review fixes that a careless
 * edit would undo — **H-7** (no delivery-time guarantee until gate G6) and
 * **C-1** (Shield described as email forwarding, never as an automated daily
 * watcher). Porting that page into React is exactly the moment a sentence gets
 * "tidied up".
 *
 * So this test reads the source HTML and asserts that every substantial
 * sentence in its `<main>` still appears, verbatim, in the rendered components.
 * It is a diff between the document and the implementation, run in CI. It needs
 * no network and no keys — it reads a file from the repo.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Faq } from './Faq';
import { Hero } from './Hero';
import { HowItWorks } from './HowItWorks';
import { Pricing } from './Pricing';
import { Proof } from './Proof';

const SOURCE = join(
  process.cwd(),
  '..',
  'phase-2-build',
  'identity',
  'landing',
  'index.html',
);

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&mdash;': '—',
  '&ndash;': '–',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&sect;': '§',
};

function visibleText(html: string): string {
  let text = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  for (const [entity, char] of Object.entries(ENTITIES)) {
    text = text.split(entity).join(char);
  }
  return text.replace(/\s+/g, ' ').trim();
}

function mainOf(html: string): string {
  const start = html.indexOf('<main id="main">');
  const end = html.indexOf('</main>');
  return html.slice(start, end);
}

/** Sentences long enough that their disappearance is a real copy change. */
function sentences(text: string, min = 55): string[] {
  return text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= min);
}

/**
 * Whitespace is normalised OUT of the comparison entirely. `textContent`
 * concatenates across element boundaries with no separator while stripped HTML
 * leaves one, so a sentence that begins immediately after a `<span>` would
 * differ by a single space in every case — noise, not a copy change. This test
 * is about the words.
 */
const squeeze = (text: string) => text.replace(/\s+/g, '');

function renderPage() {
  const { container } = render(
    <>
      <Hero action={() => undefined} />
      <HowItWorks />
      <Proof />
      <Pricing />
      <Faq />
    </>,
  );
  return {
    container,
    text: (container.textContent ?? '').replace(/\s+/g, ' ').trim(),
  };
}

describe('the landing page renders its binding copy verbatim', () => {
  const source = visibleText(mainOf(readFileSync(SOURCE, 'utf8')));

  it('carries every substantial sentence from the reviewed source', () => {
    const { text } = renderPage();
    const packed = squeeze(text);
    const missing = sentences(source).filter((sentence) => !packed.includes(squeeze(sentence)));
    expect(missing).toEqual([]);
  });

  it('keeps the tagline unsplit (BRAND §5.4)', () => {
    const { text: rendered } = renderPage();
    expect(rendered).toContain('Every day dark costs you a day’s sales.');
    expect(rendered).toContain(
      'Get back to selling — with the exact policy clause on your side.',
    );
  });

  it('publishes no success rate (N10 / R11 / X8)', () => {
    const { text: rendered } = renderPage();
    expect(rendered).not.toMatch(/\b(9[0-9]|8[0-9])\s?% (success|reinstatement)/i);
    expect(rendered).toContain('We have not published a win rate');
  });

  it('advertises no delivery-time guarantee (H-7, gate G6)', () => {
    const { text: rendered } = renderPage();
    expect(rendered).not.toMatch(/\d+ minutes or it’?s free/i);
    expect(rendered).not.toMatch(/guaranteed in \d+ minutes/i);
  });

  it('describes Shield as forwarding, never as an automated watcher (C-1)', () => {
    const { text: rendered } = renderPage();
    expect(rendered).not.toMatch(/daily (account-health )?monitoring/i);
    expect(rendered).not.toMatch(/watches your account/i);
    expect(rendered).toContain('You set one forwarding rule');
  });

  it('says "policy clause", never "legal clause" (NAMING §5 invariant 2)', () => {
    const { text: rendered } = renderPage();
    expect(rendered).not.toMatch(/legal clause/i);
    expect(rendered).toMatch(/policy clause/i);
  });

  it('claims no autonomy (NAMING §5 invariant 4)', () => {
    const { text: rendered } = renderPage();
    expect(rendered).not.toMatch(/we file (your appeal|for you)|automatic submission/i);
    expect(rendered).toMatch(/nothing is filed, submitted or logged into on your behalf/i);
  });

  it('keeps exactly one primary action on the page (P6)', () => {
    const { container } = renderPage();
    expect(container.querySelectorAll('.cw-btn--primary')).toHaveLength(1);
  });

  it('keeps the step and pricing cards opaque, so one glass surface per viewport (H-8)', () => {
    const { container } = renderPage();
    const glassy = [...container.querySelectorAll('.cw-card, .cw-price')].filter(
      (el) => !el.classList.contains('cw-mat-0'),
    );
    // The paste card is the page's only non-opaque content surface; the sticky
    // header is the other, and DESIGN_SYSTEM §7 counts the header first.
    expect(glassy.map((el) => el.className)).toEqual([
      expect.stringContaining('cw-lp-paste-card'),
    ]);
  });
});
