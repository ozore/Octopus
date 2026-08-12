/**
 * The landing page — `/`.
 *
 * Spec: `phase-2-build/identity/landing/index.html`, which this route renders as
 * React components with the copy VERBATIM, including both review passes it
 * carries: H-7 (no delivery-time guarantee anywhere on this page until gate G6
 * clears — ARCHITECTURE.md §9) and H-8 (step and pricing cards take `.cw-mat-0`
 * so the viewport holds ONE translucent surface, the header, against a budget of
 * three — DESIGN_SYSTEM §7).
 *
 * THE COPY IS THE SPEC. BRAND and NAMING bind every sentence on this page:
 * "policy clause" never "legal clause"; no claim of autonomy; no success rate
 * until B9 yields one with its denominator; no scarcity furniture (X1). A copy
 * edit here is a document change first, a code change second.
 *
 * ONE PRIMARY ACTION (P6). The paste box's button is the only
 * `.cw-btn--primary` on the page; every pricing CTA is a secondary button that
 * points back at the same box, because every tier starts in the same place —
 * you read your clause first, then you decide.
 */

import { Faq } from '@/components/landing/Faq';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Pricing } from '@/components/landing/Pricing';
import { Proof } from '@/components/landing/Proof';
import { SiteHeader } from '@/components/SiteHeader';

import { startAppeal } from './_lib/actions';

export default function LandingPage() {
  return (
    <>
      <a className="cw-lp-skip" href="#main">
        Skip to the notice box
      </a>

      <SiteHeader />

      <main id="main">
        <Hero action={startAppeal} />
        <HowItWorks />
        <Proof />
        <Pricing />
        <Faq />
      </main>

      <LandingFooter />
    </>
  );
}
