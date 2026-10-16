"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { Profile } from "@/types/db";

export interface AppData {
  profile: Pick<Profile, "id" | "display_name" | "timezone" | "currency" | "week_start" | "theme" | "time_format" | "calendar_view">;
  email: string;
  projects: { id: string; title: string; color: string | null }[];
  goals: { id: string; title: string }[];
}

const Ctx = createContext<AppData | null>(null);

export function AppDataProvider({ value, children }: { value: AppData; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData(): AppData {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppData must be used inside AppDataProvider");
  return v;
}
