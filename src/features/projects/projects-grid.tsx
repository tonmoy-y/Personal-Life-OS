"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, FolderKanban, Plus } from "lucide-react";
import { PriorityBadge } from "@/components/common/badges";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatLocalDate, todayIn } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useAppData } from "@/components/layout/app-data";
import { ProjectFormDialog } from "./project-form-dialog";
import type { ProjectWithProgress } from "./queries";

export const STATUS_LABEL: Record<string, string> = { planning: "Planning", active: "Active", on_hold: "On hold", completed: "Completed", archived: "Archived" };
const TABS = ["active", "planning", "on_hold", "completed", "archived"] as const;

export function ProjectsGrid({ projects }: { projects: ProjectWithProgress[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("active");
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const { profile } = useAppData();
  const today = todayIn(profile.timezone);
  const shown = projects.filter((p) => p.status === tab);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Project status" className="flex flex-wrap gap-1 rounded-xl bg-muted p-1">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", tab === t ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {STATUS_LABEL[t]} <span className="ml-1 text-xs text-muted-foreground tabular">{projects.filter((p) => p.status === t).length}</span>
            </button>
          ))}
        </div>
        <Button onClick={() => setCreating(true)}><Plus /> New project</Button>
      </div>
      {shown.length === 0 ? (
        <EmptyState icon={FolderKanban} title={projects.length === 0 ? "No projects yet" : `No ${STATUS_LABEL[tab].toLowerCase()} projects`}
          description="Projects bundle related tasks and show real progress from how many are done."
          action={<Button onClick={() => setCreating(true)}><Plus /> Create a project</Button>} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => {
            const late = p.deadline && p.deadline < today && p.status !== "completed";
            return (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="block h-full rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-ring/50 hover:shadow-md" style={{ borderTop: `3px solid ${p.color ?? "var(--primary)"}` }}>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 text-lg font-semibold leading-snug">{p.title}</h2>
                    <PriorityBadge priority={p.priority} />
                  </div>
                  {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                      <span>{p.done}/{p.total} tasks</span><span className="tabular font-medium text-foreground">{p.progress}%</span>
                    </div>
                    <Progress value={p.progress} aria-label={`${p.title} progress`} />
                  </div>
                  {p.deadline && (
                    <p className={cn("mt-3 inline-flex items-center gap-1.5 text-xs", late ? "font-medium text-destructive" : "text-muted-foreground")}>
                      <CalendarClock className="size-3.5" aria-hidden />{late ? "Overdue · " : "Due "}{formatLocalDate(p.deadline, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                  {p.status !== "active" && <Badge variant="outline" className="mt-2">{STATUS_LABEL[p.status]}</Badge>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <ProjectFormDialog open={creating} onOpenChange={setCreating} onSaved={(id) => router.push(`/projects/${id}`)} />
    </div>
  );
}
