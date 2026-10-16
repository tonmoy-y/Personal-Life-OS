"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CalendarClock, CheckSquare2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Reminder } from "./queries";

const NOTIFIED_KEY = "lifeos.notified";
const LEAD_MS = 10 * 60_000;

function readNotified(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? "{}"); } catch { return {}; }
}

export function NotificationBell({ reminders }: { reminders: Reminder[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const overdue = reminders.filter((r) => r.overdue).length;

  // While the app is open: refresh the list periodically and raise opt-in browser notifications shortly before due.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const refresh = setInterval(tick, 5 * 60_000);
    const check = setInterval(() => {
      try {
        if (typeof Notification === "undefined" || Notification.permission !== "granted" || localStorage.getItem("lifeos.browserNotify") !== "1") return;
        const done = readNotified();
        const now = Date.now();
        for (const r of reminders) {
          if (!r.at || done[r.id]) continue;
          const t = new Date(r.at).getTime();
          if (t - now <= LEAD_MS && t - now > -LEAD_MS) {
            new Notification(r.kind === "event" ? "Event starting soon" : "Task due soon", { body: `${r.title} — ${r.when}`, tag: r.id });
            done[r.id] = now;
          }
        }
        for (const k of Object.keys(done)) if (now - done[k] > 24 * 3600_000) delete done[k];
        localStorage.setItem(NOTIFIED_KEY, JSON.stringify(done));
      } catch { /* notifications/storage unavailable: degrade silently */ }
    }, 30_000);
    return () => { clearInterval(refresh); clearInterval(check); };
  }, [reminders, router]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications${reminders.length ? `, ${reminders.length} items${overdue ? `, ${overdue} overdue` : ""}` : ""}`} className="relative">
          <Bell />
          {reminders.length > 0 && <span aria-hidden className={cn("absolute right-1 top-1 size-2 rounded-full", overdue ? "bg-destructive" : "bg-primary")} />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-3 py-2 text-sm font-medium">Reminders</div>
        {reminders.length === 0 ? <p className="px-3 py-6 text-center text-sm text-muted-foreground">You’re all caught up. Nothing overdue or due in the next day.</p> : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {reminders.map((r) => (
              <li key={r.id}>
                <Link href={r.href} onClick={() => setOpen(false)} className="flex items-start gap-2.5 px-3 py-2 text-sm hover:bg-muted">
                  {r.kind === "task" ? <CheckSquare2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /> : <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />}
                  <span className="min-w-0"><span className="block truncate font-medium">{r.title}</span><span className={cn("block text-xs", r.overdue ? "text-destructive" : "text-muted-foreground")}>{r.when}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t px-3 py-2 text-xs text-muted-foreground">In-app only. <Link href="/settings" className="underline" onClick={() => setOpen(false)}>Browser notification settings</Link></div>
      </PopoverContent>
    </Popover>
  );
}
