import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Goal, GoalMilestone, GoalProgressLog } from "@/types/db";

export interface GoalWithMilestones extends Goal {
  milestones: GoalMilestone[];
}

export async function listGoals(supabase: SupabaseClient): Promise<GoalWithMilestones[]> {
  const [g, m] = await Promise.all([
    supabase.from("goals").select("*").order("created_at", { ascending: false }),
    supabase.from("goal_milestones").select("*").order("due_date", { ascending: true, nullsFirst: false }),
  ]);
  if (g.error) throw new Error(`Failed to load goals: ${g.error.message}`);
  const byGoal = new Map<string, GoalMilestone[]>();
  for (const x of (m.data ?? []) as GoalMilestone[]) byGoal.set(x.goal_id, [...(byGoal.get(x.goal_id) ?? []), x]);
  return ((g.data ?? []) as Goal[]).map((x) => ({ ...x, milestones: byGoal.get(x.id) ?? [] }));
}

export async function getGoal(supabase: SupabaseClient, id: string) {
  const [g, m, l] = await Promise.all([
    supabase.from("goals").select("*").eq("id", id).maybeSingle(),
    supabase.from("goal_milestones").select("*").eq("goal_id", id).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("goal_progress_logs").select("*").eq("goal_id", id).order("created_at", { ascending: true }).limit(500),
  ]);
  if (g.error) throw new Error(`Failed to load goal: ${g.error.message}`);
  if (!g.data) return null;
  return { goal: g.data as Goal, milestones: (m.data ?? []) as GoalMilestone[], logs: (l.data ?? []) as GoalProgressLog[] };
}
