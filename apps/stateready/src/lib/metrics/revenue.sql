-- MRR from the SUBSCRIPTIONS MIRROR, never from events (`specs/13` §The
-- metrics). Stripe is the source of truth for money and the mirror is what the
-- webhook writes; an events-derived MRR drifts the first time a webhook is
-- replayed. The price → amount mapping is applied in TypeScript from the plan
-- map, so this query returns the rows and not a total.
select
  s.org_id      as org_id,
  s.price_id    as price_id,
  s.status      as status,
  s.quantity    as quantity,
  s.canceled_at as canceled_at
from subscriptions s
left join trial_grants t on t.org_id = s.org_id
where coalesce(t.is_internal, false) = false
