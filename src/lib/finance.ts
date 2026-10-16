import { addMonths, monthStart, type LocalDate } from "./dates";

export interface Txn {
  type: "income" | "expense";
  amount_minor: number;
  occurred_on: LocalDate;
  category: string;
}

export interface BudgetRow {
  category: string;
  limit_minor: number;
}

export const normCategory = (c: string) => c.trim().toLowerCase();

/** "YYYY-MM" key for a local date. */
export const monthKey = (d: LocalDate) => d.slice(0, 7);

export function totals(txns: readonly Txn[]) {
  let income = 0;
  let expense = 0;
  for (const t of txns) {
    if (t.type === "income") income += t.amount_minor;
    else expense += t.amount_minor;
  }
  return { income, expense, net: income - expense };
}

export function inMonth(txns: readonly Txn[], month: LocalDate): Txn[] {
  const key = monthKey(month);
  return txns.filter((t) => monthKey(t.occurred_on) === key);
}

/** Expense totals per category (display-cased by first occurrence), sorted descending. */
export function categoryBreakdown(txns: readonly Txn[]): { category: string; total: number }[] {
  const map = new Map<string, { category: string; total: number }>();
  for (const t of txns) {
    if (t.type !== "expense") continue;
    const k = normCategory(t.category);
    const cur = map.get(k) ?? { category: t.category.trim(), total: 0 };
    cur.total += t.amount_minor;
    map.set(k, cur);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export interface BudgetUsage {
  category: string;
  limit: number;
  spent: number;
  remaining: number; // negative when over budget
  pct: number; // spent / limit, uncapped (1.25 = 125%)
  over: boolean;
}

/** Budget usage for a month. `monthTxns` must already be filtered to that month. Only expenses count. */
export function budgetUsage(budgets: readonly BudgetRow[], monthTxns: readonly Txn[]): BudgetUsage[] {
  const spentBy = new Map<string, number>();
  for (const t of monthTxns) {
    if (t.type !== "expense") continue;
    spentBy.set(normCategory(t.category), (spentBy.get(normCategory(t.category)) ?? 0) + t.amount_minor);
  }
  return budgets.map((b) => {
    const spent = spentBy.get(normCategory(b.category)) ?? 0;
    return {
      category: b.category,
      limit: b.limit_minor,
      spent,
      remaining: b.limit_minor - spent,
      pct: b.limit_minor > 0 ? spent / b.limit_minor : 0,
      over: spent > b.limit_minor,
    };
  });
}

/** Last `count` months ending at `endMonth` (inclusive), oldest first, with income/expense/net per month. */
export function monthlyTrend(txns: readonly Txn[], endMonth: LocalDate, count: number) {
  const out: { month: string; income: number; expense: number; net: number }[] = [];
  const start = monthStart(endMonth);
  const byMonth = new Map<string, Txn[]>();
  for (const t of txns) {
    const k = monthKey(t.occurred_on);
    byMonth.set(k, [...(byMonth.get(k) ?? []), t]);
  }
  for (let i = count - 1; i >= 0; i--) {
    const m = addMonths(start, -i);
    const key = monthKey(m);
    out.push({ month: key, ...totals(byMonth.get(key) ?? []) });
  }
  return out;
}
