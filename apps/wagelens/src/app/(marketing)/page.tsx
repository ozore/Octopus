import { headers } from 'next/headers';
import Link from 'next/link';

import { LandingFaq } from '@/components/landing/faq';
import { LandingFooter } from '@/components/landing/footer';
import { LandingInstrumentation } from '@/components/landing/instrument';
import { PricingBlock } from '@/components/landing/pricing';
import { AboveThePricingBlock } from '@/components/landing/sections';
import { loadLandingData, type DemoResult, type LandingData } from '@/components/landing/demo-data';
import type { ArtefactCrewMember } from '@/components/landing/visuals/wh347-artefact';
import { getEnv, productName } from '@/env';
import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import { clientIp, consumeLookupBudget, ipHash } from '@/lib/public-request';

import '@/styles/landing.css';

export const dynamic = 'force-dynamic';

/**
 * `/` — THE LANDING PAGE (`phase-4-revenue/wagelens/LANDING_SPEC.md`).
 *
 * ONE JOB, IN TWO MOVES, AND THE ORDER IS NOT NEGOTIABLE. Get a contractor to
 * look up a rate for a county he already knows, be right — and then show him
 * the question he did not know to ask: *which modification of that
 * determination does your contract actually run on?* The lookup earns the
 * right to speak; the modification is the sale.
 *
 * WHAT THIS PAGE MAY NOT CONTAIN, and there is no component here that would
 * make any of it easy to add: a testimonial (we have no customers), a customer
 * logo, a federal seal, an accuracy rate, a customer count, a countdown, a
 * penalty figure, or a call to action that calls the trial free. `OFFER.md`
 * §5.2's provenance guarantee (G2) is cut from the page unconditionally until
 * the founder and counsel sign its wording, and no refund sentence appears
 * anywhere without its cap in the same sentence (finding B8).
 *
 * FOUR PROPERTIES A TEST HOLDS, not a habit:
 *   · **≤ 450 words above the pricing block**, counted by §2's own convention
 *     (`tests/landing.test.tsx`);
 *   · **every rate carries its determination** — the rows go through `<Rate>`,
 *     so gate G8 applies here exactly as it does in the product;
 *   · **no event name is coined** — every one is `specs/WL-EVENTS.md`'s, typed;
 *   · **zero third-party resources.** No tag manager, no chat, no A/B vendor,
 *     no image, no icon font. Every visual is inline SVG or DOM.
 *
 * The page reads and converts with JavaScript off: the widget is a GET form,
 * the FAQ is `<details>`, the artefact is HTML, and the only script on the page
 * records analytics.
 */
export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (key: string): string | undefined =>
    typeof params[key] === 'string' ? (params[key] as string) : undefined;

  const state = one('state');
  const county = one('county');
  const type = one('type');
  const modRaw = one('mod');
  const modification = modRaw !== undefined && /^\d+$/.test(modRaw) ? Number(modRaw) : undefined;

  const db = await getDb();
  const env = getEnv();
  const started = Date.now();

  await emitEvent(db, 'hero_viewed', { props: { variant: 'h1' } });

  const selection = {
    ...(state ? { state } : {}),
    ...(county ? { county } : {}),
    ...(type ? { type } : {}),
    ...(modification !== undefined ? { modification } : {}),
  };

  // A lookup on this page is a lookup: it consumes the same public budget the
  // result page does, and over the limit is an honest message rather than a
  // signup wall (WL-00 V5).
  let data: LandingData;
  const performing = Boolean(state && county);
  const hash = performing ? ipHash(clientIp(await headers())) : null;
  const budget = hash ? await consumeLookupBudget(db, hash) : null;

  if (budget && !budget.allowed) {
    await emitEvent(db, 'public_lookup_rate_limited', { props: { ip_hash: hash as string } });
    const base = await loadLandingData(db, {});
    const limited: DemoResult = {
      kind: 'rate_limited',
      retryAfterMinutes: Math.max(1, Math.ceil(budget.retryAfterSeconds / 60)),
    };
    data = { ...base, selection, result: limited };
  } else {
    data = await loadLandingData(db, selection);
  }

  // The funnel THRESHOLDS.md §1 is computed from, emitted under the specs' own
  // names so the pre-committed band `lookup_cta_clicked ÷ lookup_performed`
  // can actually be divided.
  if (performing && data.result.kind !== 'rate_limited') {
    const countyName =
      data.result.kind === 'determination'
        ? data.result.determination.countyNames[0]
        : data.result.kind === 'candidates' || data.result.kind === 'empty'
          ? data.result.countyLabel
          : undefined;
    await emitEvent(db, 'lookup_performed', {
      props: {
        state_code: (state as string).toUpperCase(),
        ...(countyName ? { county_name: countyName } : {}),
        construction_type: type ?? 'all',
        result_count:
          data.result.kind === 'candidates'
            ? data.result.candidates.length
            : data.result.kind === 'determination'
              ? 1
              : 0,
        latency_ms: Date.now() - started,
        source: 'landing',
        ...(hash ? { ip_hash: hash } : {}),
      },
    });
    if (data.result.kind === 'candidates') {
      await emitEvent(db, 'lookup_ambiguous', {
        props: { candidate_count: data.result.candidates.length },
      });
    }
    if (data.result.kind === 'empty') {
      await emitEvent(db, 'lookup_zero_results', {
        props: {
          state_code: (state as string).toUpperCase(),
          construction_type: type ?? 'all',
        },
      });
    }
  } else if (state && !county) {
    await emitEvent(db, 'lookup_started', { props: { field_first_touched: 'state' } });
  }

  // V5's example week, computed from the determination this page is showing —
  // example crew, example hours, REAL rate. The names are the word "example"
  // because a plausible name is a person somewhere.
  const view = data.result.kind === 'determination' ? data.result : null;
  const crew: ArtefactCrewMember[] = (view?.rows ?? []).slice(0, 3).map((row, i) => ({
    name: `EXAMPLE, ${String.fromCharCode(65 + i)}.`,
    identifierLast4: String(i).padStart(4, '0'),
    classification: row.classificationLabel,
    hours: [40, 32.5, 40][i] ?? 40,
    baseRate: row.baseRate,
    fringeRate: row.fringeRate,
  }));

  const friday = (() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 2) % 7));
    return d.toISOString().slice(0, 10);
  })();

  return (
    <div className="wl-land">
      <AboveThePricingBlock
        data={data}
        proof={{
          provenance: view?.provenance ?? null,
          crew,
          projectName: 'Bldg 4200 roof replacement',
          countyLabel: view?.scope ?? '',
          weekEnding: friday,
        }}
        sticky={
          /* One bar, one label, no interstitial, no exit modal and no cookie
             wall over the content. A repeated call to action is the same
             offer, so its words are counted once, at the escalation (§8). */
          <div className="wl-land__sticky" data-testid="sticky-cta" data-wordcount="exclude">
            <span className="wl-land__note">Two Fridays free, then $99 a month.</span>
            <Link
              className="wl-btn wl-btn--primary wl-btn--sm"
              href="/login?plan=shop"
              data-wl-click="pricing_cta_clicked"
              data-wl-prop-tier="shop"
              data-wl-prop-interval="month"
            >
              Start 14-day trial
            </Link>
          </div>
        }
      />

      <PricingBlock supportEmail={env.SUPPORT_EMAIL} />
      <LandingFaq />
      <LandingFooter
        productName={productName()}
        companyName={env.COMPANY_NAME}
        companyAddress={env.COMPANY_ADDRESS}
        supportEmail={env.SUPPORT_EMAIL}
        lastRefresh={data.lastRefresh}
      />
      <LandingInstrumentation />
    </div>
  );
}
