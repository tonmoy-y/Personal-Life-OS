import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addMonths, isLocalDate, monthEnd, monthStart, todayIn, type LocalDate } from "@/lib/dates";
import type { Budget, Transaction } from "@/types/db";
import { likePattern } from "@/lib/like";

export interface FinanceFilters {
  /** First day of the selected month (month mode) */
  month: LocalDate;
  from: LocalDate;
  to: LocalDate;
  rangeMode: boolean;
  type?: "income" | "expense";
  category?: string;
  q?: string;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseFinanceFilters(sp: Record<string, string | string[] | undefined>, tz: string): FinanceFilters {
  const today = todayIn(tz);
  const m = first(sp.month);
  const month = m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) ? `${m}-01` : monthStart(today);
  const f = first(sp.from);
  const t = first(sp.to);
  const rangeMode = !!(f && t && isLocalDate(f) && isLocalDate(t) && f <= t);
  const type = first(sp.type);
  return {
    month, rangeMode,
    from: rangeMode ? f! : month,
    to: rangeMode ? t! : monthEnd(month),
    type: type === "income" || type === "expense" ? type : undefined,
    category: first(sp.category)?.slice(0, 60) || undefined,
    q: first(sp.q)?.slice(0, 100) || undefined,
  };
}

export async function loadFinance(supabase: SupabaseClient, currency: string, f: FinanceFilters) {
  let tq = supabase.from("transactions").select("*").eq("currency", currency).gte("occurred_on", f.from).lte("occurred_on", f.to);
  if (f.type) tq = tq.eq("type", f.type);
  if (f.category) tq = tq.ilike("category", f.category.replace(/[%_\\]/g, ""));
  if (f.q) {
    const p = likePattern(f.q);
    tq = tq.or(`description.ilike."${p}",category.ilike."${p}"`);
  }
  const trendFrom = addMonths(monthStart(f.rangeMode ? f.to : f.month), -5);
  const [tx, trend, bud, other, cats] = await Promise.all([
    tq.order("occurred_on", { ascending: false }).order("created_at", { ascending: false }).limit(1000),
    supabase.from("transactions").select("type, amount_minor, occurred_on, category").eq("currency", currency).gte("occurred_on", trendFrom).lte("occurred_on", monthEnd(f.rangeMode ? f.to : f.month)).limit(20000),
    supabase.from("budgets").select("*").eq("month", f.month).eq("currency", currency).order("category"),
    supabase.from("transactions").select("id", { count: "exact", head: true }).neq("currency", currency),
    supabase.from("transactions").select("category").eq("currency", currency).limit(2000),
  ]);
  if (tx.error) throw new Error(`Failed to load transactions: ${tx.error.message}`);
  return {
    transactions: (tx.data ?? []) as Transaction[],
    trendTxns: (trend.data ?? []) as Pick<Transaction, "type" | "amount_minor" | "occurred_on" | "category">[],
    budgets: (bud.data ?? []) as Budget[],
    otherCurrencyCount: other.count ?? 0,
    knownCategories: [...new Set(((cats.data ?? []) as { category: string }[]).map((c) => c.category))].sort(),
  };
}
