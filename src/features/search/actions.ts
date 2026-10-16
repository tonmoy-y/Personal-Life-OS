"use server";
import { run, type ActionResult } from "@/lib/action";
import { likePattern } from "@/features/tasks/queries";

export interface SearchHit {
  id: string;
  kind: "task" | "note" | "project" | "goal";
  title: string;
  subtitle: string | null;
  href: string;
}

/** Global search across the signed-in user's tasks, notes, projects and goals (RLS-scoped, 5 hits per kind). */
export async function globalSearch(query: string): Promise<ActionResult<SearchHit[]>> {
  return run(async ({ supabase }) => {
    const term = query.trim().slice(0, 100);
    if (term.length < 2) return [];
    const p = likePattern(term);
    const [t, n, pr, g] = await Promise.all([
      supabase.from("tasks").select("id, title, status, due_date").ilike("title", p).order("updated_at", { ascending: false }).limit(5),
      supabase.from("notes").select("id, title, body").is("archived_at", null).or(`title.ilike."${p}",body.ilike."${p}"`).order("updated_at", { ascending: false }).limit(5),
      supabase.from("projects").select("id, title, status").ilike("title", p).limit(5),
      supabase.from("goals").select("id, title, status").ilike("title", p).limit(5),
    ]);
    const hits: SearchHit[] = [];
    for (const x of t.data ?? []) hits.push({ id: x.id, kind: "task", title: x.title, subtitle: x.status === "done" ? "Completed task" : x.due_date ? `Task · due ${x.due_date}` : "Task", href: `/tasks?view=all&q=${encodeURIComponent(x.title)}` });
    for (const x of n.data ?? []) hits.push({ id: x.id, kind: "note", title: x.title || "Untitled note", subtitle: (x.body as string).replace(/\s+/g, " ").slice(0, 70) || "Note", href: `/notes/${x.id}` });
    for (const x of pr.data ?? []) hits.push({ id: x.id, kind: "project", title: x.title, subtitle: `Project · ${String(x.status).replace("_", " ")}`, href: `/projects/${x.id}` });
    for (const x of g.data ?? []) hits.push({ id: x.id, kind: "goal", title: x.title, subtitle: `Goal · ${x.status}`, href: `/goals/${x.id}` });
    return hits;
  });
}
