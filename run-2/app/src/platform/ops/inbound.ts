/**
 * G5 — the counter we are not allowed to turn down.
 *
 * Spec: USER_JOURNEY.md §11.8 (the redefinition, MED-2), ARCHITECTURE.md §10.5
 * (the one human-facing channel, named honestly), §14 (G5's row), and the trigger at
 * the bottom of `src/platform/schema.ts`, which is the storage half of the same rule.
 *
 * THE FINDING THIS MODULE IMPLEMENTS. G5 was originally written as *"any inbound
 * message REQUIRING a human answer increments the counter"* — the one gate in the
 * run whose input was a judgement call by the party the gate embarrasses. The
 * redefinition removes the judgement in three places, and all three are here:
 *
 * 1. **Count everything, decide nothing.** `recordInboundMessage` has no `skip`
 *    parameter, no `internal` flag and no "didn't need an answer" branch. Every
 *    message at every published address inserts a row. A mechanical filter may
 *    derive a smaller number ALONGSIDE the raw total — `classifyInbound` does
 *    exactly that — and each filter is (a) a named machine-checkable rule, (b)
 *    published with its own count, and (c) unable to consume a message that fails
 *    no rule. **Anything not machine-classifiable counts as human**, which is the
 *    `default` of `classifyInbound` and the default of the column.
 *
 * 2. **A floor of one minute.** Reading a message and deciding not to answer is the
 *    cheapest human minute available and it is still a human minute. Without the
 *    floor, never replying is the strategy that drives the gate to zero; with it,
 *    never replying is the WORST strategy. The floor is a CHECK constraint, not a
 *    convention.
 *
 * 3. **The address set is derived from what we publish, not from what we watch.**
 *    `PUBLISHED_ADDRESSES` is the declared set; `assertAddressSetComplete` is what
 *    CI runs against the strings actually present on shipping surfaces. An address
 *    that can receive mail and is not declared fails the build, which closes the one
 *    evasion the counter would otherwise have: moving the load somewhere it is not
 *    counted.
 *
 * WHAT IS DELIBERATELY ABSENT: an update path that lowers `minutes_charged`, a
 * delete, a reclassification. The trigger refuses all three at the database, and
 * this module does not contain the SQL that would attempt them. Two mechanisms, as
 * everywhere else.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db, type Tx } from '../../db';
import { systemClock, type Clock } from '../clock';

/** The schema's `inbound_class` enum. */
export type InboundClassification = 'human' | 'spf_dkim_fail' | 'list_unsubscribe' | 'known_bulk';

export interface PublishedAddress {
  readonly address: string;
  /** Where the address is published. The surface is what makes the set auditable:
   *  "this is where somebody could have found it". */
  readonly surface:
    | 'copy_bundle'
    | 'email_from'
    | 'dns_mx'
    | 'rdap'
    | 'stripe_receipt'
    | 'artifact_template';
  readonly note: string;
}

/**
 * THE DECLARED SET. Four addresses, and the reason each one exists.
 *
 * §10.5 permits exactly one contact address in the product — a payment-dispute
 * address on the billing page, outside the compliance flow — because a customer
 * whose card has failed cannot use the in-app refund button and card-network
 * expectations require somewhere to write. Everything else here is an address that
 * exists whether we like it or not: the From header on outbound mail, and the two
 * mailboxes RFC 2142 obliges a mail-receiving domain to answer.
 *
 * DECLARING MORE THAN WE ADVERTISE IS THE SAFE DIRECTION and it is deliberate. An
 * undeclared address that receives mail is an uncounted human minute; a declared
 * address that receives none costs the counter nothing. The asymmetry is why
 * `postmaster` and `abuse` are in the list rather than argued about.
 */
export const PUBLISHED_ADDRESSES: readonly PublishedAddress[] = [
  {
    address: 'billing@ratepin.com',
    surface: 'copy_bundle',
    note:
      'ARCHITECTURE §10.5 — the one contact address in the product, on the billing ' +
      'page, for payment disputes. It is outside the compliance flow by construction: ' +
      'a lint rule fails the build if a mailto appears under the filing route tree.',
  },
  {
    address: 'notifications@ratepin.com',
    surface: 'email_from',
    note:
      'The From header of every outbound message (config EMAIL_FROM). There is no ' +
      'inbound adapter behind it — a reply routes nowhere in the product — but a ' +
      'reply is still a message somebody wrote to us, so it is counted.',
  },
  {
    address: 'postmaster@ratepin.com',
    surface: 'dns_mx',
    note: 'RFC 5321 §4.5.1: any MX-bearing domain must accept mail here.',
  },
  {
    address: 'abuse@ratepin.com',
    surface: 'rdap',
    note: 'RFC 2142 / the registrar and RDAP records for the domain.',
  },
] as const;

export const PUBLISHED_ADDRESS_SET: ReadonlySet<string> = new Set(
  PUBLISHED_ADDRESSES.map((a) => a.address),
);

/** The domain the address set is scoped to; anything at it is ours by definition. */
export const COMPANY_MAIL_DOMAIN = 'ratepin.com';

export class UndeclaredAddressError extends Error {
  constructor(readonly addresses: readonly string[]) {
    super(
      `G5: ${String(addresses.length)} address(es) can receive mail and are not declared in ` +
        `PUBLISHED_ADDRESSES: ${addresses.join(', ')}.\n` +
        'USER_JOURNEY §11.8: "An address that can receive mail and is not declared fails ' +
        'the build. That closes the obvious evasion — moving the load to an address the ' +
        'counter does not watch — because the counter\'s scope is derived from what we ' +
        'publish, not from what we choose to watch."',
    );
    this.name = 'UndeclaredAddressError';
  }
}

const ADDRESS_RE = /[a-z0-9._%+-]+@ratepin\.com/gi;

/** Every company address literal in a blob of shipping-surface text. */
export function addressesIn(text: string): readonly string[] {
  return [...new Set((text.match(ADDRESS_RE) ?? []).map((a) => a.toLowerCase()))];
}

/**
 * The CI assertion. Given every string found on the shipping surfaces, refuse any
 * that the declared set does not contain.
 */
export function assertAddressSetComplete(found: Iterable<string>): void {
  const undeclared = [...new Set([...found].map((a) => a.toLowerCase()))]
    .filter((a) => a.endsWith(`@${COMPANY_MAIL_DOMAIN}`))
    .filter((a) => !PUBLISHED_ADDRESS_SET.has(a))
    .sort();
  if (undeclared.length > 0) throw new UndeclaredAddressError(undeclared);
}

/** Apply the declared set to the database. Idempotent; never deletes a row, because
 *  an address we have stopped publishing still has messages counted against it. */
export async function ensurePublishedAddresses(db: Db | Tx): Promise<void> {
  for (const entry of PUBLISHED_ADDRESSES) {
    await db.execute(sql`
      INSERT INTO published_addresses (address, surface)
      VALUES (${entry.address}, ${entry.surface})
      ON CONFLICT (address) DO NOTHING
    `);
  }
}

// ---------------------------------------------------------------------------
// The named machine-checkable rules
// ---------------------------------------------------------------------------

export interface InboundSignals {
  /** SPF or DKIM failed at the MTA. Machine-checkable, and the rule is named. */
  readonly authenticationFailed?: boolean;
  /** RFC 2369 `List-Unsubscribe` present. */
  readonly listUnsubscribe?: boolean;
  /** The envelope sender matches a known bulk sender. */
  readonly knownBulkSender?: string | null;
}

export interface InboundClassificationResult {
  readonly classification: InboundClassification;
  /** NULL exactly when the classification is `human` — the schema's
   *  `inbound_rule_required` CHECK enforces the pairing, so a bulk row without a
   *  named rule cannot be written at all. */
  readonly rule: string | null;
}

/**
 * The filters. Note what this function CANNOT do: return anything other than
 * `human` when no rule fires. There is no "probably fine" branch, no confidence
 * score and no reviewer.
 */
export function classifyInbound(signals: InboundSignals): InboundClassificationResult {
  if (signals.authenticationFailed === true) {
    return { classification: 'spf_dkim_fail', rule: 'spf_or_dkim_fail' };
  }
  if (signals.listUnsubscribe === true) {
    return { classification: 'list_unsubscribe', rule: 'list_unsubscribe_header' };
  }
  if (typeof signals.knownBulkSender === 'string' && signals.knownBulkSender.length > 0) {
    return { classification: 'known_bulk', rule: `known_bulk_sender:${signals.knownBulkSender}` };
  }
  return { classification: 'human', rule: null };
}

// ---------------------------------------------------------------------------
// The counter
// ---------------------------------------------------------------------------

export interface RecordedInboundMessage {
  readonly id: number;
  readonly classification: InboundClassification;
  readonly rule: string | null;
  readonly minutesCharged: number;
}

/**
 * Count one inbound message. There is no path through this function that declines
 * to insert a row.
 */
export async function recordInboundMessage(
  db: Db | Tx,
  input: {
    readonly address: string;
    readonly receivedAt?: Date;
    readonly signals?: InboundSignals;
  },
  clock: Clock = systemClock,
): Promise<RecordedInboundMessage> {
  const verdict = classifyInbound(input.signals ?? {});
  const receivedAt = input.receivedAt ?? clock.now();
  const result = await db.execute(sql`
    INSERT INTO inbound_messages (received_at, address, classification, classifier_rule, minutes_charged)
    VALUES (${receivedAt.toISOString()}::timestamptz, ${input.address},
            ${verdict.classification}::inbound_class, ${verdict.rule}, 1)
    RETURNING id, minutes_charged
  `);
  const row = rowsOf<{ id: number | string; minutes_charged: number | string }>(result)[0];
  if (!row) throw new Error('inbound_messages: the insert returned no row');
  return {
    id: Number(row.id),
    classification: verdict.classification,
    rule: verdict.rule,
    minutesCharged: Number(row.minutes_charged),
  };
}

/**
 * Observe the first outbound reply, and charge the wall-clock cost.
 *
 * `minutes_charged = max(1, minutes from delivery to first reply)` — the floor is
 * applied here AND by the CHECK constraint, and the monotone trigger refuses the
 * write if it would lower the stored value. So this function CANNOT reduce the
 * counter: the arithmetic below is allowed to raise it and nothing else.
 *
 * Reply time comes from mail-transport timestamps, not from anyone's recollection.
 */
export async function recordFirstReply(
  db: Db | Tx,
  input: { readonly messageId: number; readonly repliedAt: Date },
): Promise<{ readonly minutesCharged: number }> {
  const result = await db.execute(sql`
    UPDATE inbound_messages
       SET first_reply_at = ${input.repliedAt.toISOString()}::timestamptz,
           minutes_charged = GREATEST(
             minutes_charged,
             CEIL(EXTRACT(EPOCH FROM (${input.repliedAt.toISOString()}::timestamptz - received_at)) / 60.0)::int,
             1)
     WHERE id = ${input.messageId} AND first_reply_at IS NULL
     RETURNING minutes_charged
  `);
  const row = rowsOf<{ minutes_charged: number | string }>(result)[0];
  if (row) return { minutesCharged: Number(row.minutes_charged) };

  // Already replied to: `first_reply_at` is written once (the trigger says so).
  const existing = await db.execute(sql`
    SELECT minutes_charged FROM inbound_messages WHERE id = ${input.messageId}
  `);
  const current = rowsOf<{ minutes_charged: number | string }>(existing)[0];
  if (!current) throw new Error(`inbound_messages: no message ${String(input.messageId)}`);
  return { minutesCharged: Number(current.minutes_charged) };
}

// ---------------------------------------------------------------------------
// The read model — §11.8's published block
// ---------------------------------------------------------------------------

export interface G5Report {
  readonly from: Date;
  readonly to: Date;
  /** Every message at every published address. The denominator of honesty. */
  readonly inboundTotal: number;
  /** Derived ALONGSIDE the raw total, never instead of it. */
  readonly machineClassifiedBulk: number;
  readonly bulkByRule: readonly { readonly rule: string; readonly count: number }[];
  readonly countedAsHuman: number;
  readonly humanMinutes: number;
  readonly payingAccounts: number;
  /** `null` when there are no paying accounts: a ratio with a zero denominator is
   *  not a small number, it is no number, and printing 0.00 would be a claim. */
  readonly minutesPerCustomerPerMonth: number | null;
}

export async function g5Report(
  db: Db | Tx,
  window: { readonly from: Date; readonly to: Date },
  payingAccounts: number,
): Promise<G5Report> {
  const totals = rowsOf<{ total: number | string; bulk: number | string; minutes: number | string }>(
    await db.execute(sql`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE classification <> 'human')::int AS bulk,
             COALESCE(SUM(minutes_charged) FILTER (WHERE classification = 'human'), 0)::int AS minutes
        FROM inbound_messages
       WHERE received_at >= ${window.from.toISOString()}::timestamptz
         AND received_at <  ${window.to.toISOString()}::timestamptz
    `),
  )[0];

  const byRule = rowsOf<{ classifier_rule: string; n: number | string }>(
    await db.execute(sql`
      SELECT classifier_rule, COUNT(*)::int AS n
        FROM inbound_messages
       WHERE classification <> 'human'
         AND classifier_rule IS NOT NULL
         AND received_at >= ${window.from.toISOString()}::timestamptz
         AND received_at <  ${window.to.toISOString()}::timestamptz
       GROUP BY classifier_rule
       ORDER BY classifier_rule
    `),
  ).map((r) => ({ rule: r.classifier_rule, count: Number(r.n) }));

  const inboundTotal = Number(totals?.total ?? 0);
  const bulk = Number(totals?.bulk ?? 0);
  const minutes = Number(totals?.minutes ?? 0);
  const months = Math.max(
    1 / 30,
    (window.to.getTime() - window.from.getTime()) / (30 * 86_400_000),
  );

  return {
    from: window.from,
    to: window.to,
    inboundTotal,
    machineClassifiedBulk: bulk,
    bulkByRule: byRule,
    countedAsHuman: inboundTotal - bulk,
    humanMinutes: minutes,
    payingAccounts,
    minutesPerCustomerPerMonth:
      payingAccounts > 0 ? Number((minutes / payingAccounts / months).toFixed(4)) : null,
  };
}
