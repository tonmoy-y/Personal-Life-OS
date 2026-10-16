import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { AnalyticsView } from "@/features/analytics/analytics-view";
import { loadAnalytics } from "@/features/analytics/queries";
import { RANGES, type RangeDays } from "@/lib/analytics";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: PageProps<"/analytics">) {
  const sp = await searchParams;
  const r = Number(Array.isArray(sp.range) ? sp.range[0] : sp.range);
  const days: RangeDays = (RANGES as readonly number[]).includes(r) ? (r as RangeDays) : 30;
  const { supabase, profile } = await getSession();
  const data = await loadAnalytics(supabase, profile.timezone, profile.currency, profile.week_start, days);
  return (
    <>
      <PageHeader title="Analytics" description="What your records say about how you’re doing — every number is calculated from your own data over a defined period." />
      <AnalyticsView data={data} />
    </>
  );
}
