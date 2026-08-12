/**
 * Root layout — the web process's single shell.
 *
 * Spec: DESIGN_SYSTEM.md + identity/design-system.css (loaded once here, per its
 * own header note: "No imports. No build step. No external requests. Load once
 * in the root layout."), ARCHITECTURE.md §3.1.
 *
 * NAMING.md §3.5: the wordmark renders as one unbroken lowercase token so it
 * survives at icon and label sizes. Do not split, capitalise or hyphenate it.
 */

import type { Metadata, Viewport } from 'next';

import '../styles/design-system.css';
import '../styles/app.css';

export const metadata: Metadata = {
  title: 'clausewright — Suspension Defense Copilot',
  description:
    'Paste your Amazon or Walmart deactivation notice and get a submission-ready Plan of Action that cites the exact policy clause you were charged under.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The design system is theme-aware; both are first-class.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F7FB' },
    { media: '(prefers-color-scheme: dark)', color: '#0A1017' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="cw-shell">
          <header className="cw-header">
            <a className="cw-wordmark cw-wordmark--lg" href="/">
              clausewright
            </a>
          </header>
          <main>{children}</main>
          {/* B11: "not legal advice" renders on every surface that shows a
              draft. It lives in the layout so no route can omit it. */}
          <footer className="cw-disclaimer">
            Clausewright drafts appeal documents that cite marketplace policy. It is not a law firm
            and does not provide legal advice. You submit your appeal yourself — we never log into
            your seller account.
          </footer>
        </div>
      </body>
    </html>
  );
}
