import { notFound } from 'next/navigation';

import { DISCLAIMER_SECTIONS } from '@/components/provenance';
import { getEnv } from '@/env';
import { coverageTable, TRADES } from '@/lib/kb/accessors';
import { privacyContent, termsContent } from '@octopus/platform/legal';

export const dynamic = 'force-dynamic';

const DOCS = ['terms', 'privacy', 'disclaimer'] as const;
type DocSlug = (typeof DOCS)[number];

/**
 * Terms and privacy are the platform's shared, reviewed text — three brands,
 * one reviewed document (`packages/platform/src/legal`).
 *
 * **The disclaimer is StateReady's own, and it has to be.** It is `specs/12`
 * verbatim, it is the text the `Disclaimer` component in the footer of every
 * screen links to, and it says things about *this* product that no shared text
 * could: what "unestablished" means, the 180-day rule, that we cover HVAC,
 * plumbing and electrical only, and that we never estimate a fee, an hour count
 * or a processing time.
 *
 * It carries **no cadence claim** (wave-1b **M12**) — "we check every source
 * daily" is a promise about our own uptime, made to a consumer, on the page a
 * state UDAP action would be built from. The cadence is a target and lives on
 * `/help/methodology` beside the live figures. `tests/app.test.ts` greps this
 * text for "daily", "monthly" and "every month" and fails on a match.
 *
 * The last two lines are computed from the knowledge base rather than typed, so
 * the coverage this page claims is the coverage the product actually has.
 */
export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  if (!DOCS.includes(doc as DocSlug)) notFound();

  const env = getEnv();
  const placeholders = {
    appName: env.APP_NAME,
    companyName: env.COMPANY_NAME,
    address: env.COMPANY_ADDRESS,
    supportEmail: env.SUPPORT_EMAIL,
  };

  if (doc === 'disclaimer') {
    const today = new Date().toISOString().slice(0, 10);
    const covered = coverageTable(today).filter((row) => row.covered);
    const states = new Set(covered.map((row) => row.state));
    const trades = new Set(covered.map((row) => row.trade));

    return (
      <main className="narrow">
        <h1>Disclaimer</h1>
        {DISCLAIMER_SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}
        <p className="small muted" data-testid="disclaimer-coverage">
          Last reviewed: {today}. Coverage: {states.size} states × {trades.size} trades ({covered.length} of{' '}
          {51 * TRADES.length} state-and-trade combinations). Every value links to its source; the full
          table, with the age of every value, is at <a href="/coverage">/coverage</a>.
        </p>
      </main>
    );
  }

  const content = doc === 'terms' ? termsContent(placeholders) : privacyContent(placeholders);

  return (
    <main className="narrow">
      <h1>{content.title}</h1>
      <p className="muted small">Last updated {content.effectiveDate}</p>
      <p>{content.intro}</p>
      {content.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </section>
      ))}
    </main>
  );
}
