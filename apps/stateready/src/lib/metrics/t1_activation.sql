-- T1 — ACTIVATION. Organisations with at least one `licence_deadline_derived`
-- within 7 days of `organisation_created`, over organisations created.
--
-- It is defined on a DERIVED deadline and not on a created licence, and that is
-- the whole point (`THRESHOLDS.md` §1): typing an expiry date into a form is
-- something a spreadsheet does. Seeing a date the product worked out — from the
-- Texas anniversary rule, or North Carolina's 31 December — is the first moment
-- the customer sees what they are paying for.
--
-- A date the CUSTOMER typed emits `licence_deadline_recorded` instead and is
-- deliberately not counted here (`BUILD.md` D4): counting it would make T1
-- measure data entry.
with cohort as (
  select
    e.org_id as org_id,
    min(e.ts) as created_at,
    coalesce(bool_or(t.is_internal), false) as is_internal
  from events e
  left join trial_grants t on t.org_id = e.org_id
  where e.name = 'organisation_created' and e.org_id is not null
    and e.ts >= {{from}} and e.ts <= {{to}}
  group by e.org_id
),
counted as (select * from cohort where is_internal = false),
activated as (
  select distinct c.org_id
  from counted c
  join events a
    on a.org_id = c.org_id
   and a.name = {{activation_event}}
   and a.ts >= c.created_at
   and a.ts <= c.created_at + interval '7 days'
)
select
  (select count(*)::int from activated) as numerator,
  (select count(*)::int from counted)   as denominator
