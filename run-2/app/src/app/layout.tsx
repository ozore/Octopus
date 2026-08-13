/**
 * Root layout — the web process's single shell.
 *
 * Spec: DESIGN_SYSTEM.md §8.1 (shell, header, boundary statement), §10 (theme
 * resolution), NAMING.md §7.1 (the wordmark), USER_JOURNEY.md §7.4 (the boundary
 * statement), ARCHITECTURE.md §3.1.
 *
 * TWO STYLESHEETS, IN THIS ORDER, AND THE ORDER IS LOAD-BEARING:
 *   1. design-system.css declares `@layer wl.reset, wl.tokens, wl.base,
 *      wl.components, wl.utilities, wl.adaptive` and defines every token.
 *   2. globals.css declares `wl.page`, appended after the system layers, so page
 *      composition overrides without specificity escalation and without
 *      `!important`.
 *
 * THE BOUNDARY STATEMENT IS IN THE ROOT LAYOUT, NOT ON A PAGE. USER_JOURNEY §7.4
 * makes it never dismissible and never in a modal; putting it here is what makes
 * "never" a property of the application rather than a habit of whoever wrote the
 * last screen. It is styled as structure — a rule and ink — rather than as a
 * callout, because a callout is a thing a reader learns to skip.
 *
 * THERE IS NO SUPPORT LINK IN THIS SHELL, AND THERE MUST NEVER BE ONE. A3: no
 * escalation path to a human anywhere in the compliance flow. A `mailto:` or a
 * help widget in the layout would appear on every screen in the product,
 * including the ones that exist precisely to refuse without one.
 *
 * NAMING.md §7.1: the wordmark renders as `Ratepin` — initial capital, lowercase
 * remainder, one word. A `text-transform` on `.rp-wordmark` in any stylesheet is a
 * review failure.
 */

import type { Metadata, Viewport } from 'next';

import './design-system.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ratepin — certified payroll with a rate of record',
  description:
    'Ratepin turns a payroll CSV into a WH-347 and a California eCPR XML, with every rate ' +
    'traced to a named wage-determination number, revision and publication date.',
  // A data: URI, because identity furniture does not justify an external request.
  icons: {
    icon:
      "data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2032%2032'%3E%3Crect%20width%3D'32'%20height%3D'32'%20fill%3D'%2312508F'%2F%3E%3Ctext%20x%3D'16'%20y%3D'22'%20font-family%3D'ui-sans-serif%2Csystem-ui%2Csans-serif'%20font-size%3D'20'%20font-weight%3D'600'%20text-anchor%3D'middle'%20fill%3D'%23FFFFFF'%3ER%3C%2Ftext%3E%3C%2Fsvg%3E",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // §10.2: declared so form controls, scrollbars and ::backdrop follow the theme.
  colorScheme: 'light dark',
  // §4.4: light and dark are independently authored palettes, not a filter.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E9E6DE' },
    { media: '(prefers-color-scheme: dark)', color: '#131210' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="rp-skip" href="#main">
          Skip to content
        </a>

        <header className="rp-header">
          <a className="rp-wordmark" href="/">
            Ratepin
            <span className="rp-wordmark__rule" aria-hidden="true" />
          </a>
        </header>

        <main id="main" className="rp-shell rp-app-main">
          {children}
        </main>

        <footer className="rp-shell rp-app-footer">
          <p className="rp-boundary">
            Ratepin computes and formats. <strong>You certify.</strong> We do not file, we do not
            submit, we do not e-sign, and we do not hold your portal credentials. This is not legal
            advice. We do not conclude that a filing is accepted, compliant or approved; that a wage
            determination is effective for your contract; that a fringe credit is bona fide or
            annualized; that a deduction is permissible; or that a classification is correct.
          </p>
        </footer>
      </body>
    </html>
  );
}
