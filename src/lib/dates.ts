/**
 * Date helpers. "Local dates" are plain `YYYY-MM-DD` strings in the user's profile timezone;
 * all calendar arithmetic is done in UTC on those strings, so it is immune to DST and host timezone.
 * Instants (events, timestamps) are real `Date`s / ISO strings in UTC.
 */
import { TZDate } from "@date-fns/tz";

export const DEFAULT_TIMEZONE = "Asia/Dhaka";
export type LocalDate = string; // YYYY-MM-DD

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function isLocalDate(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function isLocalTime(value: string): boolean {
  return TIME_RE.test(value);
}

function parts(date: LocalDate): [number, number, number] {
  const m = DATE_RE.exec(date);
  if (!m) throw new Error(`Invalid local date: ${date}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function toLocalDate(ms: number): LocalDate {
  const d = new Date(ms);
  const y = String(d.getUTCFullYear()).padStart(4, "0");
  return `${y}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function toMs(date: LocalDate): number {
  const [y, m, d] = parts(date);
  return Date.UTC(y, m - 1, d);
}

/** Today's calendar date in `tz`. */
export function todayIn(tz: string, now: Date = new Date()): LocalDate {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Current wall-clock time `HH:mm` in `tz`. */
export function nowTimeIn(tz: string, now: Date = new Date()): string {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return f.format(now);
}

export function addDays(date: LocalDate, n: number): LocalDate {
  return toLocalDate(toMs(date) + n * 86_400_000);
}

export function diffDays(a: LocalDate, b: LocalDate): number {
  return Math.round((toMs(a) - toMs(b)) / 86_400_000);
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(date: LocalDate): number {
  return new Date(toMs(date)).getUTCDay();
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

export function addMonths(date: LocalDate, n: number, anchorDay?: number): LocalDate {
  const [y, m, d] = parts(date);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const day = Math.min(anchorDay ?? d, daysInMonth(ny, nm));
  return toLocalDate(Date.UTC(ny, nm - 1, day));
}

export function monthStart(date: LocalDate): LocalDate {
  const [y, m] = parts(date);
  return toLocalDate(Date.UTC(y, m - 1, 1));
}

export function monthEnd(date: LocalDate): LocalDate {
  const [y, m] = parts(date);
  return toLocalDate(Date.UTC(y, m - 1, daysInMonth(y, m)));
}

/** First day of the week containing `date`, given `weekStart` (0 = Sunday, 1 = Monday …). */
export function startOfWeek(date: LocalDate, weekStart: number): LocalDate {
  const diff = (weekdayOf(date) - weekStart + 7) % 7;
  return addDays(date, -diff);
}

export function eachDay(from: LocalDate, to: LocalDate): LocalDate[] {
  const out: LocalDate[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Convert a local date + wall time in `tz` to a UTC instant. DST gaps resolve forward (date-fns/tz behaviour). */
export function localToUtc(date: LocalDate, time: string, tz: string): Date {
  const [y, m, d] = parts(date);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(new TZDate(y, m - 1, d, hh, mm, 0, tz).getTime());
}

/** Convert a UTC instant to the local date + `HH:mm` wall time in `tz`. */
export function utcToLocal(instant: Date | string, tz: string): { date: LocalDate; time: string } {
  const d = typeof instant === "string" ? new Date(instant) : instant;
  return { date: todayIn(tz, d), time: nowTimeIn(tz, d) };
}

/** Start of the local day as a UTC instant (for range queries on timestamptz columns). */
export function startOfDayUtc(date: LocalDate, tz: string): Date {
  return localToUtc(date, "00:00", tz);
}

/** True if a task due `dueDate`[+`dueTime`] is past due at `now` in `tz`. Date-only tasks are due end of day. */
export function isOverdue(
  due: { due_date: LocalDate | null; due_time: string | null },
  tz: string,
  now: Date = new Date(),
): boolean {
  if (!due.due_date) return false;
  const today = todayIn(tz, now);
  if (due.due_date < today) return true;
  if (due.due_date > today) return false;
  return due.due_time ? due.due_time.slice(0, 5) < nowTimeIn(tz, now) : false;
}

export function formatLocalDate(date: LocalDate, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts }).format(new Date(toMs(date)));
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function greetingFor(tz: string, now: Date = new Date()): string {
  const hour = Number(nowTimeIn(tz, now).slice(0, 2));
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}
