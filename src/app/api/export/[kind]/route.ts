import { NextResponse, type NextRequest } from "next/server";
import { toCsv } from "@/lib/csv";
import { isLocalDate, todayIn } from "@/lib/dates";
import { minorToDecimal } from "@/lib/money";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** CSV export of one list the signed-in user owns. Query: from, to (dates), type, category (transactions only). */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/export/[kind]">) {
  const { kind } = await ctx.params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(`export:${auth.user.id}`, 10, 60_000)) return NextResponse.json({ error: "Too many exports. Try again in a minute." }, { status: 429 });

  const sp = req.nextUrl.searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  let csv: string;

  switch (kind) {
    case "transactions": {
      let q = supabase.from("transactions").select("*").order("occurred_on", { ascending: false }).limit(100000);
      if (from && isLocalDate(from)) q = q.gte("occurred_on", from);
      if (to && isLocalDate(to)) q = q.lte("occurred_on", to);
      const type = sp.get("type");
      if (type === "income" || type === "expense") q = q.eq("type", type);
      const category = sp.get("category");
      if (category) q = q.eq("category", category.slice(0, 60));
      const { data, error } = await q;
      if (error) return fail(error.code);
      csv = toCsv((data ?? []).map((t) => ({ date: t.occurred_on, type: t.type, category: t.category, description: t.description, payment_method: t.payment_method, currency: t.currency, amount: minorToDecimal(t.amount_minor, t.currency) })), ["date", "type", "category", "description", "payment_method", "currency", "amount"]);
      break;
    }
    case "tasks": {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(100000);
      if (error) return fail(error.code);
      csv = toCsv((data ?? []).map((t) => ({ ...t, recurrence: t.recurrence ? JSON.stringify(t.recurrence) : "" })), ["title", "status", "priority", "due_date", "due_time", "category", "tags", "estimated_minutes", "description", "recurrence", "completed_at", "created_at"]);
      break;
    }
    case "habits": {
      const [h, c] = await Promise.all([supabase.from("habits").select("*").limit(5000), supabase.from("habit_completions").select("*").order("completed_on", { ascending: false }).limit(100000)]);
      if (h.error || c.error) return fail((h.error ?? c.error)?.code);
      const names = new Map((h.data ?? []).map((x) => [x.id, x.title]));
      csv = toCsv((c.data ?? []).map((r) => ({ habit: names.get(r.habit_id) ?? "", completed_on: r.completed_on })), ["habit", "completed_on"]);
      break;
    }
    case "goals": {
      const { data, error } = await supabase.from("goals").select("*").order("created_at", { ascending: false }).limit(5000);
      if (error) return fail(error.code);
      csv = toCsv(data ?? [], ["title", "status", "horizon", "category", "unit", "start_value", "current_value", "target_value", "target_date", "completed_at", "description"]);
      break;
    }
    case "notes": {
      const { data, error } = await supabase.from("notes").select("*").order("updated_at", { ascending: false }).limit(100000);
      if (error) return fail(error.code);
      csv = toCsv(data ?? [], ["title", "tags", "pinned", "archived_at", "created_at", "updated_at", "body"]);
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown export" }, { status: 404 });
  }

  const { data: p } = await supabase.from("profiles").select("timezone").maybeSingle();
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="life-os-${kind}-${todayIn(p?.timezone ?? "UTC")}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function fail(code?: string) {
  console.error("[export]", code);
  return NextResponse.json({ error: "Export failed. Please try again." }, { status: 500 });
}
