/**
 * The header veil — L1, the thinnest material.
 *
 * Spec: DESIGN_SYSTEM.md §8.11 — the wordmark left, at most one action right,
 * and **no navigation before payment** (B1, N4, ARCHITECTURE.md §3.1). The theme
 * control is not navigation; it is the one control the design system requires a
 * surface for (§10, three theme states).
 *
 * It is L1 rather than L2 because it is the only persistently visible glass
 * surface in the product, and a heavy blurred bar riding above the clause the
 * seller is trying to read is precisely the P1 failure. It is also the surface
 * counted FIRST against the three-per-viewport budget (§7's counting rule),
 * which is why every card on every screen below it is `.cw-mat-0`.
 */

import { ThemeToggle } from './ThemeToggle';

export function SiteHeader() {
  return (
    <header className="cw-header">
      <div className="cw-header__inner">
        <a className="cw-wordmark" href="/">
          clausewright
        </a>
        <div className="cw-header__actions">
          <span className="cw-header__note">Not legal advice</span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
