import { describe, expect, it } from "vitest";
import {
  addDays, addMonths, diffDays, eachDay, isLocalDate, isOverdue, isValidTimeZone, localToUtc,
  monthEnd, monthStart, nowTimeIn, startOfWeek, todayIn, utcToLocal, weekdayOf,
} from "../dates";

describe("dates", () => {
  it("todayIn respects timezone across the date line", () => {
    const instant = new Date("2026-03-10T20:30:00Z");
    expect(todayIn("UTC", instant)).toBe("2026-03-10");
    expect(todayIn("Asia/Dhaka", instant)).toBe("2026-03-11"); // UTC+6 → 02:30 next day
    expect(todayIn("America/Los_Angeles", instant)).toBe("2026-03-10");
    expect(nowTimeIn("Asia/Dhaka", instant)).toBe("02:30");
  });

  it("validates dates and timezones", () => {
    expect(isLocalDate("2024-02-29")).toBe(true);
    expect(isLocalDate("2025-02-29")).toBe(false);
    expect(isLocalDate("2025-13-01")).toBe(false);
    expect(isLocalDate("2025-1-1")).toBe(false);
    expect(isValidTimeZone("Asia/Dhaka")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });

  it("does calendar arithmetic independent of DST", () => {
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09"); // US DST change day
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(diffDays("2026-03-10", "2026-03-01")).toBe(9);
    expect(weekdayOf("2026-03-10")).toBe(2); // Tuesday
    expect(eachDay("2026-02-27", "2026-03-02")).toEqual(["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]);
  });

  it("clamps months and finds week/month boundaries", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
    expect(addMonths("2026-02-28", 1, 31)).toBe("2026-03-31");
    expect(addMonths("2026-11-15", 3)).toBe("2027-02-15");
    expect(monthStart("2026-03-17")).toBe("2026-03-01");
    expect(monthEnd("2026-02-10")).toBe("2026-02-28");
    expect(startOfWeek("2026-03-10", 1)).toBe("2026-03-09"); // Monday
    expect(startOfWeek("2026-03-10", 0)).toBe("2026-03-08"); // Sunday
    expect(startOfWeek("2026-03-08", 1)).toBe("2026-03-02");
  });

  it("round-trips local ↔ UTC in a timezone", () => {
    const utc = localToUtc("2026-03-10", "09:00", "Asia/Dhaka");
    expect(utc.toISOString()).toBe("2026-03-10T03:00:00.000Z");
    expect(utcToLocal(utc, "Asia/Dhaka")).toEqual({ date: "2026-03-10", time: "09:00" });
    // DST: New York is UTC-4 in July
    expect(localToUtc("2026-07-01", "12:00", "America/New_York").toISOString()).toBe("2026-07-01T16:00:00.000Z");
  });

  it("detects overdue tasks using the user's local time", () => {
    const now = new Date("2026-03-10T10:00:00Z"); // Dhaka: 16:00 on the 10th
    const tz = "Asia/Dhaka";
    expect(isOverdue({ due_date: "2026-03-09", due_time: null }, tz, now)).toBe(true);
    expect(isOverdue({ due_date: "2026-03-10", due_time: null }, tz, now)).toBe(false);
    expect(isOverdue({ due_date: "2026-03-10", due_time: "15:00:00" }, tz, now)).toBe(true);
    expect(isOverdue({ due_date: "2026-03-10", due_time: "17:00" }, tz, now)).toBe(false);
    expect(isOverdue({ due_date: "2026-03-11", due_time: "01:00" }, tz, now)).toBe(false);
    expect(isOverdue({ due_date: null, due_time: null }, tz, now)).toBe(false);
  });
});
