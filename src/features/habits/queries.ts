import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, diffDays, startOfWeek, todayIn, type LocalDate } from "@/lib/dates";
import { bestStreak, completionRate, currentStreak, isScheduled } from "@/lib/habits";
import type { Habit, HabitCompletion } from "@/types/db";

export interface HabitStats {
  habit: Habit;
  /** Completed local dates within the last `HISTORY_DAYS` days. */
  history: LocalDate[];
  streak: number;
  best: number;
  rate7: number | null;
  rate30: number | null;
  doneToday: boolean;
  scheduledToday: boolean;
  total: number;
}

export const HISTORY_DAYS = 120;

export async function loadHabits(supabase: SupabaseClient, tz: string, includeArchived = false, historyDays = HISTORY_DAYS) {
  const today = todayIn(tz);
  let hq = supabase.from("habits").select("*").order("created_at");
  if (!includeArchived) hq = hq.is("archived_at", null);
  const [h, c] = await Promise.all([hq, supabase.from("habit_completions").select("habit_id, completed_on").order("completed_on", { ascending: false }).limit(20000)]);
  if (h.error) throw new Error(`Failed to load habits: ${h.error.message}`);
  const sets = new Map<string, Set<LocalDate>>();
  for (const r of (c.data ?? []) as Pick<HabitCompletion, "habit_id" | "completed_on">[]) {
    (sets.get(r.habit_id) ?? sets.set(r.habit_id, new Set()).get(r.habit_id)!).add(r.completed_on);
  }
  const stats: HabitStats[] = ((h.data ?? []) as Habit[]).map((habit) => {
    const done = sets.get(habit.id) ?? new Set<LocalDate>();
    return {
      habit,
      history: [...done].filter((d) => diffDays(today, d) < historyDays),
      streak: currentStreak(habit, done, today),
      best: bestStreak(habit, done, today),
      rate7: completionRate(habit, done, addDays(today, -6), today),
      rate30: completionRate(habit, done, addDays(today, -29), today),
      doneToday: done.has(today),
      scheduledToday: isScheduled(habit, today),
      total: done.size,
    };
  });

  // Overall weekly completion rate for the last 8 weeks (scheduled-day weighted).
  const weekly: { week: string; rate: number | null }[] = [];
  const active = stats.filter((s) => !s.habit.archived_at);
  const thisWeek = startOfWeek(today, 1);
  for (let i = 7; i >= 0; i--) {
    const from = addDays(thisWeek, -7 * i);
    const to = i === 0 ? today : addDays(from, 6);
    let sched = 0, done = 0;
    for (const s of active) {
      const set = sets.get(s.habit.id) ?? new Set<LocalDate>();
      for (let d = from < s.habit.start_date ? s.habit.start_date : from; d <= to; d = addDays(d, 1)) {
        if (!isScheduled(s.habit, d)) continue;
        sched++;
        if (set.has(d)) done++;
      }
    }
    weekly.push({ week: from.slice(5), rate: sched ? Math.round((done / sched) * 100) : null });
  }
  return { stats, weekly, today };
}
