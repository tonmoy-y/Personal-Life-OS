import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, Check, Flame, LayoutDashboard, ListChecks, NotebookText, ShieldCheck, Target, Wallet } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

// Depends on the visitor's session (header buttons), so never prerender.
export const dynamic = "force-dynamic";

async function isSignedIn(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return Boolean(data.user);
  } catch {
    return false;
  }
}

const FEATURES = [
  { icon: ListChecks, title: "Tasks that repeat correctly", text: "Priorities, projects, recurrence rules, list and board views.", span: "lg:col-span-2" },
  { icon: CalendarDays, title: "A calendar that knows your timezone", text: "Month, week and agenda views with every deadline in one place.", span: "" },
  { icon: Flame, title: "Honest habit streaks", text: "Streaks follow each habit’s own schedule and your local date.", span: "" },
  { icon: Target, title: "Goals you can measure", text: "Targets, milestones and a progress history you can look back on.", span: "lg:col-span-2" },
  { icon: NotebookText, title: "A Markdown knowledge vault", text: "Tag, pin and search notes, with conflict-safe autosave.", span: "" },
  { icon: Wallet, title: "Money without the noise", text: "Income, expenses and budgets. No bank connections, ever.", span: "" },
  { icon: BarChart3, title: "Analytics from real records", text: "Every chart states exactly how it is calculated.", span: "lg:col-span-2" },
  { icon: ShieldCheck, title: "Private by design", text: "Row-level security on every table. Export or delete any time.", span: "lg:col-span-2" },
];

function Preview() {
  return (
    <div aria-hidden className="relative mx-auto mt-16 max-w-5xl">
      <div className="absolute -inset-x-6 -inset-y-8 -z-10 rounded-[2.5rem] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-primary/10 ring-1 ring-foreground/5">
        <div className="flex items-center gap-1.5 border-b bg-muted/60 px-4 py-3">
          <span className="size-2.5 rounded-full bg-destructive/60" /><span className="size-2.5 rounded-full bg-warning/70" /><span className="size-2.5 rounded-full bg-success/70" />
          <span className="mx-auto rounded-md bg-background px-10 py-0.5 text-[11px] text-muted-foreground">personallifeos.tonmoyy.dev</span>
        </div>
        <div className="grid gap-5 p-6 text-left sm:grid-cols-[1.4fr_1fr] sm:p-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Saturday, 17 October</p>
            <p className="mt-1 font-heading text-4xl leading-none sm:text-5xl">Good morning, <em>Tonmoy</em></p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[["4", "Due today"], ["2/3", "Habits"], ["68%", "Goal"]].map(([n, l]) => (
                <div key={l} className="rounded-2xl border bg-background/70 p-3"><p className="font-heading text-3xl leading-none">{n}</p><p className="mt-1 text-xs text-muted-foreground">{l}</p></div>
              ))}
            </div>
            <ul className="mt-5 grid gap-2 text-sm">
              {["Plan the week", "Send project update", "Read 20 pages"].map((t, i) => (
                <li key={t} className="flex items-center gap-3 rounded-xl border bg-background/70 px-3 py-2.5">
                  <span className={`flex size-5 items-center justify-center rounded-full border ${i === 0 ? "border-primary bg-primary text-primary-foreground" : ""}`}>{i === 0 && <Check className="size-3" />}</span>
                  <span className={i === 0 ? "text-muted-foreground line-through" : ""}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid content-start gap-3">
            <div className="rounded-2xl border bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">This month</p>
              <p className="font-heading text-3xl">৳ 18,400</p>
              <div className="mt-3 h-1.5 rounded-full bg-muted"><div className="h-full w-2/3 rounded-full bg-primary" /></div>
              <p className="mt-1.5 text-xs text-muted-foreground">66% of budget</p>
            </div>
            <div className="rounded-2xl border bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Upcoming</p>
              <ul className="mt-2 grid gap-2 text-sm">
                <li className="flex justify-between"><span>Design review</span><span className="text-muted-foreground">10:30</span></li>
                <li className="flex justify-between"><span>Gym</span><span className="text-muted-foreground">18:00</span></li>
              </ul>
            </div>
            <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
              <Flame className="size-5" /><p className="mt-2 font-heading text-3xl leading-none">12 days</p><p className="text-xs opacity-80">Current streak</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  const signedIn = await isSignedIn();
  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="sticky top-0 z-40 border-b border-transparent bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="Life OS home"><Logo /></Link>
          <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#privacy" className="hover:text-foreground">Privacy</a>
          </nav>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <Button asChild><Link href="/dashboard"><LayoutDashboard /> Open dashboard</Link></Button>
            ) : (
              <>
                <Button variant="ghost" asChild><Link href="/login">Sign in</Link></Button>
                <Button asChild><Link href="/signup">Get started</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main">
        <section className="relative px-5 pb-10 pt-16 text-center sm:pt-24">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]" />
          <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
            <span className="size-1.5 rounded-full bg-success" /> Free · private · no paid AI required
          </p>
          <h1 className="mx-auto max-w-4xl text-balance text-6xl leading-[0.98] tracking-tight sm:text-8xl">
            Run your life from <em className="text-primary">one calm place.</em>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Tasks, calendar, habits, goals, projects, notes and money, together in a focused workspace that is yours alone.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {signedIn ? (
              <Button size="lg" className="h-12 rounded-full px-7 text-base" asChild><Link href="/dashboard">Open your dashboard <ArrowRight /></Link></Button>
            ) : (
              <>
                <Button size="lg" className="h-12 rounded-full px-7 text-base" asChild><Link href="/signup">Create your account <ArrowRight /></Link></Button>
                <Button size="lg" variant="outline" className="h-12 rounded-full px-7 text-base" asChild><Link href="/login">Sign in</Link></Button>
              </>
            )}
          </div>
          <Preview />
        </section>

        <section id="features" aria-label="Features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Everything in one place</p>
            <h2 className="mt-3 text-balance text-4xl leading-tight sm:text-6xl">Built for the way a life actually runs</h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <li key={f.title} className={`group rounded-3xl border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary/40 ${f.span}`}>
                <div className="mb-8 flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition group-hover:bg-primary group-hover:text-primary-foreground"><f.icon className="size-5" aria-hidden /></div>
                <h3 className="font-heading text-2xl leading-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="privacy" className="mx-auto max-w-6xl px-5 pb-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-8 py-16 text-center text-primary-foreground sm:px-16">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-primary-foreground/10" />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 size-72 rounded-full bg-primary-foreground/5" />
            <h2 className="relative mx-auto max-w-2xl text-balance text-4xl leading-tight sm:text-6xl">Your data is yours. Always.</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">Every table is locked to its owner with row-level security. Export everything as JSON or CSV, or delete your account and all its data, whenever you like.</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="secondary" className="h-12 rounded-full px-7 text-base" asChild>
                <Link href={signedIn ? "/dashboard" : "/signup"}>{signedIn ? "Open dashboard" : "Start for free"} <ArrowRight /></Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground">
          <Logo className="text-base" />
          <Link href="/privacy" className="underline-offset-4 hover:underline">Privacy notice</Link>
        </div>
      </footer>
    </div>
  );
}
