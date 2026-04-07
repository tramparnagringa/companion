-- ─────────────────────────────────────────────────────────────────────────────
-- TNG Companion — Backfill existing users into the default bootcamp program.
-- Run AFTER seed-bootcamp.ts has been executed.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Enroll all existing users who don't have an enrollment yet ─────────────
insert into user_programs (user_id, program_id, status, started_at)
select
  p.id,
  (select id from programs where slug = 'tng-bootcamp'),
  'active',
  p.created_at
from profiles p
where not exists (
  select 1 from user_programs up where up.user_id = p.id
)
  and (select id from programs where slug = 'tng-bootcamp') is not null;

-- ── 2. Link existing day_activities to the enrollment ─────────────────────────
update day_activities da
set program_enrollment_id = (
  select up.id
  from user_programs up
  where up.user_id = da.user_id
    and up.status = 'active'
  order by up.started_at asc
  limit 1
)
where da.program_enrollment_id is null;
