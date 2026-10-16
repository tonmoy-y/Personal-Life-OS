-- DEVELOPMENT ONLY. Never run against production.
-- Seeds demo data for ONE existing user. Usage (local Supabase):
--   psql "$LOCAL_DB_URL" -v email="'you@example.com'" -f scripts/seed-dev.sql
-- The script refuses to run unless the current database setting `app.allow_dev_seed` is 'on':
--   psql ... -c "alter database postgres set app.allow_dev_seed = 'on'"   (local only)
do $$
declare
  uid uuid;
  pid uuid;
  gid uuid;
  hid uuid;
begin
  if coalesce(current_setting('app.allow_dev_seed', true), 'off') <> 'on' then
    raise exception 'Refusing to seed: set app.allow_dev_seed = on (local development databases only).';
  end if;
  select id into uid from auth.users where email = :email;
  if uid is null then raise exception 'No user with that email — sign up first.'; end if;

  insert into public.projects (user_id, title, description, status, priority, deadline, color)
  values (uid, '[demo] Launch personal site', 'Demo project', 'active', 'high', current_date + 30, '#2f7d79') returning id into pid;
  insert into public.tasks (user_id, project_id, title, priority, due_date, tags) values
    (uid, pid, '[demo] Draft homepage copy', 'high', current_date, array['writing']),
    (uid, pid, '[demo] Pick a domain', 'medium', current_date + 2, array['admin']),
    (uid, null, '[demo] Overdue example', 'urgent', current_date - 2, '{}');
  insert into public.goals (user_id, title, unit, start_value, current_value, target_value, target_date, horizon)
  values (uid, '[demo] Read 12 books', 'books', 0, 3, 12, current_date + 200, 'long') returning id into gid;
  insert into public.habits (user_id, title, start_date) values (uid, '[demo] Walk 30 minutes', current_date - 20) returning id into hid;
  insert into public.habit_completions (user_id, habit_id, completed_on)
    select uid, hid, current_date - g from generate_series(0, 6) g;
  insert into public.transactions (user_id, type, amount_minor, currency, occurred_on, category, description)
  values (uid, 'income', 5000000, 'BDT', date_trunc('month', current_date)::date, 'Salary', '[demo] salary'),
         (uid, 'expense', 450000, 'BDT', current_date, 'Food', '[demo] groceries');
  insert into public.budgets (user_id, month, category, limit_minor, currency)
  values (uid, date_trunc('month', current_date)::date, 'Food', 1500000, 'BDT');
  insert into public.notes (user_id, title, body, tags, pinned)
  values (uid, '[demo] Welcome', E'# Hello\n\nThis is a **demo** note.', array['demo'], true);
end
$$;
