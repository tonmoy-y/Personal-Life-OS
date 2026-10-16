"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useAction } from "@/components/common/use-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logGoalProgress } from "./actions";

export function ProgressForm({ goalId, current, unit }: { goalId: string; current: number; unit: string }) {
  const [value, setValue] = useState(String(current));
  const [note, setNote] = useState("");
  const { exec, pending } = useAction();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(value);
    if (value.trim() === "" || !Number.isFinite(n)) return void toast.error("Enter a number");
    const res = await exec(() => logGoalProgress(goalId, { value: n, note }), { success: "Progress saved" });
    if (res.ok) {
      setNote("");
      if (res.data.completed) toast.success("Goal reached — congratulations! 🎉");
    }
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <label className="grid gap-1 text-xs text-muted-foreground">Now at ({unit})
        <Input aria-label={`Current value in ${unit}`} inputMode="decimal" className="h-8 w-28" value={value} onChange={(e) => setValue(e.target.value)} />
      </label>
      <label className="grid min-w-32 flex-1 gap-1 text-xs text-muted-foreground">Note (optional)
        <Input aria-label="Progress note" className="h-8" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
      </label>
      <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Update"}</Button>
    </form>
  );
}
