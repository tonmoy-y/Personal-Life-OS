"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { mergeParams } from "@/lib/url";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Archive, ArchiveRestore, NotebookText, Pin, PinOff, Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { useAction } from "@/components/common/use-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/db";
import { createNote, setNoteArchived, setNotePinned } from "./actions";

const excerpt = (md: string) => md.replace(/[#>*_`~\[\]()-]/g, "").replace(/\s+/g, " ").trim().slice(0, 160);

export function NotesList({ notes, tags, q: initialQ, tag, archived }: { notes: Note[]; tags: string[]; q: string; tag?: string; archived: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { exec, pending } = useAction();
  const [q, setQ] = useState(initialQ);

  const setParam = (updates: Record<string, string | null>) => {
    const next = mergeParams(params, updates);
    router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false });
  };
  useEffect(() => {
    if (initialQ === q.trim()) return;
    const t = setTimeout(() => setParam({ q: q.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function create() {
    const r = await exec(() => createNote(), { refresh: false });
    if (r.ok) router.push(`/notes/${r.data.id}`);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" aria-hidden />
          <Input aria-label="Search notes" placeholder="Search notes…" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 pl-8" />
        </div>
        <Button variant={archived ? "secondary" : "outline"} size="sm" aria-pressed={archived} onClick={() => setParam({ archived: archived ? null : "1" })}><Archive /> {archived ? "Showing archived" : "Archived"}</Button>
        <Button onClick={create} disabled={pending}><Plus /> New note</Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by tag">
          {tags.map((t) => <button key={t} aria-pressed={tag === t} onClick={() => setParam({ tag: tag === t ? null : t })} className={cn("rounded-full border px-2.5 py-0.5 text-xs", tag === t ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>#{t}</button>)}
        </div>
      )}
      {notes.length === 0 ? (
        <EmptyState icon={NotebookText} title={archived ? "No archived notes" : initialQ || tag ? "No notes match" : "Your vault is empty"} description={initialQ || tag ? "Try a different search or tag." : "Write in Markdown, tag and pin what matters, and link notes to projects and goals."}
          action={!archived && !initialQ && !tag ? <Button onClick={create}><Plus /> Write your first note</Button> : undefined} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((n) => (
            <li key={n.id} className="group relative rounded-3xl border bg-card transition-colors hover:border-ring/50">
              <Link href={`/notes/${n.id}`} className="block p-4 pb-3 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">
                <h2 className="line-clamp-1 pr-14 text-base font-semibold">{n.pinned && <Pin className="mr-1 inline size-3.5 text-primary" aria-label="Pinned" />}{n.title || "Untitled note"}</h2>
                <p className="mt-1 line-clamp-3 min-h-12 text-sm text-muted-foreground">{excerpt(n.body) || "Empty note"}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {n.tags.slice(0, 4).map((t) => <Badge key={t} variant="outline">#{t}</Badge>)}
                  <span className="ml-auto text-xs text-muted-foreground">{new Date(n.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </div>
              </Link>
              <div className="absolute right-2 top-2 flex opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                <Button variant="ghost" size="icon-xs" aria-label={n.pinned ? "Unpin note" : "Pin note"} onClick={() => void exec(() => setNotePinned(n.id, !n.pinned))}>{n.pinned ? <PinOff /> : <Pin />}</Button>
                <Button variant="ghost" size="icon-xs" aria-label={n.archived_at ? "Restore note" : "Archive note"} onClick={() => void exec(() => setNoteArchived(n.id, !n.archived_at), { success: n.archived_at ? "Note restored" : "Note archived" })}>{n.archived_at ? <ArchiveRestore /> : <Archive />}</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
