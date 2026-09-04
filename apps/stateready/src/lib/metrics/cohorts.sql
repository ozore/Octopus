-- Weekly signup cohorts × activation and conversion. All buckets are computed
-- in UTC and the page says so (`specs/13` §Edge cases: a cohort silently
-- bucketed in a local zone moves customers between weeks).
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
counted as (select * from cohort where is_internal = false)
select
  date_trunc('week', c.created_at) as week,
  count(*)::int as signups,
  count(distinct case when a.org_id is not null then c.org_id end)::int as activated,
  count(distinct case when p.org_id is not null then c.org_id end)::int as paid
from counted c
left join events a
  on a.org_id = c.org_id and a.name = {{activation_event}}
 and a.ts <= c.created_at + interval '7 days'
left join events p
  on p.org_id = c.org_id and p.name = 'checkout_completed'
group by 1
order by 1 desc
