-- LinkedIn-only users send 'name'/'picture' instead of 'full_name'/'avatar_url'.
-- Users with a linked Google account send both, so coalesce covers all cases.
-- Also backfills existing profiles that landed with full_name = NULL.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- Backfill existing users whose full_name was never captured
UPDATE public.profiles p
SET
  full_name  = coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  avatar_url = coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
FROM auth.users u
WHERE p.id = u.id
  AND p.full_name IS NULL
  AND coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name') IS NOT NULL;
