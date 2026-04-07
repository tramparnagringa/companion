alter table jobs
  add column if not exists archived_at  timestamptz,
  add column if not exists interview_prep jsonb;

comment on column jobs.archived_at     is 'Soft delete — set to now() to archive';
comment on column jobs.interview_prep  is
  '{ generated_at, company_info: { about, culture[], recent_news[] }, likely_topics[], likely_questions[], strengths[], gaps[], tips[] }';
