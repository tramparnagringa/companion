-- Add program_slug to chat_sessions so we can query sessions by day + program
alter table chat_sessions
  add column if not exists program_slug text references programs(slug) on delete set null;

-- Index for day-page session lookup
create index if not exists chat_sessions_day_program_idx
  on chat_sessions (user_id, day_number, program_slug)
  where target_user_id is null;
