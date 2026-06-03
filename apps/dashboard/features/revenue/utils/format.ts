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

export const formatUsd = (value: number): string => {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return `${sign}$${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (abs >= 1_000_000)
    return `${sign}$${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000)
    return `${sign}$${(abs / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${sign}$${value.toFixed(0)}`;
};

export const formatCompact = (value: number): string => {
  if (value === 0) return "0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000)
    return `${sign}${(abs / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (abs >= 1_000)
    return `${sign}${(abs / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(value);
};

export const formatMillions = (value: number): string => {
  if (value === 0) return "$0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000)
    return `${sign}$${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
};
