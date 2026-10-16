import { addDays, diffDays, eachDay, weekdayOf, type LocalDate } from "./dates";

export interface HabitSchedule {
  schedule_days: number[]; // 0 = Sunday … 6 = Saturday
  start_date: LocalDate;
}

/** Is the habit expected on `date`? */
export function isScheduled(habit: HabitSchedule, date: LocalDate): boolean {
  return date >= habit.start_date && habit.schedule_days.includes(weekdayOf(date));
}

/**
 * Current streak: consecutive *scheduled* days completed, counting back from `today`.
 * A scheduled-but-not-yet-completed `today` does not break the streak (it is still achievable).
 * Completions on unscheduled days neither extend nor break the streak.
 */
export function currentStreak(habit: HabitSchedule, completed: ReadonlySet<LocalDate>, today: LocalDate): number {
  let streak = 0;
  let day = today;
  const limit = Math.max(diffDays(today, habit.start_date), 0) + 1;
  for (let i = 0; i < limit; i++, day = addDays(day, -1)) {
    if (!isScheduled(habit, day)) continue;
    if (completed.has(day)) streak++;
    else if (day === today) continue;
    else break;
  }
  return streak;
}

/** Longest run of consecutive scheduled days completed, from `start_date` through `today`. */
export function bestStreak(habit: HabitSchedule, completed: ReadonlySet<LocalDate>, today: LocalDate): number {
  if (today < habit.start_date) return 0;
  let best = 0;
  let run = 0;
  for (const day of eachDay(habit.start_date, today)) {
    if (!isScheduled(habit, day)) continue;
    if (completed.has(day)) {
      run++;
      best = Math.max(best, run);
    } else if (day !== today) {
      run = 0;
    }
  }
  return best;
}

/** Completion rate (0–1) over [from, to] counting only scheduled days on/after start_date. Null when nothing was scheduled. */
export function completionRate(
  habit: HabitSchedule,
  completed: ReadonlySet<LocalDate>,
  from: LocalDate,
  to: LocalDate,
): number | null {
  let scheduled = 0;
  let done = 0;
  for (const day of eachDay(from < habit.start_date ? habit.start_date : from, to)) {
    if (!isScheduled(habit, day)) continue;
    scheduled++;
    if (completed.has(day)) done++;
  }
  return scheduled === 0 ? null : done / scheduled;
}

export function scheduledCount(habit: HabitSchedule, from: LocalDate, to: LocalDate): number {
  return eachDay(from < habit.start_date ? habit.start_date : from, to).filter((d) => isScheduled(habit, d)).length;
}
