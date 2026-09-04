-- The supporting metrics with their own tripwires (`THRESHOLDS.md` §4). Any one
-- of them in the red means the four headline metrics are measuring a bug rather
-- than a business, which is why they are on the same page.
select
  (select count(*)::int from events where name = 'notifications_paused' and ts >= {{from}} and ts <= {{to}}) as notifications_paused,
  (select count(distinct org_id)::int from events where name = 'organisation_created' and ts >= {{from}} and ts <= {{to}}) as signups,
  (select count(*)::int from events where name = 'plan_limit_hit' and ts >= {{from}} and ts <= {{to}}) as plan_limit_hit,
  (select count(*)::int from alerts where status in ('sent', 'delivered')) as alerts_sent,
  (select count(*)::int from alerts where status in ('failed', 'bounced')) as alerts_failed,
  (select count(*)::int from alerts where status = 'suppressed') as alerts_suppressed,
  (select coalesce(sum((props->>'created')::int), 0)::int from events where name = 'import_completed' and ts >= {{from}} and ts <= {{to}}) as import_rows_created,
  (select coalesce(sum((props->>'skipped')::int), 0)::int from events where name = 'import_completed' and ts >= {{from}} and ts <= {{to}}) as import_rows_skipped,
  (select count(*)::int from kb_drift_items where status = 'open' and detected_at < {{now}} - interval '7 days') as kb_drift_open_over_7_days,
  (select count(*)::int from one_off_purchases where status = 'refunded') as playbooks_refunded,
  (select count(*)::int from one_off_purchases where status = 'paid') as playbooks_paid
