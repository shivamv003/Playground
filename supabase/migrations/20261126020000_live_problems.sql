create schema playground_private;
revoke all on schema playground_private from public;
grant usage on schema playground_private to authenticated;

create table playground_private.action_limits (
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  uses integer not null check (uses > 0),
  primary key (actor_id, action)
);

create function playground_private.consume_limit(actor uuid, action_name text, max_uses int)
returns void
language plpgsql
set search_path = ''
as $$
declare
  uses_in_window integer;
  current_window timestamptz := date_trunc('hour', now());
begin
  insert into playground_private.action_limits as limits (actor_id, action, window_start, uses)
  values (actor, action_name, current_window, 1)
  on conflict (actor_id, action) do update
    set window_start = excluded.window_start,
        uses = case when limits.window_start = excluded.window_start then limits.uses + 1 else 1 end
  returning uses into uses_in_window;

  if uses_in_window > max_uses then
    raise sqlstate 'PT429' using message = 'Action limit reached. Try again later.';
  end if;
end;
$$;

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  title text not null check (char_length(btrim(title)) between 8 and 100),
  description text not null check (char_length(btrim(description)) between 20 and 2000),
  motivation text not null default '' check (char_length(motivation) <= 1000),
  approach text not null default '' check (char_length(approach) <= 1000),
  skills text not null default '' check (char_length(skills) <= 180),
  purpose text not null default 'Side project' check (purpose in (
    'Side project', 'Learning project', 'Portfolio project', 'Startup idea',
    'Hackathon', 'Open source', 'Social impact'
  )),
  collaboration_mode text not null default 'Flexible' check (collaboration_mode in ('Flexible', 'Remote', 'In person')),
  commitment text not null default '' check (char_length(commitment) <= 100),
  experience text not null default 'Any level' check (experience in ('Any level', 'Beginner friendly', 'Some experience', 'Experienced')),
  compensation text not null default 'To be discussed' check (compensation in ('To be discussed', 'Unpaid collaboration', 'Paid', 'Equity-based')),
  status text not null default 'open' check (status in ('open', 'closed', 'archived', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_document tsvector generated always as (
    setweight(to_tsvector('simple'::regconfig, title), 'A') ||
    setweight(to_tsvector('simple'::regconfig, skills), 'B') ||
    setweight(to_tsvector('simple'::regconfig, description), 'C')
  ) stored
);

create index problems_feed_idx on public.problems (created_at desc, id desc) where status in ('open', 'closed');
create index problems_category_idx on public.problems (category_id, created_at desc, id desc) where status in ('open', 'closed');
create index problems_author_idx on public.problems (author_id, created_at desc, id desc);
create index problems_search_idx on public.problems using gin (search_document) where status in ('open', 'closed');

create function playground_private.track_problem_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform playground_private.consume_limit(new.author_id, 'publish_problem', 5);
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger track_problem_write before insert or update on public.problems
for each row execute function playground_private.track_problem_write();

alter table public.problems enable row level security;

revoke all on public.problems from public, anon, authenticated;
grant select on public.problems to anon, authenticated;
grant insert (author_id, category_id, title, description, motivation, approach, skills, purpose,
              collaboration_mode, commitment, experience, compensation),
      update (category_id, title, description, motivation, approach, skills, purpose,
              collaboration_mode, commitment, experience, compensation, status)
on public.problems to authenticated;

create policy "Published problems are public" on public.problems for select
to anon, authenticated using (status in ('open', 'closed'));

create policy "Authors can read their own problems" on public.problems for select
to authenticated using (author_id = (select auth.uid()));

create policy "Authors can publish their own problems" on public.problems for insert
to authenticated with check (author_id = (select auth.uid()) and status = 'open');

create policy "Authors can manage their own problems" on public.problems for update
to authenticated using (author_id = (select auth.uid()) and status <> 'removed')
with check (author_id = (select auth.uid()) and status in ('open', 'closed', 'archived'));

revoke all on all functions in schema playground_private from public;
