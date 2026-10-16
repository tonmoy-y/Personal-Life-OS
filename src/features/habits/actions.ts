"use server";
import { revalidatePath } from "next/cache";
import { ActionError, run, unwrap, type ActionResult } from "@/lib/action";
import { diffDays, isLocalDate, todayIn } from "@/lib/dates";
import { idSchema } from "@/lib/validation";
import { habitInputSchema, type HabitInput } from "./schema";

const touch = () => { for (const p of ["/habits", "/dashboard", "/today", "/analytics"]) revalidatePath(p); };

export async function createHabit(input: HabitInput): Promise<ActionResult<{ id: string }>> {
  return run(async ({ supabase, user }) => {
    const h = habitInputSchema.parse(input);
    const row = unwrap(await supabase.from("habits").insert({ ...h, user_id: user.id }).select("id").single()) as { id: string };
    touch();
    return { id: row.id };
  });
}

export async function updateHabit(id: string, input: HabitInput): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    const rows = unwrap(await supabase.from("habits").update(habitInputSchema.parse(input)).eq("id", idSchema.parse(id)).select("id")) as unknown[];
    if (!rows.length) throw new ActionError("That habit no longer exists.");
    touch();
  });
}

export async function setHabitArchived(id: string, archived: boolean): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    unwrap(await supabase.from("habits").update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", idSchema.parse(id)));
    touch();
  });
}

export async function deleteHabit(id: string): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    unwrap(await supabase.from("habits").delete().eq("id", idSchema.parse(id)));
    touch();
  });
}

/**
 * Mark a habit done/undone for a local date. Idempotent: the unique (user_id, habit_id, completed_on)
 * constraint plus ignoreDuplicates means repeated or concurrent requests can never create duplicates.
 */
export async function setHabitCompletion(habitId: string, date: string, done: boolean): Promise<ActionResult> {
  return run(async ({ supabase, user, profile }) => {
    const hid = idSchema.parse(habitId);
    if (!isLocalDate(date)) throw new ActionError("Invalid date.");
    const today = todayIn((await profile()).timezone);
    if (date > today) throw new ActionError("You can't check off a future day.");
    if (diffDays(today, date) > 366) throw new ActionError("That date is too far in the past.");
    if (done) {
      unwrap(await supabase.from("habit_completions").upsert({ user_id: user.id, habit_id: hid, completed_on: date }, { onConflict: "user_id,habit_id,completed_on", ignoreDuplicates: true }));
    } else {
      unwrap(await supabase.from("habit_completions").delete().eq("habit_id", hid).eq("completed_on", date));
    }
    touch();
  });
}
