/**
 * `specs/08` AC7 — a pack that renders a number the knowledge base does not
 * carry is never delivered: the job fails, the one-off purchase is refunded
 * with the reason, and `playbook_refunded` reaches `/admin`.
 *
 * WHY THIS TEST MOCKS THE ASSEMBLER, AND WHY IT IS NOT A CHEAT.
 *
 * The gate in `src/lib/packs/integrity.ts` re-resolves every rendered figure
 * against the records the pack was built from. Corrupting a record therefore
 * proves nothing: the assembler reads the same object the assertion reads, so
 * the two agree on whatever the corrupted record says, and a value the record
 * marks unknown is withheld rather than printed. Four tamperings were tried
 * against the real generator (`value` changed, `status` unknown, `status`
 * removed, `confidence` lowered) and every one produced a pack the gate was
 * right to pass, because none of them made the pack LIE.
 *
 * The failure the gate exists for is the renderer and the knowledge base
 * disagreeing. That is injected here at the only seam where it can be: the
 * assembler is wrapped, and one item claiming a figure no record carries is
 * appended to a pack that is otherwise the real one. Everything downstream of
 * the assembler, including the assertion, the refund and the event, is the
 * shipped code.
 */

import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { newId } from '@octopus/platform';
import { events, organisations } from '@octopus/platform/db';
import { createTestDb } from '@octopus/platform/testing';

import { appMigrationsDir } from '../src/lib/db';
import { MemoryDocumentStore, setDocumentStore } from '../src/lib/documents';
import { oneOffPurchases, playbooks } from '../src/lib/schema';

const INVENTED = 'licence_types[0].invented_fee';

vi.mock('../src/lib/packs/assemble', async () => {
  const actual =
    await vi.importActual<typeof import('../src/lib/packs/assemble')>('../src/lib/packs/assemble');
  return {
    ...actual,
    assembleEntryPack: (input: Parameters<typeof actual.assembleEntryPack>[0]) => {
      const pack = actual.assembleEntryPack(input);
      const group = pack.sections[0]?.steps[0]?.groups[0];
      const template = group?.items[0];
      if (group && template) {
        group.items.push({
          ...template,
          id: INVENTED,
          label: 'Application fee',
          text: '$4,120',
          note: null,
          whatWeRead: null,
          state: 'published',
          provenance: {
            ...template.provenance,
            sourcedValueId: INVENTED,
            status: 'verified',
            confidence: 'high',
          },
        });
      }
      return pack;
    },
  };
});

const { createEntryPackPurchase, generateEntryPack, markEntryPackPaid } = await import(
  '../src/lib/packs/service'
);

const TODAY = '2026-09-03';

describe('AC7 — an unsourced figure is never delivered', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;
  let orgId: string;

  beforeEach(async () => {
    db = await createTestDb([appMigrationsDir()]);
    orgId = newId('org');
    await db.db.insert(organisations).values({ id: orgId, name: 'Sila Mechanical', slug: `sila-${orgId}` });
    setDocumentStore(new MemoryDocumentStore());
  });
  afterEach(async () => {
    setDocumentStore(undefined);
    await db.close();
  });

  it('fails generation, delivers nothing and refunds', async () => {
    const purchase = await createEntryPackPurchase(db.db, { orgId, state: 'TX', trades: ['hvac'], today: TODAY });
    if (purchase.status !== 'ok') throw new Error('purchase refused');
    await db.db.insert(oneOffPurchases).values({
      id: newId('oop'),
      orgId,
      kind: 'playbook',
      playbookId: purchase.playbookId,
      amountCents: 75_000,
      status: 'paid',
    });
    await markEntryPackPaid(db.db, { playbookId: purchase.playbookId, today: TODAY });

    const generated = await generateEntryPack(db.db, { playbookId: purchase.playbookId, today: TODAY });
    expect(generated.status).toBe('failed');
    if (generated.status !== 'failed') return;
    expect(generated.reason).toBe('integrity_assertion');
    expect(generated.failures.join(' ')).toMatch(/invented_fee/);

    const row = (await db.db.select().from(playbooks).where(eq(playbooks.id, purchase.playbookId)))[0];
    expect(row?.status).toBe('failed');
    // Nothing delivered …
    expect(row?.contentJson).toBeNull();
    expect(row?.pdfStorageKey).toBeNull();
    expect(row?.shareToken).toBeNull();
    // … and refunded automatically, with the reason on the purchase.
    const purchases = await db.db.select().from(oneOffPurchases);
    expect(purchases[0]?.status).toBe('refunded');
    expect(purchases[0]?.refundReason).toBe('integrity_assertion');
    const refunded = await db.db.select().from(events).where(eq(events.name, 'playbook_refunded'));
    expect(refunded).toHaveLength(1);
  });
});
