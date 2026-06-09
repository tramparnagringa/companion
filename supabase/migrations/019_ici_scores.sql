alter table candidate_profiles
  add column if not exists ici_scores jsonb;
