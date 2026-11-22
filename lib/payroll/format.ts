const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatAmount(value: number): string {
  const normalized =
    Number.isFinite(value) && Math.abs(value) >= 0.005 ? value : 0;
  return amountFormatter.format(normalized);
}

export function formatMoney(value: number): string {
  return `${formatAmount(value)} DA`;
}

/** Prefixes a non-zero amount, but never renders a misleading "-0.00". */
export function formatSignedAmount(
  value: number,
  sign: "+" | "-",
): string {
  const absolute = Math.abs(value);
  if (!Number.isFinite(absolute) || absolute < 0.005) {
    return formatAmount(0);
  }
  return `${sign}${formatAmount(absolute)}`;
}

export function formatSignedMoney(
  value: number,
  sign: "+" | "-",
): string {
  return `${formatSignedAmount(value, sign)} DA`;
}

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

export function formatPercent(rate: number): string {
  const percent = rate * 100;
  return `${Number.isInteger(percent) ? percent : percent.toFixed(2)}%`;
}

export function formatBandLabel(
  band: { from: number; to: number | null },
  separator = " – ",
): string {
  if (band.to === null) return "above 320,000";
  if (band.from === 0) return "up to 20,000";
  return `${formatInteger(band.from + 1)}${separator}${formatInteger(band.to)}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function pluralize(
  count: number,
  singular: string,
  plural: string,
): string {
  return count === 1 ? singular : plural;
}
