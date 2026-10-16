"use server";
import { revalidatePath } from "next/cache";
import { run, unwrap, ActionError, type ActionResult } from "@/lib/action";
import { idSchema } from "@/lib/validation";
import { milestoneInputSchema, projectInputSchema, type MilestoneInput, type ProjectInput } from "./schema";

const touch = (id?: string) => {
  for (const p of ["/projects", "/dashboard", "/tasks", "/analytics", "/calendar"]) revalidatePath(p);
  if (id) revalidatePath(`/projects/${id}`);
};

export async function createProject(input: ProjectInput): Promise<ActionResult<{ id: string }>> {
  return run(async ({ supabase, user }) => {
    const p = projectInputSchema.parse(input);
    const row = unwrap(await supabase.from("projects").insert({ ...p, user_id: user.id }).select("id").single()) as { id: string };
    touch();
    return { id: row.id };
  });
}

export async function updateProject(id: string, input: ProjectInput): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    const pid = idSchema.parse(id);
    const p = projectInputSchema.parse(input);
    const rows = unwrap(await supabase.from("projects").update(p).eq("id", pid).select("id")) as unknown[];
    if (!rows.length) throw new ActionError("That project no longer exists.");
    touch(pid);
  });
}

/** Deleting a project keeps its tasks (their project link is cleared). */
export async function deleteProject(id: string): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    unwrap(await supabase.from("projects").delete().eq("id", idSchema.parse(id)));
    touch();
  });
}

export async function addProjectMilestone(projectId: string, input: MilestoneInput): Promise<ActionResult> {
  return run(async ({ supabase, user }) => {
    const pid = idSchema.parse(projectId);
    const m = milestoneInputSchema.parse(input);
    unwrap(await supabase.from("project_milestones").insert({ ...m, project_id: pid, user_id: user.id }));
    touch(pid);
  });
}

export async function setProjectMilestoneDone(id: string, projectId: string, done: boolean): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    unwrap(
      await supabase.from("project_milestones").update({ completed_at: done ? new Date().toISOString() : null }).eq("id", idSchema.parse(id)),
    );
    touch(idSchema.parse(projectId));
  });
}

export async function deleteProjectMilestone(id: string, projectId: string): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    unwrap(await supabase.from("project_milestones").delete().eq("id", idSchema.parse(id)));
    touch(idSchema.parse(projectId));
  });
}
