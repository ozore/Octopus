/**
 * THE NINE DIGITS — the only module in this product that can read one out of the
 * database, and the only one that can put one in.
 *
 * AUTHORITY: `ARCHITECTURE.md` §11.3 (the SSN lives in exactly one column, under a
 * per-tenant data key wrapped by a root key held outside the database; "the WH-347
 * renderer can only read `ssn_last4` — it has no access to the decrypt function"),
 * §5.4 (the eCPR XML is PII-class and carries its own retention clock),
 * `USER_JOURNEY.md` §5.2 (the SSN moment) and §10.2 (one filing, two artifacts, two
 * statuses), 29 CFR 5.5(a)(3)(ii)(B) against the CA eCPR XSD's `ssn` = `[0-9]{9}`.
 *
 * Build review NEW-7 and security M-2: before this file, `workers.ssn_ciphertext`
 * had no writer, no cipher and no key, `key_version` was a constant 1, and the eCPR
 * emitter read the column as if it held plaintext digits. Both halves are closed
 * here — the column is a real AES-256-GCM ciphertext, and there is a form that
 * writes it.
 *
 * ===========================================================================
 * HOW THE FEDERAL PATH IS KEPT FROM THE NINE DIGITS — ENFORCED, NOT ASSERTED
 *
 * Four mechanisms, none of which is a code review or a comment. Each one is stated
 * with the thing that would have to change for it to stop holding, because a
 * guarantee whose failure mode is unnamed is a slogan.
 *
 * 1. **THE TYPE HAS NO SLOT.** `Wh347WorkerIdentity` has no field of type `Ssn9`,
 *    and `IdentifyingNumber` — the only identity the federal render model holds —
 *    has one constructor, `identifyingNumber`, which THROWS on nine digits rather
 *    than truncating (`src/artifacts/identity.ts`). Routing a decrypted value to the
 *    federal path is not a leak that review has to catch; it is a program that does
 *    not compile, and if it is smuggled through as `string` it is a render that
 *    throws. To break it you would have to add a nine-digit-capable field to the
 *    federal model, which is a change to a file whose whole docblock is about why
 *    that field does not exist.
 *
 * 2. **THERE IS ONE APERTURE AND IT IS THIS FILE.** `decipherSsn` is not exported.
 *    `ecprIdentities` is the ONLY exported function that returns plaintext digits,
 *    it is the only place in `src/**` whose SQL selects `workers.ssn_ciphertext` for
 *    its VALUE, and its return type is `EcprWorkerIdentity` — a shape the WH-347
 *    projector cannot accept. Everything else that needs to know about the column
 *    asks `ssn_ciphertext IS NOT NULL` and gets a boolean (`workerRoster`,
 *    `loadWeek`). To break it you would have to write a second `encode(ssn_ciphertext
 *    …)` somewhere, which `tests/web/ecpr-reachability.test.ts` fails the build for.
 *
 * 3. **THE PDF IS ALREADY BYTES BEFORE ANY OF THIS RUNS.** `ecprArtifact` takes a
 *    `RebuiltFiling` — the WH-347 rendered and digested — and returns XML. Nothing
 *    it computes is passed back into the PDF, because the PDF has already been
 *    serialized. The independence of §10.2 is call order, not politeness.
 *
 * 4. **THE CIPHERTEXT IS AEAD-BOUND TO ITS ROW.** The additional authenticated data
 *    is `ssn|v1|<account id>|<worker id>`, so a ciphertext copied to another worker
 *    or another tenant does not decrypt — it fails the tag check and yields `null`,
 *    which makes that worker `NO_SSN_ON_FILE` and blocks the XML with the worker
 *    NAMED. Every failure in this module fails to `null`. The cost of a bug here is
 *    a refusal, never nine unverified bytes inside an `<ssn>` element.
 *
 * ===========================================================================
 * THE ENVELOPE, AND WHAT MAKES DELETION MEAN SOMETHING
 *
 * Per-account data key (32 random bytes) → wrapped with AES-256-GCM under a ROOT KEY
 * that lives in the environment and never in the database → the wrapped blob is
 * stored in `accounts.data_key_uri`, the column `0000_init.sql` already declared for
 * it and which `ratepin_erase_identity` already NULLs at deletion while stamping
 * `data_key_destroyed_at`.
 *
 * That is the whole reason the root key is not a database row: a database backup
 * that contains both the ciphertext and the key it opens is not an envelope. With
 * the root key outside, destroying `data_key_uri` makes every residual
 * `ssn_ciphertext` — in a backup, in a write-ahead log — permanently undecryptable,
 * which is exactly the sentence `/legal` and the deletion screen already print. It
 * was true of nothing before this file, and it is true now.
 *
 * `SSN_ROOT_KEY` is 32 bytes, base64. It is read here rather than through
 * `src/lib/config.ts` because that file is outside this change's ownership; the
 * failure mode is nonetheless closed rather than silent — under `NODE_ENV=production`
 * an absent or malformed key THROWS at the first write or read, so a production
 * deploy without it cannot store a Social Security number at all. Outside production
 * a fixed development key is derived, so the offline suite and the browser journey
 * exercise the real cipher instead of a bypass that would leave it untested.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

import { sql } from 'drizzle-orm';

import { ssn9, type Ssn9, type EcprWorkerIdentity } from '@/artifacts';
import { rowsOf, type Tx } from '@/db';
import type { WorkerRef } from '@/lib/types';

import { appConfig } from './deps';

/** The wrap version. It is written into the stored URI and checked on unwrap, so a
 *  future scheme is a new prefix rather than a silently different interpretation of
 *  the same bytes. `workers.key_version` names the same generation. */
const WRAP_SCHEME = 'ratepin-aesgcm-v1';
export const SSN_KEY_VERSION = 1;

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

export class SsnKeyError extends Error {}

// ===========================================================================
// The root key
// ===========================================================================

/**
 * The development root key, and why deriving one is safer here than skipping the
 * cipher.
 *
 * A `NODE_ENV !== 'production'` deployment holds no real Social Security numbers —
 * `ADAPTER_MODE=mock` and the PGlite fallback are both refused in production by
 * `src/lib/config.ts`, so a dev database is fixtures. What a dev key buys is that
 * every test and every screenshot runs the SAME encrypt, the same unwrap and the
 * same AEAD binding that production runs. A "plaintext in dev" shortcut would mean
 * the one path nobody had ever executed was the one holding the real numbers.
 */
const DEVELOPMENT_ROOT_KEY = createHash('sha256')
  .update('ratepin-development-ssn-root-key — never valid under NODE_ENV=production')
  .digest();

function rootKey(): Buffer {
  const raw = process.env['SSN_ROOT_KEY'] ?? '';
  if (raw.trim() !== '') {
    const key = Buffer.from(raw.trim(), 'base64');
    if (key.length !== 32) {
      throw new SsnKeyError(
        `SSN_ROOT_KEY decodes to ${String(key.length)} bytes; AES-256 needs exactly 32. ` +
          'Ratepin does not stretch, pad or hash a short key into a long one — a key that ' +
          'is not the key you think it is protects Social Security numbers you think are ' +
          'protected.',
      );
    }
    return key;
  }
  if (appConfig().NODE_ENV === 'production') {
    throw new SsnKeyError(
      'SSN_ROOT_KEY is not set. Ratepin will not store or read a Social Security number ' +
        'without a root key held outside the database: an envelope whose key is in the same ' +
        'backup as the ciphertext is not an envelope, and the deletion promise on /legal ' +
        'rests on destroying that key. This fails closed — the California XML blocks and ' +
        'the WH-347 is unaffected.',
    );
  }
  return DEVELOPMENT_ROOT_KEY;
}

// ===========================================================================
// The per-account data key
// ===========================================================================

function seal(key: Buffer, plaintext: Buffer, aad: string): Buffer {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(aad, 'utf8'));
  const body = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([iv, body, cipher.getAuthTag()]);
}

/** Every failure returns `null`. A tag mismatch, a truncated blob, a ciphertext
 *  moved between rows and a wrong key are the same answer to the only question the
 *  caller may ask: is there a nine-digit number here that we can prove is this
 *  worker's? */
function open(key: Buffer, sealed: Buffer, aad: string): Buffer | null {
  if (sealed.length <= IV_BYTES + TAG_BYTES) return null;
  try {
    const iv = sealed.subarray(0, IV_BYTES);
    const body = sealed.subarray(IV_BYTES, sealed.length - TAG_BYTES);
    const tag = sealed.subarray(sealed.length - TAG_BYTES);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from(aad, 'utf8'));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]);
  } catch {
    return null;
  }
}

interface AccountKeyRow {
  readonly id: string;
  readonly data_key_uri: string | null;
  readonly data_key_destroyed_at: string | Date | null;
}

async function accountKeyRow(tx: Tx): Promise<AccountKeyRow | undefined> {
  return rowsOf<AccountKeyRow>(
    await tx.execute(sql`
      SELECT id, data_key_uri, data_key_destroyed_at
        FROM accounts WHERE id = ratepin_current_account()
    `),
  )[0];
}

/** The AAD that binds a wrapped data key to the account it belongs to. */
function wrapAad(accountId: string): string {
  return `${WRAP_SCHEME}|datakey|${accountId}`;
}

/** The AAD that binds an SSN ciphertext to one worker in one account. */
function ssnAad(accountId: string, workerId: string): string {
  return `ssn|v${String(SSN_KEY_VERSION)}|${accountId}|${workerId}`;
}

/**
 * The account's data key, minting one on first use.
 *
 * A destroyed key is NOT re-minted. `data_key_destroyed_at` means an erasure ran;
 * silently issuing a fresh key would make the next write readable again and would
 * quietly convert "permanently undecryptable" into "undecryptable until someone
 * types a number in". So this throws, and every caller turns that into a refusal.
 */
async function accountDataKey(tx: Tx): Promise<{ readonly accountId: string; readonly key: Buffer }> {
  const row = await accountKeyRow(tx);
  if (!row) {
    throw new SsnKeyError('no account is in scope for this transaction');
  }
  if (row.data_key_destroyed_at !== null) {
    throw new SsnKeyError(
      'this account’s data key was destroyed at deletion. Ratepin does not mint a ' +
        'replacement: the erasure guarantee is that the key is gone.',
    );
  }

  const root = rootKey();
  if (row.data_key_uri !== null) {
    const [scheme, blob] = row.data_key_uri.split(':');
    if (scheme !== WRAP_SCHEME || blob === undefined) {
      throw new SsnKeyError(`unknown data-key wrap scheme ${String(scheme)}`);
    }
    const key = open(root, Buffer.from(blob, 'base64'), wrapAad(row.id));
    if (key === null || key.length !== 32) {
      throw new SsnKeyError(
        'this account’s data key does not unwrap under the configured SSN_ROOT_KEY. ' +
          'Ratepin fails closed rather than re-minting: a new key here would silently ' +
          'orphan every Social Security number already stored under the old one.',
      );
    }
    return { accountId: row.id, key };
  }

  const key = randomBytes(32);
  const wrapped = `${WRAP_SCHEME}:${seal(root, key, wrapAad(row.id)).toString('base64')}`;
  await tx.execute(sql`
    UPDATE accounts SET data_key_uri = ${wrapped}
     WHERE id = ratepin_current_account() AND data_key_uri IS NULL
  `);
  // Re-read rather than trust the write: on a concurrent first write the loser's key
  // is not the stored one, and encrypting under a key nobody can find later is the
  // one outcome worse than refusing.
  const settled = await accountKeyRow(tx);
  const storedBlob = settled?.data_key_uri?.split(':')[1];
  if (storedBlob === undefined) {
    throw new SsnKeyError('the account data key could not be stored');
  }
  const stored = open(root, Buffer.from(storedBlob, 'base64'), wrapAad(row.id));
  if (stored === null) throw new SsnKeyError('the stored account data key does not unwrap');
  return { accountId: row.id, key: stored };
}

// ===========================================================================
// WRITE — the only writer of `workers.ssn_ciphertext`
// ===========================================================================

export type SsnWriteOutcome =
  | { readonly ok: true; readonly last4: string }
  | { readonly ok: false; readonly reason: string };

/**
 * Store one worker's nine digits, encrypted, plus the last four the federal form is
 * allowed to print.
 *
 * `ssn_last4` is DERIVED here rather than typed in a second field. Two inputs for
 * one fact is two facts, and the one that disagrees is the one printed on a signed
 * federal document; `last4Of` is one-directional, so the federal column can only
 * ever be a projection of the state one.
 */
export async function storeWorkerSsn(
  tx: Tx,
  input: { readonly workerId: string; readonly ssn: string },
): Promise<SsnWriteOutcome> {
  let nine: Ssn9;
  try {
    nine = ssn9(input.ssn);
  } catch {
    return {
      ok: false,
      reason:
        'California’s eCPR schema declares ssn as exactly nine digits. Ratepin does not pad, ' +
        'truncate or invent one, so nothing was stored.',
    };
  }

  const { accountId, key } = await accountDataKey(tx);
  const sealed = seal(key, Buffer.from(nine, 'utf8'), ssnAad(accountId, input.workerId));
  const last4 = nine.slice(-4);

  const updated = rowsOf(
    await tx.execute(sql`
      UPDATE workers
         SET ssn_ciphertext = decode(${sealed.toString('hex')}, 'hex'),
             ssn_last4 = ${last4},
             key_version = ${SSN_KEY_VERSION},
             ssn_purged_at = NULL
       WHERE id = ${input.workerId}::uuid
      RETURNING id
    `),
  );
  if (updated.length !== 1) {
    return { ok: false, reason: 'that worker is not on this account’s roster.' };
  }
  return { ok: true, last4 };
}

/** Forget one worker's nine digits without touching the last four the WH-347 needs.
 *  The two artifacts have independent statuses, so removing the state one must not
 *  disturb the federal one. */
export async function forgetWorkerSsn(tx: Tx, workerId: string, now: Date): Promise<void> {
  await tx.execute(sql`
    UPDATE workers
       SET ssn_ciphertext = NULL, ssn_purged_at = ${now.toISOString()}::timestamptz
     WHERE id = ${workerId}::uuid
  `);
}

/**
 * The withholding-exemption count California requires and the Rev. January 2025
 * WH-347 deleted, so it is underivable from the federal path.
 *
 * `null` clears it. It is never defaulted to zero anywhere in this product: zero is
 * an assertion about someone's tax situation, and this one is made under penalty of
 * perjury by the person signing the payroll.
 */
export async function setWithholdingExemptions(
  tx: Tx,
  input: { readonly workerId: string; readonly count: number | null },
): Promise<void> {
  await tx.execute(sql`
    UPDATE workers SET num_withholding_exemp = ${input.count}
     WHERE id = ${input.workerId}::uuid
  `);
}

// ===========================================================================
// READ — the only reader, and it produces a shape the federal path cannot take
// ===========================================================================

/**
 * The eCPR's worker identities for one payroll week.
 *
 * THE ONLY QUERY IN `src/**` THAT SELECTS `workers.ssn_ciphertext` FOR ITS VALUE,
 * and the only construction of an `Ssn9` outside the artifact module's own
 * constructor. `loadWeek`, which feeds the WH-347, selects `ssn_last4` and a
 * boolean; `workerRoster` does the same. Neither can hold nine digits, because
 * `Wh347WorkerIdentity` has no field that could.
 *
 * The chip that decides whether the XML is offered is fed from THIS function's
 * output rather than from a `ssn_ciphertext IS NOT NULL` count. Presence is not
 * readability: a column holding something that does not decrypt to nine digits would
 * clear a presence check and then refuse inside `renderEcprXml`, which is a screen
 * saying ready over a route that blocks. One aperture, one fact.
 */
export async function ecprIdentities(
  tx: Tx,
  weekId: string,
): Promise<readonly EcprWorkerIdentity[]> {
  const rows = rowsOf<{
    id: string;
    worker_id: string;
    last_name: string;
    first_name: string;
    middle_initial: string | null;
    ssn_sealed: string | null;
    num_withholding_exemp: number | string | null;
  }>(
    await tx.execute(sql`
      SELECT ww.id, w.id AS worker_id, w.last_name, w.first_name, w.middle_initial,
             encode(w.ssn_ciphertext, 'hex') AS ssn_sealed,
             w.num_withholding_exemp
        FROM payroll_worker_weeks ww
        JOIN workers w ON w.id = ww.worker_id
       WHERE ww.week_id = ${weekId}::uuid
       ORDER BY w.last_name, w.first_name
    `),
  );

  // The key is unwrapped ONCE per filing and lives in this function's frame. It is
  // never returned, never logged and never cached across requests (§11.3: "decrypt
  // in-process, per filing"). An account whose key is missing or destroyed yields no
  // plaintext at all, which blocks the XML with every worker named — the same shape
  // as a crew nobody has typed numbers in for.
  let key: Buffer | null = null;
  let accountId = '';
  if (rows.some((row) => row.ssn_sealed !== null)) {
    try {
      const resolved = await accountDataKey(tx);
      key = resolved.key;
      accountId = resolved.accountId;
    } catch {
      key = null;
    }
  }

  return rows.map((row) => ({
    workerRef: row.id as WorkerRef,
    lastName: row.last_name,
    firstName: row.first_name,
    middleInitial: row.middle_initial,
    ssn: key === null ? null : decipherSsn(key, accountId, row.worker_id, row.ssn_sealed),
    // No column holds a worker's home address, and California's schema declares all
    // four as minOccurs="0". Absent is absent; nothing is invented to fill an
    // optional element.
    address: null,
    city: null,
    state: null,
    zip: null,
    numWithholdingExemp:
      row.num_withholding_exemp === null ? null : Number(row.num_withholding_exemp),
    checkNumber: null,
  }));
}

/** NOT EXPORTED, and that is the mechanism rather than a preference: a module that
 *  cannot import this function cannot obtain nine digits from a row. */
function decipherSsn(
  key: Buffer,
  accountId: string,
  workerId: string,
  sealedHex: string | null,
): Ssn9 | null {
  if (sealedHex === null) return null;
  const plain = open(key, Buffer.from(sealedHex, 'hex'), ssnAad(accountId, workerId));
  if (plain === null) return null;
  try {
    return ssn9(plain.toString('utf8'));
  } catch {
    return null;
  }
}
