import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { GoalsView } from "@/features/goals/goals-view";
import { listGoals } from "@/features/goals/queries";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Goals" };

export default async function GoalsPage() {
  const { supabase } = await getSession();
  return (
    <>
      <PageHeader title="Goals" description="Measurable targets with milestones and a progress history you can look back on." />
      <GoalsView goals={await listGoals(supabase)} />
    </>
  );
}
