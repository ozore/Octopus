/**
 * M7's public surface — `specs/07`.
 *
 * The module is split so that the parts with no I/O can be tested without a
 * database: `ladder` is arithmetic, `email` is copy, `summary` is copy, and
 * `service` is the only file that touches Postgres or an adapter.
 */

export {
  LADDER_LAST_DAY,
  MAX_MESSAGES_PER_EXPIRY,
  MAX_MESSAGES_PER_RECIPIENT_PER_EXPIRY,
  RECIPIENT_MIN_INTERVAL_HOURS,
  RUNGS,
  RUNG_HOUR_LOCAL,
  RUNG_OFFSET_DAYS,
  addDays,
  computeLadder,
  instantAtLocalTime,
  isRung,
  parseLadder,
  totalForExpiry,
  type Rung,
  type ScheduledRung,
} from './ladder';

export {
  LINK_KINDS,
  composeVendorEmail,
  extractUrls,
  legalUrls,
  scheduleSentence,
  subjectLine,
  unsubscribeUrl,
  uploadUrl,
  type ComposedVendorEmail,
  type LinkKind,
  type VendorEmailInput,
} from './email';

export { requirementSummary, requirementSummaryText, type RequirementLine } from './summary';

export {
  ensureReminderSettings,
  ladderFor,
  ownerEmail,
  replyToFor,
  updateReminderSettings,
  type ReminderSettings,
  type ReminderSettingsPatch,
} from './settings';

export {
  chaseState,
  claimDueReminders,
  countDeferred,
  countSentForExpiry,
  deliveryRole,
  drainReminders,
  listBounceActions,
  listCannotChase,
  listEmailLog,
  pauseReminders,
  resolveRecipients,
  scheduleLadder,
  sendClaimedReminder,
  sendReminderNow,
  type ChaseState,
  type ClaimedReminder,
  type DrainSummary,
  type Recipient,
  type ScheduleOutcome,
  type SendOutcome,
} from './service';

export {
  WEBHOOK_TOLERANCE_SECONDS,
  applyResendEvent,
  signResendWebhook,
  verifyResendWebhook,
  type ResendEvent,
  type ResendEventType,
} from './webhook';

export {
  listGlobalSuppressions,
  resolveUnsubscribeToken,
  suppress,
  suppressionFor,
  type SuppressionReason,
  type UnsubscribeScope,
} from './unsubscribe';
