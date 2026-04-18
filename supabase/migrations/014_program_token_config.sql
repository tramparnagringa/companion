-- Add token configuration fields to programs table
-- token_allocation: raw tokens granted when a user enrolls
-- credit_ratio: display divisor (tokens / credit_ratio = créditos shown to student)
-- token_costs: per-interaction overrides in raw tokens (null = use code defaults)
-- price_brl: reference price in BRL for display/reference
-- duration_days: actual program length in days
-- validity_days: how long the token_balance lasts (always longer than duration_days)

alter table programs
  add column if not exists token_allocation  integer,
  add column if not exists credit_ratio      integer default 10,
  add column if not exists token_costs       jsonb,
  add column if not exists price_brl         numeric(10,2),
  add column if not exists duration_days     integer,
  add column if not exists validity_days     integer;

comment on column programs.token_allocation is 'Raw tokens granted to a student on enrollment. Stored as actual Anthropic tokens.';
comment on column programs.credit_ratio     is 'Display divisor only. tokens / credit_ratio = créditos shown to student. Does not affect consumption logic.';
comment on column programs.token_costs      is 'Per-interaction cost overrides in raw tokens. Ex: {"chat_message": 1200, "day_init": 400}. Null = use code defaults.';
comment on column programs.validity_days    is 'How long the token_balance lasts after enrollment. Should always exceed duration_days.';
