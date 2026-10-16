import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = { title: "Help" };

const FAQ: [string, React.ReactNode][] = [
  ["How do recurring tasks work?", "Give a task a due date and a repeat rule. When you complete it, the next occurrence is created once — never on page load. If you finish a task late, missed occurrences are skipped so you don’t get a pile of stale copies."],
  ["How are habit streaks calculated?", "Only the days a habit is scheduled count. A scheduled day you haven’t checked off yet today doesn’t break your streak; a missed scheduled day does. “Today” follows the timezone in Settings."],
  ["Will I get reminders when the app is closed?", "No. Reminders appear in the bell menu, and — if you opt in under Settings — as browser notifications while Life OS is open in a tab. There is no email, SMS or background push service."],
  ["Is my money data connected to a bank?", "Never. You record transactions yourself; totals and budgets are calculated from what you enter. Amounts are stored as exact integer minor units, not floating-point numbers."],
  ["Does Google Calendar sync?", "Not currently. Events live in Life OS only."],
  ["How do I get my data out, or delete it?", <>Settings → Your data exports JSON or CSV. Settings → Delete account permanently erases everything. See the <Link className="underline" href="/privacy">privacy notice</Link>.</>],
  ["Why did my note say “Edited elsewhere”?", "Notes autosave with version checks. If you edited the same note in another tab or device, Life OS pauses autosave and lets you choose whose version to keep, so nothing is silently overwritten."],
];

export default function HelpPage() {
  return (
    <>
      <PageHeader title="Help" description="Quick answers and the shortcuts that make Life OS fast." />
      <div className="grid max-w-3xl gap-6">
        <section aria-labelledby="h-start" className="rounded-2xl border bg-card p-5">
          <h2 id="h-start" className="text-xl font-semibold">Getting started</h2>
          <ol className="mt-3 grid list-decimal gap-1.5 pl-5 text-sm">
            <li>Press <kbd className="rounded border bg-muted px-1 font-mono text-xs">t</kbd> to add a task, or use <strong>Add</strong> in the top bar for events, notes, transactions, habits, projects and goals.</li>
            <li>Open <Link className="underline" href="/today">Today</Link> each morning: overdue work, today’s tasks, events and habits in one view.</li>
            <li>Group tasks into <Link className="underline" href="/projects">projects</Link> to see real progress, and track targets in <Link className="underline" href="/goals">goals</Link>.</li>
            <li>Set a budget in <Link className="underline" href="/finance">Finance</Link> and watch it fill from the expenses you record.</li>
          </ol>
        </section>
        <section aria-labelledby="h-keys" className="rounded-2xl border bg-card p-5">
          <h2 id="h-keys" className="text-xl font-semibold">Keyboard shortcuts</h2>
          <dl className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            {[["⌘K / Ctrl+K or /", "Search & commands"], ["t", "New task"], ["e", "New event"], ["g then d/t/c/h/l/p/n/f/a/s", "Go to a section"], ["[", "Collapse sidebar"], ["?", "Shortcut list"]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">{v}</dt><dd><kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">{k}</kbd></dd></div>
            ))}
          </dl>
        </section>
        <section aria-labelledby="h-faq" className="rounded-2xl border bg-card p-5">
          <h2 id="h-faq" className="text-xl font-semibold">FAQ</h2>
          <div className="mt-2 divide-y">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-3"><summary className="cursor-pointer text-sm font-medium">{q}</summary><p className="mt-2 text-sm text-muted-foreground">{a}</p></details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
