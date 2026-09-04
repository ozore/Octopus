/**
 * The job kinds this app adds to the platform's queue.
 *
 * A separate module from `jobs.ts` so `lookup.ts` can enqueue without importing
 * the handlers — which would pull the live SAM client into every page that
 * merely reads a rate.
 */
export const KB_JOB_KINDS = {
  fetchDetermination: 'kb.fetch_determination',
  fetchHistory: 'kb.fetch_history',
  backfillHistory: 'kb.backfill_history',
  reparse: 'kb.reparse',
  modificationDetected: 'wd.modification_detected',
  watchNotify: 'wd.watch_notify',
} as const;

export type KbJobKind = (typeof KB_JOB_KINDS)[keyof typeof KB_JOB_KINDS];
