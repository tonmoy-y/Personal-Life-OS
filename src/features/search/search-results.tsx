import Link from "next/link";
import { CalendarDays, CheckSquare2, FileText, Flame, FolderKanban, Search, Target, Wallet } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { SEARCH_KIND_LABEL, SEARCH_KIND_ORDER, type SearchHit, type SearchKind } from "./types";

const ICON = { task: CheckSquare2, note: FileText, project: FolderKanban, goal: Target, habit: Flame, event: CalendarDays, transaction: Wallet } as const satisfies Record<SearchKind, unknown>;

/** Full, grouped list of search hits. Presentational so it renders on the server. */
export function SearchResults({ query, hits }: { query: string; hits: SearchHit[] }) {
  if (query.trim().length < 2) {
    return <EmptyState icon={Search} title="Search everything" description="Type at least 2 characters to search your tasks, notes, projects, goals, habits, events and transactions." />;
  }
  if (hits.length === 0) {
    return <EmptyState icon={Search} title="No results" description={`Nothing matched “${query}”. Try a different word, or part of a word.`} />;
  }
  const groups = SEARCH_KIND_ORDER.map((kind) => ({ kind, items: hits.filter((h) => h.kind === kind) })).filter((g) => g.items.length > 0);
  return (
    <div className="grid gap-6">
      {groups.map(({ kind, items }) => {
        const Icon = ICON[kind];
        return (
          <section key={kind} aria-labelledby={`sr-${kind}`}>
            <h2 id={`sr-${kind}`} className="mb-2 flex items-center gap-2 text-2xl">{SEARCH_KIND_LABEL[kind]} <span className="font-sans text-sm text-muted-foreground tabular">{items.length}</span></h2>
            <ul className="grid gap-2">
              {items.map((h) => (
                <li key={`${h.kind}-${h.id}`}>
                  <Link href={h.href} className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 transition hover:border-primary/40 hover:bg-accent/40">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Icon className="size-4" aria-hidden /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate font-medium">{h.title}</span>{h.subtitle && <span className="block truncate text-sm text-muted-foreground">{h.subtitle}</span>}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
