-- Personal Life OS — initial schema
-- Ordered, idempotent-safe on a fresh Supabase project. Run once (SQL editor, `supabase db push`, or MCP apply_migration).
--
-- Conventions
--  * Every user-owned table has user_id uuid not null references auth.users(id) on delete cascade.
--  * Every user-owned table has RLS enabled with owner-only policies (select/insert/update/delete),
--    each scoped `to authenticated`, with `with check` on writes so rows can never be reassigned.
--  * Cross-table links use composite FKs (child_id, user_id) -> parent(id, user_id) so a row can
--    never reference another user's parent row (FK checks bypass RLS, so this must be structural).
--  * Money is stored as integer minor units (bigint) — never floats.
--  * Calendar-date fields (due_date, occurred_on, completed_on, …) are plain `date` in the user's
--    local calendar; instants (events, completed_at, created_at) are timestamptz in UTC.

-- ---------------------------------------------------------------------------
-- Helper trigger functions
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 80),
  timezone text not null default 'Asia/Dhaka' check (char_length(timezone) between 1 and 64),
  currency text not null default 'BDT' check (currency ~ '^[A-Z]{3}$'),
  week_start smallint not null default 1 check (week_start between 0 and 6),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  dashboard_widgets text[] not null default
    array['summary','tasks','events','habits','goals','spending']::text[],
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text check (description is null or char_length(description) <= 5000),
  status text not null default 'active'
    check (status in ('planning', 'active', 'on_hold', 'completed', 'archived')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  start_date date,
  deadline date,
  color text check (color is null or color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check (start_date is null or deadline is null or deadline >= start_date)
);
create index projects_user_status_idx on public.projects (user_id, status);
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

create table public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null,
  title text not null check (char_length(title) between 1 and 160),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete cascade
);
create index project_milestones_project_idx on public.project_milestones (user_id, project_id);
create trigger project_milestones_set_updated_at before update on public.project_milestones
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- goals
-- ---------------------------------------------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text check (description is null or char_length(description) <= 5000),
  category text check (category is null or char_length(category) <= 60),
  horizon text not null default 'short' check (horizon in ('short', 'long')),
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  target_date date,
  unit text not null default '%' check (char_length(unit) between 1 and 20),
  start_value numeric(18, 4) not null default 0,
  current_value numeric(18, 4) not null default 0,
  target_value numeric(18, 4) not null default 100,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check (target_value <> start_value)
);
create index goals_user_status_idx on public.goals (user_id, status);
create trigger goals_set_updated_at before update on public.goals
  for each row execute function public.set_updated_at();

create table public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null,
  title text not null check (char_length(title) between 1 and 160),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (goal_id, user_id) references public.goals (id, user_id) on delete cascade
);
create index goal_milestones_goal_idx on public.goal_milestones (user_id, goal_id);
create trigger goal_milestones_set_updated_at before update on public.goal_milestones
  for each row execute function public.set_updated_at();

create table public.goal_progress_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null,
  value numeric(18, 4) not null,
  note text check (note is null or char_length(note) <= 500),
  logged_on date not null,
  created_at timestamptz not null default now(),
  foreign key (goal_id, user_id) references public.goals (id, user_id) on delete cascade
);
create index goal_progress_logs_goal_idx on public.goal_progress_logs (user_id, goal_id, logged_on);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid,
  title text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 5000),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  -- Local calendar date / wall-clock time in the user's profile timezone.
  due_date date,
  due_time time,
  category text check (category is null or char_length(category) <= 60),
  tags text[] not null default '{}' check (cardinality(tags) <= 20),
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes between 1 and 10080),
  -- Recurrence: {"freq":"daily|weekly|monthly|yearly","interval":n,"weekdays":[0-6],"anchorDay":n,"until":"YYYY-MM-DD"}
  recurrence jsonb,
  series_id uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete set null (project_id),
  check (due_time is null or due_date is not null),
  check (recurrence is null or due_date is not null),
  check (status <> 'done' or completed_at is not null)
);
create index tasks_user_status_due_idx on public.tasks (user_id, status, due_date);
create index tasks_user_project_idx on public.tasks (user_id, project_id);
-- One occurrence per series per date: makes next-occurrence generation idempotent.
create unique index tasks_series_due_uniq on public.tasks (user_id, series_id, due_date) where series_id is not null;
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- events (instants, UTC)
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 5000),
  location text check (location is null or char_length(location) <= 200),
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  task_id uuid,
  project_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (task_id, user_id) references public.tasks (id, user_id) on delete set null (task_id),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete set null (project_id),
  check (end_at >= start_at)
);
create index events_user_start_idx on public.events (user_id, start_at);
create trigger events_set_updated_at before update on public.events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- habits
-- ---------------------------------------------------------------------------
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  color text check (color is null or color ~ '^#[0-9a-fA-F]{6}$'),
  -- Scheduled weekdays, 0 = Sunday … 6 = Saturday.
  schedule_days smallint[] not null default array[0,1,2,3,4,5,6]::smallint[]
    check (cardinality(schedule_days) between 1 and 7 and schedule_days <@ array[0,1,2,3,4,5,6]::smallint[]),
  start_date date not null default current_date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index habits_user_idx on public.habits (user_id, archived_at);
create trigger habits_set_updated_at before update on public.habits
  for each row execute function public.set_updated_at();

create table public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null,
  completed_on date not null,
  created_at timestamptz not null default now(),
  foreign key (habit_id, user_id) references public.habits (id, user_id) on delete cascade,
  unique (user_id, habit_id, completed_on)
);
create index habit_completions_user_date_idx on public.habit_completions (user_id, completed_on);

-- ---------------------------------------------------------------------------
-- notes
-- ---------------------------------------------------------------------------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '' check (char_length(title) <= 200),
  body text not null default '' check (char_length(body) <= 200000),
  tags text[] not null default '{}' check (cardinality(tags) <= 20),
  pinned boolean not null default false,
  archived_at timestamptz,
  project_id uuid,
  goal_id uuid,
  -- Optimistic-concurrency counter: autosave must present the version it last saw.
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete set null (project_id),
  foreign key (goal_id, user_id) references public.goals (id, user_id) on delete set null (goal_id)
);
create index notes_user_updated_idx on public.notes (user_id, archived_at, updated_at desc);
create trigger notes_set_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- finance (integer minor units)
-- ---------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount_minor bigint not null check (amount_minor > 0 and amount_minor <= 999999999999999),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  occurred_on date not null,
  category text not null check (char_length(category) between 1 and 60),
  description text check (description is null or char_length(description) <= 300),
  payment_method text check (payment_method is null or char_length(payment_method) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index transactions_user_date_idx on public.transactions (user_id, occurred_on desc);
create index transactions_user_category_idx on public.transactions (user_id, category);
create trigger transactions_set_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();

-- Budgets are spending *limits*, not transactions.
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month date not null check (month = date_trunc('month', month)::date),
  category text not null check (char_length(category) between 1 and 60),
  limit_minor bigint not null check (limit_minor > 0 and limit_minor <= 999999999999999),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month, category)
);
create trigger budgets_set_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: owner-only on every table
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'projects','project_milestones','goals','goal_milestones','goal_progress_logs',
    'tasks','events','habits','habit_completions','notes','transactions','budgets'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      t || '_delete_own', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Privileges: nothing for anon; authenticated gets DML (RLS still applies).
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on
  public.projects, public.project_milestones, public.goals, public.goal_milestones,
  public.goal_progress_logs, public.tasks, public.events, public.habits,
  public.habit_completions, public.notes, public.transactions, public.budgets
  to authenticated;

-- ---------------------------------------------------------------------------
-- Account deletion: a user may delete only their own auth.users row; every
-- user-owned table cascades from it. SECURITY DEFINER is required to touch the
-- auth schema; the function only ever acts on auth.uid().
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  delete from auth.users where id = uid;
end;
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
