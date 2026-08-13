/**
 * Export — the right to know, implemented as a button.
 *
 * Spec: USER_JOURNEY.md §12.1 (the bundle, file by file), §11.2 and ARCHITECTURE.md
 * §9.1 (export is open in EVERY money state, including `restricted` and `archived`),
 * §5.5 ("The customer receives the full export before closure").
 *
 * THREE PROPERTIES, EACH LOAD-BEARING.
 *
 * 1. **No entitlement check.** There is no parameter on any function in this file
 *    that could refuse an export, and that is deliberate rather than an omission:
 *    `deriveEntitlement` returns `canExport: true` in every branch, and a second
 *    place that could say otherwise would eventually say otherwise. Non-payment
 *    never closes the archive.
 *
 * 2. **`provenance.json` is byte-identical to the JSON rendered into the artifact.**
 *    §12.1: "so the export is self-verifying: the PDF and the metadata cannot
 *    disagree." We copy `artifacts.provenance` verbatim rather than re-deriving it,
 *    because a re-derivation is a second implementation and a second implementation
 *    is a disagreement waiting for a customer to find.
 *
 * 3. **No full Social Security number leaves in the tabular files.** `payroll_lines.csv`
 *    carries `ssn_last4`, which is the individually identifying number the federal
 *    rule requires; the nine-digit number exists in exactly one column in one table
 *    and in the CA eCPR XML, and both are handled as PII-class objects (§11.3, §5.4).
 *
 * THE SINK IS A PORT because this module must run in the test suite with no object
 * store, no network and no ZIP dependency. `createRecordingSink` collects the
 * entries in memory, so a test asserts the SHAPE of the bundle — which is what
 * §12.1 specifies — rather than the bytes of a compressor.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db } from '../../db';
import { withTenant, accountId as brandAccountId } from '../../db/tenant';
import { sha256Hex } from '../ids';
import { systemClock, type Clock } from '../clock';

export interface ExportEntry {
  /** Path inside the bundle, exactly as §12.1 draws the tree. */
  readonly path: string;
  readonly sha256: string;
  readonly byteSize: number;
  /** `inline` — generated here, bytes included. `object` — an artifact in the
   *  object store, addressed by its key and its stored digest. */
  readonly source: 'inline' | 'object';
  readonly objectKey?: string;
  readonly filingId?: string;
}

export interface ExportSink {
  put(entry: { readonly path: string; readonly bytes: string }): Promise<void>;
}

export function createRecordingSink(): ExportSink & {
  readonly files: ReadonlyMap<string, string>;
} {
  const files = new Map<string, string>();
  return {
    files,
    async put(entry) {
      files.set(entry.path, entry.bytes);
    },
  };
}

export interface ExportBundle {
  readonly exportKey: string;
  readonly accountId: string;
  readonly generatedAt: Date;
  readonly entries: readonly ExportEntry[];
  readonly filingCount: number;
  readonly artifactBytes: number;
}

/** §12.1's README, which states what we no longer hold. It is part of the bundle
 *  because a customer reading the export a year later is the reader who most needs
 *  to know what is NOT in it. */
export const EXPORT_README = `RATEPIN EXPORT

manifest.json          every file in this bundle, its sha256 and its filing id.
filings/<week>/        one directory per filing.
  wh347.pdf            the federal weekly transmittal as we rendered it.
  ecpr.xml             California eCPR, where one was generated. Contains full
                       Social Security numbers. Treat it as payroll PII.
  exceptions.pdf       every line we could not resolve, and why.
  provenance.json      the wage determination number, revision and publication
                       date this filing's rates came from, the corpus snapshot,
                       the schema hash, the engine version and the build. This
                       file is byte-identical to the provenance block rendered
                       into the artifact itself.
payroll_lines.csv      every line we computed from, with the last four digits of
                       each Social Security number and never the full number.
projects.csv           every project, and every wage-determination pin with its
                       revision and publication date.
classification_memory.csv   normalized payroll title -> classification, per group.

WHAT WE DO NOT HOLD, AND NEVER DID
  We do not run your payroll, hold your bank details, file anything on your
  behalf, or hold credentials for any agency portal.

WHAT YOU ARE REQUIRED TO KEEP
  29 CFR 5.5(a)(3)(i)(A) requires payroll records to be preserved for at least
  three years after all work on the prime contract is completed. That obligation
  is yours and is not affected by anything you do with this account.
`;

interface ArtifactRow {
  readonly id: string;
  readonly filing_id: string;
  readonly kind: string;
  readonly sha256_hex: string;
  readonly r2_key: string;
  readonly byte_size: number | string;
  readonly provenance: Record<string, unknown> | null;
  readonly week_ending: string;
  readonly project_name: string;
}

const ARTIFACT_FILENAME: Readonly<Record<string, string>> = {
  wh347_pdf: 'wh347.pdf',
  statement_of_compliance: 'statement-of-compliance.pdf',
  ecpr_xml: 'ecpr.xml',
  exception_report: 'exceptions.pdf',
  portal_bundle: 'portal-bundle.zip',
  rate_card: 'rate-card.pdf',
};

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function csv(rows: readonly (readonly (string | number | null)[])[]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell === null) return '';
          const text = String(cell);
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(','),
    )
    .join('\n');
}

/**
 * Build the bundle. Reads inside `withTenant`, so the export of one account cannot
 * contain a row of another's even if the account id were wrong — the policies would
 * return nothing rather than somebody else's payroll.
 */
export async function buildExport(
  db: Db,
  account: string,
  deps: { readonly sink: ExportSink; readonly clock?: Clock },
): Promise<ExportBundle> {
  const clock = deps.clock ?? systemClock;
  const generatedAt = clock.now();
  const entries: ExportEntry[] = [];

  const put = async (path: string, bytes: string, filingId?: string): Promise<void> => {
    await deps.sink.put({ path, bytes });
    entries.push({
      path,
      sha256: sha256Hex(bytes),
      byteSize: Buffer.byteLength(bytes, 'utf8'),
      source: 'inline',
      ...(filingId === undefined ? {} : { filingId }),
    });
  };

  await withTenant(db, { accountId: brandAccountId(account) }, async (tx) => {
    const artifacts = rowsOf<ArtifactRow>(
      await tx.execute(sql`
        SELECT a.id, a.filing_id, a.kind::text AS kind, encode(a.sha256, 'hex') AS sha256_hex,
               a.r2_key, a.byte_size, a.provenance,
               to_char(f.week_ending, 'YYYY-MM-DD') AS week_ending, p.name AS project_name
          FROM artifacts a
          JOIN filings f  ON f.id = a.filing_id
          JOIN projects p ON p.id = f.project_id
         WHERE a.account_id = ${account}::uuid
         ORDER BY f.week_ending, p.name, a.kind
      `),
    );

    const filings = new Set<string>();
    let artifactBytes = 0;
    for (const artifact of artifacts) {
      const dir = `filings/${artifact.week_ending}-${slug(artifact.project_name)}`;
      const name = ARTIFACT_FILENAME[artifact.kind] ?? `${artifact.kind}.bin`;
      filings.add(artifact.filing_id);
      artifactBytes += Number(artifact.byte_size);
      entries.push({
        path: `${dir}/${name}`,
        sha256: artifact.sha256_hex,
        byteSize: Number(artifact.byte_size),
        source: 'object',
        objectKey: artifact.r2_key,
        filingId: artifact.filing_id,
      });
      // Byte-identical to what was rendered INTO the artifact — copied, not rebuilt.
      await put(
        `${dir}/provenance.json`,
        `${JSON.stringify(artifact.provenance ?? {}, null, 2)}\n`,
        artifact.filing_id,
      );
    }

    const lines = rowsOf<Record<string, string | number | null>>(
      await tx.execute(sql`
        SELECT to_char(w.week_ending, 'YYYY-MM-DD') AS week_ending,
               p.name AS project_name,
               wk.last_name, wk.first_name, wk.ssn_last4,
               ww.status, l.ordinal, l.raw_title, l.class_wd_number, l.class_revision,
               l.class_name_norm, l.resolved_at_level::text AS resolved_at_level,
               l.cash_rate_milli, l.cash_in_lieu_milli
          FROM payroll_lines l
          JOIN payroll_worker_weeks ww ON ww.id = l.worker_week_id
          JOIN payroll_weeks w  ON w.id = ww.week_id
          JOIN projects p       ON p.id = w.project_id
          JOIN workers wk       ON wk.id = ww.worker_id
         WHERE l.account_id = ${account}::uuid
         ORDER BY w.week_ending, p.name, wk.last_name, l.ordinal
      `),
    );
    await put(
      'payroll_lines.csv',
      `${csv([
        [
          'week_ending',
          'project',
          'last_name',
          'first_name',
          'ssn_last4',
          'status',
          'line',
          'raw_title',
          'wd_number',
          'wd_revision',
          'classification',
          'resolved_at_level',
          'cash_rate_milli',
          'cash_in_lieu_milli',
        ],
        ...lines.map((r) => Object.values(r) as (string | number | null)[]),
      ])}\n`,
    );

    const projects = rowsOf<Record<string, string | number | null>>(
      await tx.execute(sql`
        SELECT p.name, p.state_code, p.county_name, p.construction_type::text AS construction_type,
               p.funding_source, p.contract_value_band::text AS contract_value_band,
               pin.wd_number, pin.revision,
               to_char(pin.wd_published_date, 'YYYY-MM-DD') AS wd_published_date,
               to_char(pin.pinned_at, 'YYYY-MM-DD') AS pinned_at
          FROM projects p
          LEFT JOIN wd_pins pin ON pin.project_id = p.id
         WHERE p.account_id = ${account}::uuid
         ORDER BY p.name, pin.pinned_at
      `),
    );
    await put(
      'projects.csv',
      `${csv([
        [
          'project',
          'state',
          'county',
          'construction_type',
          'funding_source',
          'contract_value_band',
          'wd_number',
          'wd_revision',
          'wd_published_date',
          'pinned_at',
        ],
        ...projects.map((r) => Object.values(r) as (string | number | null)[]),
      ])}\n`,
    );

    const memory = rowsOf<Record<string, string | number | null>>(
      await tx.execute(sql`
        SELECT o.title_norm, o.title_raw, o.wd_number, o.revision, o.chosen_class_norm,
               o.chosen_identifier, o.resolved_at_level::text AS resolved_at_level,
               to_char(o.decided_at, 'YYYY-MM-DD') AS decided_at
          FROM crosswalk_observation o
         WHERE o.account_id = ${account}::uuid
         ORDER BY o.title_norm, o.decided_at
      `),
    );
    await put(
      'classification_memory.csv',
      `${csv([
        [
          'title_norm',
          'title_raw',
          'wd_number',
          'wd_revision',
          'classification',
          'identifier',
          'resolved_at_level',
          'decided_at',
        ],
        ...memory.map((r) => Object.values(r) as (string | number | null)[]),
      ])}\n`,
    );

    await put('README.txt', EXPORT_README);

    void filings;
    void artifactBytes;
  });

  const filingIds = new Set(entries.map((e) => e.filingId).filter((id): id is string => id !== undefined));
  const artifactBytes = entries
    .filter((e) => e.source === 'object')
    .reduce((total, e) => total + e.byteSize, 0);

  const exportKey = `exports/${account}/${generatedAt.toISOString().replace(/[:.]/g, '-')}.zip`;
  const manifest = {
    export_key: exportKey,
    account_id: account,
    generated_at: generatedAt.toISOString(),
    filing_count: filingIds.size,
    files: entries.map((e) => ({
      path: e.path,
      sha256: e.sha256,
      byte_size: e.byteSize,
      source: e.source,
      ...(e.objectKey === undefined ? {} : { object_key: e.objectKey }),
      ...(e.filingId === undefined ? {} : { filing_id: e.filingId }),
    })),
  };
  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
  await deps.sink.put({ path: 'manifest.json', bytes: manifestJson });

  return {
    exportKey,
    accountId: account,
    generatedAt,
    entries: [
      {
        path: 'manifest.json',
        sha256: sha256Hex(manifestJson),
        byteSize: Buffer.byteLength(manifestJson, 'utf8'),
        source: 'inline',
      },
      ...entries,
    ],
    filingCount: filingIds.size,
    artifactBytes,
  };
}
