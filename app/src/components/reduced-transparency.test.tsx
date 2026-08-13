/**
 * `prefers-reduced-transparency` (A3) is "a first-class alternate rendering
 * with identical spacing and hierarchy, and CERTIFIED contrast" — the design
 * system's own words for the media block in `design-system.css`. It works
 * ONLY because every translucent surface in the app is built from a small,
 * closed set of class names (`app-pages.css`'s rule 2: "No bespoke
 * `backdrop-filter`. Every translucent surface on every screen is `.cw-header`,
 * `.cw-card`, `.cw-price` or `.cw-sheet`").
 *
 * THIS IS THE FAILURE MODE THIS FILE IS FOR. jsdom does not evaluate
 * `prefers-reduced-transparency` media queries or compute real styles, so no
 * component test can observe the fallback firing. What a component test CAN
 * observe — and what actually breaks the fallback in practice — is a surface
 * that quietly stops carrying one of those class names: a card built with a
 * bespoke `<div style={{backdropFilter: ...}}>`, or a `.cw-card` added to a
 * new screen without its `.cw-mat-0` opacity partner (H-8). Either would look
 * identical in a screenshot and would leave a `prefers-reduced-transparency`
 * reader staring at a translucent panel CSS never opts back to opaque.
 *
 * So this file checks the two ends of the contract:
 *  1. The CSS still declares the exact selector list the fallback depends on
 *     (a regression guard on `design-system.css` itself).
 *  2. Every component source file that uses `.cw-card` or `.cw-price` pairs it
 *     with `.cw-mat-0`, with one documented, deliberate exception — and no
 *     component anywhere sets `backdrop-filter` inline, bypassing the system
 *     classes entirely.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CritiquePanel } from './CritiquePanel';
import { EscalationCard } from './EscalationCard';
import { PaywallTiers } from './PaywallTiers';
import { SiteHeader } from './SiteHeader';
import type { Critique } from '@/lib/domain/types';

const SRC_ROOT = join(process.cwd(), 'src');
const DESIGN_SYSTEM_CSS = join(SRC_ROOT, 'styles', 'design-system.css');

/** Every `.tsx`/`.css` file under `src`, excluding this suite's own tests and
 *  build output. */
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, out);
    } else if (/\.(tsx|css)$/.test(entry) && !entry.endsWith('.test.tsx')) {
      out.push(full);
    }
  }
  return out;
}

/** The `@media (prefers-reduced-transparency: reduce) { ... }` block, matched
 *  by counting braces rather than a lazy regex — the block itself contains
 *  nested rule blocks, so `.*?}` would stop at the first inner `}`. */
function extractReducedTransparencyBlock(css: string): string {
  const start = css.indexOf('@media (prefers-reduced-transparency: reduce)');
  expect(start, 'design-system.css must still declare the A3 media query').toBeGreaterThanOrEqual(0);
  const braceStart = css.indexOf('{', start);
  let depth = 0;
  for (let i = braceStart; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') {
      depth--;
      if (depth === 0) return css.slice(braceStart, i + 1);
    }
  }
  throw new Error('unbalanced braces in the reduced-transparency block');
}

describe('the reduced-transparency CSS contract (A3)', () => {
  const css = readFileSync(DESIGN_SYSTEM_CSS, 'utf8');
  const block = extractReducedTransparencyBlock(css);

  it('still opts every material level, plus card/price/sheet/header, back to opaque', () => {
    for (const selector of ['.cw-mat-0', '.cw-mat-1', '.cw-mat-2', '.cw-mat-3', '.cw-card', '.cw-price', '.cw-sheet', '.cw-header']) {
      expect(block, `${selector} must be covered by the A3 fallback`).toContain(selector);
    }
  });

  it('forces backdrop-filter off, not merely the background, on the covered surfaces', () => {
    expect(block).toMatch(/backdrop-filter:\s*none\s*!important/);
  });

  it('keeps the secondary button legible against an opaque card (it must not use the card surface)', () => {
    expect(block).toContain('.cw-btn--secondary');
  });

  it('does not remove the citation’s identity edge — only its background', () => {
    // The A3 block deliberately does not touch `border-inline-start-color` for
    // `.cw-cite`'s left rule with the hairline token; it re-asserts the cite
    // edge token instead. A future edit that started overwriting it with the
    // generic hairline would be silently erasing the one border DESIGN_SYSTEM
    // calls out as identity, not decoration.
    expect(block).toContain('border-inline-start-color: var(--cw-cite-edge)');
  });
});

describe('no component bypasses the system glass classes with a bespoke transparency', () => {
  const files = walk(SRC_ROOT).filter((f) => f !== DESIGN_SYSTEM_CSS);

  it('declares backdrop-filter nowhere outside design-system.css (app-pages.css rule 2)', () => {
    // Strip comments first — `app-pages.css`'s header PROSE names
    // `backdrop-filter` while explaining why none is declared there, and that
    // sentence is not the violation this test is looking for.
    const withoutComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '');
    const offenders = files.filter((f) => /backdrop-filter/i.test(withoutComments(readFileSync(f, 'utf8'))));
    expect(offenders).toEqual([]);
  });

  it('never sets a bespoke inline backdropFilter style from a component', () => {
    const offenders = files
      .filter((f) => f.endsWith('.tsx'))
      .filter((f) => /backdropFilter/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});

describe('every .cw-card / .cw-price surface carries its A3 opacity partner (H-8)', () => {
  /** `.cw-lp-paste-card` is the one deliberate, documented exception — the
   *  landing page's own regression test (`copy-fidelity.test.tsx`) already
   *  pins it as "the page's only non-opaque content surface". Anything else
   *  reaching this allowlist is a real gap, not a style choice. */
  const ALLOWED_GLASS = new Set(['cw-lp-paste-card']);

  const files = walk(SRC_ROOT).filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));
  const classAttr = /className=(?:"([^"]*)"|\{`([^`]*)`\})/g;

  const violations: { file: string; classes: string }[] = [];
  for (const file of files) {
    const contents = readFileSync(file, 'utf8');
    for (const match of contents.matchAll(classAttr)) {
      const classes = (match[1] ?? match[2] ?? '').split(/\s+/).filter(Boolean);
      const hasCard = classes.includes('cw-card') || classes.includes('cw-price');
      if (!hasCard) continue;
      const hasMat = classes.some((c) => c.startsWith('cw-mat-'));
      const allowed = classes.some((c) => ALLOWED_GLASS.has(c));
      if (!hasMat && !allowed) violations.push({ file, classes: classes.join(' ') });
    }
  }

  it('has no undocumented translucent card or price surface anywhere in the app', () => {
    expect(violations).toEqual([]);
  });

  it('still finds the one documented exception, so the allowlist itself is not stale', () => {
    // If nothing in the tree carries `cw-lp-paste-card` any more, the allowlist
    // above is dead weight and the real invariant ("nothing else may skip
    // cw-mat-N") is silently weaker than it looks.
    const found = files.some((f) => readFileSync(f, 'utf8').includes('cw-lp-paste-card'));
    expect(found).toBe(true);
  });
});

describe('the header stays the app’s one persistently-glass surface, by design', () => {
  it('SiteHeader carries .cw-header — covered by the A3 fallback — and never .cw-mat-0', () => {
    const { container } = render(<SiteHeader />);
    const header = container.querySelector('header')!;
    expect(header.classList.contains('cw-header')).toBe(true);
    // Unlike every card, the header is meant to stay translucent by default;
    // A3 opts it back to opaque at the CSS layer, not by an app-level class.
    expect(header.classList.contains('cw-mat-0')).toBe(false);
  });
});

describe('rendered app-screen cards are opaque and A3-covered at once (live check)', () => {
  const critique: Critique = {
    readinessScore: 50,
    criteria: [{ id: 'x', met: false, weight: 100, deficiency: 'missing' }],
    blockingDeficiencies: ['missing'],
    evidenceKitGaps: [],
  };

  it('CritiquePanel', () => {
    const { container } = render(<CritiquePanel critique={critique} headingId="t" />);
    const section = container.querySelector('section')!;
    expect(section.classList.contains('cw-card')).toBe(true);
    expect(section.classList.contains('cw-mat-0')).toBe(true);
  });

  it('EscalationCard', () => {
    const { container } = render(
      <EscalationCard caseId="case_1" detail="low confidence" disposition="human_tier" />,
    );
    const section = container.querySelector('section')!;
    expect(section.classList.contains('cw-card')).toBe(true);
    expect(section.classList.contains('cw-mat-0')).toBe(true);
  });

  it('PaywallTiers — the outer panel and both tier cards', () => {
    const { container } = render(<PaywallTiers caseId="case_1" startCheckout={() => undefined} />);
    for (const el of container.querySelectorAll('.cw-card, .cw-price')) {
      expect(el.classList.contains('cw-mat-0')).toBe(true);
    }
  });
});
