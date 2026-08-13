/**
 * §9.5 — DUAL-INGEST DISAGREEMENT: THE BLOCKING RULE.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §9.5, which is the authority on what blocks a
 * promotion and **supersedes `ARCHITECTURE.md` §8.2 probe P4 and ADR-004's decision
 * sentence** (§0.5) — both of which give blocking power to the `standard` flag and
 * would therefore have quarantined 4,236 of 4,236 determinations on the first run
 * (**C5**, review finding CRIT-1).
 *
 * ---------------------------------------------------------------------------
 * THE FIELD LIST IS SHORT BECAUSE IT WAS MEASURED
 *
 * D5 requires that disagreement between paths blocks promotion. It does not say
 * EVERY disagreement, and §2.5's fleet measurement shows why it must not: across a
 * 200-WD random sample, one field disagrees on 100% of records, one on 5.5%, one on
 * 0.5% (and that one turned out to be our own comma-split bug), and the remaining
 * seven on none. A rule that blocks on all of them blocks everything, every night,
 * forever.
 *
 *   TIER 0  identity precondition        -> quarantine the WD. A mismatch is a bug
 *                                           in US, not a disagreement between
 *                                           publishers.        measured 0/200
 *   TIER 1  revision_number              -> blocking_variance, snapshot HELD   0/200
 *           publish_date                 -> blocking_variance, snapshot HELD   0/200
 *           active_flag                  -> blocking_variance, snapshot HELD   0/200
 *   TIER 2  G-canon, G-modtable          -> quarantine the WD          0/75, 0/200
 *   TIER 3  everything else              -> advisory_variance, never blocking
 *
 * `standard` sits in tier 3 at a **100% measured red rate**. `isStandard` is
 * constant `true` on path A across all 4,236 active records and `standard` is
 * constant `false` on path B; the "disagreement" is a fixed offset between two
 * vocabularies. A field with zero variance carries zero information, so it cannot
 * discriminate a corrupt record from a healthy one no matter how loudly it fires.
 *
 * ---------------------------------------------------------------------------
 * THE SET IS FROZEN IN CODE, NOT IN PROSE (§9.5, last paragraph)
 *
 * `assertBlockingSetFrozen` asserts the literal set equality and asserts
 * `'standard' ∉ BLOCKING_FIELDS` **by name**, because that is the specific
 * regression this whole document exists to prevent. It runs in CI and at worker
 * boot, so adding a field is a visible, reviewed diff rather than a one-word edit
 * inside a comparison function.
 */

import type { WdNumber } from '@/lib/types';

import type {
  AdvisoryField,
  AgreementStateName,
  BlockingField,
  DocumentRecord,
  IndexRecord,
  ModTable,
  ReconcileVerdict,
  VarianceRecord,
} from './types';

/** EXACTLY THREE. Changing this list changes what can halt the corpus. */
export const BLOCKING_FIELDS: readonly BlockingField[] = [
  'revision_number',
  'publish_date',
  'active_flag',
] as const;

/** Recorded, reported, never blocking, and never surfaced to a customer — we have
 *  no basis for asserting either side. */
export const ADVISORY_FIELDS: readonly AdvisoryField[] = [
  'standard',
  'county_code',
  'county_name',
  'construction_types',
  'state_code',
  'location_description',
  'publish_date_b_semantics',
] as const;

export class BlockingSetError extends Error {}

/**
 * The CI assertion. Two statements, and the second is not redundant: a future edit
 * that renamed a member could satisfy the first by accident.
 */
export function assertBlockingSetFrozen(): void {
  const expected = ['active_flag', 'publish_date', 'revision_number'];
  const actual = [...BLOCKING_FIELDS].sort();
  if (actual.length !== expected.length || actual.some((field, i) => field !== expected[i])) {
    throw new BlockingSetError(
      `BLOCKING_FIELDS must be exactly {revision_number, publish_date, active_flag}; got ` +
        `{${actual.join(', ')}}. CORPUS_DESIGN §9.5 is the authority and it supersedes ` +
        'ARCHITECTURE §8.2 P4 / ADR-004. A field earns blocking power only through §9.5\'s ' +
        'promotion procedure: a red rate measured on >=200 live records, above zero and below ' +
        '1%, with at least one red case inspected and shown to be a genuine upstream ' +
        'disagreement rather than a parser artifact.',
    );
  }
  if ((BLOCKING_FIELDS as readonly string[]).includes('standard')) {
    throw new BlockingSetError(
      "'standard' must never be in the blocking set. Measured 200/200 red — isStandard is " +
        'constant true across 4,236 of 4,236 active index records and standard is constant ' +
        'false on path B. Its ADR-004 response was QUARANTINE, so at a 100% red rate the ' +
        'corpus publishes nothing, no pin can be established, and every artifact watermarks ' +
        'DRAFT — NOT CERTIFIABLE while every probe reports itself green (C5 / CRIT-1).',
    );
  }
}

function variance(
  field: BlockingField | AdvisoryField,
  values: {
    readonly a?: string | null;
    readonly b?: string | null;
    readonly c?: string | null;
    readonly d?: string | null;
  },
  detail: Readonly<Record<string, unknown>> = {},
): VarianceRecord {
  return {
    field,
    valuePathA: values.a ?? null,
    valuePathB: values.b ?? null,
    valuePathC: values.c ?? null,
    valuePathD: values.d ?? null,
    detail,
  };
}

export interface ReconcileInput {
  readonly requestedWdNumber: WdNumber;
  readonly revision: number;
  /** Absent for archived backfill, where path A carries no record (§9.5's
   *  missing-path rules). Absence is NOT a disagreement. */
  readonly index: IndexRecord | null;
  readonly document: DocumentRecord;
  /** Path D, from the determination's own text. */
  readonly headerWdNumber: WdNumber;
  readonly headerDate: string;
  readonly modTable: ModTable;
  /** Path C's canonical hash, when the archive was fetched. `null` is tolerated
   *  with `single_path` for backfill only — never for a revision that will become
   *  current. */
  readonly archiveCanonicalSha256: string | null;
  readonly countyNamesFromProse: readonly string[];
  /**
   * True when this revision is the WD's current one. It gates the path-B date
   * comparison and nothing else — see the `publish_date_b_semantics` note below.
   */
  readonly isCurrentRevision: boolean;
}

/**
 * Field-scoped reconciliation across paths A, B, C and D.
 *
 * What "blocks" means, precisely (§9.5): a blocking variance on WD X does NOT
 * remove X from the corpus. The NEW revision of X is not promoted, X's previous
 * promoted revision remains the mirror's answer, X's rate assertions narrow to
 * that revision with its date, and the snapshot as a whole goes HELD so the
 * freshness clock keeps running. Never publish either side of a disagreement.
 */
export function reconcile(input: ReconcileInput): ReconcileVerdict {
  const { document, index, requestedWdNumber, revision } = input;
  const blocking: VarianceRecord[] = [];
  const advisory: VarianceRecord[] = [];

  // ---- TIER 0 — identity preconditions. Not variances at all. ----
  if (document.wdNumber !== requestedWdNumber || input.headerWdNumber !== requestedWdNumber) {
    return {
      wdNumber: requestedWdNumber,
      revision,
      agreement: 'blocking_variance',
      blocking: [],
      advisory: [],
      quarantine: 'identity_mismatch',
      detail:
        `requested ${requestedWdNumber}; path B answered ${document.wdNumber}; the determination's ` +
        `own header names ${input.headerWdNumber}. We fetched or parsed the wrong document — a bug ` +
        'in us, not a disagreement between publishers.',
    };
  }
  if (document.revisionNumber !== revision) {
    return {
      wdNumber: requestedWdNumber,
      revision,
      agreement: 'blocking_variance',
      blocking: [],
      advisory: [],
      quarantine: 'identity_mismatch',
      detail: `requested revision ${revision}; path B answered ${document.revisionNumber}`,
    };
  }

  // ---- TIER 2 — per-WD integrity gates. They quarantine ONE determination. ----
  if (
    input.archiveCanonicalSha256 !== null &&
    input.archiveCanonicalSha256 !== document.canonicalSha256
  ) {
    return {
      wdNumber: requestedWdNumber,
      revision,
      agreement: 'blocking_variance',
      blocking: [],
      advisory: [],
      quarantine: 'canon_mismatch',
      detail:
        `G-canon: path B canonical ${document.canonicalSha256.slice(0, 12)} != path C canonical ` +
        `${input.archiveCanonicalSha256.slice(0, 12)}`,
    };
  }

  // ---- TIER 1 — the blocking set. Exactly three fields, and no more. ----
  // Path D's last modification row is a full participant here: it is the only
  // publisher-authored assertion in the pipeline (C4), so the revision comparison
  // is A x B x D rather than A x B.
  if (input.modTable.last !== revision) {
    blocking.push(
      variance(
        'revision_number',
        { a: index ? String(index.revisionNumber) : null, b: String(document.revisionNumber), d: String(input.modTable.last) },
        { source: 'path D modification table last row' },
      ),
    );
  }
  // Gated on `isCurrentRevision` for the same reason as the dates below, and it is
  // C2 stated as code: path A holds **one record per WD NUMBER**, whose
  // `revisionNumber` is the HIGH-WATER MARK rather than an enumeration. On a
  // backfilled revision 0 the index will say 2, and that is not a disagreement —
  // it is the index answering a different question.
  if (input.isCurrentRevision && index && index.revisionNumber !== document.revisionNumber) {
    blocking.push(
      variance('revision_number', {
        a: String(index.revisionNumber),
        b: String(document.revisionNumber),
        d: String(input.modTable.last),
      }),
    );
  }

  // `publish_date` is compared across BOTH of path A's date fields (epoch-ms
  // `publishDate` and offset-ISO `modifiedDate`, both normalised to an Eastern
  // date), path B's bare date, and path D's header — measured 0/200 on each.
  //
  // MEASURED WHILE BUILDING THIS, AND NOT IN THE SPECIFICATION. §2.5 measured the
  // publish_date comparison at 0/200 — but explicitly "fetching path B at each WD's
  // CURRENT revision". Path B behaves differently on a superseded one: `VA20260195`
  // r0 answers `publishDate: 2026-05-17` while its own header says `01/02/2026`,
  // and revision 1 published 2026-05-18. Path B's field is the revision's LAST DAY
  // OF EFFECT, not its publication date.
  //
  // This matters more than it looks. The historical backfill (§9.2's revision walk,
  // which is C2's whole point and the basis of the eighteen-month reproduction)
  // fetches NOTHING BUT superseded revisions. Comparing the two fields there would
  // raise a tier-1 blocking variance on every single one, and §3.3's
  // `wd_rev_dates CHECK (header_date = publish_date)` would refuse the write
  // outright — so `publish_date` is stored from path D's header, which is the
  // publisher's own assertion of when the revision published.
  if (input.isCurrentRevision) {
    if (input.headerDate !== document.publishDate) {
      blocking.push(variance('publish_date', { b: document.publishDate, d: input.headerDate }));
    }
  } else if (input.headerDate !== document.publishDate) {
    advisory.push(
      variance(
        'publish_date_b_semantics',
        { b: document.publishDate, d: input.headerDate },
        {
          note:
            "path B's publishDate on a superseded revision is its last day of effect, not its " +
            'publication date; the two are different quantities and the header governs',
        },
      ),
    );
  }
  if (index) {
    for (const [label, value] of [
      ['publishDate', index.publishDate],
      ['modifiedDate', index.modifiedDate],
    ] as const) {
      // Path A carries ONE record per WD number, so its dates describe the CURRENT
      // revision. Comparing them against a superseded revision is the same category
      // error as above.
      if (input.isCurrentRevision && value !== null && value !== input.headerDate) {
        blocking.push(
          variance(
            'publish_date',
            { a: value, b: document.publishDate, d: input.headerDate },
            { indexField: label },
          ),
        );
      }
    }
    if (input.isCurrentRevision && index.isActive !== document.active) {
      blocking.push(
        variance('active_flag', { a: String(index.isActive), b: String(document.active) }),
      );
    }
  }

  // ---- TIER 3 — advisory. Recorded, reported, never blocking. ----
  if (index) {
    // THE 100%-RED FIELD. Recorded here so the variance is auditable and the
    // register's red rate can be re-measured — and nowhere else, with no power.
    if (index.isStandard !== null && document.standard !== null && index.isStandard !== document.standard) {
      advisory.push(
        variance(
          'standard',
          { a: String(index.isStandard), b: String(document.standard) },
          {
            note:
              'a fixed offset between two GSA vocabularies, not a fact about this determination; ' +
              'measured 200/200 red and withdrawn from the blocking set (C5)',
          },
        ),
      );
    }

    const indexCodes = new Set(index.counties.map((c) => c.code));
    const docCodes = new Set(document.locationMapping.flatMap((m) => m.counties));
    if (indexCodes.size > 0 && docCodes.size > 0) {
      const overlap = [...indexCodes].filter((code) => docCodes.has(code)).length;
      if (overlap !== indexCodes.size || indexCodes.size !== docCodes.size) {
        advisory.push(
          variance(
            'county_code',
            { a: [...indexCodes].join(','), b: [...docCodes].join(',') },
            {
              overlap,
              note: 'a code namespace we never read — §6.1 makes the prose authoritative for scope',
            },
          ),
        );
      }
    }

    if (input.countyNamesFromProse.length > 0 && index.counties.length > 0) {
      const proseSet = new Set(input.countyNamesFromProse.map((n) => n.toUpperCase()));
      const indexSet = new Set(
        index.counties.map((c) => c.value.replace(/\*+/g, '').trim().toUpperCase()),
      );
      const missing = [...indexSet].filter((n) => !proseSet.has(n));
      if (missing.length > 0 || proseSet.size !== indexSet.size) {
        advisory.push(
          variance(
            'county_name',
            { a: [...indexSet].join('|'), d: [...proseSet].join('|') },
            {
              missing,
              note:
                'the only red this probe ever produced fleet-wide was our own comma-split bug on ' +
                'DC20260001; scope errors are caught by §6.1\'s unresolved rule instead',
            },
          ),
        );
      }
    }

    const indexTypes = new Set(index.constructionTypes.map((t) => t.toLowerCase()));
    const docTypes = new Set(document.constructionTypes.map((t) => t.toLowerCase()));
    if (
      indexTypes.size !== docTypes.size ||
      [...indexTypes].some((t) => !docTypes.has(t))
    ) {
      advisory.push(
        variance('construction_types', {
          a: [...indexTypes].join(','),
          b: [...docTypes].join(','),
        }),
      );
    }

    const stateFromNumber = requestedWdNumber.slice(0, 2);
    if (index.stateCode !== null && index.stateCode !== stateFromNumber) {
      advisory.push(variance('state_code', { a: index.stateCode, b: stateFromNumber }));
    }
  }

  const agreement: AgreementStateName =
    blocking.length > 0
      ? 'blocking_variance'
      : index === null
        ? 'single_path'
        : advisory.length > 0
          ? 'advisory_variance'
          : 'agreed';

  return {
    wdNumber: requestedWdNumber,
    revision,
    agreement,
    blocking,
    advisory,
    quarantine: null,
    detail: null,
  };
}
