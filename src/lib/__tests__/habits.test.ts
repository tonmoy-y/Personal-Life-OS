import { describe, expect, it } from "vitest";
import { bestStreak, completionRate, currentStreak, isScheduled, scheduledCount } from "../habits";

const daily = { schedule_days: [0, 1, 2, 3, 4, 5, 6], start_date: "2026-03-01" };
const weekdays = { schedule_days: [1, 2, 3, 4, 5], start_date: "2026-03-01" }; // Mon–Fri

describe("habit streaks", () => {
  it("counts consecutive completed days", () => {
    const done = new Set(["2026-03-08", "2026-03-09", "2026-03-10"]);
    expect(currentStreak(daily, done, "2026-03-10")).toBe(3);
  });

  it("does not break the streak when today is still pending", () => {
    const done = new Set(["2026-03-08", "2026-03-09"]);
    expect(currentStreak(daily, done, "2026-03-10")).toBe(2);
  });

  it("breaks on a missed scheduled day", () => {
    const done = new Set(["2026-03-07", "2026-03-09", "2026-03-10"]);
    expect(currentStreak(daily, done, "2026-03-10")).toBe(2);
  });

  it("skips unscheduled days (weekend) without breaking", () => {
    // 2026-03-06 Fri, 03-07 Sat, 03-08 Sun, 03-09 Mon
    const done = new Set(["2026-03-05", "2026-03-06", "2026-03-09"]);
    expect(currentStreak(weekdays, done, "2026-03-09")).toBe(3);
    expect(currentStreak(weekdays, done, "2026-03-08")).toBe(2); // Sunday: last scheduled day was Fri
  });

  it("ignores completions on unscheduled days", () => {
    const done = new Set(["2026-03-06", "2026-03-07"]); // Sat bonus
    expect(currentStreak(weekdays, done, "2026-03-07")).toBe(1);
  });

  it("is zero before the start date and for no completions", () => {
    expect(currentStreak(daily, new Set(), "2026-03-10")).toBe(0);
    expect(currentStreak(daily, new Set(["2026-02-20"]), "2026-02-25")).toBe(0);
  });

  it("computes best streak across history", () => {
    const done = new Set(["2026-03-01", "2026-03-02", "2026-03-03", "2026-03-05", "2026-03-06"]);
    expect(bestStreak(daily, done, "2026-03-10")).toBe(3);
  });

  it("is scheduled only on selected weekdays after start", () => {
    expect(isScheduled(weekdays, "2026-03-07")).toBe(false); // Sat
    expect(isScheduled(weekdays, "2026-03-09")).toBe(true);
    expect(isScheduled(weekdays, "2026-02-27")).toBe(false); // before start
  });
});

describe("completion rate", () => {
  it("counts only scheduled days", () => {
    const done = new Set(["2026-03-02", "2026-03-03"]);
    // Mon 03-02 … Sun 03-08: 5 scheduled, 2 done
    expect(completionRate(weekdays, done, "2026-03-02", "2026-03-08")).toBeCloseTo(0.4);
    expect(scheduledCount(weekdays, "2026-03-02", "2026-03-08")).toBe(5);
  });
  it("clips to start date and returns null if nothing scheduled", () => {
    expect(completionRate(daily, new Set(), "2026-02-01", "2026-02-10")).toBeNull();
    expect(completionRate(daily, new Set(["2026-03-01"]), "2026-02-20", "2026-03-01")).toBe(1);
  });
});
