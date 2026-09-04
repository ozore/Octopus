/**
 * §9 — THE FOOTER (LANDING_SPEC §10).
 *
 * Five things belong here and all five are load-bearing:
 *
 *  1. **Who we are**, with a physical postal address — required for the
 *     CAN-SPAM footer on anything we send, and the cheapest credibility a
 *     stranger can check.
 *  2. **The standing disclaimer** (PLAN.md A10, KNOWLEDGE_BASE §9.3), rendered
 *     through the shared component so there is one copy of the words in the
 *     product. This page shows rates, so this page shows the disclaimer.
 *  3. **Non-affiliation, stated plainly.** Using public data does not license
 *     the emblem: there is no DOL, SAM.gov or federal seal anywhere on this
 *     page, and this sentence says why in words as well.
 *  4. **The data-provenance timestamp, wired to `kb_ingest_runs`.** If the last
 *     run failed, this line says so. A stale timestamp shown honestly is worth
 *     more than a fresh one that is wrong.
 *  5. **The links**, including the ones a buyer looks for before paying:
 *     guarantee, privacy, terms, security, accessibility, data sources.
 *
 * No live-chat widget. It is a third-party script, a performance cost, and an
 * implicit promise of staffing we do not have.
 */

import Link from 'next/link';

import { StandingDisclaimer } from '@/components/disclaimer';
import { formatDay } from '@/components/provenance';

export type LandingFooterProps = {
  productName: string;
  companyName: string;
  companyAddress: string;
  supportEmail: string;
  lastRefresh: { at: string | null; status: string | null };
};

const LINKS: Array<[string, string]> = [
  ['Pricing', '/pricing'],
  ['Guarantee', '/legal/guarantee'],
  ['Privacy', '/legal/privacy'],
  ['Terms', '/legal/terms'],
  ['Security', '/legal/security'],
  ['Accessibility', '/legal/accessibility'],
  ['Data sources', '/legal/data-sources'],
  ['Help', '/help'],
];

export function LandingFooter({
  productName,
  companyName,
  companyAddress,
  supportEmail,
  lastRefresh,
}: LandingFooterProps) {
  const refreshed =
    lastRefresh.at && lastRefresh.status === 'ok'
      ? `Wage determinations from SAM.gov, refreshed daily. Last successful refresh ${formatDay(lastRefresh.at)}.`
      : lastRefresh.at
        ? `Wage determinations from SAM.gov. The last refresh, on ${formatDay(lastRefresh.at)}, did not finish cleanly — every rate still shows the date we read it.`
        : 'Wage determinations from SAM.gov. No refresh has completed yet on this deployment — every rate shows the date we read it.';

  return (
    <footer className="wl-land__foot" id="footer" data-testid="landing-footer">
      <p className="wl-strong">
        {productName}, a {companyName} company. {companyAddress}.
      </p>

      <StandingDisclaimer />

      <p data-testid="non-affiliation">
        Not affiliated with, endorsed by, or acting for the U.S. Department of Labor, the General
        Services Administration or SAM.gov. Wage determinations are published by the U.S. Government
        and are in the public domain.
      </p>

      <p data-testid="data-provenance">{refreshed}</p>

      <p>
        We target WCAG 2.1 AA. Every colour pair on this page is checked by a script that runs in CI
        and fails the build below its required ratio. If something here is unusable for you, write
        to us and say what — that is a bug with a deadline, not feedback.
      </p>

      <p className="wl-land__foot-links">
        {LINKS.map(([label, href]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </p>
    </footer>
  );
}
