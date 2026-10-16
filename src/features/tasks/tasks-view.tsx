"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { mergeParams } from "@/lib/url";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Columns3, ListChecks, Plus, Search, X } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { selectClass } from "@/components/common/field";
import { useAppData } from "@/components/layout/app-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/db";
import { TASK_VIEWS, type TaskFilters } from "./schema";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskItem } from "./task-item";
import { useTaskActions } from "./use-task-actions";

const VIEW_LABEL: Record<(typeof TASK_VIEWS)[number], string> = { today: "Today", upcoming: "Upcoming", overdue: "Overdue", all: "All tasks", completed: "Completed" };
const SAVED_KEY = "lifeos.taskViews";

function parseSaved(raw: string): { name: string; query: string }[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x?.name === "string" && typeof x?.query === "string") : [];
  } catch {
    return [];
  }
}

export function TasksView({
  tasks, filters, layout, options,
}: { tasks: Task[]; filters: TaskFilters; layout: "list" | "board"; options: { categories: string[]; tags: string[] } }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { projects } = useAppData();
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState(filters.q ?? "");
  const [savedRaw, setSavedRaw] = useLocalStorage(SAVED_KEY, "[]");
  const saved = useMemo(() => parseSaved(savedRaw), [savedRaw]);

  const setParam = (updates: Record<string, string | null>) => {
    const next = mergeParams(params, updates);
    router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false });
  };

  // Debounced search → URL.
  useEffect(() => {
    if ((filters.q ?? "") === q.trim()) return;
    const t = setTimeout(() => setParam({ q: q.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = Boolean(filters.q || filters.priority || filters.status || filters.project || filters.category || filters.tag);
  const hrefFor = (view: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("view", view);
    return `${pathname}?${next}`;
  };

  function saveView() {
    const name = window.prompt("Name this view (saves the current filters on this device):");
    if (!name?.trim()) return;
    const next = [...saved.filter((s) => s.name !== name.trim()), { name: name.trim().slice(0, 40), query: params.toString() }].slice(-8);
    setSavedRaw(JSON.stringify(next));
  }
  function deleteSaved(name: string) {
    setSavedRaw(JSON.stringify(saved.filter((s) => s.name !== name)));
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav aria-label="Task views" className="flex flex-wrap gap-1 rounded-xl bg-muted p-1">
          {TASK_VIEWS.map((v) => (
            <Link key={v} href={hrefFor(v)} aria-current={filters.view === v ? "page" : undefined}
              className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", filters.view === v ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {VIEW_LABEL[v]}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border p-0.5" role="group" aria-label="Layout">
            <Button size="icon-sm" variant={layout === "list" ? "secondary" : "ghost"} aria-pressed={layout === "list"} aria-label="List layout" onClick={() => setParam({ layout: null })}><ListChecks /></Button>
            <Button size="icon-sm" variant={layout === "board" ? "secondary" : "ghost"} aria-pressed={layout === "board"} aria-label="Board layout" onClick={() => setParam({ layout: "board" })}><Columns3 /></Button>
          </div>
          <Button onClick={() => setCreating(true)}><Plus /> New task</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="search" aria-label="Filter tasks">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" aria-hidden />
          <Input aria-label="Search tasks" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" className="h-8 pl-8" />
        </div>
        <select aria-label="Filter by priority" className={cn(selectClass, "w-auto")} value={filters.priority ?? ""} onChange={(e) => setParam({ priority: e.target.value || null })}>
          <option value="">Any priority</option>
          {["urgent", "high", "medium", "low"].map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
        </select>
        {filters.view !== "completed" && (
          <select aria-label="Filter by status" className={cn(selectClass, "w-auto")} value={filters.status ?? ""} onChange={(e) => setParam({ status: e.target.value || null })}>
            <option value="">Any status</option>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
          </select>
        )}
        <select aria-label="Filter by project" className={cn(selectClass, "w-auto")} value={filters.project ?? ""} onChange={(e) => setParam({ project: e.target.value || null })}>
          <option value="">Any project</option>
          <option value="none">No project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        {options.categories.length > 0 && (
          <select aria-label="Filter by category" className={cn(selectClass, "w-auto")} value={filters.category ?? ""} onChange={(e) => setParam({ category: e.target.value || null })}>
            <option value="">Any category</option>
            {options.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {options.tags.length > 0 && (
          <select aria-label="Filter by tag" className={cn(selectClass, "w-auto")} value={filters.tag ?? ""} onChange={(e) => setParam({ tag: e.target.value || null })}>
            <option value="">Any tag</option>
            {options.tags.map((t) => <option key={t} value={t}>#{t}</option>)}
          </select>
        )}
        <select aria-label="Sort tasks" className={cn(selectClass, "w-auto")} value={filters.sort} onChange={(e) => setParam({ sort: e.target.value === "due" ? null : e.target.value })}>
          <option value="due">Sort: due date</option>
          <option value="priority">Sort: priority</option>
          <option value="created">Sort: newest</option>
          <option value="title">Sort: title</option>
        </select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setQ(""); router.replace(`${pathname}?view=${filters.view}${layout === "board" ? "&layout=board" : ""}`); }}><X /> Clear</Button>
        )}
        <Button variant="outline" size="sm" onClick={saveView} title="Save the current filters as a named view on this device"><Bookmark /> Save view</Button>
      </div>

      {saved.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-sm" aria-label="Saved views">
          <span className="text-muted-foreground">Saved:</span>
          {saved.map((s) => (
            <span key={s.name} className="inline-flex items-center rounded-full border bg-card">
              <Link href={`${pathname}?${s.query}`} className="rounded-l-full px-2.5 py-0.5 hover:bg-muted">{s.name}</Link>
              <button type="button" aria-label={`Remove saved view ${s.name}`} onClick={() => deleteSaved(s.name)} className="rounded-r-full px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-3" /></button>
            </span>
          ))}
        </div>
      )}

      {layout === "board" ? <Board tasks={tasks} /> : <List tasks={tasks} hasFilters={hasFilters} view={filters.view} onCreate={() => setCreating(true)} />}
      <TaskFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function List({ tasks, hasFilters, view, onCreate }: { tasks: Task[]; hasFilters: boolean; view: string; onCreate: () => void }) {
  if (tasks.length === 0) {
    return (
      <EmptyState icon={ListChecks}
        title={hasFilters ? "No tasks match these filters" : view === "completed" ? "Nothing completed yet" : view === "overdue" ? "Nothing overdue — nice." : "No tasks here yet"}
        description={hasFilters ? "Try clearing a filter or searching for something else." : "Capture a task to get started."}
        action={view !== "completed" && view !== "overdue" ? <Button onClick={onCreate}><Plus /> New task</Button> : undefined} />
    );
  }
  return <ul className="grid gap-2">{tasks.map((t) => <TaskItem key={t.id} task={t} />)}</ul>;
}

const COLUMNS: { status: Task["status"]; label: string }[] = [
  { status: "todo", label: "To do" },
  { status: "in_progress", label: "In progress" },
  { status: "done", label: "Done" },
];

function Board({ tasks }: { tasks: Task[] }) {
  const { setStatus } = useTaskActions();
  const byStatus = useMemo(() => Object.fromEntries(COLUMNS.map((c) => [c.status, tasks.filter((t) => t.status === c.status)])), [tasks]);
  const [over, setOver] = useState<string | null>(null);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {COLUMNS.map((col) => (
        <section key={col.status} aria-label={col.label}
          onDragOver={(e) => { e.preventDefault(); setOver(col.status); }}
          onDragLeave={() => setOver((o) => (o === col.status ? null : o))}
          onDrop={(e) => {
            e.preventDefault();
            setOver(null);
            const task = tasks.find((t) => t.id === e.dataTransfer.getData("text/plain"));
            if (task && task.status !== col.status) void setStatus(task, col.status);
          }}
          className={cn("rounded-xl border bg-muted/40 p-2 transition-colors", over === col.status && "border-primary bg-accent/50")}>
          <h2 className="mb-2 flex items-center justify-between px-1.5 text-sm font-semibold">
            {col.label}<span className="rounded-full bg-background px-2 text-xs font-normal text-muted-foreground tabular">{byStatus[col.status].length}</span>
          </h2>
          <ul className="grid min-h-16 gap-2">
            {byStatus[col.status].map((t) => <TaskItem key={t.id} task={t} compact draggable />)}
          </ul>
        </section>
      ))}
      <p className="text-xs text-muted-foreground md:col-span-3">Drag cards between columns, or use the ⋯ menu on a card to move it.</p>
    </div>
  );
}
