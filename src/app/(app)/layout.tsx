import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { loadReminders } from "@/features/notifications/queries";
import { getSession } from "@/lib/session";

// Per-user data: never prerender or cache across users.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { supabase, user, profile } = await getSession();
  const [projects, goals, reminders] = await Promise.all([
    supabase.from("projects").select("id, title, color").in("status", ["planning", "active", "on_hold"]).order("title").limit(200),
    supabase.from("goals").select("id, title").eq("status", "active").order("title").limit(200),
    loadReminders(supabase, profile.timezone).catch(() => []),
  ]);
  return (
    <AppShell
      reminders={reminders}
      data={{
        profile: { id: profile.id, display_name: profile.display_name, timezone: profile.timezone, currency: profile.currency, week_start: profile.week_start, theme: profile.theme },
        email: user.email ?? "",
        projects: projects.data ?? [],
        goals: goals.data ?? [],
      }}
    >
      {children}
    </AppShell>
  );
}
