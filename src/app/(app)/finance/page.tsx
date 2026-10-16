import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { loadFinance, parseFinanceFilters } from "@/features/finance/queries";
import { FinanceView } from "@/features/finance/finance-view";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Finance" };

export default async function FinancePage({ searchParams }: PageProps<"/finance">) {
  const sp = await searchParams;
  const { supabase, profile } = await getSession();
  const filters = parseFinanceFilters(sp, profile.timezone);
  const data = await loadFinance(supabase, profile.currency, filters);
  return (
    <>
      <PageHeader title="Finance" description={`Income, expenses and budgets in ${profile.currency}. Totals are computed from the transactions you record — nothing is estimated or imported.`} />
      <FinanceView filters={filters} {...data} />
    </>
  );
}
