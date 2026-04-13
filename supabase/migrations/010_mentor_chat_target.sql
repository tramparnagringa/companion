-- Add target_user_id to chat_sessions so mentor chats can be scoped to a student
alter table chat_sessions add column if not exists target_user_id uuid references auth.users on delete cascade;

create index if not exists chat_sessions_target_user_id_idx on chat_sessions (target_user_id);
