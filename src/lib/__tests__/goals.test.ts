import { describe, expect, it } from "vitest";
import { goalProgress, goalReached } from "../goals";

describe("goal progress", () => {
  it("computes progress toward an increasing target", () => {
    expect(goalProgress({ start_value: 0, current_value: 25, target_value: 100 })).toBe(0.25);
    expect(goalProgress({ start_value: 10, current_value: 30, target_value: 50 })).toBe(0.5);
  });
  it("supports decreasing targets (e.g. weight)", () => {
    expect(goalProgress({ start_value: 90, current_value: 80, target_value: 70 })).toBe(0.5);
    expect(goalReached({ start_value: 90, current_value: 69, target_value: 70 })).toBe(true);
    expect(goalReached({ start_value: 90, current_value: 75, target_value: 70 })).toBe(false);
  });
  it("clamps to 0–1 and handles a zero span", () => {
    expect(goalProgress({ start_value: 0, current_value: 150, target_value: 100 })).toBe(1);
    expect(goalProgress({ start_value: 0, current_value: -5, target_value: 100 })).toBe(0);
    expect(goalProgress({ start_value: 5, current_value: 5, target_value: 5 })).toBe(0);
  });
});
