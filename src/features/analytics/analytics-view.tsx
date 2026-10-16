"use client";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppData } from "@/components/layout/app-data";
import { formatMoney } from "@/lib/money";
import { RANGES } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { AnalyticsData } from "./queries";

const tip = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" };
const axis = { tickLine: false, axisLine: false, fontSize: 12, stroke: "var(--muted-foreground)" } as const;

function Panel({ id, title, note, children, className }: { id: string; title: string; note: string; children: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn("rounded-3xl border bg-card p-4", className)}>
      <h2 id={id} className="text-2xl">{title}</h2>
      <p className="mb-3 text-xs text-muted-foreground">{note}</p>
      {children}
    </section>
  );
}
const Empty = ({ children }: { children: React.ReactNode }) => <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "bad" }) {
  return (
    <div className="rounded-3xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular", tone === "bad" && "text-destructive")}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function HBars({ rows, label }: { rows: { name: string; value: number | null }[]; label: string }) {
  return (
    <div className="h-auto" role="img" aria-label={`${label}: ${rows.map((r) => `${r.name} ${r.value ?? "no data"}%`).join(", ")}`}>
      <ResponsiveContainer width="100%" height={Math.max(120, rows.length * 38 + 20)}>
        <BarChart data={rows.map((r) => ({ ...r, value: r.value ?? 0 }))} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis type="number" domain={[0, 100]} unit="%" {...axis} />
          <YAxis type="category" dataKey="name" width={110} {...axis} />
          <Tooltip formatter={(v) => [`${v}%`, "Progress"]} contentStyle={tip} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AnalyticsView({ data }: { data: AnalyticsData }) {
  const { profile } = useAppData();
  const cur = profile.currency;
  const money = (n: number) => formatMoney(n, cur);
  const t = data.tasks;
  const s = data.spending;
  const daily = data.days <= 31;

  return (
    <div className="grid gap-4">
      <nav aria-label="Date range" className="flex w-fit gap-1 rounded-xl bg-muted p-1">
        {RANGES.map((r) => (
          <Link key={r} href={`/analytics?range=${r}`} aria-current={data.days === r ? "page" : undefined} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium", data.days === r ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {r === 365 ? "1 year" : `${r} days`}
          </Link>
        ))}
      </nav>
      <p className="-mt-2 text-xs text-muted-foreground">Period: {data.period.from} → {data.period.to} ({profile.timezone}). Days are your local calendar days; weeks start on {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][profile.week_start]}.</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Tasks completed" value={String(t.completed)} sub="Completed in period" />
        <Kpi label="On-time completion" value={t.completionRate === null ? "–" : `${t.completionRate}%`} sub={`${t.dueCompleted} of ${t.dueInPeriod} tasks due in period`} />
        <Kpi label="Overdue now" value={String(t.overdueNow)} tone={t.overdueNow > 0 ? "bad" : undefined} sub="Open tasks past due" />
        <Kpi label="Habit consistency" value={data.habits.consistency === null ? "–" : `${data.habits.consistency}%`} sub="Scheduled days completed" />
        <Kpi label="Spent" value={money(s.expense)} sub={s.change === null ? "No prior-period baseline" : `${s.change > 0 ? "+" : ""}${s.change}% vs previous ${data.days} days`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel id="an-tasks" title="Tasks completed" note={`Count of tasks marked done per ${daily ? "day" : "week"}, by completion date.`}>
          {t.completed === 0 ? <Empty>No tasks completed in this period yet.</Empty> : (
            <div className="h-60" role="img" aria-label={`Tasks completed per ${daily ? "day" : "week"}: ${t.series.map((x) => `${x.label} ${x.completed}`).join(", ")}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={t.series} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" {...axis} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} {...axis} />
                  <Tooltip formatter={(v) => [v, "Completed"]} contentStyle={tip} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="completed" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
        <Panel id="an-spend" title="Income & spending" note={`Recorded transactions per ${daily ? "day" : "week"} in ${cur}.`}>
          {s.expense === 0 && s.income === 0 ? <Empty>No transactions in this period.</Empty> : (
            <div className="h-60" role="img" aria-label={`Income and spending trend: total income ${money(s.income)}, total expenses ${money(s.expense)}`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={s.series} margin={{ left: -8, right: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" {...axis} interval="preserveStartEnd" />
                  <YAxis tickFormatter={(v) => formatMoney(Number(v), cur, { compact: true })} {...axis} />
                  <Tooltip formatter={(v) => money(Number(v))} contentStyle={tip} />
                  <Legend />
                  <Line type="monotone" dataKey="income" name="Income" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expense" name="Expenses" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
        <Panel id="an-habits" title="Habit consistency" note="Share of scheduled days completed per habit in the period.">
          {data.habits.rows.length === 0 ? <Empty>No active habits.</Empty> : <HBars label="Habit completion rate" rows={data.habits.rows.map((h) => ({ name: h.name, value: h.rate }))} />}
        </Panel>
        <Panel id="an-budget" title="Budget usage (this month)" note="Spent ÷ limit for each category budget set for the current month.">
          {s.budgets.length === 0 ? <Empty>No budgets set for this month.</Empty> : (
            <ul className="grid gap-3">
              {s.budgets.map((b) => (
                <li key={b.category}>
                  <div className="mb-1 flex justify-between text-sm"><span>{b.category}</span><span className={cn("tabular", b.over && "font-medium text-destructive")}>{money(b.spent)} / {money(b.limit)} · {Math.round(b.pct * 100)}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${b.category} budget used`} aria-valuenow={Math.min(100, Math.round(b.pct * 100))} aria-valuemin={0} aria-valuemax={100}>
                    <div className={cn("h-full rounded-full", b.over ? "bg-destructive" : b.pct >= 0.8 ? "bg-warning" : "bg-primary")} style={{ width: `${Math.min(100, b.pct * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel id="an-goals" title="Goal progress" note="Current progress of active goals (from start value to target).">
          {data.goals.length === 0 ? <Empty>No active goals.</Empty> : <HBars label="Goal progress" rows={data.goals.map((g) => ({ name: g.title, value: g.progress }))} />}
        </Panel>
        <Panel id="an-projects" title="Project progress" note="Completed tasks ÷ all tasks in each active or planning project.">
          {data.projects.length === 0 ? <Empty>No active projects.</Empty> : <HBars label="Project progress" rows={data.projects.map((p) => ({ name: p.title, value: p.progress }))} />}
        </Panel>
      </div>
    </div>
  );
}
