/**
 * Email module barrel.
 *
 * Spec: ARCHITECTURE.md §2.1, §3.7, ADR-006 — outbound templates + sends, the
 * day-3/10/21 scheduling, and the inbound ingest path.
 */

export * as templates from './templates';
export * as send from './send';
export * from './outcome-sequence';
export * from './inbound';
export * from './handlers';
