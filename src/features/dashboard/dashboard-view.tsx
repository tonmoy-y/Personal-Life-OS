import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, Flame, Target, Wallet } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { Progress } from "@/components/ui/progress";
import { formatLocalDate, formatTime, utcToLocal } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { fmtNum } from "@/lib/goals";
import { cn } from "@/lib/utils";
import { HabitCheckList } from "./habit-check-list";
import type { DashboardData } from "./queries";
import { QuickAddTask } from "@/features/tasks/quick-add-task";
import { TaskItem } from "@/features/tasks/task-item";

function Card({ title, href, hrefLabel, children, className, id }: { title: string; href?: string; hrefLabel?: string; children: React.ReactNode; className?: string; id: string }) {
  return (
    <section aria-labelledby={id} className={cn("rise-in rounded-3xl border bg-card p-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id={id} className="text-2xl">{title}</h2>
        {href && <Link href={href} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">{hrefLabel ?? "View all"} <ArrowRight className="size-3" aria-hidden /></Link>}
      </div>
      {children}
    </section>
  );
}

export function DailySummary({ d, tz, tf = "12h" }: { d: DashboardData; tz: string; tf?: "12h" | "24h" }) {
  const parts: string[] = [];
  const nOpen = d.openToday.length;
  parts.push(nOpen === 0 ? "No open tasks due today" : `${nOpen} task${nOpen > 1 ? "s" : ""} due today${d.minutesPlanned ? ` (~${Math.round((d.minutesPlanned / 60) * 10) / 10}h planned)` : ""}`);
  if (d.overdueTasks.length) parts.push(`${d.overdueTasks.length} overdue`);
  if (d.dueHabits.length) parts.push(`${d.habitsDone} of ${d.dueHabits.length} habits done`);
  const next = d.upcomingEvents[0];
  if (next) { const s = utcToLocal(next.start_at, tz); parts.push(`next event “${next.title}” ${s.date === d.today ? "at " + formatTime(s.time, tf) : "on " + formatLocalDate(s.date)}`); }
  return <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{parts.join(" · ")}.</p>;
}

export function DashboardHero({ d, eyebrow, title, tz, tf, currency, summary }: { d: DashboardData; eyebrow: string; title: string; tz: string; tf: "12h" | "24h"; currency: string; summary: boolean }) {
  const stats = [
    { label: "Due today", value: String(d.openToday.length), href: "/tasks?view=today", icon: CheckCircle2, tone: "" },
    { label: "Overdue", value: String(d.overdueTasks.length), href: "/tasks?view=overdue", icon: CalendarClock, tone: d.overdueTasks.length ? "text-destructive" : "" },
    { label: "Habits today", value: d.dueHabits.length ? `${d.habitsDone}/${d.dueHabits.length}` : "–", href: "/habits", icon: Flame, tone: "" },
    { label: "Spent this month", value: formatMoney(d.spend.expense, currency), href: "/finance", icon: Wallet, tone: "" },
  ];
  return (
    <section aria-label="Overview" className="rise-in relative mb-6 overflow-hidden rounded-3xl border bg-card p-6 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-chart-2/10 blur-3xl" />
      <p className="relative text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
      <h1 className="relative mt-2 text-balance text-5xl leading-[1.02] sm:text-6xl">{title}</h1>
      {summary && <div className="relative mt-3 max-w-2xl"><DailySummary d={d} tz={tz} tf={tf} /></div>}
      <ul className="relative mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="group block rounded-2xl border bg-background/70 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/40">
              <span className="flex items-center justify-between text-xs text-muted-foreground">{s.label}<s.icon className="size-4 transition group-hover:text-primary" aria-hidden /></span>
              <span className={cn("mt-2 block font-heading text-4xl leading-none tabular", s.tone)}>{s.value}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DashboardWidgets({ d, widgets, tz, currency, tf = "12h", fullTasks = false }: { d: DashboardData; widgets: string[]; tz: string; currency: string; tf?: "12h" | "24h"; fullTasks?: boolean }) {
  const show = (id: string) => widgets.includes(id);
  const money = (n: number) => formatMoney(n, currency);
  const over = d.budgets.filter((b) => b.over);
  return (
    <div className="grid gap-4 lg:grid-cols-6">
      {show("tasks") && (
        <Card id="w-tasks" title="Today’s tasks" href="/tasks?view=today" className="lg:col-span-4">
          <div className="mb-3"><QuickAddTask dueDate={d.today} placeholder="Add a task for today…" /></div>
          {d.overdueTasks.length > 0 && (
            <div className="mb-3">
              <h3 className="mb-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-destructive">Overdue · {d.overdueTasks.length}</h3>
              <ul className="grid gap-1.5">{d.overdueTasks.slice(0, fullTasks ? 20 : 4).map((t) => <TaskItem key={t.id} task={t} compact />)}</ul>
              {!fullTasks && d.overdueTasks.length > 4 && <Link href="/tasks?view=overdue" className="mt-1 inline-block text-xs text-muted-foreground hover:underline">+{d.overdueTasks.length - 4} more overdue</Link>}
            </div>
          )}
          {d.todayTasks.length === 0 && d.overdueTasks.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="A clear day" description="Nothing due today. Add a task above or plan ahead in Tasks." className="py-6" />
          ) : d.todayTasks.length > 0 ? (
            <ul className="grid gap-1.5">{d.todayTasks.map((t) => <TaskItem key={t.id} task={t} compact />)}</ul>
          ) : null}
        </Card>
      )}

      <div className="grid content-start gap-4 lg:col-span-2">
        {show("events") && (
          <Card id="w-events" title="Upcoming events" href="/calendar?view=agenda" hrefLabel="Calendar">
            {d.upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled in the next 7 days. <Link href="/calendar" className="underline">Open calendar</Link></p>
            ) : (
              <ul className="grid gap-2">
                {d.upcomingEvents.slice(0, 5).map((e) => {
                  const s = utcToLocal(e.start_at, tz);
                  return (
                    <li key={e.id} className="flex items-start gap-2.5 text-sm">
                      <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0"><span className="block truncate font-medium">{e.title}</span><span className="text-xs text-muted-foreground">{s.date === d.today ? "Today" : formatLocalDate(s.date, { weekday: "short", month: "short", day: "numeric" })}{e.all_day ? " · All day" : ` · ${formatTime(s.time, tf)}`}</span></span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        )}
        {show("habits") && (
          <Card id="w-habits" title="Habits" href="/habits">
            {d.dueHabits.length === 0 ? (
              <p className="text-sm text-muted-foreground">{d.habits.length === 0 ? <>No habits yet. <Link href="/habits" className="underline">Start one</Link></> : "No habits scheduled today."}</p>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2 text-sm"><Flame className="size-4 text-warning" aria-hidden /><span className="tabular font-medium">{d.habitsDone}/{d.dueHabits.length}</span><span className="text-muted-foreground">done today</span></div>
                <Progress value={(d.habitsDone / d.dueHabits.length) * 100} aria-label="Habit progress today" className="mb-2" />
                <HabitCheckList stats={d.dueHabits} today={d.today} />
              </>
            )}
          </Card>
        )}
      </div>

      {show("goals") && (
        <Card id="w-goals" title="Goal progress" href="/goals" className="lg:col-span-3">
          {d.activeGoals.length === 0 ? <p className="text-sm text-muted-foreground">No active goals. <Link href="/goals" className="underline">Set one</Link></p> : (
            <ul className="grid gap-3">
              {d.activeGoals.slice(0, 4).map(({ goal: g, progress }) => (
                <li key={g.id}>
                  <Link href={`/goals/${g.id}`} className="block rounded outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm"><span className="flex min-w-0 items-center gap-1.5"><Target className="size-3.5 shrink-0 text-chart-3" aria-hidden /><span className="truncate font-medium">{g.title}</span></span><span className="tabular text-xs text-muted-foreground">{fmtNum(g.current_value)}/{fmtNum(g.target_value)} {g.unit} · {Math.round(progress * 100)}%</span></div>
                    <Progress value={progress * 100} aria-label={`${g.title} progress`} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {show("spending") && (
        <Card id="w-spending" title="This month’s spending" href="/finance" hrefLabel="Finance" className="lg:col-span-3">
          <div className="flex items-end justify-between gap-3">
            <div><p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Wallet className="size-4" aria-hidden />Spent</p><p className="text-2xl font-semibold tabular">{money(d.spend.expense)}</p></div>
            <div className="text-right text-sm"><p className="text-muted-foreground">Income</p><p className="font-medium tabular text-success">{money(d.spend.income)}</p></div>
          </div>
          {d.budgets.length > 0 ? (
            <ul className="mt-3 grid gap-2">
              {d.budgets.slice(0, 3).map((b) => (
                <li key={b.category}>
                  <div className="mb-1 flex justify-between text-xs"><span>{b.category}</span><span className={cn("tabular", b.over ? "font-medium text-destructive" : "text-muted-foreground")}>{Math.round(b.pct * 100)}% of {money(b.limit)}</span></div>
                  <Progress value={Math.min(100, b.pct * 100)} aria-label={`${b.category} budget`} className={cn(b.over && "[&>div]:bg-destructive")} />
                </li>
              ))}
              {over.length > 0 && <li className="text-xs text-destructive">{over.length} budget{over.length > 1 ? "s" : ""} exceeded</li>}
            </ul>
          ) : <p className="mt-3 text-sm text-muted-foreground">No budgets set for this month. <Link href="/finance" className="underline">Add one</Link></p>}
        </Card>
      )}
    </div>
  );
}
