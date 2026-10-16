import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { listTasks, parseTaskFilters, taskFilterOptions } from "@/features/tasks/queries";
import { TasksView } from "@/features/tasks/tasks-view";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const sp = await searchParams;
  const { supabase, profile } = await getSession();
  const filters = parseTaskFilters(sp);
  const layout = sp.layout === "board" ? "board" : "list";
  const [tasks, options] = await Promise.all([listTasks(supabase, profile.timezone, filters), taskFilterOptions(supabase)]);
  return (
    <>
      <PageHeader title="Tasks" description="Everything on your plate — filter, search, and move work across your board." />
      <TasksView tasks={tasks} filters={filters} layout={layout} options={options} />
    </>
  );
}
