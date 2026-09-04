-- T2 — ACTIVATION → PAID. Activated organisations with a `checkout_completed`
-- within 30 days of activation, over activated organisations.
--
-- The denominator is ACTIVATED, not signed up: this measures whether the
-- product is worth paying for once it has been seen working, which is a
-- different question from whether people arrive.
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
  select c.org_id, min(a.ts) as activated_at
  from counted c
  join events a
    on a.org_id = c.org_id
   and a.name = {{activation_event}}
   and a.ts >= c.created_at
   and a.ts <= c.created_at + interval '7 days'
  group by c.org_id
),
converted as (
  select distinct v.org_id
  from activated v
  join events p
    on p.org_id = v.org_id
   and p.name = 'checkout_completed'
   and p.ts >= v.activated_at
   and p.ts <= v.activated_at + interval '30 days'
)
select
  (select count(*)::int from converted) as numerator,
  (select count(*)::int from activated) as denominator
