"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckSquare2, FileText, Flame, FolderKanban, Plus, Search, Target, Wallet } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { globalSearch, type SearchHit } from "@/features/search/actions";
import { ALL_NAV } from "./nav";

export type QuickAddKind = "task" | "event" | "note" | "expense" | "habit" | "project" | "goal";

const ICON = { task: CheckSquare2, note: FileText, project: FolderKanban, goal: Target, habit: Flame, event: CalendarDays, transaction: Wallet } as const;

export function CommandPalette({ open, onOpenChange, onQuickAdd }: { open: boolean; onOpenChange: (o: boolean) => void; onQuickAdd: (k: QuickAddKind) => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const seq = useRef(0);

  // Debounced search with out-of-order protection.
  const searching = q.trim().length >= 2;
  useEffect(() => {
    if (!searching) { seq.current++; return; }
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      setState("loading");
      try {
        const res = await globalSearch(q);
        if (mine !== seq.current) return;
        if (res.ok) { setHits(res.data); setState("idle"); } else setState("error");
      } catch { if (mine === seq.current) setState("error"); }
    }, 250);
    return () => clearTimeout(t);
  }, [q, searching]);
  const visibleHits = searching ? hits : [];

  const go = (href: string) => { onOpenChange(false); setQ(""); router.push(href); };
  const add = (k: QuickAddKind) => { onOpenChange(false); setQ(""); onQuickAdd(k); };

  return (
    <CommandDialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setQ(""); }} title="Search and commands" description="Search your tasks, notes, projects and goals, or jump anywhere.">
      <CommandInput placeholder="Search tasks, notes, projects, goals… or type a command" value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>{searching && state === "loading" ? "Searching…" : searching && state === "error" ? "Search failed. Check your connection and try again." : q.trim().length < 2 ? "Type at least 2 characters to search." : "No results."}</CommandEmpty>
        {visibleHits.length > 0 && (
          <CommandGroup heading="Results">
            {visibleHits.map((h) => {
              const Icon = ICON[h.kind];
              return <CommandItem key={`${h.kind}-${h.id}`} forceMount value={`${h.title} ${h.id}`} onSelect={() => go(h.href)}><Icon /><span className="truncate">{h.title}</span>{h.subtitle && <span className="ml-auto max-w-40 truncate text-xs text-muted-foreground">{h.subtitle}</span>}</CommandItem>;
            })}
          </CommandGroup>
        )}
        <CommandSeparator />
        <CommandGroup heading="Create">
          <CommandItem onSelect={() => add("task")}><Plus />New task<CommandShortcut>t</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => add("event")}><CalendarDays />New event<CommandShortcut>e</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => add("note")}><FileText />New note</CommandItem>
          <CommandItem onSelect={() => add("expense")}><Plus />Add transaction</CommandItem>
          <CommandItem onSelect={() => add("habit")}><Plus />New habit</CommandItem>
          <CommandItem onSelect={() => add("project")}><Plus />New project</CommandItem>
          <CommandItem onSelect={() => add("goal")}><Plus />New goal</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Go to">
          {ALL_NAV.map((n) => <CommandItem key={n.href} value={`go ${n.label}`} onSelect={() => go(n.href)}><n.icon />{n.label}{n.shortcut && <CommandShortcut>g {n.shortcut}</CommandShortcut>}</CommandItem>)}
        </CommandGroup>
      </CommandList>
      <div className="flex items-center gap-1.5 border-t px-3 py-2 text-xs text-muted-foreground"><Search className="size-3" aria-hidden /> Searches only your own data.</div>
    </CommandDialog>
  );
}
