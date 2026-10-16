import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, startOfDayUtc, utcToLocal, type LocalDate } from "@/lib/dates";
import type { CalendarEvent, Goal, GoalMilestone, Project, ProjectMilestone, Task } from "@/types/db";

export type CalKind = "event" | "task" | "project" | "milestone" | "goal";

export interface CalItem {
  id: string;
  kind: CalKind;
  title: string;
  /** Local date this item appears on. */
  date: LocalDate;
  time: string | null;
  endTime: string | null;
  allDay: boolean;
  done?: boolean;
  color: string | null;
  href?: string;
  event?: CalendarEvent;
  task?: Task;
}

/** Everything that belongs on the calendar for local dates [from, to] inclusive. */
export async function loadCalendarItems(supabase: SupabaseClient, tz: string, from: LocalDate, to: LocalDate): Promise<CalItem[]> {
  const fromUtc = startOfDayUtc(from, tz).toISOString();
  const toUtc = startOfDayUtc(addDays(to, 1), tz).toISOString();
  const [ev, tk, pr, pm, gl, gm] = await Promise.all([
    supabase.from("events").select("*").lt("start_at", toUtc).gte("end_at", fromUtc).order("start_at").limit(1000),
    supabase.from("tasks").select("*").gte("due_date", from).lte("due_date", to).limit(1000),
    supabase.from("projects").select("*").gte("deadline", from).lte("deadline", to).neq("status", "archived"),
    supabase.from("project_milestones").select("*").gte("due_date", from).lte("due_date", to),
    supabase.from("goals").select("*").gte("target_date", from).lte("target_date", to).eq("status", "active"),
    supabase.from("goal_milestones").select("*").gte("due_date", from).lte("due_date", to),
  ]);
  const items: CalItem[] = [];

  for (const e of (ev.data ?? []) as CalendarEvent[]) {
    const s = utcToLocal(e.start_at, tz);
    const en = utcToLocal(e.end_at, tz);
    const lastDay = en.date < s.date ? s.date : en.date;
    for (let d = s.date < from ? from : s.date; d <= lastDay && d <= to; d = addDays(d, 1)) {
      items.push({
        id: `${e.id}:${d}`, kind: "event", title: e.title, date: d, allDay: e.all_day,
        time: e.all_day ? null : d === s.date ? s.time : "00:00", endTime: e.all_day ? null : d === en.date ? en.time : null,
        color: null, event: e,
      });
    }
  }
  for (const t of (tk.data ?? []) as Task[]) {
    items.push({ id: t.id, kind: "task", title: t.title, date: t.due_date!, time: t.due_time?.slice(0, 5) ?? null, endTime: null, allDay: !t.due_time, done: t.status === "done", color: null, task: t });
  }
  for (const p of (pr.data ?? []) as Project[]) {
    items.push({ id: `p-${p.id}`, kind: "project", title: `${p.title} — deadline`, date: p.deadline!, time: null, endTime: null, allDay: true, done: p.status === "completed", color: p.color, href: `/projects/${p.id}` });
  }
  for (const m of (pm.data ?? []) as ProjectMilestone[]) {
    items.push({ id: `pm-${m.id}`, kind: "milestone", title: m.title, date: m.due_date!, time: null, endTime: null, allDay: true, done: !!m.completed_at, color: null, href: `/projects/${m.project_id}` });
  }
  for (const g of (gl.data ?? []) as Goal[]) {
    items.push({ id: `g-${g.id}`, kind: "goal", title: `${g.title} — target date`, date: g.target_date!, time: null, endTime: null, allDay: true, color: null, href: `/goals/${g.id}` });
  }
  for (const m of (gm.data ?? []) as GoalMilestone[]) {
    items.push({ id: `gm-${m.id}`, kind: "milestone", title: m.title, date: m.due_date!, time: null, endTime: null, allDay: true, done: !!m.completed_at, color: null, href: `/goals/${m.goal_id}` });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "") || a.title.localeCompare(b.title));
}
