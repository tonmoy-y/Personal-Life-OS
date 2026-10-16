import { describe, expect, it } from "vitest";
import { describeRecurrence, isRecurrenceRule, nextOccurrence, nextOccurrenceAfterCompletion } from "../recurrence";

describe("nextOccurrence", () => {
  it("daily with interval", () => {
    expect(nextOccurrence({ freq: "daily", interval: 1 }, "2026-03-10")).toBe("2026-03-11");
    expect(nextOccurrence({ freq: "daily", interval: 3 }, "2026-02-27")).toBe("2026-03-02");
  });

  it("weekly without weekdays repeats the same weekday", () => {
    expect(nextOccurrence({ freq: "weekly", interval: 1 }, "2026-03-10")).toBe("2026-03-17");
    expect(nextOccurrence({ freq: "weekly", interval: 2 }, "2026-03-10")).toBe("2026-03-24");
  });

  it("weekly with weekdays picks the next selected day", () => {
    const rule = { freq: "weekly" as const, interval: 1, weekdays: [1, 3, 5] }; // Mon Wed Fri
    expect(nextOccurrence(rule, "2026-03-09")).toBe("2026-03-11"); // Mon → Wed
    expect(nextOccurrence(rule, "2026-03-11")).toBe("2026-03-13"); // Wed → Fri
    expect(nextOccurrence(rule, "2026-03-13")).toBe("2026-03-16"); // Fri → Mon
  });

  it("biweekly weekdays skip the off week", () => {
    const rule = { freq: "weekly" as const, interval: 2, weekdays: [1, 3] };
    expect(nextOccurrence(rule, "2026-03-09")).toBe("2026-03-11"); // same week
    expect(nextOccurrence(rule, "2026-03-11")).toBe("2026-03-23"); // skip a week
  });

  it("monthly clamps to month end but keeps the anchor day", () => {
    const r = { freq: "monthly" as const, interval: 1, anchorDay: 31 };
    expect(nextOccurrence(r, "2026-01-31")).toBe("2026-02-28");
    expect(nextOccurrence(r, "2026-02-28")).toBe("2026-03-31");
    expect(nextOccurrence({ freq: "monthly", interval: 1 }, "2024-01-29")).toBe("2024-02-29");
  });

  it("yearly handles leap days", () => {
    expect(nextOccurrence({ freq: "yearly", interval: 1, anchorDay: 29 }, "2024-02-29")).toBe("2025-02-28");
    expect(nextOccurrence({ freq: "yearly", interval: 1 }, "2026-06-15")).toBe("2027-06-15");
  });

  it("ends the series after `until`", () => {
    const r = { freq: "daily" as const, interval: 1, until: "2026-03-11" };
    expect(nextOccurrence(r, "2026-03-10")).toBe("2026-03-11");
    expect(nextOccurrence(r, "2026-03-11")).toBeNull();
  });

  it("is deterministic (no duplicate generation from repeated evaluation)", () => {
    const r = { freq: "weekly" as const, interval: 1, weekdays: [2, 4] };
    expect(nextOccurrence(r, "2026-03-10")).toBe(nextOccurrence(r, "2026-03-10"));
  });
});

describe("nextOccurrenceAfterCompletion", () => {
  it("skips missed occurrences when completed late", () => {
    expect(nextOccurrenceAfterCompletion({ freq: "daily", interval: 1 }, "2026-03-05", "2026-03-10")).toBe("2026-03-11");
  });
  it("uses the normal next date when completed on time", () => {
    expect(nextOccurrenceAfterCompletion({ freq: "daily", interval: 1 }, "2026-03-10", "2026-03-10")).toBe("2026-03-11");
    expect(nextOccurrenceAfterCompletion({ freq: "weekly", interval: 1 }, "2026-03-10", "2026-03-10")).toBe("2026-03-17");
  });
  it("returns null when the series is over", () => {
    expect(nextOccurrenceAfterCompletion({ freq: "daily", interval: 1, until: "2026-03-10" }, "2026-03-10", "2026-03-10")).toBeNull();
  });
});

describe("rule validation / description", () => {
  it("validates rules", () => {
    expect(isRecurrenceRule({ freq: "daily", interval: 1 })).toBe(true);
    expect(isRecurrenceRule({ freq: "hourly", interval: 1 })).toBe(false);
    expect(isRecurrenceRule({ freq: "daily", interval: 0 })).toBe(false);
    expect(isRecurrenceRule({ freq: "weekly", interval: 1, weekdays: [9] })).toBe(false);
    expect(isRecurrenceRule({ freq: "daily", interval: 1, until: "2026-02-30" })).toBe(false);
    expect(isRecurrenceRule(null)).toBe(false);
  });
  it("describes rules", () => {
    expect(describeRecurrence({ freq: "weekly", interval: 1, weekdays: [5, 1] })).toBe("Every week on Mon, Fri");
    expect(describeRecurrence({ freq: "daily", interval: 3 })).toBe("Every 3 days");
  });
});
