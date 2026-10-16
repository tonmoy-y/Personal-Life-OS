import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { NoteEditor } from "@/features/notes/note-editor";
import { getNote } from "@/features/notes/queries";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Note" };

export default async function NotePage({ params }: PageProps<"/notes/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { supabase } = await getSession();
  const note = await getNote(supabase, id);
  if (!note) notFound();
  return (
    <>
      <Link href="/notes" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> All notes</Link>
      <NoteEditor key={note.id} note={note} />
    </>
  );
}
