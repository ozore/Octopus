-- M9 — the audit trail is append-only IN THE DATABASE, not by convention.
--
-- `specs/09` §4: "NO update, NO delete: enforced by a Postgres rule/trigger,
-- not by convention", and A4: "Given someone attempts UPDATE audit_events,
-- Then the database rejects it."
--
-- WHY A TRIGGER AND NOT A RULE. A `CREATE RULE … DO INSTEAD NOTHING` makes an
-- UPDATE silently succeed-and-do-nothing, which is worse than either
-- alternative: the caller believes it edited history. A trigger that RAISES is
-- the honest version — the write fails, loudly, with the reason in the message.
--
-- WHY DELETE IS ALSO REFUSED, even though `audit_events.org_id` cascades from
-- `organisations`. A cascade from a parent DELETE fires this trigger too, so
-- deleting an organisation would fail. `specs/09` §7 says audit rows are "the
-- LAST thing deleted" and retention is "the life of the org plus 90 days", so
-- the deletion path is a deliberate admin operation, not a cascade. The
-- function therefore allows a delete only when the session has explicitly said
-- it is performing retention deletion:
--
--     SET LOCAL certly.audit_retention_delete = 'on';
--
-- That is a per-transaction flag, invisible to every ordinary code path, and it
-- makes "we deleted audit history" a thing somebody had to write down.
--
-- This migration is hand-written because Drizzle Kit does not model triggers.
-- Do not regenerate it; `npm run db:generate` only ever touches 0000.

CREATE OR REPLACE FUNCTION certly_audit_events_immutable() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'audit_events is append-only: UPDATE is refused (specs/09 §4)'
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF coalesce(current_setting('certly.audit_retention_delete', true), 'off') <> 'on' THEN
      RAISE EXCEPTION 'audit_events is append-only: DELETE is refused outside retention deletion (specs/09 §7)'
        USING ERRCODE = 'restrict_violation';
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER certly_audit_events_immutable_trigger
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION certly_audit_events_immutable();
