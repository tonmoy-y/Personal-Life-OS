import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Setup required" };

export default function SetupPage() {
  if (getSupabaseEnv()) redirect("/");
  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <Logo />
      <h1 className="mt-8 text-3xl font-semibold">Connect Supabase to continue</h1>
      <p className="mt-2 text-muted-foreground">This app stores everything in Supabase and does not fall back to browser storage. The following environment variables are missing or still contain placeholders:</p>
      <ul className="mt-4 grid gap-2 font-mono text-sm">
        <li className="rounded-lg border bg-card px-3 py-2">NEXT_PUBLIC_SUPABASE_URL</li>
        <li className="rounded-lg border bg-card px-3 py-2">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</li>
      </ul>
      <ol className="mt-6 grid list-decimal gap-1.5 pl-5 text-sm">
        <li>Copy <code className="rounded bg-muted px-1">.env.example</code> to <code className="rounded bg-muted px-1">.env.local</code>.</li>
        <li>Fill in your project URL and publishable key (Supabase → Project Settings → API Keys).</li>
        <li>Run the SQL in <code className="rounded bg-muted px-1">supabase/migrations</code> against your project.</li>
        <li>Restart the dev server. On Vercel, add the same variables in Project Settings → Environment Variables and redeploy.</li>
      </ol>
      <p className="mt-6 text-sm text-muted-foreground">Full instructions are in README.md.</p>
    </div>
  );
}
