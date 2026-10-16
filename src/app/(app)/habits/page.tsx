import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { loadHabits } from "@/features/habits/queries";
import { HabitsView } from "@/features/habits/habits-view";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Habits" };

export default async function HabitsPage() {
  const { supabase, profile } = await getSession();
  const { stats, weekly, today } = await loadHabits(supabase, profile.timezone, true);
  return (
    <>
      <PageHeader title="Habits" description="Small things, done consistently. Streaks follow each habit's own schedule and your local date." />
      <HabitsView stats={stats} weekly={weekly} today={today} />
    </>
  );
}
