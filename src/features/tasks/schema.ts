import { z } from "zod";
import { idSchema, optDate, optId, optText, optTime, prioritySchema, tagsSchema } from "@/lib/validation";

export const recurrenceInputSchema = z.object({
  freq: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z.number().int().min(1).max(365),
  weekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  until: optDate.optional(),
});

export const taskInputSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200, "Max 200 characters"),
    description: optText(5000),
    status: z.enum(["todo", "in_progress", "done"]).default("todo"),
    priority: prioritySchema.default("medium"),
    due_date: optDate,
    due_time: optTime,
    category: optText(60),
    tags: tagsSchema,
    estimated_minutes: z.number().int().min(1, "At least 1 minute").max(10080, "Max one week").nullish().transform((v) => v ?? null),
    project_id: optId,
    recurrence: recurrenceInputSchema.nullish().transform((v) => v ?? null),
  })
  .superRefine((v, ctx) => {
    if (v.due_time && !v.due_date) ctx.addIssue({ code: "custom", path: ["due_date"], message: "Pick a date to use a time" });
    if (v.recurrence && !v.due_date) ctx.addIssue({ code: "custom", path: ["due_date"], message: "Recurring tasks need a due date" });
    if (v.recurrence?.until && v.due_date && v.recurrence.until < v.due_date)
      ctx.addIssue({ code: "custom", path: ["recurrence", "until"], message: "End date must be after the due date" });
  });

export type TaskInput = z.input<typeof taskInputSchema>;
export type TaskParsed = z.output<typeof taskInputSchema>;

/** Snapshot accepted by restoreTask (undo of a delete). */
export const taskSnapshotSchema = z.object({
  id: idSchema,
  series_id: idSchema.nullish().transform((v) => v ?? null),
  completed_at: z.string().nullish().transform((v) => v ?? null),
});

export const TASK_VIEWS = ["today", "upcoming", "overdue", "all", "completed"] as const;
export type TaskView = (typeof TASK_VIEWS)[number];

export const TASK_SORTS = ["due", "priority", "created", "title"] as const;
export type TaskSort = (typeof TASK_SORTS)[number];

export interface TaskFilters {
  view: TaskView;
  q?: string;
  priority?: string;
  status?: string;
  project?: string;
  category?: string;
  tag?: string;
  sort: TaskSort;
}
