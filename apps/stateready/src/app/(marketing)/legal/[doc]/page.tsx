import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DISCLAIMER_SECTIONS } from '@/components/provenance';
import { getEnv } from '@/env';
import { coverageTable, TRADES } from '@/lib/kb/accessors';
import { personalDataInventory } from '@/lib/legal/data-inventory';
import { ACCURACY_GUARANTEE, ENTRY_PACK_GUARANTEE } from '@/lib/legal/guarantees';
import { REFUND_SECTIONS, SUBPROCESSORS } from '@/lib/legal/refunds';
import { privacyContent, termsContent } from '@octopus/platform/legal';

export const dynamic = 'force-dynamic';

const DOCS = ['terms', 'privacy', 'disclaimer', 'refunds', 'subprocessors'] as const;
type DocSlug = (typeof DOCS)[number];

/**
 * Terms and privacy are the platform's shared, reviewed text — three brands,
 * one reviewed document (`packages/platform/src/legal`).
 *
 * **The disclaimer, the refund policy and the sub-processor list are
 * StateReady's own, and they have to be.** The disclaimer is `specs/12`
 * verbatim; the refund policy carries the two guarantees in force, imported
 * from one module so that the purchase screen, the pack's first page and this
 * page cannot drift apart (AC8); the sub-processor list names what each vendor
 * actually sees in THIS product.
 *
 * The disclaimer carries **no cadence claim** (wave-1b **M12**) — "we check
 * every source daily" is a promise about our own uptime, made to a consumer, on
 * the page a state UDAP action would be built from. The cadence is a target and
 * lives on `/help/methodology` beside the live figures. `tests/legal.test.ts`
 * greps this page for it and fails on a match, and greps the methodology page
 * and fails on its ABSENCE.
 *
 * The privacy page's list of what we hold about a named person is generated
 * from the Drizzle schema, so `specs/12` AC6 cannot drift the next time someone
 * adds a column.
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

  if (doc === 'refunds') {
    return (
      <main className="narrow">
        <h1>Refunds and guarantees</h1>
        <p className="sr-lead">
          Two guarantees are in force. Both are bounded, both are adjudicated against something you can
          open and read, and both are printed here in the same words they appear in everywhere else.
        </p>

        <section data-testid="guarantee-block-entry-pack">
          <h2>The Entry Pack Guarantee</h2>
          <p data-testid="guarantee-entry-pack">{ENTRY_PACK_GUARANTEE}</p>
        </section>

        <section data-testid="guarantee-block-accuracy">
          <h2>The Accuracy Guarantee</h2>
          <p data-testid="guarantee-accuracy">{ACCURACY_GUARANTEE}</p>
        </section>

        {REFUND_SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </section>
        ))}

        <p className="small muted">
          Claims go to <a href={`mailto:${env.SUPPORT_EMAIL}`}>{env.SUPPORT_EMAIL}</a>.{' '}
          {env.COMPANY_NAME}, {env.COMPANY_ADDRESS}. See also the{' '}
          <Link href="/legal/disclaimer">full disclaimer</Link> and{' '}
          <Link href="/coverage">what we cover</Link>.
        </p>
      </main>
    );
  }

  if (doc === 'subprocessors') {
    return (
      <main className="narrow">
        <h1>Sub-processors</h1>
        <p className="sr-lead">
          Everyone outside {env.COMPANY_NAME} who touches your data, and what each of them sees. Each is
          bound by its own data-processing terms.
        </p>
        <table data-testid="subprocessors">
          <thead>
            <tr>
              <th>Who</th>
              <th>What for</th>
              <th>What they see</th>
            </tr>
          </thead>
          <tbody>
            {SUBPROCESSORS.map((row) => (
              <tr key={row.name}>
                <th scope="row">{row.name}</th>
                <td>{row.purpose}</td>
                <td>{row.sees}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small">
          We will publish a change here before it takes effect. Questions:{' '}
          <a href={`mailto:${env.SUPPORT_EMAIL}`}>{env.SUPPORT_EMAIL}</a>.
        </p>
      </main>
    );
  }

  const content = doc === 'terms' ? termsContent(placeholders) : privacyContent(placeholders);
  const inventory = doc === 'privacy' ? personalDataInventory() : [];

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

      {doc === 'privacy' ? (
        <>
          <section>
            <h2>What we hold about your people, field by field</h2>
            <p className="small">
              This list is generated from the database schema itself rather than written by hand, so it
              cannot fall behind the product. These two tables are the only places {env.APP_NAME} holds
              anything about a named individual.
            </p>
            <table data-testid="privacy-inventory">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Field</th>
                  <th>What it is</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((row) => (
                  <tr data-testid={`privacy-field-${row.table}-${row.field}`} key={`${row.table}.${row.field}`}>
                    <td>{row.table}</td>
                    <th scope="row">{row.field}</th>
                    <td>{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section>
            <h2>What we deliberately do not hold</h2>
            <p>
              There is no telephone number, no home address, no date of birth and no national identifier
              anywhere in this product. That is enforced by the absence of the columns rather than by this
              paragraph, and a test walks the schema and fails the build if one ever appears.
            </p>
            <p className="small">
              Your data is stored in the United States. Export and deletion are in{' '}
              <Link href="/legal/refunds">your account settings</Link> and are actioned within 30 days.
            </p>
          </section>
        </>
      ) : null}
    </main>
  );
}
