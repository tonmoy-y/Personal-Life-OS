"use client";
import { useState } from "react";
import { CalendarClock, Clock, MoreHorizontal, Pencil, Repeat, Trash2 } from "lucide-react";
import { ColorDot, PriorityBadge } from "@/components/common/badges";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useAppData } from "@/components/layout/app-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatLocalDate, formatTime, isOverdue, todayIn, addDays } from "@/lib/dates";
import { describeRecurrence } from "@/lib/recurrence";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/db";
import { TaskFormDialog } from "./task-form-dialog";
import { useTaskActions } from "./use-task-actions";

export function dueLabel(task: Pick<Task, "due_date" | "due_time">, tz: string, tf: "12h" | "24h" = "12h"): string | null {
  if (!task.due_date) return null;
  const today = todayIn(tz);
  const day =
    task.due_date === today ? "Today"
    : task.due_date === addDays(today, 1) ? "Tomorrow"
    : task.due_date === addDays(today, -1) ? "Yesterday"
    : formatLocalDate(task.due_date, { month: "short", day: "numeric", ...(task.due_date.slice(0, 4) !== today.slice(0, 4) ? { year: "numeric" } : {}) });
  return task.due_time ? `${day}, ${formatTime(task.due_time, tf)}` : day;
}

export function TaskItem({ task, compact = false, showProject = true, draggable = false }: { task: Task; compact?: boolean; showProject?: boolean; draggable?: boolean }) {
  const { profile, projects } = useAppData();
  const { setStatus, remove, pending } = useTaskActions();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const done = task.status === "done";
  const overdue = !done && isOverdue(task, profile.timezone);
  const project = projects.find((p) => p.id === task.project_id);
  const label = dueLabel(task, profile.timezone, profile.time_format);

  return (
    <li
      draggable={draggable || undefined}
      onDragStart={draggable ? (e) => e.dataTransfer.setData("text/plain", task.id) : undefined}
      className={cn(draggable && "cursor-grab active:cursor-grabbing", "group flex items-start gap-3 rounded-xl border bg-card px-3 py-2.5 transition-colors hover:border-ring/40", pending && "opacity-60", done && "bg-muted/40")}>
      <Checkbox
        className="mt-0.5"
        checked={done}
        disabled={pending}
        aria-label={done ? `Reopen “${task.title}”` : `Complete “${task.title}”`}
        onCheckedChange={(v) => void setStatus(task, v ? "done" : "todo")}
      />
      <button type="button" onClick={() => setEditing(true)} className="min-w-0 flex-1 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className={cn("block text-sm font-medium leading-snug", done && "text-muted-foreground line-through")}>{task.title}</span>
        {!compact && task.description && <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">{task.description}</span>}
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
          {label && (
            <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-destructive")}>
              <CalendarClock className="size-3" aria-hidden />
              {overdue && <span className="sr-only">Overdue: </span>}
              {label}
            </span>
          )}
          {task.estimated_minutes && <span className="inline-flex items-center gap-1"><Clock className="size-3" aria-hidden />{task.estimated_minutes}m</span>}
          {task.recurrence && <span className="inline-flex items-center gap-1" title={describeRecurrence(task.recurrence)}><Repeat className="size-3" aria-hidden /><span className="sr-only">{describeRecurrence(task.recurrence)}</span></span>}
          {showProject && project && <span className="inline-flex items-center gap-1"><ColorDot color={project.color} />{project.title}</span>}
          {task.category && <Badge variant="outline">{task.category}</Badge>}
          {!compact && task.tags.map((t) => <span key={t}>#{t}</span>)}
        </span>
      </button>
      {task.priority !== "medium" && <PriorityBadge priority={task.priority} className="hidden sm:inline-flex" />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for “${task.title}”`}><MoreHorizontal /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditing(true)}><Pencil /> Edit</DropdownMenuItem>
          {(["todo", "in_progress", "done"] as const).filter((st) => st !== task.status).map((st) => (
            <DropdownMenuItem key={st} onSelect={() => void setStatus(task, st)}>
              Move to {st === "todo" ? "To do" : st === "in_progress" ? "In progress" : "Done"}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}><Trash2 /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog open={confirming} onOpenChange={setConfirming} title="Delete this task?" description={`“${task.title}” will be deleted. You can undo right after.`} onConfirm={() => void remove(task)} />
      {editing && <TaskFormDialog open={editing} onOpenChange={setEditing} task={task} />}
    </li>
  );
}
