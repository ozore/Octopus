/**
 * M15 — the landing page itself (`LANDING_SPEC.md`).
 *
 * ONE PROBLEM, ONE PROMISE, ONE CTA. The problem is that a spreadsheet stores a
 * date and cannot store a rule; the promise is every licence and CE hour with
 * the board page it came from and the day we read it; the call to action is the
 * 14-day no-card trial, repeated three times and never varied in wording,
 * because a varied CTA is two CTAs.
 *
 * **Felt, not read.** 79% of visitors scan rather than read, and this audience
 * needs educating, so the education is moved out of the prose and into the five
 * visuals and the demo. That is the whole design thesis, and the 450-word
 * ceiling is what enforces it.
 *
 * THE STRUCTURE THIS FILE GUARANTEES:
 *
 *  - Everything CI counts sits between `id="hero"` and `id="pricing"`. Chrome,
 *    graphic labels, source chips and demo output carry `data-wc="chrome"` and
 *    are excluded by `LANDING_SPEC.md` §1's rule. `tests/landing.test.ts`
 *    renders this component and counts the real DOM: **439 of 450**.
 *  - Every counted string comes from `copy.ts`; every number comes from
 *    `data.ts`, which reads the knowledge base. Nothing on this page is typed
 *    twice, and no figure is typed at all.
 *  - This component is SYNCHRONOUS and takes its data as a prop, so the test
 *    that counts the DOM renders exactly what the route renders.
 *
 * WHAT MAY NEVER APPEAR HERE (`LANDING_SPEC.md` §11, and each has bitten
 * somebody in this category): a testimonial or customer count we do not have; a
 * dollar figure for a lapse, a fine or downtime; a countdown or a fake seat
 * count; a regulatory value without a source chip and a date; a comparison
 * table against a competitor with no customers; any claim that a field-service
 * platform "doesn't do this"; the reinstatement-fee guarantee; the Alert
 * Guarantee; any claim that we build the customer's roster; a bond amount, an
 * insurance minimum or a filing time while those fields are unknown; the EPA
 * 608 penalty; an Illinois plumber CE hour count; photography of any kind; or
 * anything that animates, pulses or reveals on scroll.
 */

import Link from 'next/link';

import { PaperSurface } from '@/components/paper';
import { Disclaimer, DISCLAIMER_SHORT } from '@/components/provenance';
import { getKbRecord, listKbRecords } from '@/lib/kb/accessors';
import type { SourcedValue, Trade } from '@/lib/kb/types';
import { ONE_OFF_PRICES, plans } from '@/lib/plans';

import {
  CTA_LABEL,
  CTA_MICROCOPY,
  coverageLine,
  DEMO,
  divergenceCaption,
  FAQ_STATIC,
  GUARANTEES,
  HERO,
  HOW_IT_WORKS,
  LAPSE,
  PRICING,
  PROOF,
} from './copy';
import {
  buildRulebook,
  coverageSummary,
  divergence,
  divergenceNumbers,
  ENTRY_PACK_STEPS,
  faqAnswers,
  runwayLanes,
  sampleTiles,
  TRADE_LABEL,
  verifiedOrNull,
  type CoverageSummary,
  type Divergence,
  type FaqAnswer,
  type RulebookResult,
  type RunwayLane,
  type TileDatum,
} from './data';
import { DEMO_DEFAULT_STATE, DEMO_DEFAULT_TRADE, RulebookPicker, RulebookResultPanel } from './rulebook';
import { BPC_7031, CE_BROKER_PRICE, CSLB_EXPIRED, NYC_DOB_ACTIVE } from './sources';
import { DivergenceCard, EntryPackSteps, ReadinessGrid, Runway, SourceChip } from './visuals';
import { LANDING_EVENT_SCRIPT } from './events';

export type PlanCard = {
  key: string;
  name: string;
  price: string;
  interval: string;
  limits: string;
  popular: boolean;
};

export type LandingData = {
  today: string;
  billing: 'annual' | 'monthly';
  supportEmail: string;
  companyName: string;
  companyAddress: string;
  appName: string;
  tiles: readonly TileDatum[];
  divergence: Divergence;
  divergenceHours: { hvac: string | null; electrical: string | null };
  runway: readonly RunwayLane[];
  coverage: CoverageSummary;
  demo: RulebookResult;
  demoState: string;
  demoTrade: Trade;
  coveredStates: readonly string[];
  faq: readonly FaqAnswer[];
  plans: readonly PlanCard[];
  entryPack: { first: string; additional: string };
  /** The TDLR sentence, from the knowledge base — §4's only covered-state quote. */
  tdlrLapse: SourcedValue | null;
  /** A value the boards do not publish, so V5's refusal renders from the runtime. */
  unpublished: { value: SourcedValue | null; what: string; boardUrl: string | null; boardName: string | null };
  samplePack: RulebookResult;
};

function Cta({ placement }: { placement: 'hero' | 'proof' | 'pricing' }) {
  return (
    <p className="lp-cta" data-testid={`cta-${placement}`}>
      <Link className="sr-btn sr-btn--primary" data-cta={placement} href={`/login?from=lp&placement=${placement}`}>
        {CTA_LABEL}
      </Link>
      <span className="lp-cta__micro">{CTA_MICROCOPY}</span>
    </p>
  );
}

function Quote({ text, attribution, source, today }: { text: string; attribution: string; source: SourcedValue | null; today: string }) {
  return (
    <li className="lp-quote">
      <blockquote>{text}</blockquote>
      <p className="lp-quote__by">
        {attribution}
        <SourceChip value={source} today={today} what="this rule" />
      </p>
    </li>
  );
}

export function Landing({ data }: { data: LandingData }) {
  const { today } = data;
  const caption =
    data.divergenceHours.hvac && data.divergenceHours.electrical
      ? divergenceCaption(data.divergenceHours.hvac, data.divergenceHours.electrical)
      : null;

  return (
    <main className="lp">
      {/* ---------------------------------------------------------- §2 hero */}
      <section className="lp-hero" id="hero">
        <div className="lp-hero__copy">
          <p className="sr-eyebrow">{HERO.eyebrow}</p>
          <h1 className="lp-h1">{HERO.h1}</h1>
          <p className="lp-lead">{HERO.subhead}</p>
          <Cta placement="hero" />
          <p className="lp-hero__demo-link">
            <a href="#demo" data-lp="demo-link">
              {HERO.demoLink}
            </a>
          </p>
        </div>

        {/* On a phone the divergence card comes first: a US map at 390px is a
            decorative blob, while 8-versus-4 is legible at any size and is the
            stronger argument. On a wide screen the grid leads. Nothing moves;
            the order is CSS, and the DOM order is the mobile one. */}
        <div className="lp-hero__figures">
          <div className="lp-hero__grid">
            <ReadinessGrid tiles={data.tiles} caption="Sample footprint" />
          </div>
          <div className="lp-divergence" id="divergence">
            <DivergenceCard card={data.divergence} today={today} />
            {caption ? <p className="lp-divergence__caption">{caption}</p> : null}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- §4 lapse */}
      <section className="lp-lapse" id="lapse">
        <h2>{LAPSE.heading}</h2>
        <ul className="lp-lapse__quotes">
          <Quote
            text={`“${String(CSLB_EXPIRED.value)}”`}
            attribution={LAPSE.attributions.cslb}
            source={CSLB_EXPIRED}
            today={today}
          />
          <Quote
            text={`“${data.tdlrLapse?.evidence ?? ''}”`}
            attribution={LAPSE.attributions.tdlr}
            source={data.tdlrLapse}
            today={today}
          />
          <Quote
            text={`“${String(NYC_DOB_ACTIVE.value)}”`}
            attribution={LAPSE.attributions.nyc}
            source={NYC_DOB_ACTIVE}
            today={today}
          />
          <Quote
            text={`“${String(BPC_7031.value)}”`}
            attribution={LAPSE.attributions.bpc}
            source={BPC_7031}
            today={today}
          />
        </ul>
        <p className="lp-lapse__closing">{LAPSE.closing}</p>
      </section>

      {/* --------------------------------------------------------- §5 demo */}
      <section className="lp-demo" id="demo">
        <h2>{DEMO.heading}</h2>
        <p className="lp-demo__instruction">{DEMO.instruction}</p>
        <RulebookPicker
          action="/rulebook"
          coveredStates={data.coveredStates}
          state={data.demoState}
          trade={data.demoTrade}
        />
        <RulebookResultPanel result={data.demo} today={today} supportEmail={data.supportEmail} />
      </section>

      {/* ------------------------------------------------- §6 how it works */}
      <section className="lp-how" id="how">
        <ol className="lp-how__steps">
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step.title}>
              <span className="lp-how__n" data-wc="chrome" aria-hidden="true">
                {index + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
        <Runway lanes={data.runway} today={today} />
        <EntryPackSteps
          pagesRead={data.coverage.pagesRead}
          rulebooks={data.coverage.rulebooks}
          steps={ENTRY_PACK_STEPS}
        />
      </section>

      {/* -------------------------------------------------------- §7 proof */}
      <section className="lp-proof" id="proof">
        <h2>{PROOF.heading}</h2>

        <details className="lp-proof__pack" data-lp="sample-pack">
          <summary>{PROOF.samplePack}</summary>
          <PaperSurface className="lp-pack" testId="sample-pack">
            <SamplePackPage result={data.samplePack} today={today} />
          </PaperSurface>
        </details>

        <p className="lp-proof__coverage">
          {coverageLine(data.coverage.refreshedOn ?? 'today')}
          <span className="lp-stats" data-wc="chrome">
            <span className="lp-stat">
              <span className="lp-stat__value">{data.coverage.states.length}</span>
              <span className="lp-stat__label">states</span>
            </span>
            <span className="lp-stat">
              <span className="lp-stat__value">{data.coverage.rulebooks}</span>
              <span className="lp-stat__label">state × trade rulebooks</span>
            </span>
            <span className="lp-stat">
              <span className="lp-stat__value">{data.coverage.licenceTypes}</span>
              <span className="lp-stat__label">licence classes</span>
            </span>
            <span className="lp-stat">
              <span className="lp-stat__value">{data.coverage.verifiedValues}</span>
              <span className="lp-stat__label">verified values</span>
            </span>
            <span className="lp-stat">
              <span className="lp-stat__value">{data.coverage.unverifiedValues}</span>
              <span className="lp-stat__label">named as unverified</span>
            </span>
          </span>
          <span className="lp-proof__links" data-wc="chrome">
            <Link href="/coverage">Every state and trade we cover, with what we could not verify</Link>
          </span>
        </p>

        {/* V5, in both of its states, rendered from the knowledge base. */}
        <p className="lp-proof__chips" data-wc="chrome">
          <span className="lp-proof__chip-demo">
            <span className="lp-proof__chip-label">A value a board publishes</span>
            <SourceChip value={data.divergence.rows[0]?.hours ?? null} today={today} what="these hours" />
          </span>
          <span className="lp-proof__chip-demo">
            <span className="lp-proof__chip-label">A value it does not</span>
            <SourceChip
              value={data.unpublished.value}
              today={today}
              what={data.unpublished.what}
              boardUrl={data.unpublished.boardUrl}
              boardName={data.unpublished.boardName}
            />
          </span>
        </p>

        <p className="lp-proof__not">{PROOF.notExpediter}</p>
      </section>

      <Cta placement="proof" />

      {/* --------------------------------------------------- §8 guarantees */}
      <section className="lp-guarantees" id="guarantees">
        <h2>{GUARANTEES.heading}</h2>
        <div className="lp-guarantee" data-testid="guarantee-accuracy">
          <p>
            {GUARANTEES.accuracyCompressed}{' '}
            <Link href={GUARANTEES.accuracyLinkHref}>{GUARANTEES.accuracyLinkText}</Link>
          </p>
        </div>
        <div className="lp-guarantee" data-testid="guarantee-entry-pack">
          <p>{GUARANTEES.entryPack}</p>
        </div>
      </section>

      <Cta placement="pricing" />

      {/* ------------------------------------ §9 pricing — outside the count */}
      <section className="lp-pricing" id="pricing">
        <h2>{PRICING.heading}</h2>
        <p className="lp-pricing__trial">{PRICING.trialLine}</p>

        <p className="lp-pricing__toggle" role="group" aria-label="Billing period">
          <Link
            aria-current={data.billing === 'annual' ? 'true' : undefined}
            data-lp="plan-toggle"
            data-to="annual"
            href="/?billing=annual#pricing"
          >
            {PRICING.annualLabel}
          </Link>
          <Link
            aria-current={data.billing === 'monthly' ? 'true' : undefined}
            data-lp="plan-toggle"
            data-to="monthly"
            href="/?billing=monthly#pricing"
          >
            {PRICING.monthlyLabel}
          </Link>
        </p>

        <ul className="lp-pricing__cards">
          {data.plans.map((plan) => (
            <li className="lp-plan" key={plan.key} data-popular={plan.popular ? 'true' : undefined}>
              <h3>{plan.name}</h3>
              <p className="lp-plan__price">
                <span className="lp-plan__amount">{plan.price}</span>
                <span className="lp-plan__interval">/{plan.interval}</span>
              </p>
              <p className="lp-plan__limits">{plan.limits}</p>
            </li>
          ))}
        </ul>

        <p className="lp-pricing__triage">
          Tracking four licences for one person? You do not need us — CE Broker is {String(CE_BROKER_PRICE.value)}.
          <SourceChip value={CE_BROKER_PRICE} today={today} what="this price" />
        </p>

        <p className="lp-pricing__oneoff">
          State Entry Pack — {data.entryPack.additional} per state. Your first state: {data.entryPack.first}, credited
          in full if you take an annual plan within 90 days.
          <span className="lp-pricing__reason">{PRICING.oneOffReason}</span>
        </p>

        <p className="lp-pricing__enterprise">
          More than 15 states?{' '}
          <a
            data-lp="enterprise"
            href={`mailto:${data.supportEmail}?subject=${encodeURIComponent('Enterprise enquiry')}`}
          >
            {PRICING.enterpriseLinkText}
          </a>{' '}
          — we will send you a quote within two business days, or tell you we cannot help.
        </p>
      </section>

      {/* ---------------------------------------------------------- §6 FAQ */}
      <section className="lp-faq" id="faq">
        <h2>Questions</h2>
        {FAQ_STATIC.map((item) => {
          const live = data.faq.find((answer) => answer.id === item.id);
          const answer = item.answer || live?.answer || '';
          if (!answer) return null;
          return (
            <details className="lp-faq__item" key={item.id} data-lp="faq" data-faq={item.id}>
              <summary>{item.question}</summary>
              <p>
                {answer}
                {item.id === 'coverage' ? (
                  <>
                    {' '}
                    <Link href="/coverage">See the coverage page</Link>.
                  </>
                ) : null}
                {(live?.sources ?? []).map((source, index) => (
                  <SourceChip key={`${item.id}-${String(index)}`} value={source} today={today} what="this rule" />
                ))}
              </p>
            </details>
          );
        })}
      </section>

      {/* ------------------------------------------------------- §7 footer */}
      <section className="lp-footer" id="footer">
        <div className="lp-footer__cols">
          <div>
            <h3>Product</h3>
            <ul>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li>
                <a href="#demo">Demo</a>
              </li>
              <li>
                <Link href="/coverage">Coverage</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Company</h3>
            <ul>
              <li>
                <Link href="/help">Help</Link>
              </li>
              <li>
                <a href={`mailto:${data.supportEmail}`}>{data.supportEmail}</a>
              </li>
            </ul>
          </div>
          <div>
            <h3>Legal</h3>
            <ul>
              <li>
                <Link href="/legal/terms">Terms</Link>
              </li>
              <li>
                <Link href="/legal/privacy">Privacy</Link>
              </li>
              <li>
                <Link href="/legal/refunds">Refund policy</Link>
              </li>
              <li>
                <Link href="/legal/disclaimer">Disclaimer</Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="lp-footer__disclaimer" data-testid="landing-disclaimer">
          {DISCLAIMER_SHORT}
        </p>
        <p className="lp-footer__legal">
          {data.appName}, a {data.companyName} company · {data.companyAddress} · © {data.today.slice(0, 4)}{' '}
          {data.companyName}
        </p>
      </section>

      <script dangerouslySetInnerHTML={{ __html: LANDING_EVENT_SCRIPT }} />
    </main>
  );
}

/**
 * The sample State Entry Pack page (`LANDING_SPEC.md` §7 item 1) — a real state
 * × trade, real cited rules, **rendered on paper inside the board page**,
 * because paper is what leaves the building and this artefact is the one a
 * coordinator forwards to her GM. It is generated from the committed record, so
 * it cannot describe a product we do not deliver.
 */
function SamplePackPage({ result, today }: { result: RulebookResult; today: string }) {
  if (!result.covered) return null;
  return (
    <div className="lp-pack__page" data-wc="chrome">
      <p className="lp-pack__label">Sample · State Entry Pack, page 1</p>
      <h3>
        {result.stateName} · {TRADE_LABEL[result.trade]}
      </h3>
      <p className="lp-pack__prepared">Prepared for ██████████ Mechanical</p>
      {result.rows.map((row) => (
        <div className="lp-pack__row" key={row.id}>
          <h4>{row.label}</h4>
          <ul>
            {row.entries.map((entry, index) => (
              <li key={`${row.id}-pack-${String(index)}`}>
                {entry.scope ? <strong>{entry.scope}: </strong> : null}
                {entry.text} <SourceChip value={entry.source} today={today} what="this" />
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="lp-pack__row">
        <h4>What the board does not publish</h4>
        <p>{result.gaps.fields.join(' · ') || 'Nothing we look for is missing from this rulebook.'}</p>
      </div>
      <Disclaimer />
    </div>
  );
}

/* ------------------------------------------------------------------------- *
 * The page's data, assembled in one place.
 *
 * Every figure comes from `data.ts` (the knowledge base) or from `plans.ts`
 * (the offer, as data). Nothing is typed here, and the same builder feeds the
 * route and the test that counts the rendered words — so CI counts what a
 * browser paints, not a copy of it.
 * ------------------------------------------------------------------------- */

/**
 * Money, with a thousands separator.
 *
 * The platform's `formatAmount` renders `$1490`, which is right for a table of
 * line items and wrong for a price a stranger reads once: `LANDING_SPEC.md` §5
 * publishes the ladder as `$1,490/yr`. The cents still come from `plans.ts` —
 * only the grouping is local, and a test asserts both.
 */
function money(amountCents: number): string {
  const value = amountCents / 100;
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function buildLandingData(input: {
  today: string;
  billing?: 'annual' | 'monthly';
  appName: string;
  companyName: string;
  companyAddress: string;
  supportEmail: string;
}): LandingData {
  const today = input.today;
  const billing = input.billing ?? 'annual';

  const record = getKbRecord('TX', 'hvac');
  const board = record?.boards[0] ?? null;
  const grace = record?.licence_types[0]?.renewal.grace_period ?? null;
  const bond = record?.licence_types[0]?.bond.amount ?? null;

  const wanted = billing === 'annual' ? ['single_state_annual', 'multistate_annual', 'platform_annual'] : ['single_state', 'multistate', 'platform'];
  const planCards: PlanCard[] = wanted.flatMap((key) => {
    const plan = plans.plans.find((candidate) => candidate.key === key);
    if (!plan) return [];
    const states = Number(plan.limits['states'] ?? 0);
    const technicians = Number(plan.limits['technicians'] ?? 0);
    return [
      {
        key: plan.key,
        name: plan.name.replace(/,\s*annual$/i, ''),
        price: money(plan.amountCents),
        interval: plan.interval === 'year' ? 'year' : 'month',
        limits: `${String(states)} ${states === 1 ? 'state' : 'states'} · ${String(technicians)} technicians`,
        popular: plan.key.startsWith('multistate'),
      },
    ];
  });

  return {
    today,
    billing,
    appName: input.appName,
    companyName: input.companyName,
    companyAddress: input.companyAddress,
    supportEmail: input.supportEmail,
    tiles: sampleTiles(),
    divergence: divergence('TX', today),
    divergenceHours: divergenceNumbers(today),
    runway: runwayLanes(today),
    coverage: coverageSummary(today),
    demo: buildRulebook(DEMO_DEFAULT_STATE, DEMO_DEFAULT_TRADE, today),
    demoState: DEMO_DEFAULT_STATE,
    demoTrade: DEMO_DEFAULT_TRADE,
    coveredStates: [...new Set(listKbRecords().map((r) => r.state))],
    faq: faqAnswers(today),
    plans: planCards,
    entryPack: {
      first: money(ONE_OFF_PRICES.entryPackFirst.amountCents),
      additional: money(ONE_OFF_PRICES.entryPack.amountCents),
    },
    tdlrLapse: verifiedOrNull(grace, today),
    unpublished: {
      value: verifiedOrNull(bond, today),
      what: 'a bond amount for this licence',
      boardUrl: board?.url ?? null,
      boardName: board?.name ?? null,
    },
    samplePack: buildRulebook('NC', 'plumbing', today),
  };
}
