import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '../styles/design-system.css';
import '../styles/app.css';

// Importing the composition root here means every route in the app — page,
// action or handler — starts with the plan map, job registry and migrations
// configured (src/lib/platform.ts).
import '../lib/platform';

/**
 * Fonts per IDENTITY.md §7: Public Sans for the interface, IBM Plex Mono for
 * every figure. Both are `<link>`ed rather than self-hosted because the design
 * system's own header says the import is OPTIONAL — every family has a
 * metric-compatible fallback stack, so a blocked or slow Google Fonts request
 * degrades to a system face rather than to an unstyled page.
 */
export const metadata: Metadata = {
  title: process.env['NEXT_PUBLIC_APP_NAME'] ?? 'App',
  description:
    'Federal Davis-Bacon wage determinations by state, county and construction type — with the determination number, the modification and the source.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,400..700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
