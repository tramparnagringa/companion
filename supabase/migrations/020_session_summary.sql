alter table chat_sessions
  add column if not exists summary text,
  add column if not exists context_snapshot text,
  add column if not exists summarized_at timestamptz;

alter table candidate_profiles
  add column if not exists conversation_context text;
