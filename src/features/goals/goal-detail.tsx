"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useAction } from "@/components/common/use-action";
import { useAppData } from "@/components/layout/app-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatLocalDate, todayIn } from "@/lib/dates";
import { fmtNum, goalProgress } from "@/lib/goals";
import { cn } from "@/lib/utils";
import type { Goal, GoalMilestone, GoalProgressLog } from "@/types/db";
import { addGoalMilestone, deleteGoal, deleteGoalMilestone, setGoalMilestoneDone, setGoalStatus } from "./actions";
import { GoalFormDialog } from "./goal-form-dialog";
import { ProgressForm } from "./progress-form";

export function GoalDetail({ goal, milestones, logs }: { goal: Goal; milestones: GoalMilestone[]; logs: GoalProgressLog[] }) {
  const router = useRouter();
  const { profile } = useAppData();
  const { exec, pending } = useAction();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const today = todayIn(profile.timezone);
  const p = Math.round(goalProgress(goal) * 100);
  const late = goal.status === "active" && goal.target_date && goal.target_date < today;
  const data = [{ date: formatLocalDate(goal.created_at.slice(0, 10), { month: "short", day: "numeric" }), value: goal.start_value }, ...logs.map((l) => ({ date: formatLocalDate(l.logged_on, { month: "short", day: "numeric" }), value: l.value, note: l.note }))];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="grid content-start gap-6">
        <section className="rounded-3xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={goal.status === "completed" ? "default" : "secondary"} className="capitalize">{goal.status}</Badge>
              <Badge variant="outline">{goal.horizon === "long" ? "Long-term" : "Short-term"}</Badge>
              {goal.category && <Badge variant="outline">{goal.category}</Badge>}
              {goal.target_date && <span className={cn("inline-flex items-center gap-1.5 text-sm", late ? "font-medium text-destructive" : "text-muted-foreground")}><CalendarClock className="size-4" aria-hidden />{late ? "Overdue · " : "By "}{formatLocalDate(goal.target_date, { month: "short", day: "numeric", year: "numeric" })}</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil /> Edit</Button>
              <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}><Trash2 /> Delete</Button>
            </div>
          </div>
          {goal.description && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{goal.description}</p>}
          <div className="mt-5">
            <div className="mb-1.5 flex items-baseline justify-between"><span className="text-sm text-muted-foreground tabular">{fmtNum(goal.current_value)} of {fmtNum(goal.target_value)} {goal.unit} (from {fmtNum(goal.start_value)})</span><span className="text-xl font-semibold tabular">{p}%</span></div>
            <Progress value={p} aria-label="Goal progress" />
          </div>
          {goal.status === "active" && <div className="mt-4"><ProgressForm goalId={goal.id} current={goal.current_value} unit={goal.unit} /></div>}
          <div className="mt-4 flex gap-2">
            {goal.status === "active" ? (<>
              <Button size="sm" variant="outline" onClick={() => void exec(() => setGoalStatus(goal.id, "completed"), { success: "Marked complete" })}><Check /> Mark complete</Button>
              <Button size="sm" variant="ghost" onClick={() => void exec(() => setGoalStatus(goal.id, "abandoned"), { success: "Goal set aside" })}>Abandon</Button>
            </>) : <Button size="sm" variant="outline" onClick={() => void exec(() => setGoalStatus(goal.id, "active"), { success: "Goal reopened" })}>Reopen</Button>}
          </div>
        </section>

        <section aria-labelledby="gl-hist" className="rounded-3xl border bg-card p-4">
          <h2 id="gl-hist" className="text-2xl">Progress history</h2>
          {logs.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No updates yet. Log your first one above.</p> : (
            <>
              <div className="mt-3 h-52" role="img" aria-label={`Progress over time in ${goal.unit}: ${data.map((d) => `${d.date} ${d.value}`).join(", ")}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                    <Tooltip formatter={(v) => [`${v} ${goal.unit}`, "Value"]} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="value" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <ol className="mt-3 grid max-h-48 gap-1 overflow-y-auto text-sm">
                {[...logs].reverse().map((l) => <li key={l.id} className="flex justify-between gap-3 border-b py-1 last:border-0"><span className="text-muted-foreground">{formatLocalDate(l.logged_on, { month: "short", day: "numeric", year: "numeric" })}{l.note ? ` — ${l.note}` : ""}</span><span className="tabular font-medium">{fmtNum(l.value)} {goal.unit}</span></li>)}
              </ol>
            </>
          )}
        </section>
      </div>

      <aside aria-labelledby="gl-ms" className="grid content-start gap-3">
        <h2 id="gl-ms" className="text-2xl">Milestones</h2>
        <form onSubmit={async (e) => { e.preventDefault(); if (!title.trim()) return; const r = await exec(() => addGoalMilestone(goal.id, { title, due_date: due || null }), { success: "Milestone added" }); if (r.ok) { setTitle(""); setDue(""); } }} className="grid gap-2 rounded-xl border bg-card p-3">
          <Input aria-label="Milestone title" placeholder="Milestone…" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex gap-2"><Input aria-label="Milestone due date" type="date" value={due} onChange={(e) => setDue(e.target.value)} /><Button type="submit" disabled={pending || !title.trim()}><Plus /> Add</Button></div>
        </form>
        {milestones.length === 0 ? <p className="text-sm text-muted-foreground">No milestones yet.</p> : (
          <ul className="grid gap-2">
            {milestones.map((m) => {
              const isDone = !!m.completed_at;
              const ml = !isDone && m.due_date && m.due_date < today;
              return (
                <li key={m.id} className="flex items-start gap-2.5 rounded-xl border bg-card px-3 py-2">
                  <Checkbox className="mt-0.5" checked={isDone} aria-label={`${isDone ? "Reopen" : "Complete"} milestone ${m.title}`} onCheckedChange={(v) => void exec(() => setGoalMilestoneDone(m.id, goal.id, !!v))} />
                  <div className="min-w-0 flex-1"><p className={cn("text-sm", isDone && "text-muted-foreground line-through")}>{m.title}</p>{m.due_date && <p className={cn("text-xs", ml ? "font-medium text-destructive" : "text-muted-foreground")}>{ml ? "Overdue · " : ""}{formatLocalDate(m.due_date, { month: "short", day: "numeric", year: "numeric" })}</p>}</div>
                  <Button variant="ghost" size="icon-xs" aria-label={`Delete milestone ${m.title}`} onClick={() => void exec(() => deleteGoalMilestone(m.id, goal.id))}><Trash2 /></Button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
      <GoalFormDialog open={editing} onOpenChange={setEditing} goal={goal} />
      <ConfirmDialog open={confirming} onOpenChange={setConfirming} title="Delete this goal?" description="The goal, its milestones and progress history are permanently deleted."
        onConfirm={async () => { const r = await exec(() => deleteGoal(goal.id), { success: "Goal deleted", refresh: false }); if (r.ok) router.push("/goals"); }} />
    </div>
  );
}
