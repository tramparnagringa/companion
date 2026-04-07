-- ─────────────────────────────────────────────────────────────────────────────
-- TNG Companion — Data-driven programs
-- Replaces hardcoded DAYS array and DAY_INSTRUCTIONS with DB-backed content.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. PROGRAMS ──────────────────────────────────────────────────────────────
create table if not exists programs (
  id           uuid default gen_random_uuid() primary key,
  slug         text not null unique,           -- "tng-bootcamp", "sprint-entrevistas"
  name         text not null,
  description  text,
  total_days   integer not null default 30,
  week_themes  jsonb not null default '{}',    -- {"1":"Semana 1 — Clareza", ...}
  is_published boolean not null default false,
  created_by   uuid references auth.users,     -- null = system seed
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── 2. PROGRAM_DAYS ───────────────────────────────────────────────────────────
-- One row per day per program. Cards stored as JSONB (DayCard[] shape).
create table if not exists program_days (
  id              uuid default gen_random_uuid() primary key,
  program_id      uuid references programs(id) on delete cascade not null,
  day_number      integer not null check (day_number >= 1),
  week_number     integer not null check (week_number >= 1),
  name            text not null,
  description     text,
  cards           jsonb not null default '[]',   -- DayCard[]
  ai_instructions text,                          -- replaces DAY_INSTRUCTIONS[n]
  ai_model        text not null default 'claude-haiku-4-5-20251001',
  ai_max_tokens   integer not null default 700,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(program_id, day_number)
);

-- ── 3. USER_PROGRAMS (enrollment) ────────────────────────────────────────────
create table if not exists user_programs (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users on delete cascade not null,
  program_id    uuid references programs(id) not null,
  enrolled_by   uuid references auth.users,    -- mentor who enrolled; null = auto
  status        text not null default 'active'
                  check (status in ('active', 'completed', 'paused', 'cancelled')),
  started_at    timestamptz default now(),
  completed_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(user_id, program_id)
);

-- ── 4. MIGRATE day_activities ─────────────────────────────────────────────────
-- Add program_enrollment_id FK (nullable during transition; backfill in 008).
alter table day_activities
  add column if not exists program_enrollment_id uuid
    references user_programs(id) on delete cascade;

-- Drop old hard constraint (between 1 and 30) — programs can have any length.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'day_activities_day_number_check'
      and conrelid = 'day_activities'::regclass
  ) then
    alter table day_activities drop constraint day_activities_day_number_check;
  end if;
end $$;

-- Drop old unique (user_id, day_number) — replaced by enrollment-scoped index.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'day_activities_user_id_day_number_key'
      and conrelid = 'day_activities'::regclass
  ) then
    alter table day_activities drop constraint day_activities_user_id_day_number_key;
  end if;
end $$;

-- New unique: one activity per day per enrollment
create unique index if not exists day_activities_enrollment_day_idx
  on day_activities(program_enrollment_id, day_number)
  where program_enrollment_id is not null;

-- Keep legacy index for NULL enrollment rows (transition period)
create unique index if not exists day_activities_legacy_idx
  on day_activities(user_id, day_number)
  where program_enrollment_id is null;

-- ── 5. RLS ────────────────────────────────────────────────────────────────────
alter table programs      enable row level security;
alter table program_days  enable row level security;
alter table user_programs enable row level security;

-- Programs: published programs readable by all auth users.
-- Mentors/admins can read all; can write their own.
create policy "programs_read_published" on programs
  for select using (
    is_published = true
    or created_by = auth.uid()
    or exists (
      select 1 from profiles
      where id = auth.uid() and role in ('mentor', 'admin')
    )
  );

create policy "programs_write_own" on programs
  for all using (
    created_by = auth.uid()
    or exists (
      select 1 from profiles
      where id = auth.uid() and role in ('mentor', 'admin')
    )
  );

-- Program days: inherit parent program visibility
create policy "program_days_read" on program_days
  for select using (
    exists (
      select 1 from programs p
      where p.id = program_id
        and (
          p.is_published = true
          or p.created_by = auth.uid()
          or exists (
            select 1 from profiles
            where id = auth.uid() and role in ('mentor', 'admin')
          )
        )
    )
  );

create policy "program_days_write" on program_days
  for all using (
    exists (
      select 1 from programs p
      where p.id = program_id
        and (
          p.created_by = auth.uid()
          or exists (
            select 1 from profiles
            where id = auth.uid() and role in ('mentor', 'admin')
          )
        )
    )
  );

-- User programs: students see their own; mentors/admins see all
create policy "user_programs_own" on user_programs
  for all using (
    auth.uid() = user_id
    or auth.uid() = enrolled_by
    or exists (
      select 1 from profiles
      where id = auth.uid() and role in ('mentor', 'admin')
    )
  );
