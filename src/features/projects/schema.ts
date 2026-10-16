import { z } from "zod";
import { optColor, optDate, optText, prioritySchema } from "@/lib/validation";

export const PROJECT_STATUSES = ["planning", "active", "on_hold", "completed", "archived"] as const;
export const PROJECT_COLORS = ["#2f7d79", "#d98a1f", "#7c5cc4", "#c2410c", "#2563eb", "#be185d", "#4d7c0f", "#475569"];

export const projectInputSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(160, "Max 160 characters"),
    description: optText(5000),
    status: z.enum(PROJECT_STATUSES).default("active"),
    priority: prioritySchema.default("medium"),
    start_date: optDate,
    deadline: optDate,
    color: optColor,
  })
  .refine((v) => !v.start_date || !v.deadline || v.deadline >= v.start_date, {
    path: ["deadline"],
    message: "Deadline must be on or after the start date",
  });
export type ProjectInput = z.input<typeof projectInputSchema>;

export const milestoneInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  due_date: optDate,
});
export type MilestoneInput = z.input<typeof milestoneInputSchema>;
