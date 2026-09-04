-- The cohort every metric is computed over: organisations that were CREATED,
-- excluding the internal ones (`specs/13` §Edge cases — a founder's seed
-- account in the numbers is the most common way a dashboard lies to its owner).
--
-- `trial_grants.is_internal` is the marker rather than a column on
-- `organisations`, because the platform's table is shared by three apps and
-- StateReady's trial grant is written for every organisation at signup
-- (`src/lib/onboarding.ts`). An organisation with no grant is not internal.
select
  e.org_id                          as org_id,
  min(e.ts)                         as created_at,
  coalesce(bool_or(t.is_internal), false) as is_internal
from events e
left join trial_grants t on t.org_id = e.org_id
where e.name = 'organisation_created'
  and e.org_id is not null
  and e.ts >= {{from}}
  and e.ts <= {{to}}
group by e.org_id
