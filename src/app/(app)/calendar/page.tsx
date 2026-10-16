import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { loadCalendarItems } from "@/features/events/calendar-data";
import { CalendarView, type CalView } from "@/features/events/calendar-view";
import { addDays, isLocalDate, monthStart, startOfWeek, todayIn } from "@/lib/dates";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const sp = await searchParams;
  const { supabase, profile } = await getSession();
  const view: CalView = sp.view === "month" || sp.view === "week" || sp.view === "agenda" ? sp.view : profile.calendar_view;
  const date = typeof sp.date === "string" && isLocalDate(sp.date) ? sp.date : todayIn(profile.timezone);
  const [from, to] =
    view === "month" ? (() => { const s = startOfWeek(monthStart(date), profile.week_start); return [s, addDays(s, 41)]; })()
    : view === "week" ? (() => { const s = startOfWeek(date, profile.week_start); return [s, addDays(s, 6)]; })()
    : [date, addDays(date, 29)];
  const items = await loadCalendarItems(supabase, profile.timezone, from, to);
  return (
    <>
      <PageHeader title="Calendar" description={`Events, task due dates, project deadlines and milestones in one place. Times shown in ${profile.timezone}.`} />
      <CalendarView view={view} anchor={date} items={items} />
    </>
  );
}
