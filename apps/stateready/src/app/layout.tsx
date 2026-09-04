import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '../styles/design-system.css';
import '../styles/app.css';

// The composition root: importing it here means every route in the app — page,
// action or handler — starts with the plan map, job registry and migrations
// configured (src/lib/platform.ts).
import '../lib/platform';

export const metadata: Metadata = {
  title: process.env['NEXT_PUBLIC_APP_NAME'] ?? 'StateReady',
  description:
    'Licence, CE and readiness tracking for multi-state HVAC, plumbing and electrical contractors — ' +
    'every rule with the state board page it came from and the day we last checked it.',
};

/**
 * THE BOARD IS THE DEFAULT AND IT IS OPAQUE.
 *
 * `design-system.css` sets `:root { color-scheme: dark }` and paints `body`
 * with `--sr-ground`; the paper theme is the alternate and is what leaves the
 * building — print, the bid PDF, the shared readiness link, the technician card
 * and every email (`IDENTITY_ARBITRATION.md` §3.2). `data-theme` is stamped by
 * the settings choice (`board | paper | system`) and by the surfaces that force
 * paper, never by a media query alone.
 *
 * FONTS. Barlow, Barlow Condensed and Overpass Mono are requested by the
 * `@import` at the top of `design-system.css` — one request, `display=swap`,
 * and every family has a real fallback stack, so the app is fully usable with
 * Google Fonts blocked (`IDENTITY.md` §8.1). The two `preconnect`s below are
 * the only thing this file adds: they shave the DNS and TLS round-trips off
 * that request without changing what is requested.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
