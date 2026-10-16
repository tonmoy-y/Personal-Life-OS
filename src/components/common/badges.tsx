import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Priority } from "@/types/db";

const PRIORITY_STYLE: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/12 text-info",
  high: "bg-warning/15 text-warning",
  urgent: "bg-destructive/12 text-destructive",
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <Badge variant="secondary" className={cn("capitalize", PRIORITY_STYLE[priority], className)}>
      {priority}
    </Badge>
  );
}

export function ColorDot({ color, className }: { color: string | null; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2.5 shrink-0 rounded-full bg-primary", className)} style={color ? { backgroundColor: color } : undefined} />;
}
