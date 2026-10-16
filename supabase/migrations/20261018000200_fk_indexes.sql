-- Covering indexes for composite foreign keys (faster joins, cascades and deletes).
create index if not exists events_project_idx on public.events (project_id, user_id);
create index if not exists events_task_idx on public.events (task_id, user_id);
create index if not exists goal_milestones_goal_idx on public.goal_milestones (goal_id, user_id);
create index if not exists goal_progress_logs_goal_idx on public.goal_progress_logs (goal_id, user_id);
create index if not exists habit_completions_habit_idx on public.habit_completions (habit_id, user_id);
create index if not exists notes_goal_idx on public.notes (goal_id, user_id);
create index if not exists notes_project_idx on public.notes (project_id, user_id);
create index if not exists project_milestones_project_idx on public.project_milestones (project_id, user_id);
create index if not exists tasks_project_idx on public.tasks (project_id, user_id);
