import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// ORDER MATTERS. `fonts.css` declares the two self-hosted faces; the design
// system's tokens name them; `app.css` builds Certly's layout from those tokens
// and nothing else. `design-system.css` is byte-identical to the signed file in
// phase-4-revenue/certly and `npm run identity:check` fails the build if it
// ever stops being — so never edit it here.
import '../styles/fonts.css';
import '../styles/design-system.css';
import '../styles/app.css';

// Importing the composition root here means every route in the app — page,
// action or handler — starts with the plan map, job registry and migrations
// configured (src/lib/platform.ts).
import '../lib/platform';

const APP_NAME = process.env['NEXT_PUBLIC_APP_NAME'] ?? 'Certly';

export const metadata: Metadata = {
  title: APP_NAME,
  description:
    'Read a certificate of insurance and see what it evidences against the requirements you set — and what it only claims.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
