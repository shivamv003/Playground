-- Run against a local Supabase database after applying the profile migration.
begin;

insert into auth.users (id, email) values
  ('1e000000-0000-4000-a000-000000000001', 'profile-owner-test@example.com'),
  ('1e000000-0000-4000-a000-000000000002', 'profile-reader-test@example.com');

set local role authenticated;
select set_config('request.jwt.claim.sub', '1e000000-0000-4000-a000-000000000001', true);
insert into public.profiles (id, username, display_name, skills)
values (auth.uid(), 'profile_owner_test', 'Profile Owner', array['Design']);

do $$
begin
  if not exists (select from public.profiles where id = auth.uid()) then
    raise exception 'The profile owner could not read their new profile';
  end if;

  begin
    update public.profiles set id = '1e000000-0000-4000-a000-000000000002'
    where id = auth.uid();
    raise exception 'The owner was able to change the profile identity';
  exception when insufficient_privilege then
    null;
  end;
end $$;

select set_config('request.jwt.claim.sub', '1e000000-0000-4000-a000-000000000002', true);
do $$
begin
  if not exists (select from public.profiles where username = 'profile_owner_test') then
    raise exception 'A signed-in visitor could not view a public profile';
  end if;

  update public.profiles set display_name = 'Changed by someone else'
  where username = 'profile_owner_test';
  if found then
    raise exception 'A signed-in visitor could edit another profile';
  end if;

  begin
    insert into public.profiles (id, username, display_name)
    values (auth.uid(), 'profile_owner_test', 'Duplicate Username');
    raise exception 'Two accounts could share the same username';
  exception when unique_violation then
    null;
  end;
end $$;

reset role;
set local role anon;
do $$
begin
  if not exists (select from public.profiles where username = 'profile_owner_test') then
    raise exception 'A guest could not view a public profile';
  end if;

  begin
    insert into public.profiles (id, username, display_name)
    values ('1e000000-0000-4000-a000-000000000002', 'attempted_spoof', 'Anonymous Writer');
    raise exception 'A guest could create a profile';
  exception when insufficient_privilege then
    null;
  end;

  if has_table_privilege('auth.users', 'SELECT') then
    raise exception 'The guest role can read private account email';
  end if;
end $$;

rollback;
