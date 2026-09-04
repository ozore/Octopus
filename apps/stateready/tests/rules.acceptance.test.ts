/**
 * M5 — the acceptance criteria of `specs/05`, one test each, written FROM THE
 * SPEC rather than from the implementation.
 *
 * Every date asserted below was derived by hand from the spec's own rule table
 * and the committed record, before the engine was asked for it. They are the
 * check on whether the engine is CORRECT; `rules.golden.test.ts` is the check
 * on whether it has CHANGED. The two answer different questions and the golden
 * set is worthless without this file.
 *
 * The three deliveries `specs/05` opens with are AC2 (one state, two boards,
 * two algorithms), AC4 (even vs odd year decided by a letter in the licence
 * code) and AC6 (a contractor licence with no CE whose named master has some).
 */

import { describe, expect, it } from 'vitest';

import { getKbRecord, getLicenceType } from '../src/lib/kb/accessors';
import { derive } from '../src/lib/rules';

const TODAY = '2026-09-03';

function run(licenceTypeId: string, issuedOn: string | null, extra: Record<string, unknown> = {}) {
  const found = getLicenceType(licenceTypeId);
  if (!found) throw new Error(`no licence type ${licenceTypeId}`);
  return derive(
    {
      state: found.record.state,
      trade: found.record.trade,
      kbLicenceTypeId: licenceTypeId,
      issuedOn,
      ...extra,
    },
    found.record,
    TODAY,
  );
}

describe('AC1 — Texas ACR Class A, an anniversary rule at high confidence', () => {
  const result = run('tx.hvac.acr_contractor_class_a', '2026-03-14');

  it('renews exactly twelve months after issue', () => {
    expect(result.renewal?.dueOn).toBe('2027-03-14');
    expect(result.renewal?.source).toBe('derived');
    expect(result.renewal?.rule).toBe('anniversary');
  });

  it('carries the TDLR sentence and URL, at high confidence, unflagged', () => {
    expect(result.renewal?.citation.url).toBe('https://www.tdlr.texas.gov/acr/contractor-apply.htm');
    expect(result.renewal?.citation.text).toBe('Licenses are valid for a period of 1 year from the date of issue.');
    expect(result.renewal?.confidence).toBe('high');
    expect(result.renewal?.needsHumanCheck).toBe(false);
  });

  it('requires 8 CE hours, due with the licence', () => {
    expect(result.ce?.detail['hoursRequired']).toBe(8);
    expect(result.ce?.dueOn).toBe('2027-03-14');
  });
});

describe('AC2 — North Carolina electrical Unlimited: same state, different board, different algorithm', () => {
  const result = run('nc.electrical.unlimited', '2026-03-14');

  it('renews on its anniversary', () => {
    expect(result.renewal?.dueOn).toBe('2027-03-14');
    expect(result.renewal?.rule).toBe('anniversary');
  });

  it('requires 8 CE hours and STATES the classroom constraint verbatim', () => {
    expect(result.ce?.detail['hoursRequired']).toBe(8);
    // "At least half the hours must be earned by in-person classroom or seminar
    // attendance." The engine renders the board's sentence; it does not turn
    // "half" into a number, because that is an inference from prose and this
    // product does not make those. See `rules/ce.ts` and BUILD.md §Deviations.
    expect(String(result.ce?.detail['deliveryConstraint'])).toMatch(/classroom/i);
    expect(String(result.ce?.detail['carryover'])).toMatch(/carried forward/i);
  });

  it('shows the CE window and the renewal year as two different windows once the ontology can express it', () => {
    // `specs/05` AC2 wants 2026-07-01 → 2027-06-30, which is NOT the licence's
    // anniversary year. The record carries that only in the value's prose note
    // (`kb-data/nc-electrical.json`: "The CE licence period runs 1 July to 30
    // June"), so the engine implements the machine-readable token and the
    // knowledge base has to carry it — recorded as a KB request in BUILD.md.
    // This test proves the engine is ready: the day the token lands, AC2 passes
    // with no engine change.
    const record = structuredClone(getKbRecord('NC', 'electrical'));
    if (!record) throw new Error('nc.electrical missing');
    const licenceType = record.licence_types[0]!;
    licenceType.continuing_education.period = {
      ...licenceType.continuing_education.period,
      value: 'calendar_window:06-30',
    };
    const withWindow = derive(
      { state: 'NC', trade: 'electrical', kbLicenceTypeId: licenceType.licence_type_id, issuedOn: '2026-03-14' },
      record,
      TODAY,
    );
    expect(withWindow.ce?.dueOn).toBe('2027-06-30');
    expect(withWindow.renewal?.dueOn).toBe('2027-03-14');
    expect(withWindow.ce?.dueOn).not.toBe(withWindow.renewal?.dueOn);
  });
});

describe('AC3 — North Carolina plumbing: a fixed date, and no grace period at all', () => {
  const result = run('nc.plumbing.plumbing_contractor', '2026-03-14');

  it('renews on 31 December of the year of issue', () => {
    expect(result.renewal?.dueOn).toBe('2026-12-31');
    expect(result.renewal?.rule).toBe('fixed_date:12-31');
  });

  it('quotes the board on the absence of a grace period', () => {
    expect(result.renewal?.detail['gracePeriod']).toBe(0);
    expect(String(result.renewal?.detail['gracePeriodEvidence'])).toMatch(/NO GRACE PERIOD/);
  });

  it('emits NO continuing-education deadline, and says why in the board’s own words', () => {
    expect(result.ce).toBeNull();
    const ce = result.explanations.find((e) => e.kind === 'ce');
    expect(ce?.reason).toBe('ce_not_required');
    expect(ce?.citation?.url).toBeTruthy();
  });
});

describe('AC4 — Florida certified plumbing: even years, decided by a letter in the licence code', () => {
  it('issued 14 March 2026 renews 31 August 2026', () => {
    expect(run('fl.plumbing.certified_plumbing_contractor', '2026-03-14').renewal?.dueOn).toBe('2026-08-31');
  });

  it('issued 1 September 2026 renews 31 August 2028 — the next EVEN year, not 2027', () => {
    const result = run('fl.plumbing.certified_plumbing_contractor', '2026-09-01');
    expect(result.renewal?.dueOn).toBe('2028-08-31');
    expect(result.renewal?.dueOn).not.toBe('2027-08-31');
  });

  it('the REGISTERED licence in the same state renews in an ODD year', () => {
    const result = run('fl.plumbing.registered_plumbing_contractor', '2026-03-14');
    expect(result.renewal?.dueOn).toBe('2027-08-31');
    expect(result.renewal?.rule).toBe('fixed_date_parity:08-31:odd');
  });
});

describe('AC5 — Florida HVAC: fourteen hours is six mandates, and counting to fourteen is wrong', () => {
  const fourteenGeneral = run('fl.hvac.certified_class_a_ac', '2026-03-14', {
    ceRecords: [{ hours: 14, subject: 'general' }],
  });

  it('still shows a shortfall despite fourteen hours recorded', () => {
    expect(fourteenGeneral.ceComputation?.hoursRecorded).toBe(14);
    expect(fourteenGeneral.ceComputation?.hoursRequired).toBe(14);
    expect(fourteenGeneral.ceComputation!.hoursOutstanding).toBeGreaterThan(0);
  });

  it('itemises the shortfall by the five mandated subjects', () => {
    const subjects = fourteenGeneral.ceComputation!.subjectShortfall.map((s) => s.subject);
    for (const mandate of [
      'specialized or advanced module',
      'workplace safety',
      'business practices',
      "workers' compensation",
      'laws and rules',
    ]) {
      expect(subjects).toContain(mandate);
    }
  });

  it('is satisfied only when the hours are recorded against the subjects the board names', () => {
    const correct = run('fl.hvac.certified_class_a_ac', '2026-03-14', {
      ceRecords: [
        { hours: 1, subject: 'specialized or advanced module' },
        { hours: 1, subject: 'workplace safety' },
        { hours: 1, subject: 'business practices' },
        { hours: 1, subject: "workers' compensation" },
        { hours: 1, subject: 'laws and rules' },
        { hours: 9, subject: 'any board-approved construction-related instruction' },
      ],
    });
    expect(correct.ceComputation?.hoursOutstanding).toBe(0);
    expect(correct.ceComputation?.subjectShortfall).toHaveLength(0);
  });
});

describe('AC6 — Texas electrical: a contractor with no CE, and a master who has some', () => {
  it('the CONTRACTOR licence emits no CE deadline, with the board’s sentence quoted', () => {
    const result = run('tx.electrical.electrical_contractor', '2026-03-14');
    expect(result.ce).toBeNull();
    const ce = result.explanations.find((e) => e.kind === 'ce');
    expect(ce?.reason).toBe('ce_not_required');
    expect(ce?.citation?.text).toBe(
      'Contractors and Residential Appliance Installers are not required to complete continuing education.',
    );
    // A zero that is a FINDING, not a gap.
    expect(ce?.note).toMatch(/positive finding/i);
  });

  it('the MASTER ELECTRICIAN on the same licence owes four hours', () => {
    const result = run('tx.electrical.master_electrician', '2026-03-14');
    expect(result.ce?.detail['hoursRequired']).toBe(4);
    expect(result.ce?.dueOn).toBe('2027-03-14');
  });
});

describe('AC7 / AC7b — the honesty rule, on the record that decides it', () => {
  it('AC7: TX plumbing licence type [0] emits an UNFLAGGED medium-confidence deadline carrying its note', () => {
    const result = run('tx.plumbing.responsible_master_plumber', '2026-03-14');
    expect(result.renewal?.needsHumanCheck).toBe(false);
    expect(result.renewal?.confidence).toBe('medium');
    expect(result.renewal?.notes.length).toBeGreaterThan(0);
    expect(result.renewal?.notes.join(' ')).toMatch(/never the word 'annual'|never the word "annual"|annual/i);
  });

  it('AC7b: licence types [1] and [2] — same field, same confidence, NO note — flag', () => {
    for (const id of ['tx.plumbing.master_plumber', 'tx.plumbing.journeyman_plumber']) {
      const result = run(id, '2026-03-14');
      expect(result.renewal?.needsHumanCheck, id).toBe(true);
      expect(result.renewal?.flagReasons, id).toContain('unexplained_inference');
      // The test reads the COMMITTED record, so it starts passing on its own the
      // day someone writes those two notes — which is the incentive we want.
    }
  });
});

describe('AC8 — an uncovered state produces zero deadlines and one explanation', () => {
  const result = derive(
    { state: 'OH', trade: 'hvac', kbLicenceTypeId: null, issuedOn: '2026-03-14' },
    getKbRecord('OH', 'hvac'),
    TODAY,
  );

  it('derives nothing', () => {
    expect(result.renewal).toBeNull();
    expect(result.ce).toBeNull();
    expect(result.events).toHaveLength(0);
  });

  it('says so once, without inventing a date', () => {
    expect(result.explanations).toHaveLength(1);
    expect(result.explanations[0]?.reason).toBe('no_kb_record');
    expect(result.explanations[0]?.message).toMatch(/we will still track the dates you enter/i);
  });

  it('but a date the customer TYPED still becomes a deadline — the promise in that sentence', () => {
    // No deadline row means no alert. A licence in an uncovered state whose
    // expiry the customer typed must still be tracked and still be alerted on;
    // it simply carries no citation, because there is none.
    const entered = derive(
      { state: 'OH', trade: 'hvac', kbLicenceTypeId: null, issuedOn: '2026-03-14', expiresOn: '2027-04-01' },
      getKbRecord('OH', 'hvac'),
      TODAY,
    );
    expect(entered.renewal).toMatchObject({ dueOn: '2027-04-01', source: 'entered', needsHumanCheck: false });
    expect(entered.renewal?.citation.url).toBeNull();
    expect(entered.explanations[0]?.reason).toBe('no_kb_record');
  });
});

describe('invariant 3 — unknown means silent', () => {
  it('Florida registered electrical, whose expiry rule is null, produces NO deadline', () => {
    const result = run('fl.electrical.registered_electrical_contractor', '2026-03-14');
    expect(result.renewal).toBeNull();
    const explanation = result.explanations.find((e) => e.kind === 'renewal');
    expect(explanation?.reason).toBe('unknown_value');
    expect(explanation?.note).toBeTruthy();
  });
});

describe('invariant 1 — no derived deadline without a citation', () => {
  it('holds across every licence type in the knowledge base', () => {
    for (const state of ['TX', 'FL', 'NC'] as const) {
      for (const trade of ['hvac', 'plumbing', 'electrical'] as const) {
        const record = getKbRecord(state, trade);
        if (!record) continue;
        for (const licenceType of record.licence_types) {
          const result = derive(
            { state, trade, kbLicenceTypeId: licenceType.licence_type_id, issuedOn: '2026-03-14' },
            record,
            TODAY,
          );
          for (const deadline of [result.renewal, result.ce]) {
            if (deadline?.source === 'derived') {
              expect(deadline.citation.url, `${licenceType.licence_type_id} ${deadline.kind}`).toBeTruthy();
            }
          }
        }
      }
    }
  });
});

describe('the customer’s own date is never silently overwritten', () => {
  it('keeps what they typed, marks it entered, and surfaces the disagreement', () => {
    const result = run('tx.hvac.acr_contractor_class_a', '2026-03-14', { expiresOn: '2027-06-04' });
    expect(result.renewal?.dueOn).toBe('2027-06-04');
    expect(result.renewal?.source).toBe('entered');
    expect(result.expiryConflict).toEqual({ entered: '2027-06-04', derived: '2027-03-14' });
  });
});

describe('event deadlines — the Texas qualifier clock', () => {
  it('opens a 30-BUSINESS-day clock from the disassociation date, not 30 calendar days', () => {
    const result = run('tx.electrical.electrical_contractor', '2026-03-14', {
      qualifierDisassociatedOn: '2026-09-01',
    });
    const event = result.events.find((e) => e.kind === 'qualifier_replacement');
    // 1 September 2026 is a Tuesday; thirty business days later is 13 October 2026.
    expect(event?.dueOn).toBe('2026-10-13');
    expect(event?.citation.text).toMatch(/thirty business days/i);
  });

  it('emits nothing when no qualifier has left — an event needs a trigger', () => {
    expect(run('tx.electrical.electrical_contractor', '2026-03-14').events).toHaveLength(0);
  });
});

describe('M13 — a board-announced date roll wins over the token, and carries its own citation', () => {
  // Florida's construction board, fetched 2026-09-03: "Registered Contractors —
  // Licenses expire August 31st every odd year. However, because the 31st falls
  // on a Sunday this year, and September 1st is a holiday, the deadline has been
  // extended to September 2nd." `fixed_date_parity:08-31:odd` derives 31 August;
  // the override moves it, and the trace SAYS SO in one sentence.
  //
  // The ontology gained `expiry_overrides` mid-build and no committed record
  // carries one yet, so this runs against a fixture built from the real record.
  function withOverride() {
    const record = structuredClone(getKbRecord('FL', 'plumbing'))!;
    const registered = record.licence_types.find((lt) => lt.licence_type_id.includes('registered'))!;
    registered.expiry_overrides = [
      {
        cycle_year: 2027,
        date: '2027-09-02',
        source_url: 'https://www2.myfloridalicense.com/construction-industry/',
        evidence: 'the deadline has been extended to September 2nd',
        last_verified: '2026-09-03',
        verified_by: ['pass-a', 'pass-b'],
      },
    ];
    return { record, licenceTypeId: registered.licence_type_id };
  }

  it('replaces the derived date for its own cycle year', () => {
    const { record, licenceTypeId } = withOverride();
    const result = derive(
      { state: 'FL', trade: 'plumbing', kbLicenceTypeId: licenceTypeId, issuedOn: '2026-03-14' },
      record,
      TODAY,
    );
    expect(result.renewal?.dueOn).toBe('2027-09-02');
    expect(result.renewal?.rule).toBe('fixed_date_parity:08-31:odd + expiry_override:2027');
    expect(result.renewal?.citation.url).toBe('https://www2.myfloridalicense.com/construction-industry/');
    expect(result.renewal?.citation.text).toBe('the deadline has been extended to September 2nd');
    expect(result.renewal?.trace.map((t) => t.detail).join(' ')).toMatch(
      /rule puts this on 2027-08-31; the board has published an extension to 2027-09-02/,
    );
  });

  it('never applies outside its own cycle year', () => {
    const { record, licenceTypeId } = withOverride();
    // Issued after 31 August 2027, so the derived cycle is 2029 and the 2027
    // override must not touch it.
    const result = derive(
      { state: 'FL', trade: 'plumbing', kbLicenceTypeId: licenceTypeId, issuedOn: '2027-09-10' },
      record,
      TODAY,
    );
    expect(result.renewal?.dueOn).toBe('2029-08-31');
    expect(result.renewal?.rule).toBe('fixed_date_parity:08-31:odd');
  });
});

describe('determinism', () => {
  it('same inputs, same output', () => {
    const a = run('nc.electrical.unlimited', '2026-03-14');
    const b = run('nc.electrical.unlimited', '2026-03-14');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
