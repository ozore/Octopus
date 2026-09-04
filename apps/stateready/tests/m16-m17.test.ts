/**
 * M16 — the qualifier watch, and M17 — the shared readiness link and the
 * technician licence card. `UX.md` S15, S18, S19; `PERSONA.md` J5, J6, J10;
 * `IDENTITY.md` §2 UA3.
 *
 * The three properties these two modules are worth nothing without:
 *
 *  1. **the replacement clock comes from the board, or it does not exist** — no
 *     defaulted 30 or 90 days, and California, the case that made the screen,
 *     is quoted and explicitly excluded because we hold no Californian record;
 *  2. **75/45/15/5 is labelled as ours**, every time it is shown;
 *  3. **everything that leaves the building is paper**, and a revoked link
 *     answers rather than 404ing.
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { newId } from '@octopus/platform';
import { organisations } from '@octopus/platform/db';
import { createTestDb } from '@octopus/platform/testing';

import { QualifierCadence, QualifierReference, QualifierRow } from '../src/components/qualifiers';
import { ReadinessSheet, RevokedLink, TechnicianCard } from '../src/components/share';
import { ALERT_OFFSETS } from '../src/lib/cron';
import { appMigrationsDir } from '../src/lib/db';
import { getKbRecord } from '../src/lib/kb/accessors';
import {
  buildQualifierWatch,
  QUALIFIER_ALERT_OFFSETS,
  QUALIFIER_CADENCE_NOTE,
  QUALIFIER_REFERENCE,
  qualifierRuleFor,
} from '../src/lib/qualifiers';
import { selectDueOffsets } from '../src/lib/repos/alerts';
import { setOperatingStates } from '../src/lib/repos/company';
import { deriveForLicence } from '../src/lib/repos/deadlines';
import { createLicence } from '../src/lib/repos/licences';
import {
  buildReadinessView,
  buildTechnicianCard,
  createSharedLink,
  ensureReadinessLink,
  newShareToken,
  recordSharedLinkView,
  resolveSharedLink,
  revokeSharedLink,
} from '../src/lib/repos/shared-links';
import { addDays } from '../src/lib/rules/dates';
import { licences, sharedLinks, technicians } from '../src/lib/schema';

const TODAY = '2026-09-03';

let db: Awaited<ReturnType<typeof createTestDb>>;
let orgId: string;

beforeEach(async () => {
  db = await createTestDb([appMigrationsDir()]);
  orgId = newId('org');
  await db.db.insert(organisations).values({ id: orgId, name: 'Sila Mechanical LLC', slug: `sila-${orgId}` });
});
afterEach(async () => {
  await db.close();
});

async function technician(first: string, last: string): Promise<string> {
  const id = newId('tec');
  await db.db.insert(technicians).values({ id, orgId, firstName: first, lastName: last });
  return id;
}

async function seed(input: {
  state: string;
  trade: string;
  kbLicenceTypeId?: string | null;
  customTypeName?: string | null;
  issuedOn?: string | null;
  expiresOn?: string | null;
  holder?: [string, string];
  technicianId?: string;
  licenceNumber?: string | null;
}) {
  const [first, last] = input.holder ?? ['Dave', 'Alvarez'];
  return createLicence(
    db.db,
    {
      orgId,
      holderKind: 'technician',
      technicianId: input.technicianId ?? (await technician(first, last)),
      state: input.state,
      trade: input.trade,
      kbLicenceTypeId: input.kbLicenceTypeId ?? null,
      customTypeName: input.customTypeName ?? null,
      licenceNumber: input.licenceNumber ?? null,
      issuedOn: input.issuedOn ?? null,
      expiresOn: input.expiresOn ?? null,
    },
    { today: TODAY },
  );
}

async function startClock(licenceId: string, on: string) {
  await db.db.update(licences).set({ qualifierDisassociatedOn: on }).where(eq(licences.id, licenceId));
  await deriveForLicence(db.db, licenceId, { today: TODAY });
}

// ---------------------------------------------------------------------------
// M16 — the qualifier watch
// ---------------------------------------------------------------------------

describe('M16 — the qualifier clock comes from the board', () => {
  it('Texas electrical runs on BUSINESS days, and thirty of them is six weeks, not a month', async () => {
    const { licence } = await seed({
      state: 'TX',
      trade: 'electrical',
      kbLicenceTypeId: 'tx.electrical.electrical_contractor',
      issuedOn: '2026-03-14',
      holder: ['Rosa', 'Delgado'],
      licenceNumber: 'TECL12345',
    });
    await startClock(licence.id, '2026-08-03');

    const [clock] = await buildQualifierWatch(db.db, orgId, TODAY);
    expect(clock).toBeDefined();
    expect(clock!.published).toBe(true);
    expect(clock!.window).toEqual({ value: 30, unit: 'business_days' });
    // 3 August + 30 business days = 14 September — a plain 30 days would be the
    // 2nd, and the difference is the whole point of the unit.
    expect(clock!.dueOn).toBe('2026-09-14');
    expect(addDays('2026-08-03', 30)).toBe('2026-09-02');
    expect(clock!.holderName).toBe('Rosa Delgado');
    expect(clock!.citationUrl).toMatch(/^https:\/\/www\.tdlr\.texas\.gov\//);
    expect(clock!.evidence).toContain('thirty business days');
  });

  it('North Carolina electrical runs on calendar days', async () => {
    const { licence } = await seed({
      state: 'NC',
      trade: 'electrical',
      kbLicenceTypeId: 'nc.electrical.unlimited',
      issuedOn: '2026-03-14',
    });
    await startClock(licence.id, '2026-08-03');
    const [clock] = await buildQualifierWatch(db.db, orgId, TODAY);
    expect(clock!.window).toEqual({ value: 30, unit: 'days' });
    expect(clock!.dueOn).toBe('2026-09-02');
  });

  it('a state whose board publishes no deadline gets the REFUSAL and the board’s link, never a default', async () => {
    const { licence } = await seed({
      state: 'TX',
      trade: 'hvac',
      kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
      issuedOn: '2026-03-14',
    });
    await startClock(licence.id, '2026-08-03');

    const [clock] = await buildQualifierWatch(db.db, orgId, TODAY);
    expect(clock!.published).toBe(false);
    expect(clock!.dueOn).toBeNull();
    expect(clock!.window).toBeNull();
    expect(clock!.refusal).toContain('does not publish a deadline');
    expect(clock!.boardUrl).toMatch(/^https:\/\//);

    const html = renderToStaticMarkup(createElement(QualifierRow, { clock: clock! }));
    expect(html).toContain('not yet verified');
    expect(html).toContain('Ask ');
    // Nothing that looks like a date is invented for it.
    expect(html).not.toMatch(/\d{4}-\d{2}-\d{2}<\/span> ·\s*\d+ days left/);
  });

  it('an uncovered state cannot start a clock at all, and says why', () => {
    const rule = qualifierRuleFor('CA', 'hvac', TODAY);
    expect(rule.covered).toBe(false);
    expect(rule.published).toBe(false);
    expect(rule.refusal).toContain('We do not hold hvac rules for CA');
  });

  it('the statutory consequence is on the row, in the board’s own words', async () => {
    const { licence } = await seed({
      state: 'TX',
      trade: 'electrical',
      kbLicenceTypeId: 'tx.electrical.electrical_contractor',
      issuedOn: '2026-03-14',
    });
    await startClock(licence.id, '2026-08-03');
    const [clock] = await buildQualifierWatch(db.db, orgId, TODAY);
    const html = renderToStaticMarkup(createElement(QualifierRow, { clock: clock! }));
    expect(html).toContain('qualifier-consequence');
    expect(html).toContain('designate a new Master Electrician');
    expect(html).toContain('https://www.tdlr.texas.gov');
    expect(html).toContain('checked 2026-09-03');
  });

  it('rows sort worst-first, and a licence we cannot date sorts last', async () => {
    const overdue = await seed({
      state: 'TX',
      trade: 'electrical',
      kbLicenceTypeId: 'tx.electrical.electrical_contractor',
      issuedOn: '2026-03-14',
      holder: ['Over', 'Due'],
    });
    const running = await seed({
      state: 'NC',
      trade: 'electrical',
      kbLicenceTypeId: 'nc.electrical.unlimited',
      issuedOn: '2026-03-14',
      holder: ['Still', 'Running'],
    });
    const undatable = await seed({
      state: 'TX',
      trade: 'hvac',
      kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
      issuedOn: '2026-03-14',
      holder: ['No', 'Rule'],
    });
    await startClock(overdue.licence.id, '2026-05-01');
    await startClock(running.licence.id, '2026-08-25');
    await startClock(undatable.licence.id, '2026-08-25');

    const rows = await buildQualifierWatch(db.db, orgId, TODAY);
    expect(rows.map((r) => r.holderName)).toEqual(['Over Due', 'Still Running', 'No Rule']);
    expect(rows[0]!.status).toBe('LAPSED');
    expect(rows[2]!.dueOn).toBeNull();
  });

  it('a licence with no qualifier flag never appears on the watch', async () => {
    await seed({
      state: 'TX',
      trade: 'electrical',
      kbLicenceTypeId: 'tx.electrical.electrical_contractor',
      issuedOn: '2026-03-14',
    });
    expect(await buildQualifierWatch(db.db, orgId, TODAY)).toEqual([]);
  });
});

describe('M16 — the cadence is labelled as a design judgment', () => {
  it('is 75/45/15/5, is NOT the sourced renewal schedule, and says so wherever it renders', () => {
    expect([...QUALIFIER_ALERT_OFFSETS]).toEqual([75, 45, 15, 5]);
    expect([...QUALIFIER_ALERT_OFFSETS]).not.toEqual([...ALERT_OFFSETS]);
    expect(QUALIFIER_CADENCE_NOTE).toContain('design judgment');
    expect(QUALIFIER_CADENCE_NOTE).toContain('not a rule any board publishes');

    const html = renderToStaticMarkup(createElement(QualifierCadence));
    expect(html).toContain('75 / 45 / 15 / 5');
    expect(html).toContain('design judgment');
  });

  it('drives the alert schedule as its own offset set, through the shared selector', () => {
    // The drain passes this set for a `qualifier_replacement` deadline and the
    // standard set for everything else. `selectDueOffsets` already takes the
    // offsets as an argument, so no shared constant had to move.
    const dueOn = addDays(TODAY, 44);
    expect(
      selectDueOffsets([{ id: 'q1', dueOn }], new Set(), TODAY, [...QUALIFIER_ALERT_OFFSETS]),
    ).toEqual([{ deadlineId: 'q1', offsetDays: 45 }]);
    // The standard schedule would have chosen 60, which does not exist inside a
    // 90-day window that is already half gone.
    expect(selectDueOffsets([{ id: 'q1', dueOn }], new Set(), TODAY)).toEqual([
      { deadlineId: 'q1', offsetDays: 60 },
    ]);
  });
});

describe('M16 — California is quoted and explicitly not covered', () => {
  it('carries CSLB’s own sentence with its URL and the date we read it', () => {
    expect(QUALIFIER_REFERENCE.covered).toBe(false);
    expect(QUALIFIER_REFERENCE.sourceUrl).toContain('cslb.ca.gov');
    expect(QUALIFIER_REFERENCE.quote).toContain('within 90 days');
    expect(QUALIFIER_REFERENCE.quote).toContain('automatic suspension');

    const html = renderToStaticMarkup(createElement(QualifierReference));
    expect(html).toContain('automatic suspension');
    expect(html).toContain(QUALIFIER_REFERENCE.sourceUrl);
    expect(html).toContain('checked 2026-09-03');
    // And the honesty line: we quote it, we do not derive from it.
    expect(html).toContain('is not in our rule library yet');
  });

  it('and the knowledge base really does not hold California, so the exclusion is true', () => {
    for (const trade of ['hvac', 'plumbing', 'electrical']) {
      expect(getKbRecord('CA', trade)).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// M17 — the shared readiness link
// ---------------------------------------------------------------------------

describe('M17 — the token', () => {
  it('is random rather than time-ordered, so two links minted together share no prefix', () => {
    const tokens = Array.from({ length: 50 }, () => newShareToken());
    expect(new Set(tokens).size).toBe(50);
    expect(tokens.every((token) => token.length >= 32)).toBe(true);
    expect(tokens.every((token) => /^[A-Za-z0-9_-]+$/.test(token))).toBe(true);
    const [a, b] = tokens;
    expect(a!.slice(0, 8)).not.toBe(b!.slice(0, 8));
  });

  it('resolves, is idempotent per organisation, and a guessed token resolves to nothing', async () => {
    const first = await ensureReadinessLink(db.db, { orgId });
    const second = await ensureReadinessLink(db.db, { orgId });
    expect(second.id).toBe(first.id);

    expect(await resolveSharedLink(db.db, 'not-a-token')).toEqual({ state: 'missing' });
    expect(await resolveSharedLink(db.db, '')).toEqual({ state: 'missing' });
    const resolved = await resolveSharedLink(db.db, first.token);
    expect(resolved.state).toBe('ok');
  });

  it('a revoked link ANSWERS rather than 404ing, and a new one can be minted after it', async () => {
    const link = await ensureReadinessLink(db.db, { orgId });
    await revokeSharedLink(db.db, { orgId, linkId: link.id });

    const resolved = await resolveSharedLink(db.db, link.token);
    expect(resolved.state).toBe('revoked');

    const html = renderToStaticMarkup(createElement(RevokedLink, { appName: 'StateReady' }));
    expect(html).toContain('This link has been turned off');
    expect(html).toContain('Ask them for a new one');
    // Paper, because it still leaves the building.
    expect(html).toContain('data-theme="paper"');

    const replacement = await ensureReadinessLink(db.db, { orgId });
    expect(replacement.id).not.toBe(link.id);
  });

  it('cannot be revoked by another organisation', async () => {
    const link = await ensureReadinessLink(db.db, { orgId });
    const otherOrg = newId('org');
    await db.db.insert(organisations).values({ id: otherOrg, name: 'Other', slug: `o-${otherOrg}` });
    await revokeSharedLink(db.db, { orgId: otherOrg, linkId: link.id });
    expect((await resolveSharedLink(db.db, link.token)).state).toBe('ok');
  });

  it('counts views without changing what the page shows', async () => {
    const link = await ensureReadinessLink(db.db, { orgId });
    await recordSharedLinkView(db.db, link);
    const rows = await db.db.select().from(sharedLinks).where(eq(sharedLinks.id, link.id));
    expect(rows[0]!.viewCount).toBe(1);
    expect(rows[0]!.lastViewedAt).not.toBeNull();
  });
});

describe('M17 — the readiness sheet', () => {
  it('groups worst-first, renders on paper, and carries the disclaimer', async () => {
    await setOperatingStates(db.db, {
      orgId,
      rows: [
        { state: 'TX', trade: 'plumbing' },
        { state: 'OH', trade: 'hvac' },
      ],
    });
    await seed({
      state: 'TX',
      trade: 'plumbing',
      kbLicenceTypeId: 'tx.plumbing.master_plumber',
      issuedOn: '2024-03-14',
      holder: ['Rosa', 'Delgado'],
    });
    await seed({
      state: 'OH',
      trade: 'hvac',
      customTypeName: 'Ohio HVAC contractor',
      expiresOn: addDays(TODAY, 200),
      holder: ['Ann', 'Ruiz'],
    });

    const view = await buildReadinessView(
      db.db,
      { orgId, organisationName: 'Sila Mechanical LLC' },
      TODAY,
    );
    expect(view.rows[0]!.status).toBe('LAPSED');
    expect(view.rows.at(-1)!.status).toBe('READY');

    const html = renderToStaticMarkup(createElement(ReadinessSheet, { view, appName: 'StateReady' }));
    // Paper, whatever the viewer prefers — the artefact's audience is not the
    // person who chose the theme.
    expect(html).toContain('data-theme="paper"');
    expect(html).not.toContain('data-theme="light"');
    expect(html).not.toContain('data-theme="dark"');

    // The grid AND the grouped list: 51 tiles for a desktop, the list for a
    // phone, and the list is the grid's accessible equivalent either way.
    expect((html.match(/data-testid="tile-[A-Z]{2}"/g) ?? [])).toHaveLength(51);
    expect(html).toContain('data-testid="readiness-list"');
    expect(html).toContain('data-group="LAPSED"');
    expect(html.indexOf('data-group="LAPSED"')).toBeLessThan(html.indexOf('data-group="READY"'));

    expect(html).toContain('Sila Mechanical LLC');
    expect(html).toContain('Rosa Delgado');
    expect(html).toContain('data-testid="disclaimer"');
    expect(html).toContain('not legal advice');
  });

  it('says of an entered date that it was entered, and of a derived one where it came from', async () => {
    await seed({
      state: 'TX',
      trade: 'hvac',
      kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
      issuedOn: '2026-03-14',
    });
    await seed({
      state: 'OH',
      trade: 'hvac',
      customTypeName: 'Ohio HVAC contractor',
      expiresOn: addDays(TODAY, 30),
      holder: ['Ann', 'Ruiz'],
    });
    const view = await buildReadinessView(db.db, { orgId, organisationName: 'Sila' }, TODAY);
    const html = renderToStaticMarkup(createElement(ReadinessSheet, { view, appName: 'StateReady' }));
    expect(html).toContain('https://www.tdlr.texas.gov');
    expect(html).toContain('entered by the licence holder, not derived from a board page');
  });

  it('shows a licence with no derivable deadline as NOT TRACKED rather than dropping it', async () => {
    await seed({
      state: 'OH',
      trade: 'hvac',
      customTypeName: 'Ohio HVAC contractor',
      issuedOn: '2026-01-01',
    });
    const view = await buildReadinessView(db.db, { orgId, organisationName: 'Sila' }, TODAY);
    expect(view.rows).toHaveLength(1);
    expect(view.rows[0]!.status).toBe('NOT TRACKED');
    expect(view.rows[0]!.dueOn).toBeNull();
  });
});

describe('M17 / S18 — the technician licence card', () => {
  it('carries the credential, its status, and the board’s own verify link, on paper', async () => {
    const technicianId = await technician('Dave', 'Alvarez');
    await seed({
      state: 'TX',
      trade: 'hvac',
      kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
      issuedOn: '2026-03-14',
      licenceNumber: 'TACLA00123C',
      technicianId,
    });

    const view = await buildTechnicianCard(
      db.db,
      { orgId, technicianId, organisationName: 'Sila Mechanical LLC' },
      TODAY,
    );
    expect(view!.technicianName).toBe('Dave Alvarez');
    expect(view!.credentials).toHaveLength(1);
    expect(view!.credentials[0]!.licenceNumber).toBe('TACLA00123C');
    expect(view!.credentials[0]!.verifyUrl).toMatch(/^https:\/\//);

    const html = renderToStaticMarkup(createElement(TechnicianCard, { view: view!, appName: 'StateReady' }));
    expect(html).toContain('data-theme="paper"');
    expect(html).toContain('TACLA00123C');
    expect(html).toContain('Verify at');
    expect(html).toContain('data-testid="disclaimer"');
    // The licence number is preserved VERBATIM: normalising it would corrupt it.
    expect(html).not.toContain('TACLA 00123 C');
  });

  it('carries no email, phone or address, because the schema has none', async () => {
    const technicianId = await technician('Dave', 'Alvarez');
    await db.db
      .update(technicians)
      .set({ email: 'dave@sila.test' })
      .where(eq(technicians.id, technicianId));
    await seed({
      state: 'TX',
      trade: 'hvac',
      kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
      issuedOn: '2026-03-14',
      technicianId,
    });
    const view = await buildTechnicianCard(db.db, { orgId, technicianId, organisationName: 'Sila' }, TODAY);
    const html = renderToStaticMarkup(createElement(TechnicianCard, { view: view!, appName: 'StateReady' }));
    expect(html).not.toContain('dave@sila.test');
  });

  it('a card link needs a technician, and belongs to one organisation', async () => {
    await expect(createSharedLink(db.db, { orgId, kind: 'technician_card' })).rejects.toThrow(
      /needs a technician/,
    );

    const technicianId = await technician('Dave', 'Alvarez');
    const link = await createSharedLink(db.db, {
      orgId,
      kind: 'technician_card',
      subjectId: technicianId,
    });
    expect(link.subjectId).toBe(technicianId);

    const otherOrg = newId('org');
    await db.db.insert(organisations).values({ id: otherOrg, name: 'Other', slug: `o-${otherOrg}` });
    // The card builder is scoped by organisation: another org's id resolves to
    // nothing, so a leaked technician id is not a leaked card.
    expect(
      await buildTechnicianCard(db.db, { orgId: otherOrg, technicianId, organisationName: 'Other' }, TODAY),
    ).toBeNull();
  });

  it('an expiry we could not derive renders the refusal, never a blank', async () => {
    const technicianId = await technician('Ann', 'Ruiz');
    await seed({
      state: 'OH',
      trade: 'hvac',
      customTypeName: 'Ohio HVAC contractor',
      issuedOn: '2026-01-01',
      technicianId,
    });
    const view = await buildTechnicianCard(db.db, { orgId, technicianId, organisationName: 'Sila' }, TODAY);
    expect(view!.credentials[0]!.expiresOn).toBeNull();
    const html = renderToStaticMarkup(createElement(TechnicianCard, { view: view!, appName: 'StateReady' }));
    expect(html).toContain('not yet verified');
  });
});
