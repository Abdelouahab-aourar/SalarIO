import Decimal from "decimal.js";

/**
 * Decimal-safe money helpers. Amounts are persisted as integer minor units
 * (centimes: 1 DA = 100). The payroll engine (lib/payroll/salary.ts, ported
 * verbatim from the validated salary-calculator) computes in DA with round2;
 * these helpers convert losslessly at the persistence boundary so financial
 * totals never accumulate binary floating-point error.
 */
export const CENTIMES_PER_DA = 100;

export function toCents(da: number | string | Decimal): number {
  const cents = new Decimal(da).mul(CENTIMES_PER_DA).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  const n = cents.toNumber();
  if (!Number.isSafeInteger(n)) throw new Error("Amount out of safe integer range.");
  return n;
}

export function fromCents(cents: number): number {
  return new Decimal(cents).div(CENTIMES_PER_DA).toNumber();
}

export function addCents(...values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function formatDA(da: number, locale = "fr-DZ"): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(da);
}

export function formatCentsDA(cents: number, locale = "fr-DZ"): string {
  return `${formatDA(fromCents(cents), locale)} DA`;
}
