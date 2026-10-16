"use server";
import { revalidatePath } from "next/cache";
import { ActionError, run, unwrap, type ActionResult } from "@/lib/action";
import { localToUtc } from "@/lib/dates";
import { idSchema } from "@/lib/validation";
import { eventInputSchema, type EventInput } from "./schema";

const touch = () => { for (const p of ["/calendar", "/dashboard", "/today"]) revalidatePath(p); };

function toRow(p: ReturnType<typeof eventInputSchema.parse>, tz: string) {
  const start = localToUtc(p.start_date, p.all_day ? "00:00" : p.start_time!, tz);
  const end = localToUtc(p.end_date, p.all_day ? "23:59" : p.end_time!, tz);
  if (end < start) throw new ActionError("The event must end after it starts.");
  return {
    title: p.title, description: p.description, location: p.location, all_day: p.all_day,
    start_at: start.toISOString(), end_at: end.toISOString(), task_id: p.task_id, project_id: p.project_id,
  };
}

export async function createEvent(input: EventInput): Promise<ActionResult<{ id: string }>> {
  return run(async ({ supabase, user, profile }) => {
    const p = eventInputSchema.parse(input);
    const row = toRow(p, (await profile()).timezone);
    const data = unwrap(await supabase.from("events").insert({ ...row, user_id: user.id }).select("id").single()) as { id: string };
    touch();
    return { id: data.id };
  });
}

export async function updateEvent(id: string, input: EventInput): Promise<ActionResult> {
  return run(async ({ supabase, profile }) => {
    const eid = idSchema.parse(id);
    const p = eventInputSchema.parse(input);
    const rows = unwrap(await supabase.from("events").update(toRow(p, (await profile()).timezone)).eq("id", eid).select("id")) as unknown[];
    if (!rows.length) throw new ActionError("That event no longer exists.");
    touch();
  });
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    unwrap(await supabase.from("events").delete().eq("id", idSchema.parse(id)));
    touch();
  });
}
