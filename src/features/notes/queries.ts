import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { likePattern, tagClause } from "@/lib/like";
import type { Note } from "@/types/db";

export async function listNotes(supabase: SupabaseClient, opts: { q?: string; tag?: string; archived?: boolean }): Promise<Note[]> {
  let q = supabase.from("notes").select("*");
  q = opts.archived ? q.not("archived_at", "is", null) : q.is("archived_at", null);
  if (opts.q) {
    const p = likePattern(opts.q);
    q = q.or(`title.ilike."${p}",body.ilike."${p}"${tagClause(opts.q)}`);
  }
  if (opts.tag) q = q.contains("tags", [opts.tag.toLowerCase()]);
  const { data, error } = await q.order("pinned", { ascending: false }).order("updated_at", { ascending: false }).limit(300);
  if (error) throw new Error(`Failed to load notes: ${error.message}`);
  return (data ?? []) as Note[];
}

export async function allNoteTags(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase.from("notes").select("tags").is("archived_at", null).limit(1000);
  return [...new Set(((data ?? []) as Pick<Note, "tags">[]).flatMap((n) => n.tags))].sort();
}

export async function getNote(supabase: SupabaseClient, id: string): Promise<Note | null> {
  const { data, error } = await supabase.from("notes").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load note: ${error.message}`);
  return (data as Note | null) ?? null;
}
