/**
 * The platform layer's own DDL, applied idempotently.
 *
 * WHY THIS IS NOT IN `drizzle/0000_init.sql`. That file is the schema of record and
 * it is owned elsewhere; this module owns `src/platform/**` and nothing else. The
 * five relations below are the ones the unattended-operations layer needs and the
 * schema of record does not declare — sessions and magic links above all, without
 * which ARCHITECTURE.md §11.5's "magic-link authentication with single-use,
 * short-expiry, hashed-at-rest tokens" has nowhere to store a token. They are
 * created with `IF NOT EXISTS` and applied by `ensurePlatformSchema`, which is a
 * Twelve-Factor XII admin process: it runs from the release image, as the migration
 * role, before the web and worker processes start. It is also what the test harness
 * calls, so the tests exercise the same DDL production gets.
 *
 * WHY TWO TABLES HAVE NO ROW-LEVEL SECURITY, stated rather than left as an omission:
 *
 *  - `auth_sessions` / `auth_magic_links` are read to LEARN the tenant. An RLS
 *    policy keyed on `ratepin_current_account()` would have to pass before the
 *    context it depends on exists. The boundary here is the token: 256 bits of
 *    CSPRNG entropy, stored as a SHA-256 digest, looked up by digest and never
 *    enumerable. No query in this module selects from either table without a
 *    token hash or an (account, user) pair in the predicate.
 *
 *  - `billing_account_index` and `email_outbox` are the FLEET surfaces. A nightly
 *    credit run, a dunning reconcile and an outbox drain each have to enumerate
 *    every account, and the worker connects as `ratepin_app` — a NOBYPASSRLS role,
 *    asserted at boot by `assertRlsEnforced`. Without a global index the only way
 *    to fan out would be to give the worker a role that can read every tenant's
 *    payroll, which trades the entire tenant boundary for a cron job. The index
 *    therefore holds exactly the money state Stripe already holds — account id,
 *    customer id, plan, price, entitlement — and no worker name, no rate, no SSN
 *    and no filing. Everything the fan-out then does per account happens inside
 *    `withTenant`, under the policies.
 *
 * The last statement in this file is the one that matters most for G5 (§11.8): a
 * trigger that makes `inbound_messages` monotone. See the comment there.
 */

import { sql } from 'drizzle-orm';

import type { Db, Tx } from '../db';

export const PLATFORM_DDL = `
-- ---------------------------------------------------------------------------
-- AUTH — magic link and session. No passwords exist, so none can leak (§11.5).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS auth_magic_links (
  id            uuid PRIMARY KEY,
  email         text        NOT NULL,
  -- The token is NEVER stored. This is its SHA-256, lowercase hex.
  token_hash    text        NOT NULL UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,
  -- Single-use: redemption stamps this, and a second redemption of the same link
  -- fails. A magic link that works twice is a magic link that works after it has
  -- been forwarded, quoted in a support thread, or read out of a mail archive.
  consumed_at   timestamptz,
  -- Set when the link was issued for a specific invitation rather than a login.
  account_id    uuid REFERENCES accounts (id) ON DELETE CASCADE,
  CONSTRAINT auth_magic_email_lower CHECK (email = lower(email))
);
CREATE INDEX IF NOT EXISTS auth_magic_links_email ON auth_magic_links (email, created_at DESC);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id            uuid PRIMARY KEY,
  token_hash    text        NOT NULL UNIQUE,
  user_id       uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  -- The account the session is acting for. A user with two memberships gets two
  -- sessions rather than a mutable "current account" field, so the tenant a request
  -- runs under is fixed at authentication time and cannot be switched by a
  -- parameter (ADR-011).
  account_id    uuid        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,
  revoked_at    timestamptz
);
CREATE INDEX IF NOT EXISTS auth_sessions_user ON auth_sessions (user_id, account_id);

-- ---------------------------------------------------------------------------
-- BILLING — the fleet index and the plan-change log.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS billing_account_index (
  account_id           uuid PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
  stripe_customer_id   text,
  plan_id              text REFERENCES plans (id),
  price_cents          integer NOT NULL DEFAULT 0,
  entitlement_state    entitlement_state NOT NULL DEFAULT 'none',
  subscription_status  subscription_status,
  -- When the money state last moved. The 72-hour grace window and the 30-day
  -- archive clock are both measured from here, so a dunning transition is a pure
  -- function of (status, this timestamp, now) and can be tested without waiting.
  state_since          timestamptz NOT NULL DEFAULT now(),
  current_period_start timestamptz,
  current_period_end   timestamptz,
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS billing_index_entitlement ON billing_account_index (entitlement_state);

CREATE TABLE IF NOT EXISTS plan_changes (
  id           bigserial PRIMARY KEY,
  account_id   uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  from_plan_id text REFERENCES plans (id),
  to_plan_id   text REFERENCES plans (id),
  -- 'upgrade' | 'downgrade' | 'auto_upgrade' | 'revert' | 'cancel' | 'resume'
  kind         text NOT NULL,
  at           timestamptz NOT NULL DEFAULT now(),
  effective_at timestamptz,
  -- USER_JOURNEY §11.4: the auto-upgrade is announced when it fires and carries a
  -- ONE-CLICK REVERT. The revert needs to know what it is reverting to, which is
  -- this row, which is why the auto-upgrade is a logged event rather than a silent
  -- subscription update.
  reverted_at  timestamptz,
  detail       jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT plan_changes_kind CHECK (
    kind IN ('upgrade', 'downgrade', 'auto_upgrade', 'revert', 'cancel', 'resume'))
);
CREATE INDEX IF NOT EXISTS plan_changes_account ON plan_changes (account_id, at DESC);

-- ---------------------------------------------------------------------------
-- OUTBOX — every outbound message, queued and drained by the worker.
--
-- Outbound only. There is no inbound adapter and no reply-to that routes into the
-- product (A3); replies to any address we publish land in G5's counter (§11.8).
-- A row carries a template key and IDS. It never carries a worker name, a rate, a
-- deduction or an SSN, because a mail provider is not inside the boundary §11.3
-- draws around those.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS email_outbox (
  id              uuid PRIMARY KEY,
  account_id      uuid REFERENCES accounts (id) ON DELETE CASCADE,
  to_address      text NOT NULL,
  template        text NOT NULL,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  queued_at       timestamptz NOT NULL DEFAULT now(),
  sent_at         timestamptz,
  attempts        integer NOT NULL DEFAULT 0,
  last_error      text,
  -- One send per (reason, subject). A dunning notice that arrives twice because a
  -- container restarted is how an automatic system teaches a customer to ignore it.
  idempotency_key text NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS email_outbox_pending ON email_outbox (queued_at) WHERE sent_at IS NULL;

-- ---------------------------------------------------------------------------
-- DELETION — a modelled state with a 7-day undo, not a request to file.
-- ARCHITECTURE §5.5 / USER_JOURNEY §12.2.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS account_deletions (
  account_id     uuid PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
  requested_at   timestamptz NOT NULL DEFAULT now(),
  requested_by   uuid REFERENCES users (id),
  -- Stated on the confirmation screen and in the email, as a date, before the click.
  effective_at   timestamptz NOT NULL,
  undone_at      timestamptz,
  executed_at    timestamptz,
  export_key     text,
  -- The erasure report, rendered from the same enumeration the screen renders from,
  -- so what the customer was promised and what ran cannot drift.
  report         jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- THE WORKER'S RUN RECORD.  ARCHITECTURE §7 ("a job registry with schedules,
-- idempotency keys, failure-closed semantics and structured run records").
--
-- jobs is the QUEUE — one row per unit of work, deleted-by-state as it moves.
-- This is the LEDGER: one row per attempt, kept, so that "did the nightly ingest
-- run last night, and what did it decide?" is a query rather than a log grep. It is
-- also the only place a failure is recorded, because there is nowhere else for a
-- failure to go: no pager, no inbox, no on-call rotation (I7).
--
-- outcome has four values and none of them is 'alerted'.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS job_runs (
  id              bigserial PRIMARY KEY,
  job_id          bigint REFERENCES jobs (id) ON DELETE SET NULL,
  kind            text NOT NULL,
  idempotency_key text,
  attempt         integer NOT NULL DEFAULT 1,
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  outcome         text NOT NULL,
  -- What the job decided, in the job's own vocabulary: snapshot state, rows
  -- credited, messages drained. Never a worker name, a rate or an SSN.
  detail          jsonb NOT NULL DEFAULT '{}'::jsonb,
  error           text,
  CONSTRAINT job_runs_outcome CHECK (
    outcome IN ('ok', 'failed_closed', 'skipped_duplicate', 'lease_expired'))
);
CREATE INDEX IF NOT EXISTS job_runs_kind ON job_runs (kind, started_at DESC);

-- ---------------------------------------------------------------------------
-- BACKUP VERIFICATION — the measured number §5.5's deletion promise is quoted from.
--
-- "We do not assert a vendor number here… backup.verify (P11) records the OLDEST
-- RESTORABLE TIMESTAMP on every run, /api/status exposes it, and the deletion
-- screen quotes THAT measured number." A retention figure that has never been
-- measured is a marketing claim, so the deletion screen reads this table or says
-- that it has not been measured yet. It never guesses.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS backup_verifications (
  id                   bigserial PRIMARY KEY,
  at                   timestamptz NOT NULL DEFAULT now(),
  restored             boolean NOT NULL,
  oldest_restorable_at timestamptz,
  rows_checked         integer,
  canary_subset_pass   boolean,
  detail               jsonb NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT, UPDATE ON job_runs, backup_verifications TO ratepin_app;

-- ---------------------------------------------------------------------------
-- THE GATE COUNTERS ARE WRITTEN BY THE WORKER, WHICH IS ratepin_app.
--
-- The schema of record grants the application SELECT on canary_runs,
-- corpus_reconciliation and claim_gates because at the time it was written the
-- only reader was a screen. G1's run and G3's reconciliation are produced by the
-- scheduled worker (§7.1), and the worker connects as ratepin_app — a NOBYPASSRLS
-- role, asserted at boot — so without these three grants the instrumentation cannot
-- write the numbers the gates are measured on.
--
-- INSERT ONLY on the two evidence tables. There is deliberately no UPDATE and no
-- DELETE: a canary run and a nightly reconciliation are facts about a moment, and a
-- product that can edit its own evidence has none. claim_gates gets UPDATE because
-- it is a DERIVED cache of those facts — refreshClaimGates recomputes every column
-- from the counters on every run, so an edit cannot invent a state the evidence does
-- not support.
-- ---------------------------------------------------------------------------

GRANT INSERT ON canary_runs, corpus_reconciliation TO ratepin_app;
GRANT UPDATE ON claim_gates TO ratepin_app;

-- The Monday eCFR diff (§7.1 ingest.ecfr) writes the obligation changelog and the
-- three watched constants — 5.5(b)'s $100,000 CWHSSA preamble, 5.5(b)(2)'s $33/day,
-- and 3.5's set of lettered paragraphs. Both tables are INSERT-only for the
-- application: an observation of what the regulation said on a date is not a row
-- anybody gets to edit afterwards, and the engine reads them as history.
GRANT INSERT ON obligation_changelog, regulatory_constant TO ratepin_app;

-- ---------------------------------------------------------------------------
-- THE ONE INDEX THE MONEY PATH CANNOT RUN WITHOUT.
--
-- src/db/schema.ts declares uniqueIndex('meter_events_filing') on meter_events
-- (filing_id) and drizzle/0000_init.sql does not create it. The parity test compares
-- tables and columns, not indexes, so the gap was invisible — and it is not
-- cosmetic: meterFiling posts with ON CONFLICT (filing_id) DO NOTHING, which is a
-- runtime error without a matching unique constraint, and the property it buys is
-- that a retried meter job cannot bill a customer twice for one filing.
--
-- Created here, idempotently, rather than by editing the schema of record, which
-- this module does not own. If the constraint later lands in the migration this
-- statement becomes a no-op.
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS meter_events_filing ON meter_events (filing_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON auth_magic_links, auth_sessions TO ratepin_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON billing_account_index, email_outbox TO ratepin_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON plan_changes, account_deletions TO ratepin_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ratepin_app;

-- plan_changes and account_deletions are read by the customer's own billing and
-- settings screens, so they get the second mechanism (ADR-011). The two fleet
-- surfaces above deliberately do not; the reasoning is in this file's header.
SELECT ratepin_enable_tenant_rls('plan_changes');
SELECT ratepin_enable_tenant_rls('account_deletions');

-- ---------------------------------------------------------------------------
-- G5 — THE COUNTER WE CANNOT TURN DOWN.  USER_JOURNEY §11.8, MED-2.
--
-- "A gate whose input is a judgement call by the claimant is not an instrument; it
-- is a preference with a number next to it." The redefinition removes the judgement
-- from the counting rule. This removes it from the STORAGE, which is the half a
-- rule cannot cover: a rule says nobody should reclassify a message as bulk after
-- the fact or quietly drop its minutes; a trigger makes it impossible.
--
-- What the trigger permits is exactly one thing — RAISING minutes_charged and
-- stamping first_reply_at once, which is the legitimate write when a reply is
-- observed and the floor of 1 gives way to the real wall-clock cost. Everything
-- else is refused: no DELETE at any time, no change to the address, no change to
-- the classification or the rule that produced it, no lowering of the minutes, and
-- no re-stamping of a reply time that has already been set.
--
-- Two mechanisms, as everywhere else in this system: the column grant means the
-- application can only touch those two columns at all, and the trigger means even
-- the owner cannot move them the wrong way.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION inbound_messages_monotone() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'inbound_messages is append-only: G5 is measured on it (USER_JOURNEY 11.8)'
      USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW.id <> OLD.id
     OR NEW.received_at <> OLD.received_at
     OR NEW.address <> OLD.address
     OR NEW.classification <> OLD.classification
     OR NEW.classifier_rule IS DISTINCT FROM OLD.classifier_rule THEN
    RAISE EXCEPTION 'inbound_messages: only first_reply_at and minutes_charged may be updated'
      USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW.minutes_charged < OLD.minutes_charged THEN
    RAISE EXCEPTION 'inbound_messages: minutes_charged is monotone (% -> %)',
                    OLD.minutes_charged, NEW.minutes_charged
      USING ERRCODE = 'restrict_violation';
  END IF;
  IF OLD.first_reply_at IS NOT NULL AND NEW.first_reply_at IS DISTINCT FROM OLD.first_reply_at THEN
    RAISE EXCEPTION 'inbound_messages: first_reply_at is written once'
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS inbound_messages_monotone_guard ON inbound_messages;
CREATE TRIGGER inbound_messages_monotone_guard
  BEFORE UPDATE OR DELETE ON inbound_messages
  FOR EACH ROW EXECUTE FUNCTION inbound_messages_monotone();

GRANT UPDATE (first_reply_at, minutes_charged) ON inbound_messages TO ratepin_app;
`;

/**
 * Apply the platform DDL. Idempotent, so it is safe on every boot and every test
 * fixture; `ratepin_enable_tenant_rls` is the one statement that is not, so it is
 * guarded by a catalogue check rather than by hoping.
 */
export async function ensurePlatformSchema(db: Db | Tx): Promise<void> {
  const already = await db.execute(sql`
    SELECT 1 FROM pg_policies WHERE tablename = 'plan_changes' LIMIT 1
  `);
  const rows = Array.isArray(already)
    ? already
    : ((already as { rows?: unknown[] }).rows ?? []);
  const ddl = rows.length > 0 ? stripRlsCalls(PLATFORM_DDL) : PLATFORM_DDL;
  await db.execute(sql.raw(ddl));
}

function stripRlsCalls(ddl: string): string {
  return ddl.replace(/^SELECT ratepin_enable_tenant_rls\(.*$/gm, '');
}
