-- Performance indexes for frequently queried columns

-- token_balance: used on every AI call to check/consume tokens
create index if not exists idx_token_balance_user_active_expires
  on token_balance (user_id, is_active, expires_at)
  where is_active = true;

-- token_usage: used in the admin tokens dashboard and user history views
create index if not exists idx_token_usage_user_created
  on token_usage (user_id, created_at desc);

-- chat_sessions: used to list sessions in the sidebar
create index if not exists idx_chat_sessions_user_updated
  on chat_sessions (user_id, updated_at desc);

-- day_activities: used to load progress per enrollment
create index if not exists idx_day_activities_enrollment_day
  on day_activities (program_enrollment_id, day_number);

-- action_notes: used in /plans page
create index if not exists idx_action_notes_user_created
  on action_notes (user_id, created_at desc);

-- Unique constraint on source_payment_id to guarantee idempotent webhook processing
-- This makes the ON CONFLICT in the webhook upsert work atomically.
alter table token_balance
  add constraint uq_token_balance_source_payment_id
  unique (source_payment_id);
