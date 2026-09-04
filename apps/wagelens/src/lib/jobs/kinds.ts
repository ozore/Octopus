/**
 * The job kinds WL-08, WL-09 and WL-14 add to the platform's queue.
 *
 * A separate module from the handlers so a page can enqueue without importing
 * a handler — which would pull the SAM client, the mailer and the plan map into
 * every render that touches the queue.
 *
 * Note the split between DETECTING and SENDING. `wd.modification_detected`
 * builds the alert row (idempotent, unique-indexed) and enqueues
 * `wl.alert_email`; the send is a separate job with its own dedupe key and its
 * own retries, so a mail failure retries the SEND rather than recomputing the
 * diff and risking a second row.
 */
export const APP_JOB_KINDS = {
  /** Owned by WL-08; the seam is registered as a no-op in `lib/kb/jobs.ts`. */
  modificationDetected: 'wd.modification_detected',
  /** Owned by WL-14; same seam. */
  watchNotify: 'wd.watch_notify',

  alertEmail: 'wl.alert_email',
  watchConfirmEmail: 'wl.watch_confirm_email',
  watchAlertEmail: 'wl.watch_alert_email',
  trialReminderEmail: 'wl.trial_reminder_email',
  renewalNoticeEmail: 'wl.renewal_notice_email',
  /** The daily tick: WL-14's retention sweep and WL-09's pre-charge notices. */
  daily: 'wl.daily',
} as const;

export type AppJobKind = (typeof APP_JOB_KINDS)[keyof typeof APP_JOB_KINDS];
