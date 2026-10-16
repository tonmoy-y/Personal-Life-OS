import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { nowTimeIn, todayIn } from "@/lib/dates";
import type { Task } from "@/types/db";
import { TASK_SORTS, TASK_VIEWS, type TaskFilters, type TaskSort, type TaskView } from "./schema";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseTaskFilters(sp: Record<string, string | string[] | undefined>): TaskFilters {
  const view = first(sp.view) as TaskView;
  const sort = first(sp.sort) as TaskSort;
  return {
    view: TASK_VIEWS.includes(view) ? view : "all",
    sort: TASK_SORTS.includes(sort) ? sort : "due",
    q: first(sp.q)?.slice(0, 100) || undefined,
    priority: first(sp.priority) || undefined,
    status: first(sp.status) || undefined,
    project: first(sp.project) || undefined,
    category: first(sp.category)?.slice(0, 60) || undefined,
    tag: first(sp.tag)?.slice(0, 30) || undefined,
  };
}

/** Build a safe `%term%` pattern for PostgREST `ilike` inside `or()`: strips wildcards and filter-syntax characters. */
export function likePattern(q: string): string {
  return `%${q.replace(/[\\%_,()"*:]/g, " ").trim()}%`;
}

export async function listTasks(supabase: SupabaseClient, tz: string, f: TaskFilters, limit = 300): Promise<Task[]> {
  const today = todayIn(tz);
  const time = nowTimeIn(tz);
  let q = supabase.from("tasks").select("*");

  switch (f.view) {
    case "today":
      q = q.neq("status", "done").eq("due_date", today);
      break;
    case "upcoming":
      q = q.neq("status", "done").gt("due_date", today);
      break;
    case "overdue":
      q = q.neq("status", "done").or(`due_date.lt.${today},and(due_date.eq.${today},due_time.lt.${time})`);
      break;
    case "completed":
      q = q.eq("status", "done");
      break;
  }
  if (f.q) {
    const p = likePattern(f.q);
    q = q.or(`title.ilike."${p}",description.ilike."${p}"`);
  }
  if (f.priority) q = q.eq("priority", f.priority);
  if (f.status && f.view !== "completed") q = q.eq("status", f.status);
  if (f.project) q = f.project === "none" ? q.is("project_id", null) : q.eq("project_id", f.project);
  if (f.category) q = q.eq("category", f.category);
  if (f.tag) q = q.contains("tags", [f.tag.toLowerCase()]);

  if (f.view === "completed") q = q.order("completed_at", { ascending: false, nullsFirst: false });
  else if (f.sort === "due") q = q.order("due_date", { ascending: true, nullsFirst: false }).order("due_time", { ascending: true, nullsFirst: false });
  else if (f.sort === "created") q = q.order("created_at", { ascending: false });
  else if (f.sort === "title") q = q.order("title", { ascending: true });
  q = q.order("created_at", { ascending: false }).limit(limit);

  const { data, error } = await q;
  if (error) throw new Error(`Failed to load tasks: ${error.message}`);
  let rows = (data ?? []) as Task[];
  if (f.sort === "priority" && f.view !== "completed") {
    const rank = { urgent: 0, high: 1, medium: 2, low: 3 } as const;
    rows = [...rows].sort((a, b) => rank[a.priority] - rank[b.priority]);
  }
  return rows;
}

export async function taskFilterOptions(supabase: SupabaseClient) {
  const { data } = await supabase.from("tasks").select("category, tags").limit(1000);
  const categories = new Set<string>();
  const tags = new Set<string>();
  for (const r of (data ?? []) as Pick<Task, "category" | "tags">[]) {
    if (r.category) categories.add(r.category);
    for (const t of r.tags) tags.add(t);
  }
  return { categories: [...categories].sort(), tags: [...tags].sort() };
}
