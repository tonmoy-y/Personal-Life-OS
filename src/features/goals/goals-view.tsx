"use client";
import { useState } from "react";
import Link from "next/link";
import { CalendarClock, Plus, Target } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { useAppData } from "@/components/layout/app-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatLocalDate, todayIn } from "@/lib/dates";
import { fmtNum, goalProgress } from "@/lib/goals";
import { cn } from "@/lib/utils";
import { GoalFormDialog } from "./goal-form-dialog";
import { ProgressForm } from "./progress-form";
import type { GoalWithMilestones } from "./queries";

const TABS = [["active", "Active"], ["completed", "Completed"], ["abandoned", "Abandoned"]] as const;

export function GoalsView({ goals }: { goals: GoalWithMilestones[] }) {
  const { profile } = useAppData();
  const today = todayIn(profile.timezone);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("active");
  const [horizon, setHorizon] = useState<"all" | "short" | "long">("all");
  const [creating, setCreating] = useState(false);
  const shown = goals.filter((g) => g.status === tab && (horizon === "all" || g.horizon === horizon));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="Goal status" className="flex gap-1 rounded-xl bg-muted p-1">
            {TABS.map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium", tab === k ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {label} <span className="ml-1 text-xs text-muted-foreground tabular">{goals.filter((g) => g.status === k).length}</span>
              </button>
            ))}
          </div>
          <select aria-label="Filter by horizon" value={horizon} onChange={(e) => setHorizon(e.target.value as typeof horizon)} className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm">
            <option value="all">All horizons</option><option value="short">Short-term</option><option value="long">Long-term</option>
          </select>
        </div>
        <Button onClick={() => setCreating(true)}><Plus /> New goal</Button>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={Target} title={goals.length === 0 ? "No goals yet" : `No ${tab} goals`} description="Set a measurable goal, log progress as you go, and break it into milestones."
          action={<Button onClick={() => setCreating(true)}><Plus /> Set a goal</Button>} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {shown.map((g) => {
            const p = Math.round(goalProgress(g) * 100);
            const late = g.status === "active" && g.target_date && g.target_date < today;
            const msDone = g.milestones.filter((m) => m.completed_at).length;
            return (
              <li key={g.id} className="rounded-3xl border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/goals/${g.id}`} className="min-w-0 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"><h2 className="line-clamp-2 text-2xl leading-snug hover:underline">{g.title}</h2></Link>
                  <div className="flex shrink-0 gap-1">
                    <Badge variant="secondary">{g.horizon === "long" ? "Long-term" : "Short-term"}</Badge>
                    {g.category && <Badge variant="outline">{g.category}</Badge>}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground tabular">{fmtNum(g.current_value)} / {fmtNum(g.target_value)} {g.unit}</span>
                    <span className="font-semibold tabular">{p}%</span>
                  </div>
                  <Progress value={p} aria-label={`${g.title} progress`} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {g.target_date && <span className={cn("inline-flex items-center gap-1", late && "font-medium text-destructive")}><CalendarClock className="size-3.5" aria-hidden />{late ? "Overdue · " : "By "}{formatLocalDate(g.target_date, { month: "short", day: "numeric", year: "numeric" })}</span>}
                  {g.milestones.length > 0 && <span>{msDone}/{g.milestones.length} milestones</span>}
                </div>
                {g.status === "active" && <div className="mt-3 border-t pt-3"><ProgressForm goalId={g.id} current={g.current_value} unit={g.unit} /></div>}
              </li>
            );
          })}
        </ul>
      )}
      <GoalFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
