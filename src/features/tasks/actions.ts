"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionError, run, unwrap, type ActionResult } from "@/lib/action";
import { todayIn } from "@/lib/dates";
import { nextOccurrenceAfterCompletion, type RecurrenceRule } from "@/lib/recurrence";
import { idSchema } from "@/lib/validation";
import type { Task } from "@/types/db";
import { taskInputSchema, taskSnapshotSchema, type TaskInput, type TaskParsed } from "./schema";

function ruleFrom(p: TaskParsed): RecurrenceRule | null {
  if (!p.recurrence || !p.due_date) return null;
  const r = p.recurrence;
  return {
    freq: r.freq,
    interval: r.interval,
    ...(r.freq === "weekly" && r.weekdays?.length ? { weekdays: [...new Set(r.weekdays)].sort() } : {}),
    ...(r.freq === "monthly" || r.freq === "yearly" ? { anchorDay: Number(p.due_date.slice(8, 10)) } : {}),
    ...(r.until ? { until: r.until } : {}),
  };
}

function toRow(p: TaskParsed) {
  return {
    title: p.title,
    description: p.description,
    status: p.status,
    priority: p.priority,
    due_date: p.due_date,
    due_time: p.due_time,
    category: p.category,
    tags: p.tags,
    estimated_minutes: p.estimated_minutes,
    project_id: p.project_id,
    recurrence: ruleFrom(p),
    completed_at: p.status === "done" ? new Date().toISOString() : null,
  };
}

const touch = () => {
  for (const p of ["/dashboard", "/today", "/tasks", "/calendar", "/projects", "/analytics"]) revalidatePath(p);
};

export async function createTask(input: TaskInput): Promise<ActionResult<{ id: string }>> {
  return run(async ({ supabase, user }) => {
    const parsed = taskInputSchema.parse(input);
    const row = toRow(parsed);
    const data = unwrap(
      await supabase
        .from("tasks")
        .insert({ ...row, user_id: user.id, series_id: row.recurrence ? crypto.randomUUID() : null })
        .select("id")
        .single(),
    );
    touch();
    return { id: (data as { id: string }).id };
  });
}

export async function updateTask(id: string, input: TaskInput): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    const taskId = idSchema.parse(id);
    const parsed = taskInputSchema.parse(input);
    const existing = unwrap(await supabase.from("tasks").select("status, series_id, completed_at").eq("id", taskId).maybeSingle()) as
      | Pick<Task, "status" | "series_id" | "completed_at">
      | null;
    if (!existing) throw new ActionError("That task no longer exists.");
    const row = toRow(parsed);
    // Preserve the original completion time unless the status actually changes.
    const completed_at =
      parsed.status === "done" ? (existing.status === "done" ? existing.completed_at : new Date().toISOString()) : null;
    unwrap(
      await supabase
        .from("tasks")
        .update({ ...row, completed_at, series_id: row.recurrence ? (existing.series_id ?? crypto.randomUUID()) : existing.series_id })
        .eq("id", taskId),
    );
    touch();
  });
}

/**
 * Change status. Completing a recurring task creates exactly one next occurrence:
 * the conditional update means only the request that actually flipped the row generates it,
 * and the unique (user_id, series_id, due_date) index makes any race harmless.
 */
export async function setTaskStatus(id: string, status: "todo" | "in_progress" | "done"): Promise<ActionResult<{ nextId: string | null }>> {
  return run(async ({ supabase, user, profile }) => {
    const taskId = idSchema.parse(id);
    z.enum(["todo", "in_progress", "done"]).parse(status);
    if (status !== "done") {
      unwrap(await supabase.from("tasks").update({ status, completed_at: null }).eq("id", taskId));
      touch();
      return { nextId: null };
    }
    const rows = unwrap(
      await supabase
        .from("tasks")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", taskId)
        .neq("status", "done")
        .select("*"),
    ) as Task[];
    const task = rows[0];
    let nextId: string | null = null;
    if (task?.recurrence && task.due_date && task.series_id) {
      const tz = (await profile()).timezone;
      const next = nextOccurrenceAfterCompletion(task.recurrence, task.due_date, todayIn(tz));
      if (next) {
        const ins = await supabase
          .from("tasks")
          .insert({
            user_id: user.id,
            project_id: task.project_id,
            title: task.title,
            description: task.description,
            status: "todo",
            priority: task.priority,
            due_date: next,
            due_time: task.due_time,
            category: task.category,
            tags: task.tags,
            estimated_minutes: task.estimated_minutes,
            recurrence: task.recurrence,
            series_id: task.series_id,
          })
          .select("id")
          .single();
        if (ins.error && ins.error.code !== "23505") unwrap(ins); // 23505 = already generated
        nextId = (ins.data as unknown as { id: string } | null)?.id ?? null;
      }
    }
    touch();
    return { nextId };
  });
}

export async function deleteTask(id: string): Promise<ActionResult<{ snapshot: Task }>> {
  return run(async ({ supabase }) => {
    const taskId = idSchema.parse(id);
    const rows = unwrap(await supabase.from("tasks").delete().eq("id", taskId).select("*")) as Task[];
    if (!rows[0]) throw new ActionError("That task was already deleted.");
    touch();
    return { snapshot: rows[0] };
  });
}

/** Undo for deleteTask: re-inserts the deleted row (same id) after re-validating every field. */
export async function restoreTask(task: Task): Promise<ActionResult> {
  return run(async ({ supabase, user }) => {
    const meta = taskSnapshotSchema.parse({ id: task.id, series_id: task.series_id, completed_at: task.completed_at });
    const parsed = taskInputSchema.parse({ ...task, recurrence: task.recurrence ?? null });
    unwrap(
      await supabase.from("tasks").insert({
        ...toRow(parsed),
        recurrence: task.recurrence,
        id: meta.id,
        user_id: user.id,
        series_id: meta.series_id,
        completed_at: parsed.status === "done" ? (meta.completed_at ?? new Date().toISOString()) : null,
      }),
    );
    touch();
  });
}
