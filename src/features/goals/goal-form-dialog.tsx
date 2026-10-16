"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Field, selectClass } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Goal } from "@/types/db";
import { createGoal, updateGoal } from "./actions";
import { goalInputSchema, type GoalInput } from "./schema";

type V = { title: string; description: string; category: string; horizon: "short" | "long"; target_date: string; unit: string; start_value: string; current_value: string; target_value: string };
const init = (g: Goal | null): V => ({
  title: g?.title ?? "", description: g?.description ?? "", category: g?.category ?? "", horizon: g?.horizon ?? "short", target_date: g?.target_date ?? "",
  unit: g?.unit ?? "%", start_value: String(g?.start_value ?? 0), current_value: String(g?.current_value ?? 0), target_value: String(g?.target_value ?? 100),
});

export function GoalFormDialog({ open, onOpenChange, goal = null }: { open: boolean; onOpenChange: (o: boolean) => void; goal?: Goal | null }) {
  const { exec, pending } = useAction();
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<V>({ defaultValues: init(goal) });
  useEffect(() => { if (open) reset(init(goal)); }, [open, goal, reset]);

  const onSubmit = handleSubmit(async (v) => {
    const num = (s: string) => (s.trim() === "" ? NaN : Number(s));
    const payload: GoalInput = { ...v, start_value: num(v.start_value), target_value: num(v.target_value), current_value: num(v.current_value) };
    const check = goalInputSchema.safeParse(payload);
    if (!check.success) {
      for (const i of check.error.issues) setError(i.path[0] as keyof V, { message: i.message });
      return;
    }
    const res = await exec(async () => {
      if (goal) { const r = await updateGoal(goal.id, payload); return r.ok ? { ok: true as const, data: { id: goal.id } } : r; }
      return createGoal(payload);
    }, { success: goal ? "Goal updated" : "Goal created" });
    if (res.ok) onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit goal" : "New goal"}</DialogTitle>
          <DialogDescription>Make it measurable: where you start, where you want to be, and in what unit.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Field id="gl-title" label="Goal" required error={errors.title?.message}><Input id="gl-title" autoFocus placeholder="e.g. Read 24 books this year" {...register("title")} /></Field>
          <Field id="gl-desc" label="Why it matters" error={errors.description?.message}><Textarea id="gl-desc" rows={2} {...register("description")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="gl-horizon" label="Horizon"><select id="gl-horizon" className={selectClass} {...register("horizon")}><option value="short">Short-term</option><option value="long">Long-term</option></select></Field>
            <Field id="gl-cat" label="Category" error={errors.category?.message}><Input id="gl-cat" placeholder="Health, Career…" {...register("category")} /></Field>
            <Field id="gl-date" label="Target date" error={errors.target_date?.message}><Input id="gl-date" type="date" {...register("target_date")} /></Field>
            <Field id="gl-unit" label="Unit" error={errors.unit?.message}><Input id="gl-unit" placeholder="%, books, kg…" {...register("unit")} /></Field>
            <Field id="gl-start" label="Start value" error={errors.start_value?.message}><Input id="gl-start" inputMode="decimal" {...register("start_value")} /></Field>
            <Field id="gl-target" label="Target value" error={errors.target_value?.message}><Input id="gl-target" inputMode="decimal" {...register("target_value")} /></Field>
            <Field id="gl-current" label="Current value" error={errors.current_value?.message} className="sm:col-span-2"><Input id="gl-current" inputMode="decimal" {...register("current_value")} /></Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : goal ? "Save changes" : "Create goal"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
