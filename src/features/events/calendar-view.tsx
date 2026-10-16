"use client";
import { useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckSquare2, ChevronLeft, ChevronRight, Flag, Plus, Target } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { useAppData } from "@/components/layout/app-data";
import { Button } from "@/components/ui/button";
import { addDays, addMonths, diffDays, formatLocalDate, formatTime, monthEnd, monthStart, startOfWeek, todayIn, eachDay, type LocalDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { TaskFormDialog } from "@/features/tasks/task-form-dialog";
import type { CalendarEvent, Task } from "@/types/db";
import type { CalItem } from "./calendar-data";
import { EventFormDialog } from "./event-form-dialog";

export type CalView = "month" | "week" | "agenda";

const KIND_STYLE: Record<CalItem["kind"], string> = {
  event: "bg-primary/12 text-primary border-primary/25",
  task: "bg-info/10 text-info border-info/25",
  project: "bg-warning/15 text-warning border-warning/30",
  milestone: "bg-warning/15 text-warning border-warning/30",
  goal: "bg-chart-3/15 text-chart-3 border-chart-3/30",
};
const KIND_LABEL: Record<CalItem["kind"], string> = { event: "Event", task: "Task due", project: "Project deadline", milestone: "Milestone", goal: "Goal target" };

export function CalendarView({ view, anchor, items }: { view: CalView; anchor: LocalDate; items: CalItem[] }) {
  const { profile } = useAppData();
  const today = todayIn(profile.timezone);
  const [eventDlg, setEventDlg] = useState<{ event: CalendarEvent | null; date?: string } | null>(null);
  const [task, setTask] = useState<Task | null>(null);

  const href = (v: CalView, date: LocalDate) => `/calendar?view=${v}&date=${date}`;
  const step = view === "month" ? { prev: addMonths(monthStart(anchor), -1), next: addMonths(monthStart(anchor), 1) } : view === "week" ? { prev: addDays(anchor, -7), next: addDays(anchor, 7) } : { prev: addDays(anchor, -30), next: addDays(anchor, 30) };
  const weekStart = startOfWeek(anchor, profile.week_start);
  const title = view === "month" ? formatLocalDate(anchor, { month: "long", year: "numeric" })
    : view === "week" ? `${formatLocalDate(weekStart)} – ${formatLocalDate(addDays(weekStart, 6), { month: "short", day: "numeric", year: "numeric" })}`
    : `${formatLocalDate(anchor)} – ${formatLocalDate(addDays(anchor, 29), { month: "short", day: "numeric", year: "numeric" })}`;

  const byDay = new Map<string, CalItem[]>();
  for (const it of items) byDay.set(it.date, [...(byDay.get(it.date) ?? []), it]);

  function open(it: CalItem) {
    if (it.kind === "event" && it.event) setEventDlg({ event: it.event });
    else if (it.kind === "task" && it.task) setTask(it.task);
  }

  const Chip = ({ it }: { it: CalItem }) => {
    const label = `${KIND_LABEL[it.kind]}: ${it.title}${it.time ? ` at ${formatTime(it.time)}` : ""}${it.done ? " (done)" : ""}`;
    const cls = cn("flex w-full items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-left text-xs", KIND_STYLE[it.kind], it.done && "line-through opacity-60");
    const inner = (<>
      {it.kind === "task" && <CheckSquare2 className="size-3 shrink-0" aria-hidden />}
      {it.kind === "goal" && <Target className="size-3 shrink-0" aria-hidden />}
      {(it.kind === "project" || it.kind === "milestone") && <Flag className="size-3 shrink-0" aria-hidden />}
      {it.time && <span className="shrink-0 tabular opacity-80">{formatTime(it.time)}</span>}
      <span className="truncate">{it.title}</span>
    </>);
    return it.href ? <Link href={it.href} className={cls} aria-label={label} title={label}>{inner}</Link>
      : <button type="button" onClick={() => open(it)} className={cls} aria-label={label} title={label}>{inner}</button>;
  };

  const weekdayNames = eachDay(startOfWeek("2026-03-08", profile.week_start), addDays(startOfWeek("2026-03-08", profile.week_start), 6)).map((d) => formatLocalDate(d, { weekday: "short" }));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button asChild variant="outline" size="icon" aria-label="Previous"><Link href={href(view, step.prev)}><ChevronLeft /></Link></Button>
          <Button asChild variant="outline" size="icon" aria-label="Next"><Link href={href(view, step.next)}><ChevronRight /></Link></Button>
          <Button asChild variant="outline"><Link href={href(view, today)}>Today</Link></Button>
          <h2 className="ml-2 text-xl font-semibold" aria-live="polite">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <nav aria-label="Calendar view" className="flex gap-1 rounded-xl bg-muted p-1">
            {(["month", "week", "agenda"] as const).map((v) => (
              <Link key={v} href={href(v, anchor)} aria-current={view === v ? "page" : undefined}
                className={cn("rounded-lg px-3 py-1.5 text-sm font-medium capitalize", view === v ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>{v}</Link>
            ))}
          </nav>
          <Button onClick={() => setEventDlg({ event: null, date: today })}><Plus /> New event</Button>
        </div>
      </div>

      {view === "month" && (() => {
        const start = startOfWeek(monthStart(anchor), profile.week_start);
        const days = eachDay(start, addDays(start, 41));
        const rows = Math.ceil((diffDays(monthEnd(anchor), start) + 1) / 7);
        const grid = days.slice(0, rows * 7);
        return (
          <div className="overflow-hidden rounded-2xl border bg-card" role="grid" aria-label={title}>
            <div className="grid grid-cols-7 border-b bg-muted/50 text-center text-xs font-medium text-muted-foreground" role="row">
              {weekdayNames.map((n) => <div key={n} role="columnheader" className="py-2">{n}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {grid.map((d) => {
                const list = byDay.get(d) ?? [];
                const inMonth = d.slice(0, 7) === anchor.slice(0, 7);
                return (
                  <div key={d} role="gridcell" className={cn("group min-h-24 border-b border-r p-1 sm:min-h-28", !inMonth && "bg-muted/30 text-muted-foreground")}>
                    <button type="button" onClick={() => setEventDlg({ event: null, date: d })} aria-label={`Add event on ${formatLocalDate(d, { weekday: "long", month: "long", day: "numeric" })}`}
                      className={cn("mb-1 flex size-6 items-center justify-center rounded-full text-xs tabular hover:bg-accent", d === today && "bg-primary font-semibold text-primary-foreground hover:bg-primary")}>
                      {Number(d.slice(8))}
                    </button>
                    <ul className="grid gap-0.5">
                      {list.slice(0, 3).map((it) => <li key={it.id}><Chip it={it} /></li>)}
                      {list.length > 3 && <li><Link href={href("agenda", d)} className="px-1 text-xs text-muted-foreground hover:underline">+{list.length - 3} more</Link></li>}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {view === "week" && (
        <div className="grid gap-2 md:grid-cols-7">
          {eachDay(weekStart, addDays(weekStart, 6)).map((d) => (
            <section key={d} aria-label={formatLocalDate(d, { weekday: "long", month: "long", day: "numeric" })} className={cn("min-h-32 rounded-xl border bg-card p-2", d === today && "border-primary/50 ring-1 ring-primary/30")}>
              <header className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">{formatLocalDate(d, { weekday: "short", day: "numeric" })}</span>
                <Button variant="ghost" size="icon-xs" aria-label={`Add event on ${formatLocalDate(d)}`} onClick={() => setEventDlg({ event: null, date: d })}><Plus /></Button>
              </header>
              <ul className="grid gap-1">{(byDay.get(d) ?? []).map((it) => <li key={it.id}><Chip it={it} /></li>)}</ul>
              {!(byDay.get(d)?.length) && <p className="px-1 text-xs text-muted-foreground">Nothing scheduled</p>}
            </section>
          ))}
        </div>
      )}

      {view === "agenda" && (
        items.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Nothing in the next 30 days" description="Add an event, or give a task a due date and it will show up here."
            action={<Button onClick={() => setEventDlg({ event: null, date: today })}><Plus /> New event</Button>} />
        ) : (
          <div className="grid gap-4">
            {[...byDay.entries()].map(([d, list]) => (
              <section key={d} aria-label={formatLocalDate(d, { weekday: "long", month: "long", day: "numeric" })} className="grid gap-2 sm:grid-cols-[8rem_1fr]">
                <h3 className={cn("font-sans text-sm font-semibold", d === today && "text-primary")}>{d === today ? "Today" : formatLocalDate(d, { weekday: "short", month: "short", day: "numeric" })}</h3>
                <ul className="grid gap-1.5">
                  {list.map((it) => (
                    <li key={it.id} className="flex items-center gap-2 text-sm">
                      <span className="w-20 shrink-0 text-xs text-muted-foreground tabular">{it.time ? `${formatTime(it.time)}${it.endTime ? `–${formatTime(it.endTime)}` : ""}` : "All day"}</span>
                      <div className="min-w-0 flex-1"><Chip it={it} /></div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )
      )}

      <EventFormDialog open={!!eventDlg} onOpenChange={(o) => !o && setEventDlg(null)} event={eventDlg?.event ?? null} date={eventDlg?.date} />
      {task && <TaskFormDialog open onOpenChange={(o) => !o && setTask(null)} task={task} />}
    </div>
  );
}
