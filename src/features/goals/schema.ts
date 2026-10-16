import { z } from "zod";
import { optDate, optText } from "@/lib/validation";

const num = (label: string) => z.number({ error: `${label} must be a number` }).finite().min(-1e12).max(1e12);

export const goalInputSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(160, "Max 160 characters"),
    description: optText(5000),
    category: optText(60),
    horizon: z.enum(["short", "long"]).default("short"),
    target_date: optDate,
    unit: z.string().trim().min(1, "Unit is required").max(20).default("%"),
    start_value: num("Start").default(0),
    target_value: num("Target").default(100),
    current_value: num("Current").optional(),
  })
  .refine((v) => v.target_value !== v.start_value, { path: ["target_value"], message: "Target must differ from the start value" });
export type GoalInput = z.input<typeof goalInputSchema>;

export const progressInputSchema = z.object({
  value: num("Value"),
  note: optText(500),
});
export type ProgressInput = z.input<typeof progressInputSchema>;

export const goalMilestoneSchema = z.object({ title: z.string().trim().min(1, "Title is required").max(160), due_date: optDate });
