-- ────────────────────────────────────────────────────────────────
-- TNG Companion — Initial Schema
-- Run: npx supabase db push
-- ────────────────────────────────────────────────────────────────

-- PROFILES
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text default 'student'
    check (role in ('student', 'bootcamp', 'mentoria', 'mentor', 'admin')),
  abacatepay_customer_id text,
  abacatepay_subscription_id text,
  abacatepay_billing_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CANDIDATE_PROFILE
create table if not exists candidate_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  extracted_profile text,
  target_role text,
  seniority text,
  years_experience integer,
  tech_stack text[],
  target_regions text[],
  work_preference text check (work_preference in ('remote', 'relocation', 'both')),
  target_sectors text[],
  value_proposition text,
  value_proposition_alternatives text[],
  linkedin_headline text,
  linkedin_about text,
  ai_fluency_statements text[],
  salary_min integer,
  salary_max integer,
  salary_currency text default 'USD',
  negotiation_scripts jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- KEYWORDS
create table if not exists keywords (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  word text not null,
  frequency integer default 1,
  source_job_id uuid,
  created_at timestamptz default now(),
  unique(user_id, word)
);

-- JOBS
create table if not exists jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  company_name text not null,
  role_title text not null,
  job_description text,
  source_url text,
  status text default 'to_analyse' check (
    status in ('to_analyse','analysing','applied','interviewing','offer','discarded')
  ),
  fit_score integer check (fit_score between 0 and 100),
  strong_keywords text[],
  weak_keywords text[],
  apply_recommendation boolean,
  analysis_notes text,
  applied_at date,
  cv_version_id uuid,
  cover_note text,
  interview_notes text,
  offer_details text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CONTACTS
create table if not exists contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  role text,
  company text,
  linkedin_url text,
  outreach_message text,
  outreach_sent_at timestamptz,
  response_received boolean default false,
  follow_up_due_at date,
  notes text,
  related_job_id uuid references jobs(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CV_VERSIONS
create table if not exists cv_versions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  generated_by text default 'manual' check (generated_by in ('manual', 'ai')),
  is_active boolean default false,
  content jsonb not null default '{}',
  created_at timestamptz default now()
);

-- DAY_ACTIVITIES
create table if not exists day_activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  day_number integer not null check (day_number between 1 and 30),
  status text default 'pending' check (status in ('pending','in_progress','done','skipped')),
  conversation_log jsonb,
  checklist jsonb,
  outputs jsonb,
  jobs_applied_ids uuid[],
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, day_number)
);

-- TOKEN_BALANCE
create table if not exists token_balance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  tokens_total integer not null default 0,
  tokens_used integer not null default 0,
  expires_at timestamptz not null,
  product_type text not null,
  source_payment_id text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TOKEN_USAGE
create table if not exists token_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  balance_id uuid references token_balance(id) not null,
  tokens_consumed integer not null,
  interaction_type text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- INTERVIEW_PREP
create table if not exists interview_prep (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  performance_map jsonb,
  star_stories jsonb[],
  soft_skills jsonb[],
  technical_gaps text[],
  simulation_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MENTOR_ACTIONS
create table if not exists mentor_actions (
  id uuid default gen_random_uuid() primary key,
  mentor_id uuid references auth.users not null,
  target_user_id uuid references auth.users not null,
  action text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────────────────────────────

alter table profiles          enable row level security;
alter table candidate_profiles enable row level security;
alter table keywords           enable row level security;
alter table jobs               enable row level security;
alter table contacts           enable row level security;
alter table cv_versions        enable row level security;
alter table day_activities     enable row level security;
alter table token_balance      enable row level security;
alter table token_usage        enable row level security;
alter table interview_prep     enable row level security;
alter table mentor_actions     enable row level security;

-- Default: users manage their own data
create policy "users own data" on profiles          for all using (auth.uid() = id);
create policy "users own data" on candidate_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own data" on keywords           for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own data" on jobs               for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own data" on contacts           for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own data" on cv_versions        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own data" on day_activities     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own data" on token_balance      for all using (auth.uid() = user_id);
create policy "users own data" on token_usage        for all using (auth.uid() = user_id);
create policy "users own data" on interview_prep     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Mentor actions: only mentors and admins
create policy "mentor access" on mentor_actions for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('mentor', 'admin')
    )
  );

-- ────────────────────────────────────────────────────────────────
-- Trigger: auto-create profile on signup
-- ────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ────────────────────────────────────────────────────────────────
-- consume_tokens function
-- ────────────────────────────────────────────────────────────────
create or replace function consume_tokens(
  p_user_id uuid,
  p_tokens integer,
  p_interaction_type text,
  p_metadata jsonb default '{}'
) returns jsonb as $$
declare
  v_balance token_balance;
  v_remaining integer := p_tokens;
begin
  for v_balance in
    select * from token_balance
    where user_id = p_user_id
      and is_active = true
      and expires_at > now()
      and tokens_total - tokens_used > 0
    order by expires_at asc
  loop
    exit when v_remaining <= 0;
    declare
      v_available integer := v_balance.tokens_total - v_balance.tokens_used;
      v_deduct integer := least(v_remaining, v_available);
    begin
      update token_balance
        set tokens_used = tokens_used + v_deduct, updated_at = now()
        where id = v_balance.id;
      insert into token_usage (user_id, balance_id, tokens_consumed, interaction_type, metadata)
        values (p_user_id, v_balance.id, v_deduct, p_interaction_type, p_metadata);
      v_remaining := v_remaining - v_deduct;
    end;
  end loop;
  if v_remaining > 0 then
    return jsonb_build_object('success', false, 'reason', 'insufficient_tokens');
  end if;
  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;
