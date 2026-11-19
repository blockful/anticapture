const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const formatMonthLabel = (unixSeconds: number): string => {
  const d = new Date(unixSeconds * 1000);
  return `${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export const formatQuarterLabel = (unixSeconds: number): string => {
  const d = new Date(unixSeconds * 1000);
  const quarter = Math.floor(d.getUTCMonth() / 3) + 1;
  const year = String(d.getUTCFullYear()).slice(-2);
  return `Q${quarter} '${year}`;
};

export const formatYearLabel = (unixSeconds: number): string => {
  const d = new Date(unixSeconds * 1000);
  return String(d.getUTCFullYear());
};

type ScaleTier = {
  size: number;
  suffix: string;
  decimals: number;
  /** Trims insignificant trailing zeros from the fixed-point text. */
  trim: RegExp;
};

/**
 * Formats `abs` in the largest tier it reaches, moving up one tier when
 * rounding would print 1000 of the current one (999,950 is "1M", not "1000K").
 */
const scaleToTier = (abs: number, tiers: ScaleTier[]): string => {
  let index = tiers.length - 1;
  while (index > 0 && abs < tiers[index].size) index--;
  for (;;) {
    const tier = tiers[index];
    const text = (abs / tier.size).toFixed(tier.decimals);
    if (Number(text) < 1000 || index === tiers.length - 1) {
      return `${text.replace(tier.trim, "")}${tier.suffix}`;
    }
    index++;
  }
};

/** "-" only when the rounded magnitude is non-zero, so -0.2 never prints "-$0". */
const signOf = (value: number, scaled: string): string =>
  value < 0 && /[1-9]/.test(scaled) ? "-" : "";

const TRIM_ONE_DECIMAL = /\.0$/;
const TRIM_TWO_DECIMALS = /\.?0+$/;

const USD_TIERS: ScaleTier[] = [
  { size: 1, suffix: "", decimals: 0, trim: TRIM_ONE_DECIMAL },
  { size: 1_000, suffix: "K", decimals: 1, trim: TRIM_ONE_DECIMAL },
  { size: 1_000_000, suffix: "M", decimals: 1, trim: TRIM_ONE_DECIMAL },
  { size: 1_000_000_000, suffix: "B", decimals: 1, trim: TRIM_ONE_DECIMAL },
];

const COMPACT_TIERS: ScaleTier[] = [
  { size: 1_000, suffix: "K", decimals: 1, trim: TRIM_ONE_DECIMAL },
  { size: 1_000_000, suffix: "M", decimals: 2, trim: TRIM_TWO_DECIMALS },
  { size: 1_000_000_000, suffix: "B", decimals: 2, trim: TRIM_TWO_DECIMALS },
];

const MILLIONS_TIERS: ScaleTier[] = [
  { size: 1, suffix: "", decimals: 0, trim: TRIM_ONE_DECIMAL },
  { size: 1_000, suffix: "K", decimals: 0, trim: TRIM_ONE_DECIMAL },
  { size: 1_000_000, suffix: "M", decimals: 1, trim: TRIM_ONE_DECIMAL },
  { size: 1_000_000_000, suffix: "B", decimals: 1, trim: TRIM_ONE_DECIMAL },
];

export const formatUsd = (value: number): string => {
  const scaled = scaleToTier(Math.abs(value), USD_TIERS);
  return `${signOf(value, scaled)}$${scaled}`;
};

export const formatCompact = (value: number): string => {
  if (value === 0) return "0";
  const abs = Math.abs(value);
  // Counts below 1K print as-is.
  if (abs < 1_000) return String(value);
  const scaled = scaleToTier(abs, COMPACT_TIERS);
  return `${signOf(value, scaled)}${scaled}`;
};

export const formatMillions = (value: number): string => {
  if (value === 0) return "$0";
  const scaled = scaleToTier(Math.abs(value), MILLIONS_TIERS);
  return `${signOf(value, scaled)}$${scaled}`;
};

/**
 * Inclusive range of calendar months, both given as month-start timestamps:
 * "Jun to Aug 2026", "Sep 2025 to Aug 2026", or "Aug 2026" for a single month.
 */
export const formatMonthRange = (
  firstMonthStart: number,
  lastMonthStart: number,
): string => {
  if (firstMonthStart === lastMonthStart) {
    return formatMonthLabel(lastMonthStart);
  }
  const first = new Date(firstMonthStart * 1000);
  const last = new Date(lastMonthStart * 1000);
  const firstText =
    first.getUTCFullYear() === last.getUTCFullYear()
      ? MONTH_ABBR[first.getUTCMonth()]
      : formatMonthLabel(firstMonthStart);
  return `${firstText} to ${formatMonthLabel(lastMonthStart)}`;
};

/** "Sep 23, 2026" (UTC). */
export const formatUtcDate = (date: Date): string =>
  `${MONTH_ABBR[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;

/** "Sep 23, 2026, 00:09 UTC". */
export const formatUtcDateTime = (date: Date): string => {
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${formatUtcDate(date)}, ${hours}:${minutes} UTC`;
};

/**
 * The end of a period that runs to the data cutoff: its date when the API
 * reported it, else the latest month of data ("the latest data (Sep 2026)").
 */
export const formatCutoffEnd = (cutoff: Date, cutoffKnown: boolean): string =>
  cutoffKnown
    ? formatUtcDate(cutoff)
    : `the latest data (${MONTH_ABBR[cutoff.getUTCMonth()]} ${cutoff.getUTCFullYear()})`;
