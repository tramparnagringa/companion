-- Job status history log + recruiter quick fields
alter table jobs
  add column if not exists status_log  jsonb not null default '[]'::jsonb,
  add column if not exists recruiter_name     text,
  add column if not exists recruiter_linkedin text;

comment on column jobs.status_log is
  'Array of { from: JobStatus, to: JobStatus, at: ISO8601, note?: string }';
