-- Add model column to token_usage
alter table token_usage add column if not exists model text;

-- Recreate consume_tokens with p_model parameter
create or replace function consume_tokens(
  p_user_id uuid,
  p_tokens integer,
  p_interaction_type text,
  p_metadata jsonb default '{}',
  p_model text default null
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
      insert into token_usage (user_id, balance_id, tokens_consumed, interaction_type, metadata, model)
        values (p_user_id, v_balance.id, v_deduct, p_interaction_type, p_metadata, p_model);
      v_remaining := v_remaining - v_deduct;
    end;
  end loop;
  if v_remaining > 0 then
    return jsonb_build_object('success', false, 'reason', 'insufficient_tokens');
  end if;
  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;
