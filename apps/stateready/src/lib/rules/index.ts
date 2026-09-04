/**
 * M5 — the rules engine, as one import.
 *
 * Nothing here touches the database or the network. `src/lib/repos/deadlines.ts`
 * is what persists what this produces; keeping the seam sharp is what lets the
 * golden set run with no schema at all (D6).
 */

export * from './dates';
export * from './tokens';
export * from './assess';
export * from './ce';
export * from './derive';
