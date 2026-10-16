"use client";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Field, selectClass } from "@/components/common/field";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useAction } from "@/components/common/use-action";
import { useAppData } from "@/components/layout/app-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { todayIn, utcToLocal } from "@/lib/dates";
import type { CalendarEvent } from "@/types/db";
import { createEvent, deleteEvent, updateEvent } from "./actions";
import { eventInputSchema, type EventInput } from "./schema";

type V = { title: string; description: string; location: string; all_day: boolean; start_date: string; start_time: string; end_date: string; end_time: string; project_id: string };

function init(e: CalendarEvent | null, tz: string, date?: string): V {
  if (e) {
    const s = utcToLocal(e.start_at, tz);
    const en = utcToLocal(e.end_at, tz);
    return { title: e.title, description: e.description ?? "", location: e.location ?? "", all_day: e.all_day, start_date: s.date, start_time: s.time, end_date: en.date, end_time: en.time, project_id: e.project_id ?? "" };
  }
  const d = date ?? todayIn(tz);
  return { title: "", description: "", location: "", all_day: false, start_date: d, start_time: "09:00", end_date: d, end_time: "10:00", project_id: "" };
}

export function EventFormDialog({ open, onOpenChange, event = null, date }: { open: boolean; onOpenChange: (o: boolean) => void; event?: CalendarEvent | null; date?: string }) {
  const { profile, projects } = useAppData();
  const { exec, pending } = useAction();
  const [confirming, setConfirming] = useState(false);
  const { register, handleSubmit, reset, control, getValues, setValue, setError, formState: { errors } } = useForm<V>({ defaultValues: init(event, profile.timezone, date) });
  const allDay = useWatch({ control, name: "all_day" });
  useEffect(() => { if (open) reset(init(event, profile.timezone, date)); }, [open, event, date, profile.timezone, reset]);

  const onSubmit = handleSubmit(async (v) => {
    const payload: EventInput = { ...v, task_id: event?.task_id ?? null };
    const check = eventInputSchema.safeParse(payload);
    if (!check.success) {
      for (const i of check.error.issues) setError(i.path[0] as keyof V, { message: i.message });
      return;
    }
    const res = await exec(async () => {
      if (event) { const r = await updateEvent(event.id, payload); return r.ok ? { ok: true as const, data: { id: event.id } } : r; }
      return createEvent(payload);
    }, { success: event ? "Event updated" : "Event created" });
    if (res.ok) onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? "Edit event" : "New event"}</DialogTitle>
          <DialogDescription>Times are in your timezone ({profile.timezone}).</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Field id="ev-title" label="Title" required error={errors.title?.message}><Input id="ev-title" autoFocus {...register("title")} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--primary)]" {...register("all_day")} /> All day</label>
          <div className="grid grid-cols-2 gap-3">
            <Field id="ev-sd" label="Starts" error={errors.start_date?.message}><Input id="ev-sd" type="date" {...register("start_date", { onChange: (e) => { if (!getValues("end_date") || getValues("end_date") < e.target.value) setValue("end_date", e.target.value); } })} /></Field>
            {!allDay && <Field id="ev-st" label="Start time" error={errors.start_time?.message}><Input id="ev-st" type="time" {...register("start_time")} /></Field>}
            <Field id="ev-ed" label="Ends" error={errors.end_date?.message}><Input id="ev-ed" type="date" {...register("end_date")} /></Field>
            {!allDay && <Field id="ev-et" label="End time" error={errors.end_time?.message}><Input id="ev-et" type="time" {...register("end_time")} /></Field>}
          </div>
          <Field id="ev-loc" label="Location" error={errors.location?.message}><Input id="ev-loc" {...register("location")} /></Field>
          <Field id="ev-proj" label="Project">
            <select id="ev-proj" className={selectClass} {...register("project_id")}>
              <option value="">No project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </Field>
          <Field id="ev-desc" label="Description" error={errors.description?.message}><Textarea id="ev-desc" rows={3} {...register("description")} /></Field>
          <DialogFooter className="sm:justify-between">
            {event ? <Button type="button" variant="destructive" onClick={() => setConfirming(true)}>Delete</Button> : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Saving…" : event ? "Save changes" : "Create event"}</Button>
            </div>
          </DialogFooter>
        </form>
        {event && <ConfirmDialog open={confirming} onOpenChange={setConfirming} title="Delete this event?" description={`“${event.title}” will be permanently deleted.`}
          onConfirm={async () => { const r = await exec(() => deleteEvent(event.id), { success: "Event deleted" }); if (r.ok) onOpenChange(false); }} />}
      </DialogContent>
    </Dialog>
  );
}
