/**
 * G5 — THE COUNTER THAT CANNOT BE TURNED DOWN.
 *
 * Spec: USER_JOURNEY.md §11.8 (MED-2), ARCHITECTURE.md §10.5, §14.
 *
 * These tests are adversarial on purpose: each one takes the position of somebody
 * who WANTS the autonomy number to look better, and tries the move. Reclassify a
 * message as bulk after the fact. Lower the minutes. Delete the row. Publish an
 * address the counter does not watch. Every one of them has to fail, and it has to
 * fail at the database rather than in a code review — "a gate whose input is a
 * judgement call by the claimant is not an instrument; it is a preference with a
 * number next to it."
 */

import { afterEach, describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import {
  PUBLISHED_ADDRESSES,
  PUBLISHED_ADDRESS_SET,
  addressesIn,
  assertAddressSetComplete,
  classifyInbound,
  g5Report,
  recordFirstReply,
  recordInboundMessage,
  UndeclaredAddressError,
} from '../../src/platform/ops/inbound';
import { readGate, gateSentence } from '../../src/platform/ops/gates';
import { fixedClock } from '../../src/platform/clock';
import type { TestDb } from '../helpers/pglite';
import { createPlatformDb } from './helpers';

let tdb!: TestDb;
let open = false;

afterEach(async () => {
  if (!open) return;
  open = false;
  await tdb.close();
});

const NOW = fixedClock('2026-08-13T12:00:00.000Z');
const BILLING = 'billing@ratepin.com';

async function setup(): Promise<void> {
  tdb = await createPlatformDb();
  open = true;
}

describe('the published-address set is derived from what we publish', () => {
  it('declares every address with the surface it appears on', () => {
    expect(PUBLISHED_ADDRESSES.length).toBeGreaterThan(0);
    for (const entry of PUBLISHED_ADDRESSES) {
      expect(entry.address).toBe(entry.address.toLowerCase());
      expect(entry.surface.length).toBeGreaterThan(0);
      expect(entry.note.length).toBeGreaterThan(20);
    }
  });

  it('refuses an address that can receive mail and is not declared', () => {
    expect(() => {
      assertAddressSetComplete(['support@ratepin.com']);
    }).toThrow(UndeclaredAddressError);
    // The evasion this closes, named: moving the load to a mailbox the counter does
    // not watch.
    expect(() => {
      assertAddressSetComplete([...PUBLISHED_ADDRESS_SET]);
    }).not.toThrow();
  });

  it('finds no undeclared company address anywhere in the shipping source', () => {
    // The CI assertion §11.8 asks for, run over the tree rather than described. A
    // new mailto in a component or an email template fails here.
    const roots = ['src'];
    const found = new Set<string>();
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        if (entry === 'node_modules' || entry === '.next') continue;
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) {
          walk(path);
          continue;
        }
        if (!/\.(ts|tsx|css|html|md|json)$/.test(entry)) continue;
        for (const address of addressesIn(readFileSync(path, 'utf8'))) found.add(address);
      }
    };
    for (const root of roots) walk(root);
    expect(() => {
      assertAddressSetComplete(found);
    }).not.toThrow();
  });
});

describe('count everything, decide nothing', () => {
  it('classifies as human whenever no named rule fires', () => {
    expect(classifyInbound({}).classification).toBe('human');
    expect(classifyInbound({}).rule).toBeNull();
    expect(classifyInbound({ knownBulkSender: null }).classification).toBe('human');
    // Every non-human classification carries the named machine-checkable rule that
    // produced it — the schema's CHECK refuses the row otherwise.
    expect(classifyInbound({ authenticationFailed: true }).rule).toBe('spf_or_dkim_fail');
    expect(classifyInbound({ listUnsubscribe: true }).rule).toBe('list_unsubscribe_header');
  });

  it('counts a bulk message in the raw total and reports the derived figure beside it', async () => {
    await setup();
    await recordInboundMessage(tdb.db, { address: BILLING }, NOW);
    await recordInboundMessage(tdb.db, { address: BILLING, signals: { authenticationFailed: true } }, NOW);
    await recordInboundMessage(tdb.db, { address: BILLING, signals: { listUnsubscribe: true } }, NOW);

    const report = await g5Report(
      tdb.db,
      { from: new Date('2026-08-01T00:00:00Z'), to: new Date('2026-09-01T00:00:00Z') },
      0,
    );
    expect(report.inboundTotal).toBe(3);
    expect(report.machineClassifiedBulk).toBe(2);
    expect(report.countedAsHuman).toBe(1);
    expect(report.bulkByRule.map((r) => r.rule).sort()).toEqual([
      'list_unsubscribe_header',
      'spf_or_dkim_fail',
    ]);
    // A ratio with a zero denominator is not a small number, it is no number.
    expect(report.minutesPerCustomerPerMonth).toBeNull();
  });

  it('charges a floor of one minute even when nobody ever replies', async () => {
    await setup();
    await recordInboundMessage(tdb.db, { address: BILLING }, NOW);
    const report = await g5Report(
      tdb.db,
      { from: new Date('2026-08-01T00:00:00Z'), to: new Date('2026-09-01T00:00:00Z') },
      0,
    );
    // Never replying must be the WORST strategy rather than the best.
    expect(report.humanMinutes).toBe(1);
  });

  it('raises the charge to the wall-clock cost when a reply is observed', async () => {
    await setup();
    const message = await recordInboundMessage(
      tdb.db,
      { address: BILLING, receivedAt: new Date('2026-08-13T10:00:00Z') },
      NOW,
    );
    const after = await recordFirstReply(tdb.db, {
      messageId: message.id,
      repliedAt: new Date('2026-08-13T10:07:00Z'),
    });
    expect(after.minutesCharged).toBe(7);
  });
});

describe('the counter cannot be lowered', () => {
  it('refuses an UPDATE that reduces minutes_charged', async () => {
    await setup();
    const message = await recordInboundMessage(
      tdb.db,
      { address: BILLING, receivedAt: new Date('2026-08-13T10:00:00Z') },
      NOW,
    );
    await recordFirstReply(tdb.db, {
      messageId: message.id,
      repliedAt: new Date('2026-08-13T10:20:00Z'),
    });

    await expect(
      tdb.client.query(`UPDATE inbound_messages SET minutes_charged = 1 WHERE id = $1`, [message.id]),
    ).rejects.toThrow(/monotone/);

    const row = await tdb.client.query<{ minutes_charged: number }>(
      `SELECT minutes_charged FROM inbound_messages WHERE id = $1`,
      [message.id],
    );
    expect(row.rows[0]?.minutes_charged).toBe(20);
  });

  it('refuses a DELETE at any time', async () => {
    await setup();
    const message = await recordInboundMessage(tdb.db, { address: BILLING }, NOW);
    await expect(
      tdb.client.query(`DELETE FROM inbound_messages WHERE id = $1`, [message.id]),
    ).rejects.toThrow(/append-only/);
  });

  it('refuses a reclassification after the fact', async () => {
    await setup();
    const message = await recordInboundMessage(tdb.db, { address: BILLING }, NOW);
    await expect(
      tdb.client.query(
        `UPDATE inbound_messages SET classification = 'known_bulk', classifier_rule = 'invented' WHERE id = $1`,
        [message.id],
      ),
    ).rejects.toThrow(/only first_reply_at and minutes_charged/);
  });

  it('refuses a second stamp of first_reply_at', async () => {
    await setup();
    const message = await recordInboundMessage(
      tdb.db,
      { address: BILLING, receivedAt: new Date('2026-08-13T10:00:00Z') },
      NOW,
    );
    await recordFirstReply(tdb.db, {
      messageId: message.id,
      repliedAt: new Date('2026-08-13T10:30:00Z'),
    });
    await expect(
      tdb.client.query(`UPDATE inbound_messages SET first_reply_at = received_at WHERE id = $1`, [
        message.id,
      ]),
    ).rejects.toThrow(/written once/);
  });

  it('refuses a message at an address the product does not publish', async () => {
    await setup();
    await expect(
      recordInboundMessage(tdb.db, { address: 'secret@ratepin.com' }, NOW),
    ).rejects.toThrow();
  });
});

describe('the claim is rendered from the counter, not from a decision', () => {
  it('withholds the outcome sentence while G5 is short of its thresholds', async () => {
    await setup();
    await recordInboundMessage(tdb.db, { address: BILLING }, NOW);
    const reading = await readGate(tdb.db, 'G5', NOW);
    expect(reading.state).not.toBe('unlocked');
    const sentence = gateSentence(reading);
    // P-D, the declined conclusion: we state the mechanism and decline to state what
    // it achieves. CORRECTIONS §4's F-4 bans the outcome string until the counter
    // says otherwise, and there is no parameter here that could override it.
    expect(sentence.outcome).toBeNull();
    expect(sentence.mechanism).toContain('Every inbound message');
    expect(sentence.mechanism).not.toContain('zero');
  });
});
