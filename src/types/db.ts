/** Typed database models — mirrors supabase/migrations. Keep in sync when the schema changes. */
import type { RecurrenceRule } from "@/lib/recurrence";

export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "done";
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived";
export type GoalStatus = "active" | "completed" | "abandoned";
export type GoalHorizon = "short" | "long";
export type TxnType = "income" | "expense";
export type ThemePref = "light" | "dark" | "system";
export type Accent = "teal" | "indigo" | "rose" | "amber" | "emerald" | "violet" | "slate";
export type Density = "comfortable" | "compact";
export type TextSize = "sm" | "md" | "lg";
export type Corners = "sharp" | "round" | "pill";
export type TimeFormat = "12h" | "24h";
export type CalendarViewPref = "month" | "week" | "agenda";

export interface Profile {
  id: string;
  display_name: string | null;
  timezone: string;
  currency: string;
  week_start: number;
  theme: ThemePref;
  accent: Accent;
  density: Density;
  text_size: TextSize;
  corners: Corners;
  time_format: TimeFormat;
  calendar_view: CalendarViewPref;
  dashboard_widgets: string[];
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

interface Owned {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Project extends Owned {
  title: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  start_date: string | null;
  deadline: string | null;
  color: string | null;
}

export interface ProjectMilestone extends Owned {
  project_id: string;
  title: string;
  due_date: string | null;
  completed_at: string | null;
}

export interface Goal extends Owned {
  title: string;
  description: string | null;
  category: string | null;
  horizon: GoalHorizon;
  status: GoalStatus;
  target_date: string | null;
  unit: string;
  start_value: number;
  current_value: number;
  target_value: number;
  completed_at: string | null;
}

export interface GoalMilestone extends Owned {
  goal_id: string;
  title: string;
  due_date: string | null;
  completed_at: string | null;
}

export interface GoalProgressLog {
  id: string;
  user_id: string;
  goal_id: string;
  value: number;
  note: string | null;
  logged_on: string;
  created_at: string;
}

export interface Task extends Owned {
  project_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  due_time: string | null;
  category: string | null;
  tags: string[];
  estimated_minutes: number | null;
  recurrence: RecurrenceRule | null;
  series_id: string | null;
  completed_at: string | null;
}

export interface CalendarEvent extends Owned {
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  task_id: string | null;
  project_id: string | null;
}

export interface Habit extends Owned {
  title: string;
  description: string | null;
  color: string | null;
  schedule_days: number[];
  start_date: string;
  archived_at: string | null;
}

export interface HabitCompletion {
  id: string;
  user_id: string;
  habit_id: string;
  completed_on: string;
  created_at: string;
}

export interface Note extends Owned {
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  archived_at: string | null;
  project_id: string | null;
  goal_id: string | null;
  version: number;
}

export interface Transaction extends Owned {
  type: TxnType;
  amount_minor: number;
  currency: string;
  occurred_on: string;
  category: string;
  description: string | null;
  payment_method: string | null;
}

export interface Budget extends Owned {
  month: string;
  category: string;
  limit_minor: number;
  currency: string;
}
