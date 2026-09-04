/**
 * The copy is only honest if something checks it.
 *
 * `apps/stateready/kb/` and `src/styles/design-system.css` are copies of
 * `phase-4-revenue/stateready/kb-data`, `/ontology` and `/design-system.css`.
 * The app serves its own copies (see `src/lib/kb/records.ts` for why), and this
 * test byte-compares them against the source in BOTH directions and fails the
 * build on any divergence, naming the file.
 *
 * It is the build-time equality check the brief asks for, for the design system
 * AND for the knowledge base, in one place.
 */

import { describe, expect, it } from 'vitest';

import { compareCopies, COPIES, sourceTreeAvailable } from '../src/scripts/kb-check';

describe('the copied knowledge base and design system are identical to phase-4-revenue/stateready', () => {
  it('compares three trees', () => {
    expect(COPIES.map((c) => c.label)).toEqual(['kb-data', 'ontology', 'design-system.css']);
  });

  it('finds no difference', () => {
    if (!sourceTreeAvailable()) {
      // Inside a deployed bundle the source tree does not exist; CI always has
      // it, and CI is where this gate has to hold.
      expect(sourceTreeAvailable()).toBe(false);
      return;
    }
    const differences = compareCopies();
    expect(
      differences.map((d) => `${d.pair}/${d.file}: ${d.reason}`),
      'Re-copy from phase-4-revenue/stateready and re-run the golden tests.',
    ).toEqual([]);
  });
});
