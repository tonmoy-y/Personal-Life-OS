import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TIMEZONE } from "@/lib/dates";
import type { Profile } from "@/types/db";

/**
 * Authenticated request context for Server Components. Verifies the session with Supabase Auth
 * (getUser — not just the cookie), redirecting to /login when absent. Memoised per request.
 */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  const { data: row } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
  const profile: Profile =
    (row as Profile | null) ??
    ({
      id: data.user.id,
      display_name: null,
      timezone: DEFAULT_TIMEZONE,
      currency: "BDT",
      week_start: 1,
      theme: "system",
      dashboard_widgets: ["summary", "tasks", "events", "habits", "goals", "spending"],
      onboarded: false,
    } as Profile);
  return { supabase, user: data.user, profile };
});
