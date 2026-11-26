-- Run against a local database after applying the category migration.
begin;

do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.categories'::regclass) then
    raise exception 'Expected categories RLS to be enabled';
  end if;
end $$;

set local role anon;
do $$
begin
  if (select count(*) from public.categories) < 15 then
    raise exception 'Expected at least 15 public categories';
  end if;

  begin
    insert into public.categories (slug, name) values ('unauthorized', 'Unauthorized');
    raise exception 'Anonymous role was able to write categories';
  exception when insufficient_privilege then
    null;
  end;
end $$;
reset role;

set local role authenticated;
do $$
begin
  if not exists (select from public.categories where slug = 'accessibility') then
    raise exception 'Expected authenticated role to see the category catalog';
  end if;

  begin
    delete from public.categories where slug = 'accessibility';
    raise exception 'Authenticated role was able to delete categories';
  exception when insufficient_privilege then
    null;
  end;
end $$;

rollback;
