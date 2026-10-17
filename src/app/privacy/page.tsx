import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export const metadata: Metadata = { title: "Privacy notice", description: "How Life OS stores your data, what it never collects, and how to export or delete everything.", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" aria-label="Home"><Logo /></Link>
      <h1 className="mt-8 text-4xl font-semibold">Privacy notice</h1>
      <div className="mt-6 grid gap-6 text-sm leading-relaxed [&_h2]:mb-1 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:grid [&_ul]:gap-1">
        <section><h2>What we store</h2><p>Only what you enter: your email address, display name and preferences (timezone, currency, week start, theme), plus your tasks, events, habits, goals, projects, notes, transactions and budgets. We do not store passwords in readable form (authentication is handled by Supabase Auth), and we never ask for passwords to any third-party service or for bank or card details.</p></section>
        <section><h2>Who can see it</h2><p>Only you. Every table is protected by row-level security so that your records can be read or changed only by your signed-in account. The app’s operator can technically access the database; do not store information you are not comfortable with the operator holding.</p></section>
        <section><h2>Where it is processed</h2><ul><li><strong>Supabase</strong> — database and authentication.</li><li><strong>Vercel</strong> — web hosting.</li></ul><p>There are no advertising trackers, no analytics scripts and no AI services.</p></section>
        <section><h2>Cookies and local storage</h2><p>Strictly necessary cookies keep you signed in. Your browser’s local storage holds convenience settings such as sidebar state and saved task filters, and nothing else.</p></section>
        <section><h2>Your controls</h2><ul><li><strong>Export</strong> — Settings → Your data downloads everything as JSON, or individual lists as CSV.</li><li><strong>Delete</strong> — Settings → Delete account permanently erases your account and all records. It only reports success after the database has completed the deletion.</li></ul></section>
        <section><h2>Reminders</h2><p>Reminders are in-app, and optional browser notifications work only while the app is open. No email, SMS or push messages are sent.</p></section>
        <section><h2>Contact</h2><p>For privacy questions or deletion help, contact the operator of this deployment.</p></section>
      </div>
    </div>
  );
}
