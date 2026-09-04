-- T3 — MONTH-2 RETENTION. Organisations with a live subscription 60 days after
-- their first charge, over those that have REACHED day 60.
--
-- The denominator is the honest half of this metric: an organisation that paid
-- three weeks ago has not survived to month two and has not failed to, and
-- counting it in either direction is how a retention number flatters itself.
with first_charge as (
  select p.org_id as org_id, min(p.ts) as charged_at
  from events p
  left join trial_grants t on t.org_id = p.org_id
  where p.name = 'checkout_completed' and p.org_id is not null
    and coalesce(t.is_internal, false) = false
    and p.ts >= {{from}} and p.ts <= {{to}}
  group by p.org_id
),
reached as (
  select * from first_charge where charged_at + interval '60 days' <= {{now}}
),
retained as (
  select distinct r.org_id
  from reached r
  join subscriptions s on s.org_id = r.org_id
  where s.status in ('active', 'past_due', 'trialing')
     or (s.canceled_at is not null and s.canceled_at > r.charged_at + interval '60 days')
)
select
  (select count(*)::int from retained) as numerator,
  (select count(*)::int from reached)  as denominator
