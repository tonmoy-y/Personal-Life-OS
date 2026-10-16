import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { allNoteTags, listNotes } from "@/features/notes/queries";
import { NotesList } from "@/features/notes/notes-list";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Notes" };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function NotesPage({ searchParams }: PageProps<"/notes">) {
  const sp = await searchParams;
  const { supabase } = await getSession();
  const q = first(sp.q)?.slice(0, 100) ?? "";
  const tag = first(sp.tag)?.slice(0, 30);
  const archived = first(sp.archived) === "1";
  const [notes, tags] = await Promise.all([listNotes(supabase, { q: q || undefined, tag, archived }), allNoteTags(supabase)]);
  return (
    <>
      <PageHeader title="Notes" description="Your knowledge vault — Markdown, tags, pins, and links to projects and goals." />
      <NotesList notes={notes} tags={tags} q={q} tag={tag} archived={archived} />
    </>
  );
}
