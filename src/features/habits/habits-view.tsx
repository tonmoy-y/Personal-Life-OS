"use client";
import { useState } from "react";
import { Archive, ArchiveRestore, Flame, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { useAction } from "@/components/common/use-action";
import { useAppData } from "@/components/layout/app-data";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { addDays, formatLocalDate, startOfWeek, type LocalDate } from "@/lib/dates";
import { isScheduled } from "@/lib/habits";
import { cn } from "@/lib/utils";
import { deleteHabit, setHabitArchived, setHabitCompletion } from "./actions";
import { HabitFormDialog } from "./habit-form-dialog";
import type { HabitStats } from "./queries";

const pct = (r: number | null) => (r === null ? "–" : `${Math.round(r * 100)}%`);

export function HabitsView({ stats, weekly, today }: { stats: HabitStats[]; weekly: { week: string; rate: number | null }[]; today: LocalDate }) {
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const active = stats.filter((s) => !s.habit.archived_at);
  const archived = stats.filter((s) => s.habit.archived_at);
  const dueToday = active.filter((s) => s.scheduledToday);
  const doneToday = dueToday.filter((s) => s.doneToday).length;

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-center gap-4 rounded-3xl border bg-card p-4">
        <div className="min-w-48 flex-1">
          <p className="text-sm text-muted-foreground">Today</p>
          <p className="text-2xl font-semibold tabular">{doneToday}<span className="text-muted-foreground"> / {dueToday.length}</span> <span className="text-base font-normal text-muted-foreground">habits done</span></p>
          <Progress className="mt-2" value={dueToday.length ? (doneToday / dueToday.length) * 100 : 0} aria-label="Habits completed today" />
        </div>
        <Button onClick={() => setCreating(true)}><Plus /> New habit</Button>
      </section>

      {active.length === 0 ? (
        <EmptyState icon={Flame} title="No habits yet" description="Start with one small habit you can do every day. Streaks count only the days you schedule."
          action={<Button onClick={() => setCreating(true)}><Plus /> Create a habit</Button>} />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">{active.map((s) => <HabitCard key={s.habit.id} s={s} today={today} />)}</ul>
      )}

      {active.length > 0 && (
        <section aria-labelledby="hb-weekly" className="rounded-3xl border bg-card p-4">
          <h2 id="hb-weekly" className="text-2xl">Weekly consistency</h2>
          <p className="mb-3 text-xs text-muted-foreground">Share of scheduled habit-days completed, per week (weeks start Monday; the current week is to date).</p>
          <div className="h-52" role="img" aria-label={`Weekly completion rate, last 8 weeks: ${weekly.map((w) => `week of ${w.week} ${w.rate ?? "no data"}%`).join("; ")}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 100]} unit="%" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <Tooltip formatter={(v) => [`${v}%`, "Completed"]} labelFormatter={(l) => `Week of ${l}`} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="rate" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {archived.length > 0 && (
        <section>
          <Button variant="ghost" size="sm" onClick={() => setShowArchived((v) => !v)} aria-expanded={showArchived}>{showArchived ? "Hide" : "Show"} archived ({archived.length})</Button>
          {showArchived && <ul className="mt-2 grid gap-3 lg:grid-cols-2">{archived.map((s) => <HabitCard key={s.habit.id} s={s} today={today} />)}</ul>}
        </section>
      )}
      <HabitFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function HabitCard({ s, today }: { s: HabitStats; today: LocalDate }) {
  const { profile } = useAppData();
  const { exec, pending } = useAction();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { habit } = s;
  const done = new Set(s.history);
  const archived = !!habit.archived_at;
  const color = habit.color ?? "var(--primary)";
  const strip = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const sched = habit.schedule_days.length === 7 ? "Every day" : habit.schedule_days.join(",") === "1,2,3,4,5" ? "Weekdays" : habit.schedule_days.map((d) => formatLocalDate(addDays("2026-03-08", d), { weekday: "short" })).join(", ");

  // Heatmap: last 16 weeks, columns = weeks, rows = weekdays in the user's week order.
  const weeks = 16;
  const first = addDays(startOfWeek(today, profile.week_start), -7 * (weeks - 1));
  const cols = Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(first, w * 7 + d)));

  const toggle = (d: LocalDate) => void exec(() => setHabitCompletion(habit.id, d, !done.has(d)));

  return (
    <li className={cn("rounded-3xl border bg-card p-4", archived && "opacity-70")} style={{ borderLeft: `4px solid ${color}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-sans text-base font-semibold">{habit.title}</h3>
          <p className="text-xs text-muted-foreground">{sched}{archived && " · archived"}</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-sm font-semibold text-warning tabular" title="Current streak (scheduled days)">
            <Flame className="size-4" aria-hidden />{s.streak}<span className="sr-only"> day streak</span>
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${habit.title}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditing(true)}><Pencil /> Edit</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void exec(() => setHabitArchived(habit.id, !archived), { success: archived ? "Habit restored" : "Habit archived" })}>
                {archived ? <><ArchiveRestore /> Restore</> : <><Archive /> Archive</>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}><Trash2 /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {!archived && (
        <div className="mt-3 flex gap-1.5" role="group" aria-label={`Last 7 days for ${habit.title}`}>
          {strip.map((d) => {
            const on = done.has(d);
            const off = !isScheduled(habit, d);
            return (
              <button key={d} type="button" disabled={pending || (off && !on)} onClick={() => toggle(d)} aria-pressed={on}
                aria-label={`${formatLocalDate(d, { weekday: "long", month: "short", day: "numeric" })}: ${on ? "done" : off ? "not scheduled" : "not done"}`}
                className={cn("flex h-12 flex-1 flex-col items-center justify-center rounded-lg border text-[11px] transition-colors disabled:cursor-not-allowed",
                  on ? "border-transparent text-white" : off ? "border-dashed text-muted-foreground/60" : "hover:bg-accent", d === today && !on && "ring-1 ring-ring")}
                style={on ? { backgroundColor: color } : undefined}>
                <span>{formatLocalDate(d, { weekday: "narrow" })}</span>
                <span className="font-semibold tabular">{Number(d.slice(8))}</span>
              </button>
            );
          })}
        </div>
      )}

      <dl className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
        {[["Streak", `${s.streak}`], ["Best", `${s.best}`], ["7 days", pct(s.rate7)], ["30 days", pct(s.rate30)]].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-muted/60 py-1.5"><dt className="text-muted-foreground">{k}</dt><dd className="text-sm font-semibold tabular">{v}</dd></div>
        ))}
      </dl>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-muted-foreground">History · {s.total} total check-ins</summary>
        <div className="mt-2 overflow-x-auto pb-1" role="img" aria-label={`Heatmap of the last ${weeks} weeks for ${habit.title}`}>
          <div className="flex gap-1">
            {cols.map((col, i) => (
              <div key={i} className="grid gap-1">
                {col.map((d) => {
                  const on = done.has(d);
                  const future = d > today;
                  const off = !isScheduled(habit, d);
                  return <span key={d} title={`${d}${on ? " ✓" : ""}`} className={cn("size-3.5 rounded-[3px] border", future ? "border-transparent" : on ? "border-transparent" : off ? "border-transparent bg-muted/40" : "bg-muted")} style={on ? { backgroundColor: color } : undefined} />;
                })}
              </div>
            ))}
          </div>
        </div>
      </details>

      <HabitFormDialog open={editing} onOpenChange={setEditing} habit={habit} />
      <ConfirmDialog open={confirming} onOpenChange={setConfirming} title="Delete this habit?" description="All check-in history for this habit is permanently deleted. Archive it instead to keep the history."
        onConfirm={() => void exec(() => deleteHabit(habit.id), { success: "Habit deleted" })} />
    </li>
  );
}
