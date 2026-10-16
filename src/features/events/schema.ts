import { z } from "zod";
import { localDate, localTime, optId, optText } from "@/lib/validation";

/**
 * Events are entered as local date/time in the user's profile timezone and converted to UTC
 * instants on the server, so the stored value is correct regardless of the browser's timezone.
 */
export const eventInputSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200, "Max 200 characters"),
    description: optText(5000),
    location: optText(200),
    all_day: z.boolean().default(false),
    start_date: localDate,
    start_time: z.string().nullish(),
    end_date: localDate,
    end_time: z.string().nullish(),
    task_id: optId,
    project_id: optId,
  })
  .superRefine((v, ctx) => {
    if (!v.all_day) {
      if (!v.start_time || !localTime.safeParse(v.start_time).success) ctx.addIssue({ code: "custom", path: ["start_time"], message: "Enter a start time" });
      if (!v.end_time || !localTime.safeParse(v.end_time).success) ctx.addIssue({ code: "custom", path: ["end_time"], message: "Enter an end time" });
    }
    const s = `${v.start_date}T${v.all_day ? "00:00" : (v.start_time ?? "00:00")}`;
    const e = `${v.end_date}T${v.all_day ? "23:59" : (v.end_time ?? "00:00")}`;
    if (e < s) ctx.addIssue({ code: "custom", path: ["end_date"], message: "End must be after the start" });
  });
export type EventInput = z.input<typeof eventInputSchema>;
