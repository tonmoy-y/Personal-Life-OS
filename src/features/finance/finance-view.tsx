"use client";
import { useEffect, useMemo, useState } from "react";
import { mergeParams } from "@/lib/url";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Download, Pencil, Plus, Search, Trash2, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Field, selectClass } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { useAppData } from "@/components/layout/app-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { addMonths, formatLocalDate } from "@/lib/dates";
import { budgetUsage, categoryBreakdown, monthlyTrend, totals, type Txn } from "@/lib/finance";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Budget, Transaction } from "@/types/db";
import { deleteBudget, deleteTransaction, upsertBudget } from "./actions";
import type { FinanceFilters } from "./queries";
import { EXPENSE_CATEGORIES } from "./schema";
import { TransactionFormDialog } from "./transaction-form-dialog";

interface Props {
  filters: FinanceFilters;
  transactions: Transaction[];
  trendTxns: Pick<Transaction, "type" | "amount_minor" | "occurred_on" | "category">[];
  budgets: Budget[];
  otherCurrencyCount: number;
  knownCategories: string[];
}

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 };

export function FinanceView({ filters, transactions, trendTxns, budgets, otherCurrencyCount, knownCategories }: Props) {
  const { profile } = useAppData();
  const cur = profile.currency;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { exec } = useAction();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [creating, setCreating] = useState<"income" | "expense" | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [budgetDlg, setBudgetDlg] = useState(false);
  const [q, setQ] = useState(filters.q ?? "");

  const setParam = (updates: Record<string, string | null>) => {
    const next = mergeParams(params, updates);
    router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false });
  };
  useEffect(() => {
    if ((filters.q ?? "") === q.trim()) return;
    const t = setTimeout(() => setParam({ q: q.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const t = totals(transactions as Txn[]);
  const breakdown = useMemo(() => categoryBreakdown(transactions as Txn[]), [transactions]);
  const trend = useMemo(() => monthlyTrend(trendTxns as Txn[], filters.rangeMode ? filters.to : filters.month, 6), [trendTxns, filters]);
  const usage = useMemo(() => budgetUsage(budgets, transactions as Txn[]), [budgets, transactions]);
  const monthKey = filters.month.slice(0, 7);
  const csvHref = `/api/export/transactions?${new URLSearchParams({ from: filters.from, to: filters.to, ...(filters.type ? { type: filters.type } : {}), ...(filters.category ? { category: filters.category } : {}) })}`;
  const money = (n: number) => formatMoney(n, cur);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {filters.q && (
        <p role="status" className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
          Showing matches for “{filters.q}” from <strong>all dates</strong>. Clear the search box to go back to {filters.rangeMode ? "your date range" : "the selected month"}.
        </p>
      )}
      {otherCurrencyCount > 0 && (
        <p role="note" className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
          {otherCurrencyCount} transaction{otherCurrencyCount > 1 ? "s are" : " is"} recorded in a different currency than your current setting ({cur}) and {otherCurrencyCount > 1 ? "are" : "is"} excluded from these totals. Amounts are never converted.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-2 [&>*]:max-w-full" role="search" aria-label="Finance filters">
        {!filters.rangeMode ? (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => setParam({ month: addMonths(filters.month, -1).slice(0, 7), from: null, to: null })}><ChevronLeft /></Button>
            <Input aria-label="Month" type="month" value={monthKey} onChange={(e) => e.target.value && setParam({ month: e.target.value })} className="h-8 w-40" />
            <Button variant="outline" size="icon" aria-label="Next month" onClick={() => setParam({ month: addMonths(filters.month, 1).slice(0, 7), from: null, to: null })}><ChevronRight /></Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Input aria-label="From date" type="date" value={filters.from} onChange={(e) => e.target.value && setParam({ from: e.target.value })} className="h-8" />
            <span aria-hidden>–</span>
            <Input aria-label="To date" type="date" value={filters.to} onChange={(e) => e.target.value && setParam({ to: e.target.value })} className="h-8" />
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => (filters.rangeMode ? setParam({ from: null, to: null }) : setParam({ from: filters.from, to: filters.to }))}>{filters.rangeMode ? "Use month" : "Custom range"}</Button>
        <select aria-label="Type" className={cn(selectClass, "w-auto")} value={filters.type ?? ""} onChange={(e) => setParam({ type: e.target.value || null })}>
          <option value="">Income & expenses</option><option value="expense">Expenses only</option><option value="income">Income only</option>
        </select>
        <select aria-label="Category" className={cn(selectClass, "w-auto")} value={filters.category ?? ""} onChange={(e) => setParam({ category: e.target.value || null })}>
          <option value="">All categories</option>{knownCategories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <div className="relative min-w-40 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" aria-hidden />
          <Input aria-label="Search transactions" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 pl-8" />
        </div>
        <Button variant="outline" asChild><a href={csvHref} download><Download /> CSV</a></Button>
        <Button onClick={() => setCreating("expense")}><Plus /> Add</Button>
      </div>

      <section aria-label="Totals" className="grid gap-3 sm:grid-cols-3">
        <Stat label="Income" value={money(t.income)} icon={<ArrowUpRight className="size-4 text-success" aria-hidden />} />
        <Stat label="Expenses" value={money(t.expense)} icon={<ArrowDownRight className="size-4 text-destructive" aria-hidden />} />
        <Stat label="Net" value={money(t.net)} tone={t.net < 0 ? "bad" : "good"} />
      </section>

      {!filters.rangeMode && (
        <section aria-labelledby="fin-budgets" className="rounded-3xl border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="fin-budgets" className="text-2xl">Budgets · {formatLocalDate(filters.month, { month: "long", year: "numeric" })}</h2>
              <p className="text-xs text-muted-foreground">Limits you set per category, compared with actual expenses this month. Budgets are not transactions.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setBudgetDlg(true)}><Plus /> Set budget</Button>
          </div>
          {usage.length === 0 ? <p className="text-sm text-muted-foreground">No budgets for this month yet.</p> : (
            <ul className="grid gap-3 md:grid-cols-2">
              {usage.map((u, i) => (
                <li key={u.category}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium">{u.category}</span>
                    <span className={cn("tabular text-xs", u.over ? "font-medium text-destructive" : "text-muted-foreground")}>{money(u.spent)} / {money(u.limit)}</span>
                  </div>
                  <Progress value={Math.min(100, u.pct * 100)} aria-label={`${u.category} budget used`} className={cn(u.over && "[&>div]:bg-destructive", !u.over && u.pct >= 0.8 && "[&>div]:bg-warning")} />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>{u.over ? `Over by ${money(-u.remaining)}` : `${money(u.remaining)} left`} · {Math.round(u.pct * 100)}%</span>
                    <button className="inline-flex items-center gap-1 hover:text-destructive" aria-label={`Remove ${u.category} budget`} onClick={() => void exec(() => deleteBudget(budgets[i].id), { success: "Budget removed" })}><Trash2 className="size-3" /> Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="fin-cat" className="rounded-3xl border bg-card p-4">
          <h2 id="fin-cat" className="text-2xl">Spending by category</h2>
          <p className="mb-2 text-xs text-muted-foreground">Expenses in the selected period.</p>
          {breakdown.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No expenses in this period.</p> : (
            <div className="h-64" role="img" aria-label={`Spending by category: ${breakdown.map((b) => `${b.category} ${money(b.total)}`).join(", ")}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tickFormatter={(v) => formatMoney(Number(v), cur, { compact: true })} tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                  <YAxis type="category" dataKey="category" width={90} tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                  <Tooltip formatter={(v) => [money(Number(v)), "Spent"]} contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="total" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
        <section aria-labelledby="fin-trend" className="rounded-3xl border bg-card p-4">
          <h2 id="fin-trend" className="text-2xl">Month-to-month</h2>
          <p className="mb-2 text-xs text-muted-foreground">Income vs expenses, last 6 months.</p>
          {trend.every((m) => m.income === 0 && m.expense === 0) ? <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p> : (
            <div className="h-64" role="img" aria-label={`Monthly income and expenses: ${trend.map((m) => `${m.month} income ${money(m.income)}, expenses ${money(m.expense)}`).join("; ")}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend.map((m) => ({ month: m.month.slice(2), Income: m.income, Expenses: m.expense }))} margin={{ left: -8, right: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                  <YAxis tickFormatter={(v) => formatMoney(Number(v), cur, { compact: true })} tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                  <Tooltip formatter={(v) => money(Number(v))} contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                  <Legend />
                  <Bar dataKey="Income" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section aria-labelledby="fin-tx">
        <h2 id="fin-tx" className="mb-2 text-2xl">Transactions <span className="text-sm font-normal text-muted-foreground tabular">({transactions.length})</span></h2>
        {transactions.length === 0 ? (
          <EmptyState icon={Wallet} title="No transactions in this period" description="Record income and expenses to see totals, budgets and trends. Nothing is imported automatically."
            action={<Button onClick={() => setCreating("expense")}><Plus /> Add transaction</Button>} />
        ) : (
          <div className="relative overflow-x-auto rounded-3xl border bg-card">
            <table className="w-full min-w-[34rem] text-sm">
              <caption className="sr-only">Transactions for the selected period</caption>
              <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground"><tr><th scope="col" className="px-3 py-2 font-medium">Date</th><th scope="col" className="px-3 py-2 font-medium">Category</th><th scope="col" className="px-3 py-2 font-medium">Description</th><th scope="col" className="px-3 py-2 text-right font-medium">Amount</th><th scope="col" className="w-20 px-3 py-2"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {transactions.map((x) => (
                  <tr key={x.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatLocalDate(x.occurred_on, { month: "short", day: "numeric" })}</td>
                    <td className="px-3 py-2">{x.category}{x.payment_method && <span className="ml-1.5 text-xs text-muted-foreground">· {x.payment_method}</span>}</td>
                    <td className="max-w-56 truncate px-3 py-2 text-muted-foreground">{x.description}</td>
                    <td className={cn("whitespace-nowrap px-3 py-2 text-right font-medium tabular", x.type === "income" ? "text-success" : "")}>{x.type === "income" ? "+" : "−"}{money(x.amount_minor)}</td>
                    <td className="px-3 py-1 text-right"><Button variant="ghost" size="icon-xs" aria-label={`Edit ${x.category} transaction`} onClick={() => setEditing(x)}><Pencil /></Button><Button variant="ghost" size="icon-xs" aria-label={`Delete ${x.category} transaction`} onClick={() => setDeleting(x)}><Trash2 /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <TransactionFormDialog open={!!creating} onOpenChange={(o) => !o && setCreating(null)} defaultType={creating ?? "expense"} />
      {editing && <TransactionFormDialog open onOpenChange={(o) => !o && setEditing(null)} txn={editing} />}
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete this transaction?" description={deleting ? `${deleting.category} · ${money(deleting.amount_minor)} on ${deleting.occurred_on} will be permanently deleted.` : ""}
        onConfirm={() => { if (deleting) void exec(() => deleteTransaction(deleting.id), { success: "Transaction deleted" }); }} />
      <BudgetDialog open={budgetDlg} onOpenChange={setBudgetDlg} month={monthKey} categories={[...new Set([...EXPENSE_CATEGORIES, ...knownCategories])]} />
    </div>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon?: React.ReactNode; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-3xl border bg-card p-4">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">{icon}{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular", tone === "bad" && "text-destructive")}>{value}</p>
    </div>
  );
}

function BudgetDialog({ open, onOpenChange, month, categories }: { open: boolean; onOpenChange: (o: boolean) => void; month: string; categories: string[] }) {
  const { profile } = useAppData();
  const { exec, pending } = useAction();
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState<string>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(undefined);
    const res = await exec(() => upsertBudget({ month, category, amount }), { success: "Budget saved", silent: true });
    if (res.ok) { setCategory(""); setAmount(""); onOpenChange(false); } else setErr(res.error);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Set a budget</DialogTitle><DialogDescription>Monthly spending limit for {month}. Setting it again updates the limit.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <Field id="bd-cat" label="Category" required><Input id="bd-cat" list="bd-cats" value={category} onChange={(e) => setCategory(e.target.value)} autoFocus /><datalist id="bd-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></Field>
          <Field id="bd-amt" label={`Monthly limit (${profile.currency})`} required error={err}><Input id="bd-amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <DialogFooter><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={pending || !category.trim() || !amount.trim()}>Save budget</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
