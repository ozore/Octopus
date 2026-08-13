-- =============================================================================
-- RATEPIN — 0000_init
--
-- The complete data model. This file, not `src/db/schema.ts`, is the schema of
-- record: several of the invariants below are triggers, CHECK constraints,
-- policies and views that a Drizzle table declaration cannot express, and every
-- one of them is load-bearing rather than decorative.
--
-- Sources, and which one governs where they disagree:
--   ARCHITECTURE.md  §5.1 operational schema · §5.2 the mirror · §6.3 statuses ·
--                    §11.2 tenant isolation (ADR-011) · I5 append-only mirror
--   CORPUS_DESIGN.md AUTHORITY on the corpus: §3.3 blobs and revisions · §3.4
--                    append-only enforcement · §4.3 classifications · §5.3 diffs ·
--                    §5.5 pin standing · §6.2 county scope · §7.2 crosswalk ·
--                    §8.2 snapshots and artifact provenance · §10.5 probes ·
--                    §10.6 the blocking-probe register · §12.6 obligations
--   ENGINE.md        AUTHORITY on arithmetic: §2 value types · §3 the line model ·
--                    §7.0 the CWHSSA coverage gate · §9.1 DeductionCategory ·
--                    §18.2 the classification ladder L-A..L-F
--   USER_JOURNEY.md  AUTHORITY on screens and refusals: §0.3 P-A..P-D · §11.8 the
--                    G5 counter · §14 the filing state machine
--
-- FOUR DEPARTURES FROM THE LETTER OF THE SPEC, EACH DELIBERATE:
--
--  1. MONEY IS NEVER `numeric`. CORPUS_DESIGN §4.3/§5.3 declare wage-determination
--     rates as `numeric(9,2)`. Postgres numeric is exact, but it arrives in
--     JavaScript as a string that the next hand will parse into a float holding
--     dollars, and the build rule is absolute: integer micro-dollars or cents,
--     never a float, never a JS number holding dollars. Rates are therefore stored
--     as `integer` MilliRate — ten-thousandths of a dollar, ENGINE.md §2 — under
--     the same non-negative and sanity bounds the numeric form carried. The
--     conversion is lossless: determinations publish two decimals.
--
--  2. `tenant` and `account` are the same thing, spelled `account`.
--     ARCHITECTURE §5.1 says `tenants`; CORPUS_DESIGN §7.2 and USER_JOURNEY say
--     `account_id`. One name, chosen to match the two documents that are
--     authorities over the tables that cross the boundary.
--
--  3. COMPOSITE PRIMARY KEYS OVER `coalesce(...)` ARE NOT LEGAL SQL.
--     CORPUS_DESIGN §6.2 (`wd_county_scope`) and §7.2 (`soc_wdclass_edge`) declare
--     `PRIMARY KEY (…, coalesce(county_name_norm,''), coalesce(county_code,-1))`.
--     A primary key takes columns, not expressions. Both become a surrogate key
--     plus a UNIQUE INDEX on exactly those expressions, which has the identical
--     effect and is writable.
--
--  4. `crosswalk_observation` GAINS THE `provenance` COLUMN ITS OWN VIEW READS.
--     CORPUS_DESIGN §7.2's `crosswalk_prior` filters `WHERE o.provenance =
--     'user_confirmed'`, but the `crosswalk_observation` DDL immediately above it
--     declares no such column. The column is added here with the enum
--     ARCHITECTURE §3.7 names (`deterministic | llm_ranked | user_confirmed`),
--     because the view is the half that carries the HIGH-2 remediation.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- 0. THE APPLICATION ROLE AND THE TENANT CONTEXT
--
-- ADR-011: two independent mechanisms, not one. Row-level security is the second,
-- and it only exists if the application connects as a role that is neither the
-- table owner nor a superuser — a superuser bypasses every policy silently, which
-- is the failure mode where RLS is present in the migration and absent in
-- production. `src/lib/config.ts` refuses to boot when the connected role can
-- bypass RLS.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ratepin_app') THEN
    CREATE ROLE ratepin_app NOLOGIN NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO ratepin_app;

-- The tenant context. `current_setting(…, true)` returns NULL when the GUC has
-- never been set, so an unscoped connection matches NOTHING rather than
-- everything: the boundary fails closed. There is no policy anywhere in this file
-- that reads a value the application supplies as a column.
CREATE OR REPLACE FUNCTION ratepin_current_account() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('ratepin.account_id', true), '')::uuid
$$;

-- Set for the remainder of the transaction (`local => true`). A repository that
-- forgets to call this sees zero rows, which is a visible bug; the alternative
-- default — see everything — is an invisible one. OWASP API1:2023.
CREATE OR REPLACE FUNCTION ratepin_set_account(p_account uuid) RETURNS void
LANGUAGE sql VOLATILE AS $$
  SELECT set_config('ratepin.account_id', coalesce(p_account::text, ''), true)::void
$$;

CREATE OR REPLACE FUNCTION ratepin_clear_account() RETURNS void
LANGUAGE sql VOLATILE AS $$
  SELECT set_config('ratepin.account_id', '', true)::void
$$;

GRANT EXECUTE ON FUNCTION ratepin_current_account() TO ratepin_app;
GRANT EXECUTE ON FUNCTION ratepin_set_account(uuid) TO ratepin_app;
GRANT EXECUTE ON FUNCTION ratepin_clear_account() TO ratepin_app;

-- The append-only enforcement used by the mirror (CORPUS_DESIGN §3.4). I5: a
-- superseded WD revision is retained forever; corrections are new rows with a
-- later observed_at, never an UPDATE.
CREATE OR REPLACE FUNCTION forbid_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'corpus tables are append-only: % on %.% is forbidden',
                  TG_OP, TG_TABLE_SCHEMA, TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END $$;

-- =============================================================================
-- 1. ENUMS
-- =============================================================================

-- ARCHITECTURE §5.1 / ENGINE §7.0 / AS-2. There is no DEFAULT for this type at
-- any layer, and `unknown` is a stored value meaning "the customer was asked and
-- chose not to answer" — a different fact from "we never asked", which NOT NULL
-- makes unrepresentable.
CREATE TYPE contract_value_band AS ENUM ('over_100k', 'at_or_under_100k', 'unknown');

CREATE TYPE account_status     AS ENUM ('active', 'restricted', 'cancelled', 'deleted');
CREATE TYPE membership_role    AS ENUM ('owner', 'admin', 'member');
CREATE TYPE wh347_layout       AS ENUM ('wh347_rev_2025_01', 'wh347_legacy');

-- ARCHITECTURE §6.4. FRESH <= 24h, DATED 24-72h, STALE > 72h. Freshness moves a
-- SENTENCE; it never moves the artifact status. That single line is D7.
CREATE TYPE freshness_state    AS ENUM ('FRESH', 'DATED', 'STALE');

-- ARCHITECTURE §6.3. Exactly three members and one construction path
-- (`deriveStatus`). Adding a fourth is a schema migration and a review, not a
-- convenience.
CREATE TYPE artifact_status    AS ENUM ('CERTIFIABLE', 'CERTIFIABLE_DATED', 'DRAFT_NOT_CERTIFIABLE');

-- USER_JOURNEY §14. The lifecycle of the record, kept separate from the status of
-- the document: a DRAFT — NOT CERTIFIABLE artifact can still be RELEASED (she
-- downloads it as a draft), and `crosswalk_eligible_account` counts RELEASED only.
CREATE TYPE filing_state       AS ENUM ('DRAFT', 'RELEASED', 'AMENDED', 'SUPERSEDED', 'VOID');

CREATE TYPE artifact_kind      AS ENUM ('wh347_pdf', 'statement_of_compliance', 'ecpr_xml',
                                        'exception_report', 'portal_bundle', 'rate_card');

-- ARCHITECTURE §5.4: artifacts are split by PII CLASS rather than by file type,
-- because the CA eCPR XML *is* an artifact and it carries full nine-digit SSNs.
-- One retention clock governs every store that can contain a full SSN.
CREATE TYPE artifact_pii_class AS ENUM ('non_pii', 'ssn_bearing');

-- ARCHITECTURE §6.3 + ENGINE §4/§7.3/§9.3 + CORPUS_DESIGN §6.4. Every member is a
-- reason a signature block is withheld (P-B) or a line is blocked (P-A). None of
-- them routes to a person.
CREATE TYPE block_reason AS ENUM (
  'UNMAPPED_TRADE',                  -- ENGINE §18.2 L-F
  'UNMAPPED_DEDUCTION',              -- ENGINE §9.3 D1 — never swept into "Other"
  'UNPARSED_CLASSIFICATION',         -- CORPUS_DESIGN §4.4 quarantine
  'UNION_GROUP_REFUSED',             -- D9, narrowed by ES-4 to a 6B credit claim
  'SUPERSEDED_PIN_UNCONFIRMED',
  'MISSING_REQUIRED_FIELD',
  'CWHSSA_COVERAGE_UNDETERMINED',    -- AS-2 / ENGINE §7.0 — filing-scoped
  'AMBIGUOUS_RATE_BASIS',            -- ENGINE §3, 29 CFR 5.32(a)
  'UNSPLIT_CLASSIFICATION_TIME',     -- ENGINE §4 A1, 29 CFR 5.5(a)(1)(i)
  'PREMIUM_HOURS_UNPROVEN',          -- ENGINE §4 A2 / §7.3
  'NET_RECONCILIATION_FAILED',       -- ENGINE §9.3 D3
  'NO_PINNED_REVISION',              -- CORPUS_DESIGN §6.4 — every free artifact
  'CORPUS_STALE_NO_NEW_ASSERTION',   -- CORPUS_DESIGN §6.4 rule 2, L2
  'COUNTY_SCOPE_UNRESOLVED',         -- CORPUS_DESIGN §6.1
  'XSD_HASH_MISMATCH'                -- ADR-009 / L4 — the one place we block output
);

-- ENGINE §10. Flags are OBSERVATIONS with the arithmetic shown. They never block a
-- line and they never characterise a shortfall as a violation of law.
CREATE TYPE violation_flag AS ENUM (
  'WD_UNDERPAYMENT', 'FRINGE_BELOW_WD', 'PREMIUM_BELOW_STATUTORY'
);

CREATE TYPE line_resolution AS ENUM ('pending', 'resolved', 'blocked');

-- ENGINE.md §9.1 is the SINGLE authority on this enum; ARCHITECTURE §3.2 defers
-- (ES-2). 29 CFR 3.5 has TEN lettered paragraphs, (a)-(j), [88 FR 57730,
-- Aug. 23, 2023]. An eight-member enum sends every hard hat and every pair of
-- safety boots to UNMAPPED and tells a compliant contractor a lawful deduction is
-- unlawful. `regulatory_constant` holds the paragraph letters with their amendment
-- date so a future (k) fails the build instead of silently blocking lines.
CREATE TYPE deduction_category AS ENUM (
  'STATUTORY',                 -- (a) federal/state/local law: withholding, FICA
  'BONA_FIDE_PREPAYMENT',      -- (b) repayment of a prepayment, no discount/interest
  'COURT_PROCESS',             -- (c) required by court process, not favouring the contractor
  'BENEFIT_FUND',              -- (d) medical/pension/vacation funds, four tests
  'CREDIT_UNION',              -- (e) credit-union loans or shares
  'GOVERNMENTAL',              -- (f) voluntary contributions to governmental bodies
  'CHARITABLE_501C3',          -- (g) voluntary contributions to 501(c)(3) organisations
  'UNION_DUES',                -- (h) initiation fees and dues under a CBA
  'BOARD_LODGING_FACILITIES',  -- (i) FLSA 3(m) "reasonable cost"
  'SAFETY_EQUIPMENT',          -- (j) nominal-value safety equipment as own property
  'UNMAPPED'                   -- sentinel: blocks the line, never rendered
);

-- ARCHITECTURE §4.5 — the degradation ladder as a state machine. L1 and L2 are the
-- ONLY states caused by upstream unavailability and NEITHER blocks a filing on a
-- pinned project. States compose; the banner is their union.
CREATE TYPE ladder_level AS ENUM (
  'L0_NORMAL', 'L1_DATED', 'L2_STALE',
  'L3_QUARANTINE', 'L4_XML_BLOCKED', 'L5_RELEASE_FROZEN'
);

-- ENGINE §18.2 — the classification ladder. L_C1 is the ONLY level at which a
-- radio arrives filled, and the only input allowed to fill it is the
-- determination's own federal text (E5).
CREATE TYPE classification_level AS ENUM ('L_A', 'L_B', 'L_C1', 'L_C2', 'L_D', 'L_E', 'L_F');

-- CORPUS_DESIGN §3.3
CREATE TYPE agreement_state AS ENUM (
  'agreed',             -- every reconciled field matched across the paths fetched
  'advisory_variance',  -- only §9.5 tier-3 fields differ. Recorded, reported, never blocking
  'blocking_variance',  -- a pinned field differs; this revision may not be promoted
  'single_path'         -- only one path returned; permitted for archive backfill only
);
CREATE TYPE parse_state      AS ENUM ('unparsed', 'parsed', 'partial', 'quarantined');
CREATE TYPE identifier_kind  AS ENUM ('union', 'union_average', 'survey',
                                      'state_adopted', 'supplemental', 'unrecognised');
-- CORPUS_DESIGN §4.2: the WD publishes an aggregate fringe for union classes; what
-- it does NOT publish is the CBA schedule. D9 refuses the schedule, not the
-- aggregate — refusing the aggregate would refuse half the corpus.
CREATE TYPE fringe_treatment AS ENUM (
  'wd_aggregate', 'wd_aggregate_cba_schedule_unpublished',
  'wd_aggregate_state_adopted', 'unresolved'
);
CREATE TYPE diff_kind  AS ENUM ('added', 'removed', 'rate_changed', 'fringe_changed',
                                'both_changed', 'identifier_changed', 'renamed', 'unchanged');
CREATE TYPE match_tier AS ENUM ('exact', 'fuzzy_in_identifier', 'unmatched');
CREATE TYPE scope_source AS ENUM ('prose', 'index', 'doc_structured');
CREATE TYPE snapshot_state AS ENUM ('open', 'indexed', 'fetched', 'parsed', 'reconciled',
                                    'canaried', 'promoted', 'held', 'superseded', 'rolled_back');
CREATE TYPE probe_id     AS ENUM ('count', 'alias', 'content_hash', 'publisher_revision');
CREATE TYPE probe_result AS ENUM ('pass', 'warn', 'fail', 'freeze');

-- CORPUS_DESIGN §7.2 / ARCHITECTURE §3.7
CREATE TYPE edge_source AS ENUM ('onet_alternate_title', 'onet_occupation',
                                 'string_similarity', 'customer_correction', 'operator_seed');
CREATE TYPE crosswalk_provenance AS ENUM ('deterministic', 'llm_ranked', 'user_confirmed');

CREATE TYPE subscription_status  AS ENUM ('trialing', 'active', 'past_due', 'unpaid',
                                          'canceled', 'incomplete', 'incomplete_expired', 'paused');
CREATE TYPE entitlement_state    AS ENUM ('full', 'restricted', 'export_only', 'none');
CREATE TYPE job_state            AS ENUM ('ready', 'claimed', 'done', 'failed', 'dead');
CREATE TYPE payroll_import_state AS ENUM ('open', 'mapped', 'resolving', 'computed',
                                          'filed', 'expired');

-- USER_JOURNEY §11.8 — G5. "Anything not machine-classifiable counts as human."
CREATE TYPE inbound_class AS ENUM ('human', 'spf_dkim_fail', 'list_unsubscribe', 'known_bulk');

-- CORRECTIONS.md §0.2 — a gate-locked claim renders the MECHANISM sentence, never
-- the outcome sentence, until its counter says otherwise.
CREATE TYPE gate_state AS ENUM ('locked', 'measuring', 'unlocked', 'regressed');

-- =============================================================================
-- 2. IDENTITY AND TENANCY
-- =============================================================================

CREATE TABLE accounts (
  id                   uuid PRIMARY KEY,
  name                 text        NOT NULL,
  status               account_status NOT NULL DEFAULT 'active',
  stripe_customer_id   text UNIQUE,
  created_at           timestamptz NOT NULL DEFAULT now(),
  -- ARCHITECTURE §5.5: deletion is a button executed by code, a modelled state
  -- with a 7-day undo (USER_JOURNEY §12.2), never a request to file.
  deletion_requested_at timestamptz,
  deleted_at           timestamptz,
  -- Destroying this makes residual ciphertext in any backup permanently
  -- undecryptable. It is the only erasure guarantee that survives a store we do
  -- not control (§5.5).
  data_key_uri         text,
  data_key_destroyed_at timestamptz
);

CREATE TABLE users (
  id          uuid PRIMARY KEY,
  email       text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  CONSTRAINT users_email_lower CHECK (email = lower(email))
);
CREATE UNIQUE INDEX users_email_key ON users (email);

CREATE TABLE memberships (
  account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users (id)    ON DELETE CASCADE,
  role       membership_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, user_id)
);
CREATE INDEX memberships_user ON memberships (user_id);

-- =============================================================================
-- 3. THE MIRROR — global, append-only, bitemporal, contains NO customer data
--
-- No `account_id` anywhere in this section and no RLS on any of it: the mirror is
-- global by design (ADR-011) and is retained forever, because total loss of
-- upstream access must degrade us to "cannot detect new revisions since {date}"
-- rather than to a dead product (R1 mitigation (a)).
-- =============================================================================

-- CORPUS_DESIGN §3.3. Immutable, content-addressed blob store. Nothing else in
-- the schema stores raw upstream bytes.
CREATE TABLE wd_blob (
  blob_sha256      bytea       PRIMARY KEY,
  byte_length      integer     NOT NULL,
  media_type       text        NOT NULL,
  ingest_path      char(1)     NOT NULL,      -- 'A' index | 'B' document | 'C' archive
  source_url       text        NOT NULL,
  fetched_at       timestamptz NOT NULL,
  http_status      smallint    NOT NULL,
  response_headers jsonb       NOT NULL DEFAULT '{}'::jsonb,
  content          bytea       NOT NULL,

  CONSTRAINT wd_blob_hash_len  CHECK (octet_length(blob_sha256) = 32),
  CONSTRAINT wd_blob_len_match CHECK (octet_length(content) = byte_length),
  CONSTRAINT wd_blob_path      CHECK (ingest_path IN ('A', 'B', 'C')),
  CONSTRAINT wd_blob_media     CHECK (media_type IN ('application/hal+json', 'text/plain')),
  -- The store is self-certifying: the key IS the hash of the value, as a property
  -- of the database rather than of the ingest code. No later engineer can bypass
  -- it and no bug in the fetcher can poison the store with mislabelled bytes.
  CONSTRAINT wd_blob_selfcert  CHECK (digest(content, 'sha256') = blob_sha256)
);

-- CORPUS_DESIGN §3.3. One row per (wd_number, revision). Three time axes:
-- `revision` (the publisher's ordinal), `publish_date`..`superseded_on` (valid
-- time — when the text governed work in the world) and `first_seen_at` (system
-- time — when we learned it). A dispute asks both "what did the WD say on the day
-- we filed" and "what did Ratepin know on the day it filed"; only both axes
-- answer both.
CREATE TABLE wd_revision (
  wd_number          text     NOT NULL,
  revision           smallint NOT NULL,

  state_code         char(2),                 -- NULL on ~30% of archived records
  wd_year            smallint NOT NULL,
  short_name         text,                    -- 'VA195'
  sequence_no        smallint,

  publish_date       date     NOT NULL,       -- reconciled A.modifiedDate / B.publishDate / D.header
  header_date        date     NOT NULL,       -- path D only: the determination's own header
  superseded_on      date,                    -- publish_date of revision+1; NULL while current
  is_active_upstream boolean  NOT NULL,

  first_seen_at      timestamptz NOT NULL DEFAULT now(),
  last_confirmed_at  timestamptz NOT NULL DEFAULT now(),

  canonical_sha256   bytea    NOT NULL,
  canonical_length   integer  NOT NULL,
  blob_a_sha256      bytea    REFERENCES wd_blob (blob_sha256),
  blob_b_sha256      bytea    REFERENCES wd_blob (blob_sha256),
  blob_c_sha256      bytea    REFERENCES wd_blob (blob_sha256),

  -- Path D: the determination's own modification table, extracted from the text.
  mod_table          jsonb    NOT NULL,
  mod_table_rows     smallint NOT NULL,
  mod_table_first    smallint NOT NULL,
  mod_table_last     smallint NOT NULL,

  agreement          agreement_state NOT NULL,
  variance_detail    jsonb    NOT NULL DEFAULT '[]'::jsonb,
  parse_status       parse_state NOT NULL DEFAULT 'unparsed',
  parse_version      integer  NOT NULL DEFAULT 0,
  class_count        integer,

  -- Stored and NEVER read. Captured on both paths because the mirror records what
  -- each source said, compared by P4a as an ADVISORY variance, and consulted by
  -- nothing: `isStandard` is constant true on 4,236 of 4,236 index records and
  -- `standard` constant false on the document path, so the "disagreement" carries
  -- zero information (C5 / CRIT-1). A column with a write path, a comparison and
  -- no consumer is what "advisory" means in this schema.
  standard_index     boolean,
  standard_document  boolean,
  construction_types text[]   NOT NULL DEFAULT '{}',

  PRIMARY KEY (wd_number, revision),

  CONSTRAINT wd_rev_upper     CHECK (wd_number = upper(wd_number)),
  CONSTRAINT wd_rev_shape     CHECK (wd_number ~ '^[A-Z]{2}[0-9]{8}$'),
  CONSTRAINT wd_rev_nonneg    CHECK (revision >= 0),
  CONSTRAINT wd_rev_hashlen   CHECK (octet_length(canonical_sha256) = 32),
  -- C6: the modification table is a CONTIGUOUS SUFFIX of 0..revision ending
  -- exactly at `revision`. It is NOT always revision+1 rows — WHD omits
  -- modification 0 on 17.0% of a 200-WD live sample, and the `= revision + 1` form
  -- this replaces would have ABORTED the ingest transaction on those rather than
  -- quarantining them. A constraint that has not been measured against the live
  -- corpus is a fail-closed switch wired to an unknown input (C5).
  CONSTRAINT wd_rev_modlast   CHECK (mod_table_last = revision),
  CONSTRAINT wd_rev_modrange  CHECK (mod_table_first >= 0 AND mod_table_first <= mod_table_last),
  CONSTRAINT wd_rev_modsuffix CHECK (mod_table_rows = mod_table_last - mod_table_first + 1),
  CONSTRAINT wd_rev_dates     CHECK (header_date = publish_date),
  CONSTRAINT wd_rev_valid     CHECK (superseded_on IS NULL OR superseded_on >= publish_date),
  CONSTRAINT wd_rev_paths     CHECK (blob_b_sha256 IS NOT NULL)  -- B is mandatory; A and C may be absent
);

CREATE INDEX wd_revision_active_idx  ON wd_revision (wd_number) WHERE superseded_on IS NULL;
CREATE INDEX wd_revision_state_idx   ON wd_revision (state_code, publish_date DESC);
CREATE INDEX wd_revision_canon_idx   ON wd_revision (canonical_sha256);
CREATE INDEX wd_revision_pubdate_idx ON wd_revision (publish_date);

-- CORPUS_DESIGN §3.4. Three fields legitimately change without the determination
-- changing; everything else is frozen. If upstream ever serves DIFFERENT BYTES at
-- the same (wd_number, revision) — silent republication, the single most dangerous
-- thing SAM could do to us — this trigger fires, the ingest transaction aborts,
-- and probe 3 reports a content-hash change with no revision bump. That
-- combination is quarantine, not promotion. There is no code path in which a
-- republished revision quietly replaces the one we already footered onto a filed
-- WH-347.
CREATE OR REPLACE FUNCTION wd_revision_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'wd_revision is append-only' USING ERRCODE = 'restrict_violation';
  END IF;
  IF ROW(NEW.wd_number, NEW.revision, NEW.publish_date, NEW.header_date,
         NEW.canonical_sha256, NEW.mod_table, NEW.first_seen_at)
     IS DISTINCT FROM
     ROW(OLD.wd_number, OLD.revision, OLD.publish_date, OLD.header_date,
         OLD.canonical_sha256, OLD.mod_table, OLD.first_seen_at)
  THEN
    RAISE EXCEPTION 'immutable field changed on wd_revision %/% — a determination''s text '
                    'never changes; a new revision is a new row',
                    OLD.wd_number, OLD.revision USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER wd_blob_immutable
  BEFORE UPDATE OR DELETE ON wd_blob
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_mutation();

CREATE TRIGGER wd_revision_guarded
  BEFORE UPDATE OR DELETE ON wd_revision
  FOR EACH ROW EXECUTE FUNCTION wd_revision_guard();

-- CORPUS_DESIGN §3.3. `shortReferenceNumber` and the four `allReferenceNumbers`
-- spellings are aliases, not identities.
CREATE TABLE wd_alias (
  alias         text NOT NULL,
  wd_number     text NOT NULL,
  source        text NOT NULL DEFAULT 'index.allReferenceNumbers',
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (alias, wd_number),
  CONSTRAINT wd_alias_upper CHECK (alias = upper(alias))
);
CREATE INDEX wd_alias_lookup ON wd_alias (alias);

-- Path A's per-snapshot index rows. Kept per snapshot because the index is a
-- separate failure domain from the document endpoint (ADR-004) and its own history
-- is the evidence behind probes 1 and 2.
CREATE TABLE wd_index_record (
  snapshot_id       bigint   NOT NULL,
  wd_number         text     NOT NULL,
  revision          smallint NOT NULL,
  publish_date      date,
  modified_date     timestamptz,
  is_active         boolean  NOT NULL,
  is_standard       boolean,
  construction_types text[]  NOT NULL DEFAULT '{}',
  counties          jsonb    NOT NULL DEFAULT '[]'::jsonb,
  index_alias       text,
  PRIMARY KEY (snapshot_id, wd_number)
);

-- CORPUS_DESIGN §4.3. `parser_version` is IN the primary key: a re-derivation with
-- a better parser adds a GENERATION alongside the old one and `wd_revision.
-- parse_version` names which is authoritative. Deleting the superseded generation
-- would destroy the evidence that the money did not move (§3.4, §4.4).
CREATE TABLE wd_classification (
  wd_number         text     NOT NULL,
  revision          smallint NOT NULL,
  ordinal           integer  NOT NULL,

  rate_identifier   text     NOT NULL,        -- 'ELEC0080-011', 'SUVA2016-080'
  identifier_kind   identifier_kind NOT NULL,
  identifier_date   date,

  class_name        text     NOT NULL,        -- de-wrapped, whitespace-collapsed
  class_name_raw    text     NOT NULL,        -- exact source lines, newlines preserved
  class_name_norm   text     NOT NULL,        -- upper, punctuation-folded, for matching

  -- Departure 1: MilliRate integers, not numeric(9,2). ENGINE §2.
  base_rate_milli   integer  NOT NULL,
  fringe_rate_milli integer  NOT NULL,
  fringe_treatment  fringe_treatment NOT NULL,

  source_line_start integer  NOT NULL,
  source_line_end   integer  NOT NULL,
  source_sha256     bytea    NOT NULL,        -- = wd_revision.canonical_sha256
  parser_version    integer  NOT NULL,
  wrapped           boolean  NOT NULL,        -- name spanned more than one physical line

  PRIMARY KEY (wd_number, revision, parser_version, ordinal),
  FOREIGN KEY (wd_number, revision) REFERENCES wd_revision (wd_number, revision),

  CONSTRAINT wdc_rates_nonneg CHECK (base_rate_milli >= 0 AND fringe_rate_milli >= 0),
  CONSTRAINT wdc_rate_sane    CHECK (base_rate_milli < 5000000 AND fringe_rate_milli < 5000000),
  CONSTRAINT wdc_lines        CHECK (source_line_end >= source_line_start),
  -- D9's refusal as a database constraint: it is not possible to write a
  -- union-identified classification with a fringe treatment implying we hold its
  -- CBA schedule.
  CONSTRAINT wdc_union_fringe CHECK (
      identifier_kind NOT IN ('union', 'union_average')
      OR fringe_treatment = 'wd_aggregate_cba_schedule_unpublished'),
  CONSTRAINT wdc_unresolved   CHECK (
      identifier_kind <> 'unrecognised' OR fringe_treatment = 'unresolved')
);

CREATE UNIQUE INDEX wdc_class_unique
  ON wd_classification (wd_number, revision, parser_version, class_name_norm, rate_identifier);
CREATE INDEX wdc_name_trgm
  ON wd_classification USING gin (class_name_norm gin_trgm_ops);

CREATE TRIGGER wd_classification_immutable
  BEFORE UPDATE OR DELETE ON wd_classification
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_mutation();

-- Everything downstream reads the authoritative generation only.
CREATE VIEW wd_classification_current AS
SELECT c.*
FROM wd_classification c
JOIN wd_revision r
  ON  r.wd_number = c.wd_number
  AND r.revision  = c.revision
  AND r.parse_version = c.parser_version;

-- CORPUS_DESIGN §4.3. Rows the parser saw but could not resolve. A silently
-- dropped classification is how a wrong rate reaches a signed form (U4): 31.8% of
-- classification names wrap across physical lines with no continuation marker, and
-- a line-by-line parser emits the tail at the head's rate. Nothing is ever
-- dropped; it is written down with a reason and §4.4's quarantine rule reads it.
CREATE TABLE wd_parse_residue (
  wd_number      text     NOT NULL,
  revision       smallint NOT NULL,
  line_start     integer  NOT NULL,
  line_end       integer  NOT NULL,
  raw_text       text     NOT NULL,
  reason         text     NOT NULL,   -- 'buffer_overflow','no_identifier','rate_pattern_ambiguous'
  parser_version integer  NOT NULL,
  PRIMARY KEY (wd_number, revision, line_start, parser_version),
  FOREIGN KEY (wd_number, revision) REFERENCES wd_revision (wd_number, revision)
);

-- CORPUS_DESIGN §5.3. `unchanged` rows are STORED, not elided: the product's most
-- valuable sentence for a nervous payroll administrator is "nothing your crew works
-- under has moved since award", and that sentence requires a positive record per
-- classification, not the absence of one.
CREATE TABLE wd_class_diff (
  wd_number       text     NOT NULL,
  rev_from        smallint NOT NULL,
  rev_to          smallint NOT NULL,

  class_name_norm text     NOT NULL,
  kind            diff_kind  NOT NULL,
  matched_by      match_tier NOT NULL,

  identifier_from text,
  identifier_to   text,
  base_from_milli   integer,
  base_to_milli     integer,
  fringe_from_milli integer,
  fringe_to_milli   integer,

  base_delta_milli   integer GENERATED ALWAYS AS (base_to_milli   - base_from_milli)   STORED,
  fringe_delta_milli integer GENERATED ALWAYS AS (fringe_to_milli - fringe_from_milli) STORED,
  total_delta_milli  integer GENERATED ALWAYS AS
                      ((base_to_milli + fringe_to_milli) - (base_from_milli + fringe_from_milli)) STORED,

  computed_at     timestamptz NOT NULL DEFAULT now(),
  parser_version  integer  NOT NULL,

  PRIMARY KEY (wd_number, rev_from, rev_to, class_name_norm),
  FOREIGN KEY (wd_number, rev_from) REFERENCES wd_revision (wd_number, revision),
  FOREIGN KEY (wd_number, rev_to)   REFERENCES wd_revision (wd_number, revision),

  CONSTRAINT diff_forward   CHECK (rev_to > rev_from),
  CONSTRAINT diff_added     CHECK (kind <> 'added'   OR (base_from_milli IS NULL AND base_to_milli IS NOT NULL)),
  CONSTRAINT diff_removed   CHECK (kind <> 'removed' OR (base_to_milli IS NULL AND base_from_milli IS NOT NULL)),
  CONSTRAINT diff_unmatched CHECK (matched_by <> 'unmatched' OR kind IN ('added', 'removed'))
);
CREATE INDEX wd_class_diff_material ON wd_class_diff (wd_number, rev_to) WHERE kind <> 'unchanged';

-- CORPUS_DESIGN §6.2. Departure 3: surrogate key + unique index on the coalesce
-- expressions the spec wrote as a primary key.
CREATE TABLE wd_county_scope (
  scope_id         bigserial PRIMARY KEY,
  wd_number        text     NOT NULL,
  revision         smallint NOT NULL,
  source           scope_source NOT NULL,
  county_name      text,
  county_name_norm text,
  county_code      integer,
  -- Virginia's independent cities are not inside the counties they adjoin, and a
  -- subcontractor working in Chesapeake who is served a Chesapeake-County rate has
  -- been given a wrong rate. The asterisk is parsed into a boolean, never stripped.
  independent_city boolean  NOT NULL DEFAULT false,
  statewide        boolean  NOT NULL DEFAULT false,
  state_code       char(2)  NOT NULL,
  FOREIGN KEY (wd_number, revision) REFERENCES wd_revision (wd_number, revision),
  CONSTRAINT scope_has_something CHECK (county_name IS NOT NULL OR county_code IS NOT NULL OR statewide)
);
CREATE UNIQUE INDEX wd_county_scope_key ON wd_county_scope
  (wd_number, revision, source, coalesce(county_name_norm, ''), coalesce(county_code, -1));

-- The reconciliation result: one authoritative row per (wd, revision, county). The
-- PROSE county list (path D) is authoritative for scope — it is what a contracting
-- officer reads and the only source present for every revision. Path B's structured
-- codes are stored as advisory and never gate a rate.
CREATE TABLE wd_county_resolved (
  wd_number         text     NOT NULL,
  revision          smallint NOT NULL,
  state_code        char(2)  NOT NULL,
  county_name_norm  text     NOT NULL,
  county_name       text     NOT NULL,
  independent_city  boolean  NOT NULL,
  county_code       integer,
  agreed_with_index boolean  NOT NULL,
  PRIMARY KEY (wd_number, revision, county_name_norm),
  FOREIGN KEY (wd_number, revision) REFERENCES wd_revision (wd_number, revision)
);

-- CORPUS_DESIGN §8.2. A snapshot is a Merkle root over the promoted corpus, built
-- exactly as Certificate Transparency builds its log (RFC 6962 §2.1), so an
-- inclusion proof is 14 hashes and can be checked by anyone holding the root and
-- the determination text, using no Ratepin code.
CREATE TABLE corpus_snapshot (
  snapshot_id          bigserial PRIMARY KEY,
  snapshot_ref         text NOT NULL UNIQUE,          -- 'cs_2026-08-13T06:00Z'
  state                snapshot_state NOT NULL DEFAULT 'open',

  started_at           timestamptz NOT NULL DEFAULT now(),
  promoted_at          timestamptz,
  superseded_at        timestamptz,

  merkle_root          bytea,
  wd_revision_count    integer,
  classification_count integer,
  active_wd_count      integer,

  index_alias          text,
  index_total_active   integer,
  index_total_all      integer,
  index_indexed_date   timestamptz,

  new_revisions        integer NOT NULL DEFAULT 0,
  blocking_variances   integer NOT NULL DEFAULT 0,
  quarantined          integer NOT NULL DEFAULT 0,

  probe_results        jsonb   NOT NULL DEFAULT '{}'::jsonb,
  golden_suite_pass    boolean,
  golden_suite_lines   integer,
  hold_reason          text,

  CONSTRAINT snap_promoted_complete CHECK (
    state <> 'promoted' OR (merkle_root IS NOT NULL
                            AND promoted_at IS NOT NULL
                            AND golden_suite_pass IS TRUE
                            AND blocking_variances = 0)),
  CONSTRAINT snap_root_len CHECK (merkle_root IS NULL OR octet_length(merkle_root) = 32)
);
-- Exactly one promoted snapshot at a time, enforced by the database rather than by
-- the promotion job's own care.
CREATE UNIQUE INDEX corpus_snapshot_current ON corpus_snapshot ((state)) WHERE state = 'promoted';

ALTER TABLE wd_index_record
  ADD CONSTRAINT wd_index_record_snapshot_fk
  FOREIGN KEY (snapshot_id) REFERENCES corpus_snapshot (snapshot_id);

CREATE TABLE snapshot_member (
  snapshot_id bigint   NOT NULL REFERENCES corpus_snapshot (snapshot_id),
  leaf_index  integer  NOT NULL,
  wd_number   text     NOT NULL,
  revision    smallint NOT NULL,
  leaf_hash   bytea    NOT NULL,
  PRIMARY KEY (snapshot_id, leaf_index),
  UNIQUE (snapshot_id, wd_number, revision),
  FOREIGN KEY (wd_number, revision) REFERENCES wd_revision (wd_number, revision),
  CONSTRAINT leaf_len CHECK (octet_length(leaf_hash) = 32)
);

-- CORPUS_DESIGN §9.5 tier 3. Recorded, reported, NEVER blocking. The `standard`
-- flag lives here and nowhere else with any power: it was red on 200/200 and a
-- probe at a 100% red rate whose response is "publish neither path" means the
-- corpus publishes nothing and the product emits nothing.
CREATE TABLE advisory_variance (
  variance_id  bigserial PRIMARY KEY,
  snapshot_id  bigint   REFERENCES corpus_snapshot (snapshot_id),
  wd_number    text     NOT NULL,
  revision     smallint NOT NULL,
  field        text     NOT NULL,     -- 'standard' | 'county_code' | 'county_name' | ...
  value_path_a text,
  value_path_b text,
  value_path_c text,
  value_path_d text,
  detail       jsonb    NOT NULL DEFAULT '{}'::jsonb,
  observed_at  timestamptz NOT NULL DEFAULT now(),
  -- The whole point of the type: an advisory variance may never be surfaced to a
  -- customer, because we have no basis for asserting either side.
  CONSTRAINT advisory_never_blocking CHECK (field <> 'revision_number'
                                        AND field <> 'publish_date'
                                        AND field <> 'active_flag')
);
CREATE INDEX advisory_variance_wd ON advisory_variance (wd_number, revision);

-- CORPUS_DESIGN §10.5
CREATE TABLE probe_run (
  probe_run_id bigserial PRIMARY KEY,
  snapshot_id  bigint     REFERENCES corpus_snapshot (snapshot_id),
  probe        probe_id   NOT NULL,
  result       probe_result NOT NULL,
  observed     jsonb      NOT NULL,
  expected     jsonb      NOT NULL,
  delta_pct    numeric(7,4),
  detail       text,
  ran_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX probe_run_recent ON probe_run (probe, ran_at DESC);

-- Product-scoped freeze. At most one open row. A freeze closes ITSELF after three
-- consecutive clean runs of the probe that opened it: there is no manual clear,
-- because a manual clear is a human minute (A6) and, worse, a human judgement call
-- about upstream health made under pressure.
CREATE TABLE corpus_freeze (
  freeze_id    bigserial PRIMARY KEY,
  opened_at    timestamptz NOT NULL DEFAULT now(),
  closed_at    timestamptz,
  probe        probe_id NOT NULL,
  probe_run_id bigint   NOT NULL REFERENCES probe_run (probe_run_id),
  banner_text  text     NOT NULL,
  suppress_new_assertions boolean NOT NULL DEFAULT true,
  auto_closed  boolean  NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX corpus_freeze_open ON corpus_freeze ((closed_at IS NULL)) WHERE closed_at IS NULL;

-- CORPUS_DESIGN §10.6 — THE BLOCKING-PROBE REGISTER, as a table rather than as
-- prose, because the quarterly re-measurement writes to it and a blocking probe
-- whose red rate has crossed 1% DISARMS ITSELF automatically.
--
-- Invariant 7 / C5: no probe blocks without a measured red rate recorded here. A
-- red rate of exactly zero and a red rate of 100% are the same epistemic state —
-- no demonstrated discrimination — so neither licenses GRANTING blocking power to
-- a field we merely believe should agree.
CREATE TABLE blocking_probe_register (
  probe_key       text PRIMARY KEY,          -- 'revision_number' | 'G-canon' | 'probe_1_count' ...
  spec_section    text     NOT NULL,
  blocking_power  text     NOT NULL,         -- 'snapshot_held' | 'quarantine_wd' | 'frozen' | 'refuses_write' | 'blocks_build' | 'none'
  red_rate_pct    numeric(6,3),              -- NULL = honest blank, not an absent row
  sample_size     integer,
  measured_on     date,
  armed           boolean  NOT NULL DEFAULT false,
  withdrawn       boolean  NOT NULL DEFAULT false,
  withdrawn_reason text,
  note            text,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  -- A red rate above 1% on an armed blocking probe is a SPECIFICATION BUG, not an
  -- incident: it is handled by changing the specification, never by working
  -- through a quarantine queue, which would be a human minute per determination.
  CONSTRAINT register_red_rate_ceiling CHECK (
    withdrawn OR armed = false OR red_rate_pct IS NULL OR red_rate_pct <= 1.0)
);

-- CORPUS_DESIGN §12.6 — the machine-readable obligation changelog, from the eCFR
-- versioner's `content_versions[]`.
CREATE TABLE obligation_changelog (
  change_id      bigserial PRIMARY KEY,
  cfr_title      smallint NOT NULL,
  part           text     NOT NULL,
  section        text     NOT NULL,
  amendment_date date     NOT NULL,
  observed_at    timestamptz NOT NULL DEFAULT now(),
  source_url     text     NOT NULL,
  summary        text,
  detail         jsonb    NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (cfr_title, part, section, amendment_date)
);

-- CORPUS_DESIGN §12.2 / ENGINE §9.2.1, §10. A regulatory figure is a CORPUS VALUE
-- with an effective date and a source URL, never a constant in code. 29 CFR
-- 5.5(b)(2)'s liquidated damages read $10 in the 2010 FOH and $33 in the current
-- eCFR — same rule, same words, a figure that tripled. Anything else guarantees a
-- stale penalty figure in customer-facing copy within a year or two. The 29 CFR 3.5
-- paragraph letters live here too, and a CI test asserts `DeductionCategory`
-- matches them, so a future paragraph (k) fails the build rather than silently
-- blocking lines.
CREATE TABLE regulatory_constant (
  key            text NOT NULL,             -- 'cwhssa_threshold_cents' | 'liquidated_damages_cents' | 'cfr_3_5_paragraphs'
  effective_from date NOT NULL,
  effective_to   date,
  value_cents    bigint,
  value_text     text,
  source_url     text NOT NULL,
  observed_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key, effective_from),
  CONSTRAINT regconst_has_value CHECK (value_cents IS NOT NULL OR value_text IS NOT NULL)
);

-- CORPUS_DESIGN §6.2 — the public lookup surface, feeding D8 channel 2 and the
-- free tier. `agreement IN ('agreed','advisory_variance')` is the field-scoped
-- disagreement rule; `parse_status = 'parsed'` means a quarantined determination is
-- simply absent, so a visitor sees "this determination is under review" rather than
-- a rate we do not trust.
CREATE MATERIALIZED VIEW county_class_rate AS
SELECT
    c.state_code,
    c.county_name_norm,
    c.county_name,
    c.independent_city,
    ct.construction_type,
    cl.class_name_norm,
    cl.class_name,
    cl.rate_identifier,
    cl.identifier_kind,
    cl.base_rate_milli,
    cl.fringe_rate_milli,
    (cl.base_rate_milli + cl.fringe_rate_milli) AS total_rate_milli,
    cl.fringe_treatment,
    r.wd_number,
    r.revision,
    r.publish_date,
    r.canonical_sha256
FROM wd_revision r
JOIN wd_county_resolved c
  ON c.wd_number = r.wd_number AND c.revision = r.revision
JOIN wd_classification_current cl
  ON cl.wd_number = r.wd_number AND cl.revision = r.revision
CROSS JOIN LATERAL unnest(r.construction_types) AS ct(construction_type)
WHERE r.superseded_on IS NULL
  AND r.is_active_upstream
  AND r.parse_status = 'parsed'
  AND r.agreement IN ('agreed', 'advisory_variance');

CREATE UNIQUE INDEX county_class_rate_pk ON county_class_rate
  (state_code, county_name_norm, construction_type, class_name_norm, rate_identifier);
CREATE INDEX county_class_rate_lookup ON county_class_rate
  (state_code, county_name_norm, construction_type);

-- =============================================================================
-- 4. PROJECTS AND PINS
-- =============================================================================

CREATE TABLE projects (
  id                uuid PRIMARY KEY,
  account_id        uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  name              text NOT NULL,

  state_code        char(2) NOT NULL,
  county_name       text    NOT NULL,
  county_name_norm  text    NOT NULL,
  construction_type text    NOT NULL,
  funding_source    text    NOT NULL,
  award_date        date,
  prime_name        text,
  contract_number   text,

  -- AS-2 / ENGINE §7.0. REQUIRED, and deliberately WITHOUT A DEFAULT at any layer:
  -- not in the DDL, not in the Zod schema, not as a pre-checked radio. A default
  -- here is a guess about a federal overtime obligation and both guesses are
  -- harmful. `over_100k` computes a premium that is not owed and can raise a flag
  -- naming a statute the contract is not subject to, telling a compliant
  -- contractor they underpaid; `at_or_under_100k` deletes a real obligation from a
  -- document signed under 18 U.S.C. 1001. `unknown` is the refusing value and
  -- raises CWHSSA_COVERAGE_UNDETERMINED (P-B).
  contract_value_band contract_value_band NOT NULL,
  band_asserted_at    timestamptz NOT NULL,
  band_asserted_by    uuid        NOT NULL REFERENCES users (id),

  -- CORPUS_DESIGN §5.5. The customer's own assertion about their own subcontract —
  -- "does your subcontract name a specific wage determination revision?" — stored
  -- with its timestamp and rendered AS an assertion, never as our finding. It is
  -- the only authority in this product allowed to break the FAR 22.404-6 tie.
  wd_revision_locked_at_award boolean,
  lock_asserted_at            timestamptz,

  dir_project_id    text,
  contractor_pwcr   text,
  wh347_layout      wh347_layout NOT NULL DEFAULT 'wh347_rev_2025_01',
  workweek_start_day smallint NOT NULL DEFAULT 0,

  created_at        timestamptz NOT NULL DEFAULT now(),
  archived_at       timestamptz,

  CONSTRAINT projects_workweek CHECK (workweek_start_day BETWEEN 0 AND 6),
  CONSTRAINT projects_lock_asserted CHECK (
    (wd_revision_locked_at_award IS NULL) = (lock_asserted_at IS NULL))
);
CREATE INDEX projects_account ON projects (account_id, created_at DESC);

-- ARCHITECTURE §5.1 consequence 3: a change order can move a project across
-- $100,000 mid-life. Editing the band writes an audit row and REGENERATES NOTHING
-- already filed — a filed WH-347 states what the customer asserted on the day they
-- signed it, and filings before and after a band change legitimately differ.
CREATE TABLE project_band_events (
  event_id    bigserial PRIMARY KEY,
  account_id  uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  project_id  uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  from_band   contract_value_band,
  to_band     contract_value_band NOT NULL,
  asserted_by uuid NOT NULL REFERENCES users (id),
  asserted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX project_band_events_project ON project_band_events (project_id, asserted_at DESC);

-- ARCHITECTURE §6.2. Append-only: a re-pin is a NEW row. Silently re-pinning would
-- change the rate on a document the customer already reviewed, so the re-pin is
-- always the customer's click (never auto-move).
CREATE TABLE wd_pins (
  id                   uuid PRIMARY KEY,
  account_id           uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  project_id           uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  wd_number            text     NOT NULL,
  revision             smallint NOT NULL,
  wd_published_date    date     NOT NULL,
  snapshot_id          bigint   NOT NULL REFERENCES corpus_snapshot (snapshot_id),
  pinned_at            timestamptz NOT NULL DEFAULT now(),
  pinned_by            uuid     NOT NULL REFERENCES users (id),
  -- Stamped by the nightly run on every pin whose WD it successfully re-verified,
  -- whether or not anything changed: VERIFICATION, not change, is the event.
  freshness_checked_at timestamptz,
  freshness_state      freshness_state NOT NULL DEFAULT 'STALE',
  superseded_by_pin_id uuid REFERENCES wd_pins (id),
  FOREIGN KEY (wd_number, revision) REFERENCES wd_revision (wd_number, revision)
);
CREATE INDEX wd_pins_project ON wd_pins (project_id, pinned_at DESC);
CREATE INDEX wd_pins_wd      ON wd_pins (wd_number, revision);

-- CORPUS_DESIGN §5.5 — the derived standing, computed from the corpus and the pin,
-- never from a model and never from a heuristic. THE RATE NEVER MOVES in any of
-- the three states; supersession changes what we can CLAIM ABOUT CURRENCY, not what
-- the determination said. There is no `is_effective` column anywhere in this
-- schema: effectiveness turns on a contracting-officer finding under FAR 22.404-6
-- that we cannot observe, so we store observable dates and decline the conclusion
-- (P-D).
CREATE VIEW pin_standing AS
SELECT
    p.id            AS pin_id,
    p.project_id,
    p.account_id,
    p.wd_number,
    p.revision      AS revision_pinned,
    cur.revision    AS revision_current,
    cur.publish_date AS current_published_on,
    pin.superseded_on AS pinned_superseded_on,
    proj.wd_revision_locked_at_award AS locked_at_award,
    CASE
      WHEN cur.revision = p.revision                    THEN 'current'
      WHEN coalesce(proj.wd_revision_locked_at_award, false) THEN 'superseded_contract_locked'
      ELSE                                                   'superseded_open'
    END AS standing
FROM wd_pins p
JOIN projects proj  ON proj.id = p.project_id
JOIN wd_revision pin ON pin.wd_number = p.wd_number AND pin.revision = p.revision
JOIN LATERAL (
      SELECT r.revision, r.publish_date FROM wd_revision r
      WHERE r.wd_number = p.wd_number AND r.superseded_on IS NULL
      ORDER BY r.revision DESC LIMIT 1
     ) cur ON true;

-- =============================================================================
-- 5. WORKERS AND PAYROLL
-- =============================================================================

CREATE TABLE workers (
  id             uuid PRIMARY KEY,
  account_id     uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  external_ref   text,
  last_name      text NOT NULL,
  first_name     text NOT NULL,
  middle_initial char(1),
  -- ARCHITECTURE §11.3. The full SSN exists in exactly one column, encrypted under
  -- a per-tenant key whose destruction at deletion is what makes residual
  -- ciphertext in a backup permanently undecryptable. Purged 30 days after
  -- export-on-cancel; `ssn_last4` survives on the 3-year clock because it is the
  -- individually identifying number the federal rule requires on the weekly
  -- transmittal, i.e. compliance data rather than surplus PII.
  ssn_ciphertext bytea,
  ssn_last4      char(4),
  key_version    integer NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now(),
  ssn_purged_at  timestamptz,
  CONSTRAINT workers_last4 CHECK (ssn_last4 IS NULL OR ssn_last4 ~ '^[0-9]{4}$')
);
CREATE INDEX workers_account ON workers (account_id);
CREATE UNIQUE INDEX workers_account_ref ON workers (account_id, external_ref)
  WHERE external_ref IS NOT NULL;

CREATE TABLE payroll_imports (
  id            uuid PRIMARY KEY,
  account_id    uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  project_id    uuid REFERENCES projects (id) ON DELETE CASCADE,
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  uploaded_by   uuid REFERENCES users (id),
  source_sha256 bytea NOT NULL,          -- duplicate uploads are detected by hash
  byte_size     integer NOT NULL,
  r2_key        text,                    -- 90-day retention, then only payroll_lines
  column_map    jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_count     integer NOT NULL DEFAULT 0,
  state         payroll_import_state NOT NULL DEFAULT 'open',
  CONSTRAINT payroll_imports_hashlen CHECK (octet_length(source_sha256) = 32)
);
CREATE INDEX payroll_imports_account ON payroll_imports (account_id, uploaded_at DESC);

-- ENGINE §3's `PayrollWeek`, persisted. `week_ending` comes from the CSV, never
-- from a clock (E1), and `workweek_start_day` and `contract_value_band` are
-- SNAPSHOT onto the week rather than read live from the project, so a filing
-- regenerated eighteen months later during a dispute produces the identical grid
-- and the identical arithmetic.
CREATE TABLE payroll_weeks (
  id                  uuid PRIMARY KEY,
  account_id          uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  project_id          uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  import_id           uuid REFERENCES payroll_imports (id) ON DELETE SET NULL,
  week_ending         date NOT NULL,
  workweek_start_day  smallint NOT NULL,
  contract_value_band contract_value_band NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_weeks_workweek CHECK (workweek_start_day BETWEEN 0 AND 6)
);
CREATE INDEX payroll_weeks_project ON payroll_weeks (project_id, week_ending DESC);

-- ENGINE §3's `WorkerWeek`. `all_work_gross_cents` (col 7B) and `net_paid_cents`
-- (col 9) are CUSTOMER-SUPPLIED and reconciled, never computed: we are not a
-- payroll system (D9), and their number came from a cheque that was actually
-- written. On a mismatch the line blocks with NET_RECONCILIATION_FAILED and both
-- figures are shown — we do not overwrite the customer's net with ours.
CREATE TABLE payroll_worker_weeks (
  id                   uuid PRIMARY KEY,
  account_id           uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  week_id              uuid NOT NULL REFERENCES payroll_weeks (id) ON DELETE CASCADE,
  worker_id            uuid NOT NULL REFERENCES workers (id),
  status               char(2) NOT NULL,      -- WH-347 col 2: 'J' | 'RA'
  apprentice_program   text,
  apprentice_registrar char(3),               -- 'OA' | 'SAA'
  apprentice_level     text,
  all_work_gross_cents bigint  NOT NULL,      -- col 7B
  net_paid_cents       bigint  NOT NULL,      -- col 9
  CONSTRAINT pww_status     CHECK (status IN ('J', 'RA')),
  CONSTRAINT pww_registrar  CHECK (apprentice_registrar IS NULL OR apprentice_registrar IN ('OA', 'SAA')),
  CONSTRAINT pww_apprentice CHECK (status = 'RA' OR apprentice_program IS NULL)
);
CREATE INDEX pww_week ON payroll_worker_weeks (week_id);

-- ENGINE §3's `ClassLine`. One row per classification worked: 29 CFR 5.5(a)(1)(i)
-- permits per-classification rates ONLY where "the employer's payroll records
-- accurately set forth the time spent in each classification". If the CSV does not
-- separate the time we do not have the records, and the line blocks with
-- UNSPLIT_CLASSIFICATION_TIME rather than allocating hours by a heuristic — a
-- heuristic here would be us manufacturing the record the regulation requires the
-- employer to have kept.
--
-- All hours are integer HUNDREDTHS OF AN HOUR; all rates are integer MilliRate.
-- `ot_rate_milli` / `dt_rate_milli` are NULLABLE and NULL IS NOT ZERO: a premium
-- bucket carrying hours but no rate is a bucket whose premium CANNOT BE PROVEN,
-- which is a different fact from one paid at $0.00. Modelling absence as 0 silently
-- converts "we don't know" into "nothing was paid" — the error class P-A exists to
-- prevent.
CREATE TABLE payroll_lines (
  id                   uuid PRIMARY KEY,
  account_id           uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  worker_week_id       uuid NOT NULL REFERENCES payroll_worker_weeks (id) ON DELETE CASCADE,
  ordinal              integer NOT NULL,

  raw_title            text NOT NULL,
  title_norm           text NOT NULL,

  -- The branded ClassificationId, as its four mirror coordinates. NULL until the
  -- line resolves; a classification not on this exact WD revision cannot be
  -- referenced, so it cannot reach the arithmetic (I2).
  class_wd_number      text,
  class_revision       smallint,
  class_parser_version integer,
  class_ordinal        integer,
  class_name_norm      text,
  resolved_at_level    classification_level,

  -- Seven entries each, always: the CA eCPR XSD declares `day` with
  -- minOccurs="7" maxOccurs="7", so matching the strictest downstream consumer
  -- means the XML renderer never has to invent a day.
  day_st_hours         integer[] NOT NULL,
  day_ot_hours         integer[] NOT NULL,
  day_dt_hours         integer[] NOT NULL,

  cash_rate_milli      integer NOT NULL,      -- GROSS straight-time rate, 29 CFR 5.32(a)
  cash_in_lieu_milli   integer NOT NULL DEFAULT 0,
  ot_rate_milli        integer,
  dt_rate_milli        integer,

  resolution_state     line_resolution NOT NULL DEFAULT 'pending',
  block_reasons        block_reason[]  NOT NULL DEFAULT '{}',

  UNIQUE (worker_week_id, ordinal),
  FOREIGN KEY (class_wd_number, class_revision, class_parser_version, class_ordinal)
    REFERENCES wd_classification (wd_number, revision, parser_version, ordinal),
  CONSTRAINT lines_days     CHECK (array_length(day_st_hours, 1) = 7
                               AND array_length(day_ot_hours, 1) = 7
                               AND array_length(day_dt_hours, 1) = 7),
  CONSTRAINT lines_rates    CHECK (cash_rate_milli >= 0 AND cash_in_lieu_milli >= 0),
  CONSTRAINT lines_class_all CHECK (
    (class_wd_number IS NULL) = (class_revision IS NULL) AND
    (class_wd_number IS NULL) = (class_parser_version IS NULL) AND
    (class_wd_number IS NULL) = (class_ordinal IS NULL)),
  -- A resolved line has a classification. This is the status gate's precondition
  -- expressed where it cannot be forgotten.
  CONSTRAINT lines_resolved CHECK (resolution_state <> 'resolved' OR class_wd_number IS NOT NULL),
  CONSTRAINT lines_blocked  CHECK ((resolution_state = 'blocked') = (cardinality(block_reasons) > 0))
);
CREATE INDEX payroll_lines_worker_week ON payroll_lines (worker_week_id);
CREATE INDEX payroll_lines_unresolved  ON payroll_lines (account_id)
  WHERE resolution_state <> 'resolved';

-- WH-347 column 6B. CUSTOMER-ASSERTED per plan: we print it and disclaim it. We
-- neither compute nor verify annualization under 29 CFR 5.25(c), and unfunded-plan
-- credits are refused rather than approximated (D9, P-D).
CREATE TABLE payroll_line_fringe_credits (
  line_id             uuid NOT NULL REFERENCES payroll_lines (id) ON DELETE CASCADE,
  account_id          uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  plan_name           text NOT NULL,
  hourly_credit_milli integer NOT NULL,
  PRIMARY KEY (line_id, plan_name),
  CONSTRAINT fringe_credit_nonneg CHECK (hourly_credit_milli >= 0)
);

-- WH-347 column 8, per WORKER-WEEK rather than per line: WHD's instructions say
-- "enter all deductions made from worker's total gross amount earned FOR ALL WORK",
-- so a worker on two projects in one week has one set of deductions covering both.
-- Netting them against the project-only gross is the most common arithmetic error
-- in hand-completed WH-347s (ENGINE §9.3 D2).
CREATE TABLE payroll_worker_deductions (
  id             bigserial PRIMARY KEY,
  account_id     uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  worker_week_id uuid NOT NULL REFERENCES payroll_worker_weeks (id) ON DELETE CASCADE,
  ordinal        integer NOT NULL,
  raw_label      text    NOT NULL,
  category       deduction_category NOT NULL,
  amount_cents   bigint  NOT NULL,
  UNIQUE (worker_week_id, ordinal),
  CONSTRAINT deduction_nonneg CHECK (amount_cents >= 0)
);

-- =============================================================================
-- 6. FILINGS, ARTIFACTS AND PROVENANCE
-- =============================================================================

-- ARCHITECTURE §5.3 / ADR-013. Written once and never updated except to set
-- `released_at`. A correction is a NEW filing with `amends_filing_id` set and
-- `sequence` incremented: an amended certified payroll is a distinct legal
-- document, not an edit to a signed one. DIR auto-increments payrollNum and
-- amendmentNum (they are fixed="" in the XSD and must be emitted empty), so our
-- sequence is OUR record, not theirs.
CREATE TABLE filings (
  id                 uuid PRIMARY KEY,
  account_id         uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  project_id         uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  week_id            uuid REFERENCES payroll_weeks (id) ON DELETE SET NULL,
  week_ending        date NOT NULL,
  sequence           integer NOT NULL DEFAULT 1,

  state              filing_state    NOT NULL DEFAULT 'DRAFT',
  artifact_status    artifact_status NOT NULL,
  block_reasons      block_reason[]  NOT NULL DEFAULT '{}',
  violation_flags    violation_flag[] NOT NULL DEFAULT '{}',

  pin_id             uuid REFERENCES wd_pins (id),
  corpus_snapshot_id bigint REFERENCES corpus_snapshot (snapshot_id),
  engine_version     integer NOT NULL,
  build_sha          text    NOT NULL,
  xsd_sha256         bytea,
  freshness_state    freshness_state NOT NULL,
  freshness_checked_at timestamptz,

  generated_at       timestamptz NOT NULL DEFAULT now(),
  released_at        timestamptz,
  amends_filing_id   uuid REFERENCES filings (id),

  -- §9.5: a filing our own missing input blocked is NOT BILLABLE. A customer is
  -- never charged for a DRAFT — NOT CERTIFIABLE.
  billable           boolean NOT NULL DEFAULT false,

  -- ARCHITECTURE §6.3, as a constraint rather than as a convention: the status and
  -- the block reasons cannot disagree in the database, in either direction.
  CONSTRAINT filings_status_blocks CHECK (
    (artifact_status = 'DRAFT_NOT_CERTIFIABLE') = (cardinality(block_reasons) > 0)),
  CONSTRAINT filings_dated CHECK (
    artifact_status <> 'CERTIFIABLE' OR freshness_state = 'FRESH'),
  CONSTRAINT filings_billable_certifiable CHECK (
    billable = false OR artifact_status <> 'DRAFT_NOT_CERTIFIABLE'),
  UNIQUE (project_id, week_ending, sequence)
);
CREATE INDEX filings_account ON filings (account_id, week_ending DESC);
CREATE INDEX filings_released ON filings (account_id, project_id) WHERE state = 'RELEASED';

CREATE TABLE artifacts (
  id          uuid PRIMARY KEY,
  account_id  uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  filing_id   uuid NOT NULL REFERENCES filings (id) ON DELETE CASCADE,
  kind        artifact_kind NOT NULL,
  -- I6: the sha256 IS the identity. An amendment is a new filing, never an edit.
  sha256      bytea   NOT NULL,
  r2_key      text    NOT NULL,
  byte_size   integer NOT NULL,
  pii_class   artifact_pii_class NOT NULL DEFAULT 'non_pii',
  provenance  jsonb   NOT NULL,        -- the SAME struct rendered into the bytes
  created_at  timestamptz NOT NULL DEFAULT now(),
  redacted_at timestamptz,             -- ssn_bearing only: SSN -> last four, hash retained
  CONSTRAINT artifacts_hashlen CHECK (octet_length(sha256) = 32),
  UNIQUE (filing_id, kind)
);
CREATE INDEX artifacts_sha ON artifacts (sha256);

-- CORPUS_DESIGN §8.2. Written in the SAME TRANSACTION that renders the bytes; the
-- artifact cannot exist without this row.
--
-- §6.4: this table is the ONLY path to a certifiable artifact, and the mechanism is
-- structural rather than conditional. `account_id`, `project_id`, `revision_pinned`
-- and `revision_at_award` are NOT NULL — four values that do not exist for an
-- anonymous request — so the free generator renders from an EPHEMERAL provenance
-- struct with no row here, and `certifiable` is derived from the PRESENCE of a
-- persisted row, never from a flag. There is no config value and no future feature
-- flip that makes the free generator emit a signed-looking form.
CREATE TABLE artifact_provenance (
  artifact_id        uuid PRIMARY KEY REFERENCES artifacts (id) ON DELETE CASCADE,
  account_id         uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  project_id         uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  week_ending        date NOT NULL,
  artifact_kind      artifact_kind NOT NULL,

  wd_number          text     NOT NULL,
  revision_pinned    smallint NOT NULL,
  revision_at_award  smallint NOT NULL,
  publish_date       date     NOT NULL,
  canonical_sha256   bytea    NOT NULL,

  snapshot_id        bigint   NOT NULL REFERENCES corpus_snapshot (snapshot_id),
  merkle_root        bytea    NOT NULL,
  inclusion_proof    bytea[]  NOT NULL,
  leaf_index         integer  NOT NULL,

  corpus_verified_at timestamptz NOT NULL,
  generated_at       timestamptz NOT NULL DEFAULT now(),
  form_layout        wh347_layout NOT NULL,
  form_pdf_sha256    bytea    NOT NULL,
  xsd_sha256         bytea,
  engine_version     integer  NOT NULL,
  build_sha          text     NOT NULL,
  -- AS-2: a reader asking "why is there no overtime premium on this week?" must be
  -- able to answer it from the PDF alone.
  contract_value_band contract_value_band NOT NULL,
  freshness_state     freshness_state NOT NULL,

  certifiable        boolean  NOT NULL,
  block_reasons      text[]   NOT NULL DEFAULT '{}',

  FOREIGN KEY (wd_number, revision_pinned) REFERENCES wd_revision (wd_number, revision),
  CONSTRAINT prov_root_len CHECK (octet_length(merkle_root) = 32),
  -- D7 as a constraint: an artifact is certifiable if and only if it has no block
  -- reasons. There is no state where a document renders without a watermark while
  -- carrying an unresolved line, because the database will not accept the row.
  CONSTRAINT prov_blocked  CHECK (certifiable = (cardinality(block_reasons) = 0))
);
CREATE INDEX artifact_prov_account ON artifact_provenance (account_id, week_ending DESC);
CREATE INDEX artifact_prov_wd      ON artifact_provenance (wd_number, revision_pinned);

-- Append-only.
CREATE TABLE filing_events (
  id         bigserial PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  filing_id  uuid NOT NULL REFERENCES filings (id) ON DELETE CASCADE,
  at         timestamptz NOT NULL DEFAULT now(),
  kind       text NOT NULL,
  payload    jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX filing_events_filing ON filing_events (filing_id, at);

-- =============================================================================
-- 7. THE CROSSWALK — the compounding asset, and the ONE cross-tenant flow
-- =============================================================================

CREATE TABLE payroll_title (
  title_norm     text PRIMARY KEY,
  first_seen_at  timestamptz NOT NULL DEFAULT now(),
  observation_ct integer NOT NULL DEFAULT 0
);

-- L2: title -> SOC, seeded from O*NET's Alternate Titles file (55,121 rows, 1,595
-- under SOC major group 47-2). SOC is the join key that makes corrections COMPOUND
-- rather than accumulate: without it, account A teaching us that "SPRINKLER FITTER
-- JRNY" means the sprinkler-fitter class in a Virginia Highway determination tells
-- us nothing about account B's "FIRE SPRINKLER INSTALLER" in an Ohio Building one.
CREATE TABLE title_soc_edge (
  title_norm text NOT NULL REFERENCES payroll_title (title_norm),
  soc_code   text NOT NULL,
  source     edge_source NOT NULL,
  weight     real NOT NULL DEFAULT 1.0,
  added_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (title_norm, soc_code, source),
  CONSTRAINT soc_shape    CHECK (soc_code ~ '^[0-9]{2}-[0-9]{4}(\.[0-9]{2})?$'),
  CONSTRAINT weight_range CHECK (weight > 0 AND weight <= 1.0)
);

-- L3: SOC -> WD classification family. No public seed; bootstrapped by string
-- similarity and corrected into shape by customers. THIS is the layer that
-- compounds. Departure 3 again: surrogate key + unique index on the coalesce
-- expressions.
CREATE TABLE soc_wdclass_edge (
  edge_id           bigserial PRIMARY KEY,
  soc_code          text NOT NULL,
  state_code        char(2),          -- NULL = applies nationally
  construction_type text,             -- NULL = applies to all types
  class_name_norm   text NOT NULL,
  source            edge_source NOT NULL,
  support           integer NOT NULL DEFAULT 0,   -- distinct accounts that confirmed
  refutations       integer NOT NULL DEFAULT 0,   -- accounts that chose otherwise after seeing it
  added_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_nonneg CHECK (support >= 0 AND refutations >= 0)
);
CREATE UNIQUE INDEX soc_wdclass_edge_key ON soc_wdclass_edge
  (soc_code, coalesce(state_code, '--'), coalesce(construction_type, '*'), class_name_norm, source);

-- CORPUS_DESIGN §7.2. The account-scoped memory D6 mandates. Append-only; latest
-- row wins. The key includes `wd_number` because the same title maps to different
-- classifications in different determinations, and pretending otherwise is how a
-- Building-determination carpenter rate lands on a Highway filing.
--
-- `account_id` is NOT NULL: every row is attributable (§11.6). `offered` and
-- `chosen_rank` are stored so a correction is MEASURABLE rather than anecdotal —
-- `chosen_rank IS NULL` means the customer rejected all three, which is the single
-- most informative row in the table.
CREATE TABLE crosswalk_observation (
  observation_id    bigserial PRIMARY KEY,
  account_id        uuid     NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  confirmed_by_user_id uuid  REFERENCES users (id),
  wd_number         text     NOT NULL,
  revision          smallint NOT NULL,
  title_norm        text     NOT NULL REFERENCES payroll_title (title_norm),
  title_raw         text     NOT NULL,
  chosen_class_norm text     NOT NULL,
  chosen_identifier text     NOT NULL,

  -- Departure 4: the column `crosswalk_prior` filters on, which §7.2's own table
  -- definition omitted.
  provenance        crosswalk_provenance NOT NULL,

  offered           jsonb    NOT NULL,      -- [{class,identifier,rank,score,source}]
  chosen_rank       smallint,               -- NULL = customer picked outside our top-3
  ranker_version    integer  NOT NULL,
  resolved_at_level classification_level NOT NULL,
  llm_used          boolean  NOT NULL,      -- false on the free tier, always
  decided_at        timestamptz NOT NULL DEFAULT now(),

  eligible_for_aggregate boolean GENERATED ALWAYS AS (provenance = 'user_confirmed') STORED,

  FOREIGN KEY (wd_number, revision) REFERENCES wd_revision (wd_number, revision),
  CONSTRAINT chosen_rank_range CHECK (chosen_rank IS NULL OR chosen_rank BETWEEN 1 AND 3),
  -- The free tier makes zero LLM calls, always (deep dive 03, §7.5).
  CONSTRAINT cw_obs_confirmed_by CHECK (provenance <> 'user_confirmed' OR confirmed_by_user_id IS NOT NULL)
);
CREATE INDEX cw_obs_account  ON crosswalk_observation (account_id, wd_number, title_norm, decided_at DESC);
CREATE INDEX cw_obs_learning ON crosswalk_observation (title_norm, chosen_class_norm);

-- HIGH-2: signup is a free magic link, so "distinct account" is an
-- attacker-controlled input, and k-anonymity over a freely-mintable population is
-- not a boundary. COSTLY-SIGNAL ELIGIBILITY is what makes k mean something — four
-- released filings across two projects is weeks of real work per sybil, against a
-- $0 signup. A DRAFT — NOT CERTIFIABLE filing never counts.
--
-- This view is deliberately NOT granted to `ratepin_app`: it names account ids, and
-- it exists only to be joined inside `crosswalk_prior`, which runs as owner.
CREATE VIEW crosswalk_eligible_account AS
SELECT f.account_id
FROM filings f
WHERE f.state = 'RELEASED'
GROUP BY f.account_id
HAVING count(*) >= 4
   AND count(DISTINCT f.project_id) >= 2;

-- The aggregate prior. AS-5 / HIGH-2: consumers may use this to ORDER a candidate
-- list and for NOTHING ELSE — there is deliberately no column here in which a
-- selection could be expressed. It may not pre-select, may not populate a default,
-- may not auto-apply and may not shorten the list.
--
-- Rebuilt on a FIXED SCHEDULE (nightly, after promotion) and NEVER on a deletion
-- event: k = 5 is a publication floor, not a differencing defence, and an observer
-- who snapshots the prior before and after a deletion would otherwise watch a cell
-- at exactly k = 5 vanish. The schedule is the mitigation, together with the
-- bucketed output — `agreement_band` rather than a raw count, so the exact k of a
-- cell is not readable from any API. This is mitigation by batching and coarsening,
-- recorded as such rather than as a privacy guarantee (§7.4).
CREATE MATERIALIZED VIEW crosswalk_prior AS
SELECT
    o.title_norm,
    r.state_code,
    ct.construction_type,
    o.chosen_class_norm,
    width_bucket(
        count(DISTINCT o.account_id)::numeric
          / nullif(sum(count(DISTINCT o.account_id)) OVER (
                PARTITION BY o.title_norm, r.state_code, ct.construction_type), 0),
        0::numeric, 1::numeric, 5)            AS agreement_band,
    date_trunc('day', now())                  AS as_of
FROM crosswalk_observation o
JOIN crosswalk_eligible_account e ON e.account_id = o.account_id
JOIN wd_revision r ON r.wd_number = o.wd_number AND r.revision = o.revision
CROSS JOIN LATERAL unnest(r.construction_types) AS ct(construction_type)
WHERE o.provenance = 'user_confirmed'
  AND o.account_id IS NOT NULL
GROUP BY 1, 2, 3, 4
HAVING count(DISTINCT o.account_id) >= 5;

CREATE UNIQUE INDEX crosswalk_prior_pk ON crosswalk_prior
  (title_norm, state_code, construction_type, chosen_class_norm);

-- =============================================================================
-- 8. BILLING — the money boundary
--
-- Never callable from the engine: the engine must not be able to decide whether a
-- filing is BILLABLE, only whether it is CERTIFIABLE (§3.6).
-- =============================================================================

CREATE TABLE plans (
  id                  text PRIMARY KEY,      -- 'solo' | 'crew' | 'multi'
  name                text    NOT NULL,
  price_cents         integer NOT NULL,
  included_filings    integer,
  overage_price_cents integer,
  auto_upgrade_to     text REFERENCES plans (id),
  project_cap         integer,
  worker_cap          integer,
  features            jsonb   NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT plans_price_nonneg CHECK (price_cents >= 0)
);

CREATE TABLE subscriptions (
  account_id             uuid PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  plan_id                text REFERENCES plans (id),
  status                 subscription_status NOT NULL,
  entitlement_state      entitlement_state   NOT NULL DEFAULT 'none',
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean NOT NULL DEFAULT false,
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Posted by the worker AFTER the filing transaction commits, keyed on filing_id, so
-- a retry cannot double-bill.
CREATE TABLE meter_events (
  id              bigserial PRIMARY KEY,
  account_id      uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  filing_id       uuid NOT NULL REFERENCES filings (id) ON DELETE CASCADE,
  stripe_event_id text,
  at              timestamptz NOT NULL DEFAULT now(),
  quantity        integer NOT NULL DEFAULT 1,
  idempotency_key text NOT NULL UNIQUE
);
CREATE UNIQUE INDEX meter_events_filing ON meter_events (filing_id);

-- CORPUS_DESIGN §11.4: Stripe balance transactions CANNOT BE DELETED, and an
-- unattended system WILL retry — on a container restart, a partial network failure,
-- or two cron instances overlapping. Idempotency is therefore load-bearing rather
-- than defensive: without it we over-credit permanently, with no undo except a
-- compensating debit that looks to the customer like a surprise charge.
CREATE TABLE credits (
  id                    bigserial PRIMARY KEY,
  account_id            uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  incident_id           bigint,
  staleness_window_id   uuid,
  period_start          timestamptz,
  cents                 integer NOT NULL,
  reason                text    NOT NULL DEFAULT 'corpus_staleness',
  stripe_balance_txn_id text,
  idempotency_key       text NOT NULL UNIQUE,
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT credits_positive CHECK (cents > 0)
);

CREATE TABLE refunds (
  id               bigserial PRIMARY KEY,
  account_id       uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  stripe_refund_id text,
  cents            integer NOT NULL,
  reason_code      text    NOT NULL,
  requested_at     timestamptz NOT NULL DEFAULT now(),
  executed_at      timestamptz,
  idempotency_key  text NOT NULL UNIQUE,
  CONSTRAINT refunds_positive CHECK (cents > 0)
);

-- ADR-007: the webhook ledger IS the source of truth for money. We record; Stripe
-- decides.
CREATE TABLE stripe_events (
  id           text PRIMARY KEY,        -- Stripe's own event id: replay is free
  type         text  NOT NULL,
  payload      jsonb NOT NULL,
  received_at  timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error        text
);
CREATE INDEX stripe_events_unprocessed ON stripe_events (received_at) WHERE processed_at IS NULL;

-- D4 / J3: the $49 bid rate card is purchasable BEFORE an account exists, so it
-- cannot be account-scoped. It auto-attaches if she later signs up with the same
-- email (heuristic #6).
CREATE TABLE rate_card_purchases (
  id                 uuid PRIMARY KEY,
  stripe_session_id  text UNIQUE,
  email              text NOT NULL,
  cents              integer NOT NULL,
  delivery_token     text NOT NULL UNIQUE,
  purchased_at       timestamptz NOT NULL DEFAULT now(),
  expires_at         timestamptz NOT NULL,
  claimed_by_account_id uuid REFERENCES accounts (id),
  CONSTRAINT rate_card_email_lower CHECK (email = lower(email))
);

-- =============================================================================
-- 9. OPERATIONS, JOBS AND THE G1..G6 INSTRUMENTATION
--
-- I7: nothing pages a human, because there is no human. Every signal terminates in
-- one of exactly four automatic actions — degrade the claim, freeze promotion,
-- credit the customer, roll back the release. A signal that cannot be routed to one
-- of the four is not an alert; it is a counter, and these are the counters.
-- =============================================================================

-- ADR-005: `SELECT … FOR UPDATE SKIP LOCKED` over this table is the queue. The
-- unique `idempotency_key` is what stops a double-claim after a worker crash from
-- double-billing, double-crediting or double-promoting.
CREATE TABLE jobs (
  id              bigserial PRIMARY KEY,
  kind            text  NOT NULL,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  state           job_state NOT NULL DEFAULT 'ready',
  run_after       timestamptz NOT NULL DEFAULT now(),
  claimed_at      timestamptz,
  lease_until     timestamptz,
  attempts        integer NOT NULL DEFAULT 0,
  last_error      text,
  idempotency_key text UNIQUE,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX jobs_claimable ON jobs (run_after) WHERE state = 'ready';

CREATE TABLE incidents (
  id            bigserial PRIMARY KEY,
  opened_at     timestamptz NOT NULL DEFAULT now(),
  closed_at     timestamptz,
  level         ladder_level NOT NULL,
  scope         text NOT NULL,          -- 'snapshot' | 'product' | 'wd:<number>' | 'release'
  cause         text NOT NULL,
  -- The exhaustiveness check in `src/ops/response.ts` is a type error away from
  -- being violated; this column is its persisted form. There is no member here
  -- meaning "notify someone".
  auto_response text NOT NULL,          -- 'degrade_claim' | 'freeze_promotion' | 'credit_customer' | 'rollback_release'
  detail        jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT incidents_response CHECK (
    auto_response IN ('degrade_claim', 'freeze_promotion', 'credit_customer', 'rollback_release'))
);

-- G1 — rate correctness. >=500 golden payroll lines across >=25 WDs and >=8 states,
-- re-scored on every corpus refresh AND every deploy. 100% exact match required;
-- any divergence blocks index promotion and the build. No accuracy claim published
-- until 30 consecutive green days.
CREATE TABLE canary_runs (
  id                 bigserial PRIMARY KEY,
  at                 timestamptz NOT NULL DEFAULT now(),
  build_sha          text NOT NULL,
  corpus_snapshot_id bigint REFERENCES corpus_snapshot (snapshot_id),
  trigger            text NOT NULL,       -- 'ci' | 'pre_promotion' | 'post_deploy'
  total              integer NOT NULL,
  passed             integer NOT NULL,
  distinct_wds       integer NOT NULL,
  distinct_states    integer NOT NULL,
  first_divergence   jsonb,
  green              boolean GENERATED ALWAYS AS (passed = total) STORED
);
CREATE INDEX canary_runs_recent ON canary_runs (at DESC);

-- G2 — form acceptance. No "accepted by the agency" claim until >=50 WH-347s and
-- >=25 CA eCPR XML files generated by us have been CONFIRMED accepted by the
-- receiving GC or agency, recorded via in-product confirmation, with the XSD hash
-- check green across the whole window. Acceptance is unobservable from inside our
-- system, which is exactly why the gate exists.
CREATE TABLE form_acceptance_confirmations (
  id                uuid PRIMARY KEY,
  account_id        uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  filing_id         uuid NOT NULL REFERENCES filings (id) ON DELETE CASCADE,
  artifact_kind     artifact_kind NOT NULL,
  receiver          text NOT NULL,        -- 'gc' | 'agency' | 'dir_portal'
  accepted          boolean NOT NULL,
  rejection_detail  text,
  xsd_sha256        bytea,
  confirmed_at      timestamptz NOT NULL DEFAULT now(),
  confirmed_by      uuid REFERENCES users (id)
);
CREATE INDEX form_acceptance_kind ON form_acceptance_confirmations (artifact_kind, confirmed_at DESC);

-- G3 — corpus completeness. Nightly reconciliation of our active-WD count against
-- the index total. Any delta above 0.5% halts promotion. No "every wage
-- determination" claim until 60 days of zero unexplained delta.
CREATE TABLE corpus_reconciliation (
  id                 bigserial PRIMARY KEY,
  at                 timestamptz NOT NULL DEFAULT now(),
  snapshot_id        bigint REFERENCES corpus_snapshot (snapshot_id),
  our_active_count   integer NOT NULL,
  index_total_active integer NOT NULL,
  delta_pct          numeric(7,4) NOT NULL,
  explained          boolean NOT NULL DEFAULT false,
  verdict            text NOT NULL         -- 'pass' | 'held' | 'frozen'
);

-- G4 — time saved. Only ever stated as a MEASURED in-product median from
-- payroll-CSV upload to artifact download across >=100 real filings: "median N
-- minutes over N filings", never a DOL-derived extrapolation.
CREATE TABLE filing_durations (
  id           bigserial PRIMARY KEY,
  account_id   uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  filing_id    uuid NOT NULL REFERENCES filings (id) ON DELETE CASCADE,
  upload_at    timestamptz NOT NULL,
  artifact_at  timestamptz NOT NULL,
  seconds      integer NOT NULL,
  real_filing  boolean NOT NULL DEFAULT true,   -- excludes our own test traffic, by flag not by judgement
  UNIQUE (filing_id)
);

-- G5 — autonomy, redefined so that it can fail (USER_JOURNEY §11.8, MED-2).
-- The published-address set is a config list, and CI asserts it is EXACTLY the set
-- of addresses appearing anywhere the company can be written to. An address that
-- can receive mail and is not declared fails the build; that closes the obvious
-- evasion of moving load to an address the counter does not watch.
CREATE TABLE published_addresses (
  address    text PRIMARY KEY,
  surface    text NOT NULL,      -- 'copy_bundle' | 'artifact_template' | 'dns_mx' | 'stripe_receipt' | ...
  added_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT published_address_lower CHECK (address = lower(address))
);

-- Count everything, decide nothing. No exclusions, no triage, no category called
-- "didn't need an answer". A mechanical filter may derive a smaller number
-- ALONGSIDE the raw total, never instead of it, and anything not machine-classifiable
-- counts as human. Nobody at Ratepin ever decides whether a message counted.
CREATE TABLE inbound_messages (
  id              bigserial PRIMARY KEY,
  received_at     timestamptz NOT NULL DEFAULT now(),
  address         text NOT NULL REFERENCES published_addresses (address),
  classification  inbound_class NOT NULL DEFAULT 'human',
  classifier_rule text,          -- the named machine-checkable rule, or NULL
  first_reply_at  timestamptz,
  -- The floor exists because "we never replied" must not read as "it cost us
  -- nothing": reading a message and deciding not to answer is the cheapest possible
  -- human minute, and it is still a human minute. Never replying is thereby the
  -- WORST strategy rather than the best.
  minutes_charged integer NOT NULL DEFAULT 1,
  CONSTRAINT inbound_minutes_floor CHECK (minutes_charged >= 1),
  CONSTRAINT inbound_rule_required CHECK (classification = 'human' OR classifier_rule IS NOT NULL)
);
CREATE INDEX inbound_messages_recent ON inbound_messages (received_at DESC);

-- G6 — risk reversal. The staleness auto-credit must fire correctly in a CHAOS TEST
-- — upstream source killed in staging — before the guarantee is advertised
-- anywhere. `chaos_test` marks those windows so they are counted as evidence for
-- the gate and excluded from the customer-facing incident history.
CREATE TABLE staleness_windows (
  id           uuid PRIMARY KEY,
  account_id   uuid REFERENCES accounts (id) ON DELETE CASCADE,
  verified_at  timestamptz NOT NULL,        -- last successful promotion before the lapse
  opened_at    timestamptz NOT NULL DEFAULT now(),
  resumed_at   timestamptz,
  probe        probe_id,
  chaos_test   boolean NOT NULL DEFAULT false,
  credit_id    bigint REFERENCES credits (id)
);

-- CORRECTIONS.md §0.2 — the claim register, in the database, so that copy renders
-- FROM THE COUNTER rather than from a decision. While a gate is locked the renderer
-- emits the mechanism sentence ("how it works"), not the outcome sentence: we state
-- what we do and decline to state what it achieves (P-D). A measured claim that
-- regresses narrows automatically (P-C).
CREATE TABLE claim_gates (
  gate_key         text PRIMARY KEY,        -- 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6'
  description      text NOT NULL,
  state            gate_state NOT NULL DEFAULT 'locked',
  measured_value   numeric(12,4),
  denominator      integer,
  window_days      integer,
  consecutive_days integer NOT NULL DEFAULT 0,
  unlocked_at      timestamptz,
  evidence         jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 10. ROW-LEVEL SECURITY
--
-- ADR-011. Application-layer scoping alone is OWASP API1:2023 waiting to happen:
-- this product holds multi-user accounts, worker SSNs and money-bearing artifacts.
-- RLS is the second, independent mechanism — the repositories still take a
-- TenantContext, and this is what makes a forgotten one a zero-row bug rather than
-- a cross-tenant read.
--
-- FORCE is not optional: without it the table owner (the migration role) silently
-- bypasses every policy, and the tests would pass while production leaked.
--
-- The mirror is deliberately absent from this list. It is global, it contains no
-- customer data, and it carries a different protection: no UPDATE grant at all (I5).
-- =============================================================================

CREATE OR REPLACE FUNCTION ratepin_enable_tenant_rls(p_table text, p_column text DEFAULT 'account_id')
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', p_table);
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR ALL TO ratepin_app USING (%I = ratepin_current_account()) '
    || 'WITH CHECK (%I = ratepin_current_account())',
    p_table || '_tenant_isolation', p_table, p_column, p_column);
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO ratepin_app', p_table);
END $$;

SELECT ratepin_enable_tenant_rls('accounts', 'id');
SELECT ratepin_enable_tenant_rls('memberships');
SELECT ratepin_enable_tenant_rls('projects');
SELECT ratepin_enable_tenant_rls('project_band_events');
SELECT ratepin_enable_tenant_rls('wd_pins');
SELECT ratepin_enable_tenant_rls('workers');
SELECT ratepin_enable_tenant_rls('payroll_imports');
SELECT ratepin_enable_tenant_rls('payroll_weeks');
SELECT ratepin_enable_tenant_rls('payroll_worker_weeks');
SELECT ratepin_enable_tenant_rls('payroll_lines');
SELECT ratepin_enable_tenant_rls('payroll_line_fringe_credits');
SELECT ratepin_enable_tenant_rls('payroll_worker_deductions');
SELECT ratepin_enable_tenant_rls('filings');
SELECT ratepin_enable_tenant_rls('filing_events');
SELECT ratepin_enable_tenant_rls('artifacts');
SELECT ratepin_enable_tenant_rls('artifact_provenance');
SELECT ratepin_enable_tenant_rls('crosswalk_observation');
SELECT ratepin_enable_tenant_rls('subscriptions');
SELECT ratepin_enable_tenant_rls('meter_events');
SELECT ratepin_enable_tenant_rls('credits');
SELECT ratepin_enable_tenant_rls('refunds');
SELECT ratepin_enable_tenant_rls('filing_durations');
SELECT ratepin_enable_tenant_rls('form_acceptance_confirmations');

-- `users` is global-by-identity (one email, potentially several accounts), so it is
-- scoped by MEMBERSHIP rather than by a column.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CREATE POLICY users_tenant_isolation ON users FOR ALL TO ratepin_app
  USING (EXISTS (SELECT 1 FROM memberships m
                 WHERE m.user_id = users.id AND m.account_id = ratepin_current_account()))
  WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO ratepin_app;

-- `staleness_windows` carries a NULLABLE account_id: a chaos-test window and a
-- product-wide lapse belong to nobody.
ALTER TABLE staleness_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE staleness_windows FORCE ROW LEVEL SECURITY;
CREATE POLICY staleness_windows_tenant_isolation ON staleness_windows FOR ALL TO ratepin_app
  USING (account_id IS NULL OR account_id = ratepin_current_account())
  WITH CHECK (account_id IS NULL OR account_id = ratepin_current_account());
GRANT SELECT, INSERT, UPDATE, DELETE ON staleness_windows TO ratepin_app;

-- ---------------------------------------------------------------------------
-- Grants outside the tenant boundary.
-- ---------------------------------------------------------------------------

-- The mirror: READ ONLY for the application. I5 — `wd_blob`, `wd_revision` and
-- `wd_classification` have no UPDATE or DELETE grant, in addition to the triggers.
-- Only the promotion job, running as the owner, writes here.
GRANT SELECT ON wd_blob, wd_revision, wd_alias, wd_index_record, wd_classification,
                wd_classification_current, wd_parse_residue, wd_class_diff,
                wd_county_scope, wd_county_resolved, corpus_snapshot, snapshot_member,
                advisory_variance, probe_run, corpus_freeze, blocking_probe_register,
                obligation_changelog, regulatory_constant, county_class_rate,
                pin_standing, plans
  TO ratepin_app;

-- The crosswalk's non-tenant layers: readable, and writable only where a customer
-- correction legitimately extends them.
GRANT SELECT, INSERT, UPDATE ON payroll_title, title_soc_edge, soc_wdclass_edge TO ratepin_app;

-- The aggregate prior: readable as BANDS. `crosswalk_eligible_account` is NOT
-- granted — it names account ids and exists only inside the matview's definition.
GRANT SELECT ON crosswalk_prior TO ratepin_app;

-- Ops surfaces the web tier reads or the worker writes.
GRANT SELECT, INSERT, UPDATE ON jobs, incidents, stripe_events, rate_card_purchases TO ratepin_app;
GRANT SELECT ON canary_runs, corpus_reconciliation, claim_gates, published_addresses TO ratepin_app;
GRANT SELECT, INSERT ON inbound_messages, filing_events TO ratepin_app;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ratepin_app;

-- =============================================================================
-- 11. SEED — the register and the gates start in their refusing state
--
-- ARCHITECTURE §5.1: "an added required field backfills to the refusing value,
-- never to the convenient one." The same rule applied to claims: every gate starts
-- LOCKED, and no copy surface may render its outcome sentence until a counter says
-- otherwise.
-- =============================================================================

INSERT INTO claim_gates (gate_key, description, state, window_days) VALUES
  ('G1', 'Rate correctness — >=500 golden lines, >=25 WDs, >=8 states, 100% exact match; no claim until 30 consecutive green days', 'locked', 30),
  ('G2', 'Form acceptance — >=50 WH-347 and >=25 CA eCPR confirmed accepted, XSD hash green across the window', 'locked', NULL),
  ('G3', 'Corpus completeness — nightly delta vs index total <=0.5%; no "every wage determination" claim until 60 days of zero unexplained delta', 'locked', 60),
  ('G4', 'Time saved — measured in-product median upload-to-download across >=100 real filings', 'locked', NULL),
  ('G5', 'Autonomy — 90 days below 2 human-minutes per customer per month at >=50 paying accounts', 'locked', 90),
  ('G6', 'Risk reversal — the staleness auto-credit fires correctly in a chaos test before the guarantee is advertised', 'locked', NULL);

-- CORPUS_DESIGN §10.6, transcribed. Two rows are WITHDRAWN and stay in the table:
-- deleting the evidence of a mistake is how the mistake comes back.
INSERT INTO blocking_probe_register
  (probe_key, spec_section, blocking_power, red_rate_pct, sample_size, measured_on, armed, withdrawn, withdrawn_reason, note) VALUES
  ('revision_number_disagreement', '9.5', 'snapshot_held',  0.000, 200, DATE '2026-08-13', true,  false, NULL, 'Tier 1 blocking set'),
  ('publish_date_disagreement',    '9.5', 'snapshot_held',  0.000, 200, DATE '2026-08-13', true,  false, NULL, 'Tier 1 blocking set'),
  ('active_flag_disagreement',     '9.5', 'snapshot_held',  0.000, 200, DATE '2026-08-13', true,  false, NULL, 'Tier 1 blocking set'),
  ('tier0_identity_precondition',  '9.5', 'quarantine_wd',  0.000, 200, DATE '2026-08-13', true,  false, NULL, 'Not a variance: a mismatch is a bug in us'),
  ('g_canon_b_vs_c',               '9.4', 'quarantine_wd',  0.000,  75, DATE '2026-08-13', true,  false, NULL, 'Canonical equality across paths B and C'),
  ('g_modtable_suffix',            '9.4', 'quarantine_wd',  0.000, 200, DATE '2026-08-13', true,  false, NULL, 'C6 suffix form'),
  ('wd_rev_modtable_checks',       '3.3', 'refuses_write',  0.000, 200, DATE '2026-08-13', true,  false, NULL, 'CHECK constraints, the backstop behind G-modtable'),
  ('probe_1_count_delta',          '10.1','snapshot_held',  NULL,  NULL, NULL,             true,  false, NULL, 'Fires between nights; red rate enters from a 60-night rolling window (H10)'),
  ('probe_1_zero_total_precondition','10.1','snapshot_held', 0.000,   1, DATE '2026-08-13', true,  false, NULL, 'totalElements:0 with HTTP 200 is reproducible at page=99&size=100'),
  ('probe_2_alias_and_count',      '10.2','frozen',         NULL,  NULL, NULL,             true,  false, NULL, 'Fires per alias roll; blank until observed twice (H10)'),
  ('probe_3_hash_no_revision_bump','10.3','frozen',         NULL,  NULL, NULL,             true,  false, NULL, 'Fires per republication; blank until observed (H10)'),
  ('probe_4_publisher_revision',   '10.4','none',           NULL,  NULL, NULL,             true,  false, NULL, 'By design raises an alert and never blocks'),
  ('g_parse_six_rules',            '4.4', 'quarantine_wd',  NULL,  NULL, NULL,             true,  false, NULL, 'Not yet measured — needs the first full-corpus parse (H3, H10)'),
  ('g_canary_golden_suite',        '9.4', 'blocks_build',   0.000, NULL, DATE '2026-08-13', true,  false, NULL, 'Zero by construction on a frozen corpus'),
  ('standard_flag_disagreement',   '9.5', 'none',         100.000, 200, DATE '2026-08-13', false, true,
     'Red on 200/200; isStandard constant true across 4,236 active index records and standard constant false on path B. A fixed offset between two vocabularies, carrying zero information. Its response was QUARANTINE, so at a 100% red rate the corpus publishes nothing and the product emits nothing (C5 / CRIT-1).',
     'WITHDRAWN — retained as evidence'),
  ('mod_table_rows_eq_revision_plus_one', '3.3', 'none',  17.000, 200, DATE '2026-08-13', false, true,
     'Red on 34/200: WHD declines to print modification 0 on 17.0% of a live sample. Being a CHECK rather than a probe, it would not have quarantined those determinations — it would have aborted the ingest transaction that touched them (C6).',
     'WITHDRAWN — replaced by the three-constraint suffix form');

-- CORPUS_DESIGN §12.2 / ENGINE §9.2.1. Fetched from the eCFR API on 2026-08-13.
INSERT INTO regulatory_constant (key, effective_from, value_cents, value_text, source_url) VALUES
  ('cwhssa_threshold_cents',   DATE '2023-08-23', 10000000, NULL,
   'https://www.ecfr.gov/current/title-29/subtitle-A/part-5/section-5.5'),
  ('liquidated_damages_cents', DATE '2023-08-23',     3300, NULL,
   'https://www.ecfr.gov/current/title-29/subtitle-A/part-5/section-5.5'),
  ('cfr_3_5_paragraphs',       DATE '2023-08-23',     NULL, 'a,b,c,d,e,f,g,h,i,j',
   'https://www.ecfr.gov/current/title-29/subtitle-A/part-3/section-3.5');

INSERT INTO obligation_changelog (cfr_title, part, section, amendment_date, source_url, summary) VALUES
  (29, '3', '3.5',  DATE '2023-08-23', 'https://www.ecfr.gov/api/versioner/v1/versions/title-29.json',
   'Ten lettered paragraphs (a)-(j); 88 FR 57730. (i) board/lodging/facilities, (j) nominal-value safety equipment.'),
  (29, '5', '5.5',  DATE '2023-08-23', 'https://www.ecfr.gov/api/versioner/v1/versions/title-29.json',
   'CWHSSA clauses inserted "in any contract in an amount in excess of $100,000"; (b)(2) liquidated damages $33/day.');

INSERT INTO plans (id, name, price_cents, included_filings, overage_price_cents, project_cap, worker_cap, features) VALUES
  ('solo',  'Solo',   9900, NULL, NULL,  1, 15, '{"ecpr":false,"wd_change_alerts":false,"portal_export":false}'::jsonb),
  ('crew',  'Crew',  24900, NULL, NULL,  5, 75, '{"ecpr":true,"wd_change_alerts":true,"portal_export":false}'::jsonb),
  ('multi', 'Multi', 59900, NULL, NULL, NULL, NULL, '{"ecpr":true,"wd_change_alerts":true,"portal_export":true,"full_archive":true}'::jsonb);

UPDATE plans SET auto_upgrade_to = 'crew'  WHERE id = 'solo';
UPDATE plans SET auto_upgrade_to = 'multi' WHERE id = 'crew';
