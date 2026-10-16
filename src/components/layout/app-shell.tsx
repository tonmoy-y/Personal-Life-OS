"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronsLeft, ChevronsRight, CircleUser, LogOut, Menu, Monitor, Moon, Plus, Search, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "@/app/(auth)/actions";
import { useAction } from "@/components/common/use-action";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EventFormDialog } from "@/features/events/event-form-dialog";
import { GoalFormDialog } from "@/features/goals/goal-form-dialog";
import { HabitFormDialog } from "@/features/habits/habit-form-dialog";
import { createNote } from "@/features/notes/actions";
import { NotificationBell } from "@/features/notifications/notification-bell";
import type { Reminder } from "@/features/notifications/queries";
import { ProjectFormDialog } from "@/features/projects/project-form-dialog";
import { TaskFormDialog } from "@/features/tasks/task-form-dialog";
import { TransactionFormDialog } from "@/features/finance/transaction-form-dialog";
import { cn } from "@/lib/utils";
import { AppDataProvider, type AppData } from "./app-data";
import { CommandPalette, type QuickAddKind } from "./command-palette";
import { Logo, LogoMark } from "./logo";
import { ALL_NAV, NAV_MAIN, NAV_SECONDARY, SEGMENT_LABELS, type NavItem } from "./nav";
import { ShortcutsDialog } from "./shortcuts-dialog";

const COLLAPSE_KEY = "lifeos.sidebarCollapsed";

function isTyping(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

function NavLinks({ items, collapsed, onNavigate }: { items: NavItem[]; collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="grid gap-0.5">
      {items.map((n) => {
        const active = pathname === n.href || pathname.startsWith(n.href + "/");
        const link = (
          <Link href={n.href} onClick={onNavigate} aria-current={active ? "page" : undefined} aria-label={collapsed ? n.label : undefined}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", collapsed && "justify-center px-0",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground")}>
            <n.icon className="size-[18px] shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{n.label}</span>}
          </Link>
        );
        return (
          <li key={n.href}>
            {collapsed ? <Tooltip><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{n.label}</TooltipContent></Tooltip> : link}
          </li>
        );
      })}
    </ul>
  );
}

function Breadcrumbs() {
  const pathname = usePathname();
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length === 0) return null;
  const crumbs = [{ href: `/${segs[0]}`, label: SEGMENT_LABELS[segs[0]] ?? segs[0] }];
  if (segs[1]) crumbs.push({ href: pathname, label: segs[0] === "notes" ? "Editor" : "Details" });
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <li className="hidden sm:block"><Link href="/dashboard" className="hover:text-foreground">Life OS</Link></li>
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex min-w-0 items-center gap-1.5">
            <span aria-hidden className={i === 0 ? "hidden sm:inline" : ""}>/</span>
            {i === crumbs.length - 1 ? <span aria-current="page" className="truncate font-medium text-foreground">{c.label}</span> : <Link href={c.href} className="truncate hover:text-foreground">{c.label}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function AppShell({ data, reminders, children }: { data: AppData; reminders: Reminder[]; children: ReactNode }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { exec } = useAction();
  const [collapsedFlag, setCollapsedFlag] = useLocalStorage(COLLAPSE_KEY, "0");
  const collapsed = collapsedFlag === "1";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [adding, setAdding] = useState<QuickAddKind | null>(null);
  const goPending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const awaitingGo = useRef(false);

  const toggleCollapsed = useCallback(() => setCollapsedFlag(collapsed ? "0" : "1"), [collapsed, setCollapsedFlag]);

  const quickAdd = useCallback(async (k: QuickAddKind) => {
    if (k === "note") {
      const r = await exec(() => createNote(), { refresh: false });
      if (r.ok) router.push(`/notes/${r.data.id}`);
    } else setAdding(k);
  }, [exec, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((o) => !o); return; }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      if (awaitingGo.current) {
        awaitingGo.current = false;
        if (goPending.current) clearTimeout(goPending.current);
        const item = ALL_NAV.find((n) => n.shortcut === e.key);
        if (item) { e.preventDefault(); router.push(item.href); }
        return;
      }
      switch (e.key) {
        case "/": e.preventDefault(); setPaletteOpen(true); break;
        case "?": e.preventDefault(); setHelpOpen(true); break;
        case "t": e.preventDefault(); setAdding("task"); break;
        case "e": e.preventDefault(); setAdding("event"); break;
        case "[": toggleCollapsed(); break;
        case "g": awaitingGo.current = true; goPending.current = setTimeout(() => { awaitingGo.current = false; }, 1200); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, toggleCollapsed]);

  const initials = (data.profile.display_name || data.email).slice(0, 2).toUpperCase();

  return (
    <AppDataProvider value={data}>
      <a href="#main" className="sr-only z-[100] rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to content</a>
      <div className="flex min-h-dvh">
        <aside aria-label="Primary" className={cn("sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex", collapsed ? "w-[4.5rem]" : "w-64")}>
          <div className={cn("flex h-14 items-center px-4", collapsed && "justify-center px-0")}>
            <Link href="/dashboard" aria-label="Life OS home"><Logo collapsed={collapsed} /></Link>
          </div>
          <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-2"><NavLinks items={NAV_MAIN} collapsed={collapsed} /></nav>
          <div className="border-t px-3 py-2">
            <NavLinks items={NAV_SECONDARY} collapsed={collapsed} />
            <Button variant="ghost" size={collapsed ? "icon" : "default"} onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} className={cn("mt-1 w-full text-sidebar-foreground/70", !collapsed && "justify-start px-3")}>
              {collapsed ? <ChevronsRight /> : <><ChevronsLeft /> Collapse</>}
            </Button>
          </div>
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 bg-sidebar p-0">
            <SheetHeader className="p-4 pb-0"><SheetTitle><Logo /></SheetTitle><SheetDescription className="sr-only">Main navigation</SheetDescription></SheetHeader>
            <nav aria-label="Main" className="flex-1 overflow-y-auto px-3"><NavLinks items={NAV_MAIN} onNavigate={() => setMobileOpen(false)} /></nav>
            <div className="border-t px-3 py-3"><NavLinks items={NAV_SECONDARY} onNavigate={() => setMobileOpen(false)} /></div>
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur sm:px-5">
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu /></Button>
            <Link href="/dashboard" className="md:hidden" aria-label="Life OS home"><LogoMark className="size-7 text-primary" /></Link>
            <Breadcrumbs />
            <div className="ml-auto flex items-center gap-1">
              <Button variant="outline" onClick={() => setPaletteOpen(true)} className="hidden h-8 w-56 justify-start gap-2 text-muted-foreground lg:flex" aria-label="Search and commands (Control K)">
                <Search /> <span className="flex-1 text-left">Search…</span><kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
              </Button>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Search" onClick={() => setPaletteOpen(true)}><Search /></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="sm"><Plus /><span className="hidden sm:inline">Add</span></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Quick add</DropdownMenuLabel>
                  {([["task", "Task"], ["event", "Event"], ["note", "Note"], ["expense", "Transaction"], ["habit", "Habit"], ["project", "Project"], ["goal", "Goal"]] as const).map(([k, l]) => <DropdownMenuItem key={k} onSelect={() => void quickAdd(k)}>{l}</DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
              <NotificationBell reminders={reminders} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Theme"><Sun className="dark:hidden" /><Moon className="hidden dark:block" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
                    <DropdownMenuRadioItem value="light"><Sun /> Light</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark"><Moon /> Dark</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system"><Monitor /> System</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Account menu"><span className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{initials}</span></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate font-normal"><span className="block text-sm font-medium">{data.profile.display_name || "Your account"}</span><span className="block truncate text-xs text-muted-foreground">{data.email}</span></DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/settings"><Settings /> Settings</Link></DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setHelpOpen(true)}><CircleUser /> Keyboard shortcuts</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <form action={signOut}><DropdownMenuItem asChild><button type="submit" className="w-full"><LogOut /> Sign out</button></DropdownMenuItem></form>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:px-6 lg:py-8">{children}</main>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onQuickAdd={(k) => void quickAdd(k)} />
      <ShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <TaskFormDialog open={adding === "task"} onOpenChange={(o) => !o && setAdding(null)} />
      <EventFormDialog open={adding === "event"} onOpenChange={(o) => !o && setAdding(null)} />
      <HabitFormDialog open={adding === "habit"} onOpenChange={(o) => !o && setAdding(null)} />
      <ProjectFormDialog open={adding === "project"} onOpenChange={(o) => !o && setAdding(null)} onSaved={(id) => router.push(`/projects/${id}`)} />
      <GoalFormDialog open={adding === "goal"} onOpenChange={(o) => !o && setAdding(null)} />
      <TransactionFormDialog open={adding === "expense"} onOpenChange={(o) => !o && setAdding(null)} />
    </AppDataProvider>
  );
}
