"use client";
import { Flame } from "lucide-react";
import { useAction } from "@/components/common/use-action";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { setHabitCompletion } from "@/features/habits/actions";
import type { HabitStats } from "@/features/habits/queries";

export function HabitCheckList({ stats, today }: { stats: HabitStats[]; today: string }) {
  const { exec, pending } = useAction();
  return (
    <ul className="grid gap-1.5">
      {stats.map((s) => (
        <li key={s.habit.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60">
          <Checkbox id={`hc-${s.habit.id}`} checked={s.doneToday} disabled={pending} onCheckedChange={(v) => void exec(() => setHabitCompletion(s.habit.id, today, !!v))} aria-label={`${s.doneToday ? "Undo" : "Complete"} ${s.habit.title} for today`} />
          <label htmlFor={`hc-${s.habit.id}`} className={cn("flex-1 cursor-pointer text-sm", s.doneToday && "text-muted-foreground line-through")}>{s.habit.title}</label>
          {s.streak > 0 && <span className="inline-flex items-center gap-0.5 text-xs font-medium text-warning tabular"><Flame className="size-3.5" aria-hidden />{s.streak}<span className="sr-only"> day streak</span></span>}
        </li>
      ))}
    </ul>
  );
}
