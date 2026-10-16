import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeBuckets, pctChange, periodFor, previousPeriod, sumByBucket, type RangeDays } from "@/lib/analytics";
import { addDays, monthEnd, monthStart, nowTimeIn, startOfDayUtc, todayIn, utcToLocal } from "@/lib/dates";
import { budgetUsage, totals, type Txn } from "@/lib/finance";
import { goalProgress } from "@/lib/goals";
import { completionRate, scheduledCount } from "@/lib/habits";
import { loadHabits } from "@/features/habits/queries";
import { listProjects } from "@/features/projects/queries";
import type { Budget, Goal, Task, Transaction } from "@/types/db";

export async function loadAnalytics(supabase: SupabaseClient, tz: string, currency: string, weekStart: number, days: RangeDays) {
  const today = todayIn(tz);
  const time = nowTimeIn(tz);
  const period = periodFor(today, days);
  const prev = previousPeriod(period, days);
  const fromUtc = startOfDayUtc(period.from, tz).toISOString();
  const toUtc = startOfDayUtc(addDays(period.to, 1), tz).toISOString();
  const month = monthStart(today);

  const [completed, dueInPeriod, overdue, tx, prevTx, bud, habits, goals, projects] = await Promise.all([
    supabase.from("tasks").select("completed_at").eq("status", "done").gte("completed_at", fromUtc).lt("completed_at", toUtc).limit(20000),
    supabase.from("tasks").select("status").gte("due_date", period.from).lte("due_date", period.to).limit(20000),
    supabase.from("tasks").select("id", { count: "exact", head: true }).neq("status", "done").or(`due_date.lt.${today},and(due_date.eq.${today},due_time.lt.${time})`),
    supabase.from("transactions").select("type, amount_minor, occurred_on, category").eq("currency", currency).gte("occurred_on", period.from).lte("occurred_on", period.to).limit(20000),
    supabase.from("transactions").select("type, amount_minor, occurred_on, category").eq("currency", currency).gte("occurred_on", prev.from).lte("occurred_on", prev.to).limit(20000),
    supabase.from("budgets").select("*").eq("month", month).eq("currency", currency),
    loadHabits(supabase, tz, false, 400),
    supabase.from("goals").select("*").eq("status", "active").limit(50),
    listProjects(supabase),
  ]);

  const buckets = makeBuckets(period.from, period.to, weekStart);

  // Tasks
  const completedDates = ((completed.data ?? []) as Pick<Task, "completed_at">[]).map((t) => ({ date: utcToLocal(t.completed_at!, tz).date }));
  const completedSeries = sumByBucket(buckets, completedDates);
  const due = (dueInPeriod.data ?? []) as Pick<Task, "status">[];
  const dueDone = due.filter((t) => t.status === "done").length;

  // Habits
  const activeHabits = habits.stats.filter((s) => !s.habit.archived_at);
  const habitRows = activeHabits.map((s) => {
    const set = new Set(s.history);
    const rate = completionRate(s.habit, set, period.from, period.to);
    return { name: s.habit.title, rate: rate === null ? null : Math.round(rate * 100), scheduled: scheduledCount(s.habit, period.from, period.to), done: Math.round((rate ?? 0) * scheduledCount(s.habit, period.from, period.to)) };
  });
  const habitScheduled = habitRows.reduce((a, h) => a + h.scheduled, 0);
  const habitDone = habitRows.reduce((a, h) => a + h.done, 0);

  // Spending
  const periodTxns = (tx.data ?? []) as Pick<Transaction, "type" | "amount_minor" | "occurred_on" | "category">[];
  const spendSeries = sumByBucket(buckets, periodTxns.filter((t) => t.type === "expense").map((t) => ({ date: t.occurred_on, value: t.amount_minor })));
  const incomeSeries = sumByBucket(buckets, periodTxns.filter((t) => t.type === "income").map((t) => ({ date: t.occurred_on, value: t.amount_minor })));
  const spend = totals(periodTxns as Txn[]);
  const prevSpend = totals((prevTx.data ?? []) as Txn[]);

  // Budget usage for the current month
  const monthTx = await supabase.from("transactions").select("type, amount_minor, occurred_on, category").eq("currency", currency).gte("occurred_on", month).lte("occurred_on", monthEnd(month)).limit(20000);

  return {
    period, days, today,
    tasks: {
      completed: completedDates.length,
      overdueNow: overdue.count ?? 0,
      dueInPeriod: due.length,
      dueCompleted: dueDone,
      completionRate: due.length ? Math.round((dueDone / due.length) * 100) : null,
      series: buckets.map((b, i) => ({ label: b.label, completed: completedSeries[i] })),
    },
    habits: { rows: habitRows, consistency: habitScheduled ? Math.round((habitDone / habitScheduled) * 100) : null },
    goals: ((goals.data ?? []) as Goal[]).map((g) => ({ title: g.title, progress: Math.round(goalProgress(g) * 100) })),
    projects: projects.filter((p) => p.status === "active" || p.status === "planning").map((p) => ({ title: p.title, progress: p.progress, tasks: p.total })),
    spending: {
      expense: spend.expense, income: spend.income, prevExpense: prevSpend.expense, change: pctChange(spend.expense, prevSpend.expense),
      series: buckets.map((b, i) => ({ label: b.label, expense: spendSeries[i], income: incomeSeries[i] })),
      budgets: budgetUsage((bud.data ?? []) as Budget[], (monthTx.data ?? []) as Txn[]),
    },
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof loadAnalytics>>;
