/**
 * THE SECTIONS ABOVE THE PRICING BLOCK (LANDING_SPEC §§1–6).
 *
 * They are pure components taking props, and that is what makes the word
 * budget assertable: `tests/landing.test.tsx` renders exactly these, with
 * fixture data, and counts the copy the way §2 says to count it. A section
 * that reached into the database could not be counted, and a budget that
 * cannot be counted is a budget nobody keeps.
 *
 * Section order is CXL's anatomy inverted on purpose: the proof arrives first,
 * as a working widget, and the argument follows it (NN/g's F-pattern — "the
 * first two paragraphs must state the most important information").
 */

import Link from 'next/link';
import type { ReactNode } from 'react';

import { CAPTIONS, FRIDAY_LINE, HERO, LEDGER, LOOKUP, PROOF, REFUSALS, STEPS } from './copy';
import type { LandingData } from './demo-data';
import { LandingDemo, LandingWidget } from './demo';
import { FridayWall } from './visuals/friday-wall';
import { MinuteLedger } from './visuals/ledger';
import { Wh347Artefact, type ArtefactCrewMember } from './visuals/wh347-artefact';
import type { Provenance } from '@/components/provenance';

/**
 * §1 — the hero. One action: both buttons do the same thing, and the H1's
 * button puts the cursor in the widget's first field. "Sign in" in the bar is
 * the only other interactive target above the fold.
 */
export function Hero({ data }: { data: LandingData }) {
  return (
    <section className="wl-land__hero" data-testid="landing-hero">
      <div className="wl-stack">
        <span className="wl-land__rule" aria-hidden="true" />
        <h1>{HERO.headline}</h1>
        <p className="wl-land__sub">{HERO.sub}</p>
        <p className="wl-land__hero-actions">
          <a
            className="wl-btn wl-btn--primary wl-btn--lg"
            href="#state"
            data-testid="hero-cta"
            data-wl-click="hero_cta_clicked"
            data-wl-prop-variant="h1"
          >
            {HERO.cta} →
          </a>
        </p>
        <p className="wl-land__micro">{HERO.microcopy}</p>
      </div>
      <LandingWidget data={data} />
    </section>
  );
}

/** §2 — the result, its standing notice, and the one escalation. */
export function RateLookupSection({ data }: { data: LandingData }) {
  const wdNumber =
    data.result.kind === 'determination' ? data.result.determination.wdNumber : undefined;
  const trialHref = wdNumber
    ? `/login?next=${encodeURIComponent(`/projects/new?wd=${wdNumber}`)}`
    : '/login?plan=shop';

  return (
    <section className="wl-land__section" id="rates" data-testid="landing-lookup">
      <h2>{LOOKUP.heading}</h2>
      <div className="wl-alert wl-alert--info" role="note" data-testid="landing-notice">
        <div>
          <p className="wl-alert__body">{LOOKUP.notice}</p>
        </div>
      </div>

      <LandingDemo data={data} />

      <p className="wl-land__hero-actions">
        <span>{LOOKUP.escalation}</span>
        <Link
          className="wl-btn wl-btn--primary"
          href={trialHref}
          data-testid="lookup-cta"
          data-wl-click="lookup_cta_clicked"
          {...(wdNumber ? { 'data-wl-prop-wd-number': wdNumber } : {})}
        >
          Start 14-day trial →
        </Link>
      </p>
    </section>
  );
}

/** §3 — what Friday costs. V4 renders here and computes in the browser. */
export function FridayCostSection() {
  return (
    <section className="wl-land__section" id="cost" data-testid="landing-cost">
      <h2>{LEDGER.heading}</h2>
      <p className="wl-land__lede">{LEDGER.body}</p>
      <MinuteLedger />
      <p className="wl-land__note">{LEDGER.closing}</p>
    </section>
  );
}

/** §4 — how it works, and the line addressed to the person who does it. */
export function HowItWorksSection() {
  return (
    <section className="wl-land__section" id="how" data-testid="landing-how">
      <h2>How it works</h2>
      <div className="wl-land__steps">
        {STEPS.map((step, i) => (
          <article
            className="wl-land__step"
            key={step.numeral}
            data-wl-view="how_step_viewed"
            data-wl-prop-step={String(i + 1)}
          >
            {/* Layout chrome, and not counted: LANDING_SPEC §2's counting rule
                names the step numerals explicitly. */}
            <span className="wl-land__step-no" data-wordcount="exclude">
              {step.numeral}
            </span>
            <h3>{step.crosshead}</h3>
            <p>{step.body}</p>
          </article>
        ))}
      </div>
      <p className="wl-land__friday">{FRIDAY_LINE}</p>
      <FridayWall caption={CAPTIONS.wall} />
    </section>
  );
}

/**
 * §5 — proof, and the rules are hard ones. No testimonial, no logo, no seal,
 * no rate or count about us, no penalty figure (the one the ideation fleet
 * carried does not survive verification against DOL's own table — ERRATA E3),
 * no countdown. What is allowed is
 * the visitor's own verification, the artefact, the regulation quoted with its
 * link, and what we refuse to do.
 *
 * The provenance guarantee (`OFFER.md` §5.2 G2) is **absent from this page
 * unconditionally** until the founder and counsel sign its wording, and no
 * refund sentence appears anywhere without its cap in the same sentence
 * (finding B8). There is no refund sentence here at all.
 */
export function ProofSection({
  provenance,
  crew,
  projectName,
  countyLabel,
  weekEnding,
}: {
  provenance: Provenance | null;
  crew: ArtefactCrewMember[];
  projectName: string;
  countyLabel: string;
  weekEnding: string;
}) {
  return (
    <section className="wl-land__section" id="proof" data-testid="landing-proof">
      <h2>{PROOF.heading}</h2>
      <p className="wl-land__lede">{PROOF.body}</p>

      {provenance && crew.length > 0 ? (
        <Wh347Artefact
          provenance={provenance}
          crew={crew}
          caption={CAPTIONS.form}
          projectName={projectName}
          countyLabel={countyLabel}
          weekEnding={weekEnding}
          payrollNumber={8}
        />
      ) : null}

      <div>
        <h3 className="wl-land__lede">{PROOF.noRateHeading}</h3>
        <p className="wl-land__lede">{PROOF.noRateBody}</p>
      </div>
      <p className="wl-land__note">{PROOF.audit}</p>
    </section>
  );
}

/** §6 — the anti-guarantee. */
export function RefusalsSection() {
  return (
    <section className="wl-land__section" id="refusals" data-testid="landing-refusals">
      <h2>{REFUSALS.heading}</h2>
      <p className="wl-land__lede">{REFUSALS.body}</p>
    </section>
  );
}

/**
 * Everything above the pricing block, in order. One export, so the CI word
 * count and the page can never disagree about where the boundary is.
 */
export function AboveThePricingBlock({
  data,
  proof,
  sticky,
}: {
  data: LandingData;
  proof: Parameters<typeof ProofSection>[0];
  /** The sticky call to action. It is the LAST child of the zone that runs
   *  from §3 to §6, which is how "appears after the visitor passes V1 and
   *  disappears in the pricing block" (§11) is built with `position: sticky`
   *  and no JavaScript at all. */
  sticky?: ReactNode;
}): ReactNode {
  return (
    <>
      <Hero data={data} />
      <RateLookupSection data={data} />
      <div className="wl-land__zone">
        <FridayCostSection />
        <HowItWorksSection />
        <ProofSection {...proof} />
        <RefusalsSection />
        {sticky}
      </div>
    </>
  );
}
