import { describe, expect, it } from "vitest";
import { likePattern, tagClause } from "@/lib/like";

describe("likePattern (PostgREST filter-injection guard)", () => {
  it("wraps plain text in wildcards", () => expect(likePattern("milk")).toBe("%milk%"));
  it("strips characters that could break out of an or() filter", () => {
    const p = likePattern('x",user_id.neq.0,title.ilike."%');
    expect(p).not.toMatch(/[",()]/);
    expect(p.startsWith("%") && p.endsWith("%")).toBe(true);
  });
  it("removes wildcards and backslashes supplied by the user", () => expect(likePattern("a%b_c\\d*")).toBe("%a b c d%"));
});

describe("tagClause", () => {
  it("adds an exact lower-cased tag match", () => expect(tagClause(" Taka ")).toBe(",tags.cs.{taka}"));
  it("keeps non-latin letters such as Bangla", () => expect(tagClause("টাকা")).toBe(",tags.cs.{টাকা}"));
  it("drops characters that could break the filter", () => expect(tagClause('a},user_id.eq.1,{"b')).toBe(",tags.cs.{auser_ideq1b}"));
  it("is empty when nothing usable remains", () => expect(tagClause(" ,(){} ")).toBe(""));
});
