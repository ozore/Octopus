-- Corpus B — the consented outcome corpus.
-- Spec: CORPUS_DESIGN.md §4.2. Reference DDL; the applied schema is the Drizzle
-- migration set in app/drizzle. This file is the readable statement of intent,
-- kept next to the corpus it describes.
--
-- THIS DATA LIVES ONLY IN POSTGRES. Never in this repository (§2.1, gate G6).

CREATE TABLE IF NOT EXISTS curation_state (
    state       TEXT PRIMARY KEY,
    rationale   TEXT NOT NULL
);

INSERT INTO curation_state (state, rationale) VALUES
    ('raw',         'Outcome reported; nothing verified.'),
    ('redacted',    'Automated redaction passed; not yet human-checked.'),
    ('verified',    'Human spot-check plus outcome plausibility check passed.'),
    ('promoted',    'Meets the §4.7 promotion bar and informs an L3 pattern.'),
    ('quarantined', 'Redaction failure, implausible, or contradicted by later evidence.')
ON CONFLICT (state) DO NOTHING;

CREATE TABLE IF NOT EXISTS outcome_record (
    case_id               TEXT PRIMARY KEY,     -- case_{ulid}; opaque, not derived from any customer identifier
    reason_code           TEXT NOT NULL,
    platform              TEXT NOT NULL CHECK (platform IN ('AMZ','WMT')),

    -- Structure, not content. POA text is stored separately and only under a
    -- verified consent scope plus a redaction state.
    poa_structure         JSONB NOT NULL,
    poa_structure_hash    TEXT NOT NULL,        -- dedupe by structure (§4.6 rule 2)

    outcome               TEXT NOT NULL CHECK (outcome IN
                            ('reinstated','rejected','no_response','withdrawn','unknown')),
    days_to_decision      INTEGER,              -- NULL until decided
    appeal_round          INTEGER NOT NULL DEFAULT 1,
    submitted_at          DATE,
    reported_at           DATE,
    reporting_method      TEXT NOT NULL CHECK (reporting_method IN
                            ('self_report','screenshot_verified')),

    tier_purchased        TEXT CHECK (tier_purchased IN ('rescue','rescue_human')),
    human_edited          BOOLEAN NOT NULL DEFAULT FALSE,

    -- Attribution (ADR-008): an outcome is only interpretable against the exact
    -- corpus, prompt bundle and model that produced the draft.
    corpus_release        INTEGER NOT NULL,
    prompt_bundle_hash    TEXT NOT NULL,
    model_id              TEXT NOT NULL,

    -- N10 / R11: the denominator can never be lost. Any query producing a rate
    -- must join this column, so a "success rate" can never be computed from the
    -- winners alone (gate G14).
    counts_in_denominator BOOLEAN NOT NULL DEFAULT TRUE,

    curation_state        TEXT NOT NULL REFERENCES curation_state(state),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outcome_record_code_idx ON outcome_record (reason_code, curation_state);
CREATE INDEX IF NOT EXISTS outcome_record_struct_idx ON outcome_record (poa_structure_hash);

-- Consent is SEPARABLE from the purchase and the purchase completes either way.
-- Bundling consent into the transaction would be both an ethical problem and a
-- data-quality problem: coerced consent produces customers who ignore the
-- follow-up, which is worse than a clean opt-out.
CREATE TABLE IF NOT EXISTS consent_record (
    consent_id            TEXT PRIMARY KEY,
    case_id               TEXT NOT NULL UNIQUE REFERENCES outcome_record(case_id) ON DELETE CASCADE,
    granted               BOOLEAN NOT NULL,
    granted_at            TIMESTAMPTZ,
    consent_text_version  TEXT NOT NULL,        -- the exact wording shown, versioned
    scope                 TEXT NOT NULL CHECK (scope IN ('outcome_only','outcome_and_redacted_text')),
    revoked_at            TIMESTAMPTZ,          -- non-null => hard delete cascade has run or is due
    retention_expires_at  DATE NOT NULL
);

-- Gate G13: every outcome_record has a consent_record. Enforced by the write
-- path (both rows in one transaction) and asserted by a scheduled check.

CREATE TABLE IF NOT EXISTS poa_text_redacted (
    case_id                  TEXT PRIMARY KEY REFERENCES outcome_record(case_id) ON DELETE CASCADE,
    notice_redacted          TEXT NOT NULL,
    draft_redacted           TEXT NOT NULL,
    final_submitted_redacted TEXT,
    redaction_version        TEXT NOT NULL,
    -- Mandatory gate: a record cannot leave 'redacted' without this being true
    -- for the first ~100 cases (§4.4). Deterministic patterns run first because
    -- a regex fails closed; a model-only redactor fails open.
    human_spot_checked       BOOLEAN NOT NULL DEFAULT FALSE
);

-- Broad-scope consent is a precondition for storing any text at all.
CREATE OR REPLACE FUNCTION assert_broad_consent() RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM consent_record c
        WHERE c.case_id = NEW.case_id
          AND c.granted IS TRUE
          AND c.revoked_at IS NULL
          AND c.scope = 'outcome_and_redacted_text'
    ) THEN
        RAISE EXCEPTION 'poa_text_redacted requires scope=outcome_and_redacted_text for case %', NEW.case_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS poa_text_requires_broad_consent ON poa_text_redacted;
CREATE TRIGGER poa_text_requires_broad_consent
    BEFORE INSERT OR UPDATE ON poa_text_redacted
    FOR EACH ROW EXECUTE FUNCTION assert_broad_consent();

-- The sharpest quality signal we will have: when the $399 tier's human editor
-- keeps a cited clause, that clause was right for that case; when they delete
-- it, it was not. A graded label produced for free by fulfilment (§4.2c).
CREATE TABLE IF NOT EXISTS citation_use (
    citation_use_id     TEXT PRIMARY KEY,
    case_id             TEXT NOT NULL REFERENCES outcome_record(case_id) ON DELETE CASCADE,
    clause_id           TEXT NOT NULL,
    position            INTEGER,
    survived_human_edit BOOLEAN               -- NULL if no human pass occurred
);

-- Forum seed observations. A SEPARATE TABLE, deliberately: they can never be
-- joined into a denominator, and they carry no reporting_method because a forum
-- post has no verified outcome (§4.5).
CREATE TABLE IF NOT EXISTS seed_observation (
    seed_id                      TEXT PRIMARY KEY,
    platform                     TEXT NOT NULL CHECK (platform IN ('AMZ','WMT')),
    reason_code_guess            TEXT NOT NULL,
    source_url                   TEXT NOT NULL,
    retrieved_at                 DATE NOT NULL,
    observation                  JSONB NOT NULL,   -- our structural notes; never the post text
    reported_outcome             TEXT NOT NULL CHECK (reported_outcome IN
                                   ('reinstated','rejected','no_response','unresolved','unknown')),
    citable                      BOOLEAN NOT NULL DEFAULT FALSE CHECK (citable IS FALSE),
    outcome_verified             BOOLEAN NOT NULL DEFAULT FALSE CHECK (outcome_verified IS FALSE),
    contributes_to_supporting_n  INTEGER NOT NULL DEFAULT 0 CHECK (contributes_to_supporting_n = 0)
);
