import { addDays, eachDay, startOfWeek, type LocalDate } from "./dates";

export const RANGES = [7, 30, 90, 365] as const;
export type RangeDays = (typeof RANGES)[number];

/** Inclusive period ending today: `days` calendar days in the user's timezone. */
export function periodFor(today: LocalDate, days: number): { from: LocalDate; to: LocalDate } {
  return { from: addDays(today, -(days - 1)), to: today };
}

/** The equally long period immediately before `period` (for "vs previous" comparisons). */
export function previousPeriod(period: { from: LocalDate; to: LocalDate }, days: number) {
  return { from: addDays(period.from, -days), to: addDays(period.from, -1) };
}

export interface Bucket { key: string; label: string; from: LocalDate; to: LocalDate }

/** Day buckets for short periods, week buckets for long ones, always clipped to [from, to]. */
export function makeBuckets(from: LocalDate, to: LocalDate, weekStart: number): Bucket[] {
  const days = eachDay(from, to);
  if (days.length <= 31) return days.map((d) => ({ key: d, label: d.slice(5), from: d, to: d }));
  const out: Bucket[] = [];
  for (let s = startOfWeek(from, weekStart); s <= to; s = addDays(s, 7)) {
    const bf = s < from ? from : s;
    const bt = addDays(s, 6) > to ? to : addDays(s, 6);
    out.push({ key: s, label: bf.slice(5), from: bf, to: bt });
  }
  return out;
}

export function bucketIndex(buckets: readonly Bucket[], date: LocalDate): number {
  return buckets.findIndex((b) => date >= b.from && date <= b.to);
}

/** Counts (or sums) per bucket. */
export function sumByBucket(buckets: readonly Bucket[], items: readonly { date: LocalDate; value?: number }[]): number[] {
  const totals = buckets.map(() => 0);
  for (const it of items) {
    const i = bucketIndex(buckets, it.date);
    if (i >= 0) totals[i] += it.value ?? 1;
  }
  return totals;
}

/** Percent change of `current` vs `previous`; null when there is no baseline. */
export function pctChange(current: number, previous: number): number | null {
  return previous === 0 ? null : Math.round(((current - previous) / previous) * 100);
}
