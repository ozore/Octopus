/**
 * §10.6 — THE BLOCKING-PROBE REGISTER.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §10.6, and invariant 7: **no probe blocks without a
 * measured red rate recorded here.** A probe with no row in this register is
 * advisory by default, whatever its section says.
 *
 * This is the code-side mirror of the `blocking_probe_register` table seeded in
 * `drizzle/0000_init.sql`. Both exist because they do different jobs: the table is
 * written by the quarterly re-measurement job (a blocking probe whose red rate has
 * crossed 1% DISARMS ITSELF), and this constant is what CI asserts against, so a
 * new gate cannot be added to the ingest code without a reviewed diff here.
 *
 * ---------------------------------------------------------------------------
 * THE FOUR RULES THAT GOVERN THE TABLE, RESTATED BECAUSE THEY ARE COUNTER-INTUITIVE
 *
 * 1. **A red rate above 1% on a blocking probe is a SPECIFICATION BUG, not an
 *    incident.** It is fixed by changing the specification, never by working
 *    through a quarantine queue — which would be a human minute per determination
 *    and is forbidden by A6 regardless of how the arithmetic came out. Both
 *    withdrawn rows below were found that way, and a third was found while building
 *    the parser (see `WITHDRAWN_CLASS_NAME_200`).
 *
 * 2. **A red rate of exactly zero does not license blocking on its own.** It
 *    licenses KEEPING blocking power for a probe that already earns it structurally
 *    — a canonical-hash mismatch or a modification table that contradicts its own
 *    revision is a corrupt copy BY DEFINITION, whatever its frequency. It does not
 *    license GRANTING blocking power to a field we merely believe should agree.
 *    Zero red and 100% red are the same epistemic state: no demonstrated
 *    discrimination.
 *
 * 3. **Stringency scales with the blast radius of the response.** `standard` had to
 *    be disarmed because its response was QUARANTINE — publish neither path — which
 *    at a 100% red rate means the corpus publishes nothing. Probes 1, 2 and 3
 *    respond with HELD and FROZEN, and neither blocks a filing, so they run armed
 *    from night one with honest blanks for their rates.
 *
 * 4. **The register is re-measured on a schedule, because it is a measurement of
 *    somebody else's system.** A probe that has silently started firing on
 *    everything is indistinguishable from an upstream vocabulary change, and the
 *    C5 failure mode — a green-looking system that emits nothing — is worse than
 *    the failure it was guarding against.
 */

export type BlockingPower =
  | 'snapshot_held'
  | 'quarantine_wd'
  | 'frozen'
  | 'refuses_write'
  | 'blocks_build'
  | 'none';

export interface RegisterRow {
  readonly probeKey: string;
  readonly specSection: string;
  readonly blockingPower: BlockingPower;
  /** `null` is an HONEST BLANK, not an absent row: probes 1–3 fire on a change
   *  BETWEEN nights and their rates enter from a 60-night rolling window (H10). */
  readonly redRatePct: number | null;
  readonly sampleSize: number | null;
  readonly measuredOn: string | null;
  readonly armed: boolean;
  readonly withdrawn: boolean;
  readonly note: string;
}

export const RED_RATE_CEILING_PCT = 1.0;

export const BLOCKING_PROBE_REGISTER: readonly RegisterRow[] = [
  {
    probeKey: 'revision_number_disagreement',
    specSection: '9.5',
    blockingPower: 'snapshot_held',
    redRatePct: 0,
    sampleSize: 200,
    measuredOn: '2026-08-13',
    armed: true,
    withdrawn: false,
    note: 'Tier 1 blocking set. Compared across A x B x D (the mod table\'s last row).',
  },
  {
    probeKey: 'publish_date_disagreement',
    specSection: '9.5',
    blockingPower: 'snapshot_held',
    redRatePct: 0,
    sampleSize: 200,
    measuredOn: '2026-08-13',
    armed: true,
    withdrawn: false,
    note: 'Tier 1. A publishDate (epoch-ms) and modifiedDate both normalise onto B\'s bare date.',
  },
  {
    probeKey: 'active_flag_disagreement',
    specSection: '9.5',
    blockingPower: 'snapshot_held',
    redRatePct: 0,
    sampleSize: 200,
    measuredOn: '2026-08-13',
    armed: true,
    withdrawn: false,
    note: 'Tier 1.',
  },
  {
    probeKey: 'tier0_identity_precondition',
    specSection: '9.5',
    blockingPower: 'quarantine_wd',
    redRatePct: 0,
    sampleSize: 200,
    measuredOn: '2026-08-13',
    armed: true,
    withdrawn: false,
    note: 'Not a variance: a mismatch means we fetched or parsed the wrong document.',
  },
  {
    probeKey: 'g_canon_b_vs_c',
    specSection: '9.4',
    blockingPower: 'quarantine_wd',
    redRatePct: 0,
    sampleSize: 75,
    measuredOn: '2026-08-13',
    armed: true,
    withdrawn: false,
    note:
      'Canonical equality across paths B and C. Re-verified on VA20260195 r2 while building: ' +
      '12,645 chars both sides, sha256 afd535b9… — but ONLY when path C is decoded as UTF-8 ' +
      'with lossy replacement, matching what path B\'s JSON transport already did to the ' +
      'cp1252 curly quotes. Decoded as cp1252 it is red on every determination carrying the ' +
      'WHD legend.',
  },
  {
    probeKey: 'g_modtable_suffix',
    specSection: '9.4',
    blockingPower: 'quarantine_wd',
    redRatePct: 0,
    sampleSize: 200,
    measuredOn: '2026-08-13',
    armed: true,
    withdrawn: false,
    note: 'C6 suffix form: contiguous, within 0..revision, last row == revision, dates non-decreasing.',
  },
  {
    probeKey: 'wd_rev_modtable_checks',
    specSection: '3.3',
    blockingPower: 'refuses_write',
    redRatePct: 0,
    sampleSize: 200,
    measuredOn: '2026-08-13',
    armed: true,
    withdrawn: false,
    note: 'The three CHECK constraints behind G-modtable.',
  },
  {
    probeKey: 'probe_1_count_delta',
    specSection: '10.1',
    blockingPower: 'snapshot_held',
    redRatePct: null,
    sampleSize: null,
    measuredOn: null,
    armed: true,
    withdrawn: false,
    note: 'Fires between nights; rate enters from a 60-night rolling window (H10). Never blocks a filing.',
  },
  {
    probeKey: 'probe_1_zero_total_precondition',
    specSection: '10.1',
    blockingPower: 'snapshot_held',
    redRatePct: 0,
    sampleSize: 1,
    measuredOn: '2026-08-13',
    armed: true,
    withdrawn: false,
    note: 'totalElements:0 with HTTP 200, reproducible at page=99&size=100 and checked in as a fixture.',
  },
  {
    probeKey: 'probe_2_alias_and_count',
    specSection: '10.2',
    blockingPower: 'frozen',
    redRatePct: null,
    sampleSize: null,
    measuredOn: null,
    armed: true,
    withdrawn: false,
    note: 'Fires per alias roll; blank until observed twice (H10). Suppresses new assertions only.',
  },
  {
    probeKey: 'probe_3_hash_no_revision_bump',
    specSection: '10.3',
    blockingPower: 'frozen',
    redRatePct: null,
    sampleSize: null,
    measuredOn: null,
    armed: true,
    withdrawn: false,
    note: 'Fires per republication; blank until observed (H10). Suppresses new assertions only.',
  },
  {
    probeKey: 'probe_4_publisher_revision',
    specSection: '10.4',
    blockingPower: 'none',
    redRatePct: null,
    sampleSize: null,
    measuredOn: null,
    armed: true,
    withdrawn: false,
    note: 'By design raises an alert and never blocks: a fresher-than-expected revision is good news.',
  },
  {
    probeKey: 'g_parse_six_rules',
    specSection: '4.4',
    blockingPower: 'quarantine_wd',
    redRatePct: null,
    sampleSize: null,
    measuredOn: null,
    armed: true,
    withdrawn: false,
    note: 'Not yet measured — needs the first full-corpus parse (H3, H10).',
  },
  {
    probeKey: 'g_canary_golden_suite',
    specSection: '9.4',
    blockingPower: 'blocks_build',
    redRatePct: 0,
    sampleSize: null,
    measuredOn: '2026-08-13',
    armed: true,
    withdrawn: false,
    note: 'Zero by construction on a frozen corpus. Blocks the build as well as the corpus (G1).',
  },

  // --- WITHDRAWN. These rows stay: deleting the evidence of a mistake is how the
  // --- mistake comes back.
  {
    probeKey: 'standard_flag_disagreement',
    specSection: '9.5',
    blockingPower: 'none',
    redRatePct: 100,
    sampleSize: 200,
    measuredOn: '2026-08-13',
    armed: false,
    withdrawn: true,
    note:
      'WITHDRAWN. Red on 200/200; isStandard constant true across 4,236 of 4,236 active index ' +
      'records and standard constant false on path B. A fixed offset between two vocabularies, ' +
      'carrying zero information. Its response was QUARANTINE, so at a 100% red rate the corpus ' +
      'publishes nothing and the product emits nothing (C5 / CRIT-1).',
  },
  {
    probeKey: 'mod_table_rows_eq_revision_plus_one',
    specSection: '3.3',
    blockingPower: 'none',
    redRatePct: 17,
    sampleSize: 200,
    measuredOn: '2026-08-13',
    armed: false,
    withdrawn: true,
    note:
      'WITHDRAWN. Red on 34/200: WHD declines to print modification 0 on 17.0% of a live sample. ' +
      'Being a CHECK rather than a probe it would have aborted the ingest transaction rather ' +
      'than degrading (C6). Replaced by the three-constraint suffix form. Reproduced by two ' +
      'checked-in fixtures: LA20260005 r2 prints rows 1-2, DC20260001 r5 prints rows 3-5.',
  },
  {
    probeKey: 'class_name_max_200',
    specSection: '4.1 / 4.4',
    blockingPower: 'none',
    redRatePct: 6.7,
    sampleSize: 164,
    measuredOn: '2026-08-13',
    armed: false,
    withdrawn: true,
    note:
      'WITHDRAWN, and NEW — found while building the parser, not present in CORPUS_DESIGN. §4.1 ' +
      'caps the name buffer at 200 characters and §4.4 rule 5 quarantines any class_name longer ' +
      'than 200. Measured on DC20260001 r5, the active determination for the entire District of ' +
      'Columbia: the longest GENUINE classification name is 740 characters and 11 of 164 sampled ' +
      'classifications exceed 200 (6.7%). Implemented literally, the capital\'s determination is ' +
      'quarantined and never reaches the lookup index. Replaced by a 1,000-character bound with ' +
      'the measurement recorded; small sample, registered under H3.',
  },
] as const;

export class RegisterError extends Error {}

/**
 * CI assertion. Rule 1 as an executable statement: an ARMED blocking probe whose
 * measured red rate exceeds 1% is a specification bug, and the build says so rather
 * than the quarantine queue filling up overnight.
 */
export function assertRegisterConsistent(
  rows: readonly RegisterRow[] = BLOCKING_PROBE_REGISTER,
): void {
  for (const row of rows) {
    if (row.withdrawn) {
      if (row.armed || row.blockingPower !== 'none') {
        throw new RegisterError(
          `${row.probeKey} is withdrawn but still armed or still carries blocking power`,
        );
      }
      continue;
    }
    if (row.armed && row.blockingPower !== 'none' && row.redRatePct !== null) {
      if (row.redRatePct > RED_RATE_CEILING_PCT) {
        throw new RegisterError(
          `${row.probeKey} is armed with blocking power ${row.blockingPower} at a measured red ` +
            `rate of ${row.redRatePct}%, above the ${RED_RATE_CEILING_PCT}% ceiling. That is a ` +
            'specification bug, not an incident: fix the specification, never the quarantine queue.',
        );
      }
    }
    if (row.redRatePct !== null && row.sampleSize === null && row.probeKey !== 'g_canary_golden_suite') {
      throw new RegisterError(`${row.probeKey} states a red rate with no denominator`);
    }
  }
}

export function registerRow(probeKey: string): RegisterRow | undefined {
  return BLOCKING_PROBE_REGISTER.find((row) => row.probeKey === probeKey);
}
