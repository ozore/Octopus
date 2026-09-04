import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '../styles/design-system.css';
import '../styles/app.css';

// Importing the composition root here means every route in the app — page,
// action or handler — starts with the plan map, job registry and migrations
// configured (src/lib/platform.ts).
import '../lib/platform';

export const metadata: Metadata = {
  title: process.env['NEXT_PUBLIC_APP_NAME'] ?? 'App Template',
  description: 'Scaffold for a TheVillage app.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
