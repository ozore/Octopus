/**
 * Outcome-capture module barrel — the consented outcome loop (D10, ADR-008).
 *
 * Order of the pipeline, spread across these files:
 *   1. consent.ts    — recorded at Checkout, revocable, versioned (ADR-008 ¶1)
 *   2. reports.ts     — the day-3/10/21 self-report (B9)
 *   3. redaction.ts   — the deterministic-first anonymization pass (§4.4)
 *   4. pipeline.ts    — consent ∧ redaction → staged L4 record (§4.6, ¶2)
 *   5. promotion.ts   — ∧ human-spot-check-or-threshold → promoted (¶2)
 */

export * from './consent';
export * from './reports';
export * from './redaction';
export * from './pipeline';
export * from './promotion';
export * from './handlers';
