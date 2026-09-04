/**
 * Paper — the theme every forwardable artefact renders in.
 *
 * `IDENTITY_ARBITRATION.md` §3.2, in one sentence:
 *
 * > **The board is for the operator. Paper is for the forwarder.**
 *
 * The board is the default and it is the coordinator's instrument surface.
 * Everything that *leaves the building* is paper: print, the bid-package PDF,
 * the shareable readiness link, the technician card and every alert email.
 * `PERSONA.md` §9 requires every artefact to be forwardable to a general
 * manager who has never logged in, and a forwarded dark screenshot is not that.
 *
 * THREE WAYS PAPER IS REACHED, and they are deliberately different mechanisms:
 *
 *  1. **Print** — forced by `@media print` in `design-system.css`. The board
 *     never prints, whatever the operator's setting.
 *  2. **A viewer who has asked their OS for a light interface** — resolved by
 *     `prefers-color-scheme: light`, which the design system maps to paper.
 *  3. **A surface that is paper WHATEVER the viewer prefers** — this component.
 *     `data-theme="paper"` on the surface's own root beats both of the above,
 *     because the artefact's audience is not the person who chose the theme.
 *
 * Sub-wave A ships the mechanism; the surfaces that use it are M6 (email),
 * M8 (the Entry Pack and `/share/:token`) and M17 (`/r/:token`), plus M4's
 * technician card. `BUILD.md` names them.
 */

import type { ReactNode } from 'react';

/** Spread onto the root element of any artefact that leaves the building. */
export const PAPER_THEME_ATTRS = { 'data-theme': 'paper' } as const;

/**
 * A paper surface. Status hues are identical between the two themes and only
 * lightness moves, so a coordinator who switches mid-task never has to re-learn
 * the map — and a forwarded artefact reads the same as the screen it came from.
 */
export function PaperSurface({
  children,
  className,
  testId,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div {...PAPER_THEME_ATTRS} className={className} data-testid={testId} style={{ background: 'var(--sr-ground)', color: 'var(--sr-ink)' }}>
      {children}
    </div>
  );
}

/**
 * The theme a signed-in operator has chosen. `board | paper | system` — never
 * `light | dark` (`UX.md` S17): the names are the product's, and calling them
 * light and dark would invite a component to reason about brightness instead of
 * about who the surface is for. `system` resolves a light preference to paper.
 */
export type ThemeChoice = 'board' | 'paper' | 'system';

export function themeAttributes(choice: ThemeChoice): Record<string, string> {
  return choice === 'system' ? {} : { 'data-theme': choice };
}
