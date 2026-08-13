/**
 * The public marketing surface's shell — a nav row and a footer, inside the root
 * layout's `<main>`.
 *
 * AUTHORITY: `identity/landing/index.html` (the header nav and footer this ports),
 * `ARCHITECTURE.md` §3.1 (route groups), `PLAN.md` A3.
 *
 * WHAT IS NOT IN THIS SHELL, PERMANENTLY: a contact link, a support widget, a live
 * chat, a phone number, a mail address, a "get a demo" and a "talk to sales". Not
 * because they were forgotten but because there is no queue behind any of them. The
 * footer says so in words, since an absence a reader does not notice teaches them
 * nothing.
 *
 * The root layout already renders the wordmark header, the `<main>` landmark and
 * the boundary statement, so this file adds the section navigation and the
 * marketing footer and nothing else. Two shells stacked would give the page two
 * `<main>` elements and two boundary statements, and the boundary statement is
 * supposed to be structural rather than repeated.
 */

import Link from 'next/link';

import './marketing.css';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <nav className="rp-lp-nav" aria-label="Ratepin sections">
        <Link href="/">Overview</Link>
        <Link href="/wh347">Free WH-347 generator</Link>
        <Link href="/rates">Rate lookup</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/status">Status</Link>
        <Link href="/legal">Legal and privacy</Link>
      </nav>

      {children}

      <footer className="rp-lp-foot">
        <div className="rp-lp-grid rp-lp-grid--2">
          <div className="rp-stack">
            <p className="rp-legal">
              Certified-payroll rate-of-record engine for open-shop specialty subcontractors on
              Davis-Bacon and Davis-Bacon Related Acts construction. Ratepin computes and formats.
              You certify and file. This is not legal advice, and no statement on this site is a
              legal conclusion about your contract, your classifications, your fringe plans or the
              effectiveness of any wage determination.
            </p>
            <p className="rp-legal">
              Form WH-347 is a U.S. Department of Labor form (OMB 1235-0008, expires 01/31/2028).
              The California eCPR schema is published by the California Department of Industrial
              Relations. Ratepin is not affiliated with, endorsed by, or acting on behalf of the
              U.S. Department of Labor, the California DIR, SAM.gov, or any other government agency,
              and displays no agency seal, flag or logo for that reason.
            </p>
            <p className="rp-legal">
              There is no telephone number on this site and no contact form, because there is no
              support queue to route you to. That is a description of how the product is built, not
              an oversight.
            </p>
          </div>
          <div className="rp-stack">
            <p className="rp-t-data rp-ink-2">
              <Link href="/">Overview</Link> · <Link href="/pricing">Pricing</Link> ·{' '}
              <Link href="/status">Status</Link> · <Link href="/legal">Legal and privacy</Link>
            </p>
            <p className="rp-t-data rp-ink-2">
              <Link href="/wh347">Make a WH-347 with no account</Link> ·{' '}
              <Link href="/rates">County × craft rate lookup</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
