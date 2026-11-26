create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(btrim(display_name)) between 2 and 60),
  headline text not null default '' check (char_length(headline) <= 100),
  bio text not null default '' check (char_length(bio) <= 400),
  skills varchar(32)[] not null default '{}' check (
    cardinality(skills) <= 10 and array_ndims(skills) is not distinct from
      (case when cardinality(skills) = 0 then null else 1 end)
      and array_position(skills, null) is null
  ),
  interests varchar(32)[] not null default '{}' check (
    cardinality(interests) <= 10 and array_ndims(interests) is not distinct from
      (case when cardinality(interests) = 0 then null else 1 end)
      and array_position(interests, null) is null
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_profile_updated_at() from public;

create trigger set_profile_updated_at
  before update on public.profiles
  for each row execute function public.set_profile_updated_at();

alter table public.profiles enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant insert (id, username, display_name, headline, bio, skills, interests),
      update (id, username, display_name, headline, bio, skills, interests)
  on table public.profiles to authenticated;

create policy "Published profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "Users can edit their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
