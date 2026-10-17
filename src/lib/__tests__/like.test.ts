import { describe, expect, it } from "vitest";
import { likePattern } from "@/lib/like";

describe("likePattern (PostgREST filter-injection guard)", () => {
  it("wraps plain text in wildcards", () => expect(likePattern("milk")).toBe("%milk%"));
  it("strips characters that could break out of an or() filter", () => {
    const p = likePattern('x",user_id.neq.0,title.ilike."%');
    expect(p).not.toMatch(/[",()]/);
    expect(p.startsWith("%") && p.endsWith("%")).toBe(true);
  });
  it("removes wildcards and backslashes supplied by the user", () => expect(likePattern("a%b_c\\d*")).toBe("%a b c d%"));
});
