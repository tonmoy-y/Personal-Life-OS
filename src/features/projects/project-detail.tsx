"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PriorityBadge } from "@/components/common/badges";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { useAction } from "@/components/common/use-action";
import { useAppData } from "@/components/layout/app-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatLocalDate, isLocalDate, todayIn } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { QuickAddTask } from "@/features/tasks/quick-add-task";
import { TaskItem } from "@/features/tasks/task-item";
import type { Project, ProjectMilestone, Task } from "@/types/db";
import { addProjectMilestone, deleteProject, deleteProjectMilestone, setProjectMilestoneDone } from "./actions";
import { ProjectFormDialog } from "./project-form-dialog";
import { STATUS_LABEL } from "./projects-grid";

export function ProjectDetail({ project, tasks, milestones, done, total, progress }: {
  project: Project; tasks: Task[]; milestones: ProjectMilestone[]; done: number; total: number; progress: number;
}) {
  const router = useRouter();
  const { profile } = useAppData();
  const { exec, pending } = useAction();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const today = todayIn(profile.timezone);
  const open = tasks.filter((t) => t.status !== "done");
  const finished = tasks.filter((t) => t.status === "done");
  const upcoming = milestones.filter((m) => !m.completed_at && m.due_date && m.due_date >= today).length;

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (due && !isLocalDate(due)) return void toast.error("Enter a valid date");
    const res = await exec(() => addProjectMilestone(project.id, { title, due_date: due }), { success: "Milestone added" });
    if (res.ok) { setTitle(""); setDue(""); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="grid content-start gap-6">
        <section className="rounded-2xl border bg-card p-5" style={{ borderTop: `3px solid ${project.color ?? "var(--primary)"}` }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{STATUS_LABEL[project.status]}</Badge>
              <PriorityBadge priority={project.priority} />
              {project.deadline && (
                <span className={cn("inline-flex items-center gap-1.5 text-sm", project.deadline < today && project.status !== "completed" ? "font-medium text-destructive" : "text-muted-foreground")}>
                  <CalendarClock className="size-4" aria-hidden />Due {formatLocalDate(project.deadline, { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil /> Edit</Button>
              <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}><Trash2 /> Delete</Button>
            </div>
          </div>
          {project.description && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{project.description}</p>}
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-sm"><span className="text-muted-foreground">{done} of {total} tasks done</span><span className="tabular font-semibold">{progress}%</span></div>
            <Progress value={progress} aria-label="Project progress" />
          </div>
        </section>

        <section aria-labelledby="proj-tasks" className="grid gap-3">
          <h2 id="proj-tasks" className="text-xl font-semibold">Tasks</h2>
          <QuickAddTask projectId={project.id} placeholder="Add a task to this project…" />
          {tasks.length === 0 ? <EmptyState title="No tasks linked yet" description="Add one above, or link existing tasks from the task editor." /> : (
            <>
              <ul className="grid gap-2">{open.map((t) => <TaskItem key={t.id} task={t} showProject={false} />)}</ul>
              {finished.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer py-1 text-sm text-muted-foreground">Completed ({finished.length})</summary>
                  <ul className="mt-2 grid gap-2">{finished.map((t) => <TaskItem key={t.id} task={t} showProject={false} />)}</ul>
                </details>
              )}
            </>
          )}
        </section>
      </div>

      <aside aria-labelledby="proj-ms" className="grid content-start gap-3">
        <h2 id="proj-ms" className="text-xl font-semibold">Milestones</h2>
        <p className="-mt-2 text-xs text-muted-foreground">{upcoming} upcoming</p>
        <form onSubmit={addMilestone} className="grid gap-2 rounded-xl border bg-card p-3">
          <Input aria-label="Milestone title" placeholder="Milestone…" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
          <div className="flex gap-2">
            <Input aria-label="Milestone due date" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            <Button type="submit" disabled={pending || !title.trim()}><Plus /> Add</Button>
          </div>
        </form>
        {milestones.length === 0 ? <p className="text-sm text-muted-foreground">No milestones yet.</p> : (
          <ul className="grid gap-2">
            {milestones.map((m) => {
              const isDone = !!m.completed_at;
              const late = !isDone && m.due_date && m.due_date < today;
              return (
                <li key={m.id} className="flex items-start gap-2.5 rounded-xl border bg-card px-3 py-2">
                  <Checkbox className="mt-0.5" checked={isDone} aria-label={`${isDone ? "Reopen" : "Complete"} milestone ${m.title}`} onCheckedChange={(v) => void exec(() => setProjectMilestoneDone(m.id, project.id, !!v))} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", isDone && "text-muted-foreground line-through")}>{m.title}</p>
                    {m.due_date && <p className={cn("text-xs", late ? "font-medium text-destructive" : "text-muted-foreground")}>{late ? "Overdue · " : ""}{formatLocalDate(m.due_date, { month: "short", day: "numeric", year: "numeric" })}</p>}
                  </div>
                  <Button variant="ghost" size="icon-xs" aria-label={`Delete milestone ${m.title}`} onClick={() => void exec(() => deleteProjectMilestone(m.id, project.id))}><Trash2 /></Button>
                  {isDone && <Check className="mt-0.5 size-4 text-success" aria-hidden />}
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <ProjectFormDialog open={editing} onOpenChange={setEditing} project={project} />
      <ConfirmDialog open={confirming} onOpenChange={setConfirming} title="Delete this project?" description="The project and its milestones are deleted. Its tasks are kept but unlinked from the project."
        onConfirm={async () => { const r = await exec(() => deleteProject(project.id), { success: "Project deleted", refresh: false }); if (r.ok) router.push("/projects"); }} />
    </div>
  );
}
