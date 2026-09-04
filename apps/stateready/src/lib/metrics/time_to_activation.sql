-- Median time from `organisation_created` to the first derived deadline, in
-- minutes. Green ≤ 20, red > 60 (`THRESHOLDS.md` §4): over an hour means the
-- customer left and came back, and activation is being measured against a door
-- that is too heavy.
with cohort as (
  select e.org_id as org_id, min(e.ts) as created_at
  from events e
  left join trial_grants t on t.org_id = e.org_id
  where e.name = 'organisation_created' and e.org_id is not null
    and coalesce(t.is_internal, false) = false
    and e.ts >= {{from}} and e.ts <= {{to}}
  group by e.org_id
),
first_derived as (
  select c.org_id, min(a.ts) as derived_at, c.created_at
  from cohort c
  join events a on a.org_id = c.org_id and a.name = {{activation_event}}
  group by c.org_id, c.created_at
)
select
  percentile_cont(0.5) within group (order by extract(epoch from (derived_at - created_at)) / 60.0) as median_minutes,
  count(*)::int as n
from first_derived
