import { describe, expect, it } from "vitest";
import { safeNext } from "../url";

describe("safeNext", () => {
  it("allows relative paths", () => {
    expect(safeNext("/tasks?x=1")).toBe("/tasks?x=1");
  });
  it("blocks open redirects", () => {
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "", null, undefined, "/a\nb"]) {
      expect(safeNext(bad as string | null)).toBe("/dashboard");
    }
  });
});
