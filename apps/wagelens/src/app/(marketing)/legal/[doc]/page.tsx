import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getEnv, productName } from '@/env';
import {
  PRODUCT_LEGAL_SLUGS,
  productLegalDoc,
  type ProductLegalSlug,
} from '@/content/legal/product-docs';
import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import { disclaimerContent, privacyContent, termsContent } from '@octopus/platform/legal';

export const dynamic = 'force-dynamic';

/**
 * Seven documents on one route. Three are the platform's — Terms, Privacy and
 * the Disclaimer are the same instrument in every app it carries — and four
 * are this product's own (`src/content/legal/product-docs.ts`): the guarantee,
 * security, accessibility and where the numbers come from.
 *
 * They live on one route because the footer links to all seven and a reader
 * who has found one should be able to reach the others without going back.
 */
const PLATFORM_DOCS = ['terms', 'privacy', 'disclaimer'] as const;
const DOCS = [...PLATFORM_DOCS, ...PRODUCT_LEGAL_SLUGS] as const;
type DocSlug = (typeof DOCS)[number];

/**
 * The platform's three legal documents, themed, plus the two paragraphs this
 * product owes its readers and the platform cannot know about (WL-11 V9, V10):
 *
 *  - **how a document leaves the account** — a share link is an unauthenticated
 *    URL that streams worker names, last-four identifiers, hours and pay;
 *  - **what the public watch collects** — an email address, a hashed IP, a
 *    timestamp and the wording that was ticked.
 *
 * Sharing wage data by URL is a disclosure, and a privacy page that omits it is
 * wrong. Both paragraphs render on `/legal/privacy` and are asserted by
 * `tests/legal.test.ts`.
 */
export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  if (!DOCS.includes(doc as DocSlug)) notFound();

  const env = getEnv();
  const product = productName();
  const db = await getDb();
  await emitEvent(db, 'legal_page_viewed', { props: { page: doc } });

  // This product's own four, rendered from the same shape as the platform's.
  if ((PRODUCT_LEGAL_SLUGS as readonly string[]).includes(doc)) {
    const own = productLegalDoc(doc as ProductLegalSlug, {
      productName: product,
      companyName: env.COMPANY_NAME,
      companyAddress: env.COMPANY_ADDRESS,
      supportEmail: env.SUPPORT_EMAIL,
    });
    return (
      <article className="wl-panel" data-testid={`legal-${own.slug}`}>
        <div className="wl-panel__body wl-stack wl-prose">
          <h1>{own.title}</h1>
          <p className="wl-xs wl-muted">Last reviewed {own.lastReviewed}</p>
          <p className="wl-lead">{own.intro}</p>
          {own.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </section>
          ))}
          <p className="wl-xs wl-muted">
            {product}, a {env.COMPANY_NAME} company. {env.COMPANY_ADDRESS}. Questions:{' '}
            <a href={`mailto:${env.SUPPORT_EMAIL}`}>{env.SUPPORT_EMAIL}</a> ·{' '}
            <Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link> ·{' '}
            <Link href="/legal/disclaimer">Disclaimer</Link> ·{' '}
            <Link href="/legal/guarantee">Guarantee</Link> ·{' '}
            <Link href="/legal/security">Security</Link> ·{' '}
            <Link href="/legal/accessibility">Accessibility</Link> ·{' '}
            <Link href="/legal/data-sources">Data sources</Link>
          </p>
        </div>
      </article>
    );
  }
  const placeholders = {
    appName: product,
    companyName: env.COMPANY_NAME,
    address: env.COMPANY_ADDRESS,
    supportEmail: env.SUPPORT_EMAIL,
    productDescription: 'federal Davis-Bacon wage determinations and certified payroll documents',
  };

  const content =
    doc === 'terms'
      ? termsContent(placeholders)
      : doc === 'privacy'
        ? privacyContent(placeholders)
        : disclaimerContent(placeholders);

  return (
    <article className="wl-panel">
      <div className="wl-panel__body wl-stack wl-prose">
        <h1>{content.title}</h1>
        <p className="wl-xs wl-muted">Last updated {content.effectiveDate}</p>
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
            <section data-testid="privacy-share-links">
              <h2>Sharing a certified payroll outside your account</h2>
              <p>
                {product} can create a <strong>share link</strong> for a generated WH-347 so you can
                send it to a general contractor. That link is an{' '}
                <strong>unauthenticated URL</strong>: anyone who has it can open the document, and
                the document contains worker names, the last four digits of their identifying
                numbers, their hours and their pay.
              </p>
              <p>
                Every share link <strong>expires after 7 days</strong> and can be re-issued in one
                click. You can <strong>revoke</strong> any link at any time from the payroll it
                belongs to, individually or all at once, and a revoked link stops working
                immediately. Every access is logged with a count and a timestamp, which you can see
                beside the link. <strong>There is no permanent or bookmarkable link</strong>, and we
                will not create one.
              </p>
            </section>
            <section data-testid="privacy-watch">
              <h2>Determination alerts on the public lookup</h2>
              <p>
                If you ask to be emailed when a wage determination changes, we store your{' '}
                <strong>email address</strong>, a <strong>hashed</strong> version of your IP address
                (never the address itself), the <strong>timestamp</strong> and the exact{' '}
                <strong>wording of the consent</strong> you ticked. We keep it only to send you
                alerts about the determinations you asked about. We never sell it and never share it.
              </p>
              <p>
                Every message carries a one-click unsubscribe, which works without an account and
                without a reply. Watches expire 18 months after you set them up.
              </p>
            </section>
          </>
        ) : null}

        <p className="wl-xs wl-muted">
          {product}, a {env.COMPANY_NAME} company. {env.COMPANY_ADDRESS}. Questions:{' '}
          <a href={`mailto:${env.SUPPORT_EMAIL}`}>{env.SUPPORT_EMAIL}</a> ·{' '}
          <Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link> ·{' '}
          <Link href="/legal/disclaimer">Disclaimer</Link> ·{' '}
          <Link href="/legal/guarantee">Guarantee</Link> ·{' '}
          <Link href="/legal/security">Security</Link> ·{' '}
          <Link href="/legal/accessibility">Accessibility</Link> ·{' '}
          <Link href="/legal/data-sources">Data sources</Link>
        </p>
      </div>
    </article>
  );
}
