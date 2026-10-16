import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, monthEnd, monthStart, nowTimeIn, startOfDayUtc, todayIn } from "@/lib/dates";
import { budgetUsage, totals, type Txn } from "@/lib/finance";
import { goalProgress } from "@/lib/goals";
import { loadHabits } from "@/features/habits/queries";
import type { CalendarEvent, Goal, Task, Transaction, Budget } from "@/types/db";

export async function loadDashboard(supabase: SupabaseClient, tz: string, currency: string) {
  const today = todayIn(tz);
  const time = nowTimeIn(tz);
  const month = monthStart(today);
  const dayStartUtc = startOfDayUtc(today, tz).toISOString();
  const weekEndUtc = startOfDayUtc(addDays(today, 8), tz).toISOString();

  const [overdue, dueToday, events, goals, tx, bud, habits] = await Promise.all([
    supabase.from("tasks").select("*").neq("status", "done").or(`due_date.lt.${today},and(due_date.eq.${today},due_time.lt.${time})`).order("due_date").limit(20),
    supabase.from("tasks").select("*").eq("due_date", today).order("due_time", { nullsFirst: false }).limit(50),
    supabase.from("events").select("*").gte("end_at", new Date().toISOString()).lt("start_at", weekEndUtc).gte("end_at", dayStartUtc).order("start_at").limit(8),
    supabase.from("goals").select("*").eq("status", "active").order("target_date", { nullsFirst: false }).limit(6),
    supabase.from("transactions").select("type, amount_minor, occurred_on, category").eq("currency", currency).gte("occurred_on", month).lte("occurred_on", monthEnd(month)).limit(5000),
    supabase.from("budgets").select("*").eq("month", month).eq("currency", currency),
    loadHabits(supabase, tz),
  ]);

  const overdueTasks = (overdue.data ?? []) as Task[];
  const todayTasks = (dueToday.data ?? []) as Task[];
  const openToday = todayTasks.filter((t) => t.status !== "done");
  const upcomingEvents = (events.data ?? []) as CalendarEvent[];
  const activeGoals = ((goals.data ?? []) as Goal[]).map((g) => ({ goal: g, progress: goalProgress(g) }));
  const monthTxns = (tx.data ?? []) as Pick<Transaction, "type" | "amount_minor" | "occurred_on" | "category">[];
  const spend = totals(monthTxns as Txn[]);
  const budgets = budgetUsage((bud.data ?? []) as Budget[], monthTxns as Txn[]);
  const dueHabits = habits.stats.filter((s) => s.scheduledToday);
  const habitsDone = dueHabits.filter((s) => s.doneToday).length;

  return {
    today, overdueTasks, todayTasks, openToday, upcomingEvents, activeGoals, spend, budgets,
    habits: habits.stats, dueHabits, habitsDone,
    minutesPlanned: openToday.reduce((s, t) => s + (t.estimated_minutes ?? 0), 0),
  };
}

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
