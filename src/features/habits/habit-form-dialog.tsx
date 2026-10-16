"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Field } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { useAppData } from "@/components/layout/app-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { todayIn } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { PROJECT_COLORS } from "@/features/projects/schema";
import type { Habit } from "@/types/db";
import { createHabit, updateHabit } from "./actions";
import { habitInputSchema } from "./schema";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type V = { title: string; description: string; start_date: string };

export function HabitFormDialog({ open, onOpenChange, habit = null }: { open: boolean; onOpenChange: (o: boolean) => void; habit?: Habit | null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{habit ? "Edit habit" : "New habit"}</DialogTitle>
          <DialogDescription>Streaks only count the days you schedule.</DialogDescription>
        </DialogHeader>
        <HabitForm habit={habit} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

// Mounted only while the dialog is open, so its state starts fresh from `habit` each time.
function HabitForm({ habit, onDone }: { habit: Habit | null; onDone: () => void }) {
  const { profile } = useAppData();
  const { exec, pending } = useAction();
  const [days, setDays] = useState<number[]>(habit?.schedule_days ?? [0, 1, 2, 3, 4, 5, 6]);
  const [color, setColor] = useState(habit?.color ?? PROJECT_COLORS[0]);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<V>({
    defaultValues: { title: habit?.title ?? "", description: habit?.description ?? "", start_date: habit?.start_date ?? todayIn(profile.timezone) },
  });

  const onSubmit = handleSubmit(async (v) => {
    const payload = { ...v, color, schedule_days: days };
    const check = habitInputSchema.safeParse(payload);
    if (!check.success) {
      for (const i of check.error.issues) setError((i.path[0] === "schedule_days" ? "title" : i.path[0]) as keyof V, { message: i.message });
      return;
    }
    const res = await exec(async () => {
      if (habit) { const r = await updateHabit(habit.id, payload); return r.ok ? { ok: true as const, data: { id: habit.id } } : r; }
      return createHabit(payload);
    }, { success: habit ? "Habit updated" : "Habit created" });
    if (res.ok) onDone();
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Field id="hb-title" label="Habit" required error={errors.title?.message}><Input id="hb-title" autoFocus placeholder="e.g. Read 20 pages" {...register("title")} /></Field>
          <Field id="hb-desc" label="Notes" error={errors.description?.message}><Textarea id="hb-desc" rows={2} {...register("description")} /></Field>
          <div className="grid gap-1.5">
            <span className="text-sm font-medium" id="hb-days">Repeat on</span>
            <div role="group" aria-labelledby="hb-days" className="flex flex-wrap gap-1.5">
              {DAYS.map((d, i) => {
                const on = days.includes(i);
                return <Button key={d} type="button" size="sm" variant={on ? "default" : "outline"} aria-pressed={on} onClick={() => setDays((x) => (on ? x.filter((v) => v !== i) : [...x, i]))}>{d}</Button>;
              })}
            </div>
            <div className="flex gap-1.5 text-xs">
              <button type="button" className="underline" onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])}>Every day</button>
              <button type="button" className="underline" onClick={() => setDays([1, 2, 3, 4, 5])}>Weekdays</button>
            </div>
          </div>
          <Field id="hb-start" label="Start date" error={errors.start_date?.message}><Input id="hb-start" type="date" {...register("start_date")} /></Field>
          <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Color ${c}`} onClick={() => setColor(c)} className={cn("size-7 rounded-full ring-offset-2 ring-offset-background", color === c && "ring-2 ring-foreground")} style={{ backgroundColor: c }} />)}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onDone()}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : habit ? "Save changes" : "Create habit"}</Button>
          </DialogFooter>
        </form>
  );
}
