import { z } from "zod";
import { localDate, optColor, optText } from "@/lib/validation";

export const habitInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Max 120 characters"),
  description: optText(1000),
  color: optColor,
  schedule_days: z.array(z.number().int().min(0).max(6)).min(1, "Pick at least one day").max(7).transform((d) => [...new Set(d)].sort((a, b) => a - b)),
  start_date: localDate,
});
export type HabitInput = z.input<typeof habitInputSchema>;
