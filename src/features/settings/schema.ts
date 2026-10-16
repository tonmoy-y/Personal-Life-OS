import { z } from "zod";
import { isValidTimeZone } from "@/lib/dates";

export const WIDGETS = [
  { id: "summary", label: "Daily summary" },
  { id: "tasks", label: "Tasks & overdue" },
  { id: "events", label: "Upcoming events" },
  { id: "habits", label: "Habit progress" },
  { id: "goals", label: "Goal progress" },
  { id: "spending", label: "Monthly spending" },
] as const;
const WIDGET_IDS = WIDGETS.map((w) => w.id) as string[];

export const profileInputSchema = z.object({
  display_name: z.string().trim().max(80, "Max 80 characters").nullish().transform((v) => (v ? v : null)),
  timezone: z.string().refine(isValidTimeZone, "Choose a valid timezone"),
  currency: z.string().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code").refine((c) => {
    try { new Intl.NumberFormat("en", { style: "currency", currency: c }); return true; } catch { return false; }
  }, "Unknown currency"),
  week_start: z.number().int().min(0).max(6),
  theme: z.enum(["light", "dark", "system"]),
  accent: z.enum(["teal", "indigo", "rose", "amber", "emerald", "violet", "slate"]).default("teal"),
  density: z.enum(["comfortable", "compact"]).default("comfortable"),
  text_size: z.enum(["sm", "md", "lg"]).default("md"),
  corners: z.enum(["sharp", "round", "pill"]).default("round"),
  time_format: z.enum(["12h", "24h"]).default("12h"),
  calendar_view: z.enum(["month", "week", "agenda"]).default("month"),
  dashboard_widgets: z.array(z.string()).transform((w) => [...new Set(w.filter((x) => WIDGET_IDS.includes(x)))]),
});
export type ProfileInput = z.input<typeof profileInputSchema>;
