import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { listProjects } from "@/features/projects/queries";
import { ProjectsGrid } from "@/features/projects/projects-grid";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const { supabase } = await getSession();
  const projects = await listProjects(supabase);
  return (
    <>
      <PageHeader title="Projects" description="Bigger outcomes, broken into tasks and milestones. Progress comes from real task completion." />
      <ProjectsGrid projects={projects} />
    </>
  );
}
