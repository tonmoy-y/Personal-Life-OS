/**
 * Decimal-safe money. Amounts are integers in the currency's minor unit (e.g. paisa for BDT);
 * parsing and formatting never go through floating point.
 */
export const MAX_MINOR = 999_999_999_999_999;

export function minorExponent(currency: string): number {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/** Parse a user-entered decimal string ("1,250.50") to integer minor units. Returns null if invalid. */
export function parseMoney(input: string, currency: string): number | null {
  const exp = minorExponent(currency);
  const cleaned = input.trim().replace(/[,\s]/g, "");
  const m = /^(\d{1,15})(?:\.(\d+))?$/.exec(cleaned);
  if (!m) return null;
  const frac = m[2] ?? "";
  if (frac.length > exp) return null;
  const minor = Number(m[1] + frac.padEnd(exp, "0"));
  if (!Number.isSafeInteger(minor) || minor > MAX_MINOR) return null;
  return minor;
}

/** Plain decimal string for form inputs ("1250.50"). */
export function minorToDecimal(minor: number, currency: string): string {
  const exp = minorExponent(currency);
  const sign = minor < 0 ? "-" : "";
  const digits = String(Math.abs(minor)).padStart(exp + 1, "0");
  return exp === 0 ? sign + digits : `${sign}${digits.slice(0, -exp)}.${digits.slice(-exp)}`;
}

export function formatMoney(minor: number, currency: string, opts: { compact?: boolean } = {}): string {
  const exp = minorExponent(currency);
  const value = Number(minorToDecimal(minor, currency)); // display only
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: opts.compact ? 0 : exp,
    maximumFractionDigits: opts.compact ? Math.min(exp, 0) : exp,
    notation: opts.compact && Math.abs(value) >= 100_000 ? "compact" : "standard",
  }).format(value);
}

export const CURRENCIES = ["BDT", "USD", "EUR", "GBP", "INR", "AUD", "CAD", "JPY", "SGD", "AED", "SAR", "MYR"] as const;
