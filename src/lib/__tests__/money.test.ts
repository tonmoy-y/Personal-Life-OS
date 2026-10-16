import { describe, expect, it } from "vitest";
import { formatMoney, minorExponent, minorToDecimal, parseMoney } from "../money";
import { budgetUsage, categoryBreakdown, inMonth, monthlyTrend, totals, type Txn } from "../finance";
import { toCsv } from "../csv";

describe("money", () => {
  it("parses decimals without float error", () => {
    expect(parseMoney("0.1", "BDT")).toBe(10);
    expect(parseMoney("1,250.50", "BDT")).toBe(125050);
    expect(parseMoney("19.99", "USD")).toBe(1999);
    expect(parseMoney("1.005", "USD")).toBeNull(); // too many decimals, never silently rounded
    expect(parseMoney("100", "JPY")).toBe(100);
    expect(parseMoney("1.5", "JPY")).toBeNull();
    expect(parseMoney("-5", "USD")).toBeNull();
    expect(parseMoney("abc", "USD")).toBeNull();
    expect(parseMoney("", "USD")).toBeNull();
  });
  it("round-trips minor units", () => {
    expect(minorToDecimal(125050, "BDT")).toBe("1250.50");
    expect(minorToDecimal(5, "USD")).toBe("0.05");
    expect(minorToDecimal(100, "JPY")).toBe("100");
    expect(minorExponent("JPY")).toBe(0);
  });
  it("formats currency", () => {
    expect(formatMoney(125050, "USD")).toBe("$1,250.50");
  });
});

const t = (type: Txn["type"], amount_minor: number, occurred_on: string, category: string): Txn => ({ type, amount_minor, occurred_on, category });
const txns = [
  t("income", 500000, "2026-03-01", "Salary"),
  t("expense", 120050, "2026-03-03", "Food"),
  t("expense", 30000, "2026-03-10", "food "),
  t("expense", 80000, "2026-03-12", "Transport"),
  t("expense", 10, "2026-02-28", "Food"),
  t("expense", 999, "2026-01-05", "Food"),
];

describe("finance calculations", () => {
  it("totals are exact integer sums", () => {
    expect(totals([t("expense", 10, "2026-03-01", "a"), t("expense", 20, "2026-03-01", "a")])).toEqual({ income: 0, expense: 30, net: -30 });
    expect(totals(inMonth(txns, "2026-03-15"))).toEqual({ income: 500000, expense: 230050, net: 269950 });
  });
  it("breaks down expenses by normalised category", () => {
    expect(categoryBreakdown(inMonth(txns, "2026-03-01"))).toEqual([
      { category: "Food", total: 150050 },
      { category: "Transport", total: 80000 },
    ]);
  });
  it("computes budget usage from actual transactions only (expenses, that month)", () => {
    const usage = budgetUsage(
      [{ category: "Food", limit_minor: 100000 }, { category: "Transport", limit_minor: 200000 }, { category: "Fun", limit_minor: 5000 }],
      inMonth(txns, "2026-03-01"),
    );
    expect(usage[0]).toMatchObject({ spent: 150050, remaining: -50050, over: true });
    expect(usage[0].pct).toBeCloseTo(1.5005);
    expect(usage[1]).toMatchObject({ spent: 80000, over: false, remaining: 120000 });
    expect(usage[2]).toMatchObject({ spent: 0, over: false, pct: 0 });
  });
  it("builds a month-to-month trend including empty months", () => {
    const trend = monthlyTrend(txns, "2026-03-20", 4);
    expect(trend.map((m) => m.month)).toEqual(["2025-12", "2026-01", "2026-02", "2026-03"]);
    expect(trend.map((m) => m.expense)).toEqual([0, 999, 10, 230050]);
  });
});

describe("csv", () => {
  it("escapes quotes/commas and neutralises formulas", () => {
    const csv = toCsv([{ a: 'He said "hi", ok', b: "=HYPERLINK(1)", c: 5, d: ["x", "y"], e: null }], ["a", "b", "c", "d", "e"]);
    expect(csv).toBe('a,b,c,d,e\r\n"He said ""hi"", ok",\'=HYPERLINK(1),5,x; y,\r\n');
  });
});
