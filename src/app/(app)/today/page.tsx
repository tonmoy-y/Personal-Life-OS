import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { DailySummary, DashboardWidgets } from "@/features/dashboard/dashboard-view";
import { loadDashboard } from "@/features/dashboard/queries";
import { formatLocalDate } from "@/lib/dates";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Today" };

/** Today: the focused day plan — overdue work, today's tasks, events and habits (no spending). */
export default async function TodayPage() {
  const { supabase, profile } = await getSession();
  const d = await loadDashboard(supabase, profile.timezone, profile.currency);
  return (
    <>
      <PageHeader eyebrow="Today" title={formatLocalDate(d.today, { weekday: "long", month: "long", day: "numeric" })} description={<DailySummary d={d} tz={profile.timezone} />} />
      <DashboardWidgets d={d} widgets={["tasks", "events", "habits"]} tz={profile.timezone} currency={profile.currency} fullTasks />
    </>
  );
}
