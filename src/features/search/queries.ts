import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { utcToLocal } from "@/lib/dates";
import { likePattern, tagClause } from "@/lib/like";
import { formatMoney } from "@/lib/money";
import { snippet } from "@/lib/snippet";
import type { SearchHit } from "./types";

/** Subtitle shown under a hit: the matching excerpt when the term was found outside the title, else the fallback. */
function sub(term: string, title: string, fallback: string, ...fields: (string | null | undefined)[]): string {
  if (title.toLowerCase().includes(term.toLowerCase())) return fallback;
  for (const f of fields) {
    const s = snippet(f, term);
    if (s) return s;
  }
  return fallback;
}

/**
 * Search the signed-in user's tasks, notes, projects, goals, habits, events and transactions (titles, descriptions,
 * tags, locations). RLS scopes every query to the caller. `limit` is per kind.
 */
export async function searchAll(supabase: SupabaseClient, timezone: () => Promise<string>, query: string, limit: number): Promise<SearchHit[]> {
  const term = query.trim().slice(0, 100);
  if (term.length < 2) return [];
  const p = likePattern(term);
  const like = (...cols: string[]) => cols.map((c) => `${c}.ilike."${p}"`).join(",");
  const [t, n, pr, g, h, ev, tx] = await Promise.all([
    supabase.from("tasks").select("id, title, description, status, due_date").or(like("title", "description", "category") + tagClause(term)).order("updated_at", { ascending: false }).limit(limit),
    supabase.from("notes").select("id, title, body").is("archived_at", null).or(like("title", "body") + tagClause(term)).order("updated_at", { ascending: false }).limit(limit),
    supabase.from("projects").select("id, title, description, status").or(like("title", "description")).limit(limit),
    supabase.from("goals").select("id, title, description, status").or(like("title", "description")).limit(limit),
    supabase.from("habits").select("id, title, description").or(like("title", "description")).limit(limit),
    supabase.from("events").select("id, title, description, location, start_at").or(like("title", "description", "location")).order("start_at", { ascending: false }).limit(limit),
    supabase.from("transactions").select("id, type, amount_minor, currency, occurred_on, category, description, payment_method").or(like("description", "category", "payment_method")).order("occurred_on", { ascending: false }).limit(limit),
  ]);
  const tz = ev.data?.length ? await timezone() : "UTC";
  const hits: SearchHit[] = [];
  for (const x of t.data ?? []) hits.push({ id: x.id, kind: "task", title: x.title, subtitle: sub(term, x.title, x.status === "done" ? "Completed task" : x.due_date ? `Task · due ${x.due_date}` : "Task", x.description), href: `/tasks?view=all&q=${encodeURIComponent(term)}` });
  for (const x of n.data ?? []) hits.push({ id: x.id, kind: "note", title: x.title || "Untitled note", subtitle: snippet(x.body, term) ?? ((x.body as string).replace(/\s+/g, " ").slice(0, 70) || "Note"), href: `/notes/${x.id}` });
  for (const x of pr.data ?? []) hits.push({ id: x.id, kind: "project", title: x.title, subtitle: sub(term, x.title, `Project · ${String(x.status).replace("_", " ")}`, x.description), href: `/projects/${x.id}` });
  for (const x of g.data ?? []) hits.push({ id: x.id, kind: "goal", title: x.title, subtitle: sub(term, x.title, `Goal · ${x.status}`, x.description), href: `/goals/${x.id}` });
  for (const x of h.data ?? []) hits.push({ id: x.id, kind: "habit", title: x.title, subtitle: sub(term, x.title, "Habit", x.description), href: "/habits" });
  for (const x of ev.data ?? []) hits.push({ id: x.id, kind: "event", title: x.title, subtitle: sub(term, x.title, `Event · ${utcToLocal(x.start_at, tz).date}`, x.description, x.location), href: `/calendar?view=agenda&date=${utcToLocal(x.start_at, tz).date}` });
  for (const x of tx.data ?? []) {
    const money = `${x.type === "income" ? "+" : "−"}${formatMoney(x.amount_minor, x.currency)}`;
    hits.push({ id: x.id, kind: "transaction", title: x.description || x.category, subtitle: `${money} · ${x.occurred_on} · ${x.category}`, href: `/finance?q=${encodeURIComponent(term)}` });
  }
  return hits;
}
