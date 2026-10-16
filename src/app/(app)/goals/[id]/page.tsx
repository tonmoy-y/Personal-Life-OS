import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/common/page-header";
import { GoalDetail } from "@/features/goals/goal-detail";
import { getGoal } from "@/features/goals/queries";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Goal" };

export default async function GoalPage({ params }: PageProps<"/goals/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { supabase } = await getSession();
  const data = await getGoal(supabase, id);
  if (!data) notFound();
  return (
    <>
      <PageHeader title={data.goal.title} eyebrow="Goal" />
      <GoalDetail {...data} />
    </>
  );
}
