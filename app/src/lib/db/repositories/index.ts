/**
 * Repository barrel — one Drizzle-backed module per table in the scaffold
 * schema (schema.ts), plus the case state machine.
 *
 * Spec: this is the composition root for `src/lib/db/`, matching the pattern
 * `src/lib/adapters/index.ts` already uses for vendor adapters: callers import
 * from here (or from a single named module) rather than reaching into
 * `../schema` and hand-rolling queries at each call site.
 */

export * from './types';

export * as customers from './customers';
export * as cases from './cases';
export * as noticeDocuments from './notice-documents';
export * as classifications from './classifications';
export * as corpusSliceRefs from './corpus-slice-refs';
export * as drafts from './drafts';
export * as critiques from './critiques';
export * as humanEdits from './human-edits';
export * as payments from './payments';
export * as stripeEvents from './stripe-events';
export * as scheduledEmails from './scheduled-emails';
export * as shieldAccounts from './shield-accounts';
export * as inboundNotices from './inbound-notices';
export * as consents from './consents';
export * as outcomeReports from './outcome-reports';
export * as l4Records from './l4-records';
export * as citationUses from './citation-uses';
