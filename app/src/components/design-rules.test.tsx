/**
 * Design-system rules that are cheap to state and expensive to lose.
 *
 * DESIGN_SYSTEM.md writes each of its principles with a falsifiable test — "a
 * rule that can be checked in review rather than argued about". These are three
 * of those tests, moved out of review and into CI, because a review catches a
 * violation once and a test catches it every time:
 *
 *  - **P6.** Exactly 0 or 1 `.cw-btn--primary` per screen. The paywall is one of
 *    the two screens with a genuinely symmetric choice, so it must have ZERO:
 *    both tiers are secondary and the recommendation is a word.
 *  - **X1 / P5.** No scarcity furniture anywhere. No countdown, no "was $299",
 *    no expiring offer. The system ships no component that can express one, and
 *    this asserts none has been improvised in copy.
 *  - **P4.2 / X3.** The readiness critique is never styled as an error. Amber
 *    and slate only — a red panel produces avoidance, and this list has to be
 *    read carefully.
 */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CritiquePanel } from './CritiquePanel';
import { EscalationCard } from './EscalationCard';
import { PaywallTiers } from './PaywallTiers';
import type { Critique } from '@/lib/domain/types';

const noop = () => undefined;

const critique: Critique = {
  readinessScore: 72,
  criteria: [
    { id: 'supplier_invoices', met: false, weight: 30, deficiency: 'No supplier invoices cited.' },
    { id: 'measurable_preventive_control', met: true, weight: 25, deficiency: null },
  ],
  blockingDeficiencies: ['No supplier invoices referenced.'],
  evidenceKitGaps: ['Invoices from the last 365 days'],
};

const SCARCITY = /countdown|only \d+ left|offer ends|expires in|was \$\d|people (are )?viewing/i;

describe('the paywall obeys P6 and X1', () => {
  it('has no primary button at all — both tiers are a real symmetric choice', () => {
    const { container } = render(<PaywallTiers caseId="case_1" startCheckout={noop} />);
    expect(container.querySelectorAll('.cw-btn--primary')).toHaveLength(0);
    expect(container.querySelectorAll('.cw-btn--secondary').length).toBeGreaterThanOrEqual(2);
  });

  it('states the recommendation in words, via a chip, not by contrast', () => {
    const { container } = render(<PaywallTiers caseId="case_1" startCheckout={noop} />);
    expect(container.querySelectorAll('.cw-chip--recommend')).toHaveLength(1);
  });

  it('ships no scarcity furniture', () => {
    const { container } = render(<PaywallTiers caseId="case_1" startCheckout={noop} />);
    expect(container.textContent ?? '').not.toMatch(SCARCITY);
  });

  it('withholds the delivery-time promise until gate G6 clears', () => {
    const { container } = render(<PaywallTiers caseId="case_1" startCheckout={noop} />);
    expect(container.textContent ?? '').not.toMatch(/ten minutes|10 minutes/i);
  });

  it('states the time guarantee only when the gate is explicitly open', () => {
    const { container } = render(
      <PaywallTiers caseId="case_1" startCheckout={noop} timeGuaranteeAdvertised />,
    );
    expect(container.textContent ?? '').toMatch(/ten minutes/i);
  });

  it('leaves outcome consent unticked and separable from the purchase', () => {
    const { container } = render(<PaywallTiers caseId="case_1" startCheckout={noop} />);
    const boxes = [...container.querySelectorAll('input[name="consent"]')] as HTMLInputElement[];
    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) {
      expect(box.checked).toBe(false);
      expect(box.required).toBe(false);
    }
  });
});

describe('the critique is diagnostic, not an alarm', () => {
  it('uses no danger tone anywhere (P4.1 / X3)', () => {
    const { container } = render(<CritiquePanel critique={critique} headingId="t" />);
    expect(container.querySelectorAll('.cw-pill--danger')).toHaveLength(0);
    expect(container.querySelectorAll('.cw-btn--danger')).toHaveLength(0);
    expect(container.querySelectorAll('[class*="danger"]')).toHaveLength(0);
  });

  it('shows every criterion with a met/not-met word, not just a colour (A6)', () => {
    const { container } = render(<CritiquePanel critique={critique} headingId="t" />);
    expect(container.textContent).toContain('Not met yet.');
    expect(container.textContent).toContain('Met.');
  });
});

describe('an escalation is a routing decision, not a failure', () => {
  it('renders in caution, never in rose (P4.2)', () => {
    const { container } = render(
      <EscalationCard caseId="case_1" detail="low confidence" disposition="human_tier" />,
    );
    expect(container.querySelectorAll('.cw-pill--caution')).toHaveLength(1);
    expect(container.querySelectorAll('.cw-pill--danger')).toHaveLength(0);
  });

  it('says plainly that nothing was charged, and offers the human tier', () => {
    const { container } = render(
      <EscalationCard caseId="case_1" detail="low confidence" disposition="human_tier" />,
    );
    expect(container.textContent).toMatch(/not been charged/i);
    expect(container.textContent).toMatch(/\$399/);
  });

  it('routes a refused category to a referral rather than a dead end', () => {
    const { container } = render(
      <EscalationCard caseId="case_1" detail="counterfeit claim" disposition="refer_out" />,
    );
    expect(container.textContent).toMatch(/referral/i);
    expect(container.textContent).not.toMatch(/unsupported|sorry/i);
  });
});
