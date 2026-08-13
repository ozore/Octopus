/**
 * Pricing is a binding number, not a design detail (D4 tiers, D6 Shield).
 *
 * Spec: IDEA_DOSSIER.md §0 D4 (Rescue $149 / Rescue + Human $399) and D6
 * (Shield $49/mo), ARCHITECTURE.md ADR-007 (Checkout amounts), DESIGN_SYSTEM.md
 * §8.6.
 *
 * WHY A DEDICATED REGRESSION GUARD, SEPARATE FROM copy-fidelity.test.tsx. That
 * test diffs whole sentences against the reviewed landing HTML, which does
 * catch a dropped price — but only on the landing page, and only as a side
 * effect of sentence matching. The two places a seller actually pays —
 * `PaywallTiers` inside the live appeal flow, and the landing page's own
 * `Pricing` section — are separate components with separately hand-typed
 * strings, so a typo in either ($1490, $39.99, $499, a stray extra tier) is a
 * silent revenue-facing defect that no other test in this suite is aimed at.
 * A word-boundary regex is used throughout so "$149" cannot be satisfied by a
 * stray "$1490" or "$149.99" appearing instead of the exact price.
 */

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PaywallTiers } from './PaywallTiers';
import { Pricing } from './landing/Pricing';

/**
 * Matches the amount only when it is not immediately followed by another digit
 * or a decimal fraction — so "$149" does not accidentally match inside "$1490"
 * or "$149.99". Deliberately NOT `\b` after the digits: `textContent` (and
 * this codebase's own `copy-fidelity.test.tsx`) both note that concatenating
 * across element boundaries adds no separator, so "$149" immediately followed
 * by the next paragraph's first word ("$149You are choosing…") would fail a
 * `\b`-based check for a reason that has nothing to do with the price itself.
 */
function exactAmount(amount: string): RegExp {
  return new RegExp(`\\$${amount}(?!\\d)(?!\\.\\d)`, 'g');
}

function countAmount(text: string, amount: string): number {
  return [...text.matchAll(exactAmount(amount))].length;
}

describe('PaywallTiers — the live checkout prices (D4)', () => {
  it('charges exactly $149 for Rescue: the anchor row, the tier price and the button all agree', () => {
    const { container } = render(<PaywallTiers caseId="case_1" startCheckout={vi.fn()} />);
    const text = container.textContent ?? '';
    expect(countAmount(text, '149')).toBe(3);
  });

  it('charges exactly $399 for Rescue + Human: the tier price and the button agree', () => {
    const { container } = render(<PaywallTiers caseId="case_1" startCheckout={vi.fn()} />);
    const text = container.textContent ?? '';
    expect(countAmount(text, '399')).toBe(2);
  });

  it('never shows a price other than $149 / $399, the $25 consent credit, or the $3,500 / $1,250 anchors', () => {
    const { container } = render(<PaywallTiers caseId="case_1" startCheckout={vi.fn()} />);
    const amounts = [...(container.textContent ?? '').matchAll(/\$[\d,]+/g)].map((m) => m[0]);
    expect(new Set(amounts)).toEqual(new Set(['$3,500', '$1,250', '$149', '$25', '$399']));
  });

  it('submits the checkout form for the $149 tier with tier=rescue', () => {
    const { container } = render(<PaywallTiers caseId="case_1" startCheckout={vi.fn()} />);
    const rescueButton = [...container.querySelectorAll('button')].find((b) =>
      /\$149/.test(b.textContent ?? ''),
    );
    const tierInput = rescueButton?.closest('form')?.querySelector('input[name="tier"]');
    expect((tierInput as HTMLInputElement | null)?.value).toBe('rescue');
  });

  it('submits the checkout form for the $399 tier with tier=rescue_human', () => {
    const { container } = render(<PaywallTiers caseId="case_1" startCheckout={vi.fn()} />);
    const humanButton = [...container.querySelectorAll('button')].find((b) =>
      /\$399/.test(b.textContent ?? ''),
    );
    const tierInput = humanButton?.closest('form')?.querySelector('input[name="tier"]');
    expect((tierInput as HTMLInputElement | null)?.value).toBe('rescue_human');
  });
});

describe('landing Pricing — the public price list (D4 / D6)', () => {
  it('publishes Decoder free, Rescue at $149 and Rescue + Human at $399', () => {
    const { container } = render(<Pricing />);
    const text = container.textContent ?? '';
    expect(text).toMatch(/Free/);
    expect(text).toMatch(exactAmount('149'));
    expect(text).toMatch(exactAmount('399'));
  });

  it('publishes Shield at exactly $49/mo, distinct from Shield Pro’s $149/mo', () => {
    const { container } = render(<Pricing />);
    const text = container.textContent ?? '';
    expect(text).toMatch(/\$49\s*\/mo/);
    expect(text).toMatch(/\$470\/yr/);
    // Shield Pro reuses the Rescue digits ($149) but on a monthly cadence —
    // asserted explicitly so a copy edit cannot quietly collapse the two.
    expect(text).toMatch(/\$149\/mo for up to ten/);
  });

  it('never inflates or discounts a tier price relative to PaywallTiers (single source of truth)', () => {
    const { container: paywall } = render(<PaywallTiers caseId="case_1" startCheckout={vi.fn()} />);
    const { container: landing } = render(<Pricing />);
    for (const amount of ['149', '399']) {
      expect(paywall.textContent ?? '').toMatch(exactAmount(amount));
      expect(landing.textContent ?? '').toMatch(exactAmount(amount));
    }
  });

  it('carries no scarcity furniture on any tier (X1)', () => {
    const { container } = render(<Pricing />);
    expect(container.textContent ?? '').not.toMatch(
      /countdown|only \d+ left|offer ends|expires in|was \$\d|people (are )?viewing/i,
    );
  });
});
