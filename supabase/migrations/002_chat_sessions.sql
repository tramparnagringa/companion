-- ────────────────────────────────────────────────────────────────
-- TNG Companion — Chat Sessions & Action Notes
-- ────────────────────────────────────────────────────────────────

-- CHAT_SESSIONS (persisted conversations)
create table if not exists chat_sessions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  day_number  integer,
  mode        text check (mode in ('task', 'mentor')) default 'task',
  title       text,
  messages    jsonb not null default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ACTION_NOTES (plans / summaries saved by the AI)
create table if not exists action_notes (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  session_id  uuid references chat_sessions(id) on delete set null,
  day_number  integer,
  title       text not null,
  content     text not null,
  type        text default 'note' check (type in ('plan', 'note', 'summary', 'action_items')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- RLS
alter table chat_sessions enable row level security;
create policy "users manage own sessions" on chat_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table action_notes enable row level security;
create policy "users manage own notes" on action_notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
