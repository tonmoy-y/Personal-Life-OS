"use client";
import { toast } from "sonner";
import { useAction } from "@/components/common/use-action";
import type { Task } from "@/types/db";
import { deleteTask, restoreTask, setTaskStatus } from "./actions";

export function useTaskActions() {
  const { exec, pending } = useAction();

  const setStatus = (task: Pick<Task, "id" | "title" | "recurrence">, status: Task["status"]) =>
    exec(() => setTaskStatus(task.id, status), {
      success: status === "done" ? (task.recurrence ? "Done — next occurrence scheduled" : "Task completed") : status === "todo" ? "Task reopened" : undefined,
    });

  const remove = async (task: Task) => {
    const res = await exec(() => deleteTask(task.id));
    if (res.ok) {
      toast("Task deleted", {
        description: task.title,
        duration: 8000,
        action: { label: "Undo", onClick: () => void exec(() => restoreTask(res.data.snapshot), { success: "Task restored" }) },
      });
    }
    return res;
  };

  return { setStatus, remove, pending };
}
