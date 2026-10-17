"use server";
import { run, type ActionResult } from "@/lib/action";
import { utcToLocal } from "@/lib/dates";
import { likePattern } from "@/lib/like";
import { snippet } from "@/lib/snippet";

export interface SearchHit {
  id: string;
  kind: "task" | "note" | "project" | "goal" | "habit" | "event";
  title: string;
  subtitle: string | null;
  href: string;
}

/** Subtitle shown under a hit: the matching excerpt when the term was found outside the title, else the fallback. */
function sub(term: string, title: string, fallback: string, ...fields: (string | null | undefined)[]): string {
  if (title.toLowerCase().includes(term.toLowerCase())) return fallback;
  for (const f of fields) {
    const s = snippet(f, term);
    if (s) return s;
  }
  return fallback;
}

/** Global search across the signed-in user's tasks, notes, projects, goals, habits and events: titles AND descriptions (RLS-scoped, 5 hits per kind). */
export async function globalSearch(query: string): Promise<ActionResult<SearchHit[]>> {
  return run(async ({ supabase, profile }) => {
    const term = query.trim().slice(0, 100);
    if (term.length < 2) return [];
    const p = likePattern(term);
    const like = (...cols: string[]) => cols.map((c) => `${c}.ilike."${p}"`).join(",");
    const [t, n, pr, g, h, ev] = await Promise.all([
      supabase.from("tasks").select("id, title, description, status, due_date").or(like("title", "description", "category")).order("updated_at", { ascending: false }).limit(5),
      supabase.from("notes").select("id, title, body").is("archived_at", null).or(like("title", "body")).order("updated_at", { ascending: false }).limit(5),
      supabase.from("projects").select("id, title, description, status").or(like("title", "description")).limit(5),
      supabase.from("goals").select("id, title, description, status").or(like("title", "description")).limit(5),
      supabase.from("habits").select("id, title, description").or(like("title", "description")).limit(5),
      supabase.from("events").select("id, title, description, location, start_at").or(like("title", "description", "location")).order("start_at", { ascending: false }).limit(5),
    ]);
    const tz = (ev.data?.length ? (await profile()).timezone : "UTC");
    const hits: SearchHit[] = [];
    for (const x of t.data ?? []) hits.push({ id: x.id, kind: "task", title: x.title, subtitle: sub(term, x.title, x.status === "done" ? "Completed task" : x.due_date ? `Task · due ${x.due_date}` : "Task", x.description), href: `/tasks?view=all&q=${encodeURIComponent(term)}` });
    for (const x of n.data ?? []) hits.push({ id: x.id, kind: "note", title: x.title || "Untitled note", subtitle: snippet(x.body, term) ?? ((x.body as string).replace(/\s+/g, " ").slice(0, 70) || "Note"), href: `/notes/${x.id}` });
    for (const x of pr.data ?? []) hits.push({ id: x.id, kind: "project", title: x.title, subtitle: sub(term, x.title, `Project · ${String(x.status).replace("_", " ")}`, x.description), href: `/projects/${x.id}` });
    for (const x of g.data ?? []) hits.push({ id: x.id, kind: "goal", title: x.title, subtitle: sub(term, x.title, `Goal · ${x.status}`, x.description), href: `/goals/${x.id}` });
    for (const x of h.data ?? []) hits.push({ id: x.id, kind: "habit", title: x.title, subtitle: sub(term, x.title, "Habit", x.description), href: "/habits" });
    for (const x of ev.data ?? []) hits.push({ id: x.id, kind: "event", title: x.title, subtitle: sub(term, x.title, `Event · ${utcToLocal(x.start_at, tz).date}`, x.description, x.location), href: `/calendar?view=agenda&date=${utcToLocal(x.start_at, tz).date}` });
    return hits;
  });
}
