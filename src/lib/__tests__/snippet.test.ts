import { describe, expect, it } from "vitest";
import { snippet } from "@/lib/snippet";

describe("snippet", () => {
  it("returns null when the term is absent or the text is empty", () => {
    expect(snippet("buy milk", "bread")).toBeNull();
    expect(snippet("", "x")).toBeNull();
    expect(snippet(null, "x")).toBeNull();
  });
  it("matches case-insensitively and collapses whitespace", () => {
    expect(snippet("Call   the\nPlumber about the SINK", "plumber")).toBe("Call the Plumber about the SINK");
  });
  it("trims long text around the match with ellipses", () => {
    const text = `${"a ".repeat(60)}needle${" b".repeat(60)}`;
    const s = snippet(text, "needle", 40)!;
    expect(s).toContain("needle");
    expect(s.length).toBeLessThanOrEqual(42);
    expect(s.startsWith("…") && s.endsWith("…")).toBe(true);
  });
});
