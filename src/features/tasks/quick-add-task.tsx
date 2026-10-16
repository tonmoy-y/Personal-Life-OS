"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useAction } from "@/components/common/use-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTask } from "./actions";

/** Inline "add a task" bar. `dueDate` defaults the new task's due date (e.g. today). */
export function QuickAddTask({ dueDate, projectId, placeholder = "Add a task and press Enter…" }: { dueDate?: string; projectId?: string; placeholder?: string }) {
  const [title, setTitle] = useState("");
  const { exec, pending } = useAction();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    const res = await exec(() => createTask({ title: t, due_date: dueDate ?? null, project_id: projectId ?? null }), { success: "Task added" });
    if (res.ok) setTitle("");
  }

  return (
    <form onSubmit={submit} className="flex gap-2" role="search" aria-label="Quick add task">
      <Input aria-label="New task title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={placeholder} maxLength={200} className="h-9" />
      <Button type="submit" disabled={pending || !title.trim()} className="h-9"><Plus /> Add</Button>
    </form>
  );
}
