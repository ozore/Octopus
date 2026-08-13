/**
 * THE PUBLIC SURFACE — the landing page, `/pricing`, `/legal` and `/status`.
 *
 * Spec: `identity/landing/index.html` (the page ported), `USER_JOURNEY.md` §0.6
 * (S00, S24), §11.8 (the published G5 counters), `ARCHITECTURE.md` §10.3 (one read
 * model behind every status surface), §16 Challenge 1 (the pricing function),
 * `CORRECTIONS.md` §3–§4 (the claims lint and the four forbidden families),
 * `PLAN.md` A3 (no escalation path anywhere).
 *
 * ===========================================================================
 * FOUR GROUPS, AND WHY EACH ONE IS HERE
 *
 * 1. **The specimen's arithmetic.** The WH-347 in the hero is the most-read
 *    artifact this company owns. Its money is computed, not typed, so these tests
 *    check every computed cell against the figures the design document verified by
 *    hand. A change to the arithmetic fails here rather than shipping a sheet whose
 *    own footnotes no longer describe it.
 *
 * 2. **The price ladder.** Every published figure is asserted to come from the
 *    `plans` table and from `assessUsage` — including the property that makes the
 *    cap honest: the largest possible bill on a tier equals the next tier's price
 *    exactly. If that ever stops holding, the page is advertising a trap.
 *
 * 3. **The status read model.** Rounding is asserted to go against us, an empty
 *    system is asserted to say "not measured" rather than "zero", and the G5 raw
 *    inbound total is asserted to equal the number of messages inserted — including
 *    the ones a filter classified as bulk.
 *
 * 4. **The copy lint.** A regex pass over every shipping string on these four
 *    routes, with the negation guard `CORRECTIONS.md` §3.2 specifies, so that a
 *    sentence CORRECTING a struck claim is not mistaken for one making it.
 *
 * OFFLINE AND DETERMINISTIC. PGlite, an injected clock, no network — `fetch` throws
 * in `vitest.setup.ts`.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';

import { Cents, Hours, MilliRate } from '../../src/lib/money';
import { fixedClock } from '../../src/platform/clock';
import { recordCanaryRun, readGate } from '../../src/platform/ops/gates';
import { recordInboundMessage } from '../../src/platform/ops/inbound';
import { readStatus } from '../../src/platform/ops/status';
import { loadPlans } from '../../src/platform/billing/catalog';

import { ArtifactHero } from '../../src/app/(marketing)/_components/artifact-hero';
import { Comparison } from '../../src/app/(marketing)/_components/comparison';
import { PriceCards } from '../../src/app/(marketing)/_components/price-cards';
import {
  SPECIMEN_COMPUTED_1,
  SPECIMEN_COMPUTED_2,
  SPECIMEN_COMPUTED_3,
  SPECIMEN_COMPUTED_4,
  SPECIMEN_ELECTRICIAN,
  SPECIMEN_HEADER,
  SPECIMEN_LABORER,
  computeSpecimenWorker,
  rateInCents,
} from '../../src/app/(marketing)/_data/specimen';
import { presentLadder } from '../../src/app/(marketing)/_lib/plans';
import {
  autonomyView,
  canaryView,
  corpusCounts,
  corpusView,
  lastCanaryRun,
  roundAgainstUs,
} from '../../src/app/status/_lib/present';

import { createPlatformDb } from '../platform/helpers';
import type { TestDb } from '../helpers/pglite';

const NOW = fixedClock('2026-08-13T12:00:00.000Z');

/** Assembled rather than written out, so that this file — which is scanned by its
 *  own address probe below — contains no literal mail address. */
const BILLING_ADDRESS = ['billing', 'ratepin.com'].join('@');
const ABUSE_ADDRESS = ['abuse', 'ratepin.com'].join('@');

let tdb: TestDb;

beforeAll(async () => {
  tdb = await createPlatformDb();
});

afterAll(async () => {
  await tdb.close();
});

const dollars = (value: Cents): string => Cents.toDollarString(value);

// ===========================================================================
// 1 — the specimen's arithmetic
// ===========================================================================

describe('the specimen WH-347 computes every figure it prints', () => {
  it('reproduces the determination’s own rates without alteration', () => {
    expect(MilliRate.toDecimalString(SPECIMEN_ELECTRICIAN.rate)).toBe('22.00');
    expect(MilliRate.toDecimalString(SPECIMEN_ELECTRICIAN.fringe)).toBe('11.77');
    expect(MilliRate.toDecimalString(SPECIMEN_LABORER.rate)).toBe('13.00');
    expect(MilliRate.toDecimalString(SPECIMEN_LABORER.fringe)).toBe('3.99');
    expect(SPECIMEN_ELECTRICIAN.group).toBe('SUTN2017-004');
    expect(SPECIMEN_HEADER.wdNumber).toBe('TN20260151');
  });

  it('entry 1 — 40 straight hours, fringe discharged by the combination method', () => {
    const w = SPECIMEN_COMPUTED_1;
    expect(Hours.toDecimalString(w.totalHours)).toBe('40.00');
    expect(dollars(w.col6B)).toBe('$244.00');
    expect(dollars(w.col6C)).toBe('$226.80');
    expect(dollars(w.gross)).toBe('$1,106.80');
    expect(dollars(w.fica)).toBe('$84.67');
    expect(dollars(w.deductionsTotal)).toBe('$180.67');
    expect(dollars(w.net)).toBe('$926.13');
    // The claim the footnote makes: 6B + 6C is exactly the hours times the
    // determination's published hourly fringe obligation.
    expect(w.fringeDischarged).toBe(w.fringeObligation);
    expect(dollars(w.fringeObligation)).toBe('$470.80');
    expect(dollars(rateInCents(w.overtimeRate))).toBe('$33.00');
  });

  it('entry 2 — six hours over forty carry a half-time CWHSSA premium inside 7A', () => {
    const w = SPECIMEN_COMPUTED_2;
    expect(Hours.toDecimalString(w.totalHours)).toBe('46.00');
    expect(Hours.toDecimalString(w.premiumHours)).toBe('6.00');
    expect(dollars(w.premiumCash)).toBe('$66.00');
    expect(dollars(w.col6B)).toBe('$280.60');
    expect(dollars(w.col6C)).toBe('$260.82');
    expect(dollars(w.gross)).toBe('$1,338.82');
    expect(dollars(w.fica)).toBe('$102.42');
    expect(dollars(w.deductionsTotal)).toBe('$223.42');
    expect(dollars(w.net)).toBe('$1,115.40');
    // Gross is basic cash + the premium + the cash in lieu, and nothing else. The
    // plan contribution behind 6B is not cash to the worker and is not in 7A.
    expect(Cents.sum([w.basicCash, w.premiumCash, w.col6C])).toBe(w.gross);
  });

  it('entry 3 — the whole fringe obligation in cash, and no plan credit', () => {
    const w = SPECIMEN_COMPUTED_3;
    expect(Hours.toDecimalString(w.totalHours)).toBe('36.00');
    expect(dollars(w.col6B)).toBe('$0.00');
    expect(dollars(w.col6C)).toBe('$143.64');
    expect(dollars(w.gross)).toBe('$611.64');
    expect(dollars(w.fica)).toBe('$46.79');
    expect(dollars(w.net)).toBe('$533.85');
    expect(w.fringeDischarged).toBe(w.fringeObligation);
  });

  it('entry 4 — the resolved line, present in two states of three', () => {
    const w = SPECIMEN_COMPUTED_4;
    expect(dollars(w.gross)).toBe('$1,106.80');
    expect(dollars(w.deductionsTotal)).toBe('$172.67');
    expect(dollars(w.net)).toBe('$934.13');
  });

  it('every worker’s net is gross less the deduction total, with no residue', () => {
    for (const w of [
      SPECIMEN_COMPUTED_1,
      SPECIMEN_COMPUTED_2,
      SPECIMEN_COMPUTED_3,
      SPECIMEN_COMPUTED_4,
    ]) {
      expect(Cents.add(w.net, w.deductionsTotal)).toBe(w.gross);
      expect(Number.isInteger(w.gross)).toBe(true);
    }
  });

  it('refuses to print a rate it would have to alter', () => {
    // A rate carrying a fraction of a cent cannot be rendered in a rate column
    // without changing it, so the helper throws rather than truncating.
    expect(() => rateInCents(MilliRate.fromDecimalString('22.005'))).toThrow();
  });

  it('a longer week changes every derived cell, so nothing here is a constant', () => {
    const longer = computeSpecimenWorker({
      ...SPECIMEN_COMPUTED_1.input,
      premiumDays: [null, null, null, null, null, null, Hours.fromDecimalString('4')],
    });
    expect(Hours.toDecimalString(longer.totalHours)).toBe('44.00');
    expect(dollars(longer.col6B)).toBe('$268.40');
    expect(dollars(longer.premiumCash)).toBe('$44.00');
    expect(longer.gross).toBeGreaterThan(SPECIMEN_COMPUTED_1.gross);
  });
});

describe('the artifact hero renders all three states into the DOM', () => {
  const html = renderToStaticMarkup(createElement(ArtifactHero));

  it('marks the sheet SPECIMEN and prints the determination on it', () => {
    expect(html).toContain('SPECIMEN');
    expect(html).toContain(SPECIMEN_HEADER.wdNumber);
    expect(html).toContain(SPECIMEN_HEADER.published);
  });

  it('prints the computed money rather than a typed string', () => {
    expect(html).toContain('1,106.80');
    expect(html).toContain('244.00');
    expect(html).toContain('226.80');
    expect(html).toContain('926.13');
  });

  it('carries the withheld signature block and the blocked line for the DRAFT state', () => {
    expect(html).toContain('SIGNATURE BLOCK WITHHELD');
    expect(html).toContain('DRAFT — NOT CERTIFIABLE');
    expect(html).toContain('LOW VOLTAGE TECH');
    expect(html).toContain('data-blocked="true"');
    // The blocked line prints no money at all — not a greyed rate, not a guess.
    expect(html).toContain('BLOCKED');
  });

  it('carries the provenance footer in every state, never abbreviated', () => {
    const claims = html.split('Rates of record: WD').length - 1;
    expect(claims).toBe(3);
    expect(html).toContain('Ratepin computes and formats. The contractor certifies and files.');
  });

  it('offers exactly three states and no fourth', () => {
    const radios = html.split('type="radio"').length - 1;
    expect(radios).toBe(3);
  });
});

// ===========================================================================
// 2 — the price ladder
// ===========================================================================

describe('the price ladder is read from the catalogue, not typed', () => {
  it('publishes D4’s four price points', async () => {
    const ladder = presentLadder(await loadPlans(tdb.db));
    expect(ladder.tiers.map((tier) => tier.monthly)).toEqual(['$99.00', '$249.00', '$599.00']);
    expect(ladder.rateCard.price).toBe('$49.00');
    expect(ladder.rateCard.refundWindowDays).toBe(14);
  });

  it('bills annual at ten months of the monthly price', async () => {
    const ladder = presentLadder(await loadPlans(tdb.db));
    for (const tier of ladder.tiers) {
      expect(tier.annualMonthsBilled).toBe(10);
    }
    expect(ladder.tiers.map((tier) => tier.annual)).toEqual([
      '$990.00',
      '$2,490.00',
      '$5,990.00',
    ]);
  });

  it('carries the catalogue’s allowances and the $2.50 overage', async () => {
    const ladder = presentLadder(await loadPlans(tdb.db));
    const [solo, crew, multi] = ladder.tiers;
    expect(solo?.includedFilings).toBe(8);
    expect(crew?.includedFilings).toBe(40);
    expect(multi?.includedFilings).toBeNull();
    expect(solo?.overagePrice).toBe('$2.50');
    expect(crew?.overagePrice).toBe('$2.50');
    expect(multi?.overagePrice).toBeNull();
  });

  it('caps a month at the next tier’s price exactly — the property that makes it not a trap', async () => {
    const ladder = presentLadder(await loadPlans(tdb.db));
    for (const [index, tier] of ladder.tiers.entries()) {
      const next = ladder.tiers[index + 1];
      if (next === undefined) {
        expect(tier.overageCap).toBeNull();
        expect(tier.maximumMonthly).toBe(tier.monthly);
        expect(tier.autoUpgradeTo).toBeNull();
        continue;
      }
      expect(tier.maximumMonthly).toBe(next.monthly);
      expect(tier.autoUpgradeTo).toBe(next.name);
      expect(tier.overageFilingsToCap).toBeGreaterThan(0);
    }
  });

  /**
   * "No project caps. No worker caps." is rendered copy. It used to stand over two
   * nullable columns that nothing on any write path read, which meant one `UPDATE
   * plans` could falsify a public claim with no code change, no deploy, no lint hit
   * and no failing test — and `presentTier` carried the columns into the view model,
   * so this assertion was pinning the vestige in place. ACQUISITION_REVIEW N-4 ruled
   * they be dropped. The honest form of the check is that there is nothing to set:
   * the ladder has one variable, and the claim is now a statement about the schema.
   */
  it('has no project or worker cap to set — the ladder has one variable (N-4)', async () => {
    const columns = await tdb.client.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'plans'`,
    );
    const names = columns.rows.map((r) => r.column_name);
    expect(names).not.toContain('project_cap');
    expect(names).not.toContain('worker_cap');
  });

  it('renders the cards from those figures and from nothing else', async () => {
    const ladder = presentLadder(await loadPlans(tdb.db));
    const html = renderToStaticMarkup(createElement(PriceCards, { ladder }));
    expect(html).toContain('$99.00');
    expect(html).toContain('$249.00');
    expect(html).toContain('$599.00');
    expect(html).toContain('$49.00');
    expect(html).toContain('$990.00');
    // The cap sentence names the tier it upgrades into, so the reader can check it.
    expect(html).toContain('upgrades itself to Crew');
    expect(html).toContain('can never cost more than $249.00');
  });
});

describe('the comparison table quotes competitors rather than characterising them', () => {
  const html = renderToStaticMarkup(createElement(Comparison));

  it('names both vendors with their published prices and the date they were read', () => {
    expect(html).toContain('LCPcertified');
    expect(html).toContain('CertifiedPayrollPro');
    expect(html).toContain('$12 / report');
    expect(html).toContain('$2,500 / yr, 25 projects');
    expect(html).toContain('2026-08-13');
  });

  it('sends the reader elsewhere where elsewhere is the better buy', () => {
    expect(html).toContain('Where you should buy something else');
    expect(html).toContain('Keep the portal');
  });
});

// ===========================================================================
// 3 — the status read model
// ===========================================================================

describe('the status page never rounds in our favour', () => {
  it('rounds up, and has no function that rounds down', () => {
    expect(roundAgainstUs(0.241, 2)).toBe(0.25);
    expect(roundAgainstUs(71.601, 2)).toBe(71.61);
    // A value that is already exact is not inflated by the guard.
    expect(roundAgainstUs(0.24, 2)).toBe(0.24);
    expect(roundAgainstUs(2, 2)).toBe(2);
  });

  it('says “not promoted” rather than “fresh” before anything has been promoted', async () => {
    const status = await readStatus(
      tdb.db,
      { datedHours: 24, slaHours: 72, creditFloorCents: 100, creditCeilingPct: 100 },
      NOW,
    );
    const corpus = corpusView(status);
    expect(corpus.freshnessState).toBe('NEVER PROMOTED');
    expect(corpus.snapshotRef).toBeNull();
    expect(corpus.ageHours).toBeNull();
    // D7, at every level of the ladder and in every state of the mirror.
    expect(corpus.blocksFiling).toBe(false);
  });

  it('publishes an absence rather than a zero when nothing has been counted', async () => {
    expect(await corpusCounts(tdb.db)).toBeNull();
    expect(canaryView(await lastCanaryRun(tdb.db))).toBeNull();
  });

  it('publishes the canary’s last result as recorded', async () => {
    await recordCanaryRun(
      tdb.db,
      {
        buildSha: 'test-build',
        corpusSnapshotId: null,
        trigger: 'ci',
        total: 512,
        passed: 512,
        distinctWds: 26,
        distinctStates: 9,
        firstDivergence: null,
      },
      NOW,
    );
    const view = canaryView(await lastCanaryRun(tdb.db));
    expect(view?.green).toBe(true);
    expect(view?.passed).toBe(512);
    expect(view?.total).toBe(512);
    expect(view?.distinctWds).toBe(26);
    expect(view?.at).toContain('2026-08-13');
  });

  it('publishes a red run and its first divergence, unedited', async () => {
    await recordCanaryRun(
      tdb.db,
      {
        buildSha: 'test-build',
        corpusSnapshotId: null,
        trigger: 'pre_promotion',
        total: 512,
        passed: 511,
        distinctWds: 26,
        distinctStates: 9,
        firstDivergence: { case: 'tn-electrician-40h', field: 'col6B' },
      },
      fixedClock('2026-08-13T13:00:00.000Z'),
    );
    const view = canaryView(await lastCanaryRun(tdb.db));
    expect(view?.green).toBe(false);
    expect(view?.divergence).toContain('col6B');
  });

  it('publishes the G5 inbound total raw, with the bulk figure beside it', async () => {
    // Inside the 90-day window and strictly before `now`, which is the half-open
    // interval `g5Report` reads.
    const received = new Date('2026-08-13T09:00:00.000Z');
    await recordInboundMessage(tdb.db, { address: BILLING_ADDRESS, receivedAt: received }, NOW);
    await recordInboundMessage(tdb.db, { address: BILLING_ADDRESS, receivedAt: received }, NOW);
    await recordInboundMessage(
      tdb.db,
      { address: ABUSE_ADDRESS, receivedAt: received, signals: { authenticationFailed: true } },
      NOW,
    );

    const view = autonomyView(await readGate(tdb.db, 'G5', NOW));
    expect(view).not.toBeNull();
    // Three messages in, three counted. The filter derives a smaller number
    // ALONGSIDE the total, never instead of it.
    expect(view?.inboundTotal).toBe(3);
    expect(view?.machineClassifiedBulk).toBe(1);
    expect(view?.countedAsHuman).toBe(2);
    // The one-minute floor: two human messages, never replied to, still cost two.
    expect(view?.humanMinutes).toBe(2);
    expect(view?.bulkByRule.map((entry) => entry.rule)).toContain('spf_or_dkim_fail');
    // No paying accounts, so the ratio is no number rather than a flattering zero.
    expect(view?.payingAccounts).toBe(0);
    expect(view?.minutesPerCustomerPerMonth).toBeNull();
  });

  it('states the mechanism for every gate and the outcome for none of them', async () => {
    const status = await readStatus(
      tdb.db,
      { datedHours: 24, slaHours: 72, creditFloorCents: 100, creditCeilingPct: 100 },
      NOW,
    );
    expect(status.gates).toHaveLength(6);
    for (const gate of status.gates) {
      expect(gate.mechanism.length).toBeGreaterThan(20);
      expect(gate.outcome).toBeNull();
      expect(gate.reading.state).not.toBe('unlocked');
    }
  });
});

// ===========================================================================
// 4 — the copy lint
// ===========================================================================

const SURFACES = [
  join(process.cwd(), 'src', 'app', '(marketing)'),
  join(process.cwd(), 'src', 'app', 'status'),
];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out.push(...sourceFiles(path));
      continue;
    }
    if (/\.(tsx?|css)$/.test(entry)) out.push(path);
  }
  return out;
}

/** `CORRECTIONS.md` §3.2's negation guard, verbatim in intent: a blocking probe
 *  does not fire on a sentence that also negates. Correcting a false claim requires
 *  stating it, and the guard is what distinguishes the two. */
const NEGATION =
  /\b(no|not|none|never|nor|isn't|is not|there is no|without|rather than|instead of|struck|retired|refuted|banned|forbidden|cannot|can't|declines?|refus\w*|withheld|unable|may not|forbids?)\b/i;

interface Probe {
  readonly name: string;
  readonly pattern: RegExp;
}

const PROBES: readonly Probe[] = [
  // A3 — no escalation path to a human, anywhere.
  { name: 'escalation path', pattern: /\b(contact us|contact form|get in touch|reach out|live chat|help ?desk|support (queue|team|ticket)|talk to (sales|us)|book a (demo|call)|schedule a call|request a quote)\b/i },
  // F-1 correctness.
  { name: 'correctness claim', pattern: /\b(100% accurate|fully accurate|error[- ]free|guaranteed correct|never wrong|no mistakes)\b/i },
  // F-2 acceptance.
  { name: 'acceptance claim', pattern: /\b(agency[- ]approved|gc[- ]approved|guaranteed acceptance|passes agency review|accepted by the (dir|dol))\b/i },
  // F-3 coverage.
  { name: 'coverage claim', pattern: /\b(every wage determination|all wage determinations|complete coverage|nationwide,? complete|always current)\b/i },
  // F-4 outcome.
  { name: 'outcome claim', pattern: /\b(saves? \d|saving \d|cuts? .{0,20}by \d+%|zero human minutes|fully autonomous|runs itself|hours a week)\b/i },
  // X-5 — the penalty figure this category's marketing misattributes.
  { name: 'penalty figure', pattern: /\b(28,619|14,308)\b|civil (money )?penalt/i },
  // X-1 — the retired archive claim.
  { name: 'retired archive claim', pattern: /(cannot|can not|can't|impossible|unable).{0,40}reconstruct|cornered resource|retroactively (buy|acquire|purchase)/i },
];

/**
 * Sentences, not lines.
 *
 * The negation guard is defined to hold "within the same sentence", and a prose
 * paragraph in JSX is wrapped across several source lines. Splitting on newlines
 * would cut a sentence in half and strip the negation off the clause that needs it
 * — which is how a lint starts red-flagging correct work, and a lint that
 * red-flags correct work is a lint somebody disables.
 */
function sentencesOf(text: string): string[] {
  return text.replace(/\s*\n\s*/g, ' ').split(/(?<=[.!?])\s+/);
}

describe('the copy lint over every shipping string on the public surface', () => {
  const files = SURFACES.flatMap(sourceFiles);

  it('has files to lint', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  for (const probe of PROBES) {
    it(`carries no ${probe.name}`, () => {
      const hits: string[] = [];
      for (const file of files) {
        for (const sentence of sentencesOf(readFileSync(file, 'utf8'))) {
          if (!probe.pattern.test(sentence)) continue;
          if (NEGATION.test(sentence)) continue;
          hits.push(`${file}: ${sentence.trim().slice(0, 160)}`);
        }
      }
      expect(hits).toEqual([]);
    });
  }

  it('publishes no address anyone could write to', () => {
    // §10.5 permits exactly one contact address in the whole product, on the
    // billing page, inside the authenticated surface. It may not appear here: an
    // address on a marketing page is an uncounted human minute waiting to happen.
    const hits: string[] = [];
    for (const file of files) {
      const found = readFileSync(file, 'utf8').match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g);
      // The test file's own fixtures are not a surface; these are page sources.
      if (found) hits.push(`${file}: ${found.join(', ')}`);
    }
    expect(hits).toEqual([]);
  });

  it('renders no telephone number and no external asset request', () => {
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      expect(text).not.toMatch(/tel:\+?\d/);
      expect(text).not.toMatch(/<script\s+src=/i);
      expect(text).not.toMatch(/@import\s+url\(/i);
      expect(text).not.toMatch(/fonts\.(googleapis|gstatic)\.com/i);
    }
  });

  it('keeps the boundary statement on the marketing surface', () => {
    const landing = readFileSync(
      join(process.cwd(), 'src', 'app', '(marketing)', 'page.tsx'),
      'utf8',
    );
    expect(landing).toContain('Ratepin computes and formats. You certify and file.');
    expect(landing).toContain('This is not legal advice.');
  });

  it('authors no colour outside the design system’s tokens', () => {
    const css = readFileSync(
      join(process.cwd(), 'src', 'app', '(marketing)', 'marketing.css'),
      'utf8',
    );
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\b(rgb|rgba|hsl|hsla|oklch)\(/);
    // R1 — paper, not glass.
    expect(css).not.toMatch(/backdrop-filter/);
    expect(css).not.toMatch(/box-shadow:\s*0\s+\d+px\s+\d+px/);
  });
});
