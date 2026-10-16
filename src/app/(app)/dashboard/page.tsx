import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { DailySummary, DashboardWidgets } from "@/features/dashboard/dashboard-view";
import { loadDashboard } from "@/features/dashboard/queries";
import { formatLocalDate, greetingFor } from "@/lib/dates";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { supabase, profile } = await getSession();
  if (!profile.onboarded) redirect("/onboarding");
  const d = await loadDashboard(supabase, profile.timezone, profile.currency);
  const name = profile.display_name?.split(" ")[0];
  const widgets = profile.dashboard_widgets;
  return (
    <>
      <PageHeader eyebrow={formatLocalDate(d.today, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} title={`${greetingFor(profile.timezone)}${name ? `, ${name}` : ""}`} description={widgets.includes("summary") ? <DailySummary d={d} tz={profile.timezone} /> : undefined} />
      <DashboardWidgets d={d} widgets={widgets} tz={profile.timezone} currency={profile.currency} />
    </>
  );
}
