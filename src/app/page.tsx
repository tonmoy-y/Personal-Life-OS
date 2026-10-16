import Link from "next/link";
import { BarChart3, CalendarDays, Flame, ListChecks, NotebookText, ShieldCheck, Target, Wallet } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: ListChecks, title: "Tasks that repeat correctly", text: "Priorities, projects, recurrence rules, list and board views." },
  { icon: CalendarDays, title: "A calendar that knows your timezone", text: "Month, week and agenda views with deadlines in one place." },
  { icon: Flame, title: "Honest habit streaks", text: "Streaks follow each habit’s own schedule and your local date." },
  { icon: Target, title: "Goals you can measure", text: "Targets, milestones and a progress history you can look back on." },
  { icon: NotebookText, title: "A Markdown knowledge vault", text: "Tag, pin and link notes — with conflict-safe autosave." },
  { icon: Wallet, title: "Money without the noise", text: "Income, expenses and budgets. No bank connections, ever." },
  { icon: BarChart3, title: "Analytics from real records", text: "Every chart states exactly how it is calculated." },
  { icon: ShieldCheck, title: "Private by design", text: "Row-level security on every table. Export or delete any time." },
];

export default function Home() {
  return (
    <div className="paper-grain min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav aria-label="Account" className="flex items-center gap-2">
          <Button variant="ghost" asChild><Link href="/login">Sign in</Link></Button>
          <Button asChild><Link href="/signup">Get started</Link></Button>
        </nav>
      </header>
      <main id="main">
        <section className="mx-auto max-w-4xl px-5 pb-16 pt-14 text-center sm:pt-24">
          <p className="mb-4 inline-block rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">Free · private · no paid AI required</p>
          <h1 className="text-balance text-5xl font-semibold leading-[1.05] sm:text-7xl">Run your life from <em className="text-primary not-italic">one calm place</em>.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">Personal Life OS brings your tasks, calendar, habits, goals, projects, notes and money together — a focused workspace that is yours alone.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="h-11 px-6 text-base" asChild><Link href="/signup">Create your account</Link></Button>
            <Button size="lg" variant="outline" className="h-11 px-6 text-base" asChild><Link href="/login">Sign in</Link></Button>
          </div>
        </section>
        <section aria-label="Features" className="mx-auto max-w-6xl px-5 pb-20">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="rounded-2xl border bg-card p-5">
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground"><f.icon className="size-5" aria-hidden /></div>
                <h2 className="font-sans text-base font-semibold">{f.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <Link href="/privacy" className="underline-offset-4 hover:underline">Privacy notice</Link>
      </footer>
    </div>
  );
}
