"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Download, LogOut, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { signOut } from "@/app/(auth)/actions";
import { Field, selectClass } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { useAppData } from "@/components/layout/app-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CURRENCIES } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Accent, Profile } from "@/types/db";
import { deleteAccount, updateProfile } from "./actions";
import { profileInputSchema, WIDGETS } from "./schema";

const ACCENT_OPTIONS: { id: Accent; label: string; swatch: string }[] = [
  { id: "teal", label: "Teal", swatch: "oklch(0.5 0.1 185)" }, { id: "indigo", label: "Indigo", swatch: "oklch(0.5 0.17 268)" },
  { id: "rose", label: "Rose", swatch: "oklch(0.58 0.19 10)" }, { id: "amber", label: "Amber", swatch: "oklch(0.62 0.15 62)" },
  { id: "emerald", label: "Emerald", swatch: "oklch(0.52 0.13 155)" }, { id: "violet", label: "Violet", swatch: "oklch(0.52 0.18 295)" },
  { id: "slate", label: "Slate", swatch: "oklch(0.42 0.03 255)" },
];

function Segmented<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-xl bg-muted p-1">
        {options.map(([id, text]) => (
          <button key={id} type="button" role="radio" aria-checked={value === id} onClick={() => onChange(id)}
            className={cn("flex-1 rounded-lg px-2 py-1.5 text-sm font-medium", value === id ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>{text}</button>
        ))}
      </div>
    </fieldset>
  );
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function timeZones(): string[] {
  try { return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone"); } catch { return ["UTC", "Asia/Dhaka"]; }
}

export function SettingsForm({ profile, widgets }: { profile: Profile; widgets: string[] }) {
  const { setTheme } = useTheme();
  const { exec, pending } = useAction();
  const [v, setV] = useState({
    display_name: profile.display_name ?? "", timezone: profile.timezone, currency: profile.currency, week_start: profile.week_start,
    theme: profile.theme, accent: profile.accent, density: profile.density, text_size: profile.text_size, corners: profile.corners,
    time_format: profile.time_format, calendar_view: profile.calendar_view, dashboard_widgets: widgets,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const zones = timeZones();
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((x) => ({ ...x, [k]: val }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const check = profileInputSchema.safeParse(v);
    if (!check.success) { setErrors(Object.fromEntries(check.error.issues.map((i) => [String(i.path[0]), i.message]))); return; }
    setErrors({});
    const res = await exec(() => updateProfile(v), { success: "Settings saved" });
    if (res.ok) setTheme(v.theme);
  }

  return (
    <form onSubmit={save} className="grid gap-6" noValidate>
      <section aria-labelledby="st-profile" className="grid gap-4 rounded-2xl border bg-card p-5">
        <h2 id="st-profile" className="text-xl font-semibold">Profile & preferences</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="st-name" label="Display name" error={errors.display_name}><Input id="st-name" value={v.display_name} maxLength={80} onChange={(e) => set("display_name", e.target.value)} /></Field>
          <Field id="st-tz" label="Timezone" error={errors.timezone} hint="Defines “today”, due times, streaks and reminders.">
            <select id="st-tz" className={selectClass} value={v.timezone} onChange={(e) => set("timezone", e.target.value)}>{(zones.includes(v.timezone) ? zones : [v.timezone, ...zones]).map((z) => <option key={z}>{z}</option>)}</select>
          </Field>
          <Field id="st-cur" label="Currency" error={errors.currency} hint="Applies to new transactions and budgets. Existing amounts are never converted.">
            <select id="st-cur" className={selectClass} value={v.currency} onChange={(e) => set("currency", e.target.value)}>{(CURRENCIES as readonly string[]).includes(v.currency) ? null : <option>{v.currency}</option>}{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field id="st-week" label="Week starts on">
            <select id="st-week" className={selectClass} value={v.week_start} onChange={(e) => set("week_start", Number(e.target.value))}>{WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
          </Field>
          <Field id="st-theme" label="Theme">
            <select id="st-theme" className={selectClass} value={v.theme} onChange={(e) => { set("theme", e.target.value as Profile["theme"]); setTheme(e.target.value); }}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select>
          </Field>
        </div>
      </section>

      <section aria-labelledby="st-look" className="grid gap-5 rounded-2xl border bg-card p-5">
        <h2 id="st-look" className="text-xl font-semibold">Appearance</h2>
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Accent colour</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Accent colour">
            {ACCENT_OPTIONS.map((a) => (
              <button key={a.id} type="button" role="radio" aria-checked={v.accent === a.id} aria-label={a.label} title={a.label} onClick={() => set("accent", a.id)}
                className={cn("flex size-9 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition", v.accent === a.id ? "ring-2 ring-foreground" : "hover:scale-110")} style={{ background: a.swatch }}>
                {v.accent === a.id && <Check className="size-4 text-white" aria-hidden />}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Preview applies after you save.</p>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <Segmented label="Text size" value={v.text_size} onChange={(x) => set("text_size", x)} options={[["sm", "Small"], ["md", "Default"], ["lg", "Large"]]} />
          <Segmented label="Density" value={v.density} onChange={(x) => set("density", x)} options={[["comfortable", "Comfortable"], ["compact", "Compact"]]} />
          <Segmented label="Corners" value={v.corners} onChange={(x) => set("corners", x)} options={[["sharp", "Sharp"], ["round", "Rounded"], ["pill", "Extra round"]]} />
          <Segmented label="Time format" value={v.time_format} onChange={(x) => set("time_format", x)} options={[["12h", "12-hour"], ["24h", "24-hour"]]} />
          <Segmented label="Calendar opens in" value={v.calendar_view} onChange={(x) => set("calendar_view", x)} options={[["month", "Month"], ["week", "Week"], ["agenda", "Agenda"]]} />
        </div>
      </section>

      <section aria-labelledby="st-widgets" className="grid gap-3 rounded-2xl border bg-card p-5">
        <h2 id="st-widgets" className="text-xl font-semibold">Dashboard widgets</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {WIDGETS.map((w) => {
            const on = v.dashboard_widgets.includes(w.id);
            return (
              <li key={w.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <label htmlFor={`w-${w.id}`} className="text-sm">{w.label}</label>
                <Switch id={`w-${w.id}`} checked={on} onCheckedChange={(c) => set("dashboard_widgets", c ? [...v.dashboard_widgets, w.id] : v.dashboard_widgets.filter((x) => x !== w.id))} />
              </li>
            );
          })}
        </ul>
      </section>
      <div><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button></div>
    </form>
  );
}

export function BrowserNotifications() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [on, setOn] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    try { setOn(localStorage.getItem("lifeos.browserNotify") === "1"); } catch { /* storage blocked */ }
  }, []);

  async function enable() {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") { try { localStorage.setItem("lifeos.browserNotify", "1"); } catch { /* ignore */ } setOn(true); toast.success("Browser notifications enabled"); }
    else toast.message("Permission wasn’t granted — you can change this in your browser’s site settings.");
  }
  function disable() { try { localStorage.removeItem("lifeos.browserNotify"); } catch { /* ignore */ } setOn(false); toast.success("Browser notifications turned off"); }

  return (
    <section aria-labelledby="st-notify" className="grid gap-3 rounded-2xl border bg-card p-5">
      <h2 id="st-notify" className="flex items-center gap-2 text-xl font-semibold"><Bell className="size-5" aria-hidden /> Reminders</h2>
      <p className="text-sm text-muted-foreground">In-app notifications for overdue and soon-due tasks and events are always on (bell in the top bar). Optional browser notifications fire <strong>only while this app is open in a tab</strong> — Life OS has no background push or email service, so nothing is delivered when the app is closed.</p>
      {perm === "unsupported" ? <p className="text-sm">Your browser doesn’t support notifications.</p>
        : perm === "denied" ? <p className="text-sm text-warning">Notifications are blocked for this site. Allow them in your browser’s site settings to enable reminders.</p>
        : on && perm === "granted" ? <div><Button variant="outline" onClick={disable}>Turn off browser notifications</Button></div>
        : <div><Button variant="outline" onClick={enable}>Enable browser notifications</Button></div>}
    </section>
  );
}

export function DataAndAccount() {
  const router = useRouter();
  const { email } = useAppData();
  const { exec, pending } = useAction();
  const [confirm, setConfirm] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <>
      <section aria-labelledby="st-data" className="grid gap-3 rounded-2xl border bg-card p-5">
        <h2 id="st-data" className="flex items-center gap-2 text-xl font-semibold"><Download className="size-5" aria-hidden /> Your data</h2>
        <p className="text-sm text-muted-foreground">Download everything stored for your account as one JSON file, or export individual lists as CSV. Exports contain only your own records.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><a href="/api/export" download>Full export (JSON)</a></Button>
          {["tasks", "transactions", "habits", "goals", "notes"].map((k) => <Button key={k} variant="outline" asChild><a href={`/api/export/${k}`} download>{k[0].toUpperCase() + k.slice(1)} (CSV)</a></Button>)}
        </div>
      </section>

      <section aria-labelledby="st-account" className="grid gap-3 rounded-2xl border bg-card p-5">
        <h2 id="st-account" className="text-xl font-semibold">Account</h2>
        <p className="text-sm text-muted-foreground">Signed in as <strong className="text-foreground">{email}</strong>.</p>
        <div><form action={signOut}><Button type="submit" variant="outline"><LogOut /> Sign out</Button></form></div>
      </section>

      <section aria-labelledby="st-danger" className="grid gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
        <h2 id="st-danger" className="text-xl font-semibold text-destructive">Delete account</h2>
        <p className="text-sm text-muted-foreground">Permanently deletes your account and every task, event, habit, goal, project, note and transaction. This cannot be undone. Export your data first if you want a copy.</p>
        {!open ? <div><Button variant="destructive" onClick={() => setOpen(true)}><Trash2 /> Delete my account…</Button></div> : (
          <form className="grid max-w-sm gap-2" onSubmit={async (e) => { e.preventDefault(); const r = await exec(() => deleteAccount(confirm), { refresh: false }); if (!r.ok) router.refresh(); }}>
            <Field id="del-confirm" label="Type DELETE to confirm"><Input id="del-confirm" value={confirm} autoComplete="off" onChange={(e) => setConfirm(e.target.value)} /></Field>
            <div className="flex gap-2"><Button type="submit" variant="destructive" disabled={pending || confirm.trim() !== "DELETE"}>{pending ? "Deleting…" : "Permanently delete"}</Button><Button type="button" variant="ghost" onClick={() => { setOpen(false); setConfirm(""); }}>Cancel</Button></div>
          </form>
        )}
      </section>
    </>
  );
}
