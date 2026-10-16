import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, localToUtc, nowTimeIn, todayIn } from "@/lib/dates";
import type { CalendarEvent, Task } from "@/types/db";

export interface Reminder {
  id: string;
  kind: "task" | "event";
  title: string;
  /** Human label, e.g. "Overdue · Mar 9" or "Today 3:00 PM" */
  when: string;
  overdue: boolean;
  /** Absolute UTC instant (ISO) for time-bound items, used for browser notifications while the app is open. */
  at: string | null;
  href: string;
}

/** Overdue and due-within-a-day tasks plus events starting in the next 24h. Derived live from the database. */
export async function loadReminders(supabase: SupabaseClient, tz: string): Promise<Reminder[]> {
  const today = todayIn(tz);
  const time = nowTimeIn(tz);
  const tomorrow = addDays(today, 1);
  const nowIso = new Date().toISOString();
  const dayAhead = new Date(Date.now() + 24 * 3600_000).toISOString();
  const [t, e] = await Promise.all([
    supabase.from("tasks").select("id, title, due_date, due_time").neq("status", "done").not("due_date", "is", null).lte("due_date", tomorrow).order("due_date").order("due_time", { nullsFirst: true }).limit(30),
    supabase.from("events").select("id, title, start_at, all_day").gte("start_at", nowIso).lte("start_at", dayAhead).order("start_at").limit(10),
  ]);
  const out: Reminder[] = [];
  for (const x of (t.data ?? []) as Pick<Task, "id" | "title" | "due_date" | "due_time">[]) {
    const overdue = x.due_date! < today || (x.due_date === today && !!x.due_time && x.due_time.slice(0, 5) < time);
    const day = x.due_date === today ? "Today" : x.due_date === tomorrow ? "Tomorrow" : x.due_date!;
    out.push({
      id: `task-${x.id}`, kind: "task", title: x.title, overdue, href: "/tasks?view=" + (overdue ? "overdue" : "today"),
      when: `${overdue ? "Overdue · " : ""}${day}${x.due_time ? ` ${x.due_time.slice(0, 5)}` : ""}`,
      at: x.due_time && x.due_date ? localToUtc(x.due_date, x.due_time.slice(0, 5), tz).toISOString() : null,
    });
  }
  for (const x of (e.data ?? []) as Pick<CalendarEvent, "id" | "title" | "start_at" | "all_day">[]) {
    if (x.all_day) continue;
    out.push({ id: `event-${x.id}`, kind: "event", title: x.title, overdue: false, href: "/calendar?view=agenda", at: x.start_at, when: `Starts ${new Date(x.start_at).toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" })}` });
  }
  return out;
}
