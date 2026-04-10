-- ─────────────────────────────────────────────────────────────────────────────
-- TNG Companion — Scope action_notes to program enrollment
-- ─────────────────────────────────────────────────────────────────────────────

alter table action_notes
  add column if not exists program_enrollment_id uuid
    references user_programs(id) on delete cascade;

-- Index for fast per-enrollment queries
create index if not exists action_notes_enrollment_idx
  on action_notes(program_enrollment_id)
  where program_enrollment_id is not null;

-- Backfill: link existing notes to the user's first active enrollment
update action_notes an
set program_enrollment_id = (
  select up.id
  from user_programs up
  where up.user_id = an.user_id
    and up.status = 'active'
  order by up.started_at asc
  limit 1
)
where an.program_enrollment_id is null;
