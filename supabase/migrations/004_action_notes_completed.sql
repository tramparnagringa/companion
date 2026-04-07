alter table action_notes
  add column if not exists completed boolean not null default false;
