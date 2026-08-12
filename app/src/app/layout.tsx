/**
 * Root layout — the web process's single shell.
 *
 * Spec: DESIGN_SYSTEM.md §10 ("No imports. No build step. No external requests.
 * Load once in the root layout"), ARCHITECTURE.md §3.1.
 *
 * THE SHELL IS DELIBERATELY EMPTY. The landing page is full-bleed and carries
 * its own header and footer; the app screens carry theirs through the `(app)`
 * route group. Putting chrome here would force one of the two to fight it, and
 * DESIGN_SYSTEM §8.11 gives the header exactly one job — the wordmark and at
 * most one action, with no navigation before payment (B1, N4).
 *
 * THREE STYLESHEETS, IN THIS ORDER, AND THE ORDER IS LOAD-BEARING:
 *   1. design-system.css declares `@layer cw.reset, cw.tokens, cw.base,
 *      cw.components, cw.utilities` and defines every token.
 *   2. app.css adds layout glue inside `cw.utilities`.
 *   3. landing.css / app-pages.css declare `cw.page` — appended after the system
 *      layers, so page composition overrides without specificity escalation and
 *      without `!important`.
 * A colour authored in 2 or 3 rather than 1 is a colour outside the §4.5
 * contrast certification, which is a test rather than documentation.
 *
 * NAMING.md §3.5: the wordmark renders as one unbroken lowercase token so it
 * survives at icon and label sizes. Do not split, capitalise or hyphenate it.
 */

import type { Metadata, Viewport } from 'next';

import { ThemeScript } from '@/components/ThemeScript';

import '../styles/design-system.css';
import '../styles/app.css';
import '../components/styles/landing.css';
import '../components/styles/app-pages.css';

export const metadata: Metadata = {
  title: 'Clausewright — Suspension Defense Copilot for Amazon and Walmart Sellers',
  description:
    'Suspension defense copilot for Amazon and Walmart sellers. Paste your deactivation notice and see your reason code and the exact policy clause you were charged under — free, before you pay anything.',
  openGraph: {
    type: 'website',
    title: 'Clausewright — Suspension Defense Copilot for Amazon and Walmart Sellers',
    description:
      'Every day dark costs you a day’s sales. Get back to selling — with the exact policy clause on your side.',
  },
  // A data: URI, because X5 forbids an external request for identity furniture.
  icons: {
    icon: "data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2032%2032'%3E%3Crect%20width%3D'32'%20height%3D'32'%20rx%3D'7'%20fill%3D'%2316704D'%2F%3E%3Ctext%20x%3D'16'%20y%3D'23'%20font-family%3D'ui-sans-serif%2Csystem-ui%2Csans-serif'%20font-size%3D'21'%20font-weight%3D'600'%20text-anchor%3D'middle'%20fill%3D'%23FFFFFF'%3Ec%3C%2Ftext%3E%3C%2Fsvg%3E",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
  // A12: light and dark are independently authored palettes, not a filter.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F7FB' },
    { media: '(prefers-color-scheme: dark)', color: '#0A1017' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
