/**
 * M9 — the audit trail. `specs/09`.
 *
 * Every state-changing action writes ONE append-only row IN THE SAME
 * TRANSACTION as the change. If the audit write fails, the change fails
 * (`specs/09` §2, A7) — which is why `writeAuditEvent` takes the transaction
 * handle rather than opening its own.
 *
 * `summary` is rendered AT WRITE TIME and stored. If we later change how we
 * phrase an event, history must not silently change with it: the record is what
 * was true then. That is also why the renderer is a pure function of its
 * payload and lives next to the closed set of kinds — a new kind added without
 * copy is a test failure (`specs/09` §12), not a `[object Object]` in an
 * owner audit.
 */

import { and, desc, eq, lt } from 'drizzle-orm';

import { auditEvents } from './schema';
import { newId } from './ids';
import type { Db } from './db';

/** The closed set — `specs/09` §5. Adding a kind here without adding a sentence
 *  to `renderSummary` fails `tests/audit.test.ts`. */
export const AUDIT_KINDS = [
  'vendor.created',
  'vendor.updated',
  'vendor.archived',
  'vendor.type_assigned',
  'document.uploaded',
  'document.rejected',
  'document.duplicate',
  'extraction.succeeded',
  'extraction.failed',
  'extraction.field_corrected',
  'extraction.review_completed',
  'certificate.promoted',
  'certificate.superseded',
  'comparison.run',
  'comparison.reevaluated',
  'requirements.set_created',
  'requirements.set_edited',
  'requirements.assigned',
  'requirements.template_applied',
  'reminder.scheduled',
  'reminder.sent',
  'reminder.bounced',
  'reminder.paused',
  'reminder.unsubscribed',
  'link.created',
  'link.revoked',
  'link.opened',
  'link.upload_received',
  'org.settings_changed',
  'org.entity_block_changed',
  'member.invited',
  'member.role_changed',
  'billing.trial_started',
  'billing.subscription_changed',
  'data.exported',
  'data.deleted',
] as const;

export type AuditKind = (typeof AUDIT_KINDS)[number];

export type AuditActor =
  | { kind: 'user'; userId: string; email?: string | null }
  | { kind: 'vendor_link' }
  | { kind: 'system' }
  | { kind: 'inbound' };

export type AuditInput = {
  orgId: string;
  actor: AuditActor;
  kind: AuditKind;
  subjectType?: string | null;
  subjectId?: string | null;
  payload?: Record<string, unknown>;
  /** Overrides the rendered sentence. Used only where the caller knows better. */
  summary?: string;
};

const ACTOR_LABEL: Record<Exclude<AuditActor['kind'], 'user'>, string> = {
  vendor_link: 'vendor upload link',
  system: 'Certly (automatic)',
  inbound: 'forwarded email',
};

/** `payload.name`, safely, for the sentence renderer. */
function s(payload: Record<string, unknown> | undefined, key: string, fallback = ''): string {
  const value = payload?.[key];
  if (value === null || value === undefined) return fallback;
  return String(value);
}

/**
 * SENTENCES, NOT JSON (`specs/09` §3). "Ana changed General liability each
 * occurrence from $500,000 to $1,000,000" — not a JSON pointer. An owner
 * reading an audit trail is not reading our data model.
 */
export function renderSummary(kind: AuditKind, actor: AuditActor, payload?: Record<string, unknown>): string {
  const who = actor.kind === 'user' ? (payload?.['actorEmail'] ? String(payload['actorEmail']) : 'A team member') : ACTOR_LABEL[actor.kind];
  const vendor = s(payload, 'vendorName', 'a vendor');

  switch (kind) {
    case 'vendor.created':
      return `${who} added ${vendor}.`;
    case 'vendor.updated':
      return `${who} changed ${s(payload, 'field', 'a detail')} on ${vendor}${payload?.['from'] !== undefined ? ` from ${s(payload, 'from', '(blank)')} to ${s(payload, 'to', '(blank)')}` : ''}.`;
    case 'vendor.archived':
      return `${who} archived ${vendor}. Its certificates and history stay on the record; its reminders were cancelled.`;
    case 'vendor.type_assigned':
      return `${who} set ${vendor}'s type to ${s(payload, 'vendorType', 'a type')}, so ${s(payload, 'requirementSetName', 'the assigned requirement set')} now applies.`;
    case 'document.uploaded':
      return `${who} uploaded ${s(payload, 'filename', 'a document')}${payload?.['vendorName'] ? ` for ${vendor}` : ''}.`;
    case 'document.rejected':
      return `${who} rejected ${s(payload, 'filename', 'a document')}: ${s(payload, 'reason', 'it is not a certificate')}.`;
    case 'document.duplicate':
      return `${s(payload, 'filename', 'A document')} was already on file for ${vendor}, so it was not read again.`;
    case 'extraction.succeeded':
      return `Certly read ${s(payload, 'filename', 'the document')} and found ${s(payload, 'coverages', '0')} coverage rows.`;
    case 'extraction.failed':
      return `Certly could not read ${s(payload, 'filename', 'the document')}: ${s(payload, 'reason', 'the document could not be processed')}.`;
    case 'extraction.field_corrected':
      return `${who} changed ${s(payload, 'fieldLabel', 'a field')} from ${s(payload, 'wasValue', '(blank)')} to ${s(payload, 'nowValue', '(blank)')}.`;
    case 'extraction.review_completed':
      return `${who} accepted Certly's reading of ${s(payload, 'filename', 'the document')} after ${s(payload, 'corrections', '0')} corrections.`;
    case 'certificate.promoted':
      return `The certificate for ${vendor} became the current one on file.`;
    case 'certificate.superseded':
      return `A newer certificate arrived for ${vendor}, so the previous one is no longer current.`;
    case 'comparison.run':
      return `Certly compared ${vendor}'s certificate against ${s(payload, 'requirementSetName', 'your requirements')}: ${s(payload, 'metCount', '0')} met, ${s(payload, 'gapCount', '0')} gaps, ${s(payload, 'assertedOnlyCount', '0')} claimed but not evidenced.`;
    case 'comparison.reevaluated':
      return `Certly re-compared ${vendor} because ${s(payload, 'cause', 'the requirements changed')}.`;
    case 'requirements.set_created':
      return `${who} created the requirement set ${s(payload, 'requirementSetName', '(unnamed)')}.`;
    case 'requirements.set_edited':
      return `${who} edited ${s(payload, 'requirementSetName', 'a requirement set')} — it is now version ${s(payload, 'version', '?')} and applies to ${s(payload, 'vendorCount', '0')} vendors.`;
    case 'requirements.assigned':
      return `${who} assigned ${s(payload, 'requirementSetName', 'a requirement set')} to ${s(payload, 'scope', 'the organisation')}.`;
    case 'requirements.template_applied':
      return `${who} started from the ${s(payload, 'templateId', 'library')} template, copying ${s(payload, 'rows', '0')} rows.`;
    case 'reminder.scheduled':
      return `Certly scheduled ${s(payload, 'total', 'the')} renewal reminders for ${vendor}, the first at ${s(payload, 'firstRung', 'T-60')}.`;
    case 'reminder.sent':
      return `Certly emailed ${s(payload, 'recipientEmail', 'the vendor')} about ${vendor}'s ${s(payload, 'expiryDate', 'renewal')} (${s(payload, 'rung', 'a reminder')}).`;
    case 'reminder.bounced':
      return `The reminder to ${s(payload, 'recipientEmail', 'the vendor')} bounced. That address will not be used again until it is corrected.`;
    case 'reminder.paused':
      return `${who} paused reminders for ${vendor}.`;
    case 'reminder.unsubscribed':
      return `${s(payload, 'recipientEmail', 'A recipient')} unsubscribed (${s(payload, 'scope', 'this organisation')}). Certly will not email that address again.`;
    case 'link.created':
      return `An upload link was created for ${vendor}, expiring ${s(payload, 'expiresAt', 'later')}.`;
    case 'link.revoked':
      return `${who} revoked ${vendor}'s upload link.`;
    case 'link.opened':
      return `${vendor}'s upload link was opened.`;
    case 'link.upload_received':
      return `A certificate arrived through ${vendor}'s upload link.`;
    case 'org.settings_changed':
      return `${who} changed ${s(payload, 'field', 'a setting')}.`;
    case 'org.entity_block_changed':
      return `${who} changed the certificate-holder block, so ${s(payload, 'reevaluatedVendors', '0')} vendors were re-compared.`;
    case 'member.invited':
      return `${who} invited ${s(payload, 'email', 'a colleague')} as ${s(payload, 'role', 'a member')}.`;
    case 'member.role_changed':
      return `${who} changed ${s(payload, 'email', 'a member')}'s role to ${s(payload, 'role', 'member')}.`;
    case 'billing.trial_started':
      return `${who} started a 14-day trial on the ${s(payload, 'plan', 'chosen')} plan. The first charge is ${s(payload, 'firstChargeAt', 'on day 14')}.`;
    case 'billing.subscription_changed':
      return `The subscription changed to ${s(payload, 'status', 'a new status')} on the ${s(payload, 'plan', 'current')} plan.`;
    case 'data.exported':
      return `${who} exported ${s(payload, 'what', 'data')}${payload?.['rows'] ? ` (${s(payload, 'rows')} rows)` : ''}.`;
    case 'data.deleted':
      return `${who} deleted ${s(payload, 'what', 'data')}.`;
    default: {
      const exhaustive: never = kind;
      return `An event of kind ${String(exhaustive)} was recorded.`;
    }
  }
}

/** `specs/09` §7: 500 characters, and never document content beyond a value. */
const MAX_SUMMARY = 500;

/**
 * Internal only — called INSIDE the caller's transaction, never as a server
 * action. `db` is the transaction handle from `withTx`, not a fresh client.
 */
export async function writeAuditEvent(db: Db, input: AuditInput): Promise<string> {
  const id = newId('audit');
  const rendered = input.summary ?? renderSummary(input.kind, input.actor, input.payload);
  const summary = rendered.length > MAX_SUMMARY ? `${rendered.slice(0, MAX_SUMMARY - 1)}…` : rendered;

  await db.insert(auditEvents).values({
    id,
    orgId: input.orgId,
    actorKind: input.actor.kind,
    actorUserId: input.actor.kind === 'user' ? input.actor.userId : null,
    actorLabel: input.actor.kind === 'user' ? null : ACTOR_LABEL[input.actor.kind],
    kind: input.kind,
    subjectType: input.subjectType ?? null,
    subjectId: input.subjectId ?? null,
    summary,
    payload: truncatePayload(input.payload ?? {}),
  });
  return id;
}

/** `specs/09` §9: a very large payload is truncated to 8 KB with a flag. */
export function truncatePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const json = JSON.stringify(payload);
  if (json.length <= 8192) return payload;
  return { payload_truncated: true, bytes: json.length, preview: json.slice(0, 4000) };
}

export async function getVendorActivity(
  db: Db,
  input: { orgId: string; vendorId: string; before?: Date; limit?: number },
) {
  const conditions = [
    eq(auditEvents.orgId, input.orgId),
    eq(auditEvents.subjectType, 'vendor'),
    eq(auditEvents.subjectId, input.vendorId),
  ];
  if (input.before) conditions.push(lt(auditEvents.createdAt, input.before));
  return db
    .select()
    .from(auditEvents)
    .where(and(...conditions))
    .orderBy(desc(auditEvents.createdAt))
    .limit(input.limit ?? 50);
}

export async function getOrgActivity(
  db: Db,
  input: { orgId: string; kind?: AuditKind; before?: Date; limit?: number },
) {
  const conditions = [eq(auditEvents.orgId, input.orgId)];
  if (input.kind) conditions.push(eq(auditEvents.kind, input.kind));
  if (input.before) conditions.push(lt(auditEvents.createdAt, input.before));
  return db
    .select()
    .from(auditEvents)
    .where(and(...conditions))
    .orderBy(desc(auditEvents.createdAt))
    .limit(input.limit ?? 50);
}
