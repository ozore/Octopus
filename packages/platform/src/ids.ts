/**
 * Prefixed, sortable ids. ULID (same dependency Clausewright uses) so rows are
 * time-ordered by primary key, and a prefix so an id in a log line or a Stripe
 * metadata field says what it is without a lookup.
 */
import { ulid } from 'ulid';

export type IdPrefix =
  | 'org'
  | 'usr'
  | 'mem'
  | 'ses'
  | 'lgt'
  | 'evt'
  | 'job'
  | 'sub'
  | 'cus';

/**
 * The platform's own prefixes are typed; an app passes its own string
 * (`newId('prj')`), because product tables are the app's vocabulary and a
 * shared union would have to be edited by every app that adds a table.
 */
export function newId(prefix: IdPrefix | (string & {})): string {
  return `${prefix}_${ulid().toLowerCase()}`;
}
