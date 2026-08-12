/**
 * Chrome for every screen after the landing page.
 *
 * Spec: DESIGN_SYSTEM.md §8.11 (header veil), §8.10 (the disclaimer), B11.
 *
 * The disclaimer lives HERE rather than on each page for the same reason the
 * citation gate lives at the render boundary rather than in a prompt: a rule
 * that each caller has to remember is a rule that will eventually be forgotten.
 * NAMING.md §5 invariant 3 requires "not legal advice" on every surface that
 * renders a draft, and every such surface is inside this layout.
 *
 * There is still no navigation. A seller mid-appeal has exactly one thing to do
 * next on every screen, and a nav bar offering four alternatives is a cognitive
 * tax on someone already at capacity (Nielsen #8, USER_JOURNEY §8.1).
 */

import { Disclaimer } from '@/components/Disclaimer';
import { SiteHeader } from '@/components/SiteHeader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="cw-app">
      <a className="cw-skip" href="#main">
        Skip to the main content
      </a>
      <SiteHeader />
      <main className="cw-app__main" id="main">
        <div className="cw-shell">{children}</div>
      </main>
      <footer className="cw-app__foot">
        <div className="cw-shell">
          <Disclaimer />
        </div>
      </footer>
    </div>
  );
}
