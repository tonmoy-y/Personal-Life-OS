"use client";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Field, selectClass } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/db";
import { createProject, updateProject } from "./actions";
import { PROJECT_COLORS, projectInputSchema, type ProjectInput } from "./schema";

type V = { title: string; description: string; status: Project["status"]; priority: Project["priority"]; start_date: string; deadline: string; color: string };

const init = (p: Project | null): V => ({
  title: p?.title ?? "", description: p?.description ?? "", status: p?.status ?? "active", priority: p?.priority ?? "medium",
  start_date: p?.start_date ?? "", deadline: p?.deadline ?? "", color: p?.color ?? PROJECT_COLORS[0],
});

export function ProjectFormDialog({ open, onOpenChange, project = null, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; project?: Project | null; onSaved?: (id: string) => void }) {
  const { exec, pending } = useAction();
  const { register, handleSubmit, reset, control, setError, setValue, formState: { errors } } = useForm<V>({ defaultValues: init(project) });
  const color = useWatch({ control, name: "color" });
  useEffect(() => { if (open) reset(init(project)); }, [open, project, reset]);

  const onSubmit = handleSubmit(async (v) => {
    const payload: ProjectInput = { ...v };
    const check = projectInputSchema.safeParse(payload);
    if (!check.success) {
      for (const i of check.error.issues) setError(i.path[0] as keyof V, { message: i.message });
      return;
    }
    const res = await exec(async () => {
      if (project) { const r = await updateProject(project.id, payload); return r.ok ? { ok: true as const, data: { id: project.id } } : r; }
      return createProject(payload);
    }, { success: project ? "Project updated" : "Project created" });
    if (res.ok) { onOpenChange(false); onSaved?.(res.data.id); }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>Group tasks toward an outcome. Progress is calculated from the tasks you link.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Field id="pr-title" label="Title" required error={errors.title?.message}><Input id="pr-title" autoFocus {...register("title")} /></Field>
          <Field id="pr-desc" label="Description" error={errors.description?.message}><Textarea id="pr-desc" rows={3} {...register("description")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="pr-status" label="Status">
              <select id="pr-status" className={selectClass} {...register("status")}>
                <option value="planning">Planning</option><option value="active">Active</option><option value="on_hold">On hold</option><option value="completed">Completed</option><option value="archived">Archived</option>
              </select>
            </Field>
            <Field id="pr-priority" label="Priority">
              <select id="pr-priority" className={selectClass} {...register("priority")}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </Field>
            <Field id="pr-start" label="Start date" error={errors.start_date?.message}><Input id="pr-start" type="date" {...register("start_date")} /></Field>
            <Field id="pr-deadline" label="Deadline" error={errors.deadline?.message}><Input id="pr-deadline" type="date" {...register("deadline")} /></Field>
          </div>
          <div role="radiogroup" aria-label="Project color" className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Color ${c}`} onClick={() => setValue("color", c)}
                className={cn("size-7 rounded-full ring-offset-2 ring-offset-background transition-shadow", color === c && "ring-2 ring-foreground")} style={{ backgroundColor: c }} />
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : project ? "Save changes" : "Create project"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
