-- =============================================================================
-- 0001 — THE CALIFORNIA CONTRACTOR IDENTITY, MOVED TO WHERE DIR PUTS IT
--
-- Build review NEW-7: the eCPR emitter is correct, gated and tested, and no screen
-- collects the FEIN, the licence, the contractor address, the PWCR or the DIR
-- Project ID. `0000_init.sql` put all seven of those on `projects`, and said so:
--
--   "They live on the PROJECT rather than on the account because that is where
--    `contractor_pwcr` and `dir_project_id` already lived … A company-wide profile
--    that filled them in by default would be a convenience worth having and is not
--    one this table forecloses."
--
-- This migration takes that up, and it is not only a convenience. Read against DIR's
-- own registration rule the split is a fact rather than a preference:
--
--   * The **PWCR** is issued to the CONTRACTOR under Labor Code §1725.5. One
--     registration, renewed annually, covers every public works project the company
--     bids or performs — it is not issued per project and it does not change when a
--     project does. Same for the **FEIN**, the **CSLB licence** and the **business
--     address**: they identify the company, and DIR's eCPR carries them in
--     `cprInfo` because the file has to say who is certifying, not where.
--   * The **DIR Project ID** is the awarding body's. It exists only once THEY file
--     a PWC-100 for THAT project, so it is per project by construction and stays on
--     `projects` where it already was.
--
-- Storing the company block per project meant re-typing a FEIN on every job and,
-- worse, made a typo on job seven a silently different certifying entity from job
-- six. One row per account removes that failure mode: a correction is made once and
-- every future filing carries it.
--
-- ---------------------------------------------------------------------------
-- RETENTION, STATED BEFORE IT IS ASKED
--
-- These are business registration identifiers, every one of them a matter of public
-- record (the CSLB licence lookup and DIR's own PWCR search are public search
-- tools), and every one of them is PRINTED INTO the eCPR XML for each week. They
-- fall in the same class the deletion scope already names `projects_and_pins`:
-- retained alongside the artifacts they are printed into, because deleting the row
-- would not remove the identity from bytes we have told the customer are
-- reproducible. NO NEW PERSONAL-DATA CLASS IS CREATED HERE — the personal data on
-- the eCPR path is `workers.ssn_ciphertext`, which is unchanged by this file and is
-- erased, with its key destroyed, by `ssn_ciphertext` in that same scope.
-- =============================================================================

CREATE TABLE ca_contractor_identity (
  account_id     uuid PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,

  -- `cprInfo/contractorName`. Collected rather than taken from `accounts.name`:
  -- the account name is whatever the customer typed when they signed up, and this
  -- one goes onto a certified payroll as the entity that performed the work.
  legal_name     text,

  -- `contractorPWCR`, `[0-9]{10}|NA` in the pinned XSD. NULLABLE and no default,
  -- for the reason §10.1 gives: "we can't get either for you — the first is yours,
  -- the second is theirs". A defaulted PWCR is a wrong PWCR on somebody's filing.
  contractor_pwcr   text,
  contractor_fein   text,
  ca_license_type   text,
  ca_license_number text,
  contractor_address text,
  contractor_city   text,
  contractor_state  char(2),
  contractor_zip    text,

  -- WHO said so and WHEN, like every other customer assertion in this schema. The
  -- eCPR is signed under penalty of perjury; the row that supplies half its header
  -- records its author.
  asserted_at    timestamptz NOT NULL DEFAULT now(),
  asserted_by    uuid REFERENCES users (id),

  -- The pinned XSD's own patterns, enforced at rest so a value the schema cannot
  -- carry cannot be stored and then discovered at generation time. `NA` is the
  -- literal the schema permits for a contractor with no registration on file.
  CONSTRAINT ca_identity_pwcr CHECK (
    contractor_pwcr IS NULL OR contractor_pwcr ~ '^([0-9]{10}|NA)$'),
  CONSTRAINT ca_identity_fein CHECK (
    contractor_fein IS NULL OR contractor_fein ~ '^[0-9]{9}$'),
  CONSTRAINT ca_identity_license_type CHECK (
    ca_license_type IS NULL OR ca_license_type IN ('CSLB', 'PL', 'OTHER'))
);

SELECT ratepin_enable_tenant_rls('ca_contractor_identity');

-- ---------------------------------------------------------------------------
-- The project columns this replaces.
--
-- Dropped rather than left in place. Two columns holding the same fact is the drift
-- hazard `tests/schema-parity.test.ts` exists to catch one level up, and a dead
-- `projects.contractor_fein` would be read by the next person to write an emitter.
-- `dir_project_id` is NOT dropped: it is the awarding body's identifier for this
-- project and belongs exactly where it is.
-- ---------------------------------------------------------------------------
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_ca_license_type;
ALTER TABLE projects
  DROP COLUMN IF EXISTS contractor_pwcr,
  DROP COLUMN IF EXISTS contractor_fein,
  DROP COLUMN IF EXISTS ca_license_type,
  DROP COLUMN IF EXISTS ca_license_number,
  DROP COLUMN IF EXISTS contractor_address,
  DROP COLUMN IF EXISTS contractor_city,
  DROP COLUMN IF EXISTS contractor_state,
  DROP COLUMN IF EXISTS contractor_zip;

-- ---------------------------------------------------------------------------
-- `workers.ssn_ciphertext` gets no new column and needs none.
--
-- The envelope this migration makes usable is already declared: `accounts
-- .data_key_uri` holds the WRAPPED per-account data key, `workers.key_version`
-- names the wrap version, and `ratepin_erase_identity` already sets `data_key_uri`
-- to NULL and stamps `data_key_destroyed_at`. What was missing was a writer, and a
-- writer is code (`src/app/(app)/_lib/ssn.ts`), not DDL. The one thing worth saying
-- in SQL is why the ciphertext column has no CHECK on its contents: a CHECK that
-- could recognise nine digits inside it would mean the digits were recognisable,
-- which is the property the column exists to remove.
-- ---------------------------------------------------------------------------
COMMENT ON COLUMN workers.ssn_ciphertext IS 'AES-256-GCM under the account data key wrapped in accounts.data_key_uri. Written only by storeWorkerSsn and read only by ecprIdentities; the WH-347 path selects ssn_last4 and has no decrypt function in scope. 29 CFR 5.5(a)(3)(ii)(B) forbids the nine digits on the federal transmittal; the CA eCPR XSD requires them.';
