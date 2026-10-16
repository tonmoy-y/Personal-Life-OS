"use client";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Field, selectClass } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { useAppData } from "@/components/layout/app-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseTags } from "@/lib/validation";
import type { Task } from "@/types/db";
import { createTask, updateTask } from "./actions";
import { taskInputSchema, type TaskInput } from "./schema";

interface FormValues {
  title: string;
  description: string;
  status: Task["status"];
  priority: Task["priority"];
  due_date: string;
  due_time: string;
  category: string;
  tags: string;
  estimated_minutes: string;
  project_id: string;
  freq: "" | "daily" | "weekly" | "monthly" | "yearly";
  interval: string;
  until: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function defaults(task: Task | null, preset?: Partial<Pick<Task, "due_date" | "project_id">>): FormValues {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "todo",
    priority: task?.priority ?? "medium",
    due_date: task?.due_date ?? preset?.due_date ?? "",
    due_time: task?.due_time?.slice(0, 5) ?? "",
    category: task?.category ?? "",
    tags: task?.tags.join(", ") ?? "",
    estimated_minutes: task?.estimated_minutes ? String(task.estimated_minutes) : "",
    project_id: task?.project_id ?? preset?.project_id ?? "",
    freq: task?.recurrence?.freq ?? "",
    interval: String(task?.recurrence?.interval ?? 1),
    until: task?.recurrence?.until ?? "",
  };
}

export function TaskFormDialog({
  open, onOpenChange, task = null, preset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  preset?: Partial<Pick<Task, "due_date" | "project_id">>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>{task ? "Update the details of this task." : "Capture what needs doing."}</DialogDescription>
        </DialogHeader>
        <TaskForm task={task} preset={preset} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

// Mounted only while the dialog is open, so its state starts fresh from `task` each time.
function TaskForm({ task, preset, onDone }: { task: Task | null; preset?: Partial<Pick<Task, "due_date" | "project_id">>; onDone: () => void }) {
  const { projects } = useAppData();
  const { exec, pending } = useAction();
  const { register, handleSubmit, control, setError, formState: { errors } } = useForm<FormValues>({ defaultValues: defaults(task, preset) });
  const [weekdays, setWeekdays] = useState<number[]>(task?.recurrence?.weekdays ?? []);
  const freq = useWatch({ control, name: "freq" });

  const onSubmit = handleSubmit(async (v) => {
    const payload: TaskInput = {
      title: v.title,
      description: v.description,
      status: v.status,
      priority: v.priority,
      due_date: v.due_date,
      due_time: v.due_time,
      category: v.category,
      tags: parseTags(v.tags),
      estimated_minutes: v.estimated_minutes ? Number(v.estimated_minutes) : null,
      project_id: v.project_id,
      recurrence: v.freq
        ? { freq: v.freq, interval: Number(v.interval) || 1, weekdays: v.freq === "weekly" ? weekdays : undefined, until: v.until || undefined }
        : null,
    };
    const check = taskInputSchema.safeParse(payload);
    if (!check.success) {
      for (const issue of check.error.issues) setError((issue.path[0] === "recurrence" ? "until" : issue.path[0]) as keyof FormValues, { message: issue.message });
      return;
    }
    const res = await exec<unknown>(() => (task ? updateTask(task.id, payload) : createTask(payload)), { success: task ? "Task updated" : "Task created", silent: true });
    if (res.ok) onDone();
    else if (res.fieldErrors) for (const [k, m] of Object.entries(res.fieldErrors)) setError(k.split(".")[0] as keyof FormValues, { message: m[0] });
    else toast.error(res.error);
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Field id="task-title" label="Title" required error={errors.title?.message}>
            <Input id="task-title" autoFocus aria-invalid={!!errors.title} {...register("title")} />
          </Field>
          <Field id="task-desc" label="Description" error={errors.description?.message}>
            <Textarea id="task-desc" rows={3} {...register("description")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="task-status" label="Status">
              <select id="task-status" className={selectClass} {...register("status")}>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </Field>
            <Field id="task-priority" label="Priority">
              <select id="task-priority" className={selectClass} {...register("priority")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>
            <Field id="task-date" label="Due date" error={errors.due_date?.message}>
              <Input id="task-date" type="date" {...register("due_date")} />
            </Field>
            <Field id="task-time" label="Due time" error={errors.due_time?.message} hint="Optional · in your profile timezone">
              <Input id="task-time" type="time" {...register("due_time")} />
            </Field>
            <Field id="task-project" label="Project">
              <select id="task-project" className={selectClass} {...register("project_id")}>
                <option value="">No project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </Field>
            <Field id="task-category" label="Category" error={errors.category?.message}>
              <Input id="task-category" placeholder="e.g. Work, Home" {...register("category")} />
            </Field>
            <Field id="task-tags" label="Tags" hint="Comma separated" error={errors.tags?.message}>
              <Input id="task-tags" placeholder="deep-work, email" {...register("tags")} />
            </Field>
            <Field id="task-est" label="Estimate (minutes)" error={errors.estimated_minutes?.message}>
              <Input id="task-est" type="number" min={1} max={10080} inputMode="numeric" {...register("estimated_minutes")} />
            </Field>
          </div>

          <fieldset className="grid gap-3 rounded-lg border p-3">
            <legend className="px-1 text-sm font-medium">Repeat</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field id="task-freq" label="Frequency">
                <select id="task-freq" className={selectClass} {...register("freq")}>
                  <option value="">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </Field>
              {freq && (
                <>
                  <Field id="task-interval" label="Every" hint={`${freq === "daily" ? "day(s)" : freq === "weekly" ? "week(s)" : freq === "monthly" ? "month(s)" : "year(s)"}`}>
                    <Input id="task-interval" type="number" min={1} max={365} {...register("interval")} />
                  </Field>
                  <Field id="task-until" label="Ends on" error={errors.until?.message} hint="Optional">
                    <Input id="task-until" type="date" {...register("until")} />
                  </Field>
                </>
              )}
            </div>
            {freq === "weekly" && (
              <div role="group" aria-label="Repeat on weekdays" className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d, i) => {
                  const on = weekdays.includes(i);
                  return (
                    <Button key={d} type="button" size="sm" variant={on ? "default" : "outline"} aria-pressed={on}
                      onClick={() => setWeekdays((w) => (on ? w.filter((x) => x !== i) : [...w, i]))}>
                      {d}
                    </Button>
                  );
                })}
              </div>
            )}
            {freq && <p className="text-xs text-muted-foreground">The next occurrence is created when you complete this one — never on page load.</p>}
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onDone()}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : task ? "Save changes" : "Create task"}</Button>
          </DialogFooter>
        </form>
  );
}
