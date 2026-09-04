/**
 * The landing page's sections rendered with FIXTURE data, so the word budget
 * and the page's rules can be asserted without a database.
 *
 * The shape is the shape `loadLandingData` returns; the values are the ones the
 * committed corpus fixtures produce (TX20260253, two modifications, Harris
 * County, Building), so what the test counts is what the deployed page renders.
 */

import type { LandingData } from '../src/components/landing/demo-data';
import type { ClassificationRow, DeterminationCandidate } from '../src/lib/kb';

const lastVerified = new Date('2026-09-03T00:00:00Z');

export const DEMO_WD = 'TX20260253';

export function candidate(over: Partial<DeterminationCandidate> = {}): DeterminationCandidate {
  return {
    wdId: 'wd_1',
    wdNumber: DEMO_WD,
    modificationNumber: 1,
    publicationDate: '2026-05-18',
    constructionTypes: ['Building'],
    isActive: true,
    countyNames: ['Harris'],
    countyCount: 1,
    classificationCount: 57,
    publicUrl: `https://sam.gov/wage-determination/${DEMO_WD}/1`,
    sourceUrl: `https://sam.gov/api/prod/wdol/v1/wd/${DEMO_WD}/1`,
    lastVerified,
    ...over,
  };
}

export function classification(over: Partial<ClassificationRow> = {}): ClassificationRow {
  return {
    id: 'cls_1',
    lineNo: 26,
    classificationLabel: 'ELECTRICIAN (EXCLUDES LOW VOLTAGE WIRING)',
    qualifier: null,
    footnoteText: null,
    tradeFamily: 'electrician',
    baseRate: '38.50',
    fringeRate: '10.71',
    rateGroupIdentifier: 'ELEC0716-005',
    rateGroupKind: 'union',
    rateGroupEffectiveDate: '2025-09-01',
    wdNumber: DEMO_WD,
    modificationNumber: 1,
    publicationDate: '2026-05-18',
    sourceUrl: `https://sam.gov/api/prod/wdol/v1/wd/${DEMO_WD}/1`,
    lastVerified,
    ...over,
  };
}

export function landingData(over: Partial<LandingData> = {}): LandingData {
  const determination = candidate();
  return {
    states: [{ stateCode: 'TX' }],
    counties: [{ slug: 'harris', countyName: 'Harris' }],
    selection: {},
    health: {
      activeDeterminations: 6,
      supersededRevisionsHeld: 1,
      determinationsWithHistory: 6,
      classifications: 312,
      counties: 254,
      oldestLastVerified: lastVerified.toISOString(),
      stale: false,
      lastRunStatus: 'ok',
      parserVersion: '1',
    },
    lastRefresh: { at: lastVerified.toISOString(), status: 'ok' },
    result: {
      kind: 'determination',
      origin: 'example',
      determination,
      provenance: {
        wdNumber: determination.wdNumber,
        modificationNumber: determination.modificationNumber,
        publicationDate: determination.publicationDate,
        lastVerified,
        publicUrl: determination.publicUrl,
        stale: false,
      },
      rows: [
        classification(),
        classification({ id: 'cls_2', classificationLabel: 'PLUMBER', baseRate: '30.20', fringeRate: '12.38' }),
        classification({
          id: 'cls_3',
          classificationLabel: 'ELEVATOR MECHANIC',
          rateGroupIdentifier: 'ELEV0031-001',
          baseRate: '53.59',
          fringeRate: '38.44',
        }),
      ],
      total: 57,
      scope: 'Harris County · Building construction',
      modifications: [
        { modificationNumber: 1, publicationDate: '2026-05-18', active: true },
        { modificationNumber: 0, publicationDate: '2026-05-17', active: false },
      ],
      pinned: 1,
      current: 1,
      divergence: { ratesMoved: 12, added: 3, removed: 0 },
      resultHref: `/wd/${DEMO_WD}`,
    },
    ...over,
  };
}

export const PROOF_PROPS = {
  provenance: {
    wdNumber: DEMO_WD,
    modificationNumber: 1,
    publicationDate: '2026-05-18',
    lastVerified,
    publicUrl: `https://sam.gov/wage-determination/${DEMO_WD}/1`,
  },
  crew: [
    {
      name: 'EXAMPLE, A.',
      identifierLast4: '0000',
      classification: 'ELECTRICIAN',
      hours: 40,
      baseRate: '38.50',
      fringeRate: '10.71',
    },
  ],
  projectName: 'Bldg 4200 roof replacement',
  countyLabel: 'Harris County · Building construction',
  weekEnding: '2026-09-04',
};
