import Link from 'next/link';

import { Disclaimer } from '@/components/provenance';
import { TileGrid, type Tile } from '@/components/status';
import { getEnv } from '@/env';
import { coverageTable, JURISDICTION_NAMES, US_JURISDICTIONS } from '@/lib/kb/accessors';

export const dynamic = 'force-dynamic';

/**
 * LANDING PLACEHOLDER — deliberately, and with a note about why.
 *
 * `LANDING_SPEC.md` and the no-login State Rulebook demo are **M15**, owned by
 * the sub-wave C agent (`BUILD.md`); the copy deck has a 450-word ceiling and a
 * CI word counter, and writing half of it here would leave that agent editing
 * around a placeholder rather than shipping the deck.
 *
 * What this page does carry, because they are constraints rather than copy:
 *
 *  - the hero object is **the tile grid on the board**, not a headline over a
 *    photograph (`UX.md` S01) — drawn from the REAL coverage table, so it can
 *    never overstate what we hold;
 *  - **one primary call to action**, repeated unvaried: start the free trial;
 *  - the **coverage boundary stated in the same viewport** (`UX.md` C10);
 *  - the disclaimer.
 *
 * It says nothing about building a roster from the public registers, quotes no
 * penalty figure, and makes no guarantee — the three things `LANDING_SPEC.md`
 * §11 permanently prohibits until their gates pass.
 */
export default function LandingPage() {
  const env = getEnv();
  const today = new Date().toISOString().slice(0, 10);
  const covered = coverageTable(today).filter((row) => row.covered);
  const coveredStates = new Set(covered.map((row) => row.state));

  const tiles: Tile[] = US_JURISDICTIONS.map((state) => ({
    state,
    stateName: JURISDICTION_NAMES[state] ?? state,
    status: coveredStates.has(state) ? 'READY' : null,
    licenceCount: 0,
    accessibleName: coveredStates.has(state)
      ? `${JURISDICTION_NAMES[state] ?? state} — covered`
      : `${JURISDICTION_NAMES[state] ?? state} — not covered yet`,
  }));

  return (
    <main className="narrow">
      <p className="sr-eyebrow">{env.APP_NAME}</p>
      <h1>Every licence you hold, every date the state actually publishes.</h1>
      <p className="sr-lead">
        StateReady works out your renewal and continuing-education deadlines from each state board&apos;s own
        published rule — and shows you the page it came from and the day we last checked it. Where a board
        publishes nothing, we say so instead of estimating.
      </p>

      <p className="sr-row">
        <Link className="sr-btn sr-btn--primary" href="/login">
          Start your 14-day free trial
        </Link>
        <Link href="/coverage">See exactly what we cover</Link>
      </p>
      <p className="small muted">No credit card. HVAC, plumbing and electrical.</p>

      <section className="sr-mt-6">
        <h2 className="sr-eyebrow">What we hold today</h2>
        <TileGrid tiles={tiles} />
        <p className="small muted">
          {coveredStates.size} states · {covered.length} state × trade rule sets · the rest are drawn hollow
          because they are not covered yet.
        </p>
      </section>

      <Disclaimer />
    </main>
  );
}
