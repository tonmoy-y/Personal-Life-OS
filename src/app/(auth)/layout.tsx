import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="paper-grain grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <Link href="/" aria-label="Back to home page"><Logo inverted className="text-primary-foreground" /></Link>
        <div className="max-w-md">
          <p className="font-heading text-4xl font-semibold leading-tight text-balance">One calm place for the things that make up your life.</p>
          <p className="mt-4 text-primary-foreground/80">Tasks, calendar, habits, goals, projects, notes and money — private to you, protected by row-level security, and free to use.</p>
        </div>
        <p className="text-sm text-primary-foreground/70">Your data stays yours: export or delete it any time.</p>
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary-foreground/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-primary-foreground/5" />
      </aside>
      <main id="main" className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-block lg:hidden"><Logo /></Link>
          {children}
        </div>
      </main>
    </div>
  );
}
