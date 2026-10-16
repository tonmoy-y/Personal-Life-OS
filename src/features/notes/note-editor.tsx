"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Archive, ArchiveRestore, Bold, CheckCircle2, Code, Heading2, Italic, Link2, List, ListOrdered, Loader2, Pin, PinOff, Quote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { selectClass } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { useAppData } from "@/components/layout/app-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseTags } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/db";
import { deleteNote, forceSaveNote, saveNote, setNoteArchived, setNotePinned } from "./actions";
import { Markdown } from "./markdown";

type Status = "saved" | "dirty" | "saving" | "error" | "conflict" | "missing";
type Fields = { title: string; body: string; tags: string; project_id: string; goal_id: string };
const AUTOSAVE_MS = 800;

const FORMATS: { label: string; icon: typeof Bold; before: string; after: string; block?: boolean }[] = [
  { label: "Bold", icon: Bold, before: "**", after: "**" },
  { label: "Italic", icon: Italic, before: "_", after: "_" },
  { label: "Heading", icon: Heading2, before: "## ", after: "", block: true },
  { label: "Bulleted list", icon: List, before: "- ", after: "", block: true },
  { label: "Numbered list", icon: ListOrdered, before: "1. ", after: "", block: true },
  { label: "Quote", icon: Quote, before: "> ", after: "", block: true },
  { label: "Code", icon: Code, before: "`", after: "`" },
  { label: "Link", icon: Link2, before: "[", after: "](https://)" },
];

export function NoteEditor({ note }: { note: Note }) {
  const router = useRouter();
  const { projects, goals } = useAppData();
  const { exec } = useAction();
  const [fields, setFields] = useState<Fields>({ title: note.title, body: note.body, tags: note.tags.join(", "), project_id: note.project_id ?? "", goal_id: note.goal_id ?? "" });
  const [status, setStatus] = useState<Status>("saved");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [mode, setMode] = useState<"edit" | "split" | "preview">("split");
  const [pinned, setPinned] = useState(note.pinned);
  const [archived, setArchived] = useState(!!note.archived_at);
  const [confirming, setConfirming] = useState(false);

  // Mutable save state kept in refs so the save loop never reads stale closures.
  const latest = useRef(fields);
  const version = useRef(note.version);
  const editSeq = useRef(0);
  const savedSeq = useRef(0);
  const inFlight = useRef(false);
  const blocked = useRef(false); // conflict or missing: autosave stops until the user decides
  const failed = useRef(false); // last save attempt failed (network/server)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const payload = (f: Fields) => ({ title: f.title, body: f.body, tags: parseTags(f.tags), project_id: f.project_id || null, goal_id: f.goal_id || null });

  const flush = useCallback(async () => {
    if (inFlight.current || blocked.current || savedSeq.current === editSeq.current) return;
    inFlight.current = true;
    failed.current = false;
    setStatus("saving");
    const seq = editSeq.current;
    try {
      const res = await saveNote(note.id, { ...payload(latest.current), expected_version: version.current });
      if (!res.ok) { failed.current = true; setStatus("error"); return; }
      const r = res.data;
      if (r.status === "saved") {
        version.current = r.version;
        savedSeq.current = seq;
        setSavedAt(new Date(r.updated_at));
        setStatus(editSeq.current === seq ? "saved" : "dirty");
      } else {
        blocked.current = true;
        setStatus(r.status === "conflict" ? "conflict" : "missing");
      }
    } catch {
      failed.current = true;
      setStatus("error"); // network failure: stays dirty, user can retry; nothing is discarded
    } finally {
      inFlight.current = false;
      if (!blocked.current && !failed.current && savedSeq.current !== editSeq.current) schedule(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  function schedule(ms = AUTOSAVE_MS) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), ms);
  }

  function update(patch: Partial<Fields>) {
    latest.current = { ...latest.current, ...patch };
    setFields(latest.current);
    editSeq.current++;
    if (!blocked.current) {
      setStatus((s) => (s === "saving" ? s : "dirty"));
      schedule();
    }
  }

  // Warn before leaving with unsaved work; flush when tab is hidden.
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (savedSeq.current !== editSeq.current) { e.preventDefault(); e.returnValue = ""; }
    };
    const onHide = () => { if (document.visibilityState === "hidden") void flush(); };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("visibilitychange", onHide);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [flush]);

  function format(f: (typeof FORMATS)[number]) {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const start = f.block ? value.lastIndexOf("\n", s - 1) + 1 : s;
    const selected = value.slice(f.block ? start : s, e) || (f.block ? "" : "text");
    const next = value.slice(0, start) + f.before + selected + f.after + value.slice(e);
    update({ body: next });
    requestAnimationFrame(() => { el.focus(); const pos = start + f.before.length + selected.length; el.setSelectionRange(pos, pos); });
  }

  const statusView = {
    saved: <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="size-4" />Saved{savedAt ? ` ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</span>,
    dirty: <span className="text-muted-foreground">Unsaved changes…</span>,
    saving: <span className="inline-flex items-center gap-1 text-muted-foreground"><Loader2 className="size-4 animate-spin" />Saving…</span>,
    error: <span className="inline-flex items-center gap-1 text-destructive"><AlertTriangle className="size-4" />Couldn’t save — your text is kept here. <button className="underline" onClick={() => { blocked.current = false; void flush(); }}>Retry</button></span>,
    conflict: <span className="inline-flex items-center gap-1 text-warning"><AlertTriangle className="size-4" />Edited elsewhere</span>,
    missing: <span className="inline-flex items-center gap-1 text-destructive"><AlertTriangle className="size-4" />Note was deleted</span>,
  }[status];

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" aria-live="polite" className="text-sm">{statusView}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex rounded-lg border p-0.5" role="group" aria-label="Editor mode">
            {(["edit", "split", "preview"] as const).map((m) => <Button key={m} size="sm" variant={mode === m ? "secondary" : "ghost"} aria-pressed={mode === m} onClick={() => setMode(m)} className={cn("capitalize", m === "split" && "hidden md:inline-flex")}>{m}</Button>)}
          </div>
          <Button variant="outline" size="sm" onClick={async () => { const r = await exec(() => setNotePinned(note.id, !pinned), { refresh: false }); if (r.ok) setPinned(!pinned); }}>{pinned ? <><PinOff /> Unpin</> : <><Pin /> Pin</>}</Button>
          <Button variant="outline" size="sm" onClick={async () => { const r = await exec(() => setNoteArchived(note.id, !archived), { refresh: false, success: archived ? "Note restored" : "Note archived" }); if (r.ok) setArchived(!archived); }}>{archived ? <><ArchiveRestore /> Restore</> : <><Archive /> Archive</>}</Button>
          <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}><Trash2 /> Delete</Button>
        </div>
      </div>

      {status === "conflict" && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
          <p>This note was saved from another tab or device since you opened it. Autosave is paused so nothing is overwritten.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { savedSeq.current = editSeq.current; router.refresh(); window.location.reload(); }}>Load their version</Button>
            <Button size="sm" onClick={async () => {
              const res = await forceSaveNote(note.id, payload(latest.current));
              if (res.ok && res.data.status === "saved") { version.current = res.data.version; blocked.current = false; savedSeq.current = editSeq.current; setSavedAt(new Date(res.data.updated_at)); setStatus("saved"); toast.success("Saved your version"); }
              else toast.error(res.ok ? "Couldn't save" : res.error);
            }}>Keep mine</Button>
          </div>
        </div>
      )}
      {status === "missing" && <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">This note no longer exists (deleted elsewhere). Copy your text if you want to keep it.</div>}

      <Input aria-label="Note title" value={fields.title} placeholder="Untitled note" maxLength={200} onChange={(e) => update({ title: e.target.value })} className="h-11 border-0 bg-transparent px-0 font-heading text-2xl font-semibold shadow-none focus-visible:ring-0 md:text-3xl" />

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-xs text-muted-foreground">Tags
          <Input value={fields.tags} placeholder="idea, reading" onChange={(e) => update({ tags: e.target.value })} className="h-8" />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">Project
          <select className={selectClass} value={fields.project_id} onChange={(e) => update({ project_id: e.target.value })}><option value="">None</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">Goal
          <select className={selectClass} value={fields.goal_id} onChange={(e) => update({ goal_id: e.target.value })}><option value="">None</option>{goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select>
        </label>
      </div>

      <div className={cn("grid gap-3", mode === "split" && "md:grid-cols-2")}>
        {mode !== "preview" && (
          <div className="grid content-start gap-2">
            <div className="flex flex-wrap gap-1" role="toolbar" aria-label="Formatting">
              {FORMATS.map((f) => <Button key={f.label} type="button" variant="ghost" size="icon-sm" aria-label={f.label} title={f.label} onClick={() => format(f)}><f.icon /></Button>)}
            </div>
            <textarea ref={bodyRef} aria-label="Note body (Markdown)" value={fields.body} onChange={(e) => update({ body: e.target.value })} spellCheck
              placeholder="Write in Markdown…" className="min-h-[50dvh] w-full resize-y rounded-xl border border-input bg-card p-3 font-mono text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
          </div>
        )}
        {mode !== "edit" && <div className="min-h-[50dvh] rounded-xl border bg-card p-4" aria-label="Preview"><Markdown source={fields.body} /></div>}
      </div>

      <ConfirmDialog open={confirming} onOpenChange={setConfirming} title="Delete this note?" description="This permanently deletes the note. Consider archiving instead."
        onConfirm={async () => { blocked.current = true; savedSeq.current = editSeq.current; const r = await exec(() => deleteNote(note.id), { success: "Note deleted", refresh: false }); if (r.ok) router.push("/notes"); else blocked.current = false; }} />
    </div>
  );
}
