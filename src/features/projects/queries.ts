import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Project, ProjectMilestone, Task } from "@/types/db";

export interface ProjectWithProgress extends Project {
  total: number;
  done: number;
  /** 0–100, derived from actual tasks (no tasks → 0). */
  progress: number;
}

export const projectProgress = (done: number, total: number) => (total === 0 ? 0 : Math.round((done / total) * 100));

export async function listProjects(supabase: SupabaseClient): Promise<ProjectWithProgress[]> {
  const [p, t] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("tasks").select("project_id, status").not("project_id", "is", null).limit(5000),
  ]);
  if (p.error) throw new Error(`Failed to load projects: ${p.error.message}`);
  const counts = new Map<string, { total: number; done: number }>();
  for (const r of (t.data ?? []) as Pick<Task, "project_id" | "status">[]) {
    const c = counts.get(r.project_id!) ?? { total: 0, done: 0 };
    c.total++;
    if (r.status === "done") c.done++;
    counts.set(r.project_id!, c);
  }
  return ((p.data ?? []) as Project[]).map((x) => {
    const c = counts.get(x.id) ?? { total: 0, done: 0 };
    return { ...x, ...c, progress: projectProgress(c.done, c.total) };
  });
}

export async function getProject(supabase: SupabaseClient, id: string) {
  const [p, tasks, ms] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("tasks").select("*").eq("project_id", id).order("status").order("due_date", { ascending: true, nullsFirst: false }).limit(500),
    supabase.from("project_milestones").select("*").eq("project_id", id).order("due_date", { ascending: true, nullsFirst: false }),
  ]);
  if (p.error) throw new Error(`Failed to load project: ${p.error.message}`);
  if (!p.data) return null;
  const list = (tasks.data ?? []) as Task[];
  const done = list.filter((t) => t.status === "done").length;
  return {
    project: p.data as Project,
    tasks: list,
    milestones: (ms.data ?? []) as ProjectMilestone[],
    done,
    total: list.length,
    progress: projectProgress(done, list.length),
  };
}
