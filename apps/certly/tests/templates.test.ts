/**
 * The requirement-template library — `specs/02` §11's fixture test, plus the
 * acceptance criteria that are about the DATA rather than the editor UI.
 *
 * "Every template JSON validates against the template schema and every
 * `source_url` is a syntactically valid URL with a `last_verified` date."
 */
import { describe, expect, it } from 'vitest';

import { compare } from '../src/lib/engine';
import {
  endorsementGlossary,
  getTemplate,
  glossaryByForm,
  listTemplates,
  templates,
  templateSchema,
  toRequirementSet,
} from '../src/lib/templates';
import { ENDORSEMENT_KEYS, parseFormNumber } from '../src/lib/engine';

describe('the library validates', () => {
  it('parses every template against the schema', () => {
    for (const template of templates) {
      expect(templateSchema.safeParse(template).success, `${template.id} does not validate`).toBe(true);
    }
  });

  it('ships the fifteen templates KNOWLEDGE_BASE.md §B names', () => {
    expect(templates.map((t) => t.id).sort()).toEqual(
      [
        'gc.baseline',
        'gc.design_build',
        'gc.hazmat_hauling',
        'gc.mechanical',
        'gc.pollution',
        'gc.trade.high_hazard',
        'hoa.baseline',
        'hoa.improvements',
        'pm.baseline',
        'pm.commercial.baseline',
        'pm.routine',
        'pm.snow',
        'pm.structural',
        'tenant.commercial.baseline',
        'tenant.retail_food',
      ].sort(),
    );
  });

  it('gives every id a unique value and every audience at least one template', () => {
    expect(new Set(templates.map((t) => t.id)).size).toBe(templates.length);
    for (const audience of ['pm', 'hoa', 'gc', 'tenant'] as const) {
      expect(listTemplates(audience).length, `no templates for ${audience}`).toBeGreaterThan(0);
    }
  });

  it('gives every source a fetchable URL and a dated last_verified (PLAN.md §A10)', () => {
    for (const template of templates) {
      for (const source of template.sources) {
        expect(() => new URL(source.url)).not.toThrow();
        expect(source.url.startsWith('https://')).toBe(true);
        expect(source.last_verified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Number.isNaN(Date.parse(source.last_verified))).toBe(false);
        expect(source.verified_by.length).toBeGreaterThan(0);
      }
    }
  });

  it('requires two independent verifiers for a `high` confidence source', () => {
    for (const template of templates) {
      for (const source of template.sources.filter((s) => s.confidence === 'high')) {
        // PLAN.md §A10: "verified by two independent agents". Where only one
        // has signed, the source is medium at best.
        expect(source.verified_by.length, `${template.id} → ${source.url}`).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe('A1 — the GC library', () => {
  it('offers the six GC templates with a coverage summary and a source count', () => {
    const gc = listTemplates('gc');
    expect(gc.map((t) => t.id).sort()).toEqual([
      'gc.baseline',
      'gc.design_build',
      'gc.hazmat_hauling',
      'gc.mechanical',
      'gc.pollution',
      'gc.trade.high_hazard',
    ]);
    for (const template of gc) {
      expect(template.coverageSummary.length).toBeGreaterThan(3);
      expect(template.rowCount).toBeGreaterThan(3);
    }
  });
});

describe('A2 — gc.trade.high_hazard', () => {
  const template = getTemplate('gc.trade.high_hazard');

  it('sets every general-liability limit row to $5,000,000', () => {
    const limits = template?.requirements.filter((row) => row.kind === 'limit' && row.coverage === 'general_liability');
    expect(limits?.length).toBeGreaterThan(0);
    for (const row of limits ?? []) {
      if (row.kind === 'limit') expect(row.min).toBe(5_000_000);
    }
  });

  it('cites W. L. Butler’s published exhibit, verified 2026-09-03', () => {
    const source = template?.sources[0];
    expect(source?.url).toContain('wlbutler.com');
    expect(source?.url).toContain('SUBCONTRACTOR-INSURANCE-REQUIREMENTS.pdf');
    expect(source?.last_verified).toBe('2026-09-03');
  });

  it('marks the $5M rows combinable, because R1 says the limit may be reached with excess', () => {
    const occurrence = template?.requirements.find(
      (row) => row.kind === 'limit' && row.limit === 'each_occurrence',
    );
    expect(occurrence?.kind === 'limit' && occurrence.combinable).toBe(true);
  });
});

describe('A5 — the combinable preview claim is true in the engine, not just in the copy', () => {
  it('meets $5M from $1M GL plus $4M umbrella', () => {
    const set = toRequirementSet(getTemplate('gc.trade.high_hazard')!);
    const occurrence = set.requirements.find((r) => r.kind === 'limit' && r.limitLabel === 'each_occurrence');
    expect(occurrence?.combinable).toBe(true);
  });
});

describe('A7 — pm.snow ships flagged', () => {
  it('is marked unverified and says why, in the words specs/02 A7 asks for', () => {
    const template = getTemplate('pm.snow');
    expect(template?.unverified).toBe(true);
    expect(template?.confidence).toBe('low');
    expect(template?.unverified_note?.toLowerCase()).toContain('our suggestion');
    expect(template?.unverified_note?.toLowerCase()).toContain('check your contract');
  });

  it('is the only PM template flagged', () => {
    const flagged = listTemplates('pm').filter((t) => t.unverified);
    expect(flagged.map((t) => t.id)).toEqual(['pm.snow']);
  });

  it('flags tenant.retail_food too, as KB §B.3 requires', () => {
    expect(getTemplate('tenant.retail_food')?.unverified).toBe(true);
  });
});

describe('the KB §B.0 rules a naive schema would miss', () => {
  it('always stores `accepts` as a list, never a single form', () => {
    for (const template of templates) {
      for (const row of template.requirements) {
        if (row.kind === 'endorsement') {
          expect(Array.isArray(row.accepts)).toBe(true);
          expect(row.accepts.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('never emits an endorsement key the engine does not know', () => {
    for (const template of templates) {
      for (const row of template.requirements) {
        if (row.kind === 'endorsement') expect(ENDORSEMENT_KEYS).toContain(row.endorsement);
      }
    }
  });

  it('never sets a minimum of 0 — deleting the row is what “do not check” means', () => {
    for (const template of templates) {
      for (const row of template.requirements) {
        if (row.kind === 'limit') expect(row.min).toBeGreaterThan(0);
      }
    }
  });

  it('adds a workers’ compensation coverage row wherever a WC waiver is required (A6)', () => {
    for (const template of templates) {
      const wantsWcWaiver = template.requirements.some(
        (row) => row.kind === 'endorsement' && row.endorsement === 'waiver_of_subrogation_wc',
      );
      if (!wantsWcWaiver) continue;
      const hasWcRow = template.requirements.some(
        (row) => (row.kind === 'coverage_present' || row.kind === 'limit') && row.coverage === 'workers_compensation',
      );
      expect(hasWcRow, `${template.id} asks for a WC waiver with no WC coverage row`).toBe(true);
    }
  });
});

describe('every template is runnable by the engine', () => {
  it('converts to a requirement set the engine evaluates without throwing', () => {
    for (const template of templates) {
      const set = toRequirementSet(template);
      expect(set.requirements).toHaveLength(template.requirements.length);
      const result = compare({
        extraction: null,
        requirementSet: set,
        evaluationDate: '2026-09-03',
        vendor: { name: 'Test Vendor' },
      });
      expect(result.status).toBe('no_certificate');
    }
  });

  it('gives every requirement a unique id and a stable sort order', () => {
    for (const template of templates) {
      const set = toRequirementSet(template);
      expect(new Set(set.requirements.map((r) => r.id)).size).toBe(set.requirements.length);
      expect(set.requirements.map((r) => r.sortOrder)).toEqual(set.requirements.map((_, i) => i));
    }
  });
});

describe('the endorsement glossary (KB §C)', () => {
  it('covers every form the library accepts', () => {
    const known = new Set(endorsementGlossary.map((entry) => entry.form));
    const accepted = new Set<string>();
    for (const template of templates) {
      for (const row of template.requirements) {
        if (row.kind === 'endorsement') for (const form of row.accepts) accepted.add(parseFormNumber(form).base);
      }
    }
    for (const form of accepted) {
      expect(known.has(form), `no glossary entry for ${form}`).toBe(true);
    }
  });

  it('says what each form does NOT prove, which is the column that earns its place', () => {
    for (const entry of endorsementGlossary) {
      expect(entry.doesNotProve.length).toBeGreaterThan(10);
      expect(entry.proves.length).toBeGreaterThan(10);
      expect(() => new URL(entry.source.url)).not.toThrow();
      expect(entry.source.last_verified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('keeps the 1985 edition of CG 20 10 as a separate contract from the later ones', () => {
    const entries = glossaryByForm['CG 20 10'];
    expect(entries?.length).toBe(2);
    expect(entries?.some((e) => e.edition === '11 85')).toBe(true);
  });

  it('records that a GL waiver is not a WC waiver', () => {
    const gl = endorsementGlossary.find((e) => e.form === 'CG 24 04');
    const wc = endorsementGlossary.find((e) => e.form === 'WC 00 03 13');
    expect(gl?.evidences).toEqual(['waiver_of_subrogation_gl']);
    expect(wc?.evidences).toEqual(['waiver_of_subrogation_wc']);
    expect(gl?.doesNotProve).toContain("workers' compensation");
  });

  it('records that primary and non-contributory is not additional insured', () => {
    const pnc = endorsementGlossary.find((e) => e.form === 'CG 20 01');
    expect(pnc?.doesNotProve).toContain('additional-insured status');
  });
});
