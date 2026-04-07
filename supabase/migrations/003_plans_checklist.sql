-- ────────────────────────────────────────────────────────────────
-- TNG Companion — Plans: add checklist support to action_notes
-- ────────────────────────────────────────────────────────────────

alter table action_notes
  add column if not exists checklist jsonb not null default '[]';

-- checklist shape: [{ id: uuid, label: text, done: boolean }]
