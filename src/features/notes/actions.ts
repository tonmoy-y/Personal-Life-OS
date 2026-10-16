"use server";
import { revalidatePath } from "next/cache";
import { ActionError, run, unwrap, type ActionResult } from "@/lib/action";
import { idSchema } from "@/lib/validation";
import { noteSaveSchema, type NoteSaveInput, type NoteSaveResult } from "./schema";

const touchList = () => revalidatePath("/notes");

export async function createNote(init: { project_id?: string | null; goal_id?: string | null } = {}): Promise<ActionResult<{ id: string }>> {
  return run(async ({ supabase, user }) => {
    const row = unwrap(
      await supabase.from("notes").insert({ user_id: user.id, title: "", body: "", project_id: init.project_id ? idSchema.parse(init.project_id) : null, goal_id: init.goal_id ? idSchema.parse(init.goal_id) : null }).select("id").single(),
    ) as { id: string };
    touchList();
    return { id: row.id };
  });
}

/**
 * Optimistic-concurrency save: the update only applies if `version` still equals what the editor last saw.
 * A stale editor (another tab/device saved first) gets a conflict instead of silently overwriting newer text.
 */
export async function saveNote(id: string, input: NoteSaveInput): Promise<ActionResult<NoteSaveResult>> {
  return run(async ({ supabase }) => {
    const nid = idSchema.parse(id);
    const { expected_version, ...fields } = noteSaveSchema.parse(input);
    const rows = unwrap(
      await supabase.from("notes").update({ ...fields, version: expected_version + 1 }).eq("id", nid).eq("version", expected_version).select("version, updated_at"),
    ) as { version: number; updated_at: string }[];
    if (rows[0]) return { status: "saved", version: rows[0].version, updated_at: rows[0].updated_at } as NoteSaveResult;
    const cur = unwrap(await supabase.from("notes").select("version, updated_at").eq("id", nid).maybeSingle()) as { version: number; updated_at: string } | null;
    return cur ? ({ status: "conflict", latest: cur } as NoteSaveResult) : ({ status: "missing" } as NoteSaveResult);
  });
}

/** Deliberate overwrite after a conflict: saves against the latest version the server reports. */
export async function forceSaveNote(id: string, input: Omit<NoteSaveInput, "expected_version">): Promise<ActionResult<NoteSaveResult>> {
  return run(async ({ supabase }) => {
    const nid = idSchema.parse(id);
    const cur = unwrap(await supabase.from("notes").select("version").eq("id", nid).maybeSingle()) as { version: number } | null;
    if (!cur) return { status: "missing" } as NoteSaveResult;
    const { expected_version, ...fields } = noteSaveSchema.parse({ ...input, expected_version: cur.version });
    const rows = unwrap(await supabase.from("notes").update({ ...fields, version: expected_version + 1 }).eq("id", nid).eq("version", expected_version).select("version, updated_at")) as { version: number; updated_at: string }[];
    if (!rows[0]) throw new ActionError("The note changed again while saving. Try once more.");
    return { status: "saved", version: rows[0].version, updated_at: rows[0].updated_at } as NoteSaveResult;
  });
}

export async function setNotePinned(id: string, pinned: boolean): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    unwrap(await supabase.from("notes").update({ pinned }).eq("id", idSchema.parse(id)));
    touchList();
  });
}

export async function setNoteArchived(id: string, archived: boolean): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    unwrap(await supabase.from("notes").update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", idSchema.parse(id)));
    touchList();
  });
}

export async function deleteNote(id: string): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    unwrap(await supabase.from("notes").delete().eq("id", idSchema.parse(id)));
    touchList();
  });
}
