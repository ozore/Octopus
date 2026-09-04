-- The funnel `/admin/funnel` draws: signup → onboarding → roster → licence →
-- derived deadline → checkout, with the drop-off between each step.
--
-- Every step is `count(distinct org_id)`, deliberately: `track()` is not
-- idempotent by design, and counting rows would let one retry move a step
-- (`specs/13` §Edge cases).
select
  count(distinct case when name = 'organisation_created' then org_id end)::int as signed_up,
  count(distinct case when name = 'onboarding_completed' then org_id end)::int as onboarded,
  count(distinct case when name = 'import_completed' then org_id end)::int     as roster_imported,
  count(distinct case when name = 'licence_created' then org_id end)::int      as licence_created,
  count(distinct case when name = {{activation_event}} then org_id end)::int   as deadline_derived,
  count(distinct case when name = 'checkout_completed' then org_id end)::int   as checked_out
from events
where org_id is not null and ts >= {{from}} and ts <= {{to}}
