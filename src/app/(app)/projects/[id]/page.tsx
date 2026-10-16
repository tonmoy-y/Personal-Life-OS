import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { getProject } from "@/features/projects/queries";
import { ProjectDetail } from "@/features/projects/project-detail";
import { getSession } from "@/lib/session";
import { z } from "zod";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { supabase } = await getSession();
  const data = await getProject(supabase, id);
  if (!data) notFound();
  return (
    <>
      <PageHeader title={data.project.title} eyebrow="Project" />
      <ProjectDetail {...data} />
    </>
  );
}
