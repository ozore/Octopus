/**
 * The job kinds this app registers, as a module with NO dependencies.
 *
 * `platform.ts` is imported by every route, layout and action, so a constant it
 * needs must not drag the job's implementation — the drain, the rules engine,
 * the knowledge base — into every bundle. The handlers themselves are loaded
 * lazily inside the handler function; these names are all the composition root
 * needs at import time.
 */

/** `specs/06` — the digests. */
export const ALERTS_DRAIN_JOB = 'stateready.alerts_drain';
/** `specs/09` — day 7, day 12, day 14. */
export const TRIALS_JOB = 'stateready.trial_lifecycle';
/** `specs/10` — the export zip. */
export const EXPORT_JOB = 'stateready.data_export';
/** `specs/10` — the seven-day deletion sweep. */
export const DELETION_JOB = 'stateready.execute_deletions';
/** Registered by sub-wave A; enqueued here so one cron drives every schedule. */
export const KB_DRIFT_JOB = 'stateready.kb_drift';

export const B2_DAILY_JOBS = [ALERTS_DRAIN_JOB, TRIALS_JOB, DELETION_JOB, KB_DRIFT_JOB] as const;
