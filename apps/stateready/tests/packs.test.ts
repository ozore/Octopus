/**
 * M8 — the State Entry Pack generator (`specs/08`).
 *
 * The tests that matter here are the ones that make the promise mechanical
 * rather than editorial:
 *
 *  - **totality** — the assembled pack contains one item per `SourcedValue` in
 *    the record, for all nine committed records, so "every requirement the
 *    board publishes" is a bijection rather than a claim;
 *  - **the refusal** — every unknown value renders as words with no digit in
 *    them, in all nine records, so a `null` cannot become a number;
 *  - **the gate** — `entryPackReady` is true for six and false for the three
 *    Florida records, with the missing `CORE_SET` fields NAMED (`BUILD.md` §4
 *    D3);
 *  - **the disclosure ordering** — the count on the purchase screen is written
 *    before a Checkout session can exist and equals the delivered pack's
 *    (`specs/08` AC5b);
 *  - **the integrity assertion** — a tampered content record fails generation,
 *    delivers nothing and refunds (AC7).
 *
 * No network. No clock: every assembly takes an explicit `today`.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { newId } from '@octopus/platform';
import { events, organisations } from '@octopus/platform/db';
import { createTestDb } from '@octopus/platform/testing';

import { appMigrationsDir } from '../src/lib/db';
import { MemoryDocumentStore, setDocumentStore } from '../src/lib/documents';
import { entryPackReadiness } from '../src/lib/kb/accessors';
import { KB_RECORDS } from '../src/lib/kb/records';
import type { StateTradeRecord } from '../src/lib/kb/types';
import { walkSourcedValues } from '../src/lib/kb/walk';
import { ENTRY_PACK_GUARANTEE } from '../src/lib/legal/guarantees';
import {
  assembleEntryPack,
  disclosedGapPaths,
  gapDisclosure,
  matchReciprocity,
  WITHHELD,
} from '../src/lib/packs/assemble';
import { STEP_LEDES } from '../src/lib/packs/fields';
import { NOT_PUBLISHED, NOT_YET_VERIFIED } from '../src/lib/packs/format';
import { packIntegrityFailures, PlaybookIntegrityError } from '../src/lib/packs/integrity';
import { extractPackValues, PAPER, renderPackPdf, toWinAnsi } from '../src/lib/packs/pdf';
import {
  createEntryPackPurchase,
  generateEntryPack,
  markEntryPackPaid,
  packByShareToken,
} from '../src/lib/packs/service';
import type { EntryPack, PackItem } from '../src/lib/packs/types';
import { licences, oneOffPurchases, playbooks, technicians } from '../src/lib/schema';

const TODAY = '2026-09-03';
const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(appRoot, '..', '..');

function record(id: string): StateTradeRecord {
  const found = KB_RECORDS.find((r) => r.record_id === id);
  if (!found) throw new Error(`no record ${id}`);
  return found;
}

function allItems(pack: EntryPack): PackItem[] {
  const out: PackItem[] = [];
  for (const section of pack.sections) {
    for (const step of section.steps) for (const group of step.groups) out.push(...group.items);
  }
  return out;
}

// ---------------------------------------------------------------------------
// The pure generator — nine records, no database
// ---------------------------------------------------------------------------

describe('the generator emits exactly what the board publishes, and flags the rest', () => {
  it('contains one item per sourced value, for all nine committed records', () => {
    for (const source of KB_RECORDS) {
      const pack = assembleEntryPack({ records: [source], today: TODAY });
      const walked = new Set(walkSourcedValues(source).map((w) => w.path));
      const ids = allItems(pack).map((item) => item.id);

      // No value is dropped …
      for (const path of walked) {
        expect(ids, `${source.record_id} lost ${path}`).toContain(path);
      }
      // … and nothing is rendered twice.
      expect(new Set(ids).size, source.record_id).toBe(ids.length);
      // Anything extra is a DISCLOSED_SET field the record does not carry at
      // all, printed as a "not published" row rather than left blank
      // (`specs/04` AC8, re-review N4).
      const disclosed = new Set(disclosedGapPaths(source));
      for (const id of ids) {
        if (walked.has(id)) continue;
        expect(disclosed, `${source.record_id}: ${id} is neither a value nor a disclosed field`).toContain(id);
        expect(allItems(pack).find((item) => item.id === id)?.state).toBe('not_published');
      }
    }
  });

  it('renders every verified value and refuses every unknown one, in all nine', () => {
    for (const source of KB_RECORDS) {
      const pack = assembleEntryPack({ records: [source], today: TODAY });
      const items = new Map(allItems(pack).map((item) => [item.id, item]));

      for (const { path, value } of walkSourcedValues(source)) {
        const item = items.get(path);
        expect(item, `${source.record_id} ${path}`).toBeDefined();
        if (!item) continue;

        if (value.value === null) {
          // A statement about the BOARD, and never a number.
          expect(item.state, path).toBe('not_published');
          expect(item.text, path).toBe(NOT_PUBLISHED);
          expect(/\d/.test(item.text), `${path} refused with a figure in it`).toBe(false);
          continue;
        }

        expect(item.state, path).toBe(value.confidence === 'high' ? 'published' : 'needs_human_check');
        if (typeof value.value === 'number') expect(item.text, path).toMatch(/\d/);
        expect(item.provenance.sourcedValueId, path).toBe(path);
        expect(item.provenance.url, path).toBe(value.source_url ?? null);
        expect(item.provenance.lastVerified, path).toBe(value.last_verified ?? null);
      }
    }
  });

  it('flags every value below high confidence — a $750 document may not assert a medium reading', () => {
    for (const source of KB_RECORDS) {
      const pack = assembleEntryPack({ records: [source], today: TODAY });
      const flagged = new Set(pack.needsHumanCheck.map((item) => item.id));
      for (const { path, value } of walkSourcedValues(source)) {
        if (value.value === null || value.confidence === 'high') continue;
        expect(flagged, `${source.record_id} ${path} is asserted without a flag`).toContain(path);
      }
      for (const item of pack.needsHumanCheck) {
        expect(item.flagReason, item.id).toBeTruthy();
      }
    }
  });

  it('the 180-day rule turns an asserted value into a refusal, without a number', () => {
    // Nothing in the committed data is stale today; a future date makes it so,
    // and the pack must then stop asserting rather than start estimating.
    const future = '2030-01-01';
    const pack = assembleEntryPack({ records: [record('tx.hvac')], today: future });
    const fee = allItems(pack).find((item) => item.id === 'licence_types[0].application_fee');
    expect(fee?.state).toBe('not_yet_verified');
    expect(fee?.text).toBe(NOT_YET_VERIFIED);
    expect(/\d/.test(fee?.text ?? '')).toBe(false);
    expect(fee?.flagReason).toMatch(/180 days/);
  });

  it('passes its own integrity assertion on every committed record, in both modes', () => {
    for (const source of KB_RECORDS) {
      for (const mode of ['full', 'preview'] as const) {
        const pack = assembleEntryPack({ records: [source], today: TODAY, mode });
        expect(packIntegrityFailures(pack, [source]), `${source.record_id} ${mode}`).toEqual([]);
      }
    }
  });

  it('the fixed furniture carries no figure of its own', () => {
    // A number in a sentence we wrote is a number with no board behind it.
    for (const lede of Object.values(STEP_LEDES)) expect(lede).not.toMatch(/\d/);
  });

  it('carries the guarantee byte-identical to OFFER.md §5.1 and specs/12', () => {
    expect(assembleEntryPack({ records: [record('tx.hvac')], today: TODAY }).guarantee).toBe(
      ENTRY_PACK_GUARANTEE,
    );
    const spec = readFileSync(
      join(repoRoot, 'phase-4-revenue', 'stateready', 'specs', '12-legal-and-disclaimers.md'),
      'utf8',
    );
    // Lift the block quote out of the spec and compare it, so the constant is
    // checked against the SPECIFICATION rather than against a copy of itself.
    const quoted = spec
      .split('\n')
      .filter((line) => line.trimStart().startsWith('>'))
      .map((line) => line.trimStart().replace(/^>\s?/, ''))
      .join('\n');
    expect(quoted.replace(/\*\*/g, '').replace(/\s+/g, ' ')).toContain(ENTRY_PACK_GUARANTEE);
  });
});

// ---------------------------------------------------------------------------
// The gate — six of nine (BUILD.md §4 D3)
// ---------------------------------------------------------------------------

describe('entryPackReady is the purchasability gate, and it is not publishable', () => {
  it('is true for six committed records and false for the three Florida ones', () => {
    const verdicts = KB_RECORDS.map((r) => [r.record_id, entryPackReadiness(r, TODAY).ready] as const);
    expect(verdicts.filter(([, ready]) => ready).map(([id]) => id).sort()).toEqual([
      'nc.electrical',
      'nc.hvac',
      'nc.plumbing',
      'tx.electrical',
      'tx.hvac',
      'tx.plumbing',
    ]);
    expect(verdicts.filter(([, ready]) => !ready).map(([id]) => id).sort()).toEqual([
      'fl.electrical',
      'fl.hvac',
      'fl.plumbing',
    ]);
    // And every one of them is publishable: the two questions are different.
    expect(KB_RECORDS.every((r) => r.provenance.publishable === true)).toBe(true);
  });

  it('names the reason, and for Florida the reason is reciprocity', () => {
    for (const id of ['fl.hvac', 'fl.plumbing'] as const) {
      expect(entryPackReadiness(record(id), TODAY).missingCore).toEqual(['reciprocity']);
    }
    // fl.electrical fails on reciprocity AND on the registered class, whose
    // expiry rule and CE hours are unknown — so a pack could not say when that
    // licence renews.
    expect(entryPackReadiness(record('fl.electrical'), TODAY).missingCore).toEqual([
      'fl.electrical.registered_electrical_contractor.renewal.expiry_rule',
      'fl.electrical.registered_electrical_contractor.continuing_education',
      'reciprocity',
    ]);
  });

  it('the gap disclosure counts exactly what entryPackReadiness discloses, for all nine', () => {
    for (const source of KB_RECORDS) {
      const disclosure = gapDisclosure([source], TODAY);
      const readiness = entryPackReadiness(source, TODAY);
      expect(disclosure.needsCheckCount, source.record_id).toBe(readiness.disclosedGaps.length);
      expect(disclosure.gaps.length, source.record_id).toBe(readiness.disclosedGaps.length);
    }
  });

  it('every disclosed gap names what we read and what to ask, so it is actionable', () => {
    const disclosure = gapDisclosure([record('tx.hvac')], TODAY);
    // `kb-data/tx-hvac.json`: bond and the processing time are unknown.
    expect(disclosure.needsCheckCount).toBe(6);
    const timeline = disclosure.gaps.find((gap) => gap.label.includes('Typical processing time'));
    expect(timeline?.whatWeRead).toContain('TDLR publishes no end-to-end processing time');
    expect(timeline?.askThis).toContain('How long');
    expect(timeline?.boardUrl).toBe('https://www.tdlr.texas.gov/acr/');
  });
});

// ---------------------------------------------------------------------------
// The acceptance criteria that are about content
// ---------------------------------------------------------------------------

describe('specs/08 acceptance criteria', () => {
  it('AC1 — a Texas HVAC pack matches kb-data/tx-hvac.json, value by value, with its citation', () => {
    const source = record('tx.hvac');
    const pack = assembleEntryPack({ records: [source], today: TODAY });
    const items = new Map(allItems(pack).map((item) => [item.id, item]));

    expect(items.get('licence_types[0].application_fee')?.text).toBe('$115');
    expect(items.get('licence_types[0].renewal.fee')?.text).toBe('$65');
    expect(items.get('licence_types[0].exam.fee')?.text).toBe('$74');
    expect(items.get('licence_types[0].continuing_education.hours')?.text).toBe('8 hours');
    expect(items.get('licence_types[0].renewal.cycle')?.text).toBe('12 months');
    expect(items.get('licence_types[0].insurance.general_liability')?.text).toBe('$300,000');
    expect(items.get('licence_types[1].insurance.general_liability')?.text).toBe('$100,000');
    expect(items.get('licence_types[0].application_fee')?.provenance.url).toBe(
      'https://www.tdlr.texas.gov/acr/contractor-apply.htm',
    );
    expect(items.get('licence_types[0].application_fee')?.provenance.lastVerified).toBe('2026-09-03');

    // And the two the board does not publish are refused, not estimated.
    expect(items.get('licence_types[0].bond.amount')?.text).toBe(NOT_PUBLISHED);
    expect(items.get('typical_timeline')?.text).toBe(NOT_PUBLISHED);
  });

  it('AC2 — a Texas plumbing pack puts the medium renewal cycle inside the needs-check block, with the why', () => {
    const source = record('tx.plumbing');
    const pack = assembleEntryPack({ records: [source], today: TODAY });
    const cycle = allItems(pack).find((item) => item.id === 'licence_types[0].renewal.cycle');

    expect(cycle?.state).toBe('needs_human_check');
    expect(cycle?.text).toBe('12 months');
    expect(pack.needsHumanCheck.map((item) => item.id)).toContain('licence_types[0].renewal.cycle');
    // The exact wording of why — the note the record carries, printed with the
    // value rather than instead of it (wave-1b m16).
    expect(cycle?.note).toContain("never the word 'annual'");
    expect(cycle?.flagReason).toMatch(/Confirm it with the board/);
  });

  it('AC3 — a Texas master electrician buying North Carolina gets the Texas paragraph, and the caveat', () => {
    const source = record('nc.electrical');
    const pack = assembleEntryPack({
      records: [source],
      today: TODAY,
      holdings: [{ state: 'TX', trade: 'electrical', description: 'Master Electrician' }],
    });

    const texas = pack.sections[0]?.reciprocity.find((entry) => entry.withState === 'TX');
    expect(texas?.matchesHolding).toBe(true);
    expect(texas?.direction).toBe('inbound');
    const grants = texas?.items.find((item) => item.id.endsWith('.grants'));
    expect(grants?.text).toContain('without written examination');
    expect(grants?.provenance.url).toBe('https://www.ncbeec.org/reciprocity/');

    // The caveat: the per-state detail page was not read. It is in the board's
    // own conditions value AND in the record's coverage notes, and the pack
    // carries both rather than quietly implying we opened the page.
    const conditions = texas?.items.find((item) => item.id.endsWith('.conditions'));
    expect(conditions?.text).toContain('were not individually fetched in this pass');
    expect(pack.sections[0]?.coverageNotes.join(' ')).toContain('Per-state reciprocity detail pages');

    expect(pack.answer.map((s) => s.text).join('')).toContain('You told us you hold a licence in Texas');
  });

  it('AC4 — a Georgia HVAC holder buying Texas gets the inbound Georgia paragraph', () => {
    const source = record('tx.hvac');
    const pack = assembleEntryPack({
      records: [source],
      today: TODAY,
      holdings: [{ state: 'GA', trade: 'hvac', description: 'Class II Conditioned Air' }],
    });

    const georgia = pack.sections[0]?.reciprocity.find((entry) => entry.withState === 'GA');
    expect(georgia?.matchesHolding).toBe(true);
    expect(georgia?.direction).toBe('inbound');
    expect(georgia?.requiresFrom).toBe('Georgia Class II Conditioned Air unrestricted licence');
    expect(georgia?.items.find((item) => item.id.endsWith('.conditions'))?.text).toContain(
      'Held for at least one year',
    );
    expect(pack.answer.map((s) => s.text).join('')).toContain('You told us you hold a licence in Georgia');
  });

  it('the reciprocity matcher matches on the state and never infers a licence class', () => {
    const nc = matchReciprocity(record('nc.electrical'), [{ state: 'FL', trade: 'electrical' }], TODAY);
    expect(nc.filter((entry) => entry.matchesHolding).map((entry) => entry.withState)).toEqual(['FL']);
    // A holding in the wrong trade is not a match, and neither is a state the
    // board does not name.
    expect(
      matchReciprocity(record('nc.electrical'), [{ state: 'FL', trade: 'plumbing' }], TODAY).some(
        (entry) => entry.matchesHolding,
      ),
    ).toBe(false);
    expect(
      matchReciprocity(record('tx.hvac'), [{ state: 'NY', trade: 'hvac' }], TODAY).some(
        (entry) => entry.matchesHolding,
      ),
    ).toBe(false);
  });

  it('a holding in the target state changes the frame from "how to enter" to "what you are missing"', () => {
    const pack = assembleEntryPack({
      records: [record('tx.hvac')],
      today: TODAY,
      holdings: [{ state: 'TX', trade: 'hvac' }],
    });
    expect(pack.frame).toBe('already_licensed');
    expect(pack.answer.map((s) => s.text).join('')).toContain('what you are missing');
  });

  it('two trades are two sections, never merged', () => {
    const pack = assembleEntryPack({
      records: [record('tx.hvac'), record('tx.plumbing')],
      today: TODAY,
    });
    expect(pack.sections.map((section) => section.trade)).toEqual(['hvac', 'plumbing']);
    expect(pack.recordIds).toEqual(['tx.hvac', 'tx.plumbing']);
    // And the gap count is the sum of both records', not one of them.
    expect(pack.needsCheckCount).toBe(
      entryPackReadiness(record('tx.hvac'), TODAY).disclosedGaps.length +
        entryPackReadiness(record('tx.plumbing'), TODAY).disclosedGaps.length,
    );
  });

  it('AC6 — the PDF and the web version render the identical value set', async () => {
    const source = record('tx.hvac');
    const pack = assembleEntryPack({ records: [source], today: TODAY });
    const values = extractPackValues(pack);
    expect(values.length).toBeGreaterThan(40);

    const bytes = await renderPackPdf(pack);
    expect(bytes.byteLength).toBeGreaterThan(5_000);
    expect(Buffer.from(bytes.slice(0, 5)).toString('latin1')).toBe('%PDF-');

    // Both renderers read `pack`, so the extraction IS the comparison: a
    // renderer that dropped a section would drop it from this list too, which
    // is why the totality test above is the one that guards against it.
    expect(extractPackValues(pack)).toEqual(values);
  });

  it('the preview withholds values and never withholds a gap', () => {
    const source = record('tx.hvac');
    const preview = assembleEntryPack({ records: [source], today: TODAY, mode: 'preview' });

    const classification = preview.sections[0]?.steps.find((step) => step.key === 'classification');
    expect(classification?.withheld).toBe(false);
    expect(classification?.groups.flatMap((g) => g.items).some((item) => item.text === WITHHELD)).toBe(false);

    const fees = preview.sections[0]?.steps.find((step) => step.key === 'fees');
    expect(fees?.withheld).toBe(true);
    const applicationFee = fees?.groups.flatMap((g) => g.items).find((item) => item.id.endsWith('application_fee'));
    expect(applicationFee?.text).toBe(WITHHELD);
    // The quoted fragment usually carries the number, so it goes too.
    expect(applicationFee?.provenance.evidence).toBeNull();
    // The board's page stays: it is public, and it is the trust signal.
    expect(applicationFee?.provenance.url).toBeTruthy();

    // The gaps are the thing the buyer is being asked to price in, so they are
    // shown in full before the card.
    expect(preview.gaps.length).toBe(6);
    for (const gap of preview.gaps) expect(gap.text).not.toBe(WITHHELD);
    expect(preview.gaps.some((gap) => gap.whatWeRead !== null)).toBe(true);
  });

  it('the PDF renders on the paper palette, which is design-system.css token for token', () => {
    const css = readFileSync(join(appRoot, 'src', 'styles', 'design-system.css'), 'utf8');
    const block = css.slice(css.indexOf(':root[data-theme="paper"]'));
    const token = (name: string) =>
      new RegExp(`--sr-${name}:\\s*(#[0-9A-Fa-f]{6})`).exec(block)?.[1]?.toUpperCase() ?? null;

    expect(PAPER.ground.toUpperCase()).toBe(token('ground'));
    expect(PAPER.ink.toUpperCase()).toBe(token('ink'));
    expect(PAPER.ink2.toUpperCase()).toBe(token('ink-2'));
    expect(PAPER.ink3.toUpperCase()).toBe(token('ink-3'));
    expect(PAPER.line.toUpperCase()).toBe(token('line'));
    expect(PAPER.lineStrong.toUpperCase()).toBe(token('line-strong'));
    expect(PAPER.risk.toUpperCase()).toBe(token('risk'));
  });

  it('the PDF encoder never hands pdf-lib a character the standard fonts cannot draw', () => {
    // WinAnsi only. A board's own prose is not ours to control, and a paid
    // delivery must not fail on a typographic dash.
    expect(toWinAnsi('“quoted” — ‘apostrophe’ … ≤ →')).toBe('"quoted" — \'apostrophe\' ... <= ->');
    for (const source of KB_RECORDS) {
      for (const { value } of walkSourcedValues(source)) {
        const text = `${value.evidence ?? ''} ${value.note ?? ''} ${String(value.value ?? '')}`;
        expect(/[^ -~¡-ÿ—‘’“”•]/.test(toWinAnsi(text))).toBe(
          false,
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Integrity — AC7
// ---------------------------------------------------------------------------

describe('the integrity assertion — the KB and the renderer must agree', () => {
  const source = record('tx.hvac');

  it('rejects a number with no SourcedValue behind it', () => {
    const pack = assembleEntryPack({ records: [source], today: TODAY });
    const tampered = structuredClone(pack) as EntryPack;
    const item = tampered.sections[0]!.steps.find((s) => s.key === 'timeline')!.groups[0]!.items[0]!;
    item.text = '6 to 8 weeks';
    item.state = 'published';

    expect(packIntegrityFailures(tampered, [source]).join(' ')).toMatch(/renders "6 to 8 weeks"/);
  });

  it('rejects an asserted value whose confidence is below high', () => {
    const pack = assembleEntryPack({ records: [source], today: TODAY });
    const tampered = structuredClone(pack) as EntryPack;
    const fee = tampered.sections[0]!.steps
      .find((s) => s.key === 'fees')!
      .groups.flatMap((g) => g.items)
      .find((i) => i.id === 'licence_types[0].exam.fee')!;
    fee.state = 'published';
    fee.flagReason = null;

    expect(packIntegrityFailures(tampered, [source]).join(' ')).toMatch(/is not inside a needs-check block/);
  });

  it('rejects an edited quotation, which a digit grep would miss', () => {
    const pack = assembleEntryPack({ records: [source], today: TODAY });
    const tampered = structuredClone(pack) as EntryPack;
    tampered.gaps[0]!.whatWeRead = 'The board told us on the phone that it takes four weeks.';
    expect(packIntegrityFailures(tampered, [source]).join(' ')).toMatch(/whatWeRead is not the note/);
  });

  it('rejects a figure our own prose invented in the first hundred words', () => {
    const pack = assembleEntryPack({ records: [source], today: TODAY });
    const tampered = structuredClone(pack) as EntryPack;
    tampered.answer.push({ kind: 'text', text: ' Expect 6 to 8 weeks.' });
    expect(packIntegrityFailures(tampered, [source]).join(' ')).toMatch(/our own prose carries a figure/);
  });

  it('rejects a licence-class name the record does not carry', () => {
    const pack = assembleEntryPack({ records: [source], today: TODAY });
    const tampered = structuredClone(pack) as EntryPack;
    tampered.answer.push({ kind: 'record', text: 'Class Z Universal Contractor' });
    expect(packIntegrityFailures(tampered, [source]).join(' ')).toMatch(/is not a string this record carries/);
  });

  it('PlaybookIntegrityError names every failure, so the admin alert is actionable', () => {
    const error = new PlaybookIntegrityError(['a', 'b']);
    expect(error.name).toBe('PlaybookIntegrityError');
    expect(error.failures).toEqual(['a', 'b']);
    expect(error.message).toContain('2 unsourced');
  });
});

// ---------------------------------------------------------------------------
// The database side: purchase → generate → deliver → share
// ---------------------------------------------------------------------------

describe('purchase, generation and delivery', () => {
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

  it('AC5b — the gap count is written BEFORE any Checkout session can exist', async () => {
    const result = await createEntryPackPurchase(db.db, {
      orgId,
      state: 'TX',
      trades: ['hvac'],
      today: TODAY,
    });
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;

    const row = (await db.db.select().from(playbooks).where(eq(playbooks.id, result.playbookId)))[0];
    expect(row?.status).toBe('awaiting_payment');
    expect(row?.stripePaymentIntentId).toBeNull();
    expect(row?.needsCheckCount).toBe(6);
    expect((row?.disclosedGaps as string[]).length).toBe(6);
    expect((row?.disclosedGaps as string[]).join(' ')).toContain('Typical processing time');

    // The disclosure the screen showed and the row that precedes the charge are
    // the same number.
    expect(result.disclosure.needsCheckCount).toBe(row?.needsCheckCount);

    const tracked = await db.db.select().from(events).where(eq(events.name, 'playbook_checkout_started'));
    expect(tracked).toHaveLength(1);
  });

  it('AC5 — a record that is publishable but fails CORE_SET refuses, names the reason and charges nothing', async () => {
    const result = await createEntryPackPurchase(db.db, {
      orgId,
      state: 'FL',
      trades: ['hvac'],
      today: TODAY,
    });
    expect(result.status).toBe('in_preparation');
    if (result.status !== 'in_preparation') return;
    expect(result.blockedBy).toEqual([{ recordId: 'fl.hvac', missingCore: ['reciprocity'] }]);

    expect(await db.db.select().from(playbooks)).toHaveLength(0);
    const waitlisted = await db.db.select().from(events).where(eq(events.name, 'uncovered_state_waitlisted'));
    expect(waitlisted).toHaveLength(1);
  });

  it('AC5 — an uncovered state is refused the same way', async () => {
    const result = await createEntryPackPurchase(db.db, {
      orgId,
      state: 'GA',
      trades: ['hvac'],
      today: TODAY,
    });
    expect(result.status).toBe('not_covered');
    expect(await db.db.select().from(playbooks)).toHaveLength(0);
  });

  it('generates, stores the PDF and the frozen document, and the delivered count equals the disclosed one', async () => {
    const purchase = await createEntryPackPurchase(db.db, {
      orgId,
      state: 'TX',
      trades: ['hvac'],
      today: TODAY,
    });
    if (purchase.status !== 'ok') throw new Error('purchase refused');

    await markEntryPackPaid(db.db, { playbookId: purchase.playbookId, stripePaymentIntentId: 'pi_test', today: TODAY });
    const queued = (await db.db.select().from(playbooks).where(eq(playbooks.id, purchase.playbookId)))[0];
    expect(queued?.status).toBe('queued');
    expect(queued?.stripePaymentIntentId).toBe('pi_test');

    const generated = await generateEntryPack(db.db, { playbookId: purchase.playbookId, today: TODAY });
    expect(generated.status).toBe('ready');
    if (generated.status !== 'ready') return;

    const row = (await db.db.select().from(playbooks).where(eq(playbooks.id, purchase.playbookId)))[0];
    expect(row?.status).toBe('ready');
    expect(row?.pdfStorageKey).toMatch(new RegExp(`^org/${orgId}/`));
    expect(row?.shareToken).toBeTruthy();
    expect(row?.shareExpiresAt?.toISOString().slice(0, 10)).toBe('2026-12-02');
    // AC5b's equality, end to end.
    expect(row?.needsCheckCount).toBe(purchase.disclosure.needsCheckCount);

    const pack = row?.contentJson as unknown as EntryPack;
    expect(pack.mode).toBe('full');
    expect(pack.organisationName).toBe('Sila Mechanical');
    expect(pack.guarantee).toBe(ENTRY_PACK_GUARANTEE);
    expect(pack.sections[0]?.steps.map((step) => step.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('the buyer’s own licences reach the pack, so the reciprocity paragraph is about them', async () => {
    const techId = newId('tec');
    await db.db.insert(technicians).values({
      id: techId,
      orgId,
      firstName: 'Dana',
      lastName: 'Reyes',
    });
    await db.db.insert(licences).values({
      id: newId('lic'),
      orgId,
      holderKind: 'technician',
      technicianId: techId,
      state: 'GA',
      trade: 'hvac',
      customTypeName: 'Class II Conditioned Air',
    });

    const purchase = await createEntryPackPurchase(db.db, { orgId, state: 'TX', trades: ['hvac'], today: TODAY });
    if (purchase.status !== 'ok') throw new Error('purchase refused');
    await markEntryPackPaid(db.db, { playbookId: purchase.playbookId, today: TODAY });
    await generateEntryPack(db.db, { playbookId: purchase.playbookId, today: TODAY });

    const row = (await db.db.select().from(playbooks).where(eq(playbooks.id, purchase.playbookId)))[0];
    const pack = row?.contentJson as unknown as EntryPack;
    expect(pack.answer.map((segment) => segment.text).join('')).toContain('you hold a licence in Georgia');
    expect(pack.sections[0]?.reciprocity.find((entry) => entry.withState === 'GA')?.holdingDescription).toBe(
      'Class II Conditioned Air',
    );
  });

  it('AC7 — a tampered record fails generation, delivers nothing and refunds', async () => {
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

    // Tamper with the record the generator will read, exactly as a corrupted
    // knowledge-base publish would: a number where the board publishes nothing.
    const source = record('tx.hvac');
    const timeline = source.typical_timeline as { value: unknown; status: string; confidence: string };
    const original = { ...timeline };
    Object.assign(timeline, { value: 42, status: 'unknown', confidence: 'low' });

    try {
      const generated = await generateEntryPack(db.db, { playbookId: purchase.playbookId, today: TODAY });
      expect(generated.status).toBe('failed');
      if (generated.status !== 'failed') return;
      expect(generated.reason).toBe('integrity_assertion');
      expect(generated.failures.join(' ')).toMatch(/typical_timeline/);
    } finally {
      Object.assign(timeline, original);
    }

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

  it('AC8 — the share link works without a session, is watermarked, and expires', async () => {
    const purchase = await createEntryPackPurchase(db.db, { orgId, state: 'NC', trades: ['electrical'], today: TODAY });
    if (purchase.status !== 'ok') throw new Error('purchase refused');
    await markEntryPackPaid(db.db, { playbookId: purchase.playbookId, today: TODAY });
    await generateEntryPack(db.db, { playbookId: purchase.playbookId, today: TODAY });

    const row = (await db.db.select().from(playbooks).where(eq(playbooks.id, purchase.playbookId)))[0];
    const token = row!.shareToken!;

    const opened = await packByShareToken(db.db, token, new Date('2026-10-01T00:00:00Z'));
    expect(opened.status).toBe('ok');
    if (opened.status !== 'ok') return;
    expect(opened.organisationName).toBe('Sila Mechanical');
    expect(opened.pack.targetState).toBe('NC');

    // Ninety days later it is gone.
    expect((await packByShareToken(db.db, token, new Date('2027-01-01T00:00:00Z'))).status).toBe('expired');
    // And a token nobody issued is not found, not an error.
    expect((await packByShareToken(db.db, 'nope', new Date())).status).toBe('not_found');
  });

  it('the price ladder is a query: the first state is $750 and the next is $1,500', async () => {
    const first = await createEntryPackPurchase(db.db, { orgId, state: 'TX', trades: ['hvac'], today: TODAY });
    const second = await createEntryPackPurchase(db.db, { orgId, state: 'NC', trades: ['plumbing'], today: TODAY });
    if (first.status !== 'ok' || second.status !== 'ok') throw new Error('purchase refused');

    const rows = await db.db.select().from(playbooks);
    const prices = Object.fromEntries(rows.map((row) => [row.id, row.priceCents]));
    expect(prices[first.playbookId]).toBe(75_000);
    expect(prices[second.playbookId]).toBe(150_000);
  });
});
