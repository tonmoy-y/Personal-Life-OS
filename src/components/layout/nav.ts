import {
  BarChart3, CalendarCheck, CalendarDays, CircleHelp, FolderKanban, Flame, LayoutDashboard,
  ListChecks, NotebookText, Settings, Target, Wallet, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Second key of the two-key "go to" shortcut, e.g. `g` then `d`. */
  shortcut?: string;
}

export const NAV_MAIN: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "d" },
  { href: "/today", label: "Today", icon: CalendarCheck, shortcut: "o" },
  { href: "/tasks", label: "Tasks", icon: ListChecks, shortcut: "t" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, shortcut: "c" },
  { href: "/habits", label: "Habits", icon: Flame, shortcut: "h" },
  { href: "/goals", label: "Goals", icon: Target, shortcut: "l" },
  { href: "/projects", label: "Projects", icon: FolderKanban, shortcut: "p" },
  { href: "/notes", label: "Notes", icon: NotebookText, shortcut: "n" },
  { href: "/finance", label: "Finance", icon: Wallet, shortcut: "f" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, shortcut: "a" },
];

export const NAV_SECONDARY: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings, shortcut: "s" },
  { href: "/help", label: "Help", icon: CircleHelp, shortcut: "?" },
];

export const ALL_NAV = [...NAV_MAIN, ...NAV_SECONDARY];

export const SEGMENT_LABELS: Record<string, string> = {
  ...Object.fromEntries(ALL_NAV.map((n) => [n.href.slice(1), n.label])),
  search: "Search",
};
