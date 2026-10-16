-- Cross-user isolation tests. Run via scripts/test-rls.sh (plain Postgres + auth stub).
\set a '00000000-0000-0000-0000-00000000000a'
\set b '00000000-0000-0000-0000-00000000000b'

create or replace function pg_temp.assert(cond boolean, msg text) returns void language plpgsql as $$
begin if not coalesce(cond, false) then raise exception 'ASSERTION FAILED: %', msg; end if; end $$;
grant execute on function pg_temp.assert(boolean, text) to public;

-- Setup as superuser: two users (trigger must create profiles)
insert into auth.users (id, email, raw_user_meta_data) values
  (:'a', 'a@example.test', '{"display_name":"Alice"}'),
  (:'b', 'b@example.test', '{}');
select pg_temp.assert((select count(*) from public.profiles) = 2, 'signup trigger creates a profile per user');

-- ===== User A creates data =====
select set_config('request.jwt.claim.sub', :'a', false);
set role authenticated;

insert into public.projects (id, user_id, title) values ('11111111-0000-0000-0000-00000000000a', :'a', 'A project');
insert into public.tasks (user_id, title, project_id, due_date) values (:'a', 'A task', '11111111-0000-0000-0000-00000000000a', current_date);
insert into public.events (user_id, title, start_at, end_at) values (:'a', 'A event', now(), now() + interval '1 hour');
insert into public.habits (id, user_id, title) values ('22222222-0000-0000-0000-00000000000a', :'a', 'A habit');
insert into public.habit_completions (user_id, habit_id, completed_on) values (:'a', '22222222-0000-0000-0000-00000000000a', current_date);
insert into public.goals (id, user_id, title) values ('33333333-0000-0000-0000-00000000000a', :'a', 'A goal');
insert into public.goal_milestones (user_id, goal_id, title) values (:'a', '33333333-0000-0000-0000-00000000000a', 'm');
insert into public.goal_progress_logs (user_id, goal_id, value, logged_on) values (:'a', '33333333-0000-0000-0000-00000000000a', 10, current_date);
insert into public.project_milestones (user_id, project_id, title) values (:'a', '11111111-0000-0000-0000-00000000000a', 'pm');
insert into public.notes (user_id, title, body) values (:'a', 'A note', 'secret');
insert into public.transactions (user_id, type, amount_minor, currency, occurred_on, category) values (:'a', 'expense', 12345, 'BDT', current_date, 'Food');
insert into public.budgets (user_id, month, category, limit_minor, currency) values (:'a', date_trunc('month', current_date)::date, 'Food', 50000, 'BDT');

select pg_temp.assert((select count(*) from public.tasks) = 1, 'A sees own task');
select pg_temp.assert((select count(*) from public.profiles) = 1, 'A sees only own profile');

-- ===== User B cannot see or mutate A's data =====
reset role;
select set_config('request.jwt.claim.sub', :'b', false);
set role authenticated;

do $$
declare t text; n int; rc int;
begin
  foreach t in array array['projects','project_milestones','goals','goal_milestones','goal_progress_logs',
    'tasks','events','habits','habit_completions','notes','transactions','budgets'] loop
    execute format('select count(*) from public.%I', t) into n;
    perform pg_temp.assert(n = 0, 'B must not read ' || t);
    execute format('update public.%I set user_id = user_id', t);
    get diagnostics rc = row_count;
    perform pg_temp.assert(rc = 0, 'B must not update ' || t);
    execute format('delete from public.%I', t);
    get diagnostics rc = row_count;
    perform pg_temp.assert(rc = 0, 'B must not delete ' || t);
  end loop;
  perform pg_temp.assert((select count(*) from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 0, 'B must not read A profile');
end $$;

-- B cannot insert rows owned by A
do $$ begin
  begin
    insert into public.notes (user_id, title) values ('00000000-0000-0000-0000-00000000000a', 'forged');
    raise exception 'ASSERTION FAILED: B inserted a row as A';
  exception when insufficient_privilege then null; -- RLS violation (42501)
  end;
end $$;

-- B cannot reassign own rows to A (WITH CHECK)
insert into public.notes (id, user_id, title) values ('44444444-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', 'B note');
do $$ begin
  begin
    update public.notes set user_id = '00000000-0000-0000-0000-00000000000a' where id = '44444444-0000-0000-0000-00000000000b';
    raise exception 'ASSERTION FAILED: B reassigned a row to A';
  exception when insufficient_privilege then null;
  end;
end $$;

-- B cannot link own task/event/note to A's project or goal (composite FK)
do $$ begin
  begin
    insert into public.tasks (user_id, title, project_id) values ('00000000-0000-0000-0000-00000000000b', 'x', '11111111-0000-0000-0000-00000000000a');
    raise exception 'ASSERTION FAILED: B linked a task to A project';
  exception when foreign_key_violation then null;
  end;
  begin
    update public.notes set goal_id = '33333333-0000-0000-0000-00000000000a' where id = '44444444-0000-0000-0000-00000000000b';
    raise exception 'ASSERTION FAILED: B linked a note to A goal';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.habit_completions (user_id, habit_id, completed_on) values ('00000000-0000-0000-0000-00000000000b', '22222222-0000-0000-0000-00000000000a', current_date);
    raise exception 'ASSERTION FAILED: B completed A habit';
  exception when foreign_key_violation then null;
  end;
end $$;

-- ===== Constraints =====
reset role;
select set_config('request.jwt.claim.sub', :'a', false);
set role authenticated;
do $$ begin
  begin insert into public.events (user_id, title, start_at, end_at) values ('00000000-0000-0000-0000-00000000000a', 'bad', now(), now() - interval '1 hour');
    raise exception 'ASSERTION FAILED: invalid event range accepted';
  exception when check_violation then null; end;
  begin insert into public.habit_completions (user_id, habit_id, completed_on) values ('00000000-0000-0000-0000-00000000000a', '22222222-0000-0000-0000-00000000000a', current_date);
    raise exception 'ASSERTION FAILED: duplicate habit completion accepted';
  exception when unique_violation then null; end;
  begin insert into public.transactions (user_id, type, amount_minor, currency, occurred_on, category) values ('00000000-0000-0000-0000-00000000000a', 'expense', 0, 'BDT', current_date, 'x');
    raise exception 'ASSERTION FAILED: zero amount accepted';
  exception when check_violation then null; end;
  begin insert into public.budgets (user_id, month, category, limit_minor, currency) values ('00000000-0000-0000-0000-00000000000a', current_date + 1, 'x', 1, 'BDT');
    raise exception 'ASSERTION FAILED: non-first-of-month budget accepted';
  exception when check_violation then null; end;
  begin
    insert into public.tasks (user_id, title, status) values ('00000000-0000-0000-0000-00000000000a', 'x', 'done');
    raise exception 'ASSERTION FAILED: done task without completed_at accepted';
  exception when check_violation then null; end;
end $$;

-- Series uniqueness => idempotent next-occurrence generation
insert into public.tasks (user_id, title, due_date, series_id, recurrence) values ('00000000-0000-0000-0000-00000000000a', 'r', current_date + 1, '55555555-0000-0000-0000-00000000000a', '{"freq":"daily","interval":1}');
do $$ begin
  begin insert into public.tasks (user_id, title, due_date, series_id) values ('00000000-0000-0000-0000-00000000000a', 'r', current_date + 1, '55555555-0000-0000-0000-00000000000a');
    raise exception 'ASSERTION FAILED: duplicate recurring occurrence accepted';
  exception when unique_violation then null; end;
end $$;

-- ===== Anonymous role has no access =====
reset role;
set role anon;
do $$ begin
  begin perform count(*) from public.tasks; raise exception 'ASSERTION FAILED: anon can read tasks';
  exception when insufficient_privilege then null; end;
  begin perform public.delete_my_account(); raise exception 'ASSERTION FAILED: anon can call delete_my_account';
  exception when insufficient_privilege then null; end;
end $$;

-- ===== Account deletion cascades only the caller's data =====
reset role;
select set_config('request.jwt.claim.sub', :'b', false);
set role authenticated;
select public.delete_my_account();
reset role;
select pg_temp.assert((select count(*) from auth.users where id = :'b') = 0, 'B account deleted');
select pg_temp.assert((select count(*) from public.notes where user_id = :'b') = 0, 'B data cascaded');
select pg_temp.assert((select count(*) from public.tasks where user_id = :'a') = 2, 'A data untouched by B deletion');
select pg_temp.assert((select count(*) from auth.users where id = :'a') = 1, 'A account untouched');

-- ===== Every public table has RLS enabled =====
select pg_temp.assert(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity) = 0,
  'all public tables have RLS enabled');
