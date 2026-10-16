import { addDays, addMonths, diffDays, isLocalDate, startOfWeek, weekdayOf, type LocalDate } from "./dates";

export type RecurrenceFreq = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurrenceRule {
  freq: RecurrenceFreq;
  /** Repeat every N units (>= 1). */
  interval: number;
  /** Weekly only: weekdays (0 = Sunday … 6 = Saturday). Empty/undefined = same weekday as the previous occurrence. */
  weekdays?: number[];
  /** Monthly/yearly: original day of month, so Jan 31 → Feb 28 → Mar 31 (not Mar 28). */
  anchorDay?: number;
  /** Inclusive last allowed occurrence date. */
  until?: LocalDate;
}

export function isRecurrenceRule(value: unknown): value is RecurrenceRule {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    ["daily", "weekly", "monthly", "yearly"].includes(r.freq as string) &&
    Number.isInteger(r.interval) &&
    (r.interval as number) >= 1 &&
    (r.interval as number) <= 365 &&
    (r.weekdays === undefined ||
      (Array.isArray(r.weekdays) && r.weekdays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6))) &&
    (r.until === undefined || (typeof r.until === "string" && isLocalDate(r.until)))
  );
}

/**
 * The next occurrence strictly after `from` according to `rule`, or null if the series has ended.
 * Pure and deterministic: the same inputs always produce the same date.
 */
export function nextOccurrence(rule: RecurrenceRule, from: LocalDate): LocalDate | null {
  let next: LocalDate;
  switch (rule.freq) {
    case "daily":
      next = addDays(from, rule.interval);
      break;
    case "weekly": {
      const days = [...new Set(rule.weekdays ?? [])].sort((a, b) => a - b);
      if (days.length === 0) {
        next = addDays(from, 7 * rule.interval);
        break;
      }
      // Walk forward day by day; accept a day in an allowed week (every `interval` weeks from `from`'s week).
      const base = startOfWeek(from, 1);
      let candidate = addDays(from, 1);
      for (let i = 0; i < 7 * rule.interval + 7; i++, candidate = addDays(candidate, 1)) {
        const weeks = Math.floor(diffDays(startOfWeek(candidate, 1), base) / 7);
        if (days.includes(weekdayOf(candidate)) && weeks % rule.interval === 0) break;
      }
      next = candidate;
      break;
    }
    case "monthly":
      next = addMonths(from, rule.interval, rule.anchorDay);
      break;
    case "yearly":
      next = addMonths(from, 12 * rule.interval, rule.anchorDay);
      break;
  }
  if (rule.until && next > rule.until) return null;
  return next;
}

/**
 * Next occurrence to generate when a recurring task due `due` is completed on `today`.
 * Skips missed occurrences so completing a 5-day-late daily task yields tomorrow, not 4 stale copies.
 */
export function nextOccurrenceAfterCompletion(
  rule: RecurrenceRule,
  due: LocalDate,
  today: LocalDate,
): LocalDate | null {
  let next = nextOccurrence(rule, due);
  for (let i = 0; next && next <= today && i < 3660; i++) next = nextOccurrence(rule, next);
  return next;
}

export function describeRecurrence(rule: RecurrenceRule): string {
  const every = rule.interval === 1 ? "" : `${rule.interval} `;
  const unit = { daily: "day", weekly: "week", monthly: "month", yearly: "year" }[rule.freq];
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let text = rule.interval === 1 ? `Every ${unit}` : `Every ${every}${unit}s`;
  if (rule.freq === "weekly" && rule.weekdays?.length) {
    text += ` on ${[...rule.weekdays].sort((a, b) => a - b).map((d) => names[d]).join(", ")}`;
  }
  if (rule.until) text += ` until ${rule.until}`;
  return text;
}
