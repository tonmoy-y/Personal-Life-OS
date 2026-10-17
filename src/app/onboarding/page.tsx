import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/features/settings/onboarding-form";
import { Logo } from "@/components/layout/logo";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Welcome", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { profile } = await getSession();
  if (profile.onboarded) redirect("/dashboard");
  return (
    <div className="paper-grain min-h-dvh">
      <main id="main" className="mx-auto max-w-lg px-5 py-12">
        <Logo />
        <h1 className="mt-8 text-4xl font-semibold">Let’s set up your Life OS</h1>
        <p className="mt-2 text-muted-foreground">Three quick preferences so dates, streaks and money are right from day one. You can change them any time in Settings.</p>
        <OnboardingForm initial={{ display_name: profile.display_name ?? "", currency: profile.currency, week_start: profile.week_start }} />
      </main>
    </div>
  );
}
