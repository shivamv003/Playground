-- Run against a local Supabase database with the launch migrations applied.
begin;

create function pg_temp.check_condition(condition boolean, explanation text)
returns void language plpgsql as $$
begin
  if condition is not true then raise exception '%', explanation; end if;
end;
$$;

insert into auth.users (id, email) values
  ('3a000000-0000-4000-a000-000000000001', 'launch-sql-owner@example.com'),
  ('3a000000-0000-4000-a000-000000000002', 'launch-sql-builder@example.com'),
  ('3a000000-0000-4000-a000-000000000003', 'launch-sql-moderator@example.com');
insert into public.profiles (id, username, display_name) values
  ('3a000000-0000-4000-a000-000000000001', 'launch_owner', 'Launch Owner'),
  ('3a000000-0000-4000-a000-000000000002', 'launch_builder', 'Launch Builder'),
  ('3a000000-0000-4000-a000-000000000003', 'launch_moderator', 'Launch Moderator');
insert into playground_private.moderators values ('3a000000-0000-4000-a000-000000000003');

set local role authenticated;
select set_config('request.jwt.claim.sub', '3a000000-0000-4000-a000-000000000001', true);

insert into public.problems (author_id, category_id, title, description, skills)
select auth.uid(), id, 'A launch test for accessibility', 'Map useful accessibility information with the community.', 'Mapping'
from public.categories where slug = 'accessibility'
returning id as problem_id \gset
select set_config('playground.test_problem', :'problem_id', true);

insert into public.problems (author_id, category_id, title, description)
select auth.uid(), id, 'A problem for the decline test', 'This separate problem tests declining a connection request.'
from public.categories where slug = 'education'
returning id as decline_problem \gset

insert into public.problems (author_id, category_id, title, description)
select auth.uid(), id, 'A problem for the cancel test', 'This separate problem tests cancelling a connection request.'
from public.categories where slug = 'education'
returning id as cancel_problem \gset

do $$
begin
  begin
    perform public.send_connection_request(current_setting('playground.test_problem')::uuid, 'My own post');
    raise exception 'An author could connect to their own post';
  exception when sqlstate 'PT403' then null;
  end;

  begin
    insert into public.problems (author_id, category_id, title, description)
    select '3a000000-0000-4000-a000-000000000002', id, 'A spoofed author post', 'A test of forged problem ownership.'
    from public.categories where slug = 'education';
    raise exception 'A user could spoof a problem author';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.problems (author_id, category_id, title, description)
    select auth.uid(), category.id, 'An additional problem ' || series, 'This publication tests the hourly posting limit.'
    from public.categories as category cross join generate_series(1, 3) as series
    where category.slug = 'education';
    raise exception 'A user could post more than the hourly limit';
  exception when sqlstate 'PT429' then null;
  end;
end;
$$;

reset role;
set local role anon;
select pg_temp.check_condition(
  exists(select from public.problems where id = :'problem_id' and search_document @@ websearch_to_tsquery('simple', 'Mapping')),
  'Anonymous discovery could not find a public problem by skill'
);
select pg_temp.check_condition(not has_table_privilege('public.contact_shares', 'select'), 'Guest contact access was granted');
select pg_temp.check_condition(not has_function_privilege('public.send_connection_request(uuid,text)', 'execute'), 'Guests can send requests');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '3a000000-0000-4000-a000-000000000002', true);
with denied as (
  update public.problems set title = 'Someone else changed the title' where id = :'problem_id' returning id
) select pg_temp.check_condition(not exists(select from denied), 'A non-owner could edit a problem');

select public.send_connection_request(:'problem_id', 'I can help with mapping.') as request_id \gset
select public.send_connection_request(:'decline_problem', '') as decline_request \gset
select public.send_connection_request(:'cancel_problem', '') as cancel_request \gset
select public.change_connection_request(:'cancel_request', 'cancelled');
select pg_temp.check_condition(exists(select from public.connection_requests where id = :'cancel_request' and status = 'cancelled'), 'The sender could not cancel their pending request');
select set_config('playground.test_request', :'request_id', true);

do $$
begin
  begin
    perform public.send_connection_request(current_setting('playground.test_problem')::uuid, 'Duplicate');
    raise exception 'A duplicate pending request was created';
  exception when sqlstate 'PT409' then null;
  end;
  begin
    perform public.change_connection_request(current_setting('playground.test_request')::uuid, 'accepted');
    raise exception 'A sender could accept their own request';
  exception when sqlstate 'PT409' then null;
  end;
  begin
    perform public.share_contact(current_setting('playground.test_request')::uuid, 'email', 'before@example.com');
    raise exception 'A pending request allowed contact sharing';
  exception when sqlstate 'PT403' then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '3a000000-0000-4000-a000-000000000001', true);
select pg_temp.check_condition(exists(select from public.activity_events where request_id = :'request_id' and kind = 'incoming'), 'The recipient missed the incoming event');
select public.change_connection_request(:'request_id', 'accepted');
select public.change_connection_request(:'decline_request', 'declined');
select pg_temp.check_condition(exists(select from public.connection_requests where id = :'decline_request' and status = 'declined'), 'The recipient could not decline a pending request');
select public.share_contact(:'request_id', 'email', 'selected@example.com');

select set_config('request.jwt.claim.sub', '3a000000-0000-4000-a000-000000000003', true);
select pg_temp.check_condition(not exists(select from public.connection_requests where id = :'request_id'), 'A non-participant could read a request');
select pg_temp.check_condition(not exists(select from public.contact_shares where request_id = :'request_id'), 'A moderator could read private contact details');
select pg_temp.check_condition(not exists(select from public.activity_events where request_id = :'request_id'), 'A non-participant could read private activity');

select set_config('request.jwt.claim.sub', '3a000000-0000-4000-a000-000000000002', true);
select pg_temp.check_condition(
  exists(select from public.contact_shares where request_id = :'request_id' and value = 'selected@example.com'),
  'The intended recipient could not read the explicitly shared field'
);
select pg_temp.check_condition(exists(select from public.activity_events where request_id = :'request_id' and kind = 'contact_shared'), 'The recipient missed the sharing event');
select public.revoke_contact(:'request_id', 'email');
select pg_temp.check_condition(exists(select from public.contact_shares where request_id = :'request_id'), 'The recipient could revoke an owner’s share');

select set_config('request.jwt.claim.sub', '3a000000-0000-4000-a000-000000000001', true);
select public.revoke_contact(:'request_id', 'email');
select pg_temp.check_condition(not exists(select from public.contact_shares where request_id = :'request_id'), 'Revoked details remained readable');
select public.share_contact(:'request_id', 'discord', 'test-tag');
select public.set_user_block('3a000000-0000-4000-a000-000000000002', true);

select set_config('request.jwt.claim.sub', '3a000000-0000-4000-a000-000000000002', true);
select pg_temp.check_condition(not exists(select from public.contact_shares where request_id = :'request_id'), 'A blocked user retained a shared contact');
select pg_temp.check_condition(not exists(select from public.blocks), 'A blocked user could read someone else’s block list');
select pg_temp.check_condition(exists(select from public.connection_requests where id = :'request_id' and status = 'disconnected'), 'Blocking left an accepted request active');
do $$
begin
  begin
    perform public.send_connection_request(current_setting('playground.test_problem')::uuid, 'Blocked');
    raise exception 'A blocked person could send a request';
  exception when sqlstate 'PT403' then null;
  end;
end;
$$;

select public.submit_playground_report(:'problem_id', null, 'spam', 'Test report');
select id as report_id from public.reports where problem_id = :'problem_id' \gset
select set_config('playground.test_report', :'report_id', true);
do $$
begin
  begin
    perform public.review_playground_report(current_setting('playground.test_report')::uuid, 'remove_problem');
    raise exception 'An ordinary user could take down a problem';
  exception when sqlstate 'PT403' then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '3a000000-0000-4000-a000-000000000003', true);
select public.review_playground_report(:'report_id', 'remove_problem');
select pg_temp.check_condition(exists(select from public.reports where id = :'report_id' and status = 'resolved'), 'Moderator action was not recorded');

select set_config('request.jwt.claim.sub', '3a000000-0000-4000-a000-000000000001', true);
with denied as (
  update public.problems set status = 'open' where id = :'problem_id' returning id
) select pg_temp.check_condition(not exists(select from denied), 'An author could republish a moderation takedown');

reset role;
set local role anon;
select pg_temp.check_condition(not exists(select from public.problems where id = :'problem_id'), 'A removed problem remained publicly visible');

rollback;
