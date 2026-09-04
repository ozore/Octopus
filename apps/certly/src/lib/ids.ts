/**
 * Certly's id prefixes.
 *
 * The platform's `newId(prefix)` takes any string, because product tables are
 * the app's vocabulary. Naming the prefixes here rather than typing `'ven'` at
 * eighty call sites is what makes an id in a log line, a Stripe metadata field
 * or a support ticket say what it is without a lookup — and what stops
 * `newId('vend')` and `newId('ven')` from coexisting.
 */
import { newId as platformNewId } from '@octopus/platform';

export const ID_PREFIX = {
  vendor: 'ven',
  vendorType: 'vty',
  requirementSet: 'rqs',
  requirement: 'req',
  document: 'doc',
  extraction: 'ext',
  fieldCorrection: 'fcr',
  certificate: 'cer',
  certificateInsurer: 'cin',
  coverage: 'cov',
  coverageLimit: 'clm',
  comparison: 'cmp',
  comparisonResult: 'cmr',
  uploadLink: 'lnk',
  reminder: 'rem',
  suppression: 'sup',
  emailEvent: 'eml',
  report: 'rep',
  trialConsent: 'tcs',
  audit: 'aud',
  csvImport: 'csv',
  gapReportSession: 'gap',
  gapReportDocument: 'gpd',
} as const;

/** The table names, which is what a call site knows. */
export type CertlyEntity = keyof typeof ID_PREFIX;
export type CertlyIdPrefix = (typeof ID_PREFIX)[CertlyEntity];

/**
 * `newId('vendor')` → `ven_01j…`. The argument is the ENTITY, not the prefix,
 * so a call site never has to remember that vendors are `ven` and vendor types
 * are `vty` — and a typo is a compile error rather than a second id namespace.
 */
export function newId(entity: CertlyEntity): string {
  return platformNewId(ID_PREFIX[entity]);
}
