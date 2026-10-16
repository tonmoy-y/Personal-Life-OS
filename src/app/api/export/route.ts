import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { todayIn } from "@/lib/dates";

export const dynamic = "force-dynamic";

const TABLES = ["profiles", "projects", "project_milestones", "goals", "goal_milestones", "goal_progress_logs", "tasks", "events", "habits", "habit_completions", "notes", "transactions", "budgets"] as const;

/** Full JSON export of the signed-in user's own data. RLS guarantees only their rows are returned. */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(`export:${auth.user.id}`, 10, 60_000)) return NextResponse.json({ error: "Too many exports. Try again in a minute." }, { status: 429 });

  const out: Record<string, unknown> = { exported_at: new Date().toISOString(), user: { id: auth.user.id, email: auth.user.email } };
  for (const t of TABLES) {
    const { data, error } = await supabase.from(t).select("*").limit(100000);
    if (error) {
      console.error("[export]", t, error.code);
      return NextResponse.json({ error: "Export failed. Please try again." }, { status: 500 });
    }
    out[t] = data;
  }
  const day = todayIn((out.profiles as { timezone: string }[])?.[0]?.timezone ?? "UTC");
  return new NextResponse(JSON.stringify(out, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="life-os-export-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
