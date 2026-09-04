-- T4 — PLAYBOOK ATTACH RATE. Organisations with at least one
-- `playbook_purchased` within 90 days of their first charge, over paying
-- organisations.
--
-- `THRESHOLDS.md` §3 asks for this in TWO numbers at n = 100: over all payers,
-- and over payers who declared an expansion (`operating_states.status =
-- 'expanding'`). The second is the `expanding` column below; if it is high and
-- the first is low, the product is fine and the ICP needs narrowing.
with first_charge as (
  select p.org_id as org_id, min(p.ts) as charged_at
  from events p
  left join trial_grants t on t.org_id = p.org_id
  where p.name = 'checkout_completed' and p.org_id is not null
    and coalesce(t.is_internal, false) = false
    and p.ts >= {{from}} and p.ts <= {{to}}
  group by p.org_id
),
attached as (
  select distinct f.org_id
  from first_charge f
  join events b
    on b.org_id = f.org_id
   and b.name = 'playbook_purchased'
   and b.ts >= f.charged_at
   and b.ts <= f.charged_at + interval '90 days'
),
expanding as (
  select distinct f.org_id
  from first_charge f
  join operating_states o on o.org_id = f.org_id and o.status = 'expanding'
)
select
  (select count(*)::int from attached)     as numerator,
  (select count(*)::int from first_charge) as denominator,
  (select count(*)::int from expanding)    as expanding_payers,
  (select count(*)::int from attached a join expanding x on x.org_id = a.org_id) as expanding_attached
