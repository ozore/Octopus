/**
 * WL-02 — project setup and the wage-determination pin.
 *
 * Every acceptance criterion in `specs/WL-02-project-and-wd-lookup.md` has a
 * test below, named after it. The two that carry the product:
 *
 *  - **F3.** 12.17% of (state, county, construction type) combinations map to
 *    more than one active determination, so the screen may not promise one
 *    answer — and `<CandidateChoice>` cannot be submitted while it would be
 *    guessing.
 *  - **The 29 CFR 1.6 case.** A superseded modification the user NAMED is
 *    pinned, permanently annotated and never blocked; the same modification
 *    arrived at by accident is not. `not_found` and `superseded` are different
 *    answers.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { events } from '@octopus/platform/db';

import { CandidateChoice, type CandidateView } from '../src/components/wd-picker';
import { ProvenanceCard } from '../src/components/provenance';
import { emitEvent } from '../src/lib/analytics/events';
import { fetchHistory, ingestCounties, ingestDetermination } from '../src/lib/kb/ingest';
import {
  findCountyBySlug,
  findDeterminations,
  getDetermination,
  publicDeterminationUrl,
  searchClassifications,
} from '../src/lib/kb';
import {
  RepinNeedsConfirmationError,
  createProject,
  openPinHistory,
  pinHistory,
  repinDeterminationChecked,
  resolvePin,
} from '../src/lib/repositories/projects';
import { certifyPayroll, createPayroll } from '../src/lib/repositories/payrolls';
import { harrisIndexRecords, makeDb, makeSam, seedOrg } from './helpers';

let harness: Awaited<ReturnType<typeof makeDb>>;
let db: Awaited<ReturnType<typeof makeDb>>['db'];
let sam: ReturnType<typeof makeSam>;
let orgId: string;
let userId: string;

async function seedCorpus() {
  await ingestCounties(db, sam, 'TX');
  for (const record of harrisIndexRecords()) {
    try {
      await ingestDetermination(db, sam, {
        wdNumber: record.fullReferenceNumber,
        revision: record.revisionNumber,
        indexRecord: record,
      });
      await fetchHistory(db, sam, record.fullReferenceNumber);
    } catch {
      /* no fixture for that determination's text: it behaves like a 404 */
    }
  }
}

beforeEach(async () => {
  harness = await makeDb();
  db = harness.db;
  sam = makeSam();
  await seedCorpus();
  const seeded = await seedOrg(db);
  orgId = seeded.orgId;
  userId = seeded.userId;
});
afterEach(async () => {
  await harness.close();
});

const candidate = (over: Partial<CandidateView> = {}): CandidateView => ({
  wdNumber: 'TX20260031',
  modificationNumber: 1,
  publicationDate: '2026-01-02',
  constructionTypes: ['Heavy'],
  countyNames: ['Harris'],
  countyCount: 1,
  classificationCount: 40,
  publicUrl: 'https://sam.gov/wage-determination/TX20260031/1',
  ...over,
});

describe('geography narrows; it does not decide (F3)', () => {
  it('Harris + Heavy returns three candidates and marks the form ambiguous', async () => {
    const county = await findCountyBySlug(db, 'TX', 'harris');
    const { candidates, ambiguous } = await findDeterminations(db, {
      stateCode: 'TX',
      samCountyCode: county!.samCountyCode,
      constructionType: 'Heavy',
    });
    expect(ambiguous).toBe(true);
    expect(candidates.map((c) => c.wdNumber).sort()).toEqual([
      'TX20260031',
      'TX20260033',
      'TX20260034',
    ]);
  });

  it('with three candidates NOTHING is preselected and the form cannot be submitted (V6)', () => {
    const html = renderToStaticMarkup(
      <CandidateChoice
        formId="new-project"
        resolvedByNumber={false}
        candidates={[
          candidate(),
          candidate({ wdNumber: 'TX20260033', countyCount: 173 }),
          candidate({ wdNumber: 'TX20260034', countyCount: 254 }),
        ]}
      />,
    );
    expect(html).not.toContain('checked');
    expect(html).toContain('disabled');
    expect(html).toContain('Choose the determination your contract names to continue');
    expect(html).toContain('We will not pick one for you');
    // No "recommended", "best match" or "most likely" anywhere: the heuristic
    // does not exist and there is nowhere to put one.
    expect(html.toLowerCase()).not.toMatch(/recommended|best match|most likely/);
  });

  it('Harris + Building returns exactly one candidate, preselected, submittable', async () => {
    const county = await findCountyBySlug(db, 'TX', 'harris');
    const { candidates, ambiguous } = await findDeterminations(db, {
      stateCode: 'TX',
      samCountyCode: county!.samCountyCode,
      constructionType: 'Building',
    });
    expect(ambiguous).toBe(false);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.wdNumber).toBe('TX20260253');

    const html = renderToStaticMarkup(
      <CandidateChoice
        formId="new-project"
        resolvedByNumber={false}
        candidates={[candidate({ wdNumber: 'TX20260253', constructionTypes: ['Building'] })]}
        confirmCard={
          <p>Your contract should name this number. If it names a different one, go back.</p>
        }
      />,
    );
    expect(html).toContain('checked');
    expect(html).not.toContain('disabled');
    expect(html).toContain('Your contract should name this number');
  });

  it('a county and type with no determination returns zero, so the panel can be honest', async () => {
    const county = await findCountyBySlug(db, 'TX', 'bastrop');
    const { candidates } = await findDeterminations(db, {
      stateCode: 'TX',
      samCountyCode: county!.samCountyCode,
      constructionType: 'Building',
    });
    expect(candidates).toHaveLength(0);

    await emitEvent(db, 'wd_search_zero_results', {
      orgId,
      userId,
      props: { state_code: 'TX', county_name: 'Bastrop', construction_type: 'Building' },
    });
    const [row] = await db.select().from(events);
    expect(row?.name).toBe('wd_search_zero_results');
    expect(row?.props).toMatchObject({ county_name: 'Bastrop', construction_type: 'Building' });
  });
});

describe('the three pin cases, and only three', () => {
  it('a bare number offers the ACTIVE modification with pin_method entered_number', async () => {
    const decision = await resolvePin(db, { wdNumber: 'TX20260253' });
    expect(decision.status).toBe('ok');
    if (decision.status !== 'ok') return;
    expect(decision.determination.modificationNumber).toBe(1);
    expect(decision.pinMethod).toBe('entered_number');
    expect(decision.superseded).toBe(false);
  });

  it('resolves every short form SAM lists for the number (V8)', async () => {
    for (const alias of ['TX260253', 'TX26253', 'TX2026253', 'TX0253', 'tx 20260253']) {
      const decision = await resolvePin(db, { wdNumber: alias });
      expect(decision.status, alias).toBe('ok');
      if (decision.status === 'ok') expect(decision.determination.wdNumber).toBe('TX20260253');
    }
  });

  it('an explicit ACTIVE modification pins that one', async () => {
    const decision = await resolvePin(db, { wdNumber: 'TX20260253', modificationNumber: 1 });
    expect(decision.status).toBe('ok');
    if (decision.status !== 'ok') return;
    expect(decision.pinMethod).toBe('entered_number_and_modification');
    expect(decision.superseded).toBe(false);
  });

  it('an explicit SUPERSEDED modification pins THAT ONE and names the newer one (V3, B3)', async () => {
    await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 0,
      isActive: false,
    });
    const decision = await resolvePin(db, { wdNumber: 'TX20260253', modificationNumber: 0 });
    expect(decision.status).toBe('ok');
    if (decision.status !== 'ok') return;
    expect(decision.determination.modificationNumber).toBe(0);
    expect(decision.superseded).toBe(true);
    expect(decision.pinMethod).toBe('entered_number_and_modification');
    expect(decision.activeModification).toBe(1);
    expect(decision.activePublicationDate).toBe('2026-05-18');
  });

  it('a modification that never existed is REFUSED, with the real list (V3)', async () => {
    const decision = await resolvePin(db, { wdNumber: 'TX20260253', modificationNumber: 9 });
    expect(decision.status).toBe('refused');
    if (decision.status !== 'refused') return;
    expect(decision.reason).toBe('not_found');
    expect(decision.knownModifications.sort()).toEqual([0, 1]);
  });

  it('a revision whose text we do not hold enqueues a fetch and pins nothing yet', async () => {
    const decision = await resolvePin(db, { wdNumber: 'TX20260253', modificationNumber: 0 });
    expect(decision.status).toBe('refused');
    if (decision.status === 'refused') expect(decision.reason).toBe('fetching');
  });

  it('a chosen candidate carries selected_from_n, and a lone one selected_from_1', async () => {
    const many = await resolvePin(db, {
      wdNumber: 'TX20260031',
      modificationNumber: 1,
      chosenFromN: 3,
    });
    expect(many.status === 'ok' && many.pinMethod).toBe('selected_from_n');
    const one = await resolvePin(db, {
      wdNumber: 'TX20260253',
      modificationNumber: 1,
      chosenFromN: 1,
    });
    expect(one.status === 'ok' && one.pinMethod).toBe('selected_from_1');
  });
});

describe('creating the project writes the pin and its history', () => {
  async function pinnedProject(over: Record<string, unknown> = {}) {
    const decision = await resolvePin(db, { wdNumber: 'TX20260253' });
    if (decision.status !== 'ok') throw new Error('expected the corpus to hold TX20260253');
    return createProject(db, {
      orgId,
      name: 'Bldg 4200 roof replacement',
      projectOrContractNo: 'W912XX-26-C-0000',
      locationDescription: 'Fort Cavazos, Bell County, TX',
      ourRole: 'sub',
      primeContractorName: 'Bellwether Construction',
      wdId: decision.determination.wdId,
      wdNumber: decision.determination.wdNumber,
      wdModificationNumber: decision.determination.modificationNumber,
      wdPinMethod: decision.pinMethod,
      wdPinnedSuperseded: decision.superseded,
      wdPinnedByUserId: userId,
      stateCode: 'TX',
      samCountyCode: 14885,
      countyName: 'Harris',
      constructionType: 'Building',
      ...over,
    } as never);
  }

  it('sets the denormalised pair, one open history row with reason=initial, and a SAM link', async () => {
    const project = await pinnedProject();
    expect(project.wdNumber).toBe('TX20260253');
    expect(project.wdModificationNumber).toBe(1);

    const open = await openPinHistory(db, project.id);
    expect(open).toMatchObject({ reason: 'initial', unpinnedAt: null });
    expect(await pinHistory(db, project.id)).toHaveLength(1);

    expect(publicDeterminationUrl(project.wdNumber, project.wdModificationNumber)).toBe(
      'https://sam.gov/wage-determination/TX20260253/1',
    );
  });

  it('still resolves after a corpus rebuild changes kb_wage_determinations.id', async () => {
    const project = await pinnedProject();
    const before = project.wdId;
    // A rebuild re-ingests the same document under a new row id.
    const rebuilt = await makeDb();
    try {
      await ingestCounties(rebuilt.db, makeSam(), 'TX');
      const again = await ingestDetermination(rebuilt.db, makeSam(), {
        wdNumber: 'TX20260253',
        revision: 1,
        indexRecord: harrisIndexRecords().find(
          (r) => r.fullReferenceNumber === 'TX20260253',
        ) as never,
      });
      expect(again.wdId).not.toBe(before);
      // The project's own columns are what a later screen reads.
      const resolved = await getDetermination(rebuilt.db, project.wdNumber, project.wdModificationNumber);
      expect(resolved.resolution).toBe('active');
    } finally {
      await rebuilt.close();
    }
  });

  it('records a deliberately superseded pin and renders the permanent notice (V3b)', async () => {
    await ingestDetermination(db, sam, { wdNumber: 'TX20260253', revision: 0, isActive: false });
    const decision = await resolvePin(db, { wdNumber: 'TX20260253', modificationNumber: 0 });
    if (decision.status !== 'ok') throw new Error('expected mod 0 to resolve');

    const project = await pinnedProject({
      wdId: decision.determination.wdId,
      wdModificationNumber: 0,
      wdPinnedSuperseded: true,
      wdPinMethod: decision.pinMethod,
    });
    expect(project.wdModificationNumber).toBe(0);
    expect(project.wdPinnedSuperseded).toBe(true);
    expect(project.wdPinMethod).toBe('entered_number_and_modification');
    // Nothing is blocked: the project is active and usable.
    expect(project.status).toBe('active');

    const html = renderToStaticMarkup(
      <ProvenanceCard
        provenance={{
          wdNumber: project.wdNumber,
          modificationNumber: project.wdModificationNumber,
          publicationDate: decision.determination.publicationDate,
          newerModification: {
            modificationNumber: decision.activeModification as number,
            publicationDate: decision.activePublicationDate as string,
          },
        }}
      />,
    );
    expect(html).toContain('Modification 0');
    expect(html).toContain('a newer modification (1) was published on 18 May 2026');
    expect(html).toContain('Your contract governs');

    await emitEvent(db, 'wd_pinned', {
      orgId,
      userId,
      props: {
        wd_number: project.wdNumber,
        modification_number: 0,
        pin_method: decision.pinMethod,
        chosen_from_n: 0,
        is_superseded: true,
      },
    });
    const [row] = await db.select().from(events);
    expect(row?.props).toMatchObject({ is_superseded: true, modification_number: 0 });
  });

  it('gate G9 — a project pinned to mod 0 reads no rate from mod 1', async () => {
    const modZero = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 0,
      isActive: false,
    });
    const project = await pinnedProject({
      wdId: modZero.wdId,
      wdModificationNumber: 0,
      wdPinnedSuperseded: true,
    });

    const catalogue = await searchClassifications(db, project.wdId, { limit: 1000 });
    expect(catalogue.total).toBe(54);
    for (const row of catalogue.rows) {
      expect(row.modificationNumber).toBe(0);
      expect(row.wdNumber).toBe('TX20260253');
    }

    // Modification 1 is in the same database and is not what this reads.
    const active = await getDetermination(db, 'TX20260253');
    expect(active.resolution).toBe('active');
    if (active.resolution === 'active') {
      expect(active.determination.wdId).not.toBe(project.wdId);
      expect(active.determination.classificationCount).toBe(57);
    }
  });
});

describe('re-pinning (V7)', () => {
  async function projectWithCertifiedPayroll() {
    const decision = await resolvePin(db, { wdNumber: 'TX20260253' });
    if (decision.status !== 'ok') throw new Error('expected TX20260253');
    const project = await createProject(db, {
      orgId,
      name: 'Bldg 4200',
      wdId: decision.determination.wdId,
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
      stateCode: 'TX',
      wdPinnedByUserId: userId,
    } as never);
    const payroll = await createPayroll(db, {
      projectId: project.id,
      filerOrganisationId: orgId,
      weekEndingDate: '2026-06-05',
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
    });
    await certifyPayroll(db, { payrollId: payroll.id, certifiedByUserId: userId });
    return project;
  }

  it('is routine while nothing is certified, and writes accepted_modification', async () => {
    await ingestDetermination(db, sam, { wdNumber: 'TX20260253', revision: 0, isActive: false });
    const decision = await resolvePin(db, { wdNumber: 'TX20260253' });
    if (decision.status !== 'ok') throw new Error('expected TX20260253');
    const project = await createProject(db, {
      orgId,
      name: 'Bldg 4200',
      wdId: decision.determination.wdId,
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
      stateCode: 'TX',
      wdPinnedByUserId: userId,
    } as never);

    const zero = await getDetermination(db, 'TX20260253', 0);
    if (zero.resolution !== 'superseded') throw new Error('expected mod 0');
    const result = await repinDeterminationChecked(db, {
      projectId: project.id,
      wdId: zero.determination.wdId,
      wdNumber: 'TX20260253',
      wdModificationNumber: 0,
      wdPinnedSuperseded: true,
      changedByUserId: userId,
    });
    expect(result.reason).toBe('accepted_modification');
    const history = await pinHistory(db, project.id);
    expect(history).toHaveLength(2);
    expect(history.filter((entry) => entry.unpinnedAt === null)).toHaveLength(1);
  });

  it('needs a confirmation once a payroll is certified, and records it as a correction', async () => {
    const project = await projectWithCertifiedPayroll();
    await ingestDetermination(db, sam, { wdNumber: 'TX20260253', revision: 0, isActive: false });
    const zero = await getDetermination(db, 'TX20260253', 0);
    if (zero.resolution !== 'superseded') throw new Error('expected mod 0');

    await expect(
      repinDeterminationChecked(db, {
        projectId: project.id,
        wdId: zero.determination.wdId,
        wdNumber: 'TX20260253',
        wdModificationNumber: 0,
        changedByUserId: userId,
      }),
    ).rejects.toBeInstanceOf(RepinNeedsConfirmationError);

    // Nothing moved.
    const untouched = await pinHistory(db, project.id);
    expect(untouched).toHaveLength(1);

    const confirmed = await repinDeterminationChecked(db, {
      projectId: project.id,
      wdId: zero.determination.wdId,
      wdNumber: 'TX20260253',
      wdModificationNumber: 0,
      wdPinnedSuperseded: true,
      changedByUserId: userId,
      confirmed: true,
    });
    expect(confirmed.reason).toBe('corrected');
    expect(confirmed.certifiedPayrolls).toBe(1);
    const history = await pinHistory(db, project.id);
    expect(history.find((entry) => entry.reason === 'corrected')?.unpinnedAt).toBeNull();
  });
});

describe('the ambiguity rate over the seeded corpus is real and non-zero', () => {
  it('reports it, so nobody "fixes" the candidate list by picking the newest', async () => {
    const county = await findCountyBySlug(db, 'TX', 'harris');
    const measured: Record<string, number> = {};
    for (const type of ['Building', 'Residential', 'Highway', 'Heavy']) {
      const { candidates } = await findDeterminations(db, {
        stateCode: 'TX',
        samCountyCode: county!.samCountyCode,
        constructionType: type,
      });
      measured[type] = candidates.length;
    }
    const ambiguous = Object.values(measured).filter((count) => count > 1).length;
    expect(ambiguous).toBeGreaterThan(0);
    expect(measured['Heavy']).toBe(3);
  });
});
