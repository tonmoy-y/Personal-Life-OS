"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Field, selectClass } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CURRENCIES } from "@/lib/money";
import { completeOnboarding } from "./actions";
import { timeZones } from "./settings-form";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function OnboardingForm({ initial }: { initial: { display_name: string; currency: string; week_start: number } }) {
  const router = useRouter();
  const { exec, pending } = useAction();
  const detected = useSyncExternalStore(() => () => {}, () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Dhaka", () => "Asia/Dhaka");
  const [tzChoice, setTzChoice] = useState<string | null>(null);
  const [rest, setRest] = useState(initial);
  const zones = useMemo(() => timeZones(), []);
  const v = { ...rest, timezone: tzChoice ?? detected };
  const setV = (next: typeof v) => { setRest({ display_name: next.display_name, currency: next.currency, week_start: next.week_start }); setTzChoice(next.timezone); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await exec(() => completeOnboarding({ ...v, theme: "system", dashboard_widgets: ["summary", "tasks", "events", "habits", "goals", "spending"] }), { refresh: false });
    if (res.ok) router.push("/dashboard");
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-5 rounded-2xl border bg-card p-6">
      <Field id="ob-name" label="What should we call you?"><Input id="ob-name" value={v.display_name} maxLength={80} autoFocus onChange={(e) => setV({ ...v, display_name: e.target.value })} /></Field>
      <Field id="ob-tz" label="Timezone" hint="We detected this from your browser. It decides what “today” means.">
        <select id="ob-tz" className={selectClass} value={v.timezone} onChange={(e) => setV({ ...v, timezone: e.target.value })}>{(zones.includes(v.timezone) ? zones : [v.timezone, ...zones]).map((z) => <option key={z}>{z}</option>)}</select>
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="ob-cur" label="Currency"><select id="ob-cur" className={selectClass} value={v.currency} onChange={(e) => setV({ ...v, currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field id="ob-week" label="Week starts on"><select id="ob-week" className={selectClass} value={v.week_start} onChange={(e) => setV({ ...v, week_start: Number(e.target.value) })}>{WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></Field>
      </div>
      <Button type="submit" size="lg" className="h-10" disabled={pending}>{pending ? "Saving…" : "Continue to my dashboard"}</Button>
    </form>
  );
}
