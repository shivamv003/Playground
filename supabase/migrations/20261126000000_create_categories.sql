create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null unique check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

revoke all on table public.categories from anon, authenticated;
grant select on table public.categories to anon, authenticated;

create policy "Categories are publicly readable"
  on public.categories for select
  to anon, authenticated
  using (true);

insert into public.categories (slug, name) values
  ('artificial-intelligence', 'Artificial Intelligence'),
  ('software-development', 'Software Development'),
  ('education', 'Education'),
  ('healthcare', 'Healthcare'),
  ('sustainability', 'Sustainability'),
  ('agriculture', 'Agriculture'),
  ('finance', 'Finance'),
  ('accessibility', 'Accessibility'),
  ('productivity', 'Productivity'),
  ('social-impact', 'Social Impact'),
  ('open-source', 'Open Source'),
  ('robotics', 'Robotics'),
  ('internet-of-things', 'Internet of Things'),
  ('design', 'Design'),
  ('other', 'Other');
