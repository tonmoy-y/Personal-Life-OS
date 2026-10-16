"use server";
import { revalidatePath } from "next/cache";
import { ActionError, run, unwrap, type ActionResult } from "@/lib/action";
import { todayIn } from "@/lib/dates";
import { goalReached } from "@/lib/goals";
import { idSchema } from "@/lib/validation";
import type { Goal } from "@/types/db";
import { goalInputSchema, goalMilestoneSchema, progressInputSchema, type GoalInput, type ProgressInput } from "./schema";

const touch = (id?: string) => {
  for (const p of ["/goals", "/dashboard", "/analytics", "/calendar"]) revalidatePath(p);
  if (id) revalidatePath(`/goals/${id}`);
};

export async function createGoal(input: GoalInput): Promise<ActionResult<{ id: string }>> {
  return run(async ({ supabase, user, profile }) => {
    const g = goalInputSchema.parse(input);
    const current = g.current_value ?? g.start_value;
    const row = unwrap(await supabase.from("goals").insert({ ...g, current_value: current, user_id: user.id }).select("id").single()) as { id: string };
    if (current !== g.start_value) {
      unwrap(await supabase.from("goal_progress_logs").insert({ user_id: user.id, goal_id: row.id, value: current, logged_on: todayIn((await profile()).timezone) }));
    }
    touch();
    return { id: row.id };
  });
}

export async function updateGoal(id: string, input: GoalInput): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    const gid = idSchema.parse(id);
    const { current_value, ...g } = goalInputSchema.parse(input);
    const rows = unwrap(await supabase.from("goals").update({ ...g, ...(current_value !== undefined ? { current_value } : {}) }).eq("id", gid).select("id")) as unknown[];
    if (!rows.length) throw new ActionError("That goal no longer exists.");
    touch(gid);
  });
}

/** Manual progress update: records a history entry and moves current_value. Completes the goal when the target is reached. */
export async function logGoalProgress(goalId: string, input: ProgressInput): Promise<ActionResult<{ completed: boolean }>> {
  return run(async ({ supabase, user, profile }) => {
    const gid = idSchema.parse(goalId);
    const p = progressInputSchema.parse(input);
    const goal = unwrap(await supabase.from("goals").select("*").eq("id", gid).maybeSingle()) as Goal | null;
    if (!goal) throw new ActionError("That goal no longer exists.");
    const reached = goalReached({ ...goal, current_value: p.value });
    unwrap(await supabase.from("goal_progress_logs").insert({ user_id: user.id, goal_id: gid, value: p.value, note: p.note, logged_on: todayIn((await profile()).timezone) }));
    unwrap(
      await supabase.from("goals").update({
        current_value: p.value,
        ...(reached && goal.status === "active" ? { status: "completed", completed_at: new Date().toISOString() } : {}),
      }).eq("id", gid),
    );
    touch(gid);
    return { completed: reached && goal.status === "active" };
  });
}

export async function setGoalStatus(id: string, status: "active" | "completed" | "abandoned"): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    const gid = idSchema.parse(id);
    unwrap(await supabase.from("goals").update({ status, completed_at: status === "completed" ? new Date().toISOString() : null }).eq("id", gid));
    touch(gid);
  });
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    unwrap(await supabase.from("goals").delete().eq("id", idSchema.parse(id)));
    touch();
  });
}

export async function addGoalMilestone(goalId: string, input: { title: string; due_date?: string | null }): Promise<ActionResult> {
  return run(async ({ supabase, user }) => {
    const gid = idSchema.parse(goalId);
    unwrap(await supabase.from("goal_milestones").insert({ ...goalMilestoneSchema.parse(input), goal_id: gid, user_id: user.id }));
    touch(gid);
  });
}

export async function setGoalMilestoneDone(id: string, goalId: string, done: boolean): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    unwrap(await supabase.from("goal_milestones").update({ completed_at: done ? new Date().toISOString() : null }).eq("id", idSchema.parse(id)));
    touch(idSchema.parse(goalId));
  });
}

export async function deleteGoalMilestone(id: string, goalId: string): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    unwrap(await supabase.from("goal_milestones").delete().eq("id", idSchema.parse(id)));
    touch(idSchema.parse(goalId));
  });
}
