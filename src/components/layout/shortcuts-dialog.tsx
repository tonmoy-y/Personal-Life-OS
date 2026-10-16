"use client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NAV_MAIN, NAV_SECONDARY } from "./nav";

const GENERAL: [string, string][] = [
  ["⌘K / Ctrl+K  or  /", "Open search & command palette"],
  ["t", "New task"],
  ["e", "New event"],
  ["[", "Collapse / expand sidebar"],
  ["?", "Show this help"],
  ["Esc", "Close dialogs and menus"],
];

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Shortcuts are ignored while you’re typing in a field.</DialogDescription>
        </DialogHeader>
        <h3 className="font-sans text-sm font-semibold">General</h3>
        <dl className="grid gap-1.5 text-sm">{GENERAL.map(([k, v]) => <div key={k} className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">{v}</dt><dd><kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">{k}</kbd></dd></div>)}</dl>
        <h3 className="mt-2 font-sans text-sm font-semibold">Go to (press <kbd className="rounded border bg-muted px-1 font-mono text-xs">g</kbd> then…)</h3>
        <dl className="grid gap-1.5 text-sm sm:grid-cols-2">{[...NAV_MAIN, ...NAV_SECONDARY].filter((n) => n.shortcut).map((n) => <div key={n.href} className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">{n.label}</dt><dd><kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">g {n.shortcut}</kbd></dd></div>)}</dl>
      </DialogContent>
    </Dialog>
  );
}
