import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchAll } from "@/features/search/queries";
import { SearchResults } from "@/features/search/search-results";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 100);
  const { supabase, profile } = await getSession();
  const hits = q.length >= 2 ? await searchAll(supabase, async () => profile.timezone, q, 25) : [];
  return (
    <>
      <PageHeader title="Search" description={q.length >= 2 ? `${hits.length} result${hits.length === 1 ? "" : "s"} for “${q}” across your tasks, notes, projects, goals, habits, events and transactions.` : "Search across everything you have saved."} />
      <form action="/search" role="search" className="mb-8 flex max-w-xl gap-2">
        <Input name="q" type="search" defaultValue={q} placeholder="Search tasks, notes, projects, goals, money…" aria-label="Search" maxLength={100} autoFocus />
        <Button type="submit">Search</Button>
      </form>
      <SearchResults query={q} hits={hits} />
    </>
  );
}
