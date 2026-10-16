import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { BrowserNotifications, DataAndAccount, SettingsForm } from "@/features/settings/settings-form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { profile } = await getSession();
  return (
    <>
      <PageHeader title="Settings" description="Preferences, reminders, your data and your account." />
      <div className="grid max-w-3xl gap-6">
        <SettingsForm profile={profile} widgets={profile.dashboard_widgets} />
        <BrowserNotifications />
        <DataAndAccount />
      </div>
    </>
  );
}
