import { describe, expect, it } from "vitest";
import { makeBuckets, pctChange, periodFor, previousPeriod, sumByBucket } from "../analytics";

describe("analytics helpers", () => {
  it("defines inclusive periods ending today and the preceding period", () => {
    const p = periodFor("2026-03-10", 7);
    expect(p).toEqual({ from: "2026-03-04", to: "2026-03-10" });
    expect(previousPeriod(p, 7)).toEqual({ from: "2026-02-25", to: "2026-03-03" });
  });
  it("uses daily buckets for short periods and clipped weekly buckets for long ones", () => {
    expect(makeBuckets("2026-03-04", "2026-03-10", 1)).toHaveLength(7);
    const weekly = makeBuckets("2026-01-01", "2026-03-10", 1);
    expect(weekly[0].from).toBe("2026-01-01"); // clipped, Thu
    expect(weekly[0].to).toBe("2026-01-04"); // week ends Sunday
    expect(weekly.at(-1)?.to).toBe("2026-03-10");
  });
  it("sums values into buckets and ignores out-of-range dates", () => {
    const b = makeBuckets("2026-03-08", "2026-03-10", 1);
    expect(sumByBucket(b, [{ date: "2026-03-08" }, { date: "2026-03-08" }, { date: "2026-03-10", value: 5 }, { date: "2026-03-01" }])).toEqual([2, 0, 5]);
  });
  it("computes percent change with no divide-by-zero", () => {
    expect(pctChange(150, 100)).toBe(50);
    expect(pctChange(50, 100)).toBe(-50);
    expect(pctChange(5, 0)).toBeNull();
  });
});
