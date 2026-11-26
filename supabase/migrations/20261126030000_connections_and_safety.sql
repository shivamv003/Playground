create table public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  message text not null default '' check (char_length(message) <= 500),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled', 'disconnected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create unique index connection_requests_active_idx on public.connection_requests (problem_id, sender_id)
  where status in ('pending', 'accepted');
create index connection_requests_sender_idx on public.connection_requests (sender_id, updated_at desc, id desc);
create index connection_requests_recipient_idx on public.connection_requests (recipient_id, updated_at desc, id desc);
create index connection_requests_history_idx on public.connection_requests (problem_id, sender_id, created_at desc);

create table public.blocks (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, blocked_id),
  check (owner_id <> blocked_id)
);
create index blocks_target_idx on public.blocks (blocked_id);

create table public.contact_shares (
  request_id uuid not null references public.connection_requests(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('email', 'phone', 'linkedin', 'github', 'portfolio', 'discord', 'other')),
  value text not null check (char_length(btrim(value)) between 1 and 300 and value !~ '[[:cntrl:]]'),
  updated_at timestamptz not null default now(),
  primary key (request_id, owner_id, kind),
  check (owner_id <> recipient_id)
);
create index contact_shares_recipient_idx on public.contact_shares (recipient_id);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null references public.connection_requests(id) on delete cascade,
  kind text not null check (kind in ('incoming', 'accepted', 'declined', 'contact_shared')),
  created_at timestamptz not null default now()
);
create index activity_events_user_idx on public.activity_events (user_id, created_at desc, id desc);
create index activity_events_request_idx on public.activity_events (request_id);

create table playground_private.moderators (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  problem_id uuid references public.problems(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('spam', 'scam', 'harassment', 'inappropriate', 'fake_profile', 'other')),
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'dismissed', 'resolved')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  check (num_nonnulls(problem_id, reported_user_id) = 1),
  check (reporter_id is distinct from reported_user_id)
);
create unique index reports_open_problem_idx on public.reports (reporter_id, problem_id)
  where status = 'open' and problem_id is not null;
create unique index reports_open_user_idx on public.reports (reporter_id, reported_user_id)
  where status = 'open' and reported_user_id is not null;
create index reports_queue_idx on public.reports (status, created_at, id);
create index reports_problem_idx on public.reports (problem_id);
create index reports_target_user_idx on public.reports (reported_user_id);

alter table public.connection_requests enable row level security;
alter table public.blocks enable row level security;
alter table public.contact_shares enable row level security;
alter table public.activity_events enable row level security;
alter table public.reports enable row level security;

revoke all on public.connection_requests, public.blocks, public.contact_shares, public.activity_events, public.reports
  from public, anon, authenticated;
grant select on public.connection_requests, public.blocks, public.contact_shares, public.activity_events, public.reports
  to authenticated;

create policy "Request participants can read their requests" on public.connection_requests for select
  to authenticated using ((select auth.uid()) in (sender_id, recipient_id));

create policy "People can read blocks they placed" on public.blocks for select
  to authenticated using (owner_id = (select auth.uid()));

create policy "Participants can read active contact shares" on public.contact_shares for select
  to authenticated using (
    (select auth.uid()) in (owner_id, recipient_id) and exists (
      select 1 from public.connection_requests as request
      where request.id = contact_shares.request_id and request.status = 'accepted'
        and ((request.sender_id = contact_shares.owner_id and request.recipient_id = contact_shares.recipient_id)
          or (request.recipient_id = contact_shares.owner_id and request.sender_id = contact_shares.recipient_id))
    )
  );

create policy "People can read their own activity" on public.activity_events for select
  to authenticated using (user_id = (select auth.uid()));

create function public.is_playground_moderator()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from playground_private.moderators where user_id = auth.uid());
$$;

create policy "Reporters and moderators can read reports" on public.reports for select
  to authenticated using (
    reporter_id = (select auth.uid()) or (select public.is_playground_moderator())
  );

create policy "Moderators can inspect reported problems" on public.problems for select
  to authenticated using (
    (select public.is_playground_moderator()) and exists (
      select 1 from public.reports where problem_id = problems.id
    )
  );

-- All private mutations authenticate the actor at the database boundary.
create function playground_private.require_profile()
returns uuid
language plpgsql stable
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or not exists (select 1 from public.profiles where id = actor) then
    raise sqlstate 'PT403' using message = 'Complete a profile first.';
  end if;
  return actor;
end;
$$;

-- Sharing, responding, and blocking for a pair use the same transaction lock.
create function playground_private.lock_pair(first_user uuid, second_user uuid)
returns void
language sql
set search_path = ''
as $$
  select pg_advisory_xact_lock(hashtextextended(
    least(first_user, second_user)::text || ':' || greatest(first_user, second_user)::text, 0
  ));
$$;

create function playground_private.is_blocked(first_user uuid, second_user uuid)
returns boolean
language sql stable
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (owner_id = first_user and blocked_id = second_user)
       or (owner_id = second_user and blocked_id = first_user)
  );
$$;

create function public.send_connection_request(target_problem uuid, note text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  actor uuid := playground_private.require_profile();
  problem public.problems%rowtype;
  request_id uuid;
begin
  select * into problem from public.problems where id = target_problem;
  if not found or problem.status <> 'open' or problem.author_id = actor then
    raise sqlstate 'PT403' using message = 'This problem is not accepting your request.';
  end if;

  perform playground_private.lock_pair(actor, problem.author_id);
  select * into problem from public.problems where id = target_problem for update;
  if not found or problem.status <> 'open' or playground_private.is_blocked(actor, problem.author_id) then
    raise sqlstate 'PT403' using message = 'This problem is not accepting your request.';
  end if;

  if exists (
    select 1 from public.connection_requests
    where problem_id = target_problem and sender_id = actor
      and (status in ('pending', 'accepted') or created_at > now() - interval '1 day')
  ) then
    raise sqlstate 'PT409' using message = 'You already sent a request for this problem recently.';
  end if;

  perform playground_private.consume_limit(actor, 'send_request', 10);
  insert into public.connection_requests (problem_id, sender_id, recipient_id, message)
  values (target_problem, actor, problem.author_id, btrim(coalesce(note, '')))
  returning id into request_id;

  insert into public.activity_events (user_id, request_id, kind)
  values (problem.author_id, request_id, 'incoming');
  return request_id;
end;
$$;

create function playground_private.lock_participant_request(target_request uuid, actor uuid)
returns public.connection_requests
language plpgsql
set search_path = ''
as $$
declare
  request public.connection_requests%rowtype;
begin
  select * into request from public.connection_requests
  where id = target_request and actor in (sender_id, recipient_id);
  if not found then
    raise sqlstate 'PT403' using message = 'This request is unavailable.';
  end if;

  perform playground_private.lock_pair(request.sender_id, request.recipient_id);
  select * into request from public.connection_requests
  where id = target_request and actor in (sender_id, recipient_id) for update;
  if not found then
    raise sqlstate 'PT403' using message = 'This request is unavailable.';
  end if;
  return request;
end;
$$;

create function public.change_connection_request(target_request uuid, operation text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  actor uuid := playground_private.require_profile();
  request public.connection_requests := playground_private.lock_participant_request(target_request, actor);
begin
  if operation in ('accepted', 'declined') and request.status = 'pending' and actor = request.recipient_id then
    if operation = 'accepted' then
      perform 1 from public.problems where id = request.problem_id and status in ('open', 'closed') for update;
      if not found or playground_private.is_blocked(request.sender_id, request.recipient_id) then
        raise sqlstate 'PT403' using message = 'This request can no longer be accepted.';
      end if;
    end if;
    insert into public.activity_events (user_id, request_id, kind)
    values (request.sender_id, request.id, operation);
  elsif operation = 'cancelled' and request.status = 'pending' and actor = request.sender_id then
    null;
  elsif operation = 'disconnected' and request.status = 'accepted' then
    delete from public.contact_shares where request_id = request.id;
  else
    raise sqlstate 'PT409' using message = 'This request can no longer be changed.';
  end if;

  update public.connection_requests set status = operation, updated_at = now() where id = request.id;
end;
$$;

create function public.share_contact(target_request uuid, field_kind text, field_value text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  actor uuid := playground_private.require_profile();
  request public.connection_requests := playground_private.lock_participant_request(target_request, actor);
  other_user uuid := case when actor = request.sender_id then request.recipient_id else request.sender_id end;
begin
  if request.status <> 'accepted' or playground_private.is_blocked(request.sender_id, request.recipient_id) then
    raise sqlstate 'PT403' using message = 'Contact sharing requires an active connection.';
  end if;

  perform playground_private.consume_limit(actor, 'share_contact', 20);
  insert into public.contact_shares as current_share (request_id, owner_id, recipient_id, kind, value)
  values (request.id, actor, other_user, field_kind, btrim(field_value))
  on conflict (request_id, owner_id, kind) do update
    set value = excluded.value, updated_at = now()
    where current_share.value is distinct from excluded.value;

  if found then
    insert into public.activity_events (user_id, request_id, kind)
    values (other_user, request.id, 'contact_shared');
  end if;
end;
$$;

create function public.revoke_contact(target_request uuid, field_kind text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  actor uuid := playground_private.require_profile();
  request public.connection_requests := playground_private.lock_participant_request(target_request, actor);
begin
  delete from public.contact_shares
  where request_id = request.id and owner_id = actor and kind = field_kind;
end;
$$;

create function public.set_user_block(target_user uuid, should_block boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  actor uuid := playground_private.require_profile();
begin
  if should_block is null or target_user = actor or not exists (select 1 from public.profiles where id = target_user) then
    raise sqlstate 'PT403' using message = 'This profile is unavailable.';
  end if;

  perform playground_private.lock_pair(actor, target_user);
  if not should_block then
    delete from public.blocks where owner_id = actor and blocked_id = target_user;
    return;
  end if;

  insert into public.blocks (owner_id, blocked_id)
  values (actor, target_user) on conflict do nothing;

  with ended_requests as (
    update public.connection_requests
    set status = case when status = 'pending' then 'cancelled' else 'disconnected' end, updated_at = now()
    where status in ('pending', 'accepted') and
      ((sender_id = actor and recipient_id = target_user) or (sender_id = target_user and recipient_id = actor))
    returning id
  )
  delete from public.contact_shares where request_id in (select id from ended_requests);
end;
$$;

create function public.submit_playground_report(target_problem uuid, target_user uuid, report_reason text, report_details text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  actor uuid := playground_private.require_profile();
begin
  if num_nonnulls(target_problem, target_user) <> 1 or target_user = actor then
    raise sqlstate 'PT400' using message = 'Choose a valid report target.';
  end if;

  if target_problem is not null and not exists (
    select 1 from public.problems where id = target_problem and status in ('open', 'closed') and author_id <> actor
  ) then
    raise sqlstate 'PT403' using message = 'This problem is unavailable.';
  end if;

  perform playground_private.consume_limit(actor, 'report', 6);
  insert into public.reports (reporter_id, problem_id, reported_user_id, reason, details)
  values (actor, target_problem, target_user, report_reason, btrim(coalesce(report_details, '')));
end;
$$;

create function public.review_playground_report(target_report uuid, decision text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  report public.reports%rowtype;
begin
  if not public.is_playground_moderator() then
    raise sqlstate 'PT403' using message = 'Moderator access is required.';
  end if;

  select * into report from public.reports where id = target_report and status = 'open' for update;
  if not found or decision is null or decision not in ('dismissed', 'resolved', 'remove_problem') then
    raise sqlstate 'PT409' using message = 'This report can no longer be reviewed.';
  end if;

  if decision = 'remove_problem' then
    if report.problem_id is null then
      raise sqlstate 'PT400' using message = 'This report is not about a problem.';
    end if;
    update public.problems set status = 'removed' where id = report.problem_id;
  end if;

  update public.reports
  set status = case when decision = 'dismissed' then 'dismissed' else 'resolved' end,
      reviewed_at = now(), reviewed_by = auth.uid()
  where id = report.id;
end;
$$;

revoke all on all functions in schema playground_private from public;

revoke all on function public.is_playground_moderator(), public.send_connection_request(uuid, text),
  public.change_connection_request(uuid, text), public.share_contact(uuid, text, text),
  public.revoke_contact(uuid, text), public.set_user_block(uuid, boolean),
  public.submit_playground_report(uuid, uuid, text, text), public.review_playground_report(uuid, text)
from public, anon, authenticated;

grant execute on function public.is_playground_moderator(), public.send_connection_request(uuid, text),
  public.change_connection_request(uuid, text), public.share_contact(uuid, text, text),
  public.revoke_contact(uuid, text), public.set_user_block(uuid, boolean),
  public.submit_playground_report(uuid, uuid, text, text), public.review_playground_report(uuid, text)
to authenticated;
